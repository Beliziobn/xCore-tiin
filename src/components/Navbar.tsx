import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, User, CheckCircle2, Menu, X, BookOpen, Users, Calendar, Award, LogOut, Home } from 'lucide-react';
import type { NotificationItem, UserAccount } from '../types';

interface NavbarProps {
  onOpenGetStarted: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
  onOpenAbout: () => void;
  onOpenProfile: () => void;
  onOpenSupport: () => void;
  onSelectPage: (page: string) => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  activeRole?: string;
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Fechamento de Notas',
    message: 'O prazo do 1º Bimestre encerra nesta sexta-feira às 18:00.',
    time: 'Há 15 min',
    read: false,
    type: 'academic',
  },
  {
    id: '2',
    title: 'Nova Matrícula Efetuada',
    message: 'Aluno Lucas Silveira matriculado no 8º Ano B.',
    time: 'Há 1 hora',
    read: false,
    type: 'event',
  },
  {
    id: '3',
    title: 'Reunião de Coordenação',
    message: 'Pauta pedagógica de alinhamento com diretores agendada.',
    time: 'Ontem',
    read: true,
    type: 'alert',
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  onOpenGetStarted,
  onNavigateToLogin,
  onNavigateToRegister,
  onOpenAbout,
  onOpenProfile,
  onOpenSupport,
  onSelectPage,
  currentUser,
  onLogout,
  activeRole,
}) => {
  const [showPagesDropdown, setShowPagesDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

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
      {isScrolled && <div className="w-full h-16 sm:h-20" aria-hidden="true" />}
      <header
        className={`w-full transition-all duration-300 flex justify-center px-4 ${
          isScrolled
            ? 'fixed top-0 left-0 right-0 z-50 bg-[#4f67ff]/90 backdrop-blur-lg py-2.5 shadow-[0_10px_30px_rgba(79,103,255,0.25)] border-b border-white/15'
            : 'relative z-30 bg-[#4f67ff] pt-4 sm:pt-6 pb-2'
        }`}
      >
        {/* Dynamic Scroll Progress Bar */}
        <div
          id="navbar-scroll-progress"
          className="absolute top-0 left-0 h-[3px] bg-[#27c1dc] transition-all duration-100 ease-out shadow-[0_0_8px_#27c1dc]"
          style={{ width: `${scrollProgress}%` }}
        />

        <nav
          id="ucore-navbar"
          className={`w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-[12px] border border-slate-200/90 px-4 sm:px-6 flex items-center justify-between transition-all duration-300 ${
            isScrolled
              ? 'py-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)]'
              : 'py-2.5 sm:py-3 shadow-[0_4px_25px_rgba(0,0,0,0.06)]'
          }`}
        >
        {/* Logo */}
        <button
          id="logo-button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 group cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <svg
              className="w-4 h-4 text-white drop-shadow-xs"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
            </svg>
          </div>
          <span className="text-lg font-black tracking-tighter text-slate-950 uppercase flex items-center">
            u<span className="text-[#3B82F6]">Core</span>
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-600">
          {/* Páginas dropdown */}
          <div className="relative">
            <button
              id="nav-paginas-dropdown"
              onClick={() => setShowPagesDropdown((prev) => !prev)}
              onBlur={() => setTimeout(() => setShowPagesDropdown(false), 200)}
              className="flex items-center gap-1.5 hover:text-slate-950 transition-colors cursor-pointer py-1 uppercase"
            >
              <span>Paginas</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  showPagesDropdown ? 'rotate-180 text-slate-950' : ''
                }`}
              />
            </button>

            {showPagesDropdown && (
              <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {activeRole === 'admin' ? (
                  <>
                    <button
                      onClick={() => {
                        onSelectPage('admin-dashboard');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <Home className="w-3.5 h-3.5 text-[#5067fc]" />
                      <span>Painel Central Admin</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('admin-estatisticas');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-[#27c1dc]" />
                      <span>Estatísticas da Rede</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('admin-escolas');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#5067fc]" />
                      <span>Minhas Escolas</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('admin-directores');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[#27c1dc]" />
                      <span>Meus Directores</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('admin-professores');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[#5067fc]" />
                      <span>Meus Professores</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('admin-alunos');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-[#5067fc]" />
                      <span>Meus Alunos</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('admin-perfil');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors border-t border-slate-100 mt-1 uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[#5067fc]" />
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
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-[#5067fc]" />
                      <span>Painel do Diretor</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('diretor-estatisticas');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-[#27c1dc]" />
                      <span>Analisa suas estatísticas</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('diretor-professores');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[#5067fc]" />
                      <span>Meus Professores</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('diretor-alunos');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-[#5067fc]" />
                      <span>Meus Alunos</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('diretor-salas');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <Home className="w-3.5 h-3.5 text-[#5067fc]" />
                      <span>Minhas Salas</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('diretor-classes');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#27c1dc]" />
                      <span>Minhas Classes</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('diretor-perfil');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors border-t border-slate-100 mt-1 uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[#5067fc]" />
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
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-[#5067fc]" />
                      <span>Analisa suas estatísticas</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('minha-turma');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-[#5067fc]" />
                      <span>Minha Turma (4ª Classe)</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('perfil-professor');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[#5067fc]" />
                      <span>Perfil do Professor</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('perfil-aluno');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors border-t border-slate-100 mt-1 uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#27c1dc]" />
                      <span>Perfil do Aluno (Albert)</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onSelectPage('escolas');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>Rede de Escolas</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('professores');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>Portal dos Professores</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('alunos');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>Ambiente do Aluno</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPage('calendario');
                        setShowPagesDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 transition-colors border-t border-slate-100 mt-1 uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>Calendário Letivo 2026</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            id="nav-sobre"
            onClick={onOpenAbout}
            className="hover:text-slate-950 transition-colors cursor-pointer"
          >
            Sobre
          </button>

          <button
            id="nav-meu-perfil"
            onClick={() => {
              if (activeRole === 'admin') {
                onSelectPage('admin-perfil');
              } else if (activeRole === 'diretor') {
                onSelectPage('diretor-perfil');
              } else {
                onOpenProfile();
              }
            }}
            className="hover:text-slate-950 transition-colors cursor-pointer"
          >
            Meu perfil
          </button>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              id="notification-bell-btn"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative p-2 rounded-full text-slate-500 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none"
              title="Notificações"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#3B82F6] rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-3 w-80 sm:w-88 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-slate-200 p-4 z-50 text-slate-900">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-[0.15em] text-slate-950">Notificações</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30 px-2 py-0.5 rounded-full font-bold uppercase">
                        {unreadCount} novas
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] uppercase tracking-wider text-[#3B82F6] hover:underline font-bold cursor-pointer"
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

          {/* Começar or Logged-in User Profile */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                id="navbar-user-profile-btn"
                onClick={onOpenProfile}
                className="flex items-center gap-2 bg-indigo-50/80 hover:bg-indigo-100/80 border border-[#5067fc]/20 px-3 py-1.5 rounded-full transition-all cursor-pointer group"
                title="Meu Perfil"
              >
                <div className="w-6 h-6 rounded-full bg-[#5067fc] text-white flex items-center justify-center text-[10px] font-black uppercase">
                  {currentUser.firstName.charAt(0)}
                </div>
                <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                  {currentUser.firstName}
                </span>
              </button>
              {onLogout && (
                <button
                  id="navbar-logout-btn"
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
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
                onClick={onNavigateToLogin || onOpenGetStarted}
                className="text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-bold text-[10px] uppercase tracking-[0.15em] px-3.5 sm:px-4 py-2 rounded-full transition-all duration-200 cursor-pointer"
              >
                Entrar
              </button>
              <button
                id="navbar-comecar-btn"
                onClick={onNavigateToRegister || onOpenGetStarted}
                className="bg-[#27c1dc] hover:bg-[#1fb0c8] text-white font-bold text-[10px] uppercase tracking-[0.15em] px-4 sm:px-5 py-2 rounded-full transition-all duration-300 cursor-pointer shadow-sm hover:shadow flex items-center gap-1.5 active:scale-95"
              >
                Começar
              </button>
            </div>
          )}

          {/* Mobile menu hamburger */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-slate-700 hover:text-slate-950 rounded-lg focus:outline-none cursor-pointer"
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
          {activeRole === 'admin' ? (
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
                  onSelectPage('perfil-professor');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Perfil do Professor
              </button>
              <button
                onClick={() => {
                  onSelectPage('perfil-aluno');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Perfil do Aluno (Albert)
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
          )}
          <button
            onClick={() => {
              onOpenAbout();
              setMobileMenuOpen(false);
            }}
            className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Sobre a Central uCore
          </button>
          <button
            onClick={() => {
              onOpenProfile();
              setMobileMenuOpen(false);
            }}
            className="text-left py-2 px-3 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Meu Perfil
          </button>
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
                  onClick={() => {
                    (onNavigateToLogin || onOpenGetStarted)();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold uppercase tracking-[0.15em] text-xs py-3 rounded-full text-center transition-colors cursor-pointer border border-slate-200"
                >
                  Entrar
                </button>
                <button
                  id="mobile-comecar-btn"
                  onClick={() => {
                    (onNavigateToRegister || onOpenGetStarted)();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-[#27c1dc] hover:bg-[#1fb0c8] text-white font-bold uppercase tracking-[0.15em] text-xs py-3 rounded-full text-center transition-colors cursor-pointer shadow-sm"
                >
                  Começar
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
