import React, { useState, useEffect } from 'react';
import { 
  Bot, Stethoscope, Pill, FileSearch, BookOpen, Wand2, GraduationCap, 
  Newspaper, ArrowRight, Sparkles, Clock, ShieldCheck, ExternalLink, 
  ChevronRight, HeartPulse, Globe, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SafetyBanner } from '../components/SafetyBanner';
import { EmergencyModal } from '../components/EmergencyModal';
import { VoiceInput } from '../components/VoiceInput';
import { api } from '../services/api';
import { TimelineEvent, TrustedResource, HealthNewsArticle, NewsSummaryResponse } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface DashboardProps {
  onNavigate: (page: string, params?: any) => void;
  onQuickQuery: (query: string) => void;
  onOpenEmergencyModal?: () => void;
  onAskAIAboutNews?: (article: HealthNewsArticle) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onNavigate, 
  onQuickQuery,
  onOpenEmergencyModal,
  onAskAIAboutNews
}) => {
  const { profile } = useAuth();
  const { t, language, detectInputLanguage, detectedLanguage } = useLanguage();

  const [inputQuery, setInputQuery] = useState('');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [trustedSources, setTrustedSources] = useState<TrustedResource[]>([]);
  const [latestNews, setLatestNews] = useState<HealthNewsArticle[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [detectedBadge, setDetectedBadge] = useState<string>('');

  // AI Summary Modal for dashboard news
  const [summaryModalArticle, setSummaryModalArticle] = useState<HealthNewsArticle | null>(null);
  const [summaryData, setSummaryData] = useState<NewsSummaryResponse | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning 👋';
    if (hour < 17) return 'Good afternoon 👋';
    return 'Good evening 👋';
  };

  useEffect(() => {
    // Load Timeline & Trusted Sources
    api.getHealthTimeline().then(res => setTimelineEvents(res.events?.slice(0, 4) || [])).catch(() => {});
    api.getTrustedSources().then(res => setTrustedSources(res.sources?.slice(0, 3) || [])).catch(() => {});
    
    // Load 3 recent real news articles for dashboard
    setIsLoadingNews(true);
    api.getHealthNews({ limit: 3 })
      .then(res => setLatestNews(res.articles || []))
      .catch(() => {})
      .finally(() => setIsLoadingNews(false));
  }, []);

  // Live language auto-detection as user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputQuery(text);
    if (text.trim().length >= 3) {
      const result = detectInputLanguage(text);
      setDetectedBadge(result.native_label || result.detected_name);
    } else {
      setDetectedBadge('');
    }
  };

  const handleQuerySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputQuery.trim();
    if (!clean) return;

    const lower = clean.toLowerCase();
    if (lower.startsWith('symptom') || lower.includes('have headache') || lower.includes('mild fever')) {
      onNavigate('symptoms');
    } else if (lower.startsWith('medicine') || lower.startsWith('drug') || lower.includes('paracetamol') || lower.includes('metformin')) {
      onNavigate('medicine');
    } else {
      onQuickQuery(clean);
    }
  };

  const handleSuggestionClick = (query: string) => {
    if (query === 'Symptoms') {
      onNavigate('symptoms');
    } else if (query === 'Medicine information') {
      onNavigate('medicine');
    } else {
      setInputQuery(query);
      onQuickQuery(query);
    }
  };

  const handleOpenAISummary = async (article: HealthNewsArticle) => {
    setSummaryModalArticle(article);
    setSummaryData(null);
    setIsSummaryLoading(true);
    try {
      const res = await api.getNewsSummary({
        article_id: article.id,
        title: article.title,
        summary: article.full_summary || article.summary,
        source_name: article.source_name,
        source_url: article.source_url,
        category: article.category,
        language: language
      });
      setSummaryData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const suggestions = [
    { label: "Explain HbA1c", query: "Explain HbA1c" },
    { label: "What is anemia?", query: "What is anemia?" },
    { label: "Symptoms", query: "Symptoms" },
    { label: "Medicine information", query: "Medicine information" },
    { label: "Hypertension", query: "Explain hypertension simply" },
    { label: "Cholesterol Panel", query: "Explain cholesterol and lipid panels" },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Top Educational Notice */}
      <SafetyBanner />

      {/* ==================================================
          1. AI COMMAND CENTER (Main Visual Focus)
          ================================================== */}
      <section className="relative rounded-3xl p-6 sm:p-8 lg:p-10 bg-gradient-to-b from-[#0b1329] to-[#070b18] border border-cyan-500/25 shadow-2xl overflow-hidden">
        {/* Subtle Ambient Backing Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 space-y-6 max-w-3xl">
          
          {/* Greeting */}
          <div className="space-y-1.5">
            <span className="text-cyan-400 font-mono text-xs font-semibold tracking-wider uppercase block">
              AI Command Center
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {getGreeting()} {profile?.full_name ? `, ${profile.full_name}` : ''}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-normal">
              What would you like to understand today?
            </p>
          </div>

          {/* AI Input Form with Embedded Multilingual Voice & Subtle Language Badge */}
          <div className="space-y-2">
            <form 
              onSubmit={handleQuerySubmit}
              className="rounded-2xl p-2 bg-[#050811]/90 border border-cyan-500/30 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 shadow-xl flex items-center gap-2 transition-all"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={handleInputChange}
                placeholder="Ask HealthEase anything (English, தமிழ், हिन्दी)..."
                className="flex-1 bg-transparent px-3 py-2 text-sm sm:text-base text-[var(--text-primary)] placeholder-slate-500 focus:outline-none"
              />

              {/* Multilingual Voice Input */}
              <div className="shrink-0">
                <VoiceInput
                  size="md"
                  onTranscript={(transcript, detectedLang) => {
                    setInputQuery(prev => prev ? `${prev} ${transcript}` : transcript);
                    if (detectedLang) {
                      const detected = detectInputLanguage(transcript);
                      setDetectedBadge(detected.native_label || detected.detected_name);
                    }
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className="h-10 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shrink-0"
                title="Submit inquiry"
              >
                <span className="hidden sm:inline">Ask</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Subtle Language Auto-Detection Badge (Never interrupts with popups) */}
            {detectedBadge && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs w-fit animate-in fade-in duration-150">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>🌐 {detectedBadge} detected</span>
              </div>
            )}
          </div>

          {/* Prompt Suggestions Chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(item.query)}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500/15 border border-slate-700 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 transition-all cursor-pointer font-medium"
              >
                {item.label}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ==================================================
          2. QUICK HEALTH TOOLS (Strict 2-Row Layout)
          ================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Quick Health Tools</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">Core Health Suite</span>
        </div>

        {/* Row 1: AI Assistant, Symptom Checker, Medicine Info, Report Analyzer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Tool 1: AI Assistant */}
          <div
            onClick={() => onNavigate('assistant')}
            className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-cyan-500/50 hover:bg-cyan-500/[0.03] transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-cyan-400 transition-colors">
                  AI Assistant
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive health questions answered with structured breakdowns, tables, and verified citations.
                </p>
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-cyan-400 font-semibold">
              <span>Start Dialogue</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Tool 2: Symptom Checker */}
          <div
            onClick={() => onNavigate('symptoms')}
            className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-teal-500/50 hover:bg-teal-500/[0.03] transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-teal-400 transition-colors">
                  Symptom Checker
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Non-diagnostic symptom analysis with potential general causes, warning signs, and doctor visit guidance.
                </p>
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-teal-400 font-semibold">
              <span>Check Symptoms</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Tool 3: Medicine Information */}
          <div
            onClick={() => onNavigate('medicine')}
            className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-amber-500/50 hover:bg-amber-500/[0.03] transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Pill className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-amber-400 transition-colors">
                  Medicine Information
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pharmacological facts: uses, forms, side effects, and precautions without personalized dosage.
                </p>
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-amber-400 font-semibold">
              <span>Search Medicines</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Tool 4: Report Analyzer */}
          <div
            onClick={() => onNavigate('report_analyzer')}
            className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-indigo-500/50 hover:bg-indigo-500/[0.03] transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <FileSearch className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">
                  Report Analyzer
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Evaluate lab tests, CBC panels, and biomarker values against standard ranges with simple explanations.
                </p>
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-indigo-400 font-semibold">
              <span>Analyze Report</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>

        {/* Row 2: Medical Dictionary, Simplify Text, Health Education, Health News */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Tool 5: Medical Dictionary */}
          <div
            onClick={() => onNavigate('medical_dict')}
            className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-cyan-500/50 hover:bg-cyan-500/[0.03] transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-cyan-400 transition-colors">
                  Medical Dictionary
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Plain-language explanations of complex clinical terms with cross-lingual translations.
                </p>
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-cyan-400 font-semibold">
              <span>Explore Lexicon</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Tool 6: Simplify Text */}
          <div
            onClick={() => onNavigate('simplify_text')}
            className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-purple-500/50 hover:bg-purple-500/[0.03] transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Wand2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-purple-400 transition-colors">
                  Simplify Text
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Paste dense doctor notes, EHR summaries, or clinical studies to convert into easy-to-read language.
                </p>
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-purple-400 font-semibold">
              <span>Simplify Now</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Tool 7: Health Education */}
          <div
            onClick={() => onNavigate('health_education')}
            className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-emerald-500/50 hover:bg-emerald-500/[0.03] transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">
                  Health Education
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Structured guides covering cardiovascular health, diabetes management, sleep hygiene, and nutrition.
                </p>
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-emerald-400 font-semibold">
              <span>Read Guides</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Tool 8: Health News */}
          <div
            onClick={() => onNavigate('news')}
            className="p-5 rounded-2xl bg-[var(--surface)] border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/[0.04] transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                <Newspaper className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-cyan-400 transition-colors">
                    Health News
                  </h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time health reports from WHO, CDC, and verified medical agencies with AI summaries.
                </p>
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-cyan-400 font-semibold">
              <span>Open News Feed</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </section>

      {/* ==================================================
          3. LATEST HEALTH UPDATES (Section 22 Specification)
          ================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-cyan-400" />
              <span>📰 Latest Health Updates</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              New health research and trusted health information
            </p>
          </div>

          <button
            onClick={() => onNavigate('news')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View All News →</span>
          </button>
        </div>

        {/* 3 Compact Article Cards */}
        {isLoadingNews ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-44 rounded-2xl bg-slate-800/30 animate-pulse border border-[var(--border)] p-4 space-y-3" />
            ))}
          </div>
        ) : latestNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latestNews.map((article) => (
              <div
                key={article.id}
                className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-cyan-500/40 hover:bg-slate-900/40 transition-all flex flex-col justify-between space-y-3 shadow-sm group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/20">
                      {article.category}
                    </span>
                    <span className="text-slate-400 text-[11px] font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.time_ago}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-300 font-medium truncate max-w-[120px]">
                    {article.source_name}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenAISummary(article)}
                      className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="AI Summary"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Summary</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onAskAIAboutNews) {
                          onAskAIAboutNews(article);
                        } else {
                          onNavigate('assistant');
                        }
                      }}
                      className="p-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 cursor-pointer"
                      title="Ask AI"
                    >
                      <Bot className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/40 border border-[var(--border)] text-xs text-slate-400 text-center">
            Health updates temporarily updating from verified sources. Click View All News to explore.
          </div>
        )}
      </section>

      {/* ==================================================
          4. BOTTOM TWO-COLUMN: TIMELINE + RESOURCES / EMERGENCY
          ================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Personal Health Timeline Preview */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Health Timeline
              </h3>
            </div>
            <button
              onClick={() => onNavigate('timeline')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Timeline</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {timelineEvents.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">No recent activities recorded</p>
              <p>Your inquiries, symptom checks, and report uploads will appear here chronologically.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timelineEvents.map((evt) => (
                <div 
                  key={evt.id}
                  className="p-3 rounded-xl bg-slate-900/40 border border-[var(--border)] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                    <span className="font-semibold text-slate-200 truncate">{evt.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {evt.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {evt.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Trusted Resources & Emergency Guidance */}
        <div className="space-y-4">
          
          {/* Trusted Health Resources Card */}
          <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Trusted Resources
                </h3>
              </div>
              <button
                onClick={() => onNavigate('sources')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
              >
                All
              </button>
            </div>

            <div className="space-y-2">
              {trustedSources.map((src) => (
                <a
                  key={src.id}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-900/40 hover:bg-cyan-500/10 border border-[var(--border)] hover:border-cyan-500/30 flex items-center justify-between text-xs text-slate-300 transition-colors group"
                >
                  <div className="truncate">
                    <span className="font-bold text-slate-200 block truncate group-hover:text-cyan-400">
                      {src.name}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate block">
                      {src.category}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 ml-2" />
                </a>
              ))}
            </div>
          </div>

          {/* Emergency Help Card */}
          <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-2.5">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wide">
              <HeartPulse className="w-4 h-4 text-rose-400" />
              <span>Emergency Guidance</span>
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed">
              If you or someone nearby is experiencing acute chest pain, severe breathing difficulty, or trauma, contact emergency services immediately.
            </p>
            <button
              onClick={() => {
                if (onOpenEmergencyModal) {
                  onOpenEmergencyModal();
                } else {
                  setShowEmergencyModal(true);
                }
              }}
              className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              🚨 View Emergency Contacts & Help
            </button>
          </div>

        </div>

      </section>

      {/* AI Summary Modal */}
      {summaryModalArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#090F20] border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[11px] font-mono font-bold border border-cyan-500/30">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>AI Structured Health Briefing</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {summaryModalArticle.title}
                </h3>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Source: <strong className="text-slate-300">{summaryModalArticle.source_name}</strong></span>
                  <span>•</span>
                  <span>{summaryModalArticle.time_ago}</span>
                </div>
              </div>

              <button
                onClick={() => setSummaryModalArticle(null)}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {isSummaryLoading && (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
                <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-xs font-semibold text-slate-300">
                  Synthesizing key takeaways from verified health report...
                </p>
              </div>
            )}

            {!isSummaryLoading && summaryData && (
              <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200">
                <MarkdownRenderer content={summaryData.formatted_summary} />
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => {
                  const art = summaryModalArticle;
                  setSummaryModalArticle(null);
                  if (onAskAIAboutNews) {
                    onAskAIAboutNews(art);
                  } else {
                    onNavigate('assistant');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>Ask HealthEase About This</span>
              </button>

              <a
                href={summaryModalArticle.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <span>Read Original</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Modal fallback */}
      <EmergencyModal 
        isOpen={showEmergencyModal} 
        onClose={() => setShowEmergencyModal(false)} 
      />

    </div>
  );
};
