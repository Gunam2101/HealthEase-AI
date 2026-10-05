import datetime
import uuid
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="user") # user, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("UploadedDocument", back_populates="user", cascade="all, delete-orphan")
    saved_items = relationship("SavedItem", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    learning_progress = relationship("LearningProgress", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String(255), default="Alex Rivera")
    avatar_url = Column(String(500), default="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80")
    preferred_language = Column(String(10), default="en") # en, ta, hi, te, ml
    explanation_level = Column(String(50), default="General Public") # School Student, College Student, General Public, Caregiver, Healthcare Student
    voice_speed = Column(Float, default=1.0)
    voice_gender = Column(String(20), default="neutral")
    high_contrast = Column(Boolean, default=False)
    reduced_motion = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), default="New Health Discussion")
    category = Column(String(100), default="General Health")
    document_id = Column(String(36), ForeignKey("uploaded_documents.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")
    document = relationship("UploadedDocument")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False, index=True)
    role = Column(String(50), nullable=False) # user, assistant, system
    content = Column(Text, nullable=False)
    explanation_level = Column(String(50), nullable=True)
    language = Column(String(10), default="en")
    is_safety_flagged = Column(Boolean, default=False)
    safety_category = Column(String(100), nullable=True)
    sources = Column(JSON, nullable=True) # list of {title, url, source, snippet}
    follow_ups = Column(JSON, nullable=True) # list of strings
    structured_sections = Column(JSON, nullable=True)
    audio_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")


class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # pdf, png, jpg, txt
    file_size_bytes = Column(Integer, default=0)
    extracted_text = Column(Text, nullable=True)
    is_processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="documents")
    summary = relationship("DocumentSummary", back_populates="document", uselist=False, cascade="all, delete-orphan")


class DocumentSummary(Base):
    __tablename__ = "document_summaries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("uploaded_documents.id"), unique=True, nullable=False)
    document_type = Column(String(100), default="Lab Health Report")
    report_date = Column(String(100), nullable=True)
    summary = Column(Text, nullable=False)
    tests = Column(JSON, default=list) # [{name, value, unit, reference_range, status, explanation}]
    identified_terms = Column(JSON, default=list)
    questions_for_doctor = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("UploadedDocument", back_populates="summary")


class SavedItem(Base):
    __tablename__ = "saved_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    item_type = Column(String(50), nullable=False) # explanation, term, report, article, quiz_result
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="General")
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="saved_items")


class MedicalTerm(Base):
    __tablename__ = "medical_terms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    term = Column(String(255), unique=True, index=True, nullable=False)
    phonetic = Column(String(255), nullable=True)
    category = Column(String(100), default="General", index=True)
    simple_meaning = Column(Text, nullable=False)
    detailed_explanation = Column(Text, nullable=False)
    common_concepts = Column(JSON, default=list)
    related_terms = Column(JSON, default=list)
    example_usage = Column(Text, nullable=True)
    translations = Column(JSON, default=dict) # {ta, hi, te, ml}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class EducationContent(Base):
    __tablename__ = "education_content"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)
    reading_time_minutes = Column(Integer, default=4)
    short_description = Column(Text, nullable=False)
    full_content = Column(Text, nullable=False)
    key_takeaways = Column(JSON, default=list)
    related_topics = Column(JSON, default=list)
    badge = Column(String(50), default="Popular")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    topic = Column(String(255), nullable=False)
    difficulty = Column(String(50), default="Medium")
    total_questions = Column(Integer, default=5)
    correct_answers = Column(Integer, default=0)
    score_percentage = Column(Float, default=0.0)
    review_topics = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="quiz_attempts")


class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    topics_explored_count = Column(Integer, default=24)
    saved_explanations_count = Column(Integer, default=12)
    reports_simplified_count = Column(Integer, default=4)
    terms_learned_count = Column(Integer, default=37)
    quizzes_completed_count = Column(Integer, default=8)
    overall_accuracy = Column(Float, default=85.0)
    category_progress = Column(JSON, default=dict) # {"General Health": 80, "Nutrition": 65, "Medical Terms": 90, "Preventive Care": 75}
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="learning_progress")


class TrustedSource(Base):
    __tablename__ = "trusted_sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False) # e.g. "World Health Organization (WHO)"
    organization = Column(String(255), nullable=False)
    website_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    topics_covered = Column(JSON, default=list)


class SafetyFlag(Base):
    __tablename__ = "safety_flags"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)
    query_text = Column(Text, nullable=False)
    risk_category = Column(String(100), nullable=False) # Emergency, Crisis, Prescription, Diagnosis
    action_taken = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)
    message_id = Column(String(36), nullable=True)
    rating = Column(String(20), nullable=False) # thumbs_up, thumbs_down
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
