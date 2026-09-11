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
  GraduationCap,
  Briefcase,
  BookOpen
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
  savePendingApplication
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
  showToast?: (msg: string) => void;
}

export const AdminApprovalsPage: React.FC<AdminApprovalsPageProps> = ({
  onOpenGetStarted,
  isLoggedIn = true,
  adminName = 'DME Quêssua (Administrador Central)',
  directors = [],
  schools = [],
  onAddDirectorGlobal,
  showToast,
}) => {
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('todas');
  const [selectedApp, setSelectedApp] = useState<PendingApplication | null>(null);

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

  // Simulate director application
  const [showSimModal, setShowSimModal] = useState(false);
  const [simName, setSimName] = useState('');
  const [simSchool, setSimSchool] = useState('');
  const [simBi, setSimBi] = useState('');

  const loadApplications = () => {
    const all = getPendingApplications();
    // In admin approval center, show all applications where target is admin (or director-level registrations)
    const adminApps = all.filter((a) => a.targetApproverRole === 'admin' || a.type === 'diretor');
    setApplications(adminApps);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      // Status filter
      if (statusFilter !== 'todos' && app.status !== statusFilter) return false;

      // School filter
      if (selectedSchoolFilter !== 'todas' && app.schoolName !== selectedSchoolFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = app.fullName.toLowerCase().includes(q);
        const matchesBi = app.biNumber.toLowerCase().includes(q);
        const matchesEmail = app.email.toLowerCase().includes(q);
        const matchesSchool = app.schoolName?.toLowerCase().includes(q);
        const matchesPhone = app.phone.toLowerCase().includes(q);
        return matchesName || matchesBi || matchesEmail || matchesSchool || matchesPhone;
      }

      return true;
    });
  }, [applications, statusFilter, selectedSchoolFilter, searchQuery]);

  // Metric counts
  const counts = useMemo(() => {
    return {
      total: applications.length,
      pendentes: applications.filter((a) => a.status === 'pendente').length,
      aprovados: applications.filter((a) => a.status === 'aprovado').length,
      rejeitados: applications.filter((a) => a.status === 'rejeitado').length,
    };
  }, [applications]);

  // Open approve modal
  const handleOpenApprove = (app: PendingApplication) => {
    setAppToApprove(app);
    setTargetSchoolName(app.schoolName || (schools[0]?.name || 'Escola Modelo Central do Quêssua'));
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

        // Add to global directors state if director
        if (onAddDirectorGlobal) {
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

        const notify = showToast || alert;
        notify(`Registo de "${updated.fullName}" homologado com sucesso com dados complementares no uCore! Acesso liberado.`);
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
  const handleSimulateDirector = () => {
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
      status: 'pendente',
      isPreRegistered: true,
      preRegisteredDetails: 'Nomeação via Direção Municipal da Educação. Aguarda homologação formal no portal.',
      createdAt: new Date().toLocaleString('pt-AO'),
      notes: 'Solicitação de acesso institucional como Diretor da Escola.',
    };

    savePendingApplication(newApp);
    loadApplications();
    setShowSimModal(false);
    setSimName('');
    setSimBi('');
    const notify = showToast || alert;
    notify(`Inscrição de Diretor(a) "${newApp.fullName}" submetida para homologação!`);
  };

  return (
    <div id="admin-approvals-page" className="w-full min-h-screen bg-[#f8f9fb]">
      {/* Hero Header */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        customTitle="Central de Homologação & Inscrições"
        customSubtitle="Validação central de Diretores de Escola, aprovação de novas contas institucionais e permissões de acesso ao uCore."
        badge="Administração Municipal"
        breadcrumbs={[
          { label: 'Início', onClick: () => window.location.reload() },
          { label: 'Administração' },
          { label: 'Homologação de Inscrições' },
        ]}
        isLoggedIn={isLoggedIn}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6 relative z-10">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Pendentes */}
          <div 
            onClick={() => setStatusFilter('pendente')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'pendente' 
                ? 'bg-amber-500/10 border-amber-500 shadow-sm ring-2 ring-amber-500/20' 
                : 'bg-white border-slate-200/80 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Diretores Pendentes
              </span>
              <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                <Clock className="w-4 h-4 animate-pulse" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{counts.pendentes}</span>
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Aguardam Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Candidatos a Diretor em análise</p>
          </div>

          {/* Homologados */}
          <div 
            onClick={() => setStatusFilter('aprovado')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'aprovado' 
                ? 'bg-emerald-500/10 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20' 
                : 'bg-white border-slate-200/80 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Homologados Ativos
              </span>
              <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{counts.aprovados}</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Acesso liberado
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Diretores com login e escola ativa</p>
          </div>

          {/* Indeferidos */}
          <div 
            onClick={() => setStatusFilter('rejeitado')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'rejeitado' 
                ? 'bg-rose-500/10 border-rose-500 shadow-sm ring-2 ring-rose-500/20' 
                : 'bg-white border-slate-200/80 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Indeferidos
              </span>
              <span className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
                <XCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{counts.rejeitados}</span>
              <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                Recusados
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Registos não aprovados pelo Admin</p>
          </div>

          {/* Total Histórico */}
          <div 
            onClick={() => setStatusFilter('todos')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'todos' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                : 'bg-white border-slate-200/80 hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'todos' ? 'text-slate-300' : 'text-slate-500'}`}>
                Total de Solicitações
              </span>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center ${statusFilter === 'todos' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-3xl font-black ${statusFilter === 'todos' ? 'text-white' : 'text-slate-900'}`}>{counts.total}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusFilter === 'todos' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                Geral
              </span>
            </div>
            <p className={`text-xs mt-1 ${statusFilter === 'todos' ? 'text-slate-400' : 'text-slate-500'}`}>Volume total processado pelo Admin</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por Diretor(a), escola, BI, email ou telefone..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f75142]/30 focus:border-[#f75142] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* School Filter Dropdown */}
            <div className="min-w-[200px]">
              <select
                value={selectedSchoolFilter}
                onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#f75142]"
              >
                <option value="todas">Todas as Escolas</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadApplications}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
                title="Atualizar lista"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowSimModal(true)}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Simular Registo de Diretor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApps.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Nenhum pedido de homologação encontrado</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Não existem candidaturas de Diretor pendentes com os filtros atuais.
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
                Limpar Filtros
              </button>
            </div>
          ) : (
            filteredApps.map((app) => {
              const isPending = app.status === 'pendente';
              const isApproved = app.status === 'aprovado';
              const isRejected = app.status === 'rejeitado';

              return (
                <div
                  key={app.id}
                  className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all shadow-xs ${
                    isPending
                      ? 'border-amber-200/90 hover:border-amber-400 hover:shadow-md'
                      : isApproved
                      ? 'border-slate-200/80 hover:border-emerald-300'
                      : 'border-slate-200/80 opacity-75'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left: Avatar & Candidate Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#002133] flex items-center justify-center text-white font-black text-sm shrink-0">
                        {app.fullName.charAt(0)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-base font-bold text-slate-950">{app.fullName}</h4>
                          
                          {/* Role Tag */}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                            {app.roleRequested || 'Diretor de Escola'}
                          </span>

                          {/* Status Tag */}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Aguardando Homologação do Admin
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Homologado Oficialmente
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Indeferido
                            </span>
                          )}
                        </div>

                        {/* Details grid */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                          <span className="flex items-center gap-1 font-mono text-slate-700">
                            <span className="font-sans text-slate-400 font-semibold">BI:</span> {app.biNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {app.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {app.phone}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-[#f75142]" /> {app.schoolName}
                          </span>
                        </div>

                        {/* Pre-registration validation note */}
                        <div className="mt-2.5 flex items-center gap-2">
                          {app.isPreRegistered ? (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/70">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{app.preRegisteredDetails || 'Pré-cadastro de Direção localizado nos registros municipais.'}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>Candidatura externa. Requer validação de portaria/despacho ministerial.</span>
                            </div>
                          )}
                        </div>

                        {/* Complementary Data Badges if available */}
                        {(app.nivelAcademico || typeof app.anosServico === 'number' || app.regimeTrabalho || app.documentosConferidosPresencialmente) && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                            {app.nivelAcademico && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-0.5 rounded-lg font-medium">
                                <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{app.nivelAcademico}</span>
                              </span>
                            )}
                            {typeof app.anosServico === 'number' && (
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-900 border border-blue-200/80 px-2.5 py-0.5 rounded-lg font-medium">
                                <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>{app.anosServico} {app.anosServico === 1 ? 'ano' : 'anos'} de serviço</span>
                              </span>
                            )}
                            {app.regimeTrabalho && (
                              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-900 border border-purple-200/80 px-2.5 py-0.5 rounded-lg font-medium">
                                <span>Regime: {app.regimeTrabalho}</span>
                              </span>
                            )}
                            {app.documentosConferidosPresencialmente && (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Docs em mãos conferidos</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Approval or Rejection details */}
                        {isApproved && (
                          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2">
                            <span>Homologado por <strong className="text-slate-800">{app.approvedBy}</strong> em {app.approvedAt || '11/09/2026'}</span>
                          </div>
                        )}
                        {isRejected && app.rejectionReason && (
                          <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg mt-2 border border-rose-200">
                            <strong>Motivo do indeferimento:</strong> {app.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Ver dados institucionais"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Ficha</span>
                      </button>

                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenReject(app)}
                            className="px-3 py-2 rounded-xl text-xs font-bold border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer"
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
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* APPROVE MODAL */}
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
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
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
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#f75142]"
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
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
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
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Dados Complementares de Enquadramento com Documentos em Mãos */}
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/90 space-y-3">
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
                  Preencha os campos abaixo com os documentos físicos originais apresentados pelo candidato para registo cadastral imediato e emissão de credenciais no SIGE.
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
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#f75142]"
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
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
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
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#f75142]"
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
                      className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-800 focus:ring-2 focus:ring-[#f75142]"
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
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#f75142]"
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
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
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
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-[#f75142]"
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
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-[#f75142]"
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
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                />
              </div>

              {/* Information Alert */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  Ao confirmar a homologação, o status do Diretor muda para <strong>Ativo</strong>. O seu dossiê completo de direção é gerado com os dados acadêmicos e pedagógicos informados, liberando o acesso total à gestão escolar no uCore.
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
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
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
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim() || isSubmitting}
                onClick={handleConfirmReject}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl shadow-xs"
              >
                {isSubmitting ? 'A registar...' : 'Confirmar Indeferimento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Ficha Institucional do Candidato</h3>
                  <p className="text-xs text-slate-500">ID: {selectedApp.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nome:</span>
                  <span className="font-bold text-slate-900">{selectedApp.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cargo Pretendido:</span>
                  <span className="font-bold text-slate-900">{selectedApp.roleRequested || 'Diretor Geral'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nº do BI:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedApp.biNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Escola Destinada:</span>
                  <span className="text-slate-900">{selectedApp.schoolName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">E-mail:</span>
                  <span className="text-slate-900">{selectedApp.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Telefone:</span>
                  <span className="text-slate-900">{selectedApp.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data do Pedido:</span>
                  <span className="text-slate-900">{selectedApp.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Situação:</span>
                  <span className="font-bold capitalize text-slate-900">{selectedApp.status}</span>
                </div>
              </div>

              {/* Complementary data if available */}
              {(selectedApp.nivelAcademico || typeof selectedApp.anosServico === 'number' || selectedApp.regimeTrabalho) && (
                <div className="p-3 bg-amber-50/70 rounded-xl space-y-2 border border-amber-200 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                    <GraduationCap className="w-4 h-4 text-amber-700" />
                    <span>Dados de Enquadramento Oficial (Conferidos pelo Administrador)</span>
                  </div>
                  {selectedApp.nivelAcademico && (
                    <div className="flex justify-between">
                      <span className="text-amber-800">Nível Académico:</span>
                      <strong className="text-amber-950">{selectedApp.nivelAcademico}</strong>
                    </div>
                  )}
                  {typeof selectedApp.anosServico === 'number' && (
                    <div className="flex justify-between">
                      <span className="text-amber-800">Tempo de Serviço:</span>
                      <strong className="text-amber-950">{selectedApp.anosServico} anos</strong>
                    </div>
                  )}
                  {selectedApp.regimeTrabalho && (
                    <div className="flex justify-between">
                      <span className="text-amber-800">Regime de Trabalho:</span>
                      <strong className="text-amber-950">{selectedApp.regimeTrabalho}</strong>
                    </div>
                  )}
                  {selectedApp.classificacaoPedagogica && (
                    <div className="flex justify-between">
                      <span className="text-amber-800">Classif. Pedagógica:</span>
                      <span className="text-amber-950 font-medium text-right max-w-[220px]">{selectedApp.classificacaoPedagogica}</span>
                    </div>
                  )}
                  {selectedApp.especialidadeCurso && (
                    <div className="flex justify-between">
                      <span className="text-amber-800">Especialidade / Curso:</span>
                      <span className="text-amber-950 font-medium text-right max-w-[220px]">{selectedApp.especialidadeCurso}</span>
                    </div>
                  )}
                  {selectedApp.numeroCertificadoDiploma && (
                    <div className="flex justify-between">
                      <span className="text-amber-800">Diploma / Certificado:</span>
                      <span className="font-mono text-amber-950 font-semibold">{selectedApp.numeroCertificadoDiploma}</span>
                    </div>
                  )}
                  {selectedApp.numeroMecanograficoOuNif && (
                    <div className="flex justify-between">
                      <span className="text-amber-800">Mecanográfico / NIF:</span>
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
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="font-bold text-amber-900 block mb-1">Notas e Despacho:</span>
                  <p className="text-amber-800">{selectedApp.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-2">
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
                onClick={() => setShowSimModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
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
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!simName.trim()}
                onClick={handleSimulateDirector}
                className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl shadow-xs"
              >
                Criar Inscrição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
