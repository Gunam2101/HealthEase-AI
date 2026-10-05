from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.news_service import NewsService, CATEGORY_KEYWORDS

router = APIRouter(prefix="/news", tags=["Health News"])

class NewsSummaryRequest(BaseModel):
    article_id: Optional[str] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = "en"

class NewsTranslateRequest(BaseModel):
    article_id: Optional[str] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    target_language: str # 'en' | 'ta' | 'hi'

@router.get("")
def get_health_news(
    category: Optional[str] = Query(None, description="Category filter"),
    search: Optional[str] = Query(None, description="Search query"),
    limit: int = Query(30, ge=1, le=100)
):
    articles = NewsService.get_articles(category=category, query=search, limit=limit)
    return {
        "articles": articles,
        "total": len(articles),
        "category": category or "All",
        "search": search or ""
    }

@router.get("/search")
def search_health_news(
    query: str = Query(..., description="Search term or topic"),
    category: Optional[str] = Query(None, description="Optional category filter"),
    limit: int = Query(30, ge=1, le=100)
):
    articles = NewsService.get_articles(category=category, query=query, limit=limit)
    return {
        "articles": articles,
        "total": len(articles),
        "query": query,
        "category": category or "All"
    }

@router.get("/categories")
def get_news_categories():
    categories = [
        {"id": "All", "label": "All Topics", "badge": "🌐"},
        {"id": "Public Health", "label": "Public Health", "badge": "🩺"},
        {"id": "Medical Research", "label": "Medical Research", "badge": "🧬"},
        {"id": "Nutrition", "label": "Nutrition", "badge": "🥗"},
        {"id": "Mental Wellness", "label": "Mental Wellness", "badge": "🧠"},
        {"id": "Heart Health", "label": "Heart Health", "badge": "❤️"},
        {"id": "Diabetes", "label": "Diabetes", "badge": "🩸"},
        {"id": "Fitness", "label": "Fitness", "badge": "🏃"},
        {"id": "AI & Healthcare", "label": "AI & Healthcare", "badge": "🤖"},
        {"id": "Global Health", "label": "Global Health", "badge": "🌍"},
        {"id": "Medicines & Safety", "label": "Medicines & Safety", "badge": "💊"},
    ]
    return {"categories": categories}

@router.get("/{article_id}")
def get_article_detail(article_id: str):
    article = NewsService.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.post("/summary")
def get_ai_news_summary(req: NewsSummaryRequest):
    article = None
    if req.article_id:
        article = NewsService.get_article_by_id(req.article_id)

    if not article:
        article = {
            "id": req.article_id or "custom",
            "title": req.title or "Health Article",
            "summary": req.summary or "",
            "source_name": req.source_name or "Verified Health Agency",
            "source_url": req.source_url or "https://www.who.int",
            "category": req.category or "Public Health"
        }

    summary_result = NewsService.summarize_article(article, language=req.language or "en")
    return summary_result

@router.post("/translate")
def translate_news_article(req: NewsTranslateRequest):
    title = req.title or ""
    summary = req.summary or ""
    if req.article_id and (not title or not summary):
        found = NewsService.get_article_by_id(req.article_id)
        if found:
            title = title or found.get("title", "")
            summary = summary or found.get("summary", "")
    
    article = {
        "title": title,
        "summary": summary
    }
    result = NewsService.translate_article(article, target_language=req.target_language)
    return result

