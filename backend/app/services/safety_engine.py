import re
from typing import Dict, Any, Tuple, List
from app.schemas.models import SafetyAlert

UNIVERSAL_DISCLAIMER = (
    "HealthEase AI provides general health information for educational purposes and does not "
    "replace professional medical advice, diagnosis, or treatment."
)

EMERGENCY_KEYWORDS = [
    r"\b(crushing\s+chest\s+pain|severe\s+chest\s+pain|chest\s+pressure|radiating\s+to\s+(left\s+arm|jaw))\b",
    r"\b(sudden\s+shortness\s+of\s+breath|difficulty\s+breathing|cannot\s+breathe|gasping\s+for\s+air|suffocating)\b",
    r"\b(facial\s+droop|arm\s+weakness|slurred\s+speech|stroke\s+symptoms|sudden\s+numbness\s+on\s+one\s+side)\b",
    r"\b(anaphylaxis|throat\s+closing|swollen\s+tongue\s+after\s+eating|epipen)\b",
    r"\b(uncontrolled\s+bleeding|coughing\s+up\s+blood|vomiting\s+blood)\b",
    r"\b(worst\s+headache\s+of\s+my\s+life|thunderclap\s+headache)\b",
    r"\b(unconscious|passed\s+out\s+and\s+not\s+waking|seizure\s+lasting\s+more\s+than)\b",
]

CRISIS_KEYWORDS = [
    r"\b(suicide|suicidal|kill\s+myself|end\s+my\s+life|want\s+to\s+die|self[-\s]?harm|cut\s+myself)\b",
    r"\b(hanging\s+myself|overdose\s+on\s+purpose|hopeless\s+want\s+it\s+to\s+end)\b",
]

MEDICATION_DOSAGE_KEYWORDS = [
    r"\b(how\s+much|how\s+many)\b.*?\b(mg|tablets?|pills?|dose|dosage)\b.*?\b(should\s+i\s+take|can\s+i\s+take|to\s+take)\b",
    r"\b(what\s+dose|what\s+dosage|what\s+amount|what\s+medicine|what\s+medication)\b.*?\b(should\s+i\s+take|to\s+take)\b",
    r"\b(tell\s+me\s+what\s+(medicine|medication|drug|drugs)\s+(i\s+should\s+take|to\s+take))\b",
    r"\b(should\s+i\s+(change|increase|decrease|double|stop)\s+my\s+(medication|medicine)\s+dosage)\b",
    r"\b(can\s+i\s+(double|increase|decrease|stop|quit|change))\b.*?\b(dose|dosage|medication|insulin|metformin|statin|antibiotic|pill)\b",
    r"\b(prescribe\s+me|write\s+a\s+prescription\b|give\s+me\s+a\s+prescription)\b",
]

DIAGNOSIS_REQUEST_KEYWORDS = [
    r"\b(do\s+i\s+have\s+(cancer|diabetes|lupus|a\s+tumor|heart\s+attack|hiv|stroke))\b",
    r"\b(diagnose\s+(me|my\s+symptoms|my\s+rash|this\s+lump))\b",
    r"\b(tell\s+me\s+what\s+disease\s+i\s+have)\b",
]

EMERGENCY_HELPLINES = [
    {"name": "Immediate Emergency Services (USA / Canada)", "number": "911"},
    {"name": "Emergency Medical Services (India)", "number": "108 / 112"},
    {"name": "Emergency Services (Europe / International)", "number": "112"},
    {"name": "Emergency Services (UK)", "number": "999"},
]

CRISIS_HELPLINES = [
    {"name": "988 Suicide & Crisis Lifeline (US/Canada)", "number": "Call or Text 988 (Available 24/7)"},
    {"name": "Crisis Text Line", "number": "Text HOME to 741741"},
    {"name": "Vandrevala Foundation (India Mental Health)", "number": "+91 9999 666 555"},
    {"name": "Tele-MANAS (Govt of India)", "number": "14416 (Toll-Free 24/7)"},
    {"name": "Befrienders Worldwide", "number": "befrienders.org"},
]


class SafetyEngine:
    @staticmethod
    def classify_query(query: str) -> SafetyAlert:
        text = query.lower()

        # 1. Emergency / High-Risk check
        for pattern in EMERGENCY_KEYWORDS:
            if re.search(pattern, text, re.IGNORECASE):
                return SafetyAlert(
                    is_safe=False,
                    risk_category="Emergency",
                    severity="critical",
                    warning_message=(
                        "🚨 CRITICAL ALERT: Your query contains symptoms that may indicate a medical emergency. "
                        "HealthEase AI cannot provide emergency medical triage. Please seek emergency medical care immediately."
                    ),
                    helpline_contacts=EMERGENCY_HELPLINES
                )

        # 2. Crisis / Self-Harm check
        for pattern in CRISIS_KEYWORDS:
            if re.search(pattern, text, re.IGNORECASE):
                return SafetyAlert(
                    is_safe=False,
                    risk_category="Crisis",
                    severity="critical",
                    warning_message=(
                        "💙 You are not alone. If you are experiencing overwhelming emotional distress or thoughts of self-harm, "
                        "compassionate human support is available 24/7. Please connect with a crisis counselor immediately."
                    ),
                    helpline_contacts=CRISIS_HELPLINES
                )

        # 3. Medication Dosage / Prescription check
        for pattern in MEDICATION_DOSAGE_KEYWORDS:
            if re.search(pattern, text, re.IGNORECASE):
                return SafetyAlert(
                    is_safe=False,
                    risk_category="Prescription",
                    severity="medium",
                    warning_message=(
                        "⚠️ Medication Guidance Notice: HealthEase AI is an educational assistant and strictly cannot prescribe "
                        "medications, adjust dosages, or recommend altering pharmaceutical treatments. Never alter your medication dosage "
                        "without direct consultation with your prescribing physician or a licensed pharmacist."
                    ),
                    helpline_contacts=[]
                )

        # 4. Diagnosis Request check
        for pattern in DIAGNOSIS_REQUEST_KEYWORDS:
            if re.search(pattern, text, re.IGNORECASE):
                return SafetyAlert(
                    is_safe=True,
                    risk_category="Diagnosis",
                    severity="low",
                    warning_message=(
                        "🩺 Clinical Diagnostic Notice: HealthEase AI cannot diagnose conditions or illnesses. "
                        "The information provided below explains related physiological concepts for educational purposes only. "
                        "Please schedule an in-person clinical evaluation for an accurate diagnosis."
                    ),
                    helpline_contacts=[]
                )

        # 5. Default General Safe Query
        return SafetyAlert(
            is_safe=True,
            risk_category="General",
            severity="none",
            warning_message=None,
            helpline_contacts=[]
        )

    @staticmethod
    def validate_and_sanitize_output(text: str) -> str:
        """
        Ensures the AI output never contains prescriptive or diagnostic claims.
        """
        prohibited_replacements = [
            (r"\b(i\s+diagnose\s+you\s+with)\b", "your symptoms may be associated with"),
            (r"\b(you\s+definitely\s+have)\b", "this test or symptom commonly relates to"),
            (r"\b(you\s+must\s+take\s+\d+\s*(mg|pills))\b", "a physician may determine an appropriate dosage such as"),
            (r"\b(stop\s+taking\s+your\s+medication)\b", "discuss any medication changes directly with your doctor"),
        ]

        sanitized = text
        for pattern, replacement in prohibited_replacements:
            sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)

        return sanitized

    @staticmethod
    def get_disclaimer() -> str:
        return UNIVERSAL_DISCLAIMER
