import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Building,
  Award,
  Settings,
  FileSpreadsheet,
  Edit3,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Landmark,
  UserPlus,
  Plus,
  X,
  Check,
  Archive,
  Lock,
  Bell,
  IdCard,
  User,
  ChevronRight,
  ClipboardCheck,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { ProfilePhotoUploader } from '../../ProfilePhotoUploader';
import {
  ProfileOptionsSection,
  UserProfileData,
  ProfileModalType,
} from '../../profile/ProfileOptionsSection';
import { AccessDeniedGuard } from '../../common/AccessDeniedGuard';
import { syncApplicationsFromServer } from '../../../utils/authApprovalStorage';
import type {
  AdminSchool,
  AdminDirector,
  AdminTeacher,
  AdminStudent,
  AdminStaffRole,
  UserAccount,
  SessionSettings,
} from '../../../types';
import type { AdminModalType } from './AdminRegistrationModal';

interface AdminProfilePageProps {
  onOpenGetStarted: () => void;
  schools: AdminSchool[];
  directors?: AdminDirector[];
  teachers?: AdminTeacher[];
  students?: AdminStudent[];
  onNavigateToStatistics: () => void;
  onSelectPage?: (pageId: string) => void;
  isLoggedIn?: boolean;
  currentUser?: UserAccount | null;
  onNavigateToOwnProfile?: () => void;
  onBackToHome?: () => void;
  onLogout?: () => void;
  onOpenSettings?: () => void;
  onOpenExcelExport?: () => void;
  onOpenGoogleSheets?: () => void;
  onOpenBackupManager?: () => void;
  onOpenAuditLogs?: () => void;
  onOpenRag?: () => void;
  onOpenRegisterModal?: (type: AdminModalType) => void;
  sessionSettings?: SessionSettings;
  onSaveSessionSettings?: (updated: SessionSettings) => void;
  initialTab?: 'visao-geral' | 'configuracoes';
  focusZone?: boolean;
  settingsTrigger?: number;
}

export interface DMEStaffMember {
  id: string;
  name: string;
  role: AdminStaffRole;
  cargoTitle: string;
  department: string;
  email: string;
  phone: string;
  status: 'Ativo' | 'Em Exercício';
}

const DEFAULT_DME_STAFF: DMEStaffMember[] = [];

const STORAGE_KEY_DME_STAFF = 'ucore_dme_staff_list';
const STORAGE_KEY_ADMIN_AVATAR = 'ucore_admin_avatar';
const STORAGE_KEY_ADMIN_DATA = 'ucore_admin_profile_data';

export const AdminProfilePage: React.FC<AdminProfilePageProps> = ({
  schools,
  directors = [],
  teachers = [],
  students = [],
  onNavigateToStatistics,
  onSelectPage,
  currentUser,
  onNavigateToOwnProfile,
  onBackToHome,
  onLogout,
  onOpenSettings,
  onOpenExcelExport,
  onOpenBackupManager,
  onOpenAuditLogs,
  initialTab,
  focusZone,
  settingsTrigger,
}) => {
  // 1. Strict Security Guard: User can NEVER enter or modify someone else's profile
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <AccessDeniedGuard
        currentUser={currentUser}
        attemptedView="admin-perfil"
        reason={`A sua conta (${currentUser.firstName} • ${currentUser.role.toUpperCase()}) não possui privilégios de Administração Geral. Cada utilizador tem acesso estrito e exclusivo apenas ao seu próprio perfil.`}
        onNavigateToOwnProfile={onNavigateToOwnProfile || (() => {})}
        onBackToHome={onBackToHome || (() => {})}
        onLogout={onLogout || (() => {})}
      />
    );
  }

  const [activeTab, setActiveTab] = useState<'visao-geral' | 'configuracoes'>(
    initialTab || 'visao-geral'
  );
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    let mounted = true;
    syncApplicationsFromServer()
      .then((all) => {
        if (!mounted) return;
        const pending = all.filter((a) => a.status === 'pendente').length;
        setPendingApprovalsCount(pending);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const userAdminAvatarKey = currentUser?.id
    ? `${STORAGE_KEY_ADMIN_AVATAR}_${currentUser.id}`
    : STORAGE_KEY_ADMIN_AVATAR;

  const userAdminDataKey = currentUser?.id
    ? `${STORAGE_KEY_ADMIN_DATA}_${currentUser.id}`
    : STORAGE_KEY_ADMIN_DATA;

  useEffect(() => {
    if (focusZone || settingsTrigger) {
      setActiveTab('configuracoes');
      const timer = setTimeout(() => {
        const el = document.getElementById('zona-dados-senha');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [focusZone, settingsTrigger]);

  const [adminPhoto, setAdminPhoto] = useState<string | null>(() => {
    try {
      return localStorage.getItem(userAdminAvatarKey) || currentUser?.avatarUrl || null;
    } catch {
      return currentUser?.avatarUrl || null;
    }
  });

  const [activeModal, setActiveModal] = useState<ProfileModalType>(null);

  // DME Staff state with persistence
  const [dmeStaff, setDmeStaff] = useState<DMEStaffMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DME_STAFF);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_DME_STAFF;
  });

  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<AdminStaffRole>('inspetor_escolar');
  const [newStaffDept, setNewStaffDept] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');

  const getRoleTitle = (role: AdminStaffRole): string => {
    switch (role) {
      case 'diretor_municipal':
        return 'Director(a) Municipal da Educação';
      case 'inspetor_escolar':
        return 'Inspetor(a) Escolar Municipal';
      case 'chefe_reparticao':
        return 'Chefe de Repartição / Ensino Geral';
      case 'tecnico_estatistica':
        return 'Técnico(a) de Planeamento & Estatística';
      case 'admin_sistema':
        return 'Administrador(a) Geral do Sistema Sigre';
      default:
        return 'Funcionário da Administração';
    }
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const newMember: DMEStaffMember = {
      id: 'dme-' + Date.now(),
      name: newStaffName.trim(),
      role: newStaffRole,
      cargoTitle: getRoleTitle(newStaffRole),
      department: newStaffDept.trim() || 'Direcção Municipal da Educação de Quêssua',
      email:
        newStaffEmail.trim() ||
        `${newStaffName.toLowerCase().replace(/\s+/g, '.')}@sigre.edu.ao`,
      phone: newStaffPhone.trim() || '+244 923 000 000',
      status: 'Ativo',
    };

    const updated = [newMember, ...dmeStaff];
    setDmeStaff(updated);
    try {
      localStorage.setItem(STORAGE_KEY_DME_STAFF, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setNewStaffName('');
    setNewStaffDept('');
    setNewStaffEmail('');
    setNewStaffPhone('');
    setIsAddStaffModalOpen(false);
  };

  const handleDeleteStaff = (id: string) => {
    const updated = dmeStaff.filter((s) => s.id !== id);
    setDmeStaff(updated);
    try {
      localStorage.setItem(STORAGE_KEY_DME_STAFF, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const buildDefaultAdminProfile = (user?: UserAccount | null): UserProfileData => {
    const fullName = user
      ? `${user.firstName} ${user.lastName}`.trim()
      : 'Dr. Belízio Miguel dos Santos António';
    const isGenericName =
      fullName === 'Director Municipal da Educação' ||
      fullName === 'Dr. Fred Silva' ||
      fullName === 'Admin. Fred';
    const resolvedName = isGenericName
      ? 'Dr. Belízio Miguel dos Santos António'
      : fullName;

    return {
      name: resolvedName,
      email: user?.email || 'dmedoquessua@gmail.com',
      phone: user?.phone || '+244 923 450 110',
      roleTitle:
        user?.cargoTitle ||
        'Administrador Geral & Director Municipal da Educação de Quêssua',
      schoolName:
        user?.schoolName ||
        'Direcção Municipal da Educação de Quêssua',
      biNumber: user?.biNumber || '005481920ME031',
      address: 'Sede da Direcção Municipal da Educação de Quêssua, Malanje',
    };
  };

  const [adminData, setAdminData] = useState<UserProfileData>(() => {
    const fallback = buildDefaultAdminProfile(currentUser);
    try {
      const saved = localStorage.getItem(userAdminDataKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.name === 'Dr. Fred Silva' ||
          parsed.name === 'Admin. Fred' ||
          parsed.email === 'fred.admin@ucore.edu.ao' ||
          parsed.email === 'diretor.municipal@sigre.edu.ao'
        ) {
          return fallback;
        }
        return { ...fallback, ...parsed };
      }
    } catch {
      // ignore
    }
    return fallback;
  });

  useEffect(() => {
    if (!currentUser) return;
    setAdminData((prev) => {
      const isLegacy =
        prev.name === 'Dr. Fred Silva' ||
        prev.name === 'Admin. Fred' ||
        prev.email === 'fred.admin@ucore.edu.ao';
      if (isLegacy) {
        return buildDefaultAdminProfile(currentUser);
      }
      return prev;
    });
  }, [currentUser]);

  const handleUpdateAdminData = (updated: Partial<UserProfileData>) => {
    const next = {
      ...adminData,
      ...updated,
      avatar: updated.avatar !== undefined ? updated.avatar : adminPhoto,
    };
    setAdminData(next);
    if (updated.avatar !== undefined) {
      setAdminPhoto(updated.avatar);
      try {
        if (updated.avatar) localStorage.setItem(userAdminAvatarKey, updated.avatar);
        else localStorage.removeItem(userAdminAvatarKey);
      } catch {
        // ignore
      }
    }
    try {
      localStorage.setItem(userAdminDataKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handlePhotoChange = (newPhoto: string | null) => {
    setAdminPhoto(newPhoto);
    setAdminData((prev) => ({ ...prev, avatar: newPhoto }));
    try {
      if (newPhoto) {
        localStorage.setItem(userAdminAvatarKey, newPhoto);
      } else {
        localStorage.removeItem(userAdminAvatarKey);
      }
    } catch {
      // ignore
    }
  };

  const totalStudents =
    students.length > 0
      ? students.length
      : schools.reduce((acc, s) => acc + s.studentsWithDocs + s.studentsWithoutDocs, 0);
  const totalTeachers =
    teachers.length > 0
      ? teachers.length
      : schools.reduce((acc, s) => acc + s.teachersCount, 0);
  const totalDirectors =
    directors.length > 0 ? directors.length : schools.length;

  const initials =
    adminData.name
      .replace(/^Dr\.?\s+/i, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || 'AG';

  return (
    <div id="admin-profile-page" className="w-full min-h-screen bg-[#f8f9fa]">
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10 space-y-6">
        {/* Top Navigation & Sub-View Switcher (Clean, uncluttered toolbar matching TeacherProfilePage) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-[#002133] hover:bg-gray-50 font-medium text-xs transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#002133]" />
                <span>Voltar ao painel</span>
              </button>
            )}

            <div className="inline-flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('visao-geral')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'visao-geral'
                    ? 'bg-white text-[#002133] shadow-xs'
                    : 'text-gray-600 hover:text-[#002133]'
                }`}
              >
                Visão geral
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('configuracoes')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'configuracoes'
                    ? 'bg-white text-[#002133] shadow-xs'
                    : 'text-gray-600 hover:text-[#002133]'
                }`}
              >
                Configurações
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveModal('manage-profile')}
              className="px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-[#002133] hover:bg-gray-50 font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-gray-500" />
              <span>Editar perfil</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToStatistics}
              className="px-4 py-2 rounded-lg bg-[#002133] hover:bg-[#003049] text-white font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#f75142]" />
              <span>Estatísticas da rede</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Clean Profile Heading Card */}
        <section
          id="admin-profile-summary"
          aria-label="Resumo do Perfil do Administrador Geral"
          className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200"
        >
          <div className="flex flex-col-reverse sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex-1 text-center sm:text-left min-w-0">
              <p className="text-xs font-medium text-gray-500 mb-1">
                Administrador Geral • Direcção Municipal da Educação de Quêssua
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#002133] tracking-tight truncate">
                {adminData.name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">{adminData.roleTitle}</p>

              {/* Contact & Identity Row — Unboxed inline text */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {adminData.email}
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {adminData.phone}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-gray-400" />
                  {adminData.schoolName}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center shrink-0">
              <ProfilePhotoUploader
                id="admin-photo-uploader"
                photo={adminPhoto}
                onPhotoChange={handlePhotoChange}
                fallbackInitials={initials}
                shape="square"
                badgePosition="bottom-right"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-[#002133] text-white font-bold text-3xl flex items-center justify-center border border-gray-200"
              />
              <span className="text-[11px] text-gray-400 mt-1.5">
                {adminPhoto ? 'Clique para alterar foto' : 'Adicionar foto'}
              </span>
            </div>
          </div>
        </section>

        {/* Key Indicators Bar — Single clean horizontal strip with dividers */}
        <section
          aria-label="Indicadores da Rede Municipal"
          className="bg-white rounded-xl border border-gray-200 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 grid grid-cols-2 sm:grid-cols-5"
        >
          <button
            type="button"
            onClick={() => onSelectPage && onSelectPage('admin-escolas')}
            className="p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span className="text-[11px] text-gray-500 block">Escolas da Rede</span>
            <p className="text-lg font-bold text-[#002133] mt-1 font-mono tabular-nums">
              {schools.length}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectPage && onSelectPage('admin-directores')}
            className="p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span className="text-[11px] text-gray-500 block">Directores</span>
            <p className="text-lg font-bold text-[#002133] mt-1 font-mono tabular-nums">
              {totalDirectors}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectPage && onSelectPage('admin-professores')}
            className="p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span className="text-[11px] text-gray-500 block">Professores</span>
            <p className="text-lg font-bold text-[#002133] mt-1 font-mono tabular-nums">
              {totalTeachers}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectPage && onSelectPage('admin-alunos')}
            className="p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span className="text-[11px] text-gray-500 block">Estudantes</span>
            <p className="text-lg font-bold text-[#002133] mt-1 font-mono tabular-nums">
              {totalStudents.toLocaleString('pt-AO')}
            </p>
          </button>

          <div className="p-4 sm:p-5 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-gray-500 block">B.I. / Registo</span>
            <p className="text-sm font-bold text-[#002133] mt-1.5 font-mono truncate">
              {adminData.biNumber}
            </p>
          </div>
        </section>

        {/* Main Content Area: Overview vs Full Settings */}
        {activeTab === 'visao-geral' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (8 cols): Institutional Governance Details & DME Staff */}
            <div className="lg:col-span-8 space-y-6">
              {/* Dados Institucionais da Administração Geral */}
              <section
                id="admin-institutional-details"
                aria-label="Dados Institucionais do Administrador Geral"
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#002133]">
                      Dados Institucionais & Governação
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Credenciais oficiais do Administrador Geral na Direcção Municipal
                    </p>
                  </div>
                  <Landmark className="w-4 h-4 text-gray-400" />
                </div>

                <div className="divide-y divide-gray-100 text-sm">
                  <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs text-gray-500">Órgão de Tutela</span>
                    <span className="font-semibold text-[#002133]">
                      Governo Provincial de Malanje • Administração Municipal
                    </span>
                  </div>
                  <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs text-gray-500">Repartição Central</span>
                    <span className="font-semibold text-[#002133]">
                      {adminData.schoolName}
                    </span>
                  </div>
                  <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs text-gray-500">Cargo Homologado</span>
                    <span className="font-semibold text-[#002133]">
                      {adminData.roleTitle}
                    </span>
                  </div>
                  <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs text-gray-500">Nível de Acesso no Sistema</span>
                    <span className="font-semibold text-[#002133] inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#f75142]" />
                      Administrador Geral (Controlo Total da Rede)
                    </span>
                  </div>
                  <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs text-gray-500">Localização</span>
                    <span className="font-semibold text-[#002133]">
                      {adminData.address}
                    </span>
                  </div>
                </div>
              </section>

              {/* Quadro da Direcção Municipal (DME) */}
              <section
                id="admin-dme-staff-section"
                aria-label="Quadro de Funcionários da Direcção Municipal da Educação"
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[#002133]">
                      Quadro da Direcção Municipal (DME)
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Inspectores, chefes de repartição e técnicos vinculados ao gabinete
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddStaffModalOpen(true)}
                    className="px-3.5 py-2 rounded-lg bg-[#002133] hover:bg-[#003049] text-white font-medium text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#f75142]" />
                    <span>Cadastrar funcionário</span>
                  </button>
                </div>

                {dmeStaff.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm font-medium text-[#002133]">
                      Nenhum funcionário técnico listado na DME
                    </p>
                    <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                      Adicione inspectores escolares, chefes de repartição ou técnicos de estatística da Direcção Municipal.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {dmeStaff.map((member) => (
                      <div
                        key={member.id}
                        className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#002133] truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {member.cargoTitle} • {member.department}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">
                            {member.email} · {member.phone}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(member.id)}
                          title="Remover funcionário"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column (4 cols): Clean Account, Profile & System Settings Card (Exact same pattern as TeacherProfilePage + Admin actions) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-[#002133]">
                    Conta & Configurações
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Opções do perfil e ferramentas do Administrador Geral
                  </p>
                </div>

                <div className="divide-y divide-gray-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal('manage-profile')}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-400 group-hover:text-[#002133]" />
                      <span className="text-xs font-medium text-[#002133]">
                        Gerir perfil
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModal('personal-info')}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <IdCard className="w-4 h-4 text-gray-400 group-hover:text-[#002133]" />
                      <span className="text-xs font-medium text-[#002133]">
                        Informações pessoais
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModal('notifications')}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-gray-400 group-hover:text-[#002133]" />
                      <span className="text-xs font-medium text-[#002133]">
                        Notificações
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModal('change-password')}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-gray-400 group-hover:text-[#002133]" />
                      <span className="text-xs font-medium text-[#002133]">
                        Alterar palavra-passe
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>

                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="w-4 h-4 text-gray-400 group-hover:text-[#002133]" />
                        <span className="text-xs font-medium text-[#002133]">
                          Definições da sessão
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  )}

                  {onSelectPage && (
                    <button
                      type="button"
                      onClick={() => onSelectPage('admin-aprovacoes')}
                      className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <ClipboardCheck className="w-4 h-4 text-gray-400 group-hover:text-[#002133]" />
                        <span className="text-xs font-medium text-[#002133]">
                          Homologações de contas
                          {pendingApprovalsCount > 0
                            ? ` (${pendingApprovalsCount})`
                            : ''}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  )}

                  {onSelectPage && (
                    <button
                      type="button"
                      onClick={() => onSelectPage('declaracao-efectividade')}
                      className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-400 group-hover:text-[#002133]" />
                        <span className="text-xs font-medium text-[#002133]">
                          Declarações de efectividade
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  )}

                  {onOpenBackupManager && (
                    <button
                      type="button"
                      onClick={onOpenBackupManager}
                      className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Archive className="w-4 h-4 text-gray-400 group-hover:text-[#002133]" />
                        <span className="text-xs font-medium text-[#002133]">
                          Cofre de backups
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  )}

                  {onOpenAuditLogs && (
                    <button
                      type="button"
                      onClick={onOpenAuditLogs}
                      className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="w-4 h-4 text-gray-400 group-hover:text-[#002133]" />
                        <span className="text-xs font-medium text-[#002133]">
                          Registos de auditoria
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  )}

                  {onOpenExcelExport && (
                    <button
                      type="button"
                      onClick={onOpenExcelExport}
                      className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-4 h-4 text-gray-400 group-hover:text-[#002133]" />
                        <span className="text-xs font-medium text-[#002133]">
                          Exportar dados Excel
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Full-width Settings View when "Configurações" tab is selected */
          <div id="zona-dados-senha" className="scroll-mt-24 bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
            <div className="pb-4 mb-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#002133]">
                  Configurações da Conta & Segurança
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Edite os dados oficiais do Administrador Geral, contactos e palavra-passe de acesso.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('visao-geral')}
                className="text-xs font-semibold text-[#f75142] hover:underline cursor-pointer"
              >
                Voltar à visão geral
              </button>
            </div>

            <ProfileOptionsSection
              user={{
                name: adminData.name,
                email: adminData.email,
                phone: adminData.phone,
                roleTitle: adminData.roleTitle,
                avatar: adminPhoto,
                schoolName: adminData.schoolName,
                biNumber: adminData.biNumber,
                address: adminData.address,
              }}
              onUpdateUser={handleUpdateAdminData}
              showBackHeader={false}
              hideProfileHeaderCard={true}
              externalActiveModal={activeModal}
              onCloseExternalModal={() => setActiveModal(null)}
            />
          </div>
        )}

        {/* Mount ProfileOptionsSection modals invisibly when in Overview tab */}
        {activeTab === 'visao-geral' && (
          <ProfileOptionsSection
            user={{
              name: adminData.name,
              email: adminData.email,
              phone: adminData.phone,
              roleTitle: adminData.roleTitle,
              avatar: adminPhoto,
              schoolName: adminData.schoolName,
              biNumber: adminData.biNumber,
              address: adminData.address,
            }}
            onUpdateUser={handleUpdateAdminData}
            externalActiveModal={activeModal}
            onCloseExternalModal={() => setActiveModal(null)}
            modalsOnly={true}
          />
        )}
      </main>

      {/* Modal: Cadastrar Funcionário da DME */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl w-full max-w-lg border border-gray-200 overflow-hidden">
            <div className="bg-[#002133] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-[#f75142]" />
                <div>
                  <h3 className="text-sm font-bold">
                    Cadastrar Funcionário da DME
                  </h3>
                  <p className="text-xs text-gray-300">
                    Direcção Municipal da Educação de Quêssua
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#002133] mb-1.5">
                  Cargo / Função na Administração *
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as AdminStaffRole)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-sm text-[#002133] focus:outline-hidden focus:border-[#002133]"
                >
                  <option value="diretor_municipal">
                    Director(a) Municipal da Educação
                  </option>
                  <option value="inspetor_escolar">
                    Inspetor(a) Escolar Municipal
                  </option>
                  <option value="chefe_reparticao">
                    Chefe de Repartição / Ensino Geral
                  </option>
                  <option value="tecnico_estatistica">
                    Técnico(a) de Planeamento & Estatística
                  </option>
                  <option value="admin_sistema">
                    Administrador(a) Geral do Sistema Sigre
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#002133] mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Ex: Dra. Helena Sebastião"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-sm text-[#002133] focus:outline-hidden focus:border-[#002133]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#002133] mb-1.5">
                  Repartição / Gabinete
                </label>
                <input
                  type="text"
                  value={newStaffDept}
                  onChange={(e) => setNewStaffDept(e.target.value)}
                  placeholder="Ex: Repartição de Inspecção Escolar"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-sm text-[#002133] focus:outline-hidden focus:border-[#002133]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#002133] mb-1.5">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="nome@sigre.edu.ao"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-sm text-[#002133] focus:outline-hidden focus:border-[#002133]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#002133] mb-1.5">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    placeholder="+244 923 000 000"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-sm text-[#002133] focus:outline-hidden focus:border-[#002133]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#002133] hover:bg-[#003049] text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
