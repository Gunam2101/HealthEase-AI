import React, { useState, useEffect } from 'react';
import { 
  Newspaper, Search, Globe, Sparkles, Bot, ExternalLink, 
  Bookmark, Clock, ShieldCheck, AlertCircle, RefreshCw, 
  ArrowUpRight, Check, X, Filter, Flame, Info
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { HealthNewsArticle, NewsCategory, NewsSummaryResponse, SupportedLanguage } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { SafetyBanner } from '../components/SafetyBanner';

interface HealthNewsProps {
  onAskAIAboutNews?: (article: HealthNewsArticle) => void;
  onNavigate?: (page: string) => void;
}

export const HealthNews: React.FC<HealthNewsProps> = ({ 
  onAskAIAboutNews,
  onNavigate 
}) => {
  const { language, preference, setPreference, t } = useLanguage();

  const [articles, setArticles] = useState<HealthNewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('healthease_bookmarked_news');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // AI Summary Modal state
  const [summaryModalArticle, setSummaryModalArticle] = useState<HealthNewsArticle | null>(null);
  const [summaryData, setSummaryData] = useState<NewsSummaryResponse | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);

  // Translation cache for articles when non-English is active
  const [translatedMap, setTranslatedMap] = useState<Record<string, { title: string; summary: string }>>({});
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const trendingTopics = [
    { label: "Diabetes", category: "Diabetes" },
    { label: "Heart Health", category: "Heart Health" },
    { label: "Mental Wellness", category: "Mental Wellness" },
    { label: "Nutrition", category: "Nutrition" },
    { label: "AI in Healthcare", category: "AI & Healthcare" },
  ];

  const trustedSources = [
    { name: "World Health Organization", abbr: "WHO", url: "https://www.who.int" },
    { name: "Centers for Disease Control", abbr: "CDC", url: "https://www.cdc.gov" },
    { name: "National Institutes of Health", abbr: "NIH", url: "https://www.nih.gov" },
    { name: "National Health Service", abbr: "NHS", url: "https://www.nhs.uk" },
    { name: "ScienceDaily Health", abbr: "ScienceDaily", url: "https://www.sciencedaily.com" }
  ];

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Categories on mount
  useEffect(() => {
    api.getNewsCategories()
      .then((res) => {
        if (res.categories && res.categories.length > 0) {
          setCategories(res.categories);
        }
      })
      .catch((err) => {
        console.warn('Failed to load categories:', err);
      });
  }, []);

  // Fetch News Articles
  const fetchNews = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await api.getHealthNews({
        category: selectedCategory,
        search: debouncedSearch,
        limit: 30
      });
      setArticles(res.articles || []);
    } catch (err) {
      console.error('Failed to load news:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, debouncedSearch]);

  // Auto-translate headlines and summaries if active language is Tamil or Hindi
  useEffect(() => {
    if (language === 'en' || articles.length === 0) return;

    let isMounted = true;
    setIsTranslating(true);

    const translateBatch = async () => {
      const newTranslations: Record<string, { title: string; summary: string }> = {};
      const articlesToTranslate = articles.slice(0, 10).filter(a => !translatedMap[`${a.id}_${language}`]);

      for (const art of articlesToTranslate) {
        try {
          const res = await api.translateNewsArticle({
            article_id: art.id,
            title: art.title,
            summary: art.summary,
            target_language: language
          });
          newTranslations[`${art.id}_${language}`] = {
            title: res.translated_title,
            summary: res.translated_summary
          };
        } catch {
          // Keep original on fallback
        }
      }

      if (isMounted) {
        setTranslatedMap(prev => ({ ...prev, ...newTranslations }));
        setIsTranslating(false);
      }
    };

    translateBatch();
    return () => { isMounted = false; };
  }, [articles, language]);

  // Bookmark Toggle
  const handleToggleBookmark = (articleId: string) => {
    setBookmarkedIds(prev => {
      const updated = { ...prev, [articleId]: !prev[articleId] };
      try {
        localStorage.setItem('healthease_bookmarked_news', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Open AI Summary
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
    } catch (err) {
      console.error('Error generating AI summary:', err);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // Ask AI about this news
  const handleAskAI = (article: HealthNewsArticle) => {
    if (onAskAIAboutNews) {
      onAskAIAboutNews(article);
    } else if (onNavigate) {
      onNavigate('assistant');
    }
  };

  const getArticleTitle = (art: HealthNewsArticle) => {
    if (language !== 'en' && translatedMap[`${art.id}_${language}`]) {
      return translatedMap[`${art.id}_${language}`].title;
    }
    return art.title;
  };

  const getArticleSummary = (art: HealthNewsArticle) => {
    if (language !== 'en' && translatedMap[`${art.id}_${language}`]) {
      return translatedMap[`${art.id}_${language}`].summary;
    }
    return art.summary;
  };

  const topStory = articles.length > 0 ? articles[0] : null;
  const regularStories = articles.length > 0 ? articles.slice(1) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      
      {/* Universal Educational Safety Banner */}
      <SafetyBanner />

      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
            <Newspaper className="w-3.5 h-3.5" />
            <span>{t('health_news')} • Verified Feeds</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {language === 'ta' ? 'சுகாதார செய்திகள்' : language === 'hi' ? 'स्वास्थ्य समाचार' : 'Health News'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t('news_subtitle')}
          </p>
        </div>

        {/* Refresh & Language Indicators */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {isTranslating && (
            <span className="text-[11px] text-cyan-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Globe className="w-3 h-3 animate-spin" />
              <span>Translating headlines...</span>
            </span>
          )}
          <button
            onClick={fetchNews}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-[var(--border)] transition-all cursor-pointer disabled:opacity-50"
            title="Refresh News Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search & Language Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* News Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_news')}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Language Preference Switcher for News */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs shrink-0">
          <span className="px-2 text-slate-400 font-mono text-[11px] hidden sm:inline">🌐 News Lang:</span>
          {(['auto', 'en', 'ta', 'hi'] as const).map((code) => {
            const isActive = preference === code;
            const label = code === 'auto' ? 'Auto' : code === 'ta' ? 'தமிழ்' : code === 'hi' ? 'हिन्दी' : 'English';
            return (
              <button
                key={code}
                onClick={() => setPreference(code)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
              : 'bg-[var(--surface)] text-slate-300 hover:text-white border border-[var(--border)] hover:border-slate-600'
          }`}
        >
          🌐 All Topics
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === cat.id
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                : 'bg-[var(--surface)] text-slate-300 hover:text-white border border-[var(--border)] hover:border-slate-600'
            }`}
          >
            <span>{cat.badge}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Main Grid: Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left 3 Columns: Articles */}
        <div className="lg:col-span-3 space-y-6">

          {/* Error State */}
          {isError && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-rose-500/30 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Health news is temporarily unavailable.</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Unable to retrieve live RSS feeds from health agencies at this moment. Please check back shortly.
              </p>
              <button
                onClick={fetchNews}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer border border-cyan-500/40"
              >
                Try Reconnecting
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="space-y-4">
              <div className="h-64 rounded-3xl bg-slate-800/40 animate-pulse border border-[var(--border)] p-6 space-y-4 flex flex-col justify-end">
                <div className="w-24 h-4 bg-slate-700/60 rounded" />
                <div className="w-3/4 h-7 bg-slate-700/80 rounded" />
                <div className="w-1/2 h-4 bg-slate-700/50 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-48 rounded-2xl bg-slate-800/30 animate-pulse border border-[var(--border)] p-5 space-y-3">
                    <div className="w-20 h-3 bg-slate-700/50 rounded" />
                    <div className="w-full h-5 bg-slate-700/70 rounded" />
                    <div className="w-5/6 h-3 bg-slate-700/40 rounded" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty Search Results */}
          {!isLoading && !isError && articles.length === 0 && (
            <div className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-3">
              <Search className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No articles matched your criteria.</h3>
              <p className="text-xs text-slate-400">
                Try searching with broader medical terms like "vaccine", "heart", or "nutrition".
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="text-xs text-cyan-400 hover:underline font-semibold"
              >
                Reset filters
              </button>
            </div>
          )}

          {/* Top Story Feature Card */}
          {!isLoading && !isError && topStory && (
            <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-[#070b18] border border-cyan-500/30 overflow-hidden shadow-2xl group transition-all">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                {/* Article Image / Header visual */}
                <div className="md:col-span-5 relative h-52 md:h-auto min-h-[220px] overflow-hidden bg-slate-950">
                  <img
                    src={topStory.image_url}
                    alt={topStory.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#070b18]" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 backdrop-blur-md">
                      Featured • {topStory.category}
                    </span>
                  </div>
                </div>

                {/* Article Content */}
                <div className="md:col-span-7 p-6 sm:p-7 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    {/* Source & Date Badge */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-cyan-400">{topStory.source_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3" />
                        {topStory.time_ago}
                      </span>
                      {language !== 'en' && (
                        <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {language === 'ta' ? '🇮🇳 தமிழ் சுருக்கம்' : '🇮🇳 हिन्दी अनुवाद'}
                        </span>
                      )}
                    </div>

                    {/* Headline */}
                    <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                      {getArticleTitle(topStory)}
                    </h2>

                    {/* Summary */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                      {getArticleSummary(topStory)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAISummary(topStory)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{t('ai_summary')}</span>
                      </button>

                      <button
                        onClick={() => handleAskAI(topStory)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Bot className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{t('ask_healthease')}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleBookmark(topStory.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          bookmarkedIds[topStory.id]
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                        title={bookmarkedIds[topStory.id] ? "Saved in Bookmarks" : "Bookmark this article"}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${bookmarkedIds[topStory.id] ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>

                      <a
                        href={topStory.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <span>{t('read_article')}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* Latest News Cards Grid */}
          {!isLoading && !isError && regularStories.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
                Latest Reports ({regularStories.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {regularStories.map((article) => {
                  const isBookmarked = bookmarkedIds[article.id];
                  const title = getArticleTitle(article);
                  const summary = getArticleSummary(article);

                  return (
                    <article
                      key={article.id}
                      className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-cyan-500/40 hover:bg-slate-900/30 transition-all flex flex-col justify-between space-y-4 shadow-sm group"
                    >
                      <div className="space-y-3">
                        {/* Header: Category & Source */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/20">
                            {article.category}
                          </span>
                          <span className="text-slate-400 text-[11px] font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.time_ago}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                          {title}
                        </h4>

                        {/* Summary */}
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {summary}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-300 text-[11px] truncate max-w-[120px]">
                            {article.source_name}
                          </span>
                          {language !== 'en' && (
                            <span className="text-[9px] text-cyan-400 font-mono" title="Translated from English">
                              🌐 Translated
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleOpenAISummary(article)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                            title="AI Structured Summary"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Summary</span>
                          </button>

                          <button
                            onClick={() => handleAskAI(article)}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 cursor-pointer"
                            title="Ask AI about this article"
                          >
                            <Bot className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleBookmark(article.id)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isBookmarked
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                            title="Save bookmark"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>

                          <a
                            href={article.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                            title="Read original source"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                    </article>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar: Trending Topics, Trusted Sources & Safety */}
        <aside className="space-y-5">
          
          {/* Trending Health Topics */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('trending_topics')}</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {trendingTopics.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedCategory(topic.category);
                    setSearchQuery('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    selectedCategory === topic.category
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5 hover:border-white/10'
                  }`}
                >
                  • {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trusted Sources */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('trusted_sources_label')}</span>
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Health news is aggregated directly from validated public health organizations and peer-reviewed feeds.
            </p>
            <div className="space-y-2 pt-1">
              {trustedSources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 hover:bg-slate-800/60 border border-[var(--border)] text-xs text-slate-300 hover:text-cyan-400 transition-colors group"
                >
                  <span className="font-semibold">{src.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400">
                    {src.abbr} ↗
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* News Safety Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 text-amber-200/90 text-[11px] leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Medical News Safety Notice</span>
            </div>
            <p>
              Research reported in medical news articles may still be under investigation or preliminary clinical trials. HealthEase AI does not present news reports as medical diagnoses or treatment prescriptions. Consult qualified healthcare professionals for personal clinical decisions.
            </p>
          </div>

        </aside>

      </div>

      {/* AI Summary Modal */}
      {summaryModalArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#090F20] border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            
            {/* Modal Header */}
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
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {isSummaryLoading && (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
                <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-xs font-semibold text-slate-300">
                  Synthesizing key takeaways from verified health report...
                </p>
              </div>
            )}

            {!isSummaryLoading && summaryData && (
              <div className="space-y-4">
                <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200">
                  <MarkdownRenderer content={summaryData.formatted_summary} />
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => {
                  const art = summaryModalArticle;
                  setSummaryModalArticle(null);
                  handleAskAI(art);
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
                <span>Read Full Article on {summaryModalArticle.source_name}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
