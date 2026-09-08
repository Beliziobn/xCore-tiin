import React, { useState, useMemo } from 'react';
import { Sparkles, Check, ChevronDown, MapPin, FileText, Phone, Info } from 'lucide-react';
import { getAutofillProfiles, type AutofillProfile } from '../../utils/smartAutofill';

interface SmartAutofillBarProps {
  context: 'student' | 'teacher' | 'director' | 'school';
  onApplyProfile: (profile: AutofillProfile) => void;
  className?: string;
}

export const SmartAutofillBar: React.FC<SmartAutofillBarProps> = ({
  context,
  onApplyProfile,
  className = '',
}) => {
  const profiles = useMemo(() => getAutofillProfiles(context), [context]);
  const [selectedId, setSelectedId] = useState<string>(profiles[0]?.id || '');
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const selectedProfile = useMemo(() => {
    return profiles.find((p) => p.id === selectedId) || profiles[0];
  }, [profiles, selectedId]);

  const handleApply = (profileToApply: AutofillProfile) => {
    onApplyProfile(profileToApply);
    setAppliedNotification(
      `Dados preenchidos com sucesso a partir de "${profileToApply.fullName}".`
    );
    setTimeout(() => {
      setAppliedNotification(null);
    }, 4000);
  };

  if (profiles.length === 0) return null;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all shadow-2xs ${className}`}
    >
      {/* Header with natural flow */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#002133] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight text-slate-900">
                Preenchimento Inteligente
              </span>
              <span className="text-[10px] bg-slate-200/80 text-slate-700 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                Auxiliar
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-normal">
              Carregue os dados de residência, documento e contactos a partir de um perfil registado.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
          title={isExpanded ? 'Recolher opções' : 'Expandir opções'}
        >
          <span className="hidden sm:inline">{isExpanded ? 'Minimizar' : 'Opções'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="mt-3.5 pt-3 border-t border-slate-200/70 space-y-3">
          {/* Selector and Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#002133] focus:border-[#002133] shadow-2xs appearance-none cursor-pointer pr-8"
              >
                {profiles.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.label} — {prof.subtitle}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => selectedProfile && handleApply(selectedProfile)}
              className="px-4 py-2 bg-[#002133] hover:bg-slate-900 active:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Preencher com este Perfil</span>
            </button>
          </div>

          {/* Quick Preview Chips of Selected Profile */}
          {selectedProfile && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 shrink-0 text-[11px] uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-[#002133]" />
                Dados a preencher:
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md text-slate-800 font-mono text-[11px]">
                <FileText className="w-3 h-3 text-slate-500" />
                {selectedProfile.documentNumber}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md text-slate-800 text-[11px]">
                <MapPin className="w-3 h-3 text-slate-500" />
                {selectedProfile.address} ({selectedProfile.municipality})
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md text-slate-800 text-[11px]">
                <Phone className="w-3 h-3 text-slate-500" />
                {selectedProfile.phone}
              </span>
            </div>
          )}

          {/* Success Banner */}
          {appliedNotification && (
            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs font-medium animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white shrink-0" />
                <span>{appliedNotification}</span>
              </div>
              <button
                type="button"
                onClick={() => setAppliedNotification(null)}
                className="text-[11px] font-semibold text-slate-300 hover:text-white cursor-pointer underline"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
