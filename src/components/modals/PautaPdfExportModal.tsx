import React, { useState, useMemo } from 'react';
import {
  X,
  FileDown,
  Printer,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Loader2,
  Check,
  GraduationCap,
  Users,
  LayoutList
} from 'lucide-react';
import { StudentProfile, defaultDisciplinasList } from '../../data/teacherData';
import { exportPautaToPDF, PautaMetadata } from '../../utils/pautaPdfExporter';

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
  metadata = {},
}) => {
  const [mode, setMode] = useState<'geral' | 'disciplina'>('geral');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('Língua Portuguesa');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Statistics
  const stats = useMemo(() => {
    const total = students.length;
    let aprovados = 0;
    let honra = 0;
    let risco = 0;
    let reprovados = 0;
    let somaMedias = 0;

    students.forEach((st) => {
      let m = 14.0;
      if (st.grades && st.grades.length > 0) {
        if (mode === 'disciplina') {
          const g = st.grades.find((x) => x.subject === selectedDiscipline);
          m = g ? g.media : 14.0;
        } else {
          m = st.grades.reduce((acc, g) => acc + g.media, 0) / st.grades.length;
        }
      }
      somaMedias += m;
      if (m >= 16) {
        honra++;
        aprovados++;
      } else if (m >= 10) {
        if (m < 10.5 || (st.presencaPercent ?? 100) < 75) {
          risco++;
        }
        aprovados++;
      } else {
        reprovados++;
      }
    });

    const mediaTurma = total > 0 ? (somaMedias / total).toFixed(1) : '14.0';
    const taxaAprovacao = total > 0 ? Math.round((aprovados / total) * 100) : 100;

    return { total, aprovados, honra, risco, reprovados, mediaTurma, taxaAprovacao };
  }, [students, mode, selectedDiscipline]);

  const handleDownload = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setExportMessage('Formatando documento oficial com jsPDF...');

    try {
      await exportPautaToPDF({
        students,
        metadata: {
          escola: metadata.escola || 'Escola Primária Nº 1024 - Luanda Sul',
          turma: metadata.turma || 'Turma 1',
          classe: metadata.classe || '4ª Classe',
          turno: metadata.turno || 'Manhã',
          sala: metadata.sala || 'Sala 04',
          anoLectivo: metadata.anoLectivo || '2026',
          trimestre: metadata.trimestre || '1º Trimestre',
          professorTitular: metadata.professorTitular || 'Santar Goes',
        },
        mode,
        selectedDiscipline,
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

  if (!isOpen) return null;

  return (
    <div
      id="pauta-pdf-export-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="bg-[#002133] text-white px-5 sm:px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f75142] flex items-center justify-center text-white font-bold shadow-md shadow-[#f75142]/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Exportar Pauta de Avaliação
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  PDF Vetorial (jsPDF)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Pauta curricular oficial com notas, médias trimestrais e parecer de aprovação
              </p>
            </div>
          </div>

          <button
            id="btn-close-pauta-modal"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Toolbar: Configuração do Relatório */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Seletor de Modelo de Pauta */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                onClick={() => setMode('geral')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'geral'
                    ? 'bg-[#002133] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pauta Geral (Todas as Disciplinas)
              </button>
              <button
                onClick={() => setMode('disciplina')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'disciplina'
                    ? 'bg-[#002133] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pauta por Disciplina
              </button>
            </div>

            {/* Dropdown de Disciplina (quando em modo por disciplina) */}
            {mode === 'disciplina' && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                <BookOpen className="w-3.5 h-3.5 text-[#f75142]" />
                <span className="text-xs font-bold text-slate-500">Disciplina:</span>
                <select
                  value={selectedDiscipline}
                  onChange={(e) => setSelectedDiscipline(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                >
                  {defaultDisciplinasList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                  <span>Baixar Pauta em PDF</span>
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

        {/* Modal Body: Pré-visualização da Pauta */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Cabeçalho da Pauta Estilizada (Padrão MED Angola) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="text-center space-y-0.5 border-b border-slate-100 pb-3">
              <div className="text-[11px] font-black text-slate-800 tracking-wider">
                REPÚBLICA DE ANGOLA · MINISTÉRIO DA EDUCAÇÃO
              </div>
              <div className="text-xs text-slate-500 font-semibold">
                GOVERNO PROVINCIAL DE LUANDA · DIRECÇÃO MUNICIPAL DA EDUCAÇÃO
              </div>
              <div className="text-sm font-black text-[#002133] pt-0.5">
                ESCOLA PRIMÁRIA Nº 1024 - LUANDA SUL
              </div>
              <div className="inline-block mt-1.5 px-3 py-1 bg-[#002133] text-white text-xs font-black rounded-lg uppercase tracking-wide">
                {mode === 'geral'
                  ? 'PAUTA OFICIAL DE AVALIAÇÃO E APROVEITAMENTO ESCOLAR · 1º TRIMESTRE / 2026'
                  : `PAUTA PARCELAR · ${selectedDiscipline.toUpperCase()} · 1º TRIMESTRE / 2026`}
              </div>
            </div>

            {/* Metadados da Turma */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Turma / Classe:</span>
                <span className="font-bold text-slate-800">4ª Classe · Turma 1</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Turno / Sala:</span>
                <span className="font-bold text-slate-800">Manhã · Sala 04</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Docente Titular:</span>
                <span className="font-bold text-slate-800">Santar Goes</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Alunos Avaliados:</span>
                <span className="font-bold text-[#f75142]">{stats.total} Estudantes</span>
              </div>
            </div>
          </div>

          {/* Mini Indicadores de Aproveitamento */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] font-bold text-emerald-800 block">Aprovados</span>
              <span className="text-xl font-black text-emerald-700">{stats.aprovados}</span>
              <span className="text-[10px] font-semibold text-emerald-600 block">{stats.taxaAprovacao}% taxa</span>
            </div>
            <div className="bg-purple-50/80 border border-purple-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] font-bold text-purple-800 block">Quadro de Honra</span>
              <span className="text-xl font-black text-purple-700">{stats.honra}</span>
              <span className="text-[10px] font-semibold text-purple-600 block">Média ≥ 16</span>
            </div>
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] font-bold text-amber-800 block">Em Risco</span>
              <span className="text-xl font-black text-amber-700">{stats.risco}</span>
              <span className="text-[10px] font-semibold text-amber-600 block">Apoio Pedagógico</span>
            </div>
            <div className="bg-rose-50/80 border border-rose-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] font-bold text-rose-800 block">Abaixo da Média</span>
              <span className="text-xl font-black text-rose-700">{stats.reprovados}</span>
              <span className="text-[10px] font-semibold text-rose-600 block">Média &lt; 10</span>
            </div>
            <div className="bg-[#fef2f1] border border-[#fee4e2] rounded-xl p-3 text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-[#f75142] block">Média da Turma</span>
              <span className="text-xl font-black text-[#f75142]">{stats.mediaTurma}</span>
              <span className="text-[10px] font-semibold text-slate-500 block">Valores (0 a 20)</span>
            </div>
          </div>

          {/* Tabela de Pré-visualização das Notas */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-[380px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[#002133] text-white z-10">
                  <tr className="text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-center w-12">Nº</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Nome do Aluno</th>
                    <th className="py-2.5 px-2 text-center w-14">Sexo</th>
                    {mode === 'geral' ? (
                      <>
                        <th className="py-2.5 px-2 text-center" title="Língua Portuguesa">L. Port</th>
                        <th className="py-2.5 px-2 text-center" title="Matemática">Mat</th>
                        <th className="py-2.5 px-2 text-center" title="Ciências Naturais">C. Nat</th>
                        <th className="py-2.5 px-2 text-center" title="História">Hist</th>
                        <th className="py-2.5 px-2 text-center" title="Geografia">Geog</th>
                        <th className="py-2.5 px-2 text-center" title="Educação Física">Ed. Fís</th>
                        <th className="py-2.5 px-2 text-center" title="Educação Visual e Plástica">E.V.P</th>
                        <th className="py-2.5 px-3 text-center bg-slate-800">Média Geral</th>
                        <th className="py-2.5 px-2 text-center">Pres.</th>
                        <th className="py-2.5 px-3 text-center min-w-[110px]">Resultado</th>
                      </>
                    ) : (
                      <>
                        <th className="py-2.5 px-3 text-center">Prova 1 (P1)</th>
                        <th className="py-2.5 px-3 text-center">Prova 2 (P2)</th>
                        <th className="py-2.5 px-3 text-center">Trabalho</th>
                        <th className="py-2.5 px-3 text-center bg-slate-800">Média</th>
                        <th className="py-2.5 px-3 text-center">Situação</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st, idx) => {
                    const stGrades = st.grades || [];
                    const mediaGeral = stGrades.length > 0
                      ? stGrades.reduce((acc, g) => acc + g.media, 0) / stGrades.length
                      : 14.0;
                    const presenca = st.presencaPercent ?? 95;

                    let situacaoBadge = {
                      label: 'Aprovado',
                      class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    };
                    if (mediaGeral >= 16) {
                      situacaoBadge = {
                        label: 'Quadro Honra',
                        class: 'bg-purple-50 text-purple-700 border-purple-200',
                      };
                    } else if (mediaGeral < 10) {
                      situacaoBadge = {
                        label: 'Reprovado',
                        class: 'bg-rose-50 text-rose-700 border-rose-200',
                      };
                    } else if (mediaGeral < 10.5 || presenca < 75) {
                      situacaoBadge = {
                        label: 'Em Risco',
                        class: 'bg-amber-50 text-amber-700 border-amber-200',
                      };
                    }

                    return (
                      <tr key={st.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                        <td className="py-2 px-3 text-center font-bold text-slate-600">
                          {st.numeroChamada || idx + 1}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {st.name}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-500 font-semibold">
                          {st.genero}
                        </td>
                        {mode === 'geral' ? (
                          <>
                            {defaultDisciplinasList.map((subj) => {
                              const g = stGrades.find((x) => x.subject === subj);
                              const val = g ? g.media : 14.0;
                              return (
                                <td
                                  key={subj}
                                  className={`py-2 px-2 text-center font-medium ${
                                    val < 10
                                      ? 'text-rose-600 font-bold'
                                      : val >= 16
                                      ? 'text-purple-700 font-bold'
                                      : 'text-slate-700'
                                  }`}
                                >
                                  {val.toFixed(1)}
                                </td>
                              );
                            })}
                            <td className="py-2 px-3 text-center font-black bg-slate-50 text-[#002133]">
                              {mediaGeral.toFixed(1)}
                            </td>
                            <td className="py-2 px-2 text-center font-medium text-slate-600">
                              {presenca}%
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${situacaoBadge.class}`}
                              >
                                {situacaoBadge.label}
                              </span>
                            </td>
                          </>
                        ) : (
                          (() => {
                            const g = stGrades.find((x) => x.subject === selectedDiscipline) || {
                              p1: 14,
                              p2: 15,
                              trabalho: 15,
                              media: 14.6,
                              status: 'Aprovado',
                            };
                            return (
                              <>
                                <td className="py-2 px-3 text-center text-slate-700">{g.p1.toFixed(1)}</td>
                                <td className="py-2 px-3 text-center text-slate-700">{g.p2.toFixed(1)}</td>
                                <td className="py-2 px-3 text-center text-slate-700">{g.trabalho.toFixed(1)}</td>
                                <td className="py-2 px-3 text-center font-black bg-slate-50 text-[#002133]">
                                  {g.media.toFixed(1)}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      g.media >= 10
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                  >
                                    {g.status}
                                  </span>
                                </td>
                              </>
                            );
                          })()
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Formato oficial A4 em conformidade com o Ministério da Educação (MED Angola).
          </span>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              Fechar
            </button>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className={`inline-flex items-center gap-2 text-xs font-bold text-white px-5 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer ${
                isExporting ? 'bg-slate-400' : 'bg-[#002133] hover:bg-[#00314d]'
              }`}
            >
              <FileDown className="w-4 h-4 text-[#f75142]" />
              <span>Baixar Pauta em PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
