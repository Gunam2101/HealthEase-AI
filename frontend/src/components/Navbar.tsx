import React, { useState } from 'react';
import { 
  Search, Globe, Bell, ChevronDown, 
  User, Check, Sun, Moon, Sparkles, ShieldAlert, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { SupportedLanguage } from '../types';

interface NavbarProps {
  onSearchSelect?: (query: string) => void;
  onNavigate?: (page: string) => void;
  onOpenEmergency?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onSearchSelect, 
  onNavigate,
  onOpenEmergency 
}) => {
  const { profile, explanationLevel } = useAuth();
  const { language, preference, setPreference, detectedLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const languageOptions: Array<{ code: 'auto' | SupportedLanguage; label: string; native: string }> = [
    { code: 'auto', label: 'Auto Detect', native: '🌐 Auto Detect' },
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  ];

  const searchSuggestions = [
    { title: 'Hypertension (High Blood Pressure)', type: 'topic', query: 'Explain hypertension simply' },
    { title: 'HbA1c Biomarker & Diabetes', type: 'test', query: 'What is HbA1c?' },
    { title: 'Complete Blood Count (CBC) Panel', type: 'report', query: 'Explain CBC report' },
    { title: 'Dyslipidemia & Cholesterol', type: 'term', query: 'What does dyslipidemia mean?' },
    { title: 'Anemia & Hemoglobin Metrics', type: 'topic', query: 'What does anemia mean?' },
    { title: 'Thyroid Stimulating Hormone (TSH)', type: 'test', query: 'Explain TSH lab values' },
  ];

  const notifications = [
    { id: 1, title: 'New Topic Guide', desc: 'Decoding Lipid Panels & Cardiovascular Markers', time: '10m ago' },
    { id: 2, title: 'Daily Health Tip', desc: 'Hydration supports renal glomerular filtration', time: '2h ago' },
    { id: 3, title: 'Safety Filter Active', desc: 'Strict educational health guidelines enforced', time: '1d ago' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearchSelect) {
      onSearchSelect(searchQuery.trim());
      setShowSearchDropdown(false);
    }
  };

  const handleSuggestionClick = (query: string) => {
    setSearchQuery(query);
    setShowSearchDropdown(false);
    if (onSearchSelect) onSearchSelect(query);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--surface)] border-b border-[var(--border)] backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-3">
        
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate?.('home')} 
          className="flex items-center gap-2.5 cursor-pointer group shrink-0 select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1px] shadow-sm group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[var(--bg-secondary)] rounded-[7px] flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v3m0 10v3m-3-10H6m12 0h-3" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.8" />
                <path d="M3 12h3.5l2-4 3.5 8 2.5-6 1.5 2H21" stroke="#22d3ee" />
                <circle cx="12" cy="16" r="1.5" fill="#a855f7" />
              </svg>
            </div>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
              HealthEase
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              AI
            </span>
          </div>
        </div>

        {/* Global Smart Search */}
        <div className="relative flex-1 max-w-lg mx-2 hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Search health topics, medical terms, biomarkers..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-900/40 dark:bg-slate-950/60 border border-[var(--border)] text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && (
            <div 
              onMouseDown={(e) => e.preventDefault()}
              className="absolute top-full mt-1.5 w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-2 shadow-xl z-50 animate-in fade-in duration-100"
            >
              <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Suggested Topics</span>
                <span className="text-slate-500 font-normal">Press Enter to search</span>
              </div>
              <div className="mt-1 space-y-0.5">
                {searchSuggestions.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(item.query)}
                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/10 flex items-center justify-between text-xs text-[var(--text-primary)] transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <span className="truncate group-hover:text-cyan-400">{item.title}</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800/40 text-slate-400 uppercase shrink-0">
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Emergency Guidance Trigger */}
          {onOpenEmergency && (
            <button
              onClick={onOpenEmergency}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
              title="Emergency Guidance"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden lg:inline text-[11px]">Emergency Help</span>
            </button>
          )}

          {/* Language Selector: 🌐 Auto Detect / English / தமிழ் / हिन्दी */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--border)] hover:border-cyan-500/30 bg-slate-900/40 text-xs font-medium text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Response Language Preference"
              aria-label="Language selection"
            >
              <span>🌐</span>
              <span className="font-medium text-xs">
                {preference === 'auto' 
                  ? (detectedLanguage && detectedLanguage.language !== 'en' ? `Auto (${detectedLanguage.native_label})` : 'Auto Detect')
                  : (languageOptions.find(l => l.code === preference)?.native || 'English')}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLangMenu && (
              <div 
                onMouseLeave={() => setShowLangMenu(false)}
                className="absolute right-0 top-full mt-1.5 w-44 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 shadow-xl z-50 animate-in fade-in duration-100"
              >
                <div className="px-2.5 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Response Language
                </div>
                {languageOptions.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setPreference(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      preference === l.code
                        ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <span>{l.native}</span>
                    {preference === l.code && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-slate-800/30 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-slate-800/30 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </button>

            {showNotifications && (
              <div 
                onMouseLeave={() => setShowNotifications(false)}
                className="absolute right-0 top-full mt-1.5 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-2.5 shadow-xl z-50"
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[var(--border)]">
                  <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Health Updates</span>
                  </span>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2 rounded-lg bg-slate-900/30 dark:bg-slate-950/40 border border-[var(--border)] text-xs">
                      <div className="font-semibold text-slate-200">{n.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{n.desc}</div>
                      <div className="text-[9px] text-cyan-400 font-mono mt-1">{n.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg border border-[var(--border)] hover:bg-slate-800/30 text-xs transition-colors cursor-pointer"
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                {profile.full_name ? profile.full_name[0].toUpperCase() : 'G'}
              </div>
              <span className="font-medium text-xs text-[var(--text-primary)] hidden md:inline">
                {profile.full_name || 'Guna'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showUserMenu && (
              <div 
                onMouseLeave={() => setShowUserMenu(false)}
                className="absolute right-0 top-full mt-1.5 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1.5 shadow-xl z-50"
              >
                <div className="px-2.5 py-1.5 border-b border-[var(--border)] mb-1">
                  <div className="font-bold text-xs text-[var(--text-primary)]">{profile.full_name || 'Guna'}</div>
                  <div className="text-[10px] text-cyan-400 font-mono">{explanationLevel} mode</div>
                </div>
                <button
                  onClick={() => {
                    onNavigate?.('settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800/40 cursor-pointer"
                >
                  Preferences & Settings
                </button>
                <button
                  onClick={() => {
                    onNavigate?.('admin');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800/40 cursor-pointer"
                >
                  Knowledge Portal
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
