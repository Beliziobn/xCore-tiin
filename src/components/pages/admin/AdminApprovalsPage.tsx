import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Building2,
  User,
  Mail,
  Phone,
  FileText,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Plus,
  Check,
  X,
  Award,
  Eye,
  UserCheck,
  UserX,
  MapPin,
  Calendar,
  AlertCircle,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  BookOpen,
  LayoutGrid,
  List,
  FileCheck,
  Filter,
  CheckCheck,
  Trash2
} from 'lucide-react';
import type { 
  PendingApplication, 
  AdminDirector, 
  AdminSchool, 
  PendingApprovalComplementaryData 
} from '../../../types';
import {
  getPendingApplications,
  approveApplication,
  rejectApplication,
  savePendingApplication,
  savePendingApplicationAsync,
  syncApplicationsFromServer,
  deleteApplication,
  clearAllHomologatedData,
  OFFICIAL_DME_ADMIN_EMAIL
} from '../../../utils/authApprovalStorage';
import { buildInitialDirectorDossier, saveDirector } from '../../../utils/directorStorage';
import { Hero } from '../../Hero';

interface AdminApprovalsPageProps {
  onOpenGetStarted?: () => void;
  isLoggedIn?: boolean;
  adminName?: string;
  directors?: AdminDirector[];
  schools?: AdminSchool[];
  onAddDirectorGlobal?: (director: AdminDirector) => void;
  onAddTeacherGlobal?: (teacher: any) => void;
  showToast?: (msg: string) => void;
}

export const AdminApprovalsPage: React.FC<AdminApprovalsPageProps> = ({
  onOpenGetStarted,
  isLoggedIn = true,
  adminName = 'DME Quêssua (Administrador Central)',
  directors = [],
  schools = [],
  onAddDirectorGlobal,
  onAddTeacherGlobal,
  showToast,
}) => {
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente');
  const [roleScopeFilter, setRoleScopeFilter] = useState<'todos' | 'diretor' | 'professor' | 'funcionario' | 'membro_dme'>('todos');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('todas');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedApp, setSelectedApp] = useState<PendingApplication | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Approval Modal State
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [appToApprove, setAppToApprove] = useState<PendingApplication | null>(null);
  const [targetSchoolName, setTargetSchoolName] = useState('');
  const [dispatchNumber, setDispatchNumber] = useState('Despacho nº 104/DME/2026');
  const [appointmentYear, setAppointmentYear] = useState(2026);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Complementary Fields State (Directly filled by Admin when physical documents are in hand)
  const [nivelAcademico, setNivelAcademico] = useState<string>('Licenciado');
  const [nivelAcademicoOutro, setNivelAcademicoOutro] = useState<string>('');
  const [anosServico, setAnosServico] = useState<number>(6);
  const [classificacaoPedagogica, setClassificacaoPedagogica] = useState<string>('Com magistério e com IMNE completo');
  const [especialidadeCurso, setEspecialidadeCurso] = useState<string>('Gestão e Administração Escolar');
  const [regimeTrabalho, setRegimeTrabalho] = useState<string>('Efectivo');
  const [numeroMecanograficoOuNif, setNumeroMecanograficoOuNif] = useState<string>('');
  const [numeroCertificadoDiploma, setNumeroCertificadoDiploma] = useState<string>('');
  const [documentosConferidosPresencialmente, setDocumentosConferidosPresencialmente] = useState<boolean>(true);
  const [dataInicioFuncoes, setDataInicioFuncoes] = useState<string>(new Date().toISOString().split('T')[0]);
  const [approvalNotes, setApprovalNotes] = useState<string>('');

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [appToReject, setAppToReject] = useState<PendingApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Clear Homologados Modal State
  const [isClearHomologadosModalOpen, setIsClearHomologadosModalOpen] = useState(false);
  const [isClearingHomologados, setIsClearingHomologados] = useState(false);

  // Delete Individual Application State
  const [appToDelete, setAppToDelete] = useState<PendingApplication | null>(null);
  const [isDeletingApp, setIsDeletingApp] = useState(false);

  // Simulate director application
  const [showSimModal, setShowSimModal] = useState(false);
  const [simName, setSimName] = useState('');
  const [simSchool, setSimSchool] = useState('');
  const [simBi, setSimBi] = useState('');

  const handleClearAllHomologados = async () => {
    setIsClearingHomologados(true);
    try {
      const result = await clearAllHomologatedData();
      await loadApplications();
      const notify = showToast || alert;
      notify(result.message || 'Todos os dados homologados foram eliminados com sucesso!');
    } catch (e) {
      console.error('Erro ao limpar homologados:', e);
    } finally {
      setIsClearingHomologados(false);
      setIsClearHomologadosModalOpen(false);
    }
  };

  const handleConfirmDeleteApp = async () => {
    if (!appToDelete) return;
    setIsDeletingApp(true);
    try {
      await deleteApplication(appToDelete.id);
      await loadApplications();
      const notify = showToast || alert;
      notify(`Registo de "${appToDelete.fullName}" eliminado com sucesso.`);
    } catch (e) {
      console.error('Erro ao eliminar:', e);
    } finally {
      setIsDeletingApp(false);
      setAppToDelete(null);
    }
  };

  const loadApplications = async () => {
    try {
      const all = await syncApplicationsFromServer();
      // In DME Quêssua Admin portal, the Administrator oversees ALL applications across the entire municipality
      setApplications(all);
    } catch {
      const all = getPendingApplications();
      setApplications(all);
    }
  };

  useEffect(() => {
    loadApplications();
    const handleSync = () => loadApplications();
    window.addEventListener('sigre-data-synced', handleSync);
    const interval = setInterval(loadApplications, 3500);
    return () => {
      window.removeEventListener('sigre-data-synced', handleSync);
      clearInterval(interval);
    };
  }, []);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      // Status filter
      if (statusFilter !== 'todos' && app.status !== statusFilter) return false;

      // Role Scope filter
      if (roleScopeFilter !== 'todos') {
        if (roleScopeFilter === 'diretor' && app.type !== 'diretor') return false;
        if (roleScopeFilter === 'professor' && app.type !== 'professor') return false;
        if (roleScopeFilter === 'funcionario' && app.type !== 'funcionario') return false;
        if (roleScopeFilter === 'membro_dme' && app.type !== 'membro_dme' && app.scope !== 'administracao') return false;
      }

      // School filter
      if (selectedSchoolFilter !== 'todas' && app.schoolName !== selectedSchoolFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (app.fullName || '').toLowerCase().includes(q);
        const matchesBi = (app.biNumber || '').toLowerCase().includes(q);
        const matchesEmail = (app.email || '').toLowerCase().includes(q);
        const matchesSchool = (app.schoolName || '').toLowerCase().includes(q);
        const matchesPhone = (app.phone || '').toLowerCase().includes(q);
        const matchesRole = (app.roleRequested || '').toLowerCase().includes(q);
        return matchesName || matchesBi || matchesEmail || matchesSchool || matchesPhone || matchesRole;
      }

      return true;
    });
  }, [applications, statusFilter, roleScopeFilter, selectedSchoolFilter, searchQuery]);

  // Metric counts
  const counts = useMemo(() => {
    const total = applications.length;
    const pendentes = applications.filter((a) => a.status === 'pendente').length;
    const aprovados = applications.filter((a) => a.status === 'aprovado').length;
    const rejeitados = applications.filter((a) => a.status === 'rejeitado').length;
    const directores = applications.filter((a) => a.type === 'diretor').length;
    const professores = applications.filter((a) => a.type === 'professor').length;
    const funcionarios = applications.filter((a) => a.type === 'funcionario').length;
    const membrosDme = applications.filter((a) => a.type === 'membro_dme' || a.scope === 'administracao').length;
    const taxaAprovacao = total > 0 ? Math.round((aprovados / total) * 100) : 100;
    return {
      total,
      pendentes,
      aprovados,
      rejeitados,
      directores,
      professores,
      funcionarios,
      membrosDme,
      taxaAprovacao,
    };
  }, [applications]);

  // Open approve modal
  const handleOpenApprove = (app: PendingApplication) => {
    setAppToApprove(app);
    setTargetSchoolName(app.schoolName || (schools[0]?.name || ''));
    setDispatchNumber(`Despacho de Homologação nº ${Math.floor(100 + Math.random() * 900)}/DME/2026`);
    setAppointmentYear(2026);
    setApprovalNotes(`Homologado e empossado pela Direção Municipal da Educação.`);

    // Intelligent default values for complementary fields based on candidate or role
    const defaultNivel = app.nivelAcademico || (
      app.type === 'diretor' ? 'Licenciado' :
      app.type === 'professor' ? 'Licenciado' :
      '11.ª a 12.ª classe'
    );
    setNivelAcademico(defaultNivel);
    setNivelAcademicoOutro(app.nivelAcademicoOutro || '');
    setAnosServico(typeof app.anosServico === 'number' ? app.anosServico : (app.type === 'diretor' ? 6 : 3));
    setClassificacaoPedagogica(app.classificacaoPedagogica || 'Com magistério e com IMNE completo');
    setEspecialidadeCurso(app.especialidadeCurso || (app.type === 'diretor' ? 'Gestão e Administração Escolar' : (app.subject || 'Educação Básica')));
    setRegimeTrabalho(app.regimeTrabalho || 'Efectivo');
    setNumeroMecanograficoOuNif(app.numeroMecanograficoOuNif || '');
    setNumeroCertificadoDiploma(app.numeroCertificadoDiploma || `DIP-MED-${Math.floor(100000 + Math.random() * 900000)}/2026`);
    setDocumentosConferidosPresencialmente(app.documentosConferidosPresencialmente ?? true);
    setDataInicioFuncoes(app.dataInicioFuncoes || new Date().toISOString().split('T')[0]);

    setIsApproveModalOpen(true);
  };

  // Confirm approve
  const handleConfirmApprove = () => {
    if (!appToApprove) return;
    setIsSubmitting(true);

    const finalNivelAcademico = nivelAcademico === 'Outro' && nivelAcademicoOutro.trim()
      ? nivelAcademicoOutro.trim()
      : nivelAcademico;

    const compData: PendingApprovalComplementaryData = {
      nivelAcademico: finalNivelAcademico,
      nivelAcademicoOutro: nivelAcademicoOutro.trim(),
      anosServico: Number(anosServico) || 0,
      classificacaoPedagogica,
      especialidadeCurso: especialidadeCurso.trim() || 'Gestão e Administração Escolar',
      regimeTrabalho,
      numeroMecanograficoOuNif: numeroMecanograficoOuNif.trim(),
      numeroCertificadoDiploma: numeroCertificadoDiploma.trim(),
      documentosConferidosPresencialmente,
      dataInicioFuncoes,
      observacoesComplementares: `${dispatchNumber} - ${approvalNotes.trim() || 'Homologação e posse oficial concedidas.'}`,
    };

    setTimeout(() => {
      const res = approveApplication(appToApprove.id, adminName, compData);
      if (res.success && res.app) {
        const updated = res.app;
        loadApplications();

        // Add to global directors state only if School General Director
        if (onAddDirectorGlobal && updated.type === 'diretor') {
          const dirId = updated.userId || 'dir-' + Date.now();
          const targetSchool = schools.find((s) => s.name === (targetSchoolName || updated.schoolName)) || schools[0] || {
            id: 'sch-temp',
            name: targetSchoolName || updated.schoolName,
            directorName: updated.fullName,
            studentsCount: 450,
            teachersCount: 24,
            roomsCount: 12,
            studentsWithDocs: 350,
            studentsWithoutDocs: 100,
            performanceScore: 90,
            status: 'Ativo' as const,
          };
          const baseDossier = buildInitialDirectorDossier(targetSchool, 0);

          const fullRegistrationData: any = {
            ...baseDossier,
            id: `dir-dossier-${dirId}`,
            nomeCompleto: updated.fullName,
            biNif: updated.biNumber,
            telefone: updated.phone || '+244 923 000 000',
            emailPessoal: updated.email,
            nomeEscola: targetSchoolName || updated.schoolName,
            dataNomeacao: dataInicioFuncoes || `${appointmentYear}-02-01`,
            nivelAcademico: finalNivelAcademico,
            nivelAcademicoOutro: nivelAcademicoOutro.trim(),
            anosServicoEducacao: Number(anosServico) || 6,
            regime: regimeTrabalho,
            classificacaoPedagogica: classificacaoPedagogica,
            possuiValidacaoHabilitacoesCargo: documentosConferidosPresencialmente,
            historicoAlteracoes: [
              {
                id: `audit-${Date.now()}`,
                data: new Date().toISOString(),
                autor: adminName,
                acao: 'Homologação',
                detalhes: `Homologação ministerial/municipal pelo Administrador com conferência presencial de documentos em mãos. ${dispatchNumber}. Nível: ${finalNivelAcademico}, ${anosServico} anos de serviço, Regime: ${regimeTrabalho}.`,
              },
              ...(baseDossier.historicoAlteracoes || []),
            ],
          };

          const newDirector: AdminDirector = {
            id: dirId,
            name: updated.fullName,
            schoolName: targetSchoolName || updated.schoolName,
            phone: updated.phone || '+244 923 000 000',
            email: updated.email,
            appointmentYear: appointmentYear,
            status: 'Ativo',
            performanceRating: 95,
            teachersCount: targetSchool.teachersCount || 24,
            studentsCount: targetSchool.studentsCount || 450,
            location: 'Quêssua, Malanje',
            registrationData: fullRegistrationData,
          };
          onAddDirectorGlobal(newDirector);
          saveDirector(fullRegistrationData, adminName);
        }

        // Add to global teachers state if Teacher
        if (onAddTeacherGlobal && updated.type === 'professor') {
          const teacherEntry: any = {
            id: updated.userId || updated.id,
            name: updated.fullName,
            schoolName: targetSchoolName || updated.schoolName || 'Complexo Escolar do Quêssua',
            subject: updated.subject || 'Língua Portuguesa',
            classAssigned: updated.gradeClass || '4ª Classe',
            gradeClass: updated.gradeClass || '4ª Classe',
            room: 'Sala 01',
            turma: 'Turma A',
            shift: 'Manhã',
            directorName: adminName,
            status: 'Ativo',
            email: updated.email,
            phone: updated.phone,
            qualification: compData?.nivelAcademico || 'Licenciado',
            gender: 'M',
          };
          onAddTeacherGlobal(teacherEntry);
        }

        const notify = showToast || alert;
        notify(`Registo de "${updated.fullName}" (${updated.roleRequested || 'Quadros DME'}) homologado com sucesso pelo Administrador Central (DME)! Acesso liberado.`);
      }
      setIsSubmitting(false);
      setIsApproveModalOpen(false);
      setAppToApprove(null);
    }, 400);
  };

  // Open reject modal
  const handleOpenReject = (app: PendingApplication) => {
    setAppToReject(app);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  // Confirm reject
  const handleConfirmReject = () => {
    if (!appToReject || !rejectReason.trim()) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const res = rejectApplication(appToReject.id, rejectReason.trim(), adminName);
      if (res.success) {
        loadApplications();
        const notify = showToast || alert;
        notify(`Inscrição de ${appToReject.fullName} indeferida.`);
      }
      setIsSubmitting(false);
      setIsRejectModalOpen(false);
      setAppToReject(null);
    }, 400);
  };

  // Simulate new director registration
  const handleSimulateDirector = async () => {
    if (!simName.trim()) return;
    const targetSchool = simSchool.trim() || (schools[0]?.name || 'Escola Primária nº 402');
    const newId = 'app-sim-dir-' + Date.now();
    const newApp: PendingApplication = {
      id: newId,
      userId: 'usr-sim-dir-' + Date.now(),
      type: 'diretor',
      roleRequested: 'Diretor(a) Geral',
      fullName: simName.trim(),
      email: `${simName.toLowerCase().replace(/\s+/g, '.')}@ucore.edu.ao`,
      phone: '+244 923 888 999',
      biNumber: simBi.trim() || '00' + Math.floor(1000000 + Math.random() * 9000000) + 'LA042',
      schoolName: targetSchool,
      municipality: 'Quêssua (Malanje)',
      targetApproverRole: 'admin',
      targetApproverEmail: OFFICIAL_DME_ADMIN_EMAIL,
      approverDirectorName: `Director Municipal da Educação (${OFFICIAL_DME_ADMIN_EMAIL})`,
      status: 'pendente',
      isPreRegistered: true,
      preRegisteredDetails: 'Nomeação via Direção Municipal da Educação. Aguarda homologação formal no portal.',
      createdAt: new Date().toLocaleString('pt-AO'),
      notes: 'Solicitação de acesso institucional como Diretor da Escola.',
    };

    await savePendingApplicationAsync(newApp);
    await loadApplications();
    setShowSimModal(false);
    setSimName('');
    setSimBi('');
    const notify = showToast || alert;
    notify(`Inscrição de Diretor(a) "${newApp.fullName}" submetida e sincronizada na nuvem com sucesso!`);
  };

  return (
    <div id="admin-approvals-page" className="w-full min-h-screen bg-[#f8f9fb]">
      {/* Hero Header with refined typography */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        customTitle="Central de Homologações & Credenciação (DME)"
        customSubtitle="Validação de despachos e homologação ministerial de todos os Quadros da Educação de Quêssua (Membros da DME, Directores, Professores e Funcionários)."
        badge="Administrador Central (DME)"
        breadcrumbs={[
          { label: 'Início', onClick: () => window.location.reload() },
          { label: 'Administração Municipal' },
          { label: 'Homologações & Despachos' },
        ]}
        isLoggedIn={isLoggedIn}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        
        {/* Executive Summary & Protocol Strip */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs mb-6 overflow-hidden">
          <div className="p-5 sm:p-6 bg-transparent text-slate-900">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold tracking-wide border border-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Malanje • Quêssua • Homologação Central (DME)</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Nuvem Conectada • dmedoquessua@gmail.com
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Homologação Municipal de Quadros & Efectividade
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                  Inscrições de todos os quadros municipais (Membros da Direção Municipal, Directores Gerais de Escola, Professores e Funcionários de Quêssua) recebidas e sincronizadas em tempo real a partir de qualquer dispositivo móvel ou computador.
                </p>
              </div>

              {/* Quick Actions in Header */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    setIsSyncing(true);
                    await loadApplications();
                    setTimeout(() => setIsSyncing(false), 500);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  title="Sincronizar em tempo real com a base de dados central"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{isSyncing ? 'A Sincronizar...' : 'Sincronizar Nuvem'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsClearHomologadosModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Eliminar todos os registos e credenciais já homologados no sistema"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Apagar Homologados</span>
                  {counts.aprovados > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-200/80 text-rose-900 text-[10px] font-black">
                      {counts.aprovados}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Segmented Status Tab Navigation */}
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setStatusFilter('pendente')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  statusFilter === 'pendente'
                    ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-500/20'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-slate-950" />
                <span>Pendentes de Homologação</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  statusFilter === 'pendente' ? 'bg-slate-950 text-amber-400' : 'bg-amber-100 text-amber-900'
                }`}>
                  {counts.pendentes}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('aprovado')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  statusFilter === 'aprovado'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Homologados & Em Exercício</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  statusFilter === 'aprovado' ? 'bg-white text-emerald-800' : 'bg-emerald-50 text-emerald-800'
                }`}>
                  {counts.aprovados}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('rejeitado')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  statusFilter === 'rejeitado'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Indeferidos</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  statusFilter === 'rejeitado' ? 'bg-white text-rose-800' : 'bg-rose-50 text-rose-800'
                }`}>
                  {counts.rejeitados}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('todos')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  statusFilter === 'todos'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <span>Todos os Registos</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  statusFilter === 'todos' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                }`}>
                  {counts.total}
                </span>
              </button>
            </div>

            {/* Quick KPI stats inline */}
            <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-600 border-l border-slate-200/80 pl-4">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Taxa de Conformidade:</span>
                <span className="font-bold text-emerald-700">{counts.taxaAprovacao}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Sessão:</span>
                <span className="font-bold text-slate-800">DME 2026</span>
              </div>
            </div>
          </div>
        </section>

        {/* Role Category Tabs (Toda a Rede Municipal, Directores, Professores, Funcionários, Membros DME) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin">
          <button
            type="button"
            onClick={() => setRoleScopeFilter('todos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs ${
              roleScopeFilter === 'todos'
                ? 'bg-[#002133] text-white ring-2 ring-[#002133]/20'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <span>Toda a Rede Municipal</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              roleScopeFilter === 'todos' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {counts.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleScopeFilter('diretor')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs ${
              roleScopeFilter === 'diretor'
                ? 'bg-[#002133] text-white ring-2 ring-[#002133]/20'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Directores Escolares</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              roleScopeFilter === 'diretor' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {counts.directores}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleScopeFilter('professor')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs ${
              roleScopeFilter === 'professor'
                ? 'bg-[#002133] text-white ring-2 ring-[#002133]/20'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Professores & Docentes</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              roleScopeFilter === 'professor' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {counts.professores}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleScopeFilter('funcionario')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs ${
              roleScopeFilter === 'funcionario'
                ? 'bg-[#002133] text-white ring-2 ring-[#002133]/20'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
            <span>Funcionários & Secretaria</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              roleScopeFilter === 'funcionario' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {counts.funcionarios}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleScopeFilter('membro_dme')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs ${
              roleScopeFilter === 'membro_dme'
                ? 'bg-[#002133] text-white ring-2 ring-[#002133]/20'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>Membros DME</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              roleScopeFilter === 'membro_dme' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {counts.membrosDme}
            </span>
          </button>
        </div>

        {/* Filter & View Switcher Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por Diretor, escola, BI/NIF, e-mail ou contacto..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002133]/20 focus:border-[#002133] transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Limpar pesquisa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* School Filter Dropdown */}
            <div className="min-w-[220px]">
              <div className="relative">
                <select
                  value={selectedSchoolFilter}
                  onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#002133]/20 cursor-pointer appearance-none"
                >
                  <option value="todas">Todas as Escolas ({schools.length})</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border border-slate-200 bg-slate-50 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Modo Dossiê Detalhado"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dossiês</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Modo Atas & Despachos"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Atas</span>
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredApps.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {statusFilter === 'aprovado'
                ? 'Sem registos homologados no sistema'
                : 'Nenhum registo de homologação encontrado'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {statusFilter === 'aprovado'
                ? 'Todos os dados homologados foram eliminados da base municipal ou não existem deliberações ativas no momento.'
                : 'Não existem pedidos com os filtros ativos. Tente selecionar outro estado ou limpar o campo de busca.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('todos');
                setSelectedSchoolFilter('todas');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Limpar Filtros de Busca
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards View - Clean, High Scannability */
          <div className="space-y-4">
            {filteredApps.map((app) => {
              const isPending = app.status === 'pendente';
              const isApproved = app.status === 'aprovado';
              const isRejected = app.status === 'rejeitado';

              return (
                <article
                  key={app.id}
                  className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all duration-200 shadow-xs ${
                    isPending
                      ? 'border-amber-200/80 hover:border-amber-400 hover:shadow-md'
                      : isApproved
                      ? 'border-slate-200 hover:border-emerald-300 hover:shadow-xs'
                      : 'border-slate-200/70 opacity-80'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    
                    {/* Candidate Identity Column */}
                    <div className="flex items-start gap-4">
                      {/* Avatar with Status Pin */}
                      <div className="relative shrink-0">
                        <div className="w-13 h-13 rounded-2xl bg-[#002133] text-white font-bold text-base flex items-center justify-center shadow-xs">
                          {app.fullName.charAt(0)}
                        </div>
                        {isPending && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white ring-1 ring-amber-300 animate-pulse" />
                        )}
                        {isApproved && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                        )}
                        {isRejected && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white" />
                        )}
                      </div>

                      <div className="space-y-1">
                        {/* Name, Role & Status Chips */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                            {app.fullName}
                          </h3>

                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200/80">
                            {app.roleRequested || 'Diretor Geral'}
                          </span>

                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Aguardando Despacho
                            </span>
                          )}

                          {isApproved && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Homologado Oficialmente
                            </span>
                          )}

                          {isRejected && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Indeferido
                            </span>
                          )}
                        </div>

                        {/* Institution, BI & Contacts Grid */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-1">
                          <span className="flex items-center gap-1.5 font-bold text-slate-900">
                            <Building2 className="w-3.5 h-3.5 text-[#f75142]" />
                            {app.schoolName}
                          </span>
                          <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                            BI: {app.biNumber}
                          </span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {app.email}
                          </span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {app.phone}
                          </span>
                        </div>

                        {/* Origin of Candidate */}
                        <div className="pt-2 flex items-center gap-2">
                          {app.isPreRegistered ? (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/80">
                              <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{app.preRegisteredDetails || 'Consta na portaria prévia da Direção Municipal da Educação.'}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                              <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>Candidatura externa. Requer conferência do despacho físico de nomeação.</span>
                            </div>
                          )}
                        </div>

                        {/* Complementary Qualifications Stats (if available) */}
                        {(app.nivelAcademico || typeof app.anosServico === 'number' || app.regimeTrabalho || app.documentosConferidosPresencialmente) && (
                          <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px]">
                            {app.nivelAcademico && (
                              <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-md font-medium">
                                <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                                <span>{app.nivelAcademico}</span>
                              </span>
                            )}
                            {typeof app.anosServico === 'number' && (
                              <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-md font-medium">
                                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                                <span>{app.anosServico} {app.anosServico === 1 ? 'ano' : 'anos'} serviço</span>
                              </span>
                            )}
                            {app.regimeTrabalho && (
                              <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-md font-medium">
                                <span>Regime: {app.regimeTrabalho}</span>
                              </span>
                            )}
                            {app.documentosConferidosPresencialmente && (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-md font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Docs conferidos</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Approval signature details */}
                        {isApproved && (
                          <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Despacho assinado por <strong>{app.approvedBy}</strong> em {app.approvedAt || '11/09/2026'}</span>
                          </div>
                        )}
                        {isRejected && app.rejectionReason && (
                          <div className="text-[11px] text-rose-800 bg-rose-50/90 p-2 rounded-lg border border-rose-200 mt-2">
                            <strong>Motivo do indeferimento:</strong> {app.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Group */}
                    <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0 pt-2 lg:pt-0">
                      <button
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ver Dossiê</span>
                      </button>

                      {isApproved && (
                        <button
                          type="button"
                          onClick={() => setAppToDelete(app)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Eliminar este registo homologado"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Eliminar Homologação</span>
                        </button>
                      )}

                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenReject(app)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Indeferir</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenApprove(app)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#002133] hover:bg-[#001726] text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Homologar Diretor(a)</span>
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Table View - Clean Municipal Ledger / Livro de Atas */
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th scope="col" className="px-4 py-3.5">Candidato / Cargo</th>
                    <th scope="col" className="px-4 py-3.5">Escola Afeta</th>
                    <th scope="col" className="px-4 py-3.5">Identificação</th>
                    <th scope="col" className="px-4 py-3.5">Habilitações</th>
                    <th scope="col" className="px-4 py-3.5">Estado do Pedido</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApps.map((app) => {
                    const isPending = app.status === 'pendente';
                    const isApproved = app.status === 'aprovado';
                    const isRejected = app.status === 'rejeitado';

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#002133] text-white font-bold flex items-center justify-center shrink-0">
                              {app.fullName.charAt(0)}
                            </div>
                            <div>
                              <strong className="block text-slate-900 font-bold">{app.fullName}</strong>
                              <span className="text-[10px] text-slate-500">{app.roleRequested || 'Diretor(a) Geral'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          {app.schoolName}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-slate-700 font-medium">{app.biNumber}</span>
                          <span className="block text-[10px] text-slate-400">{app.phone}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-slate-800 font-medium">{app.nivelAcademico || 'Licenciado'}</span>
                          <span className="block text-[10px] text-slate-500">{app.regimeTrabalho || 'Efectivo'}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              Pendente
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              Homologado
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                              <XCircle className="w-2.5 h-2.5 text-rose-600" />
                              Indeferido
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedApp(app)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                              title="Ver Ficha"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => setAppToDelete(app)}
                                className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                                title="Eliminar Homologação"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleOpenApprove(app)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#002133] hover:bg-slate-900 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                title="Homologar"
                              >
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Homologar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* APPROVE MODAL - Refined Structure */}
      {isApproveModalOpen && appToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Homologação e Enquadramento de Direção</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Administração Municipal
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Validação oficial de mandato e dados cadastrais para {appToApprove.fullName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="mt-4 space-y-4 overflow-y-auto pr-1 text-xs">
              {/* Candidate Quick Summary */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">Candidato(a)</span>
                    <strong className="text-slate-900 text-xs">{appToApprove.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">Nº do BI</span>
                    <span className="font-mono text-slate-800 text-xs font-semibold">{appToApprove.biNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">Cargo Solicitado</span>
                    <span className="text-slate-800 text-xs font-medium">{appToApprove.roleRequested || 'Diretor(a) Geral'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">Contacto</span>
                    <span className="text-slate-800 text-xs">{appToApprove.phone}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 1: Nomeação Institucional & Escola */}
              <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 space-y-3">
                <div className="flex items-center gap-2 font-bold text-blue-900 text-xs">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span>1. Nomeação Institucional e Afetação Escolar</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Escola Afeta ao Mandato
                  </label>
                  <select
                    value={targetSchoolName}
                    onChange={(e) => setTargetSchoolName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#002133]"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nº do Despacho de Nomeação / Portaria
                    </label>
                    <input
                      type="text"
                      value={dispatchNumber}
                      onChange={(e) => setDispatchNumber(e.target.value)}
                      placeholder="Ex.: Despacho nº 104/DME/2026"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#002133]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ano de Posse / Entrada em Exercício
                    </label>
                    <input
                      type="number"
                      value={appointmentYear}
                      onChange={(e) => setAppointmentYear(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#002133]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Dados Complementares de Enquadramento */}
              <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                    <GraduationCap className="w-4 h-4 text-amber-700" />
                    <span>2. Dados Complementares de Enquadramento (Documentos em Mãos)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                    Conferência Oficial
                  </span>
                </div>

                <p className="text-[11px] text-amber-900/80">
                  Preencha os campos com os documentos físicos originais apresentados pelo candidato para registo cadastral imediato e emissão de credenciais no SIGE.
                </p>

                {/* Nível Académico & Outro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nível Académico / Habilitações Oficiais (SIGE)
                    </label>
                    <select
                      value={nivelAcademico}
                      onChange={(e) => setNivelAcademico(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#002133]"
                    >
                      <option value="Licenciado">Licenciado</option>
                      <option value="Bacharelato">Bacharelato</option>
                      <option value="Pós-licenciado (mestrado / doutoramento)">Pós-licenciado (Mestrado / Doutoramento)</option>
                      <option value="11.ª a 12.ª classe">11.ª a 12.ª classe (Técnico Médio / Magistério)</option>
                      <option value="9.ª a 10.ª classe">9.ª a 10.ª classe</option>
                      <option value="7.ª a 8.ª classe">7.ª a 8.ª classe</option>
                      <option value="Ensino Primário">Ensino Primário</option>
                      <option value="Outro">Outro nível</option>
                    </select>
                  </div>

                  {nivelAcademico === 'Outro' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Especifique o Nível Académico
                      </label>
                      <input
                        type="text"
                        value={nivelAcademicoOutro}
                        onChange={(e) => setNivelAcademicoOutro(e.target.value)}
                        placeholder="Ex.: Especialização Internacional"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#002133]"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Regime de Trabalho / Vínculo
                      </label>
                      <select
                        value={regimeTrabalho}
                        onChange={(e) => setRegimeTrabalho(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#002133]"
                      >
                        <option value="Efectivo">Efectivo (Quadro Definitivo MED)</option>
                        <option value="Em comissão de serviço">Em comissão de serviço</option>
                        <option value="Contratado">Contratado a termo</option>
                        <option value="Colaborador">Colaborador</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Tempo de Serviço na Educação com atalhos */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Tempo de Serviço na Educação (Anos)
                    </label>
                    <div className="flex items-center gap-1">
                      {[0, 2, 5, 10, 15].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAnosServico(preset)}
                          className={`px-2 py-0.5 text-[10px] rounded-md font-semibold transition-colors cursor-pointer ${
                            anosServico === preset
                              ? 'bg-amber-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {preset}a
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAnosServico(Math.max(0, anosServico - 1))}
                      className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={anosServico}
                      onChange={(e) => setAnosServico(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-800 focus:ring-2 focus:ring-[#002133]"
                    />
                    <button
                      type="button"
                      onClick={() => setAnosServico(anosServico + 1)}
                      className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Classificação Pedagógica & Especialidade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Classificação / Formação Pedagógica
                    </label>
                    <select
                      value={classificacaoPedagogica}
                      onChange={(e) => setClassificacaoPedagogica(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#002133]"
                    >
                      <option value="Com magistério e com IMNE completo">Com magistério e com IMNE completo</option>
                      <option value="Com magistério e sem IMNE">Com magistério e sem IMNE</option>
                      <option value="Sem magistério e com formação pedagógica">Sem magistério e com formação pedagógica</option>
                      <option value="Sem magistério e sem formação pedagógica">Sem magistério e sem formação pedagógica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Especialidade / Curso de Formação
                    </label>
                    <input
                      type="text"
                      value={especialidadeCurso}
                      onChange={(e) => setEspecialidadeCurso(e.target.value)}
                      placeholder="Ex.: Gestão e Administração Escolar"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#002133]"
                    />
                  </div>
                </div>

                {/* Nº Diploma & Nº Mecanográfico */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nº do Certificado / Diploma de Habilitações
                    </label>
                    <input
                      type="text"
                      value={numeroCertificadoDiploma}
                      onChange={(e) => setNumeroCertificadoDiploma(e.target.value)}
                      placeholder="Ex.: DIP-MED-2018/88921"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-[#002133]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nº Mecanográfico (Folha) ou NIF
                    </label>
                    <input
                      type="text"
                      value={numeroMecanograficoOuNif}
                      onChange={(e) => setNumeroMecanograficoOuNif(e.target.value)}
                      placeholder="Ex.: MEC-008921 ou NIF oficial"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-[#002133]"
                    />
                  </div>
                </div>

                {/* Data de Início e Confirmação Presencial */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Data Oficial de Início de Funções
                    </label>
                    <input
                      type="date"
                      value={dataInicioFuncoes}
                      onChange={(e) => setDataInicioFuncoes(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#002133]"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-2 p-2.5 bg-white border border-amber-200/80 rounded-xl cursor-pointer hover:bg-amber-50/50 transition-colors w-full">
                      <input
                        type="checkbox"
                        checked={documentosConferidosPresencialmente}
                        onChange={(e) => setDocumentosConferidosPresencialmente(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 border-slate-300"
                      />
                      <span className="text-xs font-semibold text-slate-800 select-none">
                        Documentos físicos originais conferidos presencialmente
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Despacho e Observações */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Parecer / Observações do Administrador
                </label>
                <textarea
                  rows={2}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Ex.: Processo conferido de acordo com o estatuto dos agentes da Educação. Apto para início de exercício funcional."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#002133]"
                />
              </div>

              {/* Information Alert */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  Ao confirmar a homologação, o status do Diretor muda para <strong>Ativo</strong>. O seu dossiê completo de direção é gerado com os dados acadêmicos e pedagógicos informados, liberando o acesso total à gestão escolar no Sigre.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmApprove}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>A homologar dados...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar Homologação com Documentos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {isRejectModalOpen && appToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <UserX className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Indeferir Homologação</h3>
                  <p className="text-xs text-slate-500">{appToReject.fullName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600">
                Indique a fundamentação legal para a recusa de homologação deste Diretor:
              </p>

              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex.: Despacho de nomeação não verificado na Direção Municipal; vaga de direção já provida por titular; pendência disciplinar..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim() || isSubmitting}
                onClick={handleConfirmReject}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'A registar...' : 'Confirmar Indeferimento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL (Dossiê Institucional) */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-amber-300" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Dossiê Institucional do Candidato</h3>
                  <p className="text-xs text-slate-500">Registo Oficial nº {selectedApp.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="p-3.5 bg-slate-50 rounded-xl space-y-2.5 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Nome Completo:</span>
                  <span className="font-bold text-slate-900 text-right">{selectedApp.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Cargo Pretendido:</span>
                  <span className="font-bold text-slate-900 text-right">{selectedApp.roleRequested || 'Diretor Geral'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Nº do BI / NIF:</span>
                  <span className="font-mono font-bold text-slate-900 text-right">{selectedApp.biNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Escola Afeta:</span>
                  <span className="font-bold text-slate-900 text-right">{selectedApp.schoolName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">E-mail:</span>
                  <span className="text-slate-900 text-right">{selectedApp.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Telefone:</span>
                  <span className="text-slate-900 text-right">{selectedApp.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Data de Submissão:</span>
                  <span className="text-slate-900 text-right">{selectedApp.createdAt}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Situação Atual:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold capitalize text-[11px] ${
                    selectedApp.status === 'aprovado'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : selectedApp.status === 'pendente'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {selectedApp.status === 'aprovado' ? 'Homologado' : selectedApp.status}
                  </span>
                </div>
              </div>

              {/* Complementary data if available */}
              {(selectedApp.nivelAcademico || typeof selectedApp.anosServico === 'number' || selectedApp.regimeTrabalho) && (
                <div className="p-3.5 bg-amber-50/70 rounded-xl space-y-2 border border-amber-200 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                    <GraduationCap className="w-4 h-4 text-amber-700" />
                    <span>Dados de Enquadramento Oficial (Conferidos pelo Administrador)</span>
                  </div>
                  {selectedApp.nivelAcademico && (
                    <div className="flex justify-between">
                      <span className="text-amber-800 font-medium">Nível Académico:</span>
                      <strong className="text-amber-950">{selectedApp.nivelAcademico}</strong>
                    </div>
                  )}
                  {typeof selectedApp.anosServico === 'number' && (
                    <div className="flex justify-between">
                      <span className="text-amber-800 font-medium">Tempo de Serviço:</span>
                      <strong className="text-amber-950">{selectedApp.anosServico} anos</strong>
                    </div>
                  )}
                  {selectedApp.regimeTrabalho && (
                    <div className="flex justify-between">
                      <span className="text-amber-800 font-medium">Regime de Trabalho:</span>
                      <strong className="text-amber-950">{selectedApp.regimeTrabalho}</strong>
                    </div>
                  )}
                  {selectedApp.classificacaoPedagogica && (
                    <div className="flex justify-between">
                      <span className="text-amber-800 font-medium">Classif. Pedagógica:</span>
                      <span className="text-amber-950 font-medium text-right max-w-[220px]">{selectedApp.classificacaoPedagogica}</span>
                    </div>
                  )}
                  {selectedApp.especialidadeCurso && (
                    <div className="flex justify-between">
                      <span className="text-amber-800 font-medium">Especialidade / Curso:</span>
                      <span className="text-amber-950 font-medium text-right max-w-[220px]">{selectedApp.especialidadeCurso}</span>
                    </div>
                  )}
                  {selectedApp.numeroCertificadoDiploma && (
                    <div className="flex justify-between">
                      <span className="text-amber-800 font-medium">Diploma / Certificado:</span>
                      <span className="font-mono text-amber-950 font-semibold">{selectedApp.numeroCertificadoDiploma}</span>
                    </div>
                  )}
                  {selectedApp.numeroMecanograficoOuNif && (
                    <div className="flex justify-between">
                      <span className="text-amber-800 font-medium">Mecanográfico / NIF:</span>
                      <span className="font-mono text-amber-950 font-semibold">{selectedApp.numeroMecanograficoOuNif}</span>
                    </div>
                  )}
                  {selectedApp.documentosConferidosPresencialmente && (
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold pt-1 border-t border-amber-200/60">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Documentação física original conferida em mãos pela Administração</span>
                    </div>
                  )}
                </div>
              )}

              {selectedApp.notes && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-800 block mb-1">Notas e Despacho:</span>
                  <p className="text-slate-600 leading-relaxed">{selectedApp.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div>
                {selectedApp.status === 'pendente' && (
                  <button
                    type="button"
                    onClick={() => {
                      const app = selectedApp;
                      setSelectedApp(null);
                      handleOpenApprove(app);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Homologar com Documentos</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATE MODAL */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Simular Registo de Diretor</h3>
                  <p className="text-xs text-slate-500">Cria um pedido de homologação para teste</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Diretor
                </label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  placeholder="Ex: Dr. Bernardo Catumbela"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#002133]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Escola para a Direção
                </label>
                <select
                  value={simSchool}
                  onChange={(e) => setSimSchool(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="">Selecione uma escola</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nº do BI (opcional)
                </label>
                <input
                  type="text"
                  value={simBi}
                  onChange={(e) => setSimBi(e.target.value)}
                  placeholder="Ex: 007812903LA021"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!simName.trim()}
                onClick={handleSimulateDirector}
                className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Criar Inscrição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL HOMOLOGADOS CONFIRMATION MODAL */}
      {isClearHomologadosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Apagar Dados Homologados</h3>
                  <p className="text-xs text-rose-600 font-medium">Acção irreversível de limpeza central</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClearHomologadosModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tem a certeza que deseja <strong>apagar todos os dados já homologados</strong> no sistema?
              </p>
              
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-950">
                  <ShieldCheck className="w-4 h-4 text-rose-700" />
                  <span>Elementos que serão eliminados:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800">
                  <li>Todas as candidaturas aprovadas / homologadas ({counts.aprovados} registo(s)).</li>
                  <li>Directores e professores homologados registados na base central.</li>
                  <li>Declarações e registos com estatuto homologado na rede DME Quêssua.</li>
                </ul>
              </div>

              <p className="text-[11px] text-slate-400">
                Os pedidos ainda <em>pendentes</em> de avaliação serão preservados intactos.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isClearingHomologados}
                onClick={() => setIsClearHomologadosModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isClearingHomologados}
                onClick={handleClearAllHomologados}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isClearingHomologados ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>A eliminar...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Todos os Homologados</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE INDIVIDUAL APPLICATION MODAL */}
      {appToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Eliminar Registo Homologado</h3>
                  <p className="text-xs text-slate-500">Remover homologação de quadro</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAppToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Deseja eliminar a homologação de <strong>{appToDelete.fullName}</strong> ({appToDelete.roleRequested || 'Quadro'}) afeto(a) à escola <strong>{appToDelete.schoolName}</strong>?
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div><span className="text-slate-400">BI:</span> <strong className="text-slate-800 font-mono">{appToDelete.biNumber}</strong></div>
                <div><span className="text-slate-400">Homologado por:</span> <span className="text-slate-700">{appToDelete.approvedBy || 'DME'}</span></div>
                {appToDelete.approvedAt && <div><span className="text-slate-400">Data:</span> <span className="text-slate-700">{appToDelete.approvedAt}</span></div>}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingApp}
                onClick={() => setAppToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingApp}
                onClick={handleConfirmDeleteApp}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isDeletingApp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>A eliminar...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Registo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
