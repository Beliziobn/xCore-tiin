import React, { useState } from 'react';
import { Lock, ArrowRight, Settings, Percent, Bell, RefreshCw } from 'lucide-react';
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
  onOpenSettings,
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
          className="mb-8 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-800 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Sessão Não Iniciada
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                Inicie sessão para desbloquear todos os dados de turmas, salas, alunos e professores.
              </p>
            </div>
          </div>
          <button 
            type="button"
            className="shrink-0 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-black transition-colors cursor-pointer"
          >
            <span>Iniciar Sessão</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}

      {/* Card Classification Filter Chips & Settings Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium border border-slate-200/60">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200/80'
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
                ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200/80'
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
                ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Estatísticas ({nonClickableCount})</span>
          </button>
        </div>

        {/* Applied Settings Indicators & Direct Settings Trigger Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {session.settings?.autoSync && (
            <span
              title="Sincronização em tempo real ativa nas configurações"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold"
            >
              <span className="w-2 h-2 rounded-full bg-[#002133]" />
              <span>Sincronização Ativa</span>
            </span>
          )}
          {session.settings?.showPercentages && (
            <span
              title="Exibição de percentuais ativa nas configurações"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold"
            >
              <Percent className="w-3.5 h-3.5 text-slate-600" />
              <span>Métricas em %</span>
            </span>
          )}
          {session.settings?.emailAlerts && (
            <span
              title="Alertas críticos ativos nas configurações"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold"
            >
              <Bell className="w-3.5 h-3.5 text-slate-600" />
              <span>Alertas Ativos</span>
            </span>
          )}
          {onOpenSettings && (
            <button
              id="statcards-open-settings-btn"
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#002133] hover:bg-[#001726] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 border border-white/10"
              title="Abrir Configurações da Sessão"
            >
              <Settings className="w-3.5 h-3.5 text-[#f75142]" />
              <span>Configurações</span>
            </button>
          )}
        </div>
      </div>

      {/* Harmonized Cards Grid with equal heights and uniform composition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto items-stretch">
        {filteredCards.map((card) => (
          <StatCardItem
            key={card.id}
            card={card}
            onSelect={handleCardClick}
            showPercentages={session.settings?.showPercentages !== false}
          />
        ))}
      </div>
    </section>
  );
};
