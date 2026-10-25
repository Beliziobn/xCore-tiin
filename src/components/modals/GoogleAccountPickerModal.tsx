import React, { useState } from 'react';
import { X, ShieldCheck, UserCheck, ArrowRight, Sparkles, AlertTriangle, PlusCircle } from 'lucide-react';

interface GoogleAccountOption {
  email: string;
  name: string;
  avatarText: string;
  avatarBg: string;
  roleTitle: string;
  badge: string;
}

interface GoogleAccountPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (email: string, name: string, role?: string) => void;
  reason?: 'unauthorized-domain' | 'popup-blocked' | 'direct' | 'fallback';
}

const PRESET_ACCOUNTS: GoogleAccountOption[] = [
  {
    email: 'beliziodos20@gmail.com',
    name: 'Belízio',
    avatarText: 'B',
    avatarBg: 'bg-[#1a73e8]',
    roleTitle: 'Administrador de Sistema Sigre (Super Admin)',
    badge: 'Super Admin TI',
  },
  {
    email: 'dmedoquessua@gmail.com',
    name: 'Direcção Municipal da Educação',
    avatarText: 'D',
    avatarBg: 'bg-[#0f9d58]',
    roleTitle: 'Director Municipal da Educação de Quessua',
    badge: 'Conta Oficial DME',
  },
];

export const GoogleAccountPickerModal: React.FC<GoogleAccountPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  reason = 'direct',
}) => {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customRole, setCustomRole] = useState<'admin' | 'diretor' | 'professor'>('admin');
  const [customError, setCustomError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);

    const emailTrim = customEmail.trim().toLowerCase();
    const nameTrim = customName.trim();

    if (!emailTrim || !nameTrim) {
      setCustomError('Por favor preencha o nome e o e-mail da conta Google.');
      return;
    }

    if (!emailTrim.includes('@')) {
      setCustomError('Insira um e-mail válido (ex: seu.nome@gmail.com).');
      return;
    }

    onSelectAccount(emailTrim, nameTrim, customRole);
  };

  return (
    <div
      id="google-account-picker-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="google-account-picker-card"
        className="relative w-full max-w-[460px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-picker-title"
      >
        {/* Top subtle Google brand accent stripe */}
        <div className="w-full h-1 bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853]" />

        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Google Multicolor Logo */}
            <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center p-2 shrink-0">
              <svg viewBox="0 0 48 48" className="w-6 h-6" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
            </div>
            <div>
              <h2 id="google-picker-title" className="text-lg font-bold text-[#202124] tracking-tight leading-snug">
                Fazer login com o Google
              </h2>
              <p className="text-xs text-slate-500">Escolha uma conta para aceder ao Sigre</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative helper banner if triggered by popup constraint */}
        {reason !== 'direct' && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-950 text-xs flex items-start gap-2.5 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#1a73e8] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#1a73e8]">Autenticação Protegida: </span>
              {reason === 'popup-blocked'
                ? 'A janela de pop-up externo foi retida pela segurança do navegador. Selecione ou digite a sua conta Google abaixo para entrar instantaneamente.'
                : 'Conexão direta integrada ao Google. Selecione uma conta abaixo para continuar com o seu perfil.'}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {!showCustomForm ? (
            <>
              <div className="space-y-2.5">
                {PRESET_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => onSelectAccount(acc.email, acc.name)}
                    className="w-full text-left p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#1a73e8] hover:bg-blue-50/40 transition-all duration-150 cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full ${acc.avatarBg} text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        {acc.avatarText}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#202124] group-hover:text-[#1a73e8] truncate">
                            {acc.name}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                            {acc.badge}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 truncate">{acc.email}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{acc.roleTitle}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1a73e8] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>

              {/* Action: Use another Google account */}
              <button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="w-full py-3 px-4 rounded-2xl border border-dashed border-slate-300 hover:border-[#1a73e8] hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-[#1a73e8]" />
                <span>Usar outra conta Google</span>
              </button>
            </>
          ) : (
            /* Custom Google Account Form */
            <form onSubmit={handleCustomSubmit} className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">Introduza os dados da sua conta Google:</span>
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  className="text-xs font-semibold text-[#1a73e8] hover:underline cursor-pointer"
                >
                  ← Voltar às contas
                </button>
              </div>

              {customError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{customError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Seu Nome Completo</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="ex: Belízio dos Santos"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-[#1a73e8] focus:ring-3 focus:ring-[#1a73e8]/10 text-sm outline-none transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">E-mail Google</label>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="ex: beliziodos20@gmail.com"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-[#1a73e8] focus:ring-3 focus:ring-[#1a73e8]/10 text-sm outline-none transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Perfil de Acesso</label>
                <select
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:border-[#1a73e8] focus:ring-3 focus:ring-[#1a73e8]/10 text-xs font-semibold text-slate-800 outline-none transition-all shadow-xs bg-white"
                >
                  <option value="admin">Administrador Geral / Super Admin TI</option>
                  <option value="diretor">Diretor(a) Geral de Escola</option>
                  <option value="professor">Professor(a) / Docente</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>Continuar com esta conta</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Privacy Footnote matching Google standards */}
          <div className="pt-2 text-[11px] text-slate-400 text-center leading-normal">
            Ao continuar, o Google autoriza o Sigre a verificar o seu e-mail e nome institucional para conceder acesso às ferramentas de gestão escolar.
          </div>
        </div>
      </div>
    </div>
  );
};
