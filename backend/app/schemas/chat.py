from typing import List, Optional
from pydantic import BaseModel

class SourceReference(BaseModel):
    document_id: Optional[int] = None
    document_name: str
    page_number: int
    chunk_index: int
    similarity_score: float
    snippet: str


class ChatMessageRequest(BaseModel):
    message: str
    document_id: Optional[int] = None
    prompt_mode: str = "normal"  # normal, simple, example, summary, mcq, exam_topics, compare
    top_k: Optional[int] = 4


class ChatMessageResponse(BaseModel):
    answer: str
    sources: List[SourceReference] = []
    prompt_mode: str = "normal"
    grounded: bool = True
    confidence_score: float = 1.0
