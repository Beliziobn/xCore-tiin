import React from 'react';
import { Lock, LogIn, UserPlus, X, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AuthRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
  attemptedAction?: string;
}

export const AuthRecommendationModal: React.FC<AuthRecommendationModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  attemptedAction,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="auth-recommendation-modal"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200"
      >
        {/* Decorative Top Gradient Banner */}
        <div className="h-3 bg-gradient-to-r from-[#5067fc] via-[#4f67ff] to-[#5067fc]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Top Icon and Badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#5067fc]/10 text-[#5067fc] flex items-center justify-center shadow-inner">
              <Lock className="w-6 h-6 text-[#5067fc]" />
            </div>
            <div>
              <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                Sessão Necessária
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Inicie Sessão para Continuar
              </h3>
            </div>
          </div>

          {/* Action notice */}
          {attemptedAction && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 mb-4 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#5067fc] shrink-0" />
              <span className="text-slate-600">
                Tentou aceder a: <strong className="text-slate-900">{attemptedAction}</strong>
              </span>
            </div>
          )}

          {/* Main Description */}
          <p className="text-sm text-slate-600 leading-relaxed mb-5">
            Para garantir a integridade pedagógica e a proteção dos dados dos estudantes e das escolas, 
            é necessário <strong>iniciar uma sessão</strong> antes de consultar detalhes, navegar pelas salas ou realizar alterações.
          </p>

          {/* Key Advantages */}
          <div className="space-y-2 mb-6 bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-[#4f67ff] shrink-0" />
              <span>Acesso completo ao painel de Diretor, Professor ou Administrador</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-[#4f67ff] shrink-0" />
              <span>Consulta e edição de alunos, matrículas, notas e faltas</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-[#4f67ff] shrink-0" />
              <span>Estatísticas em tempo real com relatórios oficiais</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="modal-auth-login-btn"
              onClick={onLogin}
              className="flex-1 bg-[#5067fc] hover:bg-[#4359ea] text-white font-bold text-xs uppercase tracking-wider py-3.5 px-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sessão</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              id="modal-auth-register-btn"
              onClick={onRegister}
              className="flex-1 bg-[#4f67ff] hover:bg-[#3547cf] text-white font-bold text-xs uppercase tracking-wider py-3.5 px-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              <span>Criar Conta</span>
            </button>
          </div>

          {/* Dismiss option */}
          <div className="text-center mt-4">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Explorar apenas a página inicial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
