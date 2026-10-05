from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.database import get_db
from app.database.models import MedicalTerm, User, LearningProgress
from app.schemas.models import (
    MedicalTermResponse, TermExplainRequest, TextSimplifyRequest,
    TextSimplifyResponse
)
from app.services.ai_service import AIService

router = APIRouter(prefix="/medical-terms", tags=["Medical Dictionary & Simplifier"])

@router.get("", response_model=List[MedicalTermResponse])
def get_medical_terms(
    category: Optional[str] = None,
    query: Optional[str] = None,
    db: Session = Depends(get_db)
):
    terms_query = db.query(MedicalTerm)
    if category and category != "All":
        terms_query = terms_query.filter(MedicalTerm.category == category)
    if query:
        terms_query = terms_query.filter(MedicalTerm.term.ilike(f"%{query}%"))

    terms = terms_query.all()
    return [
        MedicalTermResponse(
            id=t.id,
            term=t.term,
            phonetic=t.phonetic,
            category=t.category,
            simple_meaning=t.simple_meaning,
            detailed_explanation=t.detailed_explanation,
            common_concepts=t.common_concepts or [],
            related_terms=t.related_terms or [],
            example_usage=t.example_usage,
            translations=t.translations or {}
        )
        for t in terms
    ]

@router.get("/{term_name}", response_model=MedicalTermResponse)
def get_term_by_name(term_name: str, db: Session = Depends(get_db)):
    term = db.query(MedicalTerm).filter(MedicalTerm.term.ilike(term_name)).first()
    if not term:
        # Generate on-the-fly definition
        return MedicalTermResponse(
            id="term_dynamic",
            term=term_name.capitalize(),
            phonetic=None,
            category="General Health",
            simple_meaning=f"A clinical concept referring to physiological aspects of {term_name}.",
            detailed_explanation=f"In medical literature, {term_name} relates to specific anatomical, biochemical, or clinical findings evaluated during clinical practice.",
            common_concepts=["Clinical Assessment", "Biological Function"],
            related_terms=["Health Literacy", "Biomarkers"],
            example_usage=f"The physician reviewed the implications of {term_name} with the patient.",
            translations={}
        )

    # Track user learning progress
    user = db.query(User).first()
    if user and user.learning_progress:
        user.learning_progress.terms_learned_count += 1
        db.commit()

    return MedicalTermResponse(
        id=term.id,
        term=term.term,
        phonetic=term.phonetic,
        category=term.category,
        simple_meaning=term.simple_meaning,
        detailed_explanation=term.detailed_explanation,
        common_concepts=term.common_concepts or [],
        related_terms=term.related_terms or [],
        example_usage=term.example_usage,
        translations=term.translations or {}
    )

@router.post("/simplify-text", response_model=TextSimplifyResponse)
def simplify_medical_text_endpoint(
    req: TextSimplifyRequest,
    db: Session = Depends(get_db)
):
    result = AIService.simplify_medical_text(
        text=req.text,
        mode=req.mode,
        language=req.language
    )

    # Increment learning progress
    user = db.query(User).first()
    if user and user.learning_progress:
        user.learning_progress.reports_simplified_count += 1
        db.commit()

    return result
