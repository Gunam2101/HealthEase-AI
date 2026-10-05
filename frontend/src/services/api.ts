import {
  UserProfile, DocumentAnalysis, MedicalTermItem, EducationArticle,
  SupportedLanguage, ExplanationLevel, SymptomCheckResponse,
  MedicineResponse, TimelineEvent, TrustedResource,
  HealthNewsArticle, NewsCategory, NewsSummaryResponse, LanguageDetectionResult
} from '../types';

const API_BASE = '/api';

export const api = {
  // --- Profile ---
  async getProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/profile`);
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // --- AI Chat ---
  async sendChatMessage(payload: {
    message: string;
    conversation_id?: string;
    explanation_level?: ExplanationLevel;
    language?: SupportedLanguage;
    document_id?: string;
  }) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  async getChatHistory() {
    const res = await fetch(`${API_BASE}/chat/history`);
    if (!res.ok) throw new Error('Failed to load history');
    return res.json();
  },

  async translateText(text: string, target_language: SupportedLanguage) {
    const res = await fetch(`${API_BASE}/chat/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target_language }),
    });
    if (!res.ok) throw new Error('Failed to translate');
    return res.json();
  },

  // --- Symptom Checker ---
  async checkSymptoms(payload: {
    query: string;
    language?: SupportedLanguage;
  }): Promise<SymptomCheckResponse> {
    const res = await fetch(`${API_BASE}/symptoms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to check symptoms');
    return res.json();
  },

  // --- Medicine Information ---
  async getMedicineInfo(payload: {
    query: string;
    language?: SupportedLanguage;
  }): Promise<MedicineResponse> {
    const res = await fetch(`${API_BASE}/medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to load medicine info');
    return res.json();
  },

  // --- Health Timeline ---
  async getHealthTimeline(): Promise<{ events: TimelineEvent[]; total: number }> {
    const res = await fetch(`${API_BASE}/health-timeline`);
    if (!res.ok) throw new Error('Failed to load health timeline');
    return res.json();
  },

  // --- Trusted Sources ---
  async getTrustedSources(): Promise<{ sources: TrustedResource[] }> {
    const res = await fetch(`${API_BASE}/sources`);
    if (!res.ok) throw new Error('Failed to load trusted sources');
    return res.json();
  },

  // --- Document Analysis ---
  async uploadDocument(file: File): Promise<DocumentAnalysis> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to upload document' }));
      throw new Error(err.detail || 'Failed to upload document');
    }
    return res.json();
  },

  async getSampleReport(sampleId: string): Promise<DocumentAnalysis> {
    const res = await fetch(`${API_BASE}/documents/sample/${sampleId}`);
    if (!res.ok) throw new Error('Failed to load sample report');
    return res.json();
  },

  async chatAboutDocument(payload: {
    message: string;
    document_id: string;
    explanation_level?: ExplanationLevel;
    language?: SupportedLanguage;
  }) {
    const res = await fetch(`${API_BASE}/documents/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to chat about document');
    return res.json();
  },

  // --- Medical Dictionary & Simplifier ---
  async getMedicalTerms(category?: string, query?: string): Promise<MedicalTermItem[]> {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (query) params.append('query', query);
    const res = await fetch(`${API_BASE}/medical-terms?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load medical terms');
    return res.json();
  },

  async getTermByName(termName: string): Promise<MedicalTermItem> {
    const res = await fetch(`${API_BASE}/medical-terms/${encodeURIComponent(termName)}`);
    if (!res.ok) throw new Error('Failed to load term');
    return res.json();
  },

  async simplifyMedicalText(payload: {
    text: string;
    mode: string;
    language: SupportedLanguage;
  }) {
    const res = await fetch(`${API_BASE}/medical-terms/simplify-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to simplify text');
    return res.json();
  },

  // --- Health Education ---
  async getEducationArticles(category?: string): Promise<EducationArticle[]> {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    const res = await fetch(`${API_BASE}/education?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load articles');
    return res.json();
  },

  async getArticleBySlug(slug: string): Promise<EducationArticle> {
    const res = await fetch(`${API_BASE}/education/${slug}`);
    if (!res.ok) throw new Error('Failed to load article');
    return res.json();
  },

  async getTodaysTip() {
    const res = await fetch(`${API_BASE}/education/tip/today`);
    if (!res.ok) throw new Error('Failed to load daily tip');
    return res.json();
  },

  // --- Admin ---
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (!res.ok) throw new Error('Failed to load admin stats');
    return res.json();
  },

  async getAdminSources() {
    const res = await fetch(`${API_BASE}/admin/sources`);
    if (!res.ok) throw new Error('Failed to load sources');
    return res.json();
  },

  async getAdminFlags() {
    const res = await fetch(`${API_BASE}/admin/safety-flags`);
    if (!res.ok) throw new Error('Failed to load safety flags');
    return res.json();
  },

  // --- Automatic Language Detection ---
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    const res = await fetch(`${API_BASE}/language/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      return {
        language: 'en',
        script: 'Latin',
        confidence: 1.0,
        is_code_mixed: false,
        native_label: 'English',
        detected_name: 'English'
      };
    }
    return res.json();
  },

  // --- Health News ---
  async getHealthNews(params?: {
    category?: string;
    search?: string;
    limit?: number;
  }): Promise<{ articles: HealthNewsArticle[]; total: number; category: string; search: string }> {
    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== 'All') searchParams.append('category', params.category);
    if (params?.search && params.search.trim()) searchParams.append('search', params.search.trim());
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/news?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to load health news');
    return res.json();
  },

  async searchHealthNews(query: string, category?: string): Promise<{ articles: HealthNewsArticle[]; total: number; query: string; category: string }> {
    const searchParams = new URLSearchParams({ query });
    if (category && category !== 'All') searchParams.append('category', category);
    const res = await fetch(`${API_BASE}/news/search?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to search health news');
    return res.json();
  },

  async getNewsCategories(): Promise<{ categories: NewsCategory[] }> {
    const res = await fetch(`${API_BASE}/news/categories`);
    if (!res.ok) throw new Error('Failed to load news categories');
    return res.json();
  },

  async getNewsArticleById(articleId: string): Promise<HealthNewsArticle> {
    const res = await fetch(`${API_BASE}/news/${encodeURIComponent(articleId)}`);
    if (!res.ok) throw new Error('Failed to load article detail');
    return res.json();
  },

  async getNewsSummary(req: {
    article_id?: string;
    title?: string;
    summary?: string;
    source_name?: string;
    source_url?: string;
    category?: string;
    language?: string;
  }): Promise<NewsSummaryResponse> {
    const res = await fetch(`${API_BASE}/news/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('Failed to generate news summary');
    return res.json();
  },

  async translateNewsArticle(req: {
    article_id?: string;
    title: string;
    summary: string;
    target_language: string;
  }): Promise<{ translated_title: string; translated_summary: string; is_translated: boolean; language: string }> {
    const res = await fetch(`${API_BASE}/news/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('Failed to translate article');
    return res.json();
  },
};
