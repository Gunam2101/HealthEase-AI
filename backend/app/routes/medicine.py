from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from app.services.safety_engine import UNIVERSAL_DISCLAIMER
from app.services.ai_service import AIService

router = APIRouter(prefix="/medicine", tags=["Medicine Information"])

class MedicineRequest(BaseModel):
    name: Optional[str] = None
    query: Optional[str] = None
    language: Optional[str] = "en"

class MedicineResponse(BaseModel):
    query: str = ""
    name: str
    category: str = "General Medication"
    what_is_it: str
    common_uses: List[str]
    common_forms: List[str]
    common_side_effects: List[str]
    precautions: List[str]
    important_precautions: Optional[List[str]] = None
    professional_guidance: str
    safety_notice: str = "HealthEase AI does not prescribe medication or provide personalized dosage instructions."
    formatted_response: str
    formatted_content: Optional[str] = None
    disclaimer: str
    sources: List[dict] = []

MEDICINE_DATABASE = {
    "paracetamol": {
        "name": "Paracetamol (Acetaminophen)",
        "what_is_it": "Paracetamol is a widely used analgesic (pain reliever) and antipyretic (fever reducer). It acts primarily in the central nervous system to inhibit prostaglandin synthesis, helping reduce pain signaling and reset the hypothalamic temperature-regulating center.",
        "common_uses": [
            "Temporary relief of mild to moderate headaches and toothaches",
            "Reducing fever associated with viral respiratory infections",
            "Managing mild musculoskeletal pain and joint soreness"
        ],
        "common_forms": ["Oral tablets & caplets", "Oral liquid / suspension for pediatric use", "Suppositories"],
        "common_side_effects": [
            "Generally well-tolerated at standard adult recommended limits",
            "Rare mild nausea or stomach discomfort",
            "Very rare allergic skin rash"
        ],
        "important_precautions": [
            "Do not combine multiple over-the-counter cold/cough medications containing acetaminophen to prevent accidental overdose.",
            "Excessive amounts can cause severe liver damage (hepatotoxicity).",
            "Individuals with chronic liver disease, chronic alcohol consumption, or severe malnutrition must exercise extreme caution."
        ],
        "professional_guidance": "Consult a licensed physician or pharmacist for specific guidance regarding your medical history and ongoing medications."
    },
    "metformin": {
        "name": "Metformin",
        "what_is_it": "Metformin is a first-line oral biguanide medication used to manage blood glucose levels in individuals with Type 2 diabetes. It works primarily by decreasing glucose production in the liver and improving cellular sensitivity to insulin.",
        "common_uses": [
            "Managing blood glucose in Type 2 diabetes alongside diet and exercise",
            "Improving insulin resistance in Polycystic Ovary Syndrome (PCOS, off-label use)"
        ],
        "common_forms": ["Immediate-release oral tablets", "Extended-release (ER/XR) oral tablets"],
        "common_side_effects": [
            "Mild gastrointestinal symptoms (nausea, abdominal bloating, diarrhea)",
            "Metallic taste in the mouth during early initiation",
            "Potential reduced Vitamin B12 absorption with long-term use"
        ],
        "important_precautions": [
            "Commonly taken with meals to minimize stomach upset.",
            "Requires periodic monitoring of kidney function (eGFR) and Vitamin B12 levels.",
            "Rare risk of lactic acidosis, especially in patients with severe renal or hepatic impairment."
        ],
        "professional_guidance": "Always follow your endocrinologist's or primary care physician's personalized management plan and never adjust dosages independently."
    },
    "amoxicillin": {
        "name": "Amoxicillin",
        "what_is_it": "Amoxicillin is a broad-spectrum penicillin-class antibiotic that treats bacterial infections by inhibiting bacterial cell wall synthesis. It is ineffective against viral illnesses like the common cold or flu.",
        "common_uses": [
            "Bacterial ear, nose, and throat infections (such as strep pharyngitis, acute otitis media)",
            "Lower respiratory tract bacterial infections (such as community-acquired bronchitis or pneumonia)",
            "Certain uncomplicated urinary tract and skin bacterial infections"
        ],
        "common_forms": ["Oral capsules & tablets", "Chewable tablets", "Liquid oral suspension"],
        "common_side_effects": [
            "Mild nausea or loose stools",
            "Mild digestive upset",
            "Non-allergic skin rash or temporary candidiasis (yeast overgrowth)"
        ],
        "important_precautions": [
            "Contraindicated in individuals with a confirmed allergy to penicillin or beta-lactam antibiotics.",
            "Always complete the full prescribed course as instructed by your clinician, even if symptoms improve early, to prevent antibiotic resistance.",
            "Seek immediate medical help if signs of severe allergy (hives, facial swelling, difficulty breathing) occur."
        ],
        "professional_guidance": "Antibiotics must only be taken under direct prescription following confirmed clinical assessment."
    },
    "atorvastatin": {
        "name": "Atorvastatin",
        "what_is_it": "Atorvastatin is an HMG-CoA reductase inhibitor (statin) that lowers blood cholesterol levels. It reduces liver production of LDL ('bad') cholesterol and boosts the liver's ability to clear LDL particles from the bloodstream.",
        "common_uses": [
            "Lowering elevated low-density lipoprotein (LDL) cholesterol and triglycerides",
            "Reducing the risk of cardiovascular events (heart attack, stroke) in high-risk individuals",
            "Slowing the progression of arterial atherosclerosis"
        ],
        "common_forms": ["Oral tablets (typically taken once daily in the evening or morning)"],
        "common_side_effects": [
            "Mild muscle aches or stiffness",
            "Mild digestive upset or constipation",
            "Transient mild elevations in liver enzymes"
        ],
        "important_precautions": [
            "Avoid excessive consumption of grapefruit or grapefruit juice, which can inhibit metabolism of atorvastatin.",
            "Report unexplained, persistent muscle pain, tenderness, or weakness to your doctor promptly.",
            "Routine periodic lipid panels and liver function tests are recommended."
        ],
        "professional_guidance": "Cardiovascular risk reduction combines statin therapy with heart-healthy nutrition and active lifestyle measures under clinical supervision."
    },
    "ibuprofen": {
        "name": "Ibuprofen",
        "what_is_it": "Ibuprofen is a nonsteroidal anti-inflammatory drug (NSAID) that reduces hormones causing inflammation, pain, and fever by inhibiting cyclooxygenase (COX-1 and COX-2) enzymes.",
        "common_uses": [
            "Relief of inflammatory pain, arthritis flare-ups, and dental discomfort",
            "Temporary fever reduction and relief of tension headaches",
            "Alleviating menstrual cramps (dysmenorrhea)"
        ],
        "common_forms": ["Oral tablets & capsules", "Liquid gels", "Pediatric oral suspension"],
        "common_side_effects": [
            "Mild stomach irritation, heartburn, or indigestion",
            "Nausea or mild fluid retention",
            "Dizziness with prolonged use"
        ],
        "important_precautions": [
            "Take with food or a glass of milk to minimize gastric mucosal irritation.",
            "Avoid prolonged use without medical advice if you have high blood pressure, heart disease, stomach ulcers, or kidney disease.",
            "Do not combine simultaneously with other NSAIDs (such as naproxen or high-dose aspirin)."
        ],
        "professional_guidance": "Consult your physician or pharmacist regarding safe pain management strategies appropriate for your health history."
    },
    "omeprazole": {
        "name": "Omeprazole",
        "what_is_it": "Omeprazole is a proton pump inhibitor (PPI) that decreases the amount of acid produced in the stomach by blocking the H+/K+ ATPase enzyme system in gastric parietal cells.",
        "common_uses": [
            "Treatment of gastroesophageal reflux disease (GERD) and frequent heartburn",
            "Promoting healing of erosive esophagitis and peptic ulcers",
            "Protection against NSAID-induced gastric ulcers"
        ],
        "common_forms": ["Delayed-release oral capsules", "Dispersible tablets"],
        "common_side_effects": [
            "Mild headache",
            "Mild stomach pain, gas, or diarrhea",
            "Nausea"
        ],
        "important_precautions": [
            "Best taken 30 to 60 minutes before the first meal of the day.",
            "Long-term continuous use should be clinically monitored, as it may affect magnesium, calcium, and Vitamin B12 absorption.",
            "Consult a clinician if heartburn persists after 14 days of over-the-counter use."
        ],
        "professional_guidance": "Discuss persistent acid reflux or digestive discomfort with a gastroenterologist or primary care physician."
    }
}

@router.post("", response_model=MedicineResponse)
def get_medicine_info(req: MedicineRequest):
    raw_query = req.query or req.name or ""
    key = raw_query.strip().lower()
    
    # Check known database or match partial
    matched = None
    for k, data in MEDICINE_DATABASE.items():
        if k in key or key in k:
            matched = data
            break

    if not matched:
        # Structured dynamic fallback for any other medicine
        med_title = raw_query.strip().title()
        matched = {
            "name": med_title or "General Medication",
            "what_is_it": f"{med_title} is a pharmaceutical medication indicated for specific clinical purposes and physiological management under medical supervision.",
            "common_uses": [
                f"Management of symptoms targeted by {med_title}",
                "Use as indicated by healthcare providers based on clinical diagnosis"
            ],
            "common_forms": ["Oral tablets / capsules", "Standard pharmaceutical formulations"],
            "common_side_effects": [
                "Individual reactions can vary depending on sensitivity and tolerance",
                "Mild digestive discomfort or drowsiness may occur with certain classes"
            ],
            "important_precautions": [
                "Always take medications exactly as prescribed by your licensed healthcare provider.",
                "Review potential interactions with current prescription drugs, supplements, and food.",
                "Store in a cool, dry location out of reach of children."
            ],
            "professional_guidance": f"Speak with a qualified doctor or licensed pharmacist for verified information and individualized guidance regarding {med_title}."
        }

    uses_str = "\n".join([f"- **{u}**" for u in matched["common_uses"]])
    forms_str = "\n".join([f"- {f}" for f in matched["common_forms"]])
    effects_str = "\n".join([f"- {e}" for e in matched["common_side_effects"]])
    precautions_str = "\n".join([f"- {p}" for p in matched["important_precautions"]])

    formatted = (
        f"# 💊 {matched['name']}\n\n"
        "## 💡 What is it?\n\n"
        f"{matched['what_is_it']}\n\n"
        "## 📋 Common Uses\n\n"
        f"{uses_str}\n\n"
        "## 💊 Common Formulations\n\n"
        f"{forms_str}\n\n"
        "## ⚠️ Common Side Effects\n\n"
        f"{effects_str}\n\n"
        "## 🛡️ Important Precautions\n\n"
        f"{precautions_str}\n\n"
        "## 👨‍⚕️ Professional Guidance\n\n"
        f"{matched['professional_guidance']}\n\n"
        "> ⚠️ **Important Safety Notice**: HealthEase AI does not prescribe medication, provide personalized dosage instructions, or advise stopping or starting any pharmaceutical treatment. Always consult a licensed healthcare professional or pharmacist."
    )

    if req.language and req.language != "en":
        formatted, _ = AIService._localize_content(formatted, [], req.language)

    return MedicineResponse(
        query=raw_query,
        name=matched["name"],
        category="General Pharmacological Reference",
        what_is_it=matched["what_is_it"],
        common_uses=matched["common_uses"],
        common_forms=matched["common_forms"],
        common_side_effects=matched["common_side_effects"],
        precautions=matched["important_precautions"],
        important_precautions=matched["important_precautions"],
        professional_guidance=matched["professional_guidance"],
        safety_notice="HealthEase AI does not prescribe medication or provide personalized dosage instructions.",
        formatted_response=formatted,
        formatted_content=formatted,
        disclaimer=UNIVERSAL_DISCLAIMER,
        sources=[
            {"title": "WHO Model List of Essential Medicines", "organization": "WHO", "url": "https://www.who.int"},
            {"title": "MedlinePlus Drug Information", "organization": "MedlinePlus", "url": "https://medlineplus.gov"}
        ]
    )
