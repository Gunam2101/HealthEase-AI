# 🏥 HealthEase AI
### AI-Powered Health Information & Medical Education Assistant

> *"Understand your health. Make informed decisions."*

HealthEase AI is a modern, production-quality GenAI health-information platform designed to help users demystify clinical reports, medical terminology, and physiological health concepts into accessible language across multiple reading comprehension levels and languages.

---

## 🛡️ Responsible AI & Clinical Safety

> [!IMPORTANT]
> **HealthEase AI is strictly an educational health-information platform.**
> It is **NOT** a doctor, diagnostic system, emergency medical service, or prescription platform. The system is architecturally guarded to **NEVER** diagnose conditions, prescribe medications, alter dosages, or substitute licensed medical care.

### Multi-Tier Safety Engine
1. **Emergency & High-Risk Triage Refusal**: Detects acute emergency patterns (e.g., crushing chest pain radiating to left arm/jaw, stroke signs, breathing failure, severe bleeding, anaphylaxis) and immediately presents an emergency alert banner with direct one-click helpline dials (**911**, **112**, **108**).
2. **Crisis & Self-Harm De-escalation**: Detects crisis keywords and provides compassionate language with direct access to the **988 Suicide & Crisis Lifeline** and international crisis hotlines.
3. **Prescription & Dosage Refusal**: Strictly blocks attempts to generate medication dosage recommendations or prescription instructions; directs users to a licensed prescribing physician or pharmacist.
4. **Diagnostic Guardrail**: Formulates educational background on the physiological symptoms while clearly advising physical clinical examination.
5. **Universal Subtle Disclaimer**: Visible across all views without interfering with UX.

---

## ✨ Core Features & Capabilities

- 🤖 **Conversational AI Health Assistant**:
  - Persona Engine (*"Explain Like I'm..."*): School Student, College Student, General Public, Caregiver, Healthcare Student
  - Structured explanations: *Simple Explanation*, *Why It Matters*, *Common Terms*, *Prevention & Healthy Practices*, *When to Seek Professional Help*
  - Interactive clickable clinical terms with instant definition popovers
  - Contextual follow-up questions
  - Text-to-Speech (TTS) with variable speeds (0.75x, 1.0x, 1.25x)
  - 1-click translation into 5 languages: English, Tamil (தமிழ்), Hindi (हिन्दी), Telugu (తెలుగు), Malayalam (മലയാളം)
  - Feedback rating (thumbs up/down), copy, and save to library

- 📄 **Health Report Analyzer & Document Chat**:
  - Accepts PDF, PNG, JPG, and TXT files
  - Extracted biomarkers table: Test Name, Reported Value, Unit, Reference Range, Status Chip (*Within Range* vs *Outside Stated Range*), Plain-language explanation
  - Preserves laboratory stated reference intervals without alarmist diagnoses
  - Identified medical terminology breakdown
  - Questions to discuss with your doctor
  - Grounded interactive Document Chat (ask questions specifically about the uploaded report)
  - 1-Click sample reports for instant testing (*Comprehensive Metabolic & Lipid Panel*, *Complete Blood Count - CBC*)
  - Export report summary as TXT

- 🔬 **Medical Dictionary**:
  - Searchable catalog of clinical terms with category filters (Cardiology, Endocrinology, Hematology, Nephrology, Pulmonology, General)
  - Phonetic pronunciation and audio playback
  - Plain-language definition, clinical pathophysiological detail, common concepts, related terms, and example clinical usage
  - Multilingual translations preserving primary clinical terms in English brackets
  - On-demand AI explanation for any unlisted medical term

- ✨ **Medical Text Simplifier ("Simplify My Medical Text")**:
  - Paste dense clinical discharge summaries or doctor notes
  - 6 Simplification modes: *Very Simple*, *Simple*, *College Level*, *Detailed*, *Bullet Points*, *Short Summary*
  - Side-by-side comparison: *Original Clinical Text* | *AI Simplified Explanation*
  - Export to TXT, Listen (TTS), Copy, and Save

- 📚 **Grounded RAG (Retrieval-Augmented Generation)**:
  - Curated medical references from **WHO**, **MedlinePlus**, **CDC**, **NIH**, and **American Heart Association (AHA)**
  - Expandable source citation cards with verified snippets and links

- 🎙️ **Voice Assistant (Input & Output)**:
  - Speech-to-text voice input with animated pulsating AI orb and audio waveform
  - High-quality Web Speech API Text-to-Speech synthesis

- 🎓 **Health Education Center**:
  - Curated educational articles across categories (*General Health*, *Nutrition*, *Sleep*, *Exercise*, *Preventive Care*, *Mental Well-being*)
  - Estimated reading times, key takeaways, reader modal, and audio narration

- 🧪 **AI Health Quizzes**:
  - Educational quizzes across topics (*Cardiovascular Health*, *HbA1c & Glycemic Biomarkers*, *Lipid Profiles*, *Hematology*)
  - Difficulty options (Easy, Medium, Hard) and question counts (5 or 10)
  - Multiple choice, True/False, and Scenario-based questions
  - Instant educational explanations for every answer, confetti celebration, and suggested review topics

- 📊 **Health Learning Analytics**:
  - Tracks educational engagement: *Topics Explored*, *Saved Explanations*, *Reports Simplified*, *Terms Learned*, *Quizzes Completed*, *Accuracy Rate*
  - Category literacy progress bars
  - Clearly labelled as *Health Learning Analytics*, distinguished from medical diagnosis

- 🛡️ **Admin Portal**:
  - Telemetry overview (Total users, clinical terms, articles, sources, safety flags)
  - Verified RAG sources manager
  - Safety engine trigger audit log

---

## 🎨 Design System

- **Visual Direction**: *"Apple Health + modern AI assistant + futuristic medical dashboard"*
- **Palette**:
  - Background: Deep Midnight Navy (`#080C15`, `#0B1120`, `#0D1527`)
  - Accent / Glow: Cyan / Teal (`#06B6D4`, `#14B8A6`, `#22D3EE`, `#00F2FE`)
  - Secondary Gradients: Electric Purple / Indigo (`#6366F1`, `#8B5CF6`, `#3B82F6`)
  - Warning/Emergency Accents: Amber (`#F59E0B`), Crimson (`#EF4444`)
- **Components**:
  - Frosted glassmorphism panels with soft neon borders
  - Glowing AI prompt orb with breathing animation
  - Fully responsive layout for Desktop, Tablet, and Mobile (bottom navigation)

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Launch with One Click (Windows)
Double-click `start_healthease.bat` or run:
```powershell
.\start_healthease.ps1
```
This automatically launches:
- **FastAPI Backend**: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`)
- **React Frontend**: `http://localhost:5173`

---

### 2. Manual Startup

#### Backend
```bash
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Master Demonstration Flow (Section 53)

To test the entire integrated flow:
1. **Open Dashboard**: Visit `http://localhost:5173`.
2. **Ask Health Question**: Ask *"Explain hypertension in simple language."*
3. **Inspect Structured Explanation**: View *Simple Explanation*, *Why It Matters*, *Key Terminology*, *Healthy Habits*, and *Next Steps with a Doctor*.
4. **Change Explanation Level**: In the top navigation or persona selector, choose *"School Student"* to see simpler analogies (e.g. garden hose metaphor).
5. **Translate**: Click the **TA** (Tamil) or **HI** (Hindi) button to view localized explanations with preserved English clinical terms in brackets.
6. **Voice Query**: Click the microphone button and ask a follow-up query.
7. **Report Analyzer**: Navigate to **Report Analyzer** and click **Metabolic & Lipid Panel** to load an instant sample blood report.
8. **Inspect Biomarkers**: View the extracted test values, reference intervals, status chips, and plain-language definitions.
9. **Document Grounded Chat**: Ask *"What does HbA1c mean in this report?"* in the document chat.
10. **Explore Dictionary**: Open **Medical Dictionary** and search for *"Tachycardia"*; listen to pronunciation and view clinical details.
11. **Simplify Clinical Notes**: Open **Simplify Text**, paste a complex note, and view side-by-side comparison.
12. **Complete Quiz**: Open **Health Quiz**, complete a 5-question cardiovascular quiz, and see instant feedback and confetti.
13. **View Learning Analytics**: Open **Learning Analytics** to see topics explored, terms learned, and category progress bars.
14. **Safety Stress Test**: Test queries like *"crushing chest pain radiating to left arm"* or *"how much mg of metformin should I take?"* to verify immediate safety alerts and prescription refusals.

---

## 📄 License
Educational health information system built with Responsible AI principles.
#   H e a l t h E a s e - A I  
 