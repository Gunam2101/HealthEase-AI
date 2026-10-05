import React, { useState } from 'react';
import { 
  Stethoscope, Send, AlertTriangle, ShieldAlert, Sparkles, 
  HelpCircle, RefreshCw, CheckCircle2, ChevronRight, Info, HeartPulse 
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { SymptomCheckResponse } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { VoiceInput } from '../components/VoiceInput';

export const SymptomChecker: React.FC = () => {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SymptomCheckResponse | null>(null);

  const sampleSymptoms = [
    "Headache, tiredness and mild fever",
    "Persistent dry cough and throat irritation",
    "Fatigue, joint stiffness and morning aches",
    "Mild indigestion and bloating after meals"
  ];

  const handleCheck = async (symptomText?: string) => {
    const textToSearch = (symptomText || query).trim();
    if (!textToSearch) return;

    if (symptomText) {
      setQuery(symptomText);
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.checkSymptoms({
        query: textToSearch,
        language
      });
      setResult(data);
    } catch (err: any) {
      console.error('Symptom check error:', err);
      setError(err.message || 'Unable to check symptoms right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setQuery(prev => prev ? `${prev} ${text}` : text);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>NON-DIAGNOSTIC HEALTH INTELLIGENCE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Symptom Checker
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Describe what you are experiencing in natural everyday words. HealthEase AI organizes your symptoms into structured educational insights and flags warning signs to discuss with a doctor.
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-300 text-xs">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <div className="space-y-1">
          <span className="font-semibold block text-amber-200">Strict Non-Diagnostic Educational Notice</span>
          <p className="text-amber-300/90 leading-relaxed">
            This tool does NOT provide medical diagnoses or treatment prescriptions. It offers general health context. If you experience chest pain, sudden numbness, severe shortness of breath, or uncontrolled bleeding, seek emergency medical care immediately.
          </p>
        </div>
      </div>

      {/* Input Box with Voice */}
      <div className="relative rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 shadow-lg focus-within:border-cyan-500/50 transition-all">
        <label htmlFor="symptom-input" className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Describe Your Symptoms
        </label>
        
        <textarea
          id="symptom-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleCheck();
            }
          }}
          rows={3}
          placeholder="e.g., I have had a dull headache, tiredness, and a mild fever for the past 2 days..."
          className="w-full bg-transparent resize-none text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none leading-relaxed"
        />

        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] mt-2">
          <div className="flex items-center gap-2">
            <VoiceInput 
              onTranscript={handleVoiceTranscript} 
              size="md"
            />
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Click mic to speak in English, Tamil, or Hindi
            </span>
          </div>

          <button
            onClick={() => handleCheck()}
            disabled={loading || !query.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Symptoms...</span>
              </>
            ) : (
              <>
                <span>Analyze Symptoms</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Suggested Symptom Chips */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-400 font-mono text-[11px]">Quick Examples:</span>
        {sampleSymptoms.map((sample, idx) => (
          <button
            key={idx}
            onClick={() => handleCheck(sample)}
            className="px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-cyan-500/10 border border-[var(--border)] hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 text-xs transition-colors cursor-pointer"
          >
            {sample}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Emergency Alert (if flagged) */}
          {result.is_emergency && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 shadow-xl flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-rose-300 flex items-center gap-2">
                  🚨 Seek Immediate Medical Help
                </h3>
                <p className="text-xs text-rose-200 leading-relaxed">
                  {result.emergency_guidance || "Some described symptoms indicate a potentially critical health emergency. Do not wait. Please contact local emergency services immediately."}
                </p>
              </div>
            </div>
          )}

          {/* Structured Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Symptoms Mentioned */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <Stethoscope className="w-4 h-4" />
                <span>Symptoms Mentioned</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {result.symptoms_mentioned.length > 0 ? (
                  result.symptoms_mentioned.map((sym, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <span>{sym}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400 italic">No specific symptoms identified.</li>
                )}
              </ul>
            </div>

            {/* Possible Causes */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Possible General Causes</span>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                These symptoms can occur with several conditions, including:
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {result.possible_causes.map((cause, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* General Self-Care */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>General Self-Care Support</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {result.self_care_measures.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Warning Signs */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Warning Signs (Seek Urgent Help)</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {result.warning_signs.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* When to Seek Care */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm">
              <HeartPulse className="w-4 h-4" />
              <span>When to Seek Professional Consultation</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {result.when_to_seek_care}
            </p>
          </div>

          {/* Full Structured Markdown Report */}
          {result.formatted_response && (
            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Full Educational Briefing
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  Language: {result.language.toUpperCase()}
                </span>
              </div>
              <div className="prose prose-invert max-w-none text-xs leading-relaxed">
                <MarkdownRenderer content={result.formatted_response} />
              </div>
            </div>
          )}

          {/* Trusted Sources */}
          {result.sources && result.sources.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-[var(--border)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Verified Reference Framework</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {result.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface)] hover:bg-cyan-500/10 border border-[var(--border)] hover:border-cyan-500/30 text-xs text-cyan-400 transition-colors"
                  >
                    <span>{src.title} ({src.organization})</span>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
