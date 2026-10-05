import re
from typing import List, Dict, Any
from app.schemas.models import SourceCitation

CURATED_KNOWLEDGE_BASE = [
    {
        "id": "kb_hypertension",
        "title": "Hypertension (High Blood Pressure) Overview & Clinical Guidelines",
        "organization": "World Health Organization (WHO)",
        "url": "https://www.who.int/news-room/fact-sheets/detail/hypertension",
        "keywords": ["hypertension", "blood pressure", "systolic", "diastolic", "artery", "cardiovascular", "bp", "120/80"],
        "snippet": (
            "Hypertension is defined when blood pressure is consistently measured at 140/90 mmHg or higher across multiple clinical occasions. "
            "Systolic pressure reflects arterial force during cardiac contraction, whereas diastolic pressure measures resistance while the heart rests. "
            "Primary lifestyle modifications include sodium reduction (<2g/day), aerobic exercise, stress mitigation, and smoking cessation."
        )
    },
    {
        "id": "kb_diabetes_hba1c",
        "title": "Glycated Hemoglobin (HbA1c) Testing and Glycemic Regulation",
        "organization": "National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK / NIH)",
        "url": "https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test",
        "keywords": ["hba1c", "a1c", "diabetes", "glucose", "glycated hemoglobin", "blood sugar", "insulin"],
        "snippet": (
            "The HbA1c test measures the average percentage of blood glucose bound to hemoglobin proteins over the red blood cell lifespan (approx. 90-120 days). "
            "Normal reference levels are below 5.7%; 5.7% to 6.4% indicates prediabetes; and 6.5% or higher on two separate tests indicates diabetes. "
            "HbA1c does not fluctuate with short-term dietary variations on the test day."
        )
    },
    {
        "id": "kb_lipid_panel",
        "title": "Understanding Blood Cholesterol and Lipid Profiles",
        "organization": "American Heart Association / MedlinePlus",
        "url": "https://medlineplus.gov/cholesterol.html",
        "keywords": ["cholesterol", "lipid", "ldl", "hdl", "triglycerides", "atherosclerosis", "lipoprotein"],
        "snippet": (
            "A standard lipid profile evaluates Low-Density Lipoprotein (LDL), High-Density Lipoprotein (HDL), and Triglycerides. "
            "LDL is frequently termed 'atherogenic' because excessive circulating particles penetrate the arterial endothelium, contributing to plaque buildup. "
            "HDL assists in reverse cholesterol transport by carrying excess lipids back to the liver for clearance."
        )
    },
    {
        "id": "kb_anemia_cbc",
        "title": "Complete Blood Count (CBC) and Anemia Pathophysiology",
        "organization": "MedlinePlus / National Heart, Lung, and Blood Institute (NHLBI)",
        "url": "https://medlineplus.gov/lab-tests/complete-blood-count-cbc/",
        "keywords": ["anemia", "cbc", "hemoglobin", "hematocrit", "rbc", "platelets", "iron", "ferritin"],
        "snippet": (
            "Anemia occurs when circulating erythrocytes (red blood cells) or hemoglobin concentration falls below physiological norms, reducing oxygen delivery to tissues. "
            "Key CBC metrics include Hemoglobin (Hb), Hematocrit (Hct), and Mean Corpuscular Volume (MCV). "
            "Common etiologies include iron deficiency, chronic inflammation, vitamin B12 deficiency, and bone marrow conditions."
        )
    },
    {
        "id": "kb_hydration_electrolytes",
        "title": "Hydration, Electrolyte Equilibrium, and Renal Homeostasis",
        "organization": "Centers for Disease Control and Prevention (CDC)",
        "url": "https://www.cdc.gov/healthyweight/healthy_eating/water-and-healthier-drinks.html",
        "keywords": ["hydration", "water", "electrolytes", "dehydration", "kidney", "sodium", "potassium"],
        "snippet": (
            "Sufficient cellular hydration sustains blood volume, facilitates waste filtration through the renal glomeruli, maintains core thermoregulation, and cushions joints. "
            "Electrolytes (sodium, potassium, chloride) regulate intracellular osmotic pressure and neuro-muscular signaling."
        )
    },
    {
        "id": "kb_thyroid_tsh",
        "title": "Thyroid Stimulating Hormone (TSH) and Metabolic Regulation",
        "organization": "American Thyroid Association / MedlinePlus",
        "url": "https://medlineplus.gov/lab-tests/tsh-thyroid-stimulating-hormone-test/",
        "keywords": ["thyroid", "tsh", "hypothyroidism", "hyperthyroidism", "t3", "t4", "metabolism"],
        "snippet": (
            "TSH is synthesized by the anterior pituitary gland in a negative-feedback loop with circulating thyroid hormones (Free T3 and Free T4). "
            "Elevated TSH typically suggests primary hypothyroidism (as the pituitary signals an underactive thyroid gland to produce more hormone), "
            "whereas suppressed TSH suggests hyperthyroidism or exogenous excess."
        )
    },
    {
        "id": "kb_liver_enzymes",
        "title": "Liver Function Biomarkers: SGOT/AST, SGPT/ALT, Bilirubin",
        "organization": "Mayo Clinic / MedlinePlus",
        "url": "https://medlineplus.gov/lab-tests/liver-function-tests/",
        "keywords": ["alt", "ast", "sgpt", "sgot", "liver", "bilirubin", "alkaline phosphatase", "hepatic"],
        "snippet": (
            "ALT (Alanine Aminotransferase) and AST (Aspartate Aminotransferase) are intracellular enzymes concentrated within hepatocytes. "
            "When liver tissue experiences stress, inflammation, or metabolic insult, these enzymes leak into the serum. "
            "Transient elevations are evaluated alongside alcohol use, medication side effects, viral serology, and metabolic health."
        )
    },
    {
        "id": "kb_sleep_circadian",
        "title": "Sleep Architecture, Circadian Rhythms, and Neurological Recovery",
        "organization": "National Institute of Neurological Disorders and Stroke (NINDS)",
        "url": "https://www.ninds.nih.gov/health-information/disorders/brain-basics-understanding-sleep",
        "keywords": ["sleep", "circadian", "insomnia", "rem", "melatonin", "rest", "fatigue"],
        "snippet": (
            "Adult restorative sleep comprises alternating cycles of Non-REM (N1, N2, deep slow-wave N3) and REM sleep. "
            "During slow-wave sleep, the glymphatic system clears metabolic waste products (such as amyloid beta) from the brain, "
            "while cardiovascular resting heart rate and blood pressure decrease, supporting systemic repair."
        )
    },
]


class RAGEngine:
    @staticmethod
    def retrieve_relevant_sources(query: str, top_k: int = 2) -> List[SourceCitation]:
        query_words = set(re.findall(r"\w+", query.lower()))
        scored_entries = []

        for entry in CURATED_KNOWLEDGE_BASE:
            score = 0
            # Keyword matches
            for kw in entry["keywords"]:
                if kw in query.lower():
                    score += 4
                for word in query_words:
                    if word in kw:
                        score += 1

            # Title matches
            for word in query_words:
                if len(word) > 3 and word in entry["title"].lower():
                    score += 2

            if score > 0:
                scored_entries.append((score, entry))

        scored_entries.sort(key=lambda x: x[0], reverse=True)
        results = []
        for _, entry in scored_entries[:top_k]:
            results.append(
                SourceCitation(
                    title=entry["title"],
                    organization=entry["organization"],
                    url=entry["url"],
                    snippet=entry["snippet"]
                )
            )

        # If no specific matches, provide top trusted authoritative source
        if not results:
            fallback = CURATED_KNOWLEDGE_BASE[0]
            results.append(
                SourceCitation(
                    title="MedlinePlus Medical Reference Library",
                    organization="National Library of Medicine (NIH)",
                    url="https://medlineplus.gov/",
                    snippet="Peer-reviewed, evidence-based health information produced by the National Institutes of Health and certified medical organizations."
                )
            )

        return results

    @staticmethod
    def get_all_sources():
        return CURATED_KNOWLEDGE_BASE
