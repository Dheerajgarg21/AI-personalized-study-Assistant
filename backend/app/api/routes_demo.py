import os
import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.student import Student, StudentTopicMastery, LearningActivityHistory
from app.models.course import Course, Topic, TopicPrerequisite
from app.models.document import UploadedDocument, DocumentChunk
from app.models.study_plan import StudyPlan, StudyTask
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt
from app.services.rag_service import rag_service
from app.config import settings

router = APIRouter(prefix="/demo", tags=["Demo Mode & Seeding"])

SAMPLE_NOTES_TEXT = """COMPUTER NETWORKS - LECTURE NOTES & EXAM COMPENDIUM
Course Code: CS301 | Instructor: Dr. Evelyn Vance | University Department of CSE

================================================================================
UNIT 1: NETWORK FUNDAMENTALS & TOPOLOGIES
================================================================================
A computer network is an interconnected collection of autonomous computers capable of exchanging information.
Networks are classified geographically:
- LAN (Local Area Network): High data transfer rate (10 Mbps to 10 Gbps), low propagation delay, private ownership. Typical range within 1 km (campus or office).
- MAN (Metropolitan Area Network): Spans a town or city (5-50 km), such as cable TV networks.
- WAN (Wide Area Network): Spans countries or continents using satellite links and long-distance fiber. The Internet is the premier WAN.

Network Topologies:
1. Star Topology: All nodes connect to a central hub/switch. Easy to install and isolate faults. If the central switch fails, the entire network fails.
2. Bus Topology: All nodes share a common backbone coaxial cable with terminators at both ends. Susceptible to collisions and cable cuts.
3. Ring Topology: Each device is connected in a point-to-point ring. Uses token passing to prevent collisions.
4. Mesh Topology: Every node connects to every other node via dedicated point-to-point links (n*(n-1)/2 links). Provides maximum fault tolerance and privacy, but incurs high cabling costs.

================================================================================
UNIT 2: NETWORK MODELS (OSI & TCP/IP)
================================================================================
The OSI (Open Systems Interconnection) 7-Layer Architecture:
- Layer 7: Application Layer (HTTP, FTP, SMTP, DNS) - user interface and network services.
- Layer 6: Presentation Layer - Data translation, encryption/decryption (SSL/TLS), and compression.
- Layer 5: Session Layer - Dialogue control, synchronization tokens, and session checkpointing.
- Layer 4: Transport Layer (TCP, UDP) - End-to-end reliability, port addressing, flow control (sliding window), and error recovery.
- Layer 3: Network Layer (IP, ICMP, Routing Protocols) - Logical addressing (IPv4/IPv6), packet forwarding, routing decisions, and path determination.
- Layer 2: Data Link Layer - Framing, physical MAC addressing, hop-to-hop flow control, and error detection (CRC).
- Layer 1: Physical Layer - Bit-level transmission over raw physical medium (voltage levels, connectors, optical pulses).

TCP/IP Model Architecture:
The TCP/IP suite compresses OSI into 4 layers:
1. Application Layer (Combines OSI Application, Presentation, Session)
2. Transport Layer (Host-to-Host: TCP for connection-oriented stream, UDP for connectionless datagram)
3. Internet Layer (IP, ICMP, ARP - packet routing)
4. Network Access Layer (Combines Data Link and Physical - handles physical frames and Ethernet)

================================================================================
UNIT 3: DATA LINK LAYER & ERROR CONTROL
================================================================================
The Data Link Layer transforms raw bit transmission into a reliable link by packing data into Frames.
Error Control Mechanisms:
1. Parity Check: Appends a parity bit to achieve even or odd number of 1s. Can only detect odd numbers of bit errors; fails on double bit flips.
2. Checksum: Generator sums 16-bit words using one's complement arithmetic and sends the complemented checksum.
3. Cyclic Redundancy Check (CRC):
   - Powerful polynomial code error detection.
   - Both sender and receiver agree on a generator polynomial G(x) of degree r.
   - At sender: Append r zeros to the data block D. Divide (D * 2^r) by G(x) using modulo-2 arithmetic (XOR subtraction).
   - The remainder R is appended to D as the Frame Check Sequence (FCS).
   - At receiver: Divide received frame by G(x). If remainder is exactly 0, no error is detected. If non-zero, frame is corrupted.
4. Hamming Code (Error Correction):
   - Developed by Richard Hamming. Detects double-bit errors and corrects single-bit errors.
   - Parity bits are positioned at powers of 2 (positions 1, 2, 4, 8, 16...).
   - Hamming distance d_min: To detect d errors, d_min >= d + 1. To correct t errors, d_min >= 2t + 1.

================================================================================
UNIT 4: NETWORK LAYER & IP ADDRESSING
================================================================================
IPv4 Address Structure:
An IPv4 address is 32 bits long, partitioned into 4 octets written in dotted decimal format (e.g., 192.168.1.1).
Classful Addressing:
- Class A: 0.0.0.0 to 127.255.255.255 (Mask /8) - 16 million hosts per net.
- Class B: 128.0.0.0 to 191.255.255.255 (Mask /16) - 65,534 hosts per net.
- Class C: 192.0.0.0 to 223.255.255.255 (Mask /24) - 254 hosts per net.
- Class D: 224.0.0.0 to 239.255.255.255 - Multicast.
- Class E: 240.0.0.0 to 255.255.255.255 - Experimental.

CIDR (Classless Inter-Domain Routing) & Subnetting:
Subnetting divides a larger network into smaller, broadcast-isolated logical subnetworks.
Prefix notation /n designates that the highest n bits are network bits, leaving 32 - n bits for host addresses.
Formula:
- Total addresses per subnet = 2^(32 - n)
- Usable host addresses = 2^(32 - n) - 2 (subtract Network ID and Directed Broadcast address).
Example: Subnet /26 provides 2^6 = 64 total addresses, with 62 usable host nodes.
"""

@router.post("/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    """
    Seeds comprehensive demo state for the application:
    - Student: Alex Morgan
    - Course: Computer Networks (CS301)
    - 10 Topics with structured DAG prerequisites
    - Realistic mastery scores and statuses
    - Sample textbook document indexed into RAG
    - Historical quiz attempts
    - Active 14-day study plan with scheduled tasks
    """
    # 1. Student setup
    student = db.query(Student).first()
    if not student:
        student = Student(
            name="Alex Morgan",
            course_name="B.Tech Computer Science & Engineering",
            learning_level="Intermediate",
            daily_available_time=120,
            study_goals="Master Computer Networks, score >85% in semester finals",
            current_streak=5
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    else:
        student.name = "Alex Morgan"
        student.course_name = "B.Tech Computer Science & Engineering"
        student.learning_level = "Intermediate"
        student.daily_available_time = 120
        student.current_streak = 5
        db.commit()

    # 2. Course setup
    course = db.query(Course).filter(Course.code == "CS301").first()
    if not course:
        course = Course(
            title="Computer Networks",
            code="CS301",
            description="Comprehensive university curriculum covering physical layering, data link framing, error control, routing, and TCP/IP architecture."
        )
        db.add(course)
        db.commit()
        db.refresh(course)

    # 3. Topics definition
    topics_spec = [
        ("Network Fundamentals", "Unit 1", "Autonomous systems, transmission media, LAN, MAN, WAN definitions.", "easy", 45, 1),
        ("Types of Networks", "Unit 1", "LAN vs MAN vs WAN geographic coverage, delay characteristics, topologies.", "easy", 45, 2),
        ("Network Topologies", "Unit 1", "Star, Bus, Ring, and Full Mesh topological trade-offs and fault domains.", "easy", 50, 3),
        ("OSI Reference Model", "Unit 2", "7-layer ISO/OSI architecture, encapsulation, PDUs, and protocol separation.", "medium", 60, 4),
        ("TCP/IP Protocol Architecture", "Unit 2", "4-layer DoD Internet model, comparison with OSI, TCP vs UDP differences.", "medium", 60, 5),
        ("Data Link Layer Framing", "Unit 3", "Character count, byte stuffing, bit stuffing flags, and frame synchronization.", "medium", 55, 6),
        ("Error Detection & CRC", "Unit 3", "Cyclic Redundancy Check modulo-2 arithmetic, generator polynomials, parity check.", "hard", 75, 7),
        ("Hamming Code & Correction", "Unit 3", "Hamming distance theorem, parity bit placement at powers of 2, error syndroming.", "hard", 80, 8),
        ("Network Layer & IP Addressing", "Unit 4", "IPv4 header structure, classful addressing, TTL, and logical routing principles.", "medium", 65, 9),
        ("Subnetting & CIDR", "Unit 4", "Subnet mask calculations, variable length subnet masking (VLSM), prefix lengths.", "hard", 90, 10),
    ]

    existing_topics = db.query(Topic).filter(Topic.course_id == course.id).all()
    topic_map = {t.name: t for t in existing_topics}

    for name, unit, desc, diff, mins, order in topics_spec:
        if name not in topic_map:
            t = Topic(
                course_id=course.id,
                name=name,
                unit_or_chapter=unit,
                description=desc,
                difficulty=diff,
                estimated_minutes=mins,
                order_index=order
            )
            db.add(t)
            db.commit()
            db.refresh(t)
            topic_map[name] = t

    # 4. Prerequisites setup (DAG)
    prereq_pairs = [
        ("Types of Networks", "Network Fundamentals"),
        ("Network Topologies", "Network Fundamentals"),
        ("OSI Reference Model", "Network Topologies"),
        ("TCP/IP Protocol Architecture", "OSI Reference Model"),
        ("Data Link Layer Framing", "TCP/IP Protocol Architecture"),
        ("Error Detection & CRC", "Data Link Layer Framing"),
        ("Hamming Code & Correction", "Error Detection & CRC"),
        ("Network Layer & IP Addressing", "TCP/IP Protocol Architecture"),
        ("Subnetting & CIDR", "Network Layer & IP Addressing"),
    ]

    for topic_name, prereq_name in prereq_pairs:
        t_obj = topic_map.get(topic_name)
        p_obj = topic_map.get(prereq_name)
        if t_obj and p_obj:
            exists = db.query(TopicPrerequisite).filter(
                TopicPrerequisite.topic_id == t_obj.id,
                TopicPrerequisite.prerequisite_id == p_obj.id
            ).first()
            if not exists:
                db.add(TopicPrerequisite(topic_id=t_obj.id, prerequisite_id=p_obj.id))

    db.commit()

    # 5. Mastery setup (Realistic initial states)
    # Give student strong mastery on Fundamentals, weak on CRC, locked/new on Subnetting
    now = datetime.datetime.utcnow()
    mastery_presets = {
        "Network Fundamentals": (0.90, 0.85, 0.90, now - datetime.timedelta(days=2), False, "completed"),
        "Types of Networks": (0.85, 0.80, 0.80, now - datetime.timedelta(days=3), False, "completed"),
        "Network Topologies": (0.82, 0.75, 0.80, now - datetime.timedelta(days=4), False, "completed"),
        "OSI Reference Model": (0.75, 0.70, 0.70, now - datetime.timedelta(days=1), False, "in_progress"),
        "TCP/IP Protocol Architecture": (0.65, 0.60, 0.70, now - datetime.timedelta(days=6), True, "needs_revision"),
        "Data Link Layer Framing": (0.60, 0.55, 0.60, now - datetime.timedelta(days=2), False, "in_progress"),
        "Error Detection & CRC": (0.42, 0.40, 0.40, now - datetime.timedelta(days=1), True, "needs_revision"),
        "Hamming Code & Correction": (0.20, 0.30, 0.00, None, False, "not_started"),
        "Network Layer & IP Addressing": (0.10, 0.20, 0.00, None, False, "not_started"),
        "Subnetting & CIDR": (0.00, 0.20, 0.00, None, False, "not_started"),
    }

    for t_name, (score, conf, q_acc, last_st, rev_need, stat) in mastery_presets.items():
        t = topic_map.get(t_name)
        if not t:
            continue
        m = db.query(StudentTopicMastery).filter(
            StudentTopicMastery.student_id == student.id,
            StudentTopicMastery.topic_id == t.id
        ).first()
        if not m:
            m = StudentTopicMastery(
                student_id=student.id,
                topic_id=t.id,
                mastery_score=score,
                confidence=conf,
                quiz_accuracy=q_acc,
                last_studied=last_st,
                revision_needed=rev_need,
                status=stat
            )
            db.add(m)
        else:
            m.mastery_score = score
            m.confidence = conf
            m.quiz_accuracy = q_acc
            m.last_studied = last_st
            m.revision_needed = rev_need
            m.status = stat

    db.commit()

    # 6. Sample uploaded document & RAG indexing
    doc_path = os.path.join(settings.UPLOAD_DIR, "Computer_Networks_Unit2_and_3_Notes.txt")
    with open(doc_path, "w", encoding="utf-8") as f:
        f.write(SAMPLE_NOTES_TEXT)

    existing_doc = db.query(UploadedDocument).filter(
        UploadedDocument.student_id == student.id,
        UploadedDocument.filename == "Computer_Networks_Unit2_and_3_Notes.txt"
    ).first()

    if not existing_doc:
        try:
            rag_service.process_and_index_document(
                db=db,
                student_id=student.id,
                course_id=course.id,
                filename="Computer_Networks_Unit2_and_3_Notes.txt",
                file_path=doc_path,
                file_type="txt",
                file_size=len(SAMPLE_NOTES_TEXT.encode("utf-8"))
            )
        except Exception as e:
            pass
    else:
        rag_service.initialize_from_db(db)

    # 7. Sample Quiz Attempt for CRC
    crc_topic = topic_map.get("Error Detection & CRC")
    if crc_topic:
        sample_quiz = db.query(Quiz).filter(Quiz.topic_id == crc_topic.id).first()
        if not sample_quiz:
            from app.services.quiz_service import quiz_service
            sample_quiz = quiz_service.generate_quiz(
                db=db,
                student_id=student.id,
                topic_id=crc_topic.id,
                num_questions=5,
                difficulty="hard"
            )
        
        attempt_exists = db.query(QuizAttempt).filter(
            QuizAttempt.student_id == student.id,
            QuizAttempt.quiz_id == sample_quiz.id
        ).first()

        if not attempt_exists:
            db.add(QuizAttempt(
                student_id=student.id,
                quiz_id=sample_quiz.id,
                score=2,
                total_questions=5,
                accuracy=0.40,
                feedback="Need revision: You scored 2/5 (40.0%). Review the simplified concept summary in AI Chat before re-testing."
            ))
            db.commit()

    # 8. Sample 14-day Study Plan
    today = datetime.date.today()
    exam_date = today + datetime.timedelta(days=14)
    from app.services.study_planner import study_planner
    study_planner.generate_plan(
        db=db,
        student_id=student.id,
        course_id=course.id,
        exam_date=exam_date,
        daily_available_hours=2.0,
        focus_weak_topics=True,
        include_breaks=True,
        revision_frequency_days=3
    )

    return {
        "message": "Demo data successfully seeded!",
        "student": student.name,
        "course": course.title,
        "topics_count": len(topic_map),
        "exam_date": exam_date.strftime("%Y-%m-%d")
    }
