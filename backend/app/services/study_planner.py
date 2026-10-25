import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.study_plan import StudyPlan, StudyTask
from app.models.course import Course, Topic, TopicPrerequisite
from app.models.student import Student, StudentTopicMastery
from app.config import settings

class StudyPlannerService:
    @staticmethod
    def generate_plan(
        db: Session,
        student_id: int,
        course_id: int,
        exam_date: datetime.date,
        daily_available_hours: float = 2.0,
        focus_weak_topics: bool = True,
        include_breaks: bool = True,
        revision_frequency_days: int = 3
    ) -> StudyPlan:
        """
        Generates an adaptive, prioritized study schedule:
        1. Deactivates any existing active plan for this course.
        2. Calculates days available from today until exam_date.
        3. Ranks topics by priority:
           - Incomplete prerequisites first
           - Weak topics (mastery < 0.50) get higher study time & earlier slots
           - Hard difficulty topics prioritized
           - Already completed topics get scheduled for spaced revision
        4. Distributes tasks across daily slots matching student's daily available time.
        5. Inserts revision sessions, practice quizzes, and 10-15 min breaks.
        """
        today = datetime.date.today()
        if exam_date <= today:
            exam_date = today + datetime.timedelta(days=14)

        # Deactivate old plans
        old_plans = db.query(StudyPlan).filter(
            StudyPlan.student_id == student_id,
            StudyPlan.course_id == course_id,
            StudyPlan.is_active == True
        ).all()
        for p in old_plans:
            p.is_active = False

        plan = StudyPlan(
            student_id=student_id,
            course_id=course_id,
            exam_date=exam_date,
            daily_hours=int(daily_available_hours),
            start_date=today,
            end_date=exam_date,
            is_active=True
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

        # Get course topics & masteries
        topics = db.query(Topic).filter(Topic.course_id == course_id).order_by(Topic.order_index).all()
        if not topics:
            return plan

        masteries = db.query(StudentTopicMastery).filter(StudentTopicMastery.student_id == student_id).all()
        mastery_map = {m.topic_id: m for m in masteries}

        # Calculate topic weights and prioritization
        def get_topic_weight(t: Topic) -> float:
            m = mastery_map.get(t.id)
            score = m.mastery_score if m else 0.0
            
            # Difficulty multiplier
            diff_mult = 1.3 if t.difficulty == "hard" else (1.1 if t.difficulty == "medium" else 0.9)
            
            # Lower mastery -> higher urgency
            urgency = (1.0 - score) * 2.0
            if focus_weak_topics and score < settings.WEAK_THRESHOLD:
                urgency += 1.5

            return urgency * diff_mult

        sorted_topics = sorted(topics, key=get_topic_weight, reverse=True)

        # Daily slots setup
        daily_minutes = int(daily_available_hours * 60)
        total_days = max(1, (exam_date - today).days)
        
        current_date = today
        day_offset = 0
        topic_queue = list(sorted_topics)
        tasks_created: List[StudyTask] = []

        study_history_topics = []

        while day_offset < total_days and topic_queue:
            day_date = today + datetime.timedelta(days=day_offset)
            remaining_mins_today = daily_minutes

            # Revision check: every revision_frequency_days, insert a spaced revision task
            if day_offset > 0 and day_offset % revision_frequency_days == 0 and study_history_topics:
                rev_topic = study_history_topics.pop(0)
                tasks_created.append(StudyTask(
                    plan_id=plan.id,
                    topic_id=rev_topic.id,
                    title=f"Spaced Revision: {rev_topic.name}",
                    date=day_date,
                    duration_minutes=30,
                    priority="high",
                    task_type="revision",
                    is_completed=False,
                    notes=f"Review summary notes and formula sheet for {rev_topic.name}."
                ))
                remaining_mins_today -= 30
                study_history_topics.append(rev_topic)

            # Study tasks for today
            while remaining_mins_today >= 35 and topic_queue:
                t = topic_queue.pop(0)
                m = mastery_map.get(t.id)
                m_score = m.mastery_score if m else 0.0

                session_mins = 45 if remaining_mins_today >= 50 else remaining_mins_today
                priority_label = "high" if m_score < settings.WEAK_THRESHOLD else ("medium" if m_score < 0.75 else "low")

                tasks_created.append(StudyTask(
                    plan_id=plan.id,
                    topic_id=t.id,
                    title=f"Learn: {t.name} ({t.unit_or_chapter})",
                    date=day_date,
                    duration_minutes=session_mins,
                    priority=priority_label,
                    task_type="study",
                    is_completed=False,
                    notes=f"Read course materials, extract core principles, and solve practice questions."
                ))
                remaining_mins_today -= session_mins
                study_history_topics.append(t)

                # Optional Practice Quiz after study session if time remains
                if remaining_mins_today >= 20:
                    tasks_created.append(StudyTask(
                        plan_id=plan.id,
                        topic_id=t.id,
                        title=f"Practice Assessment: {t.name}",
                        date=day_date,
                        duration_minutes=15,
                        priority="medium",
                        task_type="practice_quiz",
                        is_completed=False,
                        notes="Complete 5 MCQs to evaluate concept retention and update mastery score."
                    ))
                    remaining_mins_today -= 15

                # Optional 10-min break
                if include_breaks and remaining_mins_today >= 10:
                    tasks_created.append(StudyTask(
                        plan_id=plan.id,
                        topic_id=None,
                        title="Cognitive Rest Break",
                        date=day_date,
                        duration_minutes=10,
                        priority="low",
                        task_type="break",
                        is_completed=False,
                        notes="Step away from the screen, hydrate, and relax your mind."
                    ))
                    remaining_mins_today -= 10

            day_offset += 1

        # Bulk save tasks
        for task in tasks_created:
            db.add(task)
        db.commit()
        db.refresh(plan)

        return plan

    @staticmethod
    def complete_task(
        db: Session,
        task_id: int,
        student_id: int,
        is_completed: bool = True,
        actual_minutes: Optional[int] = None,
        notes: Optional[str] = None
    ) -> StudyTask:
        task = db.query(StudyTask).filter(StudyTask.id == task_id).first()
        if not task:
            raise ValueError(f"Task with ID {task_id} not found.")

        task.is_completed = is_completed
        task.completed_at = datetime.datetime.utcnow() if is_completed else None
        if notes:
            task.notes = notes

        # If it's a study or revision task linked to a topic, notify learning agent!
        if is_completed and task.topic_id:
            from app.services.learning_agent import learning_agent
            duration = actual_minutes or task.duration_minutes
            activity_type = "revision_done" if task.task_type == "revision" else "studied"
            learning_agent.observe_topic_studied(
                db=db,
                student_id=student_id,
                topic_id=task.topic_id,
                duration_minutes=duration,
                activity_type=activity_type,
                notes=f"Completed study task '{task.title}'"
            )

        db.commit()
        db.refresh(task)
        return task

study_planner = StudyPlannerService()
