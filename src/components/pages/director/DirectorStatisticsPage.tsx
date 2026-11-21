import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  ArrowDownToLine,
  Table,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Hero } from '../../Hero';
import { directorStatsData } from '../../../data/directorData';
import { initialStudentsData } from '../../../data/teacherData';
import { StatCardItem } from '../../StatCardItem';
import { GenderDonutChart } from '../../charts/GenderDonutChart';
import { PerformanceBarChart } from '../../charts/PerformanceBarChart';
import { AttendanceAreaChart } from '../../charts/AttendanceAreaChart';
import { DocumentStatusChart } from '../../charts/DocumentStatusChart';
import { ChartDrillDownModal, DrillDownFilter } from '../../charts/ChartDrillDownModal';
import { SchoolAnnouncementsBanner } from '../../announcements/SchoolAnnouncementsBanner';
import { SigeOfficialViewerModal } from '../../sige/SigeOfficialViewerModal';
import type { AdminSchool, AdminTeacher, AdminStudent, UserAccount } from '../../../types';
import {
  getUnifiedSystemDataset,
  filterDatasetForSchoolDirector,
  getOfficialSigeFileName,
  exportOfficialSigeExcel,
} from '../../../utils/excelExport';
import { aggregateSigeDataset } from '../../../utils/sigeAggregation';

interface DirectorStatisticsPageProps {
  onOpenGetStarted: () => void;
  onNavigateToRooms?: () => void;
  onNavigateToTeachers?: () => void;
  onNavigateToStudents?: () => void;
  onOpenExcelExport?: () => void;
  isLoggedIn?: boolean;
  currentUser?: UserAccount | null;
  schools?: AdminSchool[];
  teachers?: AdminTeacher[];
  students?: AdminStudent[];
}

export const DirectorStatisticsPage: React.FC<DirectorStatisticsPageProps> = ({
  onOpenGetStarted,
  onNavigateToRooms = () => {},
  onNavigateToTeachers = () => {},
  onNavigateToStudents = () => {},
  onOpenExcelExport,
  isLoggedIn,
  currentUser,
  schools,
  teachers,
  students,
}) => {
  const [drillDownFilter, setDrillDownFilter] = useState<DrillDownFilter | null>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [isSigeViewerOpen, setIsSigeViewerOpen] = useState(false);
  const [isExportingSige, setIsExportingSige] = useState(false);
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    const handleSync = () => setSyncTick((t) => t + 1);
    window.addEventListener('ucore-teachers-updated', handleSync);
    window.addEventListener('ucore-students-updated', handleSync);
    window.addEventListener('sigre-vagas-docentes-updated', handleSync);
    window.addEventListener('sigre-data-synced', handleSync);
    return () => {
      window.removeEventListener('ucore-teachers-updated', handleSync);
      window.removeEventListener('ucore-students-updated', handleSync);
      window.removeEventListener('sigre-vagas-docentes-updated', handleSync);
      window.removeEventListener('sigre-data-synced', handleSync);
    };
  }, []);

  // Fonte Única da Verdade — Filtrada estritamente para a escola do Diretor (Nível Micro)
  const schoolDataset = useMemo(() => {
    const raw = getUnifiedSystemDataset({ schools, teachers, students });
    return filterDatasetForSchoolDirector(raw, currentUser?.schoolId, currentUser?.schoolName);
  }, [schools, teachers, students, currentUser?.schoolId, currentUser?.schoolName, syncTick]);

  const sigeReport = useMemo(() => {
    return aggregateSigeDataset(schoolDataset);
  }, [schoolDataset]);

  const resolvedSchoolName =
    currentUser?.schoolName ||
    schoolDataset.schools[0]?.name ||
    'Escola';

  const officialSchoolFileName = useMemo(
    () =>
      getOfficialSigeFileName(schoolDataset, {
        isSchoolDirector: true,
        schoolName: resolvedSchoolName,
        extension: 'xlsx',
      }),
    [schoolDataset, resolvedSchoolName]
  );

  const totalStudentsCount = schoolDataset.students.length;
  const totalTeachersCount = schoolDataset.teachers.length;
  const totalTurmasCount =
    sigeReport.totaisGerais.totalTurmas ||
    schoolDataset.schools.reduce((acc, s) => acc + (Number(s.turmasCount) || 0), 0);
  const totalSalasCount =
    sigeReport.totaisGerais.totalSalas ||
    schoolDataset.schools.reduce((acc, s) => acc + (Number(s.roomsCount) || 0), 0);

  const genderBreakdown = useMemo(() => {
    let female = 0;
    let male = 0;
    let withDocsFemale = 0;
    let withDocsMale = 0;
    let withoutDocsFemale = 0;
    let withoutDocsMale = 0;

    schoolDataset.students.forEach((st) => {
      const g = (st.gender || '').toLowerCase();
      const isF = g === 'f' || g.startsWith('fem');
      if (isF) female++;
      else male++;

      const hasDoc = Boolean(st.biNumber && st.biNumber.trim().length >= 5 && st.biNumber !== '—');
      if (hasDoc) {
        if (isF) withDocsFemale++;
        else withDocsMale++;
      } else {
        if (isF) withoutDocsFemale++;
        else withoutDocsMale++;
      }
    });

    return {
      female,
      male,
      total: female + male,
      withDocsFemale,
      withDocsMale,
      totalWithDocs: withDocsFemale + withDocsMale,
      withoutDocsFemale,
      withoutDocsMale,
      totalWithoutDocs: withoutDocsFemale + withoutDocsMale,
    };
  }, [schoolDataset.students]);

  const handleDirectSchoolSigeExport = async () => {
    setIsExportingSige(true);
    try {
      await exportOfficialSigeExcel(schoolDataset, officialSchoolFileName);
    } finally {
      setIsExportingSige(false);
    }
  };

  const openFilter = (filter: DrillDownFilter) => {
    setDrillDownFilter(filter);
    setIsDrillDownOpen(true);
  };

  return (
    <div id="director-statistics-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Interactive Drill Down Modal */}
      <ChartDrillDownModal
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        filter={drillDownFilter}
        students={initialStudentsData}
        onSelectStudent={() => {
          setIsDrillDownOpen(false);
          onNavigateToStudents();
        }}
      />

      {/* SIGE Official Viewer Modal (Nível Micro - Isolado para a Escola) */}
      <SigeOfficialViewerModal
        isOpen={isSigeViewerOpen}
        onClose={() => setIsSigeViewerOpen(false)}
        schools={schoolDataset.schools}
        teachers={schoolDataset.teachers}
        directors={schoolDataset.directors}
        students={schoolDataset.students}
        currentUser={currentUser}
      />

      {/* Hero: "Analisa as suas estatísticas" matching 5.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Analisa as suas estatísticas"
        customSubtitle=""
      />

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Institutional Announcements Banner for Directors */}
        <SchoolAnnouncementsBanner
          title="Editais, Prazos & Circulares Oficiais da Rede"
          className="mb-8 shadow-xs"
          onActionClick={(ad) => {
            if (ad.demandType === 'matriculas') {
              onNavigateToStudents();
            } else if (ad.demandType === 'notas') {
              onNavigateToStudents();
            }
          }}
        />

        {/* Painel Institucional Dedicado de Exportação SIGE 2026/2027 (Nível Micro - Escola) */}
        <section
          id="director-sige-export-panel"
          className="mb-10 bg-white rounded-2xl p-5 sm:p-6 border border-[#0b3d5c]/25 border-l-4 border-l-[#0b3d5c] shadow-xs"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0b3d5c]/10 text-[#0b3d5c] text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0b3d5c]" />
                  <span>Nível Micro • Visão Institucional Dedicada ({resolvedSchoolName})</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Sincronizado com a Direção Municipal</span>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight break-all">
                {officialSchoolFileName}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Espelha exatamente a estrutura oficial de colunas e abas do SIGE 2026/2027, filtrada exclusivamente para os alunos ({totalStudentsCount}), professores ({totalTeachersCount}), turmas ({totalTurmasCount}) e estatísticas de <strong>{resolvedSchoolName}</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsSigeViewerOpen(true)}
                className="h-11 px-4 rounded-xl bg-[#0891b2] hover:bg-[#0e7490] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Visualizar as abas oficiais SIGE 2026/2027 filtradas para esta escola"
              >
                <Table className="w-4 h-4 shrink-0" />
                <span>Visualizar Relatório SIGE</span>
              </button>

              <button
                type="button"
                id="btn-director-export-sige-excel"
                onClick={handleDirectSchoolSigeExport}
                disabled={isExportingSige}
                className="h-11 px-4 rounded-xl bg-[#0b3d5c] hover:bg-[#072a40] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                title={`Baixar ${officialSchoolFileName}`}
              >
                <ArrowDownToLine className="w-4 h-4 shrink-0" />
                <span>{isExportingSige ? 'Gerando Excel...' : 'Exportar Dados Excel (.xlsx)'}</span>
              </button>

              {onOpenExcelExport && (
                <button
                  type="button"
                  onClick={onOpenExcelExport}
                  className="h-11 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Abrir Central de Exportação da Escola"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#0b3d5c] shrink-0" />
                  <span>Mais Opções</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Metric Cards featuring harmonious equal-height cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto mb-14 items-stretch">
          <StatCardItem
            id="dir-stat-card-alunos"
            card={{
              id: 'alunos',
              title: 'Nº Alunos',
              value: String(totalStudentsCount),
              icon: 'users',
              isClickable: true,
              actionText: 'Ver mais',
              subtitle: 'Matrículas Regulares',
            }}
            onSelect={onNavigateToStudents}
          />
          <StatCardItem
            id="dir-stat-card-turmas"
            card={{
              id: 'turmas',
              title: 'Nº Turmas',
              value: String(totalTurmasCount),
              icon: 'home',
              isClickable: false,
              subtitle: 'Turmas Ativas na Unidade',
            }}
          />
          <StatCardItem
            id="dir-stat-card-salas"
            card={{
              id: 'salas',
              title: 'Salas',
              value: String(totalSalasCount),
              icon: 'home',
              isClickable: true,
              actionText: 'Ver mais',
              subtitle: 'Espaços Físicos',
            }}
            onSelect={onNavigateToRooms}
          />
          <StatCardItem
            id="dir-stat-card-professores"
            card={{
              id: 'professores',
              title: 'Professores',
              value: String(totalTeachersCount),
              icon: 'user',
              isClickable: true,
              actionText: 'Ver mais',
              subtitle: 'Quadro Docente Ativo',
            }}
            onSelect={onNavigateToTeachers}
          />
        </div>

        {/* Statistical Visualizers Grid reproducing exact layout in 5.png with modern interactive charts */}
        <div className="space-y-8">
          {/* Row 1: [Alunos - Donut/Colunas] + [Desempenho - Colunas/Linhas] + [Presença - Área/Colunas] */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Chart 1: [Alunos] (Gênero) */}
            <GenderDonutChart
              femaleCount={genderBreakdown.female}
              maleCount={genderBreakdown.male}
              totalCount={genderBreakdown.total}
              title="Gênero dos Alunos"
              badgeText="Alunos"
              subtitle="Distribuição de alunos da escola por gênero"
              onSelectGender={(gender) => {
                openFilter({
                  type: 'gender',
                  value: gender,
                  title: `Estudantes do Gênero ${gender}`,
                  subtitle: `Alunos da instituição cadastrados no sistema`,
                });
              }}
            />

            {/* Chart 2: [Desempenho dos alunos] */}
            <PerformanceBarChart
              data={directorStatsData.academicPerformance.map((item) => ({
                period: item.semester,
                aprovacao: item.approval,
                reprovacao: item.reproval,
                distincao: 0,
                regular: 0,
                recuperacao: 0,
                totalAvaliados: 0,
              }))}
              title="Desempenho da Unidade"
              badgeText="Desempenho dos alunos"
              subtitle="Rendimento acadêmico por semestre avaliativo"
              targetRate={80}
              onOpenDrillDown={(period) => {
                openFilter({
                  type: 'performance',
                  value: 'aprovados',
                  title: `Desempenho Acadêmico • ${period}`,
                  subtitle: `Rendimento escolar verificado no período ${period}`,
                });
              }}
            />

            {/* Chart 3: [Presença] */}
            <AttendanceAreaChart
              data={[
                { year: '2022', presencial: 0, ead: 0, totalPresentes: 0, totalFaltas: 0, detalhe: '0 alunos presentes' },
                { year: '2023', presencial: 0, ead: 0, totalPresentes: 0, totalFaltas: 0, detalhe: '0 alunos presentes' },
                { year: '2024', presencial: 0, ead: 0, totalPresentes: 0, totalFaltas: 0, detalhe: '0 alunos presentes' },
                { year: '2025', presencial: 0, ead: 0, totalPresentes: 0, totalFaltas: 0, detalhe: '0 alunos presentes' },
                { year: '2026', presencial: totalStudentsCount, ead: 0, totalPresentes: totalStudentsCount, totalFaltas: 0, detalhe: `${totalStudentsCount} alunos ativos` },
              ]}
              title="Presença & Assiduidade"
              badgeText="Presença"
              subtitle="Controle diário de assiduidade na escola"
              averageRate={totalStudentsCount > 0 ? 96 : 0}
              onOpenDrillDown={(period) => {
                openFilter({
                  type: 'attendance',
                  value: 'alto',
                  title: `Presença & Assiduidade • ${period}`,
                  subtitle: `Registros de frequência dos alunos no ano de ${period}`,
                });
              }}
            />
          </div>

          {/* Row 2: [Alunos sem documentos] & [Alunos com documentos] matching bottom of 5.png */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Chart 4: Alunos sem documentos */}
            <DocumentStatusChart
              totalWithDocs={genderBreakdown.totalWithDocs}
              totalWithoutDocs={genderBreakdown.totalWithoutDocs}
              femaleWithDocs={genderBreakdown.withDocsFemale}
              maleWithDocs={genderBreakdown.withDocsMale}
              femaleWithoutDocs={genderBreakdown.withoutDocsFemale}
              maleWithoutDocs={genderBreakdown.withoutDocsMale}
              title="Pendências Documentais"
              badgeText="Alunos sem documentos"
              subtitle="Alunos em processo de emissão de cédula ou BI"
              isFocusWithoutDocs={true}
              onSelectDocStatus={(status) => {
                openFilter({
                  type: 'docs',
                  value: status,
                  title: status === 'sem_docs' ? 'Pendências de Documentos' : 'Documentos Regularizados',
                  subtitle: `Alunos identificados no censo documental da escola`,
                });
              }}
            />

            {/* Chart 5: Alunos com documentos */}
            <DocumentStatusChart
              totalWithDocs={genderBreakdown.totalWithDocs}
              totalWithoutDocs={genderBreakdown.totalWithoutDocs}
              femaleWithDocs={genderBreakdown.withDocsFemale}
              maleWithDocs={genderBreakdown.withDocsMale}
              femaleWithoutDocs={genderBreakdown.withoutDocsFemale}
              maleWithoutDocs={genderBreakdown.withoutDocsMale}
              title="Regularidade Registral"
              badgeText="Alunos com documentos"
              subtitle="Documentação completa validada pela secretaria"
              isFocusWithoutDocs={false}
              onSelectDocStatus={(status) => {
                openFilter({
                  type: 'docs',
                  value: status,
                  title: status === 'com_docs' ? 'Documentos Regularizados' : 'Pendências de Documentos',
                  subtitle: `Alunos com documentação civil completa validada`,
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
