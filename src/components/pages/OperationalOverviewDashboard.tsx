import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  Building2,
  Users,
  Layers,
  BarChart3,
  Settings,
  LifeBuoy,
  Menu,
  ChevronRight,
  ShieldCheck,
  Bell,
  ChevronDown,
  TriangleAlert,
  UserRound,
  LogOut,
  ArrowUpRight,
  ListCheck,
  RefreshCw,
  ClipboardCheck,
  MoreHorizontal,
  Plus,
  FileText,
  CalendarDays,
  ArrowRight,
  MessageSquare,
  Clock3,
  Download,
} from 'lucide-react';
import teacherClassroomImg from '../../assets/images/teacher_classroom_1788697035170.jpg';
import type { UserAccount, AdminSchool, AdminTeacher, AdminStudent } from '../../types';

interface OperationalOverviewDashboardProps {
  currentUser: UserAccount | null;
  activeRole: 'admin' | 'diretor' | 'professor';
  schools: AdminSchool[];
  teachers: AdminTeacher[];
  students: AdminStudent[];
  onNavigateView: (view: string) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenSupport: () => void;
  onOpenChat: () => void;
  onAddTeacher: () => void;
  onOpenExport: () => void;
  onLogout: () => void;
}

export const OperationalOverviewDashboard: React.FC<OperationalOverviewDashboardProps> = ({
  currentUser,
  activeRole,
  schools,
  teachers,
  students,
  onNavigateView,
  onOpenSettings,
  onOpenProfile,
  onOpenSupport,
  onOpenChat,
  onAddTeacher,
  onOpenExport,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<string>('overview');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Actualizado agora');
  const [toastText, setToastText] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);

  const toastTimerRef = useRef<number | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const notificationsBtnRef = useRef<HTMLButtonElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const profileBtnRef = useRef<HTMLButtonElement | null>(null);

  const showToast = (message: string) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastText(message);
    setToastVisible(true);
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const closePopovers = () => {
    setNotificationsOpen(false);
    setProfileOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target) &&
        notificationsBtnRef.current &&
        !notificationsBtnRef.current.contains(target) &&
        profileRef.current &&
        !profileRef.current.contains(target) &&
        profileBtnRef.current &&
        !profileBtnRef.current.contains(target)
      ) {
        closePopovers();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [sidebarOpen]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    showToast('Indicadores actualizados.');

    window.setTimeout(() => {
      setIsRefreshing(false);
      const now = new Intl.DateTimeFormat('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date());
      setLastUpdated(`Actualizado às ${now}`);
    }, 700);
  };

  const handleNavClick = (navId: string, toastMsg?: string, targetView?: string) => {
    setActiveNav(navId);
    if (window.innerWidth <= 860) {
      closeSidebar();
    }
    if (toastMsg) {
      showToast(toastMsg);
    }
    if (targetView) {
      window.setTimeout(() => {
        onNavigateView(targetView);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 280);
    }
  };

  // Resolve counts (defaulting to the exact institutional baseline when lists match or are populated)
  const studentsCount = students.length;
  const schoolsCount = schools.length > 0 ? schools.length : 1;
  const teachersCount = teachers.length > 0 ? teachers.length : 32;
  const classesCount = 0;

  // User display details
  const displayName =
    currentUser && currentUser.firstName
      ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
      : activeRole === 'admin'
      ? 'Director Municipal'
      : activeRole === 'diretor'
      ? 'Director Escolar'
      : 'Docente SIGRE';

  const displayRole =
    activeRole === 'admin'
      ? 'Administrador'
      : activeRole === 'diretor'
      ? 'Direcção Escolar'
      : 'Professor';

  const displayInitials =
    currentUser && currentUser.firstName
      ? `${currentUser.firstName[0] || ''}${currentUser.lastName?.[0] || 'M'}`.toUpperCase()
      : 'DM';

  const schoolsView = activeRole === 'admin' ? 'admin-escolas' : 'diretor-salas';
  const teachersView =
    activeRole === 'admin'
      ? 'admin-professores'
      : activeRole === 'diretor'
      ? 'diretor-professores'
      : 'professor-perfil';
  const studentsView =
    activeRole === 'admin'
      ? 'admin-alunos'
      : activeRole === 'diretor'
      ? 'diretor-alunos'
      : 'professor-turma';
  const classesView =
    activeRole === 'diretor'
      ? 'diretor-turmas'
      : activeRole === 'professor'
      ? 'professor-turma'
      : 'diretor-turmas';
  const attendanceView =
    activeRole === 'professor' ? 'professor-presenca' : 'diretor-presenca';
  const reportsView =
    activeRole === 'admin'
      ? 'admin-estatisticas'
      : activeRole === 'diretor'
      ? 'diretor-estatisticas'
      : 'professor-estatisticas';
  const approvalsView =
    activeRole === 'admin' ? 'admin-homologacoes' : 'diretor-homologacoes';

  return (
    <div className="sigre-overview-root">
      <style>{`
        .sigre-overview-root {
          --bg: #f6f4f1;
          --surface: #ffffff;
          --surface-muted: #f2efea;
          --surface-hover: #ebe7e0;

          --text: #111827;
          --text-secondary: #475467;
          --text-muted: #667085;

          --border: #e5e1da;
          --border-strong: #d4cec4;

          --brand: #0c2336;
          --brand-soft: #13324b;

          --accent: #e0523c;
          --accent-hover: #c9432e;
          --accent-soft: #fdf0ed;

          --success: #157347;
          --success-soft: #eaf6ef;

          --warning: #b54708;
          --warning-soft: #fff4e8;

          --neutral-soft: #eef2f6;

          --radius-xl: 22px;
          --radius-lg: 16px;
          --radius-md: 12px;
          --radius-sm: 10px;

          --shadow-xs: 0 1px 2px rgba(16, 24, 40, 0.04);
          --shadow-sm: 0 8px 24px rgba(16, 24, 40, 0.05);
          --shadow-md: 0 18px 40px rgba(16, 24, 40, 0.12);

          --sidebar-width: 268px;
          --topbar-height: 68px;
          --container: 1260px;

          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: var(--bg);
          color: var(--text);
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          min-height: 100vh;
        }

        .sigre-overview-root *,
        .sigre-overview-root *::before,
        .sigre-overview-root *::after {
          box-sizing: border-box;
        }

        body.menu-open {
          overflow: hidden;
        }

        .sigre-overview-root img {
          display: block;
          max-width: 100%;
        }

        .sigre-overview-root button,
        .sigre-overview-root a {
          font: inherit;
        }

        .sigre-overview-root button {
          border: 0;
          background: none;
          cursor: pointer;
          color: inherit;
        }

        .sigre-overview-root a {
          color: inherit;
          text-decoration: none;
        }

        .sigre-overview-root :focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        .sigre-overview-root .lucide-icon {
          width: 18px;
          height: 18px;
          stroke-width: 1.9;
          flex-shrink: 0;
        }

        .sigre-overview-root .app-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
        }

        .sigre-overview-root .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(12, 35, 54, 0.44);
          backdrop-filter: blur(2px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
          z-index: 39;
        }

        .sigre-overview-root .sidebar-overlay.is-visible {
          opacity: 1;
          pointer-events: auto;
        }

        .sigre-overview-root .sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          background: var(--brand);
          color: #ffffff;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          z-index: 40;
        }

        .sigre-overview-root .sidebar-top {
          display: grid;
          gap: 20px;
        }

        .sigre-overview-root .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 6px;
        }

        .sigre-overview-root .brand-mark {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: var(--accent);
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
          flex-shrink: 0;
        }

        .sigre-overview-root .brand-copy {
          display: grid;
          gap: 1px;
        }

        .sigre-overview-root .brand-copy strong {
          font-size: 0.96rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .sigre-overview-root .brand-copy small {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.68);
        }

        .sigre-overview-root .workspace-card {
          padding: 14px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: grid;
          gap: 3px;
        }

        .sigre-overview-root .workspace-label {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
        }

        .sigre-overview-root .workspace-card strong {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .sigre-overview-root .workspace-card small {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.68);
        }

        .sigre-overview-root .sidebar-nav {
          display: grid;
          gap: 18px;
        }

        .sigre-overview-root .nav-group {
          display: grid;
          gap: 4px;
        }

        .sigre-overview-root .nav-group-label {
          padding: 0 10px 4px;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.48);
        }

        .sigre-overview-root .nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          color: rgba(255, 255, 255, 0.76);
          font-size: 0.9rem;
          font-weight: 500;
          transition: background 0.16s ease, color 0.16s ease;
          width: 100%;
          text-align: left;
        }

        .sigre-overview-root .nav-link:hover {
          background: rgba(255, 255, 255, 0.07);
          color: #ffffff;
        }

        .sigre-overview-root .nav-link.active {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          font-weight: 600;
        }

        .sigre-overview-root .nav-badge {
          margin-left: auto;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          font-size: 0.73rem;
          font-weight: 600;
        }

        .sigre-overview-root .sidebar-bottom {
          display: grid;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sigre-overview-root .support-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          color: rgba(255, 255, 255, 0.76);
          font-size: 0.88rem;
          font-weight: 500;
          transition: background 0.16s ease, color 0.16s ease;
          width: 100%;
          text-align: left;
        }

        .sigre-overview-root .support-link:hover {
          background: rgba(255, 255, 255, 0.07);
          color: #ffffff;
        }

        .sigre-overview-root .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.05);
        }

        .sigre-overview-root .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(224, 82, 60, 0.22);
          border: 1px solid rgba(224, 82, 60, 0.45);
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .sigre-overview-root .user-copy {
          display: grid;
          gap: 1px;
          min-width: 0;
        }

        .sigre-overview-root .user-copy strong {
          font-size: 0.84rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sigre-overview-root .user-copy small {
          font-size: 0.74rem;
          color: rgba(255, 255, 255, 0.64);
        }

        .sigre-overview-root .main-area {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .sigre-overview-root .topbar {
          position: sticky;
          top: 0;
          z-index: 25;
          height: var(--topbar-height);
          padding: 0 28px;
          background: rgba(246, 244, 241, 0.88);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .sigre-overview-root .topbar-left,
        .sigre-overview-root .topbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sigre-overview-root .topbar-actions {
          position: relative;
        }

        .sigre-overview-root .mobile-menu {
          display: none;
        }

        .sigre-overview-root .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 0.88rem;
        }

        .sigre-overview-root .breadcrumbs .lucide-icon {
          width: 15px;
          height: 15px;
        }

        .sigre-overview-root .breadcrumbs strong {
          color: var(--text);
          font-weight: 600;
        }

        .sigre-overview-root .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          padding: 0 12px;
          border-radius: 999px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 0.83rem;
          font-weight: 600;
          box-shadow: var(--shadow-xs);
          transition: border-color 0.16s ease, background 0.16s ease;
        }

        .sigre-overview-root .status-pill:hover {
          background: var(--surface-muted);
          border-color: var(--border-strong);
        }

        .sigre-overview-root .status-pill .lucide-icon {
          width: 16px;
          height: 16px;
          color: var(--accent);
        }

        .sigre-overview-root .status-counter {
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          border-radius: 999px;
          background: var(--accent-soft);
          color: var(--accent);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.74rem;
          font-weight: 700;
        }

        .sigre-overview-root .icon-button {
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-xs);
          transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
        }

        .sigre-overview-root .icon-button:hover {
          background: var(--surface-muted);
          border-color: var(--border-strong);
          color: var(--text);
        }

        .sigre-overview-root .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent);
        }

        .sigre-overview-root .profile-trigger {
          height: 38px;
          padding: 4px 10px 4px 5px;
          border-radius: 999px;
          background: var(--surface);
          border: 1px solid var(--border);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: var(--shadow-xs);
          transition: background 0.16s ease, border-color 0.16s ease;
        }

        .sigre-overview-root .profile-trigger:hover {
          background: var(--surface-muted);
          border-color: var(--border-strong);
        }

        .sigre-overview-root .profile-trigger .avatar {
          width: 28px;
          height: 28px;
          background: var(--brand);
          border: 0;
          font-size: 0.72rem;
        }

        .sigre-overview-root .profile-copy {
          display: grid;
          text-align: left;
          line-height: 1.15;
        }

        .sigre-overview-root .profile-copy strong {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .sigre-overview-root .profile-copy small {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .sigre-overview-root .profile-trigger .lucide-icon {
          width: 15px;
          height: 15px;
          color: var(--text-muted);
        }

        .sigre-overview-root .popover {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 300px;
          padding: 8px;
          border-radius: var(--radius-lg);
          background: var(--surface);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
          display: grid;
          gap: 4px;
        }

        .sigre-overview-root .popover[hidden] {
          display: none;
        }

        .sigre-overview-root .popover-header {
          padding: 10px 12px 8px;
          border-bottom: 1px solid var(--border);
          display: grid;
          gap: 2px;
        }

        .sigre-overview-root .popover-header strong {
          font-size: 0.86rem;
          font-weight: 600;
        }

        .sigre-overview-root .popover-header small {
          font-size: 0.76rem;
          color: var(--text-muted);
        }

        .sigre-overview-root .popover-item {
          width: 100%;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: flex-start;
          gap: 10px;
          text-align: left;
          transition: background 0.16s ease;
        }

        .sigre-overview-root .popover-item:hover {
          background: var(--surface-muted);
        }

        .sigre-overview-root .popover-item .lucide-icon {
          margin-top: 2px;
          color: var(--brand);
        }

        .sigre-overview-root .popover-item span {
          display: grid;
          gap: 2px;
        }

        .sigre-overview-root .popover-item strong {
          font-size: 0.83rem;
          font-weight: 600;
        }

        .sigre-overview-root .popover-item small {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .sigre-overview-root .content {
          width: min(100%, var(--container));
          margin: 0 auto;
          padding: 28px;
          display: grid;
          gap: 28px;
          flex: 1;
        }

        .sigre-overview-root .eyebrow {
          display: inline-block;
          margin-bottom: 6px;
          font-size: 0.73rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .sigre-overview-root .page-intro {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }

        .sigre-overview-root .page-intro h1 {
          margin: 0;
          font-size: clamp(1.45rem, 2.2vw, 1.95rem);
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .sigre-overview-root .page-intro p {
          margin: 4px 0 0;
          color: var(--text-secondary);
          font-size: 0.94rem;
        }

        .sigre-overview-root .page-meta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .sigre-overview-root .sync-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--success);
        }

        .sigre-overview-root .hero-panel {
          padding: 22px;
          border-radius: var(--radius-xl);
          background: var(--surface);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(240px, 0.75fr);
          gap: 22px;
          align-items: center;
        }

        .sigre-overview-root .hero-copy h2 {
          margin: 0;
          font-size: clamp(1.18rem, 1.8vw, 1.48rem);
          font-weight: 700;
          letter-spacing: -0.025em;
        }

        .sigre-overview-root .hero-copy p {
          margin: 8px 0 0;
          max-width: 54ch;
          color: var(--text-secondary);
          font-size: 0.92rem;
        }

        .sigre-overview-root .hero-actions {
          margin-top: 18px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .sigre-overview-root .button {
          height: 42px;
          padding: 0 16px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.87rem;
          font-weight: 600;
          transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease;
        }

        .sigre-overview-root .button:active {
          transform: translateY(1px);
        }

        .sigre-overview-root .button .lucide-icon {
          width: 16px;
          height: 16px;
        }

        .sigre-overview-root .button-primary {
          background: var(--accent);
          color: #ffffff;
        }

        .sigre-overview-root .button-primary:hover {
          background: var(--accent-hover);
        }

        .sigre-overview-root .button-ghost {
          background: var(--surface-muted);
          border: 1px solid var(--border);
          color: var(--text);
        }

        .sigre-overview-root .button-ghost:hover {
          background: var(--surface-hover);
          border-color: var(--border-strong);
        }

        .sigre-overview-root .hero-media {
          height: 196px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--surface-muted);
        }

        .sigre-overview-root .hero-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sigre-overview-root .section {
          display: grid;
          gap: 14px;
        }

        .sigre-overview-root .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }

        .sigre-overview-root .section-heading h2,
        .sigre-overview-root .panel-heading h2 {
          margin: 0;
          font-size: 1.08rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .sigre-overview-root .text-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 2px;
          color: var(--text-secondary);
          font-size: 0.84rem;
          font-weight: 600;
          transition: color 0.16s ease;
        }

        .sigre-overview-root .text-button:hover {
          color: var(--text);
        }

        .sigre-overview-root .text-button .lucide-icon {
          width: 15px;
          height: 15px;
        }

        .sigre-overview-root .text-button.is-loading .lucide-icon {
          animation: sigre-spin 0.7s linear infinite;
        }

        @keyframes sigre-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .sigre-overview-root .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .sigre-overview-root .metric-card {
          padding: 18px;
          border-radius: var(--radius-lg);
          background: var(--surface);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-xs);
          display: grid;
          gap: 14px;
        }

        .sigre-overview-root .metric-card.primary {
          background: var(--brand);
          border-color: var(--brand);
          color: #ffffff;
        }

        .sigre-overview-root .metric-top,
        .sigre-overview-root .metric-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .sigre-overview-root .metric-top span:first-child {
          font-size: 0.86rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .sigre-overview-root .metric-card.primary .metric-top span:first-child,
        .sigre-overview-root .metric-card.primary .metric-status {
          color: rgba(255, 255, 255, 0.72);
        }

        .sigre-overview-root .metric-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: var(--surface-muted);
          color: var(--brand);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .sigre-overview-root .metric-card.primary .metric-icon {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .sigre-overview-root .metric-value {
          font-size: clamp(1.65rem, 2.2vw, 2rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .sigre-overview-root .metric-status {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .sigre-overview-root .metric-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--brand);
        }

        .sigre-overview-root .metric-card.primary .metric-link {
          color: #ffffff;
        }

        .sigre-overview-root .metric-link .lucide-icon {
          width: 14px;
          height: 14px;
        }

        .sigre-overview-root .state-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .sigre-overview-root .state-badge .lucide-icon {
          width: 13px;
          height: 13px;
        }

        .sigre-overview-root .state-badge.success {
          background: var(--success-soft);
          color: var(--success);
        }

        .sigre-overview-root .state-badge.warning {
          background: var(--warning-soft);
          color: var(--warning);
        }

        .sigre-overview-root .state-badge.neutral {
          background: var(--neutral-soft);
          color: var(--text-secondary);
        }

        .sigre-overview-root .dashboard-grid,
        .sigre-overview-root .split-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .sigre-overview-root .panel {
          padding: 20px;
          border-radius: var(--radius-lg);
          background: var(--surface);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-xs);
          display: grid;
          gap: 18px;
          align-content: start;
        }

        .sigre-overview-root .panel-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .sigre-overview-root .network-summary {
          padding: 14px 16px;
          border-radius: var(--radius-md);
          background: var(--surface-muted);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .sigre-overview-root .summary-number {
          font-size: 1.45rem;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .sigre-overview-root .summary-number span {
          margin-left: 4px;
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .sigre-overview-root .progress-list {
          display: grid;
          gap: 14px;
        }

        .sigre-overview-root .progress-row {
          display: grid;
          gap: 7px;
        }

        .sigre-overview-root .progress-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 0.84rem;
        }

        .sigre-overview-root .progress-label span {
          color: var(--text-secondary);
        }

        .sigre-overview-root .progress-label strong {
          font-weight: 600;
        }

        .sigre-overview-root .progress-track {
          height: 8px;
          border-radius: 999px;
          background: var(--surface-muted);
          overflow: hidden;
        }

        .sigre-overview-root .progress-value {
          height: 100%;
          border-radius: inherit;
        }

        .sigre-overview-root .progress-value.green {
          background: var(--success);
        }

        .sigre-overview-root .progress-value.gray {
          background: #98a2b3;
        }

        .sigre-overview-root .quick-actions {
          display: grid;
          gap: 10px;
        }

        .sigre-overview-root .action-row {
          padding: 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 12px;
          transition: border-color 0.16s ease, background 0.16s ease;
        }

        .sigre-overview-root .action-row:hover {
          background: var(--surface-muted);
          border-color: var(--border-strong);
        }

        .sigre-overview-root .action-icon,
        .sigre-overview-root .module-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--surface-muted);
          color: var(--brand);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sigre-overview-root .action-copy,
        .sigre-overview-root .module-copy,
        .sigre-overview-root .report-copy {
          min-width: 0;
          flex: 1;
          display: grid;
          gap: 2px;
        }

        .sigre-overview-root .action-copy strong,
        .sigre-overview-root .module-copy strong,
        .sigre-overview-root .report-copy strong {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .sigre-overview-root .action-copy small,
        .sigre-overview-root .module-copy small,
        .sigre-overview-root .report-copy small {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .sigre-overview-root .action-arrow,
        .sigre-overview-root .report-download {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: var(--surface-muted);
          color: var(--brand);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.16s ease, color 0.16s ease;
        }

        .sigre-overview-root .action-arrow:hover,
        .sigre-overview-root .report-download:hover {
          background: var(--brand);
          color: #ffffff;
        }

        .sigre-overview-root .module-list {
          border-radius: var(--radius-lg);
          background: var(--surface);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-xs);
          overflow: hidden;
        }

        .sigre-overview-root .module-row {
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: background 0.16s ease;
        }

        .sigre-overview-root .module-row + .module-row {
          border-top: 1px solid var(--border);
        }

        .sigre-overview-root .module-row:hover {
          background: #faf9f7;
        }

        .sigre-overview-root .module-action {
          height: 36px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--brand);
          transition: background 0.16s ease, border-color 0.16s ease;
        }

        .sigre-overview-root .module-action:hover {
          background: var(--surface-muted);
          border-color: var(--border-strong);
        }

        .sigre-overview-root .module-action .lucide-icon {
          width: 14px;
          height: 14px;
        }

        .sigre-overview-root .empty-state {
          min-height: 196px;
          padding: 24px;
          border-radius: var(--radius-md);
          border: 1px dashed var(--border-strong);
          background: #faf9f7;
          display: grid;
          place-items: center;
          text-align: center;
        }

        .sigre-overview-root .empty-state .lucide-icon {
          width: 24px;
          height: 24px;
          color: var(--text-muted);
          margin: 0 auto 8px;
        }

        .sigre-overview-root .empty-state strong {
          display: block;
          font-size: 0.92rem;
          font-weight: 600;
        }

        .sigre-overview-root .empty-state p {
          margin: 4px 0 0;
          max-width: 34ch;
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        .sigre-overview-root .report-list {
          display: grid;
          gap: 10px;
        }

        .sigre-overview-root .report-item {
          padding: 13px 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sigre-overview-root .footer {
          margin-top: auto;
          border-top: 1px solid var(--border);
          background: var(--surface);
        }

        .sigre-overview-root .footer-inner {
          width: min(100%, var(--container));
          margin: 0 auto;
          padding: 18px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .sigre-overview-root .footer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sigre-overview-root .footer-brand .brand-mark {
          width: 30px;
          height: 30px;
          border-radius: 9px;
        }

        .sigre-overview-root .footer-brand strong {
          display: block;
          font-size: 0.84rem;
        }

        .sigre-overview-root .footer-brand small {
          display: block;
          font-size: 0.74rem;
          color: var(--text-muted);
        }

        .sigre-overview-root .footer-links {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .sigre-overview-root .footer-links a:hover,
        .sigre-overview-root .footer-links button:hover {
          color: var(--text);
        }

        .sigre-overview-root .toast {
          position: fixed;
          right: 20px;
          bottom: 20px;
          z-index: 60;
          max-width: 340px;
          padding: 12px 14px;
          border-radius: 12px;
          background: var(--brand);
          color: #ffffff;
          box-shadow: var(--shadow-md);
          font-size: 0.84rem;
          font-weight: 500;
          opacity: 0;
          transform: translateY(8px);
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .sigre-overview-root .toast.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 1120px) {
          .sigre-overview-root .metrics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .sigre-overview-root .dashboard-grid,
          .sigre-overview-root .split-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 860px) {
          .sigre-overview-root .app-shell {
            grid-template-columns: 1fr;
          }

          .sigre-overview-root .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            width: min(286px, 86vw);
            transform: translateX(-100%);
            transition: transform 0.22s ease;
          }

          .sigre-overview-root .sidebar.is-open {
            transform: translateX(0);
          }

          .sigre-overview-root .mobile-menu {
            display: inline-flex;
          }

          .sigre-overview-root .topbar,
          .sigre-overview-root .content,
          .sigre-overview-root .footer-inner {
            padding-left: 18px;
            padding-right: 18px;
          }

          .sigre-overview-root .hero-panel {
            grid-template-columns: 1fr;
          }

          .sigre-overview-root .hero-media {
            height: 180px;
          }

          .sigre-overview-root .profile-copy,
          .sigre-overview-root .status-text {
            display: none;
          }
        }

        @media (max-width: 620px) {
          .sigre-overview-root .page-intro,
          .sigre-overview-root .section-heading {
            flex-direction: column;
            align-items: flex-start;
          }

          .sigre-overview-root .metrics-grid {
            grid-template-columns: 1fr;
          }

          .sigre-overview-root .module-row {
            flex-wrap: wrap;
          }

          .sigre-overview-root .module-status {
            margin-left: auto;
          }

          .sigre-overview-root .module-action {
            width: 100%;
            justify-content: center;
          }

          .sigre-overview-root .hero-actions {
            width: 100%;
          }

          .sigre-overview-root .button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div
        className={`sidebar-overlay ${sidebarOpen ? 'is-visible' : ''}`}
        id="sidebarOverlay"
        onClick={closeSidebar}
      />

      <div className="app-shell">
        <aside
          className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}
          id="sidebar"
          aria-label="Navegação principal"
        >
          <div className="sidebar-top">
            <a
              href="#overview"
              className="brand"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('overview');
              }}
            >
              <span className="brand-mark">
                <GraduationCap className="lucide-icon" />
              </span>

              <span className="brand-copy">
                <strong>SIGRE</strong>
                <small>Gestão escolar</small>
              </span>
            </a>

            <div className="workspace-card">
              <span className="workspace-label">Área activa</span>
              <strong>Direcção Municipal</strong>
              <small>Educação · Quessúa</small>
            </div>

            <nav className="sidebar-nav">
              <div className="nav-group">
                <span className="nav-group-label">Gestão</span>

                <a
                  href="#overview"
                  className={`nav-link ${activeNav === 'overview' ? 'active' : ''}`}
                  aria-current={activeNav === 'overview' ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('overview');
                  }}
                >
                  <LayoutDashboard className="lucide-icon" />
                  <span>Visão geral</span>
                </a>

                <a
                  href="#modules"
                  className={`nav-link ${activeNav === 'escolas' ? 'active' : ''}`}
                  aria-current={activeNav === 'escolas' ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('escolas', 'Secção de escolas seleccionada.', schoolsView);
                  }}
                >
                  <Building2 className="lucide-icon" />
                  <span>Escolas</span>
                </a>

                <a
                  href="#staff"
                  className={`nav-link ${activeNav === 'professores' ? 'active' : ''}`}
                  aria-current={activeNav === 'professores' ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('professores', 'Secção de professores seleccionada.', teachersView);
                  }}
                >
                  <Users className="lucide-icon" />
                  <span>Professores</span>
                  <span className="nav-badge">{teachersCount}</span>
                </a>

                <a
                  href="#modules"
                  className={`nav-link ${activeNav === 'turmas' ? 'active' : ''}`}
                  aria-current={activeNav === 'turmas' ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('turmas', 'Configuração de turmas pendente.', classesView);
                  }}
                >
                  <Layers className="lucide-icon" />
                  <span>Turmas</span>
                </a>

                <a
                  href="#reports"
                  className={`nav-link ${activeNav === 'relatorios' ? 'active' : ''}`}
                  aria-current={activeNav === 'relatorios' ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('relatorios', 'Secção de relatórios seleccionada.', reportsView);
                  }}
                >
                  <BarChart3 className="lucide-icon" />
                  <span>Relatórios</span>
                </a>
              </div>

              <div className="nav-group">
                <span className="nav-group-label">Sistema</span>

                <a
                  href="#support"
                  className={`nav-link ${activeNav === 'definicoes' ? 'active' : ''}`}
                  aria-current={activeNav === 'definicoes' ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('definicoes', 'Definições do sistema.');
                    onOpenSettings();
                  }}
                >
                  <Settings className="lucide-icon" />
                  <span>Definições</span>
                </a>
              </div>
            </nav>
          </div>

          <div className="sidebar-bottom">
            <a
              href="#support"
              className="support-link"
              onClick={(e) => {
                e.preventDefault();
                showToast('Centro de apoio disponível.');
                onOpenSupport();
              }}
            >
              <LifeBuoy className="lucide-icon" />
              <span>Centro de apoio</span>
            </a>

            <div className="sidebar-user">
              <span className="avatar">{displayInitials}</span>

              <div className="user-copy">
                <strong>{displayName}</strong>
                <small>{displayRole}</small>
              </div>
            </div>
          </div>
        </aside>

        <main className="main-area">
          <header className="topbar">
            <div className="topbar-left">
              <button
                className="icon-button mobile-menu"
                id="menuToggle"
                type="button"
                aria-label="Abrir menu"
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen((prev) => !prev)}
              >
                <Menu className="lucide-icon" />
              </button>

              <div className="breadcrumbs" aria-label="Localização">
                <span>SIGRE</span>
                <ChevronRight className="lucide-icon" />
                <strong>Visão geral</strong>
              </div>
            </div>

            <div className="topbar-actions">
              <button
                className="status-pill"
                type="button"
                onClick={() => {
                  showToast('Existem 3 processos pendentes de homologação.');
                  onNavigateView(approvalsView);
                }}
              >
                <ShieldCheck className="lucide-icon" />
                <span className="status-text">Homologações</span>
                <span className="status-counter">3</span>
              </button>

              <button
                ref={notificationsBtnRef}
                className="icon-button"
                id="notificationsButton"
                type="button"
                aria-label="Abrir notificações"
                aria-expanded={notificationsOpen}
                aria-controls="notificationsPanel"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileOpen(false);
                  setNotificationsOpen((prev) => !prev);
                }}
              >
                <Bell className="lucide-icon" />
                <span className="notification-dot" />
              </button>

              <button
                ref={profileBtnRef}
                className="profile-trigger"
                id="profileButton"
                type="button"
                aria-expanded={profileOpen}
                aria-controls="profilePanel"
                onClick={(e) => {
                  e.stopPropagation();
                  setNotificationsOpen(false);
                  setProfileOpen((prev) => !prev);
                }}
              >
                <span className="avatar">{displayInitials}</span>

                <span className="profile-copy">
                  <strong>{displayName}</strong>
                  <small>{displayRole}</small>
                </span>

                <ChevronDown className="lucide-icon" />
              </button>

              <div
                ref={notificationsRef}
                className="popover"
                id="notificationsPanel"
                hidden={!notificationsOpen}
              >
                <div className="popover-header">
                  <strong>Notificações</strong>
                  <small>Actividade recente do sistema</small>
                </div>

                <button
                  className="popover-item"
                  type="button"
                  onClick={() => {
                    closePopovers();
                    showToast('A área de homologações será aberta.');
                    onNavigateView(approvalsView);
                  }}
                >
                  <ShieldCheck className="lucide-icon" />
                  <span>
                    <strong>3 homologações pendentes</strong>
                    <small>Requerem revisão da direcção</small>
                  </span>
                </button>

                <button
                  className="popover-item"
                  type="button"
                  onClick={() => {
                    closePopovers();
                    showToast('A configuração de turmas está pendente.');
                    onNavigateView(classesView);
                  }}
                >
                  <TriangleAlert className="lucide-icon" />
                  <span>
                    <strong>Turmas ainda não configuradas</strong>
                    <small>Complete o próximo passo do período lectivo</small>
                  </span>
                </button>
              </div>

              <div
                ref={profileRef}
                className="popover"
                id="profilePanel"
                hidden={!profileOpen}
              >
                <div className="popover-header">
                  <strong>{displayName}</strong>
                  <small>Administrador do sistema</small>
                </div>

                <button
                  className="popover-item"
                  type="button"
                  onClick={() => {
                    closePopovers();
                    showToast('O perfil será aberto.');
                    onOpenProfile();
                  }}
                >
                  <UserRound className="lucide-icon" />
                  <span>
                    <strong>Meu perfil</strong>
                    <small>Dados e permissões de acesso</small>
                  </span>
                </button>

                <button
                  className="popover-item"
                  type="button"
                  onClick={() => {
                    closePopovers();
                    showToast('Sessão terminada.');
                    onLogout();
                  }}
                >
                  <LogOut className="lucide-icon" />
                  <span>
                    <strong>Terminar sessão</strong>
                    <small>Sair da conta actual</small>
                  </span>
                </button>
              </div>
            </div>
          </header>

          <div className="content">
            <section className="page-intro" id="overview">
              <div>
                <span className="eyebrow">Painel de gestão</span>
                <h1>Bom dia, {displayName}</h1>
                <p>Acompanhe o estado da rede escolar num único lugar.</p>
              </div>

              <div className="page-meta">
                <span className="sync-dot" />
                <span id="lastUpdated">{lastUpdated}</span>
              </div>
            </section>

            <section className="hero-panel" aria-label="Próximo passo">
              <div className="hero-copy">
                <span className="eyebrow">Próximo passo</span>
                <h2>Prepare o novo período lectivo</h2>
                <p>Configure as turmas para activar os indicadores de acompanhamento.</p>

                <div className="hero-actions">
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={() => {
                      showToast('A configuração de turmas será aberta.');
                      onNavigateView(classesView);
                    }}
                  >
                    Configurar turmas
                    <ArrowUpRight className="lucide-icon" />
                  </button>

                  <button
                    className="button button-ghost"
                    type="button"
                    onClick={() => {
                      showToast('Não existem outras pendências neste momento.');
                    }}
                  >
                    Ver pendências
                    <ListCheck className="lucide-icon" />
                  </button>
                </div>
              </div>

              <div className="hero-media">
                <img
                  src={teacherClassroomImg}
                  alt="Sala de aula com estudantes"
                  loading="lazy"
                />
              </div>
            </section>

            <section className="section" aria-labelledby="indicators-title">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Resumo</span>
                  <h2 id="indicators-title">Indicadores principais</h2>
                </div>

                <button
                  className={`text-button ${isRefreshing ? 'is-loading' : ''}`}
                  id="refreshButton"
                  type="button"
                  onClick={handleRefresh}
                >
                  Actualizar
                  <RefreshCw className="lucide-icon" />
                </button>
              </div>

              <div className="metrics-grid">
                <article className="metric-card primary">
                  <div className="metric-top">
                    <span>Alunos</span>
                    <span className="metric-icon">
                      <GraduationCap className="lucide-icon" />
                    </span>
                  </div>

                  <strong className="metric-value">{studentsCount}</strong>

                  <div className="metric-bottom">
                    <span className="metric-status">
                      {studentsCount === 0 ? 'Sem registos activos' : 'Registados no sistema'}
                    </span>
                    <button
                      className="metric-link"
                      type="button"
                      onClick={() => {
                        showToast('O módulo de alunos será aberto.');
                        onNavigateView(studentsView);
                      }}
                    >
                      Ver
                      <ArrowUpRight className="lucide-icon" />
                    </button>
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-top">
                    <span>Turmas</span>
                    <span className="metric-icon">
                      <Layers className="lucide-icon" />
                    </span>
                  </div>

                  <strong className="metric-value">{classesCount}</strong>

                  <div className="metric-bottom">
                    <span className="metric-status">Configuração pendente</span>
                    <button
                      className="metric-link"
                      type="button"
                      onClick={() => {
                        showToast('A configuração de turmas será aberta.');
                        onNavigateView(classesView);
                      }}
                    >
                      Configurar
                      <ArrowUpRight className="lucide-icon" />
                    </button>
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-top">
                    <span>Escolas</span>
                    <span className="metric-icon">
                      <Building2 className="lucide-icon" />
                    </span>
                  </div>

                  <strong className="metric-value">{schoolsCount}</strong>

                  <div className="metric-bottom">
                    <span className="metric-status">
                      {schoolsCount === 1 ? 'Escola registada' : 'Escolas registadas'}
                    </span>
                    <button
                      className="metric-link"
                      type="button"
                      onClick={() => {
                        showToast('A lista de escolas será aberta.');
                        onNavigateView(schoolsView);
                      }}
                    >
                      Ver
                      <ArrowUpRight className="lucide-icon" />
                    </button>
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-top">
                    <span>Professores</span>
                    <span className="metric-icon">
                      <Users className="lucide-icon" />
                    </span>
                  </div>

                  <strong className="metric-value">{teachersCount}</strong>

                  <div className="metric-bottom">
                    <span className="metric-status">Registados no sistema</span>
                    <button
                      className="metric-link"
                      type="button"
                      onClick={() => {
                        showToast('A lista de professores será aberta.');
                        onNavigateView(teachersView);
                      }}
                    >
                      Ver
                      <ArrowUpRight className="lucide-icon" />
                    </button>
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-top">
                    <span>Presença média</span>
                    <span className="metric-icon">
                      <ClipboardCheck className="lucide-icon" />
                    </span>
                  </div>

                  <strong className="metric-value">0%</strong>

                  <div className="metric-bottom">
                    <span className="metric-status">Sem dados disponíveis</span>
                    <span className="state-badge neutral">Aguardando</span>
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-top">
                    <span>Alertas activos</span>
                    <span className="metric-icon">
                      <TriangleAlert className="lucide-icon" />
                    </span>
                  </div>

                  <strong className="metric-value">0</strong>

                  <div className="metric-bottom">
                    <span className="metric-status">Nenhum alerta crítico</span>
                    <span className="state-badge success">Regular</span>
                  </div>
                </article>
              </div>
            </section>

            <section className="dashboard-grid" aria-label="Monitorização">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">Monitorização</span>
                    <h2>Estado da rede</h2>
                  </div>

                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Mais opções do estado da rede"
                    onClick={() => showToast('Não existem outras opções disponíveis.')}
                  >
                    <MoreHorizontal className="lucide-icon" />
                  </button>
                </div>

                <div className="network-summary">
                  <div className="summary-number">
                    {schoolsCount} <span>{schoolsCount === 1 ? 'escola activa' : 'escolas activas'}</span>
                  </div>

                  <span className="state-badge warning">
                    <TriangleAlert className="lucide-icon" />
                    Configuração pendente
                  </span>
                </div>

                <div className="progress-list">
                  <div className="progress-row">
                    <div className="progress-label">
                      <span>Escolas registadas</span>
                      <strong>
                        {schoolsCount} de {schoolsCount}
                      </strong>
                    </div>

                    <div className="progress-track">
                      <div className="progress-value green" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div className="progress-row">
                    <div className="progress-label">
                      <span>Professores homologados</span>
                      <strong>
                        {teachersCount} de {teachersCount}
                      </strong>
                    </div>

                    <div className="progress-track">
                      <div className="progress-value green" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div className="progress-row">
                    <div className="progress-label">
                      <span>Turmas configuradas</span>
                      <strong>0 de 0</strong>
                    </div>

                    <div className="progress-track">
                      <div className="progress-value gray" style={{ width: '4%' }} />
                    </div>
                  </div>

                  <div className="progress-row">
                    <div className="progress-label">
                      <span>Dados de presença</span>
                      <strong>Sem dados</strong>
                    </div>

                    <div className="progress-track">
                      <div className="progress-value gray" style={{ width: '0%' }} />
                    </div>
                  </div>
                </div>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">Acesso rápido</span>
                    <h2>Acções frequentes</h2>
                  </div>
                </div>

                <div className="quick-actions">
                  <div className="action-row">
                    <span className="action-icon">
                      <Users className="lucide-icon" />
                    </span>

                    <span className="action-copy">
                      <strong>Adicionar professor</strong>
                      <small>Registar novo docente na rede</small>
                    </span>

                    <button
                      className="action-arrow"
                      type="button"
                      aria-label="Adicionar professor"
                      onClick={() => {
                        showToast('O formulário de novo professor será aberto.');
                        onAddTeacher();
                      }}
                    >
                      <Plus className="lucide-icon" />
                    </button>
                  </div>

                  <div className="action-row">
                    <span className="action-icon">
                      <Layers className="lucide-icon" />
                    </span>

                    <span className="action-copy">
                      <strong>Configurar turmas</strong>
                      <small>Organizar classes e períodos</small>
                    </span>

                    <button
                      className="action-arrow"
                      type="button"
                      aria-label="Configurar turmas"
                      onClick={() => {
                        showToast('A configuração de turmas será aberta.');
                        onNavigateView(classesView);
                      }}
                    >
                      <ArrowUpRight className="lucide-icon" />
                    </button>
                  </div>

                  <div className="action-row">
                    <span className="action-icon">
                      <FileText className="lucide-icon" />
                    </span>

                    <span className="action-copy">
                      <strong>Gerar relatório</strong>
                      <small>Consultar resumo da rede escolar</small>
                    </span>

                    <button
                      className="action-arrow"
                      type="button"
                      aria-label="Gerar relatório"
                      onClick={() => {
                        showToast('O relatório está a ser preparado.');
                        onOpenExport();
                      }}
                    >
                      <Download className="lucide-icon" />
                    </button>
                  </div>

                  <div className="action-row">
                    <span className="action-icon">
                      <CalendarDays className="lucide-icon" />
                    </span>

                    <span className="action-copy">
                      <strong>Abrir calendário</strong>
                      <small>Consultar agenda e actividades</small>
                    </span>

                    <button
                      className="action-arrow"
                      type="button"
                      aria-label="Abrir calendário"
                      onClick={() => {
                        showToast('O calendário será aberto.');
                        onNavigateView(attendanceView);
                      }}
                    >
                      <ArrowUpRight className="lucide-icon" />
                    </button>
                  </div>
                </div>
              </article>
            </section>

            <section className="section" id="modules" aria-labelledby="modules-title">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Sistemas integrados</span>
                  <h2 id="modules-title">Módulos principais</h2>
                </div>

                <button
                  className="text-button"
                  type="button"
                  onClick={() => showToast('Todos os módulos já estão visíveis.')}
                >
                  Ver todos
                  <ArrowRight className="lucide-icon" />
                </button>
              </div>

              <div className="module-list">
                <article className="module-row">
                  <span className="module-icon">
                    <Building2 className="lucide-icon" />
                  </span>

                  <span className="module-copy">
                    <strong>Gestão escolar</strong>
                    <small>Escolas, matrizes curriculares e organização administrativa.</small>
                  </span>

                  <span className="state-badge success module-status">Activo</span>

                  <button
                    className="module-action"
                    type="button"
                    onClick={() => {
                      showToast('O módulo de gestão escolar será aberto.');
                      onNavigateView(schoolsView);
                    }}
                  >
                    Aceder
                    <ArrowUpRight className="lucide-icon" />
                  </button>
                </article>

                <article className="module-row">
                  <span className="module-icon">
                    <Users className="lucide-icon" />
                  </span>

                  <span className="module-copy">
                    <strong>Professores e aulas</strong>
                    <small>Docentes, horários, planos e registo de aulas.</small>
                  </span>

                  <span className="state-badge success module-status">Activo</span>

                  <button
                    className="module-action"
                    type="button"
                    onClick={() => {
                      showToast('O módulo de professores será aberto.');
                      onNavigateView(teachersView);
                    }}
                  >
                    Aceder
                    <ArrowUpRight className="lucide-icon" />
                  </button>
                </article>

                <article className="module-row">
                  <span className="module-icon">
                    <ClipboardCheck className="lucide-icon" />
                  </span>

                  <span className="module-copy">
                    <strong>Notas e presença</strong>
                    <small>Acompanhamento de frequência, avaliações e desempenho.</small>
                  </span>

                  <span className="state-badge neutral module-status">Sem dados</span>

                  <button
                    className="module-action"
                    type="button"
                    onClick={() => {
                      showToast('O módulo de notas e presença será aberto.');
                      onNavigateView(attendanceView);
                    }}
                  >
                    Aceder
                    <ArrowUpRight className="lucide-icon" />
                  </button>
                </article>

                <article className="module-row">
                  <span className="module-icon">
                    <MessageSquare className="lucide-icon" />
                  </span>

                  <span className="module-copy">
                    <strong>Comunicação</strong>
                    <small>Mensagens, avisos e comunicação com a comunidade escolar.</small>
                  </span>

                  <span className="state-badge success module-status">Activo</span>

                  <button
                    className="module-action"
                    type="button"
                    onClick={() => {
                      showToast('O módulo de comunicação será aberto.');
                      onOpenChat();
                    }}
                  >
                    Aceder
                    <ArrowUpRight className="lucide-icon" />
                  </button>
                </article>

                <article className="module-row">
                  <span className="module-icon">
                    <BarChart3 className="lucide-icon" />
                  </span>

                  <span className="module-copy">
                    <strong>Relatórios e indicadores</strong>
                    <small>Consultas consolidadas para apoio à decisão.</small>
                  </span>

                  <span className="state-badge success module-status">Activo</span>

                  <button
                    className="module-action"
                    type="button"
                    onClick={() => {
                      showToast('O módulo de relatórios será aberto.');
                      onNavigateView(reportsView);
                    }}
                  >
                    Aceder
                    <ArrowUpRight className="lucide-icon" />
                  </button>
                </article>
              </div>
            </section>

            <section className="section split-grid" id="staff">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">Actividade</span>
                    <h2>Actividade recente</h2>
                  </div>

                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Actualizar actividade"
                    onClick={() => showToast('Não existem novas actividades.')}
                  >
                    <RefreshCw className="lucide-icon" />
                  </button>
                </div>

                <div className="empty-state">
                  <div>
                    <Clock3 className="lucide-icon" />
                    <strong>Nenhuma actividade recente</strong>
                    <p>As novas acções realizadas no sistema aparecerão aqui.</p>
                  </div>
                </div>
              </article>

              <article className="panel" id="reports">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">Consultas rápidas</span>
                    <h2>Relatórios disponíveis</h2>
                  </div>
                </div>

                <div className="report-list">
                  <div className="report-item">
                    <span className="report-copy">
                      <strong>Resumo da rede escolar</strong>
                      <small>Escolas, professores e indicadores gerais</small>
                    </span>

                    <button
                      className="report-download"
                      type="button"
                      aria-label="Descarregar resumo da rede escolar"
                      onClick={() => {
                        showToast('O resumo da rede escolar está a ser preparado.');
                        onOpenExport();
                      }}
                    >
                      <Download className="lucide-icon" />
                    </button>
                  </div>

                  <div className="report-item">
                    <span className="report-copy">
                      <strong>Lista de professores</strong>
                      <small>Docentes registados e estado de homologação</small>
                    </span>

                    <button
                      className="report-download"
                      type="button"
                      aria-label="Descarregar lista de professores"
                      onClick={() => {
                        showToast('A lista de professores está a ser preparada.');
                        onOpenExport();
                      }}
                    >
                      <Download className="lucide-icon" />
                    </button>
                  </div>

                  <div className="report-item">
                    <span className="report-copy">
                      <strong>Mapa de escolas</strong>
                      <small>Informação consolidada das escolas activas</small>
                    </span>

                    <button
                      className="report-download"
                      type="button"
                      aria-label="Descarregar mapa de escolas"
                      onClick={() => {
                        showToast('O mapa de escolas está a ser preparado.');
                        onOpenExport();
                      }}
                    >
                      <Download className="lucide-icon" />
                    </button>
                  </div>
                </div>
              </article>
            </section>
          </div>

          <footer className="footer" id="support">
            <div className="footer-inner">
              <div className="footer-brand">
                <span className="brand-mark">
                  <GraduationCap className="lucide-icon" />
                </span>

                <span>
                  <strong>SIGRE</strong>
                  <small>Sistema integrado de gestão escolar</small>
                </span>
              </div>

              <div className="footer-links">
                <a
                  href="#support"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenSupport();
                  }}
                >
                  Centro de apoio
                </a>
                <a
                  href="#overview"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateView('termos');
                  }}
                >
                  Termos
                </a>
                <a
                  href="#overview"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateView('privacidade');
                  }}
                >
                  Privacidade
                </a>
                <a
                  href="#overview"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateView('seguranca');
                  }}
                >
                  Segurança
                </a>
                <span>© 2026 SIGRE Angola</span>
              </div>
            </div>
          </footer>
        </main>
      </div>

      <div
        className={`toast ${toastVisible ? 'visible' : ''}`}
        id="toast"
        role="status"
        aria-live="polite"
      >
        {toastText}
      </div>
    </div>
  );
};
