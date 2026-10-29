import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  MapPin,
  ShieldCheck,
  Database,
  RotateCcw,
  School,
  ChevronDown,
  X,
  Sparkles,
} from 'lucide-react';
import emblemAngolaImg from '../../assets/images/Emblem_of_Angola.svg.webp';
import {
  GuiaColocacaoRecord,
  GRAUS_COLOCACAO_SUGGESTIONS,
  ESCOLAS_COLOCACAO_SUGGESTIONS,
  getTodayIsoColocacao,
  formatColocacaoDateExtenso,
  formatColocacaoDateShort,
  formatCategoriaGrauColocacao,
  getStoredGuiaColocacaoRecords,
  saveGuiaColocacaoRecord,
  deleteGuiaColocacaoRecord,
  findDuplicateGuiaColocacao,
} from '../../utils/guiaColocacaoStorage';
import {
  downloadGuiaColocacaoPdf,
  printSinglePageA4Clean,
} from '../../utils/declaracaoPdfGenerator';
import type { UserAccount } from '../../types';
import { submitQuickServiceRequest } from '../../utils/quickServicesStorage';

export interface GuiaColocacaoSectionProps {
  isLoggedIn?: boolean;
  currentUser?: UserAccount | null;
}

interface GuiaColocacaoFormState {
  id?: string;
  criado?: string;

  // I. Guia
  num: string;
  ano: string;

  // II. Professor
  trat: 'M' | 'F';
  nome: string;
  cat: string;
  grau: string;
  agente: string;

  // III. Colocação e Emissão
  escola: string;
  local: string;
  data: string;
  dir: string;
  prov: string;
  mun: string;
}

const VALIDATION_MESSAGES: Record<string, string> = {
  ano: 'Use 4 dígitos, como 2026.',
  nome: 'Escreva o nome completo do professor.',
  cat: 'Indique a categoria profissional.',
  grau: 'Indique o grau (ex.: 13º Grau).',
  agente: 'Indique o número de agente (apenas algarismos).',
  escola: 'Indique a escola de destino.',
  local: 'Indique o local de emissão.',
  data: 'Escolha a data de emissão.',
  dir: 'Indique o nome do Director Municipal.',
};

const REQUIRED_FIELDS = [
  'ano',
  'nome',
  'cat',
  'grau',
  'agente',
  'escola',
  'local',
  'data',
  'dir',
] as const;

function getInitialColocacaoFormState(): GuiaColocacaoFormState {
  const today = getTodayIsoColocacao();
  const currentYear = String(new Date().getFullYear());

  return {
    num: '',
    ano: currentYear,
    trat: 'M',
    nome: '',
    cat: 'P.E.P.E.S.',
    grau: '13º Grau',
    agente: '',
    escola: '',
    local: 'Quêssua',
    data: today,
    dir: 'Belízio Miguel dos Santos António',
    prov: 'Malanje',
    mun: 'Quêssua',
  };
}

export const GuiaColocacaoSection: React.FC<GuiaColocacaoSectionProps> = ({
  isLoggedIn = false,
  currentUser,
}) => {
  const isAdminOrDirector = Boolean(
    isLoggedIn &&
      currentUser &&
      (currentUser.role === 'admin' || currentUser.role === 'diretor')
  );

  const [records, setRecords] = useState<GuiaColocacaoRecord[]>(() =>
    getStoredGuiaColocacaoRecords()
  );
  const [formData, setFormData] = useState<GuiaColocacaoFormState>(() =>
    getInitialColocacaoFormState()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formErrorBanner, setFormErrorBanner] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<GuiaColocacaoRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recordToDelete, setRecordToDelete] = useState<GuiaColocacaoRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [colocacaoSubView, setColocacaoSubView] = useState<'database' | 'preview' | 'form'>('form');

  // Combobox state for Escola de destino
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  const schoolDropdownRef = useRef<HTMLDivElement>(null);

  const todayISO = useMemo(() => getTodayIsoColocacao(), []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const reloadRecords = () => {
    setRecords(getStoredGuiaColocacaoRecords());
  };

  useEffect(() => {
    reloadRecords();
    const handleUpdated = () => reloadRecords();
    window.addEventListener('sigre-guia-colocacao-updated', handleUpdated);
    return () => {
      window.removeEventListener('sigre-guia-colocacao-updated', handleUpdated);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        schoolDropdownRef.current &&
        !schoolDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSchoolSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Consolidate all schools (official suggestions + stored records + admin schools)
  const allAvailableSchools = useMemo(() => {
    const set = new Set<string>(ESCOLAS_COLOCACAO_SUGGESTIONS);
    records.forEach((r) => {
      if (r.escola && r.escola.trim()) set.add(r.escola.trim());
    });
    try {
      const saved = localStorage.getItem('ucore_admin_schools');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((s: any) => {
            if (s?.name && s.name.trim()) set.add(s.name.trim());
          });
        }
      }
    } catch {}
    return Array.from(set);
  }, [records]);

  const schoolSuggestions = useMemo(() => {
    const q = (formData.escola || '').trim().toLowerCase();
    if (!q) return allAvailableSchools;
    return allAvailableSchools.filter((school) => school.toLowerCase().includes(q));
  }, [formData.escola, allAvailableSchools]);

  const isExactRegisteredSchool = useMemo(() => {
    const q = (formData.escola || '').trim().toLowerCase();
    if (!q) return false;
    return allAvailableSchools.some((s) => s.toLowerCase() === q);
  }, [formData.escola, allAvailableSchools]);

  // Live preview record derived from current formData (or submittedRecord if explicitly viewing one)
  const livePreviewRecord: GuiaColocacaoRecord = useMemo(() => {
    if (submittedRecord) return submittedRecord;

    return {
      id: formData.id || 'preview-live',
      criado: formData.criado || todayISO,
      num: formData.num.trim(),
      ano: formData.ano.trim() || '2026',
      trat: formData.trat || 'M',
      nome: formData.nome.trim() || '[nome completo]',
      cat: formData.cat.trim() || 'P.E.P.E.S.',
      grau: formData.grau.trim() || '13º Grau',
      agente: formData.agente.trim() || '[nº de agente]',
      escola: formData.escola.trim() || '[escola de destino]',
      local: formData.local.trim() || 'Quêssua',
      data: formData.data.trim() || todayISO,
      dir: formData.dir.trim() || 'Belízio Miguel dos Santos António',
      prov: formData.prov.trim() || 'Malanje',
      mun: formData.mun.trim() || 'Quêssua',
    };
  }, [formData, submittedRecord, todayISO]);

  // Real-time duplicate check in Guia de Colocação database
  const duplicateWarning = useMemo(() => {
    if (!formData.agente.trim() && !formData.num.trim()) return null;
    const dup = findDuplicateGuiaColocacao(
      formData.agente,
      formData.escola,
      formData.data,
      formData.num,
      formData.ano,
      formData.id
    );
    return dup.isDuplicate ? dup : null;
  }, [formData.agente, formData.escola, formData.data, formData.num, formData.ano, formData.id, records]);

  const validateSingleField = (
    field: keyof GuiaColocacaoFormState,
    data: GuiaColocacaoFormState
  ): string => {
    const val = String(data[field] ?? '').trim();
    if ((REQUIRED_FIELDS as readonly string[]).includes(field) && !val) {
      return VALIDATION_MESSAGES[field] || 'Campo obrigatório.';
    }
    if (field === 'ano' && val && !/^\d{4}$/.test(val)) {
      return VALIDATION_MESSAGES.ano;
    }
    if (field === 'agente' && val && !/^\d{3,14}$/.test(val.replace(/\s+/g, ''))) {
      return 'O número de agente deve conter apenas algarismos.';
    }
    return '';
  };

  const handleFieldChange = (field: keyof GuiaColocacaoFormState, value: string) => {
    if (submittedRecord) {
      setSubmittedRecord(null);
    }

    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (touched[field] || errors[field]) {
        const err = validateSingleField(field, next);
        setErrors((prevErr) => ({ ...prevErr, [field]: err }));
      }
      return next;
    });
  };

  const handleFieldBlur = (field: keyof GuiaColocacaoFormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateSingleField(field, formData);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleResetForm = () => {
    setFormData(getInitialColocacaoFormState());
    setErrors({});
    setTouched({});
    setFormErrorBanner(null);
    setSubmittedRecord(null);
    setColocacaoSubView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    let firstInvalidId: string | null = null;

    for (const f of REQUIRED_FIELDS) {
      const err = validateSingleField(f, formData);
      if (err) {
        newErrors[f] = err;
        if (!firstInvalidId) firstInvalidId = `f-colocacao-${f}`;
      }
    }

    setErrors(newErrors);
    if (firstInvalidId) {
      setFormErrorBanner('Verifique os campos assinalados a vermelho antes de concluir.');
      const el = document.getElementById(firstInvalidId);
      if (el) el.focus();
      return;
    }

    setFormErrorBanner(null);

    const catGrau = formatCategoriaGrauColocacao(formData.cat, formData.grau);

    // Non-admin/non-director users submit a request to the Municipal Administration
    if (!isAdminOrDirector) {
      await submitQuickServiceRequest({
        serviceType: 'GUIA_COLOCACAO',
        title: `Guia de Colocação - ${formData.nome.trim()}`,
        requesterName: formData.nome.trim(),
        requesterPhone: '923000000',
        requesterRoleTitle: formData.trat === 'F' ? 'Professora' : 'Professor',
        targetSchoolName: formData.escola.trim(),
        details: {
          employeeName: formData.nome.trim(),
          employeeAgente: formData.agente.trim(),
          employeeSchoolOrDepartment: formData.escola.trim(),
          employeeCategory: catGrau,
          referenceMonthYear: formData.data.trim(),
          purpose: 'Reiniciar as suas funções de professor',
          notes: `Pedido de Guia de Colocação Nº ${formData.num.trim() || 'S/N'}/${formData.ano.trim()} para colocação na escola ${formData.escola.trim()}.`,
        },
      });
      handleResetForm();
      showToast(
        'O seu pedido de Guia de Colocação foi enviado com sucesso para a Administração Municipal (DME)!'
      );
      return;
    }

    const saveRes = saveGuiaColocacaoRecord({
      id: formData.id,
      num: formData.num.trim(),
      ano: formData.ano.trim(),
      trat: formData.trat,
      nome: formData.nome.trim(),
      cat: formData.cat.trim(),
      grau: formData.grau.trim(),
      agente: formData.agente.trim(),
      escola: formData.escola.trim(),
      local: formData.local.trim() || 'Quêssua',
      data: formData.data.trim(),
      dir: formData.dir.trim(),
      prov: formData.prov.trim() || 'Malanje',
      mun: formData.mun.trim() || 'Quêssua',
    });

    reloadRecords();
    setSubmittedRecord(saveRes.record);
    setColocacaoSubView('preview');
    showToast(
      formData.id
        ? `Guia de Colocação de ${saveRes.record.nome} actualizada!`
        : `Guia de Colocação de ${saveRes.record.nome} cadastrada com sucesso!`
    );
  };

  const handleExportCsv = () => {
    if (!records.length) {
      showToast('Não há guias para descarregar.');
      return;
    }
    const cols: (keyof GuiaColocacaoRecord)[] = [
      'num',
      'ano',
      'trat',
      'nome',
      'cat',
      'grau',
      'agente',
      'escola',
      'local',
      'data',
      'dir',
      'prov',
      'mun',
      'criado',
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
    a.download = 'guias-colocacao.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Lista de Guias de Colocação (CSV) exportada com sucesso.');
  };

  const handleEditRecord = (r: GuiaColocacaoRecord) => {
    setFormData({
      id: r.id,
      criado: r.criado,
      num: r.num || '',
      ano: r.ano || '2026',
      trat: r.trat || 'M',
      nome: r.nome,
      cat: r.cat || 'P.E.P.E.S.',
      grau: r.grau || '13º Grau',
      agente: r.agente,
      escola: r.escola,
      local: r.local || 'Quêssua',
      data: r.data || todayISO,
      dir: r.dir || 'Belízio Miguel dos Santos António',
      prov: r.prov || 'Malanje',
      mun: r.mun || 'Quêssua',
    });
    setSubmittedRecord(null);
    setErrors({});
    setFormErrorBanner(null);
    setColocacaoSubView('form');
    showToast(`Guia de Colocação de ${r.nome} carregada para edição.`);
  };

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [r.num, r.ano, r.nome, r.agente, r.cat, r.grau, r.escola, r.local, r.dir]
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
    <div id="guia-colocacao-module" className="w-full space-y-6 animate-in fade-in duration-150">
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
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Guia de Colocação
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
              onClick={() => downloadGuiaColocacaoPdf(livePreviewRecord)}
              className="h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>
            <button
              type="button"
              onClick={() => printSinglePageA4Clean('guia-colocacao-a4-sheet')}
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
            onClick={() => setColocacaoSubView('database')}
            className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              colocacaoSubView === 'database'
                ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>Base de Dados ({records.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setColocacaoSubView('preview')}
            className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              colocacaoSubView === 'preview'
                ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Pré-visualização</span>
          </button>

          <button
            type="button"
            onClick={() => setColocacaoSubView('form')}
            className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              colocacaoSubView === 'form'
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
      {/* OPÇÃO 1: BASE DE DADOS DA GUIA DE COLOCAÇÃO                       */}
      {/* ================================================================= */}
      {colocacaoSubView === 'database' && (
        <section
          id="guia-colocacao-admin-list"
          className="no-print bg-white rounded-[24px] border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#f2f4f7] flex items-center justify-center text-slate-700">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Base de Dados — Guias de Colocação ({records.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Selecione qualquer professor cadastrado para visualizar, editar ou imprimir a guia de colocação
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
                  placeholder="Procurar professor, guia, agente ou escola..."
                  aria-label="Procurar registos de guia de colocação"
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
                    Guia
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Professor
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Categoria
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Agente
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Escola de Destino
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Data
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
                      Ainda não há guias cadastradas. Preencha o formulário e escolha Guardar.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        formData.id === r.id || submittedRecord?.id === r.id
                          ? 'bg-slate-100/80'
                          : ''
                      }`}
                    >
                      <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap font-semibold text-slate-900">
                        {r.num || '—'}/{r.ano}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap font-semibold text-slate-900">
                        {r.nome}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-700">
                        {formatCategoriaGrauColocacao(r.cat, r.grau)}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap text-slate-700">
                        {r.agente}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-700 max-w-[260px] truncate">
                        {r.escola}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-700">
                        {formatColocacaoDateShort(r.data)}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleEditRecord(r);
                              setColocacaoSubView('preview');
                            }}
                            className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1"
                            title="Ver pré-visualização da guia de colocação"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver Documento</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadGuiaColocacaoPdf(r)}
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
                  ))
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
        id="guia-colocacao-live-preview-panel"
        aria-live="polite"
        className={`${
          colocacaoSubView === 'preview' ? 'block' : 'hidden print:block'
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
                  Pré-visualização em Tempo Real — Guia de Colocação
                </h2>
                <span className="text-xs text-slate-500">
                  · {livePreviewRecord.nome}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Folha A4 oficial preenchida automaticamente enquanto preenche os dados
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center bg-[#f2f4f7] p-1 rounded-full border border-slate-200">
              <button
                type="button"
                onClick={() => handleFieldChange('trat', 'M')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  livePreviewRecord.trat !== 'F'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Senhor professor
              </button>
              <button
                type="button"
                onClick={() => handleFieldChange('trat', 'F')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  livePreviewRecord.trat === 'F'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Senhora professora
              </button>
            </div>

            <button
              type="button"
              onClick={() => downloadGuiaColocacaoPdf(livePreviewRecord)}
              className="h-9 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>

            <button
              type="button"
              onClick={() => printSinglePageA4Clean('guia-colocacao-a4-sheet')}
              className="h-9 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir A4</span>
            </button>
          </div>
        </div>

        <div className="flex justify-center w-full bg-[#f8f9fa] p-3 sm:p-6 rounded-2xl border border-slate-200/70 print:bg-white print:block print:m-0 print:p-0 print:border-0">
          <div
            id="guia-colocacao-a4-sheet"
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
                {(() => {
                  const mun = livePreviewRecord.mun || 'Quêssua';
                  const prepMun =
                    mun.toLowerCase().includes('quêssua') || mun.toLowerCase().includes('quessua')
                      ? 'DO'
                      : 'DE';
                  return (
                    <>
                      <p className="a4-inst-line">
                        ADMINISTRAÇÃO MUNICIPAL {prepMun} {mun.toUpperCase()}
                      </p>
                      <p className="a4-inst-line">
                        DIRECÇÃO MUNICIPAL DE EDUCAÇÃO {prepMun} {mun.toUpperCase()}
                      </p>
                    </>
                  );
                })()}
              </div>

              <div className="a4-title-wrap">
                <h1>
                  GUIA DE COLOCAÇÃO Nº {livePreviewRecord.num || '_______'}/
                  {livePreviewRecord.ano || '____'}
                </h1>
              </div>

              {(() => {
                const isFem = livePreviewRecord.trat === 'F';
                const tratTexto = isFem ? 'a senhora professora' : 'o senhor professor';
                const catGrau =
                  formatCategoriaGrauColocacao(livePreviewRecord.cat, livePreviewRecord.grau) ||
                  '[categoria e grau]';
                const dataExtenso =
                  formatColocacaoDateExtenso(livePreviewRecord.data) || '[data]';
                const mun = livePreviewRecord.mun || 'Quêssua';
                const prepDateMun =
                  mun.toLowerCase().includes('quêssua') || mun.toLowerCase().includes('quessua')
                    ? 'do'
                    : 'de';

                return (
                  <>
                    <div className="a4-body-copy mt-6 space-y-5" style={{ lineHeight: 1.5 }}>
                      <p style={{ lineHeight: 1.5 }}>
                        Por esta Direcção, se faz constar às autoridades a quem o conhecimento
                        desta competir que, segue viagem desta Direcção para{' '}
                        <strong>{livePreviewRecord.escola}</strong>, {tratTexto}{' '}
                        <strong>{livePreviewRecord.nome}</strong>, com a categoria de{' '}
                        <strong>{catGrau}</strong>, titular de agente nº{' '}
                        <strong>{livePreviewRecord.agente}</strong>, para reiniciar as suas
                        funções de professor.
                      </p>

                      <p className="a4-equals-divider" style={{ lineHeight: 1.6, fontFamily: 'monospace', textAlign: 'center', letterSpacing: '2px', margin: '14px 0', fontSize: '13px', color: '#334155' }}>
                        ========================================================================<br />
                        ========================================================================<br />
                        ========================================================================<br />
                        ========================================================================<br />
                        ========================================================================
                      </p>

                      <p style={{ lineHeight: 1.5 }}>
                        Para que não lhe ponham impedimento, mandei passar a presente guia que
                        vai por mim assinada e autenticada com o carimbo a óleo, em uso nesta
                        Direcção.
                      </p>

                      <p className="a4-equals-divider" style={{ lineHeight: 1.6, fontFamily: 'monospace', textAlign: 'center', letterSpacing: '2px', margin: '14px 0', fontSize: '13px', color: '#334155' }}>
                        ========================================================================<br />
                        ========================================================================<br />
                        ========================================================================<br />
                        ========================================================================<br />
                        ========================================================================
                      </p>
                    </div>

                    <div className="a4-footer-block">
                      <div className="a4-date-line" style={{ textAlign: 'center' }}>
                        <span>
                          <strong>
                            A Direcção Municipal de Educação {prepDateMun} {mun}, em{' '}
                            {livePreviewRecord.local || mun} aos {dataExtenso}.
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
      {colocacaoSubView === 'form' && (
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
                  Esta guia já foi cadastrada (Nº{' '}
                  {duplicateWarning.duplicateRecord.num || '—'}/
                  {duplicateWarning.duplicateRecord.ano})
                </p>
                <p>
                  Já consta <strong>{duplicateWarning.duplicateRecord.nome}</strong>{' '}
                  {duplicateWarning.reason === 'guia'
                    ? 'com o mesmo número e ano de guia.'
                    : `cadastrado para o mesmo agente, escola (${duplicateWarning.duplicateRecord.escola}) e data.`}
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
                A editar Guia Nº {formData.num || '—'}/{formData.ano}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-7">
            {/* SECÇÃO 1: Guia */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  Guia
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label
                    htmlFor="f-colocacao-num"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Número da guia
                  </label>
                  <input
                    id="f-colocacao-num"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={formData.num}
                    onChange={(e) => handleFieldChange('num', e.target.value)}
                    placeholder="Ex.: 112"
                    className={`${pillInputClass(false)} font-mono`}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pode ficar em branco e ser preenchido na assinatura.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="f-colocacao-ano"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Ano <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-colocacao-ano"
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
              </div>
            </div>

            {/* SECÇÃO 2: Professor */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  Professor
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label
                    htmlFor="f-colocacao-trat"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Tratamento <span className="text-[#d92d20]">*</span>
                  </label>
                  <select
                    id="f-colocacao-trat"
                    value={formData.trat}
                    onChange={(e) => handleFieldChange('trat', e.target.value as 'M' | 'F')}
                    className={pillInputClass(false)}
                  >
                    <option value="M">Senhor professor</option>
                    <option value="F">Senhora professora</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="f-colocacao-agente"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Número de agente <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-colocacao-agente"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={formData.agente}
                    onChange={(e) => handleFieldChange('agente', e.target.value)}
                    onBlur={() => handleFieldBlur('agente')}
                    placeholder="Ex.: 88212320"
                    className={`${pillInputClass(Boolean(errors.agente))} font-mono`}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Apenas algarismos.</p>
                  {errors.agente && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.agente}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="f-colocacao-nome"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Nome completo <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-colocacao-nome"
                    type="text"
                    autoComplete="name"
                    value={formData.nome}
                    onChange={(e) => handleFieldChange('nome', e.target.value)}
                    onBlur={() => handleFieldBlur('nome')}
                    placeholder="Ex.: Gilson José Cassengue"
                    className={pillInputClass(Boolean(errors.nome))}
                  />
                  {errors.nome && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.nome}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="f-colocacao-cat"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Categoria <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-colocacao-cat"
                    type="text"
                    value={formData.cat}
                    onChange={(e) => handleFieldChange('cat', e.target.value)}
                    onBlur={() => handleFieldBlur('cat')}
                    placeholder="Ex.: P.E.P.E.S."
                    className={pillInputClass(Boolean(errors.cat))}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Categoria profissional.</p>
                  {errors.cat && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.cat}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="f-colocacao-grau"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Grau <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-colocacao-grau"
                    type="text"
                    list="graus-colocacao-datalist"
                    value={formData.grau}
                    onChange={(e) => handleFieldChange('grau', e.target.value)}
                    onBlur={() => handleFieldBlur('grau')}
                    placeholder="Ex.: 13º Grau"
                    className={pillInputClass(Boolean(errors.grau))}
                  />
                  <datalist id="graus-colocacao-datalist">
                    {GRAUS_COLOCACAO_SUGGESTIONS.map((g) => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {GRAUS_COLOCACAO_SUGGESTIONS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleFieldChange('grau', g)}
                        className="text-[11px] bg-[#f2f4f7] hover:bg-slate-200/80 text-slate-800 font-medium rounded-full px-3 py-1 transition-colors cursor-pointer"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  {errors.grau && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.grau}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECÇÃO 3: Colocação */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  Colocação
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="f-colocacao-escola"
                      className="block text-[13px] font-semibold text-slate-800"
                    >
                      Escola de destino <span className="text-[#d92d20]">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      (Pode escrever ou escolher das sugestões)
                    </span>
                  </div>

                  <div className="relative" ref={schoolDropdownRef}>
                    <div className="relative flex items-center">
                      <input
                        id="f-colocacao-escola"
                        type="text"
                        autoComplete="off"
                        value={formData.escola}
                        onChange={(e) => {
                          handleFieldChange('escola', e.target.value);
                          setShowSchoolSuggestions(true);
                        }}
                        onFocus={() => setShowSchoolSuggestions(true)}
                        onBlur={() => handleFieldBlur('escola')}
                        placeholder="Ex.: Escola Primária nº 9 – 1 de Junho ou Liceu Nº 314 MJE..."
                        className={`${pillInputClass(Boolean(errors.escola))} pr-20`}
                      />
                      <div className="absolute right-2.5 flex items-center gap-1">
                        {formData.escola && (
                          <button
                            type="button"
                            onClick={() => {
                              handleFieldChange('escola', '');
                              setShowSchoolSuggestions(true);
                            }}
                            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Limpar campo"
                            aria-label="Limpar campo da escola"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowSchoolSuggestions((prev) => !prev)}
                          className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Ver escolas cadastradas"
                          aria-label="Ver lista de escolas cadastradas"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              showSchoolSuggestions ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {showSchoolSuggestions && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 max-h-64 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-100 mb-1">
                          <span>Sugestões de Escolas ({schoolSuggestions.length})</span>
                          {formData.escola.trim() && !isExactRegisteredSchool && (
                            <span className="text-amber-600 font-semibold normal-case">
                              Escola nova/personalizada
                            </span>
                          )}
                        </div>

                        {formData.escola.trim() && !isExactRegisteredSchool && (
                          <div className="p-2.5 mb-1.5 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-bold text-amber-900 flex items-center gap-1.5 truncate">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="truncate">Usar «{formData.escola}»</span>
                              </div>
                              <p className="text-[11px] text-amber-700 truncate">
                                Esta escola será registada diretamente na Guia de Colocação.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowSchoolSuggestions(false)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shrink-0 cursor-pointer shadow-2xs"
                            >
                              Confirmar
                            </button>
                          </div>
                        )}

                        {schoolSuggestions.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            Nenhuma escola cadastrada coincide com «
                            <strong className="text-slate-800">{formData.escola}</strong>».
                            <div className="text-[11px] text-emerald-600 font-medium mt-1">
                              O nome escrito será utilizado diretamente na emissão da guia.
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            {schoolSuggestions.map((schoolName) => {
                              const isSelected =
                                formData.escola.trim().toLowerCase() === schoolName.toLowerCase();
                              return (
                                <button
                                  key={schoolName}
                                  type="button"
                                  onClick={() => {
                                    handleFieldChange('escola', schoolName);
                                    setShowSchoolSuggestions(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#002133] text-white font-bold'
                                      : 'hover:bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <School
                                      className={`w-3.5 h-3.5 shrink-0 ${
                                        isSelected ? 'text-amber-400' : 'text-slate-400'
                                      }`}
                                    />
                                    <span className="truncate">{schoolName}</span>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.escola && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.escola}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="f-colocacao-local"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Local de emissão <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-colocacao-local"
                    type="text"
                    value={formData.local}
                    onChange={(e) => handleFieldChange('local', e.target.value)}
                    onBlur={() => handleFieldBlur('local')}
                    placeholder="Ex.: Quêssua ou Mucari"
                    className={pillInputClass(Boolean(errors.local))}
                  />
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {['Quêssua', 'Mucari', 'Caculama'].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => handleFieldChange('local', loc)}
                        className="text-[11px] bg-[#f2f4f7] hover:bg-slate-200/80 text-slate-800 font-medium rounded-full px-3 py-1 transition-colors cursor-pointer"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                  {errors.local && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.local}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="f-colocacao-data"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Data de emissão <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-colocacao-data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => handleFieldChange('data', e.target.value)}
                    onBlur={() => handleFieldBlur('data')}
                    className={pillInputClass(Boolean(errors.data))}
                  />
                  {errors.data && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.data}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="f-colocacao-dir"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Director Municipal <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-colocacao-dir"
                    type="text"
                    value={formData.dir}
                    onChange={(e) => handleFieldChange('dir', e.target.value)}
                    onBlur={() => handleFieldBlur('dir')}
                    placeholder="Ex.: Belízio Miguel dos Santos António"
                    className={pillInputClass(Boolean(errors.dir))}
                  />
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {['Belízio Miguel dos Santos António', 'João António José'].map((dName) => (
                      <button
                        key={dName}
                        type="button"
                        onClick={() => handleFieldChange('dir', dName)}
                        className="text-[11px] bg-[#f2f4f7] hover:bg-slate-200/80 text-slate-800 font-medium rounded-full px-3 py-1 transition-colors cursor-pointer"
                      >
                        {dName}
                      </button>
                    ))}
                  </div>
                  {errors.dir && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.dir}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="f-colocacao-prov"
                      className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                    >
                      Governo Provincial de
                    </label>
                    <input
                      id="f-colocacao-prov"
                      type="text"
                      value={formData.prov}
                      onChange={(e) => handleFieldChange('prov', e.target.value)}
                      placeholder="Malanje"
                      className={pillInputClass(false)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="f-colocacao-mun"
                      className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                    >
                      Município (Direcção)
                    </label>
                    <input
                      id="f-colocacao-mun"
                      type="text"
                      value={formData.mun}
                      onChange={(e) => handleFieldChange('mun', e.target.value)}
                      placeholder="Quêssua"
                      className={pillInputClass(false)}
                    />
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {['Quêssua', 'Mucari', 'Caculama'].map((mName) => (
                        <button
                          key={mName}
                          type="button"
                          onClick={() => handleFieldChange('mun', mName)}
                          className="text-[11px] bg-[#f2f4f7] hover:bg-slate-200/80 text-slate-800 font-medium rounded-full px-3 py-1 transition-colors cursor-pointer"
                        >
                          {mName}
                        </button>
                      ))}
                    </div>
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
                      ? 'Guardar alterações na guia'
                      : 'Cadastrar Guia de Colocação'}
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
              Eliminar Guia de Colocação?
            </h3>
            <p className="text-sm text-slate-600">
              Tem a certeza que deseja eliminar o registo de{' '}
              <strong className="text-slate-900">{recordToDelete.nome}</strong> (Guia Nº{' '}
              <span className="font-mono">
                {recordToDelete.num || '—'}/{recordToDelete.ano}
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
                  deleteGuiaColocacaoRecord(recordToDelete.id);
                  if (submittedRecord?.id === recordToDelete.id) {
                    setSubmittedRecord(null);
                  }
                  setRecordToDelete(null);
                  reloadRecords();
                  showToast('Registo eliminado da Guia de Colocação.');
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
