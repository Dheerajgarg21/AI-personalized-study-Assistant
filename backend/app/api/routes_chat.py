from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.services.rag_service import rag_service
from app.models.student import LearningActivityHistory
from app.api.routes_profile import get_current_student

router = APIRouter(prefix="/chat", tags=["AI Study Chat"])

@router.post("", response_model=ChatMessageResponse)
def ask_study_assistant(payload: ChatMessageRequest, db: Session = Depends(get_db)):
    student = get_current_student(db)

    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Query message cannot be empty.")

    # Call RAG service
    rag_result = rag_service.answer_query(
        query=payload.message,
        document_id=payload.document_id,
        prompt_mode=payload.prompt_mode,
        top_k=payload.top_k or 4
    )

    # Log inquiry in student activity history
    activity = LearningActivityHistory(
        student_id=student.id,
        activity_type="chat_question",
        duration_minutes=5,
        notes=f"Inquired: '{payload.message[:80]}...' (Mode: {payload.prompt_mode})"
    )
    db.add(activity)
    db.commit()

    return ChatMessageResponse(
        answer=rag_result["answer"],
        sources=rag_result["sources"],
        prompt_mode=rag_result["prompt_mode"],
        grounded=rag_result["grounded"],
        confidence_score=rag_result["confidence_score"]
    )
