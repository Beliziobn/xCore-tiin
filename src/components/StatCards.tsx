import React from 'react';
import { Home, User, Users, Flag, Settings2, Sliders, ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import type { SessionCard, SessionProfile } from '../types';

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
  const renderIcon = (icon: SessionCard['icon']) => {
    switch (icon) {
      case 'home':
        return <Home className="w-6 h-6 text-[#5067fc]" strokeWidth={2.2} />;
      case 'user':
        return <User className="w-6 h-6 text-[#5067fc]" strokeWidth={2.2} />;
      case 'users':
        return <Users className="w-6 h-6 text-[#5067fc]" strokeWidth={2.2} />;
      case 'flag':
        return <Flag className="w-6 h-6 text-[#5067fc]" strokeWidth={2.2} />;
      default:
        return <Home className="w-6 h-6 text-[#5067fc]" strokeWidth={2.2} />;
    }
  };

  const handleCardClick = (card: SessionCard) => {
    if (!isLoggedIn) {
      onRequireAuth?.(`Módulo de ${card.title}`);
      return;
    }
    onSelectCard(card);
  };

  const handleSettingsClick = () => {
    if (!isLoggedIn) {
      onRequireAuth?.('Configurações da Sessão');
      return;
    }
    onOpenSettings();
  };

  const handleRoleClick = (role: 'admin' | 'diretor' | 'professor') => {
    if (!isLoggedIn) {
      const roleName = role === 'diretor' ? 'Diretor' : role === 'professor' ? 'Professor' : 'Administrador';
      onRequireAuth?.(`Sessão de ${roleName}`);
      return;
    }
    onChangeRole?.(role);
  };

  return (
    <section id="stats-section" className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-16">
      {/* Informative Banner when not logged in */}
      {!isLoggedIn && (
        <div 
          onClick={() => onRequireAuth?.('Autenticação no Sistema')}
          className="mb-8 bg-blue-50/80 hover:bg-blue-100/80 border border-[#5067fc]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-800 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#5067fc] text-white flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5067fc]">
                Sessão Não Iniciada
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                Inicie sessão para desbloquear todos os dados de turmas, salas, alunos e professores.
              </p>
            </div>
          </div>
          <button 
            type="button"
            className="shrink-0 bg-[#5067fc] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-[#4056ea] transition-colors"
          >
            <span>Iniciar Sessão</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Session Header Toolbar: shows verified session, role switchers, and settings */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#5067fc]/10 text-[#5067fc] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#5067fc]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {isLoggedIn ? 'Sessão Iniciada:' : 'Sessão Prévia:'}
              </span>
              <span className="text-[10px] bg-blue-50 text-[#5067fc] border border-blue-200/80 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
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
            <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200/80 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => handleRoleClick('diretor')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  session.role === 'diretor'
                    ? 'bg-[#5067fc] text-white shadow-2xs'
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
                    ? 'bg-[#5067fc] text-white shadow-2xs'
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
                    ? 'bg-[#5067fc] text-white shadow-2xs'
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
            className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer group shadow-2xs"
            title="Ver configurações específicas desta sessão"
          >
            <Settings2 className="w-3.5 h-3.5 text-[#5067fc] group-hover:rotate-45 transition-transform" />
            <span className="hidden sm:inline">Configurações</span>
          </button>
        </div>
      </div>

      {/* Blue Cards Grid reproducing exact layout from 8.png, 4.png, 6.png */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 max-w-4xl mx-auto">
        {session.cards.map((card) => (
          <div
            key={card.id}
            id={`stat-card-${card.id}`}
            onClick={() => handleCardClick(card)}
            className="relative bg-[#5067fc] hover:bg-[#455df7] text-white rounded-2xl pt-10 pb-8 px-6 text-center shadow-[0_15px_35px_rgba(80,103,252,0.25)] hover:shadow-[0_20px_45px_rgba(80,103,252,0.35)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[210px] group"
          >
            {/* White Circular Icon Badge at Top Center */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-white group-hover:scale-110 transition-transform duration-300">
              {renderIcon(card.icon)}
            </div>

            {/* Card Title */}
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              {card.title}
            </h3>

            {/* Card Value */}
            <p className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {card.value}
            </p>

            {/* Exploration hint */}
            <span className="mt-3 text-[10px] uppercase font-bold tracking-wider text-white/70 group-hover:text-white transition-colors flex items-center gap-1">
              {!isLoggedIn && <Lock className="w-3 h-3 inline" />}
              <span>{isLoggedIn ? 'Ver Detalhes →' : 'Iniciar Sessão p/ Aceder'}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
