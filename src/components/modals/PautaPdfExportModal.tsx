import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileDown,
  Printer,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Loader2,
  Check,
  GraduationCap,
} from 'lucide-react';
import { StudentProfile } from '../../data/teacherData';
import { exportPautaToPDF, PautaMetadata } from '../../utils/pautaPdfExporter';
import {
  getGradingScaleForClass,
  getDisciplinasForClass,
  formatGradeForClass,
  isPassingGradeForClass,
} from '../../utils/miniPautaStorage';
import emblemAngolaImg from '../../assets/images/Emblem_of_Angola.svg.webp';

export interface PautaPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentProfile[];
  metadata?: PautaMetadata;
}

export const PautaPdfExportModal: React.FC<PautaPdfExportModalProps> = ({
  isOpen,
  onClose,
  students,
  metadata,
}) => {
  const safeMetadata: PautaMetadata = metadata || {};
  const [selectedClasse, setSelectedClasse] = useState<string>(safeMetadata.classe || '4ª Classe');
  const [selectedPeriodo, setSelectedPeriodo] = useState<'I' | 'II' | 'III' | 'FINAL'>('I');
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>('Matemática');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const isAllDisciplines = selectedDisciplineFilter === 'TODAS';
  const isFinal = selectedPeriodo === 'FINAL';
  const classScale = useMemo(() => getGradingScaleForClass(selectedClasse), [selectedClasse]);
  const classDisciplinas = useMemo(() => getDisciplinasForClass(selectedClasse), [selectedClasse]);

  const normGradeForSelectedClass = (raw: number): number => {
    if (classScale.maxNumeric === 10 && raw > 10) return Number((raw / 2).toFixed(1));
    if (classScale.maxNumeric === 20 && raw <= 10 && raw > 0) return Number((raw * 2).toFixed(1));
    return Number(raw.toFixed(1));
  };

  // Helper to compute trimester-specific and final metrics per discipline (sem notas fictícias)
  const getStudentDisciplineMetrics = (student: StudentProfile, subj: string) => {
    const g = (student.grades || []).find((x) => x.subject === subj);
    if (!g) {
      return null;
    }
    const baseMac = normGradeForSelectedClass(g.p1);
    const baseNpp = normGradeForSelectedClass(g.p2);
    const baseNpt = normGradeForSelectedClass(g.trabalho);
    const mt1 = Number(((baseMac + baseNpp + baseNpt) / 3).toFixed(1));

    const t2Mac = baseMac;
    const t2Npp = baseNpp;
    const t2Npt = baseNpt;
    const mt2 = mt1;

    const t3Mac = baseMac;
    const t3Npp = baseNpp;
    const t3Npt = baseNpt;
    const mt3 = mt1;

    const mfd = Number(((mt1 + mt2 + mt3) / 3).toFixed(1));

    return {
      t1: { mac: baseMac, npp: baseNpp, npt: baseNpt, mt: mt1 },
      t2: { mac: t2Mac, npp: t2Npp, npt: t2Npt, mt: mt2 },
      t3: { mac: t3Mac, npp: t3Npp, npt: t3Npt, mt: mt3 },
      mfd,
    };
  };

  const getActivePeriodScore = (student: StudentProfile, subj: string): number | null => {
    const m = getStudentDisciplineMetrics(student, subj);
    if (!m) return null;
    if (selectedPeriodo === 'I') return m.t1.mt;
    if (selectedPeriodo === 'II') return m.t2.mt;
    if (selectedPeriodo === 'III') return m.t3.mt;
    return m.mfd;
  };

  // Statistics strictly for the chosen period and discipline filter
  const stats = useMemo(() => {
    const total = students.length;
    let evaluatedCount = 0;
    let aprovados = 0;
    let honra = 0;
    let risco = 0;
    let reprovados = 0;
    let somaMedias = 0;
    const minPass = classScale.minPassNumeric;
    const honraCut = classScale.maxNumeric === 10 ? 8 : 16;
    const riscoCut = classScale.maxNumeric === 10 ? 5.4 : 10.5;

    students.forEach((st) => {
      let m: number | null = null;
      if (!isAllDisciplines) {
        m = getActivePeriodScore(st, selectedDisciplineFilter);
      } else {
        const validScores = classDisciplinas
          .map((subj) => getActivePeriodScore(st, subj))
          .filter((v): v is number => v !== null);
        if (validScores.length > 0) {
          m = validScores.reduce((a, b) => a + b, 0) / validScores.length;
        }
      }
      if (m === null) return;
      evaluatedCount++;
      somaMedias += m;
      if (m >= honraCut) {
        honra++;
        aprovados++;
      } else if (isPassingGradeForClass(m, selectedClasse)) {
        if (m < riscoCut || (st.presencaPercent ?? 100) < 75) {
          risco++;
        }
        aprovados++;
      } else {
        reprovados++;
      }
    });

    const avgNum = evaluatedCount > 0 ? somaMedias / evaluatedCount : 0;
    const mediaTurma =
      evaluatedCount > 0 ? formatGradeForClass(avgNum, selectedClasse) : '—';
    const taxaAprovacao =
      evaluatedCount > 0 ? Math.round((aprovados / evaluatedCount) * 100) : 0;

    return { total, aprovados, honra, risco, reprovados, mediaTurma, taxaAprovacao, minPass, honraCut };
  }, [students, isAllDisciplines, selectedDisciplineFilter, selectedPeriodo, selectedClasse, classScale, classDisciplinas]);

  const periodoFullTitle =
    selectedPeriodo === 'FINAL'
      ? 'PAUTA FINAL (Iº, IIº E IIIº TRIMESTRE)'
      : `MINI-PAUTA DO ${selectedPeriodo}º TRIMESTRE`;

  const resolvedSchoolName =
    safeMetadata.escola && !safeMetadata.escola.toLowerCase().includes('luanda')
      ? safeMetadata.escola
      : 'Escola Primária do Quéssua';

  const handleDownload = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setExportMessage('Formatando documento oficial com jsPDF...');

    try {
      await exportPautaToPDF({
        students,
        metadata: {
          escola: resolvedSchoolName,
          turma: safeMetadata.turma || 'Turma A',
          classe: selectedClasse,
          turno: safeMetadata.turno || 'Manhã',
          sala: safeMetadata.sala || 'Sala 04',
          anoLectivo: safeMetadata.anoLectivo || '2025/2026',
          trimestre: periodoFullTitle,
          periodo: selectedPeriodo,
          professorTitular: safeMetadata.professorTitular || 'Santar Goes',
        },
        mode: isAllDisciplines ? 'geral' : 'disciplina',
        periodo: selectedPeriodo,
        selectedDiscipline: selectedDisciplineFilter,
        onProgress: (msg) => setExportMessage(msg),
      });

      setExportSuccess(true);
      setExportMessage('Pauta gerada e descarregada com sucesso!');
      setTimeout(() => {
        setExportSuccess(false);
        setExportMessage(null);
      }, 4000);
    } catch (err) {
      console.error('Erro ao gerar pauta PDF:', err);
      setExportMessage('Erro na compilação do PDF. Tente novamente.');
      setTimeout(() => setExportMessage(null), 3500);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Prompt Mestre v4 Seção 18.4: Fecho seguro do diálogo com tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExporting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="pauta-pdf-export-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pauta-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="bg-[#002133] text-white px-5 sm:px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f75142] flex items-center justify-center text-white font-bold shadow-md shadow-[#f75142]/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="pauta-modal-title" className="text-base sm:text-lg font-black tracking-tight text-white">
                  Gerar Mini-Pauta / Pauta Final (PDF)
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Filtro por Trimestre e Disciplina
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Escolha o período (Iº, IIº, IIIº Trimestre ou Pauta Final) e a disciplina específica ou todas as disciplinas
              </p>
            </div>
          </div>

          <button
            id="btn-close-pauta-modal"
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar janela"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Toolbar: Configuração Independente de Período, Disciplina e Classe */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Seletor de Período (Iº, IIº, IIIº Trimestre ou Pauta Final) */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              {(
                [
                  { id: 'I', label: 'Iº Trimestre' },
                  { id: 'II', label: 'IIº Trimestre' },
                  { id: 'III', label: 'IIIº Trimestre' },
                  { id: 'FINAL', label: 'Pauta Final' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPeriodo(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedPeriodo === p.id
                      ? 'bg-[#002133] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* 2. Seletor de Disciplina (Independente: mantém a disciplina ao trocar de trimestre!) */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <BookOpen className="w-3.5 h-3.5 text-[#f75142]" />
              <span className="text-xs font-bold text-slate-500">Disciplina:</span>
              <select
                value={selectedDisciplineFilter}
                onChange={(e) => setSelectedDisciplineFilter(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
              >
                <option value="TODAS">Todas as Disciplinas ({classDisciplinas.length})</option>
                {classDisciplinas.map((d) => (
                  <option key={d} value={d}>
                    Apenas {d}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Seletor de Classe e Escala */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <GraduationCap className="w-3.5 h-3.5 text-[#f75142]" />
              <span className="text-xs font-bold text-slate-500">Classe:</span>
              <select
                value={selectedClasse}
                onChange={(e) => {
                  const nextC = e.target.value;
                  setSelectedClasse(nextC);
                  const nextDiscs = getDisciplinasForClass(nextC);
                  if (selectedDisciplineFilter !== 'TODAS' && !nextDiscs.includes(selectedDisciplineFilter)) {
                    setSelectedDisciplineFilter(nextDiscs[0] || 'Língua Portuguesa');
                  }
                }}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <optgroup label="Qualitativa (Muito Bom a Péssimo)">
                  <option value="Iniciação">Iniciação</option>
                  <option value="1ª Classe">1ª Classe</option>
                  <option value="2ª Classe">2ª Classe</option>
                </optgroup>
                <optgroup label="Escala 0 até 10">
                  <option value="3ª Classe">3ª Classe</option>
                  <option value="4ª Classe">4ª Classe</option>
                  <option value="5ª Classe">5ª Classe</option>
                  <option value="6ª Classe">6ª Classe</option>
                  <option value="PRAEER - Etapa 1">PRAEER - Etapa 1</option>
                  <option value="PRAEER - Etapa 2">PRAEER - Etapa 2</option>
                  <option value="PRAEER - Etapa 3">PRAEER - Etapa 3</option>
                </optgroup>
                <optgroup label="Escala 0 até 20">
                  <option value="7ª Classe">7ª Classe</option>
                  <option value="8ª Classe">8ª Classe</option>
                  <option value="9ª Classe">9ª Classe</option>
                  <option value="Módulo 1">Módulo 1</option>
                  <option value="Módulo 2">Módulo 2</option>
                  <option value="Módulo 3">Módulo 3</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Botões de Ação de Download e Impressão */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
              title="Imprimir visualização da pauta"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimir</span>
            </button>

            <button
              id="btn-baixar-pauta-pdf-action"
              onClick={handleDownload}
              disabled={isExporting}
              className={`inline-flex items-center justify-center gap-2 text-xs font-bold text-white px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer ${
                isExporting
                  ? 'bg-slate-400 cursor-not-allowed'
                  : exportSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-[#f75142] hover:bg-[#d93f31] active:scale-95'
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>PDF Descarregado!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>
                    Baixar {selectedPeriodo === 'FINAL' ? 'Pauta Final' : `Mini-Pauta ${selectedPeriodo}º Trim.`} (
                    {isAllDisciplines ? 'Todas' : selectedDisciplineFilter})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Notificação de Status */}
        {exportMessage && (
          <div
            className={`px-5 py-2.5 text-xs font-bold flex items-center gap-2 border-b shrink-0 ${
              exportSuccess
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {exportSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
            )}
            <span>{exportMessage}</span>
          </div>
        )}

        {/* Modal Body: Documento Escolar Único (Folha de Mini-Pauta / Pauta) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200/80">
          <div className="bg-white w-full max-w-4xl mx-auto shadow-md border border-slate-300 p-4 sm:p-8 text-black overflow-hidden box-border">
            {/* Cabeçalho Institucional Simples — Município do Quéssua */}
            <div className="text-center font-serif space-y-0.5 mb-4">
              {/* Insígnia da República de Angola */}
              <div className="flex justify-center mb-2.5">
                <img
                  src={emblemAngolaImg}
                  alt="Insígnia da República de Angola"
                  className="w-16 sm:w-20 md:w-24 h-auto max-h-24 object-contain mx-auto"
                />
              </div>
              <p className="text-xs sm:text-sm font-normal uppercase tracking-wide text-black">
                REPÚBLICA DE ANGOLA
              </p>
              <p className="text-xs sm:text-sm font-normal uppercase tracking-wide text-black">
                ADMINISTRAÇÃO MUNICIPAL DO QUÉSSUA
              </p>
              <p className="text-xs sm:text-sm font-normal uppercase tracking-wide text-black">
                DIRECÇÃO MUNICIPAL DA EDUCAÇÃO DO QUÉSSUA
              </p>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-black pt-0.5">
                {isFinal ? 'PAUTA FINAL' : 'MINI-PAUTA'}
              </p>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-black">
                {resolvedSchoolName.toUpperCase()}
              </p>
            </div>

            {/* Linha de Identificação Acima da Grelha */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs font-serif font-bold uppercase text-black mb-1.5">
              <div className="truncate max-w-full">
                <span>DISCIPLINA: </span>
                <span className="font-normal">
                  {isAllDisciplines ? 'TODAS AS DISCIPLINAS' : selectedDisciplineFilter.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                <div>
                  <span>CLASSE: </span>
                  <span className="font-normal">{selectedClasse.toUpperCase()}</span>
                </div>
                <div>
                  <span>TURMA: </span>
                  <span className="font-normal">
                    {(safeMetadata.turma || 'A').replace(/^Turma\s+/i, '').toUpperCase()}
                  </span>
                </div>
                <div>
                  <span>ANO LECTIVO: </span>
                  <span className="text-red-700 font-bold">{safeMetadata.anoLectivo || '2025/2026'}</span>
                </div>
              </div>
            </div>

            {/* Tabela Escolar Tradicional Contida na Div */}
            <div className="w-full overflow-x-auto">
              <table className="w-full table-fixed border-collapse border border-black text-[10px] sm:text-[11px] font-serif text-black">
                <thead>
                  {isAllDisciplines ? (
                    <tr className="bg-[#d9ead3] text-black font-bold uppercase text-[9px] sm:text-[10px]">
                      <th className="border border-black py-1 px-1 text-center w-[5%] bg-white">Nº</th>
                      <th className="border border-black py-1 px-1.5 text-left w-[25%] bg-white truncate">
                        NOME COMPLETO
                      </th>
                      {classDisciplinas.map((subj) => (
                        <th
                          key={subj}
                          className="border border-black py-1 px-0.5 text-center truncate"
                          title={subj}
                        >
                          {subj.length > 8 ? subj.slice(0, 6) + '.' : subj}
                        </th>
                      ))}
                      <th className="border border-black py-1 px-1 text-center bg-[#c6e0b4] w-[8%]">
                        {isFinal ? 'MFD' : `MT${selectedPeriodo === 'I' ? '1' : selectedPeriodo === 'II' ? '2' : '3'}`}
                      </th>
                      <th className="border border-black py-1 px-1 text-center bg-[#c6e0b4] w-[12%] truncate">
                        OBSERVAÇÃO
                      </th>
                    </tr>
                  ) : !isFinal ? (
                    <>
                      <tr className="font-bold uppercase">
                        <th
                          rowSpan={2}
                          className="border border-black py-1 px-1 text-center w-[6%] bg-white align-middle"
                        >
                          Nº
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-black py-1 px-2 text-center w-[42%] bg-white align-middle"
                        >
                          NOME COMPLETO
                        </th>
                        <th
                          colSpan={4}
                          className="border border-black py-1 px-1 text-center w-[36%] bg-[#d9ead3]"
                        >
                          {selectedPeriodo === 'I'
                            ? '1º TRIMESTRE'
                            : selectedPeriodo === 'II'
                            ? '2º TRIMESTRE'
                            : '3º TRIMESTRE'}
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-black py-1 px-1 text-center w-[16%] bg-[#c6e0b4] align-middle truncate"
                        >
                          OBSERVAÇÃO
                        </th>
                      </tr>
                      <tr className="font-bold uppercase text-[10px]">
                        <th className="border border-black py-1 px-1 text-center bg-[#d9ead3]">MAC</th>
                        <th className="border border-black py-1 px-1 text-center bg-[#d9ead3]">NPP</th>
                        <th className="border border-black py-1 px-1 text-center bg-[#d9ead3]">NPT</th>
                        <th className="border border-black py-1 px-1 text-center bg-[#c6e0b4]">
                          MT{selectedPeriodo === 'I' ? '1' : selectedPeriodo === 'II' ? '2' : '3'}
                        </th>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr className="font-bold uppercase text-[9px] sm:text-[10px]">
                        <th
                          rowSpan={2}
                          className="border border-black py-1 px-0.5 text-center w-[4%] bg-white align-middle"
                        >
                          Nº
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-black py-1 px-1.5 text-center w-[24%] bg-white align-middle truncate"
                        >
                          NOME COMPLETO
                        </th>
                        <th colSpan={4} className="border border-black py-1 px-0.5 text-center w-[19%] bg-[#d9ead3]">
                          1º TRIMESTRE
                        </th>
                        <th colSpan={4} className="border border-black py-1 px-0.5 text-center w-[19%] bg-[#d9ead3]">
                          2º TRIMESTRE
                        </th>
                        <th colSpan={4} className="border border-black py-1 px-0.5 text-center w-[19%] bg-[#d9ead3]">
                          3º TRIMESTRE
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-black py-1 px-0.5 text-center w-[5%] bg-[#c6e0b4] align-middle"
                        >
                          MFD
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-black py-1 px-1 text-center w-[10%] bg-[#c6e0b4] align-middle truncate"
                        >
                          OBSERVAÇÃO
                        </th>
                      </tr>
                      <tr className="font-bold uppercase text-[8px] sm:text-[9px]">
                        <th className="border border-black py-0.5 px-0.5 text-center bg-[#d9ead3]">MAC</th>
                        <th className="border border-black py-0.5 px-0.5 text-center bg-[#d9ead3]">NPP</th>
                        <th className="border border-black py-0.5 px-0.5 text-center bg-[#d9ead3]">NPT</th>
                        <th className="border border-black py-0.5 px-0.5 text-center bg-[#c6e0b4]">MT1</th>
                        <th className="border border-black py-0.5 px-0.5 text-center bg-[#d9ead3]">MAC</th>
                        <th className="border border-black py-0.5 px-0.5 text-center bg-[#d9ead3]">NPP</th>
                        <th className="border border-black py-0.5 px-0.5 text-center bg-[#d9ead3]">NPT</th>
                        <th className="border border-black py-0.5 px-0.5 text-center bg-[#c6e0b4]">MT2</th>
                        <th className="border border-black py-0.5 px-0.5 text-center bg-[#d9ead3]">MAC</th>
                        <th className="border border-black py-0.5 px-0.5 text-center bg-[#d9ead3]">NPP</th>
                        <th className="border border-black py-0.5 px-0.5 text-center bg-[#d9ead3]">NPT</th>
                        <th className="border border-black py-0.5 px-0.5 text-center bg-[#c6e0b4]">MT3</th>
                      </tr>
                    </>
                  )}
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(25, students.length) }, (_, idx) => {
                    const st = students[idx];
                    if (!st) {
                      return (
                        <tr key={`empty-line-${idx}`} className="h-5">
                          <td className="border border-black px-1 text-left">{idx + 1}.</td>
                          <td className="border border-black px-1.5 truncate"></td>
                          {isAllDisciplines ? (
                            <>
                              {classDisciplinas.map((subj) => (
                                <td key={subj} className="border border-black px-0.5 text-center"></td>
                              ))}
                              <td className="border border-black px-0.5 text-center bg-[#c6e0b4]/70"></td>
                              <td className="border border-black px-1 text-center bg-[#c6e0b4]/70"></td>
                            </>
                          ) : !isFinal ? (
                            <>
                              <td className="border border-black px-1 text-center"></td>
                              <td className="border border-black px-1 text-center"></td>
                              <td className="border border-black px-1 text-center"></td>
                              <td className="border border-black px-1 text-center bg-[#c6e0b4]/70"></td>
                              <td className="border border-black px-1 text-center bg-[#c6e0b4]/70"></td>
                            </>
                          ) : (
                            <>
                              <td className="border border-black px-0.5 text-center"></td>
                              <td className="border border-black px-0.5 text-center"></td>
                              <td className="border border-black px-0.5 text-center"></td>
                              <td className="border border-black px-0.5 text-center bg-[#c6e0b4]/70"></td>
                              <td className="border border-black px-0.5 text-center"></td>
                              <td className="border border-black px-0.5 text-center"></td>
                              <td className="border border-black px-0.5 text-center"></td>
                              <td className="border border-black px-0.5 text-center bg-[#c6e0b4]/70"></td>
                              <td className="border border-black px-0.5 text-center"></td>
                              <td className="border border-black px-0.5 text-center"></td>
                              <td className="border border-black px-0.5 text-center"></td>
                              <td className="border border-black px-0.5 text-center bg-[#c6e0b4]/70"></td>
                              <td className="border border-black px-0.5 text-center bg-[#c6e0b4]/70"></td>
                              <td className="border border-black px-1 text-center bg-[#c6e0b4]/70"></td>
                            </>
                          )}
                        </tr>
                      );
                    }

                    if (isAllDisciplines) {
                      const scores = classDisciplinas.map((subj) => ({
                        subj,
                        val: getActivePeriodScore(st, subj),
                      }));
                      const validVals = scores
                        .map((x) => x.val)
                        .filter((v): v is number => v !== null);
                      const mediaPeriodo =
                        validVals.length > 0
                          ? validVals.reduce((acc, v) => acc + v, 0) / validVals.length
                          : null;
                      const pass =
                        mediaPeriodo !== null &&
                        isPassingGradeForClass(mediaPeriodo, selectedClasse);

                      return (
                        <tr key={st.id} className="h-5">
                          <td className="border border-black px-1 text-left">
                            {st.numeroChamada || idx + 1}.
                          </td>
                          <td className="border border-black px-1.5 font-medium truncate">{st.name}</td>
                          {scores.map(({ subj, val }) => (
                            <td key={subj} className="border border-black px-0.5 text-center truncate">
                              {val === null ? '' : formatGradeForClass(val, selectedClasse, 'compact')}
                            </td>
                          ))}
                          <td className="border border-black px-0.5 text-center font-bold bg-[#c6e0b4]/70 truncate">
                            {mediaPeriodo === null ? '' : formatGradeForClass(mediaPeriodo, selectedClasse, 'compact')}
                          </td>
                          <td className="border border-black px-1 text-center bg-[#c6e0b4]/70 truncate">
                            {mediaPeriodo === null
                              ? ''
                              : isFinal
                              ? pass
                                ? 'Transita'
                                : 'Não Transita'
                              : pass
                              ? 'Positiva'
                              : 'Negativa'}
                          </td>
                        </tr>
                      );
                    }

                    const m = getStudentDisciplineMetrics(st, selectedDisciplineFilter);

                    if (!isFinal) {
                      const tri = m
                        ? selectedPeriodo === 'I'
                          ? m.t1
                          : selectedPeriodo === 'II'
                          ? m.t2
                          : m.t3
                        : null;
                      const pass = tri ? isPassingGradeForClass(tri.mt, selectedClasse) : false;
                      return (
                        <tr key={st.id} className="h-5">
                          <td className="border border-black px-1 text-left">
                            {st.numeroChamada || idx + 1}.
                          </td>
                          <td className="border border-black px-1.5 font-medium truncate">{st.name}</td>
                          <td className="border border-black px-1 text-center">
                            {tri ? formatGradeForClass(tri.mac, selectedClasse, 'compact') : ''}
                          </td>
                          <td className="border border-black px-1 text-center">
                            {tri ? formatGradeForClass(tri.npp, selectedClasse, 'compact') : ''}
                          </td>
                          <td className="border border-black px-1 text-center">
                            {tri ? formatGradeForClass(tri.npt, selectedClasse, 'compact') : ''}
                          </td>
                          <td className="border border-black px-1 text-center font-bold bg-[#c6e0b4]/70">
                            {tri ? formatGradeForClass(tri.mt, selectedClasse, 'compact') : ''}
                          </td>
                          <td className="border border-black px-1 text-center bg-[#c6e0b4]/70 truncate">
                            {tri ? (pass ? 'Positiva' : 'Negativa') : ''}
                          </td>
                        </tr>
                      );
                    }

                    const pass = m ? isPassingGradeForClass(m.mfd, selectedClasse) : false;
                    return (
                      <tr key={st.id} className="h-5">
                        <td className="border border-black px-0.5 text-left">
                          {st.numeroChamada || idx + 1}.
                        </td>
                        <td className="border border-black px-1.5 font-medium truncate">{st.name}</td>
                        <td className="border border-black px-0.5 text-center">
                          {m ? formatGradeForClass(m.t1.mac, selectedClasse, 'compact') : ''}
                        </td>
                        <td className="border border-black px-0.5 text-center">
                          {m ? formatGradeForClass(m.t1.npp, selectedClasse, 'compact') : ''}
                        </td>
                        <td className="border border-black px-0.5 text-center">
                          {m ? formatGradeForClass(m.t1.npt, selectedClasse, 'compact') : ''}
                        </td>
                        <td className="border border-black px-0.5 text-center font-bold bg-[#c6e0b4]/70">
                          {m ? formatGradeForClass(m.t1.mt, selectedClasse, 'compact') : ''}
                        </td>
                        <td className="border border-black px-0.5 text-center">
                          {m ? formatGradeForClass(m.t2.mac, selectedClasse, 'compact') : ''}
                        </td>
                        <td className="border border-black px-0.5 text-center">
                          {m ? formatGradeForClass(m.t2.npp, selectedClasse, 'compact') : ''}
                        </td>
                        <td className="border border-black px-0.5 text-center">
                          {m ? formatGradeForClass(m.t2.npt, selectedClasse, 'compact') : ''}
                        </td>
                        <td className="border border-black px-0.5 text-center font-bold bg-[#c6e0b4]/70">
                          {m ? formatGradeForClass(m.t2.mt, selectedClasse, 'compact') : ''}
                        </td>
                        <td className="border border-black px-0.5 text-center">
                          {m ? formatGradeForClass(m.t3.mac, selectedClasse, 'compact') : ''}
                        </td>
                        <td className="border border-black px-0.5 text-center">
                          {m ? formatGradeForClass(m.t3.npp, selectedClasse, 'compact') : ''}
                        </td>
                        <td className="border border-black px-0.5 text-center">
                          {m ? formatGradeForClass(m.t3.npt, selectedClasse, 'compact') : ''}
                        </td>
                        <td className="border border-black px-0.5 text-center font-bold bg-[#c6e0b4]/70">
                          {m ? formatGradeForClass(m.t3.mt, selectedClasse, 'compact') : ''}
                        </td>
                        <td className="border border-black px-0.5 text-center font-bold bg-[#c6e0b4]/70">
                          {m ? formatGradeForClass(m.mfd, selectedClasse, 'compact') : ''}
                        </td>
                        <td className="border border-black px-1 text-center bg-[#c6e0b4]/70 truncate">
                          {m ? (pass ? 'Transita' : 'Não Transita') : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Rodapé Simples com Assinatura do Professor */}
            <div className="pt-8 pb-2 text-center font-serif text-xs text-black">
              <p className="mb-6">O Professor</p>
              <div className="w-64 max-w-full mx-auto border-b border-black"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
