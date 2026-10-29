import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Printer,
  FileDown,
  Check,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  AlertTriangle,
  Eye,
  CalendarRange,
  ShieldCheck,
  Database,
  RotateCcw,
} from 'lucide-react';
import emblemAngolaImg from '../../assets/images/Emblem_of_Angola.svg.webp';
import {
  GuiaFeriasRecord,
  getTodayIso,
  formatDateExtenso,
  calculateFimDate,
  getStoredGuiaFeriasRecords,
  saveGuiaFeriasRecord,
  deleteGuiaFeriasRecord,
  findDuplicateGuiaFerias,
} from '../../utils/guiaFeriasStorage';
import {
  downloadGuiaFeriasPdf,
  printSinglePageA4Clean,
} from '../../utils/declaracaoPdfGenerator';
import type { UserAccount } from '../../types';
import { submitQuickServiceRequest } from '../../utils/quickServicesStorage';

export interface GuiaFeriasSectionProps {
  isLoggedIn?: boolean;
  currentUser?: UserAccount | null;
}

interface GuiaFeriasFormState {
  id?: string;
  criadoEm?: string;

  // I. Dados do funcionário
  trat: 'o Senhor' | 'a Senhora';
  agente: string;
  nome: string;
  cat: string;
  grau: string;
  funcao: string;

  // II. Local de colocação
  tipoesc: string;
  nesc: string;
  local: string;

  // III. Licença
  tipolic: string;
  ano: string;
  dias: string;
  ini: string;
  fim: string;

  // IV. Emissão da guia
  ng: string;
  ang: string;
  lemi: string;
  demi: string;
  dir: string;
  prov: string;
  mun: string;
}

const VALIDATION_MESSAGES: Record<string, string> = {
  nome: 'Escreva o nome completo.',
  agente: 'Indique o nº de agente.',
  cat: 'Indique a categoria.',
  grau: 'Indique o grau.',
  funcao: 'Indique a função.',
  tipoesc: 'Indique o tipo de escola.',
  nesc: 'Indique o nº da escola.',
  local: 'Indique a localidade.',
  ano: 'Use 4 dígitos, como 2026.',
  dias: 'Indique um número de dias entre 1 e 90.',
  ini: 'Escolha a data de início.',
  fim: 'Escolha a data de término.',
  ng: 'Indique o nº da guia.',
  ang: 'Use 4 dígitos, como 2026.',
  demi: 'Escolha a data de emissão.',
  dir: 'Indique o nome do Director Municipal.',
};

const REQUIRED_FIELDS = [
  'nome',
  'agente',
  'cat',
  'grau',
  'funcao',
  'tipoesc',
  'nesc',
  'local',
  'ano',
  'dias',
  'ini',
  'fim',
  'ng',
  'ang',
  'demi',
  'dir',
] as const;

function getInitialGuiaFormState(): GuiaFeriasFormState {
  const today = getTodayIso();
  const currentYear = String(new Date().getFullYear());
  const defaultFim = calculateFimDate(today, 30);

  return {
    trat: 'o Senhor',
    agente: '',
    nome: '',
    cat: 'P.E.P.E.S.',
    grau: '10º Grau',
    funcao: '',
    tipoesc: 'Escola Primária',
    nesc: '',
    local: '',
    tipolic: 'Licença Disciplinar (férias)',
    ano: currentYear,
    dias: '30',
    ini: today,
    fim: defaultFim || today,
    ng: '',
    ang: currentYear,
    lemi: 'Quêssua',
    demi: today,
    dir: 'Belízio Miguel dos Santos António',
    prov: 'Malanje',
    mun: 'Quêssua',
  };
}

export const GuiaFeriasSection: React.FC<GuiaFeriasSectionProps> = ({
  isLoggedIn = false,
  currentUser,
}) => {
  const isAdminOrDirector = Boolean(
    isLoggedIn &&
      currentUser &&
      (currentUser.role === 'admin' || currentUser.role === 'diretor')
  );

  const [records, setRecords] = useState<GuiaFeriasRecord[]>(() =>
    getStoredGuiaFeriasRecords()
  );
  const [formData, setFormData] = useState<GuiaFeriasFormState>(() =>
    getInitialGuiaFormState()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formErrorBanner, setFormErrorBanner] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<GuiaFeriasRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recordToDelete, setRecordToDelete] = useState<GuiaFeriasRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [guiaSubView, setGuiaSubView] = useState<'database' | 'preview' | 'form'>('form');

  const todayISO = useMemo(() => getTodayIso(), []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const reloadRecords = () => {
    setRecords(getStoredGuiaFeriasRecords());
  };

  useEffect(() => {
    reloadRecords();
    const handleUpdated = () => reloadRecords();
    window.addEventListener('sigre-guia-ferias-updated', handleUpdated);
    return () => {
      window.removeEventListener('sigre-guia-ferias-updated', handleUpdated);
    };
  }, []);

  // Live preview record derived from current formData (or submittedRecord if explicitly viewing one)
  const livePreviewRecord: GuiaFeriasRecord = useMemo(() => {
    if (submittedRecord) return submittedRecord;
    const diasNum = parseInt(formData.dias, 10) || 30;

    return {
      id: formData.id || 'preview-live',
      criadoEm: formData.criadoEm || todayISO,
      trat: formData.trat || 'o Senhor',
      agente: formData.agente.trim() || '[Nº de Agente]',
      nome: formData.nome.trim() || '[Nome Completo do Funcionário]',
      cat: formData.cat.trim() || 'P.E.P.E.S.',
      grau: formData.grau.trim() || '10º Grau',
      funcao: formData.funcao.trim() || '[Função]',
      tipoesc: formData.tipoesc.trim() || 'Escola Primária',
      nesc: formData.nesc.trim() || '',
      local: formData.local.trim() || '[Localidade]',
      tipolic: formData.tipolic.trim() || 'Licença Disciplinar (férias)',
      ano: formData.ano.trim() || '2026',
      dias: diasNum,
      ini: formData.ini.trim() || todayISO,
      fim: formData.fim.trim() || calculateFimDate(formData.ini.trim() || todayISO, diasNum),
      ng: formData.ng.trim() || '____',
      ang: formData.ang.trim() || '2026',
      lemi: formData.lemi.trim() || 'Quêssua',
      demi: formData.demi.trim() || todayISO,
      dir: formData.dir.trim() || 'Belízio Miguel dos Santos António',
      prov: formData.prov.trim() || 'Malanje',
      mun: formData.mun.trim() || 'Quêssua',
    };
  }, [formData, submittedRecord, todayISO]);

  // Real-time duplicate check in Guia de Férias database
  const duplicateWarning = useMemo(() => {
    if (!formData.agente.trim() && !formData.ng.trim()) return null;
    const dup = findDuplicateGuiaFerias(
      formData.agente,
      formData.ng,
      formData.ang,
      formData.id
    );
    return dup.isDuplicate ? dup : null;
  }, [formData.agente, formData.ng, formData.ang, formData.id, records]);

  const validateSingleField = (
    field: keyof GuiaFeriasFormState,
    data: GuiaFeriasFormState
  ): string => {
    const val = String(data[field] ?? '').trim();
    if ((REQUIRED_FIELDS as readonly string[]).includes(field) && !val) {
      return VALIDATION_MESSAGES[field] || 'Campo obrigatório.';
    }
    if ((field === 'ano' || field === 'ang') && val && !/^\d{4}$/.test(val)) {
      return VALIDATION_MESSAGES[field];
    }
    if (field === 'dias' && val) {
      const n = Number(val);
      if (isNaN(n) || n < 1 || n > 90) {
        return VALIDATION_MESSAGES.dias;
      }
    }
    if (field === 'fim' && val && data.ini && val < data.ini) {
      return 'O término não pode ser antes do início.';
    }
    return '';
  };

  const handleFieldChange = (field: keyof GuiaFeriasFormState, value: string) => {
    if (submittedRecord) {
      setSubmittedRecord(null);
    }

    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      // Automatically compute end date when start date or duration changes
      if (field === 'ini' || field === 'dias') {
        const iniVal = field === 'ini' ? value : next.ini;
        const diasVal = parseInt(field === 'dias' ? value : next.dias, 10);
        if (iniVal && diasVal && diasVal >= 1) {
          const calculatedFim = calculateFimDate(iniVal, diasVal);
          if (calculatedFim) {
            next.fim = calculatedFim;
          }
        }
      }

      if (touched[field] || errors[field]) {
        const err = validateSingleField(field, next);
        setErrors((prevErr) => ({ ...prevErr, [field]: err }));
      }
      return next;
    });
  };

  const handleFieldBlur = (field: keyof GuiaFeriasFormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateSingleField(field, formData);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleResetForm = () => {
    setFormData(getInitialGuiaFormState());
    setErrors({});
    setTouched({});
    setFormErrorBanner(null);
    setSubmittedRecord(null);
    setGuiaSubView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    let firstInvalidId: string | null = null;

    for (const f of REQUIRED_FIELDS) {
      const err = validateSingleField(f, formData);
      if (err) {
        newErrors[f] = err;
        if (!firstInvalidId) firstInvalidId = `f-guia-${f}`;
      }
    }

    setErrors(newErrors);
    if (firstInvalidId) {
      setFormErrorBanner('Existem campos por preencher ou corrigir. Veja as indicações a vermelho.');
      const el = document.getElementById(firstInvalidId);
      if (el) el.focus();
      return;
    }

    setFormErrorBanner(null);

    const escBase = [formData.tipoesc.trim(), formData.nesc.trim() ? `nº ${formData.nesc.trim()}` : '']
      .filter(Boolean)
      .join(' ');
    const colocacaoCompleta = [escBase, formData.local.trim()].filter(Boolean).join(' – ');

    // Non-admin/non-director users submit a request to the Municipal Administration
    if (!isAdminOrDirector) {
      await submitQuickServiceRequest({
        serviceType: 'GUIA_FERIAS',
        title: `Guia de Férias - ${formData.nome.trim()}`,
        requesterName: formData.nome.trim(),
        requesterPhone: '923000000',
        requesterRoleTitle: formData.funcao.trim() || 'Funcionário(a) da Educação',
        targetSchoolName: colocacaoCompleta,
        details: {
          employeeName: formData.nome.trim(),
          employeeAgente: formData.agente.trim(),
          employeeSchoolOrDepartment: colocacaoCompleta,
          employeeCategory: `${formData.cat.trim()} ${formData.grau.trim()}`,
          referenceMonthYear: `${formData.dias} dias (${formData.ini} a ${formData.fim})`,
          purpose: formData.tipolic.trim(),
          notes: `Pedido de Guia de Férias nº ${formData.ng}/${formData.ang} submetido para homologação da Direcção Municipal da Educação.`,
        },
      });
      handleResetForm();
      showToast(
        'O seu pedido de Guia de Férias foi enviado com sucesso para a Administração Municipal (DME)!'
      );
      return;
    }

    const saveRes = saveGuiaFeriasRecord({
      id: formData.id,
      ng: formData.ng.trim(),
      ang: formData.ang.trim(),
      trat: formData.trat,
      agente: formData.agente.trim(),
      nome: formData.nome.trim(),
      cat: formData.cat.trim(),
      grau: formData.grau.trim(),
      funcao: formData.funcao.trim(),
      tipoesc: formData.tipoesc.trim(),
      nesc: formData.nesc.trim(),
      local: formData.local.trim(),
      tipolic: formData.tipolic.trim(),
      ano: formData.ano.trim(),
      dias: parseInt(formData.dias, 10) || 30,
      ini: formData.ini.trim(),
      fim: formData.fim.trim(),
      lemi: formData.lemi.trim(),
      demi: formData.demi.trim(),
      dir: formData.dir.trim(),
      prov: formData.prov.trim() || 'Malanje',
      mun: formData.mun.trim() || 'Quêssua',
    });

    reloadRecords();
    setSubmittedRecord(saveRes.record);
    setGuiaSubView('preview');
    showToast(
      formData.id
        ? `Guia de Férias de ${saveRes.record.nome} actualizada!`
        : `Guia de Férias registada com sucesso (Nº ${saveRes.record.ng}/${saveRes.record.ang})!`
    );
  };

  const handleExportCsv = () => {
    if (!records.length) return;
    const cols: (keyof GuiaFeriasRecord)[] = [
      'ng',
      'ang',
      'trat',
      'nome',
      'agente',
      'cat',
      'grau',
      'funcao',
      'tipoesc',
      'nesc',
      'local',
      'tipolic',
      'ano',
      'dias',
      'ini',
      'fim',
      'lemi',
      'demi',
      'dir',
      'prov',
      'mun',
      'criadoEm',
    ];
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv =
      '\uFEFF' +
      cols.join(';') +
      '\n' +
      records.map((r) => cols.map((c) => esc(r[c])).join(';')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cadastro-pessoal-guia-ferias.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Ficheiro CSV exportado com sucesso.');
  };

  const handleEditRecord = (r: GuiaFeriasRecord) => {
    setFormData({
      id: r.id,
      criadoEm: r.criadoEm,
      trat: r.trat || 'o Senhor',
      agente: r.agente,
      nome: r.nome,
      cat: r.cat,
      grau: r.grau,
      funcao: r.funcao,
      tipoesc: r.tipoesc,
      nesc: r.nesc,
      local: r.local,
      tipolic: r.tipolic,
      ano: r.ano,
      dias: String(r.dias || 30),
      ini: r.ini,
      fim: r.fim,
      ng: r.ng,
      ang: r.ang,
      lemi: r.lemi || 'Quêssua',
      demi: r.demi || todayISO,
      dir: r.dir || 'Belízio Miguel dos Santos António',
      prov: r.prov || 'Malanje',
      mun: r.mun || 'Quêssua',
    });
    setSubmittedRecord(null);
    setErrors({});
    setFormErrorBanner(null);
    setGuiaSubView('form');
    showToast(`Registo de ${r.nome} (Guia Nº ${r.ng}/${r.ang}) carregado para edição.`);
  };

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [r.ng, r.ang, r.nome, r.agente, r.funcao, r.tipoesc, r.nesc, r.local, r.cat]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [records, searchQuery]);

  const pillInputClass = (hasError?: boolean) =>
    `w-full h-11 px-4 rounded-full border bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
      hasError
        ? 'border-[#d92d20] bg-red-50/20 focus:border-[#d92d20] focus:ring-2 focus:ring-[#d92d20]/15'
        : 'border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
    }`;

  return (
    <div id="guia-ferias-module" className="w-full space-y-6 animate-in fade-in duration-150">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="no-print fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* EXEMPLAR HEADER: Circular Icon + Title + Actions + Hairline       */}
      {/* ================================================================= */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#f2f4f7] border border-slate-200/80 flex items-center justify-center text-slate-800 shrink-0">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Guia de Férias
            </h1>
          </div>
        </div>

        {isAdminOrDirector ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="h-10 px-4 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Registo</span>
            </button>
            <button
              type="button"
              onClick={() => downloadGuiaFeriasPdf(livePreviewRecord)}
              className="h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>
            <button
              type="button"
              onClick={() => printSinglePageA4Clean('guia-ferias-a4-sheet')}
              className="h-10 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir A4</span>
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Envio Direto para a Admin Municipal</span>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* BARRA DE OPÇÕES NO TOPO: Base de Dados | Pré-visualização | Formulário */}
      {/* ================================================================= */}
      {isAdminOrDirector && (
        <div className="no-print flex flex-wrap items-center gap-2 bg-white p-2 rounded-full border border-slate-200 w-fit shadow-xs">
          <button
            type="button"
            onClick={() => setGuiaSubView('database')}
            className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              guiaSubView === 'database'
                ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>Base de Dados ({records.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setGuiaSubView('preview')}
            className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              guiaSubView === 'preview'
                ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Pré-visualização</span>
          </button>

          <button
            type="button"
            onClick={() => setGuiaSubView('form')}
            className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              guiaSubView === 'form'
                ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Edit className="w-4 h-4 shrink-0" />
            <span>Formulário</span>
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* OPÇÃO 1: BASE DE DADOS DA GUIA DE FÉRIAS                          */}
      {/* ================================================================= */}
      {guiaSubView === 'database' && (
        <section
          id="guia-ferias-admin-list"
          className="no-print bg-white rounded-[24px] border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#f2f4f7] flex items-center justify-center text-slate-700">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Base de Dados — Guia de Férias ({records.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Selecione qualquer funcionário cadastrado para carregar ou imprimir a guia de férias
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Procurar nome, guia ou agente..."
                  aria-label="Procurar registos de guia de férias"
                  className="w-full h-9 pl-9 pr-3.5 rounded-full border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              {records.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="h-9 px-3.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[460px] overflow-y-auto border border-slate-200 rounded-2xl">
            <table className="w-full border-collapse text-xs min-w-[780px]">
              <thead className="sticky top-0 z-10 bg-[#f8f9fa]">
                <tr>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Nº Guia
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Nome Completo
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Nº Agente
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Categoria & Função
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Escola / Colocação
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Período de Férias
                  </th>
                  <th className="text-right px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Nenhum registo encontrado na Base de Dados de Guia de Férias.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const escLabel = [r.tipoesc, r.nesc ? `nº ${r.nesc}` : '']
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-slate-50/90 transition-colors ${
                          formData.id === r.id || submittedRecord?.id === r.id
                            ? 'bg-slate-100/80'
                            : ''
                        }`}
                      >
                        <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap font-semibold text-slate-900">
                          {r.ng}/{r.ang}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap font-semibold text-slate-900">
                          {r.nome}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap text-slate-700">
                          {r.agente}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-700">
                          <span className="font-medium">{r.funcao}</span> •{' '}
                          <span className="text-[11px] text-slate-500">
                            {r.cat} ({r.grau})
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-700">
                          <span className="font-medium">{escLabel}</span>
                          {r.local ? ` – ${r.local}` : ''}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-700">
                          <span className="font-semibold text-slate-900">{r.dias} dias</span> •{' '}
                          <span className="text-[11px] text-slate-500">
                            {formatDateExtenso(r.ini)} a {formatDateExtenso(r.fim)}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleEditRecord(r);
                                setGuiaSubView('preview');
                              }}
                              className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1"
                              title="Ver pré-visualização da guia de férias"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Ver Documento</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadGuiaFeriasPdf(r)}
                              className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 cursor-pointer inline-flex items-center gap-1"
                              title="Baixar PDF (1 Página A4)"
                            >
                              <FileDown className="w-3 h-3" />
                              <span>PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditRecord(r)}
                              className="p-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                              title="Editar no formulário"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRecordToDelete(r)}
                              className="p-1.5 rounded-full border border-red-200 text-[#d92d20] hover:bg-red-50 cursor-pointer"
                              title="Eliminar registo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* OPÇÃO 2: PRÉ-VISUALIZAÇÃO DO DOCUMENTO SENDO PREENCHIDO (A4)      */}
      {/* ================================================================= */}
      <section
        id="guia-ferias-live-preview-panel"
        aria-live="polite"
        className={`${
          guiaSubView === 'preview' ? 'block' : 'hidden print:block'
        } bg-white rounded-[24px] border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 print:border-0 print:p-0 print:shadow-none`}
      >
        <div className="no-print flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#f2f4f7] flex items-center justify-center text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Pré-visualização em Tempo Real — Guia de Férias
                </h2>
                <span className="text-xs text-slate-500">
                  · {livePreviewRecord.nome}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Folha A4 oficial preenchida automaticamente com os dados do formulário
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center bg-[#f2f4f7] p-1 rounded-full border border-slate-200">
              <button
                type="button"
                onClick={() => handleFieldChange('trat', 'o Senhor')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  livePreviewRecord.trat !== 'a Senhora'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Senhor
              </button>
              <button
                type="button"
                onClick={() => handleFieldChange('trat', 'a Senhora')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  livePreviewRecord.trat === 'a Senhora'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Senhora
              </button>
            </div>

            <button
              type="button"
              onClick={() => downloadGuiaFeriasPdf(livePreviewRecord)}
              className="h-9 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>

            <button
              type="button"
              onClick={() => printSinglePageA4Clean('guia-ferias-a4-sheet')}
              className="h-9 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir A4</span>
            </button>
          </div>
        </div>

        <div className="flex justify-center w-full bg-[#f8f9fa] p-3 sm:p-6 rounded-2xl border border-slate-200/70 print:bg-white print:block print:m-0 print:p-0 print:border-0">
          <div
            id="guia-ferias-a4-sheet"
            className="bg-white w-full max-w-[210mm] p-6 sm:p-10 md:px-[20mm] md:py-[14mm] border border-slate-200/90 print:border-0 shadow-xs print:shadow-none text-black mx-auto"
            style={{ fontFamily: "'Times New Roman', Times, Georgia, serif" }}
          >
            <div style={{ lineHeight: 1.5 }}>
              <div className="a4-header-block">
                <div className="flex justify-center">
                  <img
                    src={emblemAngolaImg}
                    alt="Insígnia da República de Angola"
                    className="a4-emblem-img"
                  />
                </div>
                <p className="a4-republic-title">REPÚBLICA DE ANGOLA</p>
                <p className="a4-inst-line">
                  GOVERNO PROVINCIAL DE {(livePreviewRecord.prov || 'Malanje').toUpperCase()}
                </p>
                <p className="a4-inst-line">
                  ADMINISTRAÇÃO MUNICIPAL DO {(livePreviewRecord.mun || 'Quêssua').toUpperCase()}
                </p>
                <p className="a4-inst-line">
                  DIRECÇÃO MUNICIPAL DE EDUCAÇÃO DO {(livePreviewRecord.mun || 'Quêssua').toUpperCase()}
                </p>
              </div>

              <div className="a4-title-wrap">
                <h1>
                  GUIA DE FÉRIAS Nº {livePreviewRecord.ng || '____'}/
                  {livePreviewRecord.ang || '____'}
                </h1>
              </div>

              {(() => {
                const escBase = [
                  livePreviewRecord.tipoesc,
                  livePreviewRecord.nesc ? `nº ${livePreviewRecord.nesc}` : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                const col =
                  [escBase, livePreviewRecord.local].filter(Boolean).join(' – ') ||
                  '[Escola e Localidade]';
                const iniExtenso =
                  formatDateExtenso(livePreviewRecord.ini) || '[data de início]';
                const fimExtenso =
                  formatDateExtenso(livePreviewRecord.fim) || '[data de término]';
                const demiExtenso =
                  formatDateExtenso(livePreviewRecord.demi) || '[data de emissão]';

                return (
                  <>
                    <div className="a4-body-copy mt-6 space-y-5" style={{ lineHeight: 1.5 }}>
                      <p style={{ lineHeight: 1.5 }}>
                        Por esta Direcção Municipal de Educação do{' '}
                        {livePreviewRecord.mun || 'Quêssua'}, faz-se constar às autoridades a
                        quem o conhecimento desta competir que segue viagem deste Município em
                        gozo de <strong>{livePreviewRecord.tipolic}</strong> (
                        <strong>{livePreviewRecord.dias} dias</strong>) referente ao ano
                        económico de <strong>{livePreviewRecord.ano}</strong>,{' '}
                        {livePreviewRecord.trat} <strong>{livePreviewRecord.nome}</strong>,{' '}
                        {livePreviewRecord.cat} {livePreviewRecord.grau}, sob o agente nº{' '}
                        <strong>{livePreviewRecord.agente}</strong>, com a função de{' '}
                        <strong>{livePreviewRecord.funcao}</strong>, colocado(a) na{' '}
                        <strong>{col}</strong>, a partir do dia <strong>{iniExtenso}</strong> com
                        término a <strong>{fimExtenso}</strong>.
                      </p>

                      <p className="a4-underscore-divider" style={{ lineHeight: 1.5, fontFamily: 'monospace', textAlign: 'center', wordBreak: 'break-all', margin: '12px 0', fontSize: '11px', color: '#334155' }}>
                        ____________________________________________________________________________________________________<br />
                        ____________________________________________________________________________________________________<br />
                        ____________________________________________________________________________________________________<br />
                        ____________________________________________________________________________________________________<br />
                        ____________________________________________________________________________________________________<br />
                        ____________________________________________________________________________________________________<br />
                        ____________________________________________________________________________________________________
                      </p>

                      <p style={{ lineHeight: 1.5 }}>
                        Para que não lhe ponham impedimento, mandei passar a presente guia que
                        vai por mim assinada e autenticada com o carimbo a óleo, em uso nesta
                        Direcção.
                      </p>
                    </div>

                    <div className="a4-footer-block">
                      <div className="a4-date-line" style={{ textAlign: 'center' }}>
                        <span>
                          <strong>
                            A Direcção Municipal de Educação do{' '}
                            {livePreviewRecord.mun || 'Quêssua'},{' '}
                            {livePreviewRecord.lemi || 'Quêssua'}, aos {demiExtenso}.
                          </strong>
                        </span>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        <div className="a4-sig-container">
                          <p className="a4-sig-role">O Director Municipal</p>
                          <div className="a4-sig-line"></div>
                          {livePreviewRecord.dir && (
                            <p className="a4-sig-name">{livePreviewRecord.dir}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* OPÇÃO 3: FORMULÁRIO NO ESTILO DO EXEMPLAR                         */}
      {/* ================================================================= */}
      {guiaSubView === 'form' && (
        <div className="no-print bg-white rounded-[24px] border border-slate-200 p-6 sm:p-8 shadow-xs space-y-7">
          {/* Duplicate Alert */}
          {duplicateWarning && duplicateWarning.duplicateRecord && (
            <div
              role="alert"
              className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-amber-950"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm space-y-1 flex-1">
                <p className="font-bold">
                  Registo já existente na Guia de Férias (Nº{' '}
                  {duplicateWarning.duplicateRecord.ng}/{duplicateWarning.duplicateRecord.ang})
                </p>
                <p>
                  Já consta <strong>{duplicateWarning.duplicateRecord.nome}</strong> com o mesmo{' '}
                  {duplicateWarning.reason === 'guia'
                    ? 'número e ano de guia'
                    : 'número de Agente neste ano'}
                  .
                </p>
                <div className="pt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditRecord(duplicateWarning.duplicateRecord!)}
                    className="px-3.5 py-1.5 bg-slate-900 text-white rounded-full text-xs font-semibold cursor-pointer"
                  >
                    Carregar Registo Existente
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-slate-600 m-0">
              <span className="text-[#d92d20] font-bold">*</span> Campo obrigatório
            </p>
            {formData.id && (
              <span className="text-xs font-semibold text-amber-800">
                A editar Guia Nº {formData.ng}/{formData.ang}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-7">
            {/* SECÇÃO 1: Dados do funcionário */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  Dados do funcionário
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label
                    htmlFor="f-guia-trat"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Tratamento <span className="text-[#d92d20]">*</span>
                  </label>
                  <select
                    id="f-guia-trat"
                    value={formData.trat}
                    onChange={(e) =>
                      handleFieldChange('trat', e.target.value as 'o Senhor' | 'a Senhora')
                    }
                    className={pillInputClass(false)}
                  >
                    <option value="o Senhor">Senhor (o Senhor)</option>
                    <option value="a Senhora">Senhora (a Senhora)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="f-guia-agente"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Nº de agente <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-guia-agente"
                    type="text"
                    inputMode="numeric"
                    value={formData.agente}
                    onChange={(e) => handleFieldChange('agente', e.target.value)}
                    onBlur={() => handleFieldBlur('agente')}
                    placeholder="Ex.: 01620510"
                    className={`${pillInputClass(Boolean(errors.agente))} font-mono`}
                  />
                  {errors.agente && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.agente}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="f-guia-nome"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Nome completo <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-guia-nome"
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleFieldChange('nome', e.target.value)}
                    onBlur={() => handleFieldBlur('nome')}
                    placeholder="Ex.: Maria Teresa Domingos"
                    className={pillInputClass(Boolean(errors.nome))}
                  />
                  {errors.nome && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.nome}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="f-guia-cat"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Categoria (carreira) <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-guia-cat"
                    type="text"
                    value={formData.cat}
                    onChange={(e) => handleFieldChange('cat', e.target.value)}
                    onBlur={() => handleFieldBlur('cat')}
                    placeholder="Ex.: P.E.P.E.S."
                    className={pillInputClass(Boolean(errors.cat))}
                  />
                  {errors.cat && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.cat}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="f-guia-grau"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Grau <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-guia-grau"
                    type="text"
                    value={formData.grau}
                    onChange={(e) => handleFieldChange('grau', e.target.value)}
                    onBlur={() => handleFieldBlur('grau')}
                    placeholder="Ex.: 10º Grau"
                    className={pillInputClass(Boolean(errors.grau))}
                  />
                  {errors.grau && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.grau}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="f-guia-funcao"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Função <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-guia-funcao"
                    type="text"
                    value={formData.funcao}
                    onChange={(e) => handleFieldChange('funcao', e.target.value)}
                    onBlur={() => handleFieldBlur('funcao')}
                    placeholder="Ex.: Subdirectora Pedagógica"
                    className={pillInputClass(Boolean(errors.funcao))}
                  />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[
                      'Docente',
                      'Subdirectora Pedagógica',
                      'Subdirector Pedagógico',
                      'Director de Escola',
                      'Coordenador de Turno',
                    ].map((fn) => (
                      <button
                        key={fn}
                        type="button"
                        onClick={() => handleFieldChange('funcao', fn)}
                        className="text-xs bg-[#f2f4f7] hover:bg-slate-200/80 text-slate-800 font-medium rounded-full px-3.5 py-1.5 transition-colors cursor-pointer"
                      >
                        {fn}
                      </button>
                    ))}
                  </div>
                  {errors.funcao && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.funcao}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECÇÃO 2: Local de colocação */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  Local de colocação
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label
                    htmlFor="f-guia-tipoesc"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Tipo de escola <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-guia-tipoesc"
                    type="text"
                    value={formData.tipoesc}
                    onChange={(e) => handleFieldChange('tipoesc', e.target.value)}
                    onBlur={() => handleFieldBlur('tipoesc')}
                    placeholder="Ex.: Escola Primária"
                    className={pillInputClass(Boolean(errors.tipoesc))}
                  />
                  {errors.tipoesc && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.tipoesc}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="f-guia-nesc"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Nº da escola <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-guia-nesc"
                    type="text"
                    inputMode="numeric"
                    value={formData.nesc}
                    onChange={(e) => handleFieldChange('nesc', e.target.value)}
                    onBlur={() => handleFieldBlur('nesc')}
                    placeholder="Ex.: 126"
                    className={`${pillInputClass(Boolean(errors.nesc))} font-mono`}
                  />
                  {errors.nesc && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.nesc}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="f-guia-local"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Localidade <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-guia-local"
                    type="text"
                    value={formData.local}
                    onChange={(e) => handleFieldChange('local', e.target.value)}
                    onBlur={() => handleFieldBlur('local')}
                    placeholder="Ex.: Campo da Victória"
                    className={pillInputClass(Boolean(errors.local))}
                  />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[
                      { tipoesc: 'Escola Primária', nesc: '126', local: 'Campo da Victória' },
                      { tipoesc: 'Liceu', nesc: '314 MJE - 4 de Janeiro', local: 'Quêssua' },
                      { tipoesc: 'Instituto Técnico Agrário do Quêssua', nesc: '27009 - MJE', local: 'Quêssua' },
                      { tipoesc: 'Complexo Escolar Católico', nesc: '166 MJE São Pedro', local: 'Quêssua' },
                    ].map((preset) => (
                      <button
                        key={`${preset.tipoesc}-${preset.nesc}`}
                        type="button"
                        onClick={() => {
                          handleFieldChange('tipoesc', preset.tipoesc);
                          handleFieldChange('nesc', preset.nesc);
                          handleFieldChange('local', preset.local);
                        }}
                        className="text-xs bg-[#f2f4f7] hover:bg-slate-200/80 text-slate-800 font-medium rounded-full px-3.5 py-1.5 transition-colors cursor-pointer"
                      >
                        {preset.tipoesc} nº {preset.nesc} – {preset.local}
                      </button>
                    ))}
                  </div>
                  {errors.local && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.local}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECÇÃO 3: Licença */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  Licença e período de gozo
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label
                    htmlFor="f-guia-tipolic"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Tipo de licença <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-guia-tipolic"
                    type="text"
                    value={formData.tipolic}
                    onChange={(e) => handleFieldChange('tipolic', e.target.value)}
                    placeholder="Ex.: Licença Disciplinar (férias)"
                    className={pillInputClass(false)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="f-guia-ano"
                      className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                    >
                      Ano económico <span className="text-[#d92d20]">*</span>
                    </label>
                    <input
                      id="f-guia-ano"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={formData.ano}
                      onChange={(e) => handleFieldChange('ano', e.target.value)}
                      onBlur={() => handleFieldBlur('ano')}
                      placeholder="Ex.: 2026"
                      className={`${pillInputClass(Boolean(errors.ano))} font-mono`}
                    />
                    {errors.ano && (
                      <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.ano}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="f-guia-dias"
                      className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                    >
                      Duração (dias) <span className="text-[#d92d20]">*</span>
                    </label>
                    <input
                      id="f-guia-dias"
                      type="number"
                      min={1}
                      max={90}
                      value={formData.dias}
                      onChange={(e) => handleFieldChange('dias', e.target.value)}
                      onBlur={() => handleFieldBlur('dias')}
                      className={`${pillInputClass(Boolean(errors.dias))} font-mono`}
                    />
                    {errors.dias && (
                      <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.dias}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="f-guia-ini"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Data de início <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-guia-ini"
                    type="date"
                    value={formData.ini}
                    onChange={(e) => handleFieldChange('ini', e.target.value)}
                    onBlur={() => handleFieldBlur('ini')}
                    className={pillInputClass(Boolean(errors.ini))}
                  />
                  {errors.ini && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.ini}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="f-guia-fim"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Data de término (calculada automaticamente; pode alterar){' '}
                    <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-guia-fim"
                    type="date"
                    value={formData.fim}
                    onChange={(e) => handleFieldChange('fim', e.target.value)}
                    onBlur={() => handleFieldBlur('fim')}
                    className={pillInputClass(Boolean(errors.fim))}
                  />
                  {errors.fim && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.fim}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECÇÃO 4: Emissão da guia */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  Emissão da guia e entidade emissora
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="f-guia-ng"
                      className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                    >
                      Nº da guia <span className="text-[#d92d20]">*</span>
                    </label>
                    <input
                      id="f-guia-ng"
                      type="text"
                      inputMode="numeric"
                      value={formData.ng}
                      onChange={(e) => handleFieldChange('ng', e.target.value)}
                      onBlur={() => handleFieldBlur('ng')}
                      placeholder="Ex.: 015"
                      className={`${pillInputClass(Boolean(errors.ng))} font-mono`}
                    />
                    {errors.ng && (
                      <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.ng}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="f-guia-ang"
                      className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                    >
                      Ano da guia <span className="text-[#d92d20]">*</span>
                    </label>
                    <input
                      id="f-guia-ang"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={formData.ang}
                      onChange={(e) => handleFieldChange('ang', e.target.value)}
                      onBlur={() => handleFieldBlur('ang')}
                      placeholder="Ex.: 2026"
                      className={`${pillInputClass(Boolean(errors.ang))} font-mono`}
                    />
                    {errors.ang && (
                      <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.ang}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="f-guia-lemi"
                      className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                    >
                      Local de emissão
                    </label>
                    <input
                      id="f-guia-lemi"
                      type="text"
                      value={formData.lemi}
                      onChange={(e) => handleFieldChange('lemi', e.target.value)}
                      placeholder="Ex.: Quêssua"
                      className={pillInputClass(false)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="f-guia-demi"
                      className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                    >
                      Data de emissão <span className="text-[#d92d20]">*</span>
                    </label>
                    <input
                      id="f-guia-demi"
                      type="date"
                      value={formData.demi}
                      onChange={(e) => handleFieldChange('demi', e.target.value)}
                      onBlur={() => handleFieldBlur('demi')}
                      className={pillInputClass(Boolean(errors.demi))}
                    />
                    {errors.demi && (
                      <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.demi}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="f-guia-dir"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Nome do Director Municipal <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-guia-dir"
                    type="text"
                    value={formData.dir}
                    onChange={(e) => handleFieldChange('dir', e.target.value)}
                    onBlur={() => handleFieldBlur('dir')}
                    placeholder="Belízio Miguel dos Santos António"
                    className={pillInputClass(Boolean(errors.dir))}
                  />
                  {errors.dir && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.dir}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="f-guia-prov"
                      className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                    >
                      Governo Provincial de
                    </label>
                    <input
                      id="f-guia-prov"
                      type="text"
                      value={formData.prov}
                      onChange={(e) => handleFieldChange('prov', e.target.value)}
                      placeholder="Malanje"
                      className={pillInputClass(false)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="f-guia-mun"
                      className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                    >
                      Município
                    </label>
                    <input
                      id="f-guia-mun"
                      type="text"
                      value={formData.mun}
                      onChange={(e) => handleFieldChange('mun', e.target.value)}
                      placeholder="Quêssua"
                      className={pillInputClass(false)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {formErrorBanner && (
              <p role="alert" className="text-[#d92d20] font-semibold text-xs sm:text-sm m-0">
                {formErrorBanner}
              </p>
            )}

            {/* Submit Footer */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="h-11 px-7 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {!isAdminOrDirector
                      ? 'Enviar Requerimento à Administração Municipal'
                      : formData.id
                      ? 'Guardar alterações no registo'
                      : 'Guardar na Base de Dados & Gerar Guia de Férias'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="h-11 px-5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Limpar campos</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Eliminar Registo de Guia de Férias?
            </h3>
            <p className="text-sm text-slate-600">
              Tem a certeza que deseja eliminar o cadastro de{' '}
              <strong className="text-slate-900">{recordToDelete.nome}</strong> (Guia Nº{' '}
              <span className="font-mono">
                {recordToDelete.ng}/{recordToDelete.ang}
              </span>
              )?
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="flex-1 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteGuiaFeriasRecord(recordToDelete.id);
                  if (submittedRecord?.id === recordToDelete.id) {
                    setSubmittedRecord(null);
                  }
                  setRecordToDelete(null);
                  reloadRecords();
                  showToast('Registo eliminado da Guia de Férias.');
                }}
                className="flex-1 h-10 rounded-full bg-[#d92d20] hover:brightness-110 text-white text-sm font-semibold cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
