import React, { useState, useMemo } from 'react';
import { Hero } from '../../Hero';
import type { AdminSchool, AdminTeacher, AdminStudent, AdminDirector } from '../../../types';
import { 
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
} from '../../../utils/excelExport';
import { AdminAdvancedFilter } from './AdminAdvancedFilter';
import type { AdvancedFilterCriteria } from '../../../types/filterTypes';
import { defaultFilterCriteria } from '../../../types/filterTypes';
import { applyAdvancedFilters } from '../../../utils/statisticsFilter';
import { Download, FileSpreadsheet } from 'lucide-react';

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
  onOpenGoogleSheets?: () => void;
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
  onOpenGoogleSheets,
  isLoggedIn,
}) => {
  // Advanced Multi-Criteria Filter State
  const [filters, setFilters] = useState<AdvancedFilterCriteria>(defaultFilterCriteria);
  const [isExporting, setIsExporting] = useState(false);

  // Apply real-time multi-dimensional filters
  const filterStats = useMemo(() => {
    return applyAdvancedFilters(schools, teachers, students, directors, filters);
  }, [schools, teachers, students, directors, filters]);

  // Remove individual chip
  const handleRemoveChip = (key: string) => {
    if (key === 'schools') {
      setFilters((prev) => ({ ...prev, schools: ['all'], gradeClass: 'all', turma: 'all' }));
    } else if (key === 'periodType') {
      setFilters((prev) => ({ ...prev, periodType: 'anual', periodDetail: 'Ano Completo' }));
    } else if (key in defaultFilterCriteria) {
      setFilters((prev) => ({ ...prev, [key]: (defaultFilterCriteria as any)[key] }));
    }
  };

  const handleResetFilters = () => {
    setFilters(defaultFilterCriteria);
  };

  // Compute live real statistics dynamically from filtered dataset!
  const totalStudents = filterStats.totalStudents;
  const totalTeachers = filterStats.totalTeachers;
  const totalSchools = filterStats.totalSchools;
  const totalDirectors = filterStats.totalDirectors;
  const uniqueTurmas = filterStats.uniqueTurmasCount;

  // Gender counts directly from filtered students
  const femaleStudentsCount = useMemo(() => {
    return filterStats.filteredStudents.filter((s) => s.gender === 'F').length;
  }, [filterStats.filteredStudents]);

  const maleStudentsCount = useMemo(() => {
    return filterStats.filteredStudents.filter((s) => s.gender === 'M').length;
  }, [filterStats.filteredStudents]);

  // Documents by gender from filtered students
  const totalStudentsWithDocs = useMemo(() => {
    return filterStats.filteredStudents.filter((s) => s.hasDocuments).length;
  }, [filterStats.filteredStudents]);

  const totalStudentsWithoutDocs = Math.max(0, totalStudents - totalStudentsWithDocs);

  const femaleWithDocs = useMemo(() => {
    return filterStats.filteredStudents.filter((s) => s.gender === 'F' && s.hasDocuments).length;
  }, [filterStats.filteredStudents]);

  const maleWithDocs = useMemo(() => {
    return filterStats.filteredStudents.filter((s) => s.gender === 'M' && s.hasDocuments).length;
  }, [filterStats.filteredStudents]);

  const femaleWithoutDocs = Math.max(0, femaleStudentsCount - femaleWithDocs);
  const maleWithoutDocs = Math.max(0, maleStudentsCount - maleWithDocs);

  // Attendance rate for filtered cohort
  const averageAttendanceRate = useMemo(() => {
    if (filterStats.filteredStudents.length > 0) {
      const sum = filterStats.filteredStudents.reduce((acc, s) => acc + (s.presenceRate || 95), 0);
      return Number((sum / filterStats.filteredStudents.length).toFixed(1));
    }
    if (filterStats.filteredSchools.length > 0) {
      const sum = filterStats.filteredSchools.reduce((acc, s) => acc + s.attendanceRate, 0);
      return Number((sum / filterStats.filteredSchools.length).toFixed(1));
    }
    return 95.8;
  }, [filterStats.filteredStudents, filterStats.filteredSchools]);

  // Overall approval rate for filtered cohort
  const overallApprovalRate = useMemo(() => {
    if (filterStats.filteredStudents.length > 0) {
      const passing = filterStats.filteredStudents.filter((s) => {
        const score = s.performanceScore || 8;
        return score > 10 ? score >= 70 : score >= 7.0;
      }).length;
      return Math.round((passing / filterStats.filteredStudents.length) * 100);
    }
    if (filterStats.filteredSchools.length > 0) {
      const sum = filterStats.filteredSchools.reduce((acc, s) => acc + s.performanceRate, 0);
      return Math.round(sum / filterStats.filteredSchools.length);
    }
    return 80;
  }, [filterStats.filteredStudents, filterStats.filteredSchools]);

  // Performance Chart Data adapted for filter period & scope
  const performanceChartData = useMemo(() => {
    const approval = overallApprovalRate;
    const reproval = Math.max(0, 100 - approval);

    if (filters.periodType === 'trimestre') {
      return [
        { period: '1º Trimestre', aprovacao: Math.min(100, Math.round(approval * 0.94)), reprovacao: Math.max(0, 100 - Math.round(approval * 0.94)) },
        { period: '2º Trimestre', aprovacao: Math.min(100, Math.round(approval * 0.98)), reprovacao: Math.max(0, 100 - Math.round(approval * 0.98)) },
        { period: '3º Trimestre', aprovacao: approval, reprovacao: reproval },
      ];
    }
    if (filters.periodType === 'semestre') {
      return [
        { period: '1º Semestre', aprovacao: Math.min(100, Math.round(approval * 0.95)), reprovacao: Math.max(0, 100 - Math.round(approval * 0.95)) },
        { period: '2º Semestre', aprovacao: approval, reprovacao: reproval },
      ];
    }
    // Default 6-period historical trend scaled to current filter
    return historicalSchoolPerformance.slice(0, 6).map((item) => {
      const blendedApproval = Math.min(100, Math.round((item.aprovacao + approval) / 2));
      return {
        period: item.period,
        aprovacao: blendedApproval,
        reprovacao: Math.max(0, 100 - blendedApproval),
      };
    });
  }, [filters.periodType, overallApprovalRate]);

  // Attendance Chart Data adapted for filter scope
  const attendanceChartData = useMemo(() => {
    const curPresencial = averageAttendanceRate;
    const curEad = Math.min(100, Math.round(curPresencial * 0.73));

    return historicalAttendanceTrends.map((t) => ({
      year: t.year,
      presencial: Math.min(100, Math.round((t.presencial * 5.0 + curPresencial) / 2)),
      ead: Math.min(100, Math.round((t.ead * 2.8 + curEad) / 2)),
    }));
  }, [averageAttendanceRate]);

  // Export filtered datasets
  const handleExportFilteredAll = () => {
    setIsExporting(true);
    setTimeout(() => {
      const dateTag = new Date().toISOString().substring(0, 10);
      const safeContext = filterStats.contextLabel.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `uCore_Estatisticas_Filtradas_${safeContext}_${dateTag}.xlsx`;

      exportConsolidatedExcel(
        {
          schools: filterStats.filteredSchools,
          teachers: filterStats.filteredTeachers,
          directors: filterStats.filteredDirectors,
          students: filterStats.filteredStudents,
        },
        filename
      );
      setIsExporting(false);
    }, 350);
  };

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
        {/* Advanced Interactive Filtering System */}
        <AdminAdvancedFilter
          schools={schools}
          teachers={teachers}
          students={students}
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={handleResetFilters}
          feedbackText={filterStats.feedbackText}
          activeFilterCount={filterStats.activeFilterCount}
          activeChips={filterStats.activeChips}
          onRemoveChip={handleRemoveChip}
          onExportFilteredExcel={handleExportFilteredAll}
          isExporting={isExporting}
        />

        {/* Planilhas Excel da Rede - Painel Rápido de Exportação com Dados Filtrados */}
        <div className="bg-transparent rounded-2xl p-5 sm:p-6 mb-10 border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#002133]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Base de Dados & Exportação Oficial Filtrada
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              Planilhas do Excel da Rede ({filterStats.contextLabel})
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Os ficheiros exportados abaixo refletem <strong>exatamente os mesmos critérios do filtro ativo</strong> ({filterStats.feedbackText}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => exportTeachersExcel(filterStats.filteredTeachers)}
              className="flex-1 md:flex-initial px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Baixar planilha de professores correspondentes ao filtro ativo"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Professores ({totalTeachers})</span>
            </button>
            <button
              onClick={() => exportStudentsExcel(filterStats.filteredStudents)}
              className="flex-1 md:flex-initial px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Baixar planilha de alunos correspondentes ao filtro ativo"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Alunos ({totalStudents})</span>
            </button>
            <button
              onClick={handleExportFilteredAll}
              disabled={isExporting}
              className="w-full md:w-auto px-4 py-2 bg-[#002133] hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              title="Baixar pasta consolidada com todas as abas nos critérios do filtro"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExporting ? 'A Exportar...' : 'Baixar (.xlsx)'}</span>
            </button>
            {onOpenGoogleSheets && (
              <button
                onClick={onOpenGoogleSheets}
                className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Exportar ou sincronizar com o Google Planilhas (Google Sheets)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Google Planilhas</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards featuring harmonious equal-height cards with Filter Context */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto mb-14 items-stretch">
          <StatCardItem
            id="admin-stat-card-alunos"
            card={{
              id: 'alunos',
              title: 'Nº Alunos',
              value: String(totalStudents),
              subtitle: `${totalStudents} alunos · ${filterStats.contextLabel}`,
              icon: 'users',
              isClickable: true,
              actionText: 'Ver alunos',
            }}
            onSelect={onNavigateToStudents}
          />
          <StatCardItem
            id="admin-stat-card-turmas"
            card={{
              id: 'turmas',
              title: 'Nº Turmas',
              value: String(uniqueTurmas),
              subtitle: `${uniqueTurmas} turmas · ${filterStats.contextLabel}`,
              icon: 'home',
              isClickable: false,
            }}
          />
          <StatCardItem
            id="admin-stat-card-escolas"
            card={{
              id: 'escolas',
              title: 'Escolas',
              value: String(totalSchools),
              subtitle: `${totalSchools} escola${totalSchools === 1 ? '' : 's'} · ${filterStats.contextLabel}`,
              icon: 'home',
              isClickable: true,
              actionText: 'Ver escolas',
            }}
            onSelect={onNavigateToSchools}
          />
          <StatCardItem
            id="admin-stat-card-professores"
            card={{
              id: 'professores',
              title: 'Professores',
              value: String(totalTeachers),
              subtitle: `${totalTeachers} professores · ${filterStats.contextLabel}`,
              icon: 'user',
              isClickable: true,
              actionText: 'Ver professores',
            }}
            onSelect={onNavigateToTeachers}
          />
        </div>

        {/* Dynamic Analytics Grid with Animated Interactive Charts Updated by the Filters */}
        <div className="space-y-8">
          {/* Row 1: [Alunos - Donut], [Desempenho - Colunas], [Presença - Área] */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Chart 1: [Alunos] (Gênero) */}
            <GenderDonutChart
              femaleCount={femaleStudentsCount}
              maleCount={maleStudentsCount}
              totalCount={totalStudents}
              title="Corpo Discente por Gênero"
              badgeText="Alunos"
              subtitle={`Total: ${totalStudents.toLocaleString('pt-PT')} estudantes (${filterStats.contextLabel})`}
            />

            {/* Chart 2: [Desempenho das escolas] (Historical Approvals vs Reprovals) */}
            <PerformanceBarChart
              data={performanceChartData}
              title="Desempenho Acadêmico"
              badgeText="Desempenho"
              subtitle={`Taxa de aprovação e reprovação (${filterStats.contextLabel})`}
              targetRate={80}
            />

            {/* Chart 3: [Presença] (Área Suave com Gradientes) */}
            <AttendanceAreaChart
              data={attendanceChartData}
              title="Presença & Assiduidade"
              badgeText="Presença"
              subtitle={`Presença média: ${averageAttendanceRate}% (${filterStats.contextLabel})`}
              averageRate={averageAttendanceRate}
            />
          </div>

          {/* Row 2: Regularização Documental Global & Diagnóstico Prioritário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Chart 4: [Alunos com documentos - Donut de Regularidade Civil] */}
            <DocumentStatusChart
              totalWithDocs={totalStudentsWithDocs}
              totalWithoutDocs={totalStudentsWithoutDocs}
              femaleWithDocs={femaleWithDocs}
              maleWithDocs={maleWithDocs}
              femaleWithoutDocs={femaleWithoutDocs}
              maleWithoutDocs={maleWithoutDocs}
              title="Cidadania & Registo Civil"
              badgeText="Alunos com documentos"
              subtitle={`Proporção regularizada (${filterStats.contextLabel})`}
              isFocusWithoutDocs={false}
            />

            {/* Chart 5: [Alunos sem documentos - Colunas de Intervenção Prioritária] */}
            <DocumentStatusChart
              totalWithDocs={totalStudentsWithDocs}
              totalWithoutDocs={totalStudentsWithoutDocs}
              femaleWithDocs={femaleWithDocs}
              maleWithDocs={maleWithDocs}
              femaleWithoutDocs={femaleWithoutDocs}
              maleWithoutDocs={maleWithoutDocs}
              title="Apoio Social & Regularização"
              badgeText="Alunos sem documentos"
              subtitle={`Decomposição por gênero de alunos pendentes (${filterStats.contextLabel})`}
              isFocusWithoutDocs={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
