import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    code = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    topics = relationship("Topic", back_populates="course", cascade="all, delete-orphan", order_by="Topic.order_index")
    documents = relationship("UploadedDocument", back_populates="course", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="course", cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    name = Column(String(150), nullable=False)
    unit_or_chapter = Column(String(100), default="Unit 1")
    description = Column(Text, nullable=True)
    difficulty = Column(String(50), default="medium")  # easy, medium, hard
    estimated_minutes = Column(Integer, default=60)
    order_index = Column(Integer, default=0)

    # Relationships
    course = relationship("Course", back_populates="topics")
    masteries = relationship("StudentTopicMastery", back_populates="topic", cascade="all, delete-orphan")
    study_tasks = relationship("StudyTask", back_populates="topic")
    quizzes = relationship("Quiz", back_populates="topic", cascade="all, delete-orphan")

    # Prerequisites: topics that this topic depends on
    prerequisites = relationship(
        "TopicPrerequisite",
        foreign_keys="TopicPrerequisite.topic_id",
        back_populates="topic",
        cascade="all, delete-orphan"
    )
    # Dependents: topics that depend on this topic
    dependents = relationship(
        "TopicPrerequisite",
        foreign_keys="TopicPrerequisite.prerequisite_id",
        back_populates="prerequisite",
        cascade="all, delete-orphan"
    )


class TopicPrerequisite(Base):
    __tablename__ = "topic_prerequisites"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    prerequisite_id = Column(Integer, ForeignKey("topics.id"), nullable=False)

    topic = relationship("Topic", foreign_keys=[topic_id], back_populates="prerequisites")
    prerequisite = relationship("Topic", foreign_keys=[prerequisite_id], back_populates="dependents")
