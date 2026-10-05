import React from 'react';
import { ShieldAlert, PhoneCall, AlertTriangle, X, ExternalLink, HeartPulse } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const emergencyServices = [
    { country: 'Universal / India', number: '112', desc: 'National Unified Emergency Dispatch', isPrimary: true },
    { country: 'Medical Ambulance (India)', number: '108', desc: 'Immediate Medical & Trauma Response' },
    { country: 'United States & Canada', number: '911', desc: 'Police, Fire & Emergency Medical Services' },
    { country: 'United Kingdom', number: '999', desc: 'Emergency Dispatch' },
    { country: 'European Union Standard', number: '112', desc: 'Universal European Emergency Number' },
    { country: 'Mental Health Crisis (US)', number: '988', desc: 'Suicide & Crisis Lifeline (24/7 Free & Confidential)' },
  ];

  const warningSymptoms = [
    'Sudden chest pressure, crushing pain, or radiating discomfort to arm/jaw',
    'Severe sudden difficulty breathing or inability to speak full sentences',
    'Sudden facial droop, arm weakness, or slurred speech (Signs of Stroke)',
    'Uncontrollable bleeding or severe physical trauma',
    'Sudden loss of consciousness or severe confusion',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl glass-panel border border-rose-500/40 p-6 sm:p-8 bg-[#0B0F19]/95 text-slate-100 shadow-2xl shadow-rose-950/60 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Emergency Medical Guidance
            </h2>
            <p className="text-xs sm:text-sm text-rose-300 font-medium">
              If you or someone around you needs immediate help, do not wait.
            </p>
          </div>
        </div>

        {/* Primary Call to Action Alert */}
        <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/30 text-rose-200 text-sm leading-relaxed mb-6">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">HealthEase AI is an educational tool, NOT an emergency diagnostic provider.</strong>
              <p className="mt-1 text-xs text-rose-200/90">
                Call your local emergency telephone number immediately or proceed directly to the nearest hospital emergency department.
              </p>
            </div>
          </div>
        </div>

        {/* Verified Emergency Numbers */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            Verified Emergency Contacts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {emergencyServices.map((service, idx) => (
              <a
                key={idx}
                href={`tel:${service.number}`}
                className={`p-3.5 rounded-2xl flex items-center justify-between transition-all group ${
                  service.isPrimary
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-white'
                    : 'bg-slate-900/60 hover:bg-slate-800 border border-white/10 text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                    <span>{service.country}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{service.desc}</p>
                </div>
                <div className="flex items-center gap-2 pl-3">
                  <span className="font-mono text-lg font-extrabold text-cyan-300 group-hover:scale-105 transition-transform">
                    {service.number}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center group-hover:bg-cyan-400 group-hover:text-slate-950 transition-colors">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Critical Symptoms Checklist */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 mb-6">
          <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-cyan-400" />
            <span>Seek Immediate Emergency Care For:</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {warningSymptoms.map((sym, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span>{sym}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
