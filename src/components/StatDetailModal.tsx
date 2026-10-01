import React from 'react';
import { X, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import type { SessionCard } from '../types';
import { ComposablesLucideIcon } from './common/ComposablesLucideIcon';

interface StatDetailModalProps {
  card: SessionCard | null;
  onClose: () => void;
  roleTitle?: string;
}

export const StatDetailModal: React.FC<StatDetailModalProps> = ({ card, onClose, roleTitle }) => {
  if (!card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header with Neutral Background & Clear Hierarchy */}
        <div className="bg-slate-50 p-5 sm:p-6 relative border-b border-slate-200 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            title="Fechar modal"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pr-8">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#002133] flex items-center justify-center shadow-2xs shrink-0">
              <ComposablesLucideIcon
                name={card.icon}
                titleFallback={card.title}
                size={20}
                strokeWidth={2}
              />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                {roleTitle ? `Métrica da Sessão • ${roleTitle}` : 'Indicador Sigre'}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{card.title}</h3>
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">{card.value}</span>
            <span className="text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-md flex items-center gap-1 font-bold">
              <TrendingUp className="w-3 h-3" />
              Atualizado em Tempo Real
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {card.description && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {card.description}
            </p>
          )}

          {card.details && card.details.length > 0 && (
            <div className="pt-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                Registros e Discriminação Detalhada
              </h4>
              <ul className="space-y-2">
                {card.details.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              ID: {card.id}
            </span>
            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              {card.actionText || 'Entendido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
