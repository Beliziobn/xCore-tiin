import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { StatCards } from './components/StatCards';
import { CyanCardsSection } from './components/CyanCardsSection';
import { CloudFooter } from './components/CloudFooter';
import { AuthPage } from './components/pages/AuthPage';
import { StatDetailModal } from './components/StatDetailModal';
import { ModuleDetailModal } from './components/ModuleDetailModal';
import { InfoModal, InfoModalType } from './components/InfoModal';
import { SessionSettingsModal } from './components/SessionSettingsModal';
import { sessionsData } from './data/sessionsData';

// Director Pages
import { DirectorStatisticsPage } from './components/pages/director/DirectorStatisticsPage';
import { DirectorTeachersPage } from './components/pages/director/DirectorTeachersPage';
import { DirectorStudentsPage } from './components/pages/director/DirectorStudentsPage';
import { DirectorRoomsPage } from './components/pages/director/DirectorRoomsPage';
import { DirectorClassesPage } from './components/pages/director/DirectorClassesPage';
import { DirectorProfilePage } from './components/pages/director/DirectorProfilePage';
import { DirectorAttendancePage } from './components/pages/director/DirectorAttendancePage';

// Admin Pages & Components
import { AdminStatisticsPage } from './components/pages/admin/AdminStatisticsPage';
import { AdminSchoolsPage } from './components/pages/admin/AdminSchoolsPage';
import { AdminTeachersPage } from './components/pages/admin/AdminTeachersPage';
import { AdminStudentsPage } from './components/pages/admin/AdminStudentsPage';
import { AdminDirectorsPage } from './components/pages/admin/AdminDirectorsPage';
import { AdminProfilePage } from './components/pages/admin/AdminProfilePage';
import { AdminAnnouncementsPage } from './components/pages/admin/AdminAnnouncementsPage';
import { AdminRegistrationModal, AdminModalType } from './components/pages/admin/AdminRegistrationModal';
import { ExcelExportModal } from './components/modals/ExcelExportModal';
import { 
  initialAdminSchools, 
  initialAdminTeachers, 
  initialAdminStudents, 
  initialAdminDirectors 
} from './data/adminData';

// Teacher & Student Pages
import { TeacherStatisticsPage } from './components/pages/TeacherStatisticsPage';
import { TeacherClassPage } from './components/pages/TeacherClassPage';
import { TeacherProfilePage } from './components/pages/TeacherProfilePage';
import { TeacherAttendancePage } from './components/pages/TeacherAttendancePage';
import { StudentProfilePage } from './components/pages/StudentProfilePage';
import { 
  initialStudentsData, 
  initialTeacherData, 
  StudentProfile, 
  TeacherData,
  defaultDisciplinasList
} from './data/teacherData';

// Chat System Components & Mock Data
import { SupportChatModal } from './components/chat/SupportChatModal';
import { FloatingChatButton } from './components/chat/FloatingChatButton';
import { initialChatChannels, initialChatMessages } from './data/chatData';
import { realtimeChat } from './utils/realtimeChat';
import { initSmoothScroll, scrollToTop, refreshScrollReveals } from './utils/scrollManager';

// School Team Section (Professores, Gestores e Coordenadores)
import SchoolTeamSection, { defaultSchoolMembers, SchoolMember } from './components/ui/school-team-section';
import { AIInputWithLoading } from './components/ui/ai-input-with-loading';

import type { 
  EducationalModule, 
  UserAccount, 
  SessionProfile, 
  SessionCard, 
  SessionSettings,
  AdminSchool,
  AdminTeacher,
  AdminStudent,
  AdminDirector,
  ChatMessage,
  ChatChannel,
  ChatRole
} from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'login' | 'register'>('home');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authLoadingAction, setAuthLoadingAction] = useState<'login' | 'register' | null>(null);
  const [currentView, setCurrentView] = useState<string>(() => {
    try {
      return localStorage.getItem('ucore_current_view') || 'home';
    } catch {
      return 'home';
    }
  });
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SessionCard | null>(null);
  const [selectedModule, setSelectedModule] = useState<EducationalModule | null>(null);
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin dynamic state
  const [adminSchools, setAdminSchools] = useState<AdminSchool[]>(() => {
    try {
      const saved = localStorage.getItem('ucore_admin_schools');
      return saved ? JSON.parse(saved) : initialAdminSchools;
    } catch {
      return initialAdminSchools;
    }
  });

  const [adminTeachers, setAdminTeachers] = useState<AdminTeacher[]>(() => {
    try {
      const saved = localStorage.getItem('ucore_admin_teachers');
      return saved ? JSON.parse(saved) : initialAdminTeachers;
    } catch {
      return initialAdminTeachers;
    }
  });

  const [adminStudents, setAdminStudents] = useState<AdminStudent[]>(() => {
    try {
      const saved = localStorage.getItem('ucore_admin_students');
      return saved ? JSON.parse(saved) : initialAdminStudents;
    } catch {
      return initialAdminStudents;
    }
  });

  const [adminDirectors, setAdminDirectors] = useState<AdminDirector[]>(() => {
    try {
      const saved = localStorage.getItem('ucore_admin_directors');
      return saved ? JSON.parse(saved) : initialAdminDirectors;
    } catch {
      return initialAdminDirectors;
    }
  });

  const [adminModalType, setAdminModalType] = useState<AdminModalType>(null);
  const [isExcelExportModalOpen, setIsExcelExportModalOpen] = useState(false);
  const [homeAIResponse, setHomeAIResponse] = useState<string | null>(null);

  const handleHomeAICommand = (prompt: string) => {
    if (!prompt.trim()) return;
    const p = prompt.toLowerCase();
    if (p.includes('ponto') || p.includes('presen') || p.includes('falta') || p.includes('docente') || p.includes('professor')) {
      setHomeAIResponse(
        `📊 Análise de Presenças (Livro de Ponto Docente):\n• Total de Professores: 23 docentes lotados na unidade.\n• Presentes: 22 docentes em regência de classe regular.\n• Falta Justificada: 1 docente (comprovativo médico homologado na secretaria).\n• Índice de Assiduidade: 95.7% no dia de hoje.`
      );
    } else if (p.includes('turma') || p.includes('aluno') || p.includes('sala')) {
      setHomeAIResponse(
        `🎓 Panorama Discente & Turmas:\n• 489 alunos distribuídos por 16 turmas nos turnos da manhã e tarde.\n• Frequência discente média da unidade: 96.2%.\n• 11 salas operacionais com iluminação e ventilação certificadas.`
      );
    } else {
      setHomeAIResponse(
        `✨ Parecer Institucional Inteligente uCore:\nRecebido: "${prompt}".\nOs dados da Direção e da Secretaria Escolar de Quêssua encontram-se homologados e em total conformidade para o ano letivo de 2026.`
      );
    }
  };

  // Persist admin entities on change
  useEffect(() => {
    try {
      localStorage.setItem('ucore_admin_schools', JSON.stringify(adminSchools));
    } catch {
      // ignore
    }
  }, [adminSchools]);

  useEffect(() => {
    try {
      localStorage.setItem('ucore_admin_teachers', JSON.stringify(adminTeachers));
    } catch {
      // ignore
    }
  }, [adminTeachers]);

  useEffect(() => {
    try {
      localStorage.setItem('ucore_admin_directors', JSON.stringify(adminDirectors));
    } catch {
      // ignore
    }
  }, [adminDirectors]);

  useEffect(() => {
    try {
      localStorage.setItem('ucore_admin_students', JSON.stringify(adminStudents));
    } catch {
      // ignore
    }
  }, [adminStudents]);

  // Teacher dynamic state
  const [teacherStudents, setTeacherStudents] = useState<StudentProfile[]>(() => {
    try {
      const saved = localStorage.getItem('ucore_teacher_students');
      return saved ? JSON.parse(saved) : initialStudentsData;
    } catch {
      return initialStudentsData;
    }
  });

  const [selectedStudent, setSelectedStudent] = useState<StudentProfile>(() => {
    return teacherStudents[0] || initialStudentsData[0];
  });

  const [teacherProfile, setTeacherProfile] = useState<TeacherData>(() => {
    try {
      const saved = localStorage.getItem('ucore_teacher_profile');
      return saved ? JSON.parse(saved) : initialTeacherData;
    } catch {
      return initialTeacherData;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ucore_teacher_students', JSON.stringify(teacherStudents));
    } catch {
      // ignore
    }
  }, [teacherStudents]);

  useEffect(() => {
    try {
      localStorage.setItem('ucore_teacher_profile', JSON.stringify(teacherProfile));
    } catch {
      // ignore
    }
  }, [teacherProfile]);

  // User persistence
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('ucore_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Active Role and session configuration state
  const [activeRole, setActiveRole] = useState<'admin' | 'diretor' | 'professor'>(() => {
    try {
      const savedRole = localStorage.getItem('ucore_active_role');
      if (savedRole === 'admin' || savedRole === 'diretor' || savedRole === 'professor') {
        return savedRole;
      }
    } catch {
      // ignore
    }
    if (currentUser?.role === 'admin' || currentUser?.role === 'diretor' || currentUser?.role === 'professor') {
      return currentUser.role;
    }
    return 'diretor'; // default to diretor as requested by user
  });

  // Persist currentView and activeRole on changes
  useEffect(() => {
    try {
      localStorage.setItem('ucore_current_view', currentView);
    } catch {
      // ignore
    }
  }, [currentView]);

  useEffect(() => {
    try {
      localStorage.setItem('ucore_active_role', activeRole);
    } catch {
      // ignore
    }
  }, [activeRole]);

  // Curated faculty portraits assigned consistently to registered teachers
  const TEACHER_PORTRAITS: string[] = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1548142813-c348350df52b?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=400&auto=format&fit=crop',
  ];

  // Strictly use teachers registered in the system (adminTeachers)
  const schoolMembers: SchoolMember[] = useMemo(() => {
    return adminTeachers.map((t, idx) => {
      const emailSlug = t.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '.')
        .replace(/\.+/g, '.');

      const photo = TEACHER_PORTRAITS[idx % TEACHER_PORTRAITS.length];

      return {
        id: t.id,
        name: t.name,
        role: t.category || `Professor(a) de ${t.subject || 'Ensino Geral'}`,
        photo,
        department: t.schoolName || 'Corpo Docente',
        schoolName: t.schoolName,
        subject: t.subject,
        gradeClass: t.gradeClass,
        turma: t.turma,
        room: t.room,
        location: t.location,
        presenceRate: t.presenceRate,
        phone: t.phone,
        email: `${emailSlug}@educacao.gov.ao`,
        bio: `Professor(a) com registro oficial ativo no sistema escolar de Quêssua (${t.schoolName}). Leciona ${t.subject} (${t.gradeClass || 'Ensino Regular'} - ${t.turma || 'Turma A'}) na ${t.room || 'Sala de Aula'} (${t.location || 'Bloco Central'}), com taxa de assiduidade pedagógica registada de ${t.presenceRate}%.`,
      };
    });
  }, [adminTeachers]);

  // Chat System Dynamic State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatChannels, setChatChannels] = useState<ChatChannel[]>(() => {
    try {
      const saved = localStorage.getItem('ucore_chat_channels_v3');
      if (saved) return JSON.parse(saved);

      const oldSaved = localStorage.getItem('ucore_chat_channels');
      if (oldSaved) {
        const parsed = JSON.parse(oldSaved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((c: ChatChannel) => typeof c.schoolName === 'string' && c.schoolName.length > 0)) {
          return parsed;
        }
      }
      return initialChatChannels;
    } catch {
      return initialChatChannels;
    }
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('ucore_chat_messages');
      return saved ? JSON.parse(saved) : initialChatMessages;
    } catch {
      return initialChatMessages;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ucore_chat_messages', JSON.stringify(chatMessages));
    } catch {
      // ignore
    }
  }, [chatMessages]);

  useEffect(() => {
    try {
      localStorage.setItem('ucore_chat_channels_v3', JSON.stringify(chatChannels));
      localStorage.setItem('ucore_chat_channels', JSON.stringify(chatChannels));
    } catch {
      // ignore
    }
  }, [chatChannels]);

  // Real-time synchronization across browser tabs and windows
  useEffect(() => {
    const unsub = realtimeChat.subscribeMessages((newMsg) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      setChatChannels((prev) =>
        prev.map((c) =>
          c.id === newMsg.channelId
            ? {
                ...c,
                lastMessageSnippet: `${newMsg.senderName.split(' ')[0]}: ${newMsg.content}`,
                lastMessageTime: 'Agora',
              }
            : c
        )
      );
    });

    return () => {
      unsub();
    };
  }, []);

  // Initialize Lenis global smooth scrolling and scroll reveals across all pages
  useEffect(() => {
    const cleanup = initSmoothScroll();
    return cleanup;
  }, []);

  // When switching page or view, smoothly reset scroll to top and refresh reveals
  useEffect(() => {
    scrollToTop(true);
    const timer = setTimeout(() => {
      refreshScrollReveals();
    }, 60);
    return () => clearTimeout(timer);
  }, [currentPage, currentView]);

  const unreadChatCount = useMemo(() => {
    return chatChannels.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [chatChannels]);

  const handleSendMessage = (
    channelId: string,
    content: string,
    senderRole: ChatRole,
    senderName: string,
    schoolName?: string,
    attachment?: {
      name: string;
      size: string;
      type: 'image' | 'pdf' | 'document' | 'other';
      url: string;
    }
  ) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channelId,
      senderId: currentUser?.id || `user-${senderName.toLowerCase().replace(/\s+/g, '-')}`,
      senderName,
      senderRole,
      schoolName,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      attachmentName: attachment?.name,
      attachmentSize: attachment?.size,
      attachmentType: attachment?.type,
      attachmentUrl: attachment?.url,
    };

    setChatMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });

    setChatChannels((prev) =>
      prev.map((c) =>
        c.id === channelId
          ? {
              ...c,
              lastMessageSnippet: `${senderName.split(' ')[0]}: ${content || (attachment ? `[${attachment.name}]` : '')}`,
              lastMessageTime: 'Agora',
              unreadCount: 0,
            }
          : c
      )
    );
  };

  const [allSessions, setAllSessions] = useState<Record<string, SessionProfile>>(() => {
    try {
      const saved = localStorage.getItem('ucore_session_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          admin: {
            ...sessionsData.admin,
            ...parsed.admin,
            settings: { ...sessionsData.admin.settings, ...(parsed.admin?.settings || {}) },
          },
          diretor: {
            ...sessionsData.diretor,
            ...parsed.diretor,
            settings: { ...sessionsData.diretor.settings, ...(parsed.diretor?.settings || {}) },
          },
          professor: {
            ...sessionsData.professor,
            ...parsed.professor,
            settings: { ...sessionsData.professor.settings, ...(parsed.professor?.settings || {}) },
          },
        };
      }
    } catch {
      // fallback
    }
    return sessionsData;
  });

  const activeSession = useMemo(() => {
    const base = allSessions[activeRole] || allSessions.diretor;
    let computedBase = { ...base };

    // Dynamic real data reflection for Admin session cards
    if (activeRole === 'admin') {
      const totalTeachers = adminSchools.reduce((acc, s) => acc + s.teachersCount, 0);
      const totalStudents = adminSchools.reduce((acc, s) => acc + s.studentsWithDocs + s.studentsWithoutDocs, 0);
      const avgPerf = adminSchools.length > 0 
        ? Math.round(adminSchools.reduce((acc, s) => acc + s.performanceRate, 0) / adminSchools.length)
        : 79;

      computedBase = {
        ...base,
        cards: base.cards.map((c) => {
          if (c.id.includes('escola') && !c.id.includes('desempenho')) {
            return { ...c, value: String(adminSchools.length) };
          }
          if (c.id.includes('professor')) {
            return { ...c, value: String(totalTeachers) };
          }
          if (c.id.includes('aluno')) {
            return { ...c, value: String(totalStudents) };
          }
          if (c.id.includes('desempenho')) {
            return { ...c, value: `${avgPerf}%` };
          }
          return c;
        }),
      };
    }

    // Dynamic real data reflection for Teacher session cards
    if (activeRole === 'professor') {
      computedBase = {
        ...base,
        cards: base.cards.map((c) => {
          if (c.title.toLowerCase().includes('turma') || c.id.includes('turma')) {
            return { ...c, value: '1' };
          }
          if (c.title.toLowerCase().includes('aluno') || c.id.includes('aluno')) {
            return { ...c, value: String(teacherStudents.length || 46) };
          }
          if (c.title.toLowerCase().includes('desempenho') || c.title.toLowerCase().includes('estatística')) {
            return { ...c, value: '88%' };
          }
          return c;
        }),
      };
    }

    // If current logged-in user matches this role, override name/greeting if custom
    if (currentUser && currentUser.role === activeRole) {
      return {
        ...computedBase,
        name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        greeting: currentUser.greeting || computedBase.greeting,
        email: currentUser.email || computedBase.email,
      };
    }
    return computedBase;
  }, [allSessions, activeRole, currentUser, adminSchools, teacherStudents]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setInfoModalType(null);
    setSelectedModule(null);
    setSelectedCard(null);
    setSettingsModalOpen(false);
    setCurrentPage(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setIsAuthLoading(false);
    setAuthLoadingAction(null);
    setCurrentUser(user);
    if (user.role === 'admin' || user.role === 'diretor' || user.role === 'professor') {
      setActiveRole(user.role);
    }
    if (user.rememberMe) {
      try {
        localStorage.setItem('ucore_active_user', JSON.stringify(user));
      } catch {
        // ignore
      }
    }
    setCurrentPage('home');
    setCurrentView('home');
    showToast(`${user.greeting || 'Olá ' + user.firstName}! Interface e configurações carregadas.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('home');
    setCurrentView('home');
    try {
      localStorage.removeItem('ucore_active_user');
    } catch {
      // ignore
    }
    showToast('Sessão encerrada com sucesso.');
  };

  const handleSaveSettings = (updated: SessionSettings) => {
    setAllSessions((prev) => {
      const updatedSessions = {
        ...prev,
        [activeRole]: {
          ...prev[activeRole],
          settings: updated,
        },
      };
      try {
        localStorage.setItem('ucore_session_settings', JSON.stringify(updatedSessions));
      } catch {
        // ignore
      }
      return updatedSessions;
    });
    showToast(`Configurações de ${activeSession.title} salvas com sucesso!`);
  };

  const handleSelectPage = (pageId: string) => {
    setCurrentPage('home');
    if (pageId === 'home' || pageId === 'diretor-dashboard' || pageId === 'admin-dashboard') {
      setCurrentView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Admin Views Routing
    if (
      pageId === 'admin-estatisticas' ||
      pageId === 'admin-escolas' ||
      pageId === 'admin-directores' ||
      pageId === 'admin-professores' ||
      pageId === 'admin-alunos' ||
      pageId === 'admin-anuncios' ||
      pageId === 'admin-perfil'
    ) {
      setCurrentView(pageId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (activeRole === 'admin') {
      if (pageId === 'anuncios' || pageId === 'editais' || pageId === 'demandas') {
        setCurrentView('admin-anuncios');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (pageId === 'escolas') {
        setCurrentView('admin-escolas');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (pageId === 'professores') {
        setCurrentView('admin-professores');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (pageId === 'alunos') {
        setCurrentView('admin-alunos');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (pageId === 'estatisticas') {
        setCurrentView('admin-estatisticas');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (activeRole === 'professor') {
      if (pageId === 'minha-turma' || pageId === 'turma' || pageId === 'turmas' || pageId === 'alunos') {
        setCurrentView('professor-turma');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (pageId === 'professor-presenca' || pageId === 'chamada' || pageId === 'presenca-alunos' || pageId === 'presenca') {
        setCurrentView('professor-presenca');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (pageId === 'estatisticas' || pageId === 'professor-estatisticas') {
        setCurrentView('professor-estatisticas');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (pageId === 'perfil-professor' || pageId === 'perfil' || pageId === 'professor-perfil') {
        setCurrentView('professor-perfil');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (pageId === 'perfil-aluno' || pageId === 'aluno-perfil') {
        setCurrentView('aluno-perfil');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Director Views Routing
    if (
      pageId === 'diretor-estatisticas' ||
      pageId === 'diretor-professores' ||
      pageId === 'diretor-alunos' ||
      pageId === 'diretor-salas' ||
      pageId === 'diretor-classes' ||
      pageId === 'diretor-perfil' ||
      pageId === 'diretor-presenca'
    ) {
      setCurrentView(pageId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (pageId === 'ponto-professores' || pageId === 'presenca-professores' || (pageId === 'presenca' && activeRole === 'diretor')) {
      setCurrentView('diretor-presenca');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (pageId === 'estatisticas') {
      if (activeRole === 'diretor') {
        setCurrentView('diretor-estatisticas');
      } else {
        setCurrentView('professor-estatisticas');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (pageId === 'professores' && activeRole === 'diretor') {
      setCurrentView('diretor-professores');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (pageId === 'alunos' && activeRole === 'diretor') {
      setCurrentView('diretor-alunos');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (pageId === 'minha-turma') {
      setCurrentView('professor-turma');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (pageId === 'perfil-professor') {
      setCurrentView('professor-perfil');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (pageId === 'perfil-aluno') {
      setCurrentView('aluno-perfil');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // fallback
    const card = activeSession.cards.find((c) => c.id.includes(pageId) || pageId.includes(c.icon));
    if (card) {
      setSelectedCard(card);
    } else {
      const el = document.getElementById('stats-section');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isSessionStarted = Boolean(currentUser);

  // Render view router based on currentView and currentPage
  const renderCurrentView = () => {
    // 0. Dedicated Login and Registration Pages (shares the global Navbar)
    if (currentPage === 'login' || currentPage === 'register') {
      return (
        <AuthPage
          initialMode={currentPage}
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={() => {
            setCurrentPage('home');
            setCurrentView('home');
          }}
          hideHeader={true}
          onAuthLoadingChange={(loading, action) => {
            setIsAuthLoading(loading);
            setAuthLoadingAction(loading ? (action || null) : null);
          }}
        />
      );
    }

    // 1. Admin Pages
    if (currentView === 'admin-estatisticas') {
      return (
        <AdminStatisticsPage
          onOpenGetStarted={() => handleOpenAuth('login')}
          schools={adminSchools}
          teachers={adminTeachers}
          students={adminStudents}
          directors={adminDirectors}
          onOpenExcelExport={() => setIsExcelExportModalOpen(true)}
          onOpenRegisterModal={() => setAdminModalType('school')}
          onNavigateToSchools={() => {
            setCurrentView('admin-escolas');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToTeachers={() => {
            setCurrentView('admin-professores');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToStudents={() => {
            setCurrentView('admin-alunos');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isLoggedIn={isSessionStarted}
        />
      );
    }
    if (currentView === 'admin-escolas') {
      return (
        <AdminSchoolsPage
          onOpenGetStarted={() => handleOpenAuth('login')}
          schools={adminSchools}
          onOpenRegisterModal={() => setAdminModalType('school')}
          onUpdateSchool={(updated) => {
            setAdminSchools((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            showToast(`Dados da escola "${updated.name}" atualizados com sucesso!`);
          }}
          isLoggedIn={isSessionStarted}
        />
      );
    }
    if (currentView === 'admin-directores') {
      return (
        <AdminDirectorsPage
          onOpenGetStarted={() => handleOpenAuth('login')}
          directors={adminDirectors}
          schools={adminSchools}
          onOpenRegisterModal={() => setAdminModalType('director')}
          onUpdateDirector={(updatedDir) => {
            setAdminDirectors((prev) =>
              prev.map((d) => (d.id === updatedDir.id ? updatedDir : d))
            );
            showToast(`Ficha do Director(a) "${updatedDir.name}" atualizada com sucesso!`);
          }}
          onAddDirector={(newDir) => {
            setAdminDirectors((prev) => [newDir, ...prev]);
            showToast(`Diretor(a) "${newDir.name}" homologado(a) com sucesso!`);
          }}
          isLoggedIn={isSessionStarted}
        />
      );
    }
    if (currentView === 'admin-professores') {
      return (
        <AdminTeachersPage
          onOpenGetStarted={() => handleOpenAuth('login')}
          teachers={adminTeachers}
          schools={adminSchools}
          onOpenRegisterModal={() => setAdminModalType('teacher')}
          isLoggedIn={isSessionStarted}
        />
      );
    }
    if (currentView === 'admin-alunos') {
      return (
        <AdminStudentsPage
          onOpenGetStarted={() => handleOpenAuth('login')}
          students={adminStudents}
          schools={adminSchools}
          onOpenRegisterModal={() => setAdminModalType('student')}
          isLoggedIn={isSessionStarted}
        />
      );
    }
    if (currentView === 'admin-perfil') {
      return (
        <AdminProfilePage
          onOpenGetStarted={() => handleOpenAuth('login')}
          schools={adminSchools}
          onNavigateToStatistics={() => {
            setCurrentView('admin-estatisticas');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isLoggedIn={isSessionStarted}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenExcelExport={() => setIsExcelExportModalOpen(true)}
        />
      );
    }
    if (currentView === 'admin-anuncios') {
      return (
        <AdminAnnouncementsPage
          onOpenGetStarted={() => handleOpenAuth('login')}
          isLoggedIn={isSessionStarted}
          onNavigateToGrades={() => {
            setActiveRole('professor');
            setCurrentView('aluno-perfil');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToMatriculas={() => {
            setActiveRole('diretor');
            setCurrentView('diretor-alunos');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      );
    }

    // 1. Director Pages
    if (currentView === 'diretor-estatisticas') {
      return (
        <DirectorStatisticsPage
          onOpenGetStarted={() => handleOpenAuth('login')}
          isLoggedIn={isSessionStarted}
        />
      );
    }
    if (currentView === 'diretor-professores') {
      return (
        <DirectorTeachersPage
          onOpenGetStarted={() => handleOpenAuth('login')}
          isLoggedIn={isSessionStarted}
          onNavigateToAttendance={() => {
            setCurrentView('diretor-presenca');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onAddTeacherGlobal={(teacher) => {
            setAdminTeachers((prev) => [teacher, ...prev]);
            showToast(`Professor(a) "${teacher.name}" cadastrado(a) pela Direção Escolar com sucesso!`);
          }}
        />
      );
    }
    if (currentView === 'diretor-alunos') {
      return (
        <DirectorStudentsPage
          onOpenGetStarted={() => handleOpenAuth('login')}
          isLoggedIn={isSessionStarted}
          onAddStudentGlobal={(student) => {
            setAdminStudents((prev) => [student, ...prev]);
            showToast(`Aluno(a) "${student.name}" matriculado(a) pela Direção Escolar com sucesso!`);
          }}
        />
      );
    }
    if (currentView === 'diretor-salas') {
      return (
        <DirectorRoomsPage
          onOpenGetStarted={() => handleOpenAuth('login')}
          isLoggedIn={isSessionStarted}
        />
      );
    }
    if (currentView === 'diretor-classes') {
      return (
        <DirectorClassesPage
          onOpenGetStarted={() => handleOpenAuth('login')}
          isLoggedIn={isSessionStarted}
        />
      );
    }
    if (currentView === 'diretor-perfil') {
      return (
        <DirectorProfilePage
          onOpenGetStarted={() => handleOpenAuth('login')}
          isLoggedIn={isSessionStarted}
          onOpenSettings={() => setSettingsModalOpen(true)}
        />
      );
    }
    if (currentView === 'diretor-presenca') {
      return (
        <div className="w-full">
          <Hero
            onOpenGetStarted={() => handleOpenAuth('login')}
            customTitle="Livro de Ponto dos Professores"
            isLoggedIn={isSessionStarted}
          />
          <DirectorAttendancePage
            onBackToTeachers={() => {
              setCurrentView('diretor-professores');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToDashboard={() => {
              setCurrentView('diretor-estatisticas');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      );
    }

    // 2. Teacher & Student Pages
    if (currentView === 'professor-estatisticas') {
      return (
        <div className="w-full">
          <Hero
            onOpenGetStarted={() => handleOpenAuth('login')}
            customTitle="Analisa as suas estatísticas"
            isLoggedIn={isSessionStarted}
          />
          <TeacherStatisticsPage
            onNavigateToClass={() => {
              setCurrentView('professor-turma');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToTeacherProfile={() => {
              setCurrentView('professor-perfil');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToStudent={(studentId) => {
              if (studentId) {
                const found = teacherStudents.find((s) => s.id === studentId);
                if (found) setSelectedStudent(found);
              }
              setCurrentView('aluno-perfil');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            students={teacherStudents}
          />
        </div>
      );
    }
    if (currentView === 'professor-turma') {
      return (
        <div className="w-full">
          <Hero
            onOpenGetStarted={() => handleOpenAuth('login')}
            customTitle="Minha Turma"
            isLoggedIn={isSessionStarted}
          />
          <TeacherClassPage
            onBackToStats={() => {
              setCurrentView('professor-estatisticas');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToAttendance={() => {
              setCurrentView('professor-presenca');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectStudent={(student) => {
              setSelectedStudent(student);
              setCurrentView('aluno-perfil');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAddStudent={(newStudentData) => {
              const hasDocs = newStudentData.tipoDocumento !== 'sem Documento';
              const newStudent: StudentProfile = {
                id: newStudentData.id || `std-${Date.now()}`,
                name: newStudentData.name,
                numeroChamada: teacherStudents.length + 1,
                sala: newStudentData.sala || 'Sala 04',
                turma: newStudentData.turma || 'Turma 1',
                periodo: newStudentData.periodo || 'Manhã',
                classe: newStudentData.classe || '4ª Classe',
                genero: newStudentData.genero,
                idade: newStudentData.idade,
                dataNascimento: newStudentData.dataNascimento,
                condicaoMatricula: newStudentData.condicaoMatricula,
                foto: newStudentData.foto,
                tipoDocumento: newStudentData.tipoDocumento,
                numeroDocumento: newStudentData.numeroDocumento,
                anexoDocumentoNome: newStudentData.anexoDocumentoNome,
                temDocumentos: hasDocs,
                nomePai: newStudentData.nomePai,
                nomeMae: newStudentData.nomeMae,
                encarregado: newStudentData.encarregado,
                parentescoEncarregado: newStudentData.parentescoEncarregado,
                telefone: newStudentData.telefone,
                telefoneAlternativo: newStudentData.telefoneAlternativo,
                endereco: newStudentData.endereco,
                observacoes: newStudentData.observacoes,
                presencaPercent: 100,
                faltas: 0,
                disciplinas: defaultDisciplinasList,
                grades: defaultDisciplinasList.map((disc) => ({
                  subject: disc,
                  p1: 16,
                  p2: 17,
                  trabalho: 16,
                  media: 16.3,
                  status: 'Aprovado' as const,
                })),
              };
              setTeacherStudents((prev) => [newStudent, ...prev]);
              showToast(`Aluno(a) ${newStudent.name} matriculado(a) com sucesso!`);
            }}
            students={teacherStudents}
          />
        </div>
      );
    }
    if (currentView === 'professor-presenca') {
      return (
        <div className="w-full">
          <Hero
            onOpenGetStarted={() => handleOpenAuth('login')}
            customTitle="Presença dos Alunos"
            isLoggedIn={isSessionStarted}
          />
          <TeacherAttendancePage
            onBackToClass={() => {
              setCurrentView('professor-turma');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToStudent={(studentId) => {
              if (studentId) {
                const found = teacherStudents.find((s) => s.id === studentId);
                if (found) setSelectedStudent(found);
              }
              setCurrentView('aluno-perfil');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            students={teacherStudents}
            teacherName={teacherProfile.name}
            turmaName={teacherProfile.turma}
          />
        </div>
      );
    }
    if (currentView === 'professor-perfil') {
      return (
        <div className="w-full">
          <Hero
            onOpenGetStarted={() => handleOpenAuth('login')}
            customTitle="Perfil do Professor"
            isLoggedIn={isSessionStarted}
          />
          <TeacherProfilePage
            onBackToStats={() => {
              setCurrentView('professor-estatisticas');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToClass={() => {
              setCurrentView('professor-turma');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            teacher={teacherProfile}
            students={teacherStudents}
          />
        </div>
      );
    }
    if (currentView === 'aluno-perfil') {
      return (
        <div className="w-full">
          <Hero
            onOpenGetStarted={() => handleOpenAuth('login')}
            customTitle="Perfil do Aluno"
            isLoggedIn={isSessionStarted}
          />
          <StudentProfilePage
            student={selectedStudent}
            allStudents={teacherStudents}
            onBack={() => {
              setCurrentView('professor-turma');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectAnotherStudent={(st) => {
              setSelectedStudent(st);
            }}
            onSaveStudent={(updated) => {
              setTeacherStudents((prev) =>
                prev.map((s) => (s.id === updated.id ? updated : s))
              );
              setSelectedStudent(updated);
              showToast(`Ficha de ${updated.name} atualizada com sucesso!`);
            }}
          />
        </div>
      );
    }

    // Default: Dashboard / Home View matching 4.png for Director or 8.png / 6.png
    return (
      <>
        {/* Hero Section with Dynamic Greeting for the Active Session */}
        <Hero
          onOpenGetStarted={() => handleOpenAuth('login')}
          greeting={isSessionStarted ? activeSession.greeting : undefined}
          isLoggedIn={isSessionStarted}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full bg-[#f7f3f3] relative">
          {/* Dynamic Stat Cards Grid with distinct clickable vs non-clickable designs */}
          <StatCards
            session={activeSession}
            onSelectCard={(card) => {
              if (card.isClickable === false) {
                return;
              }
              if (activeRole === 'admin') {
                if (card.id.includes('escola') || card.title.toLowerCase().includes('escola')) {
                  if (card.title.toLowerCase().includes('desempenho')) {
                    setCurrentView('admin-estatisticas');
                  } else {
                    setCurrentView('admin-escolas');
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  return;
                }
                if (card.id.includes('professor') || card.title.toLowerCase().includes('professor')) {
                  setCurrentView('admin-professores');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  return;
                }
                if (card.id.includes('aluno') || card.title.toLowerCase().includes('aluno')) {
                  setCurrentView('admin-alunos');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  return;
                }
              }
              if (activeRole === 'diretor') {
                if (card.id.includes('1') || card.title.toLowerCase().includes('salas')) {
                  setCurrentView('diretor-salas');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  return;
                }
                if (card.id.includes('2') || card.title.toLowerCase().includes('professores')) {
                  setCurrentView('diretor-professores');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  return;
                }
                if (card.id.includes('3') || card.title.toLowerCase().includes('alunos')) {
                  setCurrentView('diretor-alunos');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  return;
                }
                if (card.id.includes('4') || card.title.toLowerCase().includes('desempenho')) {
                  setCurrentView('diretor-estatisticas');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  return;
                }
              }
              if (activeRole === 'professor') {
                if (card.id.includes('turma') || card.title.toLowerCase().includes('turma')) {
                  setCurrentView('professor-turma');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  return;
                }
                if (card.id.includes('classe') || card.title.toLowerCase().includes('classe')) {
                  setCurrentView('professor-turma');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  return;
                }
                if (card.id.includes('aluno') || card.title.toLowerCase().includes('aluno')) {
                  if (card.title.toLowerCase().includes('desempenho')) {
                    setCurrentView('professor-estatisticas');
                  } else {
                    setCurrentView('professor-turma');
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  return;
                }
                if (card.id.includes('desempenho') || card.title.toLowerCase().includes('desempenho') || card.title.toLowerCase().includes('estatística')) {
                  setCurrentView('professor-estatisticas');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  return;
                }
                if (card.id.includes('horario') || card.title.toLowerCase().includes('horário') || card.title.toLowerCase().includes('perfil')) {
                  setCurrentView('professor-perfil');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  return;
                }
              }
              setSelectedCard(card);
            }}
            onOpenSettings={() => setSettingsModalOpen(true)}
            isLoggedIn={isSessionStarted}
            onChangeRole={(role) => {
              setActiveRole(role);
              setCurrentView('home');
              showToast(`Alternado para sessão: ${role.toUpperCase()}`);
            }}
          />

          {/* Seção Principal: Assistente Inteligente IA & Central com AIInputWithLoading */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-12">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-[0_10px_35px_rgba(0,0,0,0.04)] text-center relative overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#002133] text-white text-xs font-bold mb-3 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#f75142] animate-pulse" />
                <span>Assistente de Gestão Escolar Inteligente (IA)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Central de Pareceres & Análises Rápidas
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mb-6">
                Utilize o novo componente com suporte a auto-redimensionamento e digitação inteligente para consultar dados ou registar despachos:
              </p>

              <div className="w-full flex justify-center">
                <AIInputWithLoading
                  placeholder="Pergunte sobre presenças docentes, turmas ou digite uma ocorrência..."
                  onSubmit={handleHomeAICommand}
                />
              </div>

              {/* Sugestões de cliques rápidos */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('diretor-presenca');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 transition-colors cursor-pointer"
                >
                  📅 Abrir Livro de Ponto (Calendário)
                </button>
                <button
                  type="button"
                  onClick={() => handleHomeAICommand('Resumo de presenças dos professores')}
                  className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 transition-colors cursor-pointer"
                >
                  📊 Resumo de Presenças Docentes
                </button>
                <button
                  type="button"
                  onClick={() => handleHomeAICommand('Panorama de turmas e alunos')}
                  className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 transition-colors cursor-pointer"
                >
                  🎓 Panorama Geral de Alunos
                </button>
              </div>

              {homeAIResponse && (
                <div className="mt-6 text-left p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Resposta do Assistente uCore:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {homeAIResponse}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Optional Academic Modules Section */}
          <CyanCardsSection onSelectModule={(module) => setSelectedModule(module)} />
        </main>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f3f3] text-[#002133] flex flex-col font-sans selection:bg-[#f75142] selection:text-white relative">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#002133]/95 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.25)] border border-white/20 text-xs font-bold tracking-wide animate-in fade-in slide-in-from-top-4 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#f75142] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Persistent Floating Navbar across all views */}
      <Navbar
        onOpenGetStarted={() => handleOpenAuth('login')}
        onNavigateToLogin={() => handleOpenAuth('login')}
        onNavigateToRegister={() => handleOpenAuth('register')}
        onNavigateToHome={() => {
          setCurrentPage('home');
          setCurrentView('home');
        }}
        currentPage={currentPage}
        isAuthLoading={isAuthLoading}
        authLoadingAction={authLoadingAction}
        onOpenAbout={() => setInfoModalType('about')}
        onOpenProfile={() => {
          setCurrentPage('home');
          if (activeRole === 'admin') {
            setCurrentView('admin-perfil');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (activeRole === 'diretor') {
            setCurrentView('diretor-perfil');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setInfoModalType('profile');
          }
        }}
        onOpenSupport={() => setInfoModalType('support')}
        onOpenChat={() => setIsChatOpen(true)}
        unreadChatCount={unreadChatCount}
        onSelectPage={handleSelectPage}
        currentUser={currentUser}
        onLogout={handleLogout}
        activeRole={activeRole}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* Main Routed View */}
      {renderCurrentView()}

      {/* School Team Showcase (Professores Cadastrados no Sistema) before Footer */}
      <SchoolTeamSection
        members={schoolMembers}
        title="Professores Cadastrados no Sistema"
        subtitle="Corpo docente oficial registado na rede escolar do município de Quêssua."
      />

      {/* Organic Cloud Wave Footer */}
      <CloudFooter
        onOpenAbout={() => setInfoModalType('about')}
        onOpenTerms={() => setInfoModalType('terms')}
        onOpenSupport={() => setInfoModalType('support')}
      />

      {/* Floating Support Chat Button */}
      <FloatingChatButton
        onClick={() => setIsChatOpen(true)}
        unreadCount={unreadChatCount}
      />

      {/* Card Detail Modal */}
      <StatDetailModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        roleTitle={activeSession.title}
      />

      {/* Session Settings Modal */}
      <SessionSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        session={activeSession}
        onSaveSettings={handleSaveSettings}
      />

      {/* Module Detail Modal */}
      <ModuleDetailModal
        module={selectedModule}
        onClose={() => setSelectedModule(null)}
        onOpenGetStarted={() => handleOpenAuth('login')}
        isLoggedIn={isSessionStarted}
      />

      {/* Admin Registration Modal */}
      <AdminRegistrationModal
        type={adminModalType}
        isOpen={adminModalType !== null}
        onClose={() => setAdminModalType(null)}
        onAddSchool={(newSchool) => {
          setAdminSchools((prev) => [newSchool, ...prev]);
          showToast(`Escola "${newSchool.name}" cadastrada na rede com sucesso!`);
        }}
        onAddTeacher={(newTeacher) => {
          setAdminTeachers((prev) => [newTeacher, ...prev]);
          showToast(`Docente "${newTeacher.name}" registrado com sucesso!`);
        }}
        onAddStudent={(newStudent) => {
          setAdminStudents((prev) => [newStudent, ...prev]);
          showToast(`Aluno(a) "${newStudent.name}" cadastrado(a) com sucesso!`);
        }}
        onAddDirector={(newDirector) => {
          setAdminDirectors((prev) => [newDirector, ...prev]);
          showToast(`Diretor(a) "${newDirector.name}" homologado(a) com sucesso!`);
        }}
        availableSchools={adminSchools.map((s) => s.name)}
        schools={adminSchools}
      />

      {/* Info Modal (About, Support, Terms, Profile) */}
      <InfoModal
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenGetStarted={() => handleOpenAuth('login')}
        onOpenChat={() => {
          setInfoModalType(null);
          setIsChatOpen(true);
        }}
      />

      {/* Excel Export Modal for Admin */}
      <ExcelExportModal
        isOpen={isExcelExportModalOpen}
        onClose={() => setIsExcelExportModalOpen(false)}
        schools={adminSchools}
        teachers={adminTeachers}
        directors={adminDirectors}
        students={adminStudents}
      />

      {/* Live Support & Assistance Chat Modal */}
      <SupportChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUser={currentUser}
        activeRole={activeRole}
        channels={chatChannels}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
