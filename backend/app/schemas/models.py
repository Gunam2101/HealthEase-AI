from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth & Profile ---
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str = "Alex Rivera"

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferred_language: Optional[str] = None # en, ta, hi, te, ml
    explanation_level: Optional[str] = None
    voice_speed: Optional[float] = None
    voice_gender: Optional[str] = None
    high_contrast: Optional[bool] = None
    reduced_motion: Optional[bool] = None

class ProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    avatar_url: str
    preferred_language: str
    explanation_level: str
    voice_speed: float
    voice_gender: str
    high_contrast: bool
    reduced_motion: bool

class AuthResponse(BaseModel):
    token: str
    user_id: str
    email: str
    profile: ProfileResponse

# --- Safety & Chat ---
class SafetyAlert(BaseModel):
    is_safe: bool = True
    risk_category: Optional[str] = None # Emergency, Crisis, Prescription, Diagnosis, None
    severity: str = "none" # none, low, medium, critical
    warning_message: Optional[str] = None
    helpline_contacts: List[Dict[str, str]] = []

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    explanation_level: Optional[str] = "General Public"
    language: Optional[str] = "en"
    document_id: Optional[str] = None

class SourceCitation(BaseModel):
    title: str
    organization: str
    url: str
    snippet: str

class StructuredSection(BaseModel):
    title: str
    content: str

class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    content: str
    explanation_level: str
    language: str
    safety: SafetyAlert
    sources: List[SourceCitation] = []
    follow_ups: List[str] = []
    structured_sections: List[StructuredSection] = []
    disclaimer: str

# --- Medical Dictionary ---
class MedicalTermResponse(BaseModel):
    id: str
    term: str
    phonetic: Optional[str] = None
    category: str
    simple_meaning: str
    detailed_explanation: str
    common_concepts: List[str] = []
    related_terms: List[str] = []
    example_usage: Optional[str] = None
    translations: Dict[str, str] = {}

class TermExplainRequest(BaseModel):
    term: str
    language: Optional[str] = "en"
    explanation_level: Optional[str] = "General Public"

# --- Text Simplifier ---
class TextSimplifyRequest(BaseModel):
    text: str
    mode: str = "Simple" # Very Simple, Simple, College Level, Detailed, Bullet Points, Short Summary
    language: str = "en" # en, ta, hi, te, ml

class TextSimplifyResponse(BaseModel):
    original_text: str
    simplified_text: str
    mode: str
    language: str
    detected_terms: List[Dict[str, str]] = []
    key_points: List[str] = []
    questions_for_doctor: List[str] = []
    disclaimer: str

# --- Document Analyzer ---
class TestResultItem(BaseModel):
    name: str
    value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    status: str = "normal" # within_range, outside_range, unknown
    explanation: str

class DocumentAnalysisResponse(BaseModel):
    document_id: str
    document_type: str
    filename: str
    report_date: Optional[str] = None
    summary: str
    tests: List[TestResultItem] = []
    identified_terms: List[Dict[str, str]] = []
    questions_for_doctor: List[str] = []
    safety: SafetyAlert
    disclaimer: str

# --- Quizzes ---
class QuizQuestion(BaseModel):
    id: int
    question: str
    question_type: str # mcq, true_false, scenario
    options: List[str]
    correct_answer_index: int
    explanation: str
    concept_tested: str

class QuizGenerateRequest(BaseModel):
    topic: str = "General Health"
    num_questions: int = 5
    difficulty: str = "Medium" # Easy, Medium, Hard

class QuizResponse(BaseModel):
    quiz_id: str
    topic: str
    difficulty: str
    questions: List[QuizQuestion]

class QuizSubmitRequest(BaseModel):
    quiz_id: str
    topic: str
    difficulty: str
    answers: Dict[int, int] # question_id -> selected_index
    questions: List[QuizQuestion]

class QuizSubmitResponse(BaseModel):
    score: int
    total_questions: int
    percentage: float
    review_topics: List[str]
    feedback: str

# --- Learning Analytics ---
class LearningAnalyticsResponse(BaseModel):
    topics_explored: int
    saved_explanations: int
    reports_simplified: int
    terms_learned: int
    quizzes_completed: int
    overall_accuracy: float
    category_progress: Dict[str, int]
    recent_activity: List[Dict[str, Any]]

# --- Saved Items ---
class SavedItemCreate(BaseModel):
    item_type: str # explanation, term, report, article, quiz_result
    title: str
    category: str = "General"
    content: str
    metadata_json: Optional[Dict[str, Any]] = None

class SavedItemResponse(BaseModel):
    id: str
    item_type: str
    title: str
    category: str
    content: str
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

# --- Voice & Audio ---
class TranscribeResponse(BaseModel):
    text: str
    language: str

# --- Translation ---
class TranslationRequest(BaseModel):
    text: str
    target_language: str # en, ta, hi, te, ml
    preserve_medical_terms: bool = True

class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    target_language: str

# --- Feedback ---
class FeedbackRequest(BaseModel):
    message_id: Optional[str] = None
    rating: str # thumbs_up, thumbs_down
    comment: Optional[str] = None
