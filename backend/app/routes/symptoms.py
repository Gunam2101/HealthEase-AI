from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from app.services.safety_engine import SafetyEngine, UNIVERSAL_DISCLAIMER
from app.services.ai_service import AIService
from app.services.rag_engine import RAGEngine

router = APIRouter(prefix="/symptoms", tags=["Symptom Checker"])

class SymptomRequest(BaseModel):
    query: Optional[str] = None
    symptoms: Optional[str] = None
    language: Optional[str] = "en"

class SymptomResponse(BaseModel):
    query: str = ""
    language: str = "en"
    symptoms_mentioned: List[str]
    possible_causes: List[str]
    self_care_measures: List[str]
    warning_signs: List[str]
    when_to_seek_care: str
    is_emergency: bool = False
    emergency_guidance: Optional[str] = None
    formatted_response: str
    formatted_content: Optional[str] = None
    disclaimer: str
    sources: List[dict] = []

@router.post("", response_model=SymptomResponse)
def check_symptoms(req: SymptomRequest):
    raw_query = req.query or req.symptoms or ""
    text = raw_query.strip()
    safety = SafetyEngine.classify_query(text)
    
    # Check if emergency symptoms are present
    if not safety.is_safe and safety.severity == "critical":
        emergency_content = (
            "# 🚨 Seek Immediate Medical Help\n\n"
            "The symptoms you described indicate an acute health situation requiring urgent clinical evaluation.\n\n"
            "## ⚠️ Urgent Recommended Actions\n\n"
            "- **Call local emergency services immediately** (e.g. **112**, **108**, or **911**).\n"
            "- Do not attempt to drive yourself; request emergency ambulance transit.\n"
            "- Stay seated or reclined in a well-ventilated space while awaiting assistance.\n"
            "- Alert someone nearby immediately.\n\n"
            "## 👨‍⚕️ Clinical Safety Context\n\n"
            "HealthEase AI does not diagnose emergencies. Please prioritize immediate clinical evaluation.\n\n"
            f"> {UNIVERSAL_DISCLAIMER}"
        )
        return SymptomResponse(
            query=text,
            language=req.language or "en",
            symptoms_mentioned=["Acute / Severe Symptoms Described"],
            possible_causes=["Acute emergency conditions requiring immediate in-person evaluation."],
            self_care_measures=["Call emergency medical services immediately."],
            warning_signs=["Severe chest pressure", "Breathing difficulty", "Sudden numbness or weakness"],
            when_to_seek_care="Immediately. Contact emergency services without delay.",
            is_emergency=True,
            emergency_guidance="Potential cardiovascular or acute emergency flagged. Call emergency services immediately.",
            formatted_response=emergency_content,
            formatted_content=emergency_content,
            disclaimer=UNIVERSAL_DISCLAIMER,
            sources=[
                {"title": "WHO Clinical Triage Guidelines", "organization": "WHO", "url": "https://www.who.int"},
                {"title": "Emergency Medical Evaluation", "organization": "MedlinePlus", "url": "https://medlineplus.gov"}
            ]
        )

    # Parse mentioned symptoms from natural language text
    common_symptoms = [
        "headache", "fever", "tiredness", "fatigue", "cough", "sore throat",
        "dizziness", "nausea", "body ache", "chills", "runny nose", "stomach pain",
        "joint pain", "shortness of breath", "insomnia", "rash", "congestion"
    ]
    mentioned = [s.capitalize() for s in common_symptoms if s in text.lower()]
    if not mentioned:
        mentioned = ["Symptoms described in your inquiry"]

    # Synthesize educational response matching Section 13 format
    symptoms_list_str = "\n".join([f"- **{m}**" for m in mentioned])
    
    possible_causes_items = [
        "Viral respiratory infections or seasonal common cold",
        "Physical fatigue, dehydration, or prolonged stress",
        "Tension headaches or sleep disruption",
        "Systemic inflammatory or immune response"
    ]
    causes_str = (
        "These symptoms can occur with several conditions, including viral respiratory infections, "
        "seasonal changes, dehydration, or tension. Symptoms overlap across many health states, "
        "so a clinical consultation is required for individual diagnosis."
    )
    
    self_care_items = [
        "Prioritize restful sleep and reduce physical strain.",
        "Maintain consistent hydration with water, herbal teas, or clear broths.",
        "Monitor your temperature and symptom progression in a daily log.",
        "Eat light, easily digestible, nutrient-dense meals."
    ]
    self_care_str = "\n".join([f"- {item}" for item in self_care_items])

    warning_signs_items = [
        "Fever exceeding 103°F (39.4°C) or lasting more than 3 consecutive days.",
        "Onset of severe, sudden headache, stiff neck, or confusion.",
        "Difficulty breathing, persistent chest pain, or wheezing.",
        "Inability to keep fluids down for over 24 hours."
    ]
    warning_signs_str = "\n".join([f"- {item}" for item in warning_signs_items])

    when_seek = (
        "Consider speaking with a qualified healthcare professional if symptoms worsen, "
        "fail to improve after 48–72 hours, or significantly interfere with your daily routine."
    )

    formatted = (
        "# 🩺 Symptoms You Mentioned\n\n"
        f"{symptoms_list_str}\n\n"
        "## 💡 Possible General Causes\n\n"
        f"{causes_str}\n\n"
        "## 🌱 General Self-Care\n\n"
        f"{self_care_str}\n\n"
        "## 🚨 Warning Signs\n\n"
        f"{warning_signs_str}\n\n"
        "## 👨‍⚕️ When to Seek Care\n\n"
        f"{when_seek}\n\n"
        f"> {UNIVERSAL_DISCLAIMER}"
    )

    # Localize if requested
    if req.language and req.language != "en":
        formatted, _ = AIService._localize_content(formatted, [], req.language)

    return SymptomResponse(
        query=text,
        language=req.language or "en",
        symptoms_mentioned=mentioned,
        possible_causes=possible_causes_items,
        self_care_measures=self_care_items,
        warning_signs=warning_signs_items,
        when_to_seek_care=when_seek,
        is_emergency=False,
        emergency_guidance=None,
        formatted_response=formatted,
        formatted_content=formatted,
        disclaimer=UNIVERSAL_DISCLAIMER,
        sources=[
            {"title": "MedlinePlus Symptom Guide", "organization": "MedlinePlus", "url": "https://medlineplus.gov"},
            {"title": "WHO Patient Literacy Guidelines", "organization": "WHO", "url": "https://www.who.int"}
        ]
    )
