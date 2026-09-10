import React, { useState } from 'react';
import { ArrowRight, UserCheck, FileText, CheckCircle2, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { StudentProfile, computeClassStats, initialStudentsData } from '../../data/teacherData';
import { StatCardItem } from '../StatCardItem';
import { GenderDonutChart } from '../charts/GenderDonutChart';
import { PerformanceBarChart } from '../charts/PerformanceBarChart';
import { AttendanceAreaChart } from '../charts/AttendanceAreaChart';
import { DocumentStatusChart } from '../charts/DocumentStatusChart';
import { ChartDrillDownModal, DrillDownFilter } from '../charts/ChartDrillDownModal';
import { SchoolAnnouncementsBanner } from '../announcements/SchoolAnnouncementsBanner';

interface TeacherStatisticsPageProps {
  onNavigateToClass: () => void;
  onNavigateToTeacherProfile: () => void;
  onNavigateToStudent: (studentId?: string) => void;
  students?: StudentProfile[];
}

export const TeacherStatisticsPage: React.FC<TeacherStatisticsPageProps> = ({
  onNavigateToClass,
  onNavigateToTeacherProfile,
  onNavigateToStudent,
  students = [],
}) => {
  const [dataView, setDataView] = useState<'turma' | 'global'>('global');
  const [drillDownFilter, setDrillDownFilter] = useState<DrillDownFilter | null>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

  const effectiveStudents = students && students.length > 0 ? students : initialStudentsData;
  const classStats = computeClassStats(effectiveStudents);

  const openFilter = (filter: DrillDownFilter) => {
    setDrillDownFilter(filter);
    setIsDrillDownOpen(true);
  };

  // Global counts matching 7.png
  const globalCounts = {
    total: 5051,
    meninas: 4310,
    meninos: 741,
    semDocMeninas: 4310,
    semDocMeninos: 741,
    comDocMeninas: 4310,
    comDocMeninos: 741,
  };

  const isGlobal = dataView === 'global';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 font-sans">
      {/* Drill Down Inspection Modal */}
      <ChartDrillDownModal
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        filter={drillDownFilter}
        students={effectiveStudents}
        onSelectStudent={(studentId) => {
          setIsDrillDownOpen(false);
          onNavigateToStudent(studentId);
        }}
      />

      {/* Top Header & Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] bg-[#fef2f1] text-[#f75142] border border-[#fee4e2] px-3 py-1 rounded-full">
            Painel do Professor
          </span>
          <span className="text-xs font-bold text-slate-500">
            Turma 1 • 4ª Classe • Sala 04
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-full border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setDataView('global')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              isGlobal
                ? 'bg-[#f75142] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Padrão 7.png (Rede)
          </button>
          <button
            onClick={() => setDataView('turma')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              !isGlobal
                ? 'bg-[#f75142] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Minha Turma Real ({effectiveStudents.length} Alunos)
          </button>
        </div>
      </div>

      {/* Pedagogical Announcements Banner for Teachers */}
      <SchoolAnnouncementsBanner
        filterType="notas"
        title="Editais, Prazos & Demandas Pedagógicas em Vigor"
        className="mb-8 shadow-xs"
        onActionClick={() => {
          onNavigateToClass();
        }}
      />

      {/* Metric Cards featuring harmonious equal-height cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto mb-14 items-stretch">
        <StatCardItem
          id="teacher-stat-card-alunos"
          card={{
            id: 'alunos',
            title: 'Nº Alunos',
            value: String(effectiveStudents.length || 46),
            icon: 'users',
            isClickable: true,
            actionText: 'Ver mais',
            subtitle: 'Alunos matriculados na turma',
          }}
          onSelect={onNavigateToClass}
        />
        <StatCardItem
          id="teacher-stat-card-turmas"
          card={{
            id: 'turmas',
            title: 'Nº Turmas',
            value: '1',
            icon: 'home',
            isClickable: false,
            subtitle: 'Turma atribuída ao docente',
          }}
        />
        <StatCardItem
          id="teacher-stat-card-minha-turma"
          card={{
            id: 'minha-turma',
            title: 'Minha Turma',
            value: '1',
            icon: 'home',
            isClickable: true,
            actionText: 'Ver mais',
            subtitle: 'Pauta e fichas da turma',
          }}
          onSelect={onNavigateToClass}
        />
        <StatCardItem
          id="teacher-stat-card-classe"
          card={{
            id: 'classe',
            title: 'Classe',
            value: '4ª',
            icon: 'flag',
            isClickable: false,
            subtitle: 'Ensino Primário Regular',
          }}
        />
      </div>

      {/* Analytics & Statistical Charts Grid with Animated Interactive Charts */}
      <div className="space-y-12">
        {/* Row 1: Alunos + Desempenho dos alunos + Presença */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart 1: Alunos (Gênero) */}
          <GenderDonutChart
            femaleCount={isGlobal ? globalCounts.meninas : classStats.meninas}
            maleCount={isGlobal ? globalCounts.meninos : classStats.meninos}
            totalCount={isGlobal ? globalCounts.total : classStats.total}
            title={isGlobal ? 'Alunos da Rede Escolar' : 'Alunos da Turma'}
            badgeText="Alunos"
            subtitle={isGlobal ? 'Distribuição global por gênero' : 'Distribuição de alunos da turma por gênero'}
            onSelectGender={(gender) => {
              openFilter({
                type: 'gender',
                value: gender,
                title: `Alunos do Gênero ${gender}`,
                subtitle: `Visualização individual dos alunos do gênero ${gender.toLowerCase()} com aproveitamento e assiduidade`,
              });
            }}
          />

          {/* Chart 2: Desempenho dos alunos (Semestres) */}
          <PerformanceBarChart
            data={[
              { period: '2017.1', aprovacao: 69, reprovacao: 31, distincao: 10, regular: 22, recuperacao: 14, totalAvaliados: 46 },
              { period: '2017.2', aprovacao: 76, reprovacao: 24, distincao: 12, regular: 23, recuperacao: 11, totalAvaliados: 46 },
              { period: '2018.1', aprovacao: 72, reprovacao: 28, distincao: 11, regular: 22, recuperacao: 13, totalAvaliados: 46 },
              { period: '2018.2', aprovacao: 89, reprovacao: 11, distincao: 20, regular: 21, recuperacao: 5, totalAvaliados: 46 },
              { period: '2019.1', aprovacao: 79, reprovacao: 21, distincao: 14, regular: 22, recuperacao: 10, totalAvaliados: 46 },
              { period: '2019.2', aprovacao: 81, reprovacao: 19, distincao: 15, regular: 22, recuperacao: 9, totalAvaliados: 46 },
            ]}
            title="Desempenho Acadêmico"
            badgeText="Desempenho dos alunos"
            subtitle="Taxa de aprovação e reprovação por período letivo"
            targetRate={80}
            onOpenDrillDown={(period) => {
              openFilter({
                type: 'performance',
                value: 'aprovados',
                title: `Desempenho Acadêmico • ${period}`,
                subtitle: `Alunos da turma avaliados com notas de aproveitamento curricular`,
              });
            }}
          />

          {/* Chart 3: Presença (EAD vs Presencial) */}
          <AttendanceAreaChart
            data={[
              { year: '2017', presencial: 96, ead: 65, totalPresentes: 44, totalFaltas: 2, detalhe: '44 alunos frequentes regulares' },
              { year: '2018', presencial: 95, ead: 70, totalPresentes: 43, totalFaltas: 3, detalhe: '43 alunos frequentes regulares' },
              { year: '2019', presencial: 96, ead: 82, totalPresentes: 44, totalFaltas: 2, detalhe: '44 alunos frequentes regulares' },
              { year: '2021', presencial: 97, ead: 75, totalPresentes: 45, totalFaltas: 1, detalhe: '45 alunos frequentes regulares' },
              { year: '2023', presencial: 96, ead: 68, totalPresentes: 44, totalFaltas: 2, detalhe: '44 alunos frequentes regulares' },
              { year: '2026', presencial: 98, ead: 65, totalPresentes: 45, totalFaltas: 1, detalhe: '45 alunos frequentes regulares' },
            ]}
            title="Frequência & Presença"
            badgeText="Presença"
            subtitle="Monitorização contínua: Presencial vs Apoio Digital"
            averageRate={96.4}
            onOpenDrillDown={(period) => {
              openFilter({
                type: 'attendance',
                value: 'alto',
                title: `Frequência Escolar • ${period}`,
                subtitle: `Detalhamento de presença e assiduidade dos estudantes`,
              });
            }}
          />
        </div>

        {/* Row 2: Alunos sem documentos & Alunos com documentos matching 7.png */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Chart 4: Alunos sem documentos */}
          <DocumentStatusChart
            totalWithDocs={isGlobal ? globalCounts.comDocMeninas + globalCounts.comDocMeninos : classStats.comDocs}
            totalWithoutDocs={isGlobal ? globalCounts.semDocMeninas + globalCounts.semDocMeninos : classStats.semDocs}
            femaleWithDocs={isGlobal ? globalCounts.comDocMeninas : classStats.meninasComDoc}
            maleWithDocs={isGlobal ? globalCounts.comDocMeninos : classStats.meninosComDoc}
            femaleWithoutDocs={isGlobal ? globalCounts.semDocMeninas : classStats.meninasSemDoc}
            maleWithoutDocs={isGlobal ? globalCounts.semDocMeninos : classStats.meninosSemDoc}
            title="Alunos com Pendência de Registo"
            badgeText="Alunos sem documentos"
            subtitle="Estudantes em processo de obtenção de cédula ou BI"
            isFocusWithoutDocs={true}
            onSelectDocStatus={(status) => {
              openFilter({
                type: 'docs',
                value: status,
                title: status === 'sem_docs' ? 'Alunos com Pendência de Documentos' : 'Alunos com Documentos Regulares',
                subtitle: 'Estudantes identificados com ou sem documentação de registro civil',
              });
            }}
          />

          {/* Chart 5: Alunos com documentos */}
          <DocumentStatusChart
            totalWithDocs={isGlobal ? globalCounts.comDocMeninas + globalCounts.comDocMeninos : classStats.comDocs}
            totalWithoutDocs={isGlobal ? globalCounts.semDocMeninas + globalCounts.semDocMeninos : classStats.semDocs}
            femaleWithDocs={isGlobal ? globalCounts.comDocMeninas : classStats.meninasComDoc}
            maleWithDocs={isGlobal ? globalCounts.comDocMeninos : classStats.meninosComDoc}
            femaleWithoutDocs={isGlobal ? globalCounts.semDocMeninas : classStats.meninasSemDoc}
            maleWithoutDocs={isGlobal ? globalCounts.semDocMeninos : classStats.meninosSemDoc}
            title="Alunos Regularizados"
            badgeText="Alunos com documentos"
            subtitle="Estudantes com certidão de nascimento ou bilhete regular"
            isFocusWithoutDocs={false}
            onSelectDocStatus={(status) => {
              openFilter({
                type: 'docs',
                value: status,
                title: status === 'com_docs' ? 'Alunos Regularizados' : 'Alunos com Pendência',
                subtitle: 'Estudantes com registro civil confirmado pela secretaria',
              });
            }}
          />
        </div>
      </div>

      {/* Quick Navigation Footer */}
      <div className="mt-14 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onNavigateToTeacherProfile}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#f75142] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-full transition-all cursor-pointer"
        >
          <Users className="w-4 h-4 text-[#f75142]" />
          <span>Abrir Perfil do Professor Santar Goes</span>
        </button>

        <button
          onClick={onNavigateToClass}
          className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#f75142] hover:bg-[#e04436] px-5 py-2.5 rounded-full transition-all shadow-md cursor-pointer active:scale-95"
        >
          <span>Gerir Alunos da Minha Turma</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
