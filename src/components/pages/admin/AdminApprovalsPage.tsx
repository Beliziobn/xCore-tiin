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
  AlertCircle
} from 'lucide-react';
import type { PendingApplication, AdminDirector, AdminSchool } from '../../../types';
import {
  getPendingApplications,
  approveApplication,
  rejectApplication,
  savePendingApplication
} from '../../../utils/authApprovalStorage';
import { buildInitialDirectorDossier } from '../../../utils/directorStorage';
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
    setIsApproveModalOpen(true);
  };

  // Confirm approve
  const handleConfirmApprove = () => {
    if (!appToApprove) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const res = approveApplication(appToApprove.id, adminName);
      if (res.success && res.app) {
        const updated = res.app;
        loadApplications();

        // Add to global directors state
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
            registrationData: {
              ...baseDossier,
              id: `dir-dossier-${dirId}`,
              nomeCompleto: updated.fullName,
              biNif: updated.biNumber,
              telefone: updated.phone || '+244 923 000 000',
              emailPessoal: updated.email,
              nomeEscola: targetSchoolName || updated.schoolName,
              dataNomeacao: `${appointmentYear}-02-01`,
            },
          };
          onAddDirectorGlobal(newDirector);
        }

        const notify = showToast || alert;
        notify(`Diretor(a) "${updated.fullName}" homologado(a) com sucesso no uCore! Acesso liberado.`);
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Homologar Nomeação de Direção</h3>
                  <p className="text-xs text-slate-500">Validação para {appToApprove.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block font-semibold">Diretor(a) Candidato</span>
                    <strong className="text-slate-900">{appToApprove.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">BI</span>
                    <span className="font-mono text-slate-800">{appToApprove.biNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Email</span>
                    <span className="text-slate-800">{appToApprove.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Telefone</span>
                    <span className="text-slate-800">{appToApprove.phone}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Associar à Escola
                </label>
                <select
                  value={targetSchoolName}
                  onChange={(e) => setTargetSchoolName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nº do Despacho de Nomeação
                  </label>
                  <input
                    type="text"
                    value={dispatchNumber}
                    onChange={(e) => setDispatchNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ano de Posse
                  </label>
                  <input
                    type="number"
                    value={appointmentYear}
                    onChange={(e) => setAppointmentYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  Ao confirmar a homologação, o status do Diretor muda para <strong>Ativo</strong>. A tela de espera será desbloqueada e ele assumirá a gestão pedagógica e administrativa da escola associada.
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
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
                  <span>A homologar...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar Homologação</span>
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

              {selectedApp.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="font-bold text-amber-900 block mb-1">Notas e Despacho:</span>
                  <p className="text-amber-800">{selectedApp.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
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
