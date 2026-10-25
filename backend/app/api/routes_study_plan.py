from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.study_plan import StudyPlan, StudyTask
from app.models.course import Course, Topic
from app.schemas.study_plan import StudyPlanGenerateRequest, StudyPlanOut, StudyTaskOut, TaskCompleteRequest
from app.services.study_planner import study_planner
from app.services.learning_agent import learning_agent
from app.api.routes_profile import get_current_student

router = APIRouter(tags=["Study Planner"])

@router.post("/study-plan/generate", response_model=StudyPlanOut)
def generate_study_plan(payload: StudyPlanGenerateRequest, db: Session = Depends(get_db)):
    student = get_current_student(db)

    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    plan = study_planner.generate_plan(
        db=db,
        student_id=student.id,
        course_id=payload.course_id,
        exam_date=payload.exam_date,
        daily_available_hours=payload.daily_available_hours,
        focus_weak_topics=payload.focus_weak_topics,
        include_breaks=payload.include_breaks,
        revision_frequency_days=payload.revision_frequency_days
    )

    return _format_plan_response(plan)

@router.get("/study-plan", response_model=Optional[StudyPlanOut])
def get_current_study_plan(course_id: Optional[int] = None, db: Session = Depends(get_db)):
    student = get_current_student(db)

    query = db.query(StudyPlan).filter(
        StudyPlan.student_id == student.id,
        StudyPlan.is_active == True
    )
    if course_id:
        query = query.filter(StudyPlan.course_id == course_id)

    plan = query.order_by(StudyPlan.created_at.desc()).first()
    if not plan:
        return None

    return _format_plan_response(plan)

@router.post("/study-plan/tasks/{task_id}/complete", response_model=StudyTaskOut)
def complete_study_task(
    task_id: int,
    payload: TaskCompleteRequest,
    db: Session = Depends(get_db)
):
    student = get_current_student(db)
    try:
        task = study_planner.complete_task(
            db=db,
            task_id=task_id,
            student_id=student.id,
            is_completed=payload.is_completed,
            actual_minutes=payload.actual_duration_minutes,
            notes=payload.notes
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    topic_name = task.topic.name if task.topic else None
    return StudyTaskOut(
        id=task.id,
        plan_id=task.plan_id,
        topic_id=task.topic_id,
        topic_name=topic_name,
        title=task.title,
        date=task.date,
        duration_minutes=task.duration_minutes,
        priority=task.priority,
        task_type=task.task_type,
        is_completed=task.is_completed,
        notes=task.notes,
        completed_at=task.completed_at
    )

@router.post("/topics/{topic_id}/complete")
def complete_topic_directly(topic_id: int, db: Session = Depends(get_db)):
    """Directly completes a topic and updates the student's learning state."""
    student = get_current_student(db)
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found.")

    mastery = learning_agent.observe_topic_studied(
        db=db,
        student_id=student.id,
        topic_id=topic_id,
        duration_minutes=60,
        activity_type="studied",
        notes=f"Student marked topic '{topic.name}' as completed."
    )

    return {
        "message": f"Topic '{topic.name}' marked completed.",
        "topic_id": topic_id,
        "mastery_score": mastery.mastery_score,
        "status": mastery.status
    }

def _format_plan_response(plan: StudyPlan) -> StudyPlanOut:
    tasks_out = []
    completed_count = 0
    for t in plan.tasks:
        if t.is_completed:
            completed_count += 1
        tasks_out.append(StudyTaskOut(
            id=t.id,
            plan_id=t.plan_id,
            topic_id=t.topic_id,
            topic_name=t.topic.name if t.topic else None,
            title=t.title,
            date=t.date,
            duration_minutes=t.duration_minutes,
            priority=t.priority,
            task_type=t.task_type,
            is_completed=t.is_completed,
            notes=t.notes,
            completed_at=t.completed_at
        ))

    total_days = max(1, (plan.end_date - plan.start_date).days)

    return StudyPlanOut(
        id=plan.id,
        student_id=plan.student_id,
        course_id=plan.course_id,
        course_title=plan.course.title if plan.course else "Active Course",
        exam_date=plan.exam_date,
        daily_hours=plan.daily_hours,
        start_date=plan.start_date,
        end_date=plan.end_date,
        is_active=plan.is_active,
        tasks=tasks_out,
        total_days=total_days,
        completed_tasks_count=completed_count,
        total_tasks_count=len(tasks_out)
    )
