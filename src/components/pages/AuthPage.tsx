import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  GraduationCap
} from 'lucide-react';
import teacherImg from '../../assets/images/teacher_classroom_1788697035170.jpg';
import type { UserAccount } from '../../types';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onLoginSuccess: (user: UserAccount) => void;
  onBackToHome: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onLoginSuccess,
  onBackToHome,
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
          onLoginSuccess(loggedUser);
        }, 900);
      }, 650);
    } else {
      // Register validation
      if (!firstName.trim()) {
        setErrorMsg('Por favor, informe seu primeiro nome.');
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
        setErrorMsg('Você precisa aceitar os Termos de Uso e Política de Privacidade.');
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

        setSuccessMsg(`Conta criada com sucesso! Acessando ambiente de ${prefix} ${userFirst}...`);
        setTimeout(() => {
          onLoginSuccess(newUser);
        }, 900);
      }, 700);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setForgotPasswordOpen(false);
    }, 2500);
  };

  return (
    <div id="auth-full-page" className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-[#5067fc] selection:text-white">
      {/* Top Header Bar */}
      <header className="w-full bg-[#4f67ff] border-b border-white/10 px-4 sm:px-8 py-3.5 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <button
            id="auth-header-logo-btn"
            onClick={onBackToHome}
            className="flex items-center gap-2.5 cursor-pointer group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <svg
                className="w-4 h-4 text-[#3B82F6]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-white uppercase">
              u<span className="text-[#27c1dc]">Core</span>
            </span>
          </button>

          {/* Navigation controls */}
          <div className="flex items-center gap-3">
            {/* Mode switch pill */}
            <div className="hidden sm:flex items-center bg-white/15 p-1 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold text-white border border-white/20">
              <button
                id="tab-login-btn"
                onClick={() => switchMode('login')}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-white/80 hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                id="tab-register-btn"
                onClick={() => switchMode('register')}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-white/80 hover:text-white'
                }`}
              >
                Cadastrar
              </button>
            </div>

            {/* Back to Home Button */}
            <button
              id="auth-back-home-btn"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/25 px-4 py-2 rounded-full transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Início</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Form Section */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          
          {/* Left Hero Column: Completely visible photo without obscuring elements */}
          <div className="hidden lg:block lg:col-span-5 relative overflow-hidden bg-slate-100 min-h-full">
            <img
              src={teacherImg}
              alt="Professora e ambiente escolar uCore"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center select-none"
            />
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
            {forgotPasswordOpen ? (
              /* Forgot password sub-view */
              <div className="space-y-6 max-w-md mx-auto w-full">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#5067fc] tracking-widest bg-blue-50 px-2.5 py-1 rounded-full mb-3">
                    Recuperação de Acesso
                  </div>
                  <h2 className="text-3xl font-black uppercase text-slate-900 tracking-tight">
                    Recuperar Senha
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                    Informe o e-mail cadastrado na plataforma uCore para enviarmos as instruções de redefinição.
                  </p>
                </div>

                {forgotSuccess ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-xs font-semibold">
                      Link de recuperação enviado com sucesso para <span className="font-bold">{forgotEmail}</span>! Verifique sua caixa de entrada e spam.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-sm outline-none transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-[#5067fc] hover:bg-[#4359eb] text-white font-bold text-xs uppercase tracking-widest shadow-md transition-all cursor-pointer"
                    >
                      Enviar link de recuperação
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setForgotPasswordOpen(false)}
                        className="text-xs font-bold text-[#5067fc] hover:underline cursor-pointer"
                      >
                        ← Voltar ao login
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : mode === 'login' ? (
              /* LOGIN / SIGN IN FORM (FULL PAGE VIEW) */
              <div className="max-w-md mx-auto w-full space-y-6">
                {/* Heading */}
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#5067fc] tracking-widest bg-blue-50 px-2.5 py-1 rounded-full mb-2">
                    Acesso à Plataforma
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black uppercase text-slate-900 tracking-tight">
                    Entrar na Central
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Bem-vindo de volta! Faça login com suas credenciais institucionais.
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

                {/* Quick Presets for Demo / Testing */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#5067fc]" />
                      Preenchimento Rápido por Perfil:
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      id="preset-admin-btn"
                      onClick={() => handleFillPreset('admin')}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer flex flex-col items-center gap-1.5 ${
                        selectedRole === 'admin'
                          ? 'bg-[#4f67ff] text-white border-[#4f67ff] shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin</span>
                    </button>
                    <button
                      type="button"
                      id="preset-diretor-btn"
                      onClick={() => handleFillPreset('diretor')}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer flex flex-col items-center gap-1.5 ${
                        selectedRole === 'diretor'
                          ? 'bg-[#4f67ff] text-white border-[#4f67ff] shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Diretor</span>
                    </button>
                    <button
                      type="button"
                      id="preset-professor-btn"
                      onClick={() => handleFillPreset('professor')}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer flex flex-col items-center gap-1.5 ${
                        selectedRole === 'professor'
                          ? 'bg-[#4f67ff] text-white border-[#4f67ff] shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Professor</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                        placeholder="seu.email@ucore.edu.br"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Senha de Acesso
                    </label>
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
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
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

                  {/* Remember me & Forgot Password */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-[#5067fc] focus:ring-[#5067fc] border-slate-300 cursor-pointer"
                      />
                      <span>Lembrar minhas credenciais</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(true)}
                      className="text-xs font-bold text-[#5067fc] hover:underline cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="submit-login-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-[#5067fc] hover:bg-[#4359eb] text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_6px_20px_rgba(80,103,252,0.35)] hover:shadow-[0_8px_25px_rgba(80,103,252,0.45)] transition-all duration-200 cursor-pointer active:scale-98 disabled:opacity-70 mt-2 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Validando credenciais...' : 'Entrar na Central'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Bottom Switch Link */}
                  <div className="text-center pt-3 text-xs text-slate-600">
                    Ainda não possui uma conta?{' '}
                    <button
                      type="button"
                      id="switch-to-register-btn"
                      onClick={() => switchMode('register')}
                      className="font-bold text-[#5067fc] hover:underline cursor-pointer uppercase tracking-wider"
                    >
                      Criar Conta / Sign Up
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* SIGN UP / REGISTER FORM (FULL PAGE VIEW) */
              <div className="max-w-md mx-auto w-full space-y-5">
                {/* Heading */}
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#27c1dc] tracking-widest bg-cyan-50 px-2.5 py-1 rounded-full mb-2">
                    Novo Cadastro Escolar
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black uppercase text-slate-900 tracking-tight">
                    Criar Conta
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Cadastre-se na Central uCore para ingressar na gestão da sua escola.
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
                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Seu Perfil / Cargo na Instituição:
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
                        Administrador
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

                  {/* Name and Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
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
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
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
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
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
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
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
                          placeholder="Mínimo 6 dígitos"
                          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
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
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
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
                          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
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
                        Concordo com os <span className="text-[#5067fc] font-bold underline">Termos de Uso</span> e a <span className="text-[#5067fc] font-bold underline">Política de Privacidade</span> da plataforma uCore.
                      </span>
                    </label>
                  </div>

                  {/* Create Account Button */}
                  <button
                    id="submit-register-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-[#5067fc] hover:bg-[#4359eb] text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_6px_20px_rgba(80,103,252,0.35)] hover:shadow-[0_8px_25px_rgba(80,103,252,0.45)] transition-all duration-200 cursor-pointer active:scale-98 disabled:opacity-70 mt-2 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Cadastrando usuário...' : 'Criar Minha Conta'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Bottom Switch Link */}
                  <div className="text-center pt-2 text-xs text-slate-600">
                    Já possui cadastro na plataforma?{' '}
                    <button
                      type="button"
                      id="switch-to-login-btn"
                      onClick={() => switchMode('login')}
                      className="font-bold text-[#5067fc] hover:underline cursor-pointer uppercase tracking-wider"
                    >
                      Fazer Login / Entrar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        Central uCore • Plataforma de Gestão Educacional para Escolas, Professores e Alunos
      </footer>
    </div>
  );
};
