from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.course import Course, Topic, TopicPrerequisite
from app.models.student import StudentTopicMastery
from app.config import settings

class KnowledgeGraphService:
    @staticmethod
    def get_course_knowledge_map(db: Session, course_id: int, student_id: int) -> Dict[str, Any]:
        """
        Builds graph nodes and edges representing the curriculum and student mastery state.
        Determines node states:
        - 'completed': mastery >= STRONG_THRESHOLD
        - 'weak': mastery > 0 and mastery < WEAK_THRESHOLD
        - 'in_progress': WEAK_THRESHOLD <= mastery < STRONG_THRESHOLD
        - 'locked': unmet prerequisites (any prerequisite mastery < WEAK_THRESHOLD)
        - 'not_started': ready to study, prerequisites satisfied, but mastery == 0
        """
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise ValueError(f"Course with ID {course_id} not found.")

        topics = db.query(Topic).filter(Topic.course_id == course_id).order_by(Topic.order_index).all()
        topic_map = {t.id: t for t in topics}

        masteries = db.query(StudentTopicMastery).filter(StudentTopicMastery.student_id == student_id).all()
        mastery_map = {m.topic_id: m for m in masteries}

        prereqs = (
            db.query(TopicPrerequisite)
            .join(Topic, TopicPrerequisite.topic_id == Topic.id)
            .filter(Topic.course_id == course_id)
            .all()
        )

        prereq_graph: Dict[int, List[int]] = {t.id: [] for t in topics}
        for p in prereqs:
            prereq_graph[p.topic_id].append(p.prerequisite_id)

        nodes = []
        edges = []

        completed_count = 0
        weak_count = 0
        in_progress_count = 0
        locked_count = 0
        not_started_count = 0

        for topic in topics:
            m = mastery_map.get(topic.id)
            mastery_score = m.mastery_score if m else 0.0
            confidence = m.confidence if m else 0.5
            topic_prereqs = prereq_graph.get(topic.id, [])

            # Check if any prerequisite is unmet
            has_unmet_prereq = False
            for pid in topic_prereqs:
                pm = mastery_map.get(pid)
                if not pm or pm.mastery_score < settings.WEAK_THRESHOLD:
                    has_unmet_prereq = True
                    break

            # Status determination
            if mastery_score >= settings.STRONG_THRESHOLD:
                status = "completed"
                completed_count += 1
            elif has_unmet_prereq and mastery_score == 0:
                status = "locked"
                locked_count += 1
            elif mastery_score > 0 and (mastery_score < settings.WEAK_THRESHOLD or (m and m.status == "needs_revision")):
                status = "weak"
                weak_count += 1
            elif mastery_score >= settings.WEAK_THRESHOLD:
                status = "in_progress"
                in_progress_count += 1
            else:
                status = "not_started"
                not_started_count += 1

            nodes.append({
                "id": str(topic.id),
                "topic_id": topic.id,
                "name": topic.name,
                "unit": topic.unit_or_chapter,
                "difficulty": topic.difficulty,
                "mastery_score": round(mastery_score, 2),
                "confidence": round(confidence, 2),
                "status": status,
                "prerequisites": topic_prereqs,
                "estimated_minutes": topic.estimated_minutes
            })

        for p in prereqs:
            if p.prerequisite_id in topic_map and p.topic_id in topic_map:
                edges.append({
                    "source": str(p.prerequisite_id),
                    "target": str(p.topic_id),
                    "label": "prerequisite_of"
                })

        return {
            "course_id": course.id,
            "course_title": course.title,
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "total_topics": len(topics),
                "completed": completed_count,
                "in_progress": in_progress_count,
                "weak": weak_count,
                "locked": locked_count,
                "not_started": not_started_count
            }
        }

knowledge_graph_service = KnowledgeGraphService()
