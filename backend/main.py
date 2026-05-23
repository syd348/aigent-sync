import os
import re
import urllib.request
import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, status, Request, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from google import genai
from google.genai import types

import database  # noqa: F401 — load backend/.env before reading Slack env vars

import models
import schemas
import auth_sessions
import slack_oauth
from database import engine, get_db
from http_utils import urlopen as https_urlopen

# Initialize database tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Automated Office Request Organization API",
    description="FastAPI + Google Gemini API based backend for structuring unstructured requests",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize google-genai client
# If GEMINI_API_KEY environment variable is present, it will use it.
# Otherwise, we instantiate and catch errors gracefully during API call.
try:
    client = genai.Client()
except Exception as e:
    # We will log the warning but don't fail startup so it's deployable even without env vars configured initially
    print(f"Warning: Failed to initialize Google GenAI Client: {e}")
    client = None


@app.get("/")
def read_root():
    return {"message": "Welcome to the Automated Office Request Organization API"}


def _analyze_text_with_gemini(text: str) -> schemas.AnalyzeResponse:
    global client
    
    # Ensure client is initialized
    if client is None:
        try:
            client = genai.Client()
        except Exception as e:
            raise RuntimeError(f"Google GenAI Client is not configured. Please set GEMINI_API_KEY environment variable. Error: {str(e)}")
            
    # Quick API Key check
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured in the environment variables.")

    # Provide local current date context for relative date calculations (e.g. "today", "tomorrow", "by next Friday")
    current_time_str = datetime.now().strftime("%Y-%m-%d (%A)")

    prompt = f"""
    You are an AI assistant designed to parse unstructured office communications (such as emails, Slack messages, or chats) into structured task requests.
    
    Given the following input text, extract:
    1. assignee: The person who is requested or assigned to do the work. If the input name is in Korean, keep it in Korean. If not mentioned or unclear, set to null.
    2. deadline: The task deadline date in YYYY-MM-DD format. Resolve relative dates like 'today', 'tomorrow', 'by next Monday' using the Reference Current Date. If no deadline is specified, set to null.
    3. description: A short, clear, and action-oriented summary (noun phrase, under 20 characters) of the action/work to be performed (e.g., "신규 프로젝트 기획안 작성", "서버 인덱스 튜닝"). Do NOT copy the input text message as is, and do NOT write full polite sentences. Summarize it concisely in Korean.
    4. priority: The priority of the task ('Low', 'Medium', or 'High'). Infer this based on urgency, tone, or key words. Default to 'Medium'.
    5. confidence_score: A float between 0.0 and 1.0 representing your confidence in the accuracy of the extracted information. Lower the score if key fields are missing or highly ambiguous.

    IMPORTANT: All text output fields (assignee, description) must be written in Korean.

    Reference Current Date (today): {current_time_str}

    Input Message:
    "{text}"
    """

    max_retries = 2
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=schemas.AnalyzeResponse,
                ),
            )
            return schemas.AnalyzeResponse.model_validate_json(response.text)
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                if attempt < max_retries - 1:
                    print(f"Gemini Rate Limit (429) hit. Retrying in 2 seconds (attempt {attempt + 1}/{max_retries})...")
                    import time
                    time.sleep(2.0)
                    continue
            raise e


def _get_slack_bot_token(db: Optional[Session] = None) -> Optional[str]:
    if db is not None:
        workspace = slack_oauth.get_active_workspace(db)
        if workspace and workspace.bot_access_token:
            return workspace.bot_access_token
    return os.getenv("SLACK_BOT_TOKEN")


def _slack_auth_test(token: str) -> Optional[dict]:
    try:
        req = urllib.request.Request(
            "https://slack.com/api/auth.test",
            headers={"Authorization": f"Bearer {token}"},
        )
        with https_urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
        if data.get("ok"):
            return data
    except Exception as e:
        print(f"Slack auth.test failed: {e}")
    return None


def get_slack_username(user_id: str, db: Optional[Session] = None) -> Optional[str]:
    # Fallback mapping for local testing
    test_users = {
        "U0B5R78G09Y": "박지현",
        "U0B5P5CL6EA": "신서연",
        "U0B5UR2NX60": "최원아",
        "U0B59NT0V0X": "차서현",
    }
    if user_id in test_users:
        return test_users[user_id]

    token = _get_slack_bot_token(db)
    if not token:
        return None
        
    try:
        url = f"https://slack.com/api/users.info?user={user_id}"
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {token}"}
        )
        with https_urlopen(req, timeout=3) as response:
            res_data = json.loads(response.read().decode())
            if res_data.get("ok"):
                user_info = res_data.get("user", {})
                profile = user_info.get("profile", {})
                return profile.get("display_name") or user_info.get("real_name") or user_info.get("name")
    except Exception as e:
        print(f"Error fetching Slack username for {user_id}: {e}")
    return None


def _fallback_parse_text(text: str, resolved_text: str, assignee: Optional[str] = None) -> schemas.AnalyzeResponse:
    from datetime import datetime, timedelta
    # Heuristically estimate deadline
    deadline = None
    today = datetime.now()
    if any(kw in text for kw in ["오늘", "18:00", "오늘까지"]):
        deadline = today.date()
    elif any(kw in text for kw in ["내일", "내일까지"]):
        deadline = (today + timedelta(days=1)).date()
        
    # Heuristically estimate priority
    priority = "Medium"
    if any(kw in text for kw in ["긴급", "High", "급해", "오늘까지", "18:00", "우선", "피그마"]):
        priority = "High"
    elif "낮음" in text or "Low" in text:
        priority = "Low"
        
    # Heuristically extract description (remove user mentions and keep first 18 chars)
    clean_desc = resolved_text
    # Remove mention placeholders like "슬랙유저(U...)" or names like "박지현" at start
    clean_desc = re.sub(r"(슬랙유저\(U[A-Z0-9]+\)|박지현|신서연|최원아|차서현)", "", clean_desc)
    clean_desc = clean_desc.strip(" ,.?!:;~\t\n")
    if len(clean_desc) > 20:
        clean_desc = clean_desc[:17] + "..."
    if not clean_desc:
        clean_desc = "슬랙 연동 태스크"
        
    return schemas.AnalyzeResponse(
        assignee=assignee,
        deadline=deadline,
        description=clean_desc,
        priority=priority,
        confidence_score=0.5
    )


def process_slack_message(text: str):
    """
    Background task to analyze Slack message via Gemini and save to the database.
    """
    from database import SessionLocal
    db = SessionLocal()
    try:
        # Pre-process text to resolve Slack mentions if possible for better Gemini context
        # Find all mentions like <@U0B5R78G09Y>
        mentions = re.findall(r"<@(U[A-Z0-9]+)>", text)
        print(f"DEBUG: Found mentions in text: {mentions}")
        resolved_text = text
        user_mappings = {}
        for uid in mentions:
            name = get_slack_username(uid)
            if not name:
                # Use a Korean placeholder containing the ID so Gemini extracts it successfully
                name = f"슬랙유저({uid})"
            
            resolved_text = resolved_text.replace(f"<@{uid}>", name)
            user_mappings[uid] = name

        # 1. Analyze text using Gemini helper or fallback
        try:
            analysis = _analyze_text_with_gemini(resolved_text)
            assignee_name = analysis.assignee
            # If assignee is still a User ID (e.g. U0B5R78G09Y or <@U...>), resolve it
            if assignee_name:
                match = re.search(r"(U[A-Z0-9]+)", assignee_name)
                if match:
                    uid = match.group(1)
                    resolved_name = get_slack_username(uid) or user_mappings.get(uid)
                    if resolved_name:
                        assignee_name = resolved_name
                elif assignee_name.startswith("<@") and assignee_name.endswith(">"):
                    uid = assignee_name[2:-1]
                    resolved_name = get_slack_username(uid) or user_mappings.get(uid)
                    if resolved_name:
                        assignee_name = resolved_name
        except Exception as gemini_err:
            print(f"Gemini API error (falling back to rule-based parser): {str(gemini_err)}")
            guessed_assignee = None
            if user_mappings:
                guessed_assignee = list(user_mappings.values())[0]
            analysis = _fallback_parse_text(text, resolved_text, guessed_assignee)
            assignee_name = analysis.assignee
        
        # 2. Store extracted task in DB
        db_task = models.Task(
            assignee=assignee_name,
            deadline=analysis.deadline,
            description=analysis.description,
            priority=analysis.priority,
            status="review",
            source="slack"
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        print(f"Auto-ingested Slack Task: {db_task.description} (ID: {db_task.task_id})")
    except Exception as e:
        print(f"Error auto-ingesting Slack message: {str(e)}")
    finally:
        db.close()


# 1. LLM Analysis API (/api/analyze)
@app.post("/api/analyze", response_model=schemas.AnalyzeResponse, tags=["LLM Analysis"])
def analyze_task(payload: schemas.AnalyzeRequest):
    """
    Analyze unstructured text from Slack, email, etc., to extract task attributes:
    assignee (Who), deadline (When), description (What), and priority.
    Uses 'gemini-2.5-flash' and provides a confidence score for context-based inference.
    """
    try:
        return _analyze_text_with_gemini(payload.text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


def _workspace_connection_type(workspace: models.SlackWorkspace) -> str:
    if workspace.installed_by_user_id:
        return "oauth"
    return "bot_token"


def _build_slack_connection_status(db: Session) -> schemas.SlackConnectionStatus:
    oauth_configured = slack_oauth.is_oauth_configured()
    oauth_login_url = slack_oauth.get_oauth_login_url()
    bot_token_env = os.getenv("SLACK_BOT_TOKEN")
    workspace = slack_oauth.get_active_workspace(db)

    if workspace:
        return schemas.SlackConnectionStatus(
            connected=True,
            oauth_configured=oauth_configured,
            bot_token_configured=bool(bot_token_env),
            connection_type=_workspace_connection_type(workspace),
            team_id=workspace.team_id,
            team_name=workspace.team_name,
            oauth_login_url=oauth_login_url,
        )

    return schemas.SlackConnectionStatus(
        connected=False,
        oauth_configured=oauth_configured,
        bot_token_configured=bool(bot_token_env),
        connection_type=None,
        oauth_login_url=oauth_login_url,
    )


def _parse_bearer_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1].strip() or None


def _user_to_response(user: models.User) -> schemas.AuthUserResponse:
    return schemas.AuthUserResponse(
        id=user.id,
        slack_user_id=user.slack_user_id,
        display_name=user.display_name or user.slack_user_id,
        email=user.email,
        avatar_url=user.avatar_url,
        slack_team_id=user.slack_team_id,
        team_name=user.team_name,
    )


@app.get("/api/auth/me", response_model=schemas.AuthUserResponse, tags=["Auth"])
def auth_me(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    token = _parse_bearer_token(authorization)
    user = auth_sessions.get_user_for_token(db, token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return _user_to_response(user)


@app.post("/api/auth/logout", tags=["Auth"])
def auth_logout(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    token = _parse_bearer_token(authorization)
    auth_sessions.revoke_token(db, token)
    return {"ok": True}


@app.get("/api/slack/status", response_model=schemas.SlackConnectionStatus, tags=["Slack Integration"])
def slack_connection_status(db: Session = Depends(get_db)):
    """Return whether the user has completed Slack install (OAuth or explicit connect)."""
    return _build_slack_connection_status(db)


@app.get("/api/slack/oauth/login", tags=["Slack Integration"])
def slack_oauth_login(db: Session = Depends(get_db)):
    """Redirect the browser to Slack's OAuth consent screen."""
    if not slack_oauth.is_oauth_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Slack OAuth is not configured. Set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET.",
        )
    state = slack_oauth.create_oauth_state(db)
    return RedirectResponse(slack_oauth.build_authorize_url(state), status_code=302)


@app.get("/api/slack/oauth/callback", tags=["Slack Integration"])
def slack_oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """OAuth redirect target registered in the Slack app settings."""
    if error:
        return RedirectResponse(slack_oauth.get_error_redirect_url(error), status_code=302)
    if not code or not slack_oauth.validate_oauth_state(db, state):
        return RedirectResponse(
            slack_oauth.get_error_redirect_url("invalid_state"),
            status_code=302,
        )
    try:
        oauth_response = slack_oauth.exchange_code_for_token(code)
        workspace = slack_oauth.upsert_workspace(db, oauth_response)

        authed_user = oauth_response.get("authed_user") or {}
        slack_user_id = authed_user.get("id")
        if not slack_user_id:
            return RedirectResponse(
                slack_oauth.get_error_redirect_url("missing_slack_user"),
                status_code=302,
            )

        profile = auth_sessions.fetch_slack_user_profile(
            slack_user_id,
            workspace.bot_access_token,
        )
        user = auth_sessions.upsert_user(
            db,
            slack_user_id=slack_user_id,
            slack_team_id=workspace.team_id,
            team_name=workspace.team_name,
            profile=profile,
            slack_user_token=authed_user.get("access_token"),
        )
        session_token = auth_sessions.create_login_session(db, user.id)
        return RedirectResponse(
            slack_oauth.get_success_redirect_url_with_session(session_token),
            status_code=302,
        )
    except ValueError as exc:
        return RedirectResponse(slack_oauth.get_error_redirect_url(str(exc)), status_code=302)
    except Exception as exc:
        print(f"Slack OAuth callback error: {exc}")
        return RedirectResponse(
            slack_oauth.get_error_redirect_url("oauth_callback_failed"),
            status_code=302,
        )


@app.delete("/api/slack/connection", tags=["Slack Integration"])
def disconnect_slack(db: Session = Depends(get_db)):
    """Deactivate OAuth-installed workspaces (env SLACK_BOT_TOKEN is unchanged)."""
    db.query(models.SlackWorkspace).update({"is_active": False})
    db.commit()
    return {"ok": True}


# Slack Events API Webhook (/api/slack/events)
@app.post("/api/slack/events", tags=["Slack Integration"])
async def slack_events(request: Request, background_tasks: BackgroundTasks):
    """
    Slack Events API Webhook handler.
    Handles URL Verification handshake and processes message events.
    """
    payload = await request.json()
    
    # 1. URL Verification challenge handler (for initial Slack webhook registration)
    if payload.get("type") == "url_verification":
        return {"challenge": payload.get("challenge")}
        
    # 2. Event callbacks (e.g., messages posted in channels)
    if payload.get("type") == "event_callback":
        event = payload.get("event", {})
        
        # Avoid bot loop: only process normal user messages
        is_normal_message = (
            event.get("type") == "message" 
            and not event.get("bot_id") 
            and not event.get("subtype")
        )
        if is_normal_message:
            sender_id = event.get("user")
            print(f"DEBUG: Slack message from user ID: {sender_id}")
            text = event.get("text")
            if text:
                # Add task to background to respond to Slack immediately (within 3 seconds limit)
                background_tasks.add_task(process_slack_message, text)
                
    return {"status": "ok"}


# 2. Database Schema & CRUD (/api/tasks)
@app.post("/api/tasks", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED, tags=["Tasks"])
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    """
    Create a new task in the database.
    """
    db_task = models.Task(
        assignee=task.assignee,
        deadline=task.deadline,
        description=task.description,
        priority=task.priority,
        status=task.status,
        source=task.source or "manual"
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@app.get("/api/tasks", response_model=List[schemas.TaskResponse], tags=["Tasks"])
def list_tasks(
    status_filter: Optional[str] = None,
    assignee_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve all tasks from the database sorted by priority (High -> Medium -> Low).
    Optional query parameters: status_filter, assignee_filter
    """
    from sqlalchemy import case

    query = db.query(models.Task)
    
    if status_filter:
        query = query.filter(models.Task.status == status_filter)
        
    if assignee_filter:
        query = query.filter(models.Task.assignee.ilike(f"%{assignee_filter}%"))
        
    # Sort order: High (1) -> Medium (2) -> Low (3) -> Other/None (4)
    priority_order = case(
        (models.Task.priority == "High", 1),
        (models.Task.priority == "Medium", 2),
        (models.Task.priority == "Low", 3),
        else_=4
    )
    
    return query.order_by(priority_order.asc(), models.Task.task_id.desc()).all()



@app.get("/api/tasks/{task_id}", response_model=schemas.TaskResponse, tags=["Tasks"])
def get_task(task_id: int, db: Session = Depends(get_db)):
    """
    Retrieve details of a specific task.
    """
    db_task = db.query(models.Task).filter(models.Task.task_id == task_id).first()
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found."
        )
    return db_task


@app.put("/api/tasks/{task_id}", response_model=schemas.TaskResponse, tags=["Tasks"])
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db)):
    """
    Update attributes of an existing task.
    """
    db_task = db.query(models.Task).filter(models.Task.task_id == task_id).first()
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found."
        )
    
    # Exclude unset fields so only provided fields are updated
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Tasks"])
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """
    Delete a task from the database.
    """
    db_task = db.query(models.Task).filter(models.Task.task_id == task_id).first()
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found."
        )
    db.delete(db_task)
    db.commit()
    return None
