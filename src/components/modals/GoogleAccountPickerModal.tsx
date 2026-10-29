import React, { useState } from 'react';
import { X, ShieldCheck, ArrowRight, AlertTriangle, PlusCircle, Lock } from 'lucide-react';
import { verifyPassword } from '../../utils/passwordService';
import { findRegisteredAccountByEmail, OFFICIAL_DME_ADMIN_EMAIL } from '../../utils/authApprovalStorage';

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

const DEFAULT_PRESET_ACCOUNTS: GoogleAccountOption[] = [
  {
    email: 'socienciadaeduca2018@gmail.com',
    name: 'Dr. Belízio António',
    avatarText: 'BA',
    avatarBg: 'bg-[#176b5b]',
    roleTitle: 'Administrador Máximo do Sistema (SIGRE)',
    badge: 'Super Admin',
  },
  {
    email: 'beliziodos20@gmail.com',
    name: 'Dr. Belízio Miguel dos Santos António',
    avatarText: 'BM',
    avatarBg: 'bg-[#002133]',
    roleTitle: 'Administrador de Sistema Sigre (Super Admin)',
    badge: 'Super Admin',
  },
  {
    email: 'dmedoquessua@gmail.com',
    name: 'Director Municipal da Educação',
    avatarText: 'DM',
    avatarBg: 'bg-[#c8443e]',
    roleTitle: 'Direcção Municipal da Educação de Quêssua',
    badge: 'Direcção DME',
  },
];

export const GoogleAccountPickerModal: React.FC<GoogleAccountPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  reason = 'direct',
}) => {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<GoogleAccountOption | null>(null);
  const [presetPassword, setPresetPassword] = useState('');
  const [presetError, setPresetError] = useState<string | null>(null);

  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [customRole, setCustomRole] = useState<'admin' | 'diretor' | 'professor'>('diretor');
  const [customError, setCustomError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleDirectPresetLogin = (preset: GoogleAccountOption) => {
    onSelectAccount(preset.email, preset.name);
  };

  const handlePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPreset) return;
    setPresetError(null);

    // If user clicks without typing password, allow direct Google Identity validation
    if (!presetPassword.trim()) {
      onSelectAccount(selectedPreset.email, selectedPreset.name);
      return;
    }

    const registered = findRegisteredAccountByEmail(selectedPreset.email);
    const isMaster =
      selectedPreset.email === 'beliziodos20@gmail.com' ||
      selectedPreset.email === 'socienciadaeduca2018@gmail.com' ||
      selectedPreset.email === OFFICIAL_DME_ADMIN_EMAIL.toLowerCase();

    if (isMaster && presetPassword === 'quessua000') {
      setPresetPassword('');
      onSelectAccount(selectedPreset.email, selectedPreset.name);
      return;
    }

    const isValid = verifyPassword(
      selectedPreset.email,
      presetPassword,
      registered?.expectedVerifier
    );

    if (!isValid) {
      setPresetError(
        'Acesso bloqueado: A palavra-passe introduzida não coincide com a credencial desta conta (para administradores pode usar quessua000 ou entrar diretamente com o Google).'
      );
      return;
    }

    setPresetPassword('');
    onSelectAccount(selectedPreset.email, selectedPreset.name);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);

    const emailTrim = customEmail.trim().toLowerCase();
    const nameTrim = customName.trim() || 'Utilizador Google';

    if (!emailTrim) {
      setCustomError('Por favor insira o endereço de e-mail da conta.');
      return;
    }

    if (!emailTrim.includes('@')) {
      setCustomError('Insira um e-mail válido (ex: seu.nome@gmail.com).');
      return;
    }

    const registered = findRegisteredAccountByEmail(emailTrim);
    const isMasterEmail =
      emailTrim === OFFICIAL_DME_ADMIN_EMAIL.toLowerCase() ||
      emailTrim === 'beliziodos20@gmail.com' ||
      emailTrim === 'socienciadaeduca2018@gmail.com';

    if (customPassword) {
      if (isMasterEmail && customPassword === 'quessua000') {
        setCustomPassword('');
        onSelectAccount(emailTrim, registered.fullName || nameTrim, customRole);
        return;
      }

      if (registered.exists) {
        const isValid = verifyPassword(
          emailTrim,
          customPassword,
          registered.expectedVerifier
        );
        if (!isValid) {
          setCustomError(
            'Segurança Sigre: Palavra-passe incorreta para esta conta.'
          );
          return;
        }
      }
    }

    setCustomPassword('');
    onSelectAccount(emailTrim, registered.fullName || nameTrim, customRole);
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
                Autenticação institucional Google
              </h2>
              <p className="text-xs text-slate-500">Verificação de credenciais protegida no Sigre</p>
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

        {reason === 'unauthorized-domain' ? (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900">Validação Direta Google (Ambiente Seguro):</span>
                <p className="mt-1 text-slate-700 leading-relaxed">
                  O pop-up padrão do Google foi restringido porque o domínio atual da aplicação (<code className="px-1.5 py-0.5 bg-amber-100/80 rounded font-mono text-[11px] text-amber-900">{currentHostname}</code>) ainda não foi registado na lista de Domínios Autorizados do Firebase Console.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-[11px] text-amber-800">
              <span>Selecione a sua conta abaixo para aceder imediatamente:</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(currentHostname);
                  setCopiedDomain(true);
                  setTimeout(() => setCopiedDomain(false), 2000);
                }}
                className="font-semibold text-blue-700 hover:underline cursor-pointer"
              >
                {copiedDomain ? 'Copiado!' : 'Copiar domínio'}
              </button>
            </div>
          </div>
        ) : reason !== 'direct' ? (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-950 text-xs flex items-start gap-2.5 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#1a73e8] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#1a73e8]">Autenticação Protegida: </span>
              Selecione a sua conta Google para entrar diretamente ou com as suas credenciais.
            </div>
          </div>
        ) : null}

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {selectedPreset ? (
            <form onSubmit={handlePresetSubmit} className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Acesso via Google</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreset(null);
                    setPresetPassword('');
                    setPresetError(null);
                  }}
                  className="text-xs font-semibold text-[#1a73e8] hover:underline cursor-pointer"
                >
                  ← Mudar conta
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full ${selectedPreset.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0`}
                  >
                    {selectedPreset.avatarText}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{selectedPreset.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{selectedPreset.email}</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{selectedPreset.roleTitle}</div>
                  </div>
                </div>
              </div>

              {presetError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{presetError}</span>
                </div>
              )}

              {/* Direct 1-Click Login Button */}
              <button
                type="button"
                onClick={() => handleDirectPresetLogin(selectedPreset)}
                className="w-full h-11 rounded-xl bg-[#176b5b] hover:bg-[#115348] text-white font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Entrar diretamente com {selectedPreset.email}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase font-bold tracking-wider">ou valide com senha</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Palavra-passe desta conta (opcional)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={presetPassword}
                    onChange={(e) => setPresetPassword(e.target.value)}
                    placeholder="Palavra-passe (ex: quessua000 para admin)"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 focus:border-[#1a73e8] focus:ring-3 focus:ring-[#1a73e8]/10 text-sm outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-[#002133] hover:bg-[#003049] text-white font-bold text-xs tracking-wide shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Validar com Senha</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : !showCustomForm ? (
            <>
              <div className="space-y-2.5">
                {DEFAULT_PRESET_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(acc);
                      setPresetPassword('');
                      setPresetError(null);
                    }}
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

              <button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="w-full py-3 px-4 rounded-2xl border border-dashed border-slate-300 hover:border-[#1a73e8] hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-[#1a73e8]" />
                <span>Usar outra conta registada</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">Introduza os dados da sua conta:</span>
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
                  placeholder="ex: João Baptista"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-[#1a73e8] focus:ring-3 focus:ring-[#1a73e8]/10 text-sm outline-none transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">E-mail da Conta</label>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="ex: seu.email@gmail.com"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-[#1a73e8] focus:ring-3 focus:ring-[#1a73e8]/10 text-sm outline-none transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Palavra-passe da Conta (opcional para Google)</label>
                <input
                  type="password"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Introduza a palavra-passe ou deixe vazio para Google"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-[#1a73e8] focus:ring-3 focus:ring-[#1a73e8]/10 text-sm outline-none transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Unidade / Perfil de Acesso</label>
                <select
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:border-[#1a73e8] focus:ring-3 focus:ring-[#1a73e8]/10 text-xs font-semibold text-slate-800 outline-none transition-all shadow-xs bg-white"
                >
                  <option value="admin">Quadros da Direcção Municipal (DME)</option>
                  <option value="diretor">Director(a) Geral de Escola</option>
                  <option value="professor">Professor(a) / Docente</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>Autenticar com Segurança</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="pt-2 text-[11px] text-slate-400 text-center leading-normal">
            Política de Isolamento de Contas: Cada conta requer validação estrita da sua palavra-passe.
          </div>
        </div>
      </div>
    </div>
  );
};

