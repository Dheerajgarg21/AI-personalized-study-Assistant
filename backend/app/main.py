import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.services.rag_service import rag_service
from app.api import (
    routes_profile,
    routes_courses,
    routes_documents,
    routes_chat,
    routes_study_plan,
    routes_knowledge_map,
    routes_quiz,
    routes_progress,
    routes_recommendations,
    routes_demo,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)

    # Initialize RAG vector store from database chunks
    db = SessionLocal()
    try:
        rag_service.initialize_from_db(db)
        
        # Check if database is completely empty; if so, automatically seed initial demo data
        from app.models.student import Student
        from app.models.course import Course
        if not db.query(Course).first():
            logger.info("Empty database detected. Auto-seeding initial curriculum demo data...")
            routes_demo.seed_demo_data(db)
    finally:
        db.close()

    logger.info(f"{settings.PROJECT_NAME} initialized successfully.")
    yield
    logger.info("Application shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent AI study assistant that models student learning states, generates adaptive study plans, represents knowledge graphs, and performs RAG QA on notes.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(routes_profile.router, prefix=settings.API_V1_STR)
app.include_router(routes_courses.router, prefix=settings.API_V1_STR)
app.include_router(routes_documents.router, prefix=settings.API_V1_STR)
app.include_router(routes_chat.router, prefix=settings.API_V1_STR)
app.include_router(routes_study_plan.router, prefix=settings.API_V1_STR)
app.include_router(routes_knowledge_map.router, prefix=settings.API_V1_STR)
app.include_router(routes_quiz.router, prefix=settings.API_V1_STR)
app.include_router(routes_progress.router, prefix=settings.API_V1_STR)
app.include_router(routes_recommendations.router, prefix=settings.API_V1_STR)
app.include_router(routes_demo.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "rag_chunks_loaded": len(rag_service.vector_store.chunks_metadata) if hasattr(rag_service, "vector_store") else 0,
        "mock_ai": settings.USE_MOCK_AI
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
