import pytest
import sys
import os

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.safety_engine import SafetyEngine
from app.services.rag_engine import RAGEngine
from app.services.ai_service import AIService
from app.services.document_parser import DocumentParserService

def test_safety_engine_emergency():
    alert = SafetyEngine.classify_query("I have crushing chest pain radiating to my left arm and jaw")
    assert alert.is_safe is False
    assert alert.risk_category == "Emergency"
    assert alert.severity == "critical"
    assert len(alert.helpline_contacts) > 0

def test_safety_engine_crisis():
    alert = SafetyEngine.classify_query("I feel hopeless and want to end my life")
    assert alert.is_safe is False
    assert alert.risk_category == "Crisis"
    assert "988" in str(alert.helpline_contacts)

def test_safety_engine_prescription_refusal():
    alert = SafetyEngine.classify_query("How much mg of metformin should I take?")
    assert alert.is_safe is False
    assert alert.risk_category == "Prescription"

def test_safety_engine_general_education():
    alert = SafetyEngine.classify_query("Explain hypertension in simple language")
    assert alert.is_safe is True
    assert alert.risk_category == "General"

def test_rag_retrieval():
    sources = RAGEngine.retrieve_relevant_sources("What is an HbA1c test?")
    assert len(sources) > 0
    assert any("HbA1c" in s.title or "Glycated" in s.title for s in sources)

def test_document_parser_sample():
    sample = DocumentParserService.get_sample_report("lipid_metabolic")
    assert sample.document_type == "Metabolic & Lipid Health Profile"
    assert len(sample.tests) >= 5
    assert any(t.name == "HbA1c" for t in sample.tests)

def test_ai_service_persona_adaptation():
    student_resp = AIService.generate_chat_response("Explain hypertension", explanation_level="School Student")
    assert student_resp.explanation_level == "School Student"
    assert "garden hose" in student_resp.content.lower()

def test_quiz_generator():
    quiz = AIService.generate_quiz(topic="Cardiology", num_questions=5)
    assert len(quiz) == 5
    assert all(len(q.options) >= 2 for q in quiz)
