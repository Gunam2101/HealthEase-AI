import pytest
import sys
import os

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.routes.language import detect_text_language
from app.services.news_service import NewsService
from app.services.ai_service import AIService
from app.schemas.models import ChatResponse

def test_language_detection_english():
    # TEST 1: "What is hypertension?"
    res = detect_text_language("What is hypertension?")
    assert res["language"] == "en"
    assert res["detected_name"] == "English"

def test_language_detection_tamil():
    # TEST 2: "உயர் இரத்த அழுத்தம் என்றால் என்ன?"
    res = detect_text_language("உயர் இரத்த அழுத்தம் என்றால் என்ன?")
    assert res["language"] == "ta"
    assert res["detected_name"] == "Tamil"
    assert res["native_label"] == "தமிழ்"

def test_language_detection_hindi():
    # TEST 3: "हाइपरटेंशन क्या है?"
    res = detect_text_language("हाइपरटेंशन क्या है?")
    assert res["language"] == "hi"
    assert res["detected_name"] == "Hindi"
    assert res["native_label"] == "हिन्दी"

def test_language_detection_mixed_tanglish():
    # TEST 4: "BP high na enna problem?"
    res = detect_text_language("BP high na enna problem?")
    assert res["language"] == "ta"
    assert res["is_code_mixed"] is True
    assert "Tanglish" in res["detected_name"]

def test_language_detection_mixed_script():
    # Mixed: "HbA1c என்ன?"
    res = detect_text_language("HbA1c என்ன?")
    assert res["language"] == "ta"
    assert res["is_code_mixed"] is True

def test_language_detection_hinglish():
    # Mixed: "Sir me bahut dard hai kya kare?"
    res = detect_text_language("Sir me bahut dard hai kya kare?")
    assert res["language"] == "hi"
    assert res["is_code_mixed"] is True

def test_extensible_indian_languages():
    # Telugu: "రక్తపోటు అంటే ఏమిటి?"
    res_te = detect_text_language("రక్తపోటు అంటే ఏమిటి?")
    assert res_te["language"] == "te"

    # Malayalam: "രക്തസമ്മർദ്ദം എന്താണ്?"
    res_ml = detect_text_language("രക്തസമ്മർദ്ദം എന്താണ്?")
    assert res_ml["language"] == "ml"

    # Kannada: "ರಕ್ತದೊತ್ತಡ ಎಂದರೇನು?"
    res_kn = detect_text_language("ರಕ್ತದೊತ್ತಡ ಎಂದರೇನು?")
    assert res_kn["language"] == "kn"

    # Bengali: "উচ্চ রক্তচাপ কি?"
    res_bn = detect_text_language("উচ্চ রক্তচাপ কি?")
    assert res_bn["language"] == "bn"

def test_news_retrieval_and_sources():
    # TEST 7: Open Health News
    articles = NewsService.get_articles(limit=10)
    assert isinstance(articles, list)
    assert len(articles) > 0
    first = articles[0]
    assert "id" in first
    assert "title" in first and len(first["title"]) > 0
    assert "source_name" in first and len(first["source_name"]) > 0
    assert "source_url" in first and first["source_url"].startswith("http")
    assert "category" in first
    assert "published_at" in first
    assert "time_ago" in first

def test_news_categories():
    # Check that categories exist
    articles = NewsService.get_articles(category="Public Health")
    assert isinstance(articles, list)

def test_news_ai_summary():
    # TEST 9: AI Summary format
    sample_article = {
        "id": "art_test_1",
        "title": "WHO issues updated global cardiovascular screening guidelines",
        "summary": "The World Health Organization announced updated screening guidelines for early detection of arterial hypertension in adults.",
        "full_summary": "The World Health Organization announced updated screening guidelines for early detection of arterial hypertension in adults.",
        "source_name": "World Health Organization",
        "source_url": "https://www.who.int/news/item/cardiovascular",
        "category": "Public Health"
      }
    summary = NewsService.summarize_article(sample_article, language="en")
    assert "formatted_summary" in summary
    fs = summary["formatted_summary"]
    assert "What Happened?" in fs or "What Happened" in fs
    assert "Why It Matters" in fs
    assert "Key Takeaways" in fs
    assert "Original Source" in fs

def test_news_translation():
    # TEST 8: News translation into Tamil
    sample_article = {
        "title": "WHO releases new guidance on hypertension management",
        "summary": "Regular monitoring of blood pressure helps prevent severe cardiac complications."
    }
    result_ta = NewsService.translate_article(sample_article, target_language="ta")
    assert result_ta["is_translated"] is True
    assert "translated_title" in result_ta
    assert "translated_summary" in result_ta

def test_chat_response_tamil_medical_terminology():
    # TEST 2 & 5: Tamil AI response with medical terminology
    resp = AIService.generate_chat_response("அனீமியா என்றால் என்ன?", language="ta")
    assert resp.language == "ta"
    assert len(resp.content) > 10
    # Should include educational disclaimer
    assert "HealthEase AI" in resp.disclaimer
