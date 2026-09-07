import React, { useState } from 'react';
import { Settings2, ShieldCheck, Lock, ArrowRight, Layers, Sparkles } from 'lucide-react';
import type { SessionCard, SessionProfile } from '../types';
import { StatCardItem } from './StatCardItem';

interface StatCardsProps {
  session: SessionProfile;
  onSelectCard: (card: SessionCard) => void;
  onOpenSettings: () => void;
  isLoggedIn?: boolean;
  onChangeRole?: (role: 'admin' | 'diretor' | 'professor') => void;
  onRequireAuth?: (actionName: string) => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  session,
  onSelectCard,
  onOpenSettings,
  isLoggedIn,
  onChangeRole,
  onRequireAuth,
}) => {
  const [filter, setFilter] = useState<'all' | 'clickable' | 'stats'>('all');

  const handleCardClick = (card: SessionCard) => {
    onSelectCard(card);
  };

  const handleSettingsClick = () => {
    onOpenSettings();
  };

  const handleRoleClick = (role: 'admin' | 'diretor' | 'professor') => {
    onChangeRole?.(role);
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

      {/* Session Header Toolbar: shows verified session, role switchers, and settings */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#f75142]/10 text-[#f75142] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#f75142]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {isLoggedIn ? 'Sessão Iniciada:' : 'Sessão Prévia:'}
              </span>
              <span className="text-[10px] bg-[#fef2f1] text-[#f75142] border border-[#f75142]/30 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                {session.title}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              {session.name}
            </h3>
          </div>
        </div>

        {/* Action Controls: Role Switcher Chips + Settings */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          {onChangeRole && (
            <div className="flex items-center bg-white p-1 rounded-full border border-slate-200 text-[11px] font-bold shadow-xs">
              <button
                type="button"
                onClick={() => handleRoleClick('diretor')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  session.role === 'diretor'
                    ? 'bg-[#f75142] text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Diretor
              </button>
              <button
                type="button"
                onClick={() => handleRoleClick('professor')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  session.role === 'professor'
                    ? 'bg-[#f75142] text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Professor
              </button>
              <button
                type="button"
                onClick={() => handleRoleClick('admin')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  session.role === 'admin'
                    ? 'bg-[#f75142] text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admin
              </button>
            </div>
          )}

          {/* Configuration Button */}
          <button
            onClick={handleSettingsClick}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer group shadow-xs"
            title="Ver configurações específicas desta sessão"
          >
            <Settings2 className="w-3.5 h-3.5 text-[#f75142] group-hover:rotate-45 transition-transform" />
            <span className="hidden sm:inline">Configurações</span>
          </button>
        </div>
      </div>

      {/* Optional Card Classification Filter Chips */}
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

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-[#f75142]" />
          <span>Cards interativos navegam para páginas; indicadores fixos abrem detalhes</span>
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
