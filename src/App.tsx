"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { initTheme } from './utils/themeService';

// Director Pages
import { DirectorStatisticsPage } from './components/pages/director/DirectorStatisticsPage';
import { DirectorTeachersPage } from './components/pages/director/DirectorTeachersPage';
import { DirectorStudentsPage } from './components/pages/director/DirectorStudentsPage';
import { DirectorRoomsPage } from './components/pages/director/DirectorRoomsPage';
import { DirectorClassesPage } from './components/pages/director/DirectorClassesPage';
import { DirectorProfilePage } from './components/pages/director/DirectorProfilePage';
import { DirectorAttendancePage } from './components/pages/director/DirectorAttendancePage';
import { DirectorApprovalsPage } from './components/pages/director/DirectorApprovalsPage';

// Admin Pages & Components
import { AdminStatisticsPage } from './components/pages/admin/AdminStatisticsPage';
import { AdminSchoolsPage } from './components/pages/admin/AdminSchoolsPage';
import { AdminTeachersPage } from './components/pages/admin/AdminTeachersPage';
import { AdminStudentsPage } from './components/pages/admin/AdminStudentsPage';
import { AdminDirectorsPage } from './components/pages/admin/AdminDirectorsPage';
import { AdminProfilePage } from './components/pages/admin/AdminProfilePage';
import { AdminAnnouncementsPage } from './components/pages/admin/AdminAnnouncementsPage';
import { AdminApprovalsPage } from './components/pages/admin/AdminApprovalsPage';
import { AdminRegistrationModal, AdminModalType } from './components/pages/admin/AdminRegistrationModal';
import { AdminAuditLogsModal } from './components/pages/admin/AdminAuditLogsModal';
import { ExcelExportModal } from './components/modals/ExcelExportModal';
import { GoogleSheetsModal } from './components/modals/GoogleSheetsModal';
import { 
  initialAdminSchools, 
  initialAdminTeachers, 
  initialAdminStudents, 
  initialAdminDirectors 
} from './data/adminData';
import {
  purgeModeloCentralData,
  deleteSchoolAndRelatedData,
  isModeloCentralSchool,
  saveRegisteredSchool,
  syncSchoolsFromServer,
} from './utils/schoolStorage';

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
import { PublicLandingPage } from './components/pages/PublicLandingPage';
import { PendingApprovalPage } from './components/pages/PendingApprovalPage';
import { DemoRequestModal } from './components/modals/DemoRequestModal';
import { AccessDeniedGuard } from './components/common/AccessDeniedGuard';
import { canUserAccessView, getOwnProfileViewForUser } from './utils/authGuard';

// Cookie Consent & Legal Pages
import { CookieConsentBanner } from './components/cookies/CookieConsentBanner';
import { AboutPlatformPage } from './components/pages/legal/AboutPlatformPage';
import { TermsOfUsePage } from './components/pages/legal/TermsOfUsePage';
import { PrivacyPolicyPage } from './components/pages/legal/PrivacyPolicyPage';
import { SecurityDataProtectionPage } from './components/pages/legal/SecurityDataProtectionPage';

// Real-Time Meetings & Video Calls (Zoom-style)
import { ZoomMeetingModal } from './components/meetings/ZoomMeetingModal';
import { MeetingsHubPage } from './components/pages/MeetingsHubPage';

// Intelligent RAG Vector Engine & Academic Opinions
import { RagIntelligenceModal } from './components/rag/RagIntelligenceModal';
import { Sparkles, X } from 'lucide-react';

// Public Institutional Pages: 404, Thank You, and Cases of Success
import { NotFoundPage } from './components/pages/NotFoundPage';
import { ThankYouPage } from './components/pages/ThankYouPage';
import { CasesPage } from './components/pages/CasesPage';

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
      const saved = localStorage.getItem('ucore_current_view');
      if (saved === 'ucore-home' || saved === 'ucore-parallax') {
        return 'home';
      }
      return saved || 'home';
    } catch {
      return 'home';
    }
  });
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SessionCard | null>(null);
  const [selectedModule, setSelectedModule] = useState<EducationalModule | null>(null);
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [thankYouConfig, setThankYouConfig] = useState<{
    type?: 'enrollment' | 'school-registration' | 'contact' | 'support' | 'general';
    title?: string;
    subtitle?: string;
    referenceCode?: string;
    recipientName?: string;
    userEmail?: string;
    schoolName?: string;
  }>({
    type: 'general',
    title: 'Ação Concluída com Sucesso!',
    subtitle: 'A sua solicitação foi recebida e registada na plataforma Sigre.',
  });

  // Ensure clean slate on first load so no pre-inserted or cached mock data exists
  if (typeof window !== 'undefined' && localStorage.getItem('sigre_clean_slate_active_v3') !== 'true') {
    try {
      const keysToClean = [
        'ucore_admin_schools',
        'ucore_admin_teachers',
        'ucore_admin_students',
        'ucore_admin_directors',
        'ucore_teacher_students',
        'ucore_teacher_profile',
        'ucore_attendance_records',
        'ucore_attendance_sessions',
        'ucore_student_attendance_records_v2',
        'ucore_teacher_attendance_records_v2',
        'ucore_registered_teachers_v2',
        'ucore_registered_students_v2',
        'ucore_registered_directors_v2',
        'ucore_school_announcements_v1',
        'ucore_pending_applications',
        'ucore_audit_logs_v1',
        'ucore_attendance_diary_notes',
        'ucore_dme_staff_members',
        'ucore_director_profile',
        'ucore_chat_channels',
        'ucore_chat_messages',
        'sigre_school_registrations',
        'sigre_director_rooms',
        'sigre_director_classes',
      ];
      keysToClean.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('sigre_clean_slate_active_v3', 'true');
    } catch {
      // ignore
    }
  }

  // Purge any "Escola Modelo Central" and related records immediately on startup
  if (typeof window !== 'undefined') {
    purgeModeloCentralData();
  }

  // Admin dynamic state
  const [adminSchools, setAdminSchools] = useState<AdminSchool[]>(() => {
    try {
      const saved = localStorage.getItem('ucore_admin_schools');
      const list: AdminSchool[] = saved ? JSON.parse(saved) : initialAdminSchools;
      return Array.isArray(list) ? list.filter((s) => !isModeloCentralSchool(s.name)) : [];
    } catch {
      return initialAdminSchools;
    }
  });

  const [adminTeachers, setAdminTeachers] = useState<AdminTeacher[]>(() => {
    try {
      const saved = localStorage.getItem('ucore_admin_teachers');
      const list: AdminTeacher[] = saved ? JSON.parse(saved) : initialAdminTeachers;
      return Array.isArray(list) ? list.filter((t) => !isModeloCentralSchool(t.schoolName)) : [];
    } catch {
      return initialAdminTeachers;
    }
  });

  const [adminStudents, setAdminStudents] = useState<AdminStudent[]>(() => {
    try {
      const saved = localStorage.getItem('ucore_admin_students');
      const list: AdminStudent[] = saved ? JSON.parse(saved) : initialAdminStudents;
      return Array.isArray(list) ? list.filter((st) => !isModeloCentralSchool(st.schoolName)) : [];
    } catch {
      return initialAdminStudents;
    }
  });

  const [adminDirectors, setAdminDirectors] = useState<AdminDirector[]>(() => {
    try {
      const saved = localStorage.getItem('ucore_admin_directors');
      const list: AdminDirector[] = saved ? JSON.parse(saved) : initialAdminDirectors;
      return Array.isArray(list) ? list.filter((d) => !isModeloCentralSchool(d.schoolName)) : [];
    } catch {
      return initialAdminDirectors;
    }
  });

  const [adminModalType, setAdminModalType] = useState<AdminModalType>(null);
  const [isExcelExportModalOpen, setIsExcelExportModalOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [isAuditLogsModalOpen, setIsAuditLogsModalOpen] = useState(false);
  const [isRagModalOpen, setIsRagModalOpen] = useState(false);
  const [ragInitialQuery, setRagInitialQuery] = useState('');
  const [homeAIResponse, setHomeAIResponse] = useState<string | null>(null);

  const handleHomeAICommand = (prompt: string) => {
    if (!prompt.trim()) return;
    const p = prompt.toLowerCase();
    if (p.includes('ponto') || p.includes('presen') || p.includes('falta') || p.includes('docente') || p.includes('professor')) {
      setHomeAIResponse(
        `📊 Análise de Presenças (Livro de Ponto Docente):\n• Total de Professores Cadastrados: ${adminTeachers.length} docentes.\n• Presentes: 0 docentes.\n• Falta Justificada: 0 docentes.\n• O sistema está pronto para registo de novos docentes.`
      );
    } else if (p.includes('turma') || p.includes('aluno') || p.includes('sala')) {
      setHomeAIResponse(
        `🎓 Panorama Discente & Turmas:\n• ${adminStudents.length} alunos cadastrados em ${adminSchools.length} escolas ativas.\n• Sem pendências ou registros arquivados no momento.`
      );
    } else {
      setHomeAIResponse(
        `✨ Parecer Institucional Inteligente Sigre:\nRecebido: "${prompt}".\nA plataforma municipal da Educação de Quêssua está inicializada e pronta para novos cadastros no ano lectivo 2026/2027.`
      );
    }
  };

  // Initialize theme mode and sync network schools/data from server
  useEffect(() => {
    initTheme();
    syncSchoolsFromServer().catch(() => {
      // ignore offline
    });
  }, []);

  // Persist admin entities on change and sync to backend network store
  useEffect(() => {
    try {
      localStorage.setItem('ucore_admin_schools', JSON.stringify(adminSchools));
      fetch('/api/network/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schools: adminSchools }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, [adminSchools]);

  useEffect(() => {
    try {
      localStorage.setItem('ucore_admin_teachers', JSON.stringify(adminTeachers));
      fetch('/api/network/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teachers: adminTeachers }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, [adminTeachers]);

  useEffect(() => {
    try {
      localStorage.setItem('ucore_admin_directors', JSON.stringify(adminDirectors));
      fetch('/api/network/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directors: adminDirectors }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, [adminDirectors]);

  useEffect(() => {
    try {
      localStorage.setItem('ucore_admin_students', JSON.stringify(adminStudents));
      fetch('/api/network/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: adminStudents }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, [adminStudents]);

  // Listen for sigre-data-synced and ucore-teachers-updated events so adminStudents, adminTeachers, adminSchools, and teacherStudents stay in real-time sync
  useEffect(() => {
    const handleSync = () => {
      try {
        const savedStudents = localStorage.getItem('ucore_admin_students');
        if (savedStudents) {
          setAdminStudents(JSON.parse(savedStudents));
        }
        const savedTeachers = localStorage.getItem('ucore_admin_teachers');
        if (savedTeachers) {
          setAdminTeachers(JSON.parse(savedTeachers));
        }
        const savedSchools = localStorage.getItem('ucore_admin_schools');
        if (savedSchools) {
          setAdminSchools(JSON.parse(savedSchools));
        }
        const savedDirectors = localStorage.getItem('ucore_admin_directors');
        if (savedDirectors) {
          setAdminDirectors(JSON.parse(savedDirectors));
        }
        const savedTeacherStudents = localStorage.getItem('ucore_teacher_students');
        if (savedTeacherStudents) {
          setTeacherStudents(JSON.parse(savedTeacherStudents));
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('sigre-data-synced', handleSync);
    window.addEventListener('ucore-teachers-updated', handleSync);
    return () => {
      window.removeEventListener('sigre-data-synced', handleSync);
      window.removeEventListener('ucore-teachers-updated', handleSync);
    };
  }, []);

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

  // User persistence (starts on pre-session landing page unless active session exists)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const isSessionActive = sessionStorage.getItem('ucore_session_active') === 'true';
      if (!isSessionActive) {
        return null;
      }
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

  // Profile view states for direct navigation to general vs settings/password zone
  const [profileInitialTab, setProfileInitialTab] = useState<'visao-geral' | 'configuracoes'>('visao-geral');
  const [profileFocusZone, setProfileFocusZone] = useState(false);
  const [settingsTriggerCount, setSettingsTriggerCount] = useState(0);

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

  // Real-Time Zoom-style Video Meeting State
  const [activeMeeting, setActiveMeeting] = useState<{
    isOpen: boolean;
    roomId: string;
    roomTitle: string;
    initialVideo: boolean;
    initialAudio: boolean;
  }>({
    isOpen: false,
    roomId: '',
    roomTitle: '',
    initialVideo: true,
    initialAudio: true,
  });

  const handleOpenMeeting = (roomId: string, roomTitle?: string, initialVideo = true, initialAudio = true) => {
    setActiveMeeting({
      isOpen: true,
      roomId,
      roomTitle: roomTitle || `Reunião ${roomId.toUpperCase()}`,
      initialVideo,
      initialAudio,
    });
  };

  const handleCloseMeeting = () => {
    setActiveMeeting((prev) => ({ ...prev, isOpen: false }));
  };

  // Check URL query parameters for direct meeting joins (?meet=id or ?room=id) and direct routing
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const meetCode = params.get('meet') || params.get('room') || params.get('sala');
      if (meetCode) {
        const cleanCode = meetCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (cleanCode) {
          handleOpenMeeting(cleanCode, `Reunião ${cleanCode.toUpperCase()}`, true);
        }
      }

      const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      const pageParam = (params.get('view') || params.get('page') || path).toLowerCase();

      if (pageParam === 'cases' || pageParam === 'casos' || pageParam === 'casos-de-sucesso') {
        setCurrentView('cases');
      } else if (pageParam === 'obrigado' || pageParam === 'thank-you' || pageParam === 'agradecimento') {
        setCurrentView('obrigado');
      } else if (pageParam === '404' || pageParam === 'not-found') {
        setCurrentView('404');
      }
    } catch {
      // ignore
    }
  }, []);
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
        : 0;

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
            return { ...c, value: teacherStudents.length > 0 ? '1' : '0' };
          }
          if (c.title.toLowerCase().includes('aluno') || c.id.includes('aluno')) {
            return { ...c, value: String(teacherStudents.length) };
          }
          if (c.title.toLowerCase().includes('desempenho') || c.title.toLowerCase().includes('estatística')) {
            return { ...c, value: teacherStudents.length > 0 ? '88%' : '0%' };
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

  const toastTimerRef = useRef<any>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3500);
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
    try {
      sessionStorage.setItem('ucore_session_active', 'true');
      if (user.rememberMe) {
        localStorage.setItem('ucore_active_user', JSON.stringify(user));
      }
    } catch {
      // ignore
    }
    setCurrentUser(user);
    if (user.role === 'admin' || user.role === 'diretor' || user.role === 'professor') {
      setActiveRole(user.role);
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
      sessionStorage.removeItem('ucore_session_active');
      localStorage.removeItem('ucore_active_user');
    } catch {
      // ignore
    }
    showToast('Sessão encerrada com sucesso.');
  };

  const handleDirectDemoLogin = (role: 'admin' | 'diretor' | 'professor' = 'diretor') => {
    let demoUser: UserAccount;
    if (role === 'admin') {
      demoUser = {
        id: 'usr-dir-municipal-quessua',
        firstName: 'Director Municipal',
        lastName: 'da Educação',
        email: 'dmedoquessua@gmail.com',
        role: 'admin',
        scope: 'administracao',
        adminRole: 'diretor_municipal',
        cargoTitle: 'Director Municipal da Educação de Quessua',
        schoolName: 'Direcção Municipal da Educação de Quessua',
        municipalityOrDepartment: 'Quessua',
        titlePrefix: 'Dr.',
        greeting: 'Olá Dr. Director Municipal',
        rememberMe: true,
      };
    } else if (role === 'professor') {
      demoUser = {
        id: 'user-docente',
        firstName: 'Professor(a)',
        lastName: 'Docente',
        email: 'professor@sigre.edu.ao',
        role: 'professor',
        scope: 'escola',
        cargoTitle: 'Professor(a) Titular',
        greeting: 'Olá Professor(a)',
        rememberMe: true,
      };
    } else {
      demoUser = {
        id: 'user-diretor-escola',
        firstName: 'Diretor(a)',
        lastName: 'Geral',
        email: 'diretor@sigre.edu.ao',
        role: 'diretor',
        scope: 'escola',
        cargoTitle: 'Diretor(a) Geral da Escola',
        greeting: 'Olá Diretor(a)',
        rememberMe: true,
      };
    }
    handleLoginSuccess(demoUser);
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

    // Public Legal & Institutional Pages
    if (
      pageId === 'reunioes' ||
      pageId === 'reunioes-salas' ||
      pageId === 'zoom' ||
      pageId === 'meet'
    ) {
      setCurrentView('reunioes');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (
      pageId === 'sobre' ||
      pageId === 'about' ||
      pageId === 'termos' ||
      pageId === 'terms' ||
      pageId === 'privacidade' ||
      pageId === 'privacy' ||
      pageId === 'seguranca' ||
      pageId === 'security'
    ) {
      const normalizedView =
        pageId === 'about'
          ? 'sobre'
          : pageId === 'terms'
          ? 'termos'
          : pageId === 'privacy'
          ? 'privacidade'
          : pageId === 'security'
          ? 'seguranca'
          : pageId;
      setCurrentView(normalizedView);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Success Cases, Thank You & 404 Pages
    if (
      pageId === 'cases' ||
      pageId === 'casos' ||
      pageId === 'casos-de-sucesso' ||
      pageId === 'sucesso'
    ) {
      setCurrentView('cases');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (
      pageId === 'obrigado' ||
      pageId === 'thank-you' ||
      pageId === 'agradecimento' ||
      pageId === 'confirmacao'
    ) {
      setCurrentView('obrigado');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (pageId === '404' || pageId === 'not-found' || pageId === 'erro-404') {
      setCurrentView('404');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (pageId === 'rag' || pageId === 'rag-inteligente' || pageId === 'pareceres') {
      setRagInitialQuery('');
      setIsRagModalOpen(true);
      return;
    }

    // 1. Strict Authorization Guard: A user can never and must never enter or tamper with someone else's profile
    if (currentUser) {
      let targetView = pageId;
      if (pageId === 'perfil-professor' || pageId === 'perfil') targetView = 'professor-perfil';
      if (pageId === 'perfil-aluno') targetView = 'aluno-perfil';
      if (pageId === 'minha-turma' || pageId === 'turma' || pageId === 'turmas' || (activeRole === 'professor' && pageId === 'alunos')) {
        targetView = 'professor-turma';
      }
      if (activeRole === 'professor' && (pageId === 'chamada' || pageId === 'presenca' || pageId === 'presenca-alunos')) {
        targetView = 'professor-presenca';
      }
      if (activeRole === 'professor' && pageId === 'estatisticas') {
        targetView = 'professor-estatisticas';
      }

      const accessCheck = canUserAccessView(currentUser, targetView);
      if (!accessCheck.allowed) {
        showToast(
          accessCheck.reason ||
            'Acesso negado: Política de segurança Sigre proíbe entrar ou alterar o perfil de outros utilizadores.'
        );
        return;
      }
    }

    // Admin Views Routing
    if (
      pageId === 'admin-estatisticas' ||
      pageId === 'admin-escolas' ||
      pageId === 'admin-directores' ||
      pageId === 'admin-professores' ||
      pageId === 'admin-alunos' ||
      pageId === 'admin-anuncios' ||
      pageId === 'admin-aprovacoes' ||
      pageId === 'admin-inscricoes' ||
      pageId === 'admin-perfil'
    ) {
      setCurrentView(pageId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (activeRole === 'admin') {
      if (pageId === 'aprovacoes' || pageId === 'inscricoes' || pageId === 'homologacao' || pageId === 'homologacoes') {
        setCurrentView('admin-aprovacoes');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
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
      pageId === 'diretor-aprovacoes' ||
      pageId === 'diretor-inscricoes' ||
      pageId === 'diretor-perfil' ||
      pageId === 'diretor-presenca'
    ) {
      setCurrentView(pageId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (activeRole === 'diretor' && (pageId === 'aprovacoes' || pageId === 'inscricoes' || pageId === 'homologacao' || pageId === 'homologacoes')) {
      setCurrentView('diretor-aprovacoes');
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
    if (pageId === 'minha-turma' || pageId === 'turma' || pageId === 'turmas' || pageId === 'professor-turma') {
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
          schools={adminSchools}
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

    // 0.1 Public Pre-contact / Pre-session Landing Page
    // "antes do usario entrar contacto com o nosso sistema devemos exibir uma pagina, assim que ele iniciar a sessão poderá ver"
    if (!currentUser) {
      const isPublicView =
        currentView === 'sobre' ||
        currentView === 'termos' ||
        currentView === 'privacidade' ||
        currentView === 'seguranca' ||
        currentView === 'reunioes' ||
        currentView === 'reunioes-salas' ||
        currentView === 'cases' ||
        currentView === 'casos' ||
        currentView === 'casos-de-sucesso' ||
        currentView === 'obrigado' ||
        currentView === 'thank-you' ||
        currentView === 'agradecimento' ||
        currentView === '404' ||
        currentView === 'not-found';

      if (!isPublicView) {
        return (
          <PublicLandingPage
            onAcessarPlataforma={() => handleOpenAuth('login')}
            onOpenDemoModal={() => setIsDemoModalOpen(true)}
            onDirectLogin={(role) => handleDirectDemoLogin(role)}
            onOpenAbout={() => setInfoModalType('about')}
            onOpenSupport={() => setInfoModalType('support')}
          />
        );
      }
    }

    // 0.2 Pending Approval Waiting Screen
    // "se um diretor de escola criar a conta dele , vai ficar pendente em uma tela de espera até o admin autorizar, se for o professor o director é quem deve autorizar"
    if (currentUser?.status === 'pendente') {
      return (
        <PendingApprovalPage
          currentUser={currentUser}
          onLogout={handleLogout}
          onApprovalConfirmed={(updatedUser) => {
            setCurrentUser(updatedUser);
            try {
              localStorage.setItem('ucore_active_user', JSON.stringify(updatedUser));
            } catch {}
            showToast(`Conta ativada com sucesso! Bem-vindo(a) à plataforma Sigre, ${updatedUser.firstName}.`);
          }}
          showToast={showToast}
          onOpenSupport={() => setInfoModalType('support')}
        />
      );
    }

    // 0.3 Strict Privacy & Identity Protection Guard:
    // "um usuario nunca pode e nem deve mexer e nem entrar no perfil dos outros"
    const accessCheck = canUserAccessView(currentUser, currentView);
    if (!accessCheck.allowed) {
      return (
        <AccessDeniedGuard
          currentUser={currentUser}
          attemptedView={currentView}
          reason={accessCheck.reason}
          onNavigateToOwnProfile={() => {
            const ownProfile = getOwnProfileViewForUser(currentUser);
            setCurrentView(ownProfile);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBackToHome={() => {
            setCurrentView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLogout={handleLogout}
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
          onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
          onOpenAuditLogs={() => setIsAuditLogsModalOpen(true)}
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
            saveRegisteredSchool(updated);
            setAdminSchools((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            showToast(`Dados da escola "${updated.name}" atualizados com sucesso!`);
          }}
          onDeleteSchool={(schoolId, schoolName) => {
            const nextSchools = deleteSchoolAndRelatedData(schoolId, schoolName);
            setAdminSchools(nextSchools);
            showToast(`Escola "${schoolName}" e todos os dados relacionados foram apagados com sucesso!`);
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
          onNavigateToApprovals={() => {
            setCurrentView('admin-aprovacoes');
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
          onSwitchToDirectorStudents={(_schoolId, schoolName) => {
            setActiveRole('diretor');
            setCurrentView('diretor-alunos');
            if (schoolName) {
              showToast(`Alternado para a Direção da escola "${schoolName}" para cadastro de alunos.`);
            } else {
              showToast('Alternado para o Painel do Director de Escola (Cadastro de Alunos).');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
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
          currentUser={currentUser}
          onNavigateToOwnProfile={() => {
            const own = getOwnProfileViewForUser(currentUser);
            setCurrentView(own);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBackToHome={() => {
            setCurrentView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLogout={handleLogout}
          onOpenSettings={() => {
            setProfileFocusZone(true);
            setSettingsTriggerCount((c) => c + 1);
          }}
          onOpenExcelExport={() => setIsExcelExportModalOpen(true)}
          focusZone={profileFocusZone}
          settingsTrigger={settingsTriggerCount}
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
    if (currentView === 'admin-aprovacoes' || currentView === 'admin-inscricoes') {
      return (
        <AdminApprovalsPage
          onOpenGetStarted={() => handleOpenAuth('login')}
          isLoggedIn={isSessionStarted}
          adminName={currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}` : 'Administrador Municipal Sigre'}
          directors={adminDirectors}
          schools={adminSchools}
          onAddDirectorGlobal={(director) => {
            setAdminDirectors((prev) => [director, ...prev]);
            if (director.schoolName) {
              const normTarget = director.schoolName.trim().toLowerCase();
              setAdminSchools((prev) =>
                prev.map((sc) => {
                  const scNorm = sc.name.trim().toLowerCase();
                  if (scNorm === normTarget || scNorm.includes(normTarget) || normTarget.includes(scNorm)) {
                    return { ...sc, directorName: director.name };
                  }
                  return sc;
                })
              );
            }
            showToast(`Diretor(a) "${director.name}" homologado(a) no Sigre!`);
          }}
          showToast={showToast}
        />
      );
    }

    // 1. Director Pages
    if (currentView === 'diretor-aprovacoes' || currentView === 'diretor-inscricoes') {
      return (
        <DirectorApprovalsPage
          onOpenGetStarted={() => handleOpenAuth('login')}
          isLoggedIn={isSessionStarted}
          directorName={currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}` : 'Fert Horlan (Diretor Geral)'}
          schoolName={currentUser?.schoolName || adminSchools[0]?.name || ''}
          onAddTeacherGlobal={(teacher) => {
            setAdminTeachers((prev) => [teacher, ...prev]);
            showToast(`Professor(a) "${teacher.name}" integrado(a) no quadro docente!`);
          }}
          onAddStudentGlobal={(student) => {
            setAdminStudents((prev) => [student, ...prev]);
            showToast(`Aluno(a) "${student.name}" matriculado(a) na escola com sucesso!`);
          }}
          showToast={showToast}
        />
      );
    }
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
          onNavigateToApprovals={() => {
            setCurrentView('diretor-aprovacoes');
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
          schools={adminSchools}
          currentUser={currentUser}
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
          currentUser={currentUser}
          onNavigateToOwnProfile={() => {
            const own = getOwnProfileViewForUser(currentUser);
            setCurrentView(own);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBackToHome={() => {
            setCurrentView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLogout={handleLogout}
          onOpenSettings={() => {
            setProfileFocusZone(true);
            setSettingsTriggerCount((c) => c + 1);
          }}
          focusZone={profileFocusZone}
          settingsTrigger={settingsTriggerCount}
        />
      );
    }
    if (currentView === 'diretor-presenca') {
      return (
        <div className="w-full">
          <Hero
            onOpenGetStarted={() => handleOpenAuth('login')}
            customTitle="Livro de Ponto dos Professores"
            customSubtitle="Homologação diária, assiduidade e controle de presenças da equipa docente da escola."
            badge="Direção Escolar"
            breadcrumbs={[
              { label: 'Início', onClick: () => { setCurrentView('home'); setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: 'Professores', onClick: () => { setCurrentView('diretor-professores'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: 'Livro de Ponto' },
            ]}
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
            customSubtitle="Desempenho acadêmico, assiduidade e notas dos alunos da Turma 1 - 4ª Classe."
            badge="Corpo Docente"
            breadcrumbs={[
              { label: 'Início', onClick: () => { setCurrentView('home'); setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: 'Estatísticas' },
            ]}
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
    if (currentView === 'professor-turma' || currentView === 'minha-turma' || currentView === 'turma') {
      return (
        <div className="w-full">
          <Hero
            onOpenGetStarted={() => handleOpenAuth('login')}
            customTitle="Minha Turma"
            customSubtitle="Gestão acadêmica, fichas cadastrais e acompanhamento pedagógico da 4ª Classe."
            badge="Corpo Docente"
            breadcrumbs={[
              { label: 'Início', onClick: () => { setCurrentView('home'); setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: 'Estatísticas', onClick: () => { setCurrentView('professor-estatisticas'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: 'Minha Turma' },
            ]}
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
            customSubtitle="Chamada eletrônica diária com validação biométrica e controle de faltas da turma."
            badge="Corpo Docente"
            breadcrumbs={[
              { label: 'Início', onClick: () => { setCurrentView('home'); setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: 'Minha Turma', onClick: () => { setCurrentView('professor-turma'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: 'Chamada Diária' },
            ]}
            isLoggedIn={isSessionStarted}
            compact={true}
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
            customSubtitle="Identificação profissional, turma atribuída, horário letivo e definições de conta."
            badge="Corpo Docente"
            breadcrumbs={[
              { label: 'Início', onClick: () => { setCurrentView('home'); setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: 'Estatísticas', onClick: () => { setCurrentView('professor-estatisticas'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: 'Perfil do Professor' },
            ]}
            compact={true}
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
            currentUser={currentUser}
            onNavigateToOwnProfile={() => {
              const own = getOwnProfileViewForUser(currentUser);
              setCurrentView(own);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBackToHome={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLogout={handleLogout}
            onUpdateTeacher={(updated) => {
              setTeacherProfile((prev) => ({ ...prev, ...updated }));
            }}
            initialTab={profileInitialTab}
            focusZone={profileFocusZone}
            settingsTrigger={settingsTriggerCount}
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
            customSubtitle="Identificação cadastral, indicadores acadêmicos e pauta curricular."
            compact="ultra"
            badge="Ficha do Aluno"
            breadcrumbs={[
              { label: 'Início', onClick: () => { setCurrentView('home'); setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: 'Minha Turma', onClick: () => { setCurrentView('professor-turma'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: selectedStudent?.name || 'Aluno' },
            ]}
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

    // 3. Real-Time Virtual Meetings & Video Conferences (Zoom Style)
    if (currentView === 'reunioes' || currentView === 'reunioes-salas') {
      return (
        <MeetingsHubPage
          currentUser={currentUser}
          onJoinMeeting={(roomId, title, initialVideo) => {
            handleOpenMeeting(roomId, title, initialVideo);
          }}
        />
      );
    }

    // 4. Dedicated Legal & Institutional Pages
    if (currentView === 'sobre') {
      return (
        <div className="w-full">
          <Hero
            onOpenGetStarted={() => handleOpenAuth('login')}
            customTitle="Sobre a Plataforma Sigre"
            customSubtitle="Inovação e modernização da gestão escolar em Angola, unificando directores, docentes e alunos."
            badge="Institucional"
            breadcrumbs={[
              { label: 'Início', onClick: () => { setCurrentView('home'); setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: 'Sobre a Plataforma' },
            ]}
            isLoggedIn={isSessionStarted}
          />
          <AboutPlatformPage
            onNavigateHome={() => { setCurrentView('home'); setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateTerms={() => { setCurrentView('termos'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigatePrivacy={() => { setCurrentView('privacidade'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateSecurity={() => { setCurrentView('seguranca'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onOpenSupport={() => setInfoModalType('support')}
            onOpenGetStarted={() => handleOpenAuth('login')}
            isLoggedIn={isSessionStarted}
          />
        </div>
      );
    }

    if (currentView === 'termos') {
      return (
        <div className="w-full">
          <Hero
            onOpenGetStarted={() => handleOpenAuth('login')}
            customTitle="Termos de Utilização"
            customSubtitle="Normas legais de uso institucional, sigilo de credenciais e validade do Livro de Ponto eletrónico."
            badge="Regulamentar"
            breadcrumbs={[
              { label: 'Início', onClick: () => { setCurrentView('home'); setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: 'Termos de Utilização' },
            ]}
            isLoggedIn={isSessionStarted}
          />
          <TermsOfUsePage
            onNavigateHome={() => { setCurrentView('home'); setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateAbout={() => { setCurrentView('sobre'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigatePrivacy={() => { setCurrentView('privacidade'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateSecurity={() => { setCurrentView('seguranca'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onOpenSupport={() => setInfoModalType('support')}
          />
        </div>
      );
    }

    if (currentView === 'privacidade') {
      return (
        <div className="w-full">
          <Hero
            onOpenGetStarted={() => handleOpenAuth('login')}
            customTitle="Política de Privacidade"
            customSubtitle="Proteção integral dos dados pessoais e académicos de menores e docentes conforme a Lei 22/11 da APD Angola."
            badge="Privacidade"
            breadcrumbs={[
              { label: 'Início', onClick: () => { setCurrentView('home'); setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: 'Política de Privacidade' },
            ]}
            isLoggedIn={isSessionStarted}
          />
          <PrivacyPolicyPage
            onNavigateHome={() => { setCurrentView('home'); setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateAbout={() => { setCurrentView('sobre'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateTerms={() => { setCurrentView('termos'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateSecurity={() => { setCurrentView('seguranca'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onOpenSupport={() => setInfoModalType('support')}
          />
        </div>
      );
    }

    if (currentView === 'seguranca') {
      return (
        <div className="w-full">
          <Hero
            onOpenGetStarted={() => handleOpenAuth('login')}
            customTitle="Segurança e Proteção de Dados"
            customSubtitle="Criptografia militar AES-256, isolamento de permissões (RBAC) e auditoria digital forense."
            badge="Cibersegurança"
            breadcrumbs={[
              { label: 'Início', onClick: () => { setCurrentView('home'); setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: 'Segurança & Proteção' },
            ]}
            isLoggedIn={isSessionStarted}
          />
          <SecurityDataProtectionPage
            onNavigateHome={() => { setCurrentView('home'); setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateAbout={() => { setCurrentView('sobre'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateTerms={() => { setCurrentView('termos'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigatePrivacy={() => { setCurrentView('privacidade'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onOpenSupport={() => setInfoModalType('support')}
            currentUserRole={currentUser?.role || 'convidado'}
          />
        </div>
      );
    }

    // 5. Success Cases Page (Casos de Sucesso Escolar)
    if (
      currentView === 'cases' ||
      currentView === 'casos' ||
      currentView === 'casos-de-sucesso' ||
      currentView === 'sucesso'
    ) {
      return (
        <CasesPage
          onNavigateHome={() => {
            setCurrentView('home');
            setCurrentPage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateThankYou={(name) => {
            setThankYouConfig({
              type: 'school-registration',
              title: 'Candidatura de Adesão Submetida!',
              subtitle: 'A manifestação de interesse da sua instituição foi acolhida no portal Sigre Angola. Em breve a equipa técnica entrará em contacto.',
              schoolName: name || 'Complexo Escolar Solicitante',
              referenceCode: `CASO-${Math.floor(100000 + Math.random() * 900000)}`,
            });
            setCurrentView('obrigado');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateMeetings={() => {
            setCurrentView('reunioes');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenGetStarted={() => handleOpenAuth('login')}
        />
      );
    }

    // 6. Thank You / Confirmation Page (Página de Obrigado)
    if (
      currentView === 'obrigado' ||
      currentView === 'thank-you' ||
      currentView === 'agradecimento' ||
      currentView === 'confirmacao'
    ) {
      return (
        <ThankYouPage
          onNavigateHome={() => {
            setCurrentView('home');
            setCurrentPage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateCases={() => {
            setCurrentView('cases');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateMeetings={() => {
            setCurrentView('reunioes');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          type={thankYouConfig.type}
          title={thankYouConfig.title}
          subtitle={thankYouConfig.subtitle}
          referenceCode={thankYouConfig.referenceCode}
          recipientName={thankYouConfig.recipientName || (currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : undefined)}
          userEmail={thankYouConfig.userEmail || currentUser?.email}
          schoolName={thankYouConfig.schoolName}
        />
      );
    }

    // 7. Not Found 404 Page (Página Não Encontrada)
    if (
      currentView === '404' ||
      currentView === 'not-found' ||
      currentView === 'erro-404'
    ) {
      return (
        <NotFoundPage
          onNavigateHome={() => {
            setCurrentView('home');
            setCurrentPage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateMeetings={() => {
            setCurrentView('reunioes');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateAbout={() => {
            setCurrentView('sobre');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateCases={() => {
            setCurrentView('cases');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateSupport={() => setInfoModalType('support')}
          requestedPath={window.location.pathname !== '/' ? window.location.pathname : undefined}
          isLoggedIn={isSessionStarted}
        />
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
                    setRagInitialQuery('Como é calculada a nota trimestral (MT) e qual o peso da MAC no Ensino Geral?');
                    setIsRagModalOpen(true);
                  }}
                  className="text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>🧠 Pareceres & RAG Inteligente MED</span>
                </button>
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Resposta do Assistente Sigre:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRagInitialQuery('Consultar base normativa e regulamentar oficial');
                        setIsRagModalOpen(true);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Abrir Parecer RAG →</span>
                    </button>
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

          {/* School Team Showcase (Professores Cadastrados no Sistema) - Only on home dashboard when session is started */}
          {currentPage === 'home' && currentView === 'home' && isSessionStarted && (
            <SchoolTeamSection
              members={schoolMembers}
              title="Professores Cadastrados no Sistema"
              subtitle="Corpo docente oficial registado na rede escolar do município de Quêssua."
            />
          )}
        </main>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f3f3] text-[#002133] flex flex-col font-sans selection:bg-[#f75142] selection:text-white relative">
      {/* Toast Alert Notification (Posicionado no canto inferior direito para nunca cobrir o cabeçalho) */}
      {toastMessage && (
        <div 
          id="system-toast-notification"
          className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#002133]/95 backdrop-blur-md text-white pl-4 pr-3 py-3 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.3)] border border-white/20 text-xs font-medium tracking-wide animate-in fade-in slide-in-from-bottom-5 flex items-center justify-between gap-3 pointer-events-auto"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#f75142] animate-ping shrink-0" />
            <span className="leading-snug">{toastMessage}</span>
          </div>
          <button
            id="btn-dismiss-toast"
            onClick={() => setToastMessage(null)}
            className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
            title="Fechar notificação"
          >
            <X className="w-4 h-4" />
          </button>
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
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentPage={currentPage}
        currentView={currentView}
        isAuthLoading={isAuthLoading}
        authLoadingAction={authLoadingAction}
        onOpenAbout={() => setInfoModalType('about')}
        onOpenProfile={() => {
          setCurrentPage('home');
          setProfileInitialTab('visao-geral');
          setProfileFocusZone(false);
          const ownProfile = getOwnProfileViewForUser(currentUser);
          setCurrentView(ownProfile);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSupport={() => setInfoModalType('support')}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenRag={() => {
          setRagInitialQuery('');
          setIsRagModalOpen(true);
        }}
        unreadChatCount={unreadChatCount}
        onSelectPage={handleSelectPage}
        currentUser={currentUser}
        onLogout={handleLogout}
        activeRole={activeRole}
        onSwitchRole={(newRole) => {
          if (currentUser) {
            showToast(
              `Operação bloqueada: A sua conta está autenticada como ${currentUser.firstName} (${currentUser.role.toUpperCase()}). Por segurança, encerre a sessão para aceder com outro utilizador.`
            );
            return;
          }
          setActiveRole(newRole);
          setCurrentView('home');
          setCurrentPage('home');
          showToast(
            `Perfil alternado para: ${
              newRole === 'admin'
                ? 'Administração Central'
                : newRole === 'diretor'
                ? 'Direção Escolar'
                : 'Corpo Docente'
            }`
          );
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSettings={() => {
          setCurrentPage('home');
          setProfileInitialTab('configuracoes');
          setProfileFocusZone(true);
          setSettingsTriggerCount((c) => c + 1);
          const ownProfile = getOwnProfileViewForUser(currentUser);
          setCurrentView(ownProfile);
          setTimeout(() => {
            const el = document.getElementById('zona-dados-senha');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 250);
        }}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
      />

      {/* Main Routed View with smooth page transitions */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={
            !currentUser
              ? 'public-landing'
              : currentPage === 'login' || currentPage === 'register'
              ? `auth-${currentPage}`
              : currentView === 'aluno-perfil'
              ? `aluno-perfil-${selectedStudent?.id || 'current'}`
              : `${activeRole}-${currentView}`
          }
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full flex-1 flex flex-col"
        >
          {renderCurrentView()}
        </motion.div>
      </AnimatePresence>

      {/* Organic Cloud Wave Footer (only visible when session is started) */}
      {isSessionStarted && (
        <CloudFooter
          onOpenAbout={() => {
            setCurrentView('sobre');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenTerms={() => {
            setCurrentView('termos');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenPrivacy={() => {
            setCurrentView('privacidade');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenSecurity={() => {
            setCurrentView('seguranca');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenCases={() => {
            setCurrentView('cases');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenCookieSettings={() => window.dispatchEvent(new CustomEvent('open-ucore-cookie-preferences'))}
          onOpenSupport={() => setInfoModalType('support')}
        />
      )}

      {/* Cookie Consent Banner & Preferences Modal */}
      <CookieConsentBanner
        onNavigateToPrivacy={() => {
          setCurrentView('privacidade');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToTerms={() => {
          setCurrentView('termos');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToSecurity={() => {
          setCurrentView('seguranca');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Floating Support Chat Button (only visible when session is started) */}
      {isSessionStarted && (
        <FloatingChatButton
          onClick={() => setIsChatOpen(true)}
          unreadCount={unreadChatCount}
        />
      )}

      {/* Demo Request Modal */}
      <DemoRequestModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onStartDemoSession={(role) => handleDirectDemoLogin(role || 'diretor')}
        onOpenThankYouPage={(details) => {
          setThankYouConfig({
            type: 'school-registration',
            title: 'Solicitação de Demonstração Recebida!',
            subtitle: `Agradecemos o interesse, ${details.recipientName}. A equipa Sigre entrará em contacto para o agendamento da sessão experimental.`,
            recipientName: details.recipientName,
            schoolName: details.schoolName,
            userEmail: details.userEmail,
            referenceCode: details.referenceCode,
          });
          setCurrentView('obrigado');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
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
          const next = saveRegisteredSchool(newSchool);
          setAdminSchools(next);
          showToast(`Escola "${newSchool.name}" cadastrada na rede com sucesso!`);
        }}
        onAddTeacher={(newTeacher) => {
          setAdminTeachers((prev) => [newTeacher, ...prev]);
          showToast(`Docente "${newTeacher.name}" registrado com sucesso!`);
        }}
        onAddStudent={(newStudent) => {
          setAdminStudents((prev) => {
            const existingIdx = prev.findIndex((s) => s.id === newStudent.id);
            if (existingIdx >= 0) {
              const copy = [...prev];
              copy[existingIdx] = newStudent;
              return copy;
            }
            return [newStudent, ...prev];
          });
          setAdminSchools((prevSchools) =>
            prevSchools.map((sc) => {
              const isMatch =
                (newStudent.schoolId && newStudent.schoolId === sc.id) ||
                newStudent.schoolName.trim().toLowerCase() === sc.name.trim().toLowerCase();
              if (isMatch) {
                return {
                  ...sc,
                  studentsWithDocs: sc.studentsWithDocs + (newStudent.hasDocuments ? 1 : 0),
                  studentsWithoutDocs: sc.studentsWithoutDocs + (newStudent.hasDocuments ? 0 : 1),
                };
              }
              return sc;
            })
          );
          showToast(
            `Aluno(a) "${newStudent.name}" cadastrado(a) na escola "${newStudent.schoolName}" (${newStudent.registrationData?.tipoEscolaNome || newStudent.gradeClass}) com sucesso!`
          );
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
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
      />

      {/* Google Sheets Integration Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        schools={adminSchools}
        teachers={adminTeachers}
        directors={adminDirectors}
        students={adminStudents}
      />

      {/* Admin Audit Logs & Security Modal (SSD & RLS) */}
      <AdminAuditLogsModal
        isOpen={isAuditLogsModalOpen}
        onClose={() => setIsAuditLogsModalOpen(false)}
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
        onStartCall={(roomId, title, isVideo) => {
          handleOpenMeeting(roomId, title, isVideo);
        }}
      />

      {/* Real-time Video/Voice Meetings & Zoom Conference Modal */}
      <ZoomMeetingModal
        isOpen={activeMeeting.isOpen}
        onClose={handleCloseMeeting}
        roomId={activeMeeting.roomId}
        roomTitle={activeMeeting.roomTitle}
        currentUser={currentUser}
        initialVideo={activeMeeting.initialVideo}
        initialAudio={activeMeeting.initialAudio}
      />

      {/* Intelligent RAG Vector Knowledge Center Modal (MED Angola & Sigre) */}
      <RagIntelligenceModal
        isOpen={isRagModalOpen}
        onClose={() => setIsRagModalOpen(false)}
        currentUser={currentUser}
        activeRole={activeRole}
        initialQuery={ragInitialQuery}
      />
    </div>
  );
}
