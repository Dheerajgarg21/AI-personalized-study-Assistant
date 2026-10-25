from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.student import Student, StudentTopicMastery, LearningActivityHistory
from app.models.course import Topic
from app.schemas.student import StudentCreate, StudentUpdate, StudentProfileFull, StudentOut, LearningStateModel, ActivityHistoryOut
from app.services.learning_agent import learning_agent
from app.config import settings

router = APIRouter(prefix="/profile", tags=["Student Profile"])

def get_current_student(db: Session = Depends(get_db)) -> Student:
    """Helper to return the primary active student or create default student."""
    student = db.query(Student).first()
    if not student:
        student = Student(
            name="Alex Morgan",
            course_name="B.Tech Computer Science & Engineering",
            learning_level="Intermediate",
            daily_available_time=120,
            study_goals="Master Computer Networks, score >85% in semester finals",
            current_streak=4
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    return student

@router.get("", response_model=StudentProfileFull)
def get_profile(db: Session = Depends(get_db)):
    student = get_current_student(db)
    
    # Evaluate current learning states with time-decay check
    learning_states_raw = learning_agent.evaluate_learning_state(db, student.id)
    
    weak_topics = []
    strong_topics = []
    completed_count = 0
    total_mastery = 0.0

    for s in learning_states_raw:
        total_mastery += s["mastery_score"]
        if s["mastery_score"] >= settings.STRONG_THRESHOLD:
            strong_topics.append(s["topic"])
            completed_count += 1
        elif s["mastery_score"] < settings.WEAK_THRESHOLD and s["mastery_score"] > 0:
            weak_topics.append(s["topic"])

    total_topics = len(learning_states_raw)
    avg_mastery = round(total_mastery / total_topics, 2) if total_topics > 0 else 0.0

    # Calculate average quiz score
    attempts = student.quiz_attempts
    avg_quiz = round(sum([a.accuracy for a in attempts]) / len(attempts) * 100, 1) if attempts else 0.0

    # Recent activities
    activities = (
        db.query(LearningActivityHistory)
        .filter(LearningActivityHistory.student_id == student.id)
        .order_by(LearningActivityHistory.timestamp.desc())
        .limit(10)
        .all()
    )
    activity_outs = []
    for a in activities:
        topic_name = a.topic.name if a.topic else "General Study"
        activity_outs.append(ActivityHistoryOut(
            id=a.id,
            topic_id=a.topic_id,
            topic_name=topic_name,
            activity_type=a.activity_type,
            score=a.score,
            duration_minutes=a.duration_minutes,
            timestamp=a.timestamp,
            notes=a.notes
        ))

    total_study_mins = sum([a.duration_minutes for a in student.activities])

    return StudentProfileFull(
        id=student.id,
        name=student.name,
        course_name=student.course_name,
        learning_level=student.learning_level,
        daily_available_time=student.daily_available_time,
        study_goals=student.study_goals,
        current_streak=student.current_streak,
        created_at=student.created_at,
        updated_at=student.updated_at,
        learning_states=learning_states_raw,
        weak_topics=weak_topics,
        strong_topics=strong_topics,
        completed_topics_count=completed_count,
        total_topics_count=total_topics,
        average_mastery=avg_mastery,
        average_quiz_score=avg_quiz,
        total_study_minutes=total_study_mins,
        recent_activities=activity_outs
    )

@router.post("", response_model=StudentOut)
def update_or_create_profile(payload: StudentUpdate, db: Session = Depends(get_db)):
    student = get_current_student(db)
    if payload.name is not None:
        student.name = payload.name
    if payload.course_name is not None:
        student.course_name = payload.course_name
    if payload.learning_level is not None:
        student.learning_level = payload.learning_level
    if payload.daily_available_time is not None:
        student.daily_available_time = payload.daily_available_time
    if payload.study_goals is not None:
        student.study_goals = payload.study_goals

    db.commit()
    db.refresh(student)
    return student
