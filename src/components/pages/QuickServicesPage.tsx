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
} from 'lucide-react';
import type { QuickServiceType, QuickServiceRequest } from '../../types';
import {
  submitQuickServiceRequest,
  fetchQuickRequests,
} from '../../utils/quickServicesStorage';

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

  // Sync status of submitted requests with backend/Firestore
  useEffect(() => {
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
    return () => {
      mounted = false;
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
  const [confirmDeleteDraftId, setConfirmDeleteDraftId] = useState<string | null>(null);

  // Modal Form Fields
  const currentYear = String(new Date().getFullYear());
  const [requester, setRequester] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [workplace, setWorkplace] = useState(schools[0]?.name || '');
  const [employeeBi, setEmployeeBi] = useState('');
  const [employeeAgente, setEmployeeAgente] = useState('');
  const [employeeCategory, setEmployeeCategory] = useState('Professor do Ensino Primário');
  const [referenceMonthYear, setReferenceMonthYear] = useState('Outubro / 2026');
  const [purpose, setPurpose] = useState('Fins Bancários / Salariais');

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
    setFormError(null);

    if (draftToEdit) {
      setEditingDraftId(draftToEdit.id);
      setRequester(draftToEdit.values.requester || '');
      setPhone(draftToEdit.values.phone || '');
      setEmail(draftToEdit.values.email || '');
      setWorkplace(draftToEdit.values.workplace || schools[0]?.name || '');
      setEmployeeBi(draftToEdit.values.employeeBi || '');
      setEmployeeAgente(draftToEdit.values.employeeAgente || '');
      setEmployeeCategory(draftToEdit.values.employeeCategory || 'Professor do Ensino Primário');
      setReferenceMonthYear(draftToEdit.values.referenceMonthYear || 'Outubro / 2026');
      setPurpose(draftToEdit.values.purpose || 'Fins Bancários / Salariais');
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
    }

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDraftId(null);
    setFormError(null);
  };

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
      return 'Indique o nome completo do requerente.';
    }
    if (!isValidPhone(values.phone)) {
      return 'Indique um contacto telefónico válido (entre 7 e 15 dígitos).';
    }
    if (activeService.category === 'funcionarios') {
      if (!values.workplace) {
        return 'Indique a escola ou repartição onde exerce funções.';
      }
    } else {
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
      const targetSchoolName =
        service.category === 'funcionarios' ? values.workplace || '' : values.school || '';
      const matchedSchool = schools.find(
        (s) => s.name.trim().toLowerCase() === targetSchoolName.trim().toLowerCase()
      );

      let title = service.title;
      if (service.type === 'DECLARACAO_EFECTIVIDADE') {
        title = `Pedido de Declaração de Efectividade — ${values.requester}`;
      } else if (service.type === 'DECLARACAO_SERVICO') {
        title = `Pedido de Declaração de Serviço — ${values.requester}`;
      } else if (service.type === 'BOLETIM_NOTAS') {
        title = `Pedido de Boletim (${values.term || '1.º Trimestre'}) — ${values.student}`;
      } else if (service.type === 'DECLARACAO_MATRICULA') {
        title = `Pedido de Declaração de Matrícula (${values.year || currentYear}) — ${values.student}`;
      } else if (service.type === 'GUIA_TRANSFERENCIA') {
        title = `Pedido de Transferência Escolar — ${values.student}`;
      }

      const res = await submitQuickServiceRequest({
        serviceType: service.type,
        targetRole: service.targetRole,
        targetSchoolId: matchedSchool?.id || 'escola-quessua-1',
        targetSchoolName: targetSchoolName || schools[0]?.name || 'Direcção Municipal da Educação',
        requesterName: values.requester,
        requesterRoleTitle:
          service.category === 'funcionarios'
            ? 'Funcionário / Docente'
            : 'Encarregado(a) de Educação / Aluno',
        requesterPhone: values.phone,
        requesterEmail: values.email || undefined,
        title,
        details: {
          employeeName: service.category === 'funcionarios' ? values.requester : undefined,
          employeeBi: service.category === 'funcionarios' ? values.employeeBi : undefined,
          employeeAgente: service.category === 'funcionarios' ? values.employeeAgente : undefined,
          employeeCategory:
            service.category === 'funcionarios' ? values.employeeCategory : undefined,
          employeeSchoolOrDepartment:
            service.category === 'funcionarios' ? values.workplace : undefined,
          referenceMonthYear:
            service.category === 'funcionarios' ? values.referenceMonthYear : undefined,
          studentName: service.category === 'escolares' ? values.student : undefined,
          studentBiOrProcesso:
            service.category === 'escolares' ? values.studentBiOrProcesso : undefined,
          studentClasse: service.category === 'escolares' ? values.studentClasse : undefined,
          studentTurma: service.category === 'escolares' ? values.studentTurma : undefined,
          studentPeriodo: service.category === 'escolares' ? values.studentPeriodo : undefined,
          trimestre: service.type === 'BOLETIM_NOTAS' ? values.term : undefined,
          academicYear: values.year || currentYear,
          destinationSchool:
            service.type === 'GUIA_TRANSFERENCIA' ? values.destinationSchool : undefined,
          purpose: values.purpose || 'Efeito Oficial',
          notes: values.notes || undefined,
        },
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

  const handleCopyProtocol = (protocol: string) => {
    navigator.clipboard.writeText(protocol);
    setCopiedProtocol(true);
    setTimeout(() => setCopiedProtocol(false), 2500);
  };

  const handlePrintReceipt = () => {
    window.print();
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
      {/* Print-only CSS rules */}
      <style>{`
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
            width: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
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

                    const statusLabel = isConcluido
                      ? 'Concluído / Emitido'
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
                        : isRejeitado || isSemVaga
                        ? 'bg-[#fff2f1] text-[#982c27]'
                        : 'bg-[#fff7e2] text-[#8d5b08]';

                    return (
                      <article
                        key={req.id}
                        className="p-[18px] bg-white border border-[#dce4df] rounded-[14px] shadow-[0_10px_28px_rgba(20,36,33,0.06)]"
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
                              <Printer className="w-3.5 h-3.5 text-[#64736f]" />
                              <span>Comprovativo</span>
                            </button>

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
            VIEW 3: COMPROVATIVO OFICIAL (IMPRESSÃO A4 & PROTOCOLO)
            =================================================================== */}
        {activeTab === 'receipt' && submittedRequest && (
          <section className="space-y-6">
            <div
              id="quick-service-official-receipt"
              className="bg-white rounded-[16px] border border-[#dce4df] p-6 sm:p-9 shadow-[0_10px_28px_rgba(20,36,33,0.06)] space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#dce4df]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#e8f4ef] flex items-center justify-center text-[#176b5b] shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="m-0 text-xs font-extrabold uppercase tracking-[0.08em] text-[#176b5b]">
                      Pedido oficial registado
                    </p>
                    <h2 className="m-0 text-xl font-extrabold text-[#1c2927]">
                      Comprovativo de Pedido
                    </h2>
                    <p className="m-0 text-xs text-[#64736f]">
                      República de Angola · Direcção Municipal da Educação do Quêssua
                    </p>
                  </div>
                </div>

                <div className="no-print flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="min-h-[40px] px-4 py-2 rounded-[10px] border border-[#dce4df] bg-white hover:border-[#b9c8c0] text-[#1c2927] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-[#64736f]" />
                    <span>Imprimir comprovativo (A4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('requests')}
                    className="min-h-[40px] px-4 py-2 rounded-[10px] bg-[#176b5b] hover:bg-[#115348] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Ver em Meus pedidos</span>
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-[14px] bg-[#f5f7f5] border border-[#dce4df] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#64736f]">
                    Código de protocolo
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1c2927] mt-1 tabular-nums">
                    {submittedRequest.protocol}
                  </div>
                  <p className="m-0 mt-1 text-xs text-[#64736f]">
                    Guarde este código para acompanhamento e levantamento do documento.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyProtocol(submittedRequest.protocol)}
                  className="no-print min-h-[40px] px-4 py-2 rounded-[10px] bg-white border border-[#dce4df] hover:border-[#b9c8c0] text-xs font-bold text-[#1c2927] inline-flex items-center gap-1.5 cursor-pointer"
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
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 m-0">
                <div className="p-4 rounded-[12px] bg-[#fbfcfb] border border-[#dce4df]">
                  <dt className="text-xs font-bold text-[#64736f]">Serviço</dt>
                  <dd className="m-0 mt-1 text-sm font-bold text-[#1c2927]">
                    {submittedRequest.title}
                  </dd>
                </div>
                <div className="p-4 rounded-[12px] bg-[#fbfcfb] border border-[#dce4df]">
                  <dt className="text-xs font-bold text-[#64736f]">Destino</dt>
                  <dd className="m-0 mt-1 text-sm font-bold text-[#1c2927]">
                    {submittedRequest.targetRole === 'ADMIN'
                      ? 'Direcção Municipal da Educação'
                      : submittedRequest.targetSchoolName || 'Secretaria da escola'}
                  </dd>
                </div>
                <div className="p-4 rounded-[12px] bg-[#fbfcfb] border border-[#dce4df]">
                  <dt className="text-xs font-bold text-[#64736f]">Requerente</dt>
                  <dd className="m-0 mt-1 text-sm font-bold text-[#1c2927]">
                    {submittedRequest.requesterName}
                  </dd>
                  <dd className="m-0 mt-0.5 text-xs font-mono text-[#64736f]">
                    {submittedRequest.requesterPhone}
                  </dd>
                </div>
              </dl>

              <div className="no-print pt-3 border-t border-[#dce4df] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="min-h-[40px] px-4 py-2 rounded-[10px] border border-[#dce4df] bg-white hover:border-[#b9c8c0] text-xs font-bold text-[#1c2927] cursor-pointer"
                >
                  ← Voltar ao catálogo
                </button>
              </div>
            </div>
          </section>
        )}
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
          <div className="w-full max-w-[600px] bg-white border border-[#dce4df] rounded-[16px] shadow-[0_24px_60px_rgba(17,28,25,0.18)] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleSubmitOfficial} noValidate>
              {/* Modal Head */}
              <div className="flex items-start justify-between gap-4 px-[22px] pt-5 pb-3.5 border-b border-[#dce4df]">
                <div>
                  <p className="m-0 mb-1 text-xs font-extrabold uppercase tracking-[0.08em] text-[#176b5b]">
                    {editingDraftId ? 'Editar rascunho' : 'Novo pedido'}
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
              <div className="px-[22px] py-5 max-h-[70vh] overflow-y-auto space-y-3.5">
                {formError && (
                  <div
                    role="alert"
                    className="p-3 rounded-[10px] border border-[#f2b9b5] bg-[#fff2f1] text-[#982c27] text-sm font-semibold"
                  >
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Common Fields */}
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label htmlFor="field-requester" className="text-sm font-bold text-[#1c2927]">
                      Nome completo
                    </label>
                    <input
                      id="field-requester"
                      type="text"
                      required
                      value={requester}
                      onChange={(e) => setRequester(e.target.value)}
                      placeholder="Nome do requerente"
                      className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="field-phone" className="text-sm font-bold text-[#1c2927]">
                      Contacto telefónico
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

                  {/* Funcionários Specific Fields */}
                  {activeService.category === 'funcionarios' && (
                    <>
                      <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label
                          htmlFor="field-workplace"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Escola ou repartição
                        </label>
                        <input
                          id="field-workplace"
                          list="quessua-schools-datalist"
                          type="text"
                          required
                          value={workplace}
                          onChange={(e) => setWorkplace(e.target.value)}
                          placeholder="Onde exerce funções"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-employee-bi"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Nº do BI (opcional)
                        </label>
                        <input
                          id="field-employee-bi"
                          type="text"
                          value={employeeBi}
                          onChange={(e) => setEmployeeBi(e.target.value.toUpperCase())}
                          placeholder="Ex.: 008123456ME041"
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="field-employee-category"
                          className="text-sm font-bold text-[#1c2927]"
                        >
                          Categoria funcional
                        </label>
                        <select
                          id="field-employee-category"
                          value={employeeCategory}
                          onChange={(e) => setEmployeeCategory(e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        >
                          <option value="Professor do Ensino Primário">
                            Professor do Ensino Primário
                          </option>
                          <option value="Professor do Iº Ciclo">Professor do Iº Ciclo</option>
                          <option value="Professor do IIº Ciclo">Professor do IIº Ciclo</option>
                          <option value="Técnico Médio de Educação">
                            Técnico Médio de Educação
                          </option>
                          <option value="Técnico Superior de Educação">
                            Técnico Superior de Educação
                          </option>
                          <option value="Auxiliar Administrativo">Auxiliar Administrativo</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Escolares Specific Fields */}
                  {activeService.category === 'escolares' && (
                    <>
                      <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label htmlFor="field-student" className="text-sm font-bold text-[#1c2927]">
                          Nome do aluno
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
                          {activeService.type === 'GUIA_TRANSFERENCIA' ? 'Escola actual' : 'Escola'}
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
                              : 'Escola onde estuda'
                          }
                          className="w-full min-h-[42px] px-3 py-2.5 rounded-[10px] border border-[#dce4df] bg-[#fbfcfb] text-sm text-[#1c2927] outline-none focus:border-[#176b5b]"
                        />
                      </div>

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

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="min-h-[42px] px-4 py-2.5 rounded-[10px] border border-[#b7ddd1] bg-[#e8f4ef] hover:bg-[#d8ece4] text-sm font-bold text-[#115348] cursor-pointer transition-colors"
                >
                  {editingDraftId ? 'Guardar alterações' : 'Guardar rascunho'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[42px] px-4 py-2.5 rounded-[10px] bg-[#176b5b] hover:bg-[#115348] text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>A enviar...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar pedido</span>
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
