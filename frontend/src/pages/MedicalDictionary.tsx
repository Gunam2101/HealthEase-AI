import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Volume2, Bookmark, Sparkles, 
  ArrowRight, Globe, Check, Tag, Activity, ExternalLink
} from 'lucide-react';
import { SafetyBanner } from '../components/SafetyBanner';
import { api } from '../services/api';
import { MedicalTermItem } from '../types';

interface MedicalDictionaryProps {
  initialTerm?: string;
}

export const MedicalDictionary: React.FC<MedicalDictionaryProps> = ({ initialTerm }) => {
  const [terms, setTerms] = useState<MedicalTermItem[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<MedicalTermItem | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialTerm || '');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<'en' | 'ta' | 'hi' | 'te' | 'ml'>('en');

  const categories = [
    'All', 'Cardiology', 'Endocrinology', 'Hematology', 
    'Nephrology', 'Pulmonology', 'General'
  ];

  const quickTerms = [
    "Hypertension", "HbA1c", "Anemia", "Tachycardia", "Cholesterol", "Inflammation"
  ];

  useEffect(() => {
    loadTerms();
  }, [activeCategory]);

  const loadTerms = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMedicalTerms(activeCategory, searchQuery);
      setTerms(data);
      if (data.length > 0 && !selectedTerm) {
        setSelectedTerm(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await api.getMedicalTerms(activeCategory, searchQuery);
      setTerms(data);
      if (data.length > 0) {
        setSelectedTerm(data[0]);
      } else if (searchQuery.trim()) {
        const dynamic = await api.getTermByName(searchQuery.trim());
        setSelectedTerm(dynamic);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuickTerm = (term: string) => {
    setSearchQuery(term);
    const found = terms.find(t => t.term.toLowerCase() === term.toLowerCase());
    if (found) {
      setSelectedTerm(found);
    } else {
      api.getTermByName(term).then(setSelectedTerm).catch(console.error);
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSaveTerm = () => {
    if (!selectedTerm) return;
    navigator.clipboard.writeText(`${selectedTerm.term}: ${selectedTerm.simple_meaning}`);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl mx-auto">
      
      {/* Universal Safety Disclaimer */}
      <SafetyBanner />

      {/* Hero Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-3">
          <BookOpen className="w-3.5 h-3.5 text-teal-400" />
          <span>Interactive Clinical Lexicon</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Medical terms, <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">explained simply</span>.
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Demystify complicated hospital terminology, diagnostic tests, and pharmacological concepts with audio pronunciation and multi-language translations.
        </p>
      </div>

      {/* Search Bar & Quick Term Chips */}
      <div className="double-bezel">
        <div className="double-bezel-inner p-6 sm:p-8 bg-slate-900/80">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center rounded-2xl bg-slate-950/80 border border-teal-500/30 shadow-xl p-2 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/20 transition-all">
              <Search className="w-5 h-5 text-teal-400 ml-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search a medical term (e.g. Hypertension, HbA1c, Tachycardia)..."
                className="w-full pl-3 pr-24 py-3 bg-transparent text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-400 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-teal-500/30 cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Term Shortcuts */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Quick lookup:</span>
            {quickTerms.map((term, i) => (
              <button
                key={i}
                onClick={() => handleSelectQuickTerm(term)}
                className="px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-teal-500/20 border border-teal-500/20 text-xs text-slate-300 hover:text-teal-200 transition-all cursor-pointer shadow-sm hover:scale-105"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/30'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Term Presentation: Left Term List & Right Detailed Spec Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Term Index Cards */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            <span>Glossary Directory</span>
            <span className="font-mono text-cyan-400">{terms.length} Terms</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-teal-400 animate-pulse">
                Loading medical terms...
              </div>
            ) : terms.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedTerm(item)}
                className={`p-4 rounded-2xl cursor-pointer transition-all ${
                  selectedTerm?.id === item.id
                    ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/10 border border-teal-400/40 text-teal-200 shadow-lg'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-white">
                    {item.term}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.simple_meaning}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Term Detailed Spec Sheet */}
        <div className="lg:col-span-2">
          {selectedTerm ? (
            <div className="double-bezel">
              <div className="double-bezel-inner p-6 sm:p-8 bg-[#090F20]">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/10">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {selectedTerm.category}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 flex items-center gap-3">
                      <span>{selectedTerm.term}</span>
                      <button
                        onClick={() => handleSpeak(selectedTerm.term)}
                        className="p-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 transition-colors"
                        title="Pronounce Term"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </h2>
                    {selectedTerm.phonetic && (
                      <span className="text-xs text-slate-400 font-mono italic">
                        Pronunciation: /{selectedTerm.phonetic}/
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleSaveTerm}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${savedSuccess ? 'fill-teal-300' : ''}`} />
                    <span>{savedSuccess ? 'Saved in Library' : 'Save Term'}</span>
                  </button>
                </div>

                {/* Simple Meaning Card */}
                <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/25 mb-6">
                  <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>Simple Meaning (Layperson)</span>
                  </h3>
                  <p className="text-sm text-slate-100 leading-relaxed font-medium">
                    {selectedTerm.simple_meaning}
                  </p>
                </div>

                {/* Detailed Clinical Explanation */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Detailed Clinical Explanation</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {selectedTerm.detailed_explanation}
                  </p>
                </div>

                {/* Real-World Context Example */}
                {selectedTerm.example_usage && (
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 mb-6 text-xs">
                    <strong className="text-cyan-300 block mb-1">Example in Clinical Context:</strong>
                    <p className="italic text-slate-300">"{selectedTerm.example_usage}"</p>
                  </div>
                )}

                {/* Key Concepts Tags */}
                {selectedTerm.common_concepts && selectedTerm.common_concepts.length > 0 && (
                  <div className="mb-6">
                    <span className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">
                      Related Physiological Concepts:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedTerm.common_concepts.map((concept, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-200"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Multi-language Translations Tabs */}
                {selectedTerm.translations && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Multilingual Explanations
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(['en', 'ta', 'hi', 'te', 'ml'] as const).map((langKey) => (
                        <button
                          key={langKey}
                          onClick={() => setActiveLangTab(langKey)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold font-mono uppercase transition-all ${
                            activeLangTab === langKey
                              ? 'bg-cyan-500 text-slate-950 shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {langKey}
                        </button>
                      ))}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-white/5 text-xs text-slate-200 leading-relaxed">
                      {selectedTerm.translations[activeLangTab] || selectedTerm.simple_meaning}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select any medical term from the glossary to view details.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
