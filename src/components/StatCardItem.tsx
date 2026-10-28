import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export interface StatCardData {
  id: string;
  title: string;
  value: string | number;
  icon?: string;
  isClickable?: boolean;
  actionText?: string;
  subtitle?: string;
}

export interface StatCardItemProps {
  card: StatCardData;
  onSelect?: (card: StatCardData) => void;
  id?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentages?: boolean;
  featured?: boolean;
}

/**
 * StatCardItem — Masakula v2.0 + Prompt Mestre v4 KPI Anatomy:
 * - Zero "Card-in-Card" nested gray boxes ($D_{max} \le 1$)
 * - Zero decorative floating icon tiles or redundant "Total" / "Taxa %" pills inside KPI cards
 * - Maximum 1 `.kpi--featured` dark anchor card (`--ink: #002133`) per grid; all others `--surface: #ffffff` with `1px solid var(--line)`
 * - Secondary outline action button (`.btn--secondary`) on standard cards so dark filled buttons never repeat across grids
 */
export const StatCardItem: React.FC<StatCardItemProps> = ({
  card,
  onSelect,
  id,
  className = '',
  size = 'md',
  featured = false,
}) => {
  const isClickable = card.isClickable !== false;
  const elementId = id || `stat-card-${card.id}`;
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const getValueFontSize = (val: string | number) => {
    const text = String(val).trim();
    if (isSmall) {
      if (text.length >= 7) return 'text-2xl';
      return 'text-3xl';
    }
    if (isLarge) {
      if (text.length >= 7) return 'text-3xl sm:text-4xl';
      return 'text-4xl sm:text-5xl';
    }
    if (text.length >= 7) return 'text-2xl sm:text-3xl';
    return 'text-3xl sm:text-4xl';
  };

  const handleCardClick = () => {
    onSelect?.(card);
  };

  return (
    <div
      id={elementId}
      role="article"
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`${card.title}: ${card.value}${isClickable ? '. Clique para ver mais' : '. Indicador informativo'}`}
      className={`kpi ${featured ? 'kpi--featured' : ''} group select-none w-full cursor-pointer ${
        isSmall ? 'min-h-[168px]' : isLarge ? 'min-h-[210px]' : 'min-h-[188px]'
      } ${className}`}
    >
      {/* Linha 1: Label (Contexto) */}
      <div className="flex items-start justify-between gap-3">
        <span
          className={`kpi__label text-xs sm:text-[13px] font-medium leading-snug ${
            featured ? 'text-[#9fb3c8]' : 'text-[#52606d]'
          }`}
        >
          {card.title}
        </span>
      </div>

      {/* Linha 2: Value (Dado Principal com Tabular Nums) */}
      <div className="my-2">
        <span
          className={`kpi__value numeric font-bold tracking-[-0.03em] leading-[1.1] block ${
            featured ? 'text-white' : 'text-[#002133]'
          } ${getValueFontSize(card.value)}`}
        >
          {card.value}
        </span>
      </div>

      {/* Linha 3: Meta & Acção Secundária (Sem botão escuro repetido em cada card) */}
      <div
        className={`pt-3 border-t flex items-center justify-between gap-2 ${
          featured ? 'border-white/15' : 'border-[#e8e8ea]'
        }`}
      >
        <span
          className={`kpi__meta text-xs truncate ${
            featured ? 'text-[#9fb3c8]' : 'text-[#52606d]'
          }`}
        >
          {card.subtitle || (isClickable ? 'Módulo interativo' : 'Indicador consolidado')}
        </span>

        {isClickable ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[10px] border transition-colors cursor-pointer ${
              featured
                ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                : 'bg-white hover:bg-[#f4f4f6] text-[#002133] border-[#d1d1d6]'
            }`}
          >
            <span>{card.actionText || 'Ver mais'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        ) : (
          <span
            className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-md ${
              featured
                ? 'bg-white/10 text-[#9fb3c8]'
                : 'bg-[#f4f4f6] text-[#52606d]'
            }`}
          >
            Consolidado
          </span>
        )}
      </div>
    </div>
  );
};



