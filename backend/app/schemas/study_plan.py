from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict

class StudyTaskOut(BaseModel):
    id: int
    plan_id: int
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    title: str
    date: date
    duration_minutes: int
    priority: str  # high, medium, low
    task_type: str  # study, revision, practice_quiz, break
    is_completed: bool
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StudyPlanGenerateRequest(BaseModel):
    course_id: int
    exam_date: date
    daily_available_hours: float = 2.0
    focus_weak_topics: bool = True
    include_breaks: bool = True
    revision_frequency_days: int = 3


class StudyPlanOut(BaseModel):
    id: int
    student_id: int
    course_id: int
    course_title: Optional[str] = None
    exam_date: date
    daily_hours: int
    start_date: date
    end_date: date
    is_active: bool
    tasks: List[StudyTaskOut] = []
    total_days: int = 0
    completed_tasks_count: int = 0
    total_tasks_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class TaskCompleteRequest(BaseModel):
    is_completed: bool = True
    notes: Optional[str] = None
    actual_duration_minutes: Optional[int] = None
