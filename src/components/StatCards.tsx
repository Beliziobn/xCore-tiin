import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import type { SessionCard, SessionProfile } from '../types';
import { StatCardItem } from './StatCardItem';

interface StatCardsProps {
  session: SessionProfile;
  onSelectCard: (card: SessionCard) => void;
  onOpenSettings?: () => void;
  isLoggedIn?: boolean;
  onChangeRole?: (role: 'admin' | 'diretor' | 'professor') => void;
  onRequireAuth?: (actionName: string) => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  session,
  onSelectCard,
  isLoggedIn,
  onRequireAuth,
}) => {
  const [filter, setFilter] = useState<'all' | 'clickable' | 'stats'>('all');

  const handleCardClick = (card: SessionCard) => {
    onSelectCard(card);
  };

  const filteredCards = session.cards.filter((card) => {
    if (filter === 'clickable') return card.isClickable !== false;
    if (filter === 'stats') return card.isClickable === false;
    return true;
  });

  const clickableCount = session.cards.filter((c) => c.isClickable !== false).length;
  const nonClickableCount = session.cards.filter((c) => c.isClickable === false).length;

  return (
    <section id="stats-section" className="reveal-up relative z-20 max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-20">
      {/* Informative Banner when not logged in */}
      {!isLoggedIn && (
        <div 
          onClick={() => onRequireAuth?.('Autenticação no Sistema')}
          className="mb-8 bg-[#fef2f1] hover:bg-[#fee4e2] border border-[#f75142]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-800 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f75142] text-white flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#f75142]">
                Sessão Não Iniciada
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                Inicie sessão para desbloquear todos os dados de turmas, salas, alunos e professores.
              </p>
            </div>
          </div>
          <button 
            type="button"
            className="shrink-0 bg-[#f75142] text-[#002133] text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-[#e04436] transition-colors"
          >
            <span>Iniciar Sessão</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#002133]" />
          </button>
        </div>
      )}

      {/* Card Classification Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({session.cards.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('clickable')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              filter === 'clickable'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Módulos Clicáveis ({clickableCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('stats')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              filter === 'stats'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Estatísticas ({nonClickableCount})</span>
          </button>
        </div>
      </div>

      {/* Harmonized Cards Grid with equal heights and uniform composition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto items-stretch">
        {filteredCards.map((card) => (
          <StatCardItem
            key={card.id}
            card={card}
            onSelect={handleCardClick}
          />
        ))}
      </div>
    </section>
  );
};
