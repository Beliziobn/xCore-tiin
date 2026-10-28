import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Printer,
  FileDown,
  Copy,
  Check,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  AlertTriangle,
  Eye,
  Landmark,
  ShieldCheck,
  Database,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import emblemAngolaImg from '../../assets/images/Emblem_of_Angola.svg.webp';
import {
  DeclaracaoServicoRecord,
  ANGOLA_PROVINCIAS_SERVICO,
  ANGOLA_BANCOS_SERVICO,
  fmtDateDeclaracaoServico,
  parseKz,
  fmtKz,
  extensoKz,
  getStoredDeclaracaoServicoRecords,
  saveDeclaracaoServicoRecord,
  deleteDeclaracaoServicoRecord,
  syncDeclaracaoServicoFromServer,
  findDuplicateDeclaracaoServico,
} from '../../utils/declaracaoServicoStorage';
import {
  downloadDeclaracaoServicoPdf,
  printSinglePageA4Clean,
} from '../../utils/declaracaoPdfGenerator';
import { subscribeToDeclaracaoServico } from '../../utils/firestoreSync';
import type { UserAccount } from '../../types';
import { submitQuickServiceRequest } from '../../utils/quickServicesStorage';

export interface DeclaracaoServicoSectionProps {
  isLoggedIn?: boolean;
  currentUser?: UserAccount | null;
}

interface DeclaracaoServicoFormState {
  id?: string;
  ref?: string;
  criadoEm?: string;

  // I. Identificação pessoal
  tratamento: '' | 'Senhor' | 'Senhora';
  nome: string;
  nascimento: string;
  naturalidade: string;
  provNat: string;

  // II. Filiação
  pai: string;
  mae: string;

  // III. Bilhete de Identidade
  bi: string;
  biData: string;

  // IV. Situação profissional
  profissao: string;
  grau: string;
  categoria: string;
  agente: string;
  municipio: string;
  escola: string;

  // V. Conta bancária e salário
  banco: string;
  bancoOutro: string;
  conta: string;
  salario: string;

  // VI. Finalidade
  finalidade: string;

  // VII. Dados da emissão
  provEmissao: string;
  municipioAdm: string;
  direccao: string;
  localEmissao: string;
  dataEmissao: string;
  director: string;
}

function getTodayIso(): string {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function getInitialServicoFormState(): DeclaracaoServicoFormState {
  return {
    tratamento: 'Senhor',
    nome: '',
    nascimento: '',
    naturalidade: 'Malanje',
    provNat: 'Malanje',
    pai: '',
    mae: '',
    bi: '',
    biData: '',
    profissao: 'Professor do Ensino Primário',
    grau: '11º Grau',
    categoria: 'P.E.P.E.S do 11º',
    agente: '',
    municipio: 'Quêssua',
    escola: 'Complexo Escolar Católico n.º 166 MJE São Pedro – Quêssua',
    banco: 'Banco Sol',
    bancoOutro: '',
    conta: '',
    salario: '',
    finalidade: 'à regularização da conta bancária',
    provEmissao: 'Malanje',
    municipioAdm: 'Quêssua',
    direccao: 'Direcção Municipal de Educação',
    localEmissao: 'Quêssua',
    dataEmissao: getTodayIso(),
    director: 'Belizio Miguel dos Santos António',
  };
}

export const DeclaracaoServicoSection: React.FC<DeclaracaoServicoSectionProps> = ({
  isLoggedIn = false,
  currentUser,
}) => {
  const isAdminOrDirector = Boolean(
    isLoggedIn &&
      currentUser &&
      (currentUser.role === 'admin' || currentUser.role === 'diretor')
  );
  const [records, setRecords] = useState<DeclaracaoServicoRecord[]>(() =>
    getStoredDeclaracaoServicoRecords()
  );
  const [formData, setFormData] = useState<DeclaracaoServicoFormState>(() =>
    getInitialServicoFormState()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formErrorBanner, setFormErrorBanner] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<DeclaracaoServicoRecord | null>(null);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recordToDelete, setRecordToDelete] = useState<DeclaracaoServicoRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [servicoSubView, setServicoSubView] = useState<'database' | 'preview' | 'form'>('form');

  const todayISO = useMemo(() => getTodayIso(), []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const reloadRecords = () => {
    setRecords(getStoredDeclaracaoServicoRecords());
  };

  useEffect(() => {
    reloadRecords();
    syncDeclaracaoServicoFromServer()
      .then((synced) => {
        if (Array.isArray(synced)) setRecords(synced);
      })
      .catch(() => {});

    const unsub = subscribeToDeclaracaoServico(() => {
      syncDeclaracaoServicoFromServer()
        .then((synced) => {
          if (Array.isArray(synced)) setRecords(synced);
        })
        .catch(() => {});
    });

    const handleUpdated = () => reloadRecords();
    window.addEventListener('sigre-declaracao-servico-updated', handleUpdated);

    return () => {
      unsub();
      window.removeEventListener('sigre-declaracao-servico-updated', handleUpdated);
    };
  }, []);

  // Salary in words (Por extenso)
  const salarioNumero = useMemo(() => parseKz(formData.salario), [formData.salario]);
  const salarioExtenso = useMemo(
    () => (salarioNumero > 0 ? extensoKz(salarioNumero) : ''),
    [salarioNumero]
  );

  // Live preview record derived from current formData (or submittedRecord if explicitly viewing one)
  const livePreviewRecord: DeclaracaoServicoRecord = useMemo(() => {
    if (submittedRecord) return submittedRecord;
    const salKz = parseKz(formData.salario);
    const ext = salKz > 0 ? extensoKz(salKz) : 'valor por extenso';
    const bancoFinal =
      formData.banco === 'Outro'
        ? formData.bancoOutro.trim() || 'Banco Comercial'
        : formData.banco.trim() || 'Banco Comercial';

    return {
      id: formData.id || 'preview-live',
      ref: formData.ref || 'PRE-VISUALIZAÇÃO',
      criadoEm: formData.criadoEm || todayISO,
      tratamento: (formData.tratamento as 'Senhor' | 'Senhora') || 'Senhor',
      nome: formData.nome.trim() || '[Nome Completo do Funcionário]',
      nascimento: formData.nascimento.trim() || '1988-05-12',
      naturalidade: formData.naturalidade.trim() || 'Malanje',
      provNat: formData.provNat.trim() || 'Malanje',
      pai: formData.pai.trim() || '[Nome do Pai]',
      mae: formData.mae.trim() || '[Nome da Mãe]',
      bi: formData.bi.trim().toUpperCase() || '[000000000AA000]',
      biData: formData.biData.trim() || todayISO,
      profissao: formData.profissao.trim() || 'Professor do Ensino Primário',
      grau: formData.grau.trim() || '11º Grau',
      categoria: formData.categoria.trim() || 'P.E.P.E.S do 11º',
      agente: formData.agente.trim() || '[Nº Agente]',
      municipio: formData.municipio.trim() || 'Quêssua',
      escola:
        formData.escola.trim() ||
        'Complexo Escolar Católico n.º 166 MJE São Pedro – Quêssua',
      banco: formData.banco.trim() || 'Banco Sol',
      bancoOutro: formData.bancoOutro.trim(),
      bancoNome: bancoFinal,
      conta: formData.conta.trim() || '[0000-000000-000]',
      salario: salKz > 0 ? fmtKz(salKz) : '0,00',
      salarioKz: salKz,
      extenso: ext,
      finalidade: formData.finalidade.trim() || 'à regularização da conta bancária',
      provEmissao: formData.provEmissao.trim() || 'Malanje',
      municipioAdm: formData.municipioAdm.trim() || 'Quêssua',
      direccao: formData.direccao.trim() || 'Direcção Municipal de Educação',
      localEmissao: formData.localEmissao.trim() || 'Quêssua',
      dataEmissao: formData.dataEmissao.trim() || todayISO,
      director: formData.director.trim() || 'Belizio Miguel dos Santos António',
    };
  }, [formData, submittedRecord, todayISO]);

  // Real-time duplicate check in Declaração de Serviço database
  const duplicateWarning = useMemo(() => {
    if (!formData.bi && !formData.agente) return null;
    const dup = findDuplicateDeclaracaoServico(formData.bi, formData.agente, formData.id);
    return dup.isDuplicate ? dup : null;
  }, [formData.bi, formData.agente, formData.id, records]);

  // Field validation
  const validateSingleField = (
    name: keyof DeclaracaoServicoFormState,
    val: string,
    currentState: DeclaracaoServicoFormState
  ): string => {
    const v = (val || '').trim();

    switch (name) {
      case 'tratamento':
        if (!v) return 'Escolha o tratamento.';
        return '';
      case 'nome':
        if (!v) return 'Indique o nome completo.';
        if (v.split(/\s+/).length < 2) return 'Escreva o nome e o apelido.';
        return '';
      case 'nascimento':
        if (!v) return 'Indique a data de nascimento.';
        if (v > todayISO) return 'A data não pode ser futura.';
        return '';
      case 'naturalidade':
        if (!v) return 'Indique o município de naturalidade.';
        return '';
      case 'provNat':
        if (!v) return 'Escolha a província.';
        return '';
      case 'mae':
        if (!v) return 'Indique o nome da mãe.';
        return '';
      case 'bi': {
        const clean = v.toUpperCase().replace(/\s/g, '');
        if (!clean) return 'Indique o número do BI.';
        if (!/^\d{9}[A-Z]{2}\d{3}$/.test(clean)) {
          return 'O BI tem 9 números, 2 letras e 3 números. Exemplo: 000000000AA000.';
        }
        return '';
      }
      case 'biData':
        if (!v) return 'Indique a data de emissão do BI.';
        if (v > todayISO) return 'A data não pode ser futura.';
        return '';
      case 'profissao':
        if (!v) return 'Escolha a profissão.';
        return '';
      case 'grau':
        if (!v) return 'Indique o grau.';
        return '';
      case 'categoria':
        if (!v || v.toUpperCase() === 'P.E.P.E.S DO') {
          return 'Indique o grau na categoria (ex.: P.E.P.E.S do 12º).';
        }
        return '';
      case 'agente':
        if (!v) return 'Indique o número de agente.';
        if (!/^\d{4,12}$/.test(v)) return 'Use só números, entre 4 e 12 dígitos.';
        return '';
      case 'municipio':
        if (!v) return 'Indique o município de colocação.';
        return '';
      case 'escola':
        if (!v) return 'Indique a escola ou o local de trabalho.';
        return '';
      case 'banco':
        if (!v) return 'Escolha o banco.';
        return '';
      case 'bancoOutro':
        if (currentState.banco === 'Outro' && !v) return 'Indique o nome do banco.';
        return '';
      case 'conta':
        if (!v) return 'Indique o número da conta.';
        if (!/^[0-9A-Za-z][0-9A-Za-z\- ]{5,}$/.test(v)) {
          return 'Confira o número da conta. Use letras, números e hífens.';
        }
        return '';
      case 'salario':
        if (!v) return 'Indique o salário líquido.';
        if (!(parseKz(v) > 0)) return 'Indique um valor maior que zero.';
        return '';
      case 'finalidade':
        if (!v) return 'Indique a finalidade da declaração.';
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (field: keyof DeclaracaoServicoFormState, rawValue: string) => {
    let value = rawValue;
    if (field === 'bi') {
      value = rawValue.toUpperCase().replace(/\s/g, '');
    }

    if (submittedRecord) {
      setSubmittedRecord(null);
    }

    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'banco' && value !== 'Outro') {
        next.bancoOutro = '';
      }
      if (touched[field] || errors[field]) {
        const msg = validateSingleField(field, value, next);
        setErrors((prevErr) => ({ ...prevErr, [field]: msg }));
      }
      return next;
    });
  };

  const handleFieldBlur = (field: keyof DeclaracaoServicoFormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFormData((prev) => {
      const next = { ...prev };
      if (field === 'salario') {
        const n = parseKz(prev.salario);
        if (n > 0) {
          next.salario = fmtKz(n);
        }
      }
      const msg = validateSingleField(field, String(next[field] || ''), next);
      setErrors((prevErr) => ({ ...prevErr, [field]: msg }));
      return next;
    });
  };

  const handleSelectChip = (text: string) => {
    if (submittedRecord) setSubmittedRecord(null);
    setFormData((prev) => ({ ...prev, finalidade: text }));
    setErrors((prev) => ({ ...prev, finalidade: '' }));
  };

  const handleResetForm = () => {
    setFormData(getInitialServicoFormState());
    setErrors({});
    setTouched({});
    setFormErrorBanner(null);
    setSubmittedRecord(null);
    setCopyNote(null);
    setServicoSubView('form');
    showToast('Formulário de Declaração de Serviço limpo.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const requiredKeys: (keyof DeclaracaoServicoFormState)[] = [
      'tratamento',
      'nome',
      'nascimento',
      'naturalidade',
      'provNat',
      'mae',
      'bi',
      'biData',
      'profissao',
      'grau',
      'categoria',
      'agente',
      'municipio',
      'escola',
      'banco',
      ...(formData.banco === 'Outro' ? (['bancoOutro'] as (keyof DeclaracaoServicoFormState)[]) : []),
      'conta',
      'salario',
      'finalidade',
    ];

    const newErrors: Record<string, string> = {};
    let firstInvalidField: string | null = null;

    requiredKeys.forEach((k) => {
      const msg = validateSingleField(k, String(formData[k] || ''), formData);
      if (msg) {
        newErrors[k] = msg;
        if (!firstInvalidField) firstInvalidField = k;
      }
    });

    setErrors(newErrors);

    if (firstInvalidField) {
      setFormErrorBanner('Há campos obrigatórios por corrigir. Confira as mensagens assinaladas.');
      const el = document.getElementById(`f-servico-${firstInvalidField}`);
      if (el) el.focus();
      return;
    }

    setFormErrorBanner(null);

    // Regra de privacidade: Cidadão sem sessão iniciada apenas preenche o seu e envia para a Admin
    if (!isAdminOrDirector) {
      submitQuickServiceRequest({
        serviceType: 'DECLARACAO_SERVICO',
        title: `Declaração de Serviço - ${formData.nome.trim()}`,
        requesterName: formData.nome.trim(),
        requesterPhone: formData.bi.trim(),
        requesterRoleTitle: formData.profissao || 'Docente',
        targetRole: 'ADMIN',
        targetAdminEmail: 'dmedoquessua@gmail.com',
        details: {
          employeeName: formData.nome.trim(),
          employeeBi: formData.bi.trim().toUpperCase(),
          employeeAgente: formData.agente.trim(),
          employeeSchoolOrDepartment: formData.escola,
          employeeCategory: formData.categoria,
          referenceMonthYear: formData.dataEmissao,
          purpose: formData.finalidade,
        },
      }).then((req) => {
        showToast(`Pedido de Declaração de Serviço enviado com sucesso para a Admin Municipal! Protocolo: ${req.protocol}`);
        handleResetForm();
      }).catch(() => {
        showToast('Erro ao enviar para a Administração.');
      });
      return;
    }

    const salKz = parseKz(formData.salario);
    const ext = extensoKz(salKz);
    const bancoFinal = formData.banco === 'Outro' ? formData.bancoOutro.trim() : formData.banco.trim();

    const saveRes = saveDeclaracaoServicoRecord({
      id: formData.id,
      ref: formData.ref,
      criadoEm: formData.criadoEm,
      tratamento: formData.tratamento as 'Senhor' | 'Senhora',
      nome: formData.nome.trim(),
      nascimento: formData.nascimento.trim(),
      naturalidade: formData.naturalidade.trim(),
      provNat: formData.provNat.trim(),
      pai: formData.pai.trim(),
      mae: formData.mae.trim(),
      bi: formData.bi.trim().toUpperCase(),
      biData: formData.biData.trim(),
      profissao: formData.profissao.trim(),
      grau: formData.grau.trim(),
      categoria: formData.categoria.trim(),
      agente: formData.agente.trim(),
      municipio: formData.municipio.trim(),
      escola: formData.escola.trim(),
      banco: formData.banco.trim(),
      bancoOutro: formData.bancoOutro.trim(),
      bancoNome: bancoFinal,
      conta: formData.conta.trim(),
      salario: fmtKz(salKz),
      salarioKz: salKz,
      extenso: ext,
      finalidade: formData.finalidade.trim(),
      provEmissao: formData.provEmissao.trim() || 'Malanje',
      municipioAdm: formData.municipioAdm.trim() || 'Quêssua',
      direccao: formData.direccao.trim() || 'Direcção Municipal de Educação',
      localEmissao: formData.localEmissao.trim() || 'Quêssua',
      dataEmissao: formData.dataEmissao.trim() || todayISO,
      director: formData.director.trim() || 'Belizio Miguel dos Santos António',
    });

    if (!saveRes.success || !saveRes.record) {
      setFormErrorBanner(saveRes.error || 'Erro ao guardar o cadastro.');
      return;
    }

    reloadRecords();
    setSubmittedRecord(saveRes.record);
    setServicoSubView('preview');
    setCopyNote(null);
    showToast(
      formData.id
        ? `Declaração de Serviço de ${saveRes.record.nome} actualizada!`
        : `Declaração de Serviço registada com sucesso (${saveRes.record.ref})!`
    );
  };

  const handleExportCsv = () => {
    if (!records.length) return;
    const cols: (keyof DeclaracaoServicoRecord)[] = [
      'ref',
      'criadoEm',
      'tratamento',
      'nome',
      'nascimento',
      'naturalidade',
      'provNat',
      'pai',
      'mae',
      'bi',
      'biData',
      'profissao',
      'grau',
      'categoria',
      'agente',
      'municipio',
      'escola',
      'bancoNome',
      'conta',
      'salarioKz',
      'extenso',
      'finalidade',
      'provEmissao',
      'municipioAdm',
      'direccao',
      'localEmissao',
      'dataEmissao',
      'director',
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
    a.download = 'cadastro-pessoal-declaracao-servico.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Ficheiro CSV exportado com sucesso.');
  };

  const handleEditRecord = (r: DeclaracaoServicoRecord) => {
    setFormData({
      id: r.id,
      ref: r.ref,
      criadoEm: r.criadoEm,
      tratamento: r.tratamento,
      nome: r.nome,
      nascimento: r.nascimento,
      naturalidade: r.naturalidade,
      provNat: r.provNat,
      pai: r.pai || '',
      mae: r.mae,
      bi: r.bi,
      biData: r.biData,
      profissao: r.profissao,
      grau: r.grau,
      categoria: r.categoria,
      agente: r.agente,
      municipio: r.municipio,
      escola: r.escola,
      banco: r.banco,
      bancoOutro: r.bancoOutro || '',
      conta: r.conta,
      salario: fmtKz(r.salarioKz),
      finalidade: r.finalidade,
      provEmissao: r.provEmissao || 'Malanje',
      municipioAdm: r.municipioAdm || 'Quêssua',
      direccao: r.direccao || 'Direcção Municipal de Educação',
      localEmissao: r.localEmissao || 'Quêssua',
      dataEmissao: r.dataEmissao || todayISO,
      director: r.director || 'Belizio Miguel dos Santos António',
    });
    setSubmittedRecord(null);
    setErrors({});
    setFormErrorBanner(null);
    setServicoSubView('form');
    showToast(`Registo de ${r.nome} (${r.ref}) carregado para edição e pré-visualização.`);
  };

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [r.ref, r.nome, r.bi, r.agente, r.municipio, r.escola, r.bancoNome]
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
    <div id="declaracao-servico-module" className="w-full space-y-6 animate-in fade-in duration-150">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="no-print fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* EXEMPLAR HEADER: Circular Icon + Title + Subtitle + Hairline      */}
      {/* ================================================================= */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#f2f4f7] border border-slate-200/80 flex items-center justify-center text-slate-800 shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Declaração de Serviço
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
              onClick={() => downloadDeclaracaoServicoPdf(livePreviewRecord)}
              className="h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>
            <button
              type="button"
              onClick={() => printSinglePageA4Clean('declaracao-servico-a4-sheet')}
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
            onClick={() => setServicoSubView('database')}
            className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              servicoSubView === 'database'
                ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>Base de Dados ({records.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setServicoSubView('preview')}
            className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              servicoSubView === 'preview'
                ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Pré-visualização</span>
          </button>

          <button
            type="button"
            onClick={() => setServicoSubView('form')}
            className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              servicoSubView === 'form'
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
      {/* OPÇÃO 1: BASE DE DADOS DA DECLARAÇÃO DE SERVIÇO                   */}
      {/* ================================================================= */}
      {servicoSubView === 'database' && (
        <section
          id="servico-admin-list"
          className="no-print bg-white rounded-[24px] border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#f2f4f7] flex items-center justify-center text-slate-700">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Base de Dados — Declaração de Serviço ({records.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Selecione qualquer funcionário cadastrado para carregar ou imprimir a declaração
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
                  placeholder="Procurar nome, BI ou agente..."
                  aria-label="Procurar registos"
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
                    Ref.
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Nome Completo
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    B.I.
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Nº Agente
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Banco & Conta
                  </th>
                  <th className="text-right px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Salário (Kz)
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
                      Nenhum registo encontrado na Base de Dados de Declaração de Serviço.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        formData.id === r.id || submittedRecord?.id === r.id ? 'bg-slate-100/80' : ''
                      }`}
                    >
                      <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap font-semibold text-slate-900">
                        {r.ref}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap font-semibold text-slate-900">
                        {r.nome}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap text-slate-700">
                        {r.bi}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap text-slate-700">
                        {r.agente}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-700">
                        <span className="font-medium">{r.bancoNome}</span> •{' '}
                        <span className="font-mono text-[11px] text-slate-500">{r.conta}</span>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap text-right font-semibold text-slate-900 tabular-nums">
                        {typeof r.salarioKz === 'number' ? fmtKz(r.salarioKz) : r.salario}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleEditRecord(r);
                              setServicoSubView('preview');
                            }}
                            className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1"
                            title="Ver pré-visualização da declaração"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver Documento</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadDeclaracaoServicoPdf(r)}
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
        id="servico-live-preview-panel"
        aria-live="polite"
        className={`${
          servicoSubView === 'preview' ? 'block' : 'hidden print:block'
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
                  Pré-visualização em Tempo Real — Declaração de Serviço
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
                onClick={() => handleFieldChange('tratamento', 'Senhor')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  livePreviewRecord.tratamento !== 'Senhora'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Senhor
              </button>
              <button
                type="button"
                onClick={() => handleFieldChange('tratamento', 'Senhora')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  livePreviewRecord.tratamento === 'Senhora'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Senhora
              </button>
            </div>

            <button
              type="button"
              onClick={() => downloadDeclaracaoServicoPdf(livePreviewRecord)}
              className="h-9 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>

            <button
              type="button"
              onClick={() => printSinglePageA4Clean('declaracao-servico-a4-sheet')}
              className="h-9 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir A4</span>
            </button>
          </div>
        </div>

        <div className="flex justify-center w-full bg-[#f8f9fa] p-3 sm:p-6 rounded-2xl border border-slate-200/70 print:bg-white print:block print:m-0 print:p-0 print:border-0">
          <div
            id="declaracao-servico-a4-sheet"
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
                {livePreviewRecord.provEmissao && (
                  <p className="a4-inst-line">
                    GOVERNO PROVINCIAL DE {livePreviewRecord.provEmissao.toUpperCase()}
                  </p>
                )}
                {livePreviewRecord.municipioAdm && (
                  <p className="a4-inst-line">
                    ADMINISTRAÇÃO MUNICIPAL DE {livePreviewRecord.municipioAdm.toUpperCase()}
                  </p>
                )}
                {livePreviewRecord.direccao && (
                  <p className="a4-inst-line">{livePreviewRecord.direccao.toUpperCase()}</p>
                )}
              </div>

              <div className="a4-title-wrap">
                <h1>DECLARAÇÃO DE SERVIÇO</h1>
              </div>

              {(() => {
                const f = livePreviewRecord.tratamento === 'Senhora';
                const fil = `${f ? 'filha' : 'filho'} de ${
                  livePreviewRecord.pai && livePreviewRecord.pai.trim()
                    ? `${livePreviewRecord.pai.trim()} e de ${livePreviewRecord.mae}`
                    : livePreviewRecord.mae
                }`;
                const local = [livePreviewRecord.direccao, livePreviewRecord.localEmissao]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <>
                    <div className="a4-body-copy mt-6 space-y-5" style={{ lineHeight: 1.5 }}>
                      <p style={{ lineHeight: 1.5 }}>
                        Para os devidos efeitos achados convenientes, declara-se que{' '}
                        {f ? 'a senhora ' : 'o senhor '}
                        <strong>{livePreviewRecord.nome}</strong>, {fil}, natural de{' '}
                        {livePreviewRecord.naturalidade}, Província de {livePreviewRecord.provNat},{' '}
                        {f ? 'nascida' : 'nascido'} aos{' '}
                        {fmtDateDeclaracaoServico(livePreviewRecord.nascimento)},{' '}
                        {f ? 'portadora' : 'portador'} do BI nº{' '}
                        <strong>{livePreviewRecord.bi}</strong>, emitido aos{' '}
                        {fmtDateDeclaracaoServico(livePreviewRecord.biData)},{' '}
                        {livePreviewRecord.profissao} do {livePreviewRecord.grau},{' '}
                        {f ? 'colocada' : 'colocado'} no Município de{' '}
                        {livePreviewRecord.municipio}, local de trabalho:{' '}
                        <strong>{livePreviewRecord.escola}</strong>, com a categoria de{' '}
                        {livePreviewRecord.categoria}, Agente nº{' '}
                        <strong>{livePreviewRecord.agente}</strong>, é cliente do{' '}
                        <strong>{livePreviewRecord.bancoNome}</strong>, titular da conta bancária
                        nº <strong>{livePreviewRecord.conta}</strong>, auferindo o salário líquido
                        de{' '}
                        <strong>
                          {fmtKz(livePreviewRecord.salarioKz)} Kz ({livePreviewRecord.extenso})
                        </strong>
                        .
                      </p>

                      <p style={{ lineHeight: 1.5 }}>
                        <strong>Observação:</strong> A presente declaração destina-se{' '}
                        {livePreviewRecord.finalidade.replace(/\.$/, '')}.
                      </p>

                      <p style={{ lineHeight: 1.5 }}>
                        Por ser verdade e me ter sido pedido, mandei passar a presente
                        declaração, que vai por mim assinada e autenticada com carimbo a óleo em
                        uso nesta Direcção.
                      </p>
                    </div>

                    <div className="a4-footer-block">
                      {(local || livePreviewRecord.dataEmissao) && (
                        <div className="a4-date-line" style={{ textAlign: 'center' }}>
                          <span>
                            {local ? `${local} ` : ''}
                            {livePreviewRecord.dataEmissao
                              ? `aos ${fmtDateDeclaracaoServico(livePreviewRecord.dataEmissao)}.`
                              : ''}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col items-center justify-center">
                        <div className="a4-sig-container">
                          <p className="a4-sig-role">O Director Municipal</p>
                          <div className="a4-sig-line"></div>
                          {livePreviewRecord.director && (
                            <p className="a4-sig-name">{livePreviewRecord.director}</p>
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
      {servicoSubView === 'form' && (
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
                Registo já existente na Declaração de Serviço ({duplicateWarning.duplicateRecord.ref})
              </p>
              <p>
                Já consta <strong>{duplicateWarning.duplicateRecord.nome}</strong> com o mesmo{' '}
                {duplicateWarning.reason === 'bi' ? 'número de BI' : 'número de Agente'}.
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
              A editar registo {formData.ref}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-7">
          {/* SECÇÃO 1: Identificação do funcionário */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                Identificação pessoal e filiação
              </h3>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label htmlFor="f-servico-nome" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Nome completo <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  id="f-servico-nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleFieldChange('nome', e.target.value)}
                  onBlur={() => handleFieldBlur('nome')}
                  placeholder="Ex.: Maria Teresa Domingos"
                  className={pillInputClass(Boolean(errors.nome))}
                />
                {errors.nome && <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.nome}</p>}
              </div>

              <div>
                <label htmlFor="f-servico-tratamento" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Tratamento oficial <span className="text-[#d92d20]">*</span>
                </label>
                <select
                  id="f-servico-tratamento"
                  value={formData.tratamento}
                  onChange={(e) => handleFieldChange('tratamento', e.target.value)}
                  onBlur={() => handleFieldBlur('tratamento')}
                  className={pillInputClass(Boolean(errors.tratamento))}
                >
                  <option value="">Escolha</option>
                  <option value="Senhor">Senhor (Masculino)</option>
                  <option value="Senhora">Senhora (Feminino)</option>
                </select>
                {errors.tratamento && (
                  <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.tratamento}</p>
                )}
              </div>

              <div>
                <label htmlFor="f-servico-pai" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Nome do pai
                </label>
                <input
                  id="f-servico-pai"
                  type="text"
                  value={formData.pai}
                  onChange={(e) => handleFieldChange('pai', e.target.value)}
                  placeholder="Ex.: Domingos Manuel"
                  className={pillInputClass(false)}
                />
              </div>

              <div>
                <label htmlFor="f-servico-mae" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Nome da mãe <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  id="f-servico-mae"
                  type="text"
                  value={formData.mae}
                  onChange={(e) => handleFieldChange('mae', e.target.value)}
                  onBlur={() => handleFieldBlur('mae')}
                  placeholder="Ex.: Ana Paula Gomes"
                  className={pillInputClass(Boolean(errors.mae))}
                />
                {errors.mae && <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.mae}</p>}
              </div>

              <div>
                <label htmlFor="f-servico-nascimento" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Data de nascimento <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  id="f-servico-nascimento"
                  type="date"
                  max={todayISO}
                  value={formData.nascimento}
                  onChange={(e) => handleFieldChange('nascimento', e.target.value)}
                  onBlur={() => handleFieldBlur('nascimento')}
                  className={pillInputClass(Boolean(errors.nascimento))}
                />
                {errors.nascimento && (
                  <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.nascimento}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="f-servico-naturalidade" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                    Natural de (município) <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-servico-naturalidade"
                    type="text"
                    value={formData.naturalidade}
                    onChange={(e) => handleFieldChange('naturalidade', e.target.value)}
                    onBlur={() => handleFieldBlur('naturalidade')}
                    placeholder="Ex.: Cacuso"
                    className={pillInputClass(Boolean(errors.naturalidade))}
                  />
                  {errors.naturalidade && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.naturalidade}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="f-servico-provNat" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                    Província <span className="text-[#d92d20]">*</span>
                  </label>
                  <select
                    id="f-servico-provNat"
                    value={formData.provNat}
                    onChange={(e) => handleFieldChange('provNat', e.target.value)}
                    onBlur={() => handleFieldBlur('provNat')}
                    className={pillInputClass(Boolean(errors.provNat))}
                  >
                    <option value="">Escolha</option>
                    {ANGOLA_PROVINCIAS_SERVICO.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {errors.provNat && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.provNat}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECÇÃO 2: Bilhete de Identidade e Enquadramento */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                Bilhete de Identidade e situação profissional
              </h3>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label htmlFor="f-servico-bi" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Número do Bilhete de Identidade (BI) <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  id="f-servico-bi"
                  type="text"
                  maxLength={14}
                  value={formData.bi}
                  onChange={(e) => handleFieldChange('bi', e.target.value)}
                  onBlur={() => handleFieldBlur('bi')}
                  placeholder="Ex.: 005417082ME010"
                  className={`${pillInputClass(Boolean(errors.bi))} font-mono uppercase`}
                />
                {errors.bi && <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.bi}</p>}
              </div>

              <div>
                <label htmlFor="f-servico-biData" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Data de emissão do BI <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  id="f-servico-biData"
                  type="date"
                  max={todayISO}
                  value={formData.biData}
                  onChange={(e) => handleFieldChange('biData', e.target.value)}
                  onBlur={() => handleFieldBlur('biData')}
                  className={pillInputClass(Boolean(errors.biData))}
                />
                {errors.biData && <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.biData}</p>}
              </div>

              <div>
                <label htmlFor="f-servico-profissao" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Profissão / Carreira docente <span className="text-[#d92d20]">*</span>
                </label>
                <select
                  id="f-servico-profissao"
                  value={formData.profissao}
                  onChange={(e) => handleFieldChange('profissao', e.target.value)}
                  onBlur={() => handleFieldBlur('profissao')}
                  className={pillInputClass(Boolean(errors.profissao))}
                >
                  <option value="">Escolha</option>
                  <option value="Professor do Ensino Primário">Professor do Ensino Primário</option>
                  <option value="Professor do Ensino Secundário">Professor do Ensino Secundário</option>
                  <option value="Professor do Ensino Primário e Secundário">
                    Professor do Ensino Primário e Secundário
                  </option>
                  {formData.profissao &&
                    ![
                      'Professor do Ensino Primário',
                      'Professor do Ensino Secundário',
                      'Professor do Ensino Primário e Secundário',
                    ].includes(formData.profissao) && (
                      <option value={formData.profissao}>{formData.profissao}</option>
                    )}
                </select>
                {errors.profissao && (
                  <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.profissao}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="f-servico-grau" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                    Grau <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-servico-grau"
                    type="text"
                    value={formData.grau}
                    onChange={(e) => handleFieldChange('grau', e.target.value)}
                    onBlur={() => handleFieldBlur('grau')}
                    placeholder="Ex.: 12º Grau"
                    className={pillInputClass(Boolean(errors.grau))}
                  />
                  {errors.grau && <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.grau}</p>}
                </div>

                <div>
                  <label htmlFor="f-servico-categoria" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                    Categoria <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-servico-categoria"
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => handleFieldChange('categoria', e.target.value)}
                    onBlur={() => handleFieldBlur('categoria')}
                    placeholder="Ex.: P.E.P.E.S do 12º"
                    className={pillInputClass(Boolean(errors.categoria))}
                  />
                  {errors.categoria && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.categoria}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="f-servico-agente" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Número de Agente <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  id="f-servico-agente"
                  type="text"
                  inputMode="numeric"
                  value={formData.agente}
                  onChange={(e) => handleFieldChange('agente', e.target.value)}
                  onBlur={() => handleFieldBlur('agente')}
                  placeholder="Ex.: 54170829"
                  className={`${pillInputClass(Boolean(errors.agente))} font-mono`}
                />
                {errors.agente && <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.agente}</p>}
              </div>

              <div>
                <label htmlFor="f-servico-municipio" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Município de colocação <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  id="f-servico-municipio"
                  type="text"
                  value={formData.municipio}
                  onChange={(e) => handleFieldChange('municipio', e.target.value)}
                  onBlur={() => handleFieldBlur('municipio')}
                  placeholder="Ex.: Quêssua"
                  className={pillInputClass(Boolean(errors.municipio))}
                />
                {errors.municipio && (
                  <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.municipio}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="f-servico-escola" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Escola ou local de trabalho <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  id="f-servico-escola"
                  type="text"
                  value={formData.escola}
                  onChange={(e) => handleFieldChange('escola', e.target.value)}
                  onBlur={() => handleFieldBlur('escola')}
                  placeholder="Ex.: Complexo Escolar Católico n.º 166 MJE São Pedro – Quêssua"
                  className={pillInputClass(Boolean(errors.escola))}
                />
                {errors.escola && <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.escola}</p>}
              </div>
            </div>
          </div>

          {/* SECÇÃO 3: Conta bancária e salário (Exemplar Fiscal & Faturação) */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                Conta bancária e salário líquido
              </h3>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label htmlFor="f-servico-banco" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Instituição bancária <span className="text-[#d92d20]">*</span>
                </label>
                <select
                  id="f-servico-banco"
                  value={formData.banco}
                  onChange={(e) => handleFieldChange('banco', e.target.value)}
                  onBlur={() => handleFieldBlur('banco')}
                  className={pillInputClass(Boolean(errors.banco))}
                >
                  <option value="">Escolha</option>
                  {ANGOLA_BANCOS_SERVICO.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {errors.banco && <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.banco}</p>}
              </div>

              {formData.banco === 'Outro' ? (
                <div>
                  <label htmlFor="f-servico-bancoOutro" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                    Nome do banco <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-servico-bancoOutro"
                    type="text"
                    value={formData.bancoOutro}
                    onChange={(e) => handleFieldChange('bancoOutro', e.target.value)}
                    onBlur={() => handleFieldBlur('bancoOutro')}
                    placeholder="Indique o nome do banco"
                    className={pillInputClass(Boolean(errors.bancoOutro))}
                  />
                  {errors.bancoOutro && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.bancoOutro}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor="f-servico-conta" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                    Número da conta bancária <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-servico-conta"
                    type="text"
                    value={formData.conta}
                    onChange={(e) => handleFieldChange('conta', e.target.value)}
                    onBlur={() => handleFieldBlur('conta')}
                    placeholder="Ex.: 0000-X00000-000"
                    className={`${pillInputClass(Boolean(errors.conta))} font-mono`}
                  />
                  {errors.conta && <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.conta}</p>}
                </div>
              )}

              {formData.banco === 'Outro' && (
                <div>
                  <label htmlFor="f-servico-conta" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                    Número da conta bancária <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-servico-conta"
                    type="text"
                    value={formData.conta}
                    onChange={(e) => handleFieldChange('conta', e.target.value)}
                    onBlur={() => handleFieldBlur('conta')}
                    placeholder="Ex.: 0000-X00000-000"
                    className={`${pillInputClass(Boolean(errors.conta))} font-mono`}
                  />
                  {errors.conta && <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.conta}</p>}
                </div>
              )}

              {/* Read-only Currency pill matching the exemplar's "Moeda de faturação -> Kwanza (Kz)" */}
              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Moeda oficial de vencimento
                </label>
                <div className="w-full h-11 px-4 rounded-full bg-[#f2f4f7] text-sm text-slate-800 font-medium flex items-center">
                  Kwanza (Kz){salarioExtenso ? ` — ${salarioExtenso}` : ''}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  O sistema usa Kz como moeda oficial e converte automaticamente o valor por extenso.
                </p>
              </div>

              <div>
                <label htmlFor="f-servico-salario" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Salário líquido mensal (Kz) <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  id="f-servico-salario"
                  type="text"
                  inputMode="decimal"
                  value={formData.salario}
                  onChange={(e) => handleFieldChange('salario', e.target.value)}
                  onBlur={() => handleFieldBlur('salario')}
                  placeholder="Ex.: 185.400,00"
                  className={`${pillInputClass(Boolean(errors.salario))} font-mono tabular-nums`}
                />
                {errors.salario && (
                  <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.salario}</p>
                )}
              </div>
            </div>
          </div>

          {/* SECÇÃO 4: Finalidade e Entidade Emissora */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                Finalidade e entidade emissora
              </h3>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="md:col-span-2">
                <label htmlFor="f-servico-finalidade" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Finalidade da declaração (A presente declaração destina-se...) <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  id="f-servico-finalidade"
                  type="text"
                  value={formData.finalidade}
                  onChange={(e) => handleFieldChange('finalidade', e.target.value)}
                  onBlur={() => handleFieldBlur('finalidade')}
                  placeholder="Ex.: à regularização da conta bancária"
                  className={pillInputClass(Boolean(errors.finalidade))}
                />
                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    { label: 'Regularização da conta', fill: 'à regularização da conta bancária' },
                    { label: 'Abertura de conta', fill: 'à abertura de conta bancária' },
                    { label: 'Pedido de crédito', fill: 'ao pedido de crédito bancário' },
                  ].map((chip) => (
                    <button
                      key={chip.fill}
                      type="button"
                      onClick={() => handleSelectChip(chip.fill)}
                      className="text-xs bg-[#f2f4f7] hover:bg-slate-200/80 text-slate-800 font-medium rounded-full px-3.5 py-1.5 transition-colors cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                {errors.finalidade && (
                  <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.finalidade}</p>
                )}
              </div>

              <div>
                <label htmlFor="f-servico-direccao" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Direcção emissora
                </label>
                <input
                  id="f-servico-direccao"
                  type="text"
                  value={formData.direccao}
                  onChange={(e) => handleFieldChange('direccao', e.target.value)}
                  placeholder="Ex.: Direcção Municipal de Educação"
                  className={pillInputClass(false)}
                />
              </div>

              <div>
                <label htmlFor="f-servico-director" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Nome do Director Municipal
                </label>
                <input
                  id="f-servico-director"
                  type="text"
                  value={formData.director}
                  onChange={(e) => handleFieldChange('director', e.target.value)}
                  placeholder="Nome de quem assina"
                  className={pillInputClass(false)}
                />
              </div>

              <div>
                <label htmlFor="f-servico-localEmissao" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Local de emissão
                </label>
                <input
                  id="f-servico-localEmissao"
                  type="text"
                  value={formData.localEmissao}
                  onChange={(e) => handleFieldChange('localEmissao', e.target.value)}
                  placeholder="Ex.: Quêssua"
                  className={pillInputClass(false)}
                />
              </div>

              <div>
                <label htmlFor="f-servico-dataEmissao" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Data de emissão
                </label>
                <input
                  id="f-servico-dataEmissao"
                  type="date"
                  value={formData.dataEmissao}
                  onChange={(e) => handleFieldChange('dataEmissao', e.target.value)}
                  className={pillInputClass(false)}
                />
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
                    : 'Guardar na Base de Dados & Gerar Declaração'}
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
              Eliminar Registo de Declaração de Serviço?
            </h3>
            <p className="text-sm text-slate-600">
              Tem a certeza que deseja eliminar o cadastro de{' '}
              <strong className="text-slate-900">{recordToDelete.nome}</strong> (Ref.{' '}
              <span className="font-mono">{recordToDelete.ref}</span>)?
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
                  deleteDeclaracaoServicoRecord(recordToDelete.id);
                  if (submittedRecord?.id === recordToDelete.id) {
                    setSubmittedRecord(null);
                  }
                  setRecordToDelete(null);
                  reloadRecords();
                  showToast('Registo eliminado da Declaração de Serviço.');
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
