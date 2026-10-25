import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Based Personalized Study Assistant"
    API_V1_STR: str = "/api"
    
    # Storage & Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/study_assistant.db"
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    
    # RAG & AI Configuration
    USE_MOCK_AI: bool = True
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    AI_PROVIDER: str = "auto"  # 'openai', 'gemini', 'mock'
    
    # Vector Search Parameters
    RETRIEVAL_TOP_K: int = 4
    SIMILARITY_THRESHOLD: float = 0.15  # For TF-IDF / cosine metric
    CHUNK_SIZE: int = 600
    CHUNK_OVERLAP: int = 100
    
    # Adaptive Agent Settings
    MASTERY_DECAY_DAYS: int = 5
    WEAK_THRESHOLD: float = 0.50
    STRONG_THRESHOLD: float = 0.80

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
