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
      <div className="rams-modal max-w-lg w-full overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header with Clean Hierarchy */}
        <div className="pb-5 relative border-b border-[#E5E5EA] shrink-0">
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-2 text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-[10px] transition-colors cursor-pointer"
            title="Fechar modal"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pr-8">
            <div className="w-10 h-10 rounded-[10px] bg-[#F5F5F7] border border-[#E5E5EA] text-[#1D1D1F] flex items-center justify-center shrink-0">
              <ComposablesLucideIcon
                name={card.icon}
                titleFallback={card.title}
                size={20}
                strokeWidth={2}
              />
            </div>
            <div>
              <span className="rams-badge-clean">
                {roleTitle ? `Métrica da Sessão • ${roleTitle}` : 'Indicador Sigre'}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F]">{card.title}</h3>
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F] tabular-nums">{card.value}</span>
            <span className="rams-badge-clean inline-flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Atualizado em Tempo Real
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="pt-5 space-y-4 overflow-y-auto">
          {card.description && (
            <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed font-normal">
              {card.description}
            </p>
          )}

          {card.details && card.details.length > 0 && (
            <div className="pt-2">
              <h4 className="rams-badge-clean mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#6E6E73]" />
                Registros e Discriminação Detalhada
              </h4>
              <ul className="space-y-2">
                {card.details.map((item, idx) => (
                  <li key={idx} className="text-xs text-[#1D1D1F] flex items-start gap-2.5 bg-[#F5F5F7] p-2.5 rounded-[10px] border border-[#E5E5EA]">
                    <CheckCircle2 className="w-4 h-4 text-[#6E6E73] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-[#E5E5EA] flex items-center justify-between">
            <span className="text-[11px] text-[#6E6E73] font-medium">
              ID: {card.id}
            </span>
            <button
              onClick={onClose}
              className="bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold px-5 py-2.5 rounded-[10px] transition-colors cursor-pointer"
            >
              {card.actionText || 'Entendido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
