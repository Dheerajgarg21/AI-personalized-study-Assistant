from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class LearningStateModel(BaseModel):
    topic: str
    topic_id: int
    mastery_score: float
    confidence: float
    last_studied: Optional[str] = None
    quiz_accuracy: float
    revision_needed: bool
    status: str

    model_config = ConfigDict(from_attributes=True)


class StudentBase(BaseModel):
    name: str
    course_name: str = "Computer Science"
    learning_level: str = "Intermediate"
    daily_available_time: int = 120
    study_goals: str = "Master syllabus concepts, score >85% in semester exams"


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    course_name: Optional[str] = None
    learning_level: Optional[str] = None
    daily_available_time: Optional[int] = None
    study_goals: Optional[str] = None


class StudentOut(StudentBase):
    id: int
    current_streak: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityHistoryOut(BaseModel):
    id: int
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    activity_type: str
    score: Optional[float] = None
    duration_minutes: int
    timestamp: datetime
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class StudentProfileFull(StudentOut):
    learning_states: List[LearningStateModel] = []
    weak_topics: List[str] = []
    strong_topics: List[str] = []
    completed_topics_count: int = 0
    total_topics_count: int = 0
    average_mastery: float = 0.0
    average_quiz_score: float = 0.0
    total_study_minutes: int = 0
    recent_activities: List[ActivityHistoryOut] = []
