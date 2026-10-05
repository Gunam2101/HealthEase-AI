import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Sparkles, Copy, Check, Bookmark, 
  RotateCcw, ThumbsUp, ThumbsDown, BookOpen, ExternalLink,
  ChevronDown, Globe, ShieldAlert, Mic, RefreshCw, Volume2, Share2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SafetyBanner } from '../components/SafetyBanner';
import { AudioPlayer } from '../components/AudioPlayer';
import { VoiceInput } from '../components/VoiceInput';
import { TermPopover } from '../components/TermPopover';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { api } from '../services/api';
import { ChatMessage, ExplanationLevel, SupportedLanguage, SafetyAlert } from '../types';

interface ChatAssistantProps {
  initialQuery?: string;
  onOpenDictionary?: (term: string) => void;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  initialQuery,
  onOpenDictionary
}) => {
  const { explanationLevel, setExplanationLevel, profile } = useAuth();
  const { language, preference, detectInputLanguage, t } = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [detectedBadge, setDetectedBadge] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<SafetyAlert | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, string>>({});
  const [showTranslateMenu, setShowTranslateMenu] = useState<string | null>(null);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const levels: ExplanationLevel[] = [
    'School Student', 'College Student', 'General Public', 'Caregiver', 'Healthcare Student'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcome: ChatMessage = {
        id: 'msg_welcome',
        role: 'assistant',
        content: 
          "Hello! I am **HealthEase AI**, your personal health information assistant.\n\n" +
          "I can help you understand lab results, clinical diagnoses, medical terms, and healthy habits without confusing medical jargon.\n\n" +
          "What health topic or question would you like to explore?",
        explanation_level: explanationLevel,
        language: language,
        follow_ups: [
          "Explain hypertension simply",
          "What is HbA1c and why does it matter?",
          "What does anemia mean?",
          "How does hydration affect blood pressure?"
        ]
      };
      setMessages([welcome]);
    }
  }, []);

  // Handle initialQuery if passed from dashboard
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setDetectedBadge('');
    setIsLoading(true);

    const detected = detectInputLanguage(textToSend);
    const targetLang: SupportedLanguage = (preference !== 'auto')
      ? (preference as SupportedLanguage)
      : (['ta', 'hi', 'en'].includes(detected.language as string) ? (detected.language as SupportedLanguage) : language);

    try {
      const resp = await api.sendChatMessage({
        message: textToSend,
        explanation_level: explanationLevel,
        language: targetLang,
      });

      const assistantMsg: ChatMessage = {
        id: resp.message_id || `asst_${Date.now()}`,
        role: 'assistant',
        content: resp.content,
        explanation_level: resp.explanation_level || explanationLevel,
        language: resp.language || targetLang,
        safety: resp.safety,
        sources: resp.sources,
        follow_ups: resp.follow_ups,
        structured_sections: resp.structured_sections,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (!resp.safety.is_safe) {
        setActiveAlert(resp.safety);
      }

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: "I apologize, but I encountered an error while communicating with the health intelligence engine. Please try asking again.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTranslate = async (msgId: string, currentText: string, targetLang: SupportedLanguage) => {
    try {
      const resp = await api.translateText(currentText, targetLang);
      setTranslatedMessages(prev => ({
        ...prev,
        [msgId]: resp.translated_text
      }));
      setShowTranslateMenu(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = (text: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'HealthEase AI Health Explanation',
        text: text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedId('share_copied');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleRegenerate = (lastIndex: number) => {
    // Find preceding user question
    for (let i = lastIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        handleSend(messages[i].content);
        break;
      }
    }
  };

  // Helper to format medical text with bolding, lists, and highlighting
  const renderFormattedContent = (content: string) => {
    const paragraphs = content.split('\n\n');
    return paragraphs.map((para, pIdx) => {
      // Bullet list item
      if (para.startsWith('• ') || para.startsWith('- ') || para.startsWith('* ')) {
        const items = para.split('\n');
        return (
          <ul key={pIdx} className="space-y-1.5 my-3 pl-4 list-disc list-outside text-slate-200">
            {items.map((it, iIdx) => (
              <li key={iIdx} className="leading-relaxed">
                {renderInlineMarkdown(it.replace(/^[•\-*]\s*/, ''))}
              </li>
            ))}
          </ul>
        );
      }

      // Heading 2 / 3
      if (para.startsWith('### ')) {
        return (
          <h4 key={pIdx} className="text-sm font-bold text-cyan-300 mt-4 mb-2 tracking-wide flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>{para.replace('### ', '')}</span>
          </h4>
        );
      }
      if (para.startsWith('## ')) {
        return (
          <h3 key={pIdx} className="text-base font-extrabold text-white mt-5 mb-2 tracking-tight">
            {para.replace('## ', '')}
          </h3>
        );
      }

      return (
        <p key={pIdx} className="my-2.5 text-slate-200 leading-relaxed text-sm sm:text-base">
          {renderInlineMarkdown(para)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text: string) => {
    // Parse bold text **word**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong key={i} className="font-extrabold text-white bg-cyan-500/10 px-1 py-0.5 rounded border border-cyan-500/20">
            {inner}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-5xl mx-auto space-y-4 animate-in fade-in duration-300">
      
      {/* Universal Safety Disclaimer */}
      <SafetyBanner alert={activeAlert} onDismiss={() => setActiveAlert(null)} />

      {/* Header Workspace Bar with Prominent "Explain Like I'm..." Selector */}
      <div className="p-4 sm:p-5 rounded-3xl glass-panel border border-cyan-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>AI Health Assistant</span>
                <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  Verified RAG Active
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Understand health concepts in clear, tailored language.
              </p>
            </div>
          </div>
        </div>

        {/* Prominent Persona "Explain Like I'm..." Selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-cyan-500/20">
          <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider hidden lg:inline">
            Explain Like I'm:
          </span>
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setExplanationLevel(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                explanationLevel === lvl
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Conversation Stream */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const displayedText = translatedMessages[msg.id] || msg.content;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className="shrink-0 mt-1">
                {isUser ? (
                  <div className="w-9 h-9 rounded-2xl bg-slate-800 border border-cyan-500/30 overflow-hidden shadow-md">
                    <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/25">
                    <div className="w-full h-full bg-[#080D1A] rounded-[15px] flex items-center justify-center">
                      <Bot className="w-5 h-5 text-cyan-300" />
                    </div>
                  </div>
                )}
              </div>

              {/* Message Bubble Body */}
              <div
                className={`max-w-[85%] rounded-3xl p-5 sm:p-6 transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 border border-cyan-400/40 text-white shadow-xl'
                    : 'double-bezel w-full'
                }`}
              >
                {!isUser ? (
                  <div className="double-bezel-inner p-5 sm:p-6 bg-[#090F20]/90 border border-white/5">
                    
                    {/* Header info */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-300">HealthEase AI</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                          {msg.explanation_level || explanationLevel}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{msg.created_at}</span>
                    </div>

                    {/* Formatted Text Content */}
                    <div className="text-slate-100">
                      <MarkdownRenderer content={displayedText} />
                    </div>

                    {/* Verified Sources Citations */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-white/10">
                        <div className="text-[11px] font-mono font-bold text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Verified Educational Sources:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-white/5 flex items-center justify-between text-xs text-slate-300 hover:text-cyan-300 transition-colors group"
                            >
                              <div className="truncate mr-2">
                                <div className="font-semibold text-slate-200 truncate">{src.title}</div>
                                <div className="text-[10px] text-slate-400">{src.organization}</div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-cyan-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up Questions Suggestions */}
                    {msg.follow_ups && msg.follow_ups.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/5">
                        <span className="text-[11px] font-semibold text-slate-400 mb-2 block">
                          Recommended Follow-ups:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.follow_ups.map((fu, fIdx) => (
                            <button
                              key={fIdx}
                              onClick={() => handleSend(fu)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-cyan-500/20 border border-cyan-500/20 text-xs text-slate-300 hover:text-cyan-200 transition-all hover:scale-105 cursor-pointer text-left"
                            >
                              "{fu}"
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottom Response Actions: Copy, Save, Listen, Share, Translate, Regenerate, Thumbs */}
                    <div className="mt-5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                      
                      <div className="flex items-center gap-2">
                        {/* Copy */}
                        <button
                          onClick={() => handleCopy(msg.id, displayedText)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        {/* Share */}
                        <button
                          onClick={() => handleShare(displayedText)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                          title="Share explanation"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{copiedId === 'share_copied' ? 'Link Copied!' : 'Share'}</span>
                        </button>

                        {/* Listen via AudioPlayer */}
                        <AudioPlayer text={displayedText} />

                        {/* Translate */}
                        <div className="relative">
                          <button
                            onClick={() => setShowTranslateMenu(showTranslateMenu === msg.id ? null : msg.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Translate</span>
                          </button>

                          {showTranslateMenu === msg.id && (
                            <div className="absolute left-0 bottom-full mb-2 w-44 glass-panel rounded-2xl p-1.5 shadow-2xl border border-cyan-500/30 z-30">
                              {(['en', 'ta', 'hi', 'te', 'ml'] as SupportedLanguage[]).map((tLang) => (
                                <button
                                  key={tLang}
                                  onClick={() => handleTranslate(msg.id, msg.content, tLang)}
                                  className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-white/10 text-xs text-slate-200 uppercase font-mono"
                                >
                                  {tLang} Language
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Regenerate */}
                        <button
                          onClick={() => handleRegenerate(index)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                          title="Regenerate answer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Regenerate</span>
                        </button>
                      </div>

                      {/* Feedback Thumbs */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setFeedbackGiven(prev => ({ ...prev, [msg.id]: 'up' }))}
                          className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                            feedbackGiven[msg.id] === 'up' ? 'text-cyan-400 bg-cyan-500/20' : 'text-slate-400'
                          }`}
                          title="Helpful explanation"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setFeedbackGiven(prev => ({ ...prev, [msg.id]: 'down' }))}
                          className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                            feedbackGiven[msg.id] === 'down' ? 'text-rose-400 bg-rose-500/20' : 'text-slate-400'
                          }`}
                          title="Needs improvement"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                  </div>
                ) : (
                  <p className="text-sm sm:text-base leading-relaxed font-medium">
                    {msg.content}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking State */}
        {isLoading && (
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 mt-1">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
            </div>
            <div className="double-bezel max-w-md">
              <div className="double-bezel-inner p-4 bg-[#090F20] flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs text-slate-300 font-medium">
                  HealthEase AI is synthesizing reliable medical information...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Sticky AI Command Bar */}
      <div className="p-3 sm:p-4 rounded-3xl glass-panel border border-cyan-500/25 bg-[#080D1A]/95 shadow-2xl space-y-2">
        
        {/* Subtle Language Auto-Detection Badge (Never interrupts with popups) */}
        {detectedBadge && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs w-fit animate-in fade-in duration-150">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>🌐 {detectedBadge} detected</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 relative"
        >
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => {
                const val = e.target.value;
                setInputText(val);
                if (val.trim().length >= 3) {
                  const det = detectInputLanguage(val);
                  setDetectedBadge(det.native_label || det.detected_name);
                } else {
                  setDetectedBadge('');
                }
              }}
              placeholder="Ask anything about health, medical terms, or test results (English, தமிழ், हिन्दी)..."
              className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/25 transition-all"
            />
            
            <div className="absolute right-2.5 flex items-center">
              <VoiceInput
                size="sm"
                onTranscript={(text, detectedLang) => {
                  setInputText(prev => prev ? `${prev} ${text}` : text);
                  if (detectedLang) {
                    const det = detectInputLanguage(text);
                    setDetectedBadge(det.native_label || det.detected_name);
                  }
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="btn-nested-island bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="hidden sm:inline">Ask</span>
            <div className="btn-nested-icon bg-slate-950/20 text-slate-950">
              <Send className="w-4 h-4" />
            </div>
          </button>
        </form>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 px-2">
          <span>Active Persona: <strong className="text-cyan-300">{explanationLevel}</strong></span>
          <span className="font-mono text-[10px]">Non-diagnostic • Educational Assistant</span>
        </div>
      </div>

    </div>
  );
};
