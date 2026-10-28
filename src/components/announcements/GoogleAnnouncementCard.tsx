import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  School, 
  MoreVertical, 
  Edit3, 
  RotateCcw, 
  Lock, 
  Unlock, 
  Trash2, 
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Eye,
  Info
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
  onViewDetails?: (announcement: SchoolAnnouncement) => void;
  isAdminView?: boolean;
  compact?: boolean;
}

// Format readable date range: e.g. "15 mar - 30 mar · 23:59"
function formatDateRange(startDateStr?: string, endDateStr?: string): string {
  try {
    if (!endDateStr) return 'Prazo regulamentar';
    const end = new Date(endDateStr);
    
    let start: Date;
    if (startDateStr) {
      start = new Date(startDateStr);
    } else {
      start = new Date(end.getTime() - 14 * 24 * 60 * 60 * 1000);
    }

    const startDay = start.getDate().toString().padStart(2, '0');
    const startMonth = start.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    
    const endDay = end.getDate().toString().padStart(2, '0');
    const endMonth = end.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const endHours = end.getHours().toString().padStart(2, '0');
    const endMinutes = end.getMinutes().toString().padStart(2, '0');

    return `${startDay} ${startMonth} - ${endDay} ${endMonth} · ${endHours}:${endMinutes}`;
  } catch {
    return 'Prazo em vigor';
  }
}

// Calculate elapsed percentage of deadline window
function getDeadlineProgress(startDateStr?: string, endDateStr?: string): number {
  try {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr).getTime();
    let start: number;
    if (startDateStr) {
      start = new Date(startDateStr).getTime();
    } else {
      start = end - 14 * 24 * 60 * 60 * 1000;
    }
    const now = Date.now();
    
    if (end <= start) return 100;
    if (now >= end) return 100;
    if (now <= start) return 0;

    const pct = ((now - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  } catch {
    return 50;
  }
}

// Countdown string
function getRemainingTimeText(endDateStr: string, isExpired: boolean): string {
  if (isExpired) return 'Prazo encerrado';
  try {
    const end = new Date(endDateStr).getTime();
    const diffMs = end - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffDays > 1) return `Termina em ${diffDays} dias`;
    if (diffHours > 1) return `Termina em ${diffHours} horas`;
    if (diffHours > 0) return 'Termina em menos de 1h';
    return 'Termina hoje';
  } catch {
    return 'Em andamento';
  }
}

export const GoogleAnnouncementCard: React.FC<GoogleAnnouncementCardProps> = ({
  announcement,
  onEdit,
  onDelete,
  onToggleExpireNow,
  onExtendDeadline,
  onActionClick,
  onViewDetails,
  isAdminView = false,
  compact = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isExpired = isAnnouncementExpired(announcement);
  const progressPct = getDeadlineProgress(announcement.createdAt, announcement.expirationDate);
  const dateRangeText = formatDateRange(announcement.createdAt, announcement.expirationDate);
  const remainingTimeText = getRemainingTimeText(announcement.expirationDate, isExpired);

  const formattedExpDate = new Date(announcement.expirationDate).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Secondary explanation for expired lock
  const blockExplanation = announcement.demandType === 'notas'
    ? `Lançamento de notas bloqueado em ${formattedExpDate} por conformidade regimental.`
    : announcement.demandType === 'matriculas'
    ? `Novas matrículas bloqueadas em ${formattedExpDate} por encerramento de período.`
    : `Prazo de vigência do edital concluído em ${formattedExpDate}.`;

  const demandBadge = {
    notas: { label: 'Notas', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    matriculas: { label: 'Matrículas', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    geral: { label: 'Geral', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  }[announcement.demandType] || { label: 'Oficial', bg: 'bg-slate-100 text-slate-700 border-slate-200' };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handlePrimaryClick = () => {
    if (onActionClick) {
      onActionClick(announcement);
    } else if (onViewDetails) {
      onViewDetails(announcement);
    }
  };

  return (
    <article
      id={`edital-card-${announcement.id}`}
      className={`relative bg-white rounded-2xl border transition-all duration-200 ${
        isExpired 
          ? 'border-slate-200/90 bg-slate-50/40 shadow-2xs hover:border-slate-300' 
          : 'border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-md'
      } ${compact ? 'p-4' : 'p-5 sm:p-6'}`}
    >
      {/* 1. Header: Title, Category, Status Tag and ... Menu */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {/* Category tag */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${demandBadge.bg}`}>
              {demandBadge.label}
            </span>

            {/* Status tag */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                isExpired
                  ? 'bg-amber-50/80 text-amber-800 border-amber-200/70'
                  : progressPct > 80
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isExpired ? (
                <Lock className="w-3 h-3 text-amber-700 shrink-0" />
              ) : (
                <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
              )}
              <span>{remainingTimeText}</span>
            </span>
          </div>

          {/* Title in Sigre dark navy (#002133) */}
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#002133] leading-snug">
            <button
              type="button"
              onClick={handlePrimaryClick}
              className="text-left hover:text-[#f75142] transition-colors cursor-pointer"
            >
              {announcement.title}
            </button>
          </h3>
        </div>

        {/* Administrative ... Menu (Right corner) */}
        {isAdminView && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Ações administrativas do edital"
              aria-label="Opções administrativas"
              aria-expanded={isMenuOpen}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-9 z-30 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-100 text-xs text-slate-700">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                  Gestão do Edital
                </div>

                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(announcement);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Editar edital</span>
                  </button>
                )}

                {onExtendDeadline && !isExpired && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onExtendDeadline(announcement, 7);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                    <span>Prorrogar prazo (+7 dias)</span>
                  </button>
                )}

                {onToggleExpireNow && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onToggleExpireNow(announcement);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    {isExpired ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Reativar no sistema</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-amber-800">Simular bloqueio agora</span>
                      </>
                    )}
                  </button>
                )}

                {onDelete && (
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDelete(announcement.id);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Excluir edital</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Main Body Grid: Details & Deadline Block on Left, Cover on Right */}
      <div className="flex flex-col md:flex-row items-stretch md:items-start gap-4 sm:gap-6">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Heart of the Card: Dedicated Deadline Block */}
          <div className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-3 sm:p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-[11px] sm:text-xs">
                  {dateRangeText}
                </span>
              </div>

              <span className={`text-[11px] font-bold ${
                isExpired ? 'text-slate-500' : progressPct > 80 ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                {isExpired ? '100% transcorrido' : `${progressPct}% do prazo`}
              </span>
            </div>

            {/* Subtle Progress Bar */}
            <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isExpired
                    ? 'bg-slate-400'
                    : progressPct > 85
                    ? 'bg-rose-500'
                    : progressPct > 65
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Description Snippet (Max 2 lines) */}
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {announcement.description}
          </p>

          {/* Meta Information Bar: Target Schools & Secondary info */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 bg-slate-100/80 border border-slate-200/60 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-700">
              <School className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{announcement.targetSchools}</span>
            </span>

            {announcement.viewsCount !== undefined && announcement.viewsCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 px-1">
                <Eye className="w-3 h-3 text-slate-400" />
                <span>{announcement.viewsCount} consultas</span>
              </span>
            )}
          </div>

          {/* Secondary explanation if expired (Does NOT cover the card) */}
          {isExpired && (
            <div className="pt-1">
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 italic">
                <Info className="w-3 h-3 text-amber-600 shrink-0 not-italic" />
                <span>{blockExplanation}</span>
              </p>
            </div>
          )}
        </div>

        {/* Cover Image Thumbnail (Right side on desktop, stacked on mobile) */}
        {announcement.coverImage && (
          <div className="w-full md:w-44 lg:w-48 shrink-0 aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group/thumb shadow-2xs self-start">
            <img
              src={announcement.coverImage}
              alt={announcement.title}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105 ${
                isExpired ? 'opacity-80 grayscale-[25%]' : ''
              }`}
              loading="lazy"
            />
            {isExpired && (
              <div className="absolute bottom-2 right-2">
                <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded">
                  Encerrado
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Highlighted Primary Action Button at bottom */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-[11px] text-slate-400 hidden sm:block">
          Publicado por <strong className="text-slate-600 font-medium">{announcement.createdBy}</strong>
        </div>

        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
          {onViewDetails && (
            <button
              type="button"
              onClick={() => onViewDetails(announcement)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ver regulamento</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrimaryClick}
            className={`w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-2 ${
              isExpired
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs'
                : 'bg-[#002133] hover:bg-[#001726] text-white shadow-xs hover:shadow-md active:scale-98'
            }`}
          >
            {isExpired ? (
              <>
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>Consultar histórico</span>
              </>
            ) : (
              <>
                <span>{announcement.ctaText || 'Consultar edital'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

