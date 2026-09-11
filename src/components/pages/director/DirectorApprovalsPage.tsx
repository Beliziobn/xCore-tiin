import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  UserCheck,
  UserX,
  GraduationCap,
  User,
  Briefcase,
  School,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  FileText,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Plus,
  Check,
  X,
  ChevronRight,
  BookOpen,
  Eye,
  Building2,
  Printer
} from 'lucide-react';
import type { PendingApplication, DirectorTeacher, AdminStudent } from '../../../types';
import {
  getPendingApplications,
  approveApplication,
  rejectApplication,
  savePendingApplication
} from '../../../utils/authApprovalStorage';
import { Hero } from '../../Hero';

interface DirectorApprovalsPageProps {
  onOpenGetStarted?: () => void;
  isLoggedIn?: boolean;
  directorName?: string;
  schoolName?: string;
  onAddTeacherGlobal?: (teacher: DirectorTeacher) => void;
  onAddStudentGlobal?: (student: AdminStudent) => void;
  showToast?: (msg: string) => void;
}

export const DirectorApprovalsPage: React.FC<DirectorApprovalsPageProps> = ({
  onOpenGetStarted,
  isLoggedIn = true,
  directorName = 'Fert Horlan (Diretor Geral)',
  schoolName = 'Escola Modelo Central do Quêssua',
  onAddTeacherGlobal,
  onAddStudentGlobal,
  showToast,
}) => {
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente');
  const [roleFilter, setRoleFilter] = useState<'todos' | 'professor' | 'aluno' | 'funcionario'>('todos');
  const [selectedApp, setSelectedApp] = useState<PendingApplication | null>(null);

  // Approval Modal State
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [appToApprove, setAppToApprove] = useState<PendingApplication | null>(null);
  const [assignedRoom, setAssignedRoom] = useState('Sala 04');
  const [assignedTurma, setAssignedTurma] = useState('Turma B');
  const [assignedShift, setAssignedShift] = useState<'Manhã' | 'Tarde'>('Manhã');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [appToReject, setAppToReject] = useState<PendingApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Demo Simulator
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simName, setSimName] = useState('');
  const [simRole, setSimRole] = useState<'professor' | 'aluno' | 'funcionario'>('professor');
  const [simSubject, setSimSubject] = useState('Matemática');
  const [simBi, setSimBi] = useState('');

  const loadApplications = () => {
    const all = getPendingApplications();
    // Filter for applications directed to the Director
    const directorApps = all.filter((a) => a.targetApproverRole === 'diretor');
    setApplications(directorApps);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Filtered list
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      // Status filter
      if (statusFilter !== 'todos' && app.status !== statusFilter) return false;

      // Role filter
      if (roleFilter !== 'todos' && app.type !== roleFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = app.fullName.toLowerCase().includes(q);
        const matchesBi = app.biNumber.toLowerCase().includes(q);
        const matchesEmail = app.email.toLowerCase().includes(q);
        const matchesSubject = app.subject?.toLowerCase().includes(q);
        const matchesPhone = app.phone.toLowerCase().includes(q);
        return matchesName || matchesBi || matchesEmail || matchesSubject || matchesPhone;
      }

      return true;
    });
  }, [applications, statusFilter, roleFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      total: applications.length,
      pendentes: applications.filter((a) => a.status === 'pendente').length,
      aprovados: applications.filter((a) => a.status === 'aprovado').length,
      rejeitados: applications.filter((a) => a.status === 'rejeitado').length,
    };
  }, [applications]);

  // Handle open approval modal
  const handleOpenApprove = (app: PendingApplication) => {
    setAppToApprove(app);
    setAssignedRoom('Sala 03');
    setAssignedTurma(app.gradeClass || 'Turma A');
    setAssignedShift('Manhã');
    setApprovalNotes(`Homologado e integrado no corpo escolar da ${schoolName}.`);
    setIsApproveModalOpen(true);
  };

  // Confirm Approval
  const handleConfirmApprove = () => {
    if (!appToApprove) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const res = approveApplication(appToApprove.id, directorName);
      if (res.success && res.app) {
        const updated = res.app;
        loadApplications();

        // If teacher, integrate into school teachers
        if (updated.type === 'professor') {
          const newTeacher: DirectorTeacher = {
            id: updated.userId || 'prof-' + Date.now(),
            name: updated.fullName,
            schoolName: updated.schoolName || schoolName,
            gradeClass: updated.gradeClass || '6ª Classe',
            room: assignedRoom,
            turma: assignedTurma,
            directorName: directorName,
            location: `${assignedRoom} - Bloco Pedagógico`,
            subject: updated.subject || 'Educação Básica',
            presenceRate: 100,
            shift: assignedShift,
            schedule: [
              { day: 'Segunda', period: '07h30 - 09h10', subject: updated.subject || 'Educação Básica', room: assignedRoom },
              { day: 'Quarta', period: '09h30 - 11h10', subject: updated.subject || 'Educação Básica', room: assignedRoom },
            ],
          };

          if (onAddTeacherGlobal) {
            onAddTeacherGlobal(newTeacher);
          }
        } else if (updated.type === 'aluno' && onAddStudentGlobal) {
          const newStudent: AdminStudent = {
            id: updated.userId || 'alu-' + Date.now(),
            name: updated.fullName,
            gender: 'M',
            gradeClass: updated.gradeClass || '7ª Classe',
            room: assignedRoom,
            turma: assignedTurma,
            guardianName: 'Encarregado(a) de Educação',
            location: 'Quêssua, Malanje',
            presenceRate: 100,
            hasDocuments: true,
            numeroDocumento: updated.biNumber,
            performanceScore: 85,
            schoolName: updated.schoolName || schoolName,
          };
          onAddStudentGlobal(newStudent);
        }

        const notify = showToast || alert;
        notify(`Inscrição de ${updated.fullName} homologada com sucesso pela Direção Escolar!`);
      }
      setIsSubmitting(false);
      setIsApproveModalOpen(false);
      setAppToApprove(null);
    }, 400);
  };

  // Open Rejection Modal
  const handleOpenReject = (app: PendingApplication) => {
    setAppToReject(app);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  // Confirm Rejection
  const handleConfirmReject = () => {
    if (!appToReject || !rejectReason.trim()) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const res = rejectApplication(appToReject.id, rejectReason.trim(), directorName);
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

  // Create simulated candidate for demo testing
  const handleSimulateCandidate = () => {
    if (!simName.trim()) return;
    const newId = 'app-sim-' + Date.now();
    const newApp: PendingApplication = {
      id: newId,
      userId: 'usr-sim-' + Date.now(),
      type: simRole,
      roleRequested: simRole === 'professor' ? 'Professor(a) Efetivo' : simRole === 'aluno' ? 'Aluno(a) Transferido' : 'Auxiliar de Secretaria',
      fullName: simName.trim(),
      email: `${simName.toLowerCase().replace(/\s+/g, '.')}@ucore.edu.ao`,
      phone: '+244 923 111 222',
      biNumber: simBi.trim() || '00' + Math.floor(1000000 + Math.random() * 9000000) + 'LA042',
      schoolName: schoolName,
      municipality: 'Quêssua (Malanje)',
      targetApproverRole: 'diretor',
      approverDirectorName: directorName,
      subject: simRole === 'professor' ? simSubject : undefined,
      gradeClass: simRole === 'aluno' ? '7ª Classe' : undefined,
      status: 'pendente',
      isPreRegistered: true,
      preRegisteredDetails: 'Simulação cadastrada para testes de homologação da Direção.',
      createdAt: new Date().toLocaleString('pt-AO'),
      notes: 'Candidatura de teste inserida para demonstração da Direção Escolar.',
    };

    savePendingApplication(newApp);
    loadApplications();
    setShowSimulateModal(false);
    setSimName('');
    setSimBi('');
    const notify = showToast || alert;
    notify(`Nova candidatura simulada criada com sucesso para ${newApp.fullName}!`);
  };

  return (
    <div id="director-approvals-page" className="w-full min-h-screen bg-[#f8f9fb]">
      {/* Hero Header */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        customTitle="Aprovação de Inscrições Escolares"
        customSubtitle={`Validação, homologação e admissão de novos professores, alunos e colaboradores dirigidos para a ${schoolName}.`}
        badge="Direção Escolar"
        breadcrumbs={[
          { label: 'Início', onClick: () => window.location.reload() },
          { label: 'Direção Escolar' },
          { label: 'Aprovação de Inscrições' },
        ]}
        isLoggedIn={isLoggedIn}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6 relative z-10">
        {/* KPI Cards & Metrics */}
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
                Pendentes de Análise
              </span>
              <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                <Clock className="w-4 h-4 animate-pulse" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{counts.pendentes}</span>
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Requer ação
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Candidaturas que aguardam homologação</p>
          </div>

          {/* Aprovados */}
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
                Homologados
              </span>
              <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{counts.aprovados}</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                No quadro escolar
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Usuários integrados na escola</p>
          </div>

          {/* Rejeitados */}
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
            <p className="text-xs text-slate-500 mt-1">Inscrições devolvidas com justificativa</p>
          </div>

          {/* Total Geral */}
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
                Total de Registos
              </span>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center ${statusFilter === 'todos' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-3xl font-black ${statusFilter === 'todos' ? 'text-white' : 'text-slate-900'}`}>{counts.total}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusFilter === 'todos' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                Histórico
              </span>
            </div>
            <p className={`text-xs mt-1 ${statusFilter === 'todos' ? 'text-slate-400' : 'text-slate-500'}`}>Inscrições recebidas nesta escola</p>
          </div>
        </div>

        {/* Controls & Filter Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por nome, nº do BI, email, disciplina ou turma..."
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

            {/* Role Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRoleFilter('todos')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all ${
                  roleFilter === 'todos'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({applications.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('professor')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                  roleFilter === 'professor'
                    ? 'bg-[#f75142] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Professores ({applications.filter((a) => a.type === 'professor').length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('aluno')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                  roleFilter === 'aluno'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Alunos ({applications.filter((a) => a.type === 'aluno').length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('funcionario')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                  roleFilter === 'funcionario'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Colaboradores ({applications.filter((a) => a.type === 'funcionario').length})
              </button>
            </div>

            {/* Action buttons */}
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
                onClick={() => setShowSimulateModal(true)}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Simular Inscrição</span>
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
              <h3 className="text-base font-bold text-slate-900 mb-1">Nenhuma inscrição encontrada</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Não existem pedidos com os filtros selecionados no momento. Todas as inscrições para esta escola estão atualizadas.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('todos');
                  setRoleFilter('todos');
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
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0 ${
                          app.type === 'professor'
                            ? 'bg-[#f75142]'
                            : app.type === 'aluno'
                            ? 'bg-blue-600'
                            : 'bg-indigo-600'
                        }`}
                      >
                        {app.fullName.charAt(0)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-base font-bold text-slate-950">{app.fullName}</h4>
                          
                          {/* Role Tag */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            app.type === 'professor'
                              ? 'bg-rose-50 text-[#f75142] border border-rose-200/60'
                              : app.type === 'aluno'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                          }`}>
                            {app.roleRequested || (app.type === 'professor' ? 'Docente' : app.type === 'aluno' ? 'Aluno' : 'Funcionário')}
                          </span>

                          {/* Status Tag */}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pendente de Homologação
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Homologado
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
                          {app.subject && (
                            <span className="flex items-center gap-1 font-semibold text-slate-800">
                              <BookOpen className="w-3 h-3 text-amber-500" /> {app.subject}
                            </span>
                          )}
                          {app.gradeClass && (
                            <span className="flex items-center gap-1 text-slate-700">
                              <span className="text-slate-400 font-semibold">Classe/Nível:</span> {app.gradeClass}
                            </span>
                          )}
                        </div>

                        {/* Pre-registration status note */}
                        <div className="mt-2.5 flex items-center gap-2">
                          {app.isPreRegistered ? (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/70">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{app.preRegisteredDetails || 'Pré-cadastro localizado no livro docente da escola.'}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>Candidatura externa direta. Análise curricular da Direção.</span>
                            </div>
                          )}
                        </div>

                        {/* Approval or Rejection details */}
                        {isApproved && (
                          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2">
                            <span>Aprovado por <strong className="text-slate-800">{app.approvedBy}</strong> em {app.approvedAt || '11/09/2026'}</span>
                          </div>
                        )}
                        {isRejected && app.rejectionReason && (
                          <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg mt-2 border border-rose-200">
                            <strong>Motivo da recusa:</strong> {app.rejectionReason}
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
                        title="Ver dados completos"
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
                            <span>Recusar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenApprove(app)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#f75142] hover:bg-[#e04335] text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Homologar Inscrição</span>
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

      {/* APPROVAL MODAL */}
      {isApproveModalOpen && appToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Homologar Inscrição</h3>
                  <p className="text-xs text-slate-500">Validação oficial para {appToApprove.fullName}</p>
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
                    <span className="text-slate-400 block font-semibold">Candidato</span>
                    <strong className="text-slate-900">{appToApprove.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Tipo / Função</span>
                    <span className="text-slate-800 font-bold capitalize">{appToApprove.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Nº do BI</span>
                    <span className="font-mono text-slate-800">{appToApprove.biNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Escola de Destino</span>
                    <span className="text-slate-800">{schoolName}</span>
                  </div>
                </div>
              </div>

              {/* Assignment Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Atribuir Turma
                  </label>
                  <input
                    type="text"
                    value={assignedTurma}
                    onChange={(e) => setAssignedTurma(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Atribuir Sala
                  </label>
                  <input
                    type="text"
                    value={assignedRoom}
                    onChange={(e) => setAssignedRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Turno de Atuação
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignedShift('Manhã')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      assignedShift === 'Manhã'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Turno da Manhã
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignedShift('Tarde')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      assignedShift === 'Tarde'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Turno da Tarde
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Despacho / Observação da Direção
                </label>
                <textarea
                  rows={2}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Observação oficial sobre a aprovação..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  Ao confirmar, o usuário é ativado imediatamente e poderá fazer login e ter acesso às turmas da sua escola.
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmApprove}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>A processar...</span>
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

      {/* REJECTION MODAL */}
      {isRejectModalOpen && appToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <UserX className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Indeferir Candidatura</h3>
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
                Por favor, indique a justificativa legal ou administrativa pela qual esta inscrição não foi deferida pela Direção:
              </p>

              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex.: Quadro docente do ano letivo 2026 preenchido; divergência documental; reencaminhado para outra unidade..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setRejectReason('Vagas esgotadas para a disciplina no ano letivo atual.')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md"
                >
                  Vagas esgotadas
                </button>
                <button
                  type="button"
                  onClick={() => setRejectReason('Documentação de transferência incompleta ou ilegível.')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md"
                >
                  Documentação incompleta
                </button>
                <button
                  type="button"
                  onClick={() => setRejectReason('Incompatibilidade de horário com as turmas ativas.')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md"
                >
                  Incompatibilidade horária
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim() || isSubmitting}
                onClick={handleConfirmReject}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                {isSubmitting ? 'A registrar...' : 'Confirmar Indeferimento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL VIEW MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Ficha da Candidatura</h3>
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
                  <span className="text-slate-500">Nome Completo:</span>
                  <span className="font-bold text-slate-900">{selectedApp.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nº do Bilhete (BI):</span>
                  <span className="font-mono font-bold text-slate-900">{selectedApp.biNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Função Solicitada:</span>
                  <span className="font-bold text-slate-900 capitalize">{selectedApp.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">E-mail Institucional:</span>
                  <span className="text-slate-900">{selectedApp.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Telefone:</span>
                  <span className="text-slate-900">{selectedApp.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Escola de Destino:</span>
                  <span className="text-slate-900">{selectedApp.schoolName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Município / Província:</span>
                  <span className="text-slate-900">{selectedApp.municipality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data de Entrada:</span>
                  <span className="text-slate-900">{selectedApp.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estado Atual:</span>
                  <span className="font-bold capitalize text-slate-900">{selectedApp.status}</span>
                </div>
              </div>

              {selectedApp.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="font-bold text-amber-900 block mb-1">Notas do Processo:</span>
                  <p className="text-amber-800">{selectedApp.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATE CANDIDATE MODAL (FOR TESTING) */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Simular Nova Inscrição</h3>
                  <p className="text-xs text-slate-500">Cria uma candidatura para testar homologação</p>
                </div>
              </div>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Usuário
                </label>
                <select
                  value={simRole}
                  onChange={(e) => setSimRole(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="professor">Professor(a)</option>
                  <option value="aluno">Aluno(a)</option>
                  <option value="funcionario">Colaborador(a) / Secretaria</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  placeholder="Ex: Prof. Celestino Muxito"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nº do BI (opcional)
                </label>
                <input
                  type="text"
                  value={simBi}
                  onChange={(e) => setSimBi(e.target.value)}
                  placeholder="Ex: 005423891LA044"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                />
              </div>

              {simRole === 'professor' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Disciplina
                  </label>
                  <input
                    type="text"
                    value={simSubject}
                    onChange={(e) => setSimSubject(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!simName.trim()}
                onClick={handleSimulateCandidate}
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
