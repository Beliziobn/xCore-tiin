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
  Info
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

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schools?: AdminSchool[];
  teachers?: AdminTeacher[];
  directors?: AdminDirector[];
  students?: AdminStudent[];
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  schools,
  teachers,
  directors,
  students,
}) => {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [activeTabPreview, setActiveTabPreview] = useState<'all' | 'teachers' | 'directors' | 'students' | 'schools'>('all');

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
        {/* Header with Excel Signature Branding */}
        <div className="bg-gradient-to-r from-[#002133] via-[#053752] to-[#0e4d28] px-6 py-5 flex items-center justify-between text-white shrink-0 border-b border-emerald-500/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-emerald-400/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Central de Exportação de Planilhas Excel (.xlsx)
                </h2>
                <span className="text-[10px] bg-emerald-500/90 text-white px-2.5 py-0.5 rounded-full font-black tracking-wider uppercase">
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
          {/* Main Hero Card for Consolidated Export */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-2xl p-5 sm:p-6 border border-emerald-200/80 shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-600/10 text-emerald-800 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Pasta de Trabalho Completa & Consolidada
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Exportar Todos os Dados da Rede num Único Ficheiro Excel (.xlsx)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Gera uma planilha completa com <strong>abas individuais e separadas</strong> para cada categoria:
                  <span className="block mt-1 text-slate-700 font-semibold text-xs">
                    📁 Aba 1: Resumo Geral • 📁 Aba 2: Professores • 📁 Aba 3: Diretores • 📁 Aba 4: Alunos • 📁 Aba 5: Escolas
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportAll}
                disabled={downloadingType === 'all'}
                className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-sm shadow-md shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-600 active:scale-98 transition-all flex items-center justify-center gap-2.5 shrink-0 cursor-pointer"
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
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Planilhas Individuais por Categoria
              </h4>
              <span className="text-xs text-slate-400">
                Sincronizadas automaticamente a cada novo cadastro
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Professores */}
              <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-2xs hover:border-[#f75142]/40 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f75142]/10 text-[#f75142] flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {totalTeachers} Cadastros
                    </span>
                  </div>
                  <h5 className="font-black text-slate-900 text-sm mb-1">
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
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-[#f75142] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
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
              <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {totalDirectors} Homologados
                    </span>
                  </div>
                  <h5 className="font-black text-slate-900 text-sm mb-1">
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
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
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
              <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {totalStudents} Alunos
                    </span>
                  </div>
                  <h5 className="font-black text-slate-900 text-sm mb-1">
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
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
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
              <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-2xs hover:border-purple-300 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <School className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {totalSchools} Escolas
                    </span>
                  </div>
                  <h5 className="font-black text-slate-900 text-sm mb-1">
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
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-purple-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
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
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
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
    </div>
  );
};
