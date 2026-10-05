from sqlalchemy.orm import Session
from app.database.models import (
    User, Profile, MedicalTerm, EducationContent, TrustedSource,
    LearningProgress, SavedItem
)
import hashlib

def hash_pass(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

SAMPLE_TERMS = [
    {
        "term": "Hypertension",
        "phonetic": "hahy-per-TEN-shuhn",
        "category": "Cardiology",
        "simple_meaning": "Consistently elevated pressure of the blood pushing against arterial walls.",
        "detailed_explanation": "A chronic clinical condition in which the systemic arterial blood pressure remains persistently elevated (≥130/80 mmHg). Over time, this forces the heart to work harder and can cause vascular wear.",
        "common_concepts": ["Systolic vs Diastolic", "Silent Condition", "Arterial Elasticity"],
        "related_terms": ["Atherosclerosis", "Hypotension", "Left Ventricular Hypertrophy"],
        "example_usage": "Her doctor recommended a low-sodium diet to assist with managing mild hypertension.",
        "translations": {
            "ta": "உயர் இரத்த அழுத்தம் (Hypertension)",
            "hi": "उच्च रक्तचाप (Hypertension)",
            "te": "అధిక రక్తపోటు (Hypertension)",
            "ml": "ഉയർന്ന രക്തസമ്മർദ്ദം (Hypertension)"
        }
    },
    {
        "term": "Tachycardia",
        "phonetic": "tak-i-KAHR-dee-uh",
        "category": "Cardiology",
        "simple_meaning": "A resting heart rate that is faster than typical (over 100 beats per minute).",
        "detailed_explanation": "Heart rate exceeding 100 beats per minute at rest in an adult. It can be a normal physiological response to fever, anxiety, exercise, or caffeine, or related to cardiac arrhythmia.",
        "common_concepts": ["Sinus Rhythm", "Palpitations", "Pulse Measurement"],
        "related_terms": ["Bradycardia", "Arrhythmia", "ECG / EKG"],
        "example_usage": "Drinking multiple energy drinks caused temporary sinus tachycardia and palpitations.",
        "translations": {
            "ta": "விரைவான இதயத் துடிப்பு (Tachycardia)",
            "hi": "तेज हृदय गति (Tachycardia)",
            "te": "వేగవంతమైన గుండె స్పందన (Tachycardia)",
            "ml": "വേഗതയേറിയ ഹൃദയമിടിപ്പ് (Tachycardia)"
        }
    },
    {
        "term": "Bradycardia",
        "phonetic": "brad-i-KAHR-dee-uh",
        "category": "Cardiology",
        "simple_meaning": "A resting heart rate that is slower than typical (under 60 beats per minute).",
        "detailed_explanation": "Heart rate under 60 beats per minute. Common and healthy in endurance athletes, but may also stem from conduction pathway slowing in older adults.",
        "common_concepts": ["Resting Pulse", "Vagus Nerve", "Athletic Conditioning"],
        "related_terms": ["Tachycardia", "Pacemaker", "AV Block"],
        "example_usage": "Trained marathon runners often exhibit resting bradycardia due to high stroke volume.",
        "translations": {
            "ta": "குறைந்த இதயத் துடிப்பு (Bradycardia)",
            "hi": "धीमी हृदय गति (Bradycardia)",
            "te": "నెమ్మదిగా కొట్టుకునే గుండె (Bradycardia)",
            "ml": "മന്ദഗതിയിലുള്ള ഹൃദയമിടിപ്പ് (Bradycardia)"
        }
    },
    {
        "term": "Glycated Hemoglobin (HbA1c)",
        "phonetic": "glahy-KAY-tid HEE-muh-gloh-bin",
        "category": "Endocrinology",
        "simple_meaning": "A blood test measuring average blood sugar over the preceding 2 to 3 months.",
        "detailed_explanation": "Forms when glucose in the bloodstream binds irreversibly to hemoglobin in erythrocytes. Because red blood cells circulate for ~120 days, it reflects average glycemic exposure.",
        "common_concepts": ["90-Day Glycemic Average", "Erythrocyte Lifespan", "Prediabetes Monitoring"],
        "related_terms": ["Fasting Glucose", "Insulin Resistance", "Metabolic Syndrome"],
        "example_usage": "His annual physical included an HbA1c test, which returned at a healthy 5.3%.",
        "translations": {
            "ta": "கிளைக்கேட்டட் ஹீமோகுளோபின் (HbA1c)",
            "hi": "ग्लाइकेटेड हीमोग्लोबिन (HbA1c)",
            "te": "గ్లైకేటెడ్ హిమోగ్లోబిన్ (HbA1c)",
            "ml": "ഗ്ലൈക്കേറ്റഡ് ഹീമോഗ്ലോബിൻ (HbA1c)"
        }
    },
    {
        "term": "Dyslipidemia",
        "phonetic": "dis-lip-i-DEE-mee-uh",
        "category": "Endocrinology",
        "simple_meaning": "An abnormal balance of fats (lipids), such as cholesterol or triglycerides, in the blood.",
        "detailed_explanation": "An imbalance of circulating lipids, typically marked by elevated Low-Density Lipoprotein (LDL), high triglycerides, or decreased High-Density Lipoprotein (HDL).",
        "common_concepts": ["Lipid Panel", "Endothelial Health", "Plaque Formation"],
        "related_terms": ["Hypercholesterolemia", "Atherosclerosis", "Statins"],
        "example_usage": "Routine blood work helped identify asymptomatic dyslipidemia early on.",
        "translations": {
            "ta": "இரத்த கொழுப்பு சமநிலையின்மை (Dyslipidemia)",
            "hi": "असंतुलित रक्त वसा (Dyslipidemia)",
            "te": "రక్తంలో కొవ్వు అసమతుల్యత (Dyslipidemia)",
            "ml": "രക്തത്തിലെ കൊഴുപ്പിന്റെ അസന്തുലിതാവസ്ഥ (Dyslipidemia)"
        }
    },
    {
        "term": "Anemia",
        "phonetic": "uh-NEE-mee-uh",
        "category": "Hematology",
        "simple_meaning": "A condition in which the blood has lower numbers of healthy red blood cells or hemoglobin.",
        "detailed_explanation": "A reduction in circulating erythrocytes or hemoglobin concentration resulting in decreased tissue oxygen delivery. Most commonly caused by nutritional iron deficiency, blood loss, or chronic disease.",
        "common_concepts": ["Oxygen Transport", "Iron Stores (Ferritin)", "Fatigue"],
        "related_terms": ["Hemoglobin", "Hematocrit", "Ferritin", "Microcytic"],
        "example_usage": "Her doctor recommended pairing dietary iron with vitamin C to address mild nutritional anemia.",
        "translations": {
            "ta": "இரத்த சோகை (Anemia)",
            "hi": "रक्ताल्पता / एनीमिया (Anemia)",
            "te": "రక్తహీనత (Anemia)",
            "ml": "വിളർച്ച (Anemia)"
        }
    },
    {
        "term": "Creatinine",
        "phonetic": "kree-AT-uh-neen",
        "category": "Nephrology",
        "simple_meaning": "A natural muscle breakdown waste product filtered out of the blood by healthy kidneys.",
        "detailed_explanation": "A chemical byproduct of creatine phosphate metabolism in skeletal muscle. Produced at a fairly constant rate, serum creatinine levels serve as an indicator of glomerular filtration rate (GFR).",
        "common_concepts": ["Renal Filtration", "Glomerular Filtration Rate (eGFR)", "Muscle Mass"],
        "related_terms": ["BUN (Blood Urea Nitrogen)", "Nephron", "Dialysis"],
        "example_usage": "A normal creatinine result indicates that the kidneys are filtering waste properly.",
        "translations": {
            "ta": "கிரியேட்டினின் (Creatinine)",
            "hi": "क्रिएटिनिन (Creatinine)",
            "te": "క్రియాటినిన్ (Creatinine)",
            "ml": "ക്രിയാറ്റിനിൻ (Creatinine)"
        }
    },
    {
        "term": "Edema",
        "phonetic": "ih-DEE-muh",
        "category": "General",
        "simple_meaning": "Swelling caused by excess fluid accumulating in bodily tissues.",
        "detailed_explanation": "Abnormal accumulation of interstitial fluid resulting from increased capillary hydrostatic pressure, decreased plasma oncotic pressure, or lymphatic obstruction. Common in lower legs and ankles.",
        "common_concepts": ["Pitting vs Non-pitting", "Fluid Retention", "Gravity Dependence"],
        "related_terms": ["Diuretics", "Venous Insufficiency", "Lymphatics"],
        "example_usage": "Long airplane flights can cause temporary mild dependent edema in the feet.",
        "translations": {
            "ta": "நீர் வீக்கம் (Edema)",
            "hi": "सूजन / शोफ (Edema)",
            "te": "శరీరంలో నీరు చేరి వాపు (Edema)",
            "ml": "നീർവീക്കം (Edema)"
        }
    },
    {
        "term": "Dyspnea",
        "phonetic": "disp-NEE-uh",
        "category": "Pulmonology",
        "simple_meaning": "Difficulty breathing or feeling like you cannot get enough air (shortness of breath).",
        "detailed_explanation": "Subjective experience of breathing discomfort that consists of qualitatively distinct sensations. Can arise from pulmonary, cardiovascular, or neuromusculoskeletal etiologies.",
        "common_concepts": ["Shortness of Breath", "Exertional vs Resting", "Pulse Oximetry"],
        "related_terms": ["Hypoxia", "Orthopnea", "Bronchospasm"],
        "example_usage": "Sudden unexplained dyspnea at rest warrants immediate emergency evaluation.",
        "translations": {
            "ta": "மூச்சுத் திணறல் (Dyspnea)",
            "hi": "सांस लेने में कठिनाई (Dyspnea)",
            "te": "శ్వాస తీసుకోవడంలో ఇబ్బంది (Dyspnea)",
            "ml": "ശ്വാസതടസ്സം (Dyspnea)"
        }
    },
    {
        "term": "Endothelium",
        "phonetic": "en-doh-THEE-lee-uhm",
        "category": "Cardiology",
        "simple_meaning": "The ultra-thin smooth inner lining of your blood vessels and heart.",
        "detailed_explanation": "A specialized single layer of squamous endothelial cells lining the interior surface of blood and lymphatic vessels. It plays a critical role in vascular tone, coagulation, and inflammatory response.",
        "common_concepts": ["Nitric Oxide Release", "Vascular Dilation", "Smooth Blood Flow"],
        "related_terms": ["Atherosclerosis", "Vasodilation", "Plaque"],
        "example_usage": "Aerobic physical activity stimulates endothelial nitric oxide, promoting flexible arteries.",
        "translations": {
            "ta": "இரத்தக் குழாய் உட்சுவர் (Endothelium)",
            "hi": "एंडोथेलियम / आंतरिक रक्त वाहिका परत (Endothelium)",
            "te": "ఎండోథీలియం (Endothelium)",
            "ml": "രക്തക്കുഴലുകളുടെ ആന്തരിക പാളി (Endothelium)"
        }
    }
]

SAMPLE_ARTICLES = [
    {
        "title": "Understanding Blood Pressure: The Silent Hemodynamics",
        "slug": "understanding-blood-pressure",
        "category": "General Health",
        "reading_time_minutes": 4,
        "short_description": "Learn what systolic and diastolic numbers actually measure, why high blood pressure is often symptomless, and everyday habits that support vascular health.",
        "full_content": (
            "Blood pressure is the hydrodynamic measurement of the force exerted by circulating blood upon the walls of blood vessels. "
            "Because early-stage elevated blood pressure produces no noticeable aches or symptoms, millions of individuals are unaware of their readings until a routine checkup.\n\n"
            "### Systolic vs Diastolic\n"
            "When your doctor writes 120/80 mmHg:\n"
            "• **Systolic (120)** represents the pressure when your left ventricle contracts.\n"
            "• **Diastolic (80)** measures the residual pressure when your heart muscle relaxes between beats.\n\n"
            "### Proactive Health Steps\n"
            "1. **Sodium Moderation**: Flavor meals with garlic, herbs, and lemon instead of heavy salt shaker usage.\n"
            "2. **Dynamic Movement**: 30 minutes of brisk daily walking encourages arterial elasticity.\n"
            "3. **Sleep Quality**: Consistent 7-8 hours of sleep allows your nocturnal blood pressure to experience its healthy natural 'dip'."
        ),
        "key_takeaways": [
            "Systolic is heart pumping; Diastolic is heart resting",
            "High blood pressure typically has no initial symptoms",
            "Consistent daily movement helps maintain arterial flexibility"
        ],
        "related_topics": ["Hypertension", "Cardiology", "DASH Diet", "Heart Rate"],
        "badge": "Popular"
    },
    {
        "title": "Demystifying Your Lab Report: From Reference Ranges to Results",
        "slug": "demystifying-lab-reports",
        "category": "Preventive Care",
        "reading_time_minutes": 5,
        "short_description": "A comprehensive guide on how laboratories establish normal reference intervals and why a single number outside the range does not automatically mean an illness.",
        "full_content": (
            "Receiving laboratory results via an online patient portal can be intimidating, especially when an item is flagged with 'High' or 'Low'.\n\n"
            "### How Laboratories Set Reference Intervals\n"
            "Reference intervals are statistical ranges determined from large cohorts of healthy volunteers (typically covering the central 95% of the population). "
            "By definition, roughly 5% of healthy individuals may fall slightly outside these statistical boundaries without having any disease.\n\n"
            "### The Principle of Clinical Correlation\n"
            "Doctors never treat a single number in a vacuum. A biomarker must be evaluated in connection with:\n"
            "• Your hydration state during the blood draw\n"
            "• Fasting duration and previous night's meals\n"
            "• Current medications or supplements\n"
            "• Your personal and family medical background\n\n"
            "Always prepare a list of clear, calm questions to discuss with your healthcare professional."
        ),
        "key_takeaways": [
            "Reference ranges represent statistical 95% intervals of healthy populations",
            "Hydration and fasting time directly influence many blood biomarkers",
            "Always interpret laboratory metrics collaboratively with your doctor"
        ],
        "related_topics": ["Complete Blood Count", "Metabolic Panel", "HbA1c", "Medical Terms"],
        "badge": "Featured"
    },
    {
        "title": "The Science of Restorative Sleep & Brain Cleansing",
        "slug": "science-of-restorative-sleep",
        "category": "Sleep",
        "reading_time_minutes": 4,
        "short_description": "Explore the glymphatic system, sleep cycles, and how deep slow-wave sleep repairs your cardiovascular and nervous systems.",
        "full_content": (
            "Sleep is not merely a passive cessation of consciousness; it is an active neuro-biological maintenance phase.\n\n"
            "### The Glymphatic Waste-Clearance System\n"
            "During deep slow-wave (N3) sleep, glial cells in the brain shrink slightly, increasing interstitial space by 60%. "
            "This allows cerebrospinal fluid to flush through cerebral tissue, washing away metabolic byproducts accumulated throughout waking hours.\n\n"
            "### Tips for Consistent Sleep Architecture\n"
            "• Keep a consistent wake-up time, even on weekends.\n"
            "• Avoid blue-wavelength screens 60 minutes before bedtime.\n"
            "• Keep the bedroom environment cool (around 65°F / 18°C) to facilitate your body's circadian temperature drop."
        ),
        "key_takeaways": [
            "Deep sleep clears metabolic waste from brain tissues",
            "Circadian rhythms rely heavily on consistent morning wake times",
            "Cool bedroom environments optimize deep sleep architecture"
        ],
        "related_topics": ["Circadian Rhythm", "Melatonin", "Mental Well-being"],
        "badge": "New"
    },
    {
        "title": "Nutritional Fundamentals: Macronutrients, Fiber & Hydration",
        "slug": "nutritional-fundamentals",
        "category": "Nutrition",
        "reading_time_minutes": 5,
        "short_description": "How dietary fiber feeds the gut microbiome, balances blood glucose spikes, and supports cardiovascular lipid health.",
        "full_content": (
            "Food provides both macronutrients (proteins, carbohydrates, lipids) and micronutrients (vitamins and trace minerals) that fuel cellular biology.\n\n"
            "### The Unsung Hero: Dietary Soluble Fiber\n"
            "Soluble fiber found in oats, beans, apples, and flaxseed dissolves in water to form a gel-like substance in the digestive tract. "
            "This slows the absorption of dietary carbohydrates, preventing rapid glucose spikes and binding to bile acids to support healthy cholesterol clearance.\n\n"
            "### Balanced Plate Approach\n"
            "• 1/2 Plate: Varied colorful vegetables and whole fruits\n"
            "• 1/4 Plate: Whole grains or starchy root tubers\n"
            "• 1/4 Plate: Lean proteins, legumes, or plant-based proteins"
        ),
        "key_takeaways": [
            "Soluble fiber stabilizes post-meal blood sugar fluctuations",
            "Diverse fiber sources nourish gut microbiome diversity",
            "Pairing carbohydrates with protein improves satiety"
        ],
        "related_topics": ["Blood Glucose", "Lipids", "Gut Health"],
        "badge": "Popular"
    }
]

SAMPLE_SOURCES = [
    {
        "name": "World Health Organization (WHO)",
        "organization": "United Nations Specialized Agency",
        "website_url": "https://www.who.int",
        "description": "Global authority on public health guidance, epidemic monitoring, and clinical best practices.",
        "topics_covered": ["Cardiovascular Health", "Hypertension", "Infectious Disease", "Global Health Standards"]
    },
    {
        "name": "MedlinePlus",
        "organization": "National Library of Medicine (NIH)",
        "website_url": "https://medlineplus.gov",
        "description": "Trusted, peer-reviewed consumer health information from the world's largest medical library.",
        "topics_covered": ["Laboratory Tests", "Medical Encyclopedia", "Drugs and Supplements", "Symptoms"]
    },
    {
        "name": "Centers for Disease Control and Prevention (CDC)",
        "organization": "U.S. Department of Health and Human Services",
        "website_url": "https://www.cdc.gov",
        "description": "Science-based health protection agency leading preventive health, immunology, and disease mitigation.",
        "topics_covered": ["Preventive Health", "Immunization", "Nutrition & Hydration", "Environmental Health"]
    },
    {
        "name": "American Heart Association (AHA)",
        "organization": "Non-profit Medical Organization",
        "website_url": "https://www.heart.org",
        "description": "Leading global research and clinical guideline institute for cardiovascular and stroke prevention.",
        "topics_covered": ["Blood Pressure", "Cholesterol", "Diet & Fitness", "Heart Health"]
    }
]

def seed_database(db: Session):
    # 1. Create or get Demo User
    demo_email = "alex@healthease.ai"
    existing_user = db.query(User).filter(User.email == demo_email).first()
    if not existing_user:
        user = User(
            email=demo_email,
            hashed_password=hash_pass("healthease2026"),
            role="user"
        )
        db.add(user)
        db.flush()

        profile = Profile(
            user_id=user.id,
            full_name="Alex Rivera",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
            preferred_language="en",
            explanation_level="General Public",
            voice_speed=1.0,
            voice_gender="neutral"
        )
        db.add(profile)

        progress = LearningProgress(
            user_id=user.id,
            topics_explored_count=24,
            saved_explanations_count=12,
            reports_simplified_count=4,
            terms_learned_count=37,
            quizzes_completed_count=8,
            overall_accuracy=85.0,
            category_progress={
                "General Health": 85,
                "Cardiology": 90,
                "Nutrition": 70,
                "Medical Terms": 88,
                "Preventive Care": 75
            }
        )
        db.add(progress)

        # Initial saved item
        saved = SavedItem(
            user_id=user.id,
            item_type="explanation",
            title="Understanding Hypertension & Vascular Elasticity",
            category="Cardiology",
            content="Hypertension means elevated arterial blood pressure. Managing sodium and getting 150 minutes of weekly activity helps preserve vascular flexibility.",
            metadata_json={"level": "General Public", "date": "2026-10-01"}
        )
        db.add(saved)

    # 2. Seed Medical Terms
    for term_data in SAMPLE_TERMS:
        if not db.query(MedicalTerm).filter(MedicalTerm.term == term_data["term"]).first():
            term = MedicalTerm(**term_data)
            db.add(term)

    # 3. Seed Articles
    for art_data in SAMPLE_ARTICLES:
        if not db.query(EducationContent).filter(EducationContent.slug == art_data["slug"]).first():
            art = EducationContent(**art_data)
            db.add(art)

    # 4. Seed Trusted Sources
    for src_data in SAMPLE_SOURCES:
        if not db.query(TrustedSource).filter(TrustedSource.name == src_data["name"]).first():
            src = TrustedSource(**src_data)
            db.add(src)

    db.commit()
