import React from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert, X } from 'lucide-react';
import { SafetyAlert } from '../types';

interface SafetyBannerProps {
  alert?: SafetyAlert | null;
  onDismiss?: () => void;
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({ alert, onDismiss }) => {
  // If emergency or crisis alert is active, show high-visibility critical alert
  if (alert && !alert.is_safe && alert.severity === 'critical') {
    const isEmergency = alert.risk_category === 'Emergency';
    return (
      <div className={`w-full p-4 mb-4 rounded-2xl border ${
        isEmergency 
          ? 'bg-rose-950/80 border-rose-500/50 text-rose-100 shadow-xl shadow-rose-950/50' 
          : 'bg-indigo-950/80 border-indigo-500/50 text-indigo-100 shadow-xl shadow-indigo-950/50'
      } backdrop-blur-md animate-pulse-slow`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${isEmergency ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-300'}`}>
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-lg flex items-center gap-2">
                {isEmergency ? 'Immediate Medical Attention Recommended' : 'Support is Available 24/7'}
              </h4>
              <p className="text-sm mt-1 text-slate-200 leading-relaxed max-w-3xl">
                {alert.warning_message}
              </p>
              {alert.helpline_contacts && alert.helpline_contacts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {alert.helpline_contacts.map((contact, idx) => (
                    <a
                      key={idx}
                      href={`tel:${contact.number.replace(/[^\d+]/g, '')}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all border border-white/20"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-cyan-300" />
                      <span>{contact.name}: <strong className="text-cyan-200">{contact.number}</strong></span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Prescription dosage warning
  if (alert && alert.risk_category === 'Prescription') {
    return (
      <div className="w-full p-4 mb-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            <span className="font-semibold text-amber-300">Medication Policy Notice: </span>
            {alert.warning_message}
          </div>
        </div>
      </div>
    );
  }

  // Default subtle universal disclaimer
  return (
    <aside aria-label="Medical Disclaimer" className="w-full py-2 px-4 rounded-xl bg-slate-900/40 border border-cyan-500/10 text-slate-400 text-xs flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span>
          <strong>HealthEase AI</strong> provides general health information for educational purposes and does not replace professional medical advice, diagnosis, or treatment.
        </span>
      </div>
      <span className="hidden md:inline text-slate-500 font-mono text-[10px]">
        v1.0 • Educational Assistant
      </span>
    </aside>
  );
};
