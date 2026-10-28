import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  GraduationCap,
  FileCheck,
  Building2,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Printer,
  ChevronRight,
  School,
  User,
  Phone,
  Mail,
  FileText,
  Send,
  Loader2,
  ArrowLeft,
  Info,
  ShieldCheck,
  Check,
  MessageCircle,
  Plus,
  Landmark,
  Sparkles
} from 'lucide-react';
import type { QuickServiceRequest, QuickServiceType, AdminSchool } from '../../types';
import { submitQuickServiceRequest, fetchQuickRequests } from '../../utils/quickServicesStorage';
import { syncSchoolsFromServer } from '../../utils/schoolStorage';

interface QuickServicesPageProps {
  onNavigateHome: () => void;
  onNavigateToLogin: () => void;
  availableSchools?: AdminSchool[];
  initialServiceType?: QuickServiceType;
  initialPageView?: 'catalog' | 'form' | 'receipt' | 'my-requests';
}

const MY_REQUESTS_STORAGE_KEY = 'sigre_my_submitted_requests';

const QUESSUA_OFFICIAL_SCHOOL_NAMES = [
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

export const QuickServicesPage: React.FC<QuickServicesPageProps> = ({
  onNavigateHome,
  onNavigateToLogin,
  availableSchools: propSchools,
  initialServiceType,
  initialPageView = 'catalog',
}) => {
  // Navigation mode on page: 'catalog' | 'form' | 'receipt' | 'my-requests'
  // When an unauthenticated user opens quick services, it directly opens on the catalog tab
  const [pageView, setPageView] = useState<'catalog' | 'form' | 'receipt' | 'my-requests'>(() => {
    if (initialPageView === 'catalog') return 'catalog';
    if (initialServiceType) return 'form';
    return 'catalog';
  });
  const [selectedService, setSelectedService] = useState<QuickServiceType>(initialServiceType || 'BOLETIM_NOTAS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<QuickServiceRequest | null>(null);
  const [copiedProtocol, setCopiedProtocol] = useState(false);

  // Privacy-first: only requests made by this user/browser
  const [myRequests, setMyRequests] = useState<QuickServiceRequest[]>(() => {
    try {
      const saved = localStorage.getItem(MY_REQUESTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Schools list for selector
  const [schools, setSchools] = useState<AdminSchool[]>(propSchools || []);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');

  // Form Fields
  const [requesterName, setRequesterName] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [requesterRoleTitle, setRequesterRoleTitle] = useState('Encarregado(a) de Educação');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedSchoolName, setSelectedSchoolName] = useState('');
  const [notes, setNotes] = useState('');

  // Boletim & Student Specific
  const [studentName, setStudentName] = useState('');
  const [studentBiOrProcesso, setStudentBiOrProcesso] = useState('');
  const [studentClasse, setStudentClasse] = useState('7ª Classe');
  const [studentTurma, setStudentTurma] = useState('Turma A');
  const [studentPeriodo, setStudentPeriodo] = useState('Manhã');
  const [trimestre, setTrimestre] = useState('1º Trimestre');

  // Declaração Efectividade Specific
  const [employeeName, setEmployeeName] = useState('');
  const [employeeBi, setEmployeeBi] = useState('');
  const [employeeAgente, setEmployeeAgente] = useState('');
  const [employeeSchoolOrDepartment, setEmployeeSchoolOrDepartment] = useState('');
  const [employeeCategory, setEmployeeCategory] = useState('Professor do Ensino Primário');
  const [referenceMonthYear, setReferenceMonthYear] = useState('Fevereiro / 2026');
  const [purpose, setPurpose] = useState('Fins Bancários / Abertura de Conta & Crédito');

  // Transferência / Matrícula Specific
  const [destinationSchool, setDestinationSchool] = useState('');

  // Search by exact protocol query
  const [protocolSearchQuery, setProtocolSearchQuery] = useState('');
  const [isSearchingProtocol, setIsSearchingProtocol] = useState(false);
  const [searchProtocolResult, setSearchProtocolResult] = useState<QuickServiceRequest | null>(null);
  const [protocolSearchError, setProtocolSearchError] = useState<string | null>(null);

  // Form error
  const [formError, setFormError] = useState<string | null>(null);

  // Load schools on mount
  useEffect(() => {
    syncSchoolsFromServer().then((list) => {
      const serverSchools = Array.isArray(list) ? list : [];
      const map = new Map<string, AdminSchool>();

      // Seed official schools
      QUESSUA_OFFICIAL_SCHOOL_NAMES.forEach((name, idx) => {
        map.set(name.toLowerCase().trim(), {
          id: `esc-quessua-${idx + 1}`,
          name,
          location: 'Município de Quêssua, Malanje',
          teachersCount: 0,
          studentsCount: 0,
          directorName: '',
          phone: '',
          email: '',
          foundedYear: '2026',
        });
      });

      // Add/merge any server schools
      serverSchools.forEach((s) => {
        if (s && s.name) {
          map.set(s.name.toLowerCase().trim(), s);
        }
      });

      const mergedList = Array.from(map.values());
      setSchools(mergedList);
      if (!selectedSchoolId && mergedList[0]) {
        setSelectedSchoolId(mergedList[0].id);
        setSelectedSchoolName(mergedList[0].name);
      }
    });
  }, []);

  // Update when initialServiceType or initialPageView changes
  useEffect(() => {
    if (initialPageView === 'catalog') {
      setPageView('catalog');
    } else if (initialServiceType) {
      setSelectedService(initialServiceType);
      setPageView('form');
    } else {
      setPageView('catalog');
    }
  }, [initialServiceType, initialPageView]);

  // Persist myRequests
  const saveMyRequest = (req: QuickServiceRequest) => {
    setMyRequests((prev) => {
      const filtered = prev.filter((r) => r.id !== req.id);
      const next = [req, ...filtered];
      try {
        localStorage.setItem(MY_REQUESTS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const filteredSchools = useMemo(() => {
    if (!schoolSearchQuery.trim()) return schools;
    const q = schoolSearchQuery.toLowerCase();
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.location && s.location.toLowerCase().includes(q)) ||
        (s.directorName && s.directorName.toLowerCase().includes(q))
    );
  }, [schools, schoolSearchQuery]);

  const handleSelectSchool = (school: AdminSchool) => {
    setSelectedSchoolId(school.id);
    setSelectedSchoolName(school.name);
    if (selectedService === 'DECLARACAO_EFECTIVIDADE' && !employeeSchoolOrDepartment) {
      setEmployeeSchoolOrDepartment(school.name);
    }
  };

  // Reset form and transition reliably to a fresh new request (or back to catalog)
  const handleStartNewRequest = (preferredType?: QuickServiceType) => {
    setSubmittedRequest(null);
    setFormError(null);
    setProtocolSearchError(null);
    setSearchProtocolResult(null);
    setStudentName('');
    setStudentBiOrProcesso('');
    setEmployeeName('');
    setEmployeeBi('');
    setEmployeeAgente('');
    setNotes('');
    setDestinationSchool('');
    if (preferredType) {
      setSelectedService(preferredType);
      setPageView('form');
    } else {
      setPageView('catalog');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChooseServiceAndOpenForm = (type: QuickServiceType) => {
    setSelectedService(type);
    setFormError(null);
    setSubmittedRequest(null);

    if (type === 'DECLARACAO_EFECTIVIDADE' || type === 'DECLARACAO_SERVICO') {
      setRequesterRoleTitle('Docente / Funcionário Público');
      if (selectedSchoolName && !employeeSchoolOrDepartment) {
        setEmployeeSchoolOrDepartment(selectedSchoolName);
      }
    } else {
      setRequesterRoleTitle('Encarregado(a) de Educação');
    }

    setPageView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!requesterName.trim()) {
      setFormError('Por favor preencha o seu nome completo.');
      return;
    }
    if (!requesterPhone.trim()) {
      setFormError('Por favor informe um número de telefone ou WhatsApp para contacto.');
      return;
    }

    // Specific validation
    if (selectedService === 'BOLETIM_NOTAS') {
      if (!studentName.trim()) {
        setFormError('Por favor informe o nome completo do estudante.');
        return;
      }
      if (!selectedSchoolName.trim()) {
        setFormError('Por favor selecione a instituição de ensino.');
        return;
      }
    } else if (selectedService === 'DECLARACAO_EFECTIVIDADE' || selectedService === 'DECLARACAO_SERVICO') {
      if (!employeeName.trim() && !requesterName.trim()) {
        setFormError('Por favor informe o nome do funcionário.');
        return;
      }
      if (!employeeBi.trim() && !employeeAgente.trim()) {
        setFormError('Por favor informe o BI ou Nº de Agente.');
        return;
      }
    } else if (selectedService === 'DECLARACAO_MATRICULA') {
      if (!studentName.trim()) {
        setFormError('Por favor informe o nome do estudante.');
        return;
      }
    } else if (selectedService === 'GUIA_TRANSFERENCIA') {
      if (!studentName.trim()) {
        setFormError('Por favor informe o nome do estudante.');
        return;
      }
      if (!destinationSchool.trim()) {
        setFormError('Por favor indique a escola de destino pretendida.');
        return;
      }
    }

    setIsSubmitting(true);

    let title = '';
    let targetRole: 'DIRECTOR' | 'ADMIN' = 'ADMIN';
    let details: QuickServiceRequest['details'] = {};

    if (selectedService === 'BOLETIM_NOTAS') {
      title = `Boletim de Notas - ${studentName} (${trimestre})`;
      targetRole = 'DIRECTOR';
      details = {
        studentName: studentName.trim(),
        studentBiOrProcesso: studentBiOrProcesso.trim(),
        studentClasse,
        studentTurma,
        studentPeriodo,
        trimestre,
        academicYear: '2025/2026',
        notes: notes.trim(),
      };
    } else if (selectedService === 'DECLARACAO_EFECTIVIDADE') {
      title = `Declaração de Efectividade - ${employeeName || requesterName}`;
      targetRole = 'ADMIN';
      details = {
        employeeName: (employeeName || requesterName).trim(),
        employeeBi: employeeBi.trim().toUpperCase(),
        employeeAgente: employeeAgente.trim(),
        employeeSchoolOrDepartment: employeeSchoolOrDepartment.trim() || selectedSchoolName,
        employeeCategory,
        referenceMonthYear,
        purpose,
        notes: notes.trim(),
      };
    } else if (selectedService === 'DECLARACAO_SERVICO') {
      title = `Declaração de Serviço - ${employeeName || requesterName}`;
      targetRole = 'ADMIN';
      details = {
        employeeName: (employeeName || requesterName).trim(),
        employeeBi: employeeBi.trim().toUpperCase(),
        employeeAgente: employeeAgente.trim(),
        employeeSchoolOrDepartment: employeeSchoolOrDepartment.trim() || selectedSchoolName,
        employeeCategory,
        referenceMonthYear,
        purpose,
        notes: notes.trim(),
      };
    } else if (selectedService === 'DECLARACAO_MATRICULA') {
      title = `Declaração de Matrícula / Frequência - ${studentName}`;
      targetRole = 'DIRECTOR';
      details = {
        studentName: studentName.trim(),
        studentBiOrProcesso: studentBiOrProcesso.trim(),
        studentClasse,
        academicYear: '2025/2026',
        purpose: purpose || 'Abono de Família / Comprovativo',
        notes: notes.trim(),
      };
    } else if (selectedService === 'GUIA_TRANSFERENCIA') {
      title = `Guia de Transferência Escolar - ${studentName}`;
      targetRole = 'DIRECTOR';
      details = {
        studentName: studentName.trim(),
        studentBiOrProcesso: studentBiOrProcesso.trim(),
        studentClasse,
        purpose: `Destino: ${destinationSchool.trim()}`,
        notes: notes.trim(),
      };
    }

    const payload = {
      serviceType: selectedService,
      title,
      requesterName: requesterName.trim(),
      requesterPhone: requesterPhone.trim(),
      requesterEmail: requesterEmail.trim() || undefined,
      requesterRoleTitle,
      targetSchoolId: selectedSchoolId,
      targetSchoolName: selectedSchoolName,
      details,
    };

    const res = await submitQuickServiceRequest(payload);
    setIsSubmitting(false);

    if (res.success && res.request) {
      setSubmittedRequest(res.request);
      saveMyRequest(res.request);
      setPageView('receipt');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFormError(res.error || 'Ocorreu um erro ao enviar o seu pedido. Tente novamente.');
    }
  };

  const handleCopyProtocol = (protocol: string) => {
    navigator.clipboard.writeText(protocol);
    setCopiedProtocol(true);
    setTimeout(() => setCopiedProtocol(false), 2200);
  };

  const handleSearchExactProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    setProtocolSearchError(null);
    setSearchProtocolResult(null);

    const q = protocolSearchQuery.trim();
    if (!q) {
      setProtocolSearchError('Por favor introduza o código de protocolo oficial (ex: SR-2026-1234).');
      return;
    }

    setIsSearchingProtocol(true);

    const isProtocol = q.toUpperCase().startsWith('SR-');
    const filters = isProtocol ? { protocol: q.toUpperCase() } : { phone: q };

    const results = await fetchQuickRequests(filters);
    setIsSearchingProtocol(false);

    if (results && results.length > 0) {
      setSearchProtocolResult(results[0]);
    } else {
      setProtocolSearchError('Nenhum pedido foi encontrado com este número de protocolo. Verifique o código no seu comprovativo.');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const serviceCatalog = [
    {
      type: 'DECLARACAO_EFECTIVIDADE' as QuickServiceType,
      title: 'Declaração de Efectividade',
      badge: 'Envio para a Admin',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      icon: Building2,
      description:
        'Preencha os seus dados de funcionário e envie à Administração Municipal (DME) para validação e homologação.',
      estimatedTime: 'Em análise pela Admin',
      recipient: 'Direcção Municipal da Educação (Admin)',
    },
    {
      type: 'DECLARACAO_SERVICO' as QuickServiceType,
      title: 'Declaração de Serviço (Bancária / Salarial)',
      badge: 'Envio para a Admin',
      badgeColor: 'bg-sky-100 text-sky-900 border-sky-200',
      icon: Landmark,
      description:
        'Comprovativo formal de exercício de funções e conta bancária para bancos, crédito ou regularização salarial.',
      estimatedTime: 'Em análise pela Admin',
      recipient: 'Direcção Municipal da Educação (Admin)',
    },
    {
      type: 'BOLETIM_NOTAS' as QuickServiceType,
      title: 'Boletim de Notas Trimestral',
      badge: 'Secretaria Escolar',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      icon: GraduationCap,
      description:
        'Emissão da 2ª via ou cópia oficial do boletim com as notas das disciplinas e médias calculadas.',
      estimatedTime: 'Até 24h úteis',
      recipient: 'Direção da Escola do Aluno',
    },
    {
      type: 'DECLARACAO_MATRICULA' as QuickServiceType,
      title: 'Declaração / Atestado de Matrícula',
      badge: 'Secretaria Escolar',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
      icon: FileCheck,
      description:
        'Comprovativo formal de matrícula e frequência regular para abono de família, passe escolar ou fins jurídicos.',
      estimatedTime: '24h a 48h úteis',
      recipient: 'Secretaria da Escola',
    },
    {
      type: 'GUIA_TRANSFERENCIA' as QuickServiceType,
      title: 'Guia de Transferência Escolar',
      badge: 'Rede Municipal',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-200',
      icon: ArrowRightLeft,
      description:
        'Pedido de encaminhamento de transferência e vaga entre escolas públicas do município de Quêssua.',
      estimatedTime: '48h a 72h úteis',
      recipient: 'Direcções Escolares & DME',
    },
  ];

  const currentServiceMeta = serviceCatalog.find((s) => s.type === selectedService) || serviceCatalog[0];

  return (
    <div className="w-full min-h-screen bg-[#f8f9fa] text-slate-900 pb-20">
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
          TOP NAVIGATION BAR (REQUESTED ELEMENTS ELIMINATED)
          ===================================================================== */}
      <header className="no-print bg-transparent border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              id="btn-quick-catalogo"
              type="button"
              onClick={() => {
                setPageView('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`h-10 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                pageView === 'catalog'
                  ? 'bg-[#002133] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs'
              }`}
            >
              <Building2 className={`w-4 h-4 ${pageView === 'catalog' ? 'text-amber-400' : 'text-[#002133]'}`} />
              <span>Catálogo de Serviços</span>
            </button>

            <button
              id="btn-quick-meus-pedidos"
              type="button"
              onClick={() => {
                setPageView('my-requests');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`h-10 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                pageView === 'my-requests'
                  ? 'bg-[#002133] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs'
              }`}
            >
              <Search className={`w-4 h-4 ${pageView === 'my-requests' ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span>Meus Pedidos ({myRequests.length})</span>
            </button>
          </div>

          {/* Return Button */}
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 font-medium transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          MAIN PAGE CONTENT
          ===================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 relative z-20">

        {/* ===================================================================
            ETAPA 1: CATÁLOGO DE ESCOLHA DE SERVIÇOS (PÁGINA DEDICADA)
            =================================================================== */}
        {pageView === 'catalog' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-[24px] border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Selecione o Tipo de Serviço a Solicitar
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Escolha o documento pretendido para abrir diretamente o formulário de envio.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Envio Direto para a Administração / Direção</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {serviceCatalog.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.type}
                      className="bg-[#fafbfc] hover:bg-white rounded-2xl border-2 border-slate-200/90 hover:border-slate-800 p-6 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-2xs group-hover:bg-[#002133] group-hover:text-white transition-colors">
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-950">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Destino: {item.recipient}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleChooseServiceAndOpenForm(item.type)}
                          className="h-10 px-5 rounded-full bg-[#002133] hover:bg-[#001726] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer group-hover:scale-102"
                        >
                          <span>Preencher e Enviar</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Information Banner */}
            <div className="p-5 rounded-2xl bg-[#002133] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <strong className="block text-white text-sm font-bold">Apenas você e a Administração:</strong>
                  <span className="text-white/70">
                    O seu pedido é encaminhado de forma segura e privada diretamente para a Administração Municipal da Educação de Quêssua.
                  </span>
                </div>
              </div>

              {myRequests.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPageView('my-requests');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="h-9 px-4 rounded-full bg-white text-[#002133] hover:bg-slate-100 text-xs font-bold shrink-0 transition-colors cursor-pointer"
                >
                  Ver Meus {myRequests.length} Pedidos →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            ETAPA 2: FORMULÁRIO DEDICADO NA PÁGINA (SEM MODAIS, SEM BD, SEM PRINTS)
            "apenas faz o seu e envia para a Admin"
            =================================================================== */}
        {pageView === 'form' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Return Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleStartNewRequest}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-full transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Catálogo de Serviços</span>
              </button>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Requerimento:</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {currentServiceMeta.title}
                </span>
              </div>
            </div>

            {/* Dedicated Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* COLUNA ESQUERDA: CAMPOS DO REQUERIMENTO */}
                <div className="lg:col-span-8 space-y-6">

                  {/* 1. ESCOLA / REPARTIÇÃO */}
                  <div className="bg-white rounded-[24px] border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-[#f2f4f7] flex items-center justify-center text-slate-700">
                        <School className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          1. Instituição / Repartição Escolar de Quêssua
                        </h2>
                        <p className="text-xs text-slate-500">
                          {selectedService === 'DECLARACAO_EFECTIVIDADE'
                            ? 'Indique a escola ou setor onde desempenha as suas funções'
                            : 'Indique a escola onde o aluno estuda'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-700">
                        Escola / Repartição *
                      </label>

                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="search"
                          value={schoolSearchQuery}
                          onChange={(e) => setSchoolSearchQuery(e.target.value)}
                          placeholder="Filtrar por nome da escola..."
                          className="w-full h-11 pl-10 pr-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                        />
                      </div>

                      <div className="max-h-52 overflow-y-auto space-y-1.5 p-1 rounded-2xl border border-slate-200">
                        {filteredSchools.map((school) => {
                          const isSelected = selectedSchoolId === school.id;
                          return (
                            <button
                              key={school.id}
                              type="button"
                              onClick={() => handleSelectSchool(school)}
                              className={`w-full p-3 rounded-xl text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-[#002133] text-white font-bold shadow-xs'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <School className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                                <div className="truncate">
                                  <div className="truncate font-bold">{school.name}</div>
                                  <div className={`text-[11px] truncate ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>
                                    {school.location || 'Município de Quêssua'}
                                  </div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Opção para usar a escola escrita caso não esteja cadastrada */}
                      {schoolSearchQuery.trim() && !schools.some((s) => s.name.toLowerCase() === schoolSearchQuery.trim().toLowerCase()) && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
                          <div>
                            <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              Escola não cadastrada na lista oficial
                            </span>
                            <span className="text-[11px] text-amber-800">
                              Deseja indicar «<strong>{schoolSearchQuery}</strong>» no requerimento?
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSchoolId(`custom-${Date.now()}`);
                              setSelectedSchoolName(schoolSearchQuery.trim());
                              if (selectedService === 'DECLARACAO_EFECTIVIDADE' && !employeeSchoolOrDepartment) {
                                setEmployeeSchoolOrDepartment(schoolSearchQuery.trim());
                              }
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            Usar esta escola
                          </button>
                        </div>
                      )}

                      {selectedSchoolName && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                          <span>
                            Instituição selecionada: <strong className="text-slate-900">{selectedSchoolName}</strong>
                          </span>
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Confirmada
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. DADOS DO SOLICITANTE */}
                  <div className="bg-white rounded-[24px] border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-[#f2f4f7] flex items-center justify-center text-slate-700">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          2. Identificação do Requerente
                        </h2>
                        <p className="text-xs text-slate-500">
                          Os seus dados de identificação e contacto telefónico
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={requesterName}
                          onChange={(e) => setRequesterName(e.target.value)}
                          placeholder="Ex.: António Manuel de Carvalho"
                          className="w-full h-11 px-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Telefone / WhatsApp para Aviso *
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="tel"
                            required
                            value={requesterPhone}
                            onChange={(e) => setRequesterPhone(e.target.value)}
                            placeholder="Ex.: 923 456 789"
                            className="w-full h-11 pl-10 pr-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">
                          A Administração notificará por WhatsApp quando o pedido estiver deferido.
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          E-mail (Opcional)
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="email"
                            value={requesterEmail}
                            onChange={(e) => setRequesterEmail(e.target.value)}
                            placeholder="Ex.: requerente@gmail.com"
                            className="w-full h-11 pl-10 pr-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Vínculo do Requerente
                        </label>
                        <select
                          value={requesterRoleTitle}
                          onChange={(e) => setRequesterRoleTitle(e.target.value)}
                          className="w-full h-11 px-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                        >
                          <option value="Docente / Professor">Docente / Professor</option>
                          <option value="Funcionário Público da Educação">Funcionário Público da Educação</option>
                          <option value="Encarregado(a) de Educação">Encarregado(a) de Educação</option>
                          <option value="Pai / Mãe">Pai / Mãe</option>
                          <option value="O Próprio Aluno">O Próprio Aluno</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 3. DADOS ESPECÍFICOS DO PEDIDO */}
                  <div className="bg-white rounded-[24px] border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-[#f2f4f7] flex items-center justify-center text-slate-700">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          3. Dados da Declaração / Requerimento
                        </h2>
                        <p className="text-xs text-slate-500">
                          {selectedService === 'DECLARACAO_EFECTIVIDADE' || selectedService === 'DECLARACAO_SERVICO'
                            ? 'Dados do funcionário para envio e homologação da Administração Municipal'
                            : 'Dados do estudante para emissão pela secretaria'}
                        </p>
                      </div>
                    </div>

                    {(selectedService === 'DECLARACAO_EFECTIVIDADE' || selectedService === 'DECLARACAO_SERVICO') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Nome Completo do Funcionário *
                          </label>
                          <input
                            type="text"
                            required
                            value={employeeName || requesterName}
                            onChange={(e) => setEmployeeName(e.target.value)}
                            placeholder="Nome completo como consta no BI"
                            className="w-full h-11 px-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Nº do Bilhete de Identidade (BI) *
                          </label>
                          <input
                            type="text"
                            required
                            value={employeeBi}
                            onChange={(e) => setEmployeeBi(e.target.value.toUpperCase())}
                            placeholder="Ex.: 008123456ME041"
                            className="w-full h-11 px-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Nº de Agente do MED / SEPE
                          </label>
                          <input
                            type="text"
                            value={employeeAgente}
                            onChange={(e) => setEmployeeAgente(e.target.value)}
                            placeholder="Ex.: 84920"
                            className="w-full h-11 px-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Categoria Funcional
                          </label>
                          <select
                            value={employeeCategory}
                            onChange={(e) => setEmployeeCategory(e.target.value)}
                            className="w-full h-11 px-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                          >
                            <option value="Professor do Ensino Primário">Professor do Ensino Primário</option>
                            <option value="Professor do Iº Ciclo">Professor do Iº Ciclo</option>
                            <option value="Professor do IIº Ciclo">Professor do IIº Ciclo</option>
                            <option value="Técnico Médio de Educação">Técnico Médio de Educação</option>
                            <option value="Técnico Superior de Educação">Técnico Superior de Educação</option>
                            <option value="Auxiliar Administrativo">Auxiliar Administrativo</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Mês / Ano de Referência da Efectividade
                          </label>
                          <input
                            type="text"
                            value={referenceMonthYear}
                            onChange={(e) => setReferenceMonthYear(e.target.value)}
                            placeholder="Ex.: Fevereiro / 2026"
                            className="w-full h-11 px-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Finalidade da Declaração
                          </label>
                          <select
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className="w-full h-11 px-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                          >
                            <option value="Fins Bancários / Abertura de Conta & Crédito">Fins Bancários / Abertura de Conta & Crédito</option>
                            <option value="Comprovativo Salarial / Empréstimo">Comprovativo Salarial / Empréstimo</option>
                            <option value="Homologação Municipal">Homologação Municipal</option>
                            <option value="Processo de Aposentação / Reforma">Processo de Aposentação / Reforma</option>
                            <option value="Efeito Geral">Efeito Geral</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {(selectedService === 'BOLETIM_NOTAS' ||
                      selectedService === 'DECLARACAO_MATRICULA' ||
                      selectedService === 'GUIA_TRANSFERENCIA') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Nome Completo do Aluno *
                          </label>
                          <input
                            type="text"
                            required
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            placeholder="Nome do aluno na lista da turma"
                            className="w-full h-11 px-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Nº de Processo ou BI do Aluno
                          </label>
                          <input
                            type="text"
                            value={studentBiOrProcesso}
                            onChange={(e) => setStudentBiOrProcesso(e.target.value)}
                            placeholder="Ex.: 1420 ou 008123456ME041"
                            className="w-full h-11 px-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Classe *
                          </label>
                          <select
                            value={studentClasse}
                            onChange={(e) => setStudentClasse(e.target.value)}
                            className="w-full h-11 px-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                          >
                            <option value="1ª Classe">1ª Classe</option>
                            <option value="2ª Classe">2ª Classe</option>
                            <option value="3ª Classe">3ª Classe</option>
                            <option value="4ª Classe">4ª Classe</option>
                            <option value="5ª Classe">5ª Classe</option>
                            <option value="6ª Classe">6ª Classe</option>
                            <option value="7ª Classe">7ª Classe</option>
                            <option value="8ª Classe">8ª Classe</option>
                            <option value="9ª Classe">9ª Classe</option>
                            <option value="10ª Classe">10ª Classe</option>
                            <option value="11ª Classe">11ª Classe</option>
                            <option value="12ª Classe">12ª Classe</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Turma
                          </label>
                          <input
                            type="text"
                            value={studentTurma}
                            onChange={(e) => setStudentTurma(e.target.value)}
                            placeholder="Ex.: Turma A"
                            className="w-full h-11 px-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Período
                          </label>
                          <select
                            value={studentPeriodo}
                            onChange={(e) => setStudentPeriodo(e.target.value)}
                            className="w-full h-11 px-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                          >
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noite">Noite</option>
                          </select>
                        </div>

                        {selectedService === 'BOLETIM_NOTAS' && (
                          <div className="sm:col-span-2 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">
                              Trimestre Pretendido *
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {['1º Trimestre', '2º Trimestre', '3º Trimestre', 'Pauta Final (Anual)'].map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setTrimestre(t)}
                                  className={`py-2 px-3 rounded-full text-xs font-bold border transition-colors cursor-pointer text-center ${
                                    trimestre === t
                                      ? 'bg-slate-900 text-white border-slate-900'
                                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedService === 'GUIA_TRANSFERENCIA' && (
                          <div className="sm:col-span-2 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">
                              Escola de Destino Pretendida *
                            </label>
                            <input
                              type="text"
                              required
                              value={destinationSchool}
                              onChange={(e) => setDestinationSchool(e.target.value)}
                              placeholder="Indique a escola ou localidade de destino"
                              className="w-full h-11 px-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-1.5 pt-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Observações Adicionais (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ex.: Documento necessário para apresentação urgente."
                        className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {formError && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span className="font-semibold">{formError}</span>
                    </div>
                  )}
                </div>

                {/* COLUNA DIREITA: RESUMO AO VIVO & BOTÃO DE SUBMISSÃO PARA A ADMIN */}
                <div className="lg:col-span-4 sticky top-6 space-y-6">
                  <div className="bg-white rounded-[24px] border border-slate-200/90 p-6 shadow-xs space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <Send className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Envio para a Administração
                      </h3>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-500">Serviço:</span>
                        <span className="font-bold text-slate-900 text-right">{currentServiceMeta.title}</span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-500">Destinatário:</span>
                        <span className="font-bold text-slate-900 text-right truncate max-w-[180px]">
                          {selectedService === 'DECLARACAO_EFECTIVIDADE'
                            ? 'Admin Municipal (DME Quêssua)'
                            : selectedSchoolName || 'Secretaria da Escola'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-500">Requerente:</span>
                        <span className="font-bold text-slate-900 text-right truncate max-w-[180px]">
                          {requesterName || 'A preencher'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-500">Contacto:</span>
                        <span className="font-bold text-slate-900 text-right font-mono">
                          {requesterPhone || 'A preencher'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2 pt-2 border-t border-slate-100">
                        <span className="text-slate-500">Homologação:</span>
                        <span className="font-bold text-amber-600 text-right">Direcção Municipal</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-full bg-[#f75142] hover:bg-[#e04335] active:scale-98 text-white font-bold text-sm shadow-[0_10px_24px_-6px_rgba(247,81,66,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>A enviar para a Admin...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-white" />
                          <span>
                            {selectedService === 'DECLARACAO_EFECTIVIDADE' || selectedService === 'DECLARACAO_SERVICO'
                              ? 'Enviar para a Admin Municipal'
                              : 'Enviar Solicitação Oficial'}
                          </span>
                        </>
                      )}
                    </button>

                    <div className="text-[11px] text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tramitação Privada & Segura</span>
                      </div>
                      <p className="leading-relaxed">
                        Ao enviar, o requerimento é gravado na base oficial e entra na fila de despacho da Administração. Receberá um comprovativo com código de protocolo.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </form>
          </div>
        )}

        {/* ===================================================================
            ETAPA 3: COMPROVATIVO OFICIAL EMITIDO (IMPRESSÃO A4 & PROTOCOLO)
            =================================================================== */}
        {pageView === 'receipt' && submittedRequest && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div 
              id="quick-service-official-receipt"
              className="bg-white rounded-[24px] border-2 border-emerald-500/80 p-6 sm:p-10 shadow-xl space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider border border-emerald-200 mb-1">
                      Enviado com Sucesso para a Administração
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Comprovativo de Pedido Oficial
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      República de Angola • Direcção Municipal da Educação do Quêssua
                    </p>
                  </div>
                </div>

                <div className="no-print flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="h-10 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Comprovativo (A4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPageView('my-requests');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Acompanhar em Meus Pedidos</span>
                  </button>
                </div>
              </div>

              {/* Protocol Highlight */}
              <div className="bg-[#f2f4f7] rounded-2xl p-5 sm:p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Código de Protocolo do seu Pedido
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-wide mt-1">
                    {submittedRequest.protocol}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    A Admin Municipal analisará o seu pedido. Apresente este código na secretaria para levantamento.
                  </p>
                </div>

                <div className="no-print flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyProtocol(submittedRequest.protocol)}
                    className="h-10 px-4 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    {copiedProtocol ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-500" />
                        <span>Copiar Protocolo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                    Serviço
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-1">{submittedRequest.title}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                    Destinatário
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-1">
                    {submittedRequest.targetRole === 'ADMIN'
                      ? 'Administração Municipal da Educação'
                      : submittedRequest.targetSchoolName || 'Secretaria Escolar'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                    Requerente
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-1">{submittedRequest.requesterName}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 font-mono">{submittedRequest.requesterPhone}</p>
                </div>
              </div>

              {/* Instructions Box */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Orientações Importantes:</span>
                </div>
                <p className="leading-relaxed">
                  1. O requerimento foi submetido à Direcção Municipal da Educação do Quêssua para homologação.
                </p>
                <p className="leading-relaxed">
                  2. A Administração emitirá a declaração oficial com chancela e assinatura. Guarde o número de protocolo acima.
                </p>
              </div>

              <div className="no-print pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleStartNewRequest}
                  className="text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-full transition-colors cursor-pointer"
                >
                  ← Fazer Novo Pedido
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPageView('my-requests');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="h-9 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Aceder a Meus Pedidos ({myRequests.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            ETAPA 4: MEUS PEDIDOS & CONSULTA PRIVADA DE PROTOCOLO
            "ele só vê aquilo que ele enviou"
            =================================================================== */}
        {pageView === 'my-requests' && (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* Back to Catalog Button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setPageView('catalog');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Catálogo</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartNewRequest()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#f75142] hover:bg-[#e04335] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Pedido</span>
              </button>
            </div>

            {/* Privacy Rule Banner */}
            <div className="p-4 rounded-2xl bg-[#002133] text-white flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <strong className="block text-white font-bold">Sigilo e Proteção Individual:</strong>
                <span className="text-white/70">
                  Apenas os pedidos submetidos por si são exibidos. Dados de outros funcionários ou alunos permanecem sob estrita confidencialidade.
                </span>
              </div>
            </div>

            {/* Search Exact Protocol Form */}
            <div className="bg-white rounded-[24px] border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="max-w-xl">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Consultar Pedido por Código de Protocolo
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Introduza o código de protocolo oficial para verificar o estado da homologação pela Administração.
                </p>
              </div>

              <form onSubmit={handleSearchExactProtocol} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={protocolSearchQuery}
                    onChange={(e) => setProtocolSearchQuery(e.target.value)}
                    placeholder="Código de protocolo (ex: SR-2026-8492)..."
                    className="w-full h-11 pl-10 pr-4 rounded-full border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSearchingProtocol}
                  className="w-full sm:w-auto h-11 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {isSearchingProtocol ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>A procurar...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Consultar</span>
                    </>
                  )}
                </button>
              </form>

              {protocolSearchError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{protocolSearchError}</span>
                </div>
              )}

              {/* Exact protocol search result */}
              {searchProtocolResult && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-3 mt-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {searchProtocolResult.protocol}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {searchProtocolResult.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{searchProtocolResult.title}</h4>
                    <p className="text-slate-600 text-xs mt-0.5">
                      Destino: <strong>{searchProtocolResult.targetRole === 'ADMIN' ? 'Admin Municipal (DME)' : searchProtocolResult.targetSchoolName || 'Secretaria'}</strong>
                    </p>
                  </div>
                  {searchProtocolResult.details?.responseMessage && (
                    <div className="p-3 bg-white rounded-xl border border-emerald-200">
                      <strong className="block text-emerald-900 mb-0.5">Despacho da Administração:</strong>
                      <p className="text-slate-700">{searchProtocolResult.details.responseMessage}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* List of My Submitted Requests */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-slate-800">
                  Meus Pedidos Enviados ({myRequests.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Apenas os pedidos enviados por si neste dispositivo
                </span>
              </div>

              {myRequests.length === 0 ? (
                <div className="bg-white rounded-[24px] border border-slate-200 p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    Nenhum pedido registado até ao momento
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Assim que enviar uma declaração ou pedido de boletim, o comprovativo ficará registado aqui.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartNewRequest}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>Fazer Novo Pedido</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {myRequests.map((req) => {
                    const isConcluido = req.status === 'CONCLUIDO';
                    const isEmAnalise = req.status === 'EM_ANALISE';
                    const isRejeitado = req.status === 'REJEITADO';

                    return (
                      <div
                        key={req.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-slate-900 text-sm">
                                  {req.protocol}
                                </span>
                                <span
                                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                    isConcluido
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                      : isEmAnalise
                                      ? 'bg-sky-100 text-sky-800 border-sky-200'
                                      : isRejeitado
                                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                                      : 'bg-amber-100 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  {isConcluido
                                    ? 'Concluído / Emitido'
                                    : isEmAnalise
                                    ? 'Em Análise pela Admin'
                                    : isRejeitado
                                    ? 'Indeferido'
                                    : 'Pendente / Na Fila da Admin'}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5">
                                {req.title}
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyProtocol(req.protocol)}
                              className="h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </button>
                            <a
                              href={`https://wa.me/244${(req.requesterPhone || '').replace(/\D/g, '')}?text=Olá,%20gostaria%20de%20informações%20sobre%20o%20protocolo%20${encodeURIComponent(req.protocol)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="h-8 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Destinatário</span>
                            <div className="font-bold text-slate-800 truncate mt-0.5">
                              {req.targetRole === 'ADMIN' ? 'Administração Municipal (DME)' : req.targetSchoolName || 'Secretaria'}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Requerente</span>
                            <div className="font-bold text-slate-800 truncate mt-0.5">
                              {req.requesterName}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Data de Envio</span>
                            <div className="font-bold text-slate-800 truncate mt-0.5">
                              {new Date(req.createdAt).toLocaleDateString('pt-PT')}
                            </div>
                          </div>
                        </div>

                        {req.details?.responseMessage && (
                          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                            <strong className="block font-bold mb-0.5">Despacho da Administração:</strong>
                            <p>{req.details.responseMessage}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
};
