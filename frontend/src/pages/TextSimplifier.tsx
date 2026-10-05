import React, { useState } from 'react';
import { 
  Wand2, Copy, Bookmark, Download, Volume2, Sparkles, 
  ArrowRight, Check, HelpCircle, FileText, Globe, RefreshCw
} from 'lucide-react';
import { SafetyBanner } from '../components/SafetyBanner';
import { AudioPlayer } from '../components/AudioPlayer';
import { api } from '../services/api';
import { SupportedLanguage } from '../types';

export const TextSimplifier: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('Simple');
  const [targetLang, setTargetLang] = useState<SupportedLanguage>('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const sampleClinicalNotes = [
    {
      title: "Essential Hypertension & Dyslipidemia Note",
      text: "Patient presents with stage 1 essential hypertension, dyslipidemia with elevated LDL (142 mg/dL), and fasting hyperglycemia (104 mg/dL). No signs of dyspnea or peripheral edema. Advised sodium moderation, continuation of lifestyle modifications, and follow-up lipid panel in 90 days."
    },
    {
      title: "Microcytic Hypochromic Anemia Smear",
      text: "CBC smear indicates microcytic hypochromic erythrocytes with hemoglobin 11.2 g/dL. Platelets 230 x10^3/uL, WBC within physiological reference. Etiology suspected to be mild nutritional iron depletion."
    }
  ];

  const modes = [
    'Very Simple', 'Simple', 'College Level', 'Detailed', 
    'Bullet Points', 'Short Summary'
  ];

  const languages: Array<{ code: SupportedLanguage; label: string }> = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
  ];

  const handleProcess = async (selectedMode?: string) => {
    if (!inputText.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      const resp = await api.simplifyMedicalText({
        text: inputText,
        mode: selectedMode || mode,
        language: targetLang,
      });
      setResult(resp);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.simplified_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.simplified_text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const content = `HEALTHEASE AI - SIMPLIFIED MEDICAL TEXT\nMode: ${mode} | Language: ${targetLang.toUpperCase()}\n--------------------------------------------------\n\nORIGINAL TEXT:\n${inputText}\n\nAI SIMPLIFIED EXPLANATION:\n${result.simplified_text}\n\nQUESTIONS FOR DOCTOR:\n${result.questions_for_doctor?.join('\n') || ''}\n\nDISCLAIMER:\n${result.disclaimer}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HealthEase_Simplified_${mode}.txt`;
    a.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl mx-auto">
      
      {/* Universal Safety Disclaimer */}
      <SafetyBanner />

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
          <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Clinical Note Demystifier</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Simplify complex <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">medical notes & prescriptions</span>.
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Paste confusing clinical discharge summaries, doctor recommendations, or pathology impressions to convert them into easy-to-digest language.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="double-bezel">
        <div className="double-bezel-inner p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 bg-slate-900/80">
          
          {/* Mode Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              Mode:
            </span>
            {modes.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  if (inputText.trim()) handleProcess(m);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mode === m
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/30'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-white/5'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as SupportedLanguage)}
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-cyan-500/20 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Two-Panel AI Workspace: Left Original vs Right AI Simplified */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Panel: Original Text */}
        <div className="double-bezel">
          <div className="double-bezel-inner p-6 sm:p-8 flex flex-col justify-between h-full bg-[#080D1A]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Original Medical Text</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {inputText.length} characters
                </span>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste complex doctor note, hospital discharge summary, pathology snippet, or prescription text here..."
                rows={10}
                className="w-full p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 text-sm leading-relaxed focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all resize-none shadow-inner"
              />

              {/* Sample Notes Shortcuts */}
              <div className="mt-3">
                <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                  Or load a sample clinical note:
                </span>
                <div className="space-y-1.5">
                  {sampleClinicalNotes.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputText(sample.text)}
                      className="w-full text-left p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-xs text-slate-300 hover:text-cyan-300 border border-white/5 transition-colors truncate"
                    >
                      • {sample.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setInputText('')}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>

              <button
                onClick={() => handleProcess()}
                disabled={!inputText.trim() || isProcessing}
                className="btn-nested-island bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{isProcessing ? 'Demystifying...' : 'Simplify Text'}</span>
                <div className="btn-nested-icon bg-white/20 text-white">
                  <Wand2 className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Simple Explanation */}
        <div className="double-bezel">
          <div className="double-bezel-inner p-6 sm:p-8 flex flex-col justify-between h-full bg-[#090F20]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>AI Simplified Explanation</span>
                </span>
                {result && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {mode}
                  </span>
                )}
              </div>

              {result ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/20 text-slate-100 text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
                    {result.simplified_text}
                  </div>

                  {result.questions_for_doctor && result.questions_for_doctor.length > 0 && (
                    <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs">
                      <strong className="text-indigo-300 block mb-2">Recommended questions to discuss with your doctor:</strong>
                      <ul className="space-y-1 list-disc list-inside text-slate-300">
                        {result.questions_for_doctor.map((q: string, i: number) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-64">
                  <Wand2 className="w-8 h-8 text-slate-600 mb-2" />
                  <span>Paste clinical text on the left and click "Simplify Text" to generate plain language.</span>
                </div>
              )}
            </div>

            {result && (
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${saved ? 'text-teal-400 fill-teal-400' : ''}`} />
                    <span>{saved ? 'Saved!' : 'Save'}</span>
                  </button>

                  <AudioPlayer text={result.simplified_text} />
                </div>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition-colors cursor-pointer font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
