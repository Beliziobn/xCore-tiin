import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  ArrowDownToLine,
  CheckCircle2,
  Filter,
  RotateCcw,
  Sparkles,
  School,
  Users,
  GraduationCap,
  Building2,
  ShieldCheck,
  Search,
  ExternalLink,
  Globe,
  Printer
} from 'lucide-react';
import type { AdminSchool, AdminTeacher, AdminDirector, AdminStudent } from '../../types';
import { getUnifiedSystemDataset } from '../../utils/excelExport';
import {
  aggregateSigeDataset,
  exportOfficialSigeExcel,
  exportStandaloneSigeHtml,
  buildSigeConsolidadoRows
} from '../../utils/sigeAggregation';
import type { SigeAggregatedReport } from '../../utils/sigeAggregation';

interface SigeOfficialViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  schools?: AdminSchool[];
  teachers?: AdminTeacher[];
  directors?: AdminDirector[];
  students?: AdminStudent[];
  onOpenGoogleSheets?: () => void;
}

type TabType =
  | 'capa'
  | 'alunos'
  | 'docentes'
  | 'infra'
  | 'aprov'
  | 'rep'
  | 'nee'
  | 'naodoc'
  | 'consol';

export const SigeOfficialViewerModal: React.FC<SigeOfficialViewerModalProps> = ({
  isOpen,
  onClose,
  schools,
  teachers,
  directors,
  students,
  onOpenGoogleSheets,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('capa');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNatureza, setSelectedNatureza] = useState('');
  const [selectedNivel, setSelectedNsetSelectedNivel] = useState('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingHtml, setIsExportingHtml] = useState(false);

  // Compute dataset and official report
  const dataset = useMemo(() => {
    return getUnifiedSystemDataset({ schools, teachers, directors, students });
  }, [schools, teachers, directors, students]);

  const report: SigeAggregatedReport = useMemo(() => {
    return aggregateSigeDataset(dataset);
  }, [dataset]);

  const consolidadoRows = useMemo(() => {
    return buildSigeConsolidadoRows(report);
  }, [report]);

  if (!isOpen) return null;

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await exportOfficialSigeExcel(dataset);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportHtml = () => {
    setIsExportingHtml(true);
    setTimeout(() => {
      exportStandaloneSigeHtml(dataset);
      setIsExportingHtml(false);
    }, 250);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedNatureza('');
    setSelectedNsetSelectedNivel('');
  };

  // Helper filter
  const filterRecord = (text: string, naturezaVal?: string, nivelVal?: string) => {
    const q = searchQuery.toLowerCase().trim();
    if (q && !text.toLowerCase().includes(q)) return false;
    if (selectedNatureza && naturezaVal && !naturezaVal.toLowerCase().includes(selectedNatureza.toLowerCase())) {
      return false;
    }
    if (selectedNivel && nivelVal && !nivelVal.toLowerCase().includes(selectedNivel.toLowerCase())) {
      return false;
    }
    return true;
  };

  // Filtered data lists
  const filteredAlunos = report.alunosMatriculados.filter(item => {
    const fullText = `${item.nivel} ${item.classe} ${item.natureza} ${item.total.mf} ${item.total.f}`;
    return filterRecord(fullText, item.natureza, item.nivel);
  });

  const filteredDocentes = report.pessoalDocente.filter(item => {
    const fullText = `${item.nivelEnsino} ${item.natureza} ${item.grauAcademico} ${item.formacaoPedagogica} ${item.total.mf} ${item.total.f}`;
    return filterRecord(fullText, item.natureza, item.nivelEnsino);
  });

  const filteredInfra = report.infraestruturas.filter(item => {
    const fullText = `${item.natureza} ${item.escolasCount} ${item.salasDefinitivas} ${item.salasProvisorias} ${item.totalTurmas}`;
    return filterRecord(fullText, item.natureza);
  });

  const filteredAproveitamento = report.aproveitamento.filter(item => {
    const fullText = `${item.ciclo} ${item.classe} ${item.natureza} ${item.matriculados.mf} ${item.aprovados.mf} ${item.reprovados.mf} ${item.desistidos.mf}`;
    return filterRecord(fullText, item.natureza, item.ciclo);
  });

  const filteredRepetentes = report.alunosRepetentes.filter(item => {
    const fullText = `${item.nivel} ${item.classe} ${item.natureza} ${item.total.mf} ${item.total.f}`;
    return filterRecord(fullText, item.natureza, item.nivel);
  });

  const filteredNee = report.necessidadesEspeciais.filter(item => {
    const fullText = `${item.tipoDeficiencia} ${item.nivel} ${item.natureza} ${item.total.mf} ${item.total.f}`;
    return filterRecord(fullText, item.natureza, item.nivel);
  });

  const filteredNaoDocentes = report.pessoalNaoDocente.filter(item => {
    const fullText = `${item.categoria} ${item.natureza} ${item.total.mf} ${item.total.f}`;
    return filterRecord(fullText, item.natureza);
  });

  const filteredConsolidado = consolidadoRows.filter(row => {
    const fullText = Object.values(row).join(' ');
    return filterRecord(fullText, row['NATUREZA'], row['SUBSISTEMA / NÍVEL DE ENSINO']);
  });

  // Nature badge component
  const NatureBadge: React.FC<{ natureza: string }> = ({ natureza }) => {
    const n = natureza.toLowerCase();
    if (n.includes('pública') || n.includes('publica')) {
      return (
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
          Pública
        </span>
      );
    }
    if (n.includes('privada')) {
      return (
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-pink-100 text-pink-800">
          Privada
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
        {natureza}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-[#f4f6f9] w-full max-w-[1400px] h-[94vh] rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* ── TOP BAR INSTITUCIONAL SIGE ── */}
        <header className="bg-gradient-to-r from-[#0b3d5c] via-[#0b3d5c] to-[#0e7490] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center font-bold text-sm text-white tracking-wider">
              SIGE
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold tracking-tight leading-tight flex items-center gap-2">
                Instrumento Complementar 2024/2025
              </h1>
              <p className="text-xs text-cyan-100 font-normal opacity-90">
                Estatística Oficial · Município de {report.meta.municipio} · {report.meta.provincia}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/15 border border-white/25 text-white">
              Ano lectivo {report.meta.anoLectivo}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/15 border border-white/25 text-white">
              Emissão {report.meta.dataEmissao}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/25 border border-emerald-400/40 text-emerald-200">
              ✓ Apenas dados agregados
            </span>

            {/* Action buttons */}
            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="px-3 py-1.5 bg-white text-[#0b3d5c] hover:bg-slate-100 font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Baixar planilha Excel oficial com cabeçalhos azul-petróleo, zebrado, abas oficiais e design idêntico ao painel"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-[#0b3d5c]" />
              <span>{isExportingExcel ? 'A gerar Excel...' : 'Baixar Excel (.xlsx)'}</span>
            </button>

            <button
              onClick={handleExportHtml}
              disabled={isExportingHtml}
              className="px-3 py-1.5 bg-cyan-700/80 hover:bg-cyan-700 text-white font-bold text-xs rounded-lg border border-cyan-400/40 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Baixar relatório web (.html) com o mesmo visual, abas e filtros interactivos offline"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-200" />
              <span>{isExportingHtml ? 'A exportar...' : 'Relatório Web (.html)'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-lg border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Imprimir ou guardar como PDF oficial"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            {onOpenGoogleSheets && (
              <button
                onClick={() => {
                  onClose();
                  onOpenGoogleSheets();
                }}
                className="px-3 py-1.5 bg-[#0891b2] hover:bg-[#0e7490] text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Abrir no Google Planilhas"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Google Sheets</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
              title="Fechar painel"
            >
              <X className="w-5 h-5" />
            </button>

          </div>
        </header>

        {/* ── TABS NAVEGAÇÃO ── */}
        <nav className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-20 px-3 overflow-x-auto scrollbar-thin shadow-2xs">
          <div className="flex gap-1 min-w-max">
            {[
              { id: 'capa', label: 'CAPA' },
              { id: 'alunos', label: '1 · Alunos Matriculados' },
              { id: 'docentes', label: '2 · Pessoal Docente' },
              { id: 'infra', label: '3 · Infraestruturas' },
              { id: 'aprov', label: '4 · Aproveitamento' },
              { id: 'rep', label: '5 · Repetentes' },
              { id: 'nee', label: '6 · NEE' },
              { id: 'naodoc', label: '7 · Pessoal Não Docente' },
              { id: 'consol', label: '9 · Consolidado' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-3 px-4 text-xs font-semibold border-b-[3px] transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#0891b2] text-[#0b3d5c] bg-[#f0f9ff]'
                    : 'border-transparent text-slate-500 hover:text-[#0b3d5c] hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* ── CONTEÚDO PRINCIPAL (SCROLLÁVEL) ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* ════ ABA 1: CAPA ════ */}
          {activeTab === 'capa' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Informações Institucionais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">País</span>
                  <p className="text-sm font-semibold text-slate-800">{report.meta.pais}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ministério</span>
                  <p className="text-sm font-semibold text-slate-800">{report.meta.ministerio}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Direcção</span>
                  <p className="text-sm font-semibold text-slate-800">{report.meta.direccao}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Província</span>
                  <p className="text-sm font-semibold text-slate-800">{report.meta.provincia}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Município</span>
                  <p className="text-sm font-semibold text-slate-800">{report.meta.municipio}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contacto</span>
                  <p className="text-sm font-semibold text-slate-800">{report.meta.contactoInstitucional}</p>
                </div>
              </div>

              {/* Cards de Resumo Estatístico */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                <div className="bg-gradient-to-br from-[#f0fdfa] to-[#ecfeff] border border-cyan-200 rounded-xl p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-800">Unidades escolares</span>
                  <div className="text-2xl font-bold text-[#0b3d5c] mt-1">{report.totaisGerais.totalEscolas}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Escolas activas na rede</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Salas de aula</span>
                  <div className="text-2xl font-bold text-[#0b3d5c] mt-1">{report.totaisGerais.totalSalas}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {report.infraestruturas.reduce((acc, i) => acc + i.salasDefinitivas, 0)} definitivas ·{' '}
                    {report.infraestruturas.reduce((acc, i) => acc + i.salasProvisorias, 0)} provisórias
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Turmas activas</span>
                  <div className="text-2xl font-bold text-[#0b3d5c] mt-1">{report.totaisGerais.totalTurmas}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Manhã {report.infraestruturas.reduce((acc, i) => acc + i.turmasManha, 0)} · Tarde{' '}
                    {report.infraestruturas.reduce((acc, i) => acc + i.turmasTarde, 0)} · Noite{' '}
                    {report.infraestruturas.reduce((acc, i) => acc + i.turmasNoite, 0)}
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Alunos matriculados (MF)</span>
                  <div className="text-2xl font-bold text-[#0b3d5c] mt-1">{report.totaisGerais.totalAlunosMatriculados.mf}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Feminino: {report.totaisGerais.totalAlunosMatriculados.f} (
                    {report.totaisGerais.totalAlunosMatriculados.mf > 0
                      ? ((report.totaisGerais.totalAlunosMatriculados.f / report.totaisGerais.totalAlunosMatriculados.mf) * 100).toFixed(1)
                      : '0.0'}
                    %)
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Repetentes (MF)</span>
                  <div className="text-2xl font-bold text-[#0b3d5c] mt-1">{report.totaisGerais.totalAlunosRepetentes.mf}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Feminino: {report.totaisGerais.totalAlunosRepetentes.f}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Alunos com NEE (MF)</span>
                  <div className="text-2xl font-bold text-[#0b3d5c] mt-1">{report.totaisGerais.totalAlunosNEE.mf}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Feminino: {report.totaisGerais.totalAlunosNEE.f}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Docentes em exercício (MF)</span>
                  <div className="text-2xl font-bold text-[#0b3d5c] mt-1">{report.totaisGerais.totalDocentes.mf}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Feminino: {report.totaisGerais.totalDocentes.f}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pessoal Não Docente (MF)</span>
                  <div className="text-2xl font-bold text-[#0b3d5c] mt-1">{report.totaisGerais.totalNaoDocentes.mf}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Feminino: {report.totaisGerais.totalNaoDocentes.f}</p>
                </div>
              </div>

              {/* Nota de Privacidade Homologada */}
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-sky-950">Conformidade de privacidade SIGE:</div>
                  <p className="text-[11px] text-sky-900 leading-relaxed">
                    <strong>ESTRITAMENTE AGREGADO — zero nomes, zero BI, zero e-mails pessoais.</strong> Este painel é
                    para consulta interna municipal. O envio oficial usa o Instrumento Complementar oficial preenchido
                    pelo motor estatístico para submissão ao GEPE / DME.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ════ TOOLBAR DE FILTROS (EXIBIDA NAS ABAS DE TABELA) ════ */}
          {activeTab !== 'capa' && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    placeholder="Pesquisar tabela..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg w-52 sm:w-64 focus:outline-hidden focus:border-[#0891b2] focus:bg-white transition-all text-slate-800"
                  />
                </div>

                <select
                  value={selectedNatureza}
                  onChange={e => setSelectedNatureza(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 cursor-pointer focus:outline-hidden focus:border-[#0891b2]"
                >
                  <option value="">Todas as naturezas</option>
                  <option value="Pública">Pública</option>
                  <option value="Privada">Privada</option>
                </select>

                {(activeTab === 'alunos' || activeTab === 'rep' || activeTab === 'aprov' || activeTab === 'consol') && (
                  <select
                    value={selectedNivel}
                    onChange={e => setSelectedNsetSelectedNivel(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 cursor-pointer focus:outline-hidden focus:border-[#0891b2]"
                  >
                    <option value="">Todos os subsistemas / níveis</option>
                    <option value="Pré-Escolar">Educação Pré-Escolar</option>
                    <option value="Primário Regular">Ensino Primário Regular</option>
                    <option value="PRAEER">Ensino Primário - PRAEER</option>
                    <option value="EJA">Ensino Primário - EJA</option>
                    <option value="Secundário I">Ensino Secundário I Ciclo</option>
                    <option value="Secundário II">Ensino Secundário II Ciclo</option>
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2">
                {(searchQuery || selectedNatureza || selectedNivel) && (
                  <button
                    onClick={handleClearFilters}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpar filtros</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ════ ABA 2: 1 - ALUNOS MATRICULADOS ════ */}
          {activeTab === 'alunos' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-xs font-bold text-[#0b3d5c] uppercase tracking-wider">
                  1 — Alunos Matriculados
                </h2>
                <span className="text-[11px] text-slate-500 font-medium">
                  {filteredAlunos.length} linhas agregadas por idade e classe
                </span>
              </div>
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-[#0b3d5c] text-white uppercase text-[11px] font-semibold tracking-wider z-10">
                    <tr>
                      <th className="p-2.5">Subsistema / Nível</th>
                      <th className="p-2.5">Natureza</th>
                      <th className="p-2.5">Classe</th>
                      <th className="p-2.5 text-right">Total MF</th>
                      <th className="p-2.5 text-right">Total F</th>
                      <th className="p-2.5 text-right">5a MF</th>
                      <th className="p-2.5 text-right">5a F</th>
                      <th className="p-2.5 text-right">6a MF</th>
                      <th className="p-2.5 text-right">6a F</th>
                      <th className="p-2.5 text-right">7a MF</th>
                      <th className="p-2.5 text-right">7a F</th>
                      <th className="p-2.5 text-right">&gt;13a MF</th>
                      <th className="p-2.5 text-right">&gt;13a F</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAlunos.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-[#e0f2fe]' : 'bg-slate-50/70 hover:bg-[#e0f2fe]'}>
                        <td className="p-2.5 font-medium text-slate-800">{row.nivel}</td>
                        <td className="p-2.5"><NatureBadge natureza={row.natureza} /></td>
                        <td className="p-2.5 font-semibold text-slate-700">{row.classe}</td>
                        <td className="p-2.5 text-right tabular-nums font-bold text-[#0b3d5c]">{row.total.mf}</td>
                        <td className="p-2.5 text-right tabular-nums font-semibold text-slate-700">{row.total.f}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">{row.idades['5 anos']?.mf || 0}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">{row.idades['5 anos']?.f || 0}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">{row.idades['6 anos']?.mf || 0}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">{row.idades['6 anos']?.f || 0}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">{row.idades['7 anos']?.mf || 0}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">{row.idades['7 anos']?.f || 0}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">{row.idades['> 13 anos']?.mf || 0}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">{row.idades['> 13 anos']?.f || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ ABA 3: 2 - PESSOAL DOCENTE ════ */}
          {activeTab === 'docentes' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-xs font-bold text-[#0b3d5c] uppercase tracking-wider">
                  2 — Pessoal Docente
                </h2>
                <span className="text-[11px] text-slate-500 font-medium">
                  Apenas contagens estatísticas · Sem dados nominais
                </span>
              </div>
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-[#0b3d5c] text-white uppercase text-[11px] font-semibold tracking-wider z-10">
                    <tr>
                      <th className="p-2.5">Nível Leccionado</th>
                      <th className="p-2.5">Natureza</th>
                      <th className="p-2.5">Qualificação Académica</th>
                      <th className="p-2.5">Formação Pedagógica</th>
                      <th className="p-2.5 text-right">Total MF</th>
                      <th className="p-2.5 text-right">Total F</th>
                      <th className="p-2.5 text-right">% Feminina</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocentes.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-[#e0f2fe]' : 'bg-slate-50/70 hover:bg-[#e0f2fe]'}>
                        <td className="p-2.5 font-medium text-slate-800">{row.nivelEnsino}</td>
                        <td className="p-2.5"><NatureBadge natureza={row.natureza} /></td>
                        <td className="p-2.5 text-slate-700">{row.grauAcademico}</td>
                        <td className="p-2.5 text-slate-600">{row.formacaoPedagogica}</td>
                        <td className="p-2.5 text-right tabular-nums font-bold text-[#0b3d5c]">{row.total.mf}</td>
                        <td className="p-2.5 text-right tabular-nums font-semibold text-slate-700">{row.total.f}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-600">
                          {row.total.mf > 0 ? ((row.total.f / row.total.mf) * 100).toFixed(1) + '%' : '0.0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ ABA 4: 3 - INFRAESTRUTURAS ════ */}
          {activeTab === 'infra' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-xs font-bold text-[#0b3d5c] uppercase tracking-wider">
                  3 — Infraestruturas
                </h2>
                <span className="text-[11px] text-slate-500 font-medium">
                  Escolas · Salas de Aula · Turmas por Turno
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#0b3d5c] text-white uppercase text-[11px] font-semibold tracking-wider">
                    <tr>
                      <th className="p-2.5">Natureza</th>
                      <th className="p-2.5 text-right">Nº Unidades</th>
                      <th className="p-2.5 text-right">Salas Definitivas</th>
                      <th className="p-2.5 text-right">Salas Provisórias</th>
                      <th className="p-2.5 text-right">Total Salas</th>
                      <th className="p-2.5 text-right">Turmas Manhã</th>
                      <th className="p-2.5 text-right">Turmas Tarde</th>
                      <th className="p-2.5 text-right">Turmas Noite</th>
                      <th className="p-2.5 text-right">Total Turmas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInfra.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-[#e0f2fe]' : 'bg-slate-50/70 hover:bg-[#e0f2fe]'}>
                        <td className="p-2.5"><NatureBadge natureza={row.natureza} /></td>
                        <td className="p-2.5 text-right tabular-nums font-bold text-[#0b3d5c]">{row.escolasCount}</td>
                        <td className="p-2.5 text-right tabular-nums font-semibold text-slate-700">{row.salasDefinitivas}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-600">{row.salasProvisorias}</td>
                        <td className="p-2.5 text-right tabular-nums font-bold text-[#0b3d5c]">{row.salasDefinitivas + row.salasProvisorias}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-600">{row.turmasManha}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-600">{row.turmasTarde}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-600">{row.turmasNoite}</td>
                        <td className="p-2.5 text-right tabular-nums font-bold text-[#0b3d5c]">{row.totalTurmas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ ABA 5: 4 - APROVEITAMENTO (COM VALIDAÇÃO) ════ */}
          {activeTab === 'aprov' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xs font-bold text-[#0b3d5c] uppercase tracking-wider">
                    4 — Aproveitamento Escolar
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Regra Ministerial: Matriculados = Aprovados + Reprovados + Desistidos (Resíduo Zero)
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  Validação Ativa
                </span>
              </div>
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-[#0b3d5c] text-white uppercase text-[11px] font-semibold tracking-wider z-10">
                    <tr>
                      <th className="p-2.5">Ciclo / Subsistema</th>
                      <th className="p-2.5">Classe</th>
                      <th className="p-2.5">Natureza</th>
                      <th className="p-2.5 text-right">Mat. MF</th>
                      <th className="p-2.5 text-right">Mat. F</th>
                      <th className="p-2.5 text-right">Aprov. MF</th>
                      <th className="p-2.5 text-right">Aprov. F</th>
                      <th className="p-2.5 text-right">Reprov. MF</th>
                      <th className="p-2.5 text-right">Reprov. F</th>
                      <th className="p-2.5 text-right">Desist. MF</th>
                      <th className="p-2.5 text-right">Desist. F</th>
                      <th className="p-2.5 text-center">Validação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAproveitamento.map((row, idx) => {
                      const isOk = row.validacao === 'Correcto';
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-[#e0f2fe]' : 'bg-slate-50/70 hover:bg-[#e0f2fe]'}>
                          <td className="p-2.5 font-medium text-slate-800">{row.ciclo}</td>
                          <td className="p-2.5 font-semibold text-slate-700">{row.classe}</td>
                          <td className="p-2.5"><NatureBadge natureza={row.natureza} /></td>
                          <td className="p-2.5 text-right tabular-nums font-bold text-[#0b3d5c]">{row.matriculados.mf}</td>
                          <td className="p-2.5 text-right tabular-nums font-semibold text-slate-700">{row.matriculados.f}</td>
                          <td className="p-2.5 text-right tabular-nums text-emerald-700 font-semibold">{row.aprovados.mf}</td>
                          <td className="p-2.5 text-right tabular-nums text-emerald-700">{row.aprovados.f}</td>
                          <td className="p-2.5 text-right tabular-nums text-amber-700 font-semibold">{row.reprovados.mf}</td>
                          <td className="p-2.5 text-right tabular-nums text-amber-700">{row.reprovados.f}</td>
                          <td className="p-2.5 text-right tabular-nums text-red-600 font-semibold">{row.desistidos.mf}</td>
                          <td className="p-2.5 text-right tabular-nums text-red-600">{row.desistidos.f}</td>
                          <td className="p-2.5 text-center">
                            {isOk ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                ● Correcto
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                                ● Inconsistente
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ ABA 6: 5 - REPETENTES ════ */}
          {activeTab === 'rep' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-xs font-bold text-[#0b3d5c] uppercase tracking-wider">
                  5 — Alunos Repetentes
                </h2>
                <span className="text-[11px] text-slate-500 font-medium">
                  Sem misturar PRAEER / EJA nas tabelas regulares
                </span>
              </div>
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-[#0b3d5c] text-white uppercase text-[11px] font-semibold tracking-wider z-10">
                    <tr>
                      <th className="p-2.5">Subsistema / Nível</th>
                      <th className="p-2.5">Natureza</th>
                      <th className="p-2.5">Classe</th>
                      <th className="p-2.5 text-right">Total Rep. MF</th>
                      <th className="p-2.5 text-right">Total Rep. F</th>
                      <th className="p-2.5 text-right">6a MF</th>
                      <th className="p-2.5 text-right">6a F</th>
                      <th className="p-2.5 text-right">7a MF</th>
                      <th className="p-2.5 text-right">7a F</th>
                      <th className="p-2.5 text-right">&gt;12a MF</th>
                      <th className="p-2.5 text-right">&gt;12a F</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRepetentes.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-[#e0f2fe]' : 'bg-slate-50/70 hover:bg-[#e0f2fe]'}>
                        <td className="p-2.5 font-medium text-slate-800">{row.nivel}</td>
                        <td className="p-2.5"><NatureBadge natureza={row.natureza} /></td>
                        <td className="p-2.5 font-semibold text-slate-700">{row.classe}</td>
                        <td className="p-2.5 text-right tabular-nums font-bold text-[#0b3d5c]">{row.total.mf}</td>
                        <td className="p-2.5 text-right tabular-nums font-semibold text-slate-700">{row.total.f}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">{row.idades['6 anos']?.mf || 0}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">{row.idades['6 anos']?.f || 0}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">{row.idades['7 anos']?.mf || 0}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">{row.idades['7 anos']?.f || 0}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">
                          {(row.idades['13 anos']?.mf || 0) + (row.idades['> 13 anos']?.mf || 0)}
                        </td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">
                          {(row.idades['13 anos']?.f || 0) + (row.idades['> 13 anos']?.f || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ ABA 7: 6 - NEE ════ */}
          {activeTab === 'nee' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-xs font-bold text-[#0b3d5c] uppercase tracking-wider">
                  6 — Necessidades Educativas Especiais (NEE)
                </h2>
                <span className="text-[11px] text-slate-500 font-medium">
                  Visual · Auditiva · Motora · Outras (Agregado)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#0b3d5c] text-white uppercase text-[11px] font-semibold tracking-wider">
                    <tr>
                      <th className="p-2.5">Categoria Oficial da Tutela</th>
                      <th className="p-2.5">Tipo / Subtipo de Deficiência</th>
                      <th className="p-2.5">Nível de Ensino</th>
                      <th className="p-2.5">Natureza</th>
                      <th className="p-2.5 text-right">Total MF</th>
                      <th className="p-2.5 text-right">Total F</th>
                      <th className="p-2.5 text-right">% Feminina</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredNee.map((row, idx) => {
                      const catTutela = row.tipoDeficiencia.includes('Visual')
                        ? '1. Deficiência Visual'
                        : row.tipoDeficiencia.includes('Audit')
                        ? '2. Deficiência Auditiva'
                        : row.tipoDeficiencia.includes('Físic') || row.tipoDeficiencia.includes('Motor')
                        ? '3. Deficiência Motora'
                        : '4. Outras Deficiências';
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-[#e0f2fe]' : 'bg-slate-50/70 hover:bg-[#e0f2fe]'}>
                          <td className="p-2.5 font-bold text-[#0b3d5c]">{catTutela}</td>
                          <td className="p-2.5 font-medium text-slate-800">{row.tipoDeficiencia}</td>
                          <td className="p-2.5 text-slate-600">{row.nivel}</td>
                          <td className="p-2.5"><NatureBadge natureza={row.natureza} /></td>
                          <td className="p-2.5 text-right tabular-nums font-bold text-[#0b3d5c]">{row.total.mf}</td>
                          <td className="p-2.5 text-right tabular-nums font-semibold text-slate-700">{row.total.f}</td>
                          <td className="p-2.5 text-right tabular-nums text-slate-600">
                            {row.total.mf > 0 ? ((row.total.f / row.total.mf) * 100).toFixed(1) + '%' : '0.0%'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ ABA 8: 7 - PESSOAL NÃO DOCENTE ════ */}
          {activeTab === 'naodoc' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-xs font-bold text-[#0b3d5c] uppercase tracking-wider">
                  7 — Pessoal Não Docente
                </h2>
                <span className="text-[11px] text-slate-500 font-medium">
                  Apenas contagem funcional · Sem dados nominais
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#0b3d5c] text-white uppercase text-[11px] font-semibold tracking-wider">
                    <tr>
                      <th className="p-2.5">Categoria Funcional</th>
                      <th className="p-2.5">Natureza da Rede</th>
                      <th className="p-2.5 text-right">Total MF</th>
                      <th className="p-2.5 text-right">Total F</th>
                      <th className="p-2.5 text-center">Dados Nominais</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredNaoDocentes.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-[#e0f2fe]' : 'bg-slate-50/70 hover:bg-[#e0f2fe]'}>
                        <td className="p-2.5 font-medium text-slate-800">{row.categoria}</td>
                        <td className="p-2.5"><NatureBadge natureza={row.natureza} /></td>
                        <td className="p-2.5 text-right tabular-nums font-bold text-[#0b3d5c]">{row.total.mf}</td>
                        <td className="p-2.5 text-right tabular-nums font-semibold text-slate-700">{row.total.f}</td>
                        <td className="p-2.5 text-center text-[11px] text-slate-400 font-semibold">NENHUM</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ ABA 9: 9 - CONSOLIDADO (A QUE FALTAVA) ════ */}
          {activeTab === 'consol' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Cards do Consolidado */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-gradient-to-br from-[#f0fdfa] to-[#ecfeff] border border-cyan-200 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800">Total Matriculados</span>
                  <div className="text-xl font-bold text-[#0b3d5c] mt-1">{report.totaisGerais.totalAlunosMatriculados.mf}</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">MF · F: {report.totaisGerais.totalAlunosMatriculados.f}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Repetentes</span>
                  <div className="text-xl font-bold text-[#0b3d5c] mt-1">{report.totaisGerais.totalAlunosRepetentes.mf}</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">MF · F: {report.totaisGerais.totalAlunosRepetentes.f}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total NEE</span>
                  <div className="text-xl font-bold text-[#0b3d5c] mt-1">{report.totaisGerais.totalAlunosNEE.mf}</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">MF · F: {report.totaisGerais.totalAlunosNEE.f}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Docentes</span>
                  <div className="text-xl font-bold text-[#0b3d5c] mt-1">{report.totaisGerais.totalDocentes.mf}</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">MF · F: {report.totaisGerais.totalDocentes.f}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Não Docentes</span>
                  <div className="text-xl font-bold text-[#0b3d5c] mt-1">{report.totaisGerais.totalNaoDocentes.mf}</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">MF · F: {report.totaisGerais.totalNaoDocentes.f}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Escolas / Salas</span>
                  <div className="text-xl font-bold text-[#0b3d5c] mt-1">
                    {report.totaisGerais.totalEscolas} / {report.totaisGerais.totalSalas}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Unidades · Salas</p>
                </div>
              </div>

              {/* Tabela de Consolidação por Nível */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <h2 className="text-xs font-bold text-[#0b3d5c] uppercase tracking-wider">
                    Folha 9 — Quadro Resumo Consolidado Municipal
                  </h2>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Totais consolidados por subsistema de ensino
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0b3d5c] text-white uppercase text-[11px] font-semibold tracking-wider z-10">
                      <tr>
                        <th className="p-2.5">Subsistema / Nível de Ensino</th>
                        <th className="p-2.5">Detalhe / Abrangência</th>
                        <th className="p-2.5">Natureza</th>
                        <th className="p-2.5 text-right">Alunos MF</th>
                        <th className="p-2.5 text-right">Alunos F</th>
                        <th className="p-2.5 text-right">% Fem.</th>
                        <th className="p-2.5 text-right">Aprov. MF</th>
                        <th className="p-2.5 text-right">Reprov. MF</th>
                        <th className="p-2.5 text-right">Desist. MF</th>
                        <th className="p-2.5">Status / Observação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredConsolidado.map((row, idx) => {
                        const isTotalGeral = row['SUBSISTEMA / NÍVEL DE ENSINO']?.includes('TOTAL GERAL');
                        return (
                          <tr
                            key={idx}
                            className={`${
                              isTotalGeral
                                ? 'bg-cyan-50 font-bold border-t-2 border-[#0b3d5c]'
                                : idx % 2 === 0
                                ? 'bg-white hover:bg-[#e0f2fe]'
                                : 'bg-slate-50/70 hover:bg-[#e0f2fe]'
                            }`}
                          >
                            <td className="p-2.5 font-bold text-slate-900">{row['SUBSISTEMA / NÍVEL DE ENSINO']}</td>
                            <td className="p-2.5 text-slate-700">{row['DETALHE / ABRANGÊNCIA']}</td>
                            <td className="p-2.5"><NatureBadge natureza={row['NATUREZA']} /></td>
                            <td className="p-2.5 text-right tabular-nums font-bold text-[#0b3d5c]">
                              {row['ALUNOS MATRICULADOS (MF)']}
                            </td>
                            <td className="p-2.5 text-right tabular-nums font-semibold text-slate-700">
                              {row['ALUNOS MATRICULADOS (F)']}
                            </td>
                            <td className="p-2.5 text-right tabular-nums text-slate-600">{row['% FEMININA']}</td>
                            <td className="p-2.5 text-right tabular-nums text-emerald-700 font-semibold">{row['APROVADOS (MF)']}</td>
                            <td className="p-2.5 text-right tabular-nums text-amber-700 font-semibold">{row['REPROVADOS (MF)']}</td>
                            <td className="p-2.5 text-right tabular-nums text-red-600 font-semibold">{row['DESISTIDOS (MF)']}</td>
                            <td className="p-2.5 text-slate-600 text-[11px]">{row['STATUS / OBSERVAÇÃO']}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700">
                <strong>Consolidado municipal:</strong> Os totais reflectem a soma das folhas 1–7. No template oficial
                Excel estas somas são fórmulas que apontam para as células de cada secção.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
