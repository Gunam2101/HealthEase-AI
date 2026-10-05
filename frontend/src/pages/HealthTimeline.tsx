import React, { useEffect, useState } from 'react';
import { 
  Clock, MessageSquare, FileSearch, BookOpen, Wand2, 
  Stethoscope, Pill, Calendar, RefreshCw, Sparkles, CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api';
import { TimelineEvent } from '../types';

export const HealthTimeline: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHealthTimeline();
      setEvents(data.events || []);
    } catch (err: any) {
      console.error('Failed to load timeline:', err);
      setError('Unable to load timeline. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (iconType: string) => {
    switch (iconType) {
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case 'report':
        return <FileSearch className="w-4 h-4 text-indigo-400" />;
      case 'dictionary':
        return <BookOpen className="w-4 h-4 text-teal-400" />;
      case 'simplify':
        return <Wand2 className="w-4 h-4 text-purple-400" />;
      case 'symptoms':
        return <Stethoscope className="w-4 h-4 text-emerald-400" />;
      case 'medicine':
        return <Pill className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
    }
  };

  // Group events by date_group ('Today', 'Yesterday', 'Earlier')
  const groups = ['Today', 'Yesterday', 'Earlier'];
  const groupedEvents: Record<string, TimelineEvent[]> = {
    Today: events.filter(e => e.date_group === 'Today'),
    Yesterday: events.filter(e => e.date_group === 'Yesterday'),
    Earlier: events.filter(e => e.date_group === 'Earlier'),
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>ACTIVITY CHRONOLOGY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Health Timeline
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            A privacy-conscious chronological view of your recent inquiries, report evaluations, and health learning milestones.
          </p>
        </div>

        <button
          onClick={loadTimeline}
          disabled={loading}
          className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
          title="Refresh timeline"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Privacy note */}
      <div className="p-3 rounded-xl bg-slate-900/40 border border-[var(--border)] text-[11px] text-slate-400 flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>Educational activity history only. No sensitive personal diagnostic health records are tracked.</span>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span>Loading your activity timeline...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <Clock className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No timeline events yet</p>
          <p className="text-xs text-slate-400">Ask a question or analyze a report to begin building your learning timeline.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => {
            const groupList = groupedEvents[group] || [];
            if (groupList.length === 0) return null;

            return (
              <div key={group} className="space-y-4">
                
                {/* Date Group Header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold text-cyan-300">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{group}</span>
                  </div>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>

                {/* Timeline Cards */}
                <div className="relative pl-6 sm:pl-8 space-y-4 border-l-2 border-slate-800 dark:border-slate-800 ml-3 sm:ml-4">
                  {groupList.map((evt) => (
                    <div key={evt.id} className="relative group">
                      
                      {/* Timeline Node Dot */}
                      <div className="absolute -left-[31px] sm:-left-[39px] top-3.5 w-4 h-4 rounded-full bg-[var(--surface)] border-2 border-cyan-400 flex items-center justify-center shadow-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      </div>

                      {/* Card Content */}
                      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] group-hover:border-cyan-500/40 transition-all shadow-sm space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                              {getEventIcon(evt.icon_type)}
                            </div>
                            <span className="text-xs font-bold text-[var(--text-primary)]">
                              {evt.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                              {evt.category}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {evt.time}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed pl-9">
                          {evt.description}
                        </p>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
