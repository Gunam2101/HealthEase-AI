import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SupportedLanguage, LanguagePreference, LanguageDetectionResult } from '../types';
import { api } from '../services/api';

interface LanguageContextType {
  language: SupportedLanguage; // Active response/display language ('en' | 'ta' | 'hi')
  preference: LanguagePreference; // User setting: 'auto' | 'en' | 'ta' | 'hi'
  setPreference: (pref: LanguagePreference) => void;
  setLanguage: (lang: SupportedLanguage | LanguagePreference) => void;
  detectedLanguage: LanguageDetectionResult | null;
  detectInputLanguage: (text: string) => LanguageDetectionResult;
  t: (key: string) => string;
}

const UI_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    home: "Dashboard",
    assistant: "AI Assistant",
    symptoms: "Symptom Checker",
    medicine: "Medicine Information",
    report_analyzer: "Report Analyzer",
    medical_dict: "Medical Dictionary",
    simplify_text: "Simplify Text",
    health_education: "Health Education",
    health_news: "Health News",
    news: "Health News",
    timeline: "Health Timeline",
    sources: "Trusted Resources",
    emergency: "Emergency Help",
    settings: "Settings",
    admin: "Admin Portal",
    voice_input: "Multilingual Voice Input",
    listening: "Listening...",
    processing: "Processing speech...",
    detecting_lang: "Detecting language...",
    speak_question: "Speak your question...",
    voice_unsupported: "Voice input is unavailable. Please type your question.",
    search_placeholder: "Search health topics, medicines, symptoms, or medical terms...",
    greeting: "Good morning 👋",
    what_understand: "What would you like to understand today?",
    ask_placeholder: "Ask HealthEase anything...",
    todays_tip: "Today's Health Tip",
    explain_like_im: "Explain Like I'm...",
    popular_topics: "Popular Topics",
    recent_activity: "Recent Activity",
    disclaimer: "HealthEase AI provides general health information for educational purposes and does not replace professional medical advice, diagnosis, or treatment.",
    listen: "Listen",
    translate: "Translate",
    copy: "Copy",
    regenerate: "Regenerate",
    sources_title: "Trusted Sources",
    follow_up_questions: "Recommended Follow-ups",
    quick_actions: "Quick Health Tools",
    upload_report: "Upload Health Report",
    drop_report: "Drop your health report here or click to browse",
    simplify_now: "Simplify Medical Text",
    latest_health_updates: "Latest Health Updates",
    news_subtitle: "New health research and trusted health information",
    view_all_news: "View All News →",
    ai_summary: "AI Summary",
    ask_healthease: "Ask HealthEase",
    read_article: "Read Article",
    original_article: "Original Article",
    translated_from_en: "Translated from English",
    trending_topics: "Trending Health Topics",
    trusted_sources_label: "Trusted Sources",
    auto_detect: "Auto Detect",
    detected_badge: "detected"
  },
  ta: {
    home: "முகப்பு",
    assistant: "AI உதவியாளர்",
    symptoms: "அறிகுறி சரிபார்ப்பான்",
    medicine: "மருந்து தகவல்",
    report_analyzer: "அறிக்கை பகுப்பாய்வி",
    medical_dict: "மருத்துவ அகராதி",
    simplify_text: "எளிய உரை",
    health_education: "ஆரோக்கிய கல்வி",
    health_news: "சுகாதார செய்திகள்",
    news: "சுகாதார செய்திகள்",
    timeline: "ஆரோக்கிய காலவரிசை",
    sources: "நம்பகமான ஆதாரங்கள்",
    emergency: "அவசர உதவி",
    settings: "அமைப்புகள்",
    admin: "நிர்வாகி",
    voice_input: "பன்மொழி குரல் உள்ளீடு",
    listening: "கேட்கிறது...",
    processing: "செயலாக்குகிறது...",
    detecting_lang: "மொழியைக் கண்டறிகிறது...",
    speak_question: "உங்கள் கேள்வியைப் பேசுங்கள்...",
    voice_unsupported: "குரல் உள்ளீடு கிடைக்கவில்லை. தயவுசெய்து உங்கள் கேள்வியைத் தட்டச்சு செய்யவும்.",
    search_placeholder: "ஆரோக்கிய தலைப்புகள், மருந்துகள், அறிகுறிகளைத் தேடுங்கள்...",
    greeting: "காலை வணக்கம் 👋",
    what_understand: "இன்று நீங்கள் எதைப் பற்றி அறிந்து கொள்ள விரும்புகிறீர்கள்?",
    ask_placeholder: "ஹெல்த்ஈஸிடம் எதையும் கேளுங்கள்...",
    todays_tip: "இன்றைய ஆரோக்கிய குறிப்பு",
    explain_like_im: "விளக்க நிலை...",
    popular_topics: "பிரபலமான தலைப்புகள்",
    recent_activity: "சமீபத்திய செயல்பாடு",
    disclaimer: "ஹெல்த்ஈஸ் AI பொதுவான ஆரோக்கியத் தகவல்களை கல்வி நோக்கங்களுக்காக மட்டுமே வழங்குகிறது. மருத்துவ ஆலோசனைக்கு மாற்றாகாது.",
    listen: "கேளுங்கள்",
    translate: "மொழிபெயர்",
    copy: "நகலெடு",
    regenerate: "மீண்டும் உருவாக்கு",
    sources_title: "நம்பகமான ஆதாரங்கள்",
    follow_up_questions: "தொடர் கேள்விகள்",
    quick_actions: "விரைவு ஆரோக்கியக் கருவிகள்",
    upload_report: "அறிக்கையைப் பதிவேற்றவும்",
    drop_report: "உங்கள் அறிக்கையை இங்கே பதிவேற்றவும்",
    simplify_now: "மருத்துவ உரையை எளிமையாக்கு",
    latest_health_updates: "சமீபத்திய சுகாதார புதுப்பிப்புகள்",
    news_subtitle: "புதிய சுகாதார ஆராய்ச்சிகள் மற்றும் சரிபார்க்கப்பட்ட தகவல்கள்",
    view_all_news: "அனைத்து செய்திகளையும் காண்க →",
    ai_summary: "AI சுருக்கம்",
    ask_healthease: "ஹெல்த்ஈஸிடம் கேட்க",
    read_article: "கட்டுரையைப் படிக்கவும்",
    original_article: "அசல் கட்டுரை",
    translated_from_en: "ஆங்கிலத்திலிருந்து மொழிபெயர்க்கப்பட்டது",
    trending_topics: "பிரபலமான சுகாதார தலைப்புகள்",
    trusted_sources_label: "நம்பகமான ஆதாரங்கள்",
    auto_detect: "தானியங்கு கண்டறிதல்",
    detected_badge: "கண்டறியப்பட்டது"
  },
  hi: {
    home: "डैशबोर्ड",
    assistant: "AI सहायक",
    symptoms: "लक्षण जांचकर्ता",
    medicine: "दवा की जानकारी",
    report_analyzer: "रिपोर्ट विश्लेषक",
    medical_dict: "चिकित्सा शब्दकोश",
    simplify_text: "सरल पाठ",
    health_education: "स्वास्थ्य शिक्षा",
    health_news: "स्वास्थ्य समाचार",
    news: "स्वास्थ्य समाचार",
    timeline: "स्वास्थ्य समयरेखा",
    sources: "विश्वसनीय स्रोत",
    emergency: "आपातकालीन सहायता",
    settings: "सेटिंग्स",
    admin: "एडमिन पोर्टल",
    voice_input: "बहुभाषी ध्वनि इनपुट",
    listening: "सुन रहे हैं...",
    processing: "प्रसंस्करण हो रहा है...",
    detecting_lang: "भाषा की पहचान हो रही है...",
    speak_question: "अपना प्रश्न बोलें...",
    voice_unsupported: "वॉइस इनपुट उपलब्ध नहीं है। कृपया अपना प्रश्न टाइप करें।",
    search_placeholder: "स्वास्थ्य विषयों, दवाओं, लक्षणों या शब्दों को खोजें...",
    greeting: "शुभ प्रभात 👋",
    what_understand: "आज आप किस स्वास्थ्य विषय को समझना चाहते हैं?",
    ask_placeholder: "हेल्थईज़ से कुछ भी पूछें...",
    todays_tip: "आज की स्वास्थ्य टिप",
    explain_like_im: "व्याख्या का स्तर...",
    popular_topics: "लोकप्रिय विषय",
    recent_activity: "हाल की गतिविधि",
    disclaimer: "हेल्थईज़ AI केवल शैक्षिक उद्देश्यों के लिए सामान्य स्वास्थ्य जानकारी प्रदान करता है और पेशेवर चिकित्सा सलाह का विकल्प नहीं है।",
    listen: "सुनें",
    translate: "अनुवाद करें",
    copy: "कॉपी करें",
    regenerate: "पुनः उत्पन्न करें",
    sources_title: "विश्वसनीय स्रोत",
    follow_up_questions: "अनुशंसित प्रश्न",
    quick_actions: "त्वरित स्वास्थ्य उपकरण",
    upload_report: "स्वास्थ्य रिपोर्ट अपलोड करें",
    drop_report: "अपनी स्वास्थ्य रिपोर्ट यहाँ डालें",
    simplify_now: "चिकित्सा पाठ सरल करें",
    latest_health_updates: "नवीनतम स्वास्थ्य अपडेट",
    news_subtitle: "नया स्वास्थ्य अनुसंधान और विश्वसनीय स्वास्थ्य जानकारी",
    view_all_news: "सभी समाचार देखें →",
    ai_summary: "AI सारांश",
    ask_healthease: "हेल्थईज़ से पूछें",
    read_article: "लेख पढ़ें",
    original_article: "मूल लेख",
    translated_from_en: "अंग्रेजी से अनुवादित",
    trending_topics: "ट्रेंडिंग स्वास्थ्य विषय",
    trusted_sources_label: "विश्वसनीय स्रोत",
    auto_detect: "स्वतः पहचान",
    detected_badge: "पहचाना गया"
  },
};

// Client-side fast language heuristics for zero-latency detection
const TANGLISH_WORDS = new Set([
    "enna", "epdi", "epadi", "irukku", "iruku", "romba", "vali", "valikithu",
    "sollunga", "sollu", "naan", "na", "seri", "illa", "illai", "paathuko", "koodum",
    "marundhu", "udambu", "thalai", "thalaivali", "kaichal", "kaachal",
    "sappadu", "kudikanum", "doctor", "theriyala", "aachu", "aayiduchu",
    "yen", "eppadi", "nalla", "periya", "chinna", "problem", "konjam"
]);

const HINGLISH_WORDS = new Set([
    "kya", "hai", "kaise", "kare", "hoga", "dard", "bukhar", "batao",
    "bataiye", "dawa", "ilaj", "chahiye", "pehle", "karen", "hota", "hote",
    "mujhe", "mera", "meri", "sir", "sirdard", "pet", "petdard", "khana",
    "kyun", "accha", "zyada", "kam", "bataye", "taklif"
]);

export function performClientLanguageDetection(text: string): LanguageDetectionResult {
  if (!text || !text.trim()) {
    return {
      language: 'en',
      script: 'Latin',
      confidence: 1.0,
      is_code_mixed: false,
      native_label: 'English',
      detected_name: 'English'
    };
  }

  const clean = text.trim();
  const tamilChars = (clean.match(/[\u0B80-\u0BFF]/g) || []).length;
  const devanagariChars = (clean.match(/[\u0900-\u097F]/g) || []).length;
  const teluguChars = (clean.match(/[\u0C00-\u0C7F]/g) || []).length;
  const malayalamChars = (clean.match(/[\u0D00-\u0D7F]/g) || []).length;
  const kannadaChars = (clean.match(/[\u0C80-\u0CFF]/g) || []).length;
  const bengaliChars = (clean.match(/[\u0980-\u09FF]/g) || []).length;
  const latinChars = (clean.match(/[a-zA-Z]/g) || []).length;

  const total = tamilChars + devanagariChars + teluguChars + malayalamChars + kannadaChars + bengaliChars + latinChars || 1;

  if (tamilChars > 0 && (tamilChars / total) > 0.15) {
    return {
      language: 'ta',
      script: 'Tamil',
      confidence: Math.min(1.0, tamilChars / total + 0.4),
      is_code_mixed: latinChars > 0,
      native_label: 'தமிழ்',
      detected_name: 'Tamil'
    };
  }

  if (devanagariChars > 0 && (devanagariChars / total) > 0.15) {
    return {
      language: 'hi',
      script: 'Devanagari',
      confidence: Math.min(1.0, devanagariChars / total + 0.4),
      is_code_mixed: latinChars > 0,
      native_label: 'हिन्दी',
      detected_name: 'Hindi'
    };
  }

  if (teluguChars > 0 && (teluguChars / total) > 0.15) {
    return {
      language: 'te',
      script: 'Telugu',
      confidence: Math.min(1.0, teluguChars / total + 0.4),
      is_code_mixed: latinChars > 0,
      native_label: 'తెలుగు',
      detected_name: 'Telugu'
    };
  }

  if (malayalamChars > 0 && (malayalamChars / total) > 0.15) {
    return {
      language: 'ml',
      script: 'Malayalam',
      confidence: Math.min(1.0, malayalamChars / total + 0.4),
      is_code_mixed: latinChars > 0,
      native_label: 'മലയാളം',
      detected_name: 'Malayalam'
    };
  }

  if (kannadaChars > 0 && (kannadaChars / total) > 0.15) {
    return {
      language: 'kn',
      script: 'Kannada',
      confidence: Math.min(1.0, kannadaChars / total + 0.4),
      is_code_mixed: latinChars > 0,
      native_label: 'ಕನ್ನಡ',
      detected_name: 'Kannada'
    };
  }

  if (bengaliChars > 0 && (bengaliChars / total) > 0.15) {
    return {
      language: 'bn',
      script: 'Bengali',
      confidence: Math.min(1.0, bengaliChars / total + 0.4),
      is_code_mixed: latinChars > 0,
      native_label: 'বাংলা',
      detected_name: 'Bengali'
    };
  }

  // Check Romanized Code-mixed
  const words = clean.toLowerCase().match(/[a-zA-Z]+/g) || [];
  for (const w of words) {
    if (TANGLISH_WORDS.has(w)) {
      return {
        language: 'ta',
        script: 'Latin (Tanglish)',
        confidence: 0.88,
        is_code_mixed: true,
        native_label: 'தமிழ் (Tanglish)',
        detected_name: 'Tanglish'
      };
    }
    if (HINGLISH_WORDS.has(w)) {
      return {
        language: 'hi',
        script: 'Latin (Hinglish)',
        confidence: 0.88,
        is_code_mixed: true,
        native_label: 'हिन्दी (Hinglish)',
        detected_name: 'Hinglish'
      };
    }
  }

  return {
    language: 'en',
    script: 'Latin',
    confidence: 0.95,
    is_code_mixed: false,
    native_label: 'English',
    detected_name: 'English'
  };
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  preference: 'auto',
  setPreference: () => {},
  setLanguage: () => {},
  detectedLanguage: null,
  detectInputLanguage: () => performClientLanguageDetection(''),
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Preference: 'auto' | 'en' | 'ta' | 'hi'
  const [preference, setPreferenceState] = useState<LanguagePreference>(() => {
    const saved = localStorage.getItem('healthease_language_pref') as LanguagePreference;
    if (saved && ['auto', 'en', 'ta', 'hi'].includes(saved)) {
      return saved;
    }
    return 'auto';
  });

  const [detectedLanguage, setDetectedLanguage] = useState<LanguageDetectionResult | null>(null);

  const setPreference = (pref: LanguagePreference) => {
    setPreferenceState(pref);
    localStorage.setItem('healthease_language_pref', pref);
    if (pref !== 'auto') {
      localStorage.setItem('healthease_language', pref);
    }
  };

  const setLanguage = (lang: SupportedLanguage | LanguagePreference) => {
    if (lang === 'auto') {
      setPreference('auto');
    } else {
      setPreference(lang as LanguagePreference);
    }
  };

  const detectInputLanguage = useCallback((text: string): LanguageDetectionResult => {
    const result = performClientLanguageDetection(text);
    if (text.trim().length > 2) {
      setDetectedLanguage(result);
    }
    return result;
  }, []);

  // Compute active response language:
  // 1. Manual language selection overrides automatic detection
  // 2. Automatic input language detection (if preference is 'auto')
  // 3. Fallback to English
  const activeLanguage: SupportedLanguage = (() => {
    if (preference !== 'auto') {
      return preference as SupportedLanguage;
    }
    if (detectedLanguage && ['en', 'ta', 'hi'].includes(detectedLanguage.language as string)) {
      return detectedLanguage.language as SupportedLanguage;
    }
    return 'en';
  })();

  const t = useCallback((key: string): string => {
    const langDict = UI_TRANSLATIONS[activeLanguage] || UI_TRANSLATIONS.en;
    if (langDict[key]) return langDict[key];
    return UI_TRANSLATIONS.en[key] || key;
  }, [activeLanguage]);

  return (
    <LanguageContext.Provider value={{
      language: activeLanguage,
      preference,
      setPreference,
      setLanguage,
      detectedLanguage,
      detectInputLanguage,
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
