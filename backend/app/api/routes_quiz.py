from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.quiz import Quiz, QuizAttempt
from app.schemas.quiz import QuizGenerateRequest, QuizOut, QuizQuestionOut, QuizSubmitRequest, QuizResultOut
from app.services.quiz_service import quiz_service
from app.api.routes_profile import get_current_student

router = APIRouter(prefix="/quiz", tags=["Quizzes & Assessment"])

@router.post("/generate", response_model=QuizOut)
def generate_quiz(payload: QuizGenerateRequest, db: Session = Depends(get_db)):
    student = get_current_student(db)

    try:
        quiz = quiz_service.generate_quiz(
            db=db,
            student_id=student.id,
            topic_id=payload.topic_id,
            document_id=payload.document_id,
            num_questions=payload.num_questions or 5,
            difficulty=payload.difficulty or "medium"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

    questions_out = [
        QuizQuestionOut(
            id=q.id,
            quiz_id=q.quiz_id,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            correct_option=None,  # Conceal correct answer until submission
            explanation=None
        )
        for q in quiz.questions
    ]

    return QuizOut(
        id=quiz.id,
        topic_id=quiz.topic_id,
        topic_name=quiz.topic.name if quiz.topic else None,
        title=quiz.title,
        difficulty=quiz.difficulty,
        questions=questions_out,
        created_at=quiz.created_at
    )

@router.get("/{quiz_id}", response_model=QuizOut)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    questions_out = [
        QuizQuestionOut(
            id=q.id,
            quiz_id=q.quiz_id,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            correct_option=None,
            explanation=None
        )
        for q in quiz.questions
    ]

    return QuizOut(
        id=quiz.id,
        topic_id=quiz.topic_id,
        topic_name=quiz.topic.name if quiz.topic else None,
        title=quiz.title,
        difficulty=quiz.difficulty,
        questions=questions_out,
        created_at=quiz.created_at
    )

@router.post("/submit", response_model=QuizResultOut)
def submit_quiz(payload: QuizSubmitRequest, db: Session = Depends(get_db)):
    student = get_current_student(db)

    try:
        result = quiz_service.submit_quiz_attempt(
            db=db,
            student_id=student.id,
            quiz_id=payload.quiz_id,
            answers=payload.answers
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grading failed: {str(e)}")

    return result

@router.get("/history/attempts")
def get_quiz_attempts(db: Session = Depends(get_db)):
    student = get_current_student(db)
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.student_id == student.id)
        .order_by(QuizAttempt.date_attempted.desc())
        .limit(20)
        .all()
    )
    results = []
    for a in attempts:
        results.append({
            "id": a.id,
            "quiz_id": a.quiz_id,
            "quiz_title": a.quiz.title if a.quiz else "Quiz",
            "score": a.score,
            "total_questions": a.total_questions,
            "accuracy": a.accuracy,
            "percentage": round(a.accuracy * 100, 1),
            "date_attempted": a.date_attempted.strftime("%Y-%m-%d %H:%M"),
            "feedback": a.feedback
        })
    return results
