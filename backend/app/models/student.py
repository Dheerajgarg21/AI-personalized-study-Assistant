import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    course_name = Column(String(100), default="Computer Science")
    learning_level = Column(String(50), default="Intermediate")  # Beginner, Intermediate, Advanced
    daily_available_time = Column(Integer, default=120)  # in minutes
    study_goals = Column(Text, default="Master syllabus concepts, score >85% in semester exams")
    current_streak = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    masteries = relationship("StudentTopicMastery", back_populates="student", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="student", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="student", cascade="all, delete-orphan")
    activities = relationship("LearningActivityHistory", back_populates="student", cascade="all, delete-orphan")
    documents = relationship("UploadedDocument", back_populates="student", cascade="all, delete-orphan")


class StudentTopicMastery(Base):
    __tablename__ = "student_topic_mastery"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    mastery_score = Column(Float, default=0.0)  # 0.0 to 1.0
    confidence = Column(Float, default=0.5)      # 0.0 to 1.0
    last_studied = Column(DateTime, nullable=True)
    quiz_accuracy = Column(Float, default=0.0)   # 0.0 to 1.0
    revision_needed = Column(Boolean, default=False)
    status = Column(String(50), default="not_started")  # not_started, in_progress, completed, needs_revision
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="masteries")
    topic = relationship("Topic", back_populates="masteries")


class LearningActivityHistory(Base):
    __tablename__ = "learning_activity_history"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    activity_type = Column(String(50), nullable=False)  # studied, quiz_taken, plan_completed, revision_done, chat_question
    score = Column(Float, nullable=True)
    duration_minutes = Column(Integer, default=30)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)

    # Relationships
    student = relationship("Student", back_populates="activities")
    topic = relationship("Topic")
