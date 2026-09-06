import React, { useState } from 'react';
import { User, Users, Phone, Building, Clock, ShieldCheck, Mail, MapPin, Edit3, CheckCircle2 } from 'lucide-react';
import { Hero } from '../../Hero';
import { directorProfileData as initialProfile } from '../../../data/directorData';
import type { DirectorProfileInfo } from '../../../types';

interface DirectorProfilePageProps {
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
}

export const DirectorProfilePage: React.FC<DirectorProfilePageProps> = ({
  onOpenGetStarted,
  isLoggedIn,
}) => {
  const [profile, setProfile] = useState<DirectorProfileInfo>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editEmail, setEditEmail] = useState(profile.email);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile((prev) => ({
      ...prev,
      name: editName.trim() || prev.name,
      phone: editPhone.trim() || prev.phone,
      email: editEmail.trim() || prev.email,
    }));
    setIsEditing(false);
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
            <div className="relative bg-[#5067fc] text-white rounded-3xl pt-14 pb-10 px-6 text-center shadow-[0_15px_35px_rgba(80,103,252,0.25)] flex flex-col items-center justify-center flex-1">
              {/* White Circular Badge with User Icon */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-white">
                <Users className="w-8 h-8 text-[#5067fc]" strokeWidth={2.2} />
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

              {/* Edit button */}
              <button
                onClick={() => setIsEditing(true)}
                className="mt-6 inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border border-white/20"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Atualizar Dados</span>
              </button>
            </div>
          </div>

          {/* Right Column: Top row with 6 Cyan-badged cards + Bottom row with 2 Cyan-badged cards matching 19.png */}
          <div className="lg:col-span-8 flex flex-col justify-between gap-6">
            {/* Top Row: 6 Cards with Cyan Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* Card 1: [Nome da Escola] */}
              <div className="flex flex-col">
                <span className="inline-block self-start bg-[#4f67ff] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 shadow-2xs">
                  Nome da Escola
                </span>
                <div className="bg-[#5067fc] text-white rounded-2xl p-3.5 flex-1 flex flex-col justify-center shadow-sm min-h-[90px]">
                  <h5 className="font-bold text-xs sm:text-sm leading-tight">
                    {profile.schoolName}
                  </h5>
                </div>
              </div>

              {/* Card 2: [Periodos] */}
              <div className="flex flex-col">
                <span className="inline-block self-start bg-[#4f67ff] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 shadow-2xs">
                  Periodos
                </span>
                <div className="bg-[#5067fc] text-white rounded-2xl p-3.5 flex-1 flex flex-col justify-center shadow-sm min-h-[90px]">
                  <h5 className="font-bold text-xs sm:text-sm leading-tight">
                    {profile.periods}
                  </h5>
                </div>
              </div>

              {/* Card 3: [Classes] */}
              <div className="flex flex-col">
                <span className="inline-block self-start bg-[#4f67ff] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 shadow-2xs">
                  Classes
                </span>
                <div className="bg-[#5067fc] text-white rounded-2xl p-3.5 flex-1 flex flex-col justify-center shadow-sm min-h-[90px]">
                  <h5 className="font-bold text-xs sm:text-sm leading-tight">
                    {profile.classesCount}
                  </h5>
                </div>
              </div>

              {/* Card 4: [Salas] */}
              <div className="flex flex-col">
                <span className="inline-block self-start bg-[#4f67ff] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 shadow-2xs">
                  Salas
                </span>
                <div className="bg-[#5067fc] text-white rounded-2xl p-3.5 flex-1 flex flex-col justify-center shadow-sm min-h-[90px]">
                  <h5 className="font-bold text-xs sm:text-sm leading-tight">
                    {profile.roomsCount}
                  </h5>
                </div>
              </div>

              {/* Card 5: [Telefone] */}
              <div className="flex flex-col">
                <span className="inline-block self-start bg-[#4f67ff] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 shadow-2xs">
                  Telefone
                </span>
                <div className="bg-[#5067fc] text-white rounded-2xl p-3.5 flex-1 flex flex-col justify-center shadow-sm min-h-[90px]">
                  <h5 className="font-bold text-[11px] sm:text-xs leading-tight">
                    {profile.phone}
                  </h5>
                </div>
              </div>

              {/* Card 6: [Turmas] */}
              <div className="flex flex-col">
                <span className="inline-block self-start bg-[#4f67ff] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 shadow-2xs">
                  Turmas
                </span>
                <div className="bg-[#5067fc] text-white rounded-2xl p-3.5 flex-1 flex flex-col justify-center shadow-sm min-h-[90px]">
                  <h5 className="font-bold text-xs sm:text-sm leading-tight">
                    {profile.turmasCount}
                  </h5>
                </div>
              </div>
            </div>

            {/* Bottom Row: 2 Cards with Cyan Badges matching 19.png */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Card 7: [Nº de alunos] */}
              <div className="flex flex-col">
                <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
                  Nº de alunos
                </span>
                <div className="bg-[#5067fc] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
                  <div className="text-xs uppercase font-bold text-white/80">Corpo Discente Matriculado</div>
                  <div className="text-3xl sm:text-4xl font-black mt-2">
                    {profile.studentsCount}
                  </div>
                  <span className="text-xs text-white/80 mt-1">Distribuídos da 1ª à 9ª Classe</span>
                </div>
              </div>

              {/* Card 8: [Nº de Professores] */}
              <div className="flex flex-col">
                <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
                  Nº de Professores
                </span>
                <div className="bg-[#5067fc] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
                  <div className="text-xs uppercase font-bold text-white/80">Quadro Docente Ativo</div>
                  <div className="text-3xl sm:text-4xl font-black mt-2">
                    {profile.teachersCount}
                  </div>
                  <span className="text-xs text-white/80 mt-1">Especialistas e Regentes de Classe</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Institutional Mission & Governance Note */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5067fc]/10 text-[#5067fc] flex items-center justify-center shrink-0">
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#5067fc] outline-none text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Telefone Institucional</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#5067fc] outline-none text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">E-mail Institucional</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#5067fc] outline-none text-slate-900 bg-white"
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
                  className="px-5 py-2 rounded-full bg-[#4f67ff] hover:bg-[#3547cf] text-white font-black uppercase tracking-wider"
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
