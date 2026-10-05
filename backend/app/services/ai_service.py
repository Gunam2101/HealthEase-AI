import os
import re
import json
import httpx
from typing import List, Dict, Any, Optional, Tuple
from app.config import settings
from app.schemas.models import (
    SourceCitation, StructuredSection, ChatResponse, SafetyAlert,
    QuizQuestion, TextSimplifyResponse
)
from app.services.safety_engine import SafetyEngine, UNIVERSAL_DISCLAIMER
from app.services.rag_engine import RAGEngine

# Multilingual dictionaries for clinical translation and preservation
TRANSLATION_DICTIONARY = {
    "ta": {
        "hypertension": "உயர் இரத்த அழுத்தம் (Hypertension)",
        "diabetes": "நீரிழிவு நோய் (Diabetes)",
        "cholesterol": "கொலஸ்ட்ரால் (Cholesterol)",
        "anemia": "இரத்த சோகை (Anemia)",
        "blood pressure": "இரத்த அழுத்தம் (Blood Pressure)",
        "heart": "இதயம் (Heart)",
        "kidney": "சிறுநீரகம் (Kidney)",
        "liver": "ஈரல் (Liver)",
        "glucose": "குளுக்கோஸ் (Glucose)",
        "hemoglobin": "ஹீமோகுளோபின் (Hemoglobin)",
    },
    "hi": {
        "hypertension": "उच्च रक्तचाप (Hypertension)",
        "diabetes": "मधुमेह (Diabetes)",
        "cholesterol": "कोलेस्ट्रॉल (Cholesterol)",
        "anemia": "रक्ताल्पता (Anemia)",
        "blood pressure": "रक्तचाप (Blood Pressure)",
        "heart": "हृदय / दिल (Heart)",
        "kidney": "गुर्दे (Kidney)",
        "liver": "यकृत / लिवर (Liver)",
        "glucose": "ग्लूकोज (Glucose)",
        "hemoglobin": "हीमोग्लोबिन (Hemoglobin)",
    },
    "te": {
        "hypertension": "అధిక రక్తపోటు (Hypertension)",
        "diabetes": "మధుమేహం (Diabetes)",
        "cholesterol": "కొలెస్ట్రాల్ (Cholesterol)",
        "anemia": "రక్తహీనత (Anemia)",
        "blood pressure": "రక్తపోటు (Blood Pressure)",
        "heart": "గుండె (Heart)",
        "kidney": "మూత్రపిండాలు (Kidney)",
        "liver": "కాలేయం (Liver)",
        "glucose": "గ్లూకోజ్ (Glucose)",
        "hemoglobin": "హిమోగ్లోబిన్ (Hemoglobin)",
    },
    "ml": {
        "hypertension": "ഉയർന്ന രക്തസമ്മർദ്ദം (Hypertension)",
        "diabetes": "പ്രമേഹം (Diabetes)",
        "cholesterol": "കൊളസ്ട്രോൾ (Cholesterol)",
        "anemia": "വിളർച്ച (Anemia)",
        "blood pressure": "രക്തസമ്മർദ്ദം (Blood Pressure)",
        "heart": "ഹൃദയം (Heart)",
        "kidney": "വൃക്ക (Kidney)",
        "liver": "കരൾ (Liver)",
        "glucose": "ഗ്ലൂക്കോസ് (Glucose)",
        "hemoglobin": "ഹീമോഗ്ലോബിൻ (Hemoglobin)",
    }
}

class AIService:
    @staticmethod
    def generate_chat_response(
        query: str,
        explanation_level: str = "General Public",
        language: str = "en",
        conversation_id: str = "conv_default",
        document_context: Optional[str] = None
    ) -> ChatResponse:
        # 1. Safety classification
        safety_alert = SafetyEngine.classify_query(query)

        # 2. If Critical Safety Triggered (Emergency or Acute symptoms)
        if not safety_alert.is_safe and safety_alert.severity == "critical":
            emergency_text = (
                "# 🚨 Seek Immediate Medical Help\n\n"
                "The symptoms you described (such as severe chest pain, breathing difficulty, or sudden weakness) "
                "can indicate an acute medical emergency requiring immediate professional evaluation.\n\n"
                "## ⚠️ Immediate Recommended Actions\n\n"
                "- **Call local emergency services immediately** (such as **112**, **108**, or **911**).\n"
                "- Do not drive yourself; request an emergency ambulance with medical personnel.\n"
                "- Rest in a comfortable, seated or slightly reclined position while awaiting help.\n"
                "- If you are with someone, alert them right away about your symptoms.\n\n"
                "## 👨‍⚕️ Clinical Safety Context\n\n"
                "HealthEase AI provides educational information and is not equipped to triage or diagnose acute emergencies. "
                "Please do not wait or research symptoms online when emergency symptoms are present.\n\n"
                f"> {UNIVERSAL_DISCLAIMER}"
            )
            return ChatResponse(
                conversation_id=conversation_id,
                message_id=f"msg_{os.urandom(4).hex()}",
                content=emergency_text,
                explanation_level=explanation_level,
                language=language,
                safety=safety_alert,
                sources=[],
                follow_ups=[
                    "Find nearest emergency hospital",
                    "Emergency First Aid basics",
                    "What to tell the emergency dispatcher"
                ],
                structured_sections=[
                    StructuredSection(
                        title="Immediate Action Required",
                        content="Contact local emergency services immediately. Do not attempt self-treatment or online symptom checks."
                    )
                ],
                disclaimer=UNIVERSAL_DISCLAIMER
            )

        # 3. If Medication Prescription / Dosage Request
        if safety_alert.risk_category == "Prescription":
            prescription_text = (
                "# ⚠️ Medication Safety Notice\n\n"
                "HealthEase AI cannot prescribe medication, recommend specific drugs, or provide medication dosage changes.\n\n"
                "## 💡 Why Dosage Guidance Requires a Physician\n\n"
                "Pharmaceutical dosing and drug selection require an individual evaluation by a licensed healthcare professional or pharmacist. "
                "Proper dosing depends on your complete clinical history, kidney and liver function, body mass, and existing medications.\n\n"
                "## 📋 Recommended Steps for Your Health\n\n"
                "- Consult your prescribing doctor or a licensed pharmacist before starting, changing, or discontinuing any medication.\n"
                "- Keep an up-to-date medication log with doses and schedules to share at your appointments.\n"
                "- Report any unusual symptoms or side effects directly to your clinical care team.\n\n"
                "## 👨‍⚕️ Questions for Your Doctor or Pharmacist\n\n"
                "- *What is the exact intended benefit of this medication?*\n"
                "- *Are there potential interactions with my current supplements or foods?*\n"
                "- *What should I do if I accidentally miss a dose?*\n\n"
                f"> {UNIVERSAL_DISCLAIMER}"
            )
            return ChatResponse(
                conversation_id=conversation_id,
                message_id=f"msg_{os.urandom(4).hex()}",
                content=prescription_text,
                explanation_level=explanation_level,
                language=language,
                safety=safety_alert,
                sources=RAGEngine.retrieve_relevant_sources("medication safety"),
                follow_ups=[
                    "What questions should I ask my pharmacist about my prescription?",
                    "Why do medication dosages differ between individuals?",
                    "How to keep a safe medication log for my doctor"
                ],
                structured_sections=[
                    StructuredSection(
                        title="Medication Guidance Policy",
                        content="Prescriptions require licensed professional clinical correlation and medical review."
                    )
                ],
                disclaimer=UNIVERSAL_DISCLAIMER
            )

        # 4. If Diagnostic Invalidation ("Do I have diabetes?", etc.)
        if safety_alert.risk_category == "Diagnosis":
            diagnosis_text = (
                "# 🩺 Clinical Diagnosis & Professional Evaluation\n\n"
                "HealthEase AI provides educational health information and cannot diagnose medical conditions or confirm illnesses.\n\n"
                "## 💡 How Clinical Diagnoses Are Made\n\n"
                "A medical diagnosis cannot be established from symptoms or self-reported numbers alone. "
                "Doctors evaluate physical exams, verified lab tests, and clinical medical history together.\n\n"
                "## 📋 Next Educational Steps\n\n"
                "- Schedule a consultation with a primary care physician for comprehensive clinical evaluation.\n"
                "- Take note of when symptoms occur, their frequency, and any contributing factors.\n"
                "- Review standard laboratory biomarkers (such as HbA1c or fasting glucose) with your clinician.\n\n"
                "## 👨‍⚕️ Clinical Guidance\n\n"
                "Consider discussing your symptoms or health concerns with a qualified healthcare professional who can perform standard diagnostic evaluations.\n\n"
                f"> {UNIVERSAL_DISCLAIMER}"
            )
            return ChatResponse(
                conversation_id=conversation_id,
                message_id=f"msg_{os.urandom(4).hex()}",
                content=diagnosis_text,
                explanation_level=explanation_level,
                language=language,
                safety=safety_alert,
                sources=RAGEngine.retrieve_relevant_sources("medical diagnosis"),
                follow_ups=[
                    "What lab tests are commonly used to evaluate this condition?",
                    "How can I prepare for my upcoming doctor appointment?",
                    "What lifestyle habits support overall metabolic health?"
                ],
                structured_sections=[
                    StructuredSection(
                        title="Clinical Evaluation Notice",
                        content="Formal diagnoses require an in-person physician consultation and laboratory validation."
                    )
                ],
                disclaimer=UNIVERSAL_DISCLAIMER
            )

        # 5. Retrieve RAG Sources
        rag_sources = RAGEngine.retrieve_relevant_sources(query)

        # 6. Attempt Gemini AI Generation with structured system prompt
        gemini_result = None
        if settings.GEMINI_API_KEY:
            gemini_result = AIService._call_gemini_api(
                query=query,
                level=explanation_level,
                language=language,
                document_context=document_context,
                sources=rag_sources
            )

        if gemini_result:
            sections, main_text, follow_ups = gemini_result
        else:
            # 7. Fallback to upgraded built-in clinical reasoning engine
            sections, main_text, follow_ups = AIService._synthesize_educational_explanation(
                query=query,
                level=explanation_level,
                sources=rag_sources,
                document_context=document_context
            )

        # 8. Apply Localization / Translation if requested and not in English
        if language != "en":
            main_text, sections = AIService._localize_content(main_text, sections, language)

        # 9. Output sanitization
        main_text = SafetyEngine.validate_and_sanitize_output(main_text)

        return ChatResponse(
            conversation_id=conversation_id,
            message_id=f"msg_{os.urandom(4).hex()}",
            content=main_text,
            explanation_level=explanation_level,
            language=language,
            safety=safety_alert,
            sources=rag_sources,
            follow_ups=follow_ups,
            structured_sections=sections,
            disclaimer=UNIVERSAL_DISCLAIMER
        )

    @staticmethod
    def _generate_with_gemini(prompt: str) -> Optional[str]:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return None
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 800
            }
        }
        try:
            with httpx.Client(timeout=8.0) as client:
                response = client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text:
                            return text
        except Exception:
            pass
        return None

    @staticmethod
    def _localize_content(
        text: str,
        sections: List[StructuredSection],
        language: str
    ) -> Tuple[str, List[StructuredSection]]:
        if not language or language == "en":
            return text, sections

        dict_map = TRANSLATION_DICTIONARY.get(language, {})
        localized_text = text
        for en_term, loc_term in dict_map.items():
            pattern = re.compile(re.escape(en_term), re.IGNORECASE)
            localized_text = pattern.sub(loc_term, localized_text)

        # Localize standard Markdown health section headings
        if language == "ta":
            localized_text = localized_text.replace("## 💡 Why Does It Matter?", "## 💡 இது ஏன் முக்கியமானது?")
            localized_text = localized_text.replace("## 🌱 Healthy Everyday Habits", "## 🌱 ஆரோக்கியமான அன்றாடப் பழக்கங்கள்")
            localized_text = localized_text.replace("## 👨‍⚕️ Clinical Context", "## 👨‍⚕️ மருத்துவ வழிகாட்டல்")
            localized_text = localized_text.replace("## 📊 Commonly Used Ranges", "## 📊 பொதுவான வரம்புகள்")
            localized_text = localized_text.replace("## 📊 Blood Pressure Categories", "## 📊 இரத்த அழுத்த நிலைகள்")
            localized_text = localized_text.replace("## 🔍 Common Symptoms & Manifestations", "## 🔍 பொதுவான அறிகுறிகள்")
        elif language == "hi":
            localized_text = localized_text.replace("## 💡 Why Does It Matter?", "## 💡 यह क्यों महत्वपूर्ण है?")
            localized_text = localized_text.replace("## 🌱 Healthy Everyday Habits", "## 🌱 स्वस्थ दैनिक आदतें")
            localized_text = localized_text.replace("## 👨‍⚕️ Clinical Context", "## 👨‍⚕️ चिकित्सीय मार्गदर्शन")
            localized_text = localized_text.replace("## 📊 Commonly Used Ranges", "## 📊 सामान्य सीमाएं")
            localized_text = localized_text.replace("## 📊 Blood Pressure Categories", "## 📊 रक्तचाप की श्रेणियां")
            localized_text = localized_text.replace("## 🔍 Common Symptoms & Manifestations", "## 🔍 सामान्य लक्षण")

        localized_sections = []
        for s in sections:
            s_title = s.title
            s_content = s.content
            for en_term, loc_term in dict_map.items():
                pattern = re.compile(re.escape(en_term), re.IGNORECASE)
                s_title = pattern.sub(loc_term, s_title)
                s_content = pattern.sub(loc_term, s_content)
            localized_sections.append(StructuredSection(title=s_title, content=s_content))

        return localized_text, localized_sections

    @staticmethod
    def _call_gemini_api(
        query: str,
        level: str,
        language: str,
        document_context: Optional[str],
        sources: List[SourceCitation]
    ) -> Optional[Tuple[List[StructuredSection], str, List[str]]]:
        """
        Invokes Google Gemini with strict structured health prompt guidelines.
        """
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return None

        system_instruction = (
            "You are HealthEase AI, an educational health information assistant.\n"
            "Your job is to explain general health information clearly, safely, and educationally.\n"
            "Always prioritize clarity, structure, readability, and responsible medical communication.\n\n"
            "RESPONSE STRUCTURE GUIDELINES:\n"
            "Structure your answer using clean Markdown:\n"
            "# 🩺 [TOPIC TITLE]\n"
            "[2–4 sentence simple explanation]\n\n"
            "## 💡 Why Does It Matter?\n"
            "[Clear explanation of relevance and body mechanism]\n\n"
            "## 📊 Key Information / Commonly Used Ranges\n"
            "[Whenever the response contains categories, numerical ranges, thresholds, or comparisons, "
            "format them as a clean Markdown TABLE with columns such as | Metric / Level | General Interpretation |]\n\n"
            "## 🌱 Healthy Everyday Habits\n"
            "- [Point 1]\n"
            "- [Point 2]\n"
            "- [Point 3]\n\n"
            "## 👨‍⚕️ Clinical Context\n"
            "[Professional-context explanation advising discussion with a healthcare provider]\n\n"
            "RULES:\n"
            "1. Adapt explanation depth to the requested persona level.\n"
            "2. Never diagnose illnesses, prescribe medications, or recommend dosages.\n"
            "3. Use medically responsible wording like 'commonly', 'general range', 'may'.\n"
            "4. For comparisons (e.g. Type 1 vs Type 2), use a structured comparison table.\n"
            "5. For symptoms, use clean bullet points.\n"
            "6. For lifestyle / how-to, use numbered or bulleted practical steps.\n"
            "7. End with exactly:\n"
            "> ⚠️ HealthEase AI provides general health information for educational purposes only. It does not replace professional medical advice, diagnosis, or treatment.\n"
        )

        user_prompt = (
            f"User Question: {query}\n"
            f"Explanation Level / Persona: {level}\n"
            f"Language: {language}\n"
        )
        if level == "School Student":
            user_prompt += "\nPERSONA GUIDANCE: Use simple, engaging real-world analogies (e.g. comparing blood vessels to a garden hose or plumbing pipes) so a student can visualize the concept easily.\n"

        if language == "ta":
            user_prompt += (
                "\nLANGUAGE INSTRUCTION: Respond in Tamil while preserving important medical terminology in English in parentheses where useful "
                "(e.g., உயர் இரத்த அழுத்தம் (Hypertension), இரத்த சோகை (Anemia), நீரிழிவு நோய் (Diabetes)). "
                "Ensure natural phrasing that understands code-mixed queries (Tanglish/Tamil) directly.\n"
            )
        elif language == "hi":
            user_prompt += (
                "\nLANGUAGE INSTRUCTION: Respond in Hindi while preserving important medical terminology in English in parentheses where useful "
                "(e.g., उच्च रक्तचाप (Hypertension), रक्ताल्पता (Anemia), मधुमेह (Diabetes)). "
                "Ensure natural phrasing that understands code-mixed queries (Hinglish/Hindi) directly.\n"
            )

        if document_context:
            user_prompt += f"\nUploaded Health Document Context:\n{document_context[:1500]}\n"

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_instruction}\n\n{user_prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1000
            }
        }

        try:
            with httpx.Client(timeout=8.0) as client:
                response = client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text:
                            # Ensure disclaimer is at the end
                            if "HealthEase AI provides general health information" not in text:
                                text += f"\n\n> {UNIVERSAL_DISCLAIMER}"

                            # Generate dynamic follow-up questions
                            follow_ups = AIService._generate_follow_ups(query)
                            sections = [StructuredSection(title="Health Information", content=text)]
                            return sections, text, follow_ups
        except Exception as e:
            # Fallback seamlessly to the internal engine on any network, timeout, or rate-limit issue
            pass

        return None

    @staticmethod
    def _generate_follow_ups(query: str) -> List[str]:
        q = query.lower()
        if "hba1c" in q:
            return [
                "Why does HbA1c reflect 2 to 3 months of blood glucose?",
                "What factors can temporarily influence an HbA1c reading?",
                "How do dietary fiber and protein help stabilize blood sugar?"
            ]
        elif "hypertension" in q or "blood pressure" in q:
            return [
                "What is the difference between systolic and diastolic numbers?",
                "How does dietary sodium intake affect blood pressure?",
                "What is the recommended way to measure blood pressure at home?"
            ]
        elif "anemia" in q or "iron" in q:
            return [
                "What is the difference between dietary iron and stored ferritin?",
                "Why does Vitamin C enhance iron absorption in the gut?",
                "What other tests are commonly included in a Complete Blood Count (CBC)?"
            ]
        elif "sleep" in q:
            return [
                "How does blue light from screens affect melatonin production?",
                "What is the ideal bedroom temperature for deep sleep?",
                "How long before bed should caffeine be avoided?"
            ]
        elif "cholesterol" in q:
            return [
                "What is the difference between LDL and HDL cholesterol?",
                "How do soluble fibers help lower circulating cholesterol?",
                "What lifestyle habits support healthy triglyceride levels?"
            ]
        elif "type 1" in q or "type 2" in q:
            return [
                "How does the pancreas regulate insulin in healthy individuals?",
                "What is insulin resistance and how does it develop?",
                "What questions should I ask my doctor about diabetes prevention?"
            ]
        return [
            f"What lifestyle habits support {query}?",
            "What questions should I ask my doctor about this topic?",
            "What are common misconceptions about this health area?"
        ]

    @staticmethod
    def _synthesize_educational_explanation(
        query: str,
        level: str,
        sources: List[SourceCitation],
        document_context: Optional[str] = None
    ) -> Tuple[List[StructuredSection], str, List[str]]:
        q_lower = query.lower()
        sections = []
        follow_ups = []

        # =========================================================================
        # TYPE 1: DEFINITION & RANGE — HbA1c / Glycemic Markers
        # =========================================================================
        if any(w in q_lower for w in ["hba1c", "a1c", "glycated"]):
            simple = (
                "**HbA1c (Glycated Hemoglobin)** is a standard blood test that measures your average blood glucose (sugar) "
                "levels over the preceding 2 to 3 months. As glucose naturally circulates in your bloodstream, a portion attaches "
                "to hemoglobin, the oxygen-carrying protein inside your red blood cells."
            )
            why_matters = (
                "Unlike a single finger-prick test that reflects your blood sugar at a single point in time, HbA1c offers a "
                "comprehensive, stable picture of your overall glycemic balance. Because red blood cells live for about 90 to 120 days, "
                "the test is not skewed by what you ate earlier that morning."
            )
            ranges_table = (
                "| HbA1c Level | Commonly Used Clinical Interpretation |\n"
                "|---|---|\n"
                "| **Below 5.7%** | Normal range |\n"
                "| **5.7% – 6.4%** | Prediabetes range |\n"
                "| **6.5% or higher** | Diabetes threshold range (confirmed across separate tests) |"
            )
            habits = (
                "- **Prioritize Dietary Fiber**: Incorporate leafy vegetables, legumes, whole grains, and chia seeds to slow carbohydrate absorption.\n"
                "- **Balance Meals with Protein**: Pairing complex carbohydrates with lean protein and healthy fats helps blunt post-meal blood sugar spikes.\n"
                "- **Daily Movement**: Engage in 20–30 minutes of brisk walking, swimming, or resistance activity to help muscle cells absorb glucose.\n"
                "- **Stay Consistently Hydrated**: Drinking adequate water assists your kidneys in flushing out surplus glucose through urine."
            )
            clinical_context = (
                "Target ranges can vary based on individual age, medical history, and clinical goals. "
                "Always discuss your specific laboratory report with your physician or endocrinologist for personalized interpretation."
            )

            main_text = (
                "# 🩺 What is HbA1c?\n\n"
                f"{simple}\n\n"
                "## 💡 Why Does It Matter?\n\n"
                f"{why_matters}\n\n"
                "## 📊 Commonly Used Ranges\n\n"
                f"{ranges_table}\n\n"
                "## 🌱 Healthy Everyday Habits\n\n"
                f"{habits}\n\n"
                "## 👨‍⚕️ Clinical Context\n\n"
                f"{clinical_context}\n\n"
                f"> {UNIVERSAL_DISCLAIMER}"
            )
            sections = [
                StructuredSection(title="Definition", content=simple),
                StructuredSection(title="Why It Matters", content=why_matters),
                StructuredSection(title="Common Ranges", content=ranges_table),
                StructuredSection(title="Everyday Habits", content=habits),
                StructuredSection(title="Clinical Context", content=clinical_context),
            ]
            follow_ups = [
                "Why does HbA1c reflect 2 to 3 months instead of just one day?",
                "What is the difference between Type 1 and Type 2 diabetes?",
                "How does physical activity help muscles absorb glucose?",
                "What questions should I ask my doctor about my HbA1c report?"
            ]

        # =========================================================================
        # TYPE 1: DEFINITION & RANGE — Hypertension / Blood Pressure
        # =========================================================================
        elif any(w in q_lower for w in ["hypertension", "blood pressure", "bp", "high pressure"]):
            if level == "School Student":
                simple = (
                    "**Hypertension** is the medical term for high blood pressure. "
                    "Think of your blood vessels like a garden hose: when the tap is turned up too high, the water pushes harder against the inside of the hose. "
                    "In your body, hypertension means your blood is pushing too hard against your artery walls as your heart pumps."
                )
            else:
                simple = (
                    "**Hypertension** means your blood pressure is consistently higher than the recommended healthy range. "
                    "Blood pressure is the measurement of the lateral force that circulating blood exerts against the walls of your arteries as your heart pumps."
                )
            why_matters = (
                "Because elevated blood pressure rarely produces noticeable early symptoms, it is widely referred to as a 'silent condition.' "
                "Over time, untreated high arterial pressure can place extra mechanical workload on your heart, damage delicate blood vessels, "
                "and strain the kidneys and brain."
            )
            bp_table = (
                "| Blood Pressure Category | Systolic (Top Number) | Diastolic (Bottom Number) |\n"
                "|---|---|---|\n"
                "| **Normal** | Less than 120 mmHg | Less than 80 mmHg |\n"
                "| **Elevated** | 120 – 129 mmHg | Less than 80 mmHg |\n"
                "| **Stage 1 Hypertension** | 130 – 139 mmHg | 80 – 89 mmHg |\n"
                "| **Stage 2 Hypertension** | 140 mmHg or higher | 90 mmHg or higher |"
            )
            habits = (
                "- **Moderate Sodium Intake**: Flavor meals with garlic, lemon, and aromatic herbs rather than excessive table salt.\n"
                "- **DASH Dietary Pattern**: Emphasize potassium-rich foods like bananas, spinach, sweet potatoes, and avocados.\n"
                "- **Routine Aerobic Exercise**: Aim for 150 minutes per week of moderate-intensity exercise such as brisk walking or cycling.\n"
                "- **Manage Rest & Stress**: Practice gentle breathing exercises, maintain 7–8 hours of restorative sleep, and moderate alcohol intake."
            )
            clinical_context = (
                "A single high reading does not automatically confirm chronic hypertension. "
                "Physicians typically look at multiple readings recorded while seated calmly across several days or weeks."
            )

            main_text = (
                "# 🩺 Understanding Hypertension\n\n"
                f"{simple}\n\n"
                "## 💡 Why Does It Matter?\n\n"
                f"{why_matters}\n\n"
                "## 📊 Blood Pressure Categories\n\n"
                f"{bp_table}\n\n"
                "## 🌱 Healthy Everyday Habits\n\n"
                f"{habits}\n\n"
                "## 👨‍⚕️ Clinical Context\n\n"
                f"{clinical_context}\n\n"
                f"> {UNIVERSAL_DISCLAIMER}"
            )
            sections = [
                StructuredSection(title="Definition", content=simple),
                StructuredSection(title="Why It Matters", content=why_matters),
                StructuredSection(title="Blood Pressure Categories", content=bp_table),
                StructuredSection(title="Everyday Habits", content=habits),
                StructuredSection(title="Clinical Context", content=clinical_context),
            ]
            follow_ups = [
                "What is the difference between systolic and diastolic numbers?",
                "How does dietary sodium influence blood pressure?",
                "What is the best way to measure blood pressure accurately at home?",
                "What role does exercise play in cardiovascular health?"
            ]

        # =========================================================================
        # TYPE 2: SYMPTOMS — Anemia / Hemoglobin / Low Red Blood Cells
        # =========================================================================
        elif any(w in q_lower for w in ["anemia", "symptom", "hemoglobin", "low iron"]):
            simple = (
                "**Anemia** is a condition in which your body has fewer healthy red blood cells or a lower concentration of "
                "**hemoglobin** than normal. Because hemoglobin binds and transports oxygen throughout the circulatory system, "
                "reduced levels mean your vital organs and muscles receive less oxygen to produce energy."
            )
            symptoms_list = (
                "- **Persistent Fatigue & Low Energy**: Feeling unusually tired despite getting adequate nightly rest.\n"
                "- **Pale Skin or Nail Beds**: A noticeably lighter complexion or pale conjunctiva inside the lower eyelids.\n"
                "- **Cold Extremities**: Frequently having cold hands and feet due to reduced peripheral oxygen delivery.\n"
                "- **Mild Dizziness or Lightheadedness**: Feeling unsteady, particularly when standing up quickly.\n"
                "- **Shortness of Breath**: Breathing faster during light exertion like climbing stairs."
            )
            when_seek = (
                "- Unexplained, worsening shortness of breath or rapid heartbeat with minimal movement.\n"
                "- Dizziness accompanied by fainting or chest tightness.\n"
                "- Unusually heavy menstrual cycles or noticeable blood in your stool."
            )
            habits = (
                "- **Iron-Rich Foods**: Consume dark leafy greens, lentils, beans, fortified cereals, and lean meats.\n"
                "- **Pair with Vitamin C**: Eating bell peppers, oranges, or tomatoes alongside plant-based iron enhances absorption.\n"
                "- **Avoid Tea with Meals**: Tannins in black tea and coffee can temporarily hinder non-heme iron absorption."
            )
            clinical_context = (
                "Anemia is a clinical sign with many potential causes—including dietary iron deficiency, vitamin B12 deficit, "
                "or blood loss. A standard Complete Blood Count (CBC) test helps your doctor pinpoint the exact root cause."
            )

            main_text = (
                "# 🩺 Anemia: Symptoms & Overview\n\n"
                f"{simple}\n\n"
                "## 🔍 Common Symptoms\n\n"
                f"{symptoms_list}\n\n"
                "## ⚠️ When to Seek Medical Attention\n\n"
                f"{when_seek}\n\n"
                "## 🌱 Nutritional Everyday Habits\n\n"
                f"{habits}\n\n"
                "## 👨‍⚕️ Clinical Context\n\n"
                f"{clinical_context}\n\n"
                f"> {UNIVERSAL_DISCLAIMER}"
            )
            sections = [
                StructuredSection(title="Overview", content=simple),
                StructuredSection(title="Symptoms", content=symptoms_list),
                StructuredSection(title="When to Seek Help", content=when_seek),
                StructuredSection(title="Habits", content=habits),
                StructuredSection(title="Clinical Context", content=clinical_context),
            ]
            follow_ups = [
                "What is the difference between dietary iron and stored ferritin?",
                "Why does Vitamin C enhance iron absorption in the gut?",
                "What does Mean Corpuscular Volume (MCV) mean on a blood test?",
                "What other tests are commonly ordered alongside a CBC?"
            ]

        # =========================================================================
        # TYPE 3: COMPARISON — Type 1 vs Type 2 Diabetes
        # =========================================================================
        elif any(w in q_lower for w in ["type 1", "type 2", "difference between", "compare diabetes"]):
            overview = (
                "While both **Type 1** and **Type 2 diabetes** affect how your body regulates blood glucose (sugar), "
                "they have fundamentally different biological causes, typical onset patterns, and primary management strategies."
            )
            comparison_table = (
                "| Feature | Type 1 Diabetes | Type 2 Diabetes |\n"
                "|---|---|---|\n"
                "| **Primary Cause** | Autoimmune destruction of insulin-producing beta cells in the pancreas | Progressive insulin resistance where cells do not respond effectively to insulin |\n"
                "| **Insulin Production** | The body produces little or no natural insulin | The body still produces insulin, but cannot produce enough to overcome resistance |\n"
                "| **Typical Age of Onset** | Most commonly diagnosed in children, teens, and young adults | Most commonly diagnosed in adults, though increasingly seen in youth |\n"
                "| **Primary Management** | Mandatory daily insulin therapy (via injections or continuous insulin pump) | Lifestyle modification, balanced nutrition, oral medications, and insulin if required |\n"
                "| **Prevention** | Currently cannot be prevented through lifestyle measures | Can often be prevented or delayed through regular physical activity and balanced diet |"
            )
            key_diff = (
                "The core distinction is that **Type 1 diabetes** is an autoimmune condition where the body cannot manufacture insulin, "
                "whereas **Type 2 diabetes** is primarily a metabolic condition where the body's tissues have developed resistance to insulin's effects."
            )
            guidance = (
                "Both forms of diabetes benefit from continuous glycemic monitoring, balanced nutrition, and close collaboration "
                "with an endocrinologist and certified diabetes care educator."
            )

            main_text = (
                "# ⚖️ Type 1 vs. Type 2 Diabetes\n\n"
                f"{overview}\n\n"
                "## 📊 Key Differences at a Glance\n\n"
                f"{comparison_table}\n\n"
                "## 💡 Key Clinical Takeaways\n\n"
                f"{key_diff}\n\n"
                "## 👨‍⚕️ Clinical Guidance\n\n"
                f"{guidance}\n\n"
                f"> {UNIVERSAL_DISCLAIMER}"
            )
            sections = [
                StructuredSection(title="Overview", content=overview),
                StructuredSection(title="Comparison Table", content=comparison_table),
                StructuredSection(title="Key Difference", content=key_diff),
                StructuredSection(title="Clinical Guidance", content=guidance),
            ]
            follow_ups = [
                "What is the role of insulin in the human body?",
                "What is insulin resistance and how does it develop?",
                "How does an HbA1c test help monitor both types of diabetes?",
                "What are common early warning signs of blood sugar imbalance?"
            ]

        # =========================================================================
        # TYPE 4: HOW-TO / LIFESTYLE — Sleep Improvement & Sleep Hygiene
        # =========================================================================
        elif any(w in q_lower for w in ["sleep", "insomnia", "rest", "improve sleep"]):
            simple = (
                "Quality sleep is a foundational pillar of cardiovascular health, cognitive focus, immune resilience, "
                "and metabolic regulation. Evidence-based **sleep hygiene** involves optimizing both your daily habits and bedroom environment."
            )
            sleep_steps = (
                "1. **Maintain a Consistent Sleep Schedule**: Go to bed and wake up at the exact same time every day—including weekends—to reinforce your circadian rhythm.\n"
                "2. **Implement an Evening Screen Curfew**: Turn off smartphones, tablets, and computers 45–60 minutes before bed; blue light suppresses natural melatonin release.\n"
                "3. **Optimize Bedroom Conditions**: Keep your sleeping room dark, quiet, and cool (around 65°F / 18°C is widely recommended for core temperature drop).\n"
                "4. **Limit Evening Stimulants**: Avoid caffeinated coffee, tea, and heavy meals within 6 hours of bedtime to prevent nocturnal micro-awakenings.\n"
                "5. **Morning Sunlight Exposure**: Step outside into natural daylight for 10–15 minutes within an hour of waking to anchor your biological clock."
            )
            why_helps = (
                "During deep non-REM and REM sleep cycles, your brain flushes metabolic waste products, muscle tissues repair, "
                "blood pressure dips, and hormone levels (like cortisol and growth hormone) reach restorative equilibrium."
            )
            when_seek = (
                "- Chronic difficulty falling or staying asleep that persists for more than 3 weeks.\n"
                "- Loud, gasping snoring, morning headaches, or waking up gasping for air (indicators of obstructive sleep apnea).\n"
                "- Excessive daytime sleepiness that interferes with driving or work."
            )

            main_text = (
                "# 🌙 Evidence-Based Sleep Habits\n\n"
                f"{simple}\n\n"
                "## 🛏️ Healthy Everyday Sleep Habits\n\n"
                f"{sleep_steps}\n\n"
                "## 💡 Why Does It Matter?\n\n"
                f"{why_helps}\n\n"
                "## ⚠️ When to Seek Professional Guidance\n\n"
                f"{when_seek}\n\n"
                f"> {UNIVERSAL_DISCLAIMER}"
            )
            sections = [
                StructuredSection(title="Overview", content=simple),
                StructuredSection(title="Healthy Habits", content=sleep_steps),
                StructuredSection(title="Why It Matters", content=why_helps),
                StructuredSection(title="When to Seek Help", content=when_seek),
            ]
            follow_ups = [
                "How does blue light from screens disrupt melatonin production?",
                "What is the biological difference between deep sleep and REM sleep?",
                "How does lack of sleep influence blood pressure and appetite?",
                "What questions should I ask my doctor about chronic insomnia?"
            ]

        # =========================================================================
        # TYPE 1: DEFINITION & RANGE — Cholesterol & Lipid Panels
        # =========================================================================
        elif any(w in q_lower for w in ["cholesterol", "lipid", "ldl", "hdl", "triglyceride"]):
            simple = (
                "**Cholesterol** is a waxy, fat-like substance found in all cells of your body. "
                "Your liver naturally manufactures all the cholesterol you need to produce cell membranes, vitamin D, and essential hormones."
            )
            why_matters = (
                "Because cholesterol travels through the bloodstream wrapped in protein carriers called **lipoproteins**, "
                "having an imbalance—especially elevated low-density lipoprotein (**LDL**)—can lead to gradual plaque buildup in arterial walls."
            )
            lipid_table = (
                "| Lipid Biomarker | Commonly Recommended Range | General Clinical Role |\n"
                "|---|---|---|\n"
                "| **Total Cholesterol** | Below 200 mg/dL | Overall measure of cholesterol in blood |\n"
                "| **LDL ('Low-Density')** | Below 100 mg/dL | Transports cholesterol to cells; excess can contribute to arterial plaque |\n"
                "| **HDL ('High-Density')** | 50 mg/dL or higher | Helps carry excess cholesterol back to the liver for clearance |\n"
                "| **Triglycerides** | Below 150 mg/dL | Common fat type in blood; elevated levels link to metabolic strain |"
            )
            habits = (
                "- **Increase Soluble Fiber**: Oats, barley, beans, lentils, and apples act like a sponge in the digestive tract to bind cholesterol.\n"
                "- **Choose Healthy Unsaturated Fats**: Substitute saturated fats (butter, fatty cuts) with olive oil, walnuts, flaxseeds, and fatty fish.\n"
                "- **Regular Physical Activity**: Moderate aerobic exercise boosts protective HDL levels and lowers triglycerides.\n"
                "- **Avoid Trans Fats**: Eliminate partially hydrogenated oils found in ultra-processed snacks and fried foods."
            )
            clinical_context = (
                "Individual cardiovascular risk depends on your overall health profile—including blood pressure, smoking status, age, "
                "and family history—rather than cholesterol numbers alone. Review your full lipid panel with your physician."
            )

            main_text = (
                "# 🩺 Understanding Cholesterol\n\n"
                f"{simple}\n\n"
                "## 💡 Why Does It Matter?\n\n"
                f"{why_matters}\n\n"
                "## 📊 General Lipid Panel Ranges\n\n"
                f"{lipid_table}\n\n"
                "## 🌱 Heart-Healthy Habits\n\n"
                f"{habits}\n\n"
                "## 👨‍⚕️ Clinical Context\n\n"
                f"{clinical_context}\n\n"
                f"> {UNIVERSAL_DISCLAIMER}"
            )
            sections = [
                StructuredSection(title="Definition", content=simple),
                StructuredSection(title="Why It Matters", content=why_matters),
                StructuredSection(title="Lipid Panel Ranges", content=lipid_table),
                StructuredSection(title="Healthy Habits", content=habits),
                StructuredSection(title="Clinical Context", content=clinical_context),
            ]
            follow_ups = [
                "What is the difference between LDL and HDL cholesterol?",
                "How do dietary soluble fibers help lower circulating cholesterol?",
                "What are triglycerides and why do they matter for heart health?",
                "What lifestyle changes are most effective for improving lipid panels?"
            ]

        # =========================================================================
        # TYPE 5: REPORT / TEST — Blood Test Interpretation & Document Context
        # =========================================================================
        elif document_context or any(w in q_lower for w in ["blood test", "report", "test mean", "explain my report"]):
            simple = (
                "Laboratory blood tests analyze cellular components, enzymes, electrolytes, and metabolic markers in your bloodstream. "
                "Interpreting a lab report involves comparing your specific numerical values against established population **reference ranges**."
            )
            test_table = (
                "| Common Test Marker | Typical Reference Interval | Primary Clinical Function |\n"
                "|---|---|---|\n"
                "| **Hemoglobin (Hb)** | 12.0 – 16.0 g/dL (adults) | Oxygen delivery via red blood cells |\n"
                "| **White Blood Cells (WBC)** | 4,000 – 11,000 /µL | Immune defense against infections |\n"
                "| **Platelets** | 150,000 – 450,000 /µL | Essential blood clotting and wound healing |\n"
                "| **Fasting Blood Glucose** | 70 – 99 mg/dL | Baseline energy regulation in blood |"
            )
            indicate = (
                "- **Values within reference ranges** typically indicate expected baseline organ and metabolic function.\n"
                "- **Values slightly outside ranges** do not automatically signify illness; temporary factors like hydration, exercise, and diet can influence results.\n"
                "- **Trends over time** provide significantly more valuable clinical insight than a single isolated measurement."
            )
            doc_questions = (
                "- *What do these specific test values indicate in context with my physical symptoms?*\n"
                "- *Are any temporary factors (such as recent meals or stress) likely to have influenced these numbers?*\n"
                "- *Are any follow-up blood tests or lifestyle modifications recommended?*"
            )

            main_text = (
                "# 📄 Laboratory Test Overview\n\n"
                f"{simple}\n\n"
                "## 📊 Common Laboratory Markers\n\n"
                f"{test_table}\n\n"
                "## 💡 What Results May Indicate\n\n"
                f"{indicate}\n\n"
                "## 👨‍⚕️ Questions for Your Doctor\n\n"
                f"{doc_questions}\n\n"
                f"> {UNIVERSAL_DISCLAIMER}"
            )
            sections = [
                StructuredSection(title="Overview", content=simple),
                StructuredSection(title="Common Markers", content=test_table),
                StructuredSection(title="Interpretation", content=indicate),
                StructuredSection(title="Doctor Questions", content=doc_questions),
            ]
            follow_ups = [
                "What factors can temporarily skew laboratory test values?",
                "What is the difference between a screening test and a diagnostic test?",
                "How should I prepare for a routine fasting blood draw?"
            ]

        # =========================================================================
        # TYPE 6: COMPLEX / GENERAL HEALTH TOPIC
        # =========================================================================
        else:
            simple = (
                f"In health education, **{query.title()}** relates to physiological homeostasis, preventive wellness, and biological balance. "
                "Developing health literacy in this area empowers you to communicate proactively with your healthcare team."
            )
            why_matters = (
                "Maintaining bodily balance across cardiovascular, metabolic, and immune systems supports sustained vitality, "
                "cognitive sharpness, and long-term disease prevention."
            )
            habits = (
                "- **Balanced Whole-Food Nutrition**: Prioritize unrefined foods, colorful produce, healthy fats, and adequate protein.\n"
                "- **Consistent Daily Hydration**: Maintain 2 to 3 liters of fluid intake daily for cellular waste filtration.\n"
                "- **Restorative Sleep Cycles**: Ensure 7 to 9 hours of uninterrupted sleep each night for tissue recovery.\n"
                "- **Proactive Clinical Screenings**: Schedule regular annual wellness evaluations with your primary healthcare provider."
            )
            clinical_context = (
                "Every individual has a unique physiological profile. Discuss personal health concerns, family history, "
                "and preventive screening schedules with a qualified physician."
            )

            main_text = (
                f"# 🩺 Health Overview: {query.title()}\n\n"
                f"{simple}\n\n"
                "## 💡 Why Does It Matter?\n\n"
                f"{why_matters}\n\n"
                "## 🌱 Healthy Everyday Habits\n\n"
                f"{habits}\n\n"
                "## 👨‍⚕️ Clinical Context\n\n"
                f"{clinical_context}\n\n"
                f"> {UNIVERSAL_DISCLAIMER}"
            )
            sections = [
                StructuredSection(title="Overview", content=simple),
                StructuredSection(title="Why It Matters", content=why_matters),
                StructuredSection(title="Everyday Habits", content=habits),
                StructuredSection(title="Clinical Context", content=clinical_context),
            ]
            follow_ups = [
                f"What lifestyle habits support {query}?",
                "What questions should I ask my doctor about this area?",
                "What are common misconceptions about this health topic?"
            ]

        return sections, main_text, follow_ups

    @staticmethod
    def _localize_content(
        text: str,
        sections: List[StructuredSection],
        language: str
    ) -> Tuple[str, List[StructuredSection]]:
        lang_dict = TRANSLATION_DICTIONARY.get(language, {})
        localized_text = text
        for eng_term, localized_term in lang_dict.items():
            pattern = re.compile(re.escape(eng_term), re.IGNORECASE)
            localized_text = pattern.sub(localized_term, localized_text)

        prefixes = {
            "ta": "வணக்கம்! உங்கள் ஆரோக்கியக் கல்வி விளக்கம் இதோ:\n\n",
            "hi": "नमस्ते! आपका स्वास्थ्य शिक्षा विवरण यहाँ है:\n\n",
            "te": "నమస్కారం! మీ ఆరోగ్య విద్యా వివరణ ఇక్కడ ఉంది:\n\n",
            "ml": "നമസ്കാരം! നിങ്ങളുടെ ആരോഗ്യ വിദ്യാഭ്യാസ വിശദീകരണം ഇതാ:\n\n",
        }
        prefix = prefixes.get(language, "")
        localized_text = prefix + localized_text

        localized_sections = []
        for s in sections:
            sec_content = s.content
            for eng_term, localized_term in lang_dict.items():
                sec_content = re.sub(re.escape(eng_term), localized_term, sec_content, flags=re.IGNORECASE)
            localized_sections.append(StructuredSection(title=s.title, content=sec_content))

        return localized_text, localized_sections

    @staticmethod
    def simplify_medical_text(text: str, mode: str = "Simple", language: str = "en") -> TextSimplifyResponse:
        detected_terms = []
        term_map = {
            "hypertension": "High blood pressure",
            "dyslipidemia": "Unbalanced fat/cholesterol levels in the blood",
            "hyperglycemia": "Elevated blood sugar levels",
            "tachycardia": "Heart rate beating faster than typical resting rate",
            "bradycardia": "Heart rate beating slower than typical resting rate",
            "edema": "Swelling caused by excess fluid trapped in bodily tissues",
            "erythema": "Redness of the skin or mucous membranes",
            "etiology": "The underlying cause or origin of a condition",
            "prognosis": "The likely outcome or recovery path of a condition",
            "hematuria": "Presence of red blood cells in the urine",
            "dyspnea": "Difficulty breathing or shortness of breath",
            "benign": "Not cancerous; non-harmful cell growth",
            "malignant": "Cancerous or aggressive tissue growth",
        }

        text_lower = text.lower()
        for term, explanation in term_map.items():
            if term in text_lower:
                detected_terms.append({"term": term.capitalize(), "meaning": explanation})

        if mode == "Very Simple":
            simplified = (
                "# 📄 Simplified Medical Summary\n\n"
                "Your clinical notes have been translated into plain everyday language:\n\n"
                "The note describes routine observations about how your heart, blood, and vital organs are functioning. "
                "Rather than using complex Latin terminology, the primary observation is checking your health numbers to see if they are in balance."
            )
        elif mode == "Bullet Points":
            simplified = (
                "# 📄 Key Clinical Takeaways\n\n"
                "- **Document Focus**: Clinical observations and routine laboratory measurements.\n"
                "- **Identified Terms**: " + (", ".join([d["term"] for d in detected_terms[:3]]) or "General biomarkers") + " were noted.\n"
                "- **Action Step**: Use these points to guide your regular appointment with your primary care provider."
            )
        elif mode == "Short Summary":
            simplified = (
                "# 📄 Clinical Note Summary\n\n"
                "The submitted medical note records physiological measurements taken during a clinical examination. "
                "All laboratory values should be reviewed directly with your doctor in context with your physical symptoms."
            )
        else:
            simplified = (
                "# 📄 Simplified Clinical Explanation\n\n"
                "Medical notes frequently use specialized technical terms that can sound concerning even when describing expected observations. "
                "In plain language, this record outlines organ function, vital signs, and baseline laboratory values. "
                "No isolated number confirms a diagnosis without in-person clinical correlation."
            )

        if detected_terms:
            simplified += "\n\n## 🔬 Medical Terms Found in Text\n\n"
            for t in detected_terms:
                simplified += f"- **{t['term']}**: {t['meaning']}\n"

        questions = [
            "What do these specific findings mean for my day-to-day routine?",
            "Are any repeat laboratory tests or follow-ups recommended?",
            "Are there dietary or lifestyle changes that can help improve these numbers?"
        ]

        if language != "en":
            simplified, _ = AIService._localize_content(simplified, [], language)

        return TextSimplifyResponse(
            original_text=text,
            simplified_text=simplified,
            mode=mode,
            language=language,
            detected_terms=detected_terms,
            key_points=[
                "Specialized clinical jargon translated into accessible everyday language",
                "Laboratory reference levels require clinical context from your physician",
                "No diagnosis is made based solely on extracted text"
            ],
            questions_for_doctor=questions,
            disclaimer=UNIVERSAL_DISCLAIMER
        )

    @staticmethod
    def generate_quiz(topic: str = "General Health", num_questions: int = 5, difficulty: str = "Medium") -> List[QuizQuestion]:
        bank = [
            QuizQuestion(
                id=1,
                question="What does the top number (systolic pressure) in a blood pressure reading represent?",
                question_type="mcq",
                options=[
                    "The pressure in your arteries when your heart relaxes between beats",
                    "The pressure in your arteries when your heart beats and pumps blood",
                    "The total amount of blood present in your body",
                    "The number of breaths you take per minute"
                ],
                correct_answer_index=1,
                explanation="Systolic blood pressure measures the peak pressure exerted against arterial walls as the heart's ventricles contract.",
                concept_tested="Cardiovascular Hemodynamics"
            ),
            QuizQuestion(
                id=2,
                question="Why is an HbA1c test considered an indicator of average blood sugar over 2 to 3 months?",
                question_type="mcq",
                options=[
                    "Because insulin remains stored in the pancreas for 90 days",
                    "Because red blood cells survive for roughly 90 to 120 days, continually binding circulating glucose",
                    "Because white blood cells digest excess sugar every 3 months",
                    "Because liver enzymes only refresh once a quarter"
                ],
                correct_answer_index=1,
                explanation="Hemoglobin inside red blood cells becomes glycated proportionally to blood glucose over the erythrocyte lifespan of ~120 days.",
                concept_tested="Glycemic Biomarkers & HbA1c"
            ),
            QuizQuestion(
                id=3,
                question="True or False: Low-Density Lipoprotein (LDL) is often called 'atherogenic' because excess particles can accumulate in arterial walls.",
                question_type="true_false",
                options=[
                    "True",
                    "False"
                ],
                correct_answer_index=0,
                explanation="True. High levels of circulating LDL particles can infiltrate the endothelial vascular lining and oxidize, contributing to arterial plaque formation.",
                concept_tested="Lipid Profiles & Heart Health"
            ),
            QuizQuestion(
                id=4,
                question="Which mineral is essential for red blood cells to produce hemoglobin and transport oxygen efficiently?",
                question_type="mcq",
                options=[
                    "Calcium",
                    "Iron",
                    "Potassium",
                    "Sodium"
                ],
                correct_answer_index=1,
                explanation="Iron is the central metal ion in the heme group of hemoglobin, which directly binds oxygen molecules in the lungs.",
                concept_tested="Hematology & Oxygen Transport"
            ),
            QuizQuestion(
                id=5,
                question="A person notices their urine is dark amber and they feel slightly fatigued after a long sunny walk. What is the most appropriate first educational step?",
                question_type="scenario",
                options=[
                    "Immediately take heavy pain relievers",
                    "Drink water and rest in a cool environment to rehydrate cellular fluids",
                    "Fast completely for 24 hours",
                    "Avoid drinking any fluids to reduce bladder strain"
                ],
                correct_answer_index=1,
                explanation="Dark amber urine and mild fatigue after sun exposure are classic signs of fluid deficit. Hydrating with water helps restore osmotic equilibrium.",
                concept_tested="Hydration & Electrolyte Homeostasis"
            ),
            QuizQuestion(
                id=6,
                question="What is the primary role of High-Density Lipoprotein (HDL) in the bloodstream?",
                question_type="mcq",
                options=[
                    "To transport calcium into the bones",
                    "To help remove excess cholesterol from arterial tissues and transport it back to the liver for clearance",
                    "To produce white blood cells during bacterial infections",
                    "To stimulate digestive enzymes in the stomach"
                ],
                correct_answer_index=1,
                explanation="HDL functions in reverse cholesterol transport, picking up excess lipids and carrying them back to the liver.",
                concept_tested="Lipid Metabolism"
            ),
            QuizQuestion(
                id=7,
                question="True or False: A single blood pressure measurement taken while nervous at the clinic is always sufficient to diagnose chronic hypertension.",
                question_type="true_false",
                options=[
                    "True",
                    "False"
                ],
                correct_answer_index=1,
                explanation="False. Blood pressure fluctuates with stress, caffeine, and 'white coat syndrome.' Clinical guidelines require multiple confirmed measurements across different visits.",
                concept_tested="Hypertension Clinical Standards"
            ),
        ]

        if num_questions >= len(bank):
            return bank
        return bank[:num_questions]
