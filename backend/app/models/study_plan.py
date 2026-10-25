import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Date
from sqlalchemy.orm import relationship
from app.database import Base

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    exam_date = Column(Date, nullable=False)
    daily_hours = Column(Integer, default=2)
    start_date = Column(Date, default=datetime.date.today)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="study_plans")
    course = relationship("Course", back_populates="study_plans")
    tasks = relationship("StudyTask", back_populates="plan", cascade="all, delete-orphan", order_by="StudyTask.date, StudyTask.id")


class StudyTask(Base):
    __tablename__ = "study_tasks"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    title = Column(String(200), nullable=False)
    date = Column(Date, nullable=False)
    duration_minutes = Column(Integer, default=45)
    priority = Column(String(20), default="medium")  # high, medium, low
    task_type = Column(String(30), default="study")  # study, revision, practice_quiz, break
    is_completed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    plan = relationship("StudyPlan", back_populates="tasks")
    topic = relationship("Topic", back_populates="study_tasks")
