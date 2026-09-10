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
  FileCheck
} from 'lucide-react';
import type { AdminSchool, AdminTeacher, AdminDirector, AdminStudent } from '../../types';
import {
  exportConsolidatedExcel,
  exportTeachersExcel,
  exportDirectorsExcel,
  exportStudentsExcel,
  exportSchoolsExcel,
  getUnifiedSystemDataset,
} from '../../utils/excelExport';
import { SigeDataEntryModal } from './SigeDataEntryModal';

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

  if (!isOpen) return null;

  const dataset = getUnifiedSystemDataset({ schools, teachers, directors, students });

  const totalTeachers = dataset.teachers.length;
  const totalDirectors = dataset.directors.length;
  const totalStudents = dataset.students.length;
  const totalSchools = dataset.schools.length;

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

          {/* Instrumento Complementar SIGE 2024/2025 (Angola / GEPE) */}
          <div className="bg-gradient-to-r from-[#1F4E79]/10 via-[#1F4E79]/5 to-transparent rounded-2xl p-5 sm:p-6 border-2 border-[#1F4E79]/30 shadow-sm relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1F4E79] text-white text-[11px] font-bold">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                  Instrumento Oficial Ministério da Educação de Angola (GEPE)
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#1F4E79]">
                  Instrumento Complementar do SIGE 2024/2025 (.xlsx)
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Réplica estrutural exacta das <strong>11 folhas oficiais</strong> com layout rígido para localização de coordenadas, fórmulas de soma automáticas (<code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded text-[#1F4E79]">SUM</code>), tipografia Arial 10pt e separação total de subsistemas:
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-700 font-medium">
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">1. CAPA</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">2. Alunos Matriculados</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">3. Pessoal Docente</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">4. Infraestruturas</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">5. Aproveitamento</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">6. Repetentes</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">7. NEE</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">8. Pessoal Não Docente</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">9. Escolas s/ Dados</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">10. Consolidado</span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#1F4E79]/20 font-semibold text-[#1F4E79]">11. Base de Dados</span>
                </div>

                <div className="mt-3 p-3 bg-white/80 rounded-xl border border-[#1F4E79]/20 text-xs text-slate-700 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#1F4E79]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Regras de Validação & Consistência SIGE Integradas:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    <li><strong>Data Validation (F ≤ MF):</strong> Regra nativa de validação do Excel bloqueando entrada com aviso <em>&quot;F não pode ser Superior a MF&quot;</em> em todas as folhas de contagem.</li>
                    <li><strong>Consistência de Aproveitamento:</strong> Fórmula <code>Matriculados = Aprovados + Reprovados + Desistidos</code> com coluna de validação (Correcto/Falso) e residual zero na Coluna N.</li>
                    <li><strong>Consolidado Cruzado:</strong> Tabela 7 com referências dinâmicas directas (D275, D327, D351, D371) e validação agregada no Total Geral (K49, L49, M49).</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSigeDataEntryOpen(true)}
                  className="w-full px-5 py-3 rounded-xl bg-[#1F4E79] text-white font-bold text-xs shadow-sm hover:bg-[#163a5c] active:bg-[#0f2840] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-white" />
                  <span>Preencher & Validar (Web / JSON)</span>
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href="/Instrumento_Complementar_SIGE_2024_2025.xlsx"
                    download="Instrumento_Complementar_SIGE_2024_2025.xlsx"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-[#1F4E79]/30 text-[#1F4E79] font-bold text-[11px] shadow-2xs hover:bg-[#1F4E79]/5 transition-all flex items-center justify-center gap-1.5 no-underline text-center"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>Modelo em Branco</span>
                  </a>

                  <a
                    href="/saida.xlsx"
                    download="Instrumento_Complementar_SIGE_PREENCHIDO.xlsx"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-[11px] shadow-2xs hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5 no-underline text-center"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Exemplo Preenchido</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main Hero Card for Consolidated Export */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#002133]" />
                  Pasta de Trabalho Completa & Consolidada
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Exportar Todos os Dados da Rede num Único Ficheiro Excel (.xlsx)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Gera uma planilha completa com abas individuais e estruturadas para cada categoria:
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600 font-medium">
                  <span className="px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-semibold">Aba 1: Resumo Geral</span>
                  <span className="px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-semibold">Aba 2: Professores</span>
                  <span className="px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-semibold">Aba 3: Diretores</span>
                  <span className="px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-semibold">Aba 4: Alunos</span>
                  <span className="px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-semibold">Aba 5: Escolas</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportAll}
                disabled={downloadingType === 'all'}
                className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-[#002133] text-white font-bold text-sm shadow-sm hover:bg-slate-900 active:bg-black transition-all flex items-center justify-center gap-2.5 shrink-0 cursor-pointer"
              >
                {downloadingType === 'all' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>A Gerar Ficheiro Excel...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Baixar Pasta Completa (.xlsx)</span>
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
    </div>
  );
};
