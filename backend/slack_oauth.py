import json
import os
import secrets
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session

import models
from http_utils import urlopen as https_urlopen

SLACK_AUTHORIZE_URL = "https://slack.com/oauth/v2/authorize"
SLACK_OAUTH_ACCESS_URL = "https://slack.com/api/oauth.v2.access"
DEFAULT_BOT_SCOPES = (
    "channels:history,channels:read,groups:history,im:history,"
    "mpim:history,users:read"
)
DEFAULT_USER_SCOPES = "identity.basic,identity.email,identity.avatar"
STATE_TTL_MINUTES = 10


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"{name} is not configured")
    return value


def get_redirect_uri() -> str:
    return os.getenv(
        "SLACK_REDIRECT_URI",
        "http://127.0.0.1:8000/api/slack/oauth/callback",
    )


def get_success_redirect_url() -> str:
    return os.getenv(
        "SLACK_OAUTH_SUCCESS_URL",
        "http://localhost:3000/dashboard?slack=connected",
    )


def get_success_redirect_url_with_session(session_token: str) -> str:
    base = get_success_redirect_url()
    query = urllib.parse.urlencode({"session": session_token})
    separator = "&" if "?" in base else "?"
    return f"{base}{separator}{query}"


def get_error_redirect_url(message: str) -> str:
    base = os.getenv(
        "SLACK_OAUTH_ERROR_URL",
        "http://localhost:3000/?slack=error",
    )
    query = urllib.parse.urlencode({"message": message})
    separator = "&" if "?" in base else "?"
    return f"{base}{separator}{query}"


def get_bot_scopes() -> str:
    return os.getenv("SLACK_BOT_SCOPES", DEFAULT_BOT_SCOPES)


def get_user_scopes() -> str:
    return os.getenv("SLACK_USER_SCOPES", DEFAULT_USER_SCOPES)


def is_oauth_configured() -> bool:
    client_id = (os.getenv("SLACK_CLIENT_ID") or "").strip()
    client_secret = (os.getenv("SLACK_CLIENT_SECRET") or "").strip()
    if not client_id or not client_secret:
        return False
    placeholders = ("your_slack_client_id", "your_slack_client_secret")
    if client_id in placeholders or client_secret in placeholders:
        return False
    return True


def get_oauth_login_url() -> Optional[str]:
    if not is_oauth_configured():
        return None
    base = os.getenv("BACKEND_PUBLIC_URL", "http://127.0.0.1:8000").rstrip("/")
    return f"{base}/api/slack/oauth/login"


def create_oauth_state(db: Session) -> str:
    _cleanup_expired_states(db)
    state = secrets.token_urlsafe(32)
    db.add(models.OAuthState(state=state))
    db.commit()
    return state


def validate_oauth_state(db: Session, state: Optional[str]) -> bool:
    if not state:
        return False
    record = db.query(models.OAuthState).filter(models.OAuthState.state == state).first()
    if not record:
        return False
    created_at = record.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    if created_at < datetime.now(timezone.utc) - timedelta(minutes=STATE_TTL_MINUTES):
        db.delete(record)
        db.commit()
        return False
    db.delete(record)
    db.commit()
    return True


def _cleanup_expired_states(db: Session) -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=STATE_TTL_MINUTES)
    db.query(models.OAuthState).filter(models.OAuthState.created_at < cutoff).delete()
    db.commit()


def build_authorize_url(state: str) -> str:
    client_id = _require_env("SLACK_CLIENT_ID")
    params = {
        "client_id": client_id,
        "scope": get_bot_scopes(),
        "user_scope": get_user_scopes(),
        "redirect_uri": get_redirect_uri(),
        "state": state,
    }
    return f"{SLACK_AUTHORIZE_URL}?{urllib.parse.urlencode(params)}"


def exchange_code_for_token(code: str) -> dict[str, Any]:
    client_id = _require_env("SLACK_CLIENT_ID")
    client_secret = _require_env("SLACK_CLIENT_SECRET")
    payload = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "code": code,
            "client_secret": client_secret,
            "redirect_uri": get_redirect_uri(),
        }
    ).encode()
    req = urllib.request.Request(
        SLACK_OAUTH_ACCESS_URL,
        data=payload,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with https_urlopen(req, timeout=10) as response:
        data = json.loads(response.read().decode())
    if not data.get("ok"):
        error = data.get("error", "unknown_error")
        raise ValueError(f"Slack OAuth failed: {error}")
    return data


def upsert_workspace(db: Session, oauth_response: dict[str, Any]) -> models.SlackWorkspace:
    team = oauth_response.get("team") or {}
    team_id = team.get("id")
    if not team_id:
        raise ValueError("Slack OAuth response did not include team id")

    bot_token = oauth_response.get("access_token")
    if not bot_token:
        raise ValueError("Slack OAuth response did not include bot access token")

    authed_user = oauth_response.get("authed_user") or {}
    workspace = db.query(models.SlackWorkspace).filter(
        models.SlackWorkspace.team_id == team_id
    ).first()

    if workspace is None:
        workspace = models.SlackWorkspace(team_id=team_id)
        db.add(workspace)

    workspace.team_name = team.get("name")
    workspace.bot_user_id = oauth_response.get("bot_user_id")
    workspace.bot_access_token = bot_token
    workspace.installed_by_user_id = authed_user.get("id")
    workspace.scope = oauth_response.get("scope")
    workspace.is_active = True
    workspace.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(workspace)
    return workspace


def get_active_workspace(db: Session, team_id: Optional[str] = None) -> Optional[models.SlackWorkspace]:
    query = db.query(models.SlackWorkspace).filter(models.SlackWorkspace.is_active.is_(True))
    if team_id:
        return query.filter(models.SlackWorkspace.team_id == team_id).first()
    return query.order_by(models.SlackWorkspace.updated_at.desc()).first()
