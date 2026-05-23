import os
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from google import genai
from google.genai import types

import models
import schemas
from database import engine, get_db

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


# 1. LLM Analysis API (/api/analyze)
@app.post("/api/analyze", response_model=schemas.AnalyzeResponse, tags=["LLM Analysis"])
def analyze_task(payload: schemas.AnalyzeRequest):
    """
    Analyze unstructured text from Slack, email, etc., to extract task attributes:
    assignee (Who), deadline (When), description (What), and priority.
    Uses 'gemini-2.5-flash' and provides a confidence score for context-based inference.
    """
    global client
    
    # Ensure client is initialized
    if client is None:
        try:
            client = genai.Client()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Google GenAI Client is not configured. Please set GEMINI_API_KEY environment variable. Error: {str(e)}"
            )
            
    # Quick API Key check
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is not configured in the environment variables."
        )

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
    "{payload.text}"
    """



    try:
        # Request structured JSON response adhering to schemas.AnalyzeResponse
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schemas.AnalyzeResponse,
            ),
        )
        
        # Parse the structured response text
        result = schemas.AnalyzeResponse.model_validate_json(response.text)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze message using Gemini: {str(e)}"
        )


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
        status=task.status
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
