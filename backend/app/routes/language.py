import re
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/language", tags=["Language Detection"])

class LanguageDetectRequest(BaseModel):
    text: str

class LanguageDetectResponse(BaseModel):
    language: str # 'en' | 'ta' | 'hi'
    script: str
    confidence: float
    is_code_mixed: bool
    native_label: str
    detected_name: str
    language_code: Optional[str] = None
    detected_language: Optional[str] = None

# Common romanized keywords for Tanglish and Hinglish detection
TANGLISH_KEYWORDS = {
    "enna", "epdi", "epadi", "irukku", "iruku", "romba", "vali", "valikithu",
    "sollunga", "sollu", "naan", "na", "seri", "illa", "illai", "paathuko", "koodum",
    "marundhu", "udambu", "thalai", "thalaivali", "kaichal", "kaachal",
    "sappadu", "kudikanum", "doctor", "theriyala", "aachu", "aayiduchu",
    "yen", "eppadi", "nalla", "periya", "chinna", "problem", "konjam"
}

HINGLISH_KEYWORDS = {
    "kya", "hai", "kaise", "kare", "hoga", "dard", "bukhar", "batao",
    "bataiye", "dawa", "ilaj", "chahiye", "pehle", "karen", "hota", "hote",
    "mujhe", "mera", "meri", "sir", "sirdard", "pet", "petdard", "khana",
    "kyun", "accha", "zyada", "kam", "bataye", "taklif"
}

def detect_text_language(text: str) -> dict:
    if not text or not text.strip():
        return {
            "language": "en",
            "script": "Latin",
            "confidence": 1.0,
            "is_code_mixed": False,
            "native_label": "English",
            "detected_name": "English"
        }

    clean_text = text.strip()

    # 1. Check Unicode Scripts
    tamil_chars = len(re.findall(r'[\u0B80-\u0BFF]', clean_text))
    devanagari_chars = len(re.findall(r'[\u0900-\u097F]', clean_text))
    telugu_chars = len(re.findall(r'[\u0C00-\u0C7F]', clean_text))
    malayalam_chars = len(re.findall(r'[\u0D00-\u0D7F]', clean_text))
    kannada_chars = len(re.findall(r'[\u0C80-\u0CFF]', clean_text))
    bengali_chars = len(re.findall(r'[\u0980-\u09FF]', clean_text))

    total_alpha = len(re.findall(r'[a-zA-Z\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\u0C80-\u0CFF\u0980-\u09FF]', clean_text)) or 1
    has_latin = len(re.findall(r'[a-zA-Z]', clean_text)) > 0

    if tamil_chars > 0 and (tamil_chars / total_alpha) > 0.15:
        return {
            "language": "ta",
            "script": "Tamil",
            "confidence": min(1.0, tamil_chars / total_alpha + 0.4),
            "is_code_mixed": has_latin,
            "native_label": "தமிழ்",
            "detected_name": "Tamil"
        }

    if devanagari_chars > 0 and (devanagari_chars / total_alpha) > 0.15:
        return {
            "language": "hi",
            "script": "Devanagari",
            "confidence": min(1.0, devanagari_chars / total_alpha + 0.4),
            "is_code_mixed": has_latin,
            "native_label": "हिन्दी",
            "detected_name": "Hindi"
        }

    if telugu_chars > 0 and (telugu_chars / total_alpha) > 0.15:
        return {
            "language": "te",
            "script": "Telugu",
            "confidence": min(1.0, telugu_chars / total_alpha + 0.4),
            "is_code_mixed": has_latin,
            "native_label": "తెలుగు",
            "detected_name": "Telugu"
        }

    if malayalam_chars > 0 and (malayalam_chars / total_alpha) > 0.15:
        return {
            "language": "ml",
            "script": "Malayalam",
            "confidence": min(1.0, malayalam_chars / total_alpha + 0.4),
            "is_code_mixed": has_latin,
            "native_label": "മലയാളം",
            "detected_name": "Malayalam"
        }

    if kannada_chars > 0 and (kannada_chars / total_alpha) > 0.15:
        return {
            "language": "kn",
            "script": "Kannada",
            "confidence": min(1.0, kannada_chars / total_alpha + 0.4),
            "is_code_mixed": has_latin,
            "native_label": "ಕನ್ನಡ",
            "detected_name": "Kannada"
        }

    if bengali_chars > 0 and (bengali_chars / total_alpha) > 0.15:
        return {
            "language": "bn",
            "script": "Bengali",
            "confidence": min(1.0, bengali_chars / total_alpha + 0.4),
            "is_code_mixed": has_latin,
            "native_label": "বাংলা",
            "detected_name": "Bengali"
        }

    # 2. Check Romanized / Code-mixed (Tanglish / Hinglish)
    words = set(re.findall(r'[a-zA-Z]+', clean_text.lower()))
    
    tanglish_matches = words.intersection(TANGLISH_KEYWORDS)
    if tanglish_matches:
        return {
            "language": "ta",
            "script": "Latin (Tanglish)",
            "confidence": 0.85,
            "is_code_mixed": True,
            "native_label": "தமிழ் (Tanglish)",
            "detected_name": "Tanglish (Tamil)"
        }

    hinglish_matches = words.intersection(HINGLISH_KEYWORDS)
    if hinglish_matches:
        return {
            "language": "hi",
            "script": "Latin (Hinglish)",
            "confidence": 0.85,
            "is_code_mixed": True,
            "native_label": "हिन्दी (Hinglish)",
            "detected_name": "Hinglish (Hindi)"
        }

    return {
        "language": "en",
        "script": "Latin",
        "confidence": 0.95,
        "is_code_mixed": False,
        "native_label": "English",
        "detected_name": "English"
    }

@router.post("/detect", response_model=LanguageDetectResponse)
def detect_language_endpoint(req: LanguageDetectRequest):
    res = detect_text_language(req.text)
    res["language_code"] = res.get("language")
    res["detected_language"] = res.get("detected_name")
    return res


