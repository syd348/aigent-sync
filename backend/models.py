from sqlalchemy import Column, Integer, String, Text, Date
from database import Base

class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    assignee = Column(String(100), nullable=True)
    deadline = Column(Date, nullable=True)
    description = Column(Text, nullable=False)
    priority = Column(String(50), nullable=True, default="Medium")  # Low, Medium, High
    status = Column(String(50), nullable=False, default="To-do")    # To-do, In Progress, Done
    source = Column(String(50), nullable=True, default="manual")    # manual, slack
