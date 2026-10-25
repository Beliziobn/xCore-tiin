import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Printer,
  FileDown,
  RotateCcw,
  Search,
  Plus,
  Trash2,
  Edit,
  Users,
  Check,
  Building2,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Eye,
  Filter,
  Sparkles,
  Info,
  Clock,
  BadgeCheck,
  UserCheck
} from 'lucide-react';
import { Hero } from '../Hero';
import emblemAngolaImg from '../../assets/images/Emblem_of_Angola.svg.webp';
import type { UserAccount } from '../../types';
import {
  CadastramentoEfectividadeRecord,
  ANGOLA_PROVINCIAS,
  getStoredEfectividadeRecords,
  saveEfectividadeRecord,
  deleteEfectividadeRecord,
  clearAllEfectividadeRecords,
  findDuplicateEfectividade,
  formatAngolanDate,
  formatAngolanDateExtenso,
  syncEfectividadeFromServer,
} from '../../utils/efectividadeStorage';

interface DeclaracaoEfectividadePageProps {
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
  currentUser?: UserAccount | null;
  onNavigateHome?: () => void;
}

type ActiveTab = 'form' | 'database' | 'view-ficha';

interface FormState {
  id?: string;
  // 1. Identificação pessoal
  nome: string;
  tratamento: 'Senhor' | 'Senhora';
  nascimento: string;
  pai: string;
  mae: string;
  naturalidade: string;
  provNat: string;

  // 2. Bilhete de Identidade
  bi: string;
  biEmissao: string;

  // 3. Enquadramento profissional
  sector: string;
  funcao: string;
  municipio: string;
  agente: string;
  escola: string;
  categoria: string;
  grau: string;

  // 4. Finalidade da declaração
  finalidade: string;

  // 5. Entidade emissora
  governoProv: string;
  administracao: string;
  direccao: string;
  director: string;
  local: string;
  dataEmissao: string;
}

const getTodayIso = () => new Date().toISOString().slice(0, 10);

const getInitialFormState = (currentUser?: UserAccount | null): FormState => ({
  nome: '',
  tratamento: 'Senhor',
  nascimento: '',
  pai: '',
  mae: '',
  naturalidade: 'Malanje',
  provNat: 'Malanje',
  bi: '',
  biEmissao: '',
  sector: 'Educação',
  funcao: 'Docente',
  municipio: 'Quêssua',
  agente: '',
  escola: currentUser?.schoolName || 'Complexo Escolar Católico n.º 166 MJE São Pedro – Quêssua',
  categoria: 'P.E.P.E.S.',
  grau: '11.º Grau',
  finalidade:
    'Instrução do processo de candidatura ao Concurso Público de Acesso e de Ingresso Interno no Sector da Educação',
  governoProv: 'Malanje',
  administracao: 'Quêssua',
  direccao: 'Educação',
  director: 'Belizio Miguel dos Santos António',
  local: 'Quêssua',
  dataEmissao: getTodayIso(),
});

export const DeclaracaoEfectividadePage: React.FC<DeclaracaoEfectividadePageProps> = ({
  onOpenGetStarted,
  isLoggedIn = false,
  currentUser,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('form');
  const [records, setRecords] = useState<CadastramentoEfectividadeRecord[]>(() =>
    getStoredEfectividadeRecords()
  );
  const [formData, setFormData] = useState<FormState>(() => getInitialFormState(currentUser));
  const [selectedRecordForView, setSelectedRecordForView] = useState<CadastramentoEfectividadeRecord | null>(null);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Database search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [recordToDelete, setRecordToDelete] = useState<{ id: string; nome: string } | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  const reloadRecords = () => {
    setRecords(getStoredEfectividadeRecords());
  };

  useEffect(() => {
    reloadRecords();
    syncEfectividadeFromServer().then((synced) => {
      if (Array.isArray(synced)) {
        setRecords(synced);
      }
    }).catch(() => {});

    const handler = () => reloadRecords();
    window.addEventListener('sigre-efectividade-updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('sigre-efectividade-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time duplicate check based on current typed BI and Agente
  const currentDuplicate = useMemo(() => {
    if (!formData.bi && !formData.agente) return null;
    const res = findDuplicateEfectividade(formData.bi, formData.agente, formData.id);
    return res.isDuplicate ? res : null;
  }, [formData.bi, formData.agente, formData.id, records]);

  // Validate form fields
  const validateForm = (data: FormState) => {
    const errs: Record<string, string> = {};
    const today = getTodayIso();

    // Section 1
    if (!data.nome.trim()) errs.nome = 'Indique o nome completo como no Bilhete de Identidade.';
    if (!data.tratamento) errs.tratamento = 'Seleccione o tratamento.';
    if (!data.nascimento) {
      errs.nascimento = 'Indique a data de nascimento.';
    } else if (data.nascimento >= today || data.nascimento < '1920-01-01') {
      errs.nascimento = 'A data de nascimento deve ser anterior a hoje.';
    }
    if (!data.pai.trim()) errs.pai = 'Indique o nome completo do pai.';
    if (!data.mae.trim()) errs.mae = 'Indique o nome completo da mãe.';
    if (!data.naturalidade.trim()) errs.naturalidade = 'Indique a naturalidade.';
    if (!data.provNat) errs.provNat = 'Seleccione a província de naturalidade.';

    // Section 2 - BI
    const cleanBi = data.bi.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanBi) {
      errs.bi = 'Preencha o número do Bilhete de Identidade.';
    } else if (!/^\d{9}[A-Za-z]{2}\d{3}$/.test(cleanBi)) {
      errs.bi = 'Formato inválido. O B.I. deve ter 9 dígitos, 2 letras e 3 dígitos (ex: 000000000AA000).';
    }

    if (!data.biEmissao) {
      errs.biEmissao = 'Indique a data de emissão do Bilhete de Identidade.';
    } else if (data.biEmissao > today) {
      errs.biEmissao = 'A data de emissão não pode ser posterior à data de hoje.';
    } else if (data.nascimento && data.biEmissao <= data.nascimento) {
      errs.biEmissao = 'A data de emissão tem de ser posterior ao nascimento.';
    }

    // Section 3 - Profissional
    if (!data.sector.trim()) errs.sector = 'Indique o sector institucional.';
    if (!data.funcao.trim()) errs.funcao = 'Indique a função exercida.';
    if (!data.municipio.trim()) errs.municipio = 'Indique o município de colocação.';

    const cleanAgente = data.agente.trim().replace(/\s+/g, '');
    if (!cleanAgente) {
      errs.agente = 'Indique o número de agente do funcionário.';
    } else if (!/^\d{3,}$/.test(cleanAgente)) {
      errs.agente = 'O número de agente deve conter apenas dígitos (mínimo 3).';
    }

    if (!data.escola.trim()) errs.escola = 'Indique a escola ou complexo de colocação.';
    if (!data.categoria.trim()) errs.categoria = 'Indique a categoria profissional.';
    if (!data.grau.trim()) errs.grau = 'Indique o grau de enquadramento.';

    // Section 4
    if (!data.finalidade.trim()) errs.finalidade = 'Indique a finalidade da declaração.';

    return errs;
  };

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Progress of required fields
  const formProgress = useMemo(() => {
    const requiredKeys: (keyof FormState)[] = [
      'nome',
      'tratamento',
      'nascimento',
      'pai',
      'mae',
      'naturalidade',
      'provNat',
      'bi',
      'biEmissao',
      'sector',
      'funcao',
      'municipio',
      'agente',
      'escola',
      'categoria',
      'grau',
      'finalidade',
    ];

    let filledCount = 0;
    requiredKeys.forEach((k) => {
      if (String(formData[k] || '').trim()) filledCount++;
    });

    const percent = Math.round((filledCount / requiredKeys.length) * 100);
    return {
      filled: filledCount,
      total: requiredKeys.length,
      percent,
    };
  }, [formData]);

  const handleSubmitForm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormSubmitted(true);

    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      showToast('Por favor, corrija os campos destacados a vermelho antes de concluir.');
      const firstErrKey = Object.keys(errors)[0];
      const el = document.getElementById(`field-${firstErrKey}`);
      if (el) el.focus();
      return;
    }

    // Check duplicate in database
    const saveResult = saveEfectividadeRecord({
      ...formData,
      bi: formData.bi.trim().toUpperCase(),
      agente: formData.agente.trim(),
      status: 'homologado',
    });

    if (!saveResult.success) {
      showToast(saveResult.error || 'Erro ao guardar no banco de dados.');
      return;
    }

    const saved = saveResult.record!;
    reloadRecords();
    setSelectedRecordForView(saved);
    setActiveTab('view-ficha');
    showToast(
      formData.id
        ? `Registo de ${saved.nome} actualizado com sucesso!`
        : `Novo funcionário "${saved.nome}" cadastrado com sucesso!`
    );
  };

  const handleStartEditRecord = (record: CadastramentoEfectividadeRecord) => {
    setFormData({
      id: record.id,
      nome: record.nome,
      tratamento: record.tratamento,
      nascimento: record.nascimento,
      pai: record.pai,
      mae: record.mae,
      naturalidade: record.naturalidade,
      provNat: record.provNat,
      bi: record.bi,
      biEmissao: record.biEmissao,
      sector: record.sector,
      funcao: record.funcao,
      municipio: record.municipio,
      agente: record.agente,
      escola: record.escola,
      categoria: record.categoria,
      grau: record.grau,
      finalidade: record.finalidade,
      governoProv: record.governoProv,
      administracao: record.administracao,
      direccao: record.direccao,
      director: record.director,
      local: record.local,
      dataEmissao: record.dataEmissao,
    });
    setFormSubmitted(false);
    setFormErrors({});
    setActiveTab('form');
    window.scrollTo({ top: 300, behavior: 'smooth' });
    showToast(`A editar dados de ${record.nome}.`);
  };

  const handleClearForm = () => {
    setFormData(getInitialFormState(currentUser));
    setFormSubmitted(false);
    setFormErrors({});
    showToast('Formulário limpo com sucesso.');
  };

  const handleOpenViewFicha = (record: CadastramentoEfectividadeRecord) => {
    setSelectedRecordForView(record);
    setActiveTab('view-ficha');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRecord = (id: string, nome: string) => {
    setRecordToDelete({ id, nome });
  };

  const executeDeleteRecord = (id: string, nome: string) => {
    deleteEfectividadeRecord(id);
    reloadRecords();
    setRecordToDelete(null);
    showToast(`O cadastro de "${nome}" foi eliminado com sucesso.`);
    if (selectedRecordForView?.id === id) {
      setSelectedRecordForView(null);
      setActiveTab('database');
    }
  };

  const handleClearDatabase = () => {
    if (records.length === 0) {
      showToast('A base de dados já se encontra vazia.');
      return;
    }
    setShowClearAllModal(true);
  };

  const executeClearDatabase = () => {
    clearAllEfectividadeRecords();
    setRecords([]);
    setSelectedRecordForView(null);
    setShowClearAllModal(false);
    showToast('Base de dados de pessoal esvaziada com sucesso.');
  };

  const handlePrintDocument = () => {
    window.print();
  };

  // Filtered records for database table
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        r.nome.toLowerCase().includes(q) ||
        r.bi.toLowerCase().includes(q) ||
        r.agente.toLowerCase().includes(q) ||
        r.escola.toLowerCase().includes(q) ||
        r.categoria.toLowerCase().includes(q);

      const matchSchool =
        schoolFilter === 'ALL' || r.escola.toLowerCase().includes(schoolFilter.toLowerCase());

      return matchQuery && matchSchool;
    });
  }, [records, searchQuery, schoolFilter]);

  const uniqueSchools = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.escola) set.add(r.escola);
    });
    return Array.from(set);
  }, [records]);

  return (
    <div id="declaracao-efectividade-page" className="w-full min-h-screen bg-[#F6F4EE] flex flex-col font-sans">
      {/* Print CSS rules - ensures A4 portrait format and hides UI chrome */}
      <style>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 12pt !important;
          }
          #declaracao-efectividade-page {
            background: white !important;
            min-height: auto !important;
          }
          #siteHeader,
          #ucore-hero-section,
          #page-tabs-bar,
          .no-print,
          footer {
            display: none !important;
          }
          #oficial-a4-sheet {
            box-shadow: none !important;
            border: 2px solid #000 !important;
            padding: 18mm 20mm !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
          }
        }
      `}</style>

      {/* Hero Banner with Breadcrumbs */}
      <div className="no-print">
        <Hero
          onOpenGetStarted={onOpenGetStarted}
          customTitle="Cadastramento de Pessoal"
          customSubtitle="Ficha oficial de cadastro individual e Declaração de Efectividade do Sector da Educação • Município do Quêssua."
          badge="Declaração de Efectividade"
          breadcrumbs={[
            { label: 'Início', onClick: onNavigateHome },
            { label: 'Documentos Escolares' },
            { label: 'Declaração de Efectividade & Cadastro' },
          ]}
          isLoggedIn={isLoggedIn}
        />
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="no-print fixed top-20 right-6 z-50 bg-[#002133] text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <nav id="page-tabs-bar" className="no-print border-b border-[#D9D6CC] bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'form'
                  ? 'border-[#f75142] text-[#f75142]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Formulário de Cadastro</span>
              {formData.id && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black">
                  A Editar
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('database')}
              className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'database'
                  ? 'border-[#f75142] text-[#f75142]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pessoal Cadastrado (Base de Dados)</span>
              <span className="text-[11px] bg-[#002133] text-white px-2 py-0.5 rounded-full font-bold">
                {records.length}
              </span>
            </button>

            {selectedRecordForView && (
              <button
                type="button"
                onClick={() => setActiveTab('view-ficha')}
                className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'view-ficha'
                    ? 'border-[#f75142] text-[#f75142]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                <span className="truncate max-w-[150px] sm:max-w-[220px]">
                  Ficha Oficial: {selectedRecordForView.nome.split(' ')[0]}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 py-2">
            <span className="text-xs text-slate-500 hidden md:inline">
              República de Angola • Quêssua
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* ============================================================== */}
        {/* TAB 1: FORMULÁRIO DE CADASTRAMENTO                              */}
        {/* ============================================================== */}
        {activeTab === 'form' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Real-Time Duplicate Warning Alert */}
            {currentDuplicate && currentDuplicate.duplicateRecord && (
              <div
                role="alert"
                className="bg-amber-50 border-2 border-amber-500 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-amber-950 shadow-md animate-in slide-in-from-top-2"
              >
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-amber-900 uppercase tracking-wide">
                      Atenção: Registo Existente na Base de Dados
                    </h3>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      Duplicação Evitada
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                    Já existe um funcionário cadastrado{' '}
                    <strong>
                      {currentDuplicate.reason === 'bi'
                        ? `com o B.I. n.º "${currentDuplicate.duplicateRecord.bi}"`
                        : `com o Nº de Agente "${currentDuplicate.duplicateRecord.agente}"`}
                    </strong>
                    : <span className="font-bold">{currentDuplicate.duplicateRecord.nome}</span> (
                    {currentDuplicate.duplicateRecord.escola}).
                  </p>
                  <div className="pt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartEditRecord(currentDuplicate.duplicateRecord!)}
                      className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Editar Registo Existente
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenViewFicha(currentDuplicate.duplicateRecord!)}
                      className="text-xs font-bold text-white bg-amber-900 hover:bg-amber-950 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Ver Ficha / Declaração
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Form Container */}
            <div className="bg-white rounded-3xl border border-[#D9D6CC] shadow-sm p-6 sm:p-10 space-y-8">
              {/* Form Title & Header */}
              <div className="border-b border-[#D9D6CC] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#f75142] bg-[#fef2f1] px-3 py-1 rounded-full mb-2">
                    {formData.id ? 'Edição de Registo' : 'Novo Registo'}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#002133] tracking-tight">
                    Ficha de Cadastro de Pessoal
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Declaração de Efectividade • Preencha os dados oficiais de identificação e enquadramento.
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="sm:text-right min-w-[200px]">
                  <div className="text-xs font-semibold text-slate-500 mb-1">
                    Preenchimento: <strong className="text-slate-900">{formProgress.filled}</strong> de{' '}
                    <strong>{formProgress.total}</strong> campos
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                    <div
                      className="bg-[#f75142] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${formProgress.percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitForm} className="space-y-8">
                {/* 1. IDENTIFICAÇÃO PESSOAL */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#002133] text-white flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Identificação Pessoal
                    </h2>
                    <span className="text-xs text-slate-500 font-medium ml-auto">
                      Nome, filiação, naturalidade e nascimento
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {/* Nome Completo */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nome Completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="field-nome"
                        type="text"
                        value={formData.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        placeholder="Nome e apelidos, exactamente como no Bilhete de Identidade"
                        className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 outline-none transition-all ${
                          formErrors.nome
                            ? 'border-red-500 bg-red-50/30 focus:ring-4 focus:ring-red-100'
                            : 'border-slate-300 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10'
                        }`}
                      />
                      {formErrors.nome && <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.nome}</p>}
                    </div>

                    {/* Tratamento */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Tratamento <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="field-tratamento"
                        value={formData.tratamento}
                        onChange={(e) => handleInputChange('tratamento', e.target.value as any)}
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 cursor-pointer"
                      >
                        <option value="Senhor">Senhor</option>
                        <option value="Senhora">Senhora</option>
                      </select>
                    </div>

                    {/* Data de Nascimento */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Data de Nascimento <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="field-nascimento"
                        type="date"
                        max={getTodayIso()}
                        value={formData.nascimento}
                        onChange={(e) => handleInputChange('nascimento', e.target.value)}
                        className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 outline-none transition-all ${
                          formErrors.nascimento
                            ? 'border-red-500 bg-red-50/30'
                            : 'border-slate-300 bg-white focus:border-[#f75142]'
                        }`}
                      />
                      {formErrors.nascimento && (
                        <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.nascimento}</p>
                      )}
                    </div>

                    {/* Nome do Pai */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nome do Pai <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="field-pai"
                        type="text"
                        value={formData.pai}
                        onChange={(e) => handleInputChange('pai', e.target.value)}
                        placeholder="Nome completo do pai"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142]"
                      />
                      {formErrors.pai && <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.pai}</p>}
                    </div>

                    {/* Nome da Mãe */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nome da Mãe <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="field-mae"
                        type="text"
                        value={formData.mae}
                        onChange={(e) => handleInputChange('mae', e.target.value)}
                        placeholder="Nome completo da mãe"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142]"
                      />
                      {formErrors.mae && <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.mae}</p>}
                    </div>

                    {/* Naturalidade */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Naturalidade (Município) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="field-naturalidade"
                        type="text"
                        value={formData.naturalidade}
                        onChange={(e) => handleInputChange('naturalidade', e.target.value)}
                        placeholder="Ex: Quêssua"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142]"
                      />
                      {formErrors.naturalidade && (
                        <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.naturalidade}</p>
                      )}
                    </div>

                    {/* Província de Naturalidade */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Província de Naturalidade <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="field-provNat"
                        value={formData.provNat}
                        onChange={(e) => handleInputChange('provNat', e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142] cursor-pointer"
                      >
                        {ANGOLA_PROVINCIAS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {/* 2. BILHETE DE IDENTIDADE */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#002133] text-white flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Bilhete de Identidade (B.I.)
                    </h2>
                    <span className="text-xs text-slate-500 font-medium ml-auto">
                      Número oficial e data de emissão
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* B.I. Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Bilhete de Identidade n.º <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="field-bi"
                        type="text"
                        value={formData.bi}
                        onChange={(e) => handleInputChange('bi', e.target.value.toUpperCase())}
                        placeholder="000000000AA000"
                        maxLength={14}
                        className={`w-full h-11 px-3.5 rounded-xl border text-sm font-mono uppercase text-slate-900 outline-none transition-all ${
                          formErrors.bi
                            ? 'border-red-500 bg-red-50/30'
                            : 'border-slate-300 bg-white focus:border-[#f75142]'
                        }`}
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Padrão oficial angolano: 9 dígitos, 2 letras e 3 dígitos (ex: 002938471ME042).
                      </p>
                      {formErrors.bi && <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.bi}</p>}
                    </div>

                    {/* Data de Emissão do B.I. */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Data de Emissão do B.I. <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="field-biEmissao"
                        type="date"
                        max={getTodayIso()}
                        value={formData.biEmissao}
                        onChange={(e) => handleInputChange('biEmissao', e.target.value)}
                        className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 outline-none transition-all ${
                          formErrors.biEmissao
                            ? 'border-red-500 bg-red-50/30'
                            : 'border-slate-300 bg-white focus:border-[#f75142]'
                        }`}
                      />
                      {formErrors.biEmissao && (
                        <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.biEmissao}</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* 3. ENQUADRAMENTO PROFISSIONAL */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#002133] text-white flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Enquadramento Profissional
                    </h2>
                    <span className="text-xs text-slate-500 font-medium ml-auto">
                      Sector, escola de colocação, categoria e agente
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {/* Sector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Sector Institucional <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="field-sector"
                        type="text"
                        value={formData.sector}
                        onChange={(e) => handleInputChange('sector', e.target.value)}
                        placeholder="Ex.: Educação"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142]"
                      />
                      {formErrors.sector && (
                        <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.sector}</p>
                      )}
                    </div>

                    {/* Funções exercidas */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Funções Exercidas <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="field-funcao"
                        type="text"
                        value={formData.funcao}
                        onChange={(e) => handleInputChange('funcao', e.target.value)}
                        placeholder="Ex.: Docente / Professor do Ensino Geral"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142]"
                      />
                      {formErrors.funcao && (
                        <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.funcao}</p>
                      )}
                    </div>

                    {/* Município de colocação */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Município de Colocação <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="field-municipio"
                        type="text"
                        value={formData.municipio}
                        onChange={(e) => handleInputChange('municipio', e.target.value)}
                        placeholder="Ex.: Quêssua"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142]"
                      />
                      {formErrors.municipio && (
                        <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.municipio}</p>
                      )}
                    </div>

                    {/* Número de Agente */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Número de Agente <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="field-agente"
                        type="text"
                        value={formData.agente}
                        onChange={(e) => handleInputChange('agente', e.target.value)}
                        placeholder="Apenas dígitos (ex: 109283)"
                        className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 outline-none transition-all ${
                          formErrors.agente
                            ? 'border-red-500 bg-red-50/30'
                            : 'border-slate-300 bg-white focus:border-[#f75142]'
                        }`}
                      />
                      {formErrors.agente && (
                        <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.agente}</p>
                      )}
                    </div>

                    {/* Categoria Profissional */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Categoria Profissional <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="field-categoria"
                        type="text"
                        value={formData.categoria}
                        onChange={(e) => handleInputChange('categoria', e.target.value)}
                        placeholder="Ex.: P.E.P.E.S."
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142]"
                      />
                      {formErrors.categoria && (
                        <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.categoria}</p>
                      )}
                    </div>

                    {/* Grau */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Grau de Enquadramento <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="field-grau"
                        type="text"
                        value={formData.grau}
                        onChange={(e) => handleInputChange('grau', e.target.value)}
                        placeholder="Ex.: 11.º Grau"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142]"
                      />
                      {formErrors.grau && <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.grau}</p>}
                    </div>

                    {/* Escola ou complexo escolar de colocação */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Escola ou Complexo Escolar de Colocação <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="field-escola"
                        type="text"
                        value={formData.escola}
                        onChange={(e) => handleInputChange('escola', e.target.value)}
                        placeholder="Nome completo do estabelecimento de ensino"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142]"
                      />
                      {formErrors.escola && (
                        <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.escola}</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* 4. FINALIDADE DA DECLARAÇÃO */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#002133] text-white flex items-center justify-center font-bold text-xs">
                      4
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Finalidade da Declaração
                    </h2>
                    <span className="text-xs text-slate-500 font-medium ml-auto">
                      Para que processo será utilizada
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Texto da Finalidade <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="field-finalidade"
                      rows={3}
                      value={formData.finalidade}
                      onChange={(e) => handleInputChange('finalidade', e.target.value)}
                      placeholder="Ex.: Instrução do processo de candidatura ao Concurso Público de Acesso e de Ingresso Interno no Sector da Educação"
                      className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142] resize-y"
                    />
                    {formErrors.finalidade && (
                      <p className="text-red-600 text-[11px] mt-1 font-semibold">{formErrors.finalidade}</p>
                    )}
                  </div>
                </section>

                {/* 5. ENTIDADE EMISSORA (HOMOLOGAÇÃO) */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#002133] text-white flex items-center justify-center font-bold text-xs">
                      5
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Entidade Emissora & Homologação
                    </h2>
                    <span className="text-xs text-slate-500 font-medium ml-auto">
                      Assinatura e dados institucionais
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Governo Provincial de
                      </label>
                      <input
                        type="text"
                        value={formData.governoProv}
                        onChange={(e) => handleInputChange('governoProv', e.target.value)}
                        placeholder="Ex.: Malanje"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Administração Municipal de
                      </label>
                      <input
                        type="text"
                        value={formData.administracao}
                        onChange={(e) => handleInputChange('administracao', e.target.value)}
                        placeholder="Ex.: Quêssua"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Direcção Municipal de
                      </label>
                      <input
                        type="text"
                        value={formData.direccao}
                        onChange={(e) => handleInputChange('direccao', e.target.value)}
                        placeholder="Ex.: Educação"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nome do Director Municipal / Responsável
                      </label>
                      <input
                        type="text"
                        value={formData.director}
                        onChange={(e) => handleInputChange('director', e.target.value)}
                        placeholder="Nome de quem assina"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Local de Emissão
                      </label>
                      <input
                        type="text"
                        value={formData.local}
                        onChange={(e) => handleInputChange('local', e.target.value)}
                        placeholder="Ex.: Quêssua"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Data de Emissão
                      </label>
                      <input
                        type="date"
                        value={formData.dataEmissao}
                        onChange={(e) => handleInputChange('dataEmissao', e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-[#f75142]"
                      />
                    </div>
                  </div>
                </section>

                {/* Submit Action Buttons */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="h-12 px-8 rounded-xl bg-[#f75142] hover:bg-[#e04436] text-white font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>{formData.id ? 'Salvar Alterações no Registo' : 'Concluir Cadastro & Gerar Ficha'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearForm}
                      className="h-12 px-5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-300 transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-500" />
                      <span>Limpar Campos</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('database')}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Ver Base de Dados ({records.length} cadastrados) →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: BASE DE DADOS DE CADASTRADOS (PREVENÇÃO DE DUPLICAÇÃO)  */}
        {/* ============================================================== */}
        {activeTab === 'database' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header & Controls */}
            <div className="bg-white rounded-3xl border border-[#D9D6CC] shadow-sm p-6 sm:p-8 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#002133] bg-slate-100 px-3 py-1 rounded-full mb-2">
                    Banco de Dados Integrado
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#002133] tracking-tight">
                    Funcionários Cadastrados na Efectividade
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Controle centralizado anti-duplicação de pessoal docente e administrativo da Educação de Quêssua.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {records.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearDatabase}
                      className="h-11 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-bold flex items-center gap-2 border border-red-200 cursor-pointer transition-colors"
                      title="Eliminar todos os cadastros existentes na base de dados"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>Esvaziar Base de Dados</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setFormData(getInitialFormState(currentUser));
                      setActiveTab('form');
                    }}
                    className="h-11 px-4 rounded-xl bg-[#f75142] hover:bg-[#e04436] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Cadastramento</span>
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar por nome, B.I., número de agente ou categoria..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-[#f75142]"
                  />
                </div>

                <div>
                  <select
                    value={schoolFilter}
                    onChange={(e) => setSchoolFilter(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-[#f75142] cursor-pointer"
                  >
                    <option value="ALL">Todas as Escolas</option>
                    {uniqueSchools.map((sc) => (
                      <option key={sc} value={sc}>
                        {sc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-[#D9D6CC] shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span>Total de Registos Encontrados: <strong>{filteredRecords.length}</strong></span>
                <span className="text-[11px] text-slate-500">Prevenção activa de B.I. e Agente duplicados</span>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-3">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold">Nenhum funcionário encontrado com estes filtros.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSchoolFilter('ALL');
                    }}
                    className="text-xs text-[#f75142] hover:underline font-bold cursor-pointer"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px] border-b border-slate-200">
                        <th className="py-3 px-4 w-12 text-center">Nº</th>
                        <th className="py-3 px-4">Nome Completo</th>
                        <th className="py-3 px-3">B.I.</th>
                        <th className="py-3 px-3">Nº Agente</th>
                        <th className="py-3 px-3">Categoria & Grau</th>
                        <th className="py-3 px-4">Escola / Estabelecimento</th>
                        <th className="py-3 px-3">Data Registo</th>
                        <th className="py-3 px-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-bold text-slate-400">
                            {String(index + 1).padStart(2, '0')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-sm">{item.nome}</div>
                            <div className="text-[11px] text-slate-500">{item.funcao}</div>
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                            {item.bi}
                          </td>
                          <td className="py-3 px-3 font-bold text-[#002133]">
                            {item.agente}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800">{item.categoria}</span>
                            <div className="text-[10px] text-slate-500">{item.grau}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {item.escola}
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-[11px]">
                            {item.cadastradoEm}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenViewFicha(item)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#002133] hover:bg-[#00314d] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Ver e exportar Declaração / Ficha em PDF"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ficha</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartEditRecord(item)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] cursor-pointer transition-colors"
                                title="Editar dados"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteRecord(item.id, item.nome)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] cursor-pointer transition-colors"
                                title="Eliminar registo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: FICHA DE CADASTRO OFICIAL / DECLARAÇÃO (FOLHA A4 PDF)   */}
        {/* ============================================================== */}
        {activeTab === 'view-ficha' && selectedRecordForView && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Top Toolbar for PDF Export and Actions */}
            <div className="no-print bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('database')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar à Tabela</span>
                </button>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Ficha Oficial de {selectedRecordForView.nome}
                  </h2>
                  <p className="text-xs text-slate-500">
                    B.I.: {selectedRecordForView.bi} • Agente: {selectedRecordForView.agente}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Export PDF & Print */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="inline-flex items-center gap-2 bg-[#f75142] hover:bg-[#e04436] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer"
                  title="Exportar documento completo em PDF através do diálogo de impressão"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Exportar em PDF / Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartEditRecord(selectedRecordForView)}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-300"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Corrigir Dados</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteRecord(selectedRecordForView.id, selectedRecordForView.nome)}
                  className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-red-200"
                  title="Eliminar este cadastro da base de dados"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Eliminar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormData(getInitialFormState(currentUser));
                    setActiveTab('form');
                  }}
                  className="inline-flex items-center gap-1.5 bg-[#002133] hover:bg-[#00314d] text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Cadastro</span>
                </button>
              </div>
            </div>

            {/* Official A4 Sheet Certificate Layout */}
            {(() => {
              const isFeminino =
                selectedRecordForView.tratamento === 'Senhora' ||
                selectedRecordForView.nome.toLowerCase().includes('maria ') ||
                selectedRecordForView.nome.toLowerCase().startsWith('maria') ||
                selectedRecordForView.nome.toLowerCase().includes('teresa') ||
                selectedRecordForView.nome.toLowerCase().includes('ana ');

              const artigoTratamento = isFeminino ? 'a Senhora' : 'o Senhor';
              const filhoFilha = isFeminino ? 'filha' : 'filho';
              const nascidoNascida = isFeminino ? 'nascida' : 'nascido';
              const funcionarioFuncionaria = isFeminino ? 'funcionária' : 'funcionário';
              const colocadoColocada = isFeminino ? 'colocada' : 'colocado';
              const interessadoInteressada = isFeminino ? 'pela interessada' : 'pelo interessado';

              const funcaoTexto = selectedRecordForView.funcao.toLowerCase().includes('docente')
                ? 'docentes'
                : selectedRecordForView.funcao.toLowerCase().startsWith('funções')
                ? selectedRecordForView.funcao.replace(/^funções\s+/i, '')
                : `de ${selectedRecordForView.funcao}`;

              const cleanFinalidade = selectedRecordForView.finalidade
                .replace(/^à\s+/i, '')
                .replace(/^a\s+/i, '');

              const dataEmissaoExtenso = formatAngolanDateExtenso(selectedRecordForView.dataEmissao);
              const nascimentoExtenso = formatAngolanDateExtenso(selectedRecordForView.nascimento);
              const biEmissaoExtenso = formatAngolanDateExtenso(selectedRecordForView.biEmissao);

              const directorNome = selectedRecordForView.director?.trim() || 'Belizio Miguel dos Santos António';

              return (
                <div className="flex justify-center w-full">
                  <div
                    id="oficial-a4-sheet"
                    className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl border border-slate-300 p-10 sm:p-14 md:p-16 text-slate-950 flex flex-col justify-between mx-auto print:shadow-none print:border-none print:p-12 print:m-0 print:w-full print:min-h-0"
                    style={{ fontFamily: "'Times New Roman', Times, 'Source Serif 4', Georgia, serif" }}
                  >
                    <div>
                      {/* 1. Official Angolan Government Header */}
                      <div className="text-center pb-2 mb-6 font-sans">
                        {/* Insígnia da República de Angola */}
                        <div className="flex justify-center mb-3">
                          <img
                            src={emblemAngolaImg}
                            alt="Insígnia da República de Angola"
                            className="w-20 sm:w-24 h-auto max-h-24 object-contain mx-auto"
                          />
                        </div>

                        <p className="text-[13px] sm:text-[14px] font-black uppercase tracking-widest text-slate-900 leading-tight">
                          REPÚBLICA DE ANGOLA
                        </p>
                        <p className="text-[11.5px] sm:text-[12.5px] font-bold text-slate-800 uppercase tracking-wide leading-tight mt-1">
                          GOVERNO PROVINCIAL DE {selectedRecordForView.governoProv ? selectedRecordForView.governoProv.toUpperCase() : 'MALANJE'}
                        </p>
                        <p className="text-[11.5px] sm:text-[12.5px] font-bold uppercase text-slate-800 tracking-wide leading-tight mt-0.5">
                          ADMINISTRAÇÃO MUNICIPAL DO {selectedRecordForView.administracao ? selectedRecordForView.administracao.toUpperCase() : 'QUÊSSUA'}
                        </p>
                        <p className="text-[11.5px] sm:text-[12.5px] font-bold uppercase text-slate-800 tracking-wide leading-tight mt-0.5">
                          DIRECÇÃO MUNICIPAL DE {selectedRecordForView.direccao ? selectedRecordForView.direccao.toUpperCase() : 'EDUCAÇÃO'}
                        </p>

                        <div className="pt-7 pb-2">
                          <h1 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-wider text-slate-950 inline-block border-b-2 border-slate-900 pb-1">
                            DECLARAÇÃO DE EFECTIVIDADE
                          </h1>
                        </div>
                      </div>

                      {/* 2. Official Declaration Text Content */}
                      <div className="mt-8 text-[14px] sm:text-[15px] md:text-[15.5px] text-justify leading-[2] sm:leading-[2.1] text-slate-900 space-y-6">
                        <p className="indent-8 sm:indent-12">
                          Para os devidos efeitos legais e administrativos, a Direcção Municipal da Educação do Quêssua declara, para os fins a que se destina, que {artigoTratamento} <strong>{selectedRecordForView.nome}</strong>, {filhoFilha} de <strong>{selectedRecordForView.pai}</strong> e de <strong>{selectedRecordForView.mae}</strong>, natural de <strong>{selectedRecordForView.naturalidade}</strong>, Província de <strong>{selectedRecordForView.provNat}</strong>, {nascidoNascida} aos <strong>{nascimentoExtenso}</strong>, titular do Bilhete de Identidade n.º <strong className="font-mono tracking-wide">{selectedRecordForView.bi}</strong>, emitido aos <strong>{biEmissaoExtenso}</strong>, é {funcionarioFuncionaria} do Sector da Educação, exercendo funções {funcaoTexto} no Município do {selectedRecordForView.municipio}, onde se encontra {colocadoColocada} no <strong>{selectedRecordForView.escola}</strong>, com a categoria profissional de <strong>{selectedRecordForView.categoria}</strong> do <strong>{selectedRecordForView.grau}</strong>, titular do número de agente <strong>{selectedRecordForView.agente}</strong>.
                        </p>

                        <p className="indent-8 sm:indent-12">
                          Mais se declara que a presente declaração é emitida para efeitos de comprovação da sua efectividade no Sector da Educação, destinando-se, especificamente, à {cleanFinalidade}, para os fins administrativos e profissionais legalmente previstos.
                        </p>

                        <p className="indent-8 sm:indent-12">
                          A presente declaração comprova os elementos de identificação e de enquadramento profissional acima indicados, devendo ser utilizada exclusivamente para a finalidade que motivou a sua emissão, sem prejuízo da apresentação de outros documentos exigidos pelas entidades competentes no âmbito do referido processo concursal.
                        </p>

                        <p className="indent-8 sm:indent-12">
                          Por corresponder à verdade e por ter sido solicitada {interessadoInteressada}, mandei passar a presente declaração, que vai por mim assinada e autenticada com o carimbo a óleo em uso nesta Direcção, para que produza os efeitos administrativos a que se destina.
                        </p>
                      </div>
                    </div>

                    {/* 3. Footer, Date and Official Signatures Block */}
                    <div className="pt-10 mt-10">
                      {/* Date line */}
                      <div className="text-right text-[13.5px] sm:text-[14.5px] mb-12">
                        <span>
                          Direcção Municipal de Educação do Quêssua, Quêssua aos {dataEmissaoExtenso}.
                        </span>
                      </div>

                      {/* Signatures */}
                      <div className="flex flex-col items-center justify-center pt-6">
                        <div className="text-center min-w-[280px] sm:min-w-[340px]">
                          <p className="text-[14px] sm:text-[15px] font-bold text-slate-900 mb-10 font-serif">
                            O Director Municipal
                          </p>
                          <div className="border-b border-slate-900 mx-auto w-full max-w-[280px]"></div>
                          <p className="text-[14px] sm:text-[15px] font-bold text-slate-950 mt-2 font-serif">
                            {directorNome}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* Modal de Confirmação para Eliminar Registo Individual */}
      {recordToDelete && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Eliminar Cadastro?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tem a certeza que deseja eliminar o cadastro de <strong className="text-slate-950 font-bold">{recordToDelete.nome}</strong> da base de dados?
              </p>
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-left font-medium">
                Aviso: Esta ação removerá o registo permanentemente da base de dados do sistema Sigre.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => executeDeleteRecord(recordToDelete.id, recordToDelete.nome)}
                className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Esvaziar Toda a Base de Dados */}
      {showClearAllModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Esvaziar Toda a Base de Dados?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tem a certeza que deseja eliminar <strong>todos os {records.length} funcionários cadastrados</strong> da base de dados?
              </p>
              <p className="text-[11px] text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200 text-left font-medium">
                Aviso: Esta ação é definitiva e apagará todos os cadastros de pessoal guardados nesta base de dados.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeClearDatabase}
                className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Esvaziar Tudo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
