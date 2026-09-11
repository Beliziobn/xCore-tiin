import React, { useState, useEffect } from 'react';
import {
  Users,
  Phone,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Mail,
  School,
  Calendar,
  User,
  Bell,
  Globe,
  Sun,
  Lock,
  IdCard,
  ChevronRight,
  Settings,
  Sparkles,
} from 'lucide-react';
import { initialTeacherData, TeacherData, StudentProfile } from '../../data/teacherData';
import { ProfilePhotoUploader } from '../ProfilePhotoUploader';
import { ProfileOptionsSection, UserProfileData, ProfileModalType } from '../profile/ProfileOptionsSection';
import { AccessDeniedGuard } from '../common/AccessDeniedGuard';
import type { UserAccount } from '../../types';

interface TeacherProfilePageProps {
  onBackToStats: () => void;
  onNavigateToClass: () => void;
  teacher?: TeacherData;
  students?: StudentProfile[];
  currentUser?: UserAccount | null;
  onNavigateToOwnProfile?: () => void;
  onBackToHome?: () => void;
  onLogout?: () => void;
  onUpdateTeacher?: (updated: Partial<TeacherData>) => void;
  initialTab?: 'visao-geral' | 'configuracoes';
  focusZone?: boolean;
  settingsTrigger?: number;
}

const STORAGE_KEY_TEACHER_AVATAR = 'ucore_teacher_avatar';

export const TeacherProfilePage: React.FC<TeacherProfilePageProps> = ({
  onBackToStats,
  onNavigateToClass,
  teacher = initialTeacherData,
  students = [],
  currentUser,
  onNavigateToOwnProfile,
  onBackToHome,
  onLogout,
  onUpdateTeacher,
  initialTab,
  focusZone,
  settingsTrigger,
}) => {
  // 1. Strict Security Guard: User can NEVER enter or modify someone else's profile
  if (currentUser && currentUser.role !== 'professor') {
    return (
      <AccessDeniedGuard
        currentUser={currentUser}
        attemptedView="professor-perfil"
        reason={`A sua conta (${currentUser.firstName} • ${currentUser.role.toUpperCase()}) não tem permissão para aceder ao Perfil de Docente. Cada utilizador tem acesso estrito e exclusivo apenas ao seu próprio perfil.`}
        onNavigateToOwnProfile={onNavigateToOwnProfile || (() => {})}
        onBackToHome={onBackToHome || (() => {})}
        onLogout={onLogout || (() => {})}
      />
    );
  }

  const [activeTab, setActiveTab] = useState<'visao-geral' | 'configuracoes'>(initialTab || 'visao-geral');
  const [selectedDay, setSelectedDay] = useState('Segunda-feira');
  const [activeModal, setActiveModal] = useState<ProfileModalType>(null);

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

  const userAvatarStorageKey = currentUser?.id
    ? `${STORAGE_KEY_TEACHER_AVATAR}_${currentUser.id}`
    : STORAGE_KEY_TEACHER_AVATAR;

  const [teacherAvatar, setTeacherAvatar] = useState<string | null>(() => {
    try {
      return localStorage.getItem(userAvatarStorageKey) || currentUser?.avatarUrl || teacher.avatar || null;
    } catch {
      return currentUser?.avatarUrl || teacher.avatar || null;
    }
  });

  const [teacherProfileData, setTeacherProfileData] = useState<UserProfileData>(() => {
    const teacherName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : teacher.name;
    const teacherEmail = currentUser?.email || teacher.email || 'santar.goes@ucore.edu.ao';
    const school = currentUser?.schoolName || teacher.escola || 'Escola Primária Nº 1024 - Quessua';
    return {
      name: teacherName,
      email: teacherEmail,
      phone: teacher.telefone || '+244 931 224 550',
      roleTitle: `Docente Titular • Turma ${teacher.turma} (${teacher.classe} Classe)`,
      schoolName: school,
      biNumber: '006849102LA089',
      address: 'Bairro Palanca, Kilamba Kiaxi, Luanda',
    };
  });

  const handleUpdateTeacherUser = (updated: Partial<UserProfileData>) => {
    setTeacherProfileData((prev) => ({ ...prev, ...updated }));
    if (updated.avatar !== undefined) {
      handlePhotoChange(updated.avatar);
    }
    if (onUpdateTeacher) {
      onUpdateTeacher({
        name: updated.name || teacher.name,
        email: updated.email || teacher.email,
        telefone: updated.phone || teacher.telefone,
        escola: updated.schoolName || teacher.escola,
      });
    }
  };

  const handlePhotoChange = (newPhoto: string | null) => {
    setTeacherAvatar(newPhoto);
    try {
      if (newPhoto) {
        localStorage.setItem(userAvatarStorageKey, newPhoto);
      } else {
        localStorage.removeItem(userAvatarStorageKey);
      }
    } catch {
      // ignore
    }
  };

  // Dynamic calculations from students if available
  const totalAlunos = students.length > 0 ? students.length : teacher.totalAlunos;
  const countMeninas = students.length > 0
    ? students.filter((s) => s.genero === 'F').length
    : 26;
  const countMeninos = students.length > 0
    ? students.filter((s) => s.genero === 'M').length
    : 20;

  const averageAssiduidade = students.length > 0
    ? (students.reduce((acc, curr) => acc + (curr.presencaPercent || 0), 0) / students.length).toFixed(1).replace('.', ',')
    : '96,4';

  const currentSchedule = teacher.horario.find((h) => h.dia === selectedDay) || teacher.horario[0];
  const scheduleSlots = [
    { tempo: '1º Tempo (07:30 - 08:15)', disc: currentSchedule.tempo1, sala: teacher.sala },
    { tempo: '2º Tempo (08:20 - 09:05)', disc: currentSchedule.tempo2, sala: teacher.sala },
    { tempo: '3º Tempo (09:20 - 10:05)', disc: currentSchedule.tempo3, sala: teacher.sala },
    { tempo: '4º Tempo (10:10 - 10:55)', disc: currentSchedule.tempo4, sala: teacher.sala },
  ];

  return (
    <main id="teacher-profile-page" className="teacher-profile w-full min-h-screen bg-[#f7f5f4] pb-24 font-sans">
      <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-16 relative">
        {/* Profile Toolbar */}
        <div className="profile-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={onBackToStats}
            className="back-button inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#f75142] bg-white hover:bg-slate-50 border border-[#e2e8ef] px-4 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao painel</span>
          </button>

          {/* Center Tabs: Visão Geral | Configurações */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-[#e2e8ef] shadow-2xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('visao-geral')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'visao-geral'
                  ? 'bg-[#002133] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visão geral
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('configuracoes')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'configuracoes'
                  ? 'bg-[#002133] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configurações</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="profile-actions flex items-center gap-2.5 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveModal('manage-profile')}
              className="button button-secondary flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-[#e2e8ef] px-4 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-98"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Editar perfil</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToClass}
              className="button button-primary flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#f75142] hover:bg-[#e04436] px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <span>Aceder à minha turma</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {activeTab === 'visao-geral' ? (
          <>
            {/* Profile Heading: Wide White Card */}
            <section className="profile-heading bg-white rounded-3xl border border-[#e2e8ef] p-6 sm:p-8 shadow-[0_12px_30px_rgba(3,31,48,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
              <div>
                <span className="eyebrow text-[#f75142] text-[11px] font-extrabold uppercase tracking-[0.12em] block">
                  Perfil do professor
                </span>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#03283c] tracking-tight leading-tight my-1.5">
                  {teacher.name}
                </h1>
                <p className="text-sm font-medium text-[#61788b]">
                  Docente titular da 4ª Classe do Ensino Primário
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-500 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#f75142]" />
                    <span>{teacher.email || 'santar.goes@ucore.edu.ao'}</span>
                  </span>
                  <span className="text-slate-300 hidden sm:inline">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#f75142]" />
                    <span>{teacher.telefone || '+244 931 224 550'}</span>
                  </span>
                  <span className="text-slate-300 hidden sm:inline">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-[#f75142]" />
                    <span>{teacher.escola}</span>
                  </span>
                </div>
              </div>

              {/* Avatar circle 88x88 with drag-and-drop & click photo upload */}
              <div className="profile-avatar shrink-0 self-start sm:self-center">
                <ProfilePhotoUploader
                  id="teacher-profile-avatar-uploader"
                  photo={teacherAvatar}
                  onPhotoChange={handlePhotoChange}
                  fallbackInitials={teacher.name.charAt(0)}
                  fallbackIcon={<span className="text-3xl font-black text-white">{teacher.name.charAt(0)}</span>}
                  shape="circle"
                  badgePosition="bottom-right"
                  className="w-[88px] h-[88px] rounded-full bg-[#f75142] text-white font-black text-3xl shadow-md border-4 border-white flex items-center justify-center cursor-pointer hover:ring-4 hover:ring-[#f75142]/20 transition-all"
                  label="Alterar foto"
                />
              </div>
            </section>

            {/* Teacher Meta: 5 Columns */}
            <section className="teacher-meta grid grid-cols-2 sm:grid-cols-5 border border-[#e2e8ef] rounded-2xl bg-white shadow-[0_8px_24px_rgba(3,31,48,0.04)] py-4 my-5 divide-y sm:divide-y-0 sm:divide-x divide-[#e8edf2]">
              <div className="meta-item px-5 py-2.5 sm:py-0">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7890a2] block mb-1">
                  Turma
                </span>
                <strong className="text-xl sm:text-2xl font-black text-[#03283c] block tracking-tight">
                  {teacher.turma}
                </strong>
                <small className="text-xs text-[#7890a2] block mt-0.5">Turma atribuída</small>
              </div>

              <div className="meta-item px-5 py-2.5 sm:py-0">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7890a2] block mb-1">
                  Período
                </span>
                <strong className="text-xl sm:text-2xl font-black text-[#03283c] block tracking-tight">
                  {teacher.periodo}
                </strong>
                <small className="text-xs text-[#7890a2] block mt-0.5">Turno regular</small>
              </div>

              <div className="meta-item px-5 py-2.5 sm:py-0">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7890a2] block mb-1">
                  Classe
                </span>
                <strong className="text-xl sm:text-2xl font-black text-[#03283c] block tracking-tight">
                  {teacher.classe}
                </strong>
                <small className="text-xs text-[#7890a2] block mt-0.5">Ensino Primário</small>
              </div>

              <div className="meta-item px-5 py-2.5 sm:py-0">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7890a2] block mb-1">
                  Sala
                </span>
                <strong className="text-xl sm:text-2xl font-black text-[#03283c] block tracking-tight">
                  {teacher.sala}
                </strong>
                <small className="text-xs text-[#7890a2] block mt-0.5">Bloco de aulas</small>
              </div>

              <div className="meta-item px-5 py-2.5 sm:py-0 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7890a2] block mb-1">
                  Telefone
                </span>
                <strong className="text-sm sm:text-base font-bold text-[#03283c] block tracking-tight font-mono truncate">
                  {teacher.telefone}
                </strong>
                <small className="text-xs text-[#7890a2] block mt-0.5">Contacto direto</small>
              </div>
            </section>

            {/* Profile Content Grid: Main column + Side column */}
            <div className="profile-content-grid grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Main Column */}
              <div className="profile-main-column lg:col-span-8 space-y-5 min-w-0">
                {/* Metrics Grid */}
                <section className="metrics-grid grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <article className="metric-card p-5 rounded-2xl bg-white border border-[#e2e8ef] shadow-[0_8px_24px_rgba(3,31,48,0.04)] flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#7890a2] block">Total de alunos</span>
                      <strong className="text-3xl font-black text-[#03283c] block tracking-tight my-1">
                        {totalAlunos}
                      </strong>
                    </div>
                    <div>
                      <small className="text-xs text-[#7890a2] block font-medium">
                        {countMeninas} meninas · {countMeninos} meninos
                      </small>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="bg-[#002133] h-1.5 rounded-full w-full" />
                      </div>
                    </div>
                  </article>

                  <article className="metric-card p-5 rounded-2xl bg-white border border-[#e2e8ef] shadow-[0_8px_24px_rgba(3,31,48,0.04)] flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#7890a2] block">Assiduidade</span>
                      <strong className="text-3xl font-black text-[#12b981] block tracking-tight my-1">
                        {averageAssiduidade}%
                      </strong>
                    </div>
                    <div>
                      <small className="text-xs text-[#7890a2] block font-medium">Este período letivo</small>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="bg-[#12b981] h-1.5 rounded-full w-[96.4%]" />
                      </div>
                    </div>
                  </article>

                  <article className="metric-card p-5 rounded-2xl bg-white border border-[#e2e8ef] shadow-[0_8px_24px_rgba(3,31,48,0.04)] flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#7890a2] block">Disciplinas</span>
                      <strong className="text-3xl font-black text-[#f75142] block tracking-tight my-1">
                        4
                      </strong>
                    </div>
                    <div>
                      <small className="text-xs text-[#7890a2] block font-medium">Na turma atual</small>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="bg-[#f75142] h-1.5 rounded-full w-4/5" />
                      </div>
                    </div>
                  </article>
                </section>

                {/* Schedule Card (Horário Semanal) */}
                <section className="schedule-card p-6 rounded-2xl bg-white border border-[#e2e8ef] shadow-[0_8px_24px_rgba(3,31,48,0.04)]">
                  <div className="section-heading flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-[#e8edf2]">
                    <div>
                      <span className="eyebrow text-[#f75142] text-[11px] font-extrabold uppercase tracking-[0.12em] block">
                        Planeamento semanal
                      </span>
                      <h2 className="text-xl font-black text-[#03283c] tracking-tight mt-0.5 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#f75142]" />
                        <span>Horário de aulas</span>
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {teacher.escola} · Período Matinal (07h30 às 12h30)
                      </p>
                    </div>

                    {/* Day Tabs */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
                      {teacher.horario.map((h, idx) => {
                        const isDayActive = selectedDay === h.dia;
                        const shortDay = h.dia.split('-')[0];
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedDay(h.dia)}
                            className={`day-tab px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                              isDayActive
                                ? 'is-active bg-[#f75142] text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {shortDay}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4 Class Slots */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {scheduleSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-[#e2e8ef] rounded-xl p-4 flex flex-col justify-between transition-colors hover:border-[#f75142]/40"
                      >
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                          {slot.tempo}
                        </span>
                        <strong className="text-sm font-black text-[#03283c] leading-snug">
                          {slot.disc}
                        </strong>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
                          <span>{slot.sala}</span>
                          <span className="text-[#f75142] font-bold">Presencial</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* About the Teacher Card */}
                <section className="about-card p-6 rounded-2xl bg-white border border-[#e2e8ef] shadow-[0_8px_24px_rgba(3,31,48,0.04)]">
                  <span className="eyebrow text-[#f75142] text-[11px] font-extrabold uppercase tracking-[0.12em] block mb-1">
                    Sobre o docente
                  </span>
                  <p className="text-sm text-[#61788b] leading-relaxed max-w-3xl m-0">
                    {teacher.bio ||
                      'Docente titular do 4º Ano do Ensino Primário. Especialista em metodologias ativas de alfabetização, avaliação formativa e gestão de sala de aula inclusiva.'}
                  </p>
                </section>
              </div>

              {/* Side Column: Account Card */}
              <aside className="profile-side-column lg:col-span-4 min-w-0">
                <section className="account-card p-6 rounded-2xl bg-white border border-[#e2e8ef] shadow-[0_8px_24px_rgba(3,31,48,0.04)] sticky top-24">
                  {/* Account Card Header */}
                  <div className="account-card-header flex items-center gap-3.5 pb-5 border-b border-[#e8edf2]">
                    <div className="profile-avatar profile-avatar-small w-14 h-14 rounded-full bg-[#002133] text-white flex items-center justify-center font-bold text-xl shrink-0 border border-slate-200 overflow-hidden">
                      {teacherAvatar ? (
                        <img
                          src={teacherAvatar}
                          alt={teacher.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{teacher.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <strong className="text-base font-black text-[#03283c] block truncate">
                        {teacher.name}
                      </strong>
                      <span className="text-xs text-[#7890a2] block truncate">
                        {teacher.email || 'santar.goes@ucore.edu.ao'}
                      </span>
                    </div>
                  </div>

                  {/* Settings quick links */}
                  <div className="divide-y divide-[#edf0f3] text-sm font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveModal('manage-profile')}
                      className="w-full flex items-center justify-between py-3.5 text-left text-[#173d55] hover:text-[#f75142] transition-colors cursor-pointer group"
                    >
                      <span className="flex items-center gap-2.5">
                        <User className="w-4 h-4 text-slate-400 group-hover:text-[#f75142]" />
                        <span>Gerir perfil</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#f75142]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModal('personal-info')}
                      className="w-full flex items-center justify-between py-3.5 text-left text-[#173d55] hover:text-[#f75142] transition-colors cursor-pointer group"
                    >
                      <span className="flex items-center gap-2.5">
                        <IdCard className="w-4 h-4 text-slate-400 group-hover:text-[#f75142]" />
                        <span>Informações pessoais</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#f75142]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModal('notifications')}
                      className="w-full flex items-center justify-between py-3.5 text-left text-[#173d55] hover:text-[#f75142] transition-colors cursor-pointer group"
                    >
                      <span className="flex items-center gap-2.5">
                        <Bell className="w-4 h-4 text-slate-400 group-hover:text-[#f75142]" />
                        <span>Notificações</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#f75142]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModal('language')}
                      className="w-full flex items-center justify-between py-3.5 text-left text-[#173d55] hover:text-[#f75142] transition-colors cursor-pointer group"
                    >
                      <span className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-slate-400 group-hover:text-[#f75142]" />
                        <span>Idioma</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#f75142]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModal('theme')}
                      className="w-full flex items-center justify-between py-3.5 text-left text-[#173d55] hover:text-[#f75142] transition-colors cursor-pointer group"
                    >
                      <span className="flex items-center gap-2.5">
                        <Sun className="w-4 h-4 text-slate-400 group-hover:text-[#f75142]" />
                        <span>Tema</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#f75142]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModal('change-password')}
                      className="w-full flex items-center justify-between py-3.5 text-left text-[#173d55] hover:text-[#f75142] transition-colors cursor-pointer group"
                    >
                      <span className="flex items-center gap-2.5">
                        <Lock className="w-4 h-4 text-slate-400 group-hover:text-[#f75142]" />
                        <span>Alterar palavra-passe</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#f75142]" />
                    </button>
                  </div>

                  {/* Direct Button */}
                  <div className="pt-5 mt-2 border-t border-[#edf0f3]">
                    <button
                      type="button"
                      onClick={onNavigateToClass}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#002133] hover:bg-[#001726] flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-98"
                    >
                      <span>Ver turma completa</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#f75142]" />
                    </button>
                  </div>
                </section>
              </aside>
            </div>
          </>
        ) : (
          /* Settings Tab View: Full unified width */
          <div id="zona-dados-senha" className="settings-tab-view scroll-mt-24 bg-white rounded-3xl border border-[#e2e8ef] p-6 sm:p-8 shadow-[0_12px_30px_rgba(3,31,48,0.06)]">
            <div className="pb-4 mb-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="eyebrow text-[#f75142] text-[11px] font-extrabold uppercase tracking-[0.12em] block">
                  Configurações da Conta & Segurança
                </span>
                <h2 className="text-xl font-black text-[#03283c] tracking-tight mt-0.5">
                  Zona de Alteração de Dados & Palavra-passe
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Edite nome, e-mail, contacto telefónico, dados biográficos e redefina a sua palavra-passe com segurança.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('visao-geral')}
                className="text-xs font-bold text-[#f75142] hover:underline cursor-pointer"
              >
                Voltar à visão geral
              </button>
            </div>

            <ProfileOptionsSection
              user={{
                name: teacherProfileData.name,
                email: teacherProfileData.email,
                phone: teacherProfileData.phone,
                roleTitle: teacherProfileData.roleTitle,
                avatar: teacherAvatar,
                schoolName: teacherProfileData.schoolName,
                biNumber: teacherProfileData.biNumber,
                address: teacherProfileData.address,
              }}
              onUpdateUser={handleUpdateTeacherUser}
              showBackHeader={false}
              hideProfileHeaderCard={true}
              externalActiveModal={activeModal}
              onCloseExternalModal={() => setActiveModal(null)}
            />
          </div>
        )}
      </div>

      {/* ProfileOptionsSection to handle modals when in Visão Geral */}
      {activeTab === 'visao-geral' && (
        <ProfileOptionsSection
          user={{
            name: teacherProfileData.name,
            email: teacherProfileData.email,
            phone: teacherProfileData.phone,
            roleTitle: teacherProfileData.roleTitle,
            avatar: teacherAvatar,
            schoolName: teacherProfileData.schoolName,
            biNumber: teacherProfileData.biNumber,
            address: teacherProfileData.address,
          }}
          onUpdateUser={handleUpdateTeacherUser}
          externalActiveModal={activeModal}
          onCloseExternalModal={() => setActiveModal(null)}
          modalsOnly={true}
        />
      )}
    </main>
  );
};
