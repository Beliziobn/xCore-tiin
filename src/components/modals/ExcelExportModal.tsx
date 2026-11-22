import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  GraduationCap,
  Users,
  UserCheck,
  School,
  CheckCircle2,
  Table,
  Layers,
  ArrowDownToLine,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import type { AdminSchool, AdminTeacher, AdminDirector, AdminStudent, UserAccount } from '../../types';
import {
  exportConsolidatedExcel,
  exportTeachersExcel,
  exportDirectorsExcel,
  exportStudentsExcel,
  exportSchoolsExcel,
  getUnifiedSystemDataset,
  filterDatasetForSchoolDirector,
  getOfficialSigeFileName,
  exportOfficialSigeExcel,
  exportStandaloneSigeHtml,
} from '../../utils/excelExport';
import { SigeDataEntryModal } from './SigeDataEntryModal';
import { SigeOfficialViewerModal } from '../sige/SigeOfficialViewerModal';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schools?: AdminSchool[];
  teachers?: AdminTeacher[];
  directors?: AdminDirector[];
  students?: AdminStudent[];
  currentUser?: UserAccount | null;
  onOpenGoogleSheets?: () => void;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  schools,
  teachers,
  directors,
  students,
  currentUser,
  onOpenGoogleSheets,
}) => {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [isSigeDataEntryOpen, setIsSigeDataEntryOpen] = useState(false);
  const [isSigeViewerOpen, setIsSigeViewerOpen] = useState(false);
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

  const isSchoolDirector = currentUser?.role === 'diretor';

  const dataset = useMemo(() => {
    const raw = getUnifiedSystemDataset({ schools, teachers, directors, students });
    if (isSchoolDirector) {
      return filterDatasetForSchoolDirector(raw, currentUser?.schoolId, currentUser?.schoolName);
    }
    return raw;
  }, [schools, teachers, directors, students, isSchoolDirector, currentUser?.schoolId, currentUser?.schoolName, isOpen, syncTick]);

  if (!isOpen) return null;

  const resolvedSchoolName =
    currentUser?.schoolName ||
    dataset.schools[0]?.name ||
    'Escola';

  const officialExcelFileName = getOfficialSigeFileName(dataset, {
    isSchoolDirector,
    schoolName: resolvedSchoolName,
    extension: 'xlsx',
  });

  const officialHtmlFileName = getOfficialSigeFileName(dataset, {
    isSchoolDirector,
    schoolName: resolvedSchoolName,
    extension: 'html',
  });

  const totalTeachers = dataset.teachers.length;
  const totalDirectors = dataset.directors.length;
  const totalStudents = dataset.students.length;
  const totalSchools = dataset.schools.length;
  const totalRecords = totalTeachers + totalDirectors + totalStudents + totalSchools;

  const handleExportOfficialSige = async () => {
    setDownloadingType('sige_official');
    try {
      await exportOfficialSigeExcel(dataset, officialExcelFileName);
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportHtmlSige = () => {
    setDownloadingType('sige_html');
    setTimeout(() => {
      exportStandaloneSigeHtml(dataset, officialHtmlFileName);
      setDownloadingType(null);
    }, 250);
  };

  const handleExportAll = () => {
    setDownloadingType('all');
    setTimeout(() => {
      exportConsolidatedExcel(dataset);
      setDownloadingType(null);
    }, 350);
  };

  const handleExportTeachers = () => {
    setDownloadingType('teachers');
    setTimeout(() => {
      exportTeachersExcel(dataset.teachers);
      setDownloadingType(null);
    }, 250);
  };

  const handleExportDirectors = () => {
    setDownloadingType('directors');
    setTimeout(() => {
      exportDirectorsExcel(dataset.directors);
      setDownloadingType(null);
    }, 250);
  };

  const handleExportStudents = () => {
    setDownloadingType('students');
    setTimeout(() => {
      exportStudentsExcel(dataset.students);
      setDownloadingType(null);
    }, 250);
  };

  const handleExportSchools = () => {
    setDownloadingType('schools');
    setTimeout(() => {
      exportSchoolsExcel(dataset.schools);
      setDownloadingType(null);
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= 1. HEADER LEVE E CONTEXTUAL ================= */}
        <div className="px-6 py-4.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0b3d5c]/10 text-[#0b3d5c] flex items-center justify-center shrink-0 border border-[#0b3d5c]/15">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {isSchoolDirector
                    ? `Exportação Institucional da Escola — ${resolvedSchoolName}`
                    : 'Central de Exportação de Dados (Consolidado Municipal)'}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0b3d5c]/10 text-[#0b3d5c] border border-[#0b3d5c]/20">
                  {isSchoolDirector ? 'Nível Micro · Isolamento da Escola' : 'Nível Macro · 100% da Rede Municipal'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= CORPO MODAL EM 3 ZONAS CLARAS ================= */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1 bg-[#fbfcfd]">
          
          {/* ================= ZONA 1: RELATÓRIO OFICIAL SIGE (DESTAQUE PRINCIPAL) ================= */}
          <section className="bg-white rounded-2xl p-5 sm:p-6 border border-[#0b3d5c]/25 border-l-4 border-l-[#0b3d5c] shadow-xs relative">
            <div className="flex flex-col gap-4">
              {/* Título + Contexto */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0b3d5c]/10 text-[#0b3d5c] text-[11px] font-bold tracking-wide mb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0b3d5c]" />
                    <span>
                      {isSchoolDirector
                        ? `Visão Institucional Dedicada • ${resolvedSchoolName}`
                        : 'Visão Consolidada • Direção Municipal de Educação (GEPE)'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight break-all">
                    {officialExcelFileName}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {isSchoolDirector
                      ? `Recorte exato da Fonte Única da Verdade para a unidade "${resolvedSchoolName}". Espelha o mesmo layout oficial de colunas e abas do SIGE 2026/2027, exibindo exclusivamente alunos, professores, turmas e estatísticas desta escola.`
                      : 'Consolida 100% dos dados de todas as escolas sob jurisdição municipal em tempo real (efetivo total de alunos, corpo docente completo, infraestruturas e pedidos de vagas aprovados).'}
                  </p>
                </div>
              </div>

              {/* Ações Principais da Zona 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* 1. Visualizar Painel */}
                <button
                  type="button"
                  onClick={() => setIsSigeViewerOpen(true)}
                  className="h-11 px-4 rounded-xl bg-[#0891b2] hover:bg-[#0e7490] active:bg-[#0b3d5c] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  title="Abrir o painel institucional interativo com as 9 folhas oficiais e filtros"
                >
                  <Table className="w-4 h-4 text-white shrink-0" />
                  <span>Visualizar Painel Oficial</span>
                </button>

                {/* 2. Baixar Excel Estilizado */}
                <button
                  type="button"
                  onClick={handleExportOfficialSige}
                  disabled={downloadingType === 'sige_official'}
                  className="h-11 px-4 rounded-xl bg-[#0b3d5c] hover:bg-[#072a40] active:bg-[#051c2c] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  title="Baixar planilha Excel com cabeçalhos azul-petróleo, zebrado, abas e validações"
                >
                  {downloadingType === 'sige_official' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Gerando Ficheiro...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="w-4 h-4 text-white shrink-0" />
                      <span>Baixar Excel Estilizado (.xlsx)</span>
                    </>
                  )}
                </button>

                {/* 3. Baixar Relatório Web */}
                <button
                  type="button"
                  onClick={handleExportHtmlSige}
                  disabled={downloadingType === 'sige_html'}
                  className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  title="Baixar ficheiro HTML autónomo com visualização completa das abas e filtros"
                >
                  {downloadingType === 'sige_html' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Exportando...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 text-[#0891b2] shrink-0" />
                      <span>Baixar Relatório Web (.html)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* ================= ZONA 2: LISTAGEM INTERNA UCORE ================= */}
          <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span>Gestão Operacional Interna da Rede</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Registo Administrativo Completo da Rede (.xlsx)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ficheiro nominal consolidado para a Secretaria Escolar e Direção Municipal, contendo todas as fichas com dados nominais, turmas, disciplinas e contactos.
                </p>

                {/* Chips de Categorias em linha */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">Resumo Executivo</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">Alunos ({totalStudents})</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">Professores ({totalTeachers})</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">Diretores ({totalDirectors})</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">Escolas ({totalSchools})</span>
                </div>

                <p className="text-[11px] text-slate-500 pt-0.5">
                  * Destinado ao uso administrativo interno. Para prestação de contas estatísticas, use o Relatório Oficial SIGE acima.
                </p>
              </div>

              {/* Botão Único Destacado */}
              <button
                type="button"
                onClick={handleExportAll}
                disabled={downloadingType === 'all'}
                className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-60"
              >
                {downloadingType === 'all' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Compilando Registos...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4 text-white shrink-0" />
                    <span>Baixar Listagem Interna (.xlsx)</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* ================= ZONA 3: PLANILHAS INDIVIDUAIS POR CATEGORIA ================= */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                  Planilhas Individuais por Categoria
                </h4>
                <p className="text-xs text-slate-500">
                  Exportações segmentadas para envio e conferência por departamento.
                </p>
              </div>
              <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                Sincronizadas em tempo real
              </span>
            </div>

            {/* Grade equilibrada 2x2 com cards compactos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Professores */}
              <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <h5 className="font-bold text-slate-900 text-sm truncate">Professores</h5>
                      <span className="text-xs font-bold text-blue-700">{totalTeachers}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      Disciplinas, escolas, regime, horário e assiduidade
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportTeachers}
                  disabled={downloadingType === 'teachers'}
                  className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  title="Baixar planilha de Professores"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden xs:inline">Baixar</span>
                </button>
              </div>

              {/* 2. Diretores */}
              <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <h5 className="font-bold text-slate-900 text-sm truncate">Diretores Escolares</h5>
                      <span className="text-xs font-bold text-purple-700">{totalDirectors}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      Escola gerida, nomeação, contactos e avaliação
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportDirectors}
                  disabled={downloadingType === 'directors'}
                  className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  title="Baixar planilha de Diretores"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden xs:inline">Baixar</span>
                </button>
              </div>

              {/* 3. Alunos */}
              <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <h5 className="font-bold text-slate-900 text-sm truncate">Alunos Matriculados</h5>
                      <span className="text-xs font-bold text-emerald-700">{totalStudents}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      Processo, BI/Cédula, classe, turma e encarregado
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportStudents}
                  disabled={downloadingType === 'students'}
                  className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  title="Baixar planilha de Alunos"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden xs:inline">Baixar</span>
                </button>
              </div>

              {/* 4. Escolas */}
              <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-100">
                    <School className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <h5 className="font-bold text-slate-900 text-sm truncate">Escolas da Rede</h5>
                      <span className="text-xs font-bold text-amber-700">{totalSchools}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      Unidades, direção, salas, turmas e localização
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportSchools}
                  disabled={downloadingType === 'schools'}
                  className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  title="Baixar planilha de Escolas"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden xs:inline">Baixar</span>
                </button>
              </div>
            </div>
          </section>

        </div>

        {/* ================= 6. FOOTER FIXO E LIMPO ================= */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Total de Registos Compilados: <strong className="text-slate-900">{totalRecords}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Ação secundária para Google Sheets */}
            {onOpenGoogleSheets && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGoogleSheets();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 font-bold text-xs transition-colors cursor-pointer"
                title="Sincronizar com a sua conta Google Planilhas"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Abrir no Google Sheets</span>
              </button>
            )}

            {/* Botão Fechar Janela */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Fechar Janela
            </button>
          </div>
        </div>
      </div>

      <SigeDataEntryModal
        isOpen={isSigeDataEntryOpen}
        onClose={() => setIsSigeDataEntryOpen(false)}
      />

      <SigeOfficialViewerModal
        isOpen={isSigeViewerOpen}
        onClose={() => setIsSigeViewerOpen(false)}
        schools={schools}
        teachers={teachers}
        directors={directors}
        students={students}
        currentUser={currentUser}
        onOpenGoogleSheets={onOpenGoogleSheets}
      />
    </div>
  );
};
