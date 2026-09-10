import React from 'react';

export type ChartViewType = 'pie' | 'bar' | 'line' | 'area';

interface HighlightMetric {
  value: string;
  status?: string;
  trend?: 'up' | 'down' | 'good' | 'neutral';
}

interface SegmentedControlProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}

interface ChartHeaderProps {
  title: string;
  badgeText?: string;
  subtitle?: string;
  extraAction?: React.ReactNode;
  icon?: React.ReactNode;
  highlightMetric?: HighlightMetric;
  segmentedControl?: SegmentedControlProps;
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
  icon,
  highlightMetric,
  segmentedControl,
}) => {
  return (
    <div className="flex flex-col gap-3 mb-4 pb-3.5 border-b border-slate-100/90">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {badgeText && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/70">
                {badgeText}
              </span>
            )}
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 font-medium leading-relaxed truncate">
              {subtitle}
            </p>
          )}

          {/* Highlight metric (e.g., '54% Good' as seen in Screenshot 1) */}
          {highlightMetric && (
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                {highlightMetric.value}
              </span>
              {highlightMetric.status && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    highlightMetric.trend === 'good' || highlightMetric.trend === 'up'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                      : highlightMetric.trend === 'down'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {highlightMetric.status}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right side controls (Segmented switch, Icon or extra actions) */}
        <div className="flex items-center gap-2 shrink-0 self-start">
          {segmentedControl && (
            <div className="inline-flex items-center p-0.5 bg-slate-100/90 rounded-full border border-slate-200/60 text-xs font-semibold">
              {segmentedControl.options.map((opt) => {
                const isActive = segmentedControl.selected === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => segmentedControl.onChange(opt)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {icon && (
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-500">
              {icon}
            </div>
          )}

          {extraAction}
        </div>
      </div>
    </div>
  );
};

