import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.student import Student, StudentTopicMastery, LearningActivityHistory
from app.models.course import Topic, Course
from app.models.study_plan import StudyPlan, StudyTask
from app.models.quiz import QuizAttempt
from app.services.learning_agent import learning_agent
from app.api.routes_profile import get_current_student
from app.config import settings

router = APIRouter(prefix="/progress", tags=["Analytics & Progress"])

@router.get("")
def get_progress_analytics(db: Session = Depends(get_db)):
    student = get_current_student(db)

    # 1. Topic Masteries & Learning States
    learning_states = learning_agent.evaluate_learning_state(db, student.id)
    
    total_topics = len(learning_states)
    completed_topics = 0
    in_progress_topics = 0
    weak_topics_list = []
    strong_topics_list = []
    total_mastery_sum = 0.0

    topic_performance = []

    for s in learning_states:
        total_mastery_sum += s["mastery_score"]
        if s["mastery_score"] >= settings.STRONG_THRESHOLD:
            completed_topics += 1
            strong_topics_list.append(s["topic"])
        elif s["mastery_score"] < settings.WEAK_THRESHOLD and s["mastery_score"] > 0:
            weak_topics_list.append(s["topic"])
        elif s["mastery_score"] >= settings.WEAK_THRESHOLD:
            in_progress_topics += 1

        topic_performance.append({
            "name": s["topic"][:16] + "..." if len(s["topic"]) > 16 else s["topic"],
            "fullName": s["topic"],
            "unit": s.get("unit", "Unit 1"),
            "mastery": int(s["mastery_score"] * 100),
            "confidence": int(s["confidence"] * 100),
            "quizAccuracy": int(s["quiz_accuracy"] * 100)
        })

    pending_topics = max(0, total_topics - completed_topics)
    avg_mastery = round(total_mastery_sum / total_topics, 2) if total_topics > 0 else 0.0

    # 2. Quiz Performance Chart Data (chronological order)
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.student_id == student.id)
        .order_by(QuizAttempt.date_attempted.asc())
        .limit(10)
        .all()
    )
    quiz_trend = []
    for a in attempts:
        quiz_trend.append({
            "date": a.date_attempted.strftime("%b %d"),
            "accuracy": int(a.accuracy * 100),
            "score": a.score,
            "total": a.total_questions
        })

    # 3. Today's Study Tasks
    today = datetime.date.today()
    active_plan = (
        db.query(StudyPlan)
        .filter(StudyPlan.student_id == student.id, StudyPlan.is_active == True)
        .first()
    )
    today_tasks = []
    if active_plan:
        tasks = (
            db.query(StudyTask)
            .filter(StudyTask.plan_id == active_plan.id, StudyTask.date == today)
            .order_by(StudyTask.id)
            .all()
        )
        for t in tasks:
            today_tasks.append({
                "id": t.id,
                "title": t.title,
                "topic_name": t.topic.name if t.topic else None,
                "duration_minutes": t.duration_minutes,
                "priority": t.priority,
                "task_type": t.task_type,
                "is_completed": t.is_completed
            })

    # 4. Weekly Activity Distribution (last 7 days)
    activity_timeline = []
    for d in range(6, -1, -1):
        day_date = today - datetime.timedelta(days=d)
        day_start = datetime.datetime.combine(day_date, datetime.time.min)
        day_end = datetime.datetime.combine(day_date, datetime.time.max)

        day_acts = (
            db.query(LearningActivityHistory)
            .filter(
                LearningActivityHistory.student_id == student.id,
                LearningActivityHistory.timestamp >= day_start,
                LearningActivityHistory.timestamp <= day_end
            )
            .all()
        )
        study_mins = sum([a.duration_minutes for a in day_acts])
        activity_timeline.append({
            "day": day_date.strftime("%a"),
            "date": day_date.strftime("%m/%d"),
            "minutes": study_mins,
            "activitiesCount": len(day_acts)
        })

    # Total study time
    all_activities = db.query(LearningActivityHistory).filter(LearningActivityHistory.student_id == student.id).all()
    total_minutes = sum([a.duration_minutes for a in all_activities])

    # Next recommended action from agent
    recs = learning_agent.generate_recommendations(db, student.id)
    top_rec = recs[0] if recs else None

    return {
        "student": {
            "name": student.name,
            "course": student.course_name,
            "streak": student.current_streak,
            "daily_goal_minutes": student.daily_available_time,
            "total_study_hours": round(total_minutes / 60.0, 1)
        },
        "stats": {
            "overall_progress_percentage": int(avg_mastery * 100),
            "completed_topics": completed_topics,
            "pending_topics": pending_topics,
            "total_topics": total_topics,
            "weak_topics_count": len(weak_topics_list),
            "strong_topics_count": len(strong_topics_list),
        },
        "weak_topics": weak_topics_list,
        "strong_topics": strong_topics_list,
        "topic_performance": topic_performance,
        "quiz_trend": quiz_trend,
        "today_tasks": today_tasks,
        "activity_timeline": activity_timeline,
        "top_recommendation": top_rec
    }
