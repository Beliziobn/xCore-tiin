import React from 'react';

export type ChartViewType = 'pie' | 'bar' | 'line' | 'area';

interface ChartHeaderProps {
  title: string;
  badgeText: string;
  subtitle?: string;
  extraAction?: React.ReactNode;
  // Deprecated props kept as optional for backward compatibility
  currentType?: ChartViewType;
  availableTypes?: ChartViewType[];
  onTypeChange?: (type: ChartViewType) => void;
  isAutoPlaying?: boolean;
  onToggleAutoPlay?: () => void;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({
  title,
  badgeText,
  subtitle,
  extraAction,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/80">
            {badgeText}
          </span>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5 leading-normal">
            {subtitle}
          </p>
        )}
      </div>

      {extraAction && (
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {extraAction}
        </div>
      )}
    </div>
  );
};
