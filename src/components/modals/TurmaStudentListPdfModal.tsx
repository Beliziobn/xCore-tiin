import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileDown,
  Printer,
  Search,
  Filter,
  Users,
  CheckCircle2,
  AlertCircle,
  School,
  GraduationCap,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  Calendar,
  Check,
  Loader2,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  getStudentsForTurma,
  TurmaStudentListResult,
  TurmaStudentItem,
  normalizeClasseName,
  normalizeTurmaName,
} from '../../utils/turmaStudentsService';
import { exportTurmaStudentListToPDF } from '../../utils/turmaPdfExporter';
import { ALL_SCHOOL_CLASSES, STANDARD_TURMAS } from '../../data/classesConfig';

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
  // 1. Unconditional Hooks
  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [selectedTurma, setSelectedTurma] = useState<string>(initialTurma);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // 'asc' is A-Z
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Sync state when props change
  useEffect(() => {
    if (initialClass) setSelectedClass(initialClass);
    if (initialTurma) setSelectedTurma(initialTurma);
  }, [initialClass, initialTurma]);

  // 2. Compute the Turma Student List
  const turmaData: TurmaStudentListResult = useMemo(() => {
    return getStudentsForTurma({
      gradeClass: selectedClass,
      turma: selectedTurma,
      schoolName,
    });
  }, [selectedClass, selectedTurma, schoolName]);

  // 3. Filter and verify A-Z sorting
  const displayedStudents = useMemo(() => {
    let list = [...turmaData.students];

    // Filter by search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.nomeCompleto.toLowerCase().includes(q) ||
          s.condicaoMatricula.toLowerCase().includes(q)
      );
    }

    // Sort order (default A-Z)
    list.sort((a, b) => {
      const cmp = a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-PT', { sensitivity: 'base' });
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [turmaData.students, searchTerm, sortDirection]);

  // 4. Download PDF handler
  const handleDownloadPdf = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setExportMessage('Iniciando geração da pauta oficial em PDF...');

    try {
      await exportTurmaStudentListToPDF(turmaData, {
        onProgress: (msg) => setExportMessage(msg),
      });
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        setExportMessage(null);
      }, 4000);
    } catch (err) {
      console.error('Erro ao gerar PDF da turma:', err);
      setExportMessage('Erro na geração. Tentando modo alternativo...');
      setTimeout(() => setExportMessage(null), 3500);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Guard render AFTER all hook declarations
  if (!isOpen) return null;

  const { metadata, stats } = turmaData;

  return (
    <div
      id="turma-student-list-pdf-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="bg-[#002133] text-white px-5 sm:px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f75142] flex items-center justify-center text-white font-bold shadow-md shadow-[#f75142]/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/15">
                  SIGE Angola • Pauta Oficial
                </span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  Ordem Alfabética (A-Z)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
                Lista de Alunos da Turma • Exportação PDF
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-white/10"
              title="Imprimir Pauta da Turma"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Imprimir</span>
            </button>

            <button
              id="btn-modal-baixar-pdf-az"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-2 bg-[#f75142] hover:bg-[#e04436] text-white font-black text-xs uppercase tracking-wider px-4 sm:px-5 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>PDF Descarregado!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Baixar em PDF (A-Z)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast Notification */}
        {exportMessage && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-5 py-2 text-xs font-medium flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              <span>{exportMessage}</span>
            </div>
            <span className="text-[10px] text-amber-700 font-mono">Formato A4 • 300 DPI</span>
          </div>
        )}

        {/* Selection & Filter Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Class and Turma Selectors */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <label htmlFor="select-classe-modal" className="text-[11px] font-bold text-slate-500">Classe:</label>
                <select
                  id="select-classe-modal"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="text-xs font-black text-slate-800 bg-transparent outline-none cursor-pointer"
                >
                  {ALL_SCHOOL_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                <Layers className="w-3.5 h-3.5 text-[#f75142]" />
                <label htmlFor="select-turma-modal" className="text-[11px] font-bold text-slate-500">Turma:</label>
                <select
                  id="select-turma-modal"
                  value={selectedTurma}
                  onChange={(e) => setSelectedTurma(e.target.value)}
                  className="text-xs font-black text-slate-800 bg-transparent outline-none cursor-pointer"
                >
                  {STANDARD_TURMAS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Switch Buttons: Turma A / Turma B */}
              <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedTurma('Turma A')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    selectedTurma === 'Turma A'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Turma A
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTurma('Turma B')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    selectedTurma === 'Turma B'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Turma B
                </button>
              </div>
            </div>

            {/* Sort & Search */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="Alternar sentido alfabético"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#f75142]" />
                <span>Ordem: {sortDirection === 'asc' ? 'A-Z (Padrão)' : 'Z-A'}</span>
              </button>

              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome do aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#f75142]"
                />
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs shrink-0">
                {stats.total}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block leading-tight">Total Alunos</span>
                <span className="text-xs font-black text-slate-900 leading-tight">Lotação da Turma</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center font-black text-xs shrink-0">
                {stats.meninas}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block leading-tight">Sexo Feminino</span>
                <span className="text-xs font-black text-slate-900 leading-tight">{stats.percentualF} alunas</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                {stats.meninos}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block leading-tight">Sexo Masculino</span>
                <span className="text-xs font-black text-slate-900 leading-tight">{stats.percentualM} alunos</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                {stats.idadeMedia}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block leading-tight">Idade Média</span>
                <span className="text-xs font-black text-emerald-700 leading-tight">Faixa etária</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5 col-span-2 sm:col-span-1">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-black text-xs shrink-0">
                {turmaData.students.length - stats.repetentes}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block leading-tight">Situação</span>
                <span className="text-xs font-black text-amber-700 leading-tight">Novos / {stats.repetentes} Repet.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Students Table Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Document Header Representation */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-linear-to-r from-slate-50 to-white">
              <div className="text-center space-y-0.5">
                <span className="text-[11px] font-black text-slate-900 tracking-wider block">
                  REPÚBLICA DE ANGOLA • MINISTÉRIO DA EDUCAÇÃO
                </span>
                <span className="text-[10px] font-bold text-slate-500 block">
                  {metadata.provincia} • {metadata.direccao}
                </span>
                <span className="text-xs font-black text-[#002133] block pt-0.5">
                  {metadata.escola.toUpperCase()}
                </span>
                <div className="pt-2">
                  <span className="inline-block bg-[#002133] text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full">
                    PAUTA / LISTA NOMINAL DOS ALUNOS — {metadata.classe.toUpperCase()} • {metadata.turma.toUpperCase()} (ORDEM ALFABÉTICA A-Z)
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 mt-4 pt-3 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold">Ano Lectivo: </span>
                  <span className="font-bold text-slate-900">{metadata.anoLectivo}</span>
                  <span className="text-slate-300 mx-2">|</span>
                  <span className="text-slate-400 font-bold">Turno: </span>
                  <span className="font-bold text-slate-900">{metadata.turno}</span>
                  <span className="text-slate-300 mx-2">|</span>
                  <span className="text-slate-400 font-bold">Sala: </span>
                  <span className="font-bold text-slate-900">{metadata.sala}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">Professor Titular: </span>
                  <span className="font-bold text-slate-900">{metadata.professorTitular}</span>
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#002133] text-white text-[11px] font-black uppercase tracking-wider">
                    <th className="py-3 px-3 text-center w-14 border-r border-white/10">Nº</th>
                    <th className="py-3 px-4 border-r border-white/10">
                      Nome do Aluno
                    </th>
                    <th className="py-3 px-4 text-center w-32 border-r border-white/10">Sexo</th>
                    <th className="py-3 px-4 text-center w-28 border-r border-white/10">Idade</th>
                    <th className="py-3 px-4 text-center w-36">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {displayedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        Nenhum aluno encontrado para os critérios selecionados.
                      </td>
                    </tr>
                  ) : (
                    displayedStudents.map((student, idx) => (
                      <tr
                        key={student.id}
                        className={`transition-colors hover:bg-amber-50/50 ${
                          idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-black text-slate-900 border-r border-slate-100">
                          {student.numeroOrdem}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900">{student.nomeCompleto}</span>
                            {idx === 0 && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                1º de A-Z
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center border-r border-slate-100">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              student.genero === 'F'
                                ? 'bg-pink-50 text-pink-700 border border-pink-200/70'
                                : 'bg-blue-50 text-blue-700 border border-blue-200/70'
                            }`}
                          >
                            {student.genero === 'F' ? 'Feminino' : 'Masculino'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-700 font-semibold border-r border-slate-100">
                          {student.idade} anos
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 text-xs font-black uppercase rounded-full ${
                              student.condicaoMatricula === 'Repetente'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : student.condicaoMatricula === 'Transferido'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {student.condicaoMatricula}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Document Signatures Box Preview */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3">
                Termo de Homologação Pedagógica (Presente no Fim do Documento PDF)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-6">
                    Professor(a) Titular
                  </span>
                  <div className="border-t border-slate-300 pt-1">
                    <span className="text-xs font-bold text-slate-900 block">{metadata.professorTitular}</span>
                    <span className="text-[10px] text-slate-400 block">Regência de Turma</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-6">
                    Subdirector(a) Pedagógico(a)
                  </span>
                  <div className="border-t border-slate-300 pt-1">
                    <span className="text-xs font-bold text-slate-900 block">{metadata.subdiretorPedagogico}</span>
                    <span className="text-[10px] text-slate-400 block">Supervisão Curricular</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-6">
                    Director(a) da Escola
                  </span>
                  <div className="border-t border-slate-300 pt-1">
                    <span className="text-xs font-bold text-slate-900 block">{metadata.diretorEscola}</span>
                    <span className="text-[10px] text-slate-400 block">Carimbo & Homologação</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Total de <strong>{displayedStudents.length} alunos</strong> ordenados estritamente de A a Z.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex-1 sm:flex-initial"
            >
              Fechar
            </button>
            <button
              id="btn-baixar-pdf-footer"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="bg-[#f75142] hover:bg-[#e04436] text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer flex-1 sm:flex-initial flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>Baixar Lista em PDF (A-Z)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
