import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Loader2, AlertCircle, Check, Globe, X, RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../types';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'ready' | 'error';

interface VoiceInputProps {
  onTranscript: (text: string, detectedLang?: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatusBanner?: boolean;
}

// Global reference to any running speech recognition instance to prevent multiple simultaneous sessions
let globalActiveRecognition: any = null;

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  className = '',
  size = 'md',
  showStatusBanner = true,
}) => {
  const { language, preference, detectInputLanguage } = useLanguage();

  const [state, setState] = useState<VoiceState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [canRetry, setCanRetry] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [detectedLangLabel, setDetectedLangLabel] = useState<string>('');

  // Selected recognition language tag for Web Speech API (en-IN, ta-IN, hi-IN)
  const [activeSpeechLang, setActiveSpeechLang] = useState<string>('en-IN');

  // Refs for tracking mutable recognition state safely across event closures
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const accumulatedFinalRef = useRef<string>('');
  const resetTimerRef = useRef<any>(null);

  // Determine initial speech recognition language code based on user settings
  const determineInitialSpeechLang = useCallback((): string => {
    if (preference === 'ta') return 'ta-IN';
    if (preference === 'hi') return 'hi-IN';
    if (preference === 'en') return 'en-IN';

    // When preference is 'auto', align with active UI language or browser default
    if (language === 'ta') return 'ta-IN';
    if (language === 'hi') return 'hi-IN';

    if (typeof navigator !== 'undefined' && navigator.language) {
      if (navigator.language.startsWith('ta')) return 'ta-IN';
      if (navigator.language.startsWith('hi')) return 'hi-IN';
    }

    return 'en-IN';
  }, [language, preference]);

  // Sync initial speech language when global language preference changes
  useEffect(() => {
    setActiveSpeechLang(determineInitialSpeechLang());
  }, [determineInitialSpeechLang]);

  // Clean up timers and active recognition on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      if (globalActiveRecognition === recognitionRef.current) {
        globalActiveRecognition = null;
      }
    };
  }, []);

  // Check if browser supports Web Speech API
  const isBrowserSupported = (): boolean => {
    return (
      typeof window !== 'undefined' &&
      Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
  };

  // Check audio input device availability
  const checkMicrophoneDevice = async (): Promise<{ ok: boolean; reason?: string }> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return { ok: true }; // Fall back to direct recognition prompt
    }

    try {
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudioInput = devices.some((d) => d.kind === 'audioinput');
        if (devices.length > 0 && !hasAudioInput) {
          return {
            ok: false,
            reason: 'No microphone detected. Please connect or enable a microphone and try again.',
          };
        }
      }
    } catch (e) {
      console.debug('Microphone enumeration check bypassed:', e);
    }
    return { ok: true };
  };

  // Stop current listening session cleanly
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  }, []);

  // Start speech recognition session
  const startListening = async () => {
    // 1. Browser compatibility check
    if (!isBrowserSupported()) {
      setState('error');
      setCanRetry(false);
      setErrorMessage(
        'Voice input is not supported in this browser. Please try Google Chrome or Microsoft Edge.'
      );
      return;
    }

    // 2. Microphone device check
    const micCheck = await checkMicrophoneDevice();
    if (!micCheck.ok) {
      setState('error');
      setCanRetry(true);
      setErrorMessage(micCheck.reason || 'No microphone detected.');
      return;
    }

    // 3. Prevent multiple simultaneous recognition instances across the page
    if (globalActiveRecognition) {
      try {
        globalActiveRecognition.abort();
      } catch (_) {}
      globalActiveRecognition = null;
    }

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    // Reset transcription state
    accumulatedFinalRef.current = '';
    setLiveTranscript('');
    setErrorMessage('');
    setCanRetry(false);
    setDetectedLangLabel('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = activeSpeechLang;
      recognition.continuous = false; // Finishes naturally on pause, or manual stop
      recognition.interimResults = true; // Enables live preview of in-flight words
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setState('listening');
        setErrorMessage('');
      };

      recognition.onspeechstart = () => {
        if (isListeningRef.current) {
          setState('listening');
        }
      };

      recognition.onspeechend = () => {
        if (isListeningRef.current) {
          setState('processing');
        }
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let currentFinalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcriptPiece = result[0]?.transcript || '';
          if (result.isFinal) {
            currentFinalChunk += transcriptPiece;
          } else {
            interimText += transcriptPiece;
          }
        }

        if (currentFinalChunk) {
          accumulatedFinalRef.current = (
            accumulatedFinalRef.current +
            ' ' +
            currentFinalChunk
          ).trim();
        }

        const fullDisplay = (
          accumulatedFinalRef.current +
          (interimText ? ' ' + interimText : '')
        ).trim();

        if (fullDisplay) {
          setLiveTranscript(fullDisplay);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);

        // Do not flag error if stopped intentionally by user
        if (event.error === 'aborted') {
          if (!accumulatedFinalRef.current.trim()) {
            setState('idle');
          }
          return;
        }

        isListeningRef.current = false;
        setState('error');
        setCanRetry(true);

        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            setErrorMessage(
              'Microphone permission is required for voice input. Please allow microphone access in your browser settings.'
            );
            break;
          case 'no-speech':
            setErrorMessage('No speech detected. Please speak closer to your microphone and try again.');
            break;
          case 'audio-capture':
            setErrorMessage('No microphone detected. Please connect or enable a microphone and try again.');
            break;
          case 'network':
            setErrorMessage('Voice recognition network error. Please check your internet connection.');
            break;
          default:
            setErrorMessage('Voice recognition encountered an issue. Please try again or type your question.');
            break;
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        if (globalActiveRecognition === recognition) {
          globalActiveRecognition = null;
        }

        const completedText = accumulatedFinalRef.current.trim() || liveTranscript.trim();

        if (completedText) {
          // Automatic Language Detection step on recognized text
          const detection = detectInputLanguage(completedText);
          const langLabel = detection.native_label || detection.detected_name || 'English';
          setDetectedLangLabel(langLabel);

          setState('ready');

          // Pass the finalized transcript and identified language to parent handler
          onTranscript(completedText, detection.language);

          // Return cleanly to idle after displaying confirmation preview
          resetTimerRef.current = setTimeout(() => {
            setState('idle');
            setLiveTranscript('');
          }, 3000);
        } else {
          // No words were captured
          setState((currentState) => {
            if (currentState === 'error') return 'error';
            return 'idle';
          });
        }
      };

      recognitionRef.current = recognition;
      globalActiveRecognition = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to initialize speech recognition:', err);
      setState('error');
      setCanRetry(true);
      setErrorMessage('Voice input is unavailable right now. Please type your question.');
    }
  };

  // Switch voice recognition language on the fly (e.g. toggling to Tamil or Hindi)
  const handleLanguageSwitch = (langCode: string) => {
    setActiveSpeechLang(langCode);
    if (state === 'listening' || state === 'processing') {
      stopListening();
      // Brief timeout before restarting with new language model
      setTimeout(() => {
        startListening();
      }, 150);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (state === 'listening' || state === 'processing') {
      stopListening();
    } else {
      startListening();
    }
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Primary Microphone Trigger / Stop Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={state === 'listening' ? 'Stop voice input' : 'Start voice input'}
        title={
          state === 'listening'
            ? 'Listening... Click to stop'
            : state === 'processing'
            ? 'Processing speech...'
            : '🎙 Ask with voice (English, தமிழ், हिन्दी)'
        }
        className={`rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${sizeClasses} ${
          state === 'listening'
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-md ring-2 ring-rose-500/30'
            : state === 'processing'
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            : state === 'ready'
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            : state === 'error'
            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
            : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'
        }`}
      >
        {state === 'listening' ? (
          <Square className={`${iconSizes} fill-rose-500 text-rose-500 animate-pulse`} />
        ) : state === 'processing' ? (
          <Loader2 className={`${iconSizes} animate-spin text-amber-400`} />
        ) : state === 'ready' ? (
          <Check className={`${iconSizes} text-emerald-400`} />
        ) : state === 'error' ? (
          <AlertCircle className={iconSizes} />
        ) : (
          <Mic className={iconSizes} />
        )}
      </button>

      {/* Floating Status, Live Waveform, and Controls Banner */}
      {showStatusBanner && state !== 'idle' && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-full mb-2 right-0 sm:left-1/2 sm:-translate-x-1/2 z-50 whitespace-nowrap px-3.5 py-2.5 rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl backdrop-blur-md flex flex-col gap-2 text-xs animate-in fade-in zoom-in-95 duration-150 max-w-[calc(100vw-2rem)] min-w-[240px]"
        >
          {/* Top Status Row */}
          <div className="flex items-center justify-between gap-3">
            {state === 'listening' && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span className="font-bold text-rose-400">🔴 Listening...</span>

                {/* Subtle Horizontal Audio Waveform (No AI Orb) */}
                <div className="flex items-center gap-0.5 h-3.5 px-1 py-0.5 bg-slate-950/70 rounded-md border border-rose-500/20">
                  {[4, 10, 6, 14, 8, 12, 5, 9].map((height, idx) => (
                    <span
                      key={idx}
                      className="w-0.5 bg-gradient-to-t from-rose-500 to-amber-300 rounded-full animate-wave-bar"
                      style={{
                        height: `${height}px`,
                        animationDelay: `${idx * 0.12}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {state === 'processing' && (
              <div className="flex items-center gap-2 text-amber-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span className="font-medium">◌ Processing speech...</span>
              </div>
            )}

            {state === 'ready' && (
              <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {detectedLangLabel ? `Detected: ${detectedLangLabel}` : 'Transcript added'}
                </span>
              </div>
            )}

            {state === 'error' && (
              <div className="flex items-center gap-1.5 text-rose-300 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Voice input notice</span>
              </div>
            )}

            {/* Quick Actions (Stop or Dismiss) */}
            <div className="flex items-center gap-1 ml-auto">
              {state === 'listening' && (
                <button
                  type="button"
                  onClick={stopListening}
                  className="px-2 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-semibold cursor-pointer transition-colors"
                >
                  Stop
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  stopListening();
                  setState('idle');
                }}
                className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Spoken Language Model Selector Chips (English / தமிழ் / हिन्दी) */}
          {state === 'listening' && (
            <div className="flex items-center gap-1.5 pt-1 border-t border-white/5 text-[10px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Globe className="w-2.5 h-2.5 text-cyan-400" />
                Speaking:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleLanguageSwitch('en-IN')}
                  className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                    activeSpeechLang === 'en-IN'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageSwitch('ta-IN')}
                  className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                    activeSpeechLang === 'ta-IN'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  தமிழ்
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageSwitch('hi-IN')}
                  className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                    activeSpeechLang === 'hi-IN'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>
          )}

          {/* Live Transcript Preview (Shows speech recognized in real-time) */}
          {liveTranscript && (state === 'listening' || state === 'processing' || state === 'ready') && (
            <div className="text-[11px] text-slate-300 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-white/10 max-w-xs break-words whitespace-normal leading-relaxed">
              <span className="text-slate-400 mr-1">“</span>
              {liveTranscript}
              <span className="text-slate-400 ml-1">”</span>
            </div>
          )}

          {/* Error Message with Try Again Button */}
          {state === 'error' && (
            <div className="space-y-1.5 pt-0.5">
              <p className="text-[11px] text-slate-300 leading-snug whitespace-normal max-w-xs">
                {errorMessage}
              </p>
              {canRetry && (
                <button
                  type="button"
                  onClick={() => startListening()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-semibold cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Try Again</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
