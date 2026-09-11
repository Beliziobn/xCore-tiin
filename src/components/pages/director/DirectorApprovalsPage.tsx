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
  Printer,
  LayoutGrid,
  List,
  FileCheck,
  CheckCheck
} from 'lucide-react';
import type { 
  PendingApplication, 
  DirectorTeacher, 
  AdminStudent, 
  PendingApprovalComplementaryData, 
  TeacherRegistrationData 
} from '../../../types';
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedApp, setSelectedApp] = useState<PendingApplication | null>(null);

  // Approval Modal State
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [appToApprove, setAppToApprove] = useState<PendingApplication | null>(null);
  const [assignedRoom, setAssignedRoom] = useState('Sala 04');
  const [assignedTurma, setAssignedTurma] = useState('Turma B');
  const [assignedShift, setAssignedShift] = useState<'Manhã' | 'Tarde'>('Manhã');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Complementary Fields State (Directly filled by Director when documents are in hand)
  const [nivelAcademico, setNivelAcademico] = useState<string>('Licenciado');
  const [nivelAcademicoOutro, setNivelAcademicoOutro] = useState<string>('');
  const [anosServico, setAnosServico] = useState<number>(3);
  const [classificacaoPedagogica, setClassificacaoPedagogica] = useState<string>('Com magistério e com IMNE completo');
  const [especialidadeCurso, setEspecialidadeCurso] = useState<string>('');
  const [regimeTrabalho, setRegimeTrabalho] = useState<string>('Efectivo');
  const [numeroMecanograficoOuNif, setNumeroMecanograficoOuNif] = useState<string>('');
  const [numeroCertificadoDiploma, setNumeroCertificadoDiploma] = useState<string>('');
  const [documentosConferidosPresencialmente, setDocumentosConferidosPresencialmente] = useState<boolean>(true);
  const [dataInicioFuncoes, setDataInicioFuncoes] = useState<string>(new Date().toISOString().split('T')[0]);

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
    const total = applications.length;
    const pendentes = applications.filter((a) => a.status === 'pendente').length;
    const aprovados = applications.filter((a) => a.status === 'aprovado').length;
    const rejeitados = applications.filter((a) => a.status === 'rejeitado').length;
    const taxaAprovacao = total > 0 ? Math.round((aprovados / total) * 100) : 100;
    return {
      total,
      pendentes,
      aprovados,
      rejeitados,
      taxaAprovacao,
    };
  }, [applications]);

  // Handle open approval modal
  const handleOpenApprove = (app: PendingApplication) => {
    setAppToApprove(app);
    setAssignedRoom(app.assignedRoom || 'Sala 03');
    setAssignedTurma(app.gradeClass || app.assignedTurma || 'Turma A');
    setAssignedShift((app.assignedShift as any) || 'Manhã');
    setApprovalNotes(app.notes || `Homologado e integrado no corpo escolar da ${schoolName}.`);

    // Intelligent default values for complementary fields based on role or prior data
    const defaultNivel = app.nivelAcademico || (
      app.type === 'professor' ? 'Licenciado' : 
      app.type === 'aluno' ? '7.ª a 8.ª classe' : 
      '11.ª a 12.ª classe'
    );
    setNivelAcademico(defaultNivel);
    setNivelAcademicoOutro(app.nivelAcademicoOutro || '');
    setAnosServico(typeof app.anosServico === 'number' ? app.anosServico : (app.type === 'professor' ? 4 : 1));
    setClassificacaoPedagogica(app.classificacaoPedagogica || 'Com magistério e com IMNE completo');
    setEspecialidadeCurso(app.especialidadeCurso || app.subject || (app.type === 'professor' ? 'Língua Portuguesa' : 'Educação Básica'));
    setRegimeTrabalho(app.regimeTrabalho || 'Efectivo');
    setNumeroMecanograficoOuNif(app.numeroMecanograficoOuNif || '');
    setNumeroCertificadoDiploma(app.numeroCertificadoDiploma || `CERT-MED-${Math.floor(100000 + Math.random() * 900000)}/2026`);
    setDocumentosConferidosPresencialmente(app.documentosConferidosPresencialmente ?? true);
    setDataInicioFuncoes(app.dataInicioFuncoes || new Date().toISOString().split('T')[0]);

    setIsApproveModalOpen(true);
  };

  // Confirm Approval
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
      especialidadeCurso: especialidadeCurso.trim() || appToApprove.subject || '',
      regimeTrabalho,
      numeroMecanograficoOuNif: numeroMecanograficoOuNif.trim(),
      numeroCertificadoDiploma: numeroCertificadoDiploma.trim(),
      documentosConferidosPresencialmente,
      dataInicioFuncoes,
      observacoesComplementares: approvalNotes.trim(),
    };

    setTimeout(() => {
      const res = approveApplication(appToApprove.id, directorName, compData);
      if (res.success && res.app) {
        const updated = res.app;
        loadApplications();

        // If teacher, integrate into school teachers with full registrationData enriched
        if (updated.type === 'professor') {
          const regData: TeacherRegistrationData = {
            id: 'reg-' + Date.now(),
            nomeCompleto: updated.fullName,
            biNif: updated.biNumber,
            sexo: 'Masculino',
            dataNascimento: '1988-06-15',
            faixaEtaria: (Number(anosServico) >= 10 ? '35-39' : Number(anosServico) >= 5 ? '30-34' : '25-29') as any,
            telefone: updated.phone,
            email: updated.email,
            morada: 'Bairro Central, Quêssua',
            provinciaResidencia: 'Malanje',
            municipioResidencia: 'Quêssua',
            naturezaEscola: 'Pública',
            nomeEscola: schoolName,
            provinciaEscola: 'Malanje',
            municipioEscola: 'Quêssua',
            tipoInstituicao: 'Escola com classe de Iniciação',
            niveisLecciona: [{ id: 'primario', nome: 'Ensino Primário Regular' }],
            funcaoCategoria: 'Docente / Professor',
            temFormacaoPedagogica: classificacaoPedagogica !== 'Sem Magistério e sem Formação pedagógica',
            temMagisterioCompleto: classificacaoPedagogica.includes('magistério'),
            temImneCompleto: classificacaoPedagogica.includes('IMNE'),
            temOutraFormacaoPedagogica: false,
            classificacaoPedagogica: classificacaoPedagogica as any,
            nivelAcademico: finalNivelAcademico as any,
            regimeTrabalho: regimeTrabalho as any,
            anosServico: Number(anosServico) || 0,
            disciplinas: especialidadeCurso || updated.subject || 'Educação Básica',
            possuiValidacaoHabilitacoes: documentosConferidosPresencialmente,
            documentoValidacaoNome: numeroCertificadoDiploma || 'Certificado Oficial Homologado',
            numeroTurmas: 1,
            numeroAlunosAproximado: 45,
            turnos: [assignedShift],
            historicoAlteracoes: [
              {
                id: 'log-' + Date.now(),
                data: new Date().toLocaleDateString('pt-AO'),
                autor: directorName,
                acao: 'Homologação',
                detalhes: `Homologação direta pelo Diretor da Escola com documentos em mãos. Nível: ${finalNivelAcademico}, Tempo de Serviço: ${anosServico} anos, Regime: ${regimeTrabalho}.`,
              },
            ],
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
          };

          const newTeacher: DirectorTeacher = {
            id: updated.userId || 'prof-' + Date.now(),
            name: updated.fullName,
            schoolName: updated.schoolName || schoolName,
            gradeClass: updated.gradeClass || assignedTurma || '6ª Classe',
            room: assignedRoom,
            turma: assignedTurma,
            directorName: directorName,
            location: `${assignedRoom} - Bloco Pedagógico`,
            subject: especialidadeCurso || updated.subject || 'Educação Básica',
            presenceRate: 100,
            shift: assignedShift,
            registrationData: regData,
            schedule: [
              { day: 'Segunda', period: assignedShift === 'Manhã' ? '07h30 - 09h10' : '13h00 - 14h40', subject: especialidadeCurso || updated.subject || 'Educação Básica', room: assignedRoom },
              { day: 'Quarta', period: assignedShift === 'Manhã' ? '09h30 - 11h10' : '15h00 - 16h40', subject: especialidadeCurso || updated.subject || 'Educação Básica', room: assignedRoom },
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
            gradeClass: updated.gradeClass || assignedTurma || '7ª Classe',
            room: assignedRoom,
            turma: assignedTurma,
            guardianName: 'Encarregado(a) de Educação',
            location: 'Quêssua, Malanje',
            presenceRate: 100,
            hasDocuments: documentosConferidosPresencialmente,
            numeroDocumento: updated.biNumber,
            performanceScore: 85,
            schoolName: updated.schoolName || schoolName,
            registrationData: {
              name: updated.fullName,
              genero: 'M',
              dataNascimento: '2012-03-10',
              idade: 14,
              tipoDocumento: 'BI',
              numeroDocumento: updated.biNumber,
              classe: updated.gradeClass || '7ª Classe',
              turma: assignedTurma,
              sala: assignedRoom,
              turno: assignedShift,
              escola: schoolName,
              condicaoMatricula: 'primeira_vez',
              encarregado: 'Encarregado(a) de Educação',
              telefone: updated.phone,
              observacoes: approvalNotes,
            }
          };
          onAddStudentGlobal(newStudent);
        }

        const notify = showToast || alert;
        notify(`Inscrição de ${updated.fullName} homologada com dados complementares pela Direção!`);
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Executive Summary & School Protocol Strip */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs mb-6 overflow-hidden">
          <div className="p-5 sm:p-6 bg-linear-to-r from-slate-900 via-[#002133] to-slate-900 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-white/90 text-[11px] font-semibold tracking-wide border border-white/15">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>{schoolName} • Direção Geral • Ano Letivo 2026</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Quadro Oficial de Homologação & Matrículas Escolares
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Validação documental presencial, enquadramento de corpo docente e admissão definitiva de alunos e colaboradores no ecossistema uCore SIGE.
                </p>
              </div>

              {/* Quick Actions in Header */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={loadApplications}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/15 flex items-center gap-1.5 cursor-pointer"
                  title="Atualizar lista de candidaturas"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sincronizar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simular Inscrição</span>
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
                onClick={() => setStatusFilter("pendente")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  statusFilter === "pendente"
                    ? "bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-500/20"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80"
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-slate-950" />
                <span>Pendentes de Homologação</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  statusFilter === "pendente" ? "bg-slate-950 text-amber-400" : "bg-amber-100 text-amber-900"
                }`}>
                  {counts.pendentes}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("aprovado")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  statusFilter === "aprovado"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Homologados & Integrados</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  statusFilter === "aprovado" ? "bg-white text-emerald-800" : "bg-emerald-50 text-emerald-800"
                }`}>
                  {counts.aprovados}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("rejeitado")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  statusFilter === "rejeitado"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80"
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Indeferidos</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  statusFilter === "rejeitado" ? "bg-white text-rose-800" : "bg-rose-50 text-rose-800"
                }`}>
                  {counts.rejeitados}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("todos")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  statusFilter === "todos"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80"
                }`}
              >
                <span>Todos os Registos</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  statusFilter === "todos" ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
                }`}>
                  {counts.total}
                </span>
              </button>
            </div>

            {/* Quick KPI stats inline */}
            <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-600 border-l border-slate-200/80 pl-4">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Taxa de Homologação:</span>
                <span className="font-bold text-emerald-700">{counts.taxaAprovacao}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Direção:</span>
                <span className="font-bold text-slate-800">{directorName}</span>
              </div>
            </div>
          </div>
        </section>

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
                placeholder="Pesquisar por nome, nº do BI, email, disciplina ou turma..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002133]/20 focus:border-[#002133] transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Limpar pesquisa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => setRoleFilter("todos")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  roleFilter === "todos"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Todos ({applications.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("professor")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                  roleFilter === "professor"
                    ? "bg-[#002133] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                <span>Professores ({applications.filter((a) => a.type === "professor").length})</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("aluno")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                  roleFilter === "aluno"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Alunos ({applications.filter((a) => a.type === "aluno").length})</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("funcionario")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                  roleFilter === "funcionario"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Colaboradores ({applications.filter((a) => a.type === "funcionario").length})</span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border border-slate-200 bg-slate-50 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Modo Dossiês (Cartões Detalhados)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dossiês</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Modo Pauta / Tabela (Visão Administrativa)"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pauta</span>
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredApps.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-4">
              <CheckCircle2 className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Nenhuma inscrição encontrada</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Não existem pedidos com os filtros selecionados no momento. Todas as inscrições para esta escola estão atualizadas.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("todos");
                setRoleFilter("todos");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>
        ) : viewMode === "table" ? (
          /* TABLE VIEW / PAUTA OFICIAL DE HOMOLOGAÇÕES */
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Candidato(a) / Perfil</th>
                    <th className="py-3 px-4">Categoria & Área</th>
                    <th className="py-3 px-4">Nº do BI / Doc</th>
                    <th className="py-3 px-4">Turma / Sala / Turno</th>
                    <th className="py-3 px-4">Data Registo</th>
                    <th className="py-3 px-4 text-center">Situação Oficial</th>
                    <th className="py-3 px-4 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApps.map((app) => {
                    const isPending = app.status === "pendente";
                    const isApproved = app.status === "aprovado";
                    const isRejected = app.status === "rejeitado";

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Candidato */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs ${
                                app.type === "professor"
                                  ? "bg-[#002133]"
                                  : app.type === "aluno"
                                  ? "bg-blue-600"
                                  : "bg-indigo-600"
                              }`}
                            >
                              {app.fullName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate group-hover:text-slate-950">
                                {app.fullName}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate block">
                                {app.email} • {app.phone}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Categoria */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            app.type === "professor"
                              ? "bg-amber-50 text-amber-900 border border-amber-200"
                              : app.type === "aluno"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : "bg-indigo-50 text-indigo-800 border border-indigo-200"
                          }`}>
                            {app.roleRequested || (app.type === "professor" ? "Docente" : app.type === "aluno" ? "Aluno" : "Colaborador")}
                          </span>
                          {app.subject && (
                            <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                              {app.subject}
                            </span>
                          )}
                          {app.gradeClass && !app.subject && (
                            <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                              {app.gradeClass}
                            </span>
                          )}
                        </td>

                        {/* BI */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-700 font-semibold block text-xs">
                            {app.biNumber}
                          </span>
                          {app.documentosConferidosPresencialmente ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Docs conferidos
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              A conferir físico
                            </span>
                          )}
                        </td>

                        {/* Turma / Sala / Turno */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 text-xs block">
                            {app.assignedTurma || app.gradeClass || "A atribuir"}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {app.assignedRoom ? `${app.assignedRoom} • ` : ""}{app.assignedShift || "Manhã"}
                          </span>
                        </td>

                        {/* Data */}
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {app.createdAt ? app.createdAt.split(",")[0] : "Hoje"}
                        </td>

                        {/* Situação */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pendente
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Homologado
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Indeferido
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedApp(app)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 cursor-pointer transition-colors"
                              title="Ver Dossiê Completo"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReject(app)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer transition-colors"
                                  title="Indeferir Homologação"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenApprove(app)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#002133] hover:bg-slate-800 text-white cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                                  title="Homologar com Documentos"
                                >
                                  <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Homologar</span>
                                </button>
                              </>
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
        ) : (
          /* CARDS VIEW / DOSSIÊS DETALHADOS */
          <div className="space-y-4">
            {filteredApps.map((app) => {
              const isPending = app.status === "pendente";
              const isApproved = app.status === "aprovado";
              const isRejected = app.status === "rejeitado";

              return (
                <div
                  key={app.id}
                  className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all shadow-xs ${
                    isPending
                      ? "border-amber-200/90 hover:border-amber-400 hover:shadow-md"
                      : isApproved
                      ? "border-slate-200/90 hover:border-emerald-300"
                      : "border-slate-200/90 opacity-75"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left: Avatar & Candidate Info */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs ${
                          app.type === "professor"
                            ? "bg-[#002133]"
                            : app.type === "aluno"
                            ? "bg-blue-600"
                            : "bg-indigo-600"
                        }`}
                      >
                        {app.fullName.charAt(0)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-base font-bold text-slate-950">{app.fullName}</h4>
                          
                          {/* Role Tag */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            app.type === "professor"
                              ? "bg-amber-50 text-amber-900 border border-amber-200"
                              : app.type === "aluno"
                              ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                          }`}>
                            {app.roleRequested || (app.type === "professor" ? "Docente" : app.type === "aluno" ? "Aluno" : "Funcionário")}
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
                              Homologado & Integrado
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
                              <BookOpen className="w-3 h-3 text-amber-600" /> {app.subject}
                            </span>
                          )}
                          {(app.assignedTurma || app.gradeClass) && (
                            <span className="flex items-center gap-1 text-slate-700">
                              <span className="text-slate-400 font-semibold">Turma/Classe:</span> {app.assignedTurma || app.gradeClass}
                            </span>
                          )}
                        </div>

                        {/* Pre-registration status note */}
                        <div className="mt-2.5 flex items-center gap-2">
                          {app.isPreRegistered ? (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/70">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{app.preRegisteredDetails || "Pré-cadastro localizado no livro docente da escola."}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>Candidatura externa direta. Análise curricular da Direção.</span>
                            </div>
                          )}
                        </div>

                        {/* Complementary data badge if present */}
                        {(app.nivelAcademico || typeof app.anosServico === "number" || app.documentosConferidosPresencialmente) && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                            {app.nivelAcademico && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-0.5 rounded-lg font-medium">
                                <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{app.nivelAcademico}</span>
                              </span>
                            )}
                            {typeof app.anosServico === "number" && (
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-900 border border-blue-200/80 px-2.5 py-0.5 rounded-lg font-medium">
                                <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>{app.anosServico} {app.anosServico === 1 ? "ano" : "anos"} de serviço</span>
                              </span>
                            )}
                            {app.regimeTrabalho && (
                              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-900 border border-purple-200/80 px-2.5 py-0.5 rounded-lg font-medium">
                                <span>Regime: {app.regimeTrabalho}</span>
                              </span>
                            )}
                            {app.documentosConferidosPresencialmente && (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-lg font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Documentos em mãos</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 lg:self-center shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Dossiê</span>
                      </button>

                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenReject(app)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Indeferir</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenApprove(app)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#002133] hover:bg-slate-800 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                            <span>Homologar com Documentos</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* APPROVAL MODAL WITH COMPLEMENTARY FIELDS (DOCS IN HAND) */}
      {isApproveModalOpen && appToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Homologar Inscrição</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      Decisão da Direção
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">Validação e enquadramento oficial para {appToApprove.fullName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Candidate Info Summary Bar */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/60 p-3.5 rounded-xl border border-slate-200/90 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">Candidato</span>
                    <strong className="text-slate-900 truncate block">{appToApprove.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">Função Requerida</span>
                    <span className="text-slate-800 font-bold capitalize">{appToApprove.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">Nº do BI</span>
                    <span className="font-mono text-slate-800 font-medium">{appToApprove.biNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">Unidade Escolar</span>
                    <span className="text-slate-800 truncate block">{schoolName}</span>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 1: Atribuição Pedagógica Imediata */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#f75142]" />
                    Atribuição Pedagógica & Turma
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Turma, Sala e Turno</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Atribuir Turma
                    </label>
                    <input
                      type="text"
                      value={assignedTurma}
                      onChange={(e) => setAssignedTurma(e.target.value)}
                      placeholder="Ex: Turma A, 6ª Classe"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Atribuir Sala
                    </label>
                    <input
                      type="text"
                      value={assignedRoom}
                      onChange={(e) => setAssignedRoom(e.target.value)}
                      placeholder="Ex: Sala 03, Sala 12"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Turno de Atuação
                    </label>
                    <select
                      value={assignedShift}
                      onChange={(e) => setAssignedShift(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                    >
                      <option value="Manhã">Turno da Manhã</option>
                      <option value="Tarde">Turno da Tarde</option>
                      <option value="Noite">Turno da Noite</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: DADOS COMPLEMENTARES (DOCUMENTOS EM MÃOS) */}
              <div className="border border-amber-200/90 rounded-xl p-4 bg-gradient-to-b from-amber-50/40 via-white to-white shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-amber-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Dados Complementares de Enquadramento
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                          Documentos em mãos
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        O Diretor pode preencher nível académico, tempo de serviço e dados contratuais se já tiver os documentos em mãos.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Nível Académico */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Nível Académico / Habilitações</span>
                      <span className="text-[10px] text-amber-700 font-semibold">Oficial SIGE</span>
                    </label>
                    <select
                      value={nivelAcademico}
                      onChange={(e) => setNivelAcademico(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    >
                      <option value="Licenciado">Licenciado (Ensino Superior)</option>
                      <option value="Bacharelato">Bacharelato</option>
                      <option value="Pós-licenciado (mestrado / doutoramento)">Pós-licenciado (Mestrado / Doutoramento)</option>
                      <option value="11.ª a 12.ª classe">11.ª a 12.ª classe (Técnico Médio / Magistério)</option>
                      <option value="9.ª a 10.ª classe">9.ª a 10.ª classe (I Ciclo Secundário)</option>
                      <option value="7.ª a 8.ª classe">7.ª a 8.ª classe</option>
                      <option value="Até à 6.ª classe">Até à 6.ª classe (Primário Completo)</option>
                      <option value="Outro">Outro nível (especificar)</option>
                    </select>
                    {nivelAcademico === 'Outro' && (
                      <input
                        type="text"
                        value={nivelAcademicoOutro}
                        onChange={(e) => setNivelAcademicoOutro(e.target.value)}
                        placeholder="Especifique o nível ou habilitação..."
                        className="mt-2 w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    )}
                  </div>

                  {/* Tempo de Serviço */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Tempo de Serviço na Educação</span>
                      <span className="text-[10px] text-slate-500 font-normal">{anosServico} {anosServico === 1 ? 'ano' : 'anos'}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={anosServico}
                          onChange={(e) => setAnosServico(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                        />
                        <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">anos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setAnosServico((prev) => Math.max(0, prev - 1))}
                          className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm cursor-pointer"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => setAnosServico((prev) => prev + 1)}
                          className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {/* Quick presets */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {[0, 2, 5, 10, 15].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAnosServico(val)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                            anosServico === val
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {val === 0 ? '0 (Novo)' : `${val} anos`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Formação Pedagógica */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Classificação / Formação Pedagógica
                    </label>
                    <select
                      value={classificacaoPedagogica}
                      onChange={(e) => setClassificacaoPedagogica(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Com magistério e com IMNE completo">Com Magistério e com IMNE completo</option>
                      <option value="Sem Magistério e com formação Pedagógica">Sem Magistério e com formação Pedagógica</option>
                      <option value="Sem Magistério e sem Formação pedagógica">Sem Magistério e sem Formação pedagógica</option>
                    </select>
                  </div>

                  {/* Regime de Trabalho / Vínculo */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Regime de Trabalho / Vínculo
                    </label>
                    <select
                      value={regimeTrabalho}
                      onChange={(e) => setRegimeTrabalho(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    >
                      <option value="Efectivo">Efectivo (Quadro Definitivo MED)</option>
                      <option value="Contratado">Contratado / Regime a Termo</option>
                      <option value="Em comissão de serviço">Em Comissão de Serviço</option>
                      <option value="Colaborador">Colaborador / Eventual</option>
                      <option value="Voluntário">Voluntário</option>
                      <option value="Outro">Outro Regime</option>
                    </select>
                  </div>

                  {/* Especialidade / Disciplina */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Especialidade / Curso de Formação
                    </label>
                    <input
                      type="text"
                      value={especialidadeCurso}
                      onChange={(e) => setEspecialidadeCurso(e.target.value)}
                      placeholder="Ex: Língua Portuguesa, Matemática, Primário"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Nº do Diploma / Certificado de Habilitações */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Nº do Diploma / Certificado</span>
                      <span className="text-[10px] text-slate-400 font-normal">Se apresentado</span>
                    </label>
                    <input
                      type="text"
                      value={numeroCertificadoDiploma}
                      onChange={(e) => setNumeroCertificadoDiploma(e.target.value)}
                      placeholder="Ex: CERT-MED-74892/2025"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Nº Mecanográfico / Folha de Salário ou NIF */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Nº Mecanográfico / NIF</span>
                      <span className="text-[10px] text-slate-400 font-normal">Folha de Salário</span>
                    </label>
                    <input
                      type="text"
                      value={numeroMecanograficoOuNif}
                      onChange={(e) => setNumeroMecanograficoOuNif(e.target.value)}
                      placeholder="Ex: MEC-109283 / NIF"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Data de Início de Funções */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Data de Início de Funções
                    </label>
                    <input
                      type="date"
                      value={dataInicioFuncoes}
                      onChange={(e) => setDataInicioFuncoes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Validação Documental em mãos */}
                <div className="bg-white p-3 rounded-xl border border-amber-200/90 flex items-start gap-3">
                  <input
                    id="doc-check"
                    type="checkbox"
                    checked={documentosConferidosPresencialmente}
                    onChange={(e) => setDocumentosConferidosPresencialmente(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="doc-check" className="text-xs text-slate-700 cursor-pointer select-none">
                    <strong className="text-slate-900 block font-semibold">
                      Documentação física em mãos conferida pelo Diretor(a)
                    </strong>
                    <span className="text-[11px] text-slate-500 block">
                      Confirmo que verifiquei os documentos originais / cópias autenticadas (Bilhete de Identidade, Certificado de Habilitações, Atestado Médico ou Registo Criminal).
                    </span>
                  </label>
                </div>
              </div>

              {/* SEÇÃO 3: Despacho / Observações */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Despacho / Parecer Oficial da Direção
                </label>
                <textarea
                  rows={2}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Parecer ou notas para o livro de registos da escola..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  Ao confirmar a homologação, os dados complementares são salvos no dossiê oficial, a conta é ativada no uCore e o utilizador é integrado no quadro com acesso imediato.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 rounded-b-2xl flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Homologação vinculada a: <strong className="text-slate-700">{directorName}</strong>
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmApprove}
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
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

              {/* Complementary data if available */}
              {(selectedApp.nivelAcademico || typeof selectedApp.anosServico === 'number' || selectedApp.regimeTrabalho) && (
                <div className="p-3 bg-amber-50/70 rounded-xl space-y-2 border border-amber-200 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                    <GraduationCap className="w-4 h-4 text-amber-700" />
                    <span>Dados de Enquadramento Oficial (Conferidos pelo Diretor)</span>
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
                      <span>Documentação física original em mãos confirmada</span>
                    </div>
                  )}
                </div>
              )}

              {selectedApp.notes && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-700 block mb-1">Notas do Processo:</span>
                  <p className="text-slate-800">{selectedApp.notes}</p>
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
                    className="px-4 py-2 bg-[#f75142] hover:bg-[#e04335] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Homologar com Documentos</span>
                  </button>
                )}
              </div>
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
