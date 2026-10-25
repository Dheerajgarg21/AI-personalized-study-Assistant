from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.course import Course, Topic, TopicPrerequisite
from app.models.student import StudentTopicMastery
from app.schemas.course import CourseOut, TopicOut
from app.api.routes_profile import get_current_student

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.get("", response_model=List[CourseOut])
def list_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    student = get_current_student(db)

    results = []
    for c in courses:
        topics_out = []
        masteries = {m.topic_id: m for m in db.query(StudentTopicMastery).filter(StudentTopicMastery.student_id == student.id).all()}

        for t in c.topics:
            m = masteries.get(t.id)
            prereq_ids = [p.prerequisite_id for p in t.prerequisites]
            prereq_names = [p.prerequisite.name for p in t.prerequisites if p.prerequisite]
            
            topics_out.append(TopicOut(
                id=t.id,
                course_id=t.course_id,
                name=t.name,
                unit_or_chapter=t.unit_or_chapter,
                description=t.description,
                difficulty=t.difficulty,
                estimated_minutes=t.estimated_minutes,
                order_index=t.order_index,
                prerequisite_ids=prereq_ids,
                prerequisite_names=prereq_names,
                mastery_score=m.mastery_score if m else 0.0,
                status=m.status if m else "not_started"
            ))

        results.append(CourseOut(
            id=c.id,
            title=c.title,
            code=c.code,
            description=c.description,
            topics=topics_out
        ))
    return results

@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    student = get_current_student(db)
    masteries = {m.topic_id: m for m in db.query(StudentTopicMastery).filter(StudentTopicMastery.student_id == student.id).all()}

    topics_out = []
    for t in course.topics:
        m = masteries.get(t.id)
        prereq_ids = [p.prerequisite_id for p in t.prerequisites]
        prereq_names = [p.prerequisite.name for p in t.prerequisites if p.prerequisite]

        topics_out.append(TopicOut(
            id=t.id,
            course_id=t.course_id,
            name=t.name,
            unit_or_chapter=t.unit_or_chapter,
            description=t.description,
            difficulty=t.difficulty,
            estimated_minutes=t.estimated_minutes,
            order_index=t.order_index,
            prerequisite_ids=prereq_ids,
            prerequisite_names=prereq_names,
            mastery_score=m.mastery_score if m else 0.0,
            status=m.status if m else "not_started"
        ))

    return CourseOut(
        id=course.id,
        title=course.title,
        code=course.code,
        description=course.description,
        topics=topics_out
    )
