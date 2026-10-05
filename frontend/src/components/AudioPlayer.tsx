import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Volume2, Gauge } from 'lucide-react';
import { SupportedLanguage } from '../types';

interface AudioPlayerProps {
  text: string;
  language?: SupportedLanguage;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, language = 'en' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text]);

  const cleanTextForAudio = (raw: string): string => {
    return raw
      .replace(/[#*`_~]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\n+/g, '. ')
      .trim();
  };

  const handlePlay = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    const clean = cleanTextForAudio(text);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = speed;

    const langMap: Record<string, string> = {
      en: 'en-US',
      ta: 'ta-IN',
      hi: 'hi-IN',
      te: 'te-IN',
      ml: 'ml-IN',
    };
    utterance.lang = langMap[language] || 'en-US';

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if ('speechSynthesis' in window && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1.0, 1.25];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setSpeed(nextSpeed);
    if (isPlaying) {
      handleStop();
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-cyan-500/20 text-xs text-slate-300">
      <span className="flex items-center gap-1 px-1.5 text-cyan-400 font-medium">
        <Volume2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Listen</span>
      </span>

      {!isPlaying ? (
        <button
          onClick={handlePlay}
          title="Play explanation"
          className="p-1 rounded-lg hover:bg-cyan-500/20 text-cyan-300 transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={handlePause}
          title="Pause playback"
          className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300 transition-colors"
        >
          <Pause className="w-3.5 h-3.5" />
        </button>
      )}

      {(isPlaying || isPaused) && (
        <button
          onClick={handleStop}
          title="Stop playback"
          className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
      )}

      <button
        onClick={cycleSpeed}
        title="Playback Speed"
        className="px-1.5 py-0.5 rounded-md hover:bg-cyan-500/20 text-[11px] font-mono text-cyan-300 transition-colors flex items-center gap-0.5"
      >
        <Gauge className="w-3 h-3" />
        <span>{speed}x</span>
      </button>
    </div>
  );
};
