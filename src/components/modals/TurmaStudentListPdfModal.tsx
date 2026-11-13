import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileDown,
  Printer,
  Search,
  Database,
  FileText,
  ArrowUpDown,
  Check,
  Loader2,
  ClipboardList,
  Download,
  Eye,
} from 'lucide-react';
import emblemAngolaImg from '../../assets/images/Emblem_of_Angola.svg.webp';
import {
  getStudentsForTurma,
  getAvailableClassesAndTurmasFromStudents,
  normalizeClasseName,
  normalizeTurmaName,
  TurmaStudentListResult,
} from '../../utils/turmaStudentsService';
import { exportTurmaStudentListToPDF } from '../../utils/turmaPdfExporter';
import { printSinglePageA4Clean } from '../../utils/declaracaoPdfGenerator';

export interface TurmaStudentListPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClass?: string;
  initialTurma?: string;
  schoolName?: string;
}

export const TurmaStudentListPdfModal: React.FC<TurmaStudentListPdfModalProps> = ({
  isOpen,
  onClose,
  initialClass = '4ª Classe',
  initialTurma = 'Turma A',
  schoolName = '',
}) => {
  // 1. Hooks incondicionais
  const [selectedClass, setSelectedClass] = useState<string>(
    normalizeClasseName(initialClass) || '4ª Classe'
  );
  const [selectedTurma, setSelectedTurma] = useState<string>(
    normalizeTurmaName(initialTurma) || 'Turma A'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [subView, setSubView] = useState<'preview' | 'database'>('preview');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [syncVersion, setSyncVersion] = useState(0);

  useEffect(() => {
    if (initialClass) setSelectedClass(normalizeClasseName(initialClass) || initialClass);
    if (initialTurma) setSelectedTurma(normalizeTurmaName(initialTurma));
  }, [initialClass, initialTurma]);

  useEffect(() => {
    const handleSync = () => setSyncVersion((v) => v + 1);
    window.addEventListener('sigre-data-synced', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('sigre-data-synced', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Opções dinâmicas de classe/turma incluindo todos os novos alunos cadastrados
  const { classes: availableClasses, turmas: availableTurmas } = useMemo(() => {
    return getAvailableClassesAndTurmasFromStudents();
  }, [isOpen, syncVersion]);

  // 2. Obter lista oficial da turma (sempre atualizada quando modal abre ou alunos são cadastrados)
  const turmaData: TurmaStudentListResult = useMemo(() => {
    return getStudentsForTurma({
      gradeClass: selectedClass,
      turma: selectedTurma,
      schoolName,
    });
  }, [selectedClass, selectedTurma, schoolName, isOpen, syncVersion]);

  // 3. Filtragem e ordenação (A-Z / Z-A) com numeração sequencial consistente
  const displayedStudents = useMemo(() => {
    let list = [...turmaData.students];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.nomeCompleto.toLowerCase().includes(q) ||
          s.condicaoMatricula.toLowerCase().includes(q) ||
          s.codigoMatricula.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const cmp = a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-PT', { sensitivity: 'base' });
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [turmaData.students, searchTerm, sortDirection]);

  const exportableData: TurmaStudentListResult = useMemo(
    () => ({
      ...turmaData,
      students: displayedStudents,
    }),
    [turmaData, displayedStudents]
  );

  // 4. Descarregar PDF A4 (com o mesmo padrão estrutural da Ficha Individual)
  const handleDownloadPdf = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      await exportTurmaStudentListToPDF(exportableData);
      setExportSuccess(true);
      showToast('Lista nominal em PDF gerada com sucesso.');
      setTimeout(() => {
        setExportSuccess(false);
      }, 3500);
    } catch (err) {
      console.error('Erro ao gerar PDF da turma:', err);
      showToast('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  // 5. Impressão A4 isolada usando exatamente a mesma função da Ficha Individual
  const handlePrintA4 = () => {
    if (subView !== 'preview') {
      setSubView('preview');
      setTimeout(() => printSinglePageA4Clean('turma-lista-a4-sheet'), 80);
    } else {
      printSinglePageA4Clean('turma-lista-a4-sheet');
    }
  };

  // 6. Exportar CSV na vista Base de Dados (igual à Ficha Individual)
  const handleExportCsv = () => {
    if (displayedStudents.length === 0) return;
    const headers = ['Nº', 'Código', 'Nome Completo', 'Sexo', 'Idade', 'Condição'];
    const rows = displayedStudents.map((s) => [
      String(s.numeroOrdem).padStart(2, '0'),
      s.codigoMatricula,
      `"${s.nomeCompleto.replace(/"/g, '""')}"`,
      s.genero,
      String(s.idade),
      s.condicaoMatricula,
    ]);
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeClass = turmaData.metadata.classe.replace(/[^a-zA-Z0-9]/g, '_');
    const safeTurma = turmaData.metadata.turma.replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `Lista_${safeClass}_${safeTurma}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Ficheiro CSV exportado com sucesso.');
  };

  if (!isOpen) return null;

  const { metadata, stats } = turmaData;
  const cleanTurma = metadata.turma.replace(/^Turma\s+/i, '');
  const cleanSala = metadata.sala.replace(/^Sala\s+/i, '');

  const cellNormalStyle: React.CSSProperties = {
    border: '1px solid #000000',
    padding: '5px 8px',
    fontSize: '8pt',
    fontWeight: 400,
    lineHeight: 1.35,
    verticalAlign: 'middle',
  };

  const cellHeaderStyle: React.CSSProperties = {
    border: '1px solid #000000',
    padding: '5px 8px',
    fontSize: '10pt',
    fontWeight: 700,
    lineHeight: 1.35,
    verticalAlign: 'middle',
  };

  const chapterTitleStyle: React.CSSProperties = {
    fontSize: '10pt',
    fontWeight: 700,
    lineHeight: 1.35,
    margin: '0 0 5px 0',
    textAlign: 'left',
  };

  const pillControlClass =
    'h-10 px-4 rounded-full border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 outline-none transition-all focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10';

  return (
    <div
      id="turma-student-list-pdf-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-[#f8f9fa] rounded-[24px] shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Toast Feedback (mesmo padrão da Ficha Individual) */}
        {toastMsg && (
          <div className="no-print fixed top-6 right-6 z-60 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* EXEMPLAR HEADER: Ícone Circular + Título + Acções em Pill         */}
        {/* ================================================================= */}
        <div className="no-print bg-white px-5 sm:px-7 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#f2f4f7] border border-slate-200/80 flex items-center justify-center text-slate-800 shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                Listas Nominais por Turma
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {metadata.escola} · {metadata.classe} ({metadata.turma}) · Ano Lectivo {metadata.anoLectivo}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="h-10 px-4 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Alternar ordenação alfabética"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Ordem: {sortDirection === 'asc' ? 'A–Z' : 'Z–A'}</span>
            </button>

            <button
              id="btn-modal-baixar-pdf-az"
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>A gerar PDF...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>PDF Gerado</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Baixar PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrintA4}
              className="h-10 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Imprimir Folha A4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir A4</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar janela"
              className="w-10 h-10 rounded-full border border-slate-200 bg-[#f2f4f7] hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* ÁREA DE CONTEÚDO COM SCROLL (MESMO SISTEMA DA FICHA INDIVIDUAL)   */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* BARRA DE OPÇÕES NO TOPO + SELETORES EM PILL */}
          <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Barra de opções igual à Ficha Individual: Base de Dados | Pré-visualização */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-full border border-slate-200 w-fit shadow-xs">
              <button
                type="button"
                onClick={() => setSubView('database')}
                className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                  subView === 'database'
                    ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Database className="w-4 h-4 shrink-0" />
                <span>Base de Dados ({displayedStudents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSubView('preview')}
                className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                  subView === 'preview'
                    ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Pré-visualização</span>
              </button>
            </div>

            {/* Filtros de Classe, Turma e Pesquisa em Pill */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-full h-10 px-4">
                <label
                  htmlFor="select-classe-modal"
                  className="text-xs font-semibold text-slate-500 whitespace-nowrap"
                >
                  Classe:
                </label>
                <select
                  id="select-classe-modal"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="text-xs sm:text-sm font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
                >
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-full h-10 px-4">
                <label
                  htmlFor="select-turma-modal"
                  className="text-xs font-semibold text-slate-500 whitespace-nowrap"
                >
                  Turma:
                </label>
                <select
                  id="select-turma-modal"
                  value={selectedTurma}
                  onChange={(e) => setSelectedTurma(e.target.value)}
                  className="text-xs sm:text-sm font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
                >
                  {availableTurmas.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 sm:w-60 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  placeholder="Procurar aluno ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Procurar aluno na lista da turma"
                  className={`${pillControlClass} w-full pl-9 pr-4`}
                />
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* OPÇÃO 1: BASE DE DADOS DOS ALUNOS DA TURMA                      */}
          {/* =============================================================== */}
          {subView === 'database' && (
            <section className="no-print bg-white rounded-[24px] border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#f2f4f7] flex items-center justify-center text-slate-700">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Base de Dados — {metadata.classe} ({metadata.turma}) · {displayedStudents.length} alunos
                    </h3>
                    <p className="text-xs text-slate-500">
                      {stats.meninos} Masculinos ({stats.percentualM}) · {stats.meninas} Femininas ({stats.percentualF}) · Idade Média: {stats.idadeMedia}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {displayedStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="h-9 px-3.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar CSV</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSubView('preview')}
                    className="h-9 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Folha A4</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[460px] overflow-y-auto border border-slate-200 rounded-2xl">
                <table className="w-full border-collapse text-xs min-w-[740px]">
                  <thead className="sticky top-0 z-10 bg-[#f8f9fa]">
                    <tr>
                      <th className="text-center px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600 w-14">
                        Nº
                      </th>
                      <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                        Código
                      </th>
                      <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                        Nome Completo do Aluno
                      </th>
                      <th className="text-center px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                        Sexo
                      </th>
                      <th className="text-center px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                        Idade
                      </th>
                      <th className="text-center px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                        Observação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          Nenhum aluno encontrado para os critérios selecionados.
                        </td>
                      </tr>
                    ) : (
                      displayedStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/90 transition-colors">
                          <td className="px-3.5 py-2.5 text-center font-mono font-semibold text-slate-700">
                            {String(student.numeroOrdem).padStart(2, '0')}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap text-slate-600">
                            {student.codigoMatricula}
                          </td>
                          <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                            {student.nomeCompleto}
                          </td>
                          <td className="px-3.5 py-2.5 text-center font-semibold text-slate-700">
                            {student.genero}
                          </td>
                          <td className="px-3.5 py-2.5 text-center text-slate-700">
                            {student.idade} anos
                          </td>
                          <td className="px-3.5 py-2.5 text-center text-slate-700">
                            {(student.condicaoMatricula as string) === 'Matriculado' ||
                            student.condicaoMatricula === 'Novo'
                              ? '—'
                              : student.condicaoMatricula}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* =============================================================== */}
          {/* OPÇÃO 2: PRÉ-VISUALIZAÇÃO DO DOCUMENTO OFICIAL A4               */}
          {/* (Estrutura, Espaçamento, Century Gothic 10pt/8pt e Insígnia)    */}
          {/* =============================================================== */}
          <section
            id="turma-lista-live-preview-panel"
            className={`${
              subView === 'preview' ? 'block' : 'hidden print:block'
            } bg-white rounded-[24px] border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 print:border-0 print:p-0 print:shadow-none`}
          >
            <div className="no-print flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#f2f4f7] flex items-center justify-center text-slate-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Pré-visualização Oficial A4 — Lista Nominal de Alunos
                    </h3>
                    <span className="text-xs text-slate-500">
                      · {metadata.classe} ({metadata.turma})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {metadata.escola} · Fonte Century Gothic (Títulos 10pt · Texto 8pt) · {displayedStudents.length} alunos
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  className="h-9 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Baixar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintA4}
                  className="h-9 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir A4</span>
                </button>
              </div>
            </div>

            <div className="flex justify-center w-full bg-[#f8f9fa] p-4 sm:p-8 rounded-2xl border border-slate-200/70 print:bg-white print:block print:m-0 print:p-0 print:border-0">
              <div
                id="turma-lista-a4-sheet"
                className="bg-white w-full max-w-[210mm] p-6 sm:p-10 md:px-[16mm] md:py-[14mm] border border-slate-200/90 print:border-0 shadow-xs print:shadow-none text-black mx-auto font-normal"
                style={{
                  fontFamily:
                    "'Century Gothic', CenturyGothic, AppleGothic, 'URW Gothic L', 'Avant Garde', sans-serif",
                  fontSize: '8pt',
                  fontWeight: 400,
                  lineHeight: 1.4,
                  color: '#000000',
                }}
              >
                {/* 1. Cabeçalho Institucional + Insígnia da República de Angola */}
                <div
                  className="a4-eval-section"
                  style={{
                    textAlign: 'center',
                    marginBottom: '12px',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}
                >
                  <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <img
                      src={emblemAngolaImg}
                      alt="Insígnia da República de Angola"
                      className="ficha-emblem-img"
                      style={{
                        width: '80px',
                        height: '80px',
                        maxHeight: '80px',
                        objectFit: 'contain',
                        display: 'block',
                        margin: '0 auto',
                      }}
                    />
                  </div>
                  <p
                    className="font-bold ficha-title-10"
                    style={{
                      fontSize: '10pt',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      lineHeight: 1.35,
                      margin: '0 0 2px 0',
                      textAlign: 'center',
                    }}
                  >
                    REPÚBLICA DE ANGOLA
                  </p>
                  <p
                    className="font-bold ficha-title-10"
                    style={{
                      fontSize: '10pt',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      lineHeight: 1.35,
                      margin: '0 0 2px 0',
                      textAlign: 'center',
                    }}
                  >
                    GOVERNO PROVINCIAL DE MALANJE
                  </p>
                  <p
                    className="font-bold ficha-title-10"
                    style={{
                      fontSize: '10pt',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      lineHeight: 1.35,
                      margin: '0 0 2px 0',
                      textAlign: 'center',
                    }}
                  >
                    ADMINISTRAÇÃO MUNICIPAL DO QUÊSSUA
                  </p>
                  <p
                    className="font-bold ficha-title-10"
                    style={{
                      fontSize: '10pt',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      lineHeight: 1.35,
                      margin: '0 0 8px 0',
                      textAlign: 'center',
                    }}
                  >
                    DIRECÇÃO MUNICIPAL DE EDUCAÇÃO
                  </p>
                  <h1
                    className="font-bold ficha-title-10"
                    style={{
                      fontSize: '10pt',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      lineHeight: 1.38,
                      margin: '0 auto',
                      maxWidth: '96%',
                      textAlign: 'center',
                    }}
                  >
                    LISTA NOMINAL DOS ALUNOS POR TURMA — ANO LECTIVO {metadata.anoLectivo}
                  </h1>
                </div>

                {/* 2. Identificação: a), b), c) e Dados da Turma (Tabela 1px #000000) */}
                <div
                  className="a4-eval-section"
                  style={{
                    marginBottom: '12px',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      border: '1px solid #000000',
                      tableLayout: 'fixed',
                    }}
                  >
                    <tbody>
                      <tr>
                        <td colSpan={2} style={{ ...cellNormalStyle, textAlign: 'left' }}>
                          <span style={{ marginRight: '6px' }}>a) Província:</span>
                          <span>Malanje</span>
                        </td>
                        <td colSpan={2} style={{ ...cellNormalStyle, textAlign: 'left' }}>
                          <span style={{ marginRight: '6px' }}>b) Município:</span>
                          <span>Quêssua</span>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} style={{ ...cellNormalStyle, textAlign: 'left' }}>
                          <span style={{ marginRight: '6px' }}>c) Escola / Instituição:</span>
                          <span>{metadata.escola}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ ...cellNormalStyle, textAlign: 'left', width: '24%' }}>
                          <span style={{ marginRight: '4px' }}>Classe:</span>
                          <span>{metadata.classe}</span>
                        </td>
                        <td style={{ ...cellNormalStyle, textAlign: 'left', width: '18%' }}>
                          <span style={{ marginRight: '4px' }}>Turma:</span>
                          <span>{cleanTurma}</span>
                        </td>
                        <td style={{ ...cellNormalStyle, textAlign: 'left', width: '38%' }}>
                          <span style={{ marginRight: '4px' }}>Período:</span>
                          <span>{metadata.turno}</span>
                        </td>
                        <td style={{ ...cellNormalStyle, textAlign: 'left', width: '20%' }}>
                          <span style={{ marginRight: '4px' }}>Sala:</span>
                          <span>{cleanSala}</span>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} style={{ ...cellNormalStyle, textAlign: 'left' }}>
                          <span style={{ marginRight: '4px' }}>Professor(a) Titular:</span>
                          <span>{metadata.professorTitular}</span>
                        </td>
                        <td colSpan={2} style={{ ...cellNormalStyle, textAlign: 'left' }}>
                          <span style={{ marginRight: '4px' }}>Data de Emissão:</span>
                          <span>{metadata.dataEmissao}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. Relação Nominal dos Alunos */}
                <div style={{ marginBottom: '14px' }}>
                  <p className="font-bold ficha-title-10" style={chapterTitleStyle}>
                    Relação Nominal dos Alunos ({sortDirection === 'asc' ? 'Ordem Alfabética A–Z' : 'Ordem Z–A'})
                  </p>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      border: '1px solid #000000',
                      tableLayout: 'fixed',
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          className="font-bold ficha-title-10"
                          style={{ ...cellHeaderStyle, width: '7%', textAlign: 'center' }}
                        >
                          Nº
                        </th>
                        <th
                          className="font-bold ficha-title-10"
                          style={{ ...cellHeaderStyle, width: '16%', textAlign: 'center' }}
                        >
                          Código
                        </th>
                        <th
                          className="font-bold ficha-title-10"
                          style={{ ...cellHeaderStyle, width: '45%', textAlign: 'left' }}
                        >
                          Nome Completo do Aluno
                        </th>
                        <th
                          className="font-bold ficha-title-10"
                          style={{ ...cellHeaderStyle, width: '8%', textAlign: 'center' }}
                        >
                          Sexo
                        </th>
                        <th
                          className="font-bold ficha-title-10"
                          style={{ ...cellHeaderStyle, width: '8%', textAlign: 'center' }}
                        >
                          Idade
                        </th>
                        <th
                          className="font-bold ficha-title-10"
                          style={{ ...cellHeaderStyle, width: '16%', textAlign: 'center' }}
                        >
                          Observação
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ ...cellNormalStyle, textAlign: 'center', padding: '16px 8px' }}>
                            Nenhum aluno encontrado para os critérios selecionados.
                          </td>
                        </tr>
                      ) : (
                        displayedStudents.map((student) => (
                          <tr key={student.id}>
                            <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                              {String(student.numeroOrdem).padStart(2, '0')}
                            </td>
                            <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                              {student.codigoMatricula}
                            </td>
                            <td style={{ ...cellNormalStyle, textAlign: 'left' }}>
                              {student.nomeCompleto}
                            </td>
                            <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                              {student.genero}
                            </td>
                            <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                              {student.idade}
                            </td>
                            <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                              {(student.condicaoMatricula as string) === 'Matriculado' ||
                              student.condicaoMatricula === 'Novo'
                                ? ''
                                : student.condicaoMatricula}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 4. Homologação e Assinaturas (mesmo espaçamento e estrutura da Ficha Individual) */}
                <div
                  className="a4-eval-section"
                  style={{
                    paddingTop: '8px',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '32px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <p
                        className="font-bold ficha-title-10"
                        style={{
                          fontSize: '10pt',
                          fontWeight: 700,
                          margin: '0 0 32px 0',
                          textAlign: 'center',
                        }}
                      >
                        O(A) Professor(a) / Director(a) de Turma
                      </p>
                      <div
                        className="ficha-sig-line"
                        style={{
                          width: '250px',
                          maxWidth: '100%',
                          borderBottom: '1px solid #000000',
                          margin: '0 auto',
                          height: '1px',
                        }}
                      />
                      <p
                        style={{
                          marginTop: '5px',
                          fontSize: '8pt',
                          fontWeight: 400,
                          textAlign: 'center',
                        }}
                      >
                        {metadata.professorTitular}
                      </p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <p
                        className="font-bold ficha-title-10"
                        style={{
                          fontSize: '10pt',
                          fontWeight: 700,
                          margin: '0 0 32px 0',
                          textAlign: 'center',
                        }}
                      >
                        O(A) Director(a) da Escola
                      </p>
                      <div
                        className="ficha-sig-line"
                        style={{
                          width: '250px',
                          maxWidth: '100%',
                          borderBottom: '1px solid #000000',
                          margin: '0 auto',
                          height: '1px',
                        }}
                      />
                      <p
                        style={{
                          marginTop: '5px',
                          fontSize: '8pt',
                          fontWeight: 400,
                          textAlign: 'center',
                        }}
                      >
                        {metadata.diretorEscola}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
