from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DocumentChunkOut(BaseModel):
    id: int
    chunk_index: int
    page_number: int
    content: str

    model_config = ConfigDict(from_attributes=True)


class DocumentOut(BaseModel):
    id: int
    student_id: int
    course_id: Optional[int] = None
    filename: str
    file_type: str
    file_size: int
    chunk_count: int
    upload_date: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentUploadResponse(BaseModel):
    document: DocumentOut
    message: str
    chunks_extracted: int
