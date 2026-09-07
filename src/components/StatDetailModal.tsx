import React from 'react';
import { X, CheckCircle2, TrendingUp, Sparkles, Home, User, Users, Flag, ArrowRight } from 'lucide-react';
import type { SessionCard } from '../types';

interface StatDetailModalProps {
  card: SessionCard | null;
  onClose: () => void;
  roleTitle?: string;
}

export const StatDetailModal: React.FC<StatDetailModalProps> = ({ card, onClose, roleTitle }) => {
  if (!card) return null;

  const renderIcon = (icon: SessionCard['icon']) => {
    switch (icon) {
      case 'home':
        return <Home className="w-6 h-6 text-white" />;
      case 'user':
        return <User className="w-6 h-6 text-white" />;
      case 'users':
        return <Users className="w-6 h-6 text-white" />;
      case 'flag':
        return <Flag className="w-6 h-6 text-white" />;
      default:
        return <Home className="w-6 h-6 text-white" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden relative">
        {/* Header with #f75142 */}
        <div className="bg-[#f75142] p-6 relative text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 text-white flex items-center justify-center shadow-xs">
              {renderIcon(card.icon)}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/80">
                {roleTitle ? `Métrica da Sessão • ${roleTitle}` : 'Indicador uCore'}
              </span>
              <h3 className="text-2xl font-black uppercase tracking-tight text-white">{card.title}</h3>
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-black tracking-tighter text-white">{card.value}</span>
            <span className="text-[10px] uppercase tracking-wider bg-white/20 text-white border border-white/30 px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
              <TrendingUp className="w-3 h-3" />
              Atualizado em Tempo Real
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {card.description && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {card.description}
            </p>
          )}

          {card.details && card.details.length > 0 && (
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#f75142]" />
                Registros e Discriminação Detalhada
              </h4>
              <ul className="space-y-2.5">
                {card.details.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#f75142] shrink-0 mt-0.5" />
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
              className="bg-[#f75142] hover:bg-[#e04436] text-[#002133] text-xs font-black px-6 py-2.5 rounded-full transition-all cursor-pointer shadow-sm"
            >
              {card.actionText || 'Entendido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
