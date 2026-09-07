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

// Admin Pages & Components
import { AdminStatisticsPage } from './components/pages/admin/AdminStatisticsPage';
import { AdminSchoolsPage } from './components/pages/admin/AdminSchoolsPage';
import { AdminTeachersPage } from './components/pages/admin/AdminTeachersPage';
import { AdminStudentsPage } from './components/pages/admin/AdminStudentsPage';
import { AdminDirectorsPage } from './components/pages/admin/AdminDirectorsPage';
import { AdminProfilePage } from './components/pages/admin/AdminProfilePage';
import { AdminRegistrationModal, AdminModalType } from './components/pages/admin/AdminRegistrationModal';
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

  // Persist admin schools on change
  useEffect(() => {
    try {
      localStorage.setItem('ucore_admin_schools', JSON.stringify(adminSchools));
    } catch {
      // ignore
    }
  }, [adminSchools]);

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
          admin: { ...sessionsData.admin, ...parsed.admin },
          diretor: { ...sessionsData.diretor, ...parsed.diretor },
          professor: { ...sessionsData.professor, ...parsed.professor },
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
      pageId === 'admin-perfil'
    ) {
      setCurrentView(pageId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (activeRole === 'admin') {
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
      pageId === 'diretor-perfil'
    ) {
      setCurrentView(pageId);
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
            showToast(`Brasão da escola "${updated.name}" atualizado com sucesso!`);
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
        />
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
      />

      {/* Main Routed View */}
      {renderCurrentView()}

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
