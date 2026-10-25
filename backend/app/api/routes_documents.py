import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.document import UploadedDocument, DocumentChunk
from app.models.course import Course
from app.schemas.document import DocumentOut, DocumentUploadResponse
from app.services.rag_service import rag_service
from app.api.routes_profile import get_current_student
from app.config import settings

router = APIRouter(prefix="/documents", tags=["Documents & RAG"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md"}

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    course_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    student = get_current_student(db)

    # 1. Validate file extension
    filename = file.filename or "uploaded_document.txt"
    file_ext = os.path.splitext(filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats: PDF, DOCX, TXT."
        )

    # 2. Check course if provided
    if course_id:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            course_id = None

    # 3. Save uploaded file to disk
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    saved_path = os.path.join(settings.UPLOAD_DIR, f"{student.id}_{filename}")
    
    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(saved_path)
    if file_size == 0:
        os.remove(saved_path)
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    # 4. Ingest and index
    try:
        doc = rag_service.process_and_index_document(
            db=db,
            student_id=student.id,
            course_id=course_id,
            filename=filename,
            file_path=saved_path,
            file_type=file_ext.replace(".", ""),
            file_size=file_size
        )
    except Exception as e:
        if os.path.exists(saved_path):
            os.remove(saved_path)
        raise HTTPException(status_code=500, detail=f"Failed to process and index document: {str(e)}")

    return DocumentUploadResponse(
        document=doc,
        message=f"Successfully extracted and indexed {doc.chunk_count} chunks from '{filename}'.",
        chunks_extracted=doc.chunk_count
    )

@router.get("", response_model=List[DocumentOut])
def list_documents(db: Session = Depends(get_db)):
    student = get_current_student(db)
    docs = (
        db.query(UploadedDocument)
        .filter(UploadedDocument.student_id == student.id)
        .order_by(UploadedDocument.upload_date.desc())
        .all()
    )
    return docs

@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    student = get_current_student(db)
    doc = db.query(UploadedDocument).filter(
        UploadedDocument.id == document_id,
        UploadedDocument.student_id == student.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()

    # Refresh vector store from remaining database chunks
    rag_service.initialize_from_db(db)

    return {"message": f"Document '{doc.filename}' deleted successfully."}
