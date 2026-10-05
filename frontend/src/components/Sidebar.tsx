import React, { useState } from 'react';
import { 
  Home, Bot, Stethoscope, Pill, FileSearch, BookOpen, Wand2, 
  GraduationCap, Newspaper, Clock, ShieldCheck, HeartPulse, Settings, 
  ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenEmergency?: () => void;
}

interface NavSection {
  title: string;
  items: Array<{
    id: string;
    labelKey: string;
    fallbackLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    isEmergency?: boolean;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  onOpenEmergency
}) => {
  const { t } = useLanguage();
  const [showMobileMore, setShowMobileMore] = useState(false);

  const sections: NavSection[] = [
    {
      title: 'MAIN',
      items: [
        { id: 'home', labelKey: 'home', fallbackLabel: 'Dashboard', icon: Home },
        { id: 'assistant', labelKey: 'assistant', fallbackLabel: 'AI Assistant', icon: Bot, badge: 'AI' },
        { id: 'symptoms', labelKey: 'symptoms', fallbackLabel: 'Symptom Checker', icon: Stethoscope },
        { id: 'medicine', labelKey: 'medicine', fallbackLabel: 'Medicine Information', icon: Pill },
        { id: 'report_analyzer', labelKey: 'report_analyzer', fallbackLabel: 'Report Analyzer', icon: FileSearch },
        { id: 'medical_dict', labelKey: 'medical_dict', fallbackLabel: 'Medical Dictionary', icon: BookOpen },
        { id: 'simplify_text', labelKey: 'simplify_text', fallbackLabel: 'Simplify Text', icon: Wand2 },
        { id: 'health_education', labelKey: 'health_education', fallbackLabel: 'Health Education', icon: GraduationCap },
        { id: 'news', labelKey: 'health_news', fallbackLabel: 'Health News', icon: Newspaper, badge: 'LIVE' },
      ]
    },
    {
      title: 'TOOLS',
      items: [
        { id: 'timeline', labelKey: 'timeline', fallbackLabel: 'Health Timeline', icon: Clock },
        { id: 'sources', labelKey: 'sources', fallbackLabel: 'Trusted Resources', icon: ShieldCheck },
        { id: 'emergency', labelKey: 'emergency', fallbackLabel: 'Emergency Help', icon: HeartPulse, isEmergency: true },
        { id: 'settings', labelKey: 'settings', fallbackLabel: 'Settings', icon: Settings },
      ]
    }
  ];

  // Mobile Bottom Bar Primary Tabs
  const mobilePrimaryTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'assistant', label: 'AI', icon: Bot },
    { id: 'symptoms', label: 'Symptoms', icon: Stethoscope },
    { id: 'report_analyzer', label: 'Reports', icon: FileSearch },
  ];

  const handleItemClick = (id: string, isEmergency?: boolean) => {
    if (isEmergency) {
      if (onOpenEmergency) onOpenEmergency();
      setShowMobileMore(false);
      return;
    }
    onNavigate(id);
    setShowMobileMore(false);
  };

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-300 relative select-none ${
          isCollapsed ? 'w-18' : 'w-60 lg:w-64'
        }`}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-slate-400 hover:text-cyan-400 flex items-center justify-center hover:scale-105 transition-all shadow-md cursor-pointer z-20"
          title={isCollapsed ? "Expand Navigation" : "Collapse Navigation"}
          aria-label={isCollapsed ? "Expand Navigation" : "Collapse Navigation"}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Categorized Navigation */}
        <div className="py-4 px-3 flex-1 overflow-y-auto space-y-5">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              
              {/* Section Header */}
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
              )}

              {/* Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  const label = t(item.labelKey) || item.fallbackLabel;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id, item.isEmergency)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative cursor-pointer ${
                        item.isEmergency
                          ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20'
                          : isActive
                          ? 'bg-cyan-500/15 text-cyan-400 font-semibold dark:bg-cyan-500/15 dark:text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 dark:hover:bg-slate-800/50'
                      }`}
                      title={isCollapsed ? label : undefined}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-cyan-400" />
                      )}

                      <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                        item.isEmergency
                          ? 'text-rose-400'
                          : isActive 
                          ? 'text-cyan-400' 
                          : 'text-slate-400 group-hover:text-cyan-300'
                      }`} />

                      {!isCollapsed && (
                        <span className="flex-1 text-left truncate flex items-center justify-between">
                          <span className="truncate">{label}</span>
                          {item.badge && (
                            <span className="ml-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {item.badge}
                            </span>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 border-t border-[var(--border)] backdrop-blur-xl px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {mobilePrimaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}

        {/* More Menu Trigger */}
        <button
          onClick={() => setShowMobileMore(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            showMobileMore ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </div>

      {/* Mobile "More" Drawer / Modal */}
      {showMobileMore && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-150">
          <div className="bg-[var(--surface)] border-t border-[var(--border)] rounded-t-3xl p-5 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <span className="text-sm font-bold text-[var(--text-primary)]">All HealthEase Tools</span>
              <button
                onClick={() => setShowMobileMore(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleItemClick('medicine')}
                className="p-3 rounded-xl bg-slate-900/50 border border-[var(--border)] flex items-center gap-2.5 text-left text-slate-200"
              >
                <Pill className="w-4 h-4 text-amber-400" />
                <span>Medicine Info</span>
              </button>

              <button
                onClick={() => handleItemClick('medical_dict')}
                className="p-3 rounded-xl bg-slate-900/50 border border-[var(--border)] flex items-center gap-2.5 text-left text-slate-200"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Medical Dictionary</span>
              </button>

              <button
                onClick={() => handleItemClick('simplify_text')}
                className="p-3 rounded-xl bg-slate-900/50 border border-[var(--border)] flex items-center gap-2.5 text-left text-slate-200"
              >
                <Wand2 className="w-4 h-4 text-purple-400" />
                <span>Simplify Text</span>
              </button>

              <button
                onClick={() => handleItemClick('health_education')}
                className="p-3 rounded-xl bg-slate-900/50 border border-[var(--border)] flex items-center gap-2.5 text-left text-slate-200"
              >
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>Health Education</span>
              </button>

              <button
                onClick={() => handleItemClick('news')}
                className="p-3 rounded-xl bg-slate-900/50 border border-cyan-500/30 flex items-center gap-2.5 text-left text-slate-200"
              >
                <Newspaper className="w-4 h-4 text-cyan-400" />
                <span>Health News</span>
              </button>

              <button
                onClick={() => handleItemClick('timeline')}
                className="p-3 rounded-xl bg-slate-900/50 border border-[var(--border)] flex items-center gap-2.5 text-left text-slate-200"
              >
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Health Timeline</span>
              </button>

              <button
                onClick={() => handleItemClick('sources')}
                className="p-3 rounded-xl bg-slate-900/50 border border-[var(--border)] flex items-center gap-2.5 text-left text-slate-200"
              >
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Trusted Sources</span>
              </button>

              <button
                onClick={() => handleItemClick('settings')}
                className="p-3 rounded-xl bg-slate-900/50 border border-[var(--border)] flex items-center gap-2.5 text-left text-slate-200"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => handleItemClick('emergency', true)}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-left text-rose-300 font-bold"
              >
                <HeartPulse className="w-4 h-4 text-rose-400" />
                <span>Emergency Help</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
