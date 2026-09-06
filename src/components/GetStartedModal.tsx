import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import teacherImg from '../assets/images/teacher_classroom_1788697035170.jpg';
import type { UserAccount } from '../types';

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  initialMode?: 'login' | 'register';
}

export const GetStartedModal: React.FC<GetStartedModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'diretor' | 'professor'>('admin');

  // Synchronize mode when initialMode changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    handleResetForm();
  };

  const handleFillPreset = (preset: 'admin' | 'diretor' | 'professor') => {
    setSelectedRole(preset);
    if (preset === 'admin') {
      setEmail('admin.fred@ucore.edu.br');
      setPassword('Ucore@2026');
      setFirstName('Fred');
      setLastName('Silva');
      setAgreeTerms(true);
    } else if (preset === 'diretor') {
      setEmail('diretor.carl@ucore.edu.br');
      setPassword('Ucore@2026');
      setFirstName('Carl');
      setLastName('Mendes');
      setAgreeTerms(true);
    } else {
      setEmail('prof.santar@ucore.edu.br');
      setPassword('Ucore@2026');
      setFirstName('Santar');
      setLastName('Goes');
      setAgreeTerms(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'login') {
      if (!email.trim() || !password.trim()) {
        setErrorMsg('Por favor, informe seu e-mail e senha.');
        return;
      }
      setLoading(true);

      setTimeout(() => {
        setLoading(false);
        let resolvedRole: 'admin' | 'diretor' | 'professor' = selectedRole;
        if (email.includes('admin') || email.includes('fred')) {
          resolvedRole = 'admin';
        } else if (email.includes('diretor') || email.includes('carl')) {
          resolvedRole = 'diretor';
        } else if (email.includes('prof') || email.includes('santar') || email.includes('john') || email.includes('docente')) {
          resolvedRole = 'professor';
        }

        const derivedName = email.split('@')[0].split('.')[0] || 'Usuário';
        const formattedFirst = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
        const resolvedFirst = firstName.trim() || (resolvedRole === 'admin' ? 'Fred' : resolvedRole === 'diretor' ? 'Carl' : 'Santar');
        
        const loggedUser: UserAccount = {
          id: 'usr_' + Date.now(),
          firstName: resolvedFirst,
          lastName: lastName.trim() || 'uCore',
          email: email.trim(),
          role: resolvedRole,
          greeting: resolvedRole === 'admin' 
            ? `Olá Admin. ${resolvedFirst}` 
            : resolvedRole === 'diretor' 
            ? `Olá Diretor ${resolvedFirst}` 
            : `Olá Prof. ${resolvedFirst}`,
          rememberMe,
        };

        setSuccessMsg(`Bem-vindo, ${loggedUser.greeting}! Carregando interface e configurações...`);
        setTimeout(() => {
          onLoginSuccess(loggedUser);
          onClose();
        }, 1000);
      }, 700);
    } else {
      // Register validation
      if (!firstName.trim()) {
        setErrorMsg('Por favor, informe seu nome (First Name).');
        return;
      }
      if (!email.trim()) {
        setErrorMsg('Por favor, informe um endereço de e-mail válido.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMsg('A senha deve possuir pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas digitadas não coincidem.');
        return;
      }
      if (!agreeTerms) {
        setErrorMsg('Você precisa aceitar os Termos e Políticas de Privacidade.');
        return;
      }

      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        const userFirst = firstName.trim();
        const prefix = selectedRole === 'admin' ? 'Admin.' : selectedRole === 'diretor' ? 'Diretor' : 'Prof.';
        const newUser: UserAccount = {
          id: 'usr_' + Date.now(),
          firstName: userFirst,
          lastName: lastName.trim() || 'uCore',
          email: email.trim(),
          role: selectedRole,
          greeting: `Olá ${prefix} ${userFirst}`,
          rememberMe: true,
        };

        setSuccessMsg(`Conta criada com sucesso! Inicializando interface de ${prefix} ${userFirst}...`);
        setTimeout(() => {
          onLoginSuccess(newUser);
          onClose();
        }, 1100);
      }, 750);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setForgotPasswordOpen(false);
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      {/* Modal Container with 2-Column Split matching mockup 2.png and 3.png */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.25)] border border-slate-200/80 overflow-hidden my-auto">
        {/* Floating Close Button */}
        <button
          id="auth-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 bg-white/80 hover:bg-white text-slate-500 hover:text-slate-900 rounded-full border border-slate-200 shadow-sm transition-all duration-200 cursor-pointer focus:outline-none"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
          {/* Left Column: Teacher Image matching reference 2.png & 3.png */}
          <div className="md:col-span-5 bg-slate-100 relative overflow-hidden flex flex-col justify-end p-6 min-h-[260px] md:min-h-[580px]">
            <img
              src={teacherImg}
              alt="Professora na sala de aula uCore"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent pointer-events-none" />

            {/* Educational Quote / Brand Badge */}
            <div className="relative z-10 text-white space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5067fc]/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                <Sparkles className="w-3 h-3 text-[#27c1dc]" />
                Central uCore
              </div>
              <h4 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                Estrutura digital ágil para o ambiente escolar.
              </h4>
              <p className="text-xs text-white/80 font-medium leading-relaxed">
                Gestão integrada de turmas, docentes e rendimento pedagógico em uma única plataforma.
              </p>
            </div>
          </div>

          {/* Right Column: Authentication Card matching 2.png / 3.png */}
          <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white">
            {forgotPasswordOpen ? (
              /* Forgot password sub-view */
              <div className="space-y-6 max-w-md mx-auto w-full">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Recuperar Senha
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                    Digite seu e-mail cadastrado para enviarmos o link de redefinição.
                  </p>
                </div>

                {forgotSuccess ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-xs font-semibold">
                      Link de recuperação enviado com sucesso para {forgotEmail}! Verifique sua caixa de entrada.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        E-mail de cadastro
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="seu.email@exemplo.com"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-sm outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-[#5067fc] hover:bg-[#4359eb] text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
                    >
                      Enviar link de recuperação
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setForgotPasswordOpen(false)}
                        className="text-xs font-semibold text-[#5067fc] hover:underline cursor-pointer"
                      >
                        ← Voltar ao login
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : mode === 'login' ? (
              /* SIGN IN FORM (Matching image 2.png) */
              <div className="max-w-md mx-auto w-full space-y-6">
                {/* Heading */}
                <div className="text-center sm:text-left">
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Sign in
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Welcome back! Please sign in to continue
                  </p>
                </div>

                {/* Error / Success Feedback */}
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email id field */}
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="login-email-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email id"
                        className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="login-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full pl-11 pr-11 py-3 rounded-full border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me & Forgot Password */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-[#5067fc] focus:ring-[#5067fc] border-slate-300 cursor-pointer"
                      />
                      <span>Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(true)}
                      className="text-xs font-semibold text-[#5067fc] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="submit-login-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-full bg-[#5067fc] hover:bg-[#4359eb] text-white font-bold text-sm shadow-[0_6px_20px_rgba(80,103,252,0.35)] transition-all duration-200 cursor-pointer active:scale-98 disabled:opacity-70 mt-2"
                  >
                    {loading ? 'Iniciando sessão...' : 'Login'}
                  </button>

                  {/* Quick demo presets for the 3 official sessions */}
                  <div className="pt-2 flex flex-col items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Acesso Rápido com Sessões Oficiais:
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleFillPreset('admin')}
                        className="text-[11px] font-bold text-[#5067fc] bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full cursor-pointer transition-colors flex items-center gap-1 border border-indigo-100"
                      >
                        <span>👑</span> Admin. Fred
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFillPreset('diretor')}
                        className="text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full cursor-pointer transition-colors flex items-center gap-1 border border-slate-200"
                      >
                        <span>🏫</span> Diretor Carl
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFillPreset('professor')}
                        className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full cursor-pointer transition-colors flex items-center gap-1 border border-emerald-100"
                      >
                        <span>👨‍🏫</span> Prof. John
                      </button>
                    </div>
                  </div>

                  {/* Bottom Switch Link */}
                  <div className="text-center pt-3 text-xs text-slate-600">
                    Don’t have an account?{' '}
                    <button
                      type="button"
                      id="switch-to-register-btn"
                      onClick={() => switchMode('register')}
                      className="font-bold text-[#5067fc] hover:underline cursor-pointer"
                    >
                      Sign up
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* CREATE ACCOUNT FORM (Matching image 3.png) */
              <div className="max-w-md mx-auto w-full space-y-5">
                {/* Heading */}
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Create Account
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your information to create a new account
                  </p>
                </div>

                {/* Error / Success Feedback */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Perfil da Sessão / Cargo:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('admin')}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          selectedRole === 'admin'
                            ? 'bg-[#5067fc] text-white border-[#5067fc] shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('diretor')}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          selectedRole === 'diretor'
                            ? 'bg-[#5067fc] text-white border-[#5067fc] shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Diretor
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('professor')}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          selectedRole === 'professor'
                            ? 'bg-[#5067fc] text-white border-[#5067fc] shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Professor
                      </button>
                    </div>
                  </div>

                  {/* First Name & Last Name Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        First Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="register-firstname-input"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="John"
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Last Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="register-lastname-input"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Doe"
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="register-email-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john.doe@example.com"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="register-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="register-confirm-password-input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Terms checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-[#5067fc] focus:ring-[#5067fc] border-slate-300 cursor-pointer"
                      />
                      <span className="leading-tight">
                        I agree to the <span className="text-slate-800 font-semibold underline">Terms and Conditions</span> and <span className="text-slate-800 font-semibold underline">Privacy Policy</span>
                      </span>
                    </label>
                  </div>

                  {/* Create Account Button */}
                  <button
                    id="submit-register-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-[#5067fc] hover:bg-[#4359eb] text-white font-bold text-sm shadow-[0_6px_20px_rgba(80,103,252,0.35)] transition-all duration-200 cursor-pointer active:scale-98 disabled:opacity-70 mt-3"
                  >
                    {loading ? 'Criando conta...' : 'Create Account'}
                  </button>

                  {/* Bottom Switch Link */}
                  <div className="text-center pt-2 text-xs text-slate-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      id="switch-to-login-btn"
                      onClick={() => switchMode('login')}
                      className="font-bold text-[#5067fc] hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
