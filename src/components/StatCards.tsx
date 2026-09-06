import React from 'react';
import { Home, User, Users, Flag, Settings2, Sliders, ShieldCheck } from 'lucide-react';
import type { SessionCard, SessionProfile } from '../types';

interface StatCardsProps {
  session: SessionProfile;
  onSelectCard: (card: SessionCard) => void;
  onOpenSettings: () => void;
  isLoggedIn?: boolean;
}

export const StatCards: React.FC<StatCardsProps> = ({
  session,
  onSelectCard,
  onOpenSettings,
  isLoggedIn,
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

  return (
    <section id="stats-section" className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-16">
      {/* Session Header Toolbar: shows verified session and settings button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#5067fc]/10 text-[#5067fc] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#5067fc]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {isLoggedIn ? 'Sessão Iniciada:' : 'Pré-visualização da Rede:'}
              </span>
              <span className="text-[10px] bg-blue-50 text-[#5067fc] border border-blue-200/80 px-2 py-0.5 rounded-full font-bold uppercase">
                {session.title}
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              {session.name}
            </h3>
          </div>
        </div>

        {/* Configuration Button for this specific session */}
        <button
          onClick={onOpenSettings}
          className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer group shadow-2xs"
          title="Ver configurações específicas desta sessão"
        >
          <Settings2 className="w-3.5 h-3.5 text-[#5067fc] group-hover:rotate-45 transition-transform" />
          <span>Configurações da Sessão ({session.role.toUpperCase()})</span>
        </button>
      </div>

      {/* Blue Cards Grid reproducing exact layout from 8.png, 4.png, 6.png */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 max-w-4xl mx-auto">
        {session.cards.map((card) => (
          <div
            key={card.id}
            id={`stat-card-${card.id}`}
            onClick={() => onSelectCard(card)}
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

            {/* Subtle exploration hint */}
            <span className="mt-3 text-[10px] uppercase font-bold tracking-wider text-white/70 group-hover:text-white transition-colors">
              Ver Detalhes →
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
