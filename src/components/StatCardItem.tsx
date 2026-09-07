import React from 'react';

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
}

/**
 * StatCardItem renders two distinct designs based on clickability:
 * 1. Clickable (Left design in reference):
 *    - White rounded card with dashed border
 *    - Vibrant coral-red (#f1523c) squircle block with big dark navy (#002133) number
 *    - Centered title in bold dark navy (#002133)
 *    - Bottom coral-red pill button ("Ver mais") that navigates to the associated view/page
 * 2. Non-Clickable (Right design in reference):
 *    - White rounded card with dashed border
 *    - Vibrant coral-red (#f1523c) squircle block with big dark navy (#002133) number
 *    - Centered title in bold dark navy (#002133)
 *    - NO action button (purely informational metric, does not navigate anywhere)
 */
export const StatCardItem: React.FC<StatCardItemProps> = ({
  card,
  onSelect,
  id,
  className = '',
  size = 'md',
}) => {
  const isClickable = card.isClickable !== false;
  const elementId = id || `stat-card-${card.id}`;
  const isSmall = size === 'sm';

  if (isClickable) {
    return (
      <div
        id={elementId}
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(card)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect?.(card);
          }
        }}
        aria-label={`${card.title}: ${card.value}. Clique para ver mais`}
        className={`reveal-up relative bg-white border-2 border-dashed border-slate-300 p-4 sm:p-5 flex flex-col items-center justify-between shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_35px_-8px_rgba(247,81,66,0.22)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group select-none w-full mx-auto ${
          isSmall
            ? 'rounded-[26px] sm:rounded-[28px] max-w-[260px] min-h-[260px]'
            : 'rounded-[32px] sm:rounded-[36px] max-w-[310px] min-h-[350px]'
        } ${className}`}
      >
        {/* Top Vibrant Squircle with Big Metric Value */}
        <div
          className={`w-full aspect-square bg-[#f75142] flex items-center justify-center p-3 sm:p-4 transition-transform duration-300 group-hover:scale-[1.01] shadow-xs ${
            isSmall
              ? 'max-h-[140px] rounded-[18px] sm:rounded-[20px]'
              : 'max-h-[220px] rounded-[24px] sm:rounded-[26px]'
          }`}
        >
          <span
            className={`font-black text-[#002133] tracking-tight leading-none text-center select-none font-sans ${
              isSmall ? 'text-4xl sm:text-5xl' : 'text-6xl sm:text-7xl'
            }`}
          >
            {card.value}
          </span>
        </div>

        {/* Card Title / Label */}
        <div className="text-center my-3 sm:my-4 select-none px-1">
          <h3
            className={`font-black text-[#002133] tracking-tight leading-tight ${
              isSmall ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
            }`}
          >
            {card.title}
          </h3>
          {card.subtitle && (
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {card.subtitle}
            </p>
          )}
        </div>

        {/* Action Button ("Ver mais") */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(card);
          }}
          className={`w-full bg-[#f75142] hover:brightness-95 active:scale-[0.98] text-[#002133] font-black rounded-full flex items-center justify-center text-center transition-all duration-200 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f75142]/40 ${
            isSmall
              ? 'text-xs py-2 sm:py-2.5 px-4'
              : 'text-sm sm:text-base py-3 sm:py-3.5 px-6'
          }`}
        >
          {card.actionText || 'Ver mais'}
        </button>
      </div>
    );
  }

  // Non-clickable card: Pure metric card without "Ver mais" button
  return (
    <div
      id={elementId}
      role="article"
      aria-label={`${card.title}: ${card.value}. Indicador informativo`}
      className={`reveal-up relative bg-white border-2 border-dashed border-slate-300 p-4 sm:p-5 flex flex-col items-center shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] cursor-default select-none w-full mx-auto ${
        isSmall
          ? 'rounded-[26px] sm:rounded-[28px] max-w-[260px] min-h-[210px]'
          : 'rounded-[32px] sm:rounded-[36px] max-w-[310px] min-h-[300px]'
      } ${className}`}
    >
      {/* Top Vibrant Squircle with Big Metric Value */}
      <div
        className={`w-full aspect-square bg-[#f75142] flex items-center justify-center p-3 sm:p-4 shadow-xs ${
          isSmall
            ? 'max-h-[140px] rounded-[18px] sm:rounded-[20px]'
            : 'max-h-[220px] rounded-[24px] sm:rounded-[26px]'
        }`}
      >
        <span
          className={`font-black text-[#002133] tracking-tight leading-none text-center select-none font-sans ${
            isSmall ? 'text-4xl sm:text-5xl' : 'text-6xl sm:text-7xl'
          }`}
        >
          {card.value}
        </span>
      </div>

      {/* Card Title / Label */}
      <div className="text-center mt-3 sm:mt-4 mb-2 select-none px-1">
        <h3
          className={`font-black text-[#002133] tracking-tight leading-tight ${
            isSmall ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
          }`}
        >
          {card.title}
        </h3>
        {card.subtitle && (
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {card.subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

