import React from 'react';
import { ArrowUpRight, Activity } from 'lucide-react';

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
}

/**
 * StatCardItem renders a perfectly proportioned, balanced card with:
 * 1. Top Squircle with auto-scaled optical typography for the metric value
 * 2. Centered Title & Subtitle with consistent vertical spacing
 * 3. Bottom Action Anchor (Button with arrow for clickable, or aligned indicator pill for fixed metrics)
 * Ensures 100% equal height across all cards in any grid row.
 */
export const StatCardItem: React.FC<StatCardItemProps> = ({
  card,
  onSelect,
  id,
  className = '',
  size = 'md',
  showPercentages = true,
}) => {
  const isClickable = card.isClickable !== false;
  const elementId = id || `stat-card-${card.id}`;
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  // Optical font scaling based on value length to prevent overflow or awkward wrapping
  const getValueFontSize = (val: string | number) => {
    const text = String(val).trim();
    if (isSmall) {
      if (text.length >= 6) return 'text-xl sm:text-2xl';
      if (text.length >= 4) return 'text-2xl sm:text-3xl';
      return 'text-3xl sm:text-4xl';
    }
    if (isLarge) {
      if (text.length >= 6) return 'text-3xl sm:text-4xl';
      if (text.length >= 4) return 'text-5xl sm:text-6xl';
      return 'text-6xl sm:text-7xl';
    }
    // Standard 'md' size
    if (text.length >= 6) return 'text-2xl sm:text-3xl';
    if (text.length >= 4) return 'text-4xl sm:text-5xl';
    return 'text-5xl sm:text-6xl';
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
      className={`stat-card reveal-up relative bg-white border border-slate-200 hover:border-slate-300 p-4 sm:p-5 flex flex-col justify-between h-full shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out select-none w-full mx-auto group ${
        isSmall
          ? 'rounded-2xl min-h-[250px] max-w-[260px]'
          : isLarge
          ? 'rounded-2xl min-h-[360px] max-w-[360px]'
          : 'rounded-2xl min-h-[320px] max-w-[320px]'
      } cursor-pointer ${className}`}
    >
      {/* 1. Top Squircle with Neutral Background & Scaled Value */}
      <div
        className={`w-full bg-slate-50 group-hover:bg-slate-100/70 border border-slate-200/70 flex items-center justify-center p-3 transition-colors duration-200 relative overflow-hidden ${
          isSmall
            ? 'h-24 sm:h-28 rounded-xl'
            : isLarge
            ? 'h-40 sm:h-44 rounded-xl'
            : 'h-32 sm:h-36 rounded-xl'
        }`}
      >
        {showPercentages && String(card.value).includes('%') && (
          <span className="absolute top-2.5 right-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
            Taxa %
          </span>
        )}
        {showPercentages && !String(card.value).includes('%') && (
          <span className="absolute top-2.5 right-2.5 bg-slate-200/80 text-slate-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
            Total
          </span>
        )}
        <span
          className={`font-black text-slate-900 tracking-tight leading-none text-center select-none font-sans px-2 ${getValueFontSize(
            card.value
          )}`}
        >
          {card.value}
        </span>
      </div>

      {/* 2. Card Title & Subtitle with Aligned Vertical Spacing */}
      <div className="flex-1 flex flex-col justify-center text-center my-3 sm:my-4 px-1 min-h-[50px]">
        <h3
          className={`font-bold text-slate-900 tracking-tight leading-snug line-clamp-2 ${
            isSmall ? 'text-xs sm:text-sm' : isLarge ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
          }`}
        >
          {card.title}
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1">
          {card.subtitle || (isClickable ? 'Módulo interativo' : 'Indicador consolidado')}
        </p>
      </div>

      {/* 3. Bottom Anchor: Equal Height and Clear Action Status */}
      {isClickable ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          className={`w-full bg-[#002133] hover:bg-slate-800 active:scale-[0.99] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-400 ${
            isSmall
              ? 'text-[11px] sm:text-xs py-2 sm:py-2.5 px-3'
              : 'text-xs sm:text-sm py-2.5 sm:py-3 px-4'
          }`}
        >
          <span>{card.actionText || 'Ver mais'}</span>
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      ) : (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          title="Clique para ver detalhes do indicador"
          className={`w-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none ${
            isSmall
              ? 'text-[11px] sm:text-xs py-2 sm:py-2.5 px-3'
              : 'text-xs sm:text-sm py-2.5 sm:py-3 px-4'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
          <span className="truncate">Indicador Fixo</span>
        </div>
      )}
    </div>
  );
};


