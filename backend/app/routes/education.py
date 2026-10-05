from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.database.database import get_db
from app.database.models import EducationContent, User

router = APIRouter(prefix="/education", tags=["Health Education Library"])

TODAY_TIPS = [
    {
        "id": "tip_1",
        "title": "Hydration Supports Renal Glomerular Filtration",
        "category": "Daily Habit",
        "content": (
            "Drinking water consistently throughout the day maintains healthy plasma volume, helping your kidneys "
            "efficiently filter out metabolic waste products without placing concentrated osmotic strain on renal tubules."
        ),
        "action": "Aim for pale straw-colored urine throughout the daytime.",
        "related_slug": "nutritional-fundamentals"
    },
    {
        "id": "tip_2",
        "title": "Post-Meal Walks & Muscle Glucose Uptake",
        "category": "Exercise & Metabolism",
        "content": (
            "Taking a gentle 10 to 15-minute walk after lunch or dinner activates GLUT4 glucose transporters in large leg muscles "
            "independent of insulin, smoothing out postprandial blood sugar spikes."
        ),
        "action": "Try a casual 10-minute stroll after your largest meal of the day.",
        "related_slug": "understanding-blood-pressure"
    },
    {
        "id": "tip_3",
        "title": "The Nocturnal Blood Pressure Dip",
        "category": "Sleep & Heart",
        "content": (
            "During healthy restful sleep, blood pressure naturally drops by 10% to 20% (known as nocturnal dipping). "
            "Protecting your sleep schedule directly protects your vascular health."
        ),
        "action": "Keep your sleeping room cool and screen-free 45 minutes prior to sleep.",
        "related_slug": "science-of-restorative-sleep"
    }
]

@router.get("")
def list_education_articles(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(EducationContent)
    if category and category != "All":
        query = query.filter(EducationContent.category == category)
    articles = query.all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "slug": a.slug,
            "category": a.category,
            "reading_time_minutes": a.reading_time_minutes,
            "short_description": a.short_description,
            "key_takeaways": a.key_takeaways or [],
            "badge": a.badge
        }
        for a in articles
    ]

@router.get("/tip/today")
def get_todays_health_tip():
    return TODAY_TIPS[0]

@router.get("/{slug}")
def get_article_by_slug(slug: str, db: Session = Depends(get_db)):
    article = db.query(EducationContent).filter(EducationContent.slug == slug).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return {
        "id": article.id,
        "title": article.title,
        "slug": article.slug,
        "category": article.category,
        "reading_time_minutes": article.reading_time_minutes,
        "short_description": article.short_description,
        "full_content": article.full_content,
        "key_takeaways": article.key_takeaways or [],
        "related_topics": article.related_topics or [],
        "badge": article.badge
    }
