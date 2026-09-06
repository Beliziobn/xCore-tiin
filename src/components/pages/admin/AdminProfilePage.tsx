import React from 'react';
import { ShieldCheck, Mail, Phone, MapPin, Building, Award, Calendar, CheckCircle2 } from 'lucide-react';
import { Hero } from '../../Hero';
import type { AdminSchool } from '../../../types';

interface AdminProfilePageProps {
  onOpenGetStarted: () => void;
  schools: AdminSchool[];
  onNavigateToStatistics: () => void;
  isLoggedIn?: boolean;
}

export const AdminProfilePage: React.FC<AdminProfilePageProps> = ({
  onOpenGetStarted,
  schools,
  onNavigateToStatistics,
  isLoggedIn,
}) => {
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
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#5067fc] to-[#4f67ff] text-white font-black text-3xl flex items-center justify-center shadow-lg">
              AF
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Admin. Fred</h2>
                  <p className="text-sm font-semibold text-[#5067fc]">
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
              <span className="text-[10px] text-[#5067fc] font-semibold">100% Integradas</span>
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
              <span className="text-[10px] text-blue-600 font-semibold">Matrículas Homologadas</span>
            </div>
          </div>

          {/* Institutional Directives */}
          <div className="space-y-4 text-xs text-slate-600 bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#5067fc]" />
              Diretrizes Estruturais da Gestão Central uCore
            </h4>
            <p className="leading-relaxed">
              "Priorizamos a melhor organização da Educação em toda a malha escolar. Nosso objetivo estratégico compreende a regularização civil de 100% dos educandos, monitoramento diário da presença de docentes e alunos e acompanhamento contínuo dos índices de aprovação escolar."
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="bg-white px-3 py-1 rounded-full border border-blue-200 text-[#5067fc] font-bold text-[10px]">
                Gestão 2026
              </span>
              <span className="bg-white px-3 py-1 rounded-full border border-blue-200 text-emerald-700 font-bold text-[10px]">
                Registo Civil Ativo
              </span>
              <span className="bg-white px-3 py-1 rounded-full border border-blue-200 text-slate-700 font-bold text-[10px]">
                Auditoria Periódica
              </span>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onNavigateToStatistics}
              className="px-6 py-2.5 bg-[#5067fc] hover:bg-[#435bf7] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all"
            >
              Acessar Painel Estatístico Global &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
