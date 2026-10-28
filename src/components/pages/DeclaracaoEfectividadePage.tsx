import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  AlertTriangle,
  ShieldCheck,
  ArrowLeft,
  Eye,
  Clock,
  Archive,
  Lock,
  Landmark,
  Database,
  ChevronDown,
  ChevronUp,
  School,
  X,
  Sparkles,
  CalendarRange,
  MapPin,
} from 'lucide-react';
import { Hero } from '../Hero';
import emblemAngolaImg from '../../assets/images/Emblem_of_Angola.svg.webp';
import { BackupManagerModal } from '../modals/BackupManagerModal';
import { QuickRequestsManagementView } from '../quick-services/QuickRequestsManagementView';
import { DeclaracaoServicoSection } from './DeclaracaoServicoSection';
import { GuiaFeriasSection } from './GuiaFeriasSection';
import { GuiaColocacaoSection } from './GuiaColocacaoSection';
import type { UserAccount } from '../../types';
import {
  CadastramentoEfectividadeRecord,
  ANGOLA_PROVINCIAS,
  getStoredEfectividadeRecords,
  saveEfectividadeRecord,
  deleteEfectividadeRecord,
  clearAllEfectividadeRecords,
  findDuplicateEfectividade,
  formatAngolanDateExtenso,
  syncEfectividadeFromServer,
} from '../../utils/efectividadeStorage';
import { fetchQuickRequests, submitQuickServiceRequest } from '../../utils/quickServicesStorage';
import {
  isFemaleFirstName,
  resolveIsFeminino,
  adaptOccupationalTextToGender,
  getPreposicaoEscola,
  getPreposicaoProvincia,
  formatFinalidadeWithPreposition,
} from '../../utils/genderGrammar';
import {
  downloadDeclaracaoEfectividadePdf,
  printSinglePageA4Clean,
} from '../../utils/declaracaoPdfGenerator';

interface DeclaracaoEfectividadePageProps {
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
  currentUser?: UserAccount | null;
  onNavigateHome?: () => void;
  initialTab?: ActiveTab;
}

type ActiveTab = 'form' | 'declaracao-servico' | 'guia-ferias' | 'guia-colocacao' | 'database' | 'pedidos' | 'view-ficha';

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

const ESCOLAS_QUESSUA_LIST = [
  'Liceu Nº 314 MJE - 4 de Janeiro – Quêssua',
  'Instituto Técnico Agrário do Quêssua-27009 - MJE',
  'Complexo Escolar Católico n.º 166 MJE São Pedro – Quêssua',
  'Complexo Escolar Católico n.º 269 MJE – Lar Nazaré – Quêssua',
  'Complexo Escolar Católico n.º 274 MJE – Nossa Senhora de Guadalupe – Quêssua',
  'Complexo Escolar Católico n.º 282 MJE – Kudyelela – Quêssua',
  'Complexo Escolar Católico n.º 290 MJE – Paz e Amor – Quêssua',
  'Complexo Escolar Católico n.º 293 MJE – São Francisco de Assis – Quêssua',
  'Complexo Escolar Metodista n.º 294 MJE – Missão do Quêssua – Quêssua',
  'Complexo Escolar Metodista Sião n.º 288 MJE – Episcopal Africana – Quêssua',
  'Complexo Escolar Metodista Sião n.º 289 MJE – Monte Sinai – Quêssua',
  'Complexo Escolar Missionário n.º 263 MJE – Bom Deus – Quêssua',
  'Complexo Escolar n.º 285 MJE – Cambondo – Quêssua',
  'Complexo Escolar n.º 291 MJE – Quissol – Quêssua',
  'Complexo Escolar n.º 292 MJE – Samora Machel – Quêssua',
  'Escola Primária Metodista n.º 209 MJE – São Paulo – Quêssua',
  'Escola Primária Metodista Sião n.º 207 MJE – Rei Salomão – Quêssua',
  'Escola Primária Católica n.º 202 MJE – Edith Almeida De Sousa – Quêssua',
  'Escola Primária Católica n.º 208 MJE – Santa Teresinha – Quêssua',
  'Escola Primária Católica n.º 210 MJE – Vila Matilde – Quêssua',
  'Escola Primária IEPA n.º 163 MJE – Rev. Ferreira Francisco – Quêssua',
  'Escola Primária n.º 115 MJE – Cabuabuata – Quêssua',
  'Escola Primária n.º 199 MJE – Campo da Vitória – Quêssua',
  'Escola Primária n.º 200 MJE – Comandante Gika – Quêssua',
  'Escola Primária n.º 201 MJE – Dr. António Agostinho Neto – Quêssua',
  'Escola Primária n.º 203 MJE – Luzia Inglês Van – Quêssua',
  'Escola Primária n.º 204 MJE – Major Kanhangulo – Quêssua',
  'Escola Primária n.º 205 MJE – Quizanga – Quêssua',
  'Escola Primária n.º 206 MJE – Quizanga da Barraca – Quêssua',
  'Escola Primária n.º 125 – Cazeta – Quêssua',
];

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
  initialTab = 'form',
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [quickRequestsCount, setQuickRequestsCount] = useState<number>(0);
  const [records, setRecords] = useState<CadastramentoEfectividadeRecord[]>(() =>
    getStoredEfectividadeRecords()
  );
  const [formData, setFormData] = useState<FormState>(() => getInitialFormState(currentUser));
  const [selectedRecordForView, setSelectedRecordForView] =
    useState<CadastramentoEfectividadeRecord | null>(null);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [manualTratamento, setManualTratamento] = useState(false);
  const [viewGenderOverride, setViewGenderOverride] = useState<boolean>(false);

  // Top sub-view selector inside Declaração de Efectividade: Base de Dados, Pré-visualização, Formulário
  const [efectividadeSubView, setEfectividadeSubView] = useState<'database' | 'preview' | 'form'>('form');

  // Database search, filters & safety backup states
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [recordToDelete, setRecordToDelete] = useState<{ id: string; nome: string } | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearAllConfirmationCode, setClearAllConfirmationCode] = useState('');
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const isSuperAdmin = currentUser?.email?.toLowerCase().trim() === 'beliziodos20@gmail.com';
  const isAdminOrDirector = Boolean(
    isLoggedIn &&
      currentUser &&
      (currentUser.role === 'admin' || currentUser.role === 'diretor')
  );

  const reloadRecords = () => {
    setRecords(getStoredEfectividadeRecords());
  };

  const reloadQuickRequests = () => {
    fetchQuickRequests()
      .then((reqs) => {
        if (Array.isArray(reqs)) {
          setQuickRequestsCount(
            reqs.filter((r) => r.status === 'PENDENTE' || r.status === 'EM_ANALISE').length
          );
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    reloadRecords();
    reloadQuickRequests();
    syncEfectividadeFromServer()
      .then((synced) => {
        if (Array.isArray(synced)) {
          setRecords(synced);
        }
      })
      .catch(() => {});

    const handler = () => reloadRecords();
    const quickHandler = () => reloadQuickRequests();
    window.addEventListener('sigre-efectividade-updated', handler);
    window.addEventListener('sigre-database-restored', handler);
    window.addEventListener('sigre_quick_request_created', quickHandler);
    window.addEventListener('sigre_quick_request_updated', quickHandler);
    window.addEventListener('storage', handler);

    const pollInterval = setInterval(() => {
      syncEfectividadeFromServer()
        .then((synced) => {
          if (Array.isArray(synced)) {
            setRecords(synced);
          }
        })
        .catch(() => {});
      reloadQuickRequests();
    }, 4500);

    return () => {
      window.removeEventListener('sigre-efectividade-updated', handler);
      window.removeEventListener('sigre-database-restored', handler);
      window.removeEventListener('sigre_quick_request_created', quickHandler);
      window.removeEventListener('sigre_quick_request_updated', quickHandler);
      window.removeEventListener('storage', handler);
      clearInterval(pollInterval);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Estado do combobox/autocomplete com sugestões dinâmicas de escolas
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  const schoolDropdownRef = useRef<HTMLDivElement>(null);

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

  // Consolidação de todas as escolas disponíveis (lista oficial + registos existentes + escolas do sistema)
  const allAvailableSchools = useMemo(() => {
    const set = new Set<string>(ESCOLAS_QUESSUA_LIST);
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

  // Sugestões filtradas dinamicamente à medida que a pessoa digita
  const schoolSuggestions = useMemo(() => {
    const q = (formData.escola || '').trim().toLowerCase();
    if (!q) return allAvailableSchools;
    return allAvailableSchools.filter((school) => school.toLowerCase().includes(q));
  }, [formData.escola, allAvailableSchools]);

  // Verifica se a escola digitada corresponde exactamente a uma já cadastrada
  const isExactRegisteredSchool = useMemo(() => {
    const q = (formData.escola || '').trim().toLowerCase();
    if (!q) return false;
    return allAvailableSchools.some((s) => s.toLowerCase() === q);
  }, [formData.escola, allAvailableSchools]);

  // Real-time duplicate check based on current typed BI and Agente
  const currentDuplicate = useMemo(() => {
    if (!formData.bi && !formData.agente) return null;
    const res = findDuplicateEfectividade(formData.bi, formData.agente, formData.id);
    return res.isDuplicate ? res : null;
  }, [formData.bi, formData.agente, formData.id, records]);

  // Live preview record constructed from current formData (updates keystroke-by-keystroke)
  const liveEfectividadeRecord: CadastramentoEfectividadeRecord = useMemo(() => {
    const today = getTodayIso();
    return {
      id: formData.id || 'live-preview',
      nome: formData.nome.trim() || '[Nome Completo do Funcionário]',
      tratamento: formData.tratamento || 'Senhor',
      nascimento: formData.nascimento || '1988-05-12',
      pai: formData.pai.trim() || '[Nome Completo do Pai]',
      mae: formData.mae.trim() || '[Nome Completo da Mãe]',
      naturalidade: formData.naturalidade.trim() || 'Malanje',
      provNat: formData.provNat || 'Malanje',
      bi: formData.bi.trim().toUpperCase() || '[000000000AA000]',
      biEmissao: formData.biEmissao || today,
      sector: formData.sector.trim() || 'Educação',
      funcao: formData.funcao.trim() || 'Docente',
      municipio: formData.municipio.trim() || 'Quêssua',
      agente: formData.agente.trim() || '[Nº Agente]',
      escola:
        formData.escola.trim() ||
        'Complexo Escolar Católico n.º 166 MJE São Pedro – Quêssua',
      categoria: formData.categoria.trim() || 'P.E.P.E.S.',
      grau: formData.grau.trim() || '11.º Grau',
      finalidade:
        formData.finalidade.trim() ||
        'Instrução do processo de candidatura ao Concurso Público de Acesso e de Ingresso Interno no Sector da Educação',
      governoProv: formData.governoProv.trim() || 'Malanje',
      administracao: formData.administracao.trim() || 'Quêssua',
      direccao: formData.direccao.trim() || 'Educação',
      director: formData.director.trim() || 'Belizio Miguel dos Santos António',
      local: formData.local.trim() || 'Quêssua',
      dataEmissao: formData.dataEmissao || today,
      cadastradoEm: today,
      status: 'homologado',
    };
  }, [formData]);

  // Validate form fields
  const validateForm = (data: FormState) => {
    const errs: Record<string, string> = {};
    const today = getTodayIso();

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

    const cleanBi = data.bi.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanBi) {
      errs.bi = 'Preencha o número do Bilhete de Identidade.';
    } else if (!/^\d{9}[A-Za-z]{2}\d{3}$/.test(cleanBi)) {
      errs.bi =
        'Formato inválido. O B.I. deve ter 9 dígitos, 2 letras e 3 dígitos (ex: 000000000AA000).';
    }

    if (!data.biEmissao) {
      errs.biEmissao = 'Indique a data de emissão do Bilhete de Identidade.';
    } else if (data.biEmissao > today) {
      errs.biEmissao = 'A data de emissão não pode ser posterior à data de hoje.';
    } else if (data.nascimento && data.biEmissao <= data.nascimento) {
      errs.biEmissao = 'A data de emissão tem de ser posterior ao nascimento.';
    }

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
    if (!data.finalidade.trim()) errs.finalidade = 'Indique a finalidade da declaração.';

    return errs;
  };

  const handleInputChange = (field: keyof FormState, value: string) => {
    if (field === 'tratamento') {
      setManualTratamento(true);
    }
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'nome' && !manualTratamento) {
        next.tratamento = isFemaleFirstName(value) ? 'Senhora' : 'Senhor';
      }
      return next;
    });
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleToggleFichaGender = (targetTratamento: 'Senhor' | 'Senhora') => {
    if (!selectedRecordForView) return;
    setViewGenderOverride(true);
    const updated: CadastramentoEfectividadeRecord = {
      ...selectedRecordForView,
      tratamento: targetTratamento,
    };
    setSelectedRecordForView(updated);
    const saved = saveEfectividadeRecord({
      ...updated,
      id: updated.id,
    });
    if (saved.success) {
      reloadRecords();
    }
  };

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

    // Regra de privacidade: Usuários sem privilégio de administração apenas fazem o seu pedido e enviam para a Admin
    if (!isAdminOrDirector) {
      submitQuickServiceRequest({
        serviceType: 'DECLARACAO_EFECTIVIDADE',
        title: `Declaração de Efectividade - ${formData.nome.trim()}`,
        requesterName: formData.nome.trim(),
        requesterPhone: formData.bi.trim(),
        requesterRoleTitle: formData.funcao || 'Docente',
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
        showToast(`Pedido enviado com sucesso para a Admin Municipal! Protocolo: ${req.protocol}`);
        handleClearForm();
      }).catch(() => {
        showToast('Erro ao submeter o pedido. Tente novamente.');
      });
      return;
    }

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
    setEfectividadeSubView('preview');
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
    setManualTratamento(true);
    setFormSubmitted(false);
    setFormErrors({});
    setActiveTab('form');
    setEfectividadeSubView('form');
    showToast(`Dados de ${record.nome} carregados no formulário e na pré-visualização A4.`);
  };

  const handleClearForm = () => {
    setFormData(getInitialFormState(currentUser));
    setManualTratamento(false);
    setFormSubmitted(false);
    setFormErrors({});
    setEfectividadeSubView('form');
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
      setActiveTab('form');
    }
  };

  const handleClearDatabase = () => {
    if (records.length === 0) {
      showToast('A base de dados já se encontra vazia.');
      return;
    }
    if (!isSuperAdmin) {
      showToast(
        'Apenas o Administrador Máximo (beliziodos20@gmail.com) tem autorização para esvaziar a base de dados.'
      );
      return;
    }
    setClearAllConfirmationCode('');
    setShowClearAllModal(true);
  };

  const executeClearDatabase = async () => {
    if (!isSuperAdmin) {
      showToast(
        'Apenas o Administrador Máximo (beliziodos20@gmail.com) tem permissão para esta ação.'
      );
      setShowClearAllModal(false);
      return;
    }

    if (clearAllConfirmationCode.trim() !== 'SIGRE-BELIZIO-2026') {
      showToast('Código de autorização inválido. Digite SIGRE-BELIZIO-2026.');
      return;
    }

    const res = await clearAllEfectividadeRecords('beliziodos20@gmail.com', 'SIGRE-BELIZIO-2026');
    if (res.success) {
      setRecords([]);
      setSelectedRecordForView(null);
      setShowClearAllModal(false);
      setClearAllConfirmationCode('');
      showToast(
        'Base de dados esvaziada pelo Administrador Máximo. Ponto de segurança salvo no cofre.'
      );
    } else {
      showToast(res.error || 'Erro ao esvaziar base de dados.');
    }
  };

  const handlePrintDocument = () => {
    if (activeTab === 'declaracao-servico') {
      printSinglePageA4Clean('declaracao-servico-a4-sheet');
    } else {
      printSinglePageA4Clean('oficial-a4-sheet');
    }
  };

  const handleDownloadPdf = async (recordOverride?: CadastramentoEfectividadeRecord) => {
    const targetRecord =
      recordOverride ||
      (activeTab === 'view-ficha' && selectedRecordForView
        ? selectedRecordForView
        : liveEfectividadeRecord);
    if (!targetRecord) return;
    try {
      await downloadDeclaracaoEfectividadePdf(
        targetRecord,
        recordOverride ? null : viewGenderOverride || manualTratamento
      );
      showToast(`Declaração de Efectividade de ${targetRecord.nome} baixada em PDF (1 página A4).`);
    } catch {
      showToast('Erro ao gerar o ficheiro PDF. Tente novamente.');
    }
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

  const pillInputClass = (hasError?: boolean) =>
    `w-full h-11 px-4 rounded-full border bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
      hasError
        ? 'border-[#d92d20] bg-red-50/20 focus:border-[#d92d20] focus:ring-2 focus:ring-[#d92d20]/15'
        : 'border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
    }`;

  // Reusable Official A4 Sheet Renderer for Declaração de Efectividade
  const renderOfficialEfectividadeSheet = (
    record: CadastramentoEfectividadeRecord,
    useOverride: boolean
  ) => {
    const isFeminino = resolveIsFeminino(record.nome, record.tratamento, useOverride);

    const artigoTratamento = isFeminino ? 'a Senhora' : 'o Senhor';
    const filhoFilha = isFeminino ? 'filha' : 'filho';
    const nascidoNascida = isFeminino ? 'nascida' : 'nascido';
    const portadorPortadora = isFeminino ? 'portadora' : 'portador';
    const funcionarioFuncionaria = isFeminino ? 'funcionária' : 'funcionário';
    const colocadoColocada = isFeminino ? 'colocada' : 'colocado';
    const enquadradoEnquadrada = isFeminino ? 'enquadrada' : 'enquadrado';
    const inscritoInscrita = isFeminino ? 'inscrita' : 'inscrito';
    const referidoFuncionario = isFeminino ? 'a referida funcionária' : 'o referido funcionário';
    const doDaFuncionario = isFeminino ? 'da funcionária' : 'do funcionário';
    const peloMesmoPelaMesma = isFeminino ? 'pela mesma' : 'pelo mesmo';
    const interessadoInteressada = isFeminino ? 'pela interessada' : 'pelo interessado';

    const prepProvincia = getPreposicaoProvincia(record.provNat);
    const prepEscola = getPreposicaoEscola(record.escola);

    const rawFuncao = (record.funcao || 'Docente').trim();
    const adaptedFuncao = adaptOccupationalTextToGender(rawFuncao, isFeminino);
    const funcaoTexto = rawFuncao.toLowerCase().includes('docente')
      ? 'função docente'
      : rawFuncao.toLowerCase().startsWith('funções')
      ? `função ${adaptedFuncao.replace(/^funções\s+/i, '').replace(/s\b/g, '')}`
      : rawFuncao.toLowerCase().startsWith('função')
      ? adaptedFuncao
      : `a função de ${adaptedFuncao}`;

    const adaptedCategoria = adaptOccupationalTextToGender(
      record.categoria || 'P.E.P.E.S.',
      isFeminino
    );

    const finalidadeFormatted = formatFinalidadeWithPreposition(record.finalidade, isFeminino);

    const dataEmissaoExtenso = formatAngolanDateExtenso(record.dataEmissao);
    const nascimentoExtenso = formatAngolanDateExtenso(record.nascimento);
    const biEmissaoExtenso = formatAngolanDateExtenso(record.biEmissao);

    const directorNome = record.director?.trim() || 'Belizio Miguel dos Santos António';

    return (
      <div className="flex justify-center w-full print:block print:m-0 print:p-0">
        <div
          id="oficial-a4-sheet"
          className="bg-white w-full max-w-[210mm] p-6 sm:p-10 md:px-[20mm] md:py-[15mm] border border-slate-200/90 print:border-0 outline-none shadow-xs print:p-0 print:shadow-none text-black mx-auto"
          style={{ fontFamily: "'Times New Roman', Times, Georgia, serif" }}
        >
          <div>
            {/* 1. Official Angolan Government Header */}
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
                GOVERNO PROVINCIAL DE{' '}
                {record.governoProv ? record.governoProv.toUpperCase() : 'MALANJE'}
              </p>
              <p className="a4-inst-line">
                ADMINISTRAÇÃO MUNICIPAL DO{' '}
                {record.administracao ? record.administracao.toUpperCase() : 'QUÊSSUA'}
              </p>
              <p className="a4-inst-line">
                DIRECÇÃO MUNICIPAL DE{' '}
                {record.direccao ? record.direccao.toUpperCase() : 'EDUCAÇÃO'}
              </p>

              <div className="a4-title-wrap">
                <h1>DECLARAÇÃO DE EFECTIVIDADE</h1>
              </div>
            </div>

            {/* 2. Official Declaration Text Content (12pt) */}
            <div className="a4-body-copy">
              <p>
                Para os devidos efeitos legais e administrativos, a Direcção Municipal da Educação do
                Quêssua declara, para os fins a que se destina, que {artigoTratamento}{' '}
                <strong>{record.nome}</strong>, {filhoFilha} de <strong>{record.pai}</strong> e de{' '}
                <strong>{record.mae}</strong>, natural de <strong>{record.naturalidade}</strong>,
                Província {prepProvincia} <strong>{record.provNat}</strong>, {nascidoNascida} aos{' '}
                <strong>{nascimentoExtenso}</strong>, {portadorPortadora} do Bilhete de Identidade
                n.º <strong>{record.bi}</strong>, emitido aos <strong>{biEmissaoExtenso}</strong>, é{' '}
                {funcionarioFuncionaria} do Sector da Educação, exercendo {funcaoTexto} no Município
                do {record.municipio}, onde se encontra {colocadoColocada} {prepEscola}{' '}
                <strong>{record.escola}</strong>, {enquadradoEnquadrada} na categoria de{' '}
                <strong>{adaptedCategoria}</strong> do <strong>{record.grau}</strong>,{' '}
                {inscritoInscrita} sob o número de agente <strong>{record.agente}</strong>.
              </p>

              <p>
                Mais se declara que {referidoFuncionario} se encontra no efectivo exercício da sua
                função e que a presente declaração é emitida para efeitos de comprovação da sua
                efectividade no Sector da Educação, destinando-se, especificamente,{' '}
                {finalidadeFormatted.preposition} {finalidadeFormatted.text}, para os fins
                administrativos e profissionais legalmente previstos.
              </p>

              <p>
                A presente declaração comprova os elementos de identificação e de enquadramento
                profissional {doDaFuncionario} acima indicados, devendo ser utilizada exclusivamente{' '}
                {peloMesmoPelaMesma} para a finalidade que motivou a sua emissão, sem prejuízo da
                apresentação de outros documentos exigidos pelas entidades competentes no âmbito do
                referido processo concursal.
              </p>

              <p>
                Por corresponder à verdade e por ter sido solicitada {interessadoInteressada}, mandei
                passar a presente declaração, que vai por mim assinada e autenticada com o carimbo a
                óleo em uso nesta Direcção, para que produza os efeitos administrativos a que se
                destina.
              </p>
            </div>
          </div>

          {/* 3. Footer, Date and Official Signatures Block (12pt) */}
          <div className="a4-footer-block">
            <div className="a4-date-line">
              <span>
                Direcção Municipal de Educação do Quêssua, Quêssua aos {dataEmissaoExtenso}.
              </span>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="a4-sig-container">
                <p className="a4-sig-role">O Director Municipal</p>
                <div className="a4-sig-line"></div>
                <p className="a4-sig-name">{directorNome}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      id="declaracao-efectividade-page"
      className="w-full min-h-screen bg-[#f8f9fa] flex flex-col font-sans"
    >
      {/* Print CSS rules - ensures strict single-page A4 portrait format */}
      <style>{`
        #oficial-a4-sheet,
        #oficial-a4-sheet *,
        #declaracao-servico-a4-sheet,
        #declaracao-servico-a4-sheet *,
        #guia-ferias-a4-sheet,
        #guia-ferias-a4-sheet *,
        #guia-colocacao-a4-sheet,
        #guia-colocacao-a4-sheet * {
          font-family: 'Times New Roman', Times, serif !important;
          color: #000000;
        }
        #oficial-a4-sheet .a4-emblem-img,
        #declaracao-servico-a4-sheet .a4-emblem-img,
        #guia-ferias-a4-sheet .a4-emblem-img,
        #guia-colocacao-a4-sheet .a4-emblem-img {
          width: 60px;
          height: auto;
          max-height: 60px;
          object-fit: contain;
          display: block;
          margin: 0 auto 6px auto;
        }
        #oficial-a4-sheet .a4-header-block,
        #declaracao-servico-a4-sheet .a4-header-block,
        #guia-ferias-a4-sheet .a4-header-block,
        #guia-colocacao-a4-sheet .a4-header-block {
          text-align: center;
          font-family: 'Times New Roman', Times, serif !important;
          margin-bottom: 10pt;
          padding-bottom: 0;
          border: 0;
        }
        #oficial-a4-sheet .a4-header-block p.a4-republic-title,
        #declaracao-servico-a4-sheet .a4-header-block p.a4-republic-title,
        #guia-ferias-a4-sheet .a4-header-block p.a4-republic-title,
        #guia-colocacao-a4-sheet .a4-header-block p.a4-republic-title {
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 14pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          line-height: 1.25;
          margin: 0 0 2pt 0;
          color: #000000;
        }
        #oficial-a4-sheet .a4-header-block p.a4-inst-line,
        #declaracao-servico-a4-sheet .a4-header-block p.a4-inst-line,
        #guia-ferias-a4-sheet .a4-header-block p.a4-inst-line,
        #guia-colocacao-a4-sheet .a4-header-block p.a4-inst-line {
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.01em;
          line-height: 1.25;
          margin: 1.5pt 0;
          color: #000000;
        }
        #oficial-a4-sheet .a4-title-wrap,
        #declaracao-servico-a4-sheet .a4-title-wrap,
        #guia-ferias-a4-sheet .a4-title-wrap,
        #guia-colocacao-a4-sheet .a4-title-wrap {
          padding-top: 12pt;
          padding-bottom: 4pt;
          text-align: center;
        }
        #oficial-a4-sheet .a4-title-wrap h1,
        #declaracao-servico-a4-sheet .a4-title-wrap h1,
        #guia-ferias-a4-sheet .a4-title-wrap h1,
        #guia-colocacao-a4-sheet .a4-title-wrap h1 {
          display: inline-block;
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 14pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          line-height: 1.25;
          color: #000000;
          border-bottom: 1.5px solid #000000;
          padding-bottom: 2pt;
          margin: 0;
        }
        #oficial-a4-sheet .a4-body-copy {
          margin-top: 10pt;
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt;
          line-height: 1.42;
          text-align: justify;
          color: #000000;
        }
        #declaracao-servico-a4-sheet .a4-body-copy,
        #guia-ferias-a4-sheet .a4-body-copy,
        #guia-colocacao-a4-sheet .a4-body-copy {
          margin-top: 12pt;
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt;
          line-height: 1.5;
          text-align: justify;
          color: #000000;
        }
        #oficial-a4-sheet .a4-body-copy p {
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt;
          line-height: 1.42;
          text-align: justify;
          text-indent: 1.25cm;
          margin: 0 0 8pt 0;
          color: #000000;
        }
        #declaracao-servico-a4-sheet .a4-body-copy p,
        #guia-ferias-a4-sheet .a4-body-copy p,
        #guia-colocacao-a4-sheet .a4-body-copy p {
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt;
          line-height: 1.5;
          text-align: justify;
          text-indent: 1.25cm;
          margin: 0 0 10pt 0;
          color: #000000;
        }
        #oficial-a4-sheet .a4-body-copy strong,
        #declaracao-servico-a4-sheet .a4-body-copy strong,
        #guia-ferias-a4-sheet .a4-body-copy strong,
        #guia-colocacao-a4-sheet .a4-body-copy strong {
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt;
          font-weight: 700;
        }
        #oficial-a4-sheet .a4-footer-block,
        #declaracao-servico-a4-sheet .a4-footer-block,
        #guia-ferias-a4-sheet .a4-footer-block,
        #guia-colocacao-a4-sheet .a4-footer-block {
          margin-top: 14pt;
          padding-top: 2pt;
          border: 0;
        }
        #oficial-a4-sheet .a4-date-line,
        #oficial-a4-sheet .a4-date-line span,
        #declaracao-servico-a4-sheet .a4-date-line,
        #declaracao-servico-a4-sheet .a4-date-line span,
        #guia-ferias-a4-sheet .a4-date-line,
        #guia-ferias-a4-sheet .a4-date-line span,
        #guia-colocacao-a4-sheet .a4-date-line,
        #guia-colocacao-a4-sheet .a4-date-line span {
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt;
          line-height: 1.35;
          text-align: right;
          margin-bottom: 20pt;
          color: #000000;
        }
        #oficial-a4-sheet .a4-sig-container,
        #declaracao-servico-a4-sheet .a4-sig-container,
        #guia-ferias-a4-sheet .a4-sig-container,
        #guia-colocacao-a4-sheet .a4-sig-container {
          text-align: center;
          width: 280px;
          margin: 0 auto;
        }
        #oficial-a4-sheet .a4-sig-role,
        #declaracao-servico-a4-sheet .a4-sig-role,
        #guia-ferias-a4-sheet .a4-sig-role,
        #guia-colocacao-a4-sheet .a4-sig-role {
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt;
          font-weight: 700;
          line-height: 1.3;
          margin: 0 0 26pt 0;
          color: #000000;
        }
        #oficial-a4-sheet .a4-sig-line,
        #declaracao-servico-a4-sheet .a4-sig-line,
        #guia-ferias-a4-sheet .a4-sig-line,
        #guia-colocacao-a4-sheet .a4-sig-line {
          border-bottom: 1px solid #000000;
          width: 250px;
          margin: 0 auto;
        }
        #oficial-a4-sheet .a4-sig-name,
        #declaracao-servico-a4-sheet .a4-sig-name,
        #guia-ferias-a4-sheet .a4-sig-name,
        #guia-colocacao-a4-sheet .a4-sig-name {
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt;
          font-weight: 700;
          line-height: 1.3;
          margin: 5pt 0 0 0;
          color: #000000;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html,
          body {
            display: block !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 296mm !important;
            max-height: 296mm !important;
            overflow: hidden !important;
            border: 0 !important;
            outline: 0 !important;
            box-shadow: none !important;
          }
          #root,
          #root > div,
          #main-content,
          #declaracao-efectividade-page,
          #declaracao-efectividade-page > main,
          #declaracao-efectividade-page > main > div,
          #declaracao-efectividade-page > main > div > div {
            display: block !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: 296mm !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            transform: none !important;
            zoom: 1 !important;
            overflow: hidden !important;
            border: 0 !important;
            outline: 0 !important;
            box-shadow: none !important;
          }
          #siteHeader,
          #ucore-hero-section,
          #ucore-cloud-footer,
          #page-tabs-bar,
          #service-left-sidebar,
          #btn-floating-support-chat,
          #system-toast-notification,
          .skip-to-content-link,
          .no-print,
          header,
          footer,
          nav,
          aside {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          #oficial-a4-sheet,
          #oficial-a4-sheet *,
          #declaracao-servico-a4-sheet,
          #declaracao-servico-a4-sheet *,
          #guia-ferias-a4-sheet,
          #guia-ferias-a4-sheet *,
          #guia-colocacao-a4-sheet,
          #guia-colocacao-a4-sheet * {
            font-family: 'Times New Roman', Times, serif !important;
          }
          #oficial-a4-sheet,
          #declaracao-servico-a4-sheet,
          #guia-ferias-a4-sheet,
          #guia-colocacao-a4-sheet {
            display: block !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: 0 !important;
            outline: 0 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            padding: 15mm 20mm !important;
            margin: 0 auto !important;
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 0 !important;
            height: 296mm !important;
            max-height: 296mm !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
          }
        }
      `}</style>

      {/* Hero Banner */}
      <div className="no-print">
        <Hero
          onOpenGetStarted={onOpenGetStarted}
          customTitle={
            activeTab === 'declaracao-servico'
              ? 'Declaração de Serviço'
              : activeTab === 'guia-ferias'
              ? 'Guia de Férias'
              : activeTab === 'guia-colocacao'
              ? 'Guia de Colocação'
              : 'Cadastramento e Declarações Oficiais'
          }
          compact="ultra"
          isLoggedIn={isLoggedIn}
        />
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="no-print fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* EXEMPLAR WORKSPACE SHELL: Left Sidebar Card + Right Content Panel */}
      {/* ================================================================= */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row items-start gap-7">
          {/* LEFT SIDEBAR SELECTOR (EXACT EXEMPLAR DESIGN) */}
          <aside
            id="service-left-sidebar"
            aria-label="Seleção de tipos de serviço e operações"
            className="no-print w-full lg:w-[272px] shrink-0 lg:sticky lg:top-24 bg-white rounded-[24px] border border-slate-200/90 p-4 shadow-xs space-y-5"
          >
            {/* Group 1: Tipos de Serviço */}
            <div>
              <p className="text-xs font-medium text-slate-500 px-3 mb-1.5">
                Tipos de serviço
              </p>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className={`w-full rounded-2xl px-3.5 py-2.5 flex items-center gap-3 text-left text-sm transition-colors cursor-pointer ${
                    activeTab === 'form' || activeTab === 'view-ficha'
                      ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
                  <span className="truncate">Declaração de Efectividade</span>
                </button>

                <button
                  id="tab-declaracao-servico"
                  type="button"
                  onClick={() => setActiveTab('declaracao-servico')}
                  className={`w-full rounded-2xl px-3.5 py-2.5 flex items-center gap-3 text-left text-sm transition-colors cursor-pointer ${
                    activeTab === 'declaracao-servico'
                      ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <Landmark className="w-4 h-4 text-slate-700 shrink-0" />
                  <span className="truncate">Declaração de Serviço</span>
                </button>

                <button
                  id="tab-guia-ferias"
                  type="button"
                  onClick={() => setActiveTab('guia-ferias')}
                  className={`w-full rounded-2xl px-3.5 py-2.5 flex items-center gap-3 text-left text-sm transition-colors cursor-pointer ${
                    activeTab === 'guia-ferias'
                      ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <CalendarRange className="w-4 h-4 text-slate-700 shrink-0" />
                  <span className="truncate">Guia de Férias</span>
                </button>

                <button
                  id="tab-guia-colocacao"
                  type="button"
                  onClick={() => setActiveTab('guia-colocacao')}
                  className={`w-full rounded-2xl px-3.5 py-2.5 flex items-center gap-3 text-left text-sm transition-colors cursor-pointer ${
                    activeTab === 'guia-colocacao'
                      ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-slate-700 shrink-0" />
                  <span className="truncate">Guia de Colocação</span>
                </button>
              </div>
            </div>
          </aside>

          {/* RIGHT MAIN PANEL */}
          <div className="flex-1 min-w-0 w-full">
            {/* ============================================================== */}
            {/* SERVICE 1: DECLARAÇÃO DE EFECTIVIDADE                          */}
            {/* ============================================================== */}
            {activeTab === 'form' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Exemplar Top Title Bar */}
                <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-[#f2f4f7] border border-slate-200/80 flex items-center justify-center text-slate-800 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        Declaração de Efectividade
                      </h1>
                    </div>
                  </div>

                  {isAdminOrDirector ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClearForm}
                        className="h-10 px-4 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Novo Registo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf()}
                        className="h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Baixar PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePrintDocument}
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

                {/* ========================================================== */}
                {/* BARRA DE OPÇÕES NO TOPO: Base de Dados | Pré-visualização | Formulário */}
                {/* ========================================================== */}
                {isAdminOrDirector && (
                  <div className="no-print flex flex-wrap items-center gap-2 bg-white p-2 rounded-full border border-slate-200 w-fit shadow-xs">
                    <button
                      type="button"
                      onClick={() => setEfectividadeSubView('database')}
                      className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                        efectividadeSubView === 'database'
                          ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Database className="w-4 h-4 shrink-0" />
                      <span>Base de Dados ({records.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEfectividadeSubView('preview')}
                      className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                        efectividadeSubView === 'preview'
                          ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>Pré-visualização</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEfectividadeSubView('form')}
                      className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                        efectividadeSubView === 'form'
                          ? 'bg-[#f2f4f7] text-slate-950 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Edit className="w-4 h-4 shrink-0" />
                      <span>Formulário</span>
                    </button>
                  </div>
                )}

                {/* ========================================================== */}
                {/* OPÇÃO 1: BASE DE DADOS DA DECLARAÇÃO DE EFECTIVIDADE       */}
                {/* ========================================================== */}
                {efectividadeSubView === 'database' && (
                  <section className="no-print bg-white rounded-[24px] border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#f2f4f7] flex items-center justify-center text-slate-700">
                          <Database className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-sm sm:text-base font-bold text-slate-900">
                            Base de Dados — Declaração de Efectividade ({records.length})
                          </h2>
                          <p className="text-xs text-slate-500">
                            Consulte ou selecione qualquer funcionário para carregar automaticamente no documento
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
                            placeholder="Pesquisar nome, B.I. ou agente..."
                            className="w-full h-9 pl-9 pr-3.5 rounded-full border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-slate-900"
                          />
                        </div>

                        <select
                          value={schoolFilter}
                          onChange={(e) => setSchoolFilter(e.target.value)}
                          className="h-9 px-3.5 rounded-full border border-slate-300 bg-white text-xs text-slate-800 outline-none focus:border-slate-900 max-w-[200px] truncate cursor-pointer"
                        >
                          <option value="ALL">Todas as Escolas</option>
                          {uniqueSchools.map((sc) => (
                            <option key={sc} value={sc}>
                              {sc}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => setIsBackupModalOpen(true)}
                          className="h-9 px-3.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Cofre de Backups</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-[460px] overflow-y-auto border border-slate-200 rounded-2xl">
                      <table className="w-full border-collapse text-xs min-w-[780px]">
                        <thead className="sticky top-0 z-10 bg-[#f8f9fa]">
                          <tr>
                            <th className="text-center px-3 py-2.5 border-b border-slate-200 font-semibold text-slate-600 w-12">
                              Nº
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
                              Categoria & Escola
                            </th>
                            <th className="text-right px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredRecords.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                Nenhum funcionário encontrado com estes filtros.
                              </td>
                            </tr>
                          ) : (
                            filteredRecords.map((item, idx) => (
                              <tr
                                key={item.id}
                                className={`hover:bg-slate-50/90 transition-colors ${
                                  formData.id === item.id ? 'bg-slate-100/80' : ''
                                }`}
                              >
                                <td className="px-3 py-2.5 text-center font-mono text-slate-400 tabular-nums">
                                  {String(idx + 1).padStart(2, '0')}
                                </td>
                                <td className="px-3.5 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                                  {item.nome}
                                </td>
                                <td className="px-3.5 py-2.5 font-mono text-slate-700 whitespace-nowrap">
                                  {item.bi}
                                </td>
                                <td className="px-3.5 py-2.5 font-mono text-slate-800 font-semibold whitespace-nowrap">
                                  {item.agente}
                                </td>
                                <td className="px-3.5 py-2.5 text-slate-600 max-w-[260px] truncate">
                                  <span className="font-semibold text-slate-800">
                                    {item.categoria}
                                  </span>{' '}
                                  · {item.escola}
                                </td>
                                <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleStartEditRecord(item);
                                        setEfectividadeSubView('preview');
                                      }}
                                      className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1"
                                      title="Ver pré-visualização da declaração"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Ver Documento</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadPdf(item)}
                                      className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 cursor-pointer inline-flex items-center gap-1"
                                      title="Baixar Declaração em PDF (1 Página A4)"
                                    >
                                      <FileDown className="w-3 h-3" />
                                      <span>PDF</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditRecord(item)}
                                      className="p-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                                      title="Editar no formulário"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRecord(item.id, item.nome)}
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

                {/* ========================================================== */}
                {/* OPÇÃO 2: PRÉ-VISUALIZAÇÃO DO DOCUMENTO SENDO PREENCHIDO    */}
                {/* ========================================================== */}
                <section
                  id="efectividade-live-preview-panel"
                  className={`${
                    efectividadeSubView === 'preview' ? 'block' : 'hidden print:block'
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
                            Pré-visualização em Tempo Real — Declaração de Efectividade
                          </h2>
                          <span className="text-xs text-slate-500">
                            · {liveEfectividadeRecord.nome}
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
                          onClick={() => handleInputChange('tratamento', 'Senhor')}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                            formData.tratamento === 'Senhor'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Senhor
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInputChange('tratamento', 'Senhora')}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                            formData.tratamento === 'Senhora'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Senhora
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(liveEfectividadeRecord)}
                        className="h-9 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Baixar PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePrintDocument}
                        className="h-9 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir A4</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#f8f9fa] p-3 sm:p-6 rounded-2xl border border-slate-200/70 print:bg-white print:p-0 print:border-0">
                    {renderOfficialEfectividadeSheet(liveEfectividadeRecord, manualTratamento)}
                  </div>
                </section>

                {/* ========================================================== */}
                {/* OPÇÃO 3: FORMULÁRIO NO ESTILO DO EXEMPLAR                   */}
                {/* ========================================================== */}
                {efectividadeSubView === 'form' && (
                  <div className="no-print bg-white rounded-[24px] border border-slate-200 p-6 sm:p-8 shadow-xs space-y-7">
                  {/* Real-Time Duplicate Warning Alert */}
                  {currentDuplicate && currentDuplicate.duplicateRecord && (
                    <div
                      role="alert"
                      className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3.5 text-amber-950"
                    >
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1.5 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-amber-900">
                          Registo Existente na Base de Dados
                        </p>
                        <p className="text-xs text-amber-900 leading-relaxed">
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
                            className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
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
                        Modo de edição activo
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSubmitForm} className="space-y-7">
                    {/* 1. Identificação pessoal */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                          Identificação pessoal e filiação
                        </h3>
                        <div className="h-px bg-slate-200 flex-1" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div>
                          <label
                            htmlFor="field-nome"
                            className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                          >
                            Nome completo <span className="text-[#d92d20]">*</span>
                          </label>
                          <input
                            id="field-nome"
                            type="text"
                            value={formData.nome}
                            onChange={(e) => handleInputChange('nome', e.target.value)}
                            placeholder="Ex.: João Baptista Manuel"
                            className={pillInputClass(Boolean(formErrors.nome))}
                          />
                          {formErrors.nome && (
                            <p className="text-[#d92d20] text-xs mt-1 font-medium">
                              {formErrors.nome}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="field-tratamento"
                            className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                          >
                            Género / Tratamento oficial <span className="text-[#d92d20]">*</span>
                          </label>
                          <select
                            id="field-tratamento"
                            value={formData.tratamento}
                            onChange={(e) => handleInputChange('tratamento', e.target.value as any)}
                            className={pillInputClass(Boolean(formErrors.tratamento))}
                          >
                            <option value="Senhor">Masculino — o Senhor</option>
                            <option value="Senhora">Feminino — a Senhora</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="field-pai"
                            className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                          >
                            Nome do pai <span className="text-[#d92d20]">*</span>
                          </label>
                          <input
                            id="field-pai"
                            type="text"
                            value={formData.pai}
                            onChange={(e) => handleInputChange('pai', e.target.value)}
                            placeholder="Nome completo do pai"
                            className={pillInputClass(Boolean(formErrors.pai))}
                          />
                          {formErrors.pai && (
                            <p className="text-[#d92d20] text-xs mt-1 font-medium">
                              {formErrors.pai}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="field-mae"
                            className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                          >
                            Nome da mãe <span className="text-[#d92d20]">*</span>
                          </label>
                          <input
                            id="field-mae"
                            type="text"
                            value={formData.mae}
                            onChange={(e) => handleInputChange('mae', e.target.value)}
                            placeholder="Nome completo da mãe"
                            className={pillInputClass(Boolean(formErrors.mae))}
                          />
                          {formErrors.mae && (
                            <p className="text-[#d92d20] text-xs mt-1 font-medium">
                              {formErrors.mae}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="field-nascimento"
                            className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                          >
                            Data de nascimento <span className="text-[#d92d20]">*</span>
                          </label>
                          <input
                            id="field-nascimento"
                            type="date"
                            max={getTodayIso()}
                            value={formData.nascimento}
                            onChange={(e) => handleInputChange('nascimento', e.target.value)}
                            className={pillInputClass(Boolean(formErrors.nascimento))}
                          />
                          {formErrors.nascimento && (
                            <p className="text-[#d92d20] text-xs mt-1 font-medium">
                              {formErrors.nascimento}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="field-naturalidade"
                              className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                            >
                              Naturalidade <span className="text-[#d92d20]">*</span>
                            </label>
                            <input
                              id="field-naturalidade"
                              type="text"
                              value={formData.naturalidade}
                              onChange={(e) => handleInputChange('naturalidade', e.target.value)}
                              placeholder="Ex.: Quêssua"
                              className={pillInputClass(Boolean(formErrors.naturalidade))}
                            />
                            {formErrors.naturalidade && (
                              <p className="text-[#d92d20] text-xs mt-1 font-medium">
                                {formErrors.naturalidade}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="field-provNat"
                              className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                            >
                              Província <span className="text-[#d92d20]">*</span>
                            </label>
                            <select
                              id="field-provNat"
                              value={formData.provNat}
                              onChange={(e) => handleInputChange('provNat', e.target.value)}
                              className={pillInputClass(Boolean(formErrors.provNat))}
                            >
                              {ANGOLA_PROVINCIAS.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Bilhete de Identidade e Enquadramento */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                          Bilhete de Identidade e enquadramento profissional
                        </h3>
                        <div className="h-px bg-slate-200 flex-1" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div>
                          <label
                            htmlFor="field-bi"
                            className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                          >
                            Bilhete de Identidade n.º <span className="text-[#d92d20]">*</span>
                          </label>
                          <input
                            id="field-bi"
                            type="text"
                            value={formData.bi}
                            onChange={(e) =>
                              handleInputChange('bi', e.target.value.toUpperCase())
                            }
                            placeholder="Ex.: 005417082ME010"
                            maxLength={14}
                            className={`${pillInputClass(Boolean(formErrors.bi))} font-mono uppercase`}
                          />
                          {formErrors.bi && (
                            <p className="text-[#d92d20] text-xs mt-1 font-medium">
                              {formErrors.bi}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="field-biEmissao"
                            className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                          >
                            Data de emissão do B.I. <span className="text-[#d92d20]">*</span>
                          </label>
                          <input
                            id="field-biEmissao"
                            type="date"
                            max={getTodayIso()}
                            value={formData.biEmissao}
                            onChange={(e) => handleInputChange('biEmissao', e.target.value)}
                            className={pillInputClass(Boolean(formErrors.biEmissao))}
                          />
                          {formErrors.biEmissao && (
                            <p className="text-[#d92d20] text-xs mt-1 font-medium">
                              {formErrors.biEmissao}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="field-agente"
                            className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                          >
                            Número de Agente <span className="text-[#d92d20]">*</span>
                          </label>
                          <input
                            id="field-agente"
                            type="text"
                            value={formData.agente}
                            onChange={(e) => handleInputChange('agente', e.target.value)}
                            placeholder="Ex.: 54170829"
                            className={`${pillInputClass(Boolean(formErrors.agente))} font-mono`}
                          />
                          {formErrors.agente && (
                            <p className="text-[#d92d20] text-xs mt-1 font-medium">
                              {formErrors.agente}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="field-funcao"
                            className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                          >
                            Funções exercidas <span className="text-[#d92d20]">*</span>
                          </label>
                          <input
                            id="field-funcao"
                            type="text"
                            value={formData.funcao}
                            onChange={(e) => handleInputChange('funcao', e.target.value)}
                            placeholder="Ex.: Docente"
                            className={pillInputClass(Boolean(formErrors.funcao))}
                          />
                          {formErrors.funcao && (
                            <p className="text-[#d92d20] text-xs mt-1 font-medium">
                              {formErrors.funcao}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="field-categoria"
                              className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                            >
                              Categoria profissional <span className="text-[#d92d20]">*</span>
                            </label>
                            <input
                              id="field-categoria"
                              type="text"
                              value={formData.categoria}
                              onChange={(e) => handleInputChange('categoria', e.target.value)}
                              placeholder="Ex.: P.E.P.E.S."
                              className={pillInputClass(Boolean(formErrors.categoria))}
                            />
                            {formErrors.categoria && (
                              <p className="text-[#d92d20] text-xs mt-1 font-medium">
                                {formErrors.categoria}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="field-grau"
                              className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                            >
                              Grau <span className="text-[#d92d20]">*</span>
                            </label>
                            <input
                              id="field-grau"
                              type="text"
                              value={formData.grau}
                              onChange={(e) => handleInputChange('grau', e.target.value)}
                              placeholder="Ex.: 11.º Grau"
                              className={pillInputClass(Boolean(formErrors.grau))}
                            />
                            {formErrors.grau && (
                              <p className="text-[#d92d20] text-xs mt-1 font-medium">
                                {formErrors.grau}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                            Sector e Município de colocação
                          </label>
                          <div className="w-full h-11 px-4 rounded-full bg-[#f2f4f7] text-sm text-slate-800 font-medium flex items-center">
                            Sector da {formData.sector || 'Educação'} — Município do{' '}
                            {formData.municipio || 'Quêssua'}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1.5">
                            O sistema vincula automaticamente o agente à Direcção Municipal de Educação.
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <label
                              htmlFor="field-escola"
                              className="block text-[13px] font-semibold text-slate-800"
                            >
                              Escola ou Complexo Escolar de colocação{' '}
                              <span className="text-[#d92d20]">*</span>
                            </label>
                            <span className="text-[11px] text-slate-500">
                              (Pode escrever ou escolher das sugestões)
                            </span>
                          </div>

                          <div className="relative" ref={schoolDropdownRef}>
                            <div className="relative flex items-center">
                              <input
                                id="field-escola"
                                type="text"
                                autoComplete="off"
                                value={formData.escola}
                                onChange={(e) => {
                                  handleInputChange('escola', e.target.value);
                                  setShowSchoolSuggestions(true);
                                }}
                                onFocus={() => setShowSchoolSuggestions(true)}
                                placeholder="Escreva o nome da escola ou selecione das sugestões..."
                                className={`${pillInputClass(Boolean(formErrors.escola))} pr-20`}
                              />
                              <div className="absolute right-2.5 flex items-center gap-1">
                                {formData.escola && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleInputChange('escola', '');
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

                            {/* Dropdown com sugestões dinâmicas de escolas já cadastradas */}
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

                                {/* Banner caso a pessoa tenha escrito uma escola não cadastrada */}
                                {formData.escola.trim() && !isExactRegisteredSchool && (
                                  <div className="p-2.5 mb-1.5 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="font-bold text-amber-900 flex items-center gap-1.5 truncate">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <span className="truncate">Usar «{formData.escola}»</span>
                                      </div>
                                      <p className="text-[11px] text-amber-700 truncate">
                                        Esta escola não estava na lista e será registada no documento.
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
                                      O nome que escreveu será utilizado diretamente na emissão da declaração.
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    {schoolSuggestions.map((schoolName) => {
                                      const isSelected =
                                        formData.escola.trim().toLowerCase() === schoolName.toLowerCase();
                                      const isNewRequested =
                                        schoolName.includes('314') ||
                                        schoolName.toLowerCase().includes('técnico agrário') ||
                                        schoolName.includes('27009');
                                      return (
                                        <button
                                          key={schoolName}
                                          type="button"
                                          onClick={() => {
                                            handleInputChange('escola', schoolName);
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
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            {isNewRequested && (
                                              <span
                                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                  isSelected
                                                    ? 'bg-amber-400/20 text-amber-300'
                                                    : 'bg-emerald-100 text-emerald-800'
                                                }`}
                                              >
                                                Nova Opção
                                              </span>
                                            )}
                                            {isSelected && (
                                              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Dica contextual sobre a escola digitada */}
                          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            {isExactRegisteredSchool ? (
                              <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                Escola oficial cadastrada no Município de Quêssua
                              </span>
                            ) : formData.escola.trim() ? (
                              <span className="text-blue-700 font-medium inline-flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                Escola personalizada indicada (não cadastrada previamente)
                              </span>
                            ) : (
                              <span className="text-slate-400">
                                Digite o nome da escola ou clique na seta para ver as opções
                              </span>
                            )}
                            <span className="text-slate-400">
                              Total de opções: {allAvailableSchools.length}
                            </span>
                          </div>

                          {formErrors.escola && (
                            <p className="text-[#d92d20] text-xs mt-1 font-medium">
                              {formErrors.escola}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3. Finalidade e Entidade Emissora */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                          Finalidade da declaração e homologação
                        </h3>
                        <div className="h-px bg-slate-200 flex-1" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="md:col-span-2">
                          <label
                            htmlFor="field-finalidade"
                            className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                          >
                            Finalidade da declaração <span className="text-[#d92d20]">*</span>
                          </label>
                          <input
                            id="field-finalidade"
                            type="text"
                            value={formData.finalidade}
                            onChange={(e) => handleInputChange('finalidade', e.target.value)}
                            placeholder="Ex.: Instrução do processo de candidatura ao Concurso Público..."
                            className={pillInputClass(Boolean(formErrors.finalidade))}
                          />
                          {formErrors.finalidade && (
                            <p className="text-[#d92d20] text-xs mt-1 font-medium">
                              {formErrors.finalidade}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                            Director Municipal / Responsável pela Assinatura
                          </label>
                          <input
                            type="text"
                            value={formData.director}
                            onChange={(e) => handleInputChange('director', e.target.value)}
                            placeholder="Belizio Miguel dos Santos António"
                            className={pillInputClass(false)}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                              Local de emissão
                            </label>
                            <input
                              type="text"
                              value={formData.local}
                              onChange={(e) => handleInputChange('local', e.target.value)}
                              placeholder="Quêssua"
                              className={pillInputClass(false)}
                            />
                          </div>

                          <div>
                            <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                              Data de emissão
                            </label>
                            <input
                              type="date"
                              value={formData.dataEmissao}
                              onChange={(e) => handleInputChange('dataEmissao', e.target.value)}
                              className={pillInputClass(false)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Action Buttons */}
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
                              ? 'Salvar alterações no registo'
                              : 'Guardar na Base de Dados & Gerar Declaração'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={handleClearForm}
                          className="h-11 px-5 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4 text-slate-500" />
                          <span>Limpar campos</span>
                        </button>
                      </div>
                    </div>
                  </form>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* SERVICE 2: DECLARAÇÃO DE SERVIÇO (CONTA & SALÁRIO)             */}
            {/* ============================================================== */}
            {activeTab === 'declaracao-servico' && (
              <DeclaracaoServicoSection
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
              />
            )}

            {/* ============================================================== */}
            {/* SERVICE 3: GUIA DE FÉRIAS (CADASTRO DE PESSOAL)                */}
            {/* ============================================================== */}
            {activeTab === 'guia-ferias' && (
              <GuiaFeriasSection
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
              />
            )}

            {/* ============================================================== */}
            {/* SERVICE 4: GUIA DE COLOCAÇÃO (CADASTRO DE PESSOAL)             */}
            {/* ============================================================== */}
            {activeTab === 'guia-colocacao' && (
              <GuiaColocacaoSection
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
              />
            )}

            {/* ============================================================== */}
            {/* TAB: BASE DE DADOS COMPLETA (GESTÃO & BACKUPS)                 */}
            {/* ============================================================== */}
            {activeTab === 'database' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-white rounded-[24px] border border-slate-200 shadow-xs p-6 sm:p-8 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-[#f2f4f7] flex items-center justify-center text-slate-800 shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                          Utilizadores e Funcionários Cadastrados
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500">
                          Controle centralizado anti-duplicação de pessoal docente e administrativo
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsBackupModalOpen(true)}
                        className="h-10 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Archive className="w-4 h-4 text-emerald-400" />
                        <span>Cofre de Backups & Restaurar</span>
                      </button>

                      {isSuperAdmin && records.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearDatabase}
                          className="h-10 px-4 rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-2 border border-red-200 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                          <span>Esvaziar Base</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setFormData(getInitialFormState(currentUser));
                          setActiveTab('form');
                        }}
                        className="h-10 px-4 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Novo Cadastramento</span>
                      </button>
                    </div>
                  </div>

                  {/* Filters & Search */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="sm:col-span-2 relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Pesquisar por nome, B.I., número de agente ou categoria..."
                        className="w-full h-11 pl-10 pr-4 rounded-full border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900"
                      />
                    </div>

                    <div>
                      <select
                        value={schoolFilter}
                        onChange={(e) => setSchoolFilter(e.target.value)}
                        className="w-full h-11 px-4 rounded-full border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 cursor-pointer"
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
                <div className="bg-white rounded-[24px] border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 bg-[#f8f9fa] border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-semibold">
                    <span>
                      Total de Registos Encontrados: <strong>{filteredRecords.length}</strong>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Prevenção activa de B.I. e Agente duplicados
                    </span>
                  </div>

                  {filteredRecords.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 space-y-3">
                      <Users className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-semibold">
                        Nenhum funcionário encontrado com estes filtros.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSchoolFilter('ALL');
                        }}
                        className="text-xs text-slate-900 hover:underline font-bold cursor-pointer"
                      >
                        Limpar filtros
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
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
                              <td className="py-3 px-4 text-center font-bold text-slate-400 tabular-nums">
                                {String(index + 1).padStart(2, '0')}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900 text-sm">{item.nome}</div>
                                <div className="text-[11px] text-slate-500">{item.funcao}</div>
                              </td>
                              <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                                {item.bi}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-900 font-mono">
                                {item.agente}
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-semibold text-slate-800">
                                  {item.categoria}
                                </span>
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
                                    className="px-2.5 py-1 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Ficha</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDownloadPdf(item)}
                                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold py-1 px-2.5 rounded-full cursor-pointer transition-colors"
                                  >
                                    <FileDown className="w-3.5 h-3.5" />
                                    <span>PDF</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleStartEditRecord(item)}
                                    className="p-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                                    title="Editar dados"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRecord(item.id, item.nome)}
                                    className="p-1.5 rounded-full bg-red-50 hover:bg-red-100 text-[#d92d20] cursor-pointer transition-colors"
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
            {/* TAB: PEDIDOS DOS USUÁRIOS                                      */}
            {/* ============================================================== */}
            {activeTab === 'pedidos' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <QuickRequestsManagementView
                  currentUser={currentUser}
                  activeRole={
                    currentUser?.role === 'admin' ||
                    currentUser?.email === 'dmedoquessua@gmail.com'
                      ? 'admin'
                      : ((currentUser?.role || 'diretor') as any)
                  }
                  schoolName={currentUser?.schoolName || ''}
                  onNavigateToDeclaracaoEfectividade={() => setActiveTab('form')}
                  showToast={showToast}
                />
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB: FICHA DE CADASTRO OFICIAL / DECLARAÇÃO (FOLHA A4 PDF)     */}
            {/* ============================================================== */}
            {activeTab === 'view-ficha' && selectedRecordForView && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="no-print bg-white rounded-[24px] p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('form')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-[#f2f4f7] hover:bg-slate-200/80 px-3.5 py-2 rounded-full transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Voltar ao Serviço</span>
                    </button>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-slate-900">
                        Ficha Oficial de {selectedRecordForView.nome}
                      </h2>
                      <p className="text-xs text-slate-500">
                        B.I.: {selectedRecordForView.bi} · Agente: {selectedRecordForView.agente}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(() => {
                      const activeIsFem = resolveIsFeminino(
                        selectedRecordForView.nome,
                        selectedRecordForView.tratamento,
                        viewGenderOverride
                      );
                      return (
                        <div
                          role="group"
                          aria-label="Concordância de género do documento"
                          className="inline-flex items-center bg-[#f2f4f7] p-1 rounded-full border border-slate-200 mr-1"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleFichaGender('Senhor')}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              !activeIsFem
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Masculino (Senhor)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleFichaGender('Senhora')}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              activeIsFem
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Feminino (Senhora)
                          </button>
                        </div>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(selectedRecordForView)}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Baixar PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintDocument}
                      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir A4</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEditRecord(selectedRecordForView)}
                      className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer border border-slate-300"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>

                {renderOfficialEfectividadeSheet(selectedRecordForView, viewGenderOverride)}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Confirmação para Eliminar Registo Individual */}
      {recordToDelete && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Eliminar Cadastro?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tem a certeza que deseja eliminar o cadastro de{' '}
                <strong className="text-slate-950 font-bold">{recordToDelete.nome}</strong> da base
                de dados?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="flex-1 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => executeDeleteRecord(recordToDelete.id, recordToDelete.nome)}
                className="flex-1 h-11 rounded-full bg-[#d92d20] hover:brightness-110 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Esvaziar Toda a Base de Dados (Exclusivo Belízio) */}
      {showClearAllModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-900 text-[11px] font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Autorização do Administrador Máximo</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Esvaziar Toda a Base de Dados?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tem a certeza que deseja eliminar{' '}
                <strong>todos os {records.length} funcionários cadastrados</strong> da base de
                dados?
              </p>
              <div className="text-[11px] text-red-800 bg-red-50 p-3 rounded-2xl border border-red-200 text-left space-y-2 font-medium">
                <p>
                  Por segurança, um <strong>ponto de restauração de segurança</strong> será criado
                  no cofre antes da limpeza.
                </p>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-red-900 mb-1">
                    Digite o código de autorização:{' '}
                    <span className="font-mono text-red-700">SIGRE-BELIZIO-2026</span>
                  </label>
                  <input
                    type="text"
                    value={clearAllConfirmationCode}
                    onChange={(e) => setClearAllConfirmationCode(e.target.value)}
                    placeholder="SIGRE-BELIZIO-2026"
                    className="w-full h-9 px-3 rounded-full border border-red-300 bg-white text-xs font-mono font-bold text-slate-900 outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowClearAllModal(false);
                  setClearAllConfirmationCode('');
                }}
                className="flex-1 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeClearDatabase}
                disabled={clearAllConfirmationCode.trim() !== 'SIGRE-BELIZIO-2026'}
                className="flex-1 h-11 rounded-full bg-[#d92d20] hover:brightness-110 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Esvaziar Tudo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Cofre de Backups e Restauração Instantânea */}
      <BackupManagerModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        currentUser={currentUser}
        onRestoreComplete={reloadRecords}
      />
    </div>
  );
};
