import React, { useState } from 'react';
import { 
  UploadCloud, FileText, CheckCircle, AlertCircle, HelpCircle, 
  Download, Bookmark, Trash2, MessageSquare, Sparkles, Send,
  ArrowRight, ShieldCheck, FileCheck, ExternalLink, Bot, Activity
} from 'lucide-react';
import { SafetyBanner } from '../components/SafetyBanner';
import { AudioPlayer } from '../components/AudioPlayer';
import { api } from '../services/api';
import { DocumentAnalysis, ChatMessage, TestResultItem } from '../types';

export const ReportAnalyzer: React.FC = () => {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Document chat state
  const [docMessages, setDocMessages] = useState<ChatMessage[]>([]);
  const [docInput, setDocInput] = useState('');
  const [isDocChatLoading, setIsDocChatLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const sampleReports = [
    { id: 'sample_cbc', title: 'Complete Blood Count (CBC)', desc: 'Hemoglobin, RBC, WBC, Platelets' },
    { id: 'sample_lipid', title: 'Lipid & Metabolic Panel', desc: 'Cholesterol, Triglycerides, HbA1c' },
  ];

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const data = await api.uploadDocument(file);
      setAnalysis(data);
      initializeDocChat(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong while analyzing your document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSample = async (sampleId: string) => {
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const data = await api.getSampleReport(sampleId);
      setAnalysis(data);
      initializeDocChat(data);
    } catch (err: any) {
      setErrorMsg('Failed to load sample report.');
    } finally {
      setIsUploading(false);
    }
  };

  const initializeDocChat = (data: DocumentAnalysis) => {
    const welcome: ChatMessage = {
      id: `doc_init_${Date.now()}`,
      role: 'assistant',
      content: `I have analyzed **${data.filename}** (${data.document_type}). You can ask me any question about the tests, values, reference ranges, or terminology in this document.`,
      follow_ups: [
        "What does HbA1c mean in this report?",
        "Explain the cholesterol reference ranges",
        "What questions should I ask my doctor about these results?"
      ]
    };
    setDocMessages([welcome]);
  };

  const handleDocChatSend = async (queryText?: string) => {
    const query = queryText || docInput;
    if (!query.trim() || !analysis || isDocChatLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
    };
    setDocMessages(prev => [...prev, userMsg]);
    setDocInput('');
    setIsDocChatLoading(true);

    try {
      const resp = await api.chatAboutDocument({
        message: query,
        document_id: analysis.document_id,
      });

      const asstMsg: ChatMessage = {
        id: resp.message_id || `asst_${Date.now()}`,
        role: 'assistant',
        content: resp.content,
        follow_ups: resp.follow_ups,
        sources: resp.sources
      };
      setDocMessages(prev => [...prev, asstMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDocChatLoading(false);
    }
  };

  const handleSaveSummary = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis.summary);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!analysis) return;
    let content = `HEALTHEASE AI - HEALTH REPORT SUMMARY\n`;
    content += `Document: ${analysis.filename} (${analysis.document_type})\n`;
    content += `Date: ${analysis.report_date || 'N/A'}\n`;
    content += `--------------------------------------------------\n\n`;
    content += `EDUCATIONAL SUMMARY:\n${analysis.summary}\n\n`;
    content += `EXTRACTED BIOMARKERS:\n`;
    analysis.tests.forEach(t => {
      content += `• ${t.name}: ${t.value || 'Not available'} ${t.unit || ''} (Reference Range: ${t.reference_range || 'Not available in document'}) - [${t.status}]\n`;
      content += `  Explanation: ${t.explanation}\n\n`;
    });
    content += `\nQUESTIONS TO DISCUSS WITH YOUR PHYSICIAN:\n`;
    analysis.questions_for_doctor.forEach((q, i) => {
      content += `${i + 1}. ${q}\n`;
    });
    content += `\nDISCLAIMER:\n${analysis.disclaimer}\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HealthEase_Report_${analysis.filename.replace(/\s+/g, '_')}.txt`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    if (status === 'within_range') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-teal-400" />
          <span>Within Range</span>
        </span>
      );
    }
    if (status === 'outside_range') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-amber-400" />
          <span>Outside Reference</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
        Review Range
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      
      {/* Universal Safety Disclaimer */}
      <SafetyBanner />

      {/* Hero Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
          <FileCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>Biomarker & Document Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Understand your health report — <span className="bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">without the medical jargon</span>.
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Upload laboratory blood tests, discharge summaries, or clinical panels. HealthEase AI translates complex biomarkers into clear, conversational explanations.
        </p>
      </div>

      {/* Upload Zone & Sample Loaders */}
      <div className="double-bezel">
        <div className="double-bezel-inner p-8 text-center bg-gradient-to-b from-slate-900/90 to-purple-950/20">
          
          <input
            type="file"
            id="report-upload-input"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <label
            htmlFor="report-upload-input"
            className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 bg-slate-900/40 hover:bg-cyan-500/5 transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/20">
              <UploadCloud className="w-8 h-8" />
            </div>
            
            <h3 className="font-extrabold text-lg text-white mb-1">
              Drop your report here
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              PDF • JPG • PNG (Max 15MB)
            </p>

            <button
              type="button"
              disabled={isUploading}
              className="btn-nested-island bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/30 cursor-pointer"
            >
              <span>{isUploading ? 'Analyzing Document...' : 'Upload Report'}</span>
              <div className="btn-nested-icon bg-slate-950/20 text-slate-950">
                <FileText className="w-4 h-4" />
              </div>
            </button>
          </label>

          {/* Instant Sample Selectors */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Or test with demo samples:</span>
            {sampleReports.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample.id)}
                disabled={isUploading}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900/70 hover:bg-cyan-500/20 border border-cyan-500/20 text-xs text-cyan-300 font-semibold transition-all hover:scale-105 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {sample.title}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs">
              {errorMsg}
            </div>
          )}

        </div>
      </div>

      {/* Analysis Results View */}
      {analysis && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Document Overview Bar */}
          <div className="double-bezel">
            <div className="double-bezel-inner p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {analysis.document_type}
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-1.5">
                    {analysis.filename}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Report Date: {analysis.report_date || 'Not specified in document'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveSummary}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{savedSuccess ? 'Saved!' : 'Save Summary'}</span>
                  </button>

                  <button
                    onClick={handleDownloadTxt}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Simple AI Summary */}
              <div>
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Simple Explanation Summary</span>
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Detected Tests / Biomarkers Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Detected Tests & Lab Biomarkers ({analysis.tests.length})</span>
              </h3>
              <span className="text-xs text-slate-400">Values extracted directly from uploaded report</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.tests.map((test: TestResultItem, idx: number) => (
                <div key={idx} className="double-bezel">
                  <div className="double-bezel-inner p-5 flex flex-col justify-between h-full bg-[#0A1022]">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h4 className="font-extrabold text-base text-white">
                          {test.name}
                        </h4>
                        {getStatusBadge(test.status)}
                      </div>

                      {/* Values Table */}
                      <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-900/60 border border-white/5 mb-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Reported Value</span>
                          <span className="font-mono font-bold text-white text-sm">
                            {test.value || 'Not available'} {test.unit || ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Reference Range</span>
                          <span className="font-mono text-slate-300 text-xs">
                            {test.reference_range || 'Not available in document'}
                          </span>
                        </div>
                      </div>

                      {/* Educational Explanation */}
                      <div className="text-xs text-slate-300 leading-relaxed mb-4">
                        <strong className="text-cyan-300 block mb-0.5">What does this test measure?</strong>
                        <p>{test.explanation}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <button
                        onClick={() => handleDocChatSend(`Explain ${test.name} in more detail`)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Explain More</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleDocChatSend(`What are common lifestyle factors for ${test.name}?`)}
                        className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
                      >
                        Ask AI
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Questions to Discuss With a Professional */}
          {analysis.questions_for_doctor && analysis.questions_for_doctor.length > 0 && (
            <div className="double-bezel">
              <div className="double-bezel-inner p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/25">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span>Questions to Discuss With Your Doctor</span>
                </h3>
                <p className="text-xs text-slate-300 mb-4">
                  Take these informed questions to your next physician appointment to make the most of your consultation:
                </p>
                <div className="space-y-2.5">
                  {analysis.questions_for_doctor.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-white/5 text-xs text-slate-200">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Document Q&A Section */}
          <div className="double-bezel">
            <div className="double-bezel-inner p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-base text-white">
                  Ask Questions About This Report
                </h3>
              </div>

              {/* Chat Thread */}
              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-2">
                {docMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-cyan-500/20 border border-cyan-500/30 text-white ml-auto max-w-md'
                        : 'bg-slate-900/80 border border-white/5 text-slate-200 max-w-xl'
                    }`}
                  >
                    <div className="font-bold text-[10px] text-cyan-300 uppercase mb-1">
                      {m.role === 'user' ? 'You' : 'HealthEase Assistant'}
                    </div>
                    <div>{m.content}</div>

                    {m.follow_ups && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                        {m.follow_ups.map((fu, fIdx) => (
                          <button
                            key={fIdx}
                            onClick={() => handleDocChatSend(fu)}
                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-[10px] text-slate-300 hover:text-cyan-200 transition-colors"
                          >
                            "{fu}"
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isDocChatLoading && (
                  <div className="p-3 rounded-2xl bg-slate-900/60 text-xs text-cyan-400 animate-pulse">
                    Synthesizing lab biomarker context...
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDocChatSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={docInput}
                  onChange={(e) => setDocInput(e.target.value)}
                  placeholder="Ask a question about this report (e.g., what does HbA1c 5.8% mean?)..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={!docInput.trim() || isDocChatLoading}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/30 disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
