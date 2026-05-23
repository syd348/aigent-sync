from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, Date
from database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    assignee = Column(String(100), nullable=True)
    deadline = Column(Date, nullable=True)
    description = Column(Text, nullable=False)
    priority = Column(String(50), nullable=True, default="Medium")  # Low, Medium, High
    status = Column(String(50), nullable=False, default="To-do")    # To-do, In Progress, Done
    source = Column(String(50), nullable=True, default="manual")    # manual, slack


class OAuthState(Base):
    __tablename__ = "oauth_states"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    state = Column(String(128), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    slack_user_id = Column(String(64), unique=True, nullable=False, index=True)
    slack_team_id = Column(String(64), nullable=False, index=True)
    team_name = Column(String(255), nullable=True)
    display_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    avatar_url = Column(Text, nullable=True)
    slack_user_token = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)


class LoginSession(Base):
    __tablename__ = "auth_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    token = Column(String(128), unique=True, nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)


class SlackWorkspace(Base):
    __tablename__ = "slack_workspaces"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    team_id = Column(String(64), unique=True, nullable=False, index=True)
    team_name = Column(String(255), nullable=True)
    bot_user_id = Column(String(64), nullable=True)
    bot_access_token = Column(Text, nullable=True)
    installed_by_user_id = Column(String(64), nullable=True)
    scope = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)
