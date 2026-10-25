import pytest
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.student import Student, StudentTopicMastery
from app.models.course import Course, Topic, TopicPrerequisite
from app.models.study_plan import StudyPlan, StudyTask
from app.models.quiz import Quiz, QuizQuestion
from app.services.learning_agent import learning_agent
from app.services.study_planner import study_planner
from app.services.knowledge_graph import knowledge_graph_service
from app.services.quiz_service import quiz_service
from app.services.rag_service import rag_service
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import vector_store

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()

def test_student_and_learning_state_model(db_session):
    student = Student(name="Test Student", course_name="CS", learning_level="Beginner")
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)

    course = Course(title="Computer Networks", code="CS301")
    db_session.add(course)
    db_session.commit()

    topic = Topic(course_id=course.id, name="OSI Model", unit_or_chapter="Unit 2")
    db_session.add(topic)
    db_session.commit()

    # Initial mastery
    m = learning_agent.get_or_create_mastery(db_session, student.id, topic.id)
    assert m.mastery_score == 0.0
    assert m.status == "not_started"

    # Observe topic studied
    m_updated = learning_agent.observe_topic_studied(db_session, student.id, topic.id, duration_minutes=45)
    assert m_updated.mastery_score > 0.0
    assert m_updated.status == "in_progress"

    # Verify structured learning state export
    states = learning_agent.evaluate_learning_state(db_session, student.id)
    assert len(states) == 1
    assert states[0]["topic"] == "OSI Model"
    assert "mastery_score" in states[0]
    assert "quiz_accuracy" in states[0]

def test_adaptive_agent_quiz_observation_and_policy(db_session):
    student = Student(name="Learner", course_name="CS")
    db_session.add(student)
    course = Course(title="Networks", code="NET")
    db_session.add(course)
    db_session.commit()

    topic = Topic(course_id=course.id, name="CRC", unit_or_chapter="Unit 3")
    db_session.add(topic)
    db_session.commit()

    # Low score test: 40% accuracy -> should trigger "review_concept"
    result = learning_agent.observe_quiz_result(
        db=db_session,
        student_id=student.id,
        topic_id=topic.id,
        score=2,
        total_questions=5,
        accuracy=0.40,
        quiz_id=1
    )
    assert result["recommended_action"] == "review_concept"
    assert result["status"] == "needs_revision"

    # High score test: 100% accuracy -> should trigger "advance_topic"
    result_high = learning_agent.observe_quiz_result(
        db=db_session,
        student_id=student.id,
        topic_id=topic.id,
        score=5,
        total_questions=5,
        accuracy=1.00,
        quiz_id=2
    )
    assert result_high["recommended_action"] == "advance_topic"
    assert result_high["new_mastery"] >= 0.70

def test_document_processor_chunking():
    sample_text = [
        {"page_number": 1, "text": "This is a detailed paragraph explaining TCP/IP. It covers the four protocol layers." * 20}
    ]
    chunks = DocumentProcessor.create_chunks(sample_text, chunk_size=300, chunk_overlap=50)
    assert len(chunks) > 1
    assert all("content" in c and "page_number" in c for c in chunks)
    assert chunks[0]["page_number"] == 1

def test_vector_store_retrieval():
    vector_store.reset()
    chunks = [
        {"id": 1, "document_id": 10, "document_name": "net_notes.txt", "page_number": 1, "chunk_index": 0, "content": "Cyclic Redundancy Check CRC uses polynomial modulo-2 arithmetic for error detection."},
        {"id": 2, "document_id": 10, "document_name": "net_notes.txt", "page_number": 2, "chunk_index": 1, "content": "IP Addressing uses 32-bit addresses in IPv4 divided into network and host identifiers."}
    ]
    vector_store.set_all_chunks(chunks)

    results = vector_store.search("polynomial CRC error detection", top_k=2)
    assert len(results) > 0
    assert "CRC" in results[0]["content"]
    assert results[0]["page_number"] == 1

def test_study_plan_generation(db_session):
    student = Student(name="Planner Student", course_name="CS")
    db_session.add(student)
    course = Course(title="Networks", code="CS301")
    db_session.add(course)
    db_session.commit()

    # Add 3 topics
    t1 = Topic(course_id=course.id, name="Topologies", unit_or_chapter="Unit 1", order_index=1)
    t2 = Topic(course_id=course.id, name="OSI", unit_or_chapter="Unit 2", order_index=2)
    db_session.add_all([t1, t2])
    db_session.commit()

    exam_date = datetime.date.today() + datetime.timedelta(days=7)
    plan = study_planner.generate_plan(
        db=db_session,
        student_id=student.id,
        course_id=course.id,
        exam_date=exam_date,
        daily_available_hours=2.0
    )

    assert plan.id is not None
    assert plan.is_active is True
    assert len(plan.tasks) > 0

    # Mark a task complete
    task = plan.tasks[0]
    completed_task = study_planner.complete_task(db_session, task.id, student.id, is_completed=True)
    assert completed_task.is_completed is True

def test_knowledge_graph_prerequisites(db_session):
    student = Student(name="Graph Student")
    db_session.add(student)
    course = Course(title="Networks", code="CS301")
    db_session.add(course)
    db_session.commit()

    t1 = Topic(course_id=course.id, name="Fundamentals", order_index=1)
    t2 = Topic(course_id=course.id, name="Models", order_index=2)
    db_session.add_all([t1, t2])
    db_session.commit()

    prereq = TopicPrerequisite(topic_id=t2.id, prerequisite_id=t1.id)
    db_session.add(prereq)
    db_session.commit()

    k_map = knowledge_graph_service.get_course_knowledge_map(db_session, course.id, student.id)
    assert len(k_map["nodes"]) == 2
    assert len(k_map["edges"]) == 1
    assert k_map["edges"][0]["source"] == str(t1.id)
    assert k_map["edges"][0]["target"] == str(t2.id)

def test_quiz_generation_and_scoring(db_session):
    student = Student(name="Quizzer")
    db_session.add(student)
    course = Course(title="Networks", code="CS301")
    db_session.add(course)
    db_session.commit()
    topic = Topic(course_id=course.id, name="OSI Model")
    db_session.add(topic)
    db_session.commit()

    quiz = quiz_service.generate_quiz(db_session, student.id, topic_id=topic.id, num_questions=3)
    assert len(quiz.questions) == 3

    # Submit answers
    answers = {}
    for q in quiz.questions:
        answers[str(q.id)] = q.correct_option

    result = quiz_service.submit_quiz_attempt(db_session, student.id, quiz.id, answers)
    assert result["score"] == 3
    assert result["accuracy"] == 1.0
    assert result["percentage"] == 100.0
