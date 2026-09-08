import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Building,
  GraduationCap,
  Users,
  ShieldCheck,
  HeartHandshake,
  Layers,
  CheckCircle2,
  Calendar,
  Filter,
} from 'lucide-react';
import type { StudentRegistrationData } from '../../types';
import {
  generateStudentAnalyticalMatrix,
  generateStudentsCSV,
  STUDENT_MODALITIES_CATALOG,
} from '../../utils/studentStorage';

interface StudentAnalyticalMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRegistrationData[];
}

export const StudentAnalyticalMatrixModal: React.FC<StudentAnalyticalMatrixModalProps> = ({
  isOpen,
  onClose,
  students,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'disabilities' | 'documents'>('matrix');

  if (!isOpen) return null;

  const matrix = generateStudentAnalyticalMatrix(students);

  const handleDownloadCSV = () => {
    const csvContent = generateStudentsCSV(students);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Matriz_Alunos_Quessua_${new Date().toISOString().substring(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#002133] px-6 py-4.5 flex items-center justify-between text-white shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Matriz Analítica & Estatística de Alunos
                </h2>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Censo Quêssua
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Cruzamento por Natureza, Modalidades Oficiais (A a O), Idades e Ensino Especial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV (Excel)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between overflow-x-auto gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-[#002133] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              1. Natureza × Modalidade (A a O)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('disabilities')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'disabilities'
                  ? 'bg-[#002133] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              2. Ensino Especial & Deficiências
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-[#002133] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              3. Documentação & Género
            </button>
          </div>

          <div className="text-xs font-mono font-bold text-slate-600">
            Total Alunos: <span className="text-slate-900 font-black">{matrix.totalStudents}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: NATUREZA × MODALIDADE */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Tabela de Cruzamento: Natureza da Escola × Modalidade de Ensino
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mostra a distribuição de matrículas por cada uma das 15 modalidades oficiais (A a O).
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Modalidade Oficial</th>
                      <th className="py-3 px-3 text-center">Código</th>
                      <th className="py-3 px-4 text-center bg-blue-50/60 text-blue-900">Pública</th>
                      <th className="py-3 px-4 text-center bg-amber-50/60 text-amber-900">
                        Público-Privada
                      </th>
                      <th className="py-3 px-4 text-center bg-purple-50/60 text-purple-900">
                        Privada
                      </th>
                      <th className="py-3 px-4 text-center font-black bg-slate-200/80 text-slate-900">
                        Total Geral
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {matrix.byNaturezaAndModalidade.map((row) => (
                      <tr key={row.modalidadeKey} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {row.modalidadeLabel}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                          {row.modalidadeCode}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-blue-900 font-bold">
                          {row.publica}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-amber-900 font-bold">
                          {row.publicoPrivada}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-purple-900 font-bold">
                          {row.privada}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-black text-slate-900 bg-slate-50">
                          {row.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-800 text-white font-black text-xs">
                      <td className="py-3 px-4">TOTAIS CONSOLIDADOS</td>
                      <td className="py-3 px-3 text-center">-</td>
                      <td className="py-3 px-4 text-center font-mono font-black">
                        {matrix.byNaturezaAndModalidade.reduce((acc, r) => acc + r.publica, 0)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black">
                        {matrix.byNaturezaAndModalidade.reduce((acc, r) => acc + r.publicoPrivada, 0)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black">
                        {matrix.byNaturezaAndModalidade.reduce((acc, r) => acc + r.privada, 0)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black bg-[#f75142]">
                        {matrix.totalStudents}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ENSINO ESPECIAL & DEFICIÊNCIAS */}
          {activeTab === 'disabilities' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">
                  Distribuição de Ensino Especial e Tipos de Deficiência
                </h3>
                <p className="text-xs text-slate-500">
                  Total de alunos com necessidades educativas especiais: {matrix.totalSpecialNeedsStudents}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(matrix.specialNeedsCounts).map(([disability, count]) => (
                  <div
                    key={disability}
                    className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-black text-purple-950 block">{disability}</span>
                      <span className="text-[11px] text-purple-700">
                        {count === 1 ? '1 aluno matriculado' : `${count} alunos matriculados`}
                      </span>
                    </div>
                    <span className="text-lg font-black font-mono text-purple-900 bg-white px-3 py-1 rounded-xl shadow-2xs border border-purple-200">
                      {count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-800 mb-2">
                  Regra Ministerial de Ensino Especial:
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conforme o regulamento municipal de Quêssua, as escolas de Ensino Especial têm natureza
                  estritamente Pública e prestam atendimento pedagógico especializado nas categorias de
                  deficiência auditiva, intelectual, visual, surdo-cegueira, múltiplas, físico-autista e
                  altas habilidades.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTAÇÃO & GÉNERO */}
          {activeTab === 'documents' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">
                  Diagnóstico de Documentação de Identificação & Paridade de Género
                </h3>
                <p className="text-xs text-slate-500">
                  Monitore a proporção de alunos com BI, Cédula ou pendentes de registo de nascimento.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Por Documento */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#f75142]" />
                    Tipos de Documento Apresentados
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800">Bilhete de Identidade (BI)</span>
                      <span className="font-mono font-black text-emerald-700">{matrix.byDocumentType.bi}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800">Cédula Pessoal</span>
                      <span className="font-mono font-black text-blue-700">{matrix.byDocumentType.cedula}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800">Passaporte</span>
                      <span className="font-mono font-black text-purple-700">{matrix.byDocumentType.passaporte}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="font-bold text-amber-900">Sem Documento (Em Processo)</span>
                      <span className="font-mono font-black text-amber-900">{matrix.byDocumentType.semDocumento}</span>
                    </div>
                  </div>
                </div>

                {/* Por Género */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#f75142]" />
                    Distribuição por Sexo
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800">Feminino (F)</span>
                      <span className="font-mono font-black text-pink-700">{matrix.byGender.feminino}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800">Masculino (M)</span>
                      <span className="font-mono font-black text-blue-700">{matrix.byGender.masculino}</span>
                    </div>
                    {matrix.byGender.outro > 0 && (
                      <div className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-800">Outro</span>
                        <span className="font-mono font-black text-slate-700">{matrix.byGender.outro}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Exportação compatível com Microsoft Excel, Google Sheets e LibreOffice Calc.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
