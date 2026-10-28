import React, { useState, useMemo } from 'react';
import type { AdminSchool, AdminTeacher, AdminStudent, AdminDirector } from '../../../types';
import { exportConsolidatedExcel } from '../../../utils/excelExport';
import type { AdvancedFilterCriteria } from '../../../types/filterTypes';
import { defaultFilterCriteria } from '../../../types/filterTypes';
import { applyAdvancedFilters } from '../../../utils/statisticsFilter';
import { SigeOfficialViewerModal } from '../../sige/SigeOfficialViewerModal';

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
  onOpenAuditLogs?: () => void;
  isLoggedIn?: boolean;
}

export const AdminStatisticsPage: React.FC<AdminStatisticsPageProps> = ({
  onNavigateToSchools,
  onNavigateToTeachers,
  onNavigateToStudents,
  schools,
  teachers,
  students,
  directors = [],
  onOpenExcelExport,
  onOpenGoogleSheets,
}) => {
  const [filters, setFilters] = useState<AdvancedFilterCriteria>(defaultFilterCriteria);
  const [isExporting, setIsExporting] = useState(false);
  const [isSigeViewerOpen, setIsSigeViewerOpen] = useState(false);

  const filterStats = useMemo(() => {
    return applyAdvancedFilters(schools, teachers, students, directors, filters);
  }, [schools, teachers, students, directors, filters]);

  const totalStudents = filterStats.totalStudents;
  const totalTeachers = filterStats.totalTeachers;
  const totalSchools = filterStats.totalSchools;
  const uniqueTurmas = filterStats.uniqueTurmasCount;

  const totalStudentsWithDocs = useMemo(() => {
    return filterStats.filteredStudents.filter((s) => s.hasDocuments).length;
  }, [filterStats.filteredStudents]);

  const totalStudentsWithoutDocs = Math.max(0, totalStudents - totalStudentsWithDocs);

  const docRegularizedPercent = useMemo(() => {
    if (totalStudents > 0) {
      return Math.round((totalStudentsWithDocs / totalStudents) * 100);
    }
    return 100;
  }, [totalStudents, totalStudentsWithDocs]);

  const averageAttendanceRate = useMemo(() => {
    if (filterStats.filteredStudents.length > 0) {
      const sum = filterStats.filteredStudents.reduce((acc, s) => acc + (s.presenceRate || 95), 0);
      return Number((sum / filterStats.filteredStudents.length).toFixed(0));
    }
    if (filterStats.filteredSchools.length > 0) {
      const sum = filterStats.filteredSchools.reduce((acc, s) => acc + s.attendanceRate, 0);
      return Number((sum / filterStats.filteredSchools.length).toFixed(0));
    }
    return 0;
  }, [filterStats.filteredStudents, filterStats.filteredSchools]);

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
    return 0;
  }, [filterStats.filteredStudents, filterStats.filteredSchools]);

  const distinctionCount = useMemo(() => {
    if (filterStats.filteredStudents.length === 0) return 20;
    return filterStats.filteredStudents.filter((s) => (s.performanceScore || 0) >= 16).length;
  }, [filterStats.filteredStudents]);

  const regularCount = useMemo(() => {
    if (filterStats.filteredStudents.length === 0) return 21;
    return filterStats.filteredStudents.filter(
      (s) => (s.performanceScore || 0) >= 10 && (s.performanceScore || 0) < 16
    ).length;
  }, [filterStats.filteredStudents]);

  const recoveryCount = useMemo(() => {
    if (filterStats.filteredStudents.length === 0) return 5;
    return filterStats.filteredStudents.filter((s) => (s.performanceScore || 0) < 10).length;
  }, [filterStats.filteredStudents]);

  const handleExportFilteredAll = () => {
    if (onOpenExcelExport) {
      onOpenExcelExport();
      return;
    }
    setIsExporting(true);
    setTimeout(() => {
      const dateTag = new Date().toISOString().substring(0, 10);
      const safeContext = filterStats.contextLabel.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Sigre_Estatisticas_Filtradas_${safeContext}_${dateTag}.xlsx`;

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
    }, 300);
  };

  return (
    <div id="admin-statistics-page" className="w-full min-h-screen bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Cabeçalho Minimalista */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 pb-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Análise Estatística & Metas</h1>
            <p className="text-sm text-slate-500">
              Indicadores sincronizados de rendimento, assiduidade e documentação.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsSigeViewerOpen(true)}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition cursor-pointer"
            >
              Planilha SIGE
            </button>
            <button
              type="button"
              onClick={handleExportFilteredAll}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition cursor-pointer"
            >
              {isExporting ? 'A exportar...' : 'Exportar Planilha (.xlsx)'}
            </button>
          </div>
        </div>

        {/* Barra de Filtros Horizontal Compacta (Substitui o bloco gigante de filtros) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-400">Escola</label>
            <select
              value={filters.schools[0] || 'all'}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  schools: e.target.value === 'all' ? ['all'] : [e.target.value],
                }))
              }
              className="w-full mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-900"
            >
              <option value="all">
                Toda a Rede ({schools.length} {schools.length === 1 ? 'Escola' : 'Escolas'})
              </option>
              {schools.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400">Ano Letivo</label>
            <select
              value={filters.academicYear}
              onChange={(e) => setFilters((prev) => ({ ...prev, academicYear: e.target.value }))}
              className="w-full mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-900"
            >
              <option value="2026">2026 / 2027 (Corrente)</option>
              <option value="2025">2025 / 2026</option>
              <option value="2024">2024 / 2025</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400">Período</label>
            <select
              value={filters.periodType}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  periodType: e.target.value as any,
                  periodDetail: e.target.value === 'anual' ? 'Ano Completo' : '1º Trimestre',
                }))
              }
              className="w-full mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-900"
            >
              <option value="anual">Anual (Completo)</option>
              <option value="trimestre">Trimestral</option>
              <option value="semestre">Semestral</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400">Modalidade</label>
            <select
              value={filters.modality}
              onChange={(e) => setFilters((prev) => ({ ...prev, modality: e.target.value as any }))}
              className="w-full mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-900"
            >
              <option value="all">Todas (Presencial & EAD)</option>
              <option value="presencial">Presencial</option>
              <option value="ead">Ensino a Distância (EAD)</option>
            </select>
          </div>
        </div>

        {/* Faixa de Resumo Quantitativo Contínua */}
        <div className="bg-white rounded-xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="p-5">
            <span className="text-xs text-slate-400 font-medium">Escolas Filtradas</span>
            <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {totalSchools}
            </div>
            <button
              type="button"
              onClick={onNavigateToSchools}
              className="text-[11px] text-slate-500 hover:text-[#e11d48] mt-1.5 inline-block cursor-pointer"
            >
              Ver escolas →
            </button>
          </div>

          <div className="p-5">
            <span className="text-xs text-slate-400 font-medium">Professores</span>
            <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {totalTeachers}
            </div>
            <button
              type="button"
              onClick={onNavigateToTeachers}
              className="text-[11px] text-slate-500 hover:text-[#e11d48] mt-1.5 inline-block cursor-pointer"
            >
              Ver professores →
            </button>
          </div>

          <div className="p-5">
            <span className="text-xs text-slate-400 font-medium">Alunos Matriculados</span>
            <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {totalStudents}
            </div>
            <button
              type="button"
              onClick={onNavigateToStudents}
              className="text-[11px] text-slate-500 hover:text-[#e11d48] mt-1.5 inline-block cursor-pointer"
            >
              Ver alunos →
            </button>
          </div>

          <div className="p-5">
            <span className="text-xs text-slate-400 font-medium">Turmas Ativas</span>
            <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {uniqueTurmas}
            </div>
            <span className="text-[11px] text-slate-400 mt-1.5 block">
              {filterStats.contextLabel}
            </span>
          </div>
        </div>

        {/* Grelha de 3 Cartões Executivos de Leitura Direta (Sem gráficos circulares vazios poluídos) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Desempenho Académico */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Desempenho Académico</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-semibold text-slate-900 tabular-nums">
                  {overallApprovalRate}%
                </span>
                <span className="text-xs text-[#e11d48] font-medium">Meta: 80%</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Taxa de aprovação consolidada no período 2026.1.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-100 flex justify-between text-xs text-slate-500 tabular-nums">
              <span>
                Distinção: <strong className="text-slate-800">{distinctionCount}</strong>
              </span>
              <span>
                Regular: <strong className="text-slate-800">{regularCount}</strong>
              </span>
              <span>
                Recuperação: <strong className="text-[#e11d48]">{recoveryCount}</strong>
              </span>
            </div>
          </div>

          {/* 2. Assiduidade Semanal */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Assiduidade Semanal</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-semibold text-slate-900 tabular-nums">
                  {averageAttendanceRate}%
                </span>
                <span className="text-xs text-emerald-600 font-medium">Meta: 95%</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Média de presença diária registada nas turmas ativas.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-100 flex justify-between text-xs text-slate-400 tabular-nums">
              <span>Seg: —</span>
              <span>Ter: —</span>
              <span>Qua: —</span>
              <span className="text-slate-800 font-medium">Qui: {averageAttendanceRate}%</span>
              <span>Sex: —</span>
            </div>
          </div>

          {/* 3. Cidadania & Registo Civil */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Cidadania & Registo Civil</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-semibold text-slate-900 tabular-nums">
                  {docRegularizedPercent}%
                </span>
                <span className="text-xs text-amber-600 font-medium">
                  {totalStudentsWithoutDocs > 0 ? `${totalStudentsWithoutDocs} Pendentes` : 'Pendentes'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Proporção de alunos com documentação validada na rede.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-100 flex justify-between text-xs text-slate-500 tabular-nums">
              <span>
                Validados: <strong className="text-slate-800">{totalStudentsWithDocs}</strong>
              </span>
              <span>
                Pendentes: <strong className="text-slate-800">{totalStudentsWithoutDocs}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <SigeOfficialViewerModal
        isOpen={isSigeViewerOpen}
        onClose={() => setIsSigeViewerOpen(false)}
        schools={schools}
        teachers={teachers}
        directors={directors}
        students={students}
        onOpenGoogleSheets={onOpenGoogleSheets}
      />
    </div>
  );
};
