from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.course import Course
from app.schemas.course import KnowledgeMapOut
from app.services.knowledge_graph import knowledge_graph_service
from app.api.routes_profile import get_current_student

router = APIRouter(prefix="/knowledge-map", tags=["Knowledge Graph"])

@router.get("", response_model=KnowledgeMapOut)
def get_knowledge_map(course_id: Optional[int] = None, db: Session = Depends(get_db)):
    student = get_current_student(db)

    # Pick specified course or first course
    if course_id:
        course = db.query(Course).filter(Course.id == course_id).first()
    else:
        course = db.query(Course).first()

    if not course:
        raise HTTPException(status_code=404, detail="No courses found. Please seed demo data or add a course.")

    k_map = knowledge_graph_service.get_course_knowledge_map(
        db=db,
        course_id=course.id,
        student_id=student.id
    )

    return KnowledgeMapOut(
        course_id=k_map["course_id"],
        course_title=k_map["course_title"],
        nodes=k_map["nodes"],
        edges=k_map["edges"],
        stats=k_map["stats"]
    )
