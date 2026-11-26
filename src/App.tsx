"use client";

import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { StatCards } from './components/StatCards';
import type { InfoModalType } from './components/InfoModal';
import { sessionsData } from './data/sessionsData';
import { initTheme } from './utils/themeService';
import type { AdminModalType } from './components/pages/admin/AdminRegistrationModal';
import {
  initialAdminSchools,
  initialAdminTeachers,
  initialAdminStudents,
  initialAdminDirectors,
} from './data/adminData';
import {
  deleteSchoolAndRelatedData,
  isModeloCentralSchool,
  saveRegisteredSchool,
  syncSchoolsFromServer,
} from './utils/schoolStorage';
import { deduplicateSchoolsCanonical } from './utils/schoolMatcher';
import {
  syncApplicationsFromServer,
  initRealtimeApplicationsSync,
  isAccountDeleted,
  findRegisteredAccountByEmail,
  checkUserApprovalStatus,
  schoolsMatch,
} from './utils/authApprovalStorage';
import { initRealtimeQuickRequestsSync } from './utils/quickServicesStorage';
import {
  initViewScopedRealtimeSync,
  fetchDashboardStats,
  subscribeToDashboardStats,
  type DashboardStats,
  isFirestoreReadQuotaExhausted,
  isFirestoreWriteQuotaExhausted,
  saveTeacherToFirestore,
  saveStudentToFirestore,
  saveDirectorToFirestore,
  saveUserToFirestore,
} from './utils/firestoreSync';
import { saveStudent } from './utils/studentStorage';
import {
  initialStudentsData,
  initialTeacherData,
  StudentProfile,
  TeacherData,
  defaultDisciplinasList,
} from './data/teacherData';
import { initialChatChannels, initialChatMessages } from './data/chatData';
import { realtimeChat } from './utils/realtimeChat';
import { initSmoothScroll, scrollToTop, refreshScrollReveals } from './utils/scrollManager';
import type { SchoolMember } from './components/ui/school-team-section';
import { AIInputWithLoading } from './components/ui/ai-input-with-loading';
import { canUserAccessView, getOwnProfileViewForUser } from './utils/authGuard';
import { Sparkles, X } from 'lucide-react';

// Lazy-loaded landing, auth, and shared UI sections
const AuthPage = lazy(() => import('./components/pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const PublicLandingPage = lazy(() => import('./components/pages/PublicLandingPage').then((m) => ({ default: m.PublicLandingPage })));
const PendingApprovalPage = lazy(() => import('./components/pages/PendingApprovalPage').then((m) => ({ default: m.PendingApprovalPage })));
const AccessDeniedGuard = lazy(() => import('./components/common/AccessDeniedGuard').then((m) => ({ default: m.AccessDeniedGuard })));
const CyanCardsSection = lazy(() => import('./components/CyanCardsSection').then((m) => ({ default: m.CyanCardsSection })));
const CloudFooter = lazy(() => import('./components/CloudFooter').then((m) => ({ default: m.CloudFooter })));
const SchoolTeamSection = lazy(() => import('./components/ui/school-team-section'));
const CookieConsentBanner = lazy(() => import('./components/cookies/CookieConsentBanner').then((m) => ({ default: m.CookieConsentBanner })));
const FloatingChatButton = lazy(() => import('./components/chat/FloatingChatButton').then((m) => ({ default: m.FloatingChatButton })));

// Lazy-loaded Director Pages
const DirectorStatisticsPage = lazy(() => import('./components/pages/director/DirectorStatisticsPage').then((m) => ({ default: m.DirectorStatisticsPage })));
const DirectorTeachersPage = lazy(() => import('./components/pages/director/DirectorTeachersPage').then((m) => ({ default: m.DirectorTeachersPage })));
const DirectorStudentsPage = lazy(() => import('./components/pages/director/DirectorStudentsPage').then((m) => ({ default: m.DirectorStudentsPage })));
const DirectorRoomsPage = lazy(() => import('./components/pages/director/DirectorRoomsPage').then((m) => ({ default: m.DirectorRoomsPage })));
const DirectorClassesPage = lazy(() => import('./components/pages/director/DirectorClassesPage').then((m) => ({ default: m.DirectorClassesPage })));
const DirectorProfilePage = lazy(() => import('./components/pages/director/DirectorProfilePage').then((m) => ({ default: m.DirectorProfilePage })));
const DirectorAttendancePage = lazy(() => import('./components/pages/director/DirectorAttendancePage').then((m) => ({ default: m.DirectorAttendancePage })));
const DirectorApprovalsPage = lazy(() => import('./components/pages/director/DirectorApprovalsPage').then((m) => ({ default: m.DirectorApprovalsPage })));
const DirectorPautasPage = lazy(() => import('./components/pages/director/DirectorPautasPage').then((m) => ({ default: m.DirectorPautasPage })));

// Lazy-loaded Admin Pages
const AdminStatisticsPage = lazy(() => import('./components/pages/admin/AdminStatisticsPage').then((m) => ({ default: m.AdminStatisticsPage })));
const AdminSchoolsPage = lazy(() => import('./components/pages/admin/AdminSchoolsPage').then((m) => ({ default: m.AdminSchoolsPage })));
const AdminTeachersPage = lazy(() => import('./components/pages/admin/AdminTeachersPage').then((m) => ({ default: m.AdminTeachersPage })));
const AdminStudentsPage = lazy(() => import('./components/pages/admin/AdminStudentsPage').then((m) => ({ default: m.AdminStudentsPage })));
const AdminDirectorsPage = lazy(() => import('./components/pages/admin/AdminDirectorsPage').then((m) => ({ default: m.AdminDirectorsPage })));
const AdminProfilePage = lazy(() => import('./components/pages/admin/AdminProfilePage').then((m) => ({ default: m.AdminProfilePage })));
const AdminAnnouncementsPage = lazy(() => import('./components/pages/admin/AdminAnnouncementsPage').then((m) => ({ default: m.AdminAnnouncementsPage })));
const AdminApprovalsPage = lazy(() => import('./components/pages/admin/AdminApprovalsPage').then((m) => ({ default: m.AdminApprovalsPage })));

// Lazy-loaded Teacher & Student Pages
const TeacherStatisticsPage = lazy(() => import('./components/pages/TeacherStatisticsPage').then((m) => ({ default: m.TeacherStatisticsPage })));
const TeacherClassPage = lazy(() => import('./components/pages/TeacherClassPage').then((m) => ({ default: m.TeacherClassPage })));
const TeacherProfilePage = lazy(() => import('./components/pages/TeacherProfilePage').then((m) => ({ default: m.TeacherProfilePage })));
const TeacherAttendancePage = lazy(() => import('./components/pages/TeacherAttendancePage').then((m) => ({ default: m.TeacherAttendancePage })));
const StudentProfilePage = lazy(() => import('./components/pages/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage })));

// Lazy-loaded Institutional, Legal, Meetings & Services Pages
const AboutPlatformPage = lazy(() => import('./components/pages/legal/AboutPlatformPage').then((m) => ({ default: m.AboutPlatformPage })));
const TermsOfUsePage = lazy(() => import('./components/pages/legal/TermsOfUsePage').then((m) => ({ default: m.TermsOfUsePage })));
const PrivacyPolicyPage = lazy(() => import('./components/pages/legal/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const SecurityDataProtectionPage = lazy(() => import('./components/pages/legal/SecurityDataProtectionPage').then((m) => ({ default: m.SecurityDataProtectionPage })));
const MeetingsHubPage = lazy(() => import('./components/pages/MeetingsHubPage').then((m) => ({ default: m.MeetingsHubPage })));
const NotFoundPage = lazy(() => import('./components/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const ThankYouPage = lazy(() => import('./components/pages/ThankYouPage').then((m) => ({ default: m.ThankYouPage })));
const CasesPage = lazy(() => import('./components/pages/CasesPage').then((m) => ({ default: m.CasesPage })));
const DeclaracaoEfectividadePage = lazy(() => import('./components/pages/DeclaracaoEfectividadePage').then((m) => ({ default: m.DeclaracaoEfectividadePage })));
const QuickServicesPage = lazy(() => import('./components/pages/QuickServicesPage').then((m) => ({ default: m.QuickServicesPage })));

// Lazy-loaded Heavy Modals (downloaded & mounted strictly on demand)
const StatDetailModal = lazy(() => import('./components/StatDetailModal').then((m) => ({ default: m.StatDetailModal })));
const ModuleDetailModal = lazy(() => import('./components/ModuleDetailModal').then((m) => ({ default: m.ModuleDetailModal })));
const InfoModal = lazy(() => import('./components/InfoModal').then((m) => ({ default: m.InfoModal })));
const SessionSettingsModal = lazy(() => import('./components/SessionSettingsModal').then((m) => ({ default: m.SessionSettingsModal })));
const AdminRegistrationModal = lazy(() => import('./components/pages/admin/AdminRegistrationModal').then((m) => ({ default: m.AdminRegistrationModal })));
const AdminAuditLogsModal = lazy(() => import('./components/pages/admin/AdminAuditLogsModal').then((m) => ({ default: m.AdminAuditLogsModal })));
const ExcelExportModal = lazy(() => import('./components/modals/ExcelExportModal').then((m) => ({ default: m.ExcelExportModal })));
const GoogleSheetsModal = lazy(() => import('./components/modals/GoogleSheetsModal').then((m) => ({ default: m.GoogleSheetsModal })));
const SupportChatModal = lazy(() => import('./components/chat/SupportChatModal').then((m) => ({ default: m.SupportChatModal })));
const DemoRequestModal = lazy(() => import('./components/modals/DemoRequestModal').then((m) => ({ default: m.DemoRequestModal })));
const ZoomMeetingModal = lazy(() => import('./components/meetings/ZoomMeetingModal').then((m) => ({ default: m.ZoomMeetingModal })));
const RagIntelligenceModal = lazy(() => import('./components/rag/RagIntelligenceModal').then((m) => ({ default: m.RagIntelligenceModal })));
const BackupManagerModal = lazy(() => import('./components/modals/BackupManagerModal').then((m) => ({ default: m.BackupManagerModal })));

const RouteFallback: React.FC = () => (
  <div className="w-full min-h-[55vh] flex flex-col items-center justify-center gap-3 px-4 py-16">
    <div className="w-8 h-8 rounded-full border-[2.5px] border-slate-200 border-t-[#f75142] animate-spin" />
    <span className="text-xs font-semibold text-slate-500 tracking-wide">A carregar módulo...</span>
  </div>
);

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
      const isSessionActive = sessionStorage.getItem('ucore_session_active') === 'true';
      const hasUser = Boolean(localStorage.getItem('ucore_active_user'));
      if (isSessionActive && hasUser) {
        const savedSessionView = sessionStorage.getItem('ucore_session_view');
        if (savedSessionView && savedSessionView !== 'ucore-home' && savedSessionView !== 'ucore-parallax') {
          return savedSessionView;
        }
      }
      return 'home';
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
  const [isGlobalBackupModalOpen, setIsGlobalBackupModalOpen] = useState(false);
  const [isQuickServicesModalOpen, setIsQuickServicesModalOpen] = useState(false);
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

  // Note: purgeModeloCentralData() already runs once at schoolStorage module initialization.

  // Admin dynamic state (hydrated from both admin and detailed registration keys, falling back to canonical seed if empty)
  const [adminSchools, setAdminSchools] = useState<AdminSchool[]>(() => {
    try {
      const saved = localStorage.getItem('ucore_admin_schools');
      const parsed: AdminSchool[] = saved ? JSON.parse(saved) : [];
      const list = Array.isArray(parsed) && parsed.length > 0 ? parsed : initialAdminSchools;
      return deduplicateSchoolsCanonical(
        Array.isArray(list) ? list.filter((s) => s && !isModeloCentralSchool(s.name)) : initialAdminSchools
      );
    } catch {
      return deduplicateSchoolsCanonical(initialAdminSchools);
    }
  });

  const [adminTeachers, setAdminTeachers] = useState<AdminTeacher[]>(() => {
    try {
      const saved = localStorage.getItem('ucore_admin_teachers');
      const parsed: AdminTeacher[] = saved ? JSON.parse(saved) : [];
      const list = Array.isArray(parsed) && parsed.length > 0 ? parsed : initialAdminTeachers;
      if (Array.isArray(list) && list.length > 0) {
        return list.filter((t) => t && !isModeloCentralSchool(t.schoolName));
      }
      const savedReg = localStorage.getItem('ucore_registered_teachers_v2');
      if (savedReg) {
        const regList = JSON.parse(savedReg);
        if (Array.isArray(regList) && regList.length > 0) {
          return regList
            .filter((r: any) => r && !isModeloCentralSchool(r.nomeEscola))
            .map((r: any) => ({
              id: r.id,
              name: r.nomeCompleto,
              phone: r.telefone || '+244 923 000 000',
              gradeClass: r.primaryGradeClass || r.niveisLecciona?.[0]?.nome || 'Ensino Primário',
              room: r.primaryRoom || 'Sala 01',
              turma: r.primaryTurma || 'Turma A',
              category: r.funcaoCategoria || 'Docente / Professor',
              location: `${r.municipioEscola || 'Quêssua'}`,
              schoolName: r.nomeEscola || 'Escola Municipal de Quêssua',
              schoolId: r.escolaId,
              presenceRate: 99,
              subject: r.disciplinas || 'Língua Portuguesa',
              gender: (r.sexo === 'Feminino' ? 'F' : 'M') as 'M' | 'F',
              qualification: r.nivelAcademico,
              assignedTurmas: r.assignedTurmas,
              registrationData: r,
            }));
        }
      }
      return initialAdminTeachers;
    } catch {
      return initialAdminTeachers;
    }
  });

  const [adminStudents, setAdminStudents] = useState<AdminStudent[]>(() => {
    try {
      const saved = localStorage.getItem('ucore_admin_students');
      const parsed: AdminStudent[] = saved ? JSON.parse(saved) : [];
      const list = Array.isArray(parsed) && parsed.length > 0 ? parsed : initialAdminStudents;
      if (Array.isArray(list) && list.length > 0) {
        return list.filter((st) => st && !isModeloCentralSchool(st.schoolName));
      }
      const savedReg = localStorage.getItem('ucore_registered_students_v2');
      if (savedReg) {
        const regList = JSON.parse(savedReg);
        if (Array.isArray(regList) && regList.length > 0) {
          return regList
            .filter((s: any) => s && !isModeloCentralSchool(s.escola))
            .map((s: any) => ({
              id: s.id,
              name: s.nomeCompleto || s.name,
              gender: (s.genero === 'M' ? 'M' : 'F') as 'M' | 'F',
              gradeClass: s.classeEtapaModulo || s.classe || '1.ª Classe',
              room: s.sala || 'Sala 01',
              turma: s.turma || 'Turma A',
              guardianName: s.encarregado || 'Encarregado de Educação',
              location: s.endereco || 'Quêssua, Malanje',
              presenceRate: 98,
              hasDocuments: s.tipoDocumento !== 'sem Documento',
              documentType: s.tipoDocumento,
              numeroDocumento: s.numeroDocumento,
              dataNascimento: s.dataNascimento,
              idade: s.idade,
              condicaoMatricula: s.condicaoMatricula,
              foto: s.foto,
              anexoDocumentoNome: s.anexoDocumentoNome,
              performanceScore: 8.5,
              schoolName: s.escola || 'Escola Oficial',
              schoolId: s.schoolId,
              schoolType: s.naturezaEscola || 'Pública',
              registrationData: s,
            }));
        }
      }
      return initialAdminStudents;
    } catch {
      return initialAdminStudents;
    }
  });

  const [adminDirectors, setAdminDirectors] = useState<AdminDirector[]>(() => {
    try {
      const saved = localStorage.getItem('ucore_admin_directors');
      const parsed: AdminDirector[] = saved ? JSON.parse(saved) : [];
      const list = Array.isArray(parsed) && parsed.length > 0 ? parsed : initialAdminDirectors;
      return Array.isArray(list) ? list.filter((d) => d && !isModeloCentralSchool(d.schoolName)) : initialAdminDirectors;
    } catch {
      return initialAdminDirectors;
    }
  });

  const isInitialSyncCompleteRef = useRef(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  const [adminModalType, setAdminModalType] = useState<AdminModalType>(null);
  const [isExcelExportModalOpen, setIsExcelExportModalOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [isAuditLogsModalOpen, setIsAuditLogsModalOpen] = useState(false);
  const [isRagModalOpen, setIsRagModalOpen] = useState(false);
  const [ragInitialQuery, setRagInitialQuery] = useState('');
  const [homeAIResponse, setHomeAIResponse] = useState<string | null>(null);
  const [directorPautaTarget, setDirectorPautaTarget] = useState<{ classe: string; turma: string }>({
    classe: '4ª Classe',
    turma: 'Turma A',
  });

  const handleHomeAICommand = (prompt: string) => {
    if (!prompt.trim()) return;
    const p = prompt.toLowerCase();
    const totalTeachersCount = dashboardStats?.totalTeachers ?? adminTeachers.length;
    const totalStudentsCount = dashboardStats?.totalStudents ?? adminStudents.length;
    const totalSchoolsCount = dashboardStats?.totalSchools ?? adminSchools.length;
    if (p.includes('ponto') || p.includes('presen') || p.includes('falta') || p.includes('docente') || p.includes('professor')) {
      setHomeAIResponse(
        `📊 Análise de Presenças (Livro de Ponto Docente):\n• Total de Professores Cadastrados: ${totalTeachersCount} docentes.\n• Presentes: 0 docentes.\n• Falta Justificada: 0 docentes.\n• O sistema está pronto para registo de novos docentes.`
      );
    } else if (p.includes('turma') || p.includes('aluno') || p.includes('sala')) {
      setHomeAIResponse(
        `🎓 Panorama Discente & Turmas:\n• ${totalStudentsCount} alunos cadastrados em ${totalSchoolsCount} escolas ativas.\n• Sem pendências ou registros arquivados no momento.`
      );
    } else {
      setHomeAIResponse(
        `✨ Parecer Institucional Inteligente Sigre:\nRecebido: "${prompt}".\nA plataforma municipal da Educação de Quêssua está inicializada e pronta para novos cadastros no ano lectivo 2026/2027.`
      );
    }
  };

  // Track last synced raw JSON per collection to avoid redundant JSON.parse/stringify thrashing
  const lastRawSyncRef = useRef<Record<string, string | null>>({});

  // Initialize theme mode once on mount
  useEffect(() => {
    initTheme();
  }, []);

  // Persist admin entities on change (skipping redundant writes when raw value already matches)
  useEffect(() => {
    try {
      const nextJson = JSON.stringify(adminSchools);
      if (lastRawSyncRef.current.schools !== nextJson && localStorage.getItem('ucore_admin_schools') !== nextJson) {
        lastRawSyncRef.current.schools = nextJson;
        localStorage.setItem('ucore_admin_schools', nextJson);
      }
    } catch {
      // ignore
    }
  }, [adminSchools]);

  useEffect(() => {
    try {
      const nextJson = JSON.stringify(adminTeachers);
      if (lastRawSyncRef.current.teachers !== nextJson && localStorage.getItem('ucore_admin_teachers') !== nextJson) {
        lastRawSyncRef.current.teachers = nextJson;
        localStorage.setItem('ucore_admin_teachers', nextJson);
      }
    } catch {
      // ignore
    }
  }, [adminTeachers]);

  useEffect(() => {
    try {
      const nextJson = JSON.stringify(adminDirectors);
      if (lastRawSyncRef.current.directors !== nextJson && localStorage.getItem('ucore_admin_directors') !== nextJson) {
        lastRawSyncRef.current.directors = nextJson;
        localStorage.setItem('ucore_admin_directors', nextJson);
      }
    } catch {
      // ignore
    }
  }, [adminDirectors]);

  useEffect(() => {
    try {
      const nextJson = JSON.stringify(adminStudents);
      if (lastRawSyncRef.current.students !== nextJson && localStorage.getItem('ucore_admin_students') !== nextJson) {
        lastRawSyncRef.current.students = nextJson;
        localStorage.setItem('ucore_admin_students', nextJson);
      }
    } catch {
      // ignore
    }
  }, [adminStudents]);

  // Listen for sigre-data-synced and ucore-teachers-updated events (debounced to prevent bursts of JSON.parse freezes)
  useEffect(() => {
    let syncTimer: ReturnType<typeof setTimeout> | null = null;

    const runSyncNow = () => {
      try {
        const savedStudents = localStorage.getItem('ucore_admin_students');
        if (savedStudents && savedStudents !== lastRawSyncRef.current.students) {
          lastRawSyncRef.current.students = savedStudents;
          const parsed = JSON.parse(savedStudents);
          if (Array.isArray(parsed)) setAdminStudents(parsed);
        }
        const savedTeachers = localStorage.getItem('ucore_admin_teachers');
        if (savedTeachers && savedTeachers !== lastRawSyncRef.current.teachers) {
          lastRawSyncRef.current.teachers = savedTeachers;
          const parsed = JSON.parse(savedTeachers);
          if (Array.isArray(parsed)) setAdminTeachers(parsed);
        }
        const savedSchools = localStorage.getItem('ucore_admin_schools');
        if (savedSchools && savedSchools !== lastRawSyncRef.current.schools) {
          const parsed = JSON.parse(savedSchools);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cleanSchools = deduplicateSchoolsCanonical(parsed);
            const cleanJson = JSON.stringify(cleanSchools);
            lastRawSyncRef.current.schools = cleanJson;
            setAdminSchools(cleanSchools);
          }
        }
        const savedDirectors = localStorage.getItem('ucore_admin_directors');
        if (savedDirectors && savedDirectors !== lastRawSyncRef.current.directors) {
          lastRawSyncRef.current.directors = savedDirectors;
          const parsed = JSON.parse(savedDirectors);
          if (Array.isArray(parsed)) setAdminDirectors(parsed);
        }
        const savedTeacherStudents = localStorage.getItem('ucore_teacher_students');
        if (savedTeacherStudents && savedTeacherStudents !== lastRawSyncRef.current.teacherStudents) {
          lastRawSyncRef.current.teacherStudents = savedTeacherStudents;
          const parsed = JSON.parse(savedTeacherStudents);
          if (Array.isArray(parsed)) setTeacherStudents(parsed);
        }
        const savedChatMessages = localStorage.getItem('ucore_chat_messages');
        if (savedChatMessages && savedChatMessages !== lastRawSyncRef.current.chatMessages) {
          lastRawSyncRef.current.chatMessages = savedChatMessages;
          const parsed = JSON.parse(savedChatMessages);
          if (Array.isArray(parsed) && parsed.length > 0) setChatMessages(parsed);
        }
        const savedChatChannels = localStorage.getItem('ucore_chat_channels_v3');
        if (savedChatChannels && savedChatChannels !== lastRawSyncRef.current.chatChannels) {
          lastRawSyncRef.current.chatChannels = savedChatChannels;
          const parsed = JSON.parse(savedChatChannels);
          if (Array.isArray(parsed) && parsed.length > 0) setChatChannels(parsed);
        }
      } catch {
        // ignore
      }
    };

    const handleSync = () => {
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        syncTimer = null;
        runSyncNow();
      }, 120);
    };

    syncSchoolsFromServer()
      .then((syncedSchools) => {
        isInitialSyncCompleteRef.current = true;
        if (Array.isArray(syncedSchools) && syncedSchools.length > 0) {
          lastRawSyncRef.current.schools = JSON.stringify(syncedSchools);
          setAdminSchools(syncedSchools);
        }
        runSyncNow();
      })
      .catch((err) => {
        console.error('[App] Erro ao sincronizar escolas na inicialização:', err);
        isInitialSyncCompleteRef.current = true;
      });

    window.addEventListener('sigre-data-synced', handleSync);
    window.addEventListener('ucore-teachers-updated', handleSync);
    window.addEventListener('ucore-students-updated', handleSync);
    return () => {
      if (syncTimer) clearTimeout(syncTimer);
      window.removeEventListener('sigre-data-synced', handleSync);
      window.removeEventListener('ucore-teachers-updated', handleSync);
      window.removeEventListener('ucore-students-updated', handleSync);
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

  // Restore active user if session was already started; otherwise open on PublicLandingPage
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const isSessionActive = sessionStorage.getItem('ucore_session_active') === 'true';
      if (!isSessionActive) {
        return null;
      }
      const saved = localStorage.getItem('ucore_active_user');
      if (!saved) return null;
      const parsedUser: UserAccount = JSON.parse(saved);
      if (
        parsedUser &&
        isAccountDeleted(parsedUser.id, parsedUser.email, parsedUser.biNumber)
      ) {
        localStorage.removeItem('ucore_active_user');
        sessionStorage.removeItem('ucore_session_active');
        sessionStorage.removeItem('ucore_session_view');
        return null;
      }
      return parsedUser;
    } catch {
      return null;
    }
  });

  const currentUserRef = useRef<UserAccount | null>(currentUser);
  currentUserRef.current = currentUser;

  // Immediately terminate active session if revoked OR auto-promote if approved on another device
  useEffect(() => {
    const checkActiveAccountStatus = () => {
      const user = currentUserRef.current;
      if (!user) return;
      const emailLow = (user.email || '').trim().toLowerCase();
      if (emailLow === 'dmedoquessua@gmail.com' || emailLow === 'beliziodos20@gmail.com') {
        return;
      }
      const lookup = emailLow ? findRegisteredAccountByEmail(emailLow) : { exists: true };
      if (
        isAccountDeleted(user.id, user.email, user.biNumber) ||
        lookup.wasDeletedByAdmin
      ) {
        setCurrentUser(null);
        setCurrentPage('login');
        setCurrentView('home');
        try {
          sessionStorage.removeItem('ucore_session_active');
          sessionStorage.removeItem('ucore_session_view');
          localStorage.removeItem('ucore_active_user');
        } catch {}
        showToast(
          'A sua conta foi apagada pela Administração do Sistema. As suas credenciais foram revogadas e a sessão foi encerrada.'
        );
        return;
      }

      // If this session is still marked 'pendente' but the application is now 'aprovado', promote immediately!
      if (user.status === 'pendente') {
        const approvalCheck = checkUserApprovalStatus(user.id, user.email, user.biNumber);
        if (approvalCheck.status === 'ativo') {
          const promotedUser: UserAccount = {
            ...user,
            status: 'ativo',
            approvedAt: approvalCheck.app?.approvedAt || user.approvedAt || new Date().toLocaleString('pt-AO'),
            approvedBy: approvalCheck.app?.approvedBy || user.approvedBy || 'Director Municipal da Educação (dmedoquessua@gmail.com)',
          };
          setCurrentUser(promotedUser);
          try {
            localStorage.setItem('ucore_active_user', JSON.stringify(promotedUser));
          } catch {}
          saveUserToFirestore(promotedUser).catch((err) =>
            console.error('[App] Erro ao atualizar utilizador homologado no Firestore:', err)
          );
          showToast(`Conta homologada com sucesso! Bem-vindo(a) à plataforma Sigre, ${promotedUser.firstName}.`);
        }
      }
    };

    checkActiveAccountStatus();
    window.addEventListener('sigre-account-revoked', checkActiveAccountStatus);
    window.addEventListener('sigre-data-synced', checkActiveAccountStatus);
    return () => {
      window.removeEventListener('sigre-account-revoked', checkActiveAccountStatus);
      window.removeEventListener('sigre-data-synced', checkActiveAccountStatus);
    };
  }, [currentUser?.id, currentUser?.email, currentUser?.biNumber, currentUser?.status]);

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

  // View-scoped, role-scoped & session-gated real-time Firestore listeners (Rules 1-5):
  // Attaches ONLY listeners needed for the current view/role + single-doc stats/dashboard,
  // and cleanly tears down previous listeners on tab/view change or logout.
  useEffect(() => {
    if (!currentUser || currentUser.status !== 'ativo') return;
    if (isFirestoreReadQuotaExhausted()) return;

    const cleanups: Array<() => void> = [];
    const viewLow = String(currentView || 'home').toLowerCase();

    fetchDashboardStats()
      .then((stats) => {
        if (stats) setDashboardStats(stats);
      })
      .catch((err) => {
        console.error('[App] Erro ao obter estatísticas do dashboard (getDoc):', err);
      });

    const unsubStats = subscribeToDashboardStats(
      (stats) => {
        setDashboardStats(stats);
      },
      (err) => {
        console.error('[App] Erro no listener onSnapshot de stats/dashboard:', err);
      }
    );
    cleanups.push(unsubStats);

    if (
      currentUser.role === 'admin' &&
      (viewLow === 'home' ||
        viewLow.includes('dashboard') ||
        viewLow.includes('aprovac') ||
        viewLow.includes('approvals') ||
        viewLow.includes('inscric'))
    ) {
      const unsubApps = initRealtimeApplicationsSync(undefined, (err) => {
        console.error('[App] Erro no listener onSnapshot de candidaturas:', err);
      });
      if (typeof unsubApps === 'function') cleanups.push(unsubApps);
    }

    if (
      (currentUser.role === 'admin' || currentUser.role === 'diretor') &&
      (viewLow === 'home' ||
        viewLow.includes('dashboard') ||
        viewLow.includes('servicos') ||
        viewLow.includes('quick'))
    ) {
      const unsubQuick = initRealtimeQuickRequestsSync(undefined, (err) => {
        console.error('[App] Erro no listener onSnapshot de serviços rápidos:', err);
      });
      if (typeof unsubQuick === 'function') cleanups.push(unsubQuick);
    }

    const unsubViewScoped = initViewScopedRealtimeSync(
      {
        view: currentView,
        role: activeRole,
        schoolId: currentUser.schoolId,
      },
      (err) => {
        console.error('[App] Erro no listener onSnapshot da vista atual:', err);
      }
    );
    if (typeof unsubViewScoped === 'function') cleanups.push(unsubViewScoped);

    return () => {
      cleanups.forEach((fn) => {
        try {
          fn();
        } catch {}
      });
    };
  }, [currentUser?.id, currentUser?.role, currentUser?.status, currentUser?.schoolId, currentView, activeRole]);

  const hasShownWriteQuotaToastRef = useRef(false);
  useEffect(() => {
    const notifyWriteQuota = () => {
      if (hasShownWriteQuotaToastRef.current) return;
      hasShownWriteQuotaToastRef.current = true;
      showToast(
        'Cota diária gratuita de gravação no Firestore atingida. As novas alterações são mantidas localmente até à reposição diária da cota.'
      );
    };

    if (isFirestoreWriteQuotaExhausted()) {
      notifyWriteQuota();
    }

    const handleQuotaStatus = (ev: Event) => {
      const detail = (ev as CustomEvent<{ writeExhausted?: boolean }>).detail;
      if (detail?.writeExhausted) {
        notifyWriteQuota();
      }
    };
    window.addEventListener('sigre-firestore-quota-status', handleQuotaStatus);
    return () => {
      window.removeEventListener('sigre-firestore-quota-status', handleQuotaStatus);
    };
  }, []);



  // Persist currentView in sessionStorage only while a session is active
  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem('ucore_session_view', currentView);
      } else {
        sessionStorage.removeItem('ucore_session_view');
      }
    } catch {
      // ignore
    }
  }, [currentView, currentUser]);

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
      } else if (
        pageParam === 'servicos-rapidos' ||
        pageParam === 'servicos-sem-login' ||
        pageParam === 'servicos' ||
        pageParam === 'servicos-cidadao' ||
        pageParam === 'balcao-rapido'
      ) {
        setCurrentView('servicos-rapidos');
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

  // Session-gated real-time chat synchronization (Rule 3: never subscribe before login)
  useEffect(() => {
    if (!currentUser || currentUser.status !== 'ativo') {
      realtimeChat.stopCloudSync();
      return;
    }
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
      realtimeChat.stopCloudSync();
    };
  }, [currentUser?.id, currentUser?.status]);

  // Initialize Lenis global smooth scrolling and scroll reveals across all pages
  useEffect(() => {
    const cleanup = initSmoothScroll();
    return cleanup;
  }, []);

  // When switching page or view, smoothly reset scroll to top, refresh reveals, and update document.title (Prompt Mestre v4 Seção 15.1 & 23.1)
  useEffect(() => {
    scrollToTop(true);
    const viewTitles: Record<string, string> = {
      home: 'Painel Institucional',
      'admin-dashboard': 'Painel Central da Administração',
      'admin-estatisticas': 'Estatísticas da Rede Escolar',
      'admin-escolas': 'Gestão da Rede de Escolas',
      'admin-directores': 'Corpo Directivo Municipal',
      'admin-professores': 'Quadro Docente Municipal',
      'admin-alunos': 'Registo Geral de Alunos',
      'admin-anuncios': 'Demandas, Circulares e Editais',
      'admin-aprovacoes': 'Central de Homologações',
      'admin-inscricoes': 'Homologação de Inscrições',
      'admin-perfil': 'Perfil do Administrador',
      'diretor-dashboard': 'Painel da Direcção Escolar',
      'diretor-estatisticas': 'Estatísticas da Unidade Escolar',
      'diretor-professores': 'Corpo Docente da Escola',
      'diretor-presenca': 'Livro de Ponto Docente',
      'diretor-alunos': 'Alunos Matriculados',
      'diretor-salas': 'Gestão de Salas de Aula',
      'diretor-turmas': 'Gestão de Turmas e Horários',
      'diretor-pautas': 'Mini-Pautas e Pauta Final',
      'diretor-aprovacoes': 'Aprovação de Inscrições da Escola',
      'diretor-perfil': 'Perfil do Director',
      estatisticas: 'Estatísticas da Turma',
      'minha-turma': 'Diário de Classe e Notas',
      'professor-turma': 'Diário de Classe e Notas',
      'professor-presenca': 'Chamada Diária de Alunos',
      'perfil-professor': 'Perfil do Docente',
      'aluno-perfil': 'Ficha Individual do Aluno',
      'declaracao-efectividade': 'Declaração de Efectividade Oficial',
      efectividade: 'Declaração de Efectividade Oficial',
      sobre: 'Sobre a Plataforma Sigre',
      termos: 'Termos de Utilização',
      privacidade: 'Política de Privacidade',
      seguranca: 'Segurança e Proteção de Dados',
      cases: 'Casos de Sucesso',
      obrigado: 'Confirmação de Solicitação',
      'servicos-rapidos': 'Serviços Rápidos ao Cidadão (Sem Login)',
      'servicos-sem-login': 'Serviços Rápidos ao Cidadão (Sem Login)',
      'servicos-cidadao': 'Serviços Rápidos ao Cidadão (Sem Login)',
    };
    const pageTitle =
      currentPage === 'login'
        ? 'Iniciar Sessão'
        : currentPage === 'register'
        ? 'Criar Conta Institucional'
        : viewTitles[currentView] || 'Sistema Integrado de Gestão Escolar';
    document.title = `${pageTitle} | Sigre Angola`;

    const timer = setTimeout(() => {
      refreshScrollReveals();
    }, 60);
    return () => clearTimeout(timer);
  }, [currentPage, currentView]);

  // Prompt Mestre v4 Seção 18.4: Fecho previsível de modais informativos via tecla Escape
  useEffect(() => {
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedCard) setSelectedCard(null);
        else if (selectedModule) setSelectedModule(null);
        else if (infoModalType) setInfoModalType(null);
        else if (settingsModalOpen) setSettingsModalOpen(false);
        else if (isDemoModalOpen) setIsDemoModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalEscape);
    return () => window.removeEventListener('keydown', handleGlobalEscape);
  }, [selectedCard, selectedModule, infoModalType, settingsModalOpen, isDemoModalOpen]);

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
    realtimeChat.sendMessage(newMsg);

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

    // Dynamic real data reflection for Admin session cards (prefers stats/dashboard aggregator - Rule 4)
    if (activeRole === 'admin') {
      const totalSchoolsVal = dashboardStats?.totalSchools ?? adminSchools.length;
      const totalTeachers =
        dashboardStats?.totalTeachers ??
        adminSchools.reduce((acc, s) => acc + s.teachersCount, 0);
      const totalStudents =
        dashboardStats?.totalStudents ??
        adminSchools.reduce((acc, s) => acc + s.studentsWithDocs + s.studentsWithoutDocs, 0);
      const avgPerf = adminSchools.length > 0
        ? Math.round(adminSchools.reduce((acc, s) => acc + s.performanceRate, 0) / adminSchools.length)
        : 0;

      computedBase = {
        ...base,
        cards: base.cards.map((c) => {
          if (c.id.includes('escola') && !c.id.includes('desempenho')) {
            return { ...c, value: String(totalSchoolsVal) };
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
  }, [allSessions, activeRole, currentUser, adminSchools, teacherStudents, dashboardStats]);

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
    const approvalCheck = checkUserApprovalStatus(user.id, user.email, user.biNumber);
    const normalizedUser: UserAccount =
      user.status === 'pendente' && approvalCheck.status === 'ativo'
        ? {
            ...user,
            status: 'ativo',
            approvedAt: approvalCheck.app?.approvedAt || user.approvedAt,
            approvedBy: approvalCheck.app?.approvedBy || user.approvedBy,
          }
        : user;
    try {
      sessionStorage.setItem('ucore_session_active', 'true');
      localStorage.setItem('ucore_active_user', JSON.stringify(normalizedUser));
    } catch {
      // ignore
    }
    setCurrentUser(normalizedUser);
    saveUserToFirestore(normalizedUser).catch((err) =>
      console.error('[App] Erro ao gravar utilizador após login:', err)
    );
    if (normalizedUser.role === 'admin' || normalizedUser.role === 'diretor' || normalizedUser.role === 'professor') {
      setActiveRole(normalizedUser.role);
    }
    // Immediately synchronize all network collections upon login so any device sees the latest shared data
    syncApplicationsFromServer(true).catch((err) =>
      console.error('[App] Erro ao sincronizar candidaturas após login:', err)
    );
    syncSchoolsFromServer()
      .then((syncedSchools) => {
        if (Array.isArray(syncedSchools) && syncedSchools.length > 0) {
          setAdminSchools(syncedSchools);
        }
        try {
          const tRaw = localStorage.getItem('ucore_admin_teachers');
          if (tRaw) {
            const tParsed = JSON.parse(tRaw);
            if (Array.isArray(tParsed) && tParsed.length > 0) setAdminTeachers(tParsed);
          }
          const dRaw = localStorage.getItem('ucore_admin_directors');
          if (dRaw) {
            const dParsed = JSON.parse(dRaw);
            if (Array.isArray(dParsed) && dParsed.length > 0) setAdminDirectors(dParsed);
          }
          const sRaw = localStorage.getItem('ucore_admin_students');
          if (sRaw) {
            const sParsed = JSON.parse(sRaw);
            if (Array.isArray(sParsed) && sParsed.length > 0) setAdminStudents(sParsed);
          }
        } catch {}
        window.dispatchEvent(new CustomEvent('sigre-data-synced'));
        window.dispatchEvent(new CustomEvent('ucore-teachers-updated'));
      })
      .catch((err) =>
        console.error('[App] Erro ao sincronizar escolas após login:', err)
      );
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
      sessionStorage.removeItem('ucore_session_view');
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

  const handleUpdateCurrentUser = (updated: Partial<UserAccount>) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const nextUser: UserAccount = {
        ...prev,
        ...updated,
        greeting: updated.firstName
          ? `Olá ${prev.titlePrefix ? prev.titlePrefix + ' ' : ''}${updated.firstName}`
          : prev.greeting,
      };
      try {
        localStorage.setItem('ucore_active_user', JSON.stringify(nextUser));
      } catch {
        // ignore
      }
      saveUserToFirestore(nextUser).catch((err) =>
        console.warn('[App] Erro ao sincronizar perfil do utilizador no Firestore:', err)
      );
      return nextUser;
    });

    // Also refresh local state rosters if they were updated in localStorage
    try {
      const rawDirs = localStorage.getItem('sigre_admin_directors') || localStorage.getItem('ucore_admin_directors');
      if (rawDirs) {
        const parsedDirs = JSON.parse(rawDirs);
        if (Array.isArray(parsedDirs) && parsedDirs.length > 0) {
          setAdminDirectors(parsedDirs);
        }
      }
      const rawTeachers = localStorage.getItem('ucore_admin_teachers');
      if (rawTeachers) {
        const parsedTeachers = JSON.parse(rawTeachers);
        if (Array.isArray(parsedTeachers) && parsedTeachers.length > 0) {
          setAdminTeachers(parsedTeachers);
        }
      }
      const rawSchools = localStorage.getItem('ucore_admin_schools');
      if (rawSchools) {
        const parsedSchools = JSON.parse(rawSchools);
        if (Array.isArray(parsedSchools) && parsedSchools.length > 0) {
          setAdminSchools(parsedSchools);
        }
      }
    } catch {
      // ignore
    }
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
      if (pageId === 'perfil-professor') targetView = 'professor-perfil';
      if (pageId === 'perfil') targetView = getOwnProfileViewForUser(currentUser);
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
      if (
        pageId === 'cadastro-docente' ||
        pageId === 'pedido-vaga' ||
        pageId === 'pedidos-vaga'
      ) {
        targetView = 'cadastro-docente';
      }

      if (
        currentUser.role !== 'admin' &&
        (pageId === 'declaracao-efectividade' ||
          pageId === 'servicos-sigre' ||
          pageId === 'sigre-servicos' ||
          pageId === 'efectividade' ||
          pageId === 'mapa-efectividade' ||
          pageId === 'efectividade-branco' ||
          pageId === 'declaracao-servico' ||
          pageId === 'declaracao-de-servico' ||
          pageId === 'servico' ||
          pageId === 'guia-ferias' ||
          pageId === 'guia-de-ferias' ||
          pageId === 'guia-colocacao' ||
          pageId === 'ficha-avaliacao')
      ) {
        targetView =
          currentUser.role === 'diretor' || activeRole === 'diretor'
            ? 'diretor-servicos-rapidos'
            : 'servicos-rapidos';
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

    if (
      pageId === 'cadastro-docente' ||
      pageId === 'pedido-vaga' ||
      pageId === 'pedidos-vaga'
    ) {
      setCurrentView('cadastro-docente');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Quick Services & User Requests Routing (Serviços Rápidos & Efectividade)
    if (
      pageId === 'admin-servicos-rapidos' ||
      pageId === 'diretor-servicos-rapidos' ||
      pageId === 'servicos-rapidos' ||
      pageId === 'pedidos-rapidos' ||
      pageId === 'pedidos' ||
      pageId === 'servicos-rapidos-efectividade' ||
      pageId === 'pedidos-usuarios'
    ) {
      if (activeRole === 'admin') {
        setCurrentView('admin-servicos-rapidos');
      } else if (activeRole === 'diretor') {
        setCurrentView('diretor-servicos-rapidos');
      } else {
        setCurrentView('servicos-rapidos');
      }
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
      pageId === 'admin-aprovacoes' ||
      pageId === 'admin-inscricoes' ||
      pageId === 'admin-perfil'
    ) {
      setCurrentView(pageId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (activeRole === 'admin') {
      if (pageId === 'perfil') {
        setCurrentView('admin-perfil');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
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
      if (pageId === 'directores' || pageId === 'diretores') {
        setCurrentView('admin-directores');
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
      pageId === 'diretor-pautas' ||
      pageId === 'diretor-aprovacoes' ||
      pageId === 'diretor-inscricoes' ||
      pageId === 'diretor-perfil' ||
      pageId === 'diretor-presenca'
    ) {
      setCurrentView(pageId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (
      activeRole === 'diretor' &&
      (pageId === 'pautas' || pageId === 'mini-pautas' || pageId === 'pauta-final')
    ) {
      setCurrentView('diretor-pautas');
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
    if (
      pageId === 'declaracao-efectividade' ||
      pageId === 'servicos-sigre' ||
      pageId === 'sigre-servicos' ||
      pageId === 'efectividade' ||
      pageId === 'mapa-efectividade' ||
      pageId === 'efectividade-branco' ||
      pageId === 'declaracao-servico' ||
      pageId === 'declaracao-de-servico' ||
      pageId === 'servico' ||
      pageId === 'guia-ferias' ||
      pageId === 'guia-de-ferias' ||
      pageId === 'guia-colocacao' ||
      pageId === 'ficha-avaliacao'
    ) {
      if (currentUser?.role === 'admin' && activeRole === 'admin') {
        setCurrentView('declaracao-efectividade');
      } else if (currentUser?.role === 'diretor' || activeRole === 'diretor') {
        setCurrentView('diretor-servicos-rapidos');
      } else {
        setCurrentView('servicos-rapidos');
      }
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
          onModeChange={(newMode) => setCurrentPage(newMode)}
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
        currentView === 'not-found' ||
        currentView === 'servicos-rapidos' ||
        currentView === 'servicos-sem-login' ||
        currentView === 'servicos-cidadao' ||
        currentView === 'balcao-rapido' ||
        currentView === 'pedidos-rapidos';

      if (!isPublicView) {
        return (
          <PublicLandingPage
            onAcessarPlataforma={() => handleOpenAuth('login')}
            onOpenDemoModal={() => setIsDemoModalOpen(true)}
            onDirectLogin={(role) => handleDirectDemoLogin(role)}
            onOpenAbout={() => setInfoModalType('about')}
            onOpenSupport={() => setInfoModalType('support')}
            onOpenQuickServices={() => {
              setCurrentView('servicos-rapidos');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
            const activated: UserAccount = { ...updatedUser, status: 'ativo' };
            setCurrentUser(activated);
            try {
              localStorage.setItem('ucore_active_user', JSON.stringify(activated));
              const rawUsers = localStorage.getItem('ucore_registered_users');
              const parsed = rawUsers ? JSON.parse(rawUsers) : [];
              if (Array.isArray(parsed)) {
                const emailLow = (activated.email || '').trim().toLowerCase();
                let updatedExisting = false;
                const next = parsed.map((u: any) => {
                  if (u && (u.id === activated.id || (emailLow && String(u.email || '').trim().toLowerCase() === emailLow))) {
                    updatedExisting = true;
                    return { ...u, ...activated, status: 'ativo' };
                  }
                  return u;
                });
                if (!updatedExisting && emailLow) next.push(activated);
                localStorage.setItem('ucore_registered_users', JSON.stringify(next));
              }
            } catch {}
            saveUserToFirestore(activated).catch((err) =>
              console.warn('[App] Erro ao gravar ativação de conta no Firestore:', err)
            );
            showToast(`Conta ativada com sucesso! Bem-vindo(a) à plataforma Sigre, ${activated.firstName}.`);
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
          onNavigateToLogin={() => handleOpenAuth('login')}
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
          dashboardStats={dashboardStats}
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
            const nextSchools = saveRegisteredSchool(updated);
            setAdminSchools(nextSchools.length > 0 ? nextSchools : (prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
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
          directors={adminDirectors}
          teachers={adminTeachers}
          students={adminStudents}
          onNavigateToStatistics={() => {
            setCurrentView('admin-estatisticas');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectPage={handleSelectPage}
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
            setSettingsModalOpen(true);
          }}
          onOpenExcelExport={() => setIsExcelExportModalOpen(true)}
          onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
          onOpenBackupManager={() => setIsGlobalBackupModalOpen(true)}
          onOpenAuditLogs={() => setIsAuditLogsModalOpen(true)}
          onOpenRag={() => {
            setRagInitialQuery('');
            setIsRagModalOpen(true);
          }}
          onOpenRegisterModal={(type) => setAdminModalType(type)}
          sessionSettings={activeSession.settings}
          onSaveSessionSettings={handleSaveSettings}
          onUpdateCurrentUser={handleUpdateCurrentUser}
          initialTab={profileInitialTab}
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
            setAdminDirectors((prev) => {
              const dirEmail = (director.email || '').trim().toLowerCase();
              const filtered = prev.filter(
                (d) =>
                  d.id !== director.id &&
                  (!dirEmail || (d.email || '').trim().toLowerCase() !== dirEmail)
              );
              return [director, ...filtered];
            });
            if (director.schoolName) {
              setAdminSchools((prev) =>
                prev.map((sc) => {
                  if (schoolsMatch(sc.name, director.schoolName, sc.id)) {
                    return { ...sc, directorName: director.name };
                  }
                  return sc;
                })
              );
            }
            showToast(`Diretor(a) "${director.name}" homologado(a) no Sigre!`);
          }}
          onAddTeacherGlobal={(teacher) => {
            setAdminTeachers((prev) => {
              const tEmail = (teacher.email || '').trim().toLowerCase();
              const filtered = prev.filter(
                (t) =>
                  t.id !== teacher.id &&
                  (!tEmail || (t.email || '').trim().toLowerCase() !== tEmail)
              );
              return [teacher, ...filtered];
            });
            showToast(`Professor(a) "${teacher.name}" homologado(a) no Sigre!`);
          }}
          showToast={showToast}
        />
      );
    }

    // Quick Requests Internal Management Views for Admin and Director (Inside Serviços SIGRE tab)
    if (
      currentView === 'admin-servicos-rapidos' ||
      currentView === 'diretor-servicos-rapidos' ||
      (currentView === 'pedidos-rapidos' && Boolean(currentUser && (currentUser.role === 'admin' || currentUser.role === 'diretor')))
    ) {
      return (
        <DeclaracaoEfectividadePage
          onOpenGetStarted={() => handleOpenAuth('login')}
          isLoggedIn={isSessionStarted}
          currentUser={currentUser}
          initialTab="pedidos"
          onNavigateHome={() => {
            setCurrentView('home');
            setCurrentPage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
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
          schoolName={
            currentUser?.role === 'diretor'
              ? currentUser?.schoolName || adminSchools[0]?.name || ''
              : adminSchools[0]?.name || ''
          }
          schoolId={currentUser?.role === 'diretor' ? currentUser?.schoolId : adminSchools[0]?.id}
          onAddTeacherGlobal={(teacher) => {
            setAdminTeachers((prev) => [teacher, ...prev]);
            showToast(`Professor(a) "${teacher.name}" integrado(a) no quadro docente!`);
          }}
          onAddStudentGlobal={(student) => {
            setAdminStudents((prev) => [student, ...prev.filter((s) => s.id !== student.id)]);
            void saveStudentToFirestore(student);
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
          currentUser={currentUser}
          schools={adminSchools}
          teachers={adminTeachers}
          students={adminStudents}
          onOpenExcelExport={() => setIsExcelExportModalOpen(true)}
          onNavigateToRooms={() => {
            setCurrentView('diretor-salas');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToTeachers={() => {
            setCurrentView('diretor-professores');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToStudents={() => {
            setCurrentView('diretor-alunos');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      );
    }
    if (currentView === 'diretor-professores') {
      const directorSchoolName =
        currentUser?.schoolName ||
        adminSchools.find((s) => s.id === currentUser?.schoolId)?.name ||
        adminSchools[0]?.name ||
        '';
      const directorFullName = currentUser?.firstName
        ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
        : 'Director Escolar';
      return (
        <DirectorTeachersPage
          onOpenGetStarted={() => handleOpenAuth('login')}
          isLoggedIn={isSessionStarted}
          schoolName={directorSchoolName}
          directorName={directorFullName}
          onOpenExcelExport={() => setIsExcelExportModalOpen(true)}
          onNavigateToAttendance={() => {
            setCurrentView('diretor-presenca');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToApprovals={() => {
            setCurrentView('diretor-aprovacoes');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onAddTeacherGlobal={(teacher) => {
            const enrichedTeacher = {
              ...teacher,
              school: teacher.school || directorSchoolName,
            };
            setAdminTeachers((prev) => [
              enrichedTeacher,
              ...prev.filter((t) => t.id !== enrichedTeacher.id),
            ]);
            void saveTeacherToFirestore(enrichedTeacher);
            showToast(
              `Professor(a) "${enrichedTeacher.name}" cadastrado(a) e sincronizado(a) no relatório SIGE da escola e da Direção Municipal!`
            );
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
            setAdminStudents((prev) => [student, ...prev.filter((s) => s.id !== student.id)]);
            void saveStudentToFirestore(student);
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
          onNavigateToPautas={(classe, turma) => {
            if (classe || turma) {
              setDirectorPautaTarget({
                classe: classe || '4ª Classe',
                turma: turma || 'Turma A',
              });
            }
            setCurrentView('diretor-pautas');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      );
    }
    if (currentView === 'diretor-pautas') {
      return (
        <DirectorPautasPage
          onOpenGetStarted={() => handleOpenAuth('login')}
          isLoggedIn={isSessionStarted}
          schoolName={currentUser?.schoolName || adminSchools[0]?.name || 'Complexo Escolar Nº 1024 - Quêssua'}
          directorName={currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}` : 'Fert Horlan (Director da Escola)'}
          initialClasse={directorPautaTarget.classe}
          initialTurma={directorPautaTarget.turma}
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
            setProfileInitialTab('configuracoes');
            setProfileFocusZone(true);
            setSettingsTriggerCount((c) => c + 1);
          }}
          onUpdateCurrentUser={handleUpdateCurrentUser}
          initialTab={profileInitialTab}
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
              saveStudent({
                id: newStudent.id,
                name: newStudent.name,
                nomeCompleto: newStudent.name,
                genero: (newStudent.genero as string) === 'Masculino' || newStudent.genero === 'M' ? 'M' : 'F',
                dataNascimento: newStudent.dataNascimento || '2016-05-10',
                idade: newStudent.idade || 10,
                tipoDocumento: (newStudent.tipoDocumento as any) || (hasDocs ? 'BI' : 'sem Documento'),
                numeroDocumento: newStudent.numeroDocumento,
                naturezaEscola: 'Pública',
                tipoEscolaModalidade: 'primario_regular',
                classeEtapaModulo: newStudent.classe || '4.ª Classe',
                classe: newStudent.classe || '4ª Classe',
                turma: newStudent.turma || 'Turma A',
                sala: newStudent.sala || 'Sala 04',
                periodo: (newStudent.periodo as any) || 'Manhã',
                turno: (newStudent.periodo as any) || 'Manhã',
                escola: currentUser?.schoolName || newStudentData.escola || adminSchools[0]?.name || 'Escola Municipal de Quêssua',
                schoolId: currentUser?.schoolId || newStudentData.schoolId,
                condicaoMatricula: (newStudent.condicaoMatricula as any) || 'primeira_vez',
                alunoRepetente: newStudent.condicaoMatricula === 'repetente',
                encarregado: newStudent.encarregado || 'Encarregado de Educação',
                telefone: newStudent.telefone || '+244 923 000 000',
                endereco: newStudent.endereco || 'Quêssua, Malanje',
              });
              showToast(`Aluno(a) ${newStudent.name} matriculado(a) com sucesso!`);
            }}
            students={teacherStudents}
            schoolName={currentUser?.schoolName || adminSchools[0]?.name || ''}
            schoolId={currentUser?.schoolId}
            schools={adminSchools}
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
            onUpdateCurrentUser={handleUpdateCurrentUser}
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

    // Fluxo de Solicitação e Aprovação de Vagas (Cadastro Docente & Vagas)
    if (
      currentView === 'cadastro-docente' ||
      currentView === 'pedido-vaga' ||
      currentView === 'pedidos-vaga'
    ) {
      return (
        <DeclaracaoEfectividadePage
          onOpenGetStarted={() => handleOpenAuth('login')}
          isLoggedIn={isSessionStarted}
          currentUser={currentUser}
          initialTab="cadastro-docente"
          onNavigateHome={() => {
            setCurrentView('home');
            setCurrentPage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      );
    }

    // Declaração de Efectividade / Serviços SIGRE (Exclusivo para Administração Municipal)
    if (
      currentView === 'declaracao-efectividade' ||
      currentView === 'servicos-sigre' ||
      currentView === 'sigre-servicos' ||
      currentView === 'efectividade' ||
      currentView === 'mapa-efectividade' ||
      currentView === 'guia-ferias' ||
      currentView === 'guia-de-ferias' ||
      currentView === 'declaracao-servico' ||
      currentView === 'declaracao-de-servico' ||
      currentView === 'servico' ||
      currentView === 'guia-colocacao' ||
      currentView === 'ficha-avaliacao'
    ) {
      const isAdmin = Boolean(isSessionStarted && currentUser && currentUser.role === 'admin');

      if (!isAdmin) {
        if (isSessionStarted && currentUser?.role === 'diretor') {
          return (
            <DeclaracaoEfectividadePage
              onOpenGetStarted={() => handleOpenAuth('login')}
              isLoggedIn={isSessionStarted}
              currentUser={currentUser}
              initialTab="pedidos"
              onNavigateHome={() => {
                setCurrentView('home');
                setCurrentPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          );
        }

        return (
          <QuickServicesPage
            key="quick-services-page-non-admin"
            initialPageView="catalog"
            onNavigateHome={() => {
              setCurrentView('home');
              setCurrentPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToLogin={() => handleOpenAuth('login')}
            availableSchools={adminSchools}
          />
        );
      }

      const requestedInitialTab =
        currentView === 'guia-ferias' || currentView === 'guia-de-ferias'
          ? 'guia-ferias'
          : currentView === 'declaracao-servico' ||
            currentView === 'declaracao-de-servico' ||
            currentView === 'servico'
          ? 'declaracao-servico'
          : currentView === 'guia-colocacao'
          ? 'guia-colocacao'
          : currentView === 'ficha-avaliacao'
          ? 'ficha-avaliacao'
          : 'form';

      return (
        <DeclaracaoEfectividadePage
          onOpenGetStarted={() => handleOpenAuth('login')}
          isLoggedIn={isSessionStarted}
          currentUser={currentUser}
          initialTab={requestedInitialTab}
          onNavigateHome={() => {
            setCurrentView('home');
            setCurrentPage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // 8. Dedicated Full-Page Public Citizen Self-Service (Serviços Rápidos Sem Login)
    if (
      currentView === 'servicos-rapidos' ||
      currentView === 'servicos-sem-login' ||
      currentView === 'servicos-cidadao' ||
      currentView === 'balcao-rapido'
    ) {
      return (
        <QuickServicesPage
          key="quick-services-page-catalog"
          initialPageView="catalog"
          onNavigateHome={() => {
            setCurrentView('home');
            setCurrentPage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToLogin={() => handleOpenAuth('login')}
          availableSchools={adminSchools}
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
        <main className="flex-1 w-full bg-[#FAFAFA] relative">
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

          {/* Seção Principal: Assistente Inteligente IA & Central com AIInputWithLoading (Política Visual Dieter Rams) */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-12">
            <div className="rams-card text-center relative overflow-hidden">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] mb-6">
                Central de Pareceres & Análises Rápidas
              </h2>

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
                  className="text-xs font-semibold bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] px-3.5 py-1.5 rounded-[10px] border border-[#E5E5EA] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#1D1D1F]" />
                  <span>Pareceres & RAG Inteligente MED</span>
                </button>
                {activeRole === 'diretor' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('diretor-pautas');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-xs font-semibold bg-[#1D1D1F] hover:bg-black text-white px-3.5 py-1.5 rounded-[10px] border border-[#1D1D1F] transition-colors cursor-pointer"
                  >
                    Aba de Mini-Pautas & Pauta Final (Por Turma)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('diretor-presenca');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs font-semibold bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] px-3.5 py-1.5 rounded-[10px] border border-[#E5E5EA] transition-colors cursor-pointer"
                >
                  Abrir Livro de Ponto (Calendário)
                </button>
                <button
                  type="button"
                  onClick={() => handleHomeAICommand('Resumo de presenças dos professores')}
                  className="text-xs font-semibold bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] px-3.5 py-1.5 rounded-[10px] border border-[#E5E5EA] transition-colors cursor-pointer"
                >
                  Resumo de Presenças Docentes
                </button>
                <button
                  type="button"
                  onClick={() => handleHomeAICommand('Panorama de turmas e alunos')}
                  className="text-xs font-semibold bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] px-3.5 py-1.5 rounded-[10px] border border-[#E5E5EA] transition-colors cursor-pointer"
                >
                  Panorama Geral de Alunos
                </button>
              </div>

              {homeAIResponse && (
                <div className="mt-6 text-left p-4 sm:p-5 bg-[#F5F5F7] rounded-[14px] border border-[#E5E5EA] animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1D1D1F]">
                      <span className="w-2 h-2 rounded-full bg-[#1D1D1F]" />
                      <span>Resposta do Assistente Sigre:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRagInitialQuery('Consultar base normativa e regulamentar oficial');
                        setIsRagModalOpen(true);
                      }}
                      className="text-xs font-semibold text-[#0071E3] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#0071E3]" />
                      <span>Abrir Parecer RAG →</span>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-[#1D1D1F] whitespace-pre-line leading-relaxed">
                    {homeAIResponse}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Optional Academic Modules Section */}
          <Suspense fallback={null}>
            <CyanCardsSection onSelectModule={(module) => setSelectedModule(module)} />
          </Suspense>

          {/* School Team Showcase (Professores Cadastrados no Sistema) - Only on home dashboard when session is started */}
          {currentPage === 'home' && currentView === 'home' && isSessionStarted && (
            <Suspense fallback={null}>
              <SchoolTeamSection
                members={schoolMembers}
                title="Professores Cadastrados no Sistema"
                subtitle="Corpo docente oficial registado na rede escolar do município de Quêssua."
              />
            </Suspense>
          )}
        </main>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1F] flex flex-col font-sans selection:bg-[#1D1D1F] selection:text-white relative">
      {/* Toast Alert Notification (Posicionado no canto inferior direito com região viva acessível WCAG 4.1.3) */}
      {toastMessage && (
        <div 
          id="system-toast-notification"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#002133]/95 backdrop-blur-md text-white pl-4 pr-3 py-3 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.3)] border border-white/20 text-xs font-medium tracking-wide animate-in fade-in slide-in-from-bottom-5 flex items-center justify-between gap-3 pointer-events-auto"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#f75142] shrink-0" aria-hidden="true" />
            <span className="leading-snug">{toastMessage}</span>
          </div>
          <button
            id="btn-dismiss-toast"
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Fechar notificação"
            aria-label="Fechar notificação"
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
        onOpenBackupManager={() => setIsGlobalBackupModalOpen(true)}
        onOpenQuickServices={() => {
          setCurrentView('servicos-rapidos');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Routed View — instant mount with lightweight CSS fade (eliminates 400ms AnimatePresence wait lag) */}
      <div
        id="main-content"
        tabIndex={-1}
        key={
          !currentUser
            ? `public-${currentView}-${currentPage}`
            : currentPage === 'login' || currentPage === 'register'
            ? `auth-${currentPage}`
            : currentView === 'aluno-perfil'
            ? `aluno-perfil-${selectedStudent?.id || 'current'}`
            : `${activeRole}-${currentView}`
        }
        className="w-full flex-1 flex flex-col focus:outline-none animate-in fade-in duration-100"
      >
        <Suspense fallback={<RouteFallback />}>
          {renderCurrentView()}
        </Suspense>
      </div>

      {/* Organic Cloud Wave Footer (only visible when session is started) */}
      {isSessionStarted && (
        <Suspense fallback={null}>
          <CloudFooter
            onOpenAbout={() => {
              setCurrentView('sobre');
              scrollToTop(true);
            }}
            onOpenTerms={() => {
              setCurrentView('termos');
              scrollToTop(true);
            }}
            onOpenPrivacy={() => {
              setCurrentView('privacidade');
              scrollToTop(true);
            }}
            onOpenSecurity={() => {
              setCurrentView('seguranca');
              scrollToTop(true);
            }}
            onOpenCases={() => {
              setCurrentView('cases');
              scrollToTop(true);
            }}
            onOpenCookieSettings={() => window.dispatchEvent(new CustomEvent('open-ucore-cookie-preferences'))}
            onOpenSupport={() => setInfoModalType('support')}
          />
        </Suspense>
      )}

      {/* Cookie Consent Banner & Preferences Modal */}
      <Suspense fallback={null}>
        <CookieConsentBanner
          onNavigateToPrivacy={() => {
            setCurrentView('privacidade');
            scrollToTop(true);
          }}
          onNavigateToTerms={() => {
            setCurrentView('termos');
            scrollToTop(true);
          }}
          onNavigateToSecurity={() => {
            setCurrentView('seguranca');
            scrollToTop(true);
          }}
        />
      </Suspense>

      {/* Floating Support Chat Button (only visible when session is started) */}
      {isSessionStarted && (
        <Suspense fallback={null}>
          <FloatingChatButton
            onClick={() => setIsChatOpen(true)}
            unreadCount={unreadChatCount}
          />
        </Suspense>
      )}

      {/* Lazy-mounted Modals — rendered & bundled strictly when opened */}
      {isDemoModalOpen && (
        <Suspense fallback={null}>
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
              scrollToTop(true);
            }}
          />
        </Suspense>
      )}

      {selectedCard && (
        <Suspense fallback={null}>
          <StatDetailModal
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            roleTitle={activeSession.title}
          />
        </Suspense>
      )}

      {settingsModalOpen && (
        <Suspense fallback={null}>
          <SessionSettingsModal
            isOpen={settingsModalOpen}
            onClose={() => setSettingsModalOpen(false)}
            session={activeSession}
            onSaveSettings={handleSaveSettings}
          />
        </Suspense>
      )}

      {selectedModule && (
        <Suspense fallback={null}>
          <ModuleDetailModal
            module={selectedModule}
            onClose={() => setSelectedModule(null)}
            onOpenGetStarted={() => handleOpenAuth('login')}
            isLoggedIn={isSessionStarted}
          />
        </Suspense>
      )}

      {adminModalType !== null && (
        <Suspense fallback={null}>
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
              saveTeacherToFirestore(newTeacher).catch((err) =>
                console.warn('[App] Erro ao gravar docente no Firestore:', err)
              );
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
              saveStudentToFirestore(newStudent).catch((err) =>
                console.warn('[App] Erro ao gravar aluno no Firestore:', err)
              );
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
              saveDirectorToFirestore(newDirector).catch((err) =>
                console.warn('[App] Erro ao gravar director no Firestore:', err)
              );
              showToast(`Diretor(a) "${newDirector.name}" homologado(a) com sucesso!`);
            }}
            availableSchools={adminSchools.map((s) => s.name)}
            schools={adminSchools}
          />
        </Suspense>
      )}

      {infoModalType !== null && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {isExcelExportModalOpen && (
        <Suspense fallback={null}>
          <ExcelExportModal
            isOpen={isExcelExportModalOpen}
            onClose={() => setIsExcelExportModalOpen(false)}
            schools={adminSchools}
            teachers={adminTeachers}
            directors={adminDirectors}
            students={adminStudents}
            currentUser={currentUser}
            onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
          />
        </Suspense>
      )}

      {isGoogleSheetsModalOpen && (
        <Suspense fallback={null}>
          <GoogleSheetsModal
            isOpen={isGoogleSheetsModalOpen}
            onClose={() => setIsGoogleSheetsModalOpen(false)}
            schools={adminSchools}
            teachers={adminTeachers}
            directors={adminDirectors}
            students={adminStudents}
          />
        </Suspense>
      )}

      {isAuditLogsModalOpen && (
        <Suspense fallback={null}>
          <AdminAuditLogsModal
            isOpen={isAuditLogsModalOpen}
            onClose={() => setIsAuditLogsModalOpen(false)}
          />
        </Suspense>
      )}

      {isChatOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {activeMeeting.isOpen && (
        <Suspense fallback={null}>
          <ZoomMeetingModal
            isOpen={activeMeeting.isOpen}
            onClose={handleCloseMeeting}
            roomId={activeMeeting.roomId}
            roomTitle={activeMeeting.roomTitle}
            currentUser={currentUser}
            initialVideo={activeMeeting.initialVideo}
            initialAudio={activeMeeting.initialAudio}
          />
        </Suspense>
      )}

      {isRagModalOpen && (
        <Suspense fallback={null}>
          <RagIntelligenceModal
            isOpen={isRagModalOpen}
            onClose={() => setIsRagModalOpen(false)}
            currentUser={currentUser}
            activeRole={activeRole}
            initialQuery={ragInitialQuery}
          />
        </Suspense>
      )}

      {isGlobalBackupModalOpen && (
        <Suspense fallback={null}>
          <BackupManagerModal
            isOpen={isGlobalBackupModalOpen}
            onClose={() => setIsGlobalBackupModalOpen(false)}
            currentUser={currentUser}
          />
        </Suspense>
      )}
    </div>
  );
}
