import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  Printer,
  Table,
  BarChart3,
  CheckCircle,
  Building,
  GraduationCap,
  Layers,
  Award,
  Calendar,
  Share2
} from 'lucide-react';
import type { TeacherRegistrationData } from '../../types';
import { generateAnalyticalMatrix, generateTeachersCSV } from '../../utils/teacherStorage';

interface TeacherAnalyticalMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherRegistrationData[];
}

export const TeacherAnalyticalMatrixModal: React.FC<TeacherAnalyticalMatrixModalProps> = ({
  isOpen,
  onClose,
  teachers,
}) => {
  const [activeTab, setActiveTab] = useState<'natureza_formacao' | 'idade_academico' | 'modalidades' | 'regime'>(
    'natureza_formacao'
  );

  if (!isOpen) return null;

  const matrix = generateAnalyticalMatrix(teachers);

  const handleDownloadCSV = () => {
    const csvContent = generateTeachersCSV(teachers);
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Censo_Docentes_Quessua_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
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
            <div className="w-10 h-10 rounded-xl bg-[#f75142] text-white flex items-center justify-center shadow-xs">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Matriz Analítica & Cruzamento Estatístico
                </h2>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {teachers.length} Professores
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Natureza × Formação Pedagógica × Nível Académico × Faixa Etária × Nível de Ensino
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-3.5 py-1.5 bg-[#f75142] hover:bg-[#e04436] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar CSV (Excel)</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
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

        {/* Matrix Switcher Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('natureza_formacao')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'natureza_formacao'
                ? 'bg-[#002133] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>1. Natureza × Formação Pedagógica</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('idade_academico')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'idade_academico'
                ? 'bg-[#002133] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>2. Faixa Etária × Nível Académico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('modalidades')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'modalidades'
                ? 'bg-[#002133] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. Níveis / Modalidades de Ensino</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('regime')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'regime'
                ? 'bg-[#002133] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>4. Regime de Trabalho & Validação</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Natureza x Formação */}
          {activeTab === 'natureza_formacao' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Tabela de Cruzamento: Natureza da Escola × Formação Pedagógica
                  </h3>
                  <p className="text-xs text-slate-500">
                    Distribuição da conformidade pedagógica segundo a gestão da instituição escolar.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3">Natureza da Escola</th>
                      <th className="p-3 text-center bg-emerald-50 text-emerald-900">
                        Com Magistério e IMNE Completo
                      </th>
                      <th className="p-3 text-center bg-blue-50 text-blue-900">
                        Sem Magistério e com Formação Pedagógica
                      </th>
                      <th className="p-3 text-center bg-amber-50 text-amber-900">
                        Sem Magistério e sem Formação Pedagógica
                      </th>
                      <th className="p-3 text-center font-black bg-slate-200">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {matrix.byNaturezaAndClassificacao.map((row) => (
                      <tr key={row.natureza} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{row.natureza}</span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-700">
                          {row.comMagisterioImne}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-blue-700">
                          {row.semMagisterioComFormacao}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-700">
                          {row.semMagisterioSemFormacao}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-slate-900 bg-slate-50">
                          {row.total}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100/80 font-black border-t-2 border-slate-300">
                      <td className="p-3 text-slate-900">Total do Município</td>
                      <td className="p-3 text-center font-mono text-emerald-900">
                        {matrix.byNaturezaAndClassificacao.reduce((acc, r) => acc + r.comMagisterioImne, 0)}
                      </td>
                      <td className="p-3 text-center font-mono text-blue-900">
                        {matrix.byNaturezaAndClassificacao.reduce((acc, r) => acc + r.semMagisterioComFormacao, 0)}
                      </td>
                      <td className="p-3 text-center font-mono text-amber-900">
                        {matrix.byNaturezaAndClassificacao.reduce((acc, r) => acc + r.semMagisterioSemFormacao, 0)}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-900 bg-slate-200">
                        {matrix.totalTeachers}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Faixa Etária x Nível Académico */}
          {activeTab === 'idade_academico' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Tabela de Cruzamento: Faixa Etária × Nível Académico
                  </h3>
                  <p className="text-xs text-slate-500">
                    Faixas oficiais: 18-19, 20-24, 25-29, 30-34, 35-39, mais de 39 anos.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5">Faixa Etária</th>
                      <th className="p-2.5 text-center">Até 6ª</th>
                      <th className="p-2.5 text-center">7ª-8ª</th>
                      <th className="p-2.5 text-center">9ª-10ª</th>
                      <th className="p-2.5 text-center">11ª-12ª</th>
                      <th className="p-2.5 text-center">Bacharelato</th>
                      <th className="p-2.5 text-center bg-blue-50 text-blue-900">Licenciado</th>
                      <th className="p-2.5 text-center bg-purple-50 text-purple-900">Pós-Licenciado</th>
                      <th className="p-2.5 text-center">Outro</th>
                      <th className="p-2.5 text-center font-black bg-slate-200">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {matrix.byFaixaEtariaAndNivelAcademico.map((row) => (
                      <tr key={row.faixa} className="hover:bg-slate-50/80">
                        <td className="p-2.5 font-bold text-slate-900 font-mono">
                          {row.faixa}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-600">{row.ate6}</td>
                        <td className="p-2.5 text-center font-mono text-slate-600">{row.setimaOitava}</td>
                        <td className="p-2.5 text-center font-mono text-slate-600">{row.nonaDecima}</td>
                        <td className="p-2.5 text-center font-mono text-slate-600">{row.decimaPrimeiraSegunda}</td>
                        <td className="p-2.5 text-center font-mono text-slate-600">{row.bacharelato}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-blue-700 bg-blue-50/40">
                          {row.licenciado}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-purple-700 bg-purple-50/40">
                          {row.posLicenciado}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-600">{row.outro}</td>
                        <td className="p-2.5 text-center font-mono font-black text-slate-900 bg-slate-50">
                          {row.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Modalidades de Ensino */}
          {activeTab === 'modalidades' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Distribuição por Nível e Modalidade de Ensino
                  </h3>
                  <p className="text-xs text-slate-500">
                    Considera docentes que leccionam em múltiplos níveis simultaneamente.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matrix.byNivelEnsino.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#002133] text-white flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{item.nivelNome}</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {item.percent}% do corpo docente municipal
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-black font-mono bg-white px-3 py-1 rounded-lg border border-slate-200 text-slate-900">
                      {item.count} doc.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Regime & Validação */}
          {activeTab === 'regime' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Regime de Trabalho & Status de Validação Documental
                  </h3>
                  <p className="text-xs text-slate-500">
                    Controle de servidores efectivos, contratados e processo de homologação.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {matrix.byRegimeTrabalho.map((reg) => (
                  <div key={reg.regime} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">{reg.regime}</span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {reg.count} total
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Habilitações Validadas:</span>
                        <span className="font-mono font-bold">{reg.validados}</span>
                      </div>
                      <div className="flex justify-between text-amber-700 font-semibold">
                        <span>Pendentes / Sem validação:</span>
                        <span className="font-mono font-bold">{reg.naoValidados}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Exportação padronizada compatível com Excel, Google Planilhas e SGE.
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
