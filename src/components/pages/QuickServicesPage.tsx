import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  FileText,
  GraduationCap,
  ArrowRightLeft,
  Building2,
  Landmark,
  CheckCircle2,
  Clock,
  Search,
  Send,
  Printer,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  FileCheck,
  MessageCircle,
  X,
  Edit3,
  Trash2,
  CalendarRange,
  MapPin,
  FileDown,
} from 'lucide-react';
import emblemAngolaImg from '../../assets/images/Emblem_of_Angola.svg.webp';
import type { QuickServiceType, QuickServiceRequest } from '../../types';
import {
  submitQuickServiceRequest,
  updateSubmittedQuickServiceRequest,
  cancelQuickServiceRequest,
  fetchQuickRequests,
  verifyStudentEnrollmentInSchool,
  verifyStudentEnrollmentInSchoolAsync,
} from '../../utils/quickServicesStorage';
import { isExpressApiAvailable } from '../../utils/apiAvailability';
import { ANGOLA_PROVINCIAS, formatAngolanDateExtenso } from '../../utils/efectividadeStorage';
import {
  ANGOLA_BANCOS_SERVICO,
  parseKz,
  fmtKz,
  extensoKz,
} from '../../utils/declaracaoServicoStorage';
import { calculateFimDate, getGuiaFeriasDateBreakdown } from '../../utils/guiaFeriasStorage';
import {
  downloadQuickServiceReceiptPdf,
  printSinglePageA4Clean,
} from '../../utils/declaracaoPdfGenerator';

const QUESSUA_OFFICIAL_SCHOOL_NAMES: string[] = [
  'Escola Primária Nº 166 – Comuna Sede do Quêssua',
  'Complexo Escolar Nº 269 – Missão Metodista do Quêssua',
  'Colégio Público Nº 314 – Caezo / Quêssua',
  'Escola Primária Nº 118 – Alto-Guiné',
  'Complexo Escolar Nº 204 – Carreira de Tiro',
  'Escola Primária Nº 142 – Cassembele',
  'Escola Primária Nº 189 – Quizanga',
];

interface QuickServicesPageProps {
  onNavigateHome: () => void;
  onNavigateToLogin?: () => void;
  availableSchools?: Array<{
    id: string;
    name: string;
    director?: string;
    location?: string;
  }>;
  initialServiceType?: QuickServiceType;
  initialPageView?: 'catalog' | 'form' | 'receipt' | 'my-requests';
}

type ServiceCategory = 'funcionarios' | 'escolares';

interface CatalogServiceItem {
  id: string;
  type: QuickServiceType;
  title: string;
  description: string;
  category: ServiceCategory;
  destination: string;
  targetRole: 'ADMIN' | 'DIRECTOR';
  icon: React.ComponentType<{ className?: string }>;
}

export interface SavedDraftRequest {
  id: string;
  serviceId: string;
  serviceType: QuickServiceType;
  serviceTitle: string;
  destination: string;
  createdAt: string;
  updatedAt?: string;
  fingerprint: string;
  values: {
    requester: string;
    phone: string;
    email?: string;
    workplace?: string;
    employeeBi?: string;
    employeeAgente?: string;
    employeeCategory?: string;
    referenceMonthYear?: string;
    purpose?: string;
    // Complete SIGRE common & Efectividade / Serviço fields
    tratamento?: 'Senhor' | 'Senhora';
    pai?: string;
    mae?: string;
    nascimento?: string;
    naturalidade?: string;
    provNat?: string;
    biEmissao?: string;
    funcao?: string;
    grau?: string;
    sector?: string;
    municipio?: string;
    director?: string;
    local?: string;
    dataEmissao?: string;
    // Declaração de Serviço specific
    banco?: string;
    bancoOutro?: string;
    conta?: string;
    salario?: string;
    // Guia de Férias specific
    tipoesc?: string;
    nesc?: string;
    localEscola?: string;
    tipolic?: string;
    anoFerias?: string;
    diasFerias?: string;
    iniFerias?: string;
    fimFerias?: string;
    ng?: string;
    ang?: string;
    // Guia de Colocação specific
    numGuia?: string;
    anoGuia?: string;
    // Escolares specific
    student?: string;
    studentBiOrProcesso?: string;
    school?: string;
    studentClasse?: string;
    studentTurma?: string;
    studentPeriodo?: string;
    term?: string;
    year?: string;
    destinationSchool?: string;
    notes?: string;
  };
}

const MY_REQUESTS_STORAGE_KEY = 'sigre_my_submitted_requests';
const DRAFTS_STORAGE_KEY = 'sigre-quessua-requests-v2';

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  funcionarios: 'Funcionários',
  escolares: 'Alunos e encarregados',
};

const CATALOG_SERVICES: CatalogServiceItem[] = [
  {
    id: 'efetividade',
    type: 'DECLARACAO_EFECTIVIDADE',
    title: 'Declaração de Efectividade',
    description: 'Comprovativo de vínculo e exercício de funções.',
    category: 'funcionarios',
    destination: 'Direcção Municipal da Educação',
    targetRole: 'ADMIN',
    icon: Building2,
  },
  {
    id: 'servico',
    type: 'DECLARACAO_SERVICO',
    title: 'Declaração de Serviço',
    description: 'Comprovativo de serviço para fins bancários ou salariais.',
    category: 'funcionarios',
    destination: 'Direcção Municipal da Educação',
    targetRole: 'ADMIN',
    icon: Landmark,
  },
  {
    id: 'guia-ferias',
    type: 'GUIA_FERIAS',
    title: 'Guia de Férias',
    description: 'Requisição oficial de Guia de Férias / Licença Disciplinar.',
    category: 'funcionarios',
    destination: 'Direcção Municipal da Educação',
    targetRole: 'ADMIN',
    icon: CalendarRange,
  },
  {
    id: 'guia-colocacao',
    type: 'GUIA_COLOCACAO',
    title: 'Guia de Colocação',
    description: 'Requisição oficial de Guia de Colocação de docente.',
    category: 'funcionarios',
    destination: 'Direcção Municipal da Educação',
    targetRole: 'ADMIN',
    icon: MapPin,
  },
  {
    id: 'boletim',
    type: 'BOLETIM_NOTAS',
    title: 'Boletim de Notas Trimestral',
    description: 'Pedido de cópia do boletim com as notas do trimestre.',
    category: 'escolares',
    destination: 'Direcção da escola',
    targetRole: 'DIRECTOR',
    icon: GraduationCap,
  },
  {
    id: 'matricula',
    type: 'DECLARACAO_MATRICULA',
    title: 'Declaração ou Atestado de Matrícula',
    description: 'Comprovativo de matrícula e frequência escolar.',
    category: 'escolares',
    destination: 'Secretaria da escola',
    targetRole: 'DIRECTOR',
    icon: FileCheck,
  },
  {
    id: 'transferencia',
    type: 'GUIA_TRANSFERENCIA',
    title: 'Guia de Transferência Escolar',
    description: 'Pedido de transferência entre escolas da rede municipal.',
    category: 'escolares',
    destination: 'Escolas e Direcção Municipal da Educação',
    targetRole: 'DIRECTOR',
    icon: ArrowRightLeft,
  },
];

function normalizeText(value: string = ''): string {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isValidPhone(phone: string = ''): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function createFingerprint(serviceType: QuickServiceType, values: SavedDraftRequest['values']): string {
  const normalizedEntries = [
    ['serviceType', serviceType],
    ['requester', normalizeText(values.requester)],
    ['phone', (values.phone || '').replace(/\D/g, '')],
    ['workplace', normalizeText(values.workplace)],
    ['employeeBi', normalizeText(values.employeeBi)],
    ['employeeAgente', normalizeText(values.employeeAgente)],
    ['student', normalizeText(values.student)],
    ['school', normalizeText(values.school)],
    ['term', normalizeText(values.term)],
    ['year', normalizeText(values.year)],
    ['destinationSchool', normalizeText(values.destinationSchool)],
  ];
  return JSON.stringify(normalizedEntries);
}

export const QuickServicesPage: React.FC<QuickServicesPageProps> = ({
  onNavigateHome,
  availableSchools,
  initialServiceType,
  initialPageView,
}) => {
  // Official Schools List
  const defaultSchools = useMemo(
    () =>
      QUESSUA_OFFICIAL_SCHOOL_NAMES.map((name, idx) => ({
        id: `escola-quessua-${idx + 1}`,
        name,
        director: 'Direção Escolar',
        location: 'Quêssua, Malanje',
      })),
    []
  );

  const [syncedSchools, setSyncedSchools] = useState<
    Array<{ id: string; name: string; director?: string; location?: string }>
  >([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sigre_synced_schools_list');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSyncedSchools(parsed);
        }
      }
    } catch {
      // ignore
    }

    if (isExpressApiAvailable()) {
      fetch('/api/schools')
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json && Array.isArray(json.data) && json.data.length > 0) {
            setSyncedSchools(json.data);
            try {
              localStorage.setItem('sigre_synced_schools_list', JSON.stringify(json.data));
            } catch {
              // ignore
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const schools = useMemo(() => {
    const combined = [
      ...(availableSchools && availableSchools.length > 0 ? availableSchools : []),
      ...syncedSchools,
      ...defaultSchools,
    ];
    const seen = new Set<string>();
    return combined.filter((item) => {
      if (!item || !item.name) return false;
      const key = item.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [availableSchools, syncedSchools, defaultSchools]);

  // Active Navigation Tab ('catalog' | 'requests' | 'receipt')
  const [activeTab, setActiveTab] = useState<'catalog' | 'requests' | 'receipt'>(() => {
    if (initialPageView === 'my-requests') return 'requests';
    if (initialPageView === 'receipt') return 'receipt';
    return 'catalog';
  });

  // Search & Filter State in Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | ServiceCategory>('all');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Saved Drafts (localStorage `sigre-quessua-requests-v2`)
  const [drafts, setDrafts] = useState<SavedDraftRequest[]>(() => {
    try {
      const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const saveDraftsToStorage = (nextDrafts: SavedDraftRequest[]) => {
    setDrafts(nextDrafts);
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts));
    } catch {
      // ignore
    }
  };

  // Official Submitted Requests (localStorage `sigre_my_submitted_requests`)
  const [myRequests, setMyRequests] = useState<QuickServiceRequest[]>(() => {
    try {
      const raw = localStorage.getItem(MY_REQUESTS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const saveMyRequestLocally = (req: QuickServiceRequest) => {
    setMyRequests((prev) => {
      const filtered = prev.filter((item) => item.protocol !== req.protocol && item.id !== req.id);
      const updated = [req, ...filtered];
      try {
        localStorage.setItem(MY_REQUESTS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Sync status of submitted requests with backend/Firestore when viewing 'requests' or 'receipt'
  useEffect(() => {
    if ((activeTab !== 'requests' && activeTab !== 'receipt') || myRequests.length === 0) return;
    let mounted = true;
    const syncMyRequestsStatuses = async () => {
      try {
        const allServerRequests = await fetchQuickRequests();
        if (!mounted || !Array.isArray(allServerRequests) || allServerRequests.length === 0) return;

        setMyRequests((prev) => {
          if (prev.length === 0) return prev;
          let changed = false;
          const updated = prev.map((localReq) => {
            const match = allServerRequests.find(
              (srv) => srv.protocol === localReq.protocol || srv.id === localReq.id
            );
            if (
              match &&
              (match.status !== localReq.status ||
                match.updatedAt !== localReq.updatedAt ||
                match.details?.responseMessage !== localReq.details?.responseMessage)
            ) {
              changed = true;
              return match;
            }
            return localReq;
          });
          if (changed) {
            try {
              localStorage.setItem(MY_REQUESTS_STORAGE_KEY, JSON.stringify(updated));
            } catch {
              // ignore
            }
          }
          return changed ? updated : prev;
        });
      } catch {
        // ignore
      }
    };
    syncMyRequestsStatuses();

    const handleUpdatedEvent = (e: Event) => {
      const updatedReq = (e as CustomEvent<QuickServiceRequest>)?.detail;
      if (!updatedReq?.id) return;
      setMyRequests((prev) => {
        const idx = prev.findIndex((r) => r.id === updatedReq.id || r.protocol === updatedReq.protocol);
        if (idx === -1) return prev;
        const next = prev.map((r, i) => (i === idx ? updatedReq : r));
        try {
          localStorage.setItem(MY_REQUESTS_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      setSubmittedRequest((prev) =>
        prev && (prev.id === updatedReq.id || prev.protocol === updatedReq.protocol)
          ? updatedReq
          : prev
      );
    };

    window.addEventListener('sigre_quick_request_updated', handleUpdatedEvent);
    return () => {
      mounted = false;
      window.removeEventListener('sigre_quick_request_updated', handleUpdatedEvent);
    };
  }, [activeTab]);

  // Toast Banner Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
  };
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3400);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Modal State for Request / Draft Creation & Editing
  const [modalOpen, setModalOpen] = useState(false);
  const [activeService, setActiveService] = useState<CatalogServiceItem>(CATALOG_SERVICES[0]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingSubmittedRequest, setEditingSubmittedRequest] = useState<QuickServiceRequest | null>(null);
  const [confirmDeleteDraftId, setConfirmDeleteDraftId] = useState<string | null>(null);
  const [confirmCancelRequestId, setConfirmCancelRequestId] = useState<string | null>(null);
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);

  // Modal Form Fields (Full parity with SIGRE Registration forms)
  const currentYear = String(new Date().getFullYear());
  const todayIso = new Date().toISOString().split('T')[0];

  const [requester, setRequester] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [workplace, setWorkplace] = useState(schools[0]?.name || '');
  const [employeeBi, setEmployeeBi] = useState('');
  const [employeeAgente, setEmployeeAgente] = useState('');
  const [employeeCategory, setEmployeeCategory] = useState('P.E.P.E.S.');
  const [referenceMonthYear, setReferenceMonthYear] = useState('Outubro / 2026');
  const [purpose, setPurpose] = useState(
    'Instrução do processo de candidatura ao Concurso Público de Acesso e de Ingresso Interno no Sector da Educação'
  );

  // SIGRE Identificação pessoal, Filiação, BI & Enquadramento
  const [tratamento, setTratamento] = useState<'Senhor' | 'Senhora'>('Senhor');
  const [pai, setPai] = useState('');
  const [mae, setMae] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [naturalidade, setNaturalidade] = useState('Malanje');
  const [provNat, setProvNat] = useState('Malanje');
  const [biEmissao, setBiEmissao] = useState('');
  const [funcao, setFuncao] = useState('Docente');
  const [grau, setGrau] = useState('11.º Grau');
  const [sector, setSector] = useState('Educação');
  const [municipio, setMunicipio] = useState('Quêssua');
  const [director, setDirector] = useState('Belízio Miguel dos Santos António');
  const [local, setLocal] = useState('Quêssua');
  const [dataEmissao, setDataEmissao] = useState(todayIso);

  // SIGRE Declaração de Serviço specific (Conta bancária e salário)
  const [banco, setBanco] = useState('Banco Sol');
  const [bancoOutro, setBancoOutro] = useState('');
  const [conta, setConta] = useState('');
  const [salario, setSalario] = useState('');

  // SIGRE Guia de Férias specific
  const [tipoesc, setTipoesc] = useState('Escola Primária');
  const [nesc, setNesc] = useState('166');
  const [localEscola, setLocalEscola] = useState('Quêssua');
  const [tipolic, setTipolic] = useState('Licença Disciplinar (férias)');
  const [anoFerias, setAnoFerias] = useState(currentYear);
  const [diasFerias, setDiasFerias] = useState('30');
  const [iniFerias, setIniFerias] = useState(todayIso);
  const [fimFerias, setFimFerias] = useState(() => calculateFimDate(todayIso, 30));
  const [ng, setNg] = useState('01');
  const [ang, setAng] = useState(currentYear);

  // SIGRE Guia de Colocação specific
  const [numGuia, setNumGuia] = useState('01');
  const [anoGuia, setAnoGuia] = useState(currentYear);

  // Escolares fields
  const [student, setStudent] = useState('');
  const [studentBiOrProcesso, setStudentBiOrProcesso] = useState('');
  const [school, setSchool] = useState(schools[0]?.name || '');
  const [studentClasse, setStudentClasse] = useState('7ª Classe');
  const [studentTurma, setStudentTurma] = useState('Turma A');
  const [studentPeriodo, setStudentPeriodo] = useState('Manhã');
  const [term, setTerm] = useState('1.º Trimestre');
  const [year, setYear] = useState(currentYear);
  const [destinationSchool, setDestinationSchool] = useState('');
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receipt & Protocol Lookup State
  const [submittedRequest, setSubmittedRequest] = useState<QuickServiceRequest | null>(null);
  const [copiedProtocol, setCopiedProtocol] = useState(false);
  const [protocolSearchQuery, setProtocolSearchQuery] = useState('');
  const [searchProtocolResult, setSearchProtocolResult] = useState<QuickServiceRequest | null>(null);
  const [protocolSearchError, setProtocolSearchError] = useState<string | null>(null);
  const [isSearchingProtocol, setIsSearchingProtocol] = useState(false);

  // Open modal automatically if initialServiceType was passed
  useEffect(() => {
    if (initialServiceType) {
      const found =
        CATALOG_SERVICES.find((s) => s.type === initialServiceType) || CATALOG_SERVICES[0];
      if (initialPageView === 'form') {
        openServiceModal(found);
      }
    }
  }, [initialServiceType, initialPageView]);

  // Filtered Catalog Services
  const filteredServices = useMemo(() => {
    const q = normalizeText(searchQuery);
    return CATALOG_SERVICES.filter((service) => {
      const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
      const haystack = normalizeText(
        `${service.title} ${service.description} ${service.destination} ${CATEGORY_LABELS[service.category]}`
      );
      const matchesQuery = !q || haystack.includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, activeCategory]);

  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
    searchInputRef.current?.focus();
  };

  // Open Modal for New Service Request or Editing Existing Draft
  const openServiceModal = (service: CatalogServiceItem, draftToEdit?: SavedDraftRequest) => {
    setActiveService(service);
    setEditingSubmittedRequest(null);
    setFormError(null);

    if (draftToEdit) {
      setEditingDraftId(draftToEdit.id);
      setRequester(draftToEdit.values.requester || '');
      setPhone(draftToEdit.values.phone || '');
      setEmail(draftToEdit.values.email || '');
      setWorkplace(draftToEdit.values.workplace || schools[0]?.name || '');
      setEmployeeBi(draftToEdit.values.employeeBi || '');
      setEmployeeAgente(draftToEdit.values.employeeAgente || '');
      setEmployeeCategory(draftToEdit.values.employeeCategory || 'P.E.P.E.S.');
      setReferenceMonthYear(draftToEdit.values.referenceMonthYear || 'Outubro / 2026');
      setPurpose(
        draftToEdit.values.purpose ||
          (service.type === 'DECLARACAO_SERVICO'
            ? 'à regularização da conta bancária'
            : 'Instrução do processo de candidatura ao Concurso Público de Acesso e de Ingresso Interno no Sector da Educação')
      );
      setTratamento(draftToEdit.values.tratamento || 'Senhor');
      setPai(draftToEdit.values.pai || '');
      setMae(draftToEdit.values.mae || '');
      setNascimento(draftToEdit.values.nascimento || '');
      setNaturalidade(draftToEdit.values.naturalidade || 'Malanje');
      setProvNat(draftToEdit.values.provNat || 'Malanje');
      setBiEmissao(draftToEdit.values.biEmissao || '');
      setFuncao(
        draftToEdit.values.funcao ||
          (service.type === 'DECLARACAO_SERVICO' ? 'Professor do Ensino Primário' : 'Docente')
      );
      setGrau(
        draftToEdit.values.grau ||
          (service.type === 'GUIA_COLOCACAO'
            ? '13º Grau'
            : service.type === 'GUIA_FERIAS'
            ? '10º Grau'
            : '11.º Grau')
      );
      setSector(draftToEdit.values.sector || 'Educação');
      setMunicipio(draftToEdit.values.municipio || 'Quêssua');
      setDirector(draftToEdit.values.director || 'Belízio Miguel dos Santos António');
      setLocal(draftToEdit.values.local || 'Quêssua');
      setDataEmissao(draftToEdit.values.dataEmissao || todayIso);
      setBanco(draftToEdit.values.banco || 'Banco Sol');
      setBancoOutro(draftToEdit.values.bancoOutro || '');
      setConta(draftToEdit.values.conta || '');
      setSalario(draftToEdit.values.salario || '');
      setTipoesc(draftToEdit.values.tipoesc || 'Escola Primária');
      setNesc(draftToEdit.values.nesc || '166');
      setLocalEscola(draftToEdit.values.localEscola || 'Quêssua');
      setTipolic(draftToEdit.values.tipolic || 'Licença Disciplinar (férias)');
      setAnoFerias(draftToEdit.values.anoFerias || currentYear);
      setDiasFerias(draftToEdit.values.diasFerias || '30');
      setIniFerias(draftToEdit.values.iniFerias || todayIso);
      setFimFerias(
        draftToEdit.values.fimFerias ||
          calculateFimDate(
            draftToEdit.values.iniFerias || todayIso,
            parseInt(draftToEdit.values.diasFerias || '30', 10) || 30
          )
      );
      setNg(draftToEdit.values.ng || '01');
      setAng(draftToEdit.values.ang || currentYear);
      setNumGuia(draftToEdit.values.numGuia || '01');
      setAnoGuia(draftToEdit.values.anoGuia || currentYear);
      setStudent(draftToEdit.values.student || '');
      setStudentBiOrProcesso(draftToEdit.values.studentBiOrProcesso || '');
      setSchool(draftToEdit.values.school || schools[0]?.name || '');
      setStudentClasse(draftToEdit.values.studentClasse || '7ª Classe');
      setStudentTurma(draftToEdit.values.studentTurma || 'Turma A');
      setStudentPeriodo(draftToEdit.values.studentPeriodo || 'Manhã');
      setTerm(draftToEdit.values.term || '1.º Trimestre');
      setYear(draftToEdit.values.year || currentYear);
      setDestinationSchool(draftToEdit.values.destinationSchool || '');
      setNotes(draftToEdit.values.notes || '');
    } else {
      setEditingDraftId(null);
      setFormError(null);
      if (!workplace && schools[0]?.name) setWorkplace(schools[0].name);
      if (!school && schools[0]?.name) setSchool(schools[0].name);
      if (service.type === 'DECLARACAO_SERVICO') {
        if (
          !purpose ||
          purpose.includes('Concurso Público de Acesso e de Ingresso Interno')
        ) {
          setPurpose('à regularização da conta bancária');
        }
        if (funcao === 'Docente') {
          setFuncao('Professor do Ensino Primário');
        }
        if (employeeCategory === 'P.E.P.E.S.') {
          setEmployeeCategory('P.E.P.E.S do 11º');
        }
      } else if (service.type === 'DECLARACAO_EFECTIVIDADE') {
        if (!purpose || purpose === 'à regularização da conta bancária') {
          setPurpose(
            'Instrução do processo de candidatura ao Concurso Público de Acesso e de Ingresso Interno no Sector da Educação'
          );
        }
        if (employeeCategory === 'P.E.P.E.S do 11º') {
          setEmployeeCategory('P.E.P.E.S.');
        }
      } else if (service.type === 'GUIA_FERIAS') {
        setEmployeeCategory('P.E.P.E.S.');
        setGrau('10º Grau');
        setFuncao('Docente');
      } else if (service.type === 'GUIA_COLOCACAO') {
        setEmployeeCategory('P.E.P.E.S.');
        setGrau('13º Grau');
      }
    }

    setModalOpen(true);
  };

  // Open Modal to Edit / Alter an already Submitted Request
  const openEditSubmittedModal = (req: QuickServiceRequest) => {
    const service =
      CATALOG_SERVICES.find((s) => s.type === req.serviceType) || CATALOG_SERVICES[0];
    const d = req.details || {};
    const srv = (d.sigreServico || {}) as Record<string, any>;
    const gf = (d.sigreGuiaFerias || {}) as Record<string, any>;
    const gc = (d.sigreGuiaColocacao || {}) as Record<string, any>;

    setActiveService(service);
    setEditingDraftId(null);
    setEditingSubmittedRequest(req);
    setFormError(null);

    setRequester(req.requesterName || d.employeeName || '');
    setPhone(req.requesterPhone || '');
    setEmail(req.requesterEmail || '');
    setWorkplace(d.employeeSchoolOrDepartment || req.targetSchoolName || schools[0]?.name || '');
    setEmployeeBi(d.employeeBi || '');
    setEmployeeAgente(d.employeeAgente || '');
    setEmployeeCategory(d.employeeCategory || srv.categoria || gf.cat || gc.cat || 'P.E.P.E.S.');
    setReferenceMonthYear(d.referenceMonthYear || 'Outubro / 2026');
    setPurpose(d.purpose || srv.finalidade || '');
    setTratamento(d.tratamento === 'Senhora' ? 'Senhora' : 'Senhor');
    setPai(d.pai || srv.pai || '');
    setMae(d.mae || srv.mae || '');
    setNascimento(d.nascimento || srv.nascimento || '');
    setNaturalidade(d.naturalidade || srv.naturalidade || 'Malanje');
    setProvNat(d.provNat || srv.provNat || 'Malanje');
    setBiEmissao(d.biEmissao || srv.biData || '');
    setFuncao(d.funcao || srv.profissao || gf.funcao || 'Docente');
    setGrau(d.grau || srv.grau || gf.grau || gc.grau || '11.º Grau');
    setSector(d.sector || 'Educação');
    setMunicipio(d.municipio || srv.municipio || 'Quêssua');
    setDirector(d.director || srv.director || gf.dir || gc.dir || 'Belízio Miguel dos Santos António');
    setLocal(d.local || gf.locem || gc.local || 'Quêssua');
    setDataEmissao(d.dataEmissao || srv.dataEmissao || gf.datem || gc.dataEmissao || todayIso);
    setBanco(srv.banco || 'Banco Sol');
    setBancoOutro(srv.bancoOutro || '');
    setConta(srv.conta || '');
    setSalario(srv.salario ? String(srv.salario) : '');
    setTipoesc(gf.tipoesc || 'Escola Primária');
    setNesc(gf.nesc ? String(gf.nesc) : '166');
    setLocalEscola(gf.local || 'Quêssua');
    setTipolic(gf.tipolic || 'Licença Disciplinar (férias)');
    setAnoFerias(gf.ano ? String(gf.ano) : currentYear);
    setDiasFerias(gf.dias ? String(gf.dias) : '30');
    setIniFerias(gf.ini || todayIso);
    setFimFerias(gf.fim || calculateFimDate(gf.ini || todayIso, Number(gf.dias || 30)));
    setNg(gf.ng || '01');
    setAng(gf.ang ? String(gf.ang) : currentYear);
    setNumGuia(gc.numGuia || '01');
    setAnoGuia(gc.anoGuia || currentYear);
    setStudent(d.studentName || '');
    setStudentBiOrProcesso(d.studentBiOrProcesso || d.enrolledCodigoMatricula || '');
    setSchool(req.targetSchoolName || schools[0]?.name || '');
    setStudentClasse(d.studentClasse || d.enrolledClasse || '7ª Classe');
    setStudentTurma(d.studentTurma || d.enrolledTurma || 'Turma A');
    setStudentPeriodo(d.studentPeriodo || d.enrolledTurno || 'Manhã');
    setTerm(d.trimestre || '1.º Trimestre');
    setYear(d.academicYear || currentYear);
    setDestinationSchool(d.destinationSchool || req.destinationSchoolName || '');
    setNotes(d.notes || '');

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDraftId(null);
    setEditingSubmittedRequest(null);
    setFormError(null);
  };

  // Live enrollment verification inside Form Modal for student academic services
  const modalEnrollmentCheck = useMemo(() => {
    if (!modalOpen || activeService.category !== 'escolares') return null;
    if (!student.trim() || !school.trim()) return null;
    return verifyStudentEnrollmentInSchool({
      schoolName: school.trim(),
      studentName: student.trim(),
      studentBiOrProcesso: studentBiOrProcesso.trim() || undefined,
      studentClasse,
      studentTurma,
    });
  }, [modalOpen, activeService.category, student, school, studentBiOrProcesso, studentClasse, studentTurma]);

  // Close modal on Escape key
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  const collectCurrentFormValues = (): SavedDraftRequest['values'] => ({
    requester: requester.trim(),
    phone: phone.trim(),
    email: email.trim(),
    workplace: workplace.trim(),
    employeeBi: employeeBi.trim(),
    employeeAgente: employeeAgente.trim(),
    employeeCategory: employeeCategory.trim(),
    referenceMonthYear: referenceMonthYear.trim(),
    purpose: purpose.trim(),
    tratamento,
    pai: pai.trim(),
    mae: mae.trim(),
    nascimento,
    naturalidade: naturalidade.trim(),
    provNat: provNat.trim(),
    biEmissao,
    funcao: funcao.trim(),
    grau: grau.trim(),
    sector: sector.trim(),
    municipio: municipio.trim(),
    director: director.trim(),
    local: local.trim(),
    dataEmissao,
    banco: banco.trim(),
    bancoOutro: bancoOutro.trim(),
    conta: conta.trim(),
    salario: salario.trim(),
    tipoesc: tipoesc.trim(),
    nesc: nesc.trim(),
    localEscola: localEscola.trim(),
    tipolic: tipolic.trim(),
    anoFerias: anoFerias.trim(),
    diasFerias: diasFerias.trim(),
    iniFerias,
    fimFerias,
    ng: ng.trim(),
    ang: ang.trim(),
    numGuia: numGuia.trim(),
    anoGuia: anoGuia.trim(),
    student: student.trim(),
    studentBiOrProcesso: studentBiOrProcesso.trim(),
    school: school.trim(),
    studentClasse: studentClasse.trim(),
    studentTurma: studentTurma.trim(),
    studentPeriodo: studentPeriodo.trim(),
    term: term.trim(),
    year: year.trim(),
    destinationSchool: destinationSchool.trim(),
    notes: notes.trim(),
  });

  const validateCurrentForm = (values: SavedDraftRequest['values']): string | null => {
    if (!values.requester) {
      return 'Indique o nome completo do funcionário / requerente.';
    }
    if (!isValidPhone(values.phone)) {
      return 'Indique um contacto telefónico válido (entre 7 e 15 dígitos).';
    }
    if (activeService.type === 'DECLARACAO_EFECTIVIDADE') {
      if (!values.pai || !values.mae) {
        return 'Preencha a filiação completa (Nome do Pai e Nome da Mãe).';
      }
      if (!values.nascimento) {
        return 'Indique a data de nascimento.';
      }
      if (!values.naturalidade || !values.provNat) {
        return 'Indique a naturalidade e a província.';
      }
      if (!values.employeeBi || !values.biEmissao) {
        return 'Indique o número do Bilhete de Identidade e a data de emissão.';
      }
      if (!values.employeeAgente) {
        return 'Indique o Número de Agente.';
      }
      if (!values.funcao || !values.employeeCategory || !values.grau) {
        return 'Indique a função exercida, a categoria profissional e o grau.';
      }
      if (!values.workplace) {
        return 'Indique a Escola ou Complexo Escolar de colocação.';
      }
      if (!values.purpose) {
        return 'Indique a finalidade da Declaração de Efectividade.';
      }
    } else if (activeService.type === 'DECLARACAO_SERVICO') {
      if (!values.nascimento) {
        return 'Indique a data de nascimento.';
      }
      if (!values.naturalidade || !values.provNat) {
        return 'Indique a naturalidade e a província.';
      }
      if (!values.mae) {
        return 'Indique o nome da mãe.';
      }
      if (!values.employeeBi || !values.biEmissao) {
        return 'Indique o número do Bilhete de Identidade e a data de emissão.';
      }
      if (!values.funcao || !values.grau || !values.employeeCategory) {
        return 'Indique a profissão/função, o grau e a categoria profissional.';
      }
      if (!values.employeeAgente) {
        return 'Indique o Número de Agente.';
      }
      if (!values.workplace) {
        return 'Indique a Escola ou Local de trabalho.';
      }
      const bancoNome = values.banco === 'Outro' ? values.bancoOutro : values.banco;
      if (!bancoNome) {
        return 'Seleccione ou indique o nome do Banco.';
      }
      if (!values.conta) {
        return 'Indique o número de conta bancária.';
      }
      if (!values.salario || parseKz(values.salario) <= 0) {
        return 'Indique o salário líquido mensal em Kwanzas (Kz).';
      }
      if (!values.purpose) {
        return 'Indique a finalidade da Declaração de Serviço.';
      }
    } else if (activeService.type === 'GUIA_FERIAS') {
      if (!values.employeeAgente) {
        return 'Indique o Número de Agente.';
      }
      if (!values.employeeCategory || !values.grau || !values.funcao) {
        return 'Indique a categoria profissional, o grau e a função exercida.';
      }
      if (!values.tipoesc || !values.nesc) {
        return 'Indique o tipo de escola e o número da escola.';
      }
      if (!values.iniFerias || !values.fimFerias) {
        return 'Indique a data de início e de término das férias.';
      }
    } else if (activeService.type === 'GUIA_COLOCACAO') {
      if (!values.employeeAgente) {
        return 'Indique o Número de Agente.';
      }
      if (!values.employeeCategory || !values.grau) {
        return 'Indique a categoria profissional e o grau.';
      }
      if (!values.workplace) {
        return 'Indique a escola de colocação / destino.';
      }
    } else if (activeService.category === 'escolares') {
      if (!values.student) {
        return 'Indique o nome completo do aluno.';
      }
      if (!values.school) {
        return 'Indique a escola do aluno.';
      }
      if (activeService.type === 'BOLETIM_NOTAS' && !values.term) {
        return 'Seleccione o trimestre pretendido.';
      }
      if (activeService.type === 'DECLARACAO_MATRICULA' && !values.year) {
        return 'Indique o ano lectivo.';
      }
      if (activeService.type === 'GUIA_TRANSFERENCIA' && !values.destinationSchool) {
        return 'Indique a escola pretendida para transferência.';
      }
    }
    return null;
  };

  // Save as local draft (matching reference behaviour)
  const handleSaveDraft = () => {
    setFormError(null);
    const values = collectCurrentFormValues();
    const validationErr = validateCurrentForm(values);
    if (validationErr) {
      setFormError(validationErr);
      return;
    }

    const fingerprint = createFingerprint(activeService.type, values);
    const duplicate = drafts.some(
      (item) => item.fingerprint === fingerprint && item.id !== editingDraftId
    );

    if (duplicate) {
      setFormError('Já existe um rascunho com estes mesmos dados em "Meus pedidos".');
      return;
    }

    if (editingDraftId) {
      const nextDrafts = drafts.map((item) =>
        item.id === editingDraftId
          ? {
              ...item,
              serviceId: activeService.id,
              serviceType: activeService.type,
              serviceTitle: activeService.title,
              destination: activeService.destination,
              updatedAt: new Date().toISOString(),
              fingerprint,
              values,
            }
          : item
      );
      saveDraftsToStorage(nextDrafts);
      closeModal();
      setActiveTab('requests');
      showToast('Rascunho actualizado em "Meus pedidos".');
    } else {
      const newDraft: SavedDraftRequest = {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `draft-${Date.now()}`,
        serviceId: activeService.id,
        serviceType: activeService.type,
        serviceTitle: activeService.title,
        destination: activeService.destination,
        createdAt: new Date().toISOString(),
        fingerprint,
        values,
      };
      saveDraftsToStorage([newDraft, ...drafts]);
      closeModal();
      showToast('Rascunho guardado neste dispositivo.');
    }
  };

  // Submit Official Request to Backend / Firestore
  const submitOfficialFromValues = async (
    service: CatalogServiceItem,
    values: SavedDraftRequest['values'],
    draftIdToRemove?: string | null
  ) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const computedGuiaFeriasWorkplace = `${values.tipoesc || 'Escola Primária'} n.º ${
        values.nesc || '166'
      } - ${values.localEscola || 'Quêssua'}`;
      const targetSchoolName =
        service.type === 'GUIA_FERIAS'
          ? computedGuiaFeriasWorkplace
          : service.category === 'funcionarios'
          ? values.workplace || ''
          : values.school || '';
      const matchedSchool = schools.find(
        (s) => s.name.trim().toLowerCase() === targetSchoolName.trim().toLowerCase()
      );

      // Regra obrigatória para serviços escolares: validar se o aluno está matriculado na escola selecionada
      let verifiedEnrollment: Awaited<ReturnType<typeof verifyStudentEnrollmentInSchoolAsync>> | null = null;
      if (service.category === 'escolares') {
        verifiedEnrollment = await verifyStudentEnrollmentInSchoolAsync({
          schoolName: targetSchoolName,
          studentName: values.student,
          studentBiOrProcesso: values.studentBiOrProcesso,
          studentClasse: values.studentClasse,
          studentTurma: values.studentTurma,
        });

        if (!verifiedEnrollment.isEnrolled) {
          setFormError(
            verifiedEnrollment.reason ||
              `Pedido bloqueado: O aluno "${values.student}" não consta como matriculado na instituição "${targetSchoolName}". Não é possível solicitar emissão de documentos escolares para uma escola onde o aluno não está matriculado.`
          );
          return;
        }
      }

      const matchedDestSchool =
        service.type === 'GUIA_TRANSFERENCIA' && values.destinationSchool
          ? schools.find(
              (s) => s.name.trim().toLowerCase() === values.destinationSchool!.trim().toLowerCase()
            )
          : undefined;

      const resolvedStudentName =
        verifiedEnrollment?.matchedName || values.student;

      let title = service.title;
      if (service.type === 'DECLARACAO_EFECTIVIDADE') {
        title = `Pedido de Declaração de Efectividade — ${values.requester}`;
      } else if (service.type === 'DECLARACAO_SERVICO') {
        title = `Pedido de Declaração de Serviço — ${values.requester}`;
      } else if (service.type === 'GUIA_FERIAS') {
        title = `Pedido de Guia de Férias (${values.diasFerias || '30'} dias) — ${values.requester}`;
      } else if (service.type === 'GUIA_COLOCACAO') {
        title = `Pedido de Guia de Colocação (${values.workplace}) — ${values.requester}`;
      } else if (service.type === 'BOLETIM_NOTAS') {
        title = `Pedido de Boletim (${values.term || '1.º Trimestre'}) — ${resolvedStudentName}`;
      } else if (service.type === 'DECLARACAO_MATRICULA') {
        title = `Pedido de Declaração de Matrícula (${values.year || currentYear}) — ${resolvedStudentName}`;
      } else if (service.type === 'GUIA_TRANSFERENCIA') {
        title = `Pedido de Transferência Escolar — ${resolvedStudentName}`;
      }

      const nowIso = new Date().toISOString();
      const bancoFinal =
        values.banco === 'Outro' ? values.bancoOutro || 'Banco Sol' : values.banco || 'Banco Sol';
      const salNum = parseKz(values.salario || '0');
      const salarioFormatado = salNum > 0 ? fmtKz(salNum) : values.salario || '';
      const salarioExtenso = salNum > 0 ? extensoKz(salNum) : '';

      const sigreEfectividadeRecord =
        service.type === 'DECLARACAO_EFECTIVIDADE'
          ? {
              id: `quick-efect-${Date.now()}`,
              createdAt: nowIso,
              updatedAt: nowIso,
              governoProv: 'Governo Provincial de Malanje',
              administracao: 'Administração Municipal do Quêssua',
              direccao: 'Direcção Municipal da Educação',
              director: values.director || 'Belízio Miguel dos Santos António',
              tratamento: (values.tratamento || 'Senhor') as 'Senhor' | 'Senhora',
              nome: values.requester,
              pai: values.pai || '',
              mae: values.mae || '',
              naturalidade: values.naturalidade || 'Malanje',
              provNat: values.provNat || 'Malanje',
              nascimento: values.nascimento || '',
              bi: values.employeeBi || '',
              biEmissao: values.biEmissao || '',
              sector: values.sector || 'Educação',
              funcao: values.funcao || 'Docente',
              categoria: values.employeeCategory || 'P.E.P.E.S.',
              grau: values.grau || '11.º Grau',
              agente: values.employeeAgente || '',
              municipio: values.municipio || 'Quêssua',
              escola: values.workplace || '',
              finalidade:
                values.purpose ||
                'Instrução do processo de candidatura ao Concurso Público de Acesso e de Ingresso Interno no Sector da Educação',
              local: values.local || 'Quêssua',
              dataEmissao: values.dataEmissao || todayIso,
            }
          : undefined;

      const sigreServicoRecord =
        service.type === 'DECLARACAO_SERVICO'
          ? {
              id: `quick-serv-${Date.now()}`,
              createdAt: nowIso,
              updatedAt: nowIso,
              nome: values.requester,
              tratamento: (values.tratamento || 'Senhor') as 'Senhor' | 'Senhora',
              nascimento: values.nascimento || '',
              naturalidade: values.naturalidade || 'Malanje',
              provNat: values.provNat || 'Malanje',
              pai: values.pai || '',
              mae: values.mae || '',
              bi: values.employeeBi || '',
              biData: values.biEmissao || '',
              profissao: values.funcao || 'Professor do Ensino Primário',
              grau: values.grau || '11º Grau',
              categoria: values.employeeCategory || 'P.E.P.E.S do 11º',
              agente: values.employeeAgente || '',
              municipio: values.municipio || 'Quêssua',
              escola: values.workplace || '',
              banco: values.banco || 'Banco Sol',
              bancoOutro: values.bancoOutro || '',
              bancoFinal,
              conta: values.conta || '',
              salario: values.salario || '',
              salarioFormatado,
              salarioExtenso,
              finalidade: values.purpose || 'à regularização da conta bancária',
              director: values.director || 'Belízio Miguel dos Santos António',
              local: values.local || 'Quêssua',
              dataEmissao: values.dataEmissao || todayIso,
            }
          : undefined;

      const sigreGuiaFeriasRecord =
        service.type === 'GUIA_FERIAS'
          ? {
              id: `quick-ferias-${Date.now()}`,
              createdAt: nowIso,
              updatedAt: nowIso,
              ng: values.ng || '01',
              ang: parseInt(values.ang || currentYear, 10) || Number(currentYear),
              trat: (values.tratamento === 'Senhora' ? 'a Senhora' : 'o Senhor') as
                | 'o Senhor'
                | 'a Senhora',
              nome: values.requester,
              agente: values.employeeAgente || '',
              cat: values.employeeCategory || 'P.E.P.E.S.',
              grau: values.grau || '10º Grau',
              funcao: values.funcao || 'Docente',
              tipoesc: values.tipoesc || 'Escola Primária',
              nesc: values.nesc || '166',
              local: values.localEscola || 'Quêssua',
              tipolic: values.tipolic || 'Licença Disciplinar (férias)',
              ano: parseInt(values.anoFerias || currentYear, 10) || Number(currentYear),
              dias: parseInt(values.diasFerias || '30', 10) || 30,
              ini: values.iniFerias || todayIso,
              fim:
                values.fimFerias ||
                calculateFimDate(
                  values.iniFerias || todayIso,
                  parseInt(values.diasFerias || '30', 10) || 30
                ),
              locem: values.local || 'Quêssua',
              datem: values.dataEmissao || todayIso,
              dir: values.director || 'Belízio Miguel dos Santos António',
            }
          : undefined;

      const sigreGuiaColocacaoRecord =
        service.type === 'GUIA_COLOCACAO'
          ? {
              id: `quick-coloc-${Date.now()}`,
              createdAt: nowIso,
              updatedAt: nowIso,
              numGuia: values.numGuia || '01',
              anoGuia: values.anoGuia || currentYear,
              trat: (values.tratamento === 'Senhora' ? 'F' : 'M') as 'M' | 'F',
              nome: values.requester,
              cat: values.employeeCategory || 'P.E.P.E.S.',
              grau: values.grau || '13º Grau',
              agente: values.employeeAgente || '',
              escola: values.workplace || '',
              local: values.local || 'Quêssua',
              dataEmissao: values.dataEmissao || todayIso,
              director: values.director || 'Belízio Miguel dos Santos António',
            }
          : undefined;

      const builtDetails: QuickServiceRequest['details'] = {
        employeeName: service.category === 'funcionarios' ? values.requester : undefined,
        employeeBi: service.category === 'funcionarios' ? values.employeeBi : undefined,
        employeeAgente: service.category === 'funcionarios' ? values.employeeAgente : undefined,
        employeeCategory:
          service.category === 'funcionarios' ? values.employeeCategory : undefined,
        employeeSchoolOrDepartment:
          service.category === 'funcionarios' ? targetSchoolName : undefined,
        referenceMonthYear:
          service.category === 'funcionarios' ? values.referenceMonthYear : undefined,
        tratamento: service.category === 'funcionarios' ? values.tratamento : undefined,
        pai: service.category === 'funcionarios' ? values.pai : undefined,
        mae: service.category === 'funcionarios' ? values.mae : undefined,
        naturalidade: service.category === 'funcionarios' ? values.naturalidade : undefined,
        provNat: service.category === 'funcionarios' ? values.provNat : undefined,
        nascimento: service.category === 'funcionarios' ? values.nascimento : undefined,
        biEmissao: service.category === 'funcionarios' ? values.biEmissao : undefined,
        sector: service.category === 'funcionarios' ? values.sector : undefined,
        funcao: service.category === 'funcionarios' ? values.funcao : undefined,
        grau: service.category === 'funcionarios' ? values.grau : undefined,
        municipio: service.category === 'funcionarios' ? values.municipio : undefined,
        dataEmissao: service.category === 'funcionarios' ? values.dataEmissao : undefined,
        director: service.category === 'funcionarios' ? values.director : undefined,
        local: service.category === 'funcionarios' ? values.local : undefined,
        sigreEfectividade: sigreEfectividadeRecord,
        sigreServico: sigreServicoRecord,
        sigreGuiaFerias: sigreGuiaFeriasRecord,
        sigreGuiaColocacao: sigreGuiaColocacaoRecord,
        studentName: service.category === 'escolares' ? resolvedStudentName : undefined,
        studentBiOrProcesso:
          service.category === 'escolares'
            ? verifiedEnrollment?.codigoMatricula || values.studentBiOrProcesso
            : undefined,
        studentClasse:
          service.category === 'escolares'
            ? verifiedEnrollment?.classe || values.studentClasse
            : undefined,
        studentTurma:
          service.category === 'escolares'
            ? verifiedEnrollment?.turma || values.studentTurma
            : undefined,
        studentPeriodo:
          service.category === 'escolares'
            ? verifiedEnrollment?.turno || values.studentPeriodo
            : undefined,
        enrollmentVerified:
          service.category === 'escolares' ? Boolean(verifiedEnrollment?.isEnrolled) : undefined,
        enrolledStudentId: verifiedEnrollment?.studentId,
        enrolledCodigoMatricula: verifiedEnrollment?.codigoMatricula,
        enrolledClasse: verifiedEnrollment?.classe,
        enrolledTurma: verifiedEnrollment?.turma,
        enrolledTurno: verifiedEnrollment?.turno,
        enrolledSala: verifiedEnrollment?.sala,
        trimestre: service.type === 'BOLETIM_NOTAS' ? values.term : undefined,
        academicYear: values.year || currentYear,
        destinationSchool:
          service.type === 'GUIA_TRANSFERENCIA' ? values.destinationSchool : undefined,
        destinationSchoolId: matchedDestSchool?.id,
        purpose: values.purpose || 'Efeito Oficial',
        notes: values.notes || undefined,
      };

      if (editingSubmittedRequest) {
        const editRes = await updateSubmittedQuickServiceRequest(editingSubmittedRequest.id, {
          title,
          requesterName: values.requester,
          requesterPhone: values.phone,
          requesterEmail: values.email || undefined,
          requesterRoleTitle:
            service.category === 'funcionarios'
              ? `${values.funcao || 'Docente'} (${values.employeeCategory || 'P.E.P.E.S.'})`
              : 'Encarregado(a) de Educação / Aluno',
          targetRole: service.targetRole,
          targetSchoolId: matchedSchool?.id || editingSubmittedRequest.targetSchoolId || 'escola-quessua-1',
          targetSchoolName:
            targetSchoolName || editingSubmittedRequest.targetSchoolName || schools[0]?.name || 'Direcção Municipal da Educação',
          destinationSchoolId: matchedDestSchool?.id,
          destinationSchoolName:
            service.type === 'GUIA_TRANSFERENCIA' ? values.destinationSchool : undefined,
          details: builtDetails,
        });

        if (!editRes.success || !editRes.request) {
          setFormError(
            editRes.error || 'Não foi possível alterar o pedido submetido. Tente novamente.'
          );
          return;
        }

        const updatedReq = editRes.request;
        saveMyRequestLocally(updatedReq);
        if (submittedRequest?.id === updatedReq.id) {
          setSubmittedRequest(updatedReq);
        }
        closeModal();
        showToast(`Pedido ${updatedReq.protocol} alterado e sincronizado com sucesso.`);
        return;
      }

      const res = await submitQuickServiceRequest({
        serviceType: service.type,
        targetRole: service.targetRole,
        targetSchoolId: matchedSchool?.id || 'escola-quessua-1',
        targetSchoolName: targetSchoolName || schools[0]?.name || 'Direcção Municipal da Educação',
        destinationSchoolId: matchedDestSchool?.id,
        destinationSchoolName:
          service.type === 'GUIA_TRANSFERENCIA' ? values.destinationSchool : undefined,
        requesterName: values.requester,
        requesterRoleTitle:
          service.category === 'funcionarios'
            ? `${values.funcao || 'Docente'} (${values.employeeCategory || 'P.E.P.E.S.'})`
            : 'Encarregado(a) de Educação / Aluno',
        requesterPhone: values.phone,
        requesterEmail: values.email || undefined,
        title,
        details: builtDetails,
      });

      if (!res.success || !res.request) {
        setFormError(
          res.error ||
            res.message ||
            'Não foi possível submeter o pedido. Verifique os dados e tente novamente.'
        );
        return;
      }

      const created = res.request;
      saveMyRequestLocally(created);

      if (draftIdToRemove) {
        saveDraftsToStorage(drafts.filter((d) => d.id !== draftIdToRemove));
      }

      setSubmittedRequest(created);
      closeModal();
      setActiveTab('receipt');
      showToast(`Pedido submetido com sucesso (${created.protocol}).`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setFormError('Não foi possível submeter o pedido. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = collectCurrentFormValues();
    const validationErr = validateCurrentForm(values);
    if (validationErr) {
      setFormError(validationErr);
      return;
    }
    await submitOfficialFromValues(activeService, values, editingDraftId);
  };

  const handleDeleteDraft = (id: string) => {
    const next = drafts.filter((item) => item.id !== id);
    saveDraftsToStorage(next);
    setConfirmDeleteDraftId(null);
    showToast('Rascunho eliminado.');
  };

  const handleCancelSubmittedRequest = async (req: QuickServiceRequest) => {
    setCancellingRequestId(req.id);
    try {
      const res = await cancelQuickServiceRequest(
        req.id,
        'Pedido cancelado pelo requerente através do portal de Serviços Rápidos.'
      );
      if (res.success && res.request) {
        saveMyRequestLocally(res.request);
        if (submittedRequest?.id === res.request.id) {
          setSubmittedRequest(res.request);
        }
        setConfirmCancelRequestId(null);
        showToast(`Pedido ${req.protocol} cancelado com sucesso.`);
      } else {
        showToast(res.error || 'Não foi possível cancelar o pedido.');
      }
    } catch {
      showToast('Erro ao cancelar o pedido.');
    } finally {
      setCancellingRequestId(null);
    }
  };

  const handleRemoveLocalSubmittedRequest = (id: string) => {
    setMyRequests((prev) => {
      const next = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(MY_REQUESTS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    showToast('Registo removido da lista local.');
  };

  const [isDownloadingReceiptPdf, setIsDownloadingReceiptPdf] = useState(false);

  const handleCopyProtocol = (protocol: string) => {
    navigator.clipboard.writeText(protocol);
    setCopiedProtocol(true);
    setTimeout(() => setCopiedProtocol(false), 2500);
  };

  const handlePrintReceipt = () => {
    printSinglePageA4Clean('quick-service-official-receipt');
  };

  const handleDownloadReceiptPdf = async () => {
    if (!submittedRequest || isDownloadingReceiptPdf) return;
    setIsDownloadingReceiptPdf(true);
    try {
      await downloadQuickServiceReceiptPdf(submittedRequest);
      showToast('Comprovativo Oficial transferido em PDF.');
    } catch {
      showToast('Não foi possível gerar o PDF. Tente imprimir em A4.');
    } finally {
      setIsDownloadingReceiptPdf(false);
    }
  };

  const handleSearchExactProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = protocolSearchQuery.trim().toUpperCase();
    setProtocolSearchError(null);
    setSearchProtocolResult(null);

    if (!query) {
      setProtocolSearchError('Digite o número de protocolo (ex: SR-2026-1234).');
      return;
    }

    setIsSearchingProtocol(true);
    try {
      const localMatch = myRequests.find((r) => r.protocol.toUpperCase() === query);
      if (localMatch) {
        setSearchProtocolResult(localMatch);
        return;
      }

      const all = await fetchQuickRequests();
      const serverMatch = all.find((r) => r.protocol.toUpperCase() === query);
      if (serverMatch) {
        setSearchProtocolResult(serverMatch);
        saveMyRequestLocally(serverMatch);
      } else {
        setProtocolSearchError(`Nenhum pedido encontrado com o protocolo "${query}".`);
      }
    } catch {
      setProtocolSearchError('Não foi possível consultar o protocolo neste momento.');
    } finally {
      setIsSearchingProtocol(false);
    }
  };

  const totalSavedCount = drafts.length + myRequests.length;

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#1c2927] border-t-[5px] border-[#c8443e] pb-16">
      {/* Formal SIGRE A4 Document CSS for Comprovativo Oficial */}
      <style>{`
        #quick-service-official-receipt,
        #quick-service-official-receipt * {
          font-family: "Times New Roman", Times, Georgia, serif !important;
          box-sizing: border-box;
        }
        #quick-service-official-receipt {
          color: #000000;
          background: #ffffff;
        }
        #quick-service-official-receipt .a4-header-block {
          text-align: center;
          margin-bottom: 10pt;
        }
        #quick-service-official-receipt .a4-emblem-img {
          width: 60px;
          height: auto;
          max-height: 60px;
          object-fit: contain;
          display: block;
          margin: 0 auto 6px auto;
        }
        #quick-service-official-receipt .a4-republic-title {
          font-size: 12pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          line-height: 1.25;
          margin: 0 0 2pt 0;
          color: #000000;
        }
        #quick-service-official-receipt .a4-inst-line {
          font-size: 12pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.01em;
          line-height: 1.25;
          margin: 1.5pt 0;
          color: #000000;
        }
        #quick-service-official-receipt .a4-title-wrap {
          padding-top: 10pt;
          padding-bottom: 4pt;
          text-align: center;
        }
        #quick-service-official-receipt .a4-title-wrap h1 {
          display: inline-block;
          font-size: 12pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          line-height: 1.25;
          border-bottom: 1.5px solid #000000;
          padding-bottom: 2pt;
          margin: 0;
          color: #000000;
        }
        #quick-service-official-receipt .a4-protocol-sub {
          margin-top: 5pt;
          font-size: 10pt;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #111111;
        }
        #quick-service-official-receipt .a4-body-copy {
          margin-top: 10pt;
          font-size: 10pt;
          line-height: 1.48;
          text-align: justify;
          color: #000000;
        }
        #quick-service-official-receipt .a4-body-copy p {
          margin: 0 0 8pt 0;
          font-size: 10pt;
          text-indent: 1.25cm;
          text-align: justify;
        }
        #quick-service-official-receipt .a4-body-copy strong {
          font-size: 10pt;
        }
        #quick-service-official-receipt .receipt-sec-heading {
          font-size: 12pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          border-bottom: 1px solid #000000;
          padding-bottom: 2.5pt;
          margin: 12pt 0 6pt 0;
          color: #000000;
        }
        #quick-service-official-receipt table.receipt-formal-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10pt;
          line-height: 1.35;
          color: #000000;
        }
        #quick-service-official-receipt table.receipt-formal-table th,
        #quick-service-official-receipt table.receipt-formal-table td {
          border: 1px solid #333333;
          padding: 4.5pt 7pt;
          font-size: 10pt;
          vertical-align: top;
          text-align: left;
        }
        #quick-service-official-receipt table.receipt-formal-table th {
          width: 34%;
          font-weight: 700;
          background-color: #f6f7f6;
          color: #000000;
        }
        #quick-service-official-receipt table.receipt-formal-table td {
          width: 66%;
          font-weight: 400;
          color: #000000;
        }
        #quick-service-official-receipt .receipt-val-red {
          color: #c00000 !important;
          font-weight: 700 !important;
        }
        #quick-service-official-receipt .receipt-val-blue {
          color: #0044cc !important;
          font-weight: 700 !important;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #quick-service-official-receipt, #quick-service-official-receipt * {
            visibility: visible !important;
          }
          #quick-service-official-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 15mm 20mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* =====================================================================
          HEADER
          ===================================================================== */}
      <header className="no-print sticky top-0 z-20 bg-[#f5f7f5]/92 backdrop-blur-md border-b border-[#dce4df]">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6 min-h-[64px] py-2.5 flex flex-wrap items-center justify-between gap-4">
          <nav className="flex flex-wrap items-center gap-2" aria-label="Navegação principal">
            <button
              id="btn-quick-catalogo"
              type="button"
              onClick={() => {
                setActiveTab('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-sm font-bold inline-flex items-center gap-2 border transition-colors cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-[#ffffff] border-[#dce4df] text-[#1c2927]'
                  : 'border-transparent text-[#64736f] hover:text-[#1c2927]'
              }`}
            >
              <span>Catálogo</span>
            </button>

            <button
              id="btn-quick-meus-pedidos"
              type="button"
              onClick={() => {
                setActiveTab('requests');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-sm font-bold inline-flex items-center gap-2 border transition-colors cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-[#ffffff] border-[#dce4df] text-[#1c2927]'
                  : 'border-transparent text-[#64736f] hover:text-[#1c2927]'
              }`}
            >
              <span>Meus pedidos</span>
              <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#e8f4ef] text-[#115348] text-xs font-extrabold inline-grid place-items-center tabular-nums">
                {totalSavedCount}
              </span>
            </button>
          </nav>

          <button
            type="button"
            onClick={onNavigateHome}
            className="min-h-[40px] px-3.5 py-2 rounded-lg text-sm font-bold inline-flex items-center gap-1.5 border border-[#dce4df] bg-white text-[#1c2927] hover:border-[#b9c8c0] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#64736f]" />
            <span>Voltar ao Portal</span>
          </button>
        </div>
      </header>

      {/* =====================================================================
          MAIN CONTENT
          ===================================================================== */}
      <main className="max-w-[980px] mx-auto px-4 sm:px-6 pt-8">
        {/* ===================================================================
            VIEW 1: CATÁLOGO DE SERVIÇOS
            =================================================================== */}
        {activeTab === 'catalog' && (
          <section id="catalogSection" aria-labelledby="catalogTitle">
            <div className="mb-5">
              <h1
                id="catalogTitle"
                className="m-0 text-[clamp(1.75rem,3vw,2.35rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#1c2927]"
              >
                Catálogo de serviços
              </h1>
            </div>

            {/* Search & Audience Filter Toolbar */}
            <div
              className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center p-3.5 bg-white border border-[#dce4df] rounded-[14px] shadow-[0_10px_28px_rgba(20,36,33,0.06)]"
              aria-label="Pesquisa e filtros"
            >
              <label
                htmlFor="searchInput"
                className="flex items-center gap-2.5 min-h-[44px] px-3.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] focus-within:outline-2 focus-within:outline-[#176b5b] focus-within:outline-offset-2"
              >
                <Search className="w-[18px] h-[18px] text-[#64736f] shrink-0" />
                <input
                  ref={searchInputRef}
                  id="searchInput"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && searchQuery) {
                      setSearchQuery('');
                    }
                  }}
                  placeholder="Pesquisar um serviço"
                  autoComplete="off"
                  className="w-full border-0 bg-transparent text-[#1c2927] placeholder:text-[#64736f] outline-none text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Limpar pesquisa"
                    className="w-7 h-7 rounded-md grid place-items-center text-[#64736f] hover:bg-[#edf2ef] hover:text-[#1c2927] text-lg leading-none cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </label>

              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filtrar por público"
              >
                {(
                  [
                    { key: 'all', label: 'Todos' },
                    { key: 'funcionarios', label: 'Funcionários' },
                    { key: 'escolares', label: 'Alunos e encarregados' },
                  ] as const
                ).map((filterBtn) => {
                  const isActive = activeCategory === filterBtn.key;
                  return (
                    <button
                      key={filterBtn.key}
                      type="button"
                      onClick={() => setActiveCategory(filterBtn.key)}
                      className={`min-h-[40px] px-3.5 py-2 rounded-[10px] text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#e8f4ef] border-[#b7ddd1] text-[#115348]'
                          : 'bg-transparent border-[#dce4df] text-[#64736f] hover:text-[#1c2927] hover:border-[#c6d3cc]'
                      }`}
                    >
                      {filterBtn.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section Head */}
            <div className="flex items-baseline justify-between gap-4 mt-[26px] mb-3">
              <h2 className="m-0 text-base font-extrabold text-[#1c2927]">
                Serviços disponíveis
              </h2>
              <span className="text-[#64736f] text-sm font-semibold tabular-nums">
                {filteredServices.length === 1
                  ? '1 serviço'
                  : `${filteredServices.length} serviços`}
              </span>
            </div>

            {/* Horizontal Service List */}
            {filteredServices.length > 0 ? (
              <div className="grid gap-3" role="list">
                {filteredServices.map((service) => {
                  return (
                    <article
                      key={service.id}
                      role="listitem"
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-white border border-[#dce4df] rounded-[14px] shadow-[0_10px_28px_rgba(20,36,33,0.06)] hover:border-[#bfd0c7] transition-colors"
                    >
                      <h3 className="m-0 text-[1.05rem] font-bold leading-[1.3] text-[#1c2927]">
                        {service.title}
                      </h3>

                      <button
                        type="button"
                        onClick={() => openServiceModal(service)}
                        className="w-full sm:w-auto min-h-[42px] px-5 py-2.5 rounded-[10px] bg-[#c8443e] hover:bg-[#a9332f] text-white font-bold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer shrink-0"
                      >
                        <span>Solicitar</span>
                        <span aria-hidden="true">→</span>
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="p-9 px-6 text-center bg-white border border-[#dce4df] rounded-[14px] shadow-[0_10px_28px_rgba(20,36,33,0.06)]">
                <h3 className="m-0 mb-1.5 text-lg font-bold text-[#1c2927]">
                  Nenhum serviço encontrado
                </h3>
                <p className="m-0 mb-[18px] text-[#64736f] text-sm">
                  Tente outro termo ou mostre novamente todos os serviços.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="min-h-[42px] px-4 py-2.5 rounded-[10px] border border-[#dce4df] bg-white hover:border-[#b9c8c0] text-[#1c2927] font-bold text-sm cursor-pointer"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </section>
        )}

        {/* ===================================================================
            VIEW 2: MEUS PEDIDOS (RASCUNHOS + PEDIDOS SUBMETIDOS + CONSULTA)
            =================================================================== */}
        {activeTab === 'requests' && (
          <section id="requestsSection" aria-labelledby="requestsTitle" className="space-y-7">
            <div className="mb-2">
              <p className="m-0 mb-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[#176b5b]">
                Guardados neste dispositivo
              </p>
              <h1
                id="requestsTitle"
                className="m-0 text-[clamp(1.75rem,3vw,2.35rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#1c2927]"
              >
                Meus pedidos
              </h1>
              <p className="mt-2 mb-0 max-w-[62ch] text-[#64736f] text-sm sm:text-base">
                Os rascunhos e pedidos enviados ficam guardados neste navegador para consulta, edição ou acompanhamento do despacho oficial.
              </p>
            </div>

            {/* Rascunhos Guardados */}
            {drafts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="m-0 text-base font-extrabold text-[#1c2927]">
                    Rascunhos guardados
                  </h2>
                  <span className="text-[#64736f] text-sm font-semibold tabular-nums">
                    {drafts.length === 1 ? '1 rascunho' : `${drafts.length} rascunhos`}
                  </span>
                </div>

                <div className="grid gap-3">
                  {drafts.map((item) => {
                    const catalogMatch =
                      CATALOG_SERVICES.find((s) => s.type === item.serviceType) ||
                      CATALOG_SERVICES[0];
                    const formattedDate = new Intl.DateTimeFormat('pt-AO', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(item.updatedAt || item.createdAt));

                    const details: Array<[string, string | undefined]> = [
                      ['Requerente', item.values.requester],
                      ['Contacto', item.values.phone],
                      [item.updatedAt ? 'Actualizado em' : 'Criado em', formattedDate],
                    ];

                    if (item.values.workplace) {
                      details.push(['Escola ou repartição', item.values.workplace]);
                    }
                    if (item.values.student) {
                      details.push(['Aluno', item.values.student]);
                    }
                    if (item.values.school) {
                      details.push(['Escola', item.values.school]);
                    }
                    if (item.values.studentClasse) {
                      details.push([
                        'Classe / Turma',
                        `${item.values.studentClasse}${item.values.studentTurma ? ` · ${item.values.studentTurma}` : ''}`,
                      ]);
                    }
                    if (item.values.term) {
                      details.push(['Trimestre', item.values.term]);
                    }
                    if (item.values.year && item.serviceType === 'DECLARACAO_MATRICULA') {
                      details.push(['Ano lectivo', item.values.year]);
                    }
                    if (item.values.destinationSchool) {
                      details.push(['Escola pretendida', item.values.destinationSchool]);
                    }
                    if (item.values.notes) {
                      details.push(['Observações', item.values.notes]);
                    }

                    return (
                      <article
                        key={item.id}
                        className="p-[18px] bg-white border border-[#dce4df] rounded-[14px] shadow-[0_10px_28px_rgba(20,36,33,0.06)]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#fff7e2] text-[#8d5b08] text-xs font-extrabold">
                              Rascunho guardado
                            </span>
                            <h3 className="mt-2 mb-1 text-[1.04rem] font-bold text-[#1c2927]">
                              {item.serviceTitle}
                            </h3>
                            <p className="m-0 text-[#64736f] text-sm">
                              Destino: {item.destination}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() =>
                                submitOfficialFromValues(catalogMatch, item.values, item.id)
                              }
                              className="min-h-[38px] px-3.5 py-1.5 rounded-[10px] bg-[#176b5b] hover:bg-[#115348] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Enviar pedido oficial</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openServiceModal(catalogMatch, item)}
                              className="min-h-[38px] px-3.5 py-1.5 rounded-[10px] border border-[#dce4df] bg-white hover:border-[#b9c8c0] text-[#1c2927] text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#64736f]" />
                              <span>Editar</span>
                            </button>

                            {confirmDeleteDraftId === item.id ? (
                              <div className="inline-flex items-center gap-1.5 bg-[#fff2f1] border border-[#f2b9b5] px-2.5 py-1 rounded-[10px]">
                                <span className="text-xs font-bold text-[#982c27]">
                                  Confirmar?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDraft(item.id)}
                                  className="px-2 py-1 rounded bg-[#c8443e] text-white text-xs font-bold cursor-pointer"
                                >
                                  Sim
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteDraftId(null)}
                                  className="px-2 py-1 rounded bg-white border border-[#dce4df] text-[#1c2927] text-xs font-bold cursor-pointer"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteDraftId(item.id)}
                                className="min-h-[38px] px-3.5 py-1.5 rounded-[10px] border border-[#dce4df] bg-white hover:border-[#b9c8c0] text-[#982c27] text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 m-0 pt-3 border-t border-[#dce4df]">
                          {details.map(([label, val]) => (
                            <div key={label}>
                              <dt className="text-xs text-[#64736f] font-bold">{label}</dt>
                              <dd className="m-0 mt-0.5 font-semibold text-sm text-[#1c2927] break-words">
                                {val}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Consulta por Protocolo Oficial */}
            <div className="p-5 bg-white border border-[#dce4df] rounded-[14px] shadow-[0_10px_28px_rgba(20,36,33,0.06)] space-y-3">
              <div>
                <h2 className="m-0 text-base font-extrabold text-[#1c2927]">
                  Consultar pedido por código de protocolo
                </h2>
                <p className="m-0 mt-1 text-xs sm:text-sm text-[#64736f]">
                  Introduza o código oficial (ex.: SR-2026-8492) para verificar o estado do despacho na escola ou Direcção Municipal.
                </p>
              </div>

              <form
                onSubmit={handleSearchExactProtocol}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                <label className="flex-1 flex items-center gap-2.5 min-h-[42px] px-3.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] focus-within:outline-2 focus-within:outline-[#176b5b]">
                  <Search className="w-4 h-4 text-[#64736f] shrink-0" />
                  <input
                    type="search"
                    value={protocolSearchQuery}
                    onChange={(e) => setProtocolSearchQuery(e.target.value)}
                    placeholder="Código de protocolo (ex: SR-2026-8492)..."
                    className="w-full border-0 bg-transparent text-sm text-[#1c2927] placeholder:text-[#64736f] outline-none font-mono"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSearchingProtocol}
                  className="min-h-[42px] px-5 py-2.5 rounded-[10px] bg-[#176b5b] hover:bg-[#115348] text-white text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {isSearchingProtocol ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>A consultar...</span>
                    </>
                  ) : (
                    <span>Consultar</span>
                  )}
                </button>
              </form>

              {protocolSearchError && (
                <div className="p-3 rounded-[10px] bg-[#fff2f1] border border-[#f2b9b5] text-[#982c27] text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{protocolSearchError}</span>
                </div>
              )}

              {searchProtocolResult && (
                <div className="p-4 rounded-[12px] bg-[#e8f4ef] border border-[#b7ddd1] text-sm space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-extrabold text-[#115348]">
                      {searchProtocolResult.protocol}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-[#115348] text-xs font-extrabold border border-[#b7ddd1]">
                      {searchProtocolResult.status}
                    </span>
                  </div>
                  <div className="font-bold text-[#1c2927]">{searchProtocolResult.title}</div>
                  {searchProtocolResult.details?.responseMessage && (
                    <p className="m-0 text-xs text-[#115348] bg-white/80 p-2.5 rounded-lg border border-[#b7ddd1]">
                      <strong>Despacho:</strong> {searchProtocolResult.details.responseMessage}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Pedidos Oficiais Submetidos */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="m-0 text-base font-extrabold text-[#1c2927]">
                  Pedidos submetidos ({myRequests.length})
                </h2>
                <span className="text-[#64736f] text-xs sm:text-sm font-semibold">
                  Sincronizado com a secretaria e Direcção Municipal
                </span>
              </div>

              {myRequests.length === 0 && drafts.length === 0 ? (
                <div className="p-9 px-6 text-center bg-white border border-[#dce4df] rounded-[14px] shadow-[0_10px_28px_rgba(20,36,33,0.06)]">
                  <h3 className="m-0 mb-1.5 text-lg font-bold text-[#1c2927]">
                    Ainda não guardou nenhum pedido
                  </h3>
                  <p className="m-0 mb-[18px] text-[#64736f] text-sm">
                    Escolha um serviço no catálogo para criar um rascunho ou enviar o seu primeiro pedido.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('catalog')}
                    className="min-h-[42px] px-4 py-2.5 rounded-[10px] border border-[#dce4df] bg-white hover:border-[#b9c8c0] text-[#1c2927] font-bold text-sm cursor-pointer"
                  >
                    Ir para o catálogo
                  </button>
                </div>
              ) : myRequests.length === 0 ? (
                <div className="p-6 text-center bg-white border border-[#dce4df] rounded-[14px] text-sm text-[#64736f]">
                  Ainda não submeteu nenhum pedido oficial. Pode enviar um dos rascunhos acima ou iniciar um novo pedido no catálogo.
                </div>
              ) : (
                <div className="grid gap-3">
                  {myRequests.map((req) => {
                    const isConcluido = req.status === 'CONCLUIDO';
                    const isVagaConfirmada = req.status === 'VAGA_CONFIRMADA';
                    const isAguardandoVaga = req.status === 'AGUARDANDO_VAGA_DESTINO';
                    const isSemVaga = req.status === 'SEM_VAGA_DESTINO';
                    const isEmAnalise = req.status === 'EM_ANALISE';
                    const isRejeitado = req.status === 'REJEITADO';
                    const isCancelado = req.status === 'CANCELADO';

                    const statusLabel = isConcluido
                      ? 'Concluído / Emitido'
                      : isCancelado
                      ? 'Cancelado pelo Requerente'
                      : isVagaConfirmada
                      ? `Vaga Confirmada (${req.details?.reservedTurma || 'Turma Reservada'})`
                      : isAguardandoVaga
                      ? 'Aguardando Vaga na Escola Destino'
                      : isSemVaga
                      ? 'Sem Vaga na Escola Destino'
                      : isEmAnalise
                      ? 'Em Análise pela Direção'
                      : isRejeitado
                      ? 'Indeferido'
                      : 'Pendente / Na Fila da Direção';

                    const statusBadgeClass =
                      isConcluido || isVagaConfirmada
                        ? 'bg-[#e8f4ef] text-[#115348]'
                        : isRejeitado || isSemVaga || isCancelado
                        ? 'bg-[#fff2f1] text-[#982c27]'
                        : 'bg-[#fff7e2] text-[#8d5b08]';

                    return (
                      <article
                        key={req.id}
                        className={`p-[18px] bg-white border rounded-[14px] shadow-[0_10px_28px_rgba(20,36,33,0.06)] ${
                          isCancelado ? 'border-[#e5d2d1] opacity-85' : 'border-[#dce4df]'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-extrabold text-sm text-[#1c2927]">
                                {req.protocol}
                              </span>
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold ${statusBadgeClass}`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                            <h3 className="mt-2 mb-1 text-[1.04rem] font-bold text-[#1c2927]">
                              {req.title}
                            </h3>
                            <p className="m-0 text-[#64736f] text-sm">
                              Destino:{' '}
                              {req.targetRole === 'ADMIN'
                                ? 'Direcção Municipal da Educação'
                                : req.targetSchoolName || 'Secretaria da escola'}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSubmittedRequest(req);
                                setActiveTab('receipt');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="min-h-[36px] px-3 py-1.5 rounded-[10px] border border-[#dce4df] bg-white hover:border-[#b9c8c0] text-[#1c2927] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileDown className="w-3.5 h-3.5 text-[#176b5b]" />
                              <span>Comprovativo (PDF)</span>
                            </button>

                            {!isConcluido && !isCancelado && (
                              <button
                                type="button"
                                onClick={() => openEditSubmittedModal(req)}
                                className="min-h-[36px] px-3 py-1.5 rounded-[10px] border border-[#dce4df] bg-white hover:border-[#176b5b] text-[#1c2927] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[#176b5b]" />
                                <span>Alterar pedido</span>
                              </button>
                            )}

                            {!isConcluido && !isCancelado && (
                              confirmCancelRequestId === req.id ? (
                                <div className="inline-flex items-center gap-1.5 bg-[#fff2f1] border border-[#f2b9b5] px-2.5 py-1 rounded-[10px]">
                                  <span className="text-xs font-bold text-[#982c27]">
                                    Cancelar pedido?
                                  </span>
                                  <button
                                    type="button"
                                    disabled={cancellingRequestId === req.id}
                                    onClick={() => handleCancelSubmittedRequest(req)}
                                    className="px-2 py-1 rounded bg-[#c8443e] text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                                  >
                                    {cancellingRequestId === req.id ? '...' : 'Sim'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmCancelRequestId(null)}
                                    className="px-2 py-1 rounded bg-white border border-[#dce4df] text-[#1c2927] text-xs font-bold cursor-pointer"
                                  >
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmCancelRequestId(req.id)}
                                  className="min-h-[36px] px-3 py-1.5 rounded-[10px] border border-[#f2b9b5] bg-[#fff2f1] hover:bg-[#ffe4e2] text-[#982c27] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Cancelar pedido</span>
                                </button>
                              )
                            )}

                            {(isCancelado || isRejeitado) && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLocalSubmittedRequest(req.id)}
                                className="min-h-[36px] px-3 py-1.5 rounded-[10px] border border-[#dce4df] bg-white hover:border-[#b9c8c0] text-[#64736f] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remover</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleCopyProtocol(req.protocol)}
                              className="min-h-[36px] px-3 py-1.5 rounded-[10px] border border-[#dce4df] bg-white hover:border-[#b9c8c0] text-[#1c2927] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-[#64736f]" />
                              <span>Copiar</span>
                            </button>

                            <a
                              href={`https://wa.me/244${(req.requesterPhone || '').replace(/\D/g, '')}?text=Olá,%20gostaria%20de%20informações%20sobre%20o%20protocolo%20${encodeURIComponent(req.protocol)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="min-h-[36px] px-3 py-1.5 rounded-[10px] bg-[#e8f4ef] text-[#115348] text-xs font-bold inline-flex items-center gap-1.5"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>

                        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 m-0 pt-3 border-t border-[#dce4df]">
                          <div>
                            <dt className="text-xs text-[#64736f] font-bold">Requerente</dt>
                            <dd className="m-0 mt-0.5 font-semibold text-sm text-[#1c2927]">
                              {req.requesterName}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-[#64736f] font-bold">Contacto</dt>
                            <dd className="m-0 mt-0.5 font-semibold text-sm text-[#1c2927] font-mono">
                              {req.requesterPhone}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-[#64736f] font-bold">Data de envio</dt>
                            <dd className="m-0 mt-0.5 font-semibold text-sm text-[#1c2927]">
                              {new Date(req.createdAt).toLocaleDateString('pt-PT')}
                            </dd>
                          </div>
                        </dl>

                        {req.details?.responseMessage && (
                          <div className="mt-3 p-3 rounded-[10px] bg-[#e8f4ef] border border-[#b7ddd1] text-xs text-[#115348]">
                            <strong className="block font-bold mb-0.5">
                              Despacho da Direcção / Administração:
                            </strong>
                            <span>{req.details.responseMessage}</span>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===================================================================
            VIEW 3: COMPROVATIVO OFICIAL DE REGISTO DE PEDIDO (DOCUMENTO A4 + PDF)
            =================================================================== */}
        {activeTab === 'receipt' && submittedRequest && (() => {
          const req = submittedRequest;
          const d = req.details || {};
          const createdDate = req.createdAt ? new Date(req.createdAt) : new Date();
          const createdIso = createdDate.toISOString().slice(0, 10);
          const createdDatePt = createdDate.toLocaleDateString('pt-PT');
          const createdTimePt = createdDate.toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const destinationEntity =
            req.targetRole === 'ADMIN'
              ? 'Direcção Municipal da Educação do Quêssua'
              : req.targetSchoolName || 'Secretaria da Instituição Escolar';

          const statusTextMap: Record<string, string> = {
            PENDENTE: 'Registado · Pendente de Análise',
            EM_ANALISE: 'Em Análise pelos Serviços Competentes',
            AGUARDANDO_VAGA_DESTINO: 'Aguardando Confirmação de Vaga na Escola Destino',
            VAGA_CONFIRMADA: 'Vaga Confirmada na Escola Destino',
            VAGA_CONFIRMADA_DESTINO: 'Vaga Confirmada na Escola Destino',
            SEM_VAGA_DESTINO: 'Sem Vaga Disponível na Escola Destino',
            CONCLUIDO: 'Concluído / Documento Emitido',
            REJEITADO: 'Indeferido',
            CANCELADO: 'Cancelado pelo Requerente',
          };
          const statusFormatted = statusTextMap[req.status] || 'Registado · Pendente de Análise';

          const formatIsoPt = (iso?: string) => {
            if (!iso) return '';
            const parts = iso.split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
            return iso;
          };

          // Build clean, organized formal rows for Section I
          const formalRows: Array<{
            label: string;
            value: string;
            highlight?: 'protocol' | 'person' | 'bold';
          }> = [
            { label: 'Código de Protocolo', value: req.protocol, highlight: 'protocol' },
            { label: 'Serviço Solicitado', value: req.title },
            { label: 'Entidade de Destino', value: destinationEntity },
            { label: 'Estado do Processo', value: statusFormatted },
            { label: 'Data e Hora de Registo', value: `${createdDatePt} às ${createdTimePt}` },
            {
              label: 'Nome do Requerente',
              value: `${d.tratamento ? `${d.tratamento} ` : ''}${req.requesterName}`,
              highlight: 'person',
            },
            { label: 'Contacto Telefónico', value: req.requesterPhone || '—', highlight: 'bold' },
          ];

          if (req.requesterEmail) {
            formalRows.push({ label: 'Correio Electrónico', value: req.requesterEmail });
          }

          // SIGRE Employee / Teacher fields
          const isEmployeeService =
            req.serviceType === 'DECLARACAO_EFECTIVIDADE' ||
            req.serviceType === 'DECLARACAO_SERVICO' ||
            req.serviceType === 'GUIA_FERIAS' ||
            req.serviceType === 'GUIA_COLOCACAO';

          if (isEmployeeService) {
            if (d.pai || d.mae) {
              formalRows.push({
                label: 'Filiação',
                value: [d.pai ? `Pai: ${d.pai}` : '', d.mae ? `Mãe: ${d.mae}` : '']
                  .filter(Boolean)
                  .join(' · '),
              });
            }
            if (d.nascimento || d.naturalidade || d.provNat) {
              const birthParts = [
                d.nascimento ? `Nascido(a) a ${formatIsoPt(d.nascimento)}` : '',
                d.naturalidade || d.provNat
                  ? `Natural de ${[d.naturalidade, d.provNat].filter(Boolean).join(', ')}`
                  : '',
              ].filter(Boolean);
              if (birthParts.length > 0) {
                formalRows.push({ label: 'Nascimento / Naturalidade', value: birthParts.join(' · ') });
              }
            }
            if (d.employeeBi) {
              formalRows.push({
                label: 'Bilhete de Identidade',
                value: d.biEmissao
                  ? `${d.employeeBi} (Emitido em ${formatIsoPt(d.biEmissao)})`
                  : d.employeeBi,
              });
            }
            if (d.employeeAgente) {
              formalRows.push({ label: 'N.º de Agente', value: d.employeeAgente, highlight: 'bold' });
            }
            if (d.funcao || d.employeeCategory || d.grau) {
              formalRows.push({
                label: 'Função / Categoria / Grau',
                value: [d.funcao, d.employeeCategory, d.grau].filter(Boolean).join(' · '),
              });
            }
            if (d.employeeSchoolOrDepartment || req.targetSchoolName) {
              formalRows.push({
                label: 'Escola / Local de Serviço',
                value: d.employeeSchoolOrDepartment || req.targetSchoolName || '—',
              });
            }
            if (d.sigreServico) {
              const srv = d.sigreServico;
              if (srv.banco) {
                formalRows.push({
                  label: 'Instituição Bancária / Conta',
                  value: [srv.banco, srv.conta ? `Conta: ${srv.conta}` : '']
                    .filter(Boolean)
                    .join(' · '),
                });
              }
              if (srv.salario) {
                formalRows.push({
                  label: 'Salário Base Mensal',
                  value: fmtKz(parseKz(String(srv.salario))),
                });
              }
            }
            if (d.sigreGuiaFerias) {
              const gf = d.sigreGuiaFerias;
              if (gf.tipolic || gf.dias) {
                formalRows.push({
                  label: 'Licença / Duração',
                  value: [
                    gf.tipolic,
                    gf.dias ? `${gf.dias} dias` : '',
                    gf.ano ? `Ano ${gf.ano}` : '',
                  ]
                    .filter(Boolean)
                    .join(' · '),
                });
              }
              if (gf.ini || gf.fim) {
                formalRows.push({
                  label: 'Período de Gozo',
                  value: `De ${formatIsoPt(gf.ini) || '—'} a ${formatIsoPt(gf.fim) || '—'}`,
                });
              }
            }
            if (d.purpose) {
              formalRows.push({ label: 'Finalidade Declarada', value: d.purpose });
            }
          } else {
            // School / Student Services
            if (d.studentName) {
              formalRows.push({
                label: 'Nome Completo do Aluno',
                value: d.studentName,
                highlight: 'person',
              });
            }
            if (d.studentBiOrProcesso) {
              formalRows.push({
                label: 'N.º de Processo / B.I.',
                value: d.studentBiOrProcesso,
                highlight: 'bold',
              });
            }
            if (d.studentClasse || d.studentTurma || d.studentPeriodo) {
              formalRows.push({
                label: 'Classe / Turma / Turno',
                value: [d.studentClasse, d.studentTurma, d.studentPeriodo]
                  .filter(Boolean)
                  .join(' · '),
              });
            }
            if (d.trimestre || d.academicYear) {
              formalRows.push({
                label: 'Período / Ano Lectivo',
                value: [d.trimestre, d.academicYear ? `Ano Lectivo ${d.academicYear}` : '']
                  .filter(Boolean)
                  .join(' · '),
              });
            }
            if (d.destinationSchool || req.destinationSchoolName) {
              formalRows.push({
                label: 'Escola de Destino',
                value: d.destinationSchool || req.destinationSchoolName || '—',
              });
            }
            if (d.purpose) {
              formalRows.push({ label: 'Motivo / Finalidade', value: d.purpose });
            }
          }

          if (d.notes) {
            formalRows.push({ label: 'Observações Registadas', value: d.notes });
          }

          return (
            <section className="space-y-5">
              {/* Barra Superior de Acções do Documento Oficial (não aparece na impressão nem no PDF) */}
              <div className="no-print bg-white rounded-[14px] border border-[#dce4df] px-4 py-3.5 shadow-[0_8px_24px_rgba(20,36,33,0.05)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('catalog')}
                    className="min-h-[38px] px-3.5 py-2 rounded-[10px] border border-[#dce4df] bg-white hover:border-[#b9c8c0] text-xs font-bold text-[#1c2927] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#64736f]" />
                    <span>Voltar ao catálogo</span>
                  </button>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#115348] bg-[#e8f4ef] px-3 py-1.5 rounded-[8px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Protocolo {req.protocol}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadReceiptPdf}
                    disabled={isDownloadingReceiptPdf}
                    className="min-h-[40px] px-4 py-2 rounded-[10px] bg-[#176b5b] hover:bg-[#115348] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {isDownloadingReceiptPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>A gerar PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-4 h-4" />
                        <span>Baixar PDF Oficial</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="min-h-[40px] px-3.5 py-2 rounded-[10px] border border-[#dce4df] bg-white hover:border-[#b9c8c0] text-[#1c2927] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-[#64736f]" />
                    <span>Imprimir (A4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyProtocol(req.protocol)}
                    className="min-h-[40px] px-3.5 py-2 rounded-[10px] border border-[#dce4df] bg-white hover:border-[#b9c8c0] text-[#1c2927] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedProtocol ? (
                      <>
                        <Check className="w-4 h-4 text-[#176b5b]" />
                        <span className="text-[#115348]">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-[#64736f]" />
                        <span>Copiar protocolo</span>
                      </>
                    )}
                  </button>

                  {req.status !== 'CONCLUIDO' && req.status !== 'CANCELADO' && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditSubmittedModal(req)}
                        className="min-h-[40px] px-3.5 py-2 rounded-[10px] border border-[#dce4df] bg-white hover:border-[#176b5b] text-[#1c2927] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-[#176b5b]" />
                        <span>Alterar pedido</span>
                      </button>

                      {confirmCancelRequestId === req.id ? (
                        <div className="inline-flex items-center gap-1.5 bg-[#fff2f1] border border-[#f2b9b5] px-2.5 py-1.5 rounded-[10px]">
                          <span className="text-xs font-bold text-[#982c27]">Confirmar cancelamento?</span>
                          <button
                            type="button"
                            disabled={cancellingRequestId === req.id}
                            onClick={() => handleCancelSubmittedRequest(req)}
                            className="px-2.5 py-1 rounded bg-[#c8443e] text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                          >
                            {cancellingRequestId === req.id ? '...' : 'Sim'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmCancelRequestId(null)}
                            className="px-2.5 py-1 rounded bg-white border border-[#dce4df] text-[#1c2927] text-xs font-bold cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmCancelRequestId(req.id)}
                          className="min-h-[40px] px-3.5 py-2 rounded-[10px] border border-[#f2b9b5] bg-[#fff2f1] hover:bg-[#ffe4e2] text-[#982c27] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancelar pedido</span>
                        </button>
                      )}
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab('requests')}
                    className="min-h-[40px] px-3.5 py-2 rounded-[10px] border border-[#dce4df] bg-[#f5f7f5] hover:bg-[#ebf0ed] text-[#1c2927] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Meus pedidos</span>
                  </button>
                </div>
              </div>

              {/* ===============================================================
                  FOLHA A4 OFICIAL — DOCUMENTO FORMAL DE COMPROVATIVO DE PEDIDO
                  =============================================================== */}
              <div className="overflow-x-auto pb-4">
                <article
                  id="quick-service-official-receipt"
                  className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white border border-[#cfd8d3] shadow-[0_14px_42px_rgba(20,36,33,0.12)] px-6 sm:px-[20mm] py-10 sm:py-[15mm] flex flex-col justify-between"
                >
                  <div>
                    {/* Cabeçalho Oficial da República de Angola */}
                    <header className="a4-header-block">
                      <img
                        src={emblemAngolaImg}
                        alt="Insígnia da República de Angola"
                        className="a4-emblem-img"
                      />
                      <p className="a4-republic-title">REPÚBLICA DE ANGOLA</p>
                      <p className="a4-inst-line">GOVERNO PROVINCIAL DE MALANJE</p>
                      <p className="a4-inst-line">ADMINISTRAÇÃO MUNICIPAL DO QUÊSSUA</p>
                      <p className="a4-inst-line">DIRECÇÃO MUNICIPAL DA EDUCAÇÃO</p>
                    </header>

                    {/* Título Formal Sublinhado */}
                    <div className="a4-title-wrap">
                      <h1>COMPROVATIVO OFICIAL DE REGISTO DE PEDIDO</h1>
                      <p className="a4-protocol-sub">
                        PROTOCOLO N.º{' '}
                        <span className="receipt-val-blue" style={{ color: '#0044cc' }}>
                          {req.protocol}
                        </span>{' '}
                        &mdash; PORTAL DE SERVIÇOS RÁPIDOS SIGRE
                      </p>
                    </div>

                    {/* Prosa Oficial de Certificação */}
                    <div className="a4-body-copy">
                      <p>
                        A <strong>Direcção Municipal da Educação do Município do Quêssua</strong>{' '}
                        certifica, para os devidos efeitos administrativos e de acompanhamento, que
                        foi devidamente registado no{' '}
                        <strong>Sistema Integrado de Gestão Escolar (SIGRE)</strong>, sob o{' '}
                        <strong>
                          Protocolo n.º{' '}
                          <span className="receipt-val-blue" style={{ color: '#0044cc' }}>
                            {req.protocol}
                          </span>
                        </strong>
                        , aos <strong>{formatAngolanDateExtenso(createdIso)}</strong>, pelas{' '}
                        <strong>{createdTimePt}</strong>, o pedido oficial de{' '}
                        <strong>{req.title}</strong>, requerido por{' '}
                        <strong className="receipt-val-red" style={{ color: '#c00000' }}>
                          {d.tratamento ? `${d.tratamento} ` : ''}
                          {req.requesterName}
                        </strong>
                        {d.studentName ? (
                          <>
                            , em benefício do(a) aluno(a){' '}
                            <strong className="receipt-val-red" style={{ color: '#c00000' }}>
                              {d.studentName}
                            </strong>
                          </>
                        ) : null}
                        , o qual foi encaminhado para apreciação e tramitação junto da{' '}
                        <strong>{destinationEntity}</strong>.
                      </p>
                    </div>

                    {/* Secção I — Quadro Formal de Dados Registados */}
                    <h2 className="receipt-sec-heading">
                      I. Identificação do Requerente e Dados do Pedido
                    </h2>

                    <table className="receipt-formal-table">
                      <tbody>
                        {formalRows.map((row) => (
                          <tr key={row.label}>
                            <th scope="row">{row.label}</th>
                            <td
                              className={
                                row.highlight === 'person'
                                  ? 'receipt-val-red'
                                  : row.highlight === 'protocol'
                                  ? 'receipt-val-blue'
                                  : undefined
                              }
                              style={
                                row.highlight === 'person'
                                  ? { color: '#c00000', fontWeight: 700 }
                                  : row.highlight === 'protocol'
                                  ? { color: '#0044cc', fontWeight: 700, letterSpacing: '0.02em' }
                                  : row.highlight === 'bold'
                                  ? { fontWeight: 700 }
                                  : undefined
                              }
                            >
                              {row.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Secção II — Instruções de Acompanhamento e Validade */}
                    <h2 className="receipt-sec-heading">
                      II. Instruções de Acompanhamento e Levantamento
                    </h2>

                    <div className="a4-body-copy" style={{ marginTop: '6pt' }}>
                      <p>
                        O presente documento constitui comprovativo oficial de submissão e faz fé
                        perante os serviços administrativos e escolares do Município do Quêssua. O
                        requerente poderá acompanhar a evolução do tratamento do seu pedido a
                        qualquer momento, acedendo ao separador <strong>«Meus pedidos»</strong> e
                        indicando o código{' '}
                        <strong className="receipt-val-blue" style={{ color: '#0044cc' }}>
                          {req.protocol}
                        </strong>
                        , devendo apresentar este comprovativo (em formato PDF ou impresso),
                        acompanhado do respectivo documento de identificação, no acto de levantamento
                        do expediente solicitado.
                      </p>
                    </div>
                  </div>

                  {/* Rodapé Oficial — Data por Extenso */}
                  <footer style={{ marginTop: '24pt', textAlign: 'center', color: '#000000' }}>
                    <p
                      style={{
                        fontSize: '10pt',
                        fontWeight: 700,
                        margin: '0',
                        textTransform: 'uppercase',
                      }}
                    >
                      DIRECÇÃO MUNICIPAL DA EDUCAÇÃO DO QUÊSSUA, AOS{' '}
                      {formatAngolanDateExtenso(createdIso).toUpperCase()}.
                    </p>
                  </footer>
                </article>
              </div>
            </section>
          );
        })()}
      </main>

      {/* =====================================================================
          MODAL DIALOG: NOVO PEDIDO / EDITAR RASCUNHO
          ===================================================================== */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#111c19]/45 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalTitle"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-[780px] bg-white border border-[#dce4df] rounded-[16px] shadow-[0_24px_60px_rgba(17,28,25,0.18)] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleSubmitOfficial} noValidate>
              {/* Modal Head */}
              <div className="flex items-start justify-between gap-4 px-[22px] pt-5 pb-3.5 border-b border-[#dce4df]">
                <div>
                  <p className="m-0 mb-1 text-xs font-extrabold uppercase tracking-[0.08em] text-[#176b5b]">
                    {editingSubmittedRequest
                      ? `Alterar Pedido Submetido · ${editingSubmittedRequest.protocol}`
                      : editingDraftId
                      ? 'Editar rascunho'
                      : 'Ficha Oficial de Cadastro SIGRE'}
                  </p>
                  <h2 id="modalTitle" className="m-0 text-xl font-extrabold text-[#1c2927]">
                    {activeService.title}
                  </h2>
                  <p className="m-0 mt-1.5 text-sm text-[#64736f]">
                    Destino: {activeService.destination}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Fechar janela"
                  className="w-9 h-9 rounded-lg grid place-items-center text-[#64736f] hover:bg-[#edf2ef] hover:text-[#1c2927] cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-[22px] py-5 max-h-[72vh] overflow-y-auto space-y-3.5">
                {formError && (
                  <div
                    role="alert"
                    className="p-3 rounded-[10px] border border-[#f2b9b5] bg-[#fff2f1] text-[#982c27] text-sm font-semibold"
                  >
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Common Identification & Contact Fields */}
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label htmlFor="field-requester" className="text-sm font-bold text-[#1c2927]">
                      {activeService.type === 'GUIA_COLOCACAO'
                        ? 'Nome completo do professor *'
                        : activeService.category === 'funcionarios'
                        ? 'Nome completo do funcionário *'
                        : 'Nome completo *'}
                    </label>
                    <input
                      id="field-requester"
                      type="text"
                      required
                      value={requester}
                      onChange={(e) => setRequester(e.target.value)}
                      placeholder="Ex.: Paulino Bango"
                      className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                    />
                  </div>

                  {activeService.category === 'funcionarios' && (
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label
                        htmlFor="field-tratamento"
                        className="text-sm font-bold text-[#1c2927]"
                      >
                        Género / Tratamento oficial *
                      </label>
                      <select
                        id="field-tratamento"
                        value={tratamento}
                        onChange={(e) =>
                          setTratamento(e.target.value as 'Senhor' | 'Senhora')
                        }
                        className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                      >
                        <option value="Senhor">Masculino — o Senhor</option>
                        <option value="Senhora">Feminino — a Senhora</option>
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="field-phone" className="text-sm font-bold text-[#1c2927]">
                      Contacto telefónico (WhatsApp) *
                    </label>
                    <input
                      id="field-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9XX XXX XXX"
                      className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="field-email" className="text-sm font-bold text-[#1c2927]">
                      E-mail (opcional)
                    </label>
                    <input
                      id="field-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@dominio.ao"
                      className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                    />
                  </div>

                  {/* ===========================================================
                      1. DECLARAÇÃO DE EFECTIVIDADE & 2. DECLARAÇÃO DE SERVIÇO
                      (Exact parity with DeclaracaoEfectividadePage & DeclaracaoServicoSection)
                      =========================================================== */}
                  {(activeService.type === 'DECLARACAO_EFECTIVIDADE' ||
                    activeService.type === 'DECLARACAO_SERVICO') && (
                    <>
                      <div className="sm:col-span-2 pt-2 pb-1 border-b border-[#dce4df]">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#176b5b]">
                          1. Filiação e Naturalidade
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="field-pai" className="text-sm font-bold text-[#1c2927]">
                          Nome do pai {activeService.type === 'DECLARACAO_EFECTIVIDADE' ? '*' : ''}
                        </label>
                        <input
                          id="field-pai"
                          type="text"
                          required={activeService.type === 'DECLARACAO_EFECTIVIDADE'}
                          value={pai}
                          onChange={(e) => setPai(e.target.value)}
                          placeholder="Ex.: António Bango"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="field-mae" className="text-sm font-bold text-[#1c2927]">
                          Nome da mãe *
                        </label>
                        <input
                          id="field-mae"
                          type="text"
                          required
                          value={mae}
                          onChange={(e) => setMae(e.target.value)}
                          placeholder="Ex.: Isabel Francisco"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-nascimento"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Data de nascimento *
                        </label>
                        <input
                          id="field-nascimento"
                          type="date"
                          required
                          value={nascimento}
                          onChange={(e) => setNascimento(e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-naturalidade"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Naturalidade *
                        </label>
                        <input
                          id="field-naturalidade"
                          type="text"
                          required
                          value={naturalidade}
                          onChange={(e) => setNaturalidade(e.target.value)}
                          placeholder="Ex.: Malanje / Quêssua"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label
                          htmlFor="field-provNat"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Província de naturalidade *
                        </label>
                        <select
                          id="field-provNat"
                          value={provNat}
                          onChange={(e) => setProvNat(e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        >
                          {ANGOLA_PROVINCIAS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2 pt-2 pb-1 border-b border-[#dce4df]">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#176b5b]">
                          2. Bilhete de Identidade e Enquadramento Profissional
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-employee-bi"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Bilhete de Identidade n.º *
                        </label>
                        <input
                          id="field-employee-bi"
                          type="text"
                          required
                          value={employeeBi}
                          onChange={(e) => setEmployeeBi(e.target.value.toUpperCase())}
                          placeholder="Ex.: 005417082ME010"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-bi-emissao"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Data de emissão do B.I. *
                        </label>
                        <input
                          id="field-bi-emissao"
                          type="date"
                          required
                          value={biEmissao}
                          onChange={(e) => setBiEmissao(e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-employee-agente"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Número de Agente *
                        </label>
                        <input
                          id="field-employee-agente"
                          type="text"
                          required
                          value={employeeAgente}
                          onChange={(e) => setEmployeeAgente(e.target.value)}
                          placeholder="Ex.: 54170829"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-funcao"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          {activeService.type === 'DECLARACAO_SERVICO'
                            ? 'Profissão / Função *'
                            : 'Funções exercidas *'}
                        </label>
                        <input
                          id="field-funcao"
                          type="text"
                          required
                          value={funcao}
                          onChange={(e) => setFuncao(e.target.value)}
                          placeholder={
                            activeService.type === 'DECLARACAO_SERVICO'
                              ? 'Ex.: Professor do Ensino Primário'
                              : 'Ex.: Docente'
                          }
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-employee-category"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Categoria profissional *
                        </label>
                        <input
                          id="field-employee-category"
                          type="text"
                          required
                          value={employeeCategory}
                          onChange={(e) => setEmployeeCategory(e.target.value)}
                          placeholder={
                            activeService.type === 'DECLARACAO_SERVICO'
                              ? 'Ex.: P.E.P.E.S do 11º'
                              : 'Ex.: P.E.P.E.S.'
                          }
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="field-grau" className="text-sm font-bold text-[#1c2927]">
                          Grau *
                        </label>
                        <input
                          id="field-grau"
                          type="text"
                          required
                          value={grau}
                          onChange={(e) => setGrau(e.target.value)}
                          placeholder="Ex.: 11.º Grau"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-sector"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Sector
                        </label>
                        <input
                          id="field-sector"
                          type="text"
                          value={sector}
                          onChange={(e) => setSector(e.target.value)}
                          placeholder="Educação"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-municipio"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Município de colocação *
                        </label>
                        <input
                          id="field-municipio"
                          type="text"
                          required
                          value={municipio}
                          onChange={(e) => setMunicipio(e.target.value)}
                          placeholder="Quêssua"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label
                          htmlFor="field-workplace"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Escola ou Complexo Escolar de colocação *
                        </label>
                        <input
                          id="field-workplace"
                          list="quessua-schools-datalist"
                          type="text"
                          required
                          value={workplace}
                          onChange={(e) => setWorkplace(e.target.value)}
                          placeholder="Ex.: Escola Primária n.º 166 – Comuna Sede do Quêssua"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      {/* Secção Exclusiva de Declaração de Serviço: Conta Bancária e Salário */}
                      {activeService.type === 'DECLARACAO_SERVICO' && (
                        <>
                          <div className="sm:col-span-2 pt-2 pb-1 border-b border-[#dce4df]">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-[#176b5b]">
                              3. Conta Bancária e Salário Líquido
                            </span>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label
                              htmlFor="field-banco"
                              className="text-sm font-bold text-[#1c2927]"
                            >
                              Banco *
                            </label>
                            <select
                              id="field-banco"
                              value={banco}
                              onChange={(e) => setBanco(e.target.value)}
                              className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                            >
                              {ANGOLA_BANCOS_SERVICO.map((b) => (
                                <option key={b} value={b}>
                                  {b}
                                </option>
                              ))}
                            </select>
                          </div>

                          {banco === 'Outro' && (
                            <div className="flex flex-col gap-1.5">
                              <label
                                htmlFor="field-banco-outro"
                                className="text-sm font-bold text-[#1c2927]"
                              >
                                Nome do banco (se escolheu Outro) *
                              </label>
                              <input
                                id="field-banco-outro"
                                type="text"
                                required
                                value={bancoOutro}
                                onChange={(e) => setBancoOutro(e.target.value)}
                                placeholder="Ex.: Banco Yetu"
                                className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                              />
                            </div>
                          )}

                          <div
                            className={`flex flex-col gap-1.5 ${
                              banco === 'Outro' ? 'sm:col-span-2' : ''
                            }`}
                          >
                            <label
                              htmlFor="field-conta"
                              className="text-sm font-bold text-[#1c2927]"
                            >
                              Número de conta bancária *
                            </label>
                            <input
                              id="field-conta"
                              type="text"
                              required
                              value={conta}
                              onChange={(e) => setConta(e.target.value)}
                              placeholder="Ex.: 14718193110001"
                              className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                            />
                          </div>

                          <div className="sm:col-span-2 flex flex-col gap-1.5">
                            <label
                              htmlFor="field-salario"
                              className="text-sm font-bold text-[#1c2927]"
                            >
                              Salário líquido mensal (Kz) *
                            </label>
                            <input
                              id="field-salario"
                              type="text"
                              required
                              value={salario}
                              onChange={(e) => setSalario(e.target.value)}
                              placeholder="Ex.: 234766,50"
                              className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                            />
                            {parseKz(salario) > 0 && (
                              <span className="text-xs text-[#115348] font-medium">
                                Valor por extenso: <strong>{fmtKz(parseKz(salario))} Kz</strong> (
                                {extensoKz(parseKz(salario))})
                              </span>
                            )}
                          </div>
                        </>
                      )}

                      <div className="sm:col-span-2 pt-2 pb-1 border-b border-[#dce4df]">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#176b5b]">
                          {activeService.type === 'DECLARACAO_SERVICO'
                            ? '4. Finalidade e Dados da Emissão'
                            : '3. Finalidade da Declaração e Emissão'}
                        </span>
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label
                          htmlFor="field-purpose"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Finalidade da declaração *
                        </label>
                        <textarea
                          id="field-purpose"
                          rows={2}
                          required
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          placeholder={
                            activeService.type === 'DECLARACAO_SERVICO'
                              ? 'Ex.: à regularização da conta bancária'
                              : 'Ex.: Instrução do processo de candidatura ao Concurso Público de Acesso e de Ingresso Interno no Sector da Educação'
                          }
                          className="w-full px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b] resize-y"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-local-emissao"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Local de emissão
                        </label>
                        <input
                          id="field-local-emissao"
                          type="text"
                          value={local}
                          onChange={(e) => setLocal(e.target.value)}
                          placeholder="Quêssua"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-data-emissao"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Data de emissão
                        </label>
                        <input
                          id="field-data-emissao"
                          type="date"
                          value={dataEmissao}
                          onChange={(e) => setDataEmissao(e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>
                    </>
                  )}

                  {/* ===========================================================
                      3. GUIA DE FÉRIAS (Exact parity with GuiaFeriasSection.tsx)
                      =========================================================== */}
                  {activeService.type === 'GUIA_FERIAS' && (
                    <>
                      <div className="sm:col-span-2 pt-2 pb-1 border-b border-[#dce4df]">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#176b5b]">
                          1. Dados Funcionais e Escola de Colocação
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-ferias-agente"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Número de Agente *
                        </label>
                        <input
                          id="field-ferias-agente"
                          type="text"
                          required
                          value={employeeAgente}
                          onChange={(e) => setEmployeeAgente(e.target.value)}
                          placeholder="Ex.: 08833658"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-ferias-cat"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Categoria profissional *
                        </label>
                        <input
                          id="field-ferias-cat"
                          type="text"
                          required
                          value={employeeCategory}
                          onChange={(e) => setEmployeeCategory(e.target.value)}
                          placeholder="Ex.: P.E.P.E.S."
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-ferias-grau"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Grau *
                        </label>
                        <select
                          id="field-ferias-grau"
                          value={grau}
                          onChange={(e) => setGrau(e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        >
                          {[
                            '13º Grau',
                            '12º Grau',
                            '11º Grau',
                            '10º Grau',
                            '9º Grau',
                            '8º Grau',
                            '7º Grau',
                            '6º Grau',
                          ].map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-ferias-funcao"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Função exercida *
                        </label>
                        <input
                          id="field-ferias-funcao"
                          type="text"
                          required
                          value={funcao}
                          onChange={(e) => setFuncao(e.target.value)}
                          placeholder="Ex.: Docente / Director de Escola"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-ferias-tipoesc"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Tipo de escola *
                        </label>
                        <select
                          id="field-ferias-tipoesc"
                          value={tipoesc}
                          onChange={(e) => setTipoesc(e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        >
                          <option value="Escola Primária">Escola Primária</option>
                          <option value="Complexo Escolar">Complexo Escolar</option>
                          <option value="Colégio">Colégio</option>
                          <option value="Liceu">Liceu</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-ferias-nesc"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Nº da escola *
                        </label>
                        <input
                          id="field-ferias-nesc"
                          type="text"
                          required
                          value={nesc}
                          onChange={(e) => setNesc(e.target.value)}
                          placeholder="Ex.: 166"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label
                          htmlFor="field-ferias-local-escola"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Localidade da escola *
                        </label>
                        <input
                          id="field-ferias-local-escola"
                          type="text"
                          required
                          value={localEscola}
                          onChange={(e) => setLocalEscola(e.target.value)}
                          placeholder="Ex.: Quêssua"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="sm:col-span-2 pt-2 pb-1 border-b border-[#dce4df]">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#176b5b]">
                          2. Período de Férias / Licença Disciplinar
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-ferias-tipolic"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Tipo de licença *
                        </label>
                        <select
                          id="field-ferias-tipolic"
                          value={tipolic}
                          onChange={(e) => setTipolic(e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        >
                          <option value="Licença Disciplinar (férias)">
                            Licença Disciplinar (férias)
                          </option>
                          <option value="Licença Registada">Licença Registada</option>
                          <option value="Licença de Parto">Licença de Parto</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-ferias-ano"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Ano económico referente *
                        </label>
                        <input
                          id="field-ferias-ano"
                          type="number"
                          required
                          value={anoFerias}
                          onChange={(e) => setAnoFerias(e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-ferias-dias"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Número de dias úteis (1 a 90) *
                        </label>
                        <input
                          id="field-ferias-dias"
                          type="number"
                          min={1}
                          max={90}
                          required
                          value={diasFerias}
                          onChange={(e) => {
                            const nextDias = e.target.value;
                            setDiasFerias(nextDias);
                            const parsed = parseInt(nextDias, 10);
                            if (iniFerias && parsed >= 1) {
                              setFimFerias(calculateFimDate(iniFerias, parsed));
                            }
                          }}
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                        <span className="text-[11px] text-[#556966]">
                          Sábados e domingos não contam na duração.
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-ferias-ini"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Data de início *
                        </label>
                        <input
                          id="field-ferias-ini"
                          type="date"
                          required
                          value={iniFerias}
                          onChange={(e) => {
                            const nextIni = e.target.value;
                            setIniFerias(nextIni);
                            const parsed = parseInt(diasFerias, 10);
                            if (nextIni && parsed >= 1) {
                              setFimFerias(calculateFimDate(nextIni, parsed));
                            }
                          }}
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-ferias-fim"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Data de término / regresso *
                        </label>
                        <input
                          id="field-ferias-fim"
                          type="date"
                          required
                          value={fimFerias}
                          onChange={(e) => setFimFerias(e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                        {(() => {
                          const bd = getGuiaFeriasDateBreakdown(iniFerias, parseInt(diasFerias, 10));
                          if (!bd) return null;
                          return (
                            <span className="text-[11px] text-[#176b5b] font-medium">
                              {bd.businessDays} dias úteis + {bd.weekendDaysExcluded} sábados/domingos excluídos.
                            </span>
                          );
                        })()}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-ferias-data-emissao"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Data de emissão
                        </label>
                        <input
                          id="field-ferias-data-emissao"
                          type="date"
                          value={dataEmissao}
                          onChange={(e) => setDataEmissao(e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>
                    </>
                  )}

                  {/* ===========================================================
                      4. GUIA DE COLOCAÇÃO (Exact parity with GuiaColocacaoSection.tsx)
                      =========================================================== */}
                  {activeService.type === 'GUIA_COLOCACAO' && (
                    <>
                      <div className="sm:col-span-2 pt-2 pb-1 border-b border-[#dce4df]">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#176b5b]">
                          1. Dados do Docente e Escola de Colocação
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-coloc-agente"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Número de Agente *
                        </label>
                        <input
                          id="field-coloc-agente"
                          type="text"
                          required
                          value={employeeAgente}
                          onChange={(e) => setEmployeeAgente(e.target.value)}
                          placeholder="Ex.: 9289000"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-coloc-cat"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Categoria profissional *
                        </label>
                        <input
                          id="field-coloc-cat"
                          type="text"
                          required
                          value={employeeCategory}
                          onChange={(e) => setEmployeeCategory(e.target.value)}
                          placeholder="Ex.: P.E.P.E.S."
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-coloc-grau"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Grau *
                        </label>
                        <input
                          id="field-coloc-grau"
                          type="text"
                          required
                          value={grau}
                          onChange={(e) => setGrau(e.target.value)}
                          placeholder="Ex.: 13º Grau"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-coloc-data-emissao"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Data de emissão
                        </label>
                        <input
                          id="field-coloc-data-emissao"
                          type="date"
                          value={dataEmissao}
                          onChange={(e) => setDataEmissao(e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label
                          htmlFor="field-coloc-escola"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Escola de colocação / destino *
                        </label>
                        <input
                          id="field-coloc-escola"
                          list="quessua-schools-datalist"
                          type="text"
                          required
                          value={workplace}
                          onChange={(e) => setWorkplace(e.target.value)}
                          placeholder="Ex.: Escola Primária n.º 166 – Comuna Sede do Quêssua"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>
                    </>
                  )}

                  {/* Escolares Specific Fields */}
                  {activeService.category === 'escolares' && (
                    <>
                      <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label htmlFor="field-student" className="text-sm font-bold text-[#1c2927]">
                          Nome do aluno *
                        </label>
                        <input
                          id="field-student"
                          type="text"
                          required
                          value={student}
                          onChange={(e) => setStudent(e.target.value)}
                          placeholder="Nome completo do aluno"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label htmlFor="field-school" className="text-sm font-bold text-[#1c2927]">
                          {activeService.type === 'GUIA_TRANSFERENCIA' ? 'Escola actual *' : 'Escola *'}
                        </label>
                        <input
                          id="field-school"
                          list="quessua-schools-datalist"
                          type="text"
                          required
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
                          placeholder={
                            activeService.type === 'GUIA_TRANSFERENCIA'
                              ? 'Escola de origem'
                              : 'Escola onde o aluno está matriculado'
                          }
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label htmlFor="field-student-bi" className="text-sm font-bold text-[#1c2927]">
                          N.º de Matrícula ou B.I. do Aluno (opcional)
                        </label>
                        <input
                          id="field-student-bi"
                          type="text"
                          value={studentBiOrProcesso}
                          onChange={(e) => setStudentBiOrProcesso(e.target.value)}
                          placeholder="Ex.: MAT-2026-1001 ou n.º do Bilhete"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      {modalEnrollmentCheck && (
                        <div
                          className={`sm:col-span-2 p-3 rounded-[10px] border text-xs flex items-start gap-2.5 ${
                            modalEnrollmentCheck.isEnrolled
                              ? 'bg-[#e8f4ef] border-[#b7ddd1] text-[#115348]'
                              : 'bg-[#fff2f1] border-[#f2b9b5] text-[#982c27]'
                          }`}
                        >
                          {modalEnrollmentCheck.isEnrolled ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#176b5b]" />
                          ) : (
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#c8443e]" />
                          )}
                          <div>
                            <div className="font-bold">
                              {modalEnrollmentCheck.isEnrolled
                                ? `Matrícula confirmada nesta escola · ${modalEnrollmentCheck.classe} (${modalEnrollmentCheck.turma} · ${modalEnrollmentCheck.turno})`
                                : 'Aluno não consta como matriculado nesta escola'}
                            </div>
                            <p className="m-0 mt-0.5 text-[11px] opacity-90">
                              {modalEnrollmentCheck.isEnrolled
                                ? `Aluno: ${modalEnrollmentCheck.matchedName} · N.º Matrícula: ${modalEnrollmentCheck.codigoMatricula}`
                                : modalEnrollmentCheck.reason}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="field-classe" className="text-sm font-bold text-[#1c2927]">
                          Classe
                        </label>
                        <select
                          id="field-classe"
                          value={studentClasse}
                          onChange={(e) => setStudentClasse(e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        >
                          {[
                            '1ª Classe',
                            '2ª Classe',
                            '3ª Classe',
                            '4ª Classe',
                            '5ª Classe',
                            '6ª Classe',
                            '7ª Classe',
                            '8ª Classe',
                            '9ª Classe',
                            '10ª Classe',
                            '11ª Classe',
                            '12ª Classe',
                          ].map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="field-turma" className="text-sm font-bold text-[#1c2927]">
                          Turma
                        </label>
                        <input
                          id="field-turma"
                          type="text"
                          value={studentTurma}
                          onChange={(e) => setStudentTurma(e.target.value)}
                          placeholder="Ex.: Turma A"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      {activeService.type === 'BOLETIM_NOTAS' && (
                        <div className="sm:col-span-2 flex flex-col gap-1.5">
                          <label htmlFor="field-term" className="text-sm font-bold text-[#1c2927]">
                            Trimestre
                          </label>
                          <select
                            id="field-term"
                            required
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                          >
                            <option value="1.º Trimestre">1.º Trimestre</option>
                            <option value="2.º Trimestre">2.º Trimestre</option>
                            <option value="3.º Trimestre">3.º Trimestre</option>
                            <option value="Pauta Final (Anual)">Pauta Final (Anual)</option>
                          </select>
                        </div>
                      )}

                      {activeService.type === 'DECLARACAO_MATRICULA' && (
                        <div className="sm:col-span-2 flex flex-col gap-1.5">
                          <label htmlFor="field-year" className="text-sm font-bold text-[#1c2927]">
                            Ano lectivo
                          </label>
                          <input
                            id="field-year"
                            type="text"
                            required
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            placeholder="Ex.: 2026"
                            className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                          />
                        </div>
                      )}

                      {activeService.type === 'GUIA_TRANSFERENCIA' && (
                        <div className="sm:col-span-2 flex flex-col gap-1.5">
                          <label
                            htmlFor="field-destination-school"
                            className="text-sm font-bold text-[#1c2927]"
                          >
                            Escola pretendida
                          </label>
                          <input
                            id="field-destination-school"
                            list="quessua-schools-datalist"
                            type="text"
                            required
                            value={destinationSchool}
                            onChange={(e) => setDestinationSchool(e.target.value)}
                            placeholder="Escola de destino"
                            className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Notes */}
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label htmlFor="field-notes" className="text-sm font-bold text-[#1c2927]">
                      Observações (opcional)
                    </label>
                    <textarea
                      id="field-notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Informação adicional relevante para o pedido"
                      className="w-full px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b] resize-y"
                    />
                  </div>
                </div>

                <datalist id="quessua-schools-datalist">
                  {schools.map((sc) => (
                    <option key={sc.id} value={sc.name} />
                  ))}
                </datalist>

                <p className="m-0 text-xs text-[#64736f]">
                  Pode guardar um rascunho neste dispositivo para revisão ou submeter directamente o pedido oficial para a Direcção.
                </p>
              </div>

              {/* Modal Foot */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 px-[22px] py-4 border-t border-[#dce4df] bg-[#fbfcfb]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="min-h-[42px] px-4 py-2.5 rounded-[10px] border border-[#dce4df] bg-white hover:border-[#b9c8c0] text-sm font-bold text-[#1c2927] cursor-pointer"
                >
                  Cancelar
                </button>

                {!editingSubmittedRequest && (
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="min-h-[42px] px-4 py-2.5 rounded-[10px] border border-[#b7ddd1] bg-[#e8f4ef] hover:bg-[#d8ece4] text-sm font-bold text-[#115348] cursor-pointer transition-colors"
                  >
                    {editingDraftId ? 'Guardar alterações' : 'Guardar rascunho'}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[42px] px-4 py-2.5 rounded-[10px] bg-[#176b5b] hover:bg-[#115348] text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{editingSubmittedRequest ? 'A guardar...' : 'A enviar...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {editingSubmittedRequest ? 'Guardar alterações no pedido' : 'Enviar pedido'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          TOAST NOTIFICATION
          ===================================================================== */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-5 bottom-5 z-50 max-w-[360px] px-4 py-3 rounded-xl bg-[#1c2927] text-white text-sm font-bold shadow-[0_14px_34px_rgba(17,28,25,0.22)] animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};
