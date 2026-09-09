import React, { useState } from 'react';
import { ShieldCheck, Mail, Phone, MapPin, Building, Award, Calendar, CheckCircle2, Settings, FileSpreadsheet } from 'lucide-react';
import { Hero } from '../../Hero';
import { ProfilePhotoUploader } from '../../ProfilePhotoUploader';
import { ProfileOptionsSection, UserProfileData } from '../../profile/ProfileOptionsSection';
import type { AdminSchool } from '../../../types';

interface AdminProfilePageProps {
  onOpenGetStarted: () => void;
  schools: AdminSchool[];
  onNavigateToStatistics: () => void;
  isLoggedIn?: boolean;
  onOpenSettings?: () => void;
  onOpenExcelExport?: () => void;
}

const STORAGE_KEY_ADMIN_AVATAR = 'ucore_admin_avatar';
const STORAGE_KEY_ADMIN_DATA = 'ucore_admin_profile_data';

export const AdminProfilePage: React.FC<AdminProfilePageProps> = ({
  onOpenGetStarted,
  schools,
  onNavigateToStatistics,
  isLoggedIn,
  onOpenSettings,
  onOpenExcelExport,
}) => {
  const [adminPhoto, setAdminPhoto] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ADMIN_AVATAR);
    } catch {
      return null;
    }
  });

  const [adminData, setAdminData] = useState<UserProfileData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADMIN_DATA);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      name: 'Super Admin uCore',
      email: 'admin.geral@ucore.ao',
      phone: '+244 923 000 001',
      roleTitle: 'Administrador Geral da Rede uCore',
      schoolName: 'Ministério da Educação & Rede uCore Escolas',
      biNumber: '005481920LA031',
      address: 'Edifício Monumental, Ingombota, Luanda',
    };
  });

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
        if (updated.avatar) localStorage.setItem(STORAGE_KEY_ADMIN_AVATAR, updated.avatar);
        else localStorage.removeItem(STORAGE_KEY_ADMIN_AVATAR);
      } catch {
        // ignore
      }
    }
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_DATA, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handlePhotoChange = (newPhoto: string | null) => {
    setAdminPhoto(newPhoto);
    setAdminData((prev) => ({ ...prev, avatar: newPhoto }));
    try {
      if (newPhoto) {
        localStorage.setItem(STORAGE_KEY_ADMIN_AVATAR, newPhoto);
      } else {
        localStorage.removeItem(STORAGE_KEY_ADMIN_AVATAR);
      }
    } catch {
      // ignore
    }
  };

  const totalStudents = schools.reduce((acc, s) => acc + s.studentsWithDocs + s.studentsWithoutDocs, 0);
  const totalTeachers = schools.reduce((acc, s) => acc + s.teachersCount, 0);

  return (
    <div id="admin-profile-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Hero */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Perfil do Administrador Geral"
        customSubtitle="Gestão Central da Rede uCore Education"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-slate-100">
            {/* Campo Interativo para Anexar / Alterar Foto de Perfil (Suporta clique e Drag-and-Drop) */}
            <div className="flex flex-col items-center">
              <ProfilePhotoUploader
                id="admin-photo-uploader"
                photo={adminPhoto}
                onPhotoChange={handlePhotoChange}
                fallbackInitials="AF"
                shape="square"
                badgePosition="bottom-right"
                className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#f75142] to-[#e04436] text-white font-black text-3xl flex items-center justify-center shadow-lg"
              />
              <span className="text-[10px] text-slate-400 mt-1.5 font-medium hidden sm:inline">
                {adminPhoto ? 'Alterar foto' : 'Anexar foto'}
              </span>
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Admin. Fred</h2>
                  <p className="text-sm font-semibold text-[#f75142]">
                    Superintendente & Administrador Geral da Rede Central uCore
                  </p>
                </div>
                <span className="self-center sm:self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" /> Acesso Total (Root Admin)
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> fred.admin@ucore.edu.ao
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> +244 923 001 100
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Luanda Central, Angola
                </span>
                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="inline-flex items-center gap-1.5 bg-[#002133] hover:bg-[#001726] text-white px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ml-auto"
                  >
                    <Settings className="w-3 h-3 text-[#f75142]" />
                    <span>Configurações da Sessão</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Network Responsibilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Escolas Sob Gestão
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1">{schools.length}</div>
              <span className="text-[10px] text-[#f75142] font-semibold">100% Integradas</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Professores na Rede
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1">{totalTeachers}</div>
              <span className="text-[10px] text-emerald-600 font-semibold">Quadro Docente Ativo</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Estudantes Ativos
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1">{totalStudents.toLocaleString()}</div>
              <span className="text-[10px] text-[#f75142] font-semibold">Matrículas Homologadas</span>
            </div>
          </div>

          {/* Institutional Directives */}
          <div className="space-y-4 text-xs text-slate-600 bg-[#fef2f1]/60 rounded-2xl p-6 border border-[#fee4e2]">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#f75142]" />
              Diretrizes Estruturais da Gestão Central uCore
            </h4>
            <p className="leading-relaxed">
              "Priorizamos a melhor organização da Educação em toda a malha escolar. Nosso objetivo estratégico compreende a regularização civil de 100% dos educandos, monitoramento diário da presença de docentes e alunos e acompanhamento contínuo dos índices de aprovação escolar."
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="bg-white px-3 py-1 rounded-full border border-[#fee4e2] text-[#f75142] font-bold text-[10px]">
                Gestão 2026
              </span>
              <span className="bg-white px-3 py-1 rounded-full border border-[#fee4e2] text-emerald-700 font-bold text-[10px]">
                Registo Civil Ativo
              </span>
              <span className="bg-white px-3 py-1 rounded-full border border-[#fee4e2] text-slate-700 font-bold text-[10px]">
                Auditoria Periódica
              </span>
            </div>
          </div>

          {/* Profile Options and Settings matching screenshot (Account, Preferences, Security) */}
          <div className="my-8">
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
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
            {onOpenExcelExport && (
              <button
                onClick={onOpenExcelExport}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
                title="Exportar dados de professores, diretores e alunos em Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar Planilhas Excel (.xlsx)</span>
              </button>
            )}
            <button
              onClick={onNavigateToStatistics}
              className="px-6 py-2.5 bg-[#f75142] hover:bg-[#c9372a] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all"
            >
              Acessar Painel Estatístico Global &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
