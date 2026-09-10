import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  GraduationCap,
  Box,
  Loader2,
  Info
} from 'lucide-react';
import teacherImg from '../../assets/images/teacher_classroom_1788697035170.jpg';
import type { UserAccount } from '../../types';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onLoginSuccess: (user: UserAccount) => void;
  onBackToHome: () => void;
  hideHeader?: boolean;
  onAuthLoadingChange?: (loading: boolean, action?: 'login' | 'register') => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onLoginSuccess,
  onBackToHome,
  hideHeader = false,
  onAuthLoadingChange,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'diretor' | 'professor'>('admin');

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [initialMode]);

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setForgotPasswordOpen(false);
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
      onAuthLoadingChange?.(true, 'login');

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

        setSuccessMsg(`Bem-vindo, ${loggedUser.greeting}! Redirecionando para a Central uCore...`);
        setTimeout(() => {
          onAuthLoadingChange?.(false);
          onLoginSuccess(loggedUser);
        }, 900);
      }, 650);
    } else {
      // Register validation
      if (!firstName.trim()) {
        setErrorMsg('Por favor, informe o seu primeiro nome.');
        return;
      }
      if (!email.trim()) {
        setErrorMsg('Por favor, informe um endereço de e-mail institucional válido.');
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
        setErrorMsg('É necessário aceitar os Termos de Uso e a Política de Privacidade.');
        return;
      }

      setLoading(true);
      onAuthLoadingChange?.(true, 'register');
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

        setSuccessMsg(`Conta criada com sucesso! Acessando ambiente de ${prefix} ${userFirst}...`);
        setTimeout(() => {
          onAuthLoadingChange?.(false);
          onLoginSuccess(newUser);
        }, 900);
      }, 700);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setForgotPasswordOpen(false);
    }, 2500);
  };

  return (
    <div 
      id="auth-full-page" 
      className="min-h-screen w-full bg-gradient-to-b from-[#f8f9fb] via-[#f3f5f8] to-[#edf1f5] text-slate-900 flex flex-col justify-between selection:bg-[#f75142] selection:text-white font-sans"
    >
      {/* Top Header Bar (when standalone) */}
      {!hideHeader && (
        <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
            {/* Logo */}
            <button
              id="auth-header-logo-btn"
              onClick={onBackToHome}
              className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-[#f75142] flex items-center justify-center shadow-md group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300">
                <Box className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-black tracking-tight text-[#002133]">
                uCore
              </span>
            </button>

            {/* Navigation controls */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                id="auth-back-home-btn"
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#f75142] transition-colors cursor-pointer mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Início</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="tab-login-btn"
                  onClick={() => switchMode('login')}
                  className={`text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-slate-100 text-[#002133] font-bold'
                      : 'text-slate-600 hover:text-[#002133]'
                  }`}
                >
                  Entrar
                </button>
                <button
                  id="tab-register-btn"
                  onClick={() => switchMode('register')}
                  className={`text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs ${
                    mode === 'register'
                      ? 'bg-[#002133] text-white'
                      : 'bg-[#f75142] hover:bg-[#e04436] text-white'
                  }`}
                >
                  Inscreva-se
                </button>
              </div>
            </div>
          </div>
          <div className="w-full h-[2px] bg-gradient-to-r from-[#f75142] via-[#f75142]/80 to-[#002133]" />
        </header>
      )}

      {/* Main Content Area: Balanced 1120px Card */}
      <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 flex items-center justify-center">
        <div 
          id="auth-card-container"
          className="w-full bg-white rounded-3xl shadow-[0_12px_40px_-8px_rgba(0,33,51,0.08),0_2px_6px_rgba(0,33,51,0.04)] border border-slate-200/90 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[560px] lg:min-h-[600px] transition-all"
        >
          
          {/* Left Column: Visual Photography with Navy Degradé & Context */}
          <div className="hidden md:block md:col-span-5 lg:col-span-5 relative overflow-hidden bg-[#002133] select-none">
            <img
              src={teacherImg}
              alt="Professora e ambiente escolar uCore"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top filter brightness-[0.98] contrast-[1.02] transition-transform duration-700 hover:scale-105"
            />
            
            {/* Navy Degradé on bottom third - doesn't cover face */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#002133] via-[#002133]/65 via-35% to-transparent pointer-events-none" />

            {/* Context Message */}
            <div className="absolute bottom-0 inset-x-0 p-6 lg:p-8 text-white z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-bold tracking-wide uppercase text-white/90">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f75142]" />
                Rede de Ensino Integrada
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
                A sua escola, mais conectada.
              </h3>
              <p className="text-xs text-white/80 leading-relaxed font-normal pt-0.5">
                Organização eficiente de turmas, docentes e rendimento escolar com a tecnologia uCore.
              </p>
            </div>
          </div>

          {/* Right Column: High-Comfort Form */}
          <div className="col-span-1 md:col-span-7 lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white">
            
            {/* Forgot Password Sub-view */}
            {forgotPasswordOpen ? (
              <div className="max-w-[420px] mx-auto w-full space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#f75142] bg-[#fef2f1] px-3 py-1 rounded-full mb-2">
                    Recuperação de Acesso
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#002133] tracking-tight">
                    Recuperar senha
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Indique o seu e-mail institucional para receber o link de redefinição.
                  </p>
                </div>

                {forgotSuccess ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-xs font-semibold">
                      Link de recuperação enviado com sucesso para <span className="font-bold">{forgotEmail}</span>!
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
                          placeholder="seu.email@ucore.edu.br"
                          className="w-full h-[48px] sm:h-[50px] pl-10 pr-4 rounded-xl border border-slate-200 focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm outline-none transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full h-[48px] sm:h-[50px] rounded-xl bg-[#f75142] hover:bg-[#e04436] text-white font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Enviar link de recuperação</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setForgotPasswordOpen(false)}
                        className="text-xs font-semibold text-slate-600 hover:text-[#f75142] transition-colors cursor-pointer"
                      >
                        ← Voltar ao login
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : mode === 'login' ? (
              /* LOGIN VIEW */
              <div className="max-w-[420px] mx-auto w-full space-y-5">
                
                {/* Header with refined typography */}
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#f75142] bg-[#fef2f1] px-3 py-1 rounded-full mb-2">
                    Acesso Institucional
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002133] tracking-tight">
                    Bem-vindo à Central
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Introduza as suas credenciais para aceder à gestão escolar da uCore.
                  </p>
                </div>

                {/* Feedback Alerts */}
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
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

                {/* Subtle Profile Demo Selector - Low Visual Weight to not compete with primary CTA */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      Acesso rápido por perfil:
                    </span>
                    <span className="text-[10px] text-slate-400">Clique para testar</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      id="preset-admin-btn"
                      onClick={() => handleFillPreset('admin')}
                      className={`py-2 px-2 rounded-xl text-xs font-medium transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                        selectedRole === 'admin'
                          ? 'bg-[#002133] text-white border-[#002133] font-semibold shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/70 hover:text-slate-900'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Admin</span>
                    </button>

                    <button
                      type="button"
                      id="preset-diretor-btn"
                      onClick={() => handleFillPreset('diretor')}
                      className={`py-2 px-2 rounded-xl text-xs font-medium transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                        selectedRole === 'diretor'
                          ? 'bg-[#002133] text-white border-[#002133] font-semibold shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/70 hover:text-slate-900'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Diretor</span>
                    </button>

                    <button
                      type="button"
                      id="preset-professor-btn"
                      onClick={() => handleFillPreset('professor')}
                      className={`py-2 px-2 rounded-xl text-xs font-medium transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                        selectedRole === 'professor'
                          ? 'bg-[#002133] text-white border-[#002133] font-semibold shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/70 hover:text-slate-900'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                      <span>Professor</span>
                    </button>
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Email Input: Comfortable 48-52px height */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      E-mail Institucional
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="login-email-input"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nome@ucore.edu.br"
                        className="w-full h-[48px] sm:h-[50px] pl-10 pr-4 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Password Input: Comfortable 48-52px height */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Senha de Acesso
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotPasswordOpen(true)}
                        className="text-xs font-semibold text-[#f75142] hover:underline cursor-pointer"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="login-password-input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-[48px] sm:h-[50px] pl-10 pr-11 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me Checkbox */}
                  <div className="flex items-center pt-0.5">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-[#f75142] focus:ring-[#f75142] border-slate-300 cursor-pointer"
                      />
                      <span>Manter sessão iniciada neste dispositivo</span>
                    </label>
                  </div>

                  {/* Primary Submit Button: High contrast, coral uCore, prominent focus */}
                  <button
                    id="submit-login-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full h-[48px] sm:h-[50px] rounded-xl bg-[#f75142] hover:bg-[#e04436] text-white font-bold text-sm tracking-wide shadow-[0_6px_20px_rgba(247,81,66,0.25)] hover:shadow-[0_8px_24px_rgba(247,81,66,0.35)] transition-all duration-200 cursor-pointer active:scale-[0.99] disabled:opacity-70 mt-1 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>A autenticar credenciais...</span>
                      </>
                    ) : (
                      <>
                        <span>Entrar na Central</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Switch to Register */}
                  <div className="text-center pt-2 text-xs text-slate-600">
                    Ainda não possui uma conta?{' '}
                    <button
                      type="button"
                      id="switch-to-register-btn"
                      onClick={() => switchMode('register')}
                      className="font-bold text-[#f75142] hover:underline cursor-pointer"
                    >
                      Crie a sua conta
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* REGISTER VIEW */
              <div className="max-w-[440px] mx-auto w-full space-y-4">
                
                {/* Header */}
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#f75142] bg-[#fef2f1] px-3 py-1 rounded-full mb-2">
                    Novo Cadastro
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002133] tracking-tight">
                    Crie a sua conta
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Junte-se à plataforma uCore para gerir turmas, notas e indicadores escolares.
                  </p>
                </div>

                {/* Feedback Alerts */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  
                  {/* Role Selector: Discreto e integrado, sem roubar atenção */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Perfil de Atuação na Escola
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('admin')}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                          selectedRole === 'admin'
                            ? 'bg-[#002133] text-white border-[#002133] font-semibold shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Administrador
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('diretor')}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                          selectedRole === 'diretor'
                            ? 'bg-[#002133] text-white border-[#002133] font-semibold shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Diretor
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('professor')}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                          selectedRole === 'professor'
                            ? 'bg-[#002133] text-white border-[#002133] font-semibold shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Professor
                      </button>
                    </div>
                  </div>

                  {/* Nome e Sobrenome lado a lado no desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Primeiro Nome
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="register-firstname-input"
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Ex: Carlos"
                          className="w-full h-[48px] pl-10 pr-3 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Sobrenome
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
                          placeholder="Ex: Silva"
                          className="w-full h-[48px] pl-10 pr-3 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* E-mail Institucional */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      E-mail Institucional
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="register-email-input"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu.nome@ucore.edu.br"
                        className="w-full h-[48px] pl-10 pr-3 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Senha e Confirmação lado a lado com orientação */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Senha
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="register-password-input"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full h-[48px] pl-10 pr-9 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="register-confirm-password-input"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a senha"
                          className="w-full h-[48px] pl-10 pr-9 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Orientação de senha próxima ao campo */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>A senha deve possuir no mínimo 6 caracteres para assegurar o acesso.</span>
                  </div>

                  {/* Termos de uso */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-[#f75142] focus:ring-[#f75142] border-slate-300 cursor-pointer"
                      />
                      <span className="leading-tight">
                        Concordo com os <span className="text-[#f75142] font-semibold underline">Termos de Uso</span> e a <span className="text-[#f75142] font-semibold underline">Política de Privacidade</span> da uCore.
                      </span>
                    </label>
                  </div>

                  {/* Create Account Button */}
                  <button
                    id="submit-register-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full h-[48px] sm:h-[50px] rounded-xl bg-[#f75142] hover:bg-[#e04436] text-white font-bold text-sm tracking-wide shadow-[0_6px_20px_rgba(247,81,66,0.25)] hover:shadow-[0_8px_24px_rgba(247,81,66,0.35)] transition-all duration-200 cursor-pointer active:scale-[0.99] disabled:opacity-70 mt-1 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>A criar conta institucional...</span>
                      </>
                    ) : (
                      <>
                        <span>Criar Minha Conta</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Switch to Login */}
                  <div className="text-center pt-2 text-xs text-slate-600">
                    Já possui cadastro na plataforma?{' '}
                    <button
                      type="button"
                      id="switch-to-login-btn"
                      onClick={() => switchMode('login')}
                      className="font-bold text-[#f75142] hover:underline cursor-pointer"
                    >
                      Entrar na Central
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Note (when standalone) */}
      {!hideHeader && (
        <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-200/80 bg-white">
          Central uCore • Plataforma de Gestão Educacional para Escolas, Professores e Alunos
        </footer>
      )}
    </div>
  );
};
