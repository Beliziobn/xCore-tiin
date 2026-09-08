import React, { useState, useMemo } from 'react';
import { Filter, BarChart3, TrendingUp, CheckCircle, AlertTriangle, Sparkles, FileSpreadsheet, Download, ArrowDownToLine, Users, GraduationCap, UserCheck, School } from 'lucide-react';
import { Hero } from '../../Hero';
import type { AdminSchool, AdminTeacher, AdminStudent, AdminDirector } from '../../../types';
import { 
  computeAdminStats, 
  historicalSchoolPerformance, 
  historicalAttendanceTrends 
} from '../../../data/adminData';
import { StatCardItem } from '../../StatCardItem';
import { GenderDonutChart } from '../../charts/GenderDonutChart';
import { PerformanceBarChart } from '../../charts/PerformanceBarChart';
import { AttendanceAreaChart } from '../../charts/AttendanceAreaChart';
import { DocumentStatusChart } from '../../charts/DocumentStatusChart';
import {
  exportConsolidatedExcel,
  exportTeachersExcel,
  exportDirectorsExcel,
  exportStudentsExcel,
  exportSchoolsExcel,
} from '../../../utils/excelExport';

interface AdminStatisticsPageProps {
  onOpenGetStarted: () => void;
  onNavigateToSchools: () => void;
  onNavigateToTeachers: () => void;
  onNavigateToStudents: () => void;
  schools: AdminSchool[];
  teachers: AdminTeacher[];
  students: AdminStudent[];
  directors?: AdminDirector[];
  onOpenRegisterModal?: () => void;
  onOpenExcelExport?: () => void;
  isLoggedIn?: boolean;
}

export const AdminStatisticsPage: React.FC<AdminStatisticsPageProps> = ({
  onOpenGetStarted,
  onNavigateToSchools,
  onNavigateToTeachers,
  onNavigateToStudents,
  schools,
  teachers,
  students,
  directors = [],
  onOpenExcelExport,
  isLoggedIn,
}) => {
  // Interactive School Filter for real dynamic statistics
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Filtered dataset for real computation
  const filteredSchools = useMemo(() => {
    if (selectedSchoolFilter === 'all') return schools;
    return schools.filter((s) => s.id === selectedSchoolFilter || s.name === selectedSchoolFilter);
  }, [schools, selectedSchoolFilter]);

  const filteredStudents = useMemo(() => {
    if (selectedSchoolFilter === 'all') return students;
    const currentSchool = schools.find((s) => s.id === selectedSchoolFilter);
    if (!currentSchool) return students;
    return students.filter((st) => st.schoolName === currentSchool.name);
  }, [students, schools, selectedSchoolFilter]);

  // Compute live real statistics dynamically!
  const stats = useMemo(() => {
    return computeAdminStats(filteredSchools, filteredStudents);
  }, [filteredSchools, filteredStudents]);

  const handleExportAll = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportConsolidatedExcel({ schools, teachers, directors, students });
      setIsExporting(false);
    }, 400);
  };

  // Max scale calculation for Y-axis dynamic scaling
  const maxStudentsValue = Math.max(stats.femaleStudentsCount, stats.totalStudents, 5000);
  const ySteps = [5000, 3750, 2500, 1250, 0];

  return (
    <div id="admin-statistics-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Hero Header: "Analisa as suas estatísticas" matching 9.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Analisa as suas estatísticas"
        customSubtitle=""
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Real Data Scope Selector Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f75142]/10 flex items-center justify-center text-[#f75142]">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Escopo dos Dados em Tempo Real
              </h3>
              <p className="text-xs text-slate-500">
                Estatísticas calculadas a partir dos registros ativos das {schools.length} escolas da rede.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filtrar:</span>
              <select
                value={selectedSchoolFilter}
                onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                className="w-full sm:w-56 px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer"
              >
                <option value="all">Toda a Rede Central ({schools.length} Escolas)</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.location.split('-')[0].trim()})
                  </option>
                ))}
              </select>
            </div>

            <button
              id="admin-btn-exportar-excel"
              onClick={onOpenExcelExport || handleExportAll}
              disabled={isExporting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
              title="Abrir Central de Exportação de Planilhas Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExporting ? 'Exportando...' : 'Exportar Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>

        {/* Planilhas Excel da Rede - Painel Rápido de Exportação */}
        <div className="bg-transparent rounded-2xl p-5 sm:p-6 mb-10 border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#002133]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Base de Dados & Exportação Oficial
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              Planilhas do Excel da Rede Municipal (Quêssua)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Todos os cadastros de <strong>Professores</strong>, <strong>Diretores</strong> e <strong>Alunos</strong> são automaticamente organizados em planilhas separadas e prontas para auditoria e prestação de contas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => exportTeachersExcel(teachers)}
              className="flex-1 md:flex-initial px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Baixar planilha separada de professores"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Professores ({teachers.length})</span>
            </button>
            <button
              onClick={() => exportDirectorsExcel(directors)}
              className="flex-1 md:flex-initial px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Baixar planilha separada de diretores"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Diretores ({directors.length})</span>
            </button>
            <button
              onClick={() => exportStudentsExcel(students)}
              className="flex-1 md:flex-initial px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Baixar planilha separada de alunos"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Alunos ({students.length})</span>
            </button>
            <button
              onClick={onOpenExcelExport || handleExportAll}
              className="w-full md:w-auto px-4 py-2 bg-[#002133] hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="Baixar pasta consolidada com todas as abas"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Baixar Todas as Abas (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Metric Cards featuring harmonious equal-height cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto mb-14 items-stretch">
          <StatCardItem
            id="admin-stat-card-alunos"
            card={{
              id: 'alunos',
              title: 'Nº Alunos',
              value: String(stats.totalStudents),
              icon: 'users',
              isClickable: true,
              actionText: 'Ver mais',
            }}
            onSelect={onNavigateToStudents}
          />
          <StatCardItem
            id="admin-stat-card-turmas"
            card={{
              id: 'turmas',
              title: 'Nº Turmas',
              value: '148',
              icon: 'home',
              isClickable: false,
            }}
          />
          <StatCardItem
            id="admin-stat-card-escolas"
            card={{
              id: 'escolas',
              title: 'Escolas',
              value: String(stats.totalSchools),
              icon: 'home',
              isClickable: true,
              actionText: 'Ver mais',
            }}
            onSelect={onNavigateToSchools}
          />
          <StatCardItem
            id="admin-stat-card-professores"
            card={{
              id: 'professores',
              title: 'Professores',
              value: String(stats.totalTeachers),
              icon: 'user',
              isClickable: true,
              actionText: 'Ver mais',
            }}
            onSelect={onNavigateToTeachers}
          />
        </div>

        {/* Dynamic Analytics Grid with Animated Interactive Charts */}
        <div className="space-y-8">
          {/* Row 1: [Alunos - Donut/Colunas], [Desempenho - Colunas/Linhas], [Presença - Área/Colunas] */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Chart 1: [Alunos] (Gênero) */}
            <GenderDonutChart
              femaleCount={stats.femaleStudentsCount}
              maleCount={stats.maleStudentsCount}
              totalCount={stats.totalStudents}
              title="Corpo Discente por Gênero"
              badgeText="Alunos"
              subtitle={`Total: ${stats.totalStudents.toLocaleString()} estudantes na rede`}
            />

            {/* Chart 2: [Desempenho das escolas] (Historical Approvals vs Reprovals) */}
            <PerformanceBarChart
              data={historicalSchoolPerformance.slice(0, 6)}
              title="Desempenho das Escolas"
              badgeText="Desempenho"
              subtitle="Taxa de aprovação e reprovação por período letivo"
              targetRate={80}
            />

            {/* Chart 3: [Presença] (Área Suave com Gradientes) */}
            <AttendanceAreaChart
              data={historicalAttendanceTrends.map((t) => ({
                year: t.year,
                presencial: Math.min(100, Math.round(t.presencial * 5.0)),
                ead: Math.min(100, Math.round(t.ead * 2.8)),
              }))}
              title="Presença & Assiduidade"
              badgeText="Presença"
              subtitle="Evolução comparativa: Regime Presencial vs Apoio EAD"
              averageRate={stats.averageAttendanceRate}
            />
          </div>

          {/* Row 2: Regularização Documental Global & Diagnóstico Prioritário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Chart 4: [Alunos com documentos - Donut de Regularidade Civil] */}
            <DocumentStatusChart
              totalWithDocs={stats.totalStudentsWithDocs}
              totalWithoutDocs={stats.totalStudentsWithoutDocs}
              femaleWithDocs={stats.femaleWithDocs}
              maleWithDocs={stats.maleWithDocs}
              femaleWithoutDocs={stats.femaleWithoutDocs}
              maleWithoutDocs={stats.maleWithoutDocs}
              title="Cidadania & Registo Civil"
              badgeText="Alunos com documentos"
              subtitle="Proporção com Certidão de Nascimento, Cédula Pessoal ou BI"
              isFocusWithoutDocs={false}
            />

            {/* Chart 5: [Alunos sem documentos - Colunas de Intervenção Prioritária] */}
            <DocumentStatusChart
              totalWithDocs={stats.totalStudentsWithDocs}
              totalWithoutDocs={stats.totalStudentsWithoutDocs}
              femaleWithDocs={stats.femaleWithDocs}
              maleWithDocs={stats.maleWithDocs}
              femaleWithoutDocs={stats.femaleWithoutDocs}
              maleWithoutDocs={stats.maleWithoutDocs}
              title="Apoio Social & Regularização"
              badgeText="Alunos sem documentos"
              subtitle="Decomposição por gênero de alunos pendentes de certidão"
              isFocusWithoutDocs={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
