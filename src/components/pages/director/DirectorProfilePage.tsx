import React, { useState, useEffect } from 'react';
import { User, Users, Phone, Building, Clock, ShieldCheck, Mail, MapPin, Edit3, CheckCircle2, School, GraduationCap, Settings, Lock } from 'lucide-react';
import { Hero } from '../../Hero';
import { ProfilePhotoUploader } from '../../ProfilePhotoUploader';
import { ProfileOptionsSection, UserProfileData } from '../../profile/ProfileOptionsSection';
import { AccessDeniedGuard } from '../../common/AccessDeniedGuard';
import { directorProfileData as initialProfile } from '../../../data/directorData';
import { syncUpdatedUserProfileAcrossSystem } from '../../../utils/authApprovalStorage';
import type { DirectorProfileInfo, UserAccount } from '../../../types';

interface DirectorProfilePageProps {
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
  currentUser?: UserAccount | null;
  onOpenSettings?: () => void;
  onNavigateToOwnProfile?: () => void;
  onBackToHome?: () => void;
  onLogout?: () => void;
  onUpdateCurrentUser?: (updated: Partial<UserAccount>) => void;
  initialTab?: 'visao-geral' | 'configuracoes';
  focusZone?: boolean;
  settingsTrigger?: number;
}

type ExtendedDirectorProfile = DirectorProfileInfo & {
  roleTitle?: string;
  biNumber?: string;
  agentNumber?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
};

const STORAGE_KEY_DIRECTOR = 'ucore_director_profile';

export const DirectorProfilePage: React.FC<DirectorProfilePageProps> = ({
  onOpenGetStarted,
  isLoggedIn,
  currentUser,
  onOpenSettings,
  onNavigateToOwnProfile,
  onBackToHome,
  onLogout,
  onUpdateCurrentUser,
  initialTab,
  focusZone,
  settingsTrigger,
}) => {
  // 1. Strict Security Guard: User can NEVER enter or modify someone else's profile
  if (currentUser && currentUser.role !== 'diretor') {
    return (
      <AccessDeniedGuard
        currentUser={currentUser}
        attemptedView="diretor-perfil"
        reason={`A sua conta (${currentUser.firstName} • ${currentUser.role.toUpperCase()}) não tem permissão para aceder ao Perfil da Direção Escolar. Cada utilizador tem acesso estrito e exclusivo apenas ao seu próprio perfil.`}
        onNavigateToOwnProfile={onNavigateToOwnProfile || (() => {})}
        onBackToHome={onBackToHome || (() => {})}
        onLogout={onLogout || (() => {})}
      />
    );
  }

  const [activeTab, setActiveTab] = useState<'visao-geral' | 'configuracoes'>(
    initialTab || 'visao-geral'
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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

  const userStorageKey = currentUser?.id
    ? `${STORAGE_KEY_DIRECTOR}_${currentUser.id}`
    : STORAGE_KEY_DIRECTOR;

  const loadDirectorProfile = (user?: UserAccount | null): ExtendedDirectorProfile => {
    const key = user?.id ? `${STORAGE_KEY_DIRECTOR}_${user.id}` : STORAGE_KEY_DIRECTOR;
    const base: ExtendedDirectorProfile = {
      ...initialProfile,
      name: user ? `${user.firstName} ${user.lastName}`.trim() : initialProfile.name,
      email: user?.email || initialProfile.email,
      phone: user?.phone || initialProfile.phone,
      schoolName: user?.schoolName || initialProfile.schoolName,
      avatar: user?.avatar || user?.avatarUrl || initialProfile.avatar,
      roleTitle: user?.cargoTitle || 'Diretor Geral • Gestão Escolar',
      biNumber: user?.biNumber || '007294102ME048',
      agentNumber: user?.numeroMecanograficoOuNif || 'DIR-AG-2026',
      address: 'Bairro Sede, Quêssua, Malanje',
    };
    try {
      const saved = localStorage.getItem(key) || localStorage.getItem(STORAGE_KEY_DIRECTOR);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...base, ...parsed };
      }
    } catch {
      // fallback
    }
    return base;
  };

  const [profile, setProfile] = useState<ExtendedDirectorProfile>(() =>
    loadDirectorProfile(currentUser)
  );

  useEffect(() => {
    if (!currentUser) return;
    setProfile(loadDirectorProfile(currentUser));
  }, [currentUser?.id]);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [editBiNumber, setEditBiNumber] = useState(profile.biNumber || '');
  const [editAgentNumber, setEditAgentNumber] = useState(profile.agentNumber || '');
  const [editSchoolName, setEditSchoolName] = useState(profile.schoolName);
  const [editPeriods, setEditPeriods] = useState(String(profile.periods || 2));
  const [editClassesCount, setEditClassesCount] = useState(String(profile.classesCount || 9));
  const [editRoomsCount, setEditRoomsCount] = useState(String(profile.roomsCount || 12));
  const [editTurmasCount, setEditTurmasCount] = useState(String(profile.turmasCount || 18));

  const openEditModal = () => {
    setEditName(profile.name);
    setEditPhone(profile.phone);
    setEditEmail(profile.email);
    setEditBiNumber(profile.biNumber || '');
    setEditAgentNumber(profile.agentNumber || '');
    setEditSchoolName(profile.schoolName);
    setEditPeriods(String(profile.periods || 2));
    setEditClassesCount(String(profile.classesCount || 9));
    setEditRoomsCount(String(profile.roomsCount || 12));
    setEditTurmasCount(String(profile.turmasCount || 18));
    setIsEditing(true);
  };

  const persistProfile = (updated: ExtendedDirectorProfile) => {
    setProfile(updated);
    try {
      localStorage.setItem(userStorageKey, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEY_DIRECTOR, JSON.stringify(updated));
    } catch {
      // ignore
    }
    const syncedPatch = syncUpdatedUserProfileAcrossSystem(currentUser, {
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      roleTitle: updated.roleTitle,
      biNumber: updated.biNumber,
      agentNumber: updated.agentNumber,
      schoolName: updated.schoolName,
      avatar: updated.avatar,
      birthDate: updated.birthDate,
      gender: updated.gender,
      address: updated.address,
      emergencyContact: updated.emergencyContact,
      emergencyPhone: updated.emergencyPhone,
    });
    onUpdateCurrentUser?.(syncedPatch);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ExtendedDirectorProfile = {
      ...profile,
      name: editName.trim() || profile.name,
      phone: editPhone.trim() || profile.phone,
      email: editEmail.trim() || profile.email,
      biNumber: editBiNumber.trim() || profile.biNumber,
      agentNumber: editAgentNumber.trim() || profile.agentNumber,
      schoolName: editSchoolName.trim() || profile.schoolName,
      periods: Number(editPeriods) || profile.periods,
      classesCount: Number(editClassesCount) || profile.classesCount,
      roomsCount: Number(editRoomsCount) || profile.roomsCount,
      turmasCount: Number(editTurmasCount) || profile.turmasCount,
    };
    persistProfile(updated);
    setIsEditing(false);
  };

  const handlePhotoChange = (newPhoto: string | null) => {
    const updated: ExtendedDirectorProfile = {
      ...profile,
      avatar: newPhoto || undefined,
    };
    persistProfile(updated);
  };

  const handleUpdateDirectorUser = (updated: Partial<UserProfileData>) => {
    const next: ExtendedDirectorProfile = {
      ...profile,
      name: updated.name !== undefined ? updated.name : profile.name,
      email: updated.email !== undefined ? updated.email : profile.email,
      phone: updated.phone !== undefined ? updated.phone : profile.phone,
      roleTitle: updated.roleTitle !== undefined ? updated.roleTitle : profile.roleTitle,
      avatar: updated.avatar !== undefined ? (updated.avatar || undefined) : profile.avatar,
      schoolName: updated.schoolName !== undefined ? updated.schoolName : profile.schoolName,
      biNumber: updated.biNumber !== undefined ? updated.biNumber : profile.biNumber,
      agentNumber: updated.agentNumber !== undefined ? updated.agentNumber : profile.agentNumber,
      birthDate: updated.birthDate !== undefined ? updated.birthDate : profile.birthDate,
      gender: updated.gender !== undefined ? updated.gender : profile.gender,
      address: updated.address !== undefined ? updated.address : profile.address,
      emergencyContact:
        updated.emergencyContact !== undefined ? updated.emergencyContact : profile.emergencyContact,
      emergencyPhone:
        updated.emergencyPhone !== undefined ? updated.emergencyPhone : profile.emergencyPhone,
    };
    persistProfile(next);
  };

  return (
    <div id="director-profile-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Hero: "Perfil do Director" */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Perfil do Director"
        customSubtitle=""
      />

      {/* Top Navigation & Tab Switcher */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Direção Escolar • {profile.schoolName}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('visao-geral')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'visao-geral'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visão geral
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('configuracoes')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'configuracoes'
                  ? 'bg-white text-[#f75142] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Configurações
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {activeTab === 'visao-geral' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch mb-8">
            {/* Left Column: Profile Card with circular User badge */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="relative bg-[#f75142] text-white rounded-3xl pt-14 pb-10 px-6 text-center shadow-[0_15px_35px_rgba(247,81,66,0.25)] flex flex-col items-center justify-center flex-1">
                <div className="absolute -top-7 left-1/2 -translate-x-1/2">
                  <ProfilePhotoUploader
                    id="director-photo-uploader"
                    photo={profile.avatar}
                    onPhotoChange={handlePhotoChange}
                    fallbackIcon={<Users className="w-8 h-8 text-[#f75142]" strokeWidth={2.2} />}
                    shape="circle"
                    badgePosition="bottom-right"
                    className="w-16 h-16 bg-white text-[#f75142] rounded-full shadow-md border-2 border-white flex items-center justify-center"
                  />
                </div>

                {/* Title & Director Name */}
                <div className="text-white/80 text-sm font-bold uppercase tracking-wider mb-1">
                  Nome:
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {profile.name}
                </h3>
                <p className="text-xs text-white/80 mt-1 font-medium">
                  {profile.roleTitle || 'Diretor Geral da Instituição'}
                </p>

                <div className="mt-6 pt-5 border-t border-white/20 w-full text-xs text-white/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">E-mail:</span>
                    <span className="font-semibold truncate max-w-[190px]">{profile.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">B.I. / Agente:</span>
                    <span className="font-mono font-semibold">
                      {profile.biNumber || '—'} {profile.agentNumber ? `• ${profile.agentNumber}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Status:</span>
                    <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      Ativo no Sigre
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={openEditModal}
                    className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border border-white/20"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Atualizar Dados</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('configuracoes')}
                    className="inline-flex items-center gap-1.5 bg-white text-[#002133] hover:bg-slate-100 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#f75142]" />
                    <span>Configurações</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Informações da Unidade Escolar & Métricas Principais */}
            <div className="lg:col-span-8 flex flex-col justify-between gap-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#fef2f1] text-[#f75142] border border-[#fee4e2] flex items-center justify-center font-bold">
                      <School className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Informações da Unidade Escolar
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Dados estruturais e capacidade da instituição
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Unidade Central Sigre
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-4 gap-x-4">
                  {/* 1. Nome da Escola */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Nome da Escola
                    </span>
                    <span className="text-sm font-bold text-slate-900 leading-snug break-words">
                      {profile.schoolName}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">
                      Rede Pública
                    </span>
                  </div>

                  {/* 2. Períodos */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Períodos
                    </span>
                    <span className="text-sm font-black text-slate-900 leading-snug">
                      {profile.periods}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">
                      Regular / Diurno
                    </span>
                  </div>

                  {/* 3. Classes */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Classes
                    </span>
                    <span className="text-sm font-black text-slate-900 leading-snug">
                      {profile.classesCount}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">
                      1ª à 9ª Classe
                    </span>
                  </div>

                  {/* 4. Salas */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Salas
                    </span>
                    <span className="text-sm font-black text-slate-900 leading-snug">
                      {profile.roomsCount}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">
                      Salas Ativas
                    </span>
                  </div>

                  {/* 5. Telefone */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Telefone
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {profile.phone}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">
                      Linha Direta
                    </span>
                  </div>

                  {/* 6. Turmas */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Turmas
                    </span>
                    <span className="text-sm font-black text-slate-900 leading-snug">
                      {profile.turmasCount}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">
                      Turmas Formadas
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: 2 Métricas Principais (Alunos & Professores) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#fef2f1] text-[#f75142] flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Nº de Alunos
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Corpo Discente
                    </span>
                  </div>

                  <div className="my-2">
                    <div className="text-3xl sm:text-4xl font-black text-slate-900">
                      {profile.studentsCount}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Alunos matriculados e regularizados na rede
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Abrangência</span>
                    <span className="font-semibold text-slate-600">1ª à 9ª Classe</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#fef2f1] text-[#f75142] flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Nº de Professores
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Quadro Docente
                    </span>
                  </div>

                  <div className="my-2">
                    <div className="text-3xl sm:text-4xl font-black text-slate-900">
                      {profile.teachersCount}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Docentes ativos em regime letivo integral
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Estatuto</span>
                    <span className="font-semibold text-slate-600">Especialistas & Regentes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Options and Settings (Account, Preferences, Security) */}
        <div id="zona-dados-senha" className="my-6 scroll-mt-24">
          <div className="mb-4 max-w-xl mx-auto">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#f75142] block">
              Configurações da Conta & Segurança
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              Zona de Alteração de Dados & Palavra-passe
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Atualize as informações cadastrais do diretor, número, B.I., escola e credenciais de acesso seguro.
            </p>
          </div>
          <ProfileOptionsSection
            user={{
              name: profile.name,
              email: profile.email,
              phone: profile.phone,
              roleTitle: profile.roleTitle || 'Diretor Geral • Gestão Escolar',
              avatar: profile.avatar,
              schoolName: profile.schoolName,
              biNumber: profile.biNumber || '007294102ME048',
              agentNumber: profile.agentNumber || 'DIR-AG-2026',
              birthDate: profile.birthDate,
              gender: profile.gender,
              address: profile.address || 'Bairro Sede, Quêssua, Malanje',
              emergencyContact: profile.emergencyContact,
              emergencyPhone: profile.emergencyPhone,
            }}
            onUpdateUser={handleUpdateDirectorUser}
          />
        </div>

        {/* Institutional Mission & Governance Note */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f75142]/10 text-[#f75142] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Diretoria de Ensino • Central Sigre
              </h4>
              <p className="text-xs text-slate-500">
                "Priorizamos a melhor organização da Educação" • Direcção Municipal do Quéssua
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-700 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            Ano Letivo: 2026 • Portaria nº 084/MED
          </div>
        </div>
      </div>

      {/* Edit Profile & School Registration Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 mb-1">Editar Perfil e Registo da Escola</h3>
            <p className="text-xs text-slate-500 mb-4">
              Altere o nome do diretor, contactos, documentos ou capacidade da unidade escolar.
            </p>
            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome Completo do Diretor</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-slate-900 bg-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Telefone Institucional</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">E-mail Institucional</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-slate-900 bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nº do Bilhete de Identidade (B.I.)</label>
                  <input
                    type="text"
                    value={editBiNumber}
                    onChange={(e) => setEditBiNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-slate-900 bg-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nº de Agente / Mecanográfico</label>
                  <input
                    type="text"
                    value={editAgentNumber}
                    onChange={(e) => setEditAgentNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-slate-900 bg-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome da Unidade Escolar</label>
                <input
                  type="text"
                  value={editSchoolName}
                  onChange={(e) => setEditSchoolName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-slate-900 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Períodos</label>
                  <input
                    type="number"
                    min={1}
                    value={editPeriods}
                    onChange={(e) => setEditPeriods(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Classes</label>
                  <input
                    type="number"
                    min={1}
                    value={editClassesCount}
                    onChange={(e) => setEditClassesCount(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Salas</label>
                  <input
                    type="number"
                    min={1}
                    value={editRoomsCount}
                    onChange={(e) => setEditRoomsCount(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Turmas</label>
                  <input
                    type="number"
                    min={1}
                    value={editTurmasCount}
                    onChange={(e) => setEditTurmasCount(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-slate-900 bg-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-full text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#e04436] hover:bg-[#c9372a] text-white font-black uppercase tracking-wider cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

