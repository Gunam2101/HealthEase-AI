import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Clock, BookOpen, Sparkles, ArrowRight, 
  X, CheckCircle, Tag, ExternalLink, Volume2, ShieldCheck, HeartPulse
} from 'lucide-react';
import { SafetyBanner } from '../components/SafetyBanner';
import { AudioPlayer } from '../components/AudioPlayer';
import { api } from '../services/api';
import { EducationArticle } from '../types';

export const HealthEducation: React.FC = () => {
  const [articles, setArticles] = useState<EducationArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<EducationArticle | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    'All', 'General Health', 'Nutrition', 'Sleep', 'Exercise', 
    'Preventive Care', 'Medical Terms', 'Mental Well-being', 'Healthy Habits'
  ];

  useEffect(() => {
    loadArticles();
  }, [activeCategory]);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEducationArticles(activeCategory);
      setArticles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenArticle = async (slug: string) => {
    try {
      const full = await api.getArticleBySlug(slug);
      setSelectedArticle(full);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl mx-auto">
      
      {/* Universal Safety Disclaimer */}
      <SafetyBanner />

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
          <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Evidence-Based Health Literacy</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Editorial <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">Health Education Center</span>.
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Curated, peer-reviewed educational guides created to build your health literacy and empower preventive wellness decisions.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/30 font-bold'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-cyan-400 animate-pulse">
          Loading health education library...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <div
              key={art.id}
              className="double-bezel cursor-pointer group"
              onClick={() => handleOpenArticle(art.slug)}
            >
              <div className="double-bezel-inner p-6 sm:p-7 flex flex-col justify-between h-full bg-[#090F20] relative overflow-hidden">
                
                {/* Visual Accent Ambient glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/15 transition-all" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {art.category}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{art.reading_time_minutes} min read</span>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-lg text-white group-hover:text-cyan-300 transition-colors leading-snug mb-2">
                    {art.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">
                    {art.short_description}
                  </p>

                  {/* Key Takeaways preview pills */}
                  {art.key_takeaways && art.key_takeaways.length > 0 && (
                    <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1 mb-4">
                      <span className="text-[10px] font-mono uppercase text-teal-400 font-bold block">
                        Core Takeaway:
                      </span>
                      <p className="text-xs text-slate-300 truncate">
                        • {art.key_takeaways[0]}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                  <span>Explore Guide</span>
                  <div className="w-7 h-7 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Article Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl double-bezel overflow-hidden shadow-2xl">
            <div className="double-bezel-inner p-6 sm:p-10 bg-[#090F20] overflow-y-auto max-h-[88vh]">
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Category & Reading Time */}
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {selectedArticle.category}
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{selectedArticle.reading_time_minutes} min read</span>
                </span>
              </div>

              {/* Article Title */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
                {selectedArticle.title}
              </h2>

              {/* Audio Listen Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>Audio Narration</span>
                </div>
                <AudioPlayer text={`${selectedArticle.title}. ${selectedArticle.full_content || selectedArticle.short_description}`} />
              </div>

              {/* Key Takeaways Box */}
              {selectedArticle.key_takeaways && selectedArticle.key_takeaways.length > 0 && (
                <div className="p-5 rounded-2xl bg-teal-950/30 border border-teal-500/30 mb-6">
                  <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>Key Educational Takeaways</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200">
                    {selectedArticle.key_takeaways.map((takeaway, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Article Content */}
              <div className="text-slate-200 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-wrap">
                {selectedArticle.full_content || selectedArticle.short_description}
              </div>

              {/* Medical Notice */}
              <div className="mt-8 pt-4 border-t border-white/10 text-xs text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Peer-reviewed for educational health literacy. Does not replace individual medical guidance.</span>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
