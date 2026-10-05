import React, { useState } from 'react';
import { Info, Volume2, BookOpen } from 'lucide-react';
import { api } from '../services/api';
import { MedicalTermItem } from '../types';

interface TermPopoverProps {
  term: string;
  onOpenDictionary?: (term: string) => void;
}

export const TermPopover: React.FC<TermPopoverProps> = ({ term, onOpenDictionary }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [termData, setTermData] = useState<MedicalTermItem | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTerm = async () => {
    if (termData) return;
    setLoading(true);
    try {
      const data = await api.getTermByName(term);
      setTermData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(term);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <span className="relative inline-block">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          fetchTerm();
        }}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 text-xs font-medium cursor-pointer transition-all hover:scale-105"
      >
        <span>{term}</span>
        <Info className="w-3 h-3 text-cyan-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 p-3 rounded-2xl glass-panel shadow-2xl text-left border border-cyan-500/30 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/10">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-cyan-300 text-sm">{term}</span>
              {termData?.phonetic && (
                <span className="text-slate-400 text-[10px] font-mono">[{termData.phonetic}]</span>
              )}
            </div>
            <button
              onClick={handleSpeak}
              title="Pronounce Term"
              className="p-1 rounded-md text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="text-xs text-slate-400 py-2">Looking up definition...</div>
          ) : (
            <div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {termData?.simple_meaning || 'A physiological or clinical term evaluated in healthcare.'}
              </p>
              {onOpenDictionary && (
                <button
                  onClick={() => onOpenDictionary(term)}
                  className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>View in Medical Dictionary →</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </span>
  );
};
