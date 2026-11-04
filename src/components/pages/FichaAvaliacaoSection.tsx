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
  ClipboardCheck,
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
  FichaAvaliacaoRecord,
  INDICADORES_AVALIACAO,
  ANUAL_INDICADORES_ORDER,
  CATEGORIAS_DOCENTE_SUGGESTIONS,
  ESCOLAS_AVALIACAO_SUGGESTIONS,
  QUALITATIVA_SUGGESTIONS,
  getTodayIsoAvaliacao,
  formatAvaliacaoDateShort,
  splitAvaliacaoDateParts,
  formatAvaliacaoNumber,
  computeFichaAvaliacaoMetrics,
  getStoredFichaAvaliacaoRecords,
  saveFichaAvaliacaoRecord,
  deleteFichaAvaliacaoRecord,
  findDuplicateFichaAvaliacao,
} from '../../utils/fichaAvaliacaoStorage';
import {
  downloadFichaAvaliacaoPdf,
  printSinglePageA4Clean,
} from '../../utils/declaracaoPdfGenerator';
import type { UserAccount } from '../../types';
import { submitQuickServiceRequest } from '../../utils/quickServicesStorage';

export interface FichaAvaliacaoSectionProps {
  isLoggedIn?: boolean;
  currentUser?: UserAccount | null;
}

interface FichaAvaliacaoFormState {
  id?: string;
  criado?: string;

  // 1. Identificação do avaliado
  provincia: string;
  municipio: string;
  escola: string;
  nome: string;
  categoria: string;
  agente: string;
  dataAval: string;

  // 2. Período a que respeita a avaliação
  de: string;
  ate: string;

  // 3. Classificação dos indicadores (strings nos inputs para edição fluida)
  notas: string[][];
  qualTrim: [string, string, string, string];

  // 4. Classificação anual dos indicadores
  finalQual: string;

  // 5. Apreciação geral
  c1: string;
  c2: string;
  c3: string;
  cf: string;

  // 6. Avaliador
  avNome: string;
  avFuncao: string;
  avData: string;

  // 7. Concordância com a avaliação
  conc: 'Sim' | 'Não' | '';
  avdData: string;
}

const REQUIRED_FIELDS = ['nome', 'categoria', 'agente', 'dataAval'] as const;

const VALIDATION_MESSAGES: Record<string, string> = {
  nome: 'Indique o nome completo do avaliado.',
  categoria: 'Indique a categoria.',
  agente: 'Indique o número de agente.',
  dataAval: 'Indique a data de avaliação.',
};

function getInitialAvaliacaoFormState(): FichaAvaliacaoFormState {
  const today = getTodayIsoAvaliacao();
  return {
    provincia: 'Malanje',
    municipio: 'Quêssua',
    escola: '',
    nome: '',
    categoria: 'P.E.P.E.S. Auxiliar do 3º Grau',
    agente: '',
    dataAval: today,
    de: '',
    ate: '',
    notas: Array.from({ length: 5 }, () => ['', '', '']),
    qualTrim: ['', '', '', ''],
    finalQual: '',
    c1: '',
    c2: '',
    c3: '',
    cf: '',
    avNome: 'Belízio Miguel dos Santos António',
    avFuncao: 'Director Municipal da Educação',
    avData: today,
    conc: 'Sim',
    avdData: today,
  };
}

function parseNotasMatrix(rawNotas: string[][]): (number | null)[][] {
  return Array.from({ length: 5 }, (_, i) =>
    [0, 1, 2].map((t) => {
      const s = String(rawNotas?.[i]?.[t] ?? '')
        .trim()
        .replace(',', '.');
      if (!s) return null;
      const n = parseFloat(s);
      return Number.isNaN(n) ? null : n;
    })
  );
}

export const FichaAvaliacaoSection: React.FC<FichaAvaliacaoSectionProps> = ({
  isLoggedIn = false,
  currentUser,
}) => {
  const isAdminOrDirector = Boolean(
    isLoggedIn &&
      currentUser &&
      (currentUser.role === 'admin' || currentUser.role === 'diretor')
  );

  const [records, setRecords] = useState<FichaAvaliacaoRecord[]>(() =>
    getStoredFichaAvaliacaoRecords()
  );
  const [formData, setFormData] = useState<FichaAvaliacaoFormState>(() =>
    getInitialAvaliacaoFormState()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formErrorBanner, setFormErrorBanner] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<FichaAvaliacaoRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recordToDelete, setRecordToDelete] = useState<FichaAvaliacaoRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [avaliacaoSubView, setAvaliacaoSubView] = useState<'database' | 'preview' | 'form'>(
    'form'
  );

  // Combobox state for Escola / instituição
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  const schoolDropdownRef = useRef<HTMLDivElement>(null);

  const todayISO = useMemo(() => getTodayIsoAvaliacao(), []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const reloadRecords = () => {
    setRecords(getStoredFichaAvaliacaoRecords());
  };

  useEffect(() => {
    reloadRecords();
    const handleUpdated = () => reloadRecords();
    window.addEventListener('sigre-ficha-avaliacao-updated', handleUpdated);
    return () => {
      window.removeEventListener('sigre-ficha-avaliacao-updated', handleUpdated);
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
    const set = new Set<string>(ESCOLAS_AVALIACAO_SUGGESTIONS);
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

  // Parsed numeric matrix and live metrics for the form
  const numericNotas = useMemo(() => parseNotasMatrix(formData.notas), [formData.notas]);
  const formMetrics = useMemo(
    () => computeFichaAvaliacaoMetrics(numericNotas),
    [numericNotas]
  );

  // Live preview record derived from current formData (or submittedRecord if explicitly viewing one)
  const livePreviewRecord: FichaAvaliacaoRecord = useMemo(() => {
    if (submittedRecord) return submittedRecord;

    return {
      id: formData.id || 'preview-live',
      criado: formData.criado || todayISO,
      provincia: formData.provincia.trim() || 'Malanje',
      municipio: formData.municipio.trim() || 'Quêssua',
      escola: formData.escola.trim(),
      nome: formData.nome.trim(),
      categoria: formData.categoria.trim(),
      agente: formData.agente.trim(),
      dataAval: formData.dataAval.trim() || todayISO,
      de: formData.de.trim(),
      ate: formData.ate.trim(),
      notas: numericNotas,
      qualTrim: formMetrics.qualTrim,
      finalQual: formMetrics.finalQual,
      c1: formData.c1.trim(),
      c2: formData.c2.trim(),
      c3: formData.c3.trim(),
      cf: formData.cf.trim(),
      avNome: formData.avNome.trim(),
      avFuncao: formData.avFuncao.trim(),
      avData: formData.avData.trim(),
      conc: formData.conc,
      avdData: formData.avdData.trim(),
    };
  }, [formData, numericNotas, formMetrics, submittedRecord, todayISO]);

  const previewMetrics = useMemo(
    () => computeFichaAvaliacaoMetrics(livePreviewRecord.notas),
    [livePreviewRecord.notas]
  );

  const duplicateWarning = useMemo(() => {
    if (!formData.agente.trim()) return null;
    const dup = findDuplicateFichaAvaliacao(
      formData.agente,
      formData.dataAval,
      formData.id
    );
    return dup.isDuplicate ? dup : null;
  }, [formData.agente, formData.dataAval, formData.id, records]);

  const validateSingleField = (
    field: keyof FichaAvaliacaoFormState,
    data: FichaAvaliacaoFormState
  ): string => {
    const val = String(data[field] ?? '').trim();
    if ((REQUIRED_FIELDS as readonly string[]).includes(field) && !val) {
      return VALIDATION_MESSAGES[field] || 'Campo obrigatório.';
    }
    return '';
  };

  const handleFieldChange = <K extends keyof FichaAvaliacaoFormState>(
    field: K,
    value: FichaAvaliacaoFormState[K]
  ) => {
    if (submittedRecord) {
      setSubmittedRecord(null);
    }
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (touched[field as string] || errors[field as string]) {
        const err = validateSingleField(field, next);
        setErrors((prevErr) => ({ ...prevErr, [field]: err }));
      }
      return next;
    });
  };

  const handleNotaChange = (indIndex: number, trimIndex: number, val: string) => {
    if (submittedRecord) {
      setSubmittedRecord(null);
    }
    setFormData((prev) => {
      const nextNotas = prev.notas.map((row, rIdx) =>
        rIdx === indIndex
          ? row.map((cell, cIdx) => (cIdx === trimIndex ? val : cell))
          : row
      );
      return { ...prev, notas: nextNotas };
    });
  };

  const handleQualTrimChange = (colIndex: 0 | 1 | 2 | 3, val: string) => {
    if (submittedRecord) {
      setSubmittedRecord(null);
    }
    setFormData((prev) => {
      const nextQual: [string, string, string, string] = [...prev.qualTrim] as [
        string,
        string,
        string,
        string,
      ];
      nextQual[colIndex] = val;
      return { ...prev, qualTrim: nextQual };
    });
  };

  const handleFieldBlur = (field: keyof FichaAvaliacaoFormState) => {
    setTouched((prev) => ({ ...prev, [field as string]: true }));
    const err = validateSingleField(field, formData);
    setErrors((prev) => ({ ...prev, [field as string]: err }));
  };

  const handleResetForm = () => {
    setFormData(getInitialAvaliacaoFormState());
    setErrors({});
    setTouched({});
    setFormErrorBanner(null);
    setSubmittedRecord(null);
    setAvaliacaoSubView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    let firstInvalidId: string | null = null;

    for (const f of REQUIRED_FIELDS) {
      const err = validateSingleField(f, formData);
      if (err) {
        newErrors[f] = err;
        if (!firstInvalidId) firstInvalidId = `f-aval-${f}`;
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

    if (!isAdminOrDirector) {
      await submitQuickServiceRequest({
        serviceType: 'FICHA_AVALIACAO',
        title: `Ficha de Avaliação - ${formData.nome.trim()}`,
        requesterName: formData.nome.trim(),
        requesterPhone: '923000000',
        requesterRoleTitle: 'Docente',
        targetSchoolName: formData.escola.trim() || 'Direcção Municipal de Educação',
        details: {
          employeeName: formData.nome.trim(),
          employeeAgente: formData.agente.trim(),
          employeeSchoolOrDepartment: formData.escola.trim(),
          employeeCategory: formData.categoria.trim(),
          referenceMonthYear: formData.dataAval.trim(),
          purpose: 'Avaliação de Desempenho Docente (Anexo III)',
          notes: `Submissão de Ficha de Avaliação de Desempenho Docente. Média Final Quantitativa: ${
            formatAvaliacaoNumber(formMetrics.finalQuant) || '—'
          } (${formMetrics.finalQual || '—'}).`,
        },
      });
      handleResetForm();
      showToast(
        'A Ficha de Avaliação foi enviada com sucesso para homologação na Administração Municipal (DME)!'
      );
      return;
    }

    const saveRes = saveFichaAvaliacaoRecord({
      id: formData.id,
      criado: formData.criado,
      provincia: formData.provincia.trim() || 'Malanje',
      municipio: formData.municipio.trim() || 'Quêssua',
      escola: formData.escola.trim(),
      nome: formData.nome.trim(),
      categoria: formData.categoria.trim(),
      agente: formData.agente.trim(),
      dataAval: formData.dataAval.trim(),
      de: formData.de.trim(),
      ate: formData.ate.trim(),
      notas: numericNotas,
      qualTrim: formMetrics.qualTrim,
      finalQual: formMetrics.finalQual,
      c1: formData.c1.trim(),
      c2: formData.c2.trim(),
      c3: formData.c3.trim(),
      cf: formData.cf.trim(),
      avNome: formData.avNome.trim(),
      avFuncao: formData.avFuncao.trim(),
      avData: formData.avData.trim(),
      conc: formData.conc,
      avdData: formData.avdData.trim(),
    });

    reloadRecords();
    setSubmittedRecord(saveRes.record);
    setAvaliacaoSubView('preview');
    showToast(
      formData.id
        ? `Ficha de Avaliação de ${saveRes.record.nome} actualizada!`
        : `Ficha de Avaliação de ${saveRes.record.nome} guardada com sucesso!`
    );
  };

  const handleEditRecord = (r: FichaAvaliacaoRecord) => {
    setFormData({
      id: r.id,
      criado: r.criado,
      provincia: r.provincia || 'Malanje',
      municipio: r.municipio || 'Quêssua',
      escola: r.escola || '',
      nome: r.nome || '',
      categoria: r.categoria || '',
      agente: r.agente || '',
      dataAval: r.dataAval || todayISO,
      de: r.de || '',
      ate: r.ate || '',
      notas: Array.from({ length: 5 }, (_, i) =>
        [0, 1, 2].map((t) => {
          const v = r.notas?.[i]?.[t];
          return v === null || v === undefined ? '' : String(v);
        })
      ),
      qualTrim: r.qualTrim || ['', '', '', ''],
      finalQual: r.finalQual || '',
      c1: r.c1 || '',
      c2: r.c2 || '',
      c3: r.c3 || '',
      cf: r.cf || '',
      avNome: r.avNome || '',
      avFuncao: r.avFuncao || '',
      avData: r.avData || '',
      conc: r.conc || '',
      avdData: r.avdData || '',
    });
    setSubmittedRecord(null);
    setErrors({});
    setFormErrorBanner(null);
    setAvaliacaoSubView('form');
    showToast(`Ficha de Avaliação de ${r.nome} carregada para edição.`);
  };

  const handleExportCsv = () => {
    if (!records.length) {
      showToast('Não há fichas de avaliação para exportar.');
      return;
    }
    const headers = [
      'nome',
      'agente',
      'categoria',
      'escola',
      'provincia',
      'municipio',
      'dataAval',
      'de',
      'ate',
      'finalQuant',
      'finalQual',
      'conc',
      'avNome',
      'avFuncao',
      'criado',
    ];
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const rows = records.map((r) => {
      const m = computeFichaAvaliacaoMetrics(r.notas);
      return [
        r.nome,
        r.agente,
        r.categoria,
        r.escola,
        r.provincia,
        r.municipio,
        r.dataAval,
        r.de,
        r.ate,
        formatAvaliacaoNumber(m.finalQuant),
        m.finalQual || r.finalQual,
        r.conc,
        r.avNome,
        r.avFuncao,
        r.criado,
      ]
        .map(esc)
        .join(';');
    });

    const csv = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fichas-avaliacao.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Lista de Fichas de Avaliação (CSV) exportada com sucesso.');
  };

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [r.nome, r.agente, r.escola, r.categoria, r.municipio, r.finalQual, r.avNome]
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
    <div id="ficha-avaliacao-module" className="w-full space-y-6 animate-in fade-in duration-150">
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
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Ficha de Avaliação de Desempenho Docente
            </h1>
            <p className="text-xs text-slate-500">
              Modelo Oficial: Diário da República, I Série — N.º 18, de 27 de Janeiro de 2022 (Anexo III)
            </p>
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
              onClick={() => downloadFichaAvaliacaoPdf(livePreviewRecord)}
              className="h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>
            <button
              type="button"
              onClick={() => printSinglePageA4Clean('ficha-avaliacao-a4-sheet')}
              className="h-10 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir A4</span>
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
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
            onClick={() => setAvaliacaoSubView('database')}
            className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              avaliacaoSubView === 'database'
                ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>Base de Dados ({records.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAvaliacaoSubView('preview')}
            className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              avaliacaoSubView === 'preview'
                ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Pré-visualização</span>
          </button>

          <button
            type="button"
            onClick={() => setAvaliacaoSubView('form')}
            className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              avaliacaoSubView === 'form'
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
      {/* OPÇÃO 1: BASE DE DADOS DAS FICHAS DE AVALIAÇÃO                    */}
      {/* ================================================================= */}
      {avaliacaoSubView === 'database' && (
        <section
          id="ficha-avaliacao-admin-list"
          className="no-print bg-white rounded-[24px] border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#f2f4f7] flex items-center justify-center text-slate-700">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Base de Dados — Fichas de Avaliação Docente ({records.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Consulte, edite ou imprima qualquer ficha de avaliação de desempenho docente cadastrada
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
                  placeholder="Procurar nome, agente ou escola..."
                  aria-label="Procurar nas fichas de avaliação"
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
            <table className="w-full border-collapse text-xs min-w-[860px]">
              <thead className="sticky top-0 z-10 bg-[#f8f9fa]">
                <tr>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Nome do Avaliado
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Agente nº
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Escola / Instituição
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Categoria
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Data
                  </th>
                  <th className="text-center px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Final Quant.
                  </th>
                  <th className="text-center px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Final Qual.
                  </th>
                  <th className="text-right px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Nenhuma ficha de avaliação encontrada. Preencha o formulário e clique em Guardar.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const m = computeFichaAvaliacaoMetrics(r.notas);
                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-slate-50/90 transition-colors ${
                          formData.id === r.id || submittedRecord?.id === r.id
                            ? 'bg-slate-100/80'
                            : ''
                        }`}
                      >
                        <td className="px-3.5 py-2.5 whitespace-nowrap font-semibold text-slate-900">
                          {r.nome}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap text-slate-700">
                          {r.agente}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-700 max-w-[230px] truncate">
                          {r.escola || '—'}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-700 max-w-[180px] truncate">
                          {r.categoria}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-700">
                          {formatAvaliacaoDateShort(r.dataAval)}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-mono font-bold text-slate-900">
                          {formatAvaliacaoNumber(m.finalQuant) || '—'}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-semibold text-slate-800">
                          {m.finalQual || r.finalQual || '—'}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleEditRecord(r);
                                setAvaliacaoSubView('preview');
                              }}
                              className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1"
                              title="Ver pré-visualização da Ficha de Avaliação"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Ver Ficha</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadFichaAvaliacaoPdf(r)}
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
      {/* OPÇÃO 2: PRÉ-VISUALIZAÇÃO DO DOCUMENTO OFICIAL (ANEXO III A4)     */}
      {/* ================================================================= */}
      <section
        id="ficha-avaliacao-live-preview-panel"
        aria-live="polite"
        className={`${
          avaliacaoSubView === 'preview' ? 'block' : 'hidden print:block'
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
                  Pré-visualização Oficial A4 — Ficha de Avaliação de Desempenho Docente
                </h2>
                {livePreviewRecord.nome && (
                  <span className="text-xs text-slate-500">· {livePreviewRecord.nome}</span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Anexo III (Diário da República, I Série — N.º 18, de 27 de Janeiro de 2022) · Fonte Century Gothic (Títulos 10pt · Texto 8pt)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => downloadFichaAvaliacaoPdf(livePreviewRecord)}
              className="h-9 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>

            <button
              type="button"
              onClick={() => printSinglePageA4Clean('ficha-avaliacao-a4-sheet')}
              className="h-9 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir A4</span>
            </button>
          </div>
        </div>

        <div className="flex justify-center w-full bg-[#f8f9fa] p-4 sm:p-8 rounded-2xl border border-slate-200/70 print:bg-white print:block print:m-0 print:p-0 print:border-0">
          <div
            id="ficha-avaliacao-a4-sheet"
            className="bg-white w-full max-w-[210mm] p-6 sm:p-10 md:px-[16mm] md:py-[14mm] border border-slate-200/90 print:border-0 shadow-xs print:shadow-none text-black mx-auto font-normal"
            style={{
              fontFamily:
                "'Century Gothic', CenturyGothic, AppleGothic, 'URW Gothic L', 'Avant Garde', sans-serif",
              fontSize: '8pt',
              fontWeight: 400,
              lineHeight: 1.4,
              color: '#000000',
            }}
          >
            {(() => {
              const [avalD, avalM, avalY] = splitAvaliacaoDateParts(livePreviewRecord.dataAval);
              const [deD, deM, deY] = splitAvaliacaoDateParts(livePreviewRecord.de);
              const [ateD, ateM, ateY] = splitAvaliacaoDateParts(livePreviewRecord.ate);
              const [avD, avM, avY] = splitAvaliacaoDateParts(livePreviewRecord.avData);
              const [avdD, avdM, avdY] = splitAvaliacaoDateParts(livePreviewRecord.avdData);

              const dateSegStyle: React.CSSProperties = {
                display: 'inline-block',
                minWidth: '56px',
                borderBottom: '1px solid #000000',
                textAlign: 'center',
                padding: '0 4px 1px 4px',
                margin: '0 2px',
                fontSize: '8pt',
                fontWeight: 400,
                lineHeight: 1.2,
              };

              const yearSegStyle: React.CSSProperties = {
                ...dateSegStyle,
                minWidth: '68px',
              };

              const cellNormalStyle: React.CSSProperties = {
                border: '1px solid #000000',
                padding: '5px 8px',
                fontSize: '8pt',
                fontWeight: 400,
                lineHeight: 1.35,
                verticalAlign: 'middle',
              };

              const cellHeaderStyle: React.CSSProperties = {
                border: '1px solid #000000',
                padding: '5px 8px',
                fontSize: '10pt',
                fontWeight: 700,
                lineHeight: 1.35,
                verticalAlign: 'middle',
              };

              const chapterTitleStyle: React.CSSProperties = {
                fontSize: '10pt',
                fontWeight: 700,
                lineHeight: 1.35,
                margin: '0 0 5px 0',
                textAlign: 'left',
              };

              return (
                <>
                  {/* ==================== PÁGINA 1 ==================== */}
                  {/* 1. Cabeçalho Institucional */}
                  <div
                    className="a4-eval-section"
                    style={{
                      textAlign: 'center',
                      marginBottom: '12px',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                    }}
                  >
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                      <img
                        src={emblemAngolaImg}
                        alt="Insígnia da República de Angola"
                        className="ficha-emblem-img"
                        style={{
                          width: '80px',
                          height: '80px',
                          maxHeight: '80px',
                          objectFit: 'contain',
                          display: 'block',
                          margin: '0 auto',
                        }}
                      />
                    </div>
                    <p
                      className="font-bold ficha-title-10"
                      style={{
                        fontSize: '10pt',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        lineHeight: 1.35,
                        margin: '0 0 2px 0',
                        textAlign: 'center',
                      }}
                    >
                      REPÚBLICA DE ANGOLA
                    </p>
                    <p
                      className="font-bold ficha-title-10"
                      style={{
                        fontSize: '10pt',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        lineHeight: 1.35,
                        margin: '0 0 2px 0',
                        textAlign: 'center',
                      }}
                    >
                      GOVERNO PROVINCIAL DE MALANJE
                    </p>
                    <p
                      className="font-bold ficha-title-10"
                      style={{
                        fontSize: '10pt',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        lineHeight: 1.35,
                        margin: '0 0 2px 0',
                        textAlign: 'center',
                      }}
                    >
                      ADMINISTRAÇÃO MUNICIPAL DO QUÊSSUA
                    </p>
                    <p
                      className="font-bold ficha-title-10"
                      style={{
                        fontSize: '10pt',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        lineHeight: 1.35,
                        margin: '0 0 8px 0',
                        textAlign: 'center',
                      }}
                    >
                      DIRECÇÃO MUNICIPAL DE EDUCAÇÃO
                    </p>
                    <h1
                      className="font-bold ficha-title-10"
                      style={{
                        fontSize: '10pt',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        lineHeight: 1.38,
                        margin: '0 auto',
                        maxWidth: '96%',
                        textAlign: 'center',
                      }}
                    >
                      FICHA DE AVALIAÇÃO DE DESEMPENHO ANUAL DO EDUCADOR DE INFÂNCIA E DO PROFESSOR
                      DO ENSINO PRIMÁRIO E SECUNDÁRIO
                    </h1>
                  </div>

                  {/* 2. Identificação: a), b), c) e Dados do Avaliado */}
                  <div
                    className="a4-eval-section"
                    style={{
                      marginBottom: '12px',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                    }}
                  >
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1px solid #000000',
                      }}
                    >
                      <tbody>
                        <tr>
                          <td style={{ ...cellNormalStyle, textAlign: 'left' }}>
                            <span style={{ marginRight: '6px' }}>a)</span>
                            <span>{livePreviewRecord.provincia}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ ...cellNormalStyle, textAlign: 'left' }}>
                            <span style={{ marginRight: '6px' }}>b)</span>
                            <span>{livePreviewRecord.municipio}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ ...cellNormalStyle, textAlign: 'left' }}>
                            <span style={{ marginRight: '6px' }}>c)</span>
                            <span>{livePreviewRecord.escola}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ ...cellNormalStyle, textAlign: 'left' }}>
                            <span style={{ marginRight: '6px' }}>Nome Completo:</span>
                            <span>{livePreviewRecord.nome}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ ...cellNormalStyle, textAlign: 'left' }}>
                            <span style={{ marginRight: '6px' }}>Categoria:</span>
                            <span>{livePreviewRecord.categoria}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ ...cellNormalStyle, textAlign: 'left' }}>
                            <span style={{ marginRight: '6px' }}>Agente nº:</span>
                            <span>{livePreviewRecord.agente}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ ...cellNormalStyle, textAlign: 'left' }}>
                            <span style={{ marginRight: '6px' }}>Data de Avaliação:</span>
                            <span style={dateSegStyle}>{avalD || '\u00A0'}</span>
                            <span style={{ padding: '0 2px' }}>/</span>
                            <span style={dateSegStyle}>{avalM || '\u00A0'}</span>
                            <span style={{ padding: '0 2px' }}>/</span>
                            <span style={yearSegStyle}>{avalY || '\u00A0'}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 3. Período a que respeita avaliação */}
                  <div
                    className="a4-eval-section"
                    style={{
                      marginBottom: '12px',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                    }}
                  >
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1px solid #000000',
                      }}
                    >
                      <tbody>
                        <tr>
                          <td
                            className="font-bold ficha-title-10"
                            style={{ ...cellHeaderStyle, textAlign: 'center' }}
                          >
                            Período a que respeita avaliação
                          </td>
                        </tr>
                        <tr>
                          <td style={{ ...cellNormalStyle, textAlign: 'center', padding: '7px 8px' }}>
                            <span style={{ marginRight: '4px' }}>De</span>
                            <span style={dateSegStyle}>{deD || '\u00A0'}</span>
                            <span style={{ padding: '0 2px' }}>/</span>
                            <span style={dateSegStyle}>{deM || '\u00A0'}</span>
                            <span style={{ padding: '0 2px' }}>/</span>
                            <span style={yearSegStyle}>{deY || '\u00A0'}</span>
                            <span style={{ margin: '0 10px' }}>:a</span>
                            <span style={dateSegStyle}>{ateD || '\u00A0'}</span>
                            <span style={{ padding: '0 2px' }}>/</span>
                            <span style={dateSegStyle}>{ateM || '\u00A0'}</span>
                            <span style={{ padding: '0 2px' }}>/</span>
                            <span style={yearSegStyle}>{ateY || '\u00A0'}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 4. Classificação dos Indicadores Anual Trimestral + Nota */}
                  <div
                    className="a4-eval-section a4-page-break-after"
                    style={{
                      marginBottom: '14px',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                      pageBreakAfter: 'always',
                      breakAfter: 'page',
                    }}
                  >
                    <p className="font-bold ficha-title-10" style={chapterTitleStyle}>
                      Classificação dos Indicadores Anual Trimestral
                    </p>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1px solid #000000',
                        tableLayout: 'fixed',
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            className="font-bold ficha-title-10"
                            style={{ ...cellHeaderStyle, width: '7%', textAlign: 'center' }}
                          >
                            Nº
                          </th>
                          <th
                            className="font-bold ficha-title-10"
                            style={{ ...cellHeaderStyle, width: '49%', textAlign: 'left' }}
                          >
                            Indicadores
                          </th>
                          <th
                            className="font-bold ficha-title-10"
                            style={{ ...cellHeaderStyle, width: '11%', textAlign: 'center' }}
                          >
                            Iº Trim
                          </th>
                          <th
                            className="font-bold ficha-title-10"
                            style={{ ...cellHeaderStyle, width: '11%', textAlign: 'center' }}
                          >
                            IIº Trim
                          </th>
                          <th
                            className="font-bold ficha-title-10"
                            style={{ ...cellHeaderStyle, width: '11%', textAlign: 'center' }}
                          >
                            IIIº Trim
                          </th>
                          <th
                            className="font-bold ficha-title-10"
                            style={{ ...cellHeaderStyle, width: '11%', textAlign: 'center' }}
                          >
                            Média
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {INDICADORES_AVALIACAO.map((indText, idx) => (
                          <tr key={indText}>
                            <td style={{ ...cellNormalStyle, textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ ...cellNormalStyle, textAlign: 'left' }}>{indText}</td>
                            <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                              {formatAvaliacaoNumber(livePreviewRecord.notas?.[idx]?.[0])}
                            </td>
                            <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                              {formatAvaliacaoNumber(livePreviewRecord.notas?.[idx]?.[1])}
                            </td>
                            <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                              {formatAvaliacaoNumber(livePreviewRecord.notas?.[idx]?.[2])}
                            </td>
                            <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                              {formatAvaliacaoNumber(previewMetrics.mediasIndicadores[idx])}
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td style={{ ...cellNormalStyle, textAlign: 'center' }} />
                          <td
                            className="font-bold ficha-title-10"
                            style={{ ...cellHeaderStyle, textAlign: 'left' }}
                          >
                            Classificação Quantitativa
                          </td>
                          <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                            {formatAvaliacaoNumber(previewMetrics.quantTrim[0])}
                          </td>
                          <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                            {formatAvaliacaoNumber(previewMetrics.quantTrim[1])}
                          </td>
                          <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                            {formatAvaliacaoNumber(previewMetrics.quantTrim[2])}
                          </td>
                          <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                            {formatAvaliacaoNumber(previewMetrics.quantMedia)}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ ...cellNormalStyle, textAlign: 'center' }} />
                          <td
                            className="font-bold ficha-title-10"
                            style={{ ...cellHeaderStyle, textAlign: 'left' }}
                          >
                            Classificação Qualitativa
                          </td>
                          <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                            {previewMetrics.qualTrim[0] || livePreviewRecord.qualTrim?.[0] || ''}
                          </td>
                          <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                            {previewMetrics.qualTrim[1] || livePreviewRecord.qualTrim?.[1] || ''}
                          </td>
                          <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                            {previewMetrics.qualTrim[2] || livePreviewRecord.qualTrim?.[2] || ''}
                          </td>
                          <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                            {previewMetrics.qualTrim[3] || livePreviewRecord.qualTrim?.[3] || ''}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Nota explicativa (1 a 6) */}
                    <div
                      style={{
                        marginTop: '8px',
                        textAlign: 'left',
                        fontSize: '8pt',
                        lineHeight: 1.4,
                      }}
                    >
                      <p
                        className="font-bold ficha-title-10"
                        style={{
                          fontSize: '10pt',
                          fontWeight: 700,
                          margin: '0 0 3px 0',
                        }}
                      >
                        Nota:
                      </p>
                      <p style={{ margin: '0 0 2px 0' }}>
                        1. A pontuação trimestral é a nota atribuída pelo avaliador, resultado da
                        soma de todos indicadores.
                      </p>
                      <p style={{ margin: '0 0 2px 0' }}>
                        2. Classificação Quantitativa ou Notas de Classificação é a soma das notas
                        obtidas por cada indicador.
                      </p>
                      <p style={{ margin: '0 0 2px 0' }}>
                        3. Classificação Qualitativa ou Faixa Correspondente é o resultado atribuído
                        a cada Nota de Classificação.
                      </p>
                      <p style={{ margin: '0 0 2px 0' }}>
                        4. A média final é a soma dos trimestres dividida pelos trimestres lectivos
                        do ano.
                      </p>
                      <p style={{ margin: '0 0 2px 0' }}>
                        5. Classificação final é a soma das médias dos indicadores.
                      </p>
                      <p style={{ margin: 0 }}>
                        6. Os comentários devem ser efectuados por trimestre.
                      </p>
                    </div>
                  </div>

                  {/* ==================== PÁGINA 2 ==================== */}
                  {/* 5. Classificação Anual dos Indicadores */}
                  <div
                    className="a4-eval-section"
                    style={{
                      marginBottom: '12px',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                    }}
                  >
                    <p className="font-bold ficha-title-10" style={chapterTitleStyle}>
                      Classificação Anual dos Indicadores
                    </p>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1px solid #000000',
                        tableLayout: 'fixed',
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            className="font-bold ficha-title-10"
                            style={{ ...cellHeaderStyle, width: '7%', textAlign: 'center' }}
                          >
                            Nº
                          </th>
                          <th
                            className="font-bold ficha-title-10"
                            style={{ ...cellHeaderStyle, width: '71%', textAlign: 'left' }}
                          >
                            Indicadores
                          </th>
                          <th
                            className="font-bold ficha-title-10"
                            style={{ ...cellHeaderStyle, width: '22%', textAlign: 'center' }}
                          >
                            Média Final
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ANUAL_INDICADORES_ORDER.map((indIdx, pos) => (
                          <tr key={indIdx}>
                            <td style={{ ...cellNormalStyle, textAlign: 'center' }}>{pos + 1}</td>
                            <td style={{ ...cellNormalStyle, textAlign: 'left' }}>
                              {INDICADORES_AVALIACAO[indIdx]}
                            </td>
                            <td style={{ ...cellNormalStyle, textAlign: 'center' }}>
                              {formatAvaliacaoNumber(previewMetrics.anualMedias[pos])}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 6. Classificação Final */}
                  <div
                    className="a4-eval-section"
                    style={{
                      marginBottom: '14px',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                    }}
                  >
                    <p className="font-bold ficha-title-10" style={chapterTitleStyle}>
                      Classificação Final
                    </p>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1px solid #000000',
                        tableLayout: 'fixed',
                      }}
                    >
                      <tbody>
                        <tr>
                          <td style={{ ...cellNormalStyle, width: '7%', textAlign: 'center' }}>
                            1
                          </td>
                          <td
                            className="font-bold ficha-title-10"
                            style={{ ...cellHeaderStyle, width: '71%', textAlign: 'left' }}
                          >
                            Quantitativa
                          </td>
                          <td style={{ ...cellNormalStyle, width: '22%', textAlign: 'center' }}>
                            {formatAvaliacaoNumber(previewMetrics.finalQuant)}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ ...cellNormalStyle, width: '7%', textAlign: 'center' }}>
                            2
                          </td>
                          <td
                            className="font-bold ficha-title-10"
                            style={{ ...cellHeaderStyle, width: '71%', textAlign: 'left' }}
                          >
                            Qualitativa
                          </td>
                          <td style={{ ...cellNormalStyle, width: '22%', textAlign: 'center' }}>
                            {previewMetrics.finalQual || livePreviewRecord.finalQual}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 7. Apreciação Geral (Comentários dos Avaliadores) */}
                  <div
                    className="a4-eval-section a4-page-break-after"
                    style={{
                      marginBottom: '14px',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                      pageBreakAfter: 'always',
                      breakAfter: 'page',
                    }}
                  >
                    <div style={{ marginBottom: '8px', textAlign: 'left' }}>
                      <p
                        className="font-bold ficha-title-10"
                        style={{ fontSize: '10pt', fontWeight: 700, margin: '0 0 2px 0' }}
                      >
                        Apreciação Geral
                      </p>
                      <p style={{ fontSize: '8pt', fontWeight: 400, margin: 0 }}>
                        (Comentários dos Avaliadores)
                      </p>
                    </div>

                    <div>
                      {[
                        { label: 'Comentário 1', value: livePreviewRecord.c1 },
                        { label: 'Comentário 2', value: livePreviewRecord.c2 },
                        { label: 'Comentário 3', value: livePreviewRecord.c3 },
                        { label: 'Comentário Final', value: livePreviewRecord.cf },
                      ].map((item) => (
                        <div
                          key={item.label}
                          style={{
                            marginBottom: '10px',
                            pageBreakInside: 'avoid',
                            breakInside: 'avoid',
                          }}
                        >
                          <p
                            className="font-bold ficha-title-10"
                            style={{
                              fontSize: '10pt',
                              fontWeight: 700,
                              margin: '0 0 2px 0',
                              textAlign: 'left',
                            }}
                          >
                            {item.label}
                          </p>
                          {item.value ? (
                            <div
                              style={{
                                position: 'relative',
                                fontSize: '8pt',
                                fontWeight: 400,
                                lineHeight: '20px',
                                minHeight: '100px',
                                padding: '0 4px',
                                textAlign: 'justify',
                                backgroundImage:
                                  'repeating-linear-gradient(to bottom, transparent 0px, transparent 19px, #000000 19px, #000000 20px)',
                              }}
                            >
                              {item.value}
                            </div>
                          ) : (
                            <div>
                              {[0, 1, 2, 3, 4].map((lineIdx) => (
                                <div
                                  key={lineIdx}
                                  className="ficha-comment-line"
                                  style={{
                                    height: '19px',
                                    borderBottom: '1px solid #000000',
                                    width: '100%',
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ==================== PÁGINA 3 ==================== */}
                  {/* 8. Identificação e Assinatura do Avaliador */}
                  <div
                    className="a4-eval-section"
                    style={{
                      marginBottom: '28px',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                    }}
                  >
                    <div style={{ marginBottom: '22px', textAlign: 'left' }}>
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          border: '1px solid #000000',
                        }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ ...cellNormalStyle, textAlign: 'left' }}>
                              <span
                                className="font-bold ficha-title-10"
                                style={{
                                  fontSize: '10pt',
                                  fontWeight: 700,
                                  marginRight: '6px',
                                }}
                              >
                                Nome:
                              </span>
                              <span>{livePreviewRecord.avNome}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ ...cellNormalStyle, textAlign: 'left' }}>
                              <span
                                className="font-bold ficha-title-10"
                                style={{
                                  fontSize: '10pt',
                                  fontWeight: 700,
                                  marginRight: '6px',
                                }}
                              >
                                Função:
                              </span>
                              <span>{livePreviewRecord.avFuncao}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ ...cellNormalStyle, textAlign: 'left' }}>
                              <span
                                className="font-bold ficha-title-10"
                                style={{
                                  fontSize: '10pt',
                                  fontWeight: 700,
                                  marginRight: '6px',
                                }}
                              >
                                Data:
                              </span>
                              <span style={dateSegStyle}>{avD || '\u00A0'}</span>
                              <span style={{ padding: '0 2px' }}>/</span>
                              <span style={dateSegStyle}>{avM || '\u00A0'}</span>
                              <span style={{ padding: '0 2px' }}>/</span>
                              <span style={yearSegStyle}>{avY || '\u00A0'}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div style={{ textAlign: 'center', paddingTop: '6px' }}>
                      <p
                        className="font-bold ficha-title-10"
                        style={{
                          fontSize: '10pt',
                          fontWeight: 700,
                          margin: '0 0 32px 0',
                          textAlign: 'center',
                        }}
                      >
                        O Avaliador
                      </p>
                      <div
                        className="ficha-sig-line"
                        style={{
                          width: '250px',
                          borderBottom: '1px solid #000000',
                          margin: '0 auto',
                          height: '1px',
                        }}
                      />
                      {livePreviewRecord.avNome && (
                        <p
                          style={{
                            marginTop: '5px',
                            fontSize: '8pt',
                            fontWeight: 400,
                            textAlign: 'center',
                          }}
                        >
                          {livePreviewRecord.avNome}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 9. Concordância com Avaliação e Homologação */}
                  <div
                    className="a4-eval-section"
                    style={{
                      paddingTop: '4px',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                    }}
                  >
                    <p
                      className="font-bold ficha-title-10"
                      style={{
                        fontSize: '10pt',
                        fontWeight: 700,
                        margin: '0 0 14px 0',
                        textAlign: 'left',
                      }}
                    >
                      Concordância com Avaliação
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '36px',
                        marginBottom: '26px',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '8pt', fontWeight: 400, marginRight: '8px' }}>
                          Concordo
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #000000',
                            width: '20px',
                            height: '18px',
                            fontSize: '8pt',
                            fontWeight: 400,
                          }}
                        >
                          {livePreviewRecord.conc === 'Sim' ? 'X' : ''}
                        </span>
                      </span>

                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '8pt', fontWeight: 400, marginRight: '8px' }}>
                          Não concordo
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #000000',
                            width: '20px',
                            height: '18px',
                            fontSize: '8pt',
                            fontWeight: 400,
                          }}
                        >
                          {livePreviewRecord.conc === 'Não' ? 'X' : ''}
                        </span>
                      </span>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                      <p
                        className="font-bold ficha-title-10"
                        style={{
                          fontSize: '10pt',
                          fontWeight: 700,
                          margin: '0 0 32px 0',
                          textAlign: 'center',
                        }}
                      >
                        O Avaliado
                      </p>
                      <div
                        className="ficha-sig-line"
                        style={{
                          width: '250px',
                          borderBottom: '1px solid #000000',
                          margin: '0 auto',
                          height: '1px',
                        }}
                      />
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                      <span
                        className="font-bold ficha-title-10"
                        style={{ fontSize: '10pt', fontWeight: 700, marginRight: '6px' }}
                      >
                        Data
                      </span>
                      <span style={dateSegStyle}>{avdD || '\u00A0'}</span>
                      <span style={{ padding: '0 2px' }}>/</span>
                      <span style={dateSegStyle}>{avdM || '\u00A0'}</span>
                      <span style={{ padding: '0 2px' }}>/</span>
                      <span style={yearSegStyle}>{avdY || '\u00A0'}</span>
                    </div>

                    <div style={{ textAlign: 'center', paddingTop: '4px', paddingBottom: '8px' }}>
                      <p
                        className="font-bold ficha-title-10"
                        style={{
                          fontSize: '10pt',
                          fontWeight: 700,
                          margin: '0 0 32px 0',
                          textAlign: 'center',
                        }}
                      >
                        O Homologante
                      </p>
                      <div
                        className="ficha-sig-line"
                        style={{
                          width: '250px',
                          borderBottom: '1px solid #000000',
                          margin: '0 auto',
                          height: '1px',
                        }}
                      />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* OPÇÃO 3: FORMULÁRIO DE CADASTRO (ESTRUTURA COMPLETA ANEXO III)    */}
      {/* ================================================================= */}
      {avaliacaoSubView === 'form' && (
        <div className="no-print bg-white rounded-[24px] border border-slate-200 p-6 sm:p-8 shadow-xs space-y-7">
          {/* Duplicate Warning */}
          {duplicateWarning && duplicateWarning.duplicateRecord && (
            <div
              role="alert"
              className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-amber-950"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm space-y-1 flex-1">
                <p className="font-bold">
                  Já existe uma Ficha de Avaliação registada para o Agente nº{' '}
                  {duplicateWarning.duplicateRecord.agente}
                </p>
                <p>
                  Consta <strong>{duplicateWarning.duplicateRecord.nome}</strong> avaliado em{' '}
                  {formatAvaliacaoDateShort(duplicateWarning.duplicateRecord.dataAval)}.
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

          {formErrorBanner && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-[#d92d20] text-xs sm:text-sm font-semibold"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{formErrorBanner}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-slate-600 m-0">
              <span className="text-[#d92d20] font-bold">*</span> Campo obrigatório
            </p>
            {formData.id && (
              <span className="text-xs font-semibold text-amber-800">
                A editar Ficha de {formData.nome || 'Docente'}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            {/* SECÇÃO 1: Identificação do avaliado */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  1. Identificação do avaliado
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                <div>
                  <label
                    htmlFor="f-aval-provincia"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    a) Província
                  </label>
                  <input
                    id="f-aval-provincia"
                    type="text"
                    value={formData.provincia}
                    onChange={(e) => handleFieldChange('provincia', e.target.value)}
                    placeholder="Ex.: Malanje"
                    className={pillInputClass(false)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="f-aval-municipio"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    b) Município
                  </label>
                  <input
                    id="f-aval-municipio"
                    type="text"
                    value={formData.municipio}
                    onChange={(e) => handleFieldChange('municipio', e.target.value)}
                    placeholder="Ex.: Quêssua"
                    className={pillInputClass(false)}
                  />
                </div>

                <div className="md:col-span-1">
                  <label
                    htmlFor="f-aval-dataAval"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Data de avaliação <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-aval-dataAval"
                    type="date"
                    value={formData.dataAval}
                    onChange={(e) => handleFieldChange('dataAval', e.target.value)}
                    onBlur={() => handleFieldBlur('dataAval')}
                    className={pillInputClass(Boolean(errors.dataAval))}
                  />
                  {errors.dataAval && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.dataAval}</p>
                  )}
                </div>

                {/* Escola / Instituição com sugestões + escrita livre */}
                <div className="md:col-span-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="f-aval-escola"
                      className="block text-[13px] font-semibold text-slate-800"
                    >
                      c) Escola / instituição
                    </label>
                    <span className="text-[11px] text-slate-500">
                      (Pode selecionar da lista oficial ou escrever qualquer escola)
                    </span>
                  </div>

                  <div className="relative" ref={schoolDropdownRef}>
                    <div className="relative flex items-center">
                      <input
                        id="f-aval-escola"
                        type="text"
                        autoComplete="off"
                        value={formData.escola}
                        onChange={(e) => {
                          handleFieldChange('escola', e.target.value);
                          setShowSchoolSuggestions(true);
                        }}
                        onFocus={() => setShowSchoolSuggestions(true)}
                        placeholder="Selecione uma escola do Quêssua ou escreva o nome da instituição..."
                        className={`${pillInputClass(false)} pr-20`}
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
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowSchoolSuggestions((prev) => !prev)}
                          className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Ver escolas cadastradas"
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
                          <span>Escolas Disponíveis ({schoolSuggestions.length})</span>
                          {formData.escola.trim() && !isExactRegisteredSchool && (
                            <span className="text-amber-600 font-semibold normal-case">
                              Escola personalizada
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
                                Esta escola personalizada será utilizada na Ficha de Avaliação.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowSchoolSuggestions(false)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shrink-0 cursor-pointer"
                            >
                              Confirmar
                            </button>
                          </div>
                        )}

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
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="f-aval-nome"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Nome completo <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-aval-nome"
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleFieldChange('nome', e.target.value)}
                    onBlur={() => handleFieldBlur('nome')}
                    placeholder="Nome completo do docente avaliado"
                    className={pillInputClass(Boolean(errors.nome))}
                  />
                  {errors.nome && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.nome}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="f-aval-agente"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Agente nº <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-aval-agente"
                    type="text"
                    value={formData.agente}
                    onChange={(e) => handleFieldChange('agente', e.target.value)}
                    onBlur={() => handleFieldBlur('agente')}
                    placeholder="Ex.: 88212320"
                    className={`${pillInputClass(Boolean(errors.agente))} font-mono`}
                  />
                  {errors.agente && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.agente}</p>
                  )}
                </div>

                <div className="md:col-span-3">
                  <label
                    htmlFor="f-aval-categoria"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Categoria <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-aval-categoria"
                    type="text"
                    list="categorias-docente-datalist"
                    value={formData.categoria}
                    onChange={(e) => handleFieldChange('categoria', e.target.value)}
                    onBlur={() => handleFieldBlur('categoria')}
                    placeholder="Ex.: P.E.P.E.S. Auxiliar do 3º Grau"
                    className={pillInputClass(Boolean(errors.categoria))}
                  />
                  <datalist id="categorias-docente-datalist">
                    {CATEGORIAS_DOCENTE_SUGGESTIONS.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {CATEGORIAS_DOCENTE_SUGGESTIONS.slice(0, 6).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleFieldChange('categoria', cat)}
                        className="text-[11px] bg-[#f2f4f7] hover:bg-slate-200/80 text-slate-800 font-medium rounded-full px-3 py-1 transition-colors cursor-pointer"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  {errors.categoria && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.categoria}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECÇÃO 2: Período a que respeita a avaliação */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  2. Período a que respeita a avaliação
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label
                    htmlFor="f-aval-de"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    De
                  </label>
                  <input
                    id="f-aval-de"
                    type="date"
                    value={formData.de}
                    onChange={(e) => handleFieldChange('de', e.target.value)}
                    className={pillInputClass(false)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="f-aval-ate"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    A
                  </label>
                  <input
                    id="f-aval-ate"
                    type="date"
                    value={formData.ate}
                    onChange={(e) => handleFieldChange('ate', e.target.value)}
                    className={pillInputClass(false)}
                  />
                </div>
              </div>
            </div>

            {/* SECÇÃO 3: Classificação dos indicadores (por trimestre) */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  3. Classificação dos indicadores (por trimestre)
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <datalist id="qualitativa-suggestions-list">
                {QUALITATIVA_SUGGESTIONS.map((q) => (
                  <option key={q} value={q} />
                ))}
              </datalist>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full border-collapse text-xs min-w-[680px]">
                  <thead className="bg-[#f8f9fa]">
                    <tr>
                      <th className="w-12 px-3 py-2.5 border-b border-r border-slate-200 text-center font-bold text-slate-700">
                        Nº
                      </th>
                      <th className="px-3.5 py-2.5 border-b border-r border-slate-200 text-left font-bold text-slate-700">
                        Indicadores
                      </th>
                      <th className="w-28 px-2.5 py-2.5 border-b border-r border-slate-200 text-center font-bold text-slate-700">
                        I Trim
                      </th>
                      <th className="w-28 px-2.5 py-2.5 border-b border-r border-slate-200 text-center font-bold text-slate-700">
                        II Trim
                      </th>
                      <th className="w-28 px-2.5 py-2.5 border-b border-r border-slate-200 text-center font-bold text-slate-700">
                        III Trim
                      </th>
                      <th className="w-28 px-2.5 py-2.5 border-b border-slate-200 text-center font-bold text-slate-700">
                        Média
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {INDICADORES_AVALIACAO.map((indLabel, i) => (
                      <tr key={indLabel} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2 border-r border-slate-200 text-center font-bold text-slate-600">
                          {i + 1}
                        </td>
                        <td className="px-3.5 py-2 border-r border-slate-200 font-medium text-slate-900">
                          {indLabel}
                        </td>
                        {[0, 1, 2].map((t) => (
                          <td key={t} className="p-1.5 border-r border-slate-200">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={formData.notas[i]?.[t] ?? ''}
                              onChange={(e) => handleNotaChange(i, t, e.target.value)}
                              placeholder="—"
                              className="w-full h-9 px-2 rounded-lg border border-slate-300 text-center font-mono text-xs text-slate-900 focus:border-slate-900 outline-none"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center font-mono font-bold text-slate-900 bg-slate-50">
                          {formatAvaliacaoNumber(formMetrics.mediasIndicadores[i]) || '—'}
                        </td>
                      </tr>
                    ))}

                    {/* Classificação quantitativa */}
                    <tr className="bg-slate-50 font-bold">
                      <td
                        colSpan={2}
                        className="px-3.5 py-2.5 border-r border-slate-200 text-center text-slate-900"
                      >
                        Classificação quantitativa
                      </td>
                      <td className="px-2.5 py-2.5 border-r border-slate-200 text-center font-mono text-slate-900">
                        {formatAvaliacaoNumber(formMetrics.quantTrim[0]) || '—'}
                      </td>
                      <td className="px-2.5 py-2.5 border-r border-slate-200 text-center font-mono text-slate-900">
                        {formatAvaliacaoNumber(formMetrics.quantTrim[1]) || '—'}
                      </td>
                      <td className="px-2.5 py-2.5 border-r border-slate-200 text-center font-mono text-slate-900">
                        {formatAvaliacaoNumber(formMetrics.quantTrim[2]) || '—'}
                      </td>
                      <td className="px-2.5 py-2.5 text-center font-mono text-emerald-800">
                        {formatAvaliacaoNumber(formMetrics.quantMedia) || '—'}
                      </td>
                    </tr>

                    {/* Classificação qualitativa (preenchimento automático) */}
                    <tr className="bg-slate-50/70">
                      <td
                        colSpan={2}
                        className="px-3.5 py-2 border-r border-slate-200 text-center font-bold text-slate-900"
                      >
                        Classificação qualitativa
                      </td>
                      {([0, 1, 2, 3] as const).map((colIdx) => (
                        <td
                          key={colIdx}
                          className={`p-1.5 ${colIdx < 3 ? 'border-r border-slate-200' : ''}`}
                        >
                          <input
                            type="text"
                            readOnly
                            tabIndex={-1}
                            value={formMetrics.qualTrim[colIdx] || '—'}
                            aria-label={`Classificação qualitativa automática coluna ${colIdx + 1}`}
                            className={`w-full h-9 px-2 rounded-lg border border-slate-200 bg-slate-100/80 text-center text-xs font-bold outline-none cursor-default ${
                              colIdx === 3 ? 'text-emerald-800' : 'text-slate-900'
                            }`}
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECÇÃO 4: Classificação anual dos indicadores */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  4. Classificação anual dos indicadores
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full border-collapse text-xs min-w-[540px]">
                  <thead className="bg-[#f8f9fa]">
                    <tr>
                      <th className="w-12 px-3 py-2.5 border-b border-r border-slate-200 text-center font-bold text-slate-700">
                        Nº
                      </th>
                      <th className="px-3.5 py-2.5 border-b border-r border-slate-200 text-left font-bold text-slate-700">
                        Indicadores
                      </th>
                      <th className="w-40 px-3 py-2.5 border-b border-slate-200 text-center font-bold text-slate-700">
                        Média final
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ANUAL_INDICADORES_ORDER.map((indIdx, pos) => (
                      <tr key={indIdx}>
                        <td className="px-3 py-2 border-r border-slate-200 text-center font-bold text-slate-600">
                          {pos + 1}
                        </td>
                        <td className="px-3.5 py-2 border-r border-slate-200 text-slate-900">
                          {INDICADORES_AVALIACAO[indIdx]}
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-slate-900 bg-slate-50">
                          {formatAvaliacaoNumber(formMetrics.anualMedias[pos]) || '—'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold">
                      <td
                        colSpan={2}
                        className="px-3.5 py-2.5 border-r border-slate-200 text-center text-slate-900"
                      >
                        Final quantitativa
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-emerald-800">
                        {formatAvaliacaoNumber(formMetrics.finalQuant) || '—'}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/70">
                      <td
                        colSpan={2}
                        className="px-3.5 py-2 border-r border-slate-200 text-center font-bold text-slate-900"
                      >
                        Final qualitativa
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          readOnly
                          tabIndex={-1}
                          value={formMetrics.finalQual || '—'}
                          aria-label="Classificação final qualitativa automática"
                          className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-100/80 text-center font-bold text-xs text-emerald-800 outline-none cursor-default"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECÇÃO 5: Apreciação geral */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  5. Apreciação geral (Comentários dos avaliadores por trimestre)
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label
                    htmlFor="f-aval-c1"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Comentário 1 (I Trimestre)
                  </label>
                  <textarea
                    id="f-aval-c1"
                    rows={2}
                    value={formData.c1}
                    onChange={(e) => handleFieldChange('c1', e.target.value)}
                    placeholder="Apreciação do I Trimestre..."
                    className="w-full p-3 rounded-2xl border border-slate-300 bg-white text-sm text-slate-900 focus:border-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="f-aval-c2"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Comentário 2 (II Trimestre)
                  </label>
                  <textarea
                    id="f-aval-c2"
                    rows={2}
                    value={formData.c2}
                    onChange={(e) => handleFieldChange('c2', e.target.value)}
                    placeholder="Apreciação do II Trimestre..."
                    className="w-full p-3 rounded-2xl border border-slate-300 bg-white text-sm text-slate-900 focus:border-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="f-aval-c3"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Comentário 3 (III Trimestre)
                  </label>
                  <textarea
                    id="f-aval-c3"
                    rows={2}
                    value={formData.c3}
                    onChange={(e) => handleFieldChange('c3', e.target.value)}
                    placeholder="Apreciação do III Trimestre..."
                    className="w-full p-3 rounded-2xl border border-slate-300 bg-white text-sm text-slate-900 focus:border-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="f-aval-cf"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Comentário final
                  </label>
                  <textarea
                    id="f-aval-cf"
                    rows={2}
                    value={formData.cf}
                    onChange={(e) => handleFieldChange('cf', e.target.value)}
                    placeholder="Síntese anual do desempenho docente..."
                    className="w-full p-3 rounded-2xl border border-slate-300 bg-white text-sm text-slate-900 focus:border-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECÇÃO 6: Avaliador */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  6. Avaliador
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                <div>
                  <label
                    htmlFor="f-aval-avNome"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Nome
                  </label>
                  <input
                    id="f-aval-avNome"
                    type="text"
                    value={formData.avNome}
                    onChange={(e) => handleFieldChange('avNome', e.target.value)}
                    placeholder="Nome do avaliador"
                    className={pillInputClass(false)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="f-aval-avFuncao"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Função
                  </label>
                  <input
                    id="f-aval-avFuncao"
                    type="text"
                    value={formData.avFuncao}
                    onChange={(e) => handleFieldChange('avFuncao', e.target.value)}
                    placeholder="Ex.: Director da Escola / Director Municipal"
                    className={pillInputClass(false)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="f-aval-avData"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Data
                  </label>
                  <input
                    id="f-aval-avData"
                    type="date"
                    value={formData.avData}
                    onChange={(e) => handleFieldChange('avData', e.target.value)}
                    className={pillInputClass(false)}
                  />
                </div>
              </div>
            </div>

            {/* SECÇÃO 7: Concordância com a avaliação */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  7. Concordância com a avaliação
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 items-end">
                <div>
                  <span className="block text-[13px] font-semibold text-slate-800 mb-2">
                    Posição do avaliado
                  </span>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-300 bg-white text-sm font-medium text-slate-800 cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="conc"
                        checked={formData.conc === 'Sim'}
                        onChange={() => handleFieldChange('conc', 'Sim')}
                        className="accent-slate-900"
                      />
                      <span>Concordo</span>
                    </label>
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-300 bg-white text-sm font-medium text-slate-800 cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="conc"
                        checked={formData.conc === 'Não'}
                        onChange={() => handleFieldChange('conc', 'Não')}
                        className="accent-slate-900"
                      />
                      <span>Não concordo</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="f-aval-avdData"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Data (assinatura do avaliado)
                  </label>
                  <input
                    id="f-aval-avdData"
                    type="date"
                    value={formData.avdData}
                    onChange={(e) => handleFieldChange('avdData', e.target.value)}
                    className={pillInputClass(false)}
                  />
                </div>
              </div>
            </div>

            {/* Submit & Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="h-11 px-7 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {!isAdminOrDirector
                      ? 'Submeter Ficha à Administração Municipal'
                      : formData.id
                      ? 'Salvar alterações na Ficha'
                      : 'Guardar na Base de Dados & Gerar Ficha A4'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="h-11 px-5 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Limpar</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Confirmação de Eliminação */}
      {recordToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="no-print fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-[#d92d20] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Eliminar Ficha de Avaliação?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Tem a certeza que pretende eliminar a ficha de avaliação de{' '}
                  <strong>{recordToDelete.nome}</strong> (Agente nº {recordToDelete.agente})?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="h-9 px-4 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteFichaAvaliacaoRecord(recordToDelete.id);
                  if (formData.id === recordToDelete.id) {
                    handleResetForm();
                  }
                  setRecordToDelete(null);
                  reloadRecords();
                  showToast('Ficha de Avaliação eliminada.');
                }}
                className="h-9 px-4 rounded-full bg-[#d92d20] hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
              >
                Confirmar Eliminação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
