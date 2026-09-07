import React from 'react';
import { Activity, PieChart as PieIcon, BarChart3, TrendingUp } from 'lucide-react';

export type ChartViewType = 'pie' | 'bar' | 'line';

interface ChartHeaderProps {
  title: string;
  badgeText: string;
  subtitle?: string;
  currentType: ChartViewType;
  availableTypes?: ChartViewType[];
  onTypeChange?: (type: ChartViewType) => void;
  isAutoPlaying?: boolean;
  onToggleAutoPlay?: () => void;
  extraAction?: React.ReactNode;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({
  title,
  badgeText,
  subtitle,
  currentType,
  availableTypes = ['pie', 'bar', 'line'],
  onTypeChange,
  isAutoPlaying = true,
  onToggleAutoPlay,
  extraAction,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 pb-2 border-b border-slate-100">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="inline-block bg-[#f75142] text-white text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-md shadow-2xs">
            {badgeText}
          </span>
          <span className="text-sm font-bold text-slate-800 tracking-tight">
            {title}
          </span>
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        {/* Live Auto-Animation Pulse indicator */}
        <button
          onClick={onToggleAutoPlay}
          title={isAutoPlaying ? "Animação contínua ativa (clique para pausar)" : "Animação pausada (clique para ativar)"}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
            isAutoPlaying 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isAutoPlaying && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isAutoPlaying ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
          </span>
          <span className="font-mono uppercase tracking-wider text-[9px]">
            {isAutoPlaying ? 'Dinâmico' : 'Pausa'}
          </span>
        </button>

        {/* Chart View Type Switcher (Pizza, Colunas, Linhas) */}
        {onTypeChange && availableTypes.length > 1 && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {availableTypes.includes('pie') && (
              <button
                type="button"
                onClick={() => onTypeChange('pie')}
                title="Gráfico em Pizza / Donut"
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  currentType === 'pie'
                    ? 'bg-white text-[#f75142] shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <PieIcon className="w-3.5 h-3.5" />
              </button>
            )}

            {availableTypes.includes('bar') && (
              <button
                type="button"
                onClick={() => onTypeChange('bar')}
                title="Gráfico em Colunas / Barras"
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  currentType === 'bar'
                    ? 'bg-white text-[#f75142] shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
            )}

            {availableTypes.includes('line') && (
              <button
                type="button"
                onClick={() => onTypeChange('line')}
                title="Gráfico em Linhas / Área"
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  currentType === 'line'
                    ? 'bg-white text-[#f75142] shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {extraAction}
      </div>
    </div>
  );
};
