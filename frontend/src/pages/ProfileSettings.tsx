import React, { useState } from 'react';
import { 
  Settings, User, Globe, Sparkles, Volume2, 
  Eye, ShieldCheck, Check, Save, Lock, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SafetyBanner } from '../components/SafetyBanner';
import { ExplanationLevel, SupportedLanguage } from '../types';

export const ProfileSettings: React.FC = () => {
  const { profile, updateProfile, explanationLevel, setExplanationLevel } = useAuth();
  const { language, preference, setPreference } = useLanguage();

  const [fullName, setFullName] = useState(profile.full_name || 'Guna');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [voiceSpeed, setVoiceSpeed] = useState(profile.voice_speed || 1.0);
  const [highContrast, setHighContrast] = useState(profile.high_contrast || false);
  const [reducedMotion, setReducedMotion] = useState(profile.reduced_motion || false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const levels: ExplanationLevel[] = [
    'School Student', 'College Student', 'General Public', 'Caregiver', 'Healthcare Student'
  ];

  const languages: Array<{ code: SupportedLanguage; label: string }> = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      full_name: fullName,
      avatar_url: avatarUrl,
      voice_speed: voiceSpeed,
      high_contrast: highContrast,
      reduced_motion: reducedMotion,
      preferred_language: language,
      explanation_level: explanationLevel
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      
      {/* Universal Safety Disclaimer */}
      <SafetyBanner />

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
          <Settings className="w-3.5 h-3.5 text-cyan-400" />
          <span>Personalization Engine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          User Profile & <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">Health Preferences</span>.
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Configure your default explanation depth, preferred Indian or English language, voice synthesis rate, and accessibility settings.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Profile Card */}
        <div className="double-bezel">
          <div className="double-bezel-inner p-6 sm:p-8 bg-[#090F20] space-y-5">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              <span>Identity & Account</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Display Name:
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Avatar Image URL:
                </label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Explanation Persona Level */}
        <div className="double-bezel">
          <div className="double-bezel-inner p-6 sm:p-8 bg-[#090F20] space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Default AI Explanation Level</span>
            </h3>
            <p className="text-xs text-slate-400">
              HealthEase AI automatically adapts its vocabulary, analogy density, and scientific detail to your selected background:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setExplanationLevel(lvl)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    explanationLevel === lvl
                      ? 'bg-gradient-to-r from-cyan-500/25 to-teal-500/10 text-cyan-200 border-cyan-400/50 shadow-md font-bold'
                      : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{lvl}</span>
                    {explanationLevel === lvl && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Language & Voice Synthesis */}
        <div className="double-bezel">
          <div className="double-bezel-inner p-6 sm:p-8 bg-[#090F20] space-y-5">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-400" />
              <span>Language & Voice Narration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2 space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  🌐 Response Language:
                </label>
                <p className="text-xs text-slate-400">
                  Manual language selection overrides automatic detection. (Default: Auto Detect)
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { code: 'auto', label: 'Auto Detect', native: '🌐 Auto Detect' },
                    { code: 'en', label: 'English', native: 'English' },
                    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
                    { code: 'hi', label: 'Hindi', native: 'हिन्दी' }
                  ].map((opt) => (
                    <label
                      key={opt.code}
                      onClick={() => setPreference(opt.code as any)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        preference === opt.code
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-md shadow-cyan-500/10'
                          : 'bg-slate-950/60 border-white/5 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="response_language"
                          checked={preference === opt.code}
                          onChange={() => setPreference(opt.code as any)}
                          className="accent-cyan-400 cursor-pointer"
                        />
                        <span className="text-xs">{opt.native}</span>
                      </div>
                      {preference === opt.code && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Voice Speech Speed: <span className="font-mono text-cyan-400">{voiceSpeed}x</span>
                </label>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Accessibility Toggles */}
        <div className="double-bezel">
          <div className="double-bezel-inner p-6 sm:p-8 bg-[#090F20] space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              <span>Accessibility</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-white/5 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">High Contrast Mode</span>
                  <span className="text-[11px] text-slate-400">Enhance visual border contrast and text legibility</span>
                </div>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-white/5 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">Reduced Motion</span>
                  <span className="text-[11px] text-slate-400">Minimize ambient particle and background animations</span>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saveSuccess && (
            <span className="text-xs text-teal-400 font-bold flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Settings successfully updated!</span>
            </span>
          )}

          <button
            type="submit"
            className="btn-nested-island bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-xl shadow-cyan-500/30 cursor-pointer"
          >
            <span>Save Preferences</span>
            <div className="btn-nested-icon bg-slate-950/20 text-slate-950">
              <Save className="w-4 h-4" />
            </div>
          </button>
        </div>

      </form>

    </div>
  );
};
