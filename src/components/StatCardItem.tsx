import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ComposablesLucideIcon } from './common/ComposablesLucideIcon';

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
      className={`stat-card relative bg-white border border-slate-100/90 hover:border-slate-200/90 p-4 flex flex-col justify-between h-full shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.13)] hover:-translate-y-1.5 transition-all duration-300 ease-out select-none w-full mx-auto group rounded-[48px] ${
        isSmall
          ? 'min-h-[260px] max-w-[270px]'
          : isLarge
          ? 'min-h-[380px] max-w-[380px]'
          : 'min-h-[340px] max-w-[340px]'
      } cursor-pointer ${className}`}
    >
      {/* 1. Top Squircle with Nested Radius Rule: R_interno (32px) = R_externo (48px) - Padding (16px) */}
      <div
        className={`w-full bg-slate-50/90 group-hover:bg-slate-100/90 border border-slate-100/80 flex items-center justify-center p-3 transition-colors duration-200 relative overflow-hidden rounded-[32px] ${
          isSmall
            ? 'h-24 sm:h-28'
            : isLarge
            ? 'h-40 sm:h-44'
            : 'h-32 sm:h-36'
        }`}
      >
        <div className="absolute top-3 left-3 w-7 h-7 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-[#002133] group-hover:text-[#f75142] transition-colors">
          <ComposablesLucideIcon
            name={card.icon}
            titleFallback={card.title}
            size={15}
            strokeWidth={2}
          />
        </div>
        {showPercentages && String(card.value).includes('%') && (
          <span className="absolute top-3 right-3 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold uppercase tracking-[-0.01em] px-2.5 py-0.5 rounded-full shadow-2xs">
            Taxa %
          </span>
        )}
        {showPercentages && !String(card.value).includes('%') && (
          <span className="absolute top-3 right-3 bg-slate-200/80 text-slate-700 text-[10px] font-bold uppercase tracking-[-0.01em] px-2.5 py-0.5 rounded-full shadow-2xs">
            Total
          </span>
        )}
        <span
          className={`font-black text-slate-900 tracking-[-0.02em] leading-none text-center select-none font-sans px-2 ${getValueFontSize(
            card.value
          )}`}
        >
          {card.value}
        </span>
      </div>

      {/* 2. Card Title & Subtitle with -2% Letter Spacing */}
      <div className="flex-1 flex flex-col justify-center text-center my-3 sm:my-4 px-2 min-h-[50px]">
        <h3
          style={{ letterSpacing: '-0.02em' }}
          className={`font-black text-[#002133] leading-snug line-clamp-2 tracking-[-0.02em] ${
            isSmall ? 'text-xs sm:text-sm' : isLarge ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
          }`}
        >
          {card.title}
        </h3>
        <p className="text-xs text-slate-400 font-medium mt-1 line-clamp-1 tracking-[-0.01em]">
          {card.subtitle || (isClickable ? 'Módulo interativo' : 'Indicador consolidado')}
        </p>
      </div>

      {/* 3. Bottom Action Anchor: Full-width Rounded-full Pill Button (as shown in UI reference) */}
      {isClickable ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          className={`w-full bg-[#002133] hover:bg-[#f75142] active:scale-[0.98] text-white font-bold rounded-full flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#f75142]/40 ${
            isSmall
              ? 'text-[11px] sm:text-xs py-2.5 px-4'
              : 'text-xs sm:text-sm py-3 sm:py-3.5 px-6'
          }`}
        >
          <span className="tracking-[-0.01em]">{card.actionText || 'Ver mais'}</span>
          <ArrowUpRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      ) : (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          title="Clique para ver detalhes do indicador"
          className={`w-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/70 text-slate-700 font-semibold rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer select-none ${
            isSmall
              ? 'text-[11px] sm:text-xs py-2.5 px-4'
              : 'text-xs sm:text-sm py-3 sm:py-3.5 px-6'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
          <span className="truncate tracking-[-0.01em]">Indicador Fixo</span>
        </div>
      )}
    </div>
  );
};


