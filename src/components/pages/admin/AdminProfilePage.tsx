import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Building,
  Award,
  CheckCircle2,
  Settings,
  FileSpreadsheet,
  Edit3,
  BarChart3,
  School,
  Users,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import { Hero } from '../../Hero';
import { ProfilePhotoUploader } from '../../ProfilePhotoUploader';
import {
  ProfileOptionsSection,
  UserProfileData,
  ProfileModalType,
} from '../../profile/ProfileOptionsSection';
import type { AdminSchool } from '../../../types';

interface AdminProfilePageProps {
  onOpenGetStarted: () => void;
  schools: AdminSchool[];
  onNavigateToStatistics: () => void;
  isLoggedIn?: boolean;
  onOpenSettings?: () => void;
  onOpenExcelExport?: () => void;
  focusZone?: boolean;
  settingsTrigger?: number;
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
  focusZone,
  settingsTrigger,
}) => {
  useEffect(() => {
    if (focusZone || settingsTrigger) {
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
      return localStorage.getItem(STORAGE_KEY_ADMIN_AVATAR);
    } catch {
      return null;
    }
  });

  const [activeModal, setActiveModal] = useState<ProfileModalType>(null);

  const [adminData, setAdminData] = useState<UserProfileData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADMIN_DATA);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      name: 'Super Admin uCore',
      email: 'fred.admin@ucore.edu.ao',
      phone: '+244 923 001 100',
      roleTitle: 'Superintendente & Administrador Geral da Rede uCore',
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
    <div id="admin-profile-page" className="w-full min-h-screen bg-[#F6F7F9]">
      {/* Hero Header */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Perfil do Administrador Geral"
        customSubtitle="Supervisão executiva, conformidade e definições estratégicas da rede uCore"
      />

      {/* Main Container - Aligned exactly with Hero's max-w-6xl and padding */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 py-8 sm:py-10 space-y-6">
        
        {/* 1. Resumo do Administrador (Hero Profile Summary Card) */}
        <section
          id="admin-profile-summary"
          aria-label="Resumo do Administrador"
          className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Foto de Perfil Interativa com uploader */}
            <div className="flex flex-col items-center shrink-0">
              <ProfilePhotoUploader
                id="admin-photo-uploader"
                photo={adminPhoto}
                onPhotoChange={handlePhotoChange}
                fallbackInitials="AF"
                shape="square"
                badgePosition="bottom-right"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-[#f75142] to-[#e04436] text-white font-black text-3xl flex items-center justify-center shadow-xs"
              />
              <span className="text-xs text-slate-500 mt-2 font-medium">
                {adminPhoto ? 'Alterar foto' : 'Carregar foto'}
              </span>
            </div>

            {/* Informações Centrais do Administrador */}
            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      Admin. Fred
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Conta Ativa
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-slate-700 mt-1">
                    Superintendente & Administrador Geral da Rede Central uCore
                  </p>
                </div>

                <div className="self-center sm:self-start shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-[#f75142]" />
                    <span>Acesso: Root Admin</span>
                  </span>
                </div>
              </div>

              {/* Linha de Contactos e Localização */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-5 mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  fred.admin@ucore.edu.ao
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  +244 923 001 100
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  Luanda Central, Angola
                </span>
              </div>

              {/* Botões de Ação do Cabeçalho */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setActiveModal('manage-profile')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-slate-200/60"
                >
                  <Edit3 className="w-4 h-4 text-[#f75142]" />
                  <span>Gerir perfil</span>
                </button>

                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Definições da sessão</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Indicadores da Rede (Área de métricas limpas, sem cartão pesado externo) */}
        <section aria-label="Indicadores da Rede" className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Indicadores da Rede Escolar
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Dados consolidados do ano letivo 2026
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Indicador 1: Escolas */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block">
                  Escolas Sob Gestão
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
                  {schools.length}
                </div>
                <span className="inline-block mt-1 text-xs font-semibold text-[#f75142]">
                  100% Integradas ao uCore
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#fef2f1] text-[#f75142] flex items-center justify-center shrink-0 border border-[#fee4e2]">
                <School className="w-6 h-6" />
              </div>
            </div>

            {/* Indicador 2: Professores */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block">
                  Professores na Rede
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
                  {totalTeachers}
                </div>
                <span className="inline-block mt-1 text-xs font-semibold text-emerald-700">
                  Quadro Docente Ativo
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Indicador 3: Estudantes */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block">
                  Estudantes Ativos
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
                  {totalStudents.toLocaleString('pt-AO')}
                </div>
                <span className="inline-block mt-1 text-xs font-semibold text-[#f75142]">
                  Matrículas Homologadas
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* 3. Ações Rápidas (Diretamente associadas aos indicadores) */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            {onOpenExcelExport && (
              <button
                type="button"
                onClick={onOpenExcelExport}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300/80 shadow-2xs cursor-pointer transition-all flex items-center gap-2"
                title="Exportar dados consolidados em formato Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Exportar Planilhas Excel (.xlsx)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNavigateToStatistics}
              className="px-6 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Acessar Painel Estatístico Global</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* 4. Layout em Duas Colunas no Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          
          {/* Coluna 1: Diretrizes e Informações Institucionais (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Bloco 1: Diretrizes da Gestão Central */}
            <section
              id="management-guidelines"
              aria-label="Diretrizes Estruturais da Gestão Central"
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fef2f1] text-[#f75142] flex items-center justify-center shrink-0 border border-[#fee4e2]">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 leading-tight">
                    Diretrizes da Gestão Central
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Missão, metas estratégicas e supervisão da rede
                  </p>
                </div>
              </div>

              <blockquote className="text-sm text-slate-700 leading-relaxed pl-3.5 border-l-2 border-[#f75142] italic bg-slate-50/60 py-2.5 pr-3 rounded-r-xl">
                "Priorizamos a excelência e organização em toda a malha escolar. O nosso objetivo compreende a regularização civil de 100% dos educandos, acompanhamento assíduo de docentes e estudantes e a evolução consistente dos índices pedagógicos em Angola."
              </blockquote>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="bg-slate-50 px-3 py-1 rounded-full border border-slate-200 text-slate-800 font-semibold text-xs">
                  Gestão Letiva 2026
                </span>
                <span className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 text-emerald-800 font-semibold text-xs">
                  Registo Civil Ativo
                </span>
                <span className="bg-slate-50 px-3 py-1 rounded-full border border-slate-200 text-slate-700 font-semibold text-xs">
                  Auditoria Periódica
                </span>
                <span className="bg-[#fef2f1] px-3 py-1 rounded-full border border-[#fee4e2] text-[#f75142] font-semibold text-xs">
                  Conformidade com Censo
                </span>
              </div>
            </section>

            {/* Bloco 2: Informações Institucionais & Conformidade */}
            <section
              id="institutional-information"
              aria-label="Informações Institucionais e Conformidade"
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 border border-slate-200/80">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 leading-tight">
                    Informações Institucionais & Conformidade
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dados de registo da sede central e habilitação jurídica
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-sm">
                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-500 font-medium">Instituição Tutelar</span>
                  <span className="text-slate-900 font-semibold">
                    {adminData.schoolName || 'Ministério da Educação & Rede uCore Escolas'}
                  </span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-500 font-medium">Sede Operacional</span>
                  <span className="text-slate-900 font-semibold">
                    {adminData.address || 'Edifício Monumental, Ingombota, Luanda'}
                  </span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-500 font-medium">Nº de Registo / B.I.</span>
                  <span className="text-slate-900 font-mono font-semibold">
                    {adminData.biNumber || '005481920LA031'}
                  </span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-500 font-medium">Status de Auditoria</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    100% Conforme às Normas Nacionais
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Coluna 2: Definições da Conta, Preferências e Segurança (lg:col-span-5) */}
          <div id="zona-dados-senha" className="lg:col-span-5 scroll-mt-24">
            <div className="mb-4">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#f75142] block">
                Definições da Conta & Segurança
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                Zona de Alteração de Dados & Palavra-passe
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Edite os dados do superadministrador e redefina credenciais de acesso seguro.
              </p>
            </div>
            <ProfileOptionsSection
              className="w-full"
              hideProfileHeaderCard={true}
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
            />
          </div>
        </div>
      </main>
    </div>
  );
};
