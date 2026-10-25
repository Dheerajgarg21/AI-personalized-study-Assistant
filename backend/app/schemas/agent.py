from typing import List, Optional, Any, Dict
from pydantic import BaseModel

class RecommendationOut(BaseModel):
    id: str
    action_type: str  # review_concept, targeted_practice, advance_topic, schedule_revision, take_quiz, prerequisite_warning
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    priority: str  # urgent, high, medium, low
    title: str
    description: str
    reason: str
    action_payload: Optional[Dict[str, Any]] = None


class LearningAgentStatusOut(BaseModel):
    student_id: int
    learning_level: str
    average_mastery: float
    weak_topics_count: int
    strong_topics_count: int
    pending_revisions_count: int
    next_recommended_topic: Optional[dict] = None
    recommendations: List[RecommendationOut] = []
