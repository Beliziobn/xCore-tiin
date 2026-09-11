import React from 'react';
import { ShieldAlert, ArrowLeft, User, Lock, LogOut, CheckCircle2 } from 'lucide-react';
import type { UserAccount } from '../../types';
import { getOwnProfileViewForUser, getViewTitle } from '../../utils/authGuard';

interface AccessDeniedGuardProps {
  currentUser: UserAccount;
  attemptedView: string;
  reason?: string;
  onNavigateToOwnProfile: () => void;
  onBackToHome: () => void;
  onLogout: () => void;
}

export const AccessDeniedGuard: React.FC<AccessDeniedGuardProps> = ({
  currentUser,
  attemptedView,
  reason,
  onNavigateToOwnProfile,
  onBackToHome,
  onLogout,
}) => {
  const roleLabel =
    currentUser.role === 'admin'
      ? 'Administrador Central (DME)'
      : currentUser.role === 'diretor'
      ? 'Diretor(a) Escolar'
      : currentUser.role === 'professor'
      ? 'Professor(a) Titular'
      : 'Aluno(a)';

  const attemptedTitle = getViewTitle(attemptedView);

  return (
    <div
      id="access-denied-container"
      className="w-full min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/70"
    >
      <div className="max-w-xl w-full bg-white rounded-3xl border border-rose-200/80 shadow-[0_20px_50px_rgba(247,81,66,0.08)] overflow-hidden">
        {/* Header Alert Strip */}
        <div className="bg-rose-50 border-b border-rose-100 p-6 sm:p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/20 mb-4 animate-bounce-short">
            <ShieldAlert className="w-8 h-8 text-white" strokeWidth={2.3} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Acesso Restrito • Violação de Perfil</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Não é permitido entrar nem mexer no perfil dos outros
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md">
            {reason ||
              'O ecossistema uCore aplica uma política estrita de isolamento de identidade: cada utilizador apenas pode aceder e gerir o seu próprio perfil e dados autorizados.'}
          </p>
        </div>

        {/* Account Details Box */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="font-semibold text-slate-500">Sua Sessão Ativa:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-700" />
                {currentUser.firstName} {currentUser.lastName}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="font-semibold text-slate-500">Função Reconhecida:</span>
              <span className="font-bold text-[#f75142] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {roleLabel}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="font-semibold text-slate-500">E-mail:</span>
              <span className="text-slate-700 font-mono">{currentUser.email}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="font-semibold text-slate-500">Tentativa Bloqueada:</span>
              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                {attemptedTitle}
              </span>
            </div>
          </div>

          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-amber-900 font-medium">
              As suas informações, turmas e configurações estão salvas com segurança no seu perfil. Clique abaixo para retornar à sua área autorizada.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              id="btn-access-guard-own-profile"
              type="button"
              onClick={onNavigateToOwnProfile}
              className="flex-1 bg-[#f75142] hover:bg-[#e04436] text-white font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Ir para o Meu Perfil</span>
            </button>

            <button
              id="btn-access-guard-home"
              type="button"
              onClick={onBackToHome}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Painel Principal</span>
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Trocar de utilizador (Encerrar Sessão)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
