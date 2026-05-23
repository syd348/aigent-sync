from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

# Pydantic schemas for Task Database Operations
class TaskBase(BaseModel):
    assignee: Optional[str] = Field(None, max_length=100, description="Name of the person assigned to the task")
    deadline: Optional[date] = Field(None, description="Task deadline date (YYYY-MM-DD)")
    description: str = Field(..., description="Details and contents of the task")
    priority: Optional[str] = Field("Medium", description="Task priority (Low, Medium, High)")
    status: Optional[str] = Field("To-do", description="Status of the task (To-do, In Progress, Done)")

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    assignee: Optional[str] = Field(None, max_length=100)
    deadline: Optional[date] = Field(None)
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class TaskResponse(TaskBase):
    task_id: int

    class Config:
        from_attributes = True

# Pydantic schema for LLM analysis input
class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Unstructured message text (e.g. from Slack, email)")

# Pydantic schema for LLM structured output and API response
class AnalyzeResponse(BaseModel):
    assignee: Optional[str] = Field(None, description="Inferred assignee. If not mentioned or unclear, return null.")
    deadline: Optional[date] = Field(None, description="Inferred deadline in YYYY-MM-DD format. If not mentioned or unclear, return null.")
    description: str = Field(..., description="Summarized description/action of the task.")
    priority: str = Field("Medium", description="Inferred priority level (Low, Medium, or High). Default to Medium if not specified.")
    confidence_score: float = Field(..., description="Confidence score from 0.0 to 1.0 based on context completeness and inference reliability.")
