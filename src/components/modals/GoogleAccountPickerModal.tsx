import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, ArrowRight, AlertTriangle, Lock, Mail, User, Loader2, ArrowLeft } from 'lucide-react';
import { verifyPassword } from '../../utils/passwordService';
import {
  findRegisteredAccountByEmail,
  syncApplicationsFromServer,
  OFFICIAL_DME_ADMIN_EMAIL,
} from '../../utils/authApprovalStorage';
import { fetchUserFromFirestore } from '../../utils/firestoreSync';

interface GoogleAccountPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (email: string, name: string, role?: string) => void;
  reason?: 'unauthorized-domain' | 'popup-blocked' | 'direct' | 'fallback';
}

export const GoogleAccountPickerModal: React.FC<GoogleAccountPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
}) => {
  const [step, setStep] = useState<'email' | 'password' | 'new-profile'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [resolvedHolderName, setResolvedHolderName] = useState<string>('');
  const [remoteVerifier, setRemoteVerifier] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setStep('email');
      setEmailInput('');
      setNameInput('');
      setPasswordInput('');
      setErrorMsg(null);
      setIsChecking(false);
      setResolvedHolderName('');
      setRemoteVerifier(undefined);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEmailStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailTrim = emailInput.trim().toLowerCase();
    if (!emailTrim) {
      setErrorMsg('Introduza o seu endereço de e-mail Google.');
      return;
    }

    if (!emailTrim.includes('@') || !emailTrim.includes('.')) {
      setErrorMsg('Introduza um endereço de e-mail válido (ex: seu.nome@gmail.com).');
      return;
    }

    setIsChecking(true);
    try {
      // Sync applications and check Firestore so existing accounts are always recognized across devices
      await syncApplicationsFromServer().catch(() => {});
      const localLookup = findRegisteredAccountByEmail(emailTrim);
      const cloudUser = await fetchUserFromFirestore(emailTrim).catch(() => null);

      const isMasterEmail =
        emailTrim === OFFICIAL_DME_ADMIN_EMAIL.toLowerCase() ||
        emailTrim === 'beliziodos20@gmail.com';

      const accountExists = Boolean(localLookup.exists || cloudUser || isMasterEmail);

      if (accountExists) {
        const holder =
          localLookup.fullName ||
          (cloudUser ? `${cloudUser.firstName || ''} ${cloudUser.lastName || ''}`.trim() : '') ||
          localLookup.dmeStaff?.name ||
          localLookup.director?.name ||
          localLookup.teacher?.name ||
          'Conta Institucional Registada';
        const verifier = localLookup.expectedVerifier || cloudUser?.passwordVerifier;

        setResolvedHolderName(holder);
        setRemoteVerifier(verifier);
        setPasswordInput('');
        setStep('password');
      } else {
        // Brand-new Google email: ask for full name to start the 3-step registration wizard
        setNameInput('');
        setStep('new-profile');
      }
    } catch {
      setErrorMsg('Não foi possível verificar o e-mail neste momento. Tente novamente.');
    } finally {
      setIsChecking(false);
    }
  };

  const handlePasswordStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailTrim = emailInput.trim().toLowerCase();
    if (!passwordInput) {
      setErrorMsg('Por segurança, introduza a palavra-passe desta conta para continuar.');
      return;
    }

    const isValid = verifyPassword(emailTrim, passwordInput, remoteVerifier);
    if (!isValid) {
      setErrorMsg(
        'A palavra-passe introduzida está incorreta para esta conta. Por segurança, o acesso foi bloqueado.'
      );
      return;
    }

    setPasswordInput('');
    onSelectAccount(emailTrim, resolvedHolderName || 'Utilizador Google');
  };

  const handleNewProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailTrim = emailInput.trim().toLowerCase();
    const cleanName = nameInput.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Por favor introduza o seu nome e sobrenome para iniciar a inscrição.');
      return;
    }

    onSelectAccount(emailTrim, cleanName);
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
        className="relative w-full max-w-[440px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-200"
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
                Continuar com o Google
              </h2>
              <p className="text-xs text-slate-500">Prosseguir para o SIGRE</p>
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

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailStepSubmit} className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label htmlFor="google-email-field" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Endereço de e-mail Google
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="google-email-field"
                    type="email"
                    required
                    autoFocus
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="seu.email@gmail.com"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 focus:border-[#1a73e8] focus:ring-3 focus:ring-[#1a73e8]/10 text-sm outline-none transition-all shadow-xs"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
                  Se já tiver conta no SIGRE, ser-lhe-á pedida a sua senha. Se for novo utilizador, avançará para a criação da sua inscrição.
                </p>
              </div>

              <button
                type="submit"
                disabled={isChecking}
                className="w-full h-11 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-60 text-white font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>A verificar conta...</span>
                  </>
                ) : (
                  <>
                    <span>Seguinte</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordStepSubmit} className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Conta existente localizada</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setPasswordInput('');
                    setErrorMsg(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a73e8] hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Trocar e-mail</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1a73e8] text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                  {emailInput.trim().slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{resolvedHolderName}</div>
                  <div className="text-[11px] text-slate-500 truncate">{emailInput.trim().toLowerCase()}</div>
                </div>
              </div>

              <div>
                <label htmlFor="google-password-field" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Palavra-passe da sua conta SIGRE *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="google-password-field"
                    type="password"
                    required
                    autoFocus
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Introduza a sua palavra-passe"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 focus:border-[#1a73e8] focus:ring-3 focus:ring-[#1a73e8]/10 text-sm outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#002133] hover:bg-[#003049] text-white font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Confirmar e Entrar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 'new-profile' && (
            <form onSubmit={handleNewProfileSubmit} className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Nova inscrição com o Google</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setErrorMsg(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a73e8] hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Trocar e-mail</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 text-xs leading-relaxed">
                O e-mail <strong>{emailInput.trim().toLowerCase()}</strong> será vinculado à sua nova conta. Indique o seu nome para avançar para a escolha de função e escola.
              </div>

              <div>
                <label htmlFor="google-name-field" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nome e Sobrenome *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="google-name-field"
                    type="text"
                    required
                    autoFocus
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Ex.: João Baptista"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 focus:border-[#1a73e8] focus:ring-3 focus:ring-[#1a73e8]/10 text-sm outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#176b5b] hover:bg-[#115348] text-white font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continuar para Inscrição</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Isolamento estrito de contas • Proteção de credenciais SIGRE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
