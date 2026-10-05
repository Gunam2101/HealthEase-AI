import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, ExternalLink, Search, CheckCircle2, 
  Building2, Globe, FileCheck, Info, RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { TrustedResource } from '../types';

export const TrustedResourcesPage: React.FC = () => {
  const [sources, setSources] = useState<TrustedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTrustedSources();
      setSources(data.sources || []);
    } catch (err: any) {
      console.error('Failed to load sources:', err);
      setError('Unable to load trusted sources.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSources = sources.filter(src => {
    const q = searchFilter.toLowerCase();
    return (
      src.name.toLowerCase().includes(q) ||
      src.description.toLowerCase().includes(q) ||
      src.category.toLowerCase().includes(q) ||
      src.topics.some(t => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>VERIFIED INSTITUTIONAL REPOSITORIES</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Trusted Resources & References
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          HealthEase AI strictly grounds its educational models in verified global public health organizations. We do not invent links or hallucinate medical references.
        </p>
      </div>

      {/* Grounding Principles Banner */}
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[var(--text-primary)] block">Zero URL Hallucination</span>
            <span className="text-slate-400">All external citations are authenticated against verified registry domains.</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Building2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[var(--text-primary)] block">Peer-Reviewed & Public</span>
            <span className="text-slate-400">Content derived from WHO, NIH MedlinePlus, CDC, and NHS guidelines.</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <FileCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[var(--text-primary)] block">Educational Transparency</span>
            <span className="text-slate-400">AI explanations are clearly distinguished from primary authoritative source texts.</span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-2 shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filter repositories by topic (e.g. WHO, Diabetes, Heart, Pharmacology)..."
          className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder-slate-500 focus:outline-none py-1"
        />
        {searchFilter && (
          <button
            onClick={() => setSearchFilter('')}
            className="text-slate-400 hover:text-slate-200 text-xs px-2"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span>Loading verified repositories...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSources.map((src) => (
            <div
              key={src.id}
              className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-cyan-500/40 transition-all shadow-sm flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-cyan-400 transition-colors">
                        {src.name}
                      </h3>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {src.category}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                    {src.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {src.description}
                </p>

                {/* Topic tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {src.topics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/60"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Link button */}
              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">
                  {src.url.replace(/^https?:\/\//, '')}
                </span>

                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors"
                >
                  <span>Visit Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
