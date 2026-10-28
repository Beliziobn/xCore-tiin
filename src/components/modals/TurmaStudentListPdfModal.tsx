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
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Lista Nominal de Alunos (Folha A4)
              </h2>
              <p className="text-[11px] text-slate-400">
                {metadata.escola} • {metadata.classe} ({metadata.turma})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-white/10"
              title="Imprimir Folha A4"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Imprimir</span>
            </button>

            <button
              id="btn-modal-baixar-pdf-az"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 bg-[#f75142] hover:bg-[#e04436] text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>A gerar PDF...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>PDF Gerado</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Baixar PDF A4</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selection & Filter Controls (Compact Toolbar) */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
              <label htmlFor="select-classe-modal" className="text-[11px] font-semibold text-slate-500">
                Classe:
              </label>
              <select
                id="select-classe-modal"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                {ALL_SCHOOL_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
              <label htmlFor="select-turma-modal" className="text-[11px] font-semibold text-slate-500">
                Turma:
              </label>
              <select
                id="select-turma-modal"
                value={selectedTurma}
                onChange={(e) => setSelectedTurma(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                {STANDARD_TURMAS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Alternar sentido alfabético"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Ordem: {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="hidden md:inline-block text-[11px] text-slate-600 font-medium">
              Total: <strong className="text-slate-900">{stats.total}</strong> ({stats.meninos} M / {stats.meninas} F)
            </span>
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Scrollable A4 Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/80 flex justify-center">
          {/* Official A4 Paper Sheet */}
          <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg border border-slate-300 px-6 py-8 sm:px-12 sm:py-10 text-slate-950 flex flex-col justify-between mx-auto">
            <div>
              {/* 1. Official Angolan School Header */}
              <div className="text-center pb-4 border-b border-slate-800">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-950">
                  REPÚBLICA DE ANGOLA
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-950">
                  MINISTÉRIO DA EDUCAÇÃO
                </p>
                <p className="text-[11px] font-semibold uppercase text-slate-800 mt-0.5">
                  {metadata.provincia} • {metadata.direccao}
                </p>
                <p className="text-sm font-black uppercase text-slate-950 mt-1">
                  {metadata.escola}
                </p>

                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-950 mt-4 pt-2 border-t border-slate-300 inline-block px-6">
                  LISTA NOMINAL DOS ALUNOS
                </h3>

                {/* School Turma Metadata Line */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-left text-[11px] mt-4 pt-2 border-t border-slate-400">
                  <div>
                    <span className="font-semibold text-slate-600">Ano Lectivo: </span>
                    <span className="font-bold text-slate-950">{metadata.anoLectivo}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Classe: </span>
                    <span className="font-bold text-slate-950">{metadata.classe}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Turma: </span>
                    <span className="font-bold text-slate-950">{metadata.turma.replace(/^Turma\s+/i, '')}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Período: </span>
                    <span className="font-bold text-slate-950">{metadata.turno}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Sala: </span>
                    <span className="font-bold text-slate-950">{metadata.sala.replace(/^Sala\s+/i, '')}</span>
                  </div>
                </div>
              </div>

              {/* 2. Traditional School Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-800 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-950 text-[11px] font-bold uppercase">
                      <th className="py-1.5 px-2 text-center w-10 border border-slate-800">Nº</th>
                      <th className="py-1.5 px-3 border border-slate-800">Nome Completo do Aluno</th>
                      <th className="py-1.5 px-2 text-center w-14 border border-slate-800">Sexo</th>
                      <th className="py-1.5 px-2 text-center w-16 border border-slate-800">Idade</th>
                      <th className="py-1.5 px-3 text-center w-36 border border-slate-800">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-500 border border-slate-800">
                          Nenhum aluno encontrado para os critérios selecionados.
                        </td>
                      </tr>
                    ) : (
                      displayedStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-2 text-center font-semibold text-slate-950 border border-slate-800">
                            {String(student.numeroOrdem).padStart(2, '0')}
                          </td>
                          <td className="py-1.5 px-3 font-medium text-slate-950 border border-slate-800">
                            {student.nomeCompleto}
                          </td>
                          <td className="py-1.5 px-2 text-center font-medium text-slate-950 border border-slate-800">
                            {student.genero}
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-950 border border-slate-800">
                            {student.idade}
                          </td>
                          <td className="py-1.5 px-3 text-center text-[11px] text-slate-700 border border-slate-800">
                            {student.condicaoMatricula === 'Matriculado' ? '' : student.condicaoMatricula}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Official School Document Footer & Signatures */}
            <div className="pt-6 mt-6 text-xs text-slate-950">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] border-t border-b border-slate-400 py-1.5 mb-6">
                <span>
                  <strong>Total de Alunos:</strong> {stats.total}
                </span>
                <span>
                  <strong>Masculinos (M):</strong> {stats.meninos}
                </span>
                <span>
                  <strong>Femininos (F):</strong> {stats.meninas}
                </span>
                <span>
                  <strong>Data:</strong> {metadata.dataEmissao}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4 text-center text-[11px]">
                <div>
                  <p className="font-bold uppercase text-slate-800 mb-8">
                    O(A) Professor(a) / Director(a) de Turma
                  </p>
                  <div className="border-t border-slate-800 w-56 max-w-full mx-auto pt-1">
                    <span className="font-semibold text-slate-900">{metadata.professorTitular}</span>
                  </div>
                </div>
                <div>
                  <p className="font-bold uppercase text-slate-800 mb-8">
                    O(A) Subdirector(a) Pedagógico(a)
                  </p>
                  <div className="border-t border-slate-800 w-56 max-w-full mx-auto pt-1">
                    <span className="font-semibold text-slate-900">{metadata.subdiretorPedagogico}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500">
            Formato Oficial A4 • <strong>{displayedStudents.length} alunos</strong> (Ordem A-Z)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              id="btn-baixar-pdf-footer"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar Folha A4 (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
