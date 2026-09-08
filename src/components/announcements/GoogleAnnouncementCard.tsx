import React from 'react';
import { 
  Lock, 
  Unlock, 
  School, 
  Clock, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  ExternalLink,
  ChevronRight,
  Calendar,
  AlertCircle,
  Eye,
  MousePointer
} from 'lucide-react';
import { SchoolAnnouncement } from '../../types';
import { isAnnouncementExpired } from '../../utils/announcementStorage';

interface GoogleAnnouncementCardProps {
  announcement: SchoolAnnouncement;
  onEdit?: (announcement: SchoolAnnouncement) => void;
  onDelete?: (id: string) => void;
  onToggleExpireNow?: (announcement: SchoolAnnouncement) => void;
  onExtendDeadline?: (announcement: SchoolAnnouncement, days: number) => void;
  onActionClick?: (announcement: SchoolAnnouncement) => void;
  isAdminView?: boolean;
  compact?: boolean;
}

export const GoogleAnnouncementCard: React.FC<GoogleAnnouncementCardProps> = ({
  announcement,
  onEdit,
  onDelete,
  onToggleExpireNow,
  onExtendDeadline,
  onActionClick,
  isAdminView = false,
  compact = false,
}) => {
  const isExpired = isAnnouncementExpired(announcement);
  const expirationDate = new Date(announcement.expirationDate);
  const formattedExpDate = expirationDate.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate remaining time
  const now = new Date().getTime();
  const diffMs = expirationDate.getTime() - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  let timeRemainingText = '';
  if (isExpired) {
    timeRemainingText = 'Prazo expirado';
  } else if (diffDays > 1) {
    timeRemainingText = `Expira em ${diffDays} dias`;
  } else if (diffHours > 0) {
    timeRemainingText = `Expira em ${diffHours} horas`;
  } else {
    timeRemainingText = 'Expira hoje';
  }

  const demandBadge = {
    notas: { label: 'Pauta de Notas', badge: 'Notas' },
    matriculas: { label: 'Matrículas & Vagas', badge: 'Matrículas' },
    geral: { label: 'Comunicado Geral', badge: 'Geral' },
  }[announcement.demandType] || { label: 'Demanda Oficial', badge: 'Oficial' };

  return (
    <article
      id={`google-ad-${announcement.id}`}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 ${
        isExpired 
          ? 'border-slate-200/90 bg-slate-50/50 shadow-2xs' 
          : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
      } ${compact ? 'p-4' : 'p-5 sm:p-6'}`}
    >
      {/* Header: Google-style Attribution & Origin */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Favicon avatar */}
          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-[10px] font-black text-slate-700">
            {announcement.demandType === 'notas' ? 'N' : announcement.demandType === 'matriculas' ? 'M' : 'E'}
          </div>

          <div className="flex items-center gap-2 min-w-0 text-xs text-slate-600">
            <span className="font-semibold text-slate-900 truncate">
              {announcement.title}
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="font-mono text-[11px] text-slate-500 truncate hidden sm:inline max-w-xs">
              {announcement.displayUrl}
            </span>
          </div>
        </div>

        {/* Google Sponsored / Official Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
            {announcement.badgeText || 'Anúncio Oficial'}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
            isExpired
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {isExpired ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
            <span>{isExpired ? 'Bloqueado' : timeRemainingText}</span>
          </span>
        </div>
      </div>

      {/* Main Content Layout: Text details on left, Cover on right */}
      <div className="flex flex-col md:flex-row items-start gap-4 sm:gap-6">
        <div className="flex-1 min-w-0">
          {/* Headline link */}
          <h3 className="text-base sm:text-lg font-bold tracking-tight leading-snug">
            <button
              type="button"
              onClick={() => onActionClick && onActionClick(announcement)}
              className={`text-left transition-colors cursor-pointer ${
                isExpired 
                  ? 'text-slate-600 line-through decoration-slate-400' 
                  : 'text-[#1a73e8] hover:text-[#1557b0] hover:underline'
              }`}
            >
              {announcement.headline}
            </button>
          </h3>

          {/* Description snippet */}
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
            {announcement.description}
          </p>

          {/* Sitelinks / Extensions Bar */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-700">
              <School className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate max-w-[220px]">{announcement.targetSchools}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-700">
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Prazo: <strong className="text-slate-900">{formattedExpDate}</strong></span>
            </span>

            <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded text-[11px] font-bold">
              {demandBadge.label}
            </span>

            {onActionClick && (
              <button
                type="button"
                onClick={() => onActionClick(announcement)}
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-[#1a73e8] hover:text-[#1557b0] transition-colors cursor-pointer"
              >
                <span>{announcement.ctaText || 'Acessar no Sistema'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Cover Image Thumbnail */}
        {announcement.coverImage && (
          <div className="w-full md:w-44 lg:w-48 shrink-0 aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group/thumb shadow-2xs">
            <img
              src={announcement.coverImage}
              alt={announcement.title}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105 ${
                isExpired ? 'grayscale opacity-75' : ''
              }`}
              loading="lazy"
            />
            {isExpired && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-2">
                <Lock className="w-4 h-4 text-amber-300 mb-0.5" />
                <span className="text-[10px] font-bold tracking-wider uppercase bg-rose-600 px-1.5 py-0.5 rounded">
                  Encerrado
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notice alert when expired */}
      {isExpired && (
        <div className="mt-3.5 p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-700">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <p>
            Demanda encerrada em <strong>{formattedExpDate}</strong>. O lançamento de {announcement.demandType === 'notas' ? 'notas' : 'matrículas'} está suspenso para conformidade regimental.
          </p>
        </div>
      )}

      {/* Admin Operations Bar */}
      {isAdminView && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Criado por: <span className="text-slate-700 font-medium">{announcement.createdBy}</span></span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3 h-3 text-slate-400" />
              <span>{announcement.viewsCount || 0} visualizações</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Expire Button */}
            {onToggleExpireNow && (
              <button
                type="button"
                onClick={() => onToggleExpireNow(announcement)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  isExpired
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
                title={isExpired ? "Liberar novamente no sistema" : "Forçar bloqueio para simular prazo expirado"}
              >
                {isExpired ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span>{isExpired ? 'Reativar' : 'Simular Bloqueio'}</span>
              </button>
            )}

            {/* Extend 7 days */}
            {onExtendDeadline && !isExpired && (
              <button
                type="button"
                onClick={() => onExtendDeadline(announcement, 7)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                title="Prorrogar prazo em 7 dias"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>+7 Dias</span>
              </button>
            )}

            {/* Edit */}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(announcement)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3 text-slate-400" />
                <span>Editar</span>
              </button>
            )}

            {/* Delete */}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(announcement.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Remover anúncio"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
};
