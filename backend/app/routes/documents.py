import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.config import settings
from app.database.database import get_db
from app.database.models import User, UploadedDocument, DocumentSummary, LearningProgress
from app.schemas.models import DocumentAnalysisResponse, ChatRequest, ChatResponse
from app.services.document_parser import DocumentParserService
from app.services.ai_service import AIService

router = APIRouter(prefix="/documents", tags=["Document Analyzer & OCR"])

@router.post("/upload", response_model=DocumentAnalysisResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Validate extension
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ["pdf", "jpg", "jpeg", "png", "txt"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported format. Please upload a PDF, JPG, PNG, or TXT file."
        )

    # Save to upload dir
    user = db.query(User).first()
    user_id = user.id if user else "user_default"
    save_filename = f"{user_id}_{file.filename}"
    save_path = os.path.join(settings.UPLOAD_DIR, save_filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text using PyMuPDF / OCR
    extracted_text = DocumentParserService.extract_text_from_file(save_path, ext)

    # Persist in DB
    uploaded_doc = UploadedDocument(
        user_id=user_id,
        filename=save_filename,
        original_filename=file.filename,
        file_type=ext,
        extracted_text=extracted_text,
        is_processed=True
    )
    db.add(uploaded_doc)
    db.flush()

    # Analyze biomarkers & reference intervals
    analysis = DocumentParserService.analyze_document_content(
        text=extracted_text,
        filename=file.filename,
        document_id=uploaded_doc.id
    )

    # Save summary
    summary_record = DocumentSummary(
        document_id=uploaded_doc.id,
        document_type=analysis.document_type,
        report_date=analysis.report_date,
        summary=analysis.summary,
        tests=[t.dict() for t in analysis.tests],
        identified_terms=analysis.identified_terms,
        questions_for_doctor=analysis.questions_for_doctor
    )
    db.add(summary_record)

    # Update user learning progress
    if user and user.learning_progress:
        user.learning_progress.reports_simplified_count += 1

    db.commit()

    return analysis

@router.get("/sample/{sample_id}", response_model=DocumentAnalysisResponse)
def get_sample_report_endpoint(sample_id: str):
    """
    Provides pre-validated, educational sample laboratory panels (e.g. lipid_metabolic or cbc_anemia) for instant testing.
    """
    return DocumentParserService.get_sample_report(sample_id)

@router.post("/chat", response_model=ChatResponse)
def chat_about_document(req: ChatRequest, db: Session = Depends(get_db)):
    doc_context = ""
    if req.document_id:
        doc = db.query(UploadedDocument).filter(UploadedDocument.id == req.document_id).first()
        if doc and doc.extracted_text:
            doc_context = doc.extracted_text[:2000]

    return AIService.generate_chat_response(
        query=req.message,
        explanation_level=req.explanation_level or "General Public",
        language=req.language or "en",
        conversation_id=req.conversation_id or "conv_doc",
        document_context=doc_context
    )

@router.get("")
def list_uploaded_documents(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        return []
    docs = db.query(UploadedDocument).filter(UploadedDocument.user_id == user.id).order_by(UploadedDocument.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "filename": d.original_filename,
            "file_type": d.file_type,
            "created_at": d.created_at.strftime("%Y-%m-%d %H:%M"),
            "has_summary": d.summary is not None
        }
        for d in docs
    ]
