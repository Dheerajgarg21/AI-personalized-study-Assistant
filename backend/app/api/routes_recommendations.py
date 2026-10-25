from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.agent import RecommendationOut, LearningAgentStatusOut
from app.services.learning_agent import learning_agent
from app.api.routes_profile import get_current_student
from app.config import settings

router = APIRouter(prefix="/recommendations", tags=["Adaptive Learning Agent"])

@router.get("", response_model=LearningAgentStatusOut)
def get_recommendations(course_id: Optional[int] = None, db: Session = Depends(get_db)):
    student = get_current_student(db)

    # Agent evaluations
    recs = learning_agent.generate_recommendations(db, student.id, course_id=course_id)
    states = learning_agent.evaluate_learning_state(db, student.id)

    weak_count = sum(1 for s in states if s["mastery_score"] < settings.WEAK_THRESHOLD and s["mastery_score"] > 0)
    strong_count = sum(1 for s in states if s["mastery_score"] >= settings.STRONG_THRESHOLD)
    rev_count = sum(1 for s in states if s["revision_needed"])

    avg_mastery = sum(s["mastery_score"] for s in states) / len(states) if states else 0.0

    # Determine next topic
    next_topic = None
    for r in recs:
        if r["action_type"] == "advance_topic":
            next_topic = {
                "topic_id": r.get("topic_id"),
                "topic_name": r.get("topic_name"),
                "title": r.get("title")
            }
            break

    recommendation_outs = [
        RecommendationOut(
            id=r["id"],
            action_type=r["action_type"],
            topic_id=r.get("topic_id"),
            topic_name=r.get("topic_name"),
            priority=r["priority"],
            title=r["title"],
            description=r["description"],
            reason=r["reason"],
            action_payload=r.get("action_payload")
        )
        for r in recs
    ]

    return LearningAgentStatusOut(
        student_id=student.id,
        learning_level=student.learning_level,
        average_mastery=round(avg_mastery, 2),
        weak_topics_count=weak_count,
        strong_topics_count=strong_count,
        pending_revisions_count=rev_count,
        next_recommended_topic=next_topic,
        recommendations=recommendation_outs
    )
