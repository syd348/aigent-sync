"""Per-user login sessions created after Slack OAuth."""

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session

import models
from http_utils import urlopen as https_urlopen
import json
import urllib.parse
import urllib.request

SESSION_TTL_DAYS = 30


def fetch_slack_user_profile(slack_user_id: str, bot_token: str) -> dict[str, Any]:
    url = f"https://slack.com/api/users.info?user={urllib.parse.quote(slack_user_id)}"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {bot_token}"},
    )
    with https_urlopen(req, timeout=10) as response:
        data = json.loads(response.read().decode())
    if not data.get("ok"):
        return {}
    user = data.get("user") or {}
    profile = user.get("profile") or {}
    return {
        "display_name": (
            profile.get("display_name")
            or profile.get("real_name")
            or user.get("real_name")
            or user.get("name")
        ),
        "email": profile.get("email"),
        "avatar_url": profile.get("image_192") or profile.get("image_72"),
    }


def upsert_user(
    db: Session,
    *,
    slack_user_id: str,
    slack_team_id: str,
    team_name: Optional[str],
    profile: dict[str, Any],
    slack_user_token: Optional[str] = None,
) -> models.User:
    user = db.query(models.User).filter(models.User.slack_user_id == slack_user_id).first()
    if user is None:
        user = models.User(slack_user_id=slack_user_id, slack_team_id=slack_team_id)
        db.add(user)

    user.slack_team_id = slack_team_id
    user.team_name = team_name
    user.display_name = profile.get("display_name") or slack_user_id
    user.email = profile.get("email")
    user.avatar_url = profile.get("avatar_url")
    if slack_user_token:
        user.slack_user_token = slack_user_token
    user.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)
    return user


def create_login_session(db: Session, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
    db.add(
        models.LoginSession(
            token=token,
            user_id=user_id,
            expires_at=expires_at,
        )
    )
    db.commit()
    return token


def get_user_for_token(db: Session, token: Optional[str]) -> Optional[models.User]:
    if not token:
        return None
    session = (
        db.query(models.LoginSession)
        .filter(models.LoginSession.token == token)
        .first()
    )
    if not session:
        return None
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        db.delete(session)
        db.commit()
        return None
    return db.query(models.User).filter(models.User.id == session.user_id).first()


def revoke_token(db: Session, token: Optional[str]) -> None:
    if not token:
        return
    db.query(models.LoginSession).filter(models.LoginSession.token == token).delete()
    db.commit()


def revoke_all_for_user(db: Session, user_id: int) -> None:
    db.query(models.LoginSession).filter(models.LoginSession.user_id == user_id).delete()
    db.commit()
