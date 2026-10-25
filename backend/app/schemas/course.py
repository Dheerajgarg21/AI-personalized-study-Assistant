from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class TopicBase(BaseModel):
    name: str
    unit_or_chapter: str = "Unit 1"
    description: Optional[str] = None
    difficulty: str = "medium"
    estimated_minutes: int = 60
    order_index: int = 0


class TopicOut(TopicBase):
    id: int
    course_id: int
    prerequisite_ids: List[int] = []
    prerequisite_names: List[str] = []
    mastery_score: float = 0.0
    status: str = "not_started"

    model_config = ConfigDict(from_attributes=True)


class CourseBase(BaseModel):
    title: str
    code: str
    description: Optional[str] = None


class CourseOut(CourseBase):
    id: int
    topics: List[TopicOut] = []

    model_config = ConfigDict(from_attributes=True)


class KnowledgeMapNode(BaseModel):
    id: str
    topic_id: int
    name: str
    unit: str
    difficulty: str
    mastery_score: float
    confidence: float
    status: str  # completed, in_progress, weak, locked, not_started
    prerequisites: List[int] = []
    estimated_minutes: int


class KnowledgeMapEdge(BaseModel):
    source: str
    target: str
    label: str = "prerequisite_of"


class KnowledgeMapOut(BaseModel):
    course_id: int
    course_title: str
    nodes: List[KnowledgeMapNode]
    edges: List[KnowledgeMapEdge]
    stats: dict
