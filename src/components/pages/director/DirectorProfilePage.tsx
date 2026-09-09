import React, { useState } from 'react';
import { User, Users, Phone, Building, Clock, ShieldCheck, Mail, MapPin, Edit3, CheckCircle2, School, GraduationCap, Settings } from 'lucide-react';
import { Hero } from '../../Hero';
import { ProfilePhotoUploader } from '../../ProfilePhotoUploader';
import { ProfileOptionsSection, UserProfileData } from '../../profile/ProfileOptionsSection';
import { directorProfileData as initialProfile } from '../../../data/directorData';
import type { DirectorProfileInfo } from '../../../types';

interface DirectorProfilePageProps {
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
  onOpenSettings?: () => void;
}

const STORAGE_KEY_DIRECTOR = 'ucore_director_profile';

export const DirectorProfilePage: React.FC<DirectorProfilePageProps> = ({
  onOpenGetStarted,
  isLoggedIn,
  onOpenSettings,
}) => {
  const [profile, setProfile] = useState<DirectorProfileInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DIRECTOR);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return initialProfile;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editEmail, setEditEmail] = useState(profile.email);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...profile,
      name: editName.trim() || profile.name,
      phone: editPhone.trim() || profile.phone,
      email: editEmail.trim() || profile.email,
    };
    setProfile(updated);
    try {
      localStorage.setItem(STORAGE_KEY_DIRECTOR, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setIsEditing(false);
  };

  const handlePhotoChange = (newPhoto: string | null) => {
    const updated = {
      ...profile,
      avatar: newPhoto || undefined,
    };
    setProfile(updated);
    try {
      localStorage.setItem(STORAGE_KEY_DIRECTOR, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleUpdateDirectorUser = (updated: Partial<UserProfileData>) => {
    const next = {
      ...profile,
      name: updated.name || profile.name,
      email: updated.email || profile.email,
      phone: updated.phone || profile.phone,
      avatar: updated.avatar !== undefined ? (updated.avatar || undefined) : profile.avatar,
      schoolName: updated.schoolName || profile.schoolName,
    };
    setProfile(next);
    try {
      localStorage.setItem(STORAGE_KEY_DIRECTOR, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  return (
    <div id="director-profile-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Hero: "Perfil do Director" matching 19.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Perfil do Director"
        customSubtitle=""
      />

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch mb-8">
          {/* Left Column: Profile Card with circular User badge matching 19.png */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="relative bg-[#f75142] text-white rounded-3xl pt-14 pb-10 px-6 text-center shadow-[0_15px_35px_rgba(247,81,66,0.25)] flex flex-col items-center justify-center flex-1">
              {/* White Circular Badge with User Icon & Photo Upload (Click / Drag-and-Drop) */}
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
                Diretor Geral da Instituição
              </p>

              <div className="mt-6 pt-5 border-t border-white/20 w-full text-xs text-white/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">E-mail:</span>
                  <span className="font-semibold">{profile.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Status:</span>
                  <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    Ativo no uCore
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border border-white/20"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Atualizar Dados</span>
                </button>
                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="inline-flex items-center gap-1.5 bg-white text-[#002133] hover:bg-slate-100 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#f75142]" />
                    <span>Configurações</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Informações da Unidade Escolar & Métricas Principais (Sem cards pesados, mantendo organização e máxima legibilidade) */}
          <div className="lg:col-span-8 flex flex-col justify-between gap-6">
            {/* Informações da Unidade Escolar - 6 colunas organizadas */}
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
                  Unidade Central uCore
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
              {/* Métrica 1: Nº de alunos */}
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

              {/* Métrica 2: Nº de Professores */}
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

        {/* Profile Options and Settings matching screenshot (Account, Preferences, Security) */}
        <div className="my-8">
          <ProfileOptionsSection
            user={{
              name: profile.name,
              email: profile.email,
              phone: profile.phone,
              roleTitle: 'Diretor Geral • Gestão Escolar',
              avatar: profile.avatar,
              schoolName: profile.schoolName,
              biNumber: '007294102LA048',
              address: 'Complexo Escolar Central, Maianga, Luanda',
            }}
            onUpdateUser={handleUpdateDirectorUser}
          />
        </div>

        {/* Institutional Mission & Governance Note */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f75142]/10 text-[#f75142] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Diretoria de Ensino • Central uCore
              </h4>
              <p className="text-xs text-slate-500">
                "Priorizamos a melhor organização da Educação" • Unidade Modelo Central
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-700 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            Ano Letivo: 2026 • Portaria nº 084/MED
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-4">Editar Perfil do Diretor</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome do Diretor</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-slate-900 bg-white"
                />
              </div>
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
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-slate-900 bg-white"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-full text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#e04436] hover:bg-[#c9372a] text-white font-black uppercase tracking-wider"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
