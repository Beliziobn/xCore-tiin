import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  User,
  School,
  GraduationCap,
  Building2,
  Calendar,
  MessageSquare,
  Send,
  ExternalLink,
  Check,
  X,
  FileCheck,
  ChevronDown,
  Loader2,
  Printer,
  Sparkles,
  ShieldCheck,
  Share2,
  Copy,
  Layers,
  ArrowRight,
  Trash2,
  AlertTriangle,
  Ban,
  ArrowRightLeft,
  Users,
  BookOpen,
} from 'lucide-react';
import type { QuickServiceRequest, QuickServiceStatus, QuickServiceType, UserAccount } from '../../types';
import {
  fetchQuickRequests,
  submitQuickServiceRequest,
  updateQuickRequestStatus,
  deleteQuickRequest,
  clearAllQuickRequests,
  verifyStudentEnrollmentInSchool,
  extractStudentGradesFromPautas,
  getDestinationSchoolTurmaVacancies,
  type DestinationTurmaVacancyInfo,
} from '../../utils/quickServicesStorage';
import { getRegisteredSchoolsFromStorage, getStoredStudents } from '../../utils/studentStorage';
import { OfficialDocumentModal } from './OfficialDocumentModal';
import { isFemaleFirstName } from '../../utils/genderGrammar';

const DIRECTOR_ALLOWED_SERVICES: QuickServiceType[] = [
  'BOLETIM_NOTAS',
  'DECLARACAO_MATRICULA',
  'GUIA_TRANSFERENCIA',
];

const STUDENT_ACADEMIC_SERVICES: QuickServiceType[] = [
  'BOLETIM_NOTAS',
  'DECLARACAO_MATRICULA',
  'GUIA_TRANSFERENCIA',
];

interface QuickRequestsManagementViewProps {
  currentUser?: UserAccount | null;
  activeRole: 'admin' | 'diretor' | 'professor';
  schoolName?: string;
  onNavigateToDeclaracaoEfectividade?: () => void;
  onOpenNewRequestModal?: () => void;
  showToast?: (msg: string) => void;
}

export const QuickRequestsManagementView: React.FC<QuickRequestsManagementViewProps> = ({
  currentUser,
  activeRole,
  schoolName = '',
  onNavigateToDeclaracaoEfectividade,
  onOpenNewRequestModal,
  showToast,
}) => {
  const [requests, setRequests] = useState<QuickServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | QuickServiceStatus>('TODOS');
  const [typeFilter, setTypeFilter] = useState<'TODOS' | QuickServiceType>('TODOS');
  const [managementTab, setManagementTab] = useState<'PEDIDOS_ORIGEM' | 'CONSULTAS_VAGA_DESTINO'>('PEDIDOS_ORIGEM');

  // Modals state
  const [documentModalRequest, setDocumentModalRequest] = useState<QuickServiceRequest | null>(null);
  const [notifyModalRequest, setNotifyModalRequest] = useState<QuickServiceRequest | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [targetStatus, setTargetStatus] = useState<QuickServiceStatus>('CONCLUIDO');
  const [isDispatching, setIsDispatching] = useState(false);
  const [copiedProtocol, setCopiedProtocol] = useState<string | null>(null);

  // Transfer Vacancy Validation & Reservation Modal (Destination School Director)
  const [vacancyModalRequest, setVacancyModalRequest] = useState<QuickServiceRequest | null>(null);
  const [selectedVacancyTurma, setSelectedVacancyTurma] = useState<string>('Turma A');
  const [vacancyResponseNotes, setVacancyResponseNotes] = useState<string>('');
  const [isSubmittingVacancyResponse, setIsSubmittingVacancyResponse] = useState(false);

  // Direct Emission Modal for School Director / Admin (Boletins, Matrículas & Frequência, Transferências)
  const [isDirectEmitModalOpen, setIsDirectEmitModalOpen] = useState(false);
  const [directServiceType, setDirectServiceType] = useState<'BOLETIM_NOTAS' | 'DECLARACAO_MATRICULA' | 'GUIA_TRANSFERENCIA'>('BOLETIM_NOTAS');
  const [directStudentName, setDirectStudentName] = useState('');
  const [directStudentBi, setDirectStudentBi] = useState('');
  const [directStudentClasse, setDirectStudentClasse] = useState('7ª Classe');
  const [directStudentTurma, setDirectStudentTurma] = useState('Turma A');
  const [directStudentPeriodo, setDirectStudentPeriodo] = useState('Manhã');
  const [directTrimestre, setDirectTrimestre] = useState('1º Trimestre');
  const [directPurpose, setDirectPurpose] = useState('Abono de Família / Comprovativo Escolar');
  const [directDestinationSchool, setDirectDestinationSchool] = useState('');
  const [directCustomDestinationSchool, setDirectCustomDestinationSchool] = useState('');
  const [directGuardianName, setDirectGuardianName] = useState('');
  const [directGuardianPhone, setDirectGuardianPhone] = useState('');
  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false);

  const isMasterAdmin =
    currentUser?.email?.trim().toLowerCase() === 'dmedoquessua@gmail.com' ||
    currentUser?.role === 'admin' ||
    activeRole === 'admin';
  const isDirectorOnly = !isMasterAdmin && (activeRole === 'diretor' || currentUser?.role === 'diretor');

  const activeDirectorSchoolName = useMemo(() => {
    return (
      schoolName ||
      currentUser?.schoolName ||
      'Complexo Escolar Católico n.º 166 MJE São Pedro – Quêssua'
    ).trim();
  }, [schoolName, currentUser]);

  const registeredSchools = useMemo(() => {
    return getRegisteredSchoolsFromStorage();
  }, []);

  const schoolEnrolledStudents = useMemo(() => {
    const all = getStoredStudents();
    if (isMasterAdmin && !schoolName) return all;
    const normSchool = activeDirectorSchoolName.toLowerCase();
    return all.filter((s) => {
      const sSchool = (s.escola || (s as any).nomeEscola || '').trim().toLowerCase();
      return !sSchool || sSchool.includes(normSchool) || normSchool.includes(sSchool);
    });
  }, [activeDirectorSchoolName, isMasterAdmin, schoolName]);

  // Live enrollment check inside Direct Emission Modal
  const directEnrollmentCheck = useMemo(() => {
    if (!directStudentName.trim()) return null;
    return verifyStudentEnrollmentInSchool({
      studentName: directStudentName.trim(),
      studentBiOrProcesso: directStudentBi.trim() || undefined,
      schoolName: activeDirectorSchoolName,
      studentClasse: directStudentClasse,
      studentTurma: directStudentTurma,
    });
  }, [directStudentName, directStudentBi, activeDirectorSchoolName, directStudentClasse, directStudentTurma]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await fetchQuickRequests();
      setRequests(data);
    } catch (e) {
      console.error('[QuickServices] Failed to load requests:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Tem certeza de que deseja zerar e eliminar todos os pedidos de Serviços Rápidos & Efectividade? Esta acção eliminará todos os pedidos da nuvem e do sistema.')) {
      return;
    }
    setIsLoading(true);
    try {
      await clearAllQuickRequests();
      setRequests([]);
      showToast?.(`Todos os pedidos foram zerados com sucesso.`);
    } catch {
      showToast?.('Erro ao zerar pedidos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 6000);

    const handleCreated = (e: any) => {
      if (e?.detail) {
        setRequests((prev) => [e.detail, ...prev.filter((r) => r.id !== e.detail.id)]);
      }
    };
    const handleUpdated = (e: any) => {
      if (e?.detail) {
        setRequests((prev) => prev.map((r) => (r.id === e.detail.id ? e.detail : r)));
      }
    };

    window.addEventListener('sigre_quick_request_created', handleCreated);
    window.addEventListener('sigre_quick_request_updated', handleUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('sigre_quick_request_created', handleCreated);
      window.removeEventListener('sigre_quick_request_updated', handleUpdated);
    };
  }, []);

  // Requests where the user's school is the Origin School (or all for Master Admin)
  const originScopedRequests = useMemo(() => {
    if (isMasterAdmin) {
      return requests;
    }

    if (activeRole === 'diretor' || currentUser?.role === 'diretor') {
      const dirSchool = activeDirectorSchoolName.toLowerCase();
      return requests.filter((r) => {
        if (!DIRECTOR_ALLOWED_SERVICES.includes(r.serviceType)) {
          return false;
        }
        if (!dirSchool) return true;
        const targetSchool = (r.targetSchoolName || '').trim().toLowerCase();
        return (
          targetSchool.includes(dirSchool) ||
          dirSchool.includes(targetSchool) ||
          !r.targetSchoolName
        );
      });
    }

    return requests;
  }, [requests, isMasterAdmin, activeRole, activeDirectorSchoolName, currentUser]);

  // Transfer Vacancy Consultation requests directed TO this school as the Destination School
  const destinationVacancyRequests = useMemo(() => {
    const dirSchool = activeDirectorSchoolName.toLowerCase();
    return requests.filter((r) => {
      if (r.serviceType !== 'GUIA_TRANSFERENCIA') return false;
      if (isMasterAdmin) return true;
      const destSchool = (
        r.destinationSchoolName ||
        r.details?.destinationSchool ||
        r.details?.purpose ||
        ''
      )
        .trim()
        .toLowerCase();
      if (!destSchool || !dirSchool) return false;
      return destSchool.includes(dirSchool) || dirSchool.includes(destSchool);
    });
  }, [requests, isMasterAdmin, activeDirectorSchoolName]);

  const pendingIncomingVacancyCount = useMemo(() => {
    return destinationVacancyRequests.filter((r) => r.status === 'AGUARDANDO_VAGA_DESTINO').length;
  }, [destinationVacancyRequests]);

  const activeListSource =
    managementTab === 'CONSULTAS_VAGA_DESTINO' ? destinationVacancyRequests : originScopedRequests;

  // Apply service type, status filter and search query
  const displayedRequests = useMemo(() => {
    return activeListSource.filter((r) => {
      if (managementTab === 'PEDIDOS_ORIGEM' && typeFilter !== 'TODOS' && r.serviceType !== typeFilter) {
        return false;
      }
      if (statusFilter !== 'TODOS' && r.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesProtocol = (r.protocol || '').toLowerCase().includes(query);
        const matchesRequester = (r.requesterName || '').toLowerCase().includes(query);
        const matchesPhone = (r.requesterPhone || '').includes(query);
        const matchesStudent = (r.details?.studentName || '').toLowerCase().includes(query);
        const matchesEmployee = (r.details?.employeeName || '').toLowerCase().includes(query);
        const matchesSchool = (r.targetSchoolName || '').toLowerCase().includes(query);
        const matchesDestSchool = (
          r.destinationSchoolName ||
          r.details?.destinationSchool ||
          r.details?.purpose ||
          ''
        )
          .toLowerCase()
          .includes(query);
        return (
          matchesProtocol ||
          matchesRequester ||
          matchesPhone ||
          matchesStudent ||
          matchesEmployee ||
          matchesSchool ||
          matchesDestSchool
        );
      }
      return true;
    });
  }, [activeListSource, managementTab, typeFilter, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      total: originScopedRequests.length,
      pendentes: originScopedRequests.filter((r) => r.status === 'PENDENTE').length,
      emAnalise: originScopedRequests.filter(
        (r) =>
          r.status === 'EM_ANALISE' ||
          r.status === 'AGUARDANDO_VAGA_DESTINO' ||
          r.status === 'VAGA_CONFIRMADA'
      ).length,
      concluidos: originScopedRequests.filter((r) => r.status === 'CONCLUIDO').length,
      efectividade: originScopedRequests.filter((r) => r.serviceType === 'DECLARACAO_EFECTIVIDADE').length,
      servico: originScopedRequests.filter((r) => r.serviceType === 'DECLARACAO_SERVICO').length,
      ferias: originScopedRequests.filter((r) => r.serviceType === 'GUIA_FERIAS').length,
      colocacao: originScopedRequests.filter((r) => r.serviceType === 'GUIA_COLOCACAO').length,
      boletins: originScopedRequests.filter((r) => r.serviceType === 'BOLETIM_NOTAS').length,
      matriculas: originScopedRequests.filter((r) => r.serviceType === 'DECLARACAO_MATRICULA').length,
      transferencias: originScopedRequests.filter((r) => r.serviceType === 'GUIA_TRANSFERENCIA').length,
    };
  }, [originScopedRequests]);

  // Compute turma vacancies when Vacancy Modal is open
  const destinationTurmaVacancies = useMemo<DestinationTurmaVacancyInfo[]>(() => {
    if (!vacancyModalRequest) return [];
    const destSchool =
      vacancyModalRequest.destinationSchoolName ||
      vacancyModalRequest.details?.destinationSchool ||
      vacancyModalRequest.details?.purpose ||
      activeDirectorSchoolName;
    const classe =
      vacancyModalRequest.details?.enrolledClasse ||
      vacancyModalRequest.details?.studentClasse ||
      '7ª Classe';
    return getDestinationSchoolTurmaVacancies({
      destinationSchoolName: destSchool,
      classe,
      allRequests: requests,
    });
  }, [vacancyModalRequest, activeDirectorSchoolName, requests]);

  const handleCopyProtocol = (protocol: string) => {
    navigator.clipboard.writeText(protocol);
    setCopiedProtocol(protocol);
    if (showToast) showToast(`Protocolo "${protocol}" copiado para a área de transferência!`);
    setTimeout(() => setCopiedProtocol(null), 2500);
  };

  // Automatic rejection when student is not enrolled in the school
  const handleAutoRejectUnenrolled = async (req: QuickServiceRequest, reasonMsg?: string) => {
    const citizenName = req.requesterName || 'Encarregado(a) de Educação';
    const studentName = req.details?.studentName || req.requesterName;
    const school = req.targetSchoolName || activeDirectorSchoolName;
    const author = isMasterAdmin
      ? 'Belízio dos Santos (Administrador Central DME)'
      : `${currentUser?.firstName || 'Direção'} ${currentUser?.lastName || 'Escolar'}`.trim();

    const officialRejectionMessage = `Exmo(a). Sr(a). ${citizenName}, informamos que o pedido referente ao protocolo ${req.protocol} (${req.title}) foi INDEFERIDO AUTOMATICAMENTE pela Direção da instituição "${school}", uma vez que após verificação nos registos oficiais de matrícula e pautas pedagógicas constatou-se que o(a) educando(a) "${studentName}" não consta como matriculado(a) nesta instituição no presente ano lectivo. ${reasonMsg || ''}`;

    const res = await updateQuickRequestStatus(req.id, {
      status: 'REJEITADO',
      responseMessage: officialRejectionMessage,
      resolvedBy: author,
      details: {
        enrollmentVerified: false,
      },
    });

    if (res.success && res.request) {
      setRequests((prev) => prev.map((r) => (r.id === req.id ? res.request! : r)));
      showToast?.(`Pedido ${req.protocol} indeferido: aluno sem registo de matrícula na escola.`);
    } else {
      showToast?.('Erro ao registar indeferimento automático.');
    }
  };

  // Origin School Director sends Vacancy Consultation Request to Destination School
  const handleRequestVacancyFromDestination = async (
    req: QuickServiceRequest,
    enrollmentInfo: ReturnType<typeof verifyStudentEnrollmentInSchool>
  ) => {
    const destSchool =
      req.destinationSchoolName ||
      req.details?.destinationSchool ||
      req.details?.purpose ||
      'Escola de Destino';
    const author = isMasterAdmin
      ? 'Administração Municipal DME'
      : `${currentUser?.firstName || 'Diretor(a)'} ${currentUser?.lastName || ''}`.trim();

    const res = await updateQuickRequestStatus(req.id, {
      status: 'AGUARDANDO_VAGA_DESTINO',
      responseMessage: `Vínculo escolar comprovado na escola de origem (${req.targetSchoolName || activeDirectorSchoolName}). Foi enviada uma consulta formal de disponibilidade de vaga na ${enrollmentInfo.classe || req.details?.studentClasse || '7ª Classe'} para a Direção da escola de destino (${destSchool}). Aguarde a confirmação da vaga.`,
      resolvedBy: author,
      destinationSchoolName: destSchool,
      details: {
        destinationSchool: destSchool,
        enrollmentVerified: true,
        enrolledStudentId: enrollmentInfo.studentId,
        enrolledCodigoMatricula: enrollmentInfo.codigoMatricula,
        enrolledClasse: enrollmentInfo.classe,
        enrolledTurma: enrollmentInfo.turma,
        enrolledTurno: enrollmentInfo.turno,
        enrolledSala: enrollmentInfo.sala,
        vacancyRequestedAt: new Date().toISOString(),
        vacancyRequestedBy: `${author} (${req.targetSchoolName || activeDirectorSchoolName})`,
      },
    });

    if (res.success && res.request) {
      setRequests((prev) => prev.map((r) => (r.id === req.id ? res.request! : r)));
      showToast?.(`Consulta de vaga enviada para "${destSchool}" com sucesso!`);
    } else {
      showToast?.('Erro ao solicitar consulta de vaga à escola de destino.');
    }
  };

  // Open Vacancy Validation Modal for Destination School Director
  const handleOpenVacancyValidationModal = (req: QuickServiceRequest) => {
    setVacancyModalRequest(req);
    const destSchool =
      req.destinationSchoolName ||
      req.details?.destinationSchool ||
      req.details?.purpose ||
      activeDirectorSchoolName;
    const classe = req.details?.enrolledClasse || req.details?.studentClasse || '7ª Classe';
    const turmas = getDestinationSchoolTurmaVacancies({
      destinationSchoolName: destSchool,
      classe,
      allRequests: requests,
    });
    const firstAvailable = turmas.find((t) => !t.isFull);
    setSelectedVacancyTurma(firstAvailable ? firstAvailable.turma : 'Turma A');
    setVacancyResponseNotes(req.details?.vacancyNotes || '');
  };

  // Destination School Director confirms vacancy & reserves seat OR rejects due to lack of vacancy
  const handleConfirmOrRejectVacancy = async (decision: 'CONFIRM' | 'REJECT') => {
    if (!vacancyModalRequest) return;
    setIsSubmittingVacancyResponse(true);

    const destSchool =
      vacancyModalRequest.destinationSchoolName ||
      vacancyModalRequest.details?.destinationSchool ||
      vacancyModalRequest.details?.purpose ||
      activeDirectorSchoolName;
    const classe =
      vacancyModalRequest.details?.enrolledClasse ||
      vacancyModalRequest.details?.studentClasse ||
      '7ª Classe';
    const responderName = isMasterAdmin
      ? 'Belízio dos Santos (DME Quêssua)'
      : `${currentUser?.firstName || 'Diretor(a)'} ${currentUser?.lastName || ''} (${destSchool})`.trim();

    const chosenTurmaObj = destinationTurmaVacancies.find((t) => t.turma === selectedVacancyTurma);

    if (decision === 'CONFIRM') {
      if (!chosenTurmaObj || chosenTurmaObj.isFull) {
        setIsSubmittingVacancyResponse(false);
        showToast?.('A turma selecionada não possui vagas disponíveis.');
        return;
      }

      const msg = `A Direção da escola de destino (${destSchool}) CONFIRMOU A DISPONIBILIDADE DE VAGA para o(a) aluno(a) ${vacancyModalRequest.details?.studentName} na ${classe} e reservou lugar na ${chosenTurmaObj.turma} (${chosenTurmaObj.turno} • ${chosenTurmaObj.sala}). A escola de origem já pode emitir a Guia de Transferência Oficial.`;

      const res = await updateQuickRequestStatus(vacancyModalRequest.id, {
        status: 'VAGA_CONFIRMADA',
        responseMessage: msg,
        resolvedBy: responderName,
        destinationSchoolName: destSchool,
        details: {
          destinationSchool: destSchool,
          vacancyRespondedAt: new Date().toISOString(),
          vacancyRespondedBy: responderName,
          vacancyNotes:
            vacancyResponseNotes.trim() ||
            `Vaga validada e lugar reservado na ${chosenTurmaObj.turma} (${chosenTurmaObj.turno}).`,
          reservedTurma: chosenTurmaObj.turma,
          reservedTurno: chosenTurmaObj.turno,
          reservedSala: chosenTurmaObj.sala,
        },
      });

      setIsSubmittingVacancyResponse(false);
      if (res.success && res.request) {
        setRequests((prev) => prev.map((r) => (r.id === vacancyModalRequest.id ? res.request! : r)));
        setVacancyModalRequest(null);
        showToast?.(
          `Vaga confirmada e lugar reservado na ${chosenTurmaObj.turma} (${destSchool})!`
        );
      } else {
        showToast?.('Erro ao confirmar vaga na escola de destino.');
      }
    } else {
      const msg = `A Direção da escola de destino (${destSchool}) informou que NÃO HÁ VAGA DISPONÍVEL para enquadrar o(a) aluno(a) ${vacancyModalRequest.details?.studentName} na ${classe}. ${
        vacancyResponseNotes.trim()
          ? `Justificação: ${vacancyResponseNotes.trim()}`
          : 'Todas as turmas desta classe atingiram a capacidade máxima.'
      }`;

      const res = await updateQuickRequestStatus(vacancyModalRequest.id, {
        status: 'SEM_VAGA_DESTINO',
        responseMessage: msg,
        resolvedBy: responderName,
        destinationSchoolName: destSchool,
        details: {
          destinationSchool: destSchool,
          vacancyRespondedAt: new Date().toISOString(),
          vacancyRespondedBy: responderName,
          vacancyNotes:
            vacancyResponseNotes.trim() ||
            'Sem disponibilidade de vagas nas turmas da classe pretendida.',
          reservedTurma: undefined,
          reservedTurno: undefined,
          reservedSala: undefined,
        },
      });

      setIsSubmittingVacancyResponse(false);
      if (res.success && res.request) {
        setRequests((prev) => prev.map((r) => (r.id === vacancyModalRequest.id ? res.request! : r)));
        setVacancyModalRequest(null);
        showToast?.(`Indisponibilidade de vaga comunicada à escola de origem.`);
      } else {
        showToast?.('Erro ao registar resposta de indisponibilidade de vaga.');
      }
    }
  };

  // Open Official Document Modal with enriched enrollment & Mini-Pauta grades snapshot
  const handleOpenOfficialDocumentWithVerification = async (
    req: QuickServiceRequest,
    enrollmentInfo?: ReturnType<typeof verifyStudentEnrollmentInSchool>
  ) => {
    const details = req.details || {};
    if (STUDENT_ACADEMIC_SERVICES.includes(req.serviceType)) {
      const check =
        enrollmentInfo ||
        verifyStudentEnrollmentInSchool({
          studentName: details.studentName || req.requesterName,
          studentBiOrProcesso: details.studentBiOrProcesso,
          schoolName: req.targetSchoolName || activeDirectorSchoolName,
          studentClasse: details.studentClasse,
          studentTurma: details.studentTurma,
        });

      if (!check.isEnrolled) {
        showToast?.(
          'Emissão bloqueada: o aluno não consta como matriculado nesta escola. Utilize a opção de indeferimento automático.'
        );
        return;
      }

      if (
        req.serviceType === 'GUIA_TRANSFERENCIA' &&
        req.status !== 'VAGA_CONFIRMADA' &&
        req.status !== 'CONCLUIDO' &&
        !details.reservedTurma
      ) {
        showToast?.(
          'Emissão bloqueada: antes de transferir o aluno, solicite vaga à escola de destino e aguarde a confirmação da turma reservada.'
        );
        return;
      }

      let updatedDetails: QuickServiceRequest['details'] = {
        ...details,
        enrollmentVerified: true,
        enrolledStudentId: check.studentId,
        enrolledCodigoMatricula: check.codigoMatricula || details.studentBiOrProcesso,
        enrolledClasse: check.classe || details.studentClasse,
        enrolledTurma: check.turma || details.studentTurma,
        enrolledTurno: check.turno || details.studentPeriodo,
        enrolledSala: check.sala,
        studentClasse: check.classe || details.studentClasse,
        studentTurma: check.turma || details.studentTurma,
        studentPeriodo: check.turno || details.studentPeriodo,
      };

      if (req.serviceType === 'BOLETIM_NOTAS') {
        const extracted = extractStudentGradesFromPautas({
          studentName: check.matchedName || details.studentName || req.requesterName,
          schoolName: req.targetSchoolName || activeDirectorSchoolName,
          classe: check.classe || details.studentClasse || '7ª Classe',
          turma: check.turma || details.studentTurma || 'Turma A',
          trimestre: details.trimestre || '1º Trimestre',
        });

        updatedDetails = {
          ...updatedDetails,
          gradesSnapshot: extracted.gradesSnapshot,
          overallAverage: extracted.overallAverage,
          gradingScaleType: extracted.gradingScaleType,
          gradingScaleLabel: extracted.gradingScaleLabel,
          academicStatus: extracted.academicStatus,
        };
      }

      const enrichedRequest: QuickServiceRequest = {
        ...req,
        details: updatedDetails,
      };

      setDocumentModalRequest(enrichedRequest);

      // Persist verified details in background
      await updateQuickRequestStatus(req.id, {
        status: req.status,
        details: updatedDetails,
      });
      setRequests((prev) => prev.map((r) => (r.id === req.id ? enrichedRequest : r)));
      return;
    }

    setDocumentModalRequest(req);
  };

  const handleOpenNotifyModal = (
    req: QuickServiceRequest,
    presetType:
      | 'LEVANTAMENTO'
      | 'CONCLUIDO'
      | 'EM_ANALISE'
      | 'COMPARECER'
      | 'TRANSFERENCIA_ACEITE'
      | 'TRANSFERENCIA_NEGADA' = 'LEVANTAMENTO'
  ) => {
    setNotifyModalRequest(req);
    const citizenName = req.requesterName || 'Cidadão';
    const isFem = isFemaleFirstName(req.details?.employeeName || req.requesterName);
    const saudacao = isFem ? `Exma. Senhora ${citizenName}` : `Exmo. Senhor ${citizenName}`;
    const munidoMunida = isFem ? 'munida' : 'munido';
    const proto = req.protocol;
    const servTitle = req.title;
    const destSchool =
      req.destinationSchoolName || req.details?.destinationSchool || req.details?.purpose || 'Escola Pretendida';

    if (presetType === 'TRANSFERENCIA_ACEITE') {
      setTargetStatus('CONCLUIDO');
      setNotificationMessage(
        `${saudacao}, informamos que o pedido de transferência escolar (${proto}) do(a) educando(a) ${req.details?.studentName || ''} foi ACEITE. A Direção da escola de destino (${destSchool}) confirmou a vaga e reservou lugar na ${req.details?.reservedTurma || 'Turma A'} (${req.details?.reservedTurno || 'Manhã'}). A Guia de Transferência Oficial já foi emitida e encontra-se pronta para levantamento na Secretaria da nossa escola.`
      );
    } else if (presetType === 'TRANSFERENCIA_NEGADA') {
      setTargetStatus('REJEITADO');
      setNotificationMessage(
        `${saudacao}, informamos que o pedido de transferência escolar (${proto}) do(a) educando(a) ${req.details?.studentName || ''} para a instituição "${destSchool}" NÃO FOI ACEITE por indisponibilidade de vagas nas turmas da ${req.details?.studentClasse || 'classe pretendida'} na escola de destino (${req.details?.vacancyNotes || 'Lotação esgotada'}). O(A) aluno(a) mantém a sua matrícula activa na nossa instituição.`
      );
    } else if (presetType === 'LEVANTAMENTO') {
      setTargetStatus('CONCLUIDO');
      setNotificationMessage(
        `${saudacao}, informamos que o seu pedido com protocolo nº ${proto} (${servTitle}) foi deferido com sucesso pela Direção Escolar (${req.targetSchoolName || activeDirectorSchoolName}). O documento oficial encontra-se devidamente emitido, assinado e autenticado, pronto para levantamento presencial na Secretaria da instituição, nos dias úteis das 08h00 às 15h30. Por favor, compareça ${munidoMunida} do seu Bilhete de Identidade original.`
      );
    } else if (presetType === 'CONCLUIDO') {
      setTargetStatus('CONCLUIDO');
      setNotificationMessage(
        `${saudacao}, confirmamos que a sua solicitação ${proto} (${servTitle}) foi processada com êxito. O documento encontra-se concluído e disponível.`
      );
    } else if (presetType === 'EM_ANALISE') {
      setTargetStatus('EM_ANALISE');
      setNotificationMessage(
        `${saudacao}, a sua solicitação com protocolo ${proto} foi recebida e encontra-se presentemente em fase de verificação de vínculo de matrícula e pautas nos arquivos da Secretaria Escolar.`
      );
    } else {
      setTargetStatus('REJEITADO');
      setNotificationMessage(
        `${saudacao}, referente ao pedido ${proto}, solicitamos que compareça à Secretaria da instituição para regularização ou apresentação de elementos complementares necessários à emissão do documento.`
      );
    }
  };

  const handleSaveDispatchAndNotify = async (openWhatsAppAfter = false) => {
    if (!notifyModalRequest) return;
    setIsDispatching(true);

    const author = isMasterAdmin
      ? `Belízio dos Santos (Administrador Central DME - dmedoquessua@gmail.com)`
      : `${currentUser?.firstName || 'Direção'} ${currentUser?.lastName || 'Escolar'}`;

    const res = await updateQuickRequestStatus(notifyModalRequest.id, {
      status: targetStatus,
      responseMessage: notificationMessage.trim(),
      resolvedBy: author,
    });

    setIsDispatching(false);

    if (res.success && res.request) {
      setRequests((prev) =>
        prev.map((r) => (r.id === notifyModalRequest.id ? res.request! : r))
      );
      if (showToast) {
        showToast(`Despacho do pedido ${notifyModalRequest.protocol} registado com sucesso!`);
      }

      if (openWhatsAppAfter && notifyModalRequest.requesterPhone) {
        const cleanPhone = notifyModalRequest.requesterPhone.replace(/\D/g, '');
        const fullPhone = cleanPhone.startsWith('244') ? cleanPhone : `244${cleanPhone}`;
        const encoded = encodeURIComponent(notificationMessage.trim());
        const link = document.createElement('a');
        link.href = `https://wa.me/${fullPhone}?text=${encoded}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setNotifyModalRequest(null);
    } else {
      if (showToast) {
        showToast(res.error || 'Erro ao gravar o despacho do pedido.');
      }
    }
  };

  const handleOpenDirectEmit = (type: 'BOLETIM_NOTAS' | 'DECLARACAO_MATRICULA' | 'GUIA_TRANSFERENCIA') => {
    setDirectServiceType(type);
    setDirectStudentName('');
    setDirectStudentBi('');
    setDirectDestinationSchool('');
    setDirectCustomDestinationSchool('');
    setDirectGuardianName('');
    setDirectGuardianPhone('');
    setIsDirectEmitModalOpen(true);
  };

  const handleSelectEnrolledStudentInModal = (studentId: string) => {
    const found = schoolEnrolledStudents.find((s) => s.id === studentId);
    if (!found) return;
    setDirectStudentName(found.nomeCompleto || found.name || '');
    setDirectStudentBi(found.codigoMatricula || found.numeroDocumento || '');
    setDirectStudentClasse(found.classe || '7ª Classe');
    setDirectStudentTurma(found.turma || 'Turma A');
    setDirectStudentPeriodo(found.turno || 'Manhã');
    if (found.encarregadoEducacao) setDirectGuardianName(found.encarregadoEducacao);
    if (found.telefone) setDirectGuardianPhone(found.telefone);
  };

  const handleSubmitDirectEmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directStudentName.trim()) {
      showToast?.('Por favor, indique o nome completo do estudante.');
      return;
    }

    const enrollment = verifyStudentEnrollmentInSchool({
      studentName: directStudentName.trim(),
      studentBiOrProcesso: directStudentBi.trim() || undefined,
      schoolName: activeDirectorSchoolName,
      studentClasse: directStudentClasse,
      studentTurma: directStudentTurma,
    });

    if (!enrollment.isEnrolled) {
      showToast?.(
        'Emissão bloqueada: este estudante não consta como matriculado em nenhuma turma da escola.'
      );
      return;
    }

    const resolvedDestSchool =
      directDestinationSchool === '__OUTRA__'
        ? directCustomDestinationSchool.trim()
        : directDestinationSchool.trim();

    if (directServiceType === 'GUIA_TRANSFERENCIA' && !resolvedDestSchool) {
      showToast?.('Por favor, selecione a escola de destino para solicitar a vaga de transferência.');
      return;
    }

    setIsSubmittingDirect(true);

    let title = '';
    let details: QuickServiceRequest['details'] = {
      studentName: enrollment.matchedName || directStudentName.trim(),
      studentBiOrProcesso:
        enrollment.codigoMatricula || directStudentBi.trim() || 'Registo Escolar',
      studentClasse: enrollment.classe || directStudentClasse,
      studentTurma: enrollment.turma || directStudentTurma,
      studentPeriodo: enrollment.turno || directStudentPeriodo,
      enrollmentVerified: true,
      enrolledStudentId: enrollment.studentId,
      enrolledCodigoMatricula: enrollment.codigoMatricula,
      enrolledClasse: enrollment.classe,
      enrolledTurma: enrollment.turma,
      enrolledTurno: enrollment.turno,
      enrolledSala: enrollment.sala,
    };

    if (directServiceType === 'BOLETIM_NOTAS') {
      title = `Boletim de Notas - ${details.studentName} (${directTrimestre})`;
      const gradesData = extractStudentGradesFromPautas({
        studentName: details.studentName!,
        schoolName: activeDirectorSchoolName,
        classe: details.studentClasse!,
        turma: details.studentTurma!,
        trimestre: directTrimestre,
      });
      details = {
        ...details,
        trimestre: directTrimestre,
        academicYear: '2025/2026',
        gradesSnapshot: gradesData.gradesSnapshot,
        overallAverage: gradesData.overallAverage,
        gradingScaleType: gradesData.gradingScaleType,
        gradingScaleLabel: gradesData.gradingScaleLabel,
        academicStatus: gradesData.academicStatus,
      };
    } else if (directServiceType === 'DECLARACAO_MATRICULA') {
      title = `Declaração de Matrícula / Frequência - ${details.studentName}`;
      details = {
        ...details,
        academicYear: '2025/2026',
        purpose: directPurpose.trim() || 'Comprovativo de Matrícula e Frequência Escolar',
      };
    } else {
      title = `Guia de Transferência Escolar - ${details.studentName}`;
      details = {
        ...details,
        purpose: resolvedDestSchool,
        destinationSchool: resolvedDestSchool,
        vacancyRequestedAt: new Date().toISOString(),
        vacancyRequestedBy: `${currentUser?.firstName || 'Direção'} (${activeDirectorSchoolName})`,
      };
    }

    const res = await submitQuickServiceRequest({
      serviceType: directServiceType,
      title,
      requesterName: directGuardianName.trim() || details.studentName!,
      requesterPhone: directGuardianPhone.trim() || '+244 923 000 000',
      requesterRoleTitle: 'Pedido / Emissão pela Direção Escolar',
      targetRole: 'DIRECTOR',
      targetSchoolName: activeDirectorSchoolName,
      destinationSchoolName:
        directServiceType === 'GUIA_TRANSFERENCIA' ? resolvedDestSchool : undefined,
      details,
    });

    setIsSubmittingDirect(false);

    if (res.success && res.request) {
      if (directServiceType === 'GUIA_TRANSFERENCIA') {
        // Transfer requires destination school vacancy consultation first
        const vacRes = await updateQuickRequestStatus(res.request.id, {
          status: 'AGUARDANDO_VAGA_DESTINO',
          responseMessage: `Pedido de transferência registado com matrícula comprovada na ${details.studentClasse} (${details.studentTurma}). Consulta de vaga enviada para a Direção da escola de destino (${resolvedDestSchool}).`,
          resolvedBy: currentUser?.firstName
            ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
            : 'Direção Escolar',
          destinationSchoolName: resolvedDestSchool,
          details,
        });
        const updatedReq = vacRes.request || {
          ...res.request,
          status: 'AGUARDANDO_VAGA_DESTINO' as QuickServiceStatus,
          destinationSchoolName: resolvedDestSchool,
          details,
        };
        setRequests((prev) => [updatedReq, ...prev.filter((r) => r.id !== updatedReq.id)]);
        setIsDirectEmitModalOpen(false);
        showToast?.(
          `Consulta de vaga enviada para "${resolvedDestSchool}". A Guia será liberada após confirmação da vaga!`
        );
      } else {
        await updateQuickRequestStatus(res.request.id, {
          status: 'CONCLUIDO',
          responseMessage: 'Documento oficial emitido com matrícula e pauta verificadas pela Direção Escolar.',
          resolvedBy: currentUser?.firstName
            ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
            : 'Direção Escolar',
          details,
        });
        const updatedReq: QuickServiceRequest = {
          ...res.request,
          status: 'CONCLUIDO',
          details,
        };
        setRequests((prev) => [updatedReq, ...prev.filter((r) => r.id !== updatedReq.id)]);
        setIsDirectEmitModalOpen(false);
        setDocumentModalRequest(updatedReq);
        showToast?.(`${title} gerado com sucesso!`);
      }
    } else {
      showToast?.(res.error || 'Erro ao emitir o documento.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-[14px] p-6 border border-[#e8e8ea] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#002133] tracking-tight">
              {isDirectorOnly
                ? 'Serviços Rápidos da Direção Escolar'
                : 'Serviços Rápidos & Despachos de Cidadãos'}
            </h1>
          </div>
          <p className="text-xs text-[#52606d] mt-1">
            {isDirectorOnly
              ? 'Verificação automática de matrícula nas turmas, extração de notas das Mini-Pautas/Pautas e consulta inter-escolar de vagas para transferência.'
              : 'Gestão central de solicitações, verificação de matrículas, boletins automáticos e transferências entre escolas.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenDirectEmit('BOLETIM_NOTAS')}
            className="btn--primary text-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Emitir Boletim de Notas</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDirectEmit('DECLARACAO_MATRICULA')}
            className="btn--secondary text-xs flex items-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5 text-[#002133]" />
            <span>Emitir Matrícula / Frequência</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDirectEmit('GUIA_TRANSFERENCIA')}
            className="btn--secondary text-xs flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#002133]" />
            <span>Nova Transferência / Vaga</span>
          </button>

          {onOpenNewRequestModal && (
            <button
              type="button"
              onClick={onOpenNewRequestModal}
              className="btn--secondary text-xs flex items-center gap-2"
              title="Registar nova solicitação de cidadão/utente"
            >
              <span>+ Novo Pedido</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadRequests}
            disabled={isLoading}
            className="btn--secondary text-xs flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          {isMasterAdmin && onNavigateToDeclaracaoEfectividade && (
            <button
              type="button"
              onClick={onNavigateToDeclaracaoEfectividade}
              className="btn--secondary text-xs flex items-center gap-2"
            >
              <span>Emitir Efectividade</span>
            </button>
          )}

          {isMasterAdmin && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isLoading}
              className="px-3.5 py-2 bg-[#fde8ed] hover:opacity-90 text-[#c8002f] font-semibold text-xs rounded-[10px] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Zerar e eliminar permanentemente todos os pedidos"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Zerar Pedidos</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher: Origin School Requests vs Incoming Transfer Vacancy Consultations */}
      <div className="bg-white rounded-[14px] p-2 border border-[#e8e8ea] flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setManagementTab('PEDIDOS_ORIGEM')}
          className={`px-4 py-2.5 rounded-[10px] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            managementTab === 'PEDIDOS_ORIGEM'
              ? 'bg-[#002133] text-white shadow-xs'
              : 'text-[#52606d] hover:bg-[#f4f4f6] hover:text-[#002133]'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Pedidos da Minha Escola ({originScopedRequests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setManagementTab('CONSULTAS_VAGA_DESTINO')}
          className={`px-4 py-2.5 rounded-[10px] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            managementTab === 'CONSULTAS_VAGA_DESTINO'
              ? 'bg-[#002133] text-white shadow-xs'
              : 'text-[#52606d] hover:bg-[#f4f4f6] hover:text-[#002133]'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Consultas de Vaga Recebidas — Escola de Destino ({destinationVacancyRequests.length})</span>
          {pendingIncomingVacancyCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
              {pendingIncomingVacancyCount} {pendingIncomingVacancyCount === 1 ? 'Pedido de Vaga' : 'Pedidos de Vaga'}
            </span>
          )}
        </button>
      </div>

      {/* Metric Stat Cards — Masakula v2.0: 1 Featured Anchor Card + 3 White Surface Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setStatusFilter('TODOS');
            setTypeFilter('TODOS');
          }}
          className="kpi kpi--featured cursor-pointer"
        >
          <span className="kpi__label text-xs font-medium">Total de Pedidos</span>
          <span className="kpi__value numeric text-3xl font-bold tracking-tight mt-1">{counts.total}</span>
        </div>

        <div
          onClick={() => setStatusFilter('PENDENTE')}
          className={`kpi cursor-pointer ${
            statusFilter === 'PENDENTE' ? 'ring-2 ring-[#002133]' : ''
          }`}
        >
          <span className="kpi__label text-xs font-medium text-[#52606d]">Pendentes</span>
          <span className="kpi__value numeric text-3xl font-bold text-[#002133] tracking-tight mt-1">
            {counts.pendentes}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('EM_ANALISE')}
          className={`kpi cursor-pointer ${
            statusFilter === 'EM_ANALISE' ? 'ring-2 ring-[#002133]' : ''
          }`}
        >
          <span className="kpi__label text-xs font-medium text-[#52606d]">Em Análise / Consulta Vaga</span>
          <span className="kpi__value numeric text-3xl font-bold text-[#002133] tracking-tight mt-1">
            {counts.emAnalise}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('CONCLUIDO')}
          className={`kpi cursor-pointer ${
            statusFilter === 'CONCLUIDO' ? 'ring-2 ring-[#002133]' : ''
          }`}
        >
          <span className="kpi__label text-xs font-medium text-[#52606d]">Concluídos / Emitidos</span>
          <span className="kpi__value numeric text-3xl font-bold text-[#002133] tracking-tight mt-1">
            {counts.concluidos}
          </span>
        </div>
      </div>

      {/* Service Type Filter Tabs — Only on Origin School tab */}
      {managementTab === 'PEDIDOS_ORIGEM' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setTypeFilter('TODOS')}
            className={`filter-chip whitespace-nowrap ${typeFilter === 'TODOS' ? 'is-active' : ''}`}
          >
            Todos os Serviços ({counts.total})
          </button>

          {!isDirectorOnly && (
            <>
              <button
                type="button"
                onClick={() => setTypeFilter('DECLARACAO_EFECTIVIDADE')}
                className={`filter-chip whitespace-nowrap ${
                  typeFilter === 'DECLARACAO_EFECTIVIDADE' ? 'is-active' : ''
                }`}
              >
                Efectividade ({counts.efectividade})
              </button>

              <button
                type="button"
                onClick={() => setTypeFilter('DECLARACAO_SERVICO')}
                className={`filter-chip whitespace-nowrap ${
                  typeFilter === 'DECLARACAO_SERVICO' ? 'is-active' : ''
                }`}
              >
                Declaração de Serviço ({counts.servico})
              </button>

              <button
                type="button"
                onClick={() => setTypeFilter('GUIA_FERIAS')}
                className={`filter-chip whitespace-nowrap ${
                  typeFilter === 'GUIA_FERIAS' ? 'is-active' : ''
                }`}
              >
                Guia de Férias ({counts.ferias})
              </button>

              <button
                type="button"
                onClick={() => setTypeFilter('GUIA_COLOCACAO')}
                className={`filter-chip whitespace-nowrap ${
                  typeFilter === 'GUIA_COLOCACAO' ? 'is-active' : ''
                }`}
              >
                Guia de Colocação ({counts.colocacao})
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setTypeFilter('BOLETIM_NOTAS')}
            className={`filter-chip whitespace-nowrap ${
              typeFilter === 'BOLETIM_NOTAS' ? 'is-active' : ''
            }`}
          >
            Boletins de Notas ({counts.boletins})
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter('DECLARACAO_MATRICULA')}
            className={`filter-chip whitespace-nowrap ${
              typeFilter === 'DECLARACAO_MATRICULA' ? 'is-active' : ''
            }`}
          >
            Matrículas & Frequência ({counts.matriculas})
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter('GUIA_TRANSFERENCIA')}
            className={`filter-chip whitespace-nowrap ${
              typeFilter === 'GUIA_TRANSFERENCIA' ? 'is-active' : ''
            }`}
          >
            Transferências ({counts.transferencias})
          </button>
        </div>
      )}

      {/* Search and Status Toolbar */}
      <div className="bg-white rounded-[14px] p-4 border border-[#e8e8ea] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#52606d] absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar protocolo, nome, telefone, aluno, escola ou BI..."
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#e8e8ea] rounded-[10px] text-xs sm:text-sm text-[#002133] focus:border-[#002133] outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-[#52606d] hover:text-[#002133]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(
            [
              'TODOS',
              'PENDENTE',
              'AGUARDANDO_VAGA_DESTINO',
              'VAGA_CONFIRMADA',
              'SEM_VAGA_DESTINO',
              'CONCLUIDO',
              'REJEITADO',
            ] as const
          ).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`filter-chip ${statusFilter === st ? 'is-active' : ''}`}
            >
              {st === 'TODOS' && 'Todos os Estados'}
              {st === 'PENDENTE' && 'Pendentes'}
              {st === 'AGUARDANDO_VAGA_DESTINO' && 'Aguardando Vaga'}
              {st === 'VAGA_CONFIRMADA' && 'Vaga Confirmada'}
              {st === 'SEM_VAGA_DESTINO' && 'Sem Vaga'}
              {st === 'CONCLUIDO' && 'Concluídos'}
              {st === 'REJEITADO' && 'Indeferidos'}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {isLoading && requests.length === 0 ? (
        <div className="bg-white rounded-[14px] p-12 border border-[#e8e8ea] text-center">
          <Loader2 className="w-7 h-7 text-[#002133] animate-spin mx-auto mb-2" />
          <p className="text-sm font-medium text-[#52606d]">A carregar solicitações em tempo real...</p>
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="bg-white rounded-[14px] p-12 border border-[#e8e8ea] text-center space-y-3">
          <h3 className="text-base font-semibold text-[#002133]">
            {managementTab === 'CONSULTAS_VAGA_DESTINO'
              ? 'Nenhuma consulta de vaga de transferência recebida para esta escola'
              : 'Nenhuma solicitação encontrada com os filtros actuais'}
          </h3>
          <p className="text-xs text-[#52606d] max-w-md mx-auto">
            {managementTab === 'CONSULTAS_VAGA_DESTINO'
              ? 'Quando outra escola enviar um pedido de consulta de vaga para transferir um aluno para a sua instituição, ele aparecerá aqui para validação de vagas por turma.'
              : searchQuery || statusFilter !== 'TODOS' || typeFilter !== 'TODOS'
              ? 'Foram aplicados filtros de pesquisa que restringiram os resultados.'
              : 'Nenhum pedido foi registado ainda na base de dados.'}
          </p>
          {(searchQuery || statusFilter !== 'TODOS' || typeFilter !== 'TODOS') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('TODOS');
                setTypeFilter('TODOS');
              }}
              className="btn--secondary text-xs"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedRequests.map((req) => {
            const cleanPhone = (req.requesterPhone || '').replace(/\D/g, '');
            const fullPhone = cleanPhone.startsWith('244') ? cleanPhone : `244${cleanPhone}`;
            const details = req.details || {};
            const isStudentService = STUDENT_ACADEMIC_SERVICES.includes(req.serviceType);

            // 1. Automatic Enrollment Verification at the Origin School
            const enrollmentCheck = isStudentService
              ? verifyStudentEnrollmentInSchool({
                  studentName: details.studentName || req.requesterName,
                  studentBiOrProcesso: details.studentBiOrProcesso,
                  schoolName: req.targetSchoolName || activeDirectorSchoolName,
                  studentClasse: details.studentClasse,
                  studentTurma: details.studentTurma,
                })
              : null;

            // 2. Automatic Grades Preview from Mini-Pautas / Pautas for Boletim de Notas
            const boletimGradesPreview =
              req.serviceType === 'BOLETIM_NOTAS' && enrollmentCheck?.isEnrolled
                ? extractStudentGradesFromPautas({
                    studentName:
                      enrollmentCheck.matchedName || details.studentName || req.requesterName,
                    schoolName: req.targetSchoolName || activeDirectorSchoolName,
                    classe: enrollmentCheck.classe || details.studentClasse || '7ª Classe',
                    turma: enrollmentCheck.turma || details.studentTurma || 'Turma A',
                    trimestre: details.trimestre || '1º Trimestre',
                  })
                : null;

            const destSchoolName =
              req.destinationSchoolName ||
              details.destinationSchool ||
              (req.serviceType === 'GUIA_TRANSFERENCIA' ? details.purpose : '') ||
              '';

            const isDestinationDirectorForThisRequest =
              req.serviceType === 'GUIA_TRANSFERENCIA' &&
              (isMasterAdmin ||
                managementTab === 'CONSULTAS_VAGA_DESTINO' ||
                (destSchoolName &&
                  activeDirectorSchoolName &&
                  (destSchoolName.toLowerCase().includes(activeDirectorSchoolName.toLowerCase()) ||
                    activeDirectorSchoolName.toLowerCase().includes(destSchoolName.toLowerCase()))));

            const isTransferAwaitingVacancy =
              req.serviceType === 'GUIA_TRANSFERENCIA' &&
              req.status !== 'VAGA_CONFIRMADA' &&
              req.status !== 'CONCLUIDO' &&
              !details.reservedTurma;

            const isEmissionBlocked =
              (isStudentService && enrollmentCheck && !enrollmentCheck.isEnrolled) ||
              isTransferAwaitingVacancy;

            return (
              <div
                key={req.id}
                className="bg-white rounded-[14px] p-5 border border-[#e8e8ea] hover:border-[#d1d1d6] transition-colors space-y-4"
              >
                {/* Zona 1: Header — Protocolo, Título e Badge Semântico */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e8e8ea]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleCopyProtocol(req.protocol)}
                        className="font-mono font-semibold text-xs bg-[#f4f4f6] hover:bg-[#e8e8ea] text-[#002133] px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Clique para copiar protocolo"
                      >
                        <span>{req.protocol}</span>
                        <Copy className="w-3 h-3 text-[#52606d]" />
                      </button>

                      <h3 className="text-base font-semibold text-[#002133]">{req.title}</h3>

                      {req.status === 'PENDENTE' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge--warning">
                          Pendente
                        </span>
                      )}
                      {req.status === 'EM_ANALISE' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge--neutral">
                          Em Análise
                        </span>
                      )}
                      {req.status === 'AGUARDANDO_VAGA_DESTINO' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                          Aguardando Vaga na Escola Destino
                        </span>
                      )}
                      {req.status === 'VAGA_CONFIRMADA' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Vaga Confirmada ({details.reservedTurma || 'Turma Reservada'})
                        </span>
                      )}
                      {req.status === 'SEM_VAGA_DESTINO' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-900 border border-red-300">
                          Sem Vaga na Escola Destino
                        </span>
                      )}
                      {req.status === 'CONCLUIDO' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge--success">
                          Concluído / Emitido
                        </span>
                      )}
                      {req.status === 'REJEITADO' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge--danger">
                          Indeferido / Rejeitado
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#52606d] mt-1.5 flex flex-wrap items-center gap-3">
                      <span className="numeric">
                        Submetido: {new Date(req.createdAt).toLocaleDateString('pt-PT')} às{' '}
                        {new Date(req.createdAt).toLocaleTimeString('pt-PT', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {req.targetSchoolName && (
                        <span className="font-medium text-[#002133]">
                          • Escola de Origem: {req.targetSchoolName}
                        </span>
                      )}
                      {destSchoolName && req.serviceType === 'GUIA_TRANSFERENCIA' && (
                        <span className="font-semibold text-indigo-950">
                          • Escola de Destino: {destSchoolName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Zona de Ações Contextuais */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botão de Consulta de Vaga (Diretor da Escola de Origem) */}
                    {req.serviceType === 'GUIA_TRANSFERENCIA' &&
                      enrollmentCheck?.isEnrolled &&
                      (req.status === 'PENDENTE' || req.status === 'EM_ANALISE') && (
                        <button
                          type="button"
                          onClick={() => handleRequestVacancyFromDestination(req, enrollmentCheck)}
                          className="px-3.5 py-2 bg-indigo-950 hover:bg-indigo-900 text-white font-semibold text-xs rounded-[10px] flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Solicitar Vaga à Escola Destino</span>
                        </button>
                      )}

                    {/* Botão de Validar Vagas por Turma (Diretor da Escola de Destino ou Admin) */}
                    {req.serviceType === 'GUIA_TRANSFERENCIA' &&
                      isDestinationDirectorForThisRequest &&
                      req.status !== 'CONCLUIDO' && (
                        <button
                          type="button"
                          onClick={() => handleOpenVacancyValidationModal(req)}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-[10px] flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Validar Vagas por Turma & Reservar Lugar</span>
                        </button>
                      )}

                    {/* Botão de Emissão Oficial (Bloqueado se não matriculado ou se transferência sem vaga confirmada) */}
                    <button
                      type="button"
                      disabled={Boolean(isEmissionBlocked)}
                      onClick={() =>
                        handleOpenOfficialDocumentWithVerification(req, enrollmentCheck || undefined)
                      }
                      title={
                        !enrollmentCheck?.isEnrolled && isStudentService
                          ? 'Emissão bloqueada: Aluno não matriculado nesta escola'
                          : isTransferAwaitingVacancy
                          ? 'Aguarde a confirmação de vaga e reserva de turma pela Escola de Destino antes de emitir a Guia de Transferência'
                          : 'Emitir Documento Oficial A4'
                      }
                      className={`btn--secondary text-xs flex items-center gap-1.5 ${
                        isEmissionBlocked ? 'opacity-45 cursor-not-allowed' : ''
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5 text-[#52606d]" />
                      <span>
                        {req.serviceType === 'BOLETIM_NOTAS'
                          ? 'Emitir Boletim Oficial'
                          : req.serviceType === 'GUIA_TRANSFERENCIA'
                          ? 'Emitir Guia de Transferência'
                          : 'Emitir Documento Oficial'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleOpenNotifyModal(
                          req,
                          req.serviceType === 'GUIA_TRANSFERENCIA' && req.status === 'VAGA_CONFIRMADA'
                            ? 'TRANSFERENCIA_ACEITE'
                            : req.serviceType === 'GUIA_TRANSFERENCIA' && req.status === 'SEM_VAGA_DESTINO'
                            ? 'TRANSFERENCIA_NEGADA'
                            : 'LEVANTAMENTO'
                        )
                      }
                      className="btn--secondary text-xs flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#52606d]" />
                      <span>Responder ao Encarregado</span>
                    </button>
                  </div>
                </div>

                {/* Banner de Verificação Automática de Matrícula / Vínculo Escolar */}
                {isStudentService && enrollmentCheck && (
                  <div
                    className={`rounded-[10px] p-3.5 border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      enrollmentCheck.isEnrolled
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-red-50/80 border-red-200 text-red-950'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {enrollmentCheck.isEnrolled ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <div className="font-bold">
                          {enrollmentCheck.isEnrolled
                            ? `Matrícula Comprovada na Escola • ${enrollmentCheck.classe} (${enrollmentCheck.turma} • ${enrollmentCheck.turno} • ${enrollmentCheck.sala})`
                            : 'Emissão Bloqueada — Aluno Não Consta como Matriculado nesta Escola'}
                        </div>
                        <p className="text-[11px] opacity-90">
                          {enrollmentCheck.isEnrolled
                            ? `Vínculo confirmado nos registos da turma (${enrollmentCheck.matchedName}) • Nº Matrícula/Processo: ${enrollmentCheck.codigoMatricula}`
                            : enrollmentCheck.reason}
                        </p>
                      </div>
                    </div>

                    {!enrollmentCheck.isEnrolled && req.status !== 'REJEITADO' && (
                      <button
                        type="button"
                        onClick={() => handleAutoRejectUnenrolled(req, enrollmentCheck.reason)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Indeferir Automaticamente (Sem Matrícula)</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Resumo Automático das Notas Extraídas das Mini-Pautas e Pauta da Turma (Para Boletins) */}
                {req.serviceType === 'BOLETIM_NOTAS' &&
                  enrollmentCheck?.isEnrolled &&
                  boletimGradesPreview && (
                    <div className="rounded-[10px] p-3.5 bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <BookOpen className="w-4 h-4 text-[#002133] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-[#002133]">
                            Notas Puxadas Automaticamente das Mini-Pautas & Pauta da Turma ({details.trimestre || '1º Trimestre'})
                          </div>
                          <p className="text-[11px] text-[#52606d] mt-0.5">
                            {boletimGradesPreview.launchedDisciplinesCount} de{' '}
                            {boletimGradesPreview.totalDisciplinesCount} disciplinas com notas lançadas pelos professores •{' '}
                            <strong>Média Geral: {boletimGradesPreview.overallAverage}</strong> (
                            {boletimGradesPreview.gradingScaleLabel}) • Situação:{' '}
                            <strong>{boletimGradesPreview.academicStatus}</strong>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenOfficialDocumentWithVerification(req, enrollmentCheck)}
                        className="px-3 py-1.5 bg-[#002133] hover:bg-[#00314a] text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Ver / Imprimir Boletim Real</span>
                      </button>
                    </div>
                  )}

                {/* Painel do Fluxo Inter-Escolar de Vaga para Transferência */}
                {req.serviceType === 'GUIA_TRANSFERENCIA' && (
                  <div
                    className={`rounded-[10px] p-3.5 border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      req.status === 'VAGA_CONFIRMADA' || details.reservedTurma
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                        : req.status === 'SEM_VAGA_DESTINO'
                        ? 'bg-red-50/80 border-red-200 text-red-950'
                        : 'bg-amber-50/80 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <ArrowRightLeft className="w-4 h-4 shrink-0" />
                        <span>
                          {req.status === 'VAGA_CONFIRMADA' || details.reservedTurma
                            ? `Vaga Confirmada na Escola Destino (${destSchoolName}) • Lugar Reservado na ${details.reservedTurma} (${details.reservedTurno || 'Manhã'} • ${details.reservedSala || 'Sala 1'})`
                            : req.status === 'SEM_VAGA_DESTINO'
                            ? `Pedido Recusado pela Escola Destino (${destSchoolName}) — Sem Vagas Disponíveis`
                            : req.status === 'AGUARDANDO_VAGA_DESTINO'
                            ? `Aguardando Validação de Vaga por Turma na Escola Destino (${destSchoolName})`
                            : `Passo Obrigatório: Consultar Disponibilidade de Vaga na Escola Destino (${destSchoolName})`}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-90">
                        {req.status === 'VAGA_CONFIRMADA' || details.reservedTurma
                          ? `Confirmado por ${details.vacancyRespondedBy || 'Direção da Escola Destino'}. ${details.vacancyNotes || ''} A Guia de Transferência já pode ser emitida e comunicada ao encarregado.`
                          : req.status === 'SEM_VAGA_DESTINO'
                          ? `Motivo: ${details.vacancyNotes || 'Turmas da classe pretendida sem vagas disponíveis.'} Comunique a resposta ao encarregado de educação.`
                          : req.status === 'AGUARDANDO_VAGA_DESTINO'
                          ? `Solicitação enviada por ${details.vacancyRequestedBy || 'Direção da Escola de Origem'}. O Diretor da escola de destino deve validar as vagas por turma e reservar o lugar.`
                          : 'Antes de emitir a Guia de Transferência, envie o pedido de consulta de vaga à escola pretendida.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {(req.status === 'VAGA_CONFIRMADA' || details.reservedTurma) && (
                        <button
                          type="button"
                          onClick={() => handleOpenNotifyModal(req, 'TRANSFERENCIA_ACEITE')}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Enviar Aceitação ao Encarregado
                        </button>
                      )}
                      {req.status === 'SEM_VAGA_DESTINO' && (
                        <button
                          type="button"
                          onClick={() => handleOpenNotifyModal(req, 'TRANSFERENCIA_NEGADA')}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Comunicar Negativa ao Encarregado
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Zona 2 & 3: Dados do Pedinte e Especificações em Superfície Plana */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 text-xs">
                  {/* Coluna 1: Identificação do Pedinte */}
                  <div className="space-y-1.5 lg:border-r lg:border-[#e8e8ea] lg:pr-5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#52606d] uppercase tracking-wider text-[10px]">
                        Identificação do Pedinte
                      </span>
                      <span className="text-[11px] font-medium text-[#52606d]">
                        {req.requesterRoleTitle || 'Encarregado / Cidadão'}
                      </span>
                    </div>

                    <div className="font-semibold text-sm text-[#002133]">{req.requesterName}</div>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[#52606d]">
                      <a
                        href={`https://wa.me/${fullPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#002133] underline underline-offset-2 font-medium numeric"
                      >
                        WhatsApp: {req.requesterPhone}
                      </a>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="hover:text-[#002133] font-medium"
                        title="Ligar"
                      >
                        Ligar
                      </a>
                      {req.requesterEmail && (
                        <a
                          href={`mailto:${req.requesterEmail}`}
                          className="hover:text-[#002133] truncate"
                        >
                          {req.requesterEmail}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Colunas 2-3: Especificações Submetidas */}
                  <div className="space-y-2 lg:col-span-2">
                    <span className="font-semibold text-[#52606d] uppercase tracking-wider text-[10px] block">
                      Especificações & Dados Académicos
                    </span>

                    {(req.serviceType === 'DECLARACAO_EFECTIVIDADE' ||
                      req.serviceType === 'DECLARACAO_SERVICO' ||
                      req.serviceType === 'GUIA_FERIAS' ||
                      req.serviceType === 'GUIA_COLOCACAO') && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Funcionário(a)</span>
                          <span className="font-semibold text-[#002133] text-xs">
                            {details.employeeName || req.requesterName}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">B.I. / Agente</span>
                          <span className="font-mono font-medium text-[#002133] text-xs numeric">
                            {details.employeeBi || 'Registo Geral'}
                            {details.employeeAgente ? ` (${details.employeeAgente})` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Categoria</span>
                          <span className="font-medium text-[#002133] text-xs">
                            {details.employeeCategory || 'Docente'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Mês / Ano de Ref.</span>
                          <span className="font-medium text-[#002133] text-xs numeric">
                            {details.referenceMonthYear || '2026'}
                          </span>
                        </div>
                      </div>
                    )}

                    {req.serviceType === 'BOLETIM_NOTAS' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Estudante</span>
                          <span className="font-semibold text-[#002133] text-xs">
                            {details.studentName || 'Nome do Aluno'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Classe / Turma</span>
                          <span className="font-medium text-[#002133] text-xs">
                            {enrollmentCheck?.classe || details.studentClasse || '7ª Classe'} -{' '}
                            {enrollmentCheck?.turma || details.studentTurma || 'Turma A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Trimestre</span>
                          <span className="font-medium text-[#002133] text-xs">
                            {details.trimestre || '1º Trimestre'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">B.I. / Processo</span>
                          <span className="font-mono font-medium text-[#002133] text-xs numeric">
                            {enrollmentCheck?.codigoMatricula ||
                              details.studentBiOrProcesso ||
                              'Não informado'}
                          </span>
                        </div>
                      </div>
                    )}

                    {req.serviceType === 'DECLARACAO_MATRICULA' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Aluno(a)</span>
                          <span className="font-semibold text-[#002133] text-xs">{details.studentName}</span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Classe / Turma</span>
                          <span className="font-medium text-[#002133] text-xs numeric">
                            {enrollmentCheck?.classe || details.studentClasse} •{' '}
                            {enrollmentCheck?.turma || details.studentTurma || 'Turma A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Turno / Sala</span>
                          <span className="font-medium text-[#002133] text-xs">
                            {enrollmentCheck?.turno || details.studentPeriodo || 'Manhã'} •{' '}
                            {enrollmentCheck?.sala || 'Sala 01'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Nº Matrícula / B.I.</span>
                          <span className="font-mono font-medium text-[#002133] text-xs numeric">
                            {enrollmentCheck?.codigoMatricula || details.studentBiOrProcesso || 'Geral'}
                          </span>
                        </div>
                      </div>
                    )}

                    {req.serviceType === 'GUIA_TRANSFERENCIA' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Aluno(a)</span>
                          <span className="font-semibold text-[#002133] text-xs">{details.studentName}</span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Classe / Turma Origem</span>
                          <span className="font-medium text-[#002133] text-xs">
                            {enrollmentCheck?.classe || details.studentClasse} (
                            {enrollmentCheck?.turma || details.studentTurma || 'Turma A'})
                          </span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Escola de Destino</span>
                          <span className="font-semibold text-indigo-950 text-xs">
                            {destSchoolName || 'Instituição pretendida'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Vaga / Turma Destino</span>
                          <span className="font-semibold text-emerald-800 text-xs">
                            {details.reservedTurma
                              ? `${details.reservedTurma} (${details.reservedTurno || 'Manhã'})`
                              : req.status === 'SEM_VAGA_DESTINO'
                              ? 'Sem Vaga'
                              : 'Aguardando Consulta'}
                          </span>
                        </div>
                      </div>
                    )}

                    {details.purpose && req.serviceType !== 'GUIA_TRANSFERENCIA' && (
                      <div className="text-[#52606d] text-xs pt-2 border-t border-[#e8e8ea]">
                        <span className="font-medium text-[#002133]">Finalidade Declarada:</span>{' '}
                        {details.purpose}
                      </div>
                    )}

                    {details.notes && (
                      <div className="text-[#52606d] text-xs pt-1">
                        <span className="font-medium text-[#002133]">Motivo / Observações do Encarregado:</span>{' '}
                        <span>{details.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Despacho & Resolution History */}
                {details.responseMessage && (
                  <div className="pt-3 border-t border-[#e8e8ea] text-xs space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-[#0b7a54]">
                      <span>Despacho / Histórico de Tramitação Oficial</span>
                      {details.resolvedAt && (
                        <span className="text-[11px] text-[#52606d] font-normal numeric">
                          Actualizado em: {new Date(details.resolvedAt).toLocaleDateString('pt-PT')} por{' '}
                          {details.resolvedBy}
                        </span>
                      )}
                    </div>
                    <p className="text-[#52606d] leading-relaxed">"{details.responseMessage}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Validação de Vagas por Turma e Reserva de Lugar (Diretor da Escola de Destino) */}
      {vacancyModalRequest && (
        <div className="fixed inset-0 z-[155] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  Consulta Inter-Escolar de Vaga • {vacancyModalRequest.protocol}
                </span>
                <h3 className="text-lg font-black text-[#002133] mt-1.5">
                  Validar Vagas por Turma & Reservar Lugar na Escola de Destino
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Aluno(a): <strong>{vacancyModalRequest.details?.studentName}</strong> • Classe:{' '}
                  <strong>
                    {vacancyModalRequest.details?.enrolledClasse ||
                      vacancyModalRequest.details?.studentClasse ||
                      '7ª Classe'}
                  </strong>{' '}
                  • Escola de Origem: <strong>{vacancyModalRequest.targetSchoolName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVacancyModalRequest(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Disponibilidade de Vagas nas Turmas da{' '}
                  {vacancyModalRequest.details?.enrolledClasse ||
                    vacancyModalRequest.details?.studentClasse ||
                    '7ª Classe'}{' '}
                  ({vacancyModalRequest.destinationSchoolName || vacancyModalRequest.details?.destinationSchool || activeDirectorSchoolName})
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Capacidade máxima: 45 alunos / turma
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {destinationTurmaVacancies.map((item) => {
                  const isSelected = selectedVacancyTurma === item.turma;
                  const occupancyPercent = Math.min(
                    100,
                    Math.round((item.occupiedTotal / item.maxCapacity) * 100)
                  );
                  return (
                    <div
                      key={item.turma}
                      onClick={() => {
                        if (!item.isFull) setSelectedVacancyTurma(item.turma);
                      }}
                      className={`p-4 rounded-2xl border transition-all ${
                        item.isFull
                          ? 'bg-red-50/50 border-red-200 opacity-70 cursor-not-allowed'
                          : isSelected
                          ? 'bg-emerald-50/70 border-2 border-emerald-700 shadow-xs cursor-pointer'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-black text-sm text-[#002133]">
                          {item.turma} ({item.turno})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            !item.isFull
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-red-100 text-red-900'
                          }`}
                        >
                          {!item.isFull
                            ? `${item.availableVacancies} vagas livres`
                            : 'Lotação Esgotada'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center justify-between mb-2">
                        <span>{item.sala}</span>
                        <span className="font-mono font-semibold">
                          {item.occupiedTotal} / {item.maxCapacity} alunos
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.isFull
                              ? 'bg-red-600'
                              : occupancyPercent > 85
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${occupancyPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Observações / Despacho da Escola de Destino (Opcional)
              </label>
              <textarea
                rows={3}
                value={vacancyResponseNotes}
                onChange={(e) => setVacancyResponseNotes(e.target.value)}
                placeholder="Ex.: Vaga confirmada e lugar reservado na Turma A (Período da Manhã). O encarregado deverá apresentar a Guia de Transferência original na secretaria..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#002133] outline-none resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleConfirmOrRejectVacancy('REJECT')}
                disabled={isSubmittingVacancyResponse}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                <span>Recusar Pedido (Sem Vaga Disponível)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVacancyModalRequest(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmOrRejectVacancy('CONFIRM')}
                  disabled={
                    isSubmittingVacancyResponse ||
                    !destinationTurmaVacancies.some((t) => !t.isFull)
                  }
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingVacancyResponse ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Confirmar Vaga e Reservar {selectedVacancyTurma}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Document Emission & Print Modal */}
      <OfficialDocumentModal
        isOpen={Boolean(documentModalRequest)}
        onClose={() => setDocumentModalRequest(null)}
        request={documentModalRequest}
        onOpenNotifyModal={(req) =>
          handleOpenNotifyModal(
            req,
            req.serviceType === 'GUIA_TRANSFERENCIA' ? 'TRANSFERENCIA_ACEITE' : 'LEVANTAMENTO'
          )
        }
        onMarkAsConcluidoAndNotify={async (req) => {
          const author = isMasterAdmin
            ? 'Belízio dos Santos (Administrador Central DME - dmedoquessua@gmail.com)'
            : `${currentUser?.firstName || 'Direção'} ${currentUser?.lastName || 'Escolar'}`.trim();
          const defaultMsg =
            req.serviceType === 'GUIA_TRANSFERENCIA'
              ? `Guia de Transferência Oficial (${req.protocol}) emitida após confirmação de vaga na escola de destino (${req.destinationSchoolName || req.details?.destinationSchool || req.details?.purpose}) na ${req.details?.reservedTurma || 'Turma A'}. Disponível para levantamento na Secretaria.`
              : `Documento oficial referente ao protocolo ${req.protocol} foi emitido com sucesso e autenticado pela Direção Escolar. Encontra-se pronto para levantamento presencial na nossa instituição.`;

          await updateQuickRequestStatus(req.id, {
            status: 'CONCLUIDO',
            responseMessage: defaultMsg,
            resolvedBy: author,
          });

          setRequests((prev) =>
            prev.map((r) =>
              r.id === req.id
                ? {
                    ...r,
                    status: 'CONCLUIDO',
                    details: {
                      ...r.details,
                      responseMessage: defaultMsg,
                      resolvedBy: author,
                      resolvedAt: new Date().toISOString(),
                    },
                  }
                : r
            )
          );

          if (showToast) {
            showToast(`Documento emitido e registado como Concluído!`);
          }
        }}
      />

      {/* Notify & Pickup Modal */}
      {notifyModalRequest && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-black bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                  {notifyModalRequest.protocol}
                </span>
                <h3 className="text-lg font-black text-[#002133] mt-1">
                  Responder ao Encarregado / Requerente
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Destinatário: <strong>{notifyModalRequest.requesterName}</strong> (
                  {notifyModalRequest.requesterPhone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyModalRequest(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Template Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Modelos de Resposta Rápida
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleOpenNotifyModal(notifyModalRequest, 'LEVANTAMENTO')}
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-xl text-left font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Levantamento na Secretaria</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenNotifyModal(notifyModalRequest, 'TRANSFERENCIA_ACEITE')}
                  className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 rounded-xl text-left font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Transferência Aceite (Vaga Confirmada)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenNotifyModal(notifyModalRequest, 'TRANSFERENCIA_NEGADA')}
                  className="p-2.5 bg-red-50 hover:bg-red-100 text-red-950 border border-red-200 rounded-xl text-left font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Ban className="w-4 h-4 text-red-700 shrink-0" />
                  <span>Transferência Negada (Sem Vaga)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenNotifyModal(notifyModalRequest, 'COMPARECER')}
                  className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-xl text-left font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Indeferir / Solicitar Comparência</span>
                </button>
              </div>
            </div>

            {/* Target Status Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Actualizar Estado do Pedido
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as QuickServiceStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none"
              >
                <option value="CONCLUIDO">Concluído (Deferido / Documento emitido)</option>
                <option value="AGUARDANDO_VAGA_DESTINO">Aguardando Vaga na Escola de Destino</option>
                <option value="VAGA_CONFIRMADA">Vaga Confirmada na Escola de Destino</option>
                <option value="SEM_VAGA_DESTINO">Sem Vaga na Escola de Destino</option>
                <option value="EM_ANALISE">Em Análise</option>
                <option value="PENDENTE">Pendente</option>
                <option value="REJEITADO">Indeferido / Rejeitado</option>
              </select>
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mensagem Oficial ao Requerente (Visualizada na Consulta & Enviada por WhatsApp) *
              </label>
              <textarea
                rows={5}
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Escreva a resposta formal ao encarregado de educação..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none resize-none leading-relaxed"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setNotifyModalRequest(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {notifyModalRequest.requesterPhone && (
                  <button
                    type="button"
                    onClick={() => handleSaveDispatchAndNotify(true)}
                    disabled={isDispatching || !notificationMessage.trim()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gravar & Abrir WhatsApp</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSaveDispatchAndNotify(false)}
                  disabled={isDispatching || !notificationMessage.trim()}
                  className="px-5 py-2.5 bg-[#002133] hover:bg-[#00314a] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isDispatching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Registar Resposta Oficial</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct Emission Modal for Allowed Academic Services (Boletim de Notas, Matrícula & Frequência, Transferência) */}
      {isDirectEmitModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Serviços Rápidos • Comprovação de Matrícula Obrigatória
                </span>
                <h3 className="text-lg font-black text-[#002133] mt-1.5">
                  {directServiceType === 'BOLETIM_NOTAS' && 'Emitir Boletim de Notas (Pautas da Turma)'}
                  {directServiceType === 'DECLARACAO_MATRICULA' && 'Emitir Declaração de Matrícula & Frequência'}
                  {directServiceType === 'GUIA_TRANSFERENCIA' && 'Iniciar Transferência & Consulta de Vaga'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDirectEmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDirectEmit} className="space-y-4">
              {/* Selector between the 3 allowed student services */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipo de Serviço Escolar *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDirectServiceType('BOLETIM_NOTAS')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-colors cursor-pointer ${
                      directServiceType === 'BOLETIM_NOTAS'
                        ? 'bg-[#002133] text-white border-[#002133]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Boletim de Notas
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectServiceType('DECLARACAO_MATRICULA')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-colors cursor-pointer ${
                      directServiceType === 'DECLARACAO_MATRICULA'
                        ? 'bg-[#002133] text-white border-[#002133]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Matrícula & Frequência
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectServiceType('GUIA_TRANSFERENCIA')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-colors cursor-pointer ${
                      directServiceType === 'GUIA_TRANSFERENCIA'
                        ? 'bg-[#002133] text-white border-[#002133]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Guia de Transferência
                  </button>
                </div>
              </div>

              {/* Quick Selector from Enrolled Students in the School */}
              {schoolEnrolledStudents.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selecionar Aluno Matriculado na Escola (Preenchimento Automático)
                  </label>
                  <select
                    defaultValue=""
                    onChange={(e) => handleSelectEnrolledStudentInModal(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-emerald-50/60 border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#002133] outline-none"
                  >
                    <option value="">-- Escolha um aluno matriculado na escola ({schoolEnrolledStudents.length}) --</option>
                    {schoolEnrolledStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.nomeCompleto || st.name} • {st.classe || '7ª Classe'} ({st.turma || 'Turma A'}) • Nº {st.codigoMatricula || st.numeroDocumento || 'S/N'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo do Aluno(a) *
                  </label>
                  <input
                    type="text"
                    required
                    value={directStudentName}
                    onChange={(e) => setDirectStudentName(e.target.value)}
                    placeholder="Digite ou selecione o nome completo do aluno matriculado"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#002133] outline-none"
                  />
                </div>

                {/* Live Enrollment Verification Feedback inside Modal */}
                {directEnrollmentCheck && (
                  <div
                    className={`sm:col-span-2 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      directEnrollmentCheck.isEnrolled
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-red-50 border-red-200 text-red-950'
                    }`}
                  >
                    {directEnrollmentCheck.isEnrolled ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">
                        {directEnrollmentCheck.isEnrolled
                          ? `Aluno Matriculado: ${directEnrollmentCheck.classe} (${directEnrollmentCheck.turma} • ${directEnrollmentCheck.turno})`
                          : 'Aluno Não Encontrado nos Registos de Matrícula desta Escola'}
                      </div>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        {directEnrollmentCheck.isEnrolled
                          ? `Vínculo confirmado (${directEnrollmentCheck.matchedName}) • Nº Matrícula: ${directEnrollmentCheck.codigoMatricula}`
                          : directEnrollmentCheck.reason}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    B.I. ou Nº de Matrícula / Processo
                  </label>
                  <input
                    type="text"
                    value={directStudentBi}
                    onChange={(e) => setDirectStudentBi(e.target.value)}
                    placeholder="Ex.: MAT-2026-1001"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#002133] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Classe *
                  </label>
                  <select
                    value={directStudentClasse}
                    onChange={(e) => setDirectStudentClasse(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#002133] outline-none"
                  >
                    {[
                      'Iniciação',
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
                    ].map((cl) => (
                      <option key={cl} value={cl}>
                        {cl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Turma
                  </label>
                  <select
                    value={directStudentTurma}
                    onChange={(e) => setDirectStudentTurma(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#002133] outline-none"
                  >
                    {['Turma A', 'Turma B', 'Turma C', 'Turma D'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Período / Turno
                  </label>
                  <select
                    value={directStudentPeriodo}
                    onChange={(e) => setDirectStudentPeriodo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#002133] outline-none"
                  >
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                  </select>
                </div>

                {directServiceType === 'BOLETIM_NOTAS' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Trimestre / Período Avaliativo (Puxado das Mini-Pautas) *
                    </label>
                    <select
                      value={directTrimestre}
                      onChange={(e) => setDirectTrimestre(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#002133] outline-none"
                    >
                      <option value="1º Trimestre">1º Trimestre</option>
                      <option value="2º Trimestre">2º Trimestre</option>
                      <option value="3º Trimestre">3º Trimestre</option>
                      <option value="Final do Ano Lectivo">Final do Ano Lectivo (Pauta Geral)</option>
                    </select>
                  </div>
                )}

                {directServiceType === 'DECLARACAO_MATRICULA' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Finalidade da Declaração de Matrícula / Frequência *
                    </label>
                    <input
                      type="text"
                      required
                      value={directPurpose}
                      onChange={(e) => setDirectPurpose(e.target.value)}
                      placeholder="Ex.: Abono de Família / Comprovativo de Frequência Escolar"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#002133] outline-none"
                    />
                  </div>
                )}

                {directServiceType === 'GUIA_TRANSFERENCIA' && (
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Escola de Destino Pretendida (Para Consulta de Vaga) *
                    </label>
                    <select
                      required
                      value={directDestinationSchool}
                      onChange={(e) => setDirectDestinationSchool(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#002133] outline-none"
                    >
                      <option value="">-- Selecione a Escola de Destino --</option>
                      {registeredSchools
                        .filter((s) => s.name !== activeDirectorSchoolName)
                        .map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      <option value="__OUTRA__">Outra Instituição de Ensino (Digitar nome)</option>
                    </select>

                    {directDestinationSchool === '__OUTRA__' && (
                      <input
                        type="text"
                        required
                        value={directCustomDestinationSchool}
                        onChange={(e) => setDirectCustomDestinationSchool(e.target.value)}
                        placeholder="Indique o nome da escola de destino"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#002133] outline-none"
                      />
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Encarregado(a) de Educação
                  </label>
                  <input
                    type="text"
                    value={directGuardianName}
                    onChange={(e) => setDirectGuardianName(e.target.value)}
                    placeholder="Nome do Encarregado"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#002133] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={directGuardianPhone}
                    onChange={(e) => setDirectGuardianPhone(e.target.value)}
                    placeholder="+244 923 000 000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#002133] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDirectEmitModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmittingDirect ||
                    Boolean(directEnrollmentCheck && !directEnrollmentCheck.isEnrolled)
                  }
                  className="px-5 py-2.5 bg-[#002133] hover:bg-[#00314a] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingDirect ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : directServiceType === 'GUIA_TRANSFERENCIA' ? (
                    <ArrowRightLeft className="w-4 h-4" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )}
                  <span>
                    {directServiceType === 'GUIA_TRANSFERENCIA'
                      ? 'Solicitar Vaga à Escola Destino'
                      : 'Gerar & Abrir Documento A4'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

