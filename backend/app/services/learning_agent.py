import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.student import Student, StudentTopicMastery, LearningActivityHistory
from app.models.course import Topic, TopicPrerequisite
from app.config import settings

class AdaptiveLearningAgent:
    """
    Adaptive Learning Agent that models the student's state,
    observes activity and quiz performance, updates mastery,
    detects knowledge gaps and prerequisite bottlenecks,
    and recommends the optimal next pedagogical actions.
    """

    @staticmethod
    def get_or_create_mastery(db: Session, student_id: int, topic_id: int) -> StudentTopicMastery:
        mastery = (
            db.query(StudentTopicMastery)
            .filter(StudentTopicMastery.student_id == student_id, StudentTopicMastery.topic_id == topic_id)
            .first()
        )
        if not mastery:
            mastery = StudentTopicMastery(
                student_id=student_id,
                topic_id=topic_id,
                mastery_score=0.0,
                confidence=0.4,
                last_studied=None,
                quiz_accuracy=0.0,
                revision_needed=False,
                status="not_started"
            )
            db.add(mastery)
            db.commit()
            db.refresh(mastery)
        return mastery

    @staticmethod
    def observe_quiz_result(
        db: Session,
        student_id: int,
        topic_id: int,
        score: int,
        total_questions: int,
        accuracy: float,
        quiz_id: int
    ) -> Dict[str, Any]:
        """
        Observes a quiz submission:
        - Updates exponential moving average of mastery
        - Calibrates confidence
        - Logs learning activity
        - Evaluates follow-up action
        """
        mastery = AdaptiveLearningAgent.get_or_create_mastery(db, student_id, topic_id)
        now = datetime.datetime.utcnow()

        old_mastery = mastery.mastery_score
        # Exponential update: new mastery combines previous score (40%) and new quiz performance (60%)
        alpha = 0.40
        new_mastery = (alpha * old_mastery) + ((1.0 - alpha) * accuracy)
        new_mastery = round(max(0.0, min(1.0, new_mastery)), 2)

        # Confidence increases with active testing
        new_confidence = round(min(1.0, mastery.confidence + 0.15), 2)

        # Update mastery record
        mastery.mastery_score = new_mastery
        mastery.confidence = new_confidence
        mastery.quiz_accuracy = round(accuracy, 2)
        mastery.last_studied = now
        mastery.revision_needed = False

        if new_mastery >= settings.STRONG_THRESHOLD:
            mastery.status = "completed"
        elif new_mastery >= settings.WEAK_THRESHOLD:
            mastery.status = "in_progress"
        else:
            mastery.status = "needs_revision"

        # Record activity
        activity = LearningActivityHistory(
            student_id=student_id,
            topic_id=topic_id,
            activity_type="quiz_taken",
            score=round(accuracy * 100, 1),
            duration_minutes=15,
            notes=f"Quiz completed: {score}/{total_questions} ({int(accuracy * 100)}%). Mastery updated from {old_mastery:.2f} to {new_mastery:.2f}."
        )
        db.add(activity)
        db.commit()
        db.refresh(mastery)

        # Agent decision
        action_recommendation = AdaptiveLearningAgent._decide_post_quiz_action(accuracy, mastery)

        return {
            "topic_id": topic_id,
            "old_mastery": old_mastery,
            "new_mastery": new_mastery,
            "accuracy": accuracy,
            "status": mastery.status,
            "recommended_action": action_recommendation
        }

    @staticmethod
    def observe_topic_studied(
        db: Session,
        student_id: int,
        topic_id: int,
        duration_minutes: int = 45,
        activity_type: str = "studied",
        notes: Optional[str] = None
    ) -> StudentTopicMastery:
        """
        Observes study session completion or task completion.
        """
        mastery = AdaptiveLearningAgent.get_or_create_mastery(db, student_id, topic_id)
        now = datetime.datetime.utcnow()

        # Studying provides incremental mastery boost if not already high
        old_mastery = mastery.mastery_score
        boost = 0.20 if mastery.status == "not_started" else 0.12
        new_mastery = round(min(1.0, old_mastery + boost), 2)
        new_confidence = round(min(1.0, mastery.confidence + 0.10), 2)

        mastery.mastery_score = new_mastery
        mastery.confidence = new_confidence
        mastery.last_studied = now
        mastery.revision_needed = False

        if new_mastery >= settings.STRONG_THRESHOLD:
            mastery.status = "completed"
        else:
            mastery.status = "in_progress"

        # Log activity
        activity = LearningActivityHistory(
            student_id=student_id,
            topic_id=topic_id,
            activity_type=activity_type,
            score=None,
            duration_minutes=duration_minutes,
            notes=notes or f"Completed study session on topic. Mastery rose from {old_mastery:.2f} to {new_mastery:.2f}."
        )
        db.add(activity)
        db.commit()
        db.refresh(mastery)
        return mastery

    @staticmethod
    def evaluate_learning_state(db: Session, student_id: int) -> List[Dict[str, Any]]:
        """
        Returns structured learning states for all topics for this student.
        Applies time decay if last studied > MASTERY_DECAY_DAYS ago.
        """
        masteries = db.query(StudentTopicMastery).filter(StudentTopicMastery.student_id == student_id).all()
        now = datetime.datetime.utcnow()
        states = []

        for m in masteries:
            topic = db.query(Topic).filter(Topic.id == m.topic_id).first()
            if not topic:
                continue

            # Decay check
            revision_needed = m.revision_needed
            if m.last_studied:
                days_since = (now - m.last_studied).days
                if days_since >= settings.MASTERY_DECAY_DAYS and m.mastery_score < 0.85:
                    revision_needed = True
                    if m.status == "completed":
                        m.status = "needs_revision"
                    m.revision_needed = True

            state = {
                "topic": topic.name,
                "topic_id": topic.id,
                "unit": topic.unit_or_chapter,
                "mastery_score": round(m.mastery_score, 2),
                "confidence": round(m.confidence, 2),
                "last_studied": m.last_studied.strftime("%Y-%m-%d") if m.last_studied else None,
                "quiz_accuracy": round(m.quiz_accuracy, 2),
                "revision_needed": revision_needed,
                "status": m.status
            }
            states.append(state)

        db.commit()
        return states

    @staticmethod
    def _decide_post_quiz_action(accuracy: float, mastery: StudentTopicMastery) -> str:
        """Rule-based pedagogical policy engine"""
        if accuracy < 0.50:
            return "review_concept"
        elif 0.50 <= accuracy < 0.80:
            return "targeted_practice"
        else:
            return "advance_topic"

    @staticmethod
    def generate_recommendations(db: Session, student_id: int, course_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Analyzes knowledge graph, prerequisite chains, and student state to generate
        personalized, explainable recommendations.
        """
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return []

        # Get all topics for the course
        query = db.query(Topic)
        if course_id:
            query = query.filter(Topic.course_id == course_id)
        topics = query.order_by(Topic.order_index).all()

        if not topics:
            return []

        mastery_map = {}
        for m in db.query(StudentTopicMastery).filter(StudentTopicMastery.student_id == student_id).all():
            mastery_map[m.topic_id] = m

        recommendations = []

        # 1. Check for Weak Topics needing immediate review (Accuracy < 50% or Mastery < 0.40)
        for t in topics:
            m = mastery_map.get(t.id)
            if m and (m.mastery_score < settings.WEAK_THRESHOLD or m.status == "needs_revision") and m.mastery_score > 0.05:
                recommendations.append({
                    "id": f"rec-weak-{t.id}",
                    "action_type": "review_concept",
                    "topic_id": t.id,
                    "topic_name": t.name,
                    "priority": "urgent",
                    "title": f"Review Core Concepts: {t.name}",
                    "description": f"Your current mastery is only {int(m.mastery_score * 100)}% (Quiz accuracy: {int(m.quiz_accuracy * 100)}%). Reviewing notes now prevents compounding difficulties.",
                    "reason": f"Agent identified quiz accuracy below {int(settings.WEAK_THRESHOLD * 100)}% threshold.",
                    "action_payload": {"topic_id": t.id, "suggested_mode": "simple"}
                })

        # 2. Check for Revision Needed due to time decay
        for t in topics:
            m = mastery_map.get(t.id)
            if m and m.revision_needed:
                recommendations.append({
                    "id": f"rec-rev-{t.id}",
                    "action_type": "schedule_revision",
                    "topic_id": t.id,
                    "topic_name": t.name,
                    "priority": "high",
                    "title": f"Spaced Revision Due: {t.name}",
                    "description": f"It has been over {settings.MASTERY_DECAY_DAYS} days since you last reviewed this topic. A quick 15-minute refresher will consolidate retention.",
                    "reason": "Spaced repetition decay threshold reached.",
                    "action_payload": {"topic_id": t.id, "suggested_mode": "summary"}
                })

        # 3. Check for Targeted Practice (50% <= accuracy < 80%)
        for t in topics:
            m = mastery_map.get(t.id)
            if m and (0.50 <= m.quiz_accuracy < 0.80) and m.mastery_score >= settings.WEAK_THRESHOLD:
                recommendations.append({
                    "id": f"rec-prac-{t.id}",
                    "action_type": "targeted_practice",
                    "topic_id": t.id,
                    "topic_name": t.name,
                    "priority": "medium",
                    "title": f"Take Targeted Practice Quiz: {t.name}",
                    "description": f"You scored {int(m.quiz_accuracy * 100)}% on your last attempt. An intermediate practice quiz will push your mastery above 80%.",
                    "reason": "Mid-tier accuracy achieved; targeted practice reinforces key problem areas.",
                    "action_payload": {"topic_id": t.id, "difficulty": "medium"}
                })

        # 4. Check for Prerequisite Violations and Recommend Next Unlocked Topic
        next_topic = None
        for t in topics:
            m = mastery_map.get(t.id)
            current_m = m.mastery_score if m else 0.0

            if current_m >= settings.STRONG_THRESHOLD:
                continue

            # Check prerequisites
            prereqs = db.query(TopicPrerequisite).filter(TopicPrerequisite.topic_id == t.id).all()
            unmet_prereqs = []
            for p in prereqs:
                pm = mastery_map.get(p.prerequisite_id)
                if not pm or pm.mastery_score < settings.WEAK_THRESHOLD:
                    prereq_obj = db.query(Topic).filter(Topic.id == p.prerequisite_id).first()
                    unmet_prereqs.append(prereq_obj.name if prereq_obj else f"Topic {p.prerequisite_id}")

            if unmet_prereqs:
                if current_m > 0:
                    recommendations.append({
                        "id": f"rec-prereq-{t.id}",
                        "action_type": "prerequisite_warning",
                        "topic_id": t.id,
                        "topic_name": t.name,
                        "priority": "high",
                        "title": f"Missing Prerequisite: Complete {unmet_prereqs[0]} first",
                        "description": f"To master {t.name}, you need solid foundation in {', '.join(unmet_prereqs)}. Current prerequisite mastery is below threshold.",
                        "reason": "Knowledge graph dependency requirement not satisfied.",
                        "action_payload": {"prerequisite_names": unmet_prereqs}
                    })
            else:
                if not next_topic:
                    next_topic = t

        # If eligible next topic found, recommend advancing
        if next_topic:
            m = mastery_map.get(next_topic.id)
            recommendations.append({
                "id": f"rec-next-{next_topic.id}",
                "action_type": "advance_topic",
                "topic_id": next_topic.id,
                "topic_name": next_topic.name,
                "priority": "high",
                "title": f"Next Recommended Step: Study {next_topic.name}",
                "description": f"All prerequisites are satisfied! Begin studying {next_topic.unit_or_chapter}: {next_topic.name} ({next_topic.difficulty.capitalize()} difficulty).",
                "reason": "Topic has all prerequisites satisfied and is ready for learning.",
                "action_payload": {"topic_id": next_topic.id, "unit": next_topic.unit_or_chapter}
            })

        return recommendations

learning_agent = AdaptiveLearningAgent()
