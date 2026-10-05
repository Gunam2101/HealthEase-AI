import React, { useState } from 'react';
import { 
  Pill, Search, AlertCircle, ShieldAlert, CheckCircle2, 
  AlertTriangle, FileText, ChevronRight, Info, RefreshCw, Stethoscope 
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { MedicineResponse } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { VoiceInput } from '../components/VoiceInput';

export const MedicineInfo: React.FC = () => {
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicine, setMedicine] = useState<MedicineResponse | null>(null);

  const popularMedicines = [
    "Paracetamol",
    "Metformin",
    "Amoxicillin",
    "Ibuprofen",
    "Cetirizine",
    "Omeprazole",
    "Atorvastatin"
  ];

  const handleSearch = async (medName?: string) => {
    const targetName = (medName || query).trim();
    if (!targetName) return;

    if (medName) {
      setQuery(medName);
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.getMedicineInfo({
        query: targetName,
        language
      });
      setMedicine(data);
    } catch (err: any) {
      console.error('Medicine info error:', err);
      setError(err.message || 'Unable to retrieve medicine information.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setQuery(text);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium">
          <Pill className="w-3.5 h-3.5" />
          <span>PHARMACOLOGICAL LITERACY & SAFETY</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Medicine Information
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Search any medicine to understand its general purpose, common forms, precautions, and side effects. Learn how medicines work without personalized dosage or prescription claims.
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-300 text-xs">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <div className="space-y-1">
          <span className="font-semibold block text-amber-200">Non-Prescription Safety Notice</span>
          <p className="text-amber-300/90 leading-relaxed">
            HealthEase AI does NOT provide prescriptions, personalized dosage amounts, or recommendations to start or stop medications. All information is for general educational understanding. Always consult a licensed pharmacist or physician for personal medical instructions.
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-2 shadow-lg focus-within:border-cyan-500/50 transition-all flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Search medicine by name (e.g. Paracetamol, Metformin, Amoxicillin)..."
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none py-1.5"
        />

        <VoiceInput 
          onTranscript={handleVoiceTranscript} 
          size="md"
        />

        <button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer transition-all shrink-0"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <span>Lookup</span>
          )}
        </button>
      </div>

      {/* Popular Medicine Chips */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-400 font-mono text-[11px]">Common Inquiries:</span>
        {popularMedicines.map((med, idx) => (
          <button
            key={idx}
            onClick={() => handleSearch(med)}
            className="px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-cyan-500/10 border border-[var(--border)] hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 text-xs transition-colors cursor-pointer"
          >
            {med}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Medicine Details View */}
      {medicine && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Main Card Header */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    {medicine.name}
                  </h2>
                  <span className="text-xs font-mono text-cyan-400">
                    Category: {medicine.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 self-start sm:self-center">
              ⚠️ General information only
            </div>
          </div>

          {/* Structured Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* What is it */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <Info className="w-4 h-4" />
                <span>What is it?</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {medicine.what_is_it}
              </p>
            </div>

            {/* Common Uses */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Common Uses</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {medicine.common_uses.map((use, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{use}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Common Forms */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <FileText className="w-4 h-4" />
                <span>Available Common Forms</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {medicine.common_forms.map((form, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span>{form}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Side Effects */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Common Side Effects</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {medicine.common_side_effects.map((side, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>{side}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Important Precautions */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>Important Precautions</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {medicine.precautions.map((prec, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    <span>{prec}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Professional Guidance */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm">
              <Stethoscope className="w-4 h-4" />
              <span>Professional Guidance</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {medicine.professional_guidance}
            </p>
          </div>

          {/* Full Structured Markdown Presentation */}
          {medicine.formatted_response && (
            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block border-b border-[var(--border)] pb-2.5">
                Pharmacological Dossier
              </span>
              <div className="prose prose-invert max-w-none text-xs leading-relaxed">
                <MarkdownRenderer content={medicine.formatted_response} />
              </div>
            </div>
          )}

          {/* Trusted Sources */}
          {medicine.sources && medicine.sources.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-[var(--border)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Trusted Reference Framework</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {medicine.sources.map((src, i) => (
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
