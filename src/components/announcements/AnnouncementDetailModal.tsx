import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  School, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Building2,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { SchoolAnnouncement } from '../../types';
import { isAnnouncementExpired } from '../../utils/announcementStorage';

interface AnnouncementDetailModalProps {
  announcement: SchoolAnnouncement | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSection?: (announcement: SchoolAnnouncement) => void;
}

export const AnnouncementDetailModal: React.FC<AnnouncementDetailModalProps> = ({
  announcement,
  isOpen,
  onClose,
  onNavigateToSection,
}) => {
  if (!isOpen || !announcement) return null;

  const isExpired = isAnnouncementExpired(announcement);
  const expirationDate = new Date(announcement.expirationDate);
  const formattedExpDate = expirationDate.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const createdDate = new Date(announcement.createdAt);
  const formattedCreatedDate = createdDate.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Calculate remaining time
  const now = new Date().getTime();
  const diffMs = expirationDate.getTime() - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  let timeRemainingText = '';
  if (isExpired) {
    timeRemainingText = 'Prazo expirado e bloqueado';
  } else if (diffDays > 1) {
    timeRemainingText = `Faltam ${diffDays} dias para o encerramento`;
  } else if (diffHours > 0) {
    timeRemainingText = `Faltam ${diffHours} horas para o encerramento`;
  } else {
    timeRemainingText = 'Encerra hoje!';
  }

  const demandLabels = {
    notas: { label: 'Lançamento de Notas', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    matriculas: { label: 'Matrículas & Vagas', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    geral: { label: 'Circular Institucional', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  };

  const priorityLabels = {
    urgente: { label: 'Urgente', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    alta: { label: 'Alta Prioridade', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    normal: { label: 'Informativo', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  };

  const demandInfo = demandLabels[announcement.demandType] || demandLabels.geral;
  const priorityInfo = priorityLabels[announcement.priority || 'alta'];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Institutional Header Strip */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/10">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  {announcement.badgeText || 'Circular Oficial • MED'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white truncate max-w-md">
                {announcement.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar edital"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cover Image banner if available */}
        {announcement.coverImage && (
          <div className="w-full h-48 sm:h-56 bg-slate-100 relative overflow-hidden border-b border-slate-200">
            <img 
              src={announcement.coverImage} 
              alt={announcement.headline}
              className={`w-full h-full object-cover ${isExpired ? 'grayscale opacity-75' : ''}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${demandInfo.color}`}>
                  {demandInfo.label}
                </span>
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${priorityInfo.color}`}>
                  {priorityInfo.label}
                </span>
                {isExpired ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                    <Lock className="w-3 h-3" /> Prazo Encerrado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 text-white shadow-xs">
                    <Clock className="w-3 h-3" /> {timeRemainingText}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {!announcement.coverImage && (
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${demandInfo.color}`}>
                {demandInfo.label}
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${priorityInfo.color}`}>
                {priorityInfo.label}
              </span>
              {isExpired ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                  <Lock className="w-3 h-3" /> Prazo Encerrado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Clock className="w-3 h-3" /> {timeRemainingText}
                </span>
              )}
            </div>
          )}

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {announcement.headline}
            </h2>
            <p className="mt-1 text-xs text-slate-500 font-mono">
              Origem: {announcement.displayUrl}
            </p>
          </div>

          {/* Description text */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80">
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {announcement.description}
            </p>
          </div>

          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
              <School className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-600">
                  Âmbito e Unidades
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5">
                  {announcement.targetSchools}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
              <Calendar className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-600">
                  Prazo Oficial Limite
                </span>
                <p className={`text-xs sm:text-sm font-bold mt-0.5 ${isExpired ? 'text-rose-600' : 'text-slate-900'}`}>
                  {formattedExpDate}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-600">
                  Publicado por
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5">
                  {announcement.createdBy} em {formattedCreatedDate}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
              <FileText className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-600">
                  Impacto Operacional
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5">
                  {isExpired 
                    ? 'Bloqueio estrito no sistema ativado' 
                    : 'Sistema aberto para lançamento regular'}
                </p>
              </div>
            </div>
          </div>

          {/* Expiration warning banner if expired */}
          {isExpired && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs sm:text-sm text-rose-800">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Atenção: Prazo Regulamentar Encerrado</strong>
                <p className="mt-1 leading-relaxed text-rose-700">
                  Por determinação superior, novas submissões ou alterações de {announcement.demandType === 'notas' ? 'notas' : 'matrículas'} estão temporariamente bloqueadas. Para solicitar prorrogação excecional, contacte o Administrador Municipal.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Fechar Visualização
          </button>

          {onNavigateToSection && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToSection(announcement);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#002133] hover:bg-[#00314d] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>{announcement.ctaText || 'Aceder ao Módulo Correspondente'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
