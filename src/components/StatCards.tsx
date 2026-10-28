import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import type { SessionCard, SessionProfile } from '../types';

interface StatCardsProps {
  session: SessionProfile;
  onSelectCard: (card: SessionCard) => void;
  onOpenSettings?: () => void;
  isLoggedIn?: boolean;
  onChangeRole?: (role: 'admin' | 'diretor' | 'professor') => void;
  onRequireAuth?: (actionName: string) => void;
  liveSummary?: {
    schoolsCount: number;
    directorsCount: number;
    teachersQuotaCount: number;
    studentsRegisteredCount: number;
    studentsPendingCount: number;
    turmasCount: number;
    roomsCount: number;
    performanceRate: number;
    onNavigate?: (target: string) => void;
  };
}

export const StatCards: React.FC<StatCardsProps> = ({
  session,
  onSelectCard,
  isLoggedIn,
  onRequireAuth,
  liveSummary,
}) => {
  return (
    <section id="stats-section" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8">
      {!isLoggedIn && (
        <div
          onClick={() => onRequireAuth?.('Autenticação no Sistema')}
          className="mb-6 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-800 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400">Sessão Não Iniciada</span>
              <p className="text-xs sm:text-sm font-medium text-slate-800">
                Inicie sessão para desbloquear todos os dados de turmas, salas, alunos e professores.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 bg-slate-900 text-white text-xs font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-slate-800 transition cursor-pointer"
          >
            <span>Iniciar Sessão</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}

      {/* Faixa de Métricas Contínua (Substitui 6 cards pesados) */}
      {liveSummary ? (
        <div className="bg-white rounded-xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="p-5">
            <span className="text-xs text-slate-400 font-medium">Escolas Ativas</span>
            <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {liveSummary.schoolsCount}
            </div>
            <button
              type="button"
              onClick={() => liveSummary.onNavigate?.('admin-escolas')}
              className="text-[11px] text-slate-500 hover:text-[#e11d48] mt-2 inline-block cursor-pointer transition-colors"
            >
              Inspecionar →
            </button>
          </div>

          <div className="p-5">
            <span className="text-xs text-slate-400 font-medium">Diretores</span>
            <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {liveSummary.directorsCount}
            </div>
            <button
              type="button"
              onClick={() => liveSummary.onNavigate?.('admin-directores')}
              className="text-[11px] text-slate-500 hover:text-[#e11d48] mt-2 inline-block cursor-pointer transition-colors"
            >
              Homologados →
            </button>
          </div>

          <div className="p-5">
            <span className="text-xs text-slate-400 font-medium">Professores (Quota)</span>
            <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {liveSummary.teachersQuotaCount}
            </div>
            <button
              type="button"
              onClick={() => liveSummary.onNavigate?.('admin-professores')}
              className="text-[11px] text-slate-500 hover:text-[#e11d48] mt-2 inline-block cursor-pointer transition-colors"
            >
              Ver quadro →
            </button>
          </div>

          <div className="p-5">
            <span className="text-xs text-slate-400 font-medium">Alunos Matriculados</span>
            <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {liveSummary.studentsRegisteredCount}{' '}
              {liveSummary.studentsPendingCount > 0 && (
                <span className="text-xs font-normal text-amber-600">
                  / {liveSummary.studentsPendingCount} pend.
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => liveSummary.onNavigate?.('admin-alunos')}
              className="text-[11px] text-slate-500 hover:text-[#e11d48] mt-2 inline-block cursor-pointer transition-colors"
            >
              Consultar →
            </button>
          </div>

          <div className="p-5">
            <span className="text-xs text-slate-400 font-medium">Turmas Formadas</span>
            <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {liveSummary.turmasCount}
            </div>
            <span className="text-[11px] text-slate-400 mt-2 block">
              {liveSummary.roomsCount} salas físicas
            </span>
          </div>

          <div className="p-5">
            <span className="text-xs text-slate-400 font-medium">Aproveitamento</span>
            <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {liveSummary.performanceRate}%
            </div>
            <span className="text-[11px] text-slate-400 mt-2 block">Ano 2026/2027</span>
          </div>
        </div>
      ) : (
        <div
          className={`bg-white rounded-xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 ${
            session.cards.length >= 6
              ? 'lg:grid-cols-6'
              : session.cards.length === 5
              ? 'lg:grid-cols-5'
              : 'lg:grid-cols-4'
          } divide-y sm:divide-y-0 sm:divide-x divide-slate-100`}
        >
          {session.cards.map((card) => (
            <div key={card.id} className="p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">{card.title}</span>
                <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
                  {card.value}
                </div>
              </div>
              {card.isClickable !== false ? (
                <button
                  type="button"
                  onClick={() => onSelectCard(card)}
                  className="text-[11px] text-slate-500 hover:text-[#e11d48] mt-2 inline-block text-left cursor-pointer transition-colors"
                >
                  {card.actionText || 'Inspecionar'} →
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 mt-2 block truncate">
                  {card.subtitle || 'Ano 2026/2027'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
