from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import datetime
from app.database.database import get_db
from app.database.models import User, Conversation, UploadedDocument

router = APIRouter(prefix="/health-timeline", tags=["Health Timeline"])

class TimelineEvent(BaseModel):
    id: str
    time: str
    date_group: str # "Today", "Yesterday", "Earlier This Week"
    title: str
    category: str # "ai_query", "report", "dictionary", "simplifier"
    icon: str
    query_text: str

@router.get("", response_model=List[TimelineEvent])
def get_health_timeline(db: Session = Depends(get_db)):
    user = db.query(User).first()
    events: List[TimelineEvent] = []

    now = datetime.datetime.utcnow()
    today_date = now.date()
    yesterday_date = today_date - datetime.timedelta(days=1)

    # 1. Fetch conversations
    if user:
        convs = db.query(Conversation).filter(Conversation.user_id == user.id).order_by(Conversation.created_at.desc()).limit(15).all()
        for c in convs:
            created = c.created_at or now
            event_date = created.date()
            if event_date == today_date:
                group = "Today"
            elif event_date == yesterday_date:
                group = "Yesterday"
            else:
                group = "Earlier This Week"

            time_str = created.strftime("%I:%M %p").lstrip("0")
            events.append(TimelineEvent(
                id=f"conv_{c.id}",
                time=time_str,
                date_group=group,
                title=f"Asked: \"{c.title}\"",
                category="ai_query",
                icon="Bot",
                query_text=c.title
            ))

        # 2. Fetch uploaded documents
        docs = db.query(UploadedDocument).filter(UploadedDocument.user_id == user.id).order_by(UploadedDocument.created_at.desc()).limit(10).all()
        for d in docs:
            created = d.created_at or now
            event_date = created.date()
            if event_date == today_date:
                group = "Today"
            elif event_date == yesterday_date:
                group = "Yesterday"
            else:
                group = "Earlier This Week"

            time_str = created.strftime("%I:%M %p").lstrip("0")
            events.append(TimelineEvent(
                id=f"doc_{d.id}",
                time=time_str,
                date_group=group,
                title=f"Analyzed lab report: {d.original_filename}",
                category="report",
                icon="FileSearch",
                query_text="Explain this report"
            ))

    # If new or empty database, populate with initial baseline health learning events
    if not events:
        events = [
            TimelineEvent(
                id="init_1",
                time="10:30 AM",
                date_group="Today",
                title="Asked: \"What is HbA1c and how is it measured?\"",
                category="ai_query",
                icon="Bot",
                query_text="What is HbA1c?"
            ),
            TimelineEvent(
                id="init_2",
                time="11:15 AM",
                date_group="Today",
                title="Explored Medical Dictionary: \"Hypertension & Hemodynamics\"",
                category="dictionary",
                icon="BookOpen",
                query_text="Explain hypertension"
            ),
            TimelineEvent(
                id="init_3",
                time="12:20 PM",
                date_group="Today",
                title="Simplified Clinical Discharge Summary",
                category="simplifier",
                icon="Wand2",
                query_text="Explain clinical notes"
            ),
            TimelineEvent(
                id="init_4",
                time="09:45 AM",
                date_group="Yesterday",
                title="Analyzed Complete Blood Count (CBC) Panel",
                category="report",
                icon="FileSearch",
                query_text="Explain CBC report"
            ),
            TimelineEvent(
                id="init_5",
                time="03:20 PM",
                date_group="Earlier This Week",
                title="Looked up Lipid Panel & Cholesterol metrics",
                category="dictionary",
                icon="BookOpen",
                query_text="Explain cholesterol"
            )
        ]

    return events
