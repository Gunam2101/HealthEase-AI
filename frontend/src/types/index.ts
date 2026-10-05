export type ExplanationLevel = 
  | 'School Student' 
  | 'College Student' 
  | 'General Public' 
  | 'Caregiver' 
  | 'Healthcare Student';

export type SupportedLanguage = 'en' | 'ta' | 'hi';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string;
  preferred_language: SupportedLanguage;
  explanation_level: ExplanationLevel;
  voice_speed: number;
  voice_gender: string;
  high_contrast: boolean;
  reduced_motion: boolean;
}

export interface SourceCitation {
  title: string;
  organization: string;
  url: string;
  snippet?: string;
}

export interface StructuredSection {
  title: string;
  content: string;
}

export interface SafetyAlert {
  is_safe: boolean;
  risk_category?: string;
  severity: 'none' | 'low' | 'medium' | 'critical';
  warning_message?: string;
  helpline_contacts: Array<{ name: string; number: string }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  explanation_level?: ExplanationLevel;
  language?: SupportedLanguage;
  safety?: SafetyAlert;
  sources?: SourceCitation[];
  follow_ups?: string[];
  structured_sections?: StructuredSection[];
  created_at?: string;
}

export interface MedicalTermItem {
  id: string;
  term: string;
  phonetic?: string;
  category: string;
  simple_meaning: string;
  detailed_explanation: string;
  common_concepts: string[];
  related_terms: string[];
  example_usage?: string;
  translations: Record<string, string>;
}

export interface TestResultItem {
  name: string;
  value: string;
  unit?: string;
  reference_range?: string;
  status: 'within_range' | 'outside_range' | 'unknown';
  explanation: string;
}

export interface DocumentAnalysis {
  document_id: string;
  document_type: string;
  filename: string;
  report_date?: string;
  summary: string;
  tests: TestResultItem[];
  identified_terms: Array<{ term: string; explanation: string }>;
  questions_for_doctor: string[];
  safety: SafetyAlert;
  disclaimer: string;
}

export interface EducationArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  reading_time_minutes: number;
  short_description: string;
  full_content?: string;
  key_takeaways: string[];
  related_topics?: string[];
  badge?: string;
}

export interface SymptomCheckResponse {
  query: string;
  language: SupportedLanguage;
  symptoms_mentioned: string[];
  possible_causes: string[];
  self_care_measures: string[];
  warning_signs: string[];
  when_to_seek_care: string;
  is_emergency: boolean;
  emergency_guidance?: string | null;
  formatted_response: string;
  disclaimer: string;
  sources: SourceCitation[];
}

export interface MedicineResponse {
  query: string;
  name: string;
  category: string;
  what_is_it: string;
  common_uses: string[];
  common_forms: string[];
  common_side_effects: string[];
  precautions: string[];
  professional_guidance: string;
  safety_notice: string;
  formatted_response: string;
  sources: SourceCitation[];
}

export interface TimelineEvent {
  id: string;
  time: string;
  date_group: 'Today' | 'Yesterday' | 'Earlier';
  timestamp: string;
  title: string;
  category: string;
  description: string;
  icon_type: string;
}

export interface TrustedResource {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  badge: string;
  topics: string[];
}

export type LanguagePreference = 'auto' | 'en' | 'ta' | 'hi';

export interface LanguageDetectionResult {
  language: SupportedLanguage | string;
  script: string;
  confidence: number;
  is_code_mixed: boolean;
  native_label: string;
  detected_name: string;
}

export interface HealthNewsArticle {
  id: string;
  title: string;
  summary: string;
  full_summary?: string;
  source_name: string;
  source_url: string;
  category: string;
  image_url: string;
  published_at: string;
  time_ago: string;
  safety_notice: string;
  translated_title?: string;
  translated_summary?: string;
  is_translated?: boolean;
  language?: string;
}

export interface NewsCategory {
  id: string;
  label: string;
  badge: string;
}

export interface NewsSummaryResponse {
  article_id?: string;
  title: string;
  source_name: string;
  source_url: string;
  language: string;
  formatted_summary: string;
}

