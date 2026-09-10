import React, { useState } from 'react';
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
  Sparkles,
  ArrowDownToLine,
  Check,
  Info,
  SlidersHorizontal,
  FileCheck,
  Globe
} from 'lucide-react';
import type { AdminSchool, AdminTeacher, AdminDirector, AdminStudent } from '../../types';
import {
  exportConsolidatedExcel,
  exportTeachersExcel,
  exportDirectorsExcel,
  exportStudentsExcel,
  exportSchoolsExcel,
  getUnifiedSystemDataset,
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
  onOpenGoogleSheets?: () => void;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  schools,
  teachers,
  directors,
  students,
  onOpenGoogleSheets,
}) => {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [activeTabPreview, setActiveTabPreview] = useState<'all' | 'teachers' | 'directors' | 'students' | 'schools'>('all');
  const [isSigeDataEntryOpen, setIsSigeDataEntryOpen] = useState(false);
  const [isSigeViewerOpen, setIsSigeViewerOpen] = useState(false);

  if (!isOpen) return null;

  const dataset = getUnifiedSystemDataset({ schools, teachers, directors, students });

  const totalTeachers = dataset.teachers.length;
  const totalDirectors = dataset.directors.length;
  const totalStudents = dataset.students.length;
  const totalSchools = dataset.schools.length;

  const handleExportOfficialSige = async () => {
    setDownloadingType('sige_official');
    try {
      await exportOfficialSigeExcel(dataset);
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportHtmlSige = () => {
    setDownloadingType('sige_html');
    setTimeout(() => {
      exportStandaloneSigeHtml(dataset);
      setDownloadingType(null);
    }, 250);
  };

  const handleExportAll = () => {
    setDownloadingType('all');
    setTimeout(() => {
      exportConsolidatedExcel(dataset);
      setDownloadingType(null);
    }, 400);
  };

  const handleExportTeachers = () => {
    setDownloadingType('teachers');
    setTimeout(() => {
      exportTeachersExcel(dataset.teachers);
      setDownloadingType(null);
    }, 300);
  };

  const handleExportDirectors = () => {
    setDownloadingType('directors');
    setTimeout(() => {
      exportDirectorsExcel(dataset.directors);
      setDownloadingType(null);
    }, 300);
  };

  const handleExportStudents = () => {
    setDownloadingType('students');
    setTimeout(() => {
      exportStudentsExcel(dataset.students);
      setDownloadingType(null);
    }, 300);
  };

  const handleExportSchools = () => {
    setDownloadingType('schools');
    setTimeout(() => {
      exportSchoolsExcel(dataset.schools);
      setDownloadingType(null);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Clean Institutional Signature */}
        <div className="bg-[#002133] px-6 py-5 flex items-center justify-between text-white shrink-0 border-b border-slate-800 relative">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/15">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Central de Exportação de Planilhas Excel (.xlsx)
                </h2>
                <span className="text-[10px] bg-white/15 text-white px-2.5 py-0.5 rounded-full font-bold tracking-wider uppercase">
                  Multi-Abas
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Dados oficiais de Professores, Diretores e Alunos organizados separadamente para download
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer relative z-10"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-[#fcfdfd]">
          {/* Cloud Google Sheets Integration Banner */}
          {onOpenGoogleSheets && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-emerald-950">
                    Prefere guardar na Nuvem Google?
                  </div>
                  <div className="text-emerald-800">
                    Crie ou sincronize diretamente com a sua conta Google Planilhas (Google Sheets).
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGoogleSheets();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Abrir Google Sheets</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Instrumento Oficial SIGE 2024/2025 (Angola / GEPE) */}
          <div className="bg-gradient-to-r from-[#1F4E79]/10 via-[#1F4E79]/5 to-transparent rounded-2xl p-5 sm:p-6 border-2 border-[#1F4E79]/40 shadow-sm relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1F4E79] text-white text-[11px] font-bold tracking-wide">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                  Instrumento Estatístico Oficial do Ministério da Educação (GEPE)
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#1F4E79]">
                  Relatório Oficial de Estatística SIGE 2024/2025 (.xlsx)
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Exporta estritamente <strong>números agregados (contagens e somas)</strong> organizados por subsistema, nível, classe, idade e gênero (MF/F). 
                  Cumpre integralmente a diretriz central do GEPE:
                </p>

                <div className="p-3 bg-emerald-50/90 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Conformidade com a Diretriz Central de Dados:</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    <strong>Zero nomes. Zero e-mails. Zero BI. Zero nº de processo.</strong> Todos os registos nominais são convertidos na camada de agregação em contagens estatísticas puras.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-700 font-medium">
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">CAPA</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">1. Alunos Matriculados (Pré, Prim, PRAEER, EJA, Sec I/II)</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">2. Pessoal Docente</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">3. Infraestruturas</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">4. Aproveitamento (Validação M=A+R+D)</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">5. Repetentes</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">6. NEE (4 Categorias Oficiais)</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">7. Pessoal Não Docente</span>
                  <span className="px-2 py-0.5 bg-emerald-50 rounded-md border border-emerald-300 font-bold text-emerald-800">9. CONSOLIDADO (Totais por Nível)</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-300 font-semibold text-slate-700">ESCOLAS SEM DADOS</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium pt-1">
                  <span className="inline-flex items-center gap-1 text-[#1F4E79] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Filtros automáticos activos nas abas de dados
                  </span>
                  <span>•</span>
                  <span>Sem filtros na Capa</span>
                  <span>•</span>
                  <span>Submissão Homologada ao GPE/DME</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSigeViewerOpen(true)}
                  className="w-full px-5 py-3 rounded-xl bg-[#0891b2] text-white font-bold text-xs shadow-md hover:bg-[#0e7490] active:bg-[#0b3d5c] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  title="Abrir o painel institucional interactivo com as 9 folhas oficiais e filtros"
                >
                  <Table className="w-4 h-4 text-white" />
                  <span>Visualizar Painel Oficial SIGE (Abas 1–7, 9)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportOfficialSige}
                  disabled={downloadingType === 'sige_official'}
                  className="w-full px-5 py-3 rounded-xl bg-[#0b3d5c] text-white font-bold text-xs shadow-md hover:bg-[#072a40] active:bg-[#051c2c] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Baixar planilha Excel com a identidade visual completa do SIGE (cabeçalhos azul-petróleo, zebrado, abas e validações)"
                >
                  {downloadingType === 'sige_official' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>A Gerar Excel Estilizado...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="w-4 h-4 text-white" />
                      <span>Baixar Excel Estilizado SIGE (.xlsx)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleExportHtmlSige}
                  disabled={downloadingType === 'sige_html'}
                  className="w-full px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Baixar ficheiro HTML autónomo com o mesmo visual do painel interactivo, abas e filtros"
                >
                  {downloadingType === 'sige_html' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>A Gerar Relatório HTML...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 text-cyan-200" />
                      <span>Baixar Relatório Web (.html) [Visual 1:1]</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsSigeDataEntryOpen(true)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#1F4E79]/30 text-[#1F4E79] font-bold text-xs shadow-2xs hover:bg-[#1F4E79]/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#1F4E79]" />
                  <span>Editor & Validador Web / JSON</span>
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href="/Instrumento_Complementar_SIGE_2024_2025.xlsx"
                    download="Instrumento_Complementar_SIGE_2024_2025.xlsx"
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-[11px] shadow-2xs hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 no-underline text-center"
                  >
                    <ArrowDownToLine className="w-3 h-3" />
                    <span>Modelo Vazio</span>
                  </a>

                  <a
                    href="/saida.xlsx"
                    download="Instrumento_Complementar_SIGE_PREENCHIDO.xlsx"
                    className="flex-1 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[11px] shadow-2xs hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5 no-underline text-center"
                  >
                    <FileCheck className="w-3 h-3 text-emerald-600" />
                    <span>Exemplo Preenchido</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main Hero Card for Internal Management Export */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  Listagem de Gestão Operacional Interna (uCore)
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Registo Administrativo Interno da Rede de Ensino (.xlsx)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Ficheiro de uso restrito da <strong>Secretaria Escolar e Direção Municipal</strong>. Contém os dados nominais completos para suporte operacional e pedagógico cotidiano (nomes, contactos, processos):
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600 font-medium">
                  <span className="px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-semibold">Resumo Executivo</span>
                  <span className="px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-semibold">Alunos da Rede</span>
                  <span className="px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-semibold">Professores</span>
                  <span className="px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-semibold">Diretores</span>
                  <span className="px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-semibold">Escolas</span>
                </div>
                <p className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60 mt-1">
                  * <em>Nota Informativa:</em> Esta listagem é interna. Para submissão estatística ao Ministério da Educação, utilize o <strong>Relatório Oficial SIGE</strong> acima.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportAll}
                disabled={downloadingType === 'all'}
                className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-[#002133] text-white font-bold text-xs sm:text-sm shadow-sm hover:bg-slate-900 active:bg-black transition-all flex items-center justify-center gap-2.5 shrink-0 cursor-pointer"
              >
                {downloadingType === 'all' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>A Gerar Listagem Interna...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Baixar Listagem Interna (.xlsx)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Individual Category Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Planilhas Individuais por Categoria
              </h4>
              <span className="text-xs text-slate-400">
                Sincronizadas automaticamente a cada novo cadastro
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Professores */}
              <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#002133] flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {totalTeachers} Cadastros
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm mb-1">
                    Professores
                  </h5>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    Identificação, BI, disciplinas, escolas, regime, carga horária e assiduidade.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportTeachers}
                  disabled={downloadingType === 'teachers'}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-[#002133] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {downloadingType === 'teachers' ? (
                    <span>Exportando...</span>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Professores (.xlsx)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Card 2: Diretores */}
              <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#002133] flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {totalDirectors} Homologados
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm mb-1">
                    Diretores Escolares
                  </h5>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    Escola gerida, ano de nomeação, telefone, e-mail, avaliação e quadro sob gestão.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportDirectors}
                  disabled={downloadingType === 'directors'}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-[#002133] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {downloadingType === 'directors' ? (
                    <span>Exportando...</span>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Diretores (.xlsx)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Card 3: Alunos */}
              <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#002133] flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {totalStudents} Alunos
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm mb-1">
                    Alunos Matriculados
                  </h5>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    Nº processo, BI/Cédula, turma, classe, turno, encarregado e situação cadastral.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportStudents}
                  disabled={downloadingType === 'students'}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-[#002133] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {downloadingType === 'students' ? (
                    <span>Exportando...</span>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Alunos (.xlsx)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Card 4: Escolas */}
              <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#002133] flex items-center justify-center font-bold">
                      <School className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {totalSchools} Escolas
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm mb-1">
                    Escolas da Rede
                  </h5>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    Unidades de ensino, diretor titular, salas, turmas, localização e desempenho.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportSchools}
                  disabled={downloadingType === 'schools'}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-[#002133] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {downloadingType === 'schools' ? (
                    <span>Exportando...</span>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Escolas (.xlsx)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Technical Schema Transparency */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 text-xs text-slate-600">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-800">
                  Estrutura e Conformidade dos Dados Exportados
                </p>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Os arquivos são gerados no formato oficial <strong>Microsoft Excel (.xlsx)</strong>, compatíveis com Google Planilhas, LibreOffice e sistemas de auditoria do Ministério da Educação. Sempre que um novo cadastro de professor, diretor ou aluno é efetuado, as colunas são organizadas com larguras ajustadas automaticamente para evitar corte de texto.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Total de Registros Compilados: <strong>{totalTeachers + totalDirectors + totalStudents + totalSchools}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Fechar Janela
          </button>
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
        onOpenGoogleSheets={onOpenGoogleSheets}
      />
    </div>
  );
};
