import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, User, CheckCircle2, Menu, X, BookOpen, Users, Calendar, LogOut, Home, MessageSquare, Box, Megaphone, GraduationCap, Loader2, Settings, ShieldCheck, LayoutDashboard, BarChart3, School, UserCheck, ClipboardCheck, DoorOpen, FileText } from 'lucide-react';
import type { NotificationItem, UserAccount } from '../types';
import { getPendingApplications } from '../utils/authApprovalStorage';

interface NavbarProps {
  onOpenGetStarted: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
  onNavigateToHome?: () => void;
  onOpenAbout: () => void;
  onOpenProfile: () => void;
  onOpenSupport: () => void;
  onOpenChat?: () => void;
  onOpenRag?: () => void;
  unreadChatCount?: number;
  onSelectPage: (page: string) => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  activeRole?: string;
  currentPage?: string;
  currentView?: string;
  onSwitchRole?: (role: 'admin' | 'diretor' | 'professor') => void;
  isAuthLoading?: boolean;
  authLoadingAction?: 'login' | 'register' | null;
  onOpenSettings?: () => void;
  onOpenDemoModal?: () => void;
  onOpenGoogleSheets?: () => void;
}

const mockNotifications: NotificationItem[] = [];


export const Navbar: React.FC<NavbarProps> = ({
  onOpenGetStarted,
  onNavigateToLogin,
  onNavigateToRegister,
  onNavigateToHome,
  onOpenAbout,
  onOpenProfile,
  onOpenSupport,
  onOpenChat,
  onOpenRag,
  unreadChatCount = 0,
  onSelectPage,
  currentUser,
  onLogout,
  activeRole,
  currentPage = 'home',
  currentView = 'home',
  onSwitchRole,
  isAuthLoading = false,
  authLoadingAction = null,
  onOpenSettings,
  onOpenDemoModal,
  onOpenGoogleSheets,
}) => {
  const [showPagesDropdown, setShowPagesDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [navLoadingAction, setNavLoadingAction] = useState<'login' | 'register' | null>(null);
  const [pendingAppsCount, setPendingAppsCount] = useState({ director: 0, admin: 0 });

  useEffect(() => {
    const updateCounts = () => {
      try {
        const all = getPendingApplications();
        const dirPending = all.filter((a) => a.targetApproverRole === 'diretor' && a.status === 'pendente').length;
        const admPending = all.filter((a) => (a.targetApproverRole === 'admin' || a.type === 'diretor') && a.status === 'pendente').length;
        setPendingAppsCount({ director: dirPending, admin: admPending });
      } catch {
        // ignore
      }
    };
    updateCounts();
    const interval = setInterval(updateCounts, 2500);
    return () => clearInterval(interval);
  }, []);

  const isLoginLoading = (isAuthLoading && authLoadingAction === 'login') || navLoadingAction === 'login';
  const isRegisterLoading = (isAuthLoading && authLoadingAction === 'register') || navLoadingAction === 'register';

  const handleLoginClick = () => {
    if (isLoginLoading || isRegisterLoading) return;
    setNavLoadingAction('login');
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else {
      onOpenGetStarted();
    }
    setTimeout(() => {
      setNavLoadingAction(null);
    }, 450);
  };

  const handleRegisterClick = () => {
    if (isLoginLoading || isRegisterLoading) return;
    setNavLoadingAction('register');
    if (onNavigateToRegister) {
      onNavigateToRegister();
    } else {
      onOpenGetStarted();
    }
    setTimeout(() => {
      setNavLoadingAction(null);
    }, 450);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (scrollY / docHeight) * 100)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <>
      {isScrolled && <div className="w-full h-[76px]" aria-hidden="true" />}
      <header
        id="siteHeader"
        className={`site-header w-full transition-all duration-300 ${
          isScrolled
            ? 'fixed top-0 left-0 right-0 z-50 bg-[#f75142] shadow-[0_8px_30px_rgba(247,81,66,0.25)] border-b border-[#e54536] is-scrolled'
            : 'relative z-30 bg-[#f75142] border-b border-[#e54536]'
        }`}
      >
        <nav
          id="ucore-navbar"
          className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[76px] flex items-center justify-between"
        >
        {/* Logo */}
        <button
          id="logo-button"
          onClick={() => {
            if (onNavigateToHome) {
              onNavigateToHome();
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-[#002133] flex items-center justify-center shadow-[0_6px_16px_-4px_rgba(0,33,51,0.45)] group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
            <Box className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#002133] uppercase">
            SIGRE
          </span>
        </button>

        {/* Dynamic Scroll Progress Bar */}
        <div
          id="navbar-scroll-progress"
          className="absolute bottom-0 left-0 h-[2.5px] bg-[#002133] transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />

        {/* Desktop Navigation Links - Shown only after user session starts */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-8 lg:gap-11 text-[15px] font-bold text-[#002133] ml-auto mr-6 lg:mr-8">
            {/* Páginas dropdown */}
            <div className="relative">
              <button
                id="nav-paginas-dropdown"
                onClick={() => setShowPagesDropdown((prev) => !prev)}
                onBlur={() => setTimeout(() => setShowPagesDropdown(false), 200)}
                className="flex items-center gap-1.5 text-[#002133] hover:text-white transition-colors cursor-pointer py-1"
              >
                <span>Paginas</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#002133]/80 transition-transform duration-200 ${
                    showPagesDropdown ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {showPagesDropdown && (
                <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {activeRole === 'admin' ? (
                    <>
                      <button
                        onClick={() => {
                          onSelectPage('admin-dashboard');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Painel Central Admin</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('admin-estatisticas');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <BarChart3 className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Estatísticas da Rede</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('admin-escolas');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <School className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Minhas Escolas</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('admin-directores');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <UserCheck className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Meus Directores</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('admin-professores');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <GraduationCap className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Meus Professores</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('admin-alunos');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <Users className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Meus Alunos</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('admin-anuncios');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2.5">
                          <Megaphone className="w-4 h-4 text-slate-500" strokeWidth={2} />
                          <span>Demandas & Editais</span>
                        </span>
                        <span className="text-[9px] bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded">Oficial</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectPage('admin-perfil');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors mt-1 uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <User className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Perfil do Administrador</span>
                      </button>
                    </>
                  ) : activeRole === 'diretor' ? (
                    <>
                      <button
                        onClick={() => {
                          onSelectPage('diretor-dashboard');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Painel do Diretor</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectPage('diretor-estatisticas');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <BarChart3 className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Analisa suas estatísticas</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('diretor-professores');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <GraduationCap className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Meus Professores</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('diretor-presenca');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#f75142] transition-colors uppercase tracking-wider font-bold cursor-pointer flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2.5">
                          <ClipboardCheck className="w-4 h-4 text-slate-500" strokeWidth={2} />
                          <span>Presença Professores (Ponto)</span>
                        </span>
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.5 rounded">Diário</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('diretor-alunos');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <Users className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Meus Alunos</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('diretor-salas');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <DoorOpen className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Minhas Salas</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('diretor-classes');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <BookOpen className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Minhas Classes</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('diretor-pautas');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-[#f75142] bg-rose-50/60 hover:bg-rose-50 transition-colors uppercase tracking-wider font-black cursor-pointer flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2.5">
                          <ClipboardCheck className="w-4 h-4 text-[#f75142]" strokeWidth={2} />
                          <span>Mini-Pautas & Pauta Final</span>
                        </span>
                        <span className="text-[9px] bg-[#002133] text-white font-black px-1.5 py-0.5 rounded">Turmas</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('diretor-perfil');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors border-t border-slate-100 mt-1 uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <User className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Perfil do Director</span>
                      </button>
                    </>
                  ) : activeRole === 'professor' ? (
                    <>
                      <button
                        onClick={() => {
                          onSelectPage('estatisticas');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <BarChart3 className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Analisa suas estatísticas</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('minha-turma');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <BookOpen className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Minha Turma (4ª Classe)</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('professor-presenca');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#f75142] transition-colors uppercase tracking-wider font-bold cursor-pointer flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2.5">
                          <ClipboardCheck className="w-4 h-4 text-slate-500" strokeWidth={2} />
                          <span>Presença dos Alunos (Chamada)</span>
                        </span>
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.5 rounded">Diário</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('perfil-professor');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors border-t border-slate-100 mt-1 uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <User className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Meu Perfil de Docente</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          onSelectPage('escolas');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <School className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Rede de Escolas</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('professores');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <GraduationCap className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Portal dos Professores</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('alunos');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <Users className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Ambiente do Aluno</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectPage('calendario');
                          setShowPagesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors border-t border-slate-100 mt-1 uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-2.5"
                      >
                        <Calendar className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <span>Calendário Letivo 2026</span>
                      </button>
                    </>
                  )}

                  {/* Declaração de Efectividade Oficial em Branco */}
                  <button
                    onClick={() => {
                      onSelectPage('declaracao-efectividade');
                      setShowPagesDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-900 hover:bg-slate-50 hover:text-[#f75142] transition-colors border-t border-slate-100 mt-1 uppercase tracking-wider font-bold cursor-pointer flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#f75142]" />
                      <span>Declaração de Efectividade</span>
                    </span>
                    <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">Em Branco</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser && (
            <>
              {/* Quick Approvals Button for Director */}
              {activeRole === 'diretor' && (
                <>
                  <button
                    id="navbar-director-quick-approvals-btn"
                    onClick={() => onSelectPage('diretor-aprovacoes')}
                    className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      currentView === 'diretor-aprovacoes' || currentView === 'diretor-inscricoes'
                        ? 'bg-white text-[#002133] ring-2 ring-white/40 shadow-sm'
                        : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                    }`}
                    title="Aprovação de Inscrições da Escola"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    <span>Inscrições</span>
                    {pendingAppsCount.director > 0 && (
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                        {pendingAppsCount.director}
                      </span>
                    )}
                  </button>
                </>
              )}

              {/* Quick Approvals Button for Admin */}
              {activeRole === 'admin' && (
                <button
                  id="navbar-admin-quick-approvals-btn"
                  onClick={() => onSelectPage('admin-aprovacoes')}
                  className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    currentView === 'admin-aprovacoes' || currentView === 'admin-inscricoes'
                      ? 'bg-white text-[#002133] ring-2 ring-white/40 shadow-sm'
                      : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                  }`}
                  title="Central de Homologação de Diretores e Inscrições"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Homologações</span>
                  {pendingAppsCount.admin > 0 && (
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                      {pendingAppsCount.admin}
                    </span>
                  )}
                </button>
              )}

              {/* Notification Bell */}
              <div className="relative">
                <button
                  id="notification-bell-btn"
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className="relative p-2 rounded-full text-white hover:bg-white/20 transition-colors cursor-pointer focus:outline-none"
                  title="Notificações"
                  aria-label="Notificações"
                >
                  <Bell className="w-6 h-6 text-white" strokeWidth={2.2} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-white rounded-full ring-2 ring-[#f75142]" />
                  )}
                </button>

                {/* Notifications Popover */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-3 w-80 sm:w-88 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-slate-200 p-4 z-50 text-slate-900">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs uppercase tracking-[0.15em] text-[#002133]">Notificações</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-full font-bold uppercase">
                            {unreadCount} novas
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] uppercase tracking-wider text-slate-600 hover:text-slate-900 font-bold cursor-pointer underline"
                        >
                          Marcar lidas
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto mt-2">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`py-2.5 px-2 rounded-lg transition-colors ${
                            item.read ? 'opacity-50 hover:bg-slate-50' : 'bg-slate-50/80 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                            <span className="text-[10px] text-slate-400 tracking-wider">{item.time}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Settings Trigger Icon */}
              {onOpenSettings && (
                <button
                  id="navbar-settings-btn"
                  type="button"
                  onClick={onOpenSettings}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                  title="Configurações do Perfil"
                  aria-label="Configurações do Perfil"
                >
                  <Settings className="w-5 h-5 text-white" strokeWidth={2.2} />
                </button>
              )}
            </>
          )}

          {/* Começar or Logged-in User Profile */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                id="navbar-user-profile-btn"
                onClick={onOpenProfile}
                className="flex items-center gap-2 bg-[#002133] text-white hover:bg-[#001726] px-3 py-1.5 rounded-full transition-all cursor-pointer group shadow-sm"
                title="Meu Perfil"
              >
                <div className="w-6 h-6 rounded-full bg-white text-[#002133] flex items-center justify-center text-[10px] font-black uppercase">
                  {currentUser.firstName.charAt(0)}
                </div>
                <span className="text-xs font-bold text-white hidden sm:inline">
                  {currentUser.firstName}
                </span>
              </button>
              {onLogout && (
                <button
                  id="navbar-logout-btn"
                  onClick={onLogout}
                  className="p-1.5 text-[#002133] hover:text-white hover:bg-black/10 rounded-full transition-colors cursor-pointer"
                  title="Encerrar sessão"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="navbar-entrar-btn"
                type="button"
                onClick={handleLoginClick}
                disabled={isLoginLoading || isRegisterLoading}
                aria-busy={isLoginLoading}
                className={`inline-flex items-center justify-center gap-2 font-bold text-sm px-3.5 sm:px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  isLoginLoading || isRegisterLoading ? 'opacity-75 cursor-wait' : ''
                } ${
                  currentPage === 'login'
                    ? 'bg-white text-[#002133] shadow-xs'
                    : 'text-[#002133] hover:text-white hover:bg-black/10'
                }`}
              >
                {isLoginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <span>Entrar</span>
                )}
              </button>
              <button
                id="navbar-comecar-btn"
                type="button"
                onClick={handleRegisterClick}
                disabled={isLoginLoading || isRegisterLoading}
                aria-busy={isRegisterLoading}
                className={`inline-flex items-center justify-center gap-2 text-white font-black text-sm px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl transition-all duration-300 cursor-pointer shadow-[0_8px_20px_-6px_rgba(0,33,51,0.5)] hover:shadow-[0_10px_26px_-6px_rgba(0,33,51,0.7)] active:scale-95 whitespace-nowrap bg-[#002133] hover:bg-[#001726] ${
                  isLoginLoading || isRegisterLoading ? 'opacity-75 cursor-wait' : ''
                } ${
                  currentPage === 'register'
                    ? 'ring-2 ring-white/60'
                    : ''
                }`}
              >
                {isRegisterLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                    <span>A carregar...</span>
                  </>
                ) : (
                  <span>Inscreva - se</span>
                )}
              </button>
            </div>
          )}

          {/* Mobile menu hamburger */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-[#002133] hover:text-white rounded-lg focus:outline-none cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-4 right-4 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 p-5 z-50 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 text-slate-900">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Navegação</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-400 hover:text-slate-900 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Role Page Links in Mobile Menu - Shown only when session is active */}
          {currentUser && (
            activeRole === 'admin' ? (
              <>
                <button
                  onClick={() => {
                    onSelectPage('admin-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Painel Central Admin
                </button>
                <button
                  onClick={() => {
                    onSelectPage('admin-estatisticas');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Estatísticas da Rede
                </button>
                <button
                  onClick={() => {
                    onSelectPage('admin-escolas');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Minhas Escolas
                </button>
                <button
                  onClick={() => {
                    onSelectPage('admin-directores');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Meus Directores
                </button>
                <button
                  onClick={() => {
                    onSelectPage('admin-professores');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Meus Professores
                </button>
                <button
                  onClick={() => {
                    onSelectPage('admin-alunos');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Meus Alunos
                </button>
                <button
                  onClick={() => {
                    onSelectPage('admin-anuncios');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-between"
                >
                  <span>Demandas & Editais</span>
                  <span className="text-[9px] bg-slate-900 text-white px-1.5 py-0.5 rounded">Oficial</span>
                </button>

                <button
                  onClick={() => {
                    onSelectPage('admin-perfil');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Perfil do Administrador
                </button>
              </>
            ) : activeRole === 'diretor' ? (
              <>
                <button
                  onClick={() => {
                    onSelectPage('diretor-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Painel do Diretor
                </button>

                <button
                  onClick={() => {
                    onSelectPage('diretor-estatisticas');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Analisa suas estatísticas
                </button>
                <button
                  onClick={() => {
                    onSelectPage('diretor-professores');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Meus Professores
                </button>
                <button
                  onClick={() => {
                    onSelectPage('diretor-presenca');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-[#f75142] bg-rose-50/50 hover:bg-rose-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-between"
                >
                  <span>Presença Professores (Ponto)</span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.5 rounded">Diário</span>
                </button>
                <button
                  onClick={() => {
                    onSelectPage('diretor-alunos');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Meus Alunos
                </button>
                <button
                  onClick={() => {
                    onSelectPage('diretor-salas');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Minhas Salas
                </button>
                <button
                  onClick={() => {
                    onSelectPage('diretor-classes');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Minhas Classes
                </button>
                <button
                  onClick={() => {
                    onSelectPage('diretor-pautas');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-[#f75142] bg-rose-50/60 hover:bg-rose-50 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer flex items-center justify-between"
                >
                  <span>Mini-Pautas & Pauta Final</span>
                  <span className="text-[9px] bg-[#002133] text-white font-black px-1.5 py-0.5 rounded">Turmas</span>
                </button>
                <button
                  onClick={() => {
                    onSelectPage('diretor-perfil');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Perfil do Director
                </button>
              </>
            ) : activeRole === 'professor' ? (
              <>
                <button
                  onClick={() => {
                    onSelectPage('estatisticas');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Analisa suas estatísticas
                </button>
                <button
                  onClick={() => {
                    onSelectPage('minha-turma');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Minha Turma (4ª Classe)
                </button>
                <button
                  onClick={() => {
                    onSelectPage('professor-presenca');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-[#f75142] bg-rose-50/50 hover:bg-rose-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-between"
                >
                  <span>Presença dos Alunos (Chamada)</span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.5 rounded">Diário</span>
                </button>
                <button
                  onClick={() => {
                    onSelectPage('perfil-professor');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Meu Perfil de Docente
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onSelectPage('escolas');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Páginas: Gestão de Escolas
                </button>
                <button
                  onClick={() => {
                    onSelectPage('professores');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Páginas: Gestão de Professores
                </button>
                <button
                  onClick={() => {
                    onSelectPage('alunos');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Páginas: Gestão de Alunos
                </button>
              </>
            )
          )}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              const el = document.getElementById('equipa');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2"
          >
            <GraduationCap className="w-4 h-4 text-[#f75142]" />
            <span>Nossa Equipa Escolar</span>
          </button>
          {currentUser && (
            <button
              onClick={() => {
                onOpenProfile();
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Meu Perfil
            </button>
          )}
          {currentUser && onOpenSettings && (
            <button
              onClick={() => {
                onOpenSettings();
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2"
            >
              <Settings className="w-4 h-4 text-[#f75142]" />
              <span>Configurações & Palavra-passe</span>
            </button>
          )}
          <button
            onClick={() => {
              onSelectPage('declaracao-efectividade');
              setMobileMenuOpen(false);
            }}
            className="text-left py-2 px-3 text-slate-800 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#f75142]" />
              <span>Declaração de Efectividade</span>
            </div>
            <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">Em Branco</span>
          </button>
          {onOpenChat && (
            <button
              onClick={() => {
                onOpenChat();
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 bg-[#f75142]/10 text-[#f75142] rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#f75142]" />
                <span>Chat de Suporte & Ajuda</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          )}
          <button
            onClick={() => {
              onOpenSupport();
              setMobileMenuOpen(false);
            }}
            className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Suporte e Contato
          </button>
          <div className="pt-2">
            {currentUser ? (
              <button
                onClick={() => {
                  onLogout?.();
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold uppercase tracking-[0.2em] text-xs py-3 rounded-full text-center transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair da Conta ({currentUser.firstName})
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="mobile-entrar-btn"
                  type="button"
                  onClick={() => {
                    handleLoginClick();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isLoginLoading || isRegisterLoading}
                  aria-busy={isLoginLoading}
                  className={`w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold uppercase tracking-[0.15em] text-xs py-3 rounded-full text-center transition-colors cursor-pointer border border-slate-200 flex items-center justify-center gap-2 ${
                    isLoginLoading || isRegisterLoading ? 'opacity-75 cursor-wait' : ''
                  }`}
                >
                  {isLoginLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-900 shrink-0" />
                      <span>Entrando...</span>
                    </>
                  ) : (
                    <span>Entrar</span>
                  )}
                </button>
                <button
                  id="mobile-comecar-btn"
                  type="button"
                  onClick={() => {
                    handleRegisterClick();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isLoginLoading || isRegisterLoading}
                  aria-busy={isRegisterLoading}
                  className={`w-full bg-[#f75142] hover:bg-[#e04436] text-white font-bold uppercase tracking-[0.15em] text-xs py-3 rounded-full text-center transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 ${
                    isLoginLoading || isRegisterLoading ? 'opacity-75 cursor-wait' : ''
                  }`}
                >
                  {isRegisterLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                      <span>A carregar...</span>
                    </>
                  ) : (
                    <span>Inscreva - se</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
    </>
  );
};
