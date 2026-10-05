from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.database import get_db
from app.database.models import TrustedSource, SafetyFlag, User, EducationContent, MedicalTerm

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

@router.get("/stats")
def get_admin_system_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_terms = db.query(MedicalTerm).count()
    total_articles = db.query(EducationContent).count()
    total_sources = db.query(TrustedSource).count()
    total_flags = db.query(SafetyFlag).count()

    return {
        "total_users": total_users,
        "total_terms": total_terms,
        "total_articles": total_articles,
        "total_sources": total_sources,
        "total_safety_flags": total_flags,
        "ai_engine_status": "Active & Operational",
        "rag_status": "Grounded & Verified",
        "supported_languages": ["English", "Tamil", "Hindi", "Telugu", "Malayalam"]
    }

@router.get("/sources")
def list_trusted_sources(db: Session = Depends(get_db)):
    return db.query(TrustedSource).all()

@router.get("/safety-flags")
def list_safety_flags(db: Session = Depends(get_db)):
    flags = db.query(SafetyFlag).order_by(SafetyFlag.created_at.desc()).limit(20).all()
    return [
        {
            "id": f.id,
            "query_text": f.query_text,
            "risk_category": f.risk_category,
            "action_taken": f.action_taken,
            "created_at": f.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for f in flags
    ]
