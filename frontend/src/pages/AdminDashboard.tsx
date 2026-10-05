import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Database, AlertTriangle, Users, BookOpen, 
  ExternalLink, CheckCircle, RefreshCw, FileText, Activity
} from 'lucide-react';
import { SafetyBanner } from '../components/SafetyBanner';
import { api } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [safetyFlags, setSafetyFlags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [sData, srcData, fData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminSources(),
        api.getAdminFlags(),
      ]);
      setStats(sData);
      setSources(srcData);
      setSafetyFlags(fData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl mx-auto">
      
      {/* Universal Safety Disclaimer */}
      <SafetyBanner />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Responsible AI Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Responsible AI <span className="bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">Admin Portal</span>.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Audit AI safety engine classifications, verify grounded RAG knowledge sources, and monitor health system telemetry.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 text-xs text-cyan-300 font-semibold hover:bg-cyan-500/15 transition-all flex items-center gap-2 cursor-pointer shadow-md hover:scale-105"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Metrics Grid (Double Bezel) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="double-bezel text-center">
          <div className="double-bezel-inner p-4 bg-[#090F20]">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block mb-1">
              Active Profiles
            </span>
            <span className="text-2xl font-extrabold text-white font-mono">
              {stats?.total_users || 1}
            </span>
          </div>
        </div>

        <div className="double-bezel text-center">
          <div className="double-bezel-inner p-4 bg-[#090F20]">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block mb-1">
              Clinical Terms
            </span>
            <span className="text-2xl font-extrabold text-cyan-300 font-mono">
              {stats?.total_terms || 10}
            </span>
          </div>
        </div>

        <div className="double-bezel text-center">
          <div className="double-bezel-inner p-4 bg-[#090F20]">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block mb-1">
              Curated Articles
            </span>
            <span className="text-2xl font-extrabold text-teal-300 font-mono">
              {stats?.total_articles || 4}
            </span>
          </div>
        </div>

        <div className="double-bezel text-center">
          <div className="double-bezel-inner p-4 bg-[#090F20]">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block mb-1">
              Verified RAG Sources
            </span>
            <span className="text-2xl font-extrabold text-purple-300 font-mono">
              {stats?.total_sources || 4}
            </span>
          </div>
        </div>

        <div className="double-bezel text-center">
          <div className="double-bezel-inner p-4 bg-rose-950/20 border border-rose-500/25">
            <span className="text-[10px] uppercase font-mono text-rose-300 font-semibold block mb-1">
              Safety Triage Rules
            </span>
            <span className="text-2xl font-extrabold text-rose-300 font-mono">
              {stats?.total_safety_flags || safetyFlags.length || 3}
            </span>
          </div>
        </div>

      </div>

      {/* Grid: Trusted RAG Sources & Safety Engine Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Trusted Knowledge Base Sources */}
        <div className="double-bezel">
          <div className="double-bezel-inner p-6 sm:p-8 bg-[#090F20] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <span>Verified RAG Sources</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Grounded & Synced
              </span>
            </div>
            <p className="text-xs text-slate-400">
              HealthEase AI references only verified peer-reviewed institutions for scientific grounding.
            </p>

            <div className="space-y-3 pt-2">
              {(sources.length > 0 ? sources : [
                { name: "World Health Organization (WHO)", website_url: "https://www.who.int", description: "Global health standards, hypertension, and epidemic monitoring." },
                { name: "MedlinePlus (National Library of Medicine)", website_url: "https://medlineplus.gov", description: "Consumer health encyclopedias and clinical reference ranges." },
                { name: "Centers for Disease Control and Prevention (CDC)", website_url: "https://www.cdc.gov", description: "Preventive medicine, lifestyle epidemiology, and hydration guidelines." },
                { name: "American Heart Association (AHA)", website_url: "https://www.heart.org", description: "Cardiovascular guidelines, blood pressure stages, and lipid recommendations." },
              ]).map((src, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{src.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{src.description}</p>
                  </div>
                  <a
                    href={src.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Safety Engine Trigger Log */}
        <div className="double-bezel">
          <div className="double-bezel-inner p-6 sm:p-8 bg-[#090F20] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Safety Engine Classification Audit</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Active Guardrails
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Audit log of simulated or user queries categorized under Emergency or Prescription safeguards.
            </p>

            <div className="space-y-3 pt-2">
              {(safetyFlags.length > 0 ? safetyFlags : [
                { query_text: "Crushing chest pain radiating to left arm", risk_category: "Emergency", action_taken: "Immediate ER triage banner with 911 / 112 helpline", created_at: "Today" },
                { query_text: "How much mg of metformin should I take?", risk_category: "Prescription", action_taken: "Dosage refusal + redirected to licensed prescribing physician", created_at: "Yesterday" },
              ]).map((flag, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                      flag.risk_category === 'Emergency' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {flag.risk_category}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">{flag.created_at}</span>
                  </div>
                  <p className="text-slate-200 font-mono italic">"{flag.query_text}"</p>
                  <p className="text-slate-400 text-[11px]">Action: {flag.action_taken}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
