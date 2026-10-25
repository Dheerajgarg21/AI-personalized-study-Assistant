from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class QuizQuestionOut(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    # Omit correct_option when taking the quiz!
    correct_option: Optional[str] = None
    explanation: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class QuizGenerateRequest(BaseModel):
    topic_id: Optional[int] = None
    document_id: Optional[int] = None
    num_questions: int = 5
    difficulty: str = "medium"  # easy, medium, hard


class QuizOut(BaseModel):
    id: int
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    title: str
    difficulty: str
    questions: List[QuizQuestionOut]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuizSubmitRequest(BaseModel):
    quiz_id: int
    # mapping of question_id (as str or int) -> selected_option ("A", "B", "C", "D")
    answers: Dict[str, str]


class QuestionReview(BaseModel):
    question_id: int
    question_text: str
    options: Dict[str, str]
    user_answer: Optional[str]
    correct_answer: str
    is_correct: bool
    explanation: Optional[str]


class QuizResultOut(BaseModel):
    attempt_id: int
    quiz_id: int
    topic_id: Optional[int]
    score: int
    total_questions: int
    accuracy: float
    percentage: float
    feedback: str
    learning_state_update: Optional[dict] = None
    recommended_action: str
    reviews: List[QuestionReview]
