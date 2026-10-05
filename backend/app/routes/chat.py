from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, Conversation, Message, SafetyFlag, LearningProgress
from app.schemas.models import ChatRequest, ChatResponse, TranslationRequest, TranslationResponse, FeedbackRequest
from app.services.ai_service import AIService
from app.services.safety_engine import SafetyEngine

router = APIRouter(prefix="/chat", tags=["AI Health Chat"])

@router.post("", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    # 1. Get user & find or create conversation
    user = db.query(User).first()
    conv_id = request.conversation_id

    if conv_id:
        conversation = db.query(Conversation).filter(Conversation.id == conv_id).first()
    else:
        conversation = None

    if not conversation and user:
        title = request.message[:45] + ("..." if len(request.message) > 45 else "")
        conversation = Conversation(
            user_id=user.id,
            title=title,
            category="Health Q&A"
        )
        db.add(conversation)
        db.flush()
        conv_id = conversation.id

    # 2. Generate educational AI response through safety and RAG
    ai_resp = AIService.generate_chat_response(
        query=request.message,
        explanation_level=request.explanation_level or "General Public",
        language=request.language or "en",
        conversation_id=conv_id or "conv_default"
    )

    # 3. Log safety flag if high risk
    if not ai_resp.safety.is_safe and user:
        flag = SafetyFlag(
            user_id=user.id,
            query_text=request.message,
            risk_category=ai_resp.safety.risk_category or "Unspecified",
            action_taken=ai_resp.safety.warning_message or "Alert triggered"
        )
        db.add(flag)

    # 4. Save messages to conversation history
    if conversation:
        user_msg = Message(
            conversation_id=conversation.id,
            role="user",
            content=request.message,
            explanation_level=request.explanation_level,
            language=request.language
        )
        assistant_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=ai_resp.content,
            explanation_level=request.explanation_level,
            language=request.language,
            is_safety_flagged=not ai_resp.safety.is_safe,
            safety_category=ai_resp.safety.risk_category,
            sources=[s.dict() for s in ai_resp.sources],
            follow_ups=ai_resp.follow_ups,
            structured_sections=[s.dict() for s in ai_resp.structured_sections]
        )
        db.add(user_msg)
        db.add(assistant_msg)

        # Update learning progress
        if user and user.learning_progress:
            user.learning_progress.topics_explored_count += 1

        db.commit()

    return ai_resp

@router.post("/translate", response_model=TranslationResponse)
def translate_text(req: TranslationRequest):
    localized, _ = AIService._localize_content(req.text, [], req.target_language)
    return TranslationResponse(
        original_text=req.text,
        translated_text=localized,
        target_language=req.target_language
    )

@router.get("/history")
def get_chat_history(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        return []
    convs = db.query(Conversation).filter(Conversation.user_id == user.id).order_by(Conversation.updated_at.desc()).limit(15).all()
    history = []
    for c in convs:
        history.append({
            "id": c.id,
            "title": c.title,
            "category": c.category,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M"),
            "messages_count": len(c.messages)
        })
    return history
