import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  School,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Edit3,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Users,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  X,
  FileText,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { Hero } from '../../Hero';
import type { AdminDirector, AdminSchool, DirectorRegistrationData, PendingApplication } from '../../../types';
import { getStoredDirectors, saveDirector, buildInitialDirectorDossier } from '../../../utils/directorStorage';
import { getPendingApplications, approveApplication, rejectApplication } from '../../../utils/authApprovalStorage';
import { DirectorDetailModal } from '../../modals/DirectorDetailModal';
import { DirectorRegistrationModal } from '../../modals/DirectorRegistrationModal';
import { DirectorApplicationModal } from '../../modals/DirectorApplicationModal';

interface AdminDirectorsPageProps {
  onOpenGetStarted: () => void;
  directors: AdminDirector[];
  schools: AdminSchool[];
  onOpenRegisterModal: () => void;
  onUpdateDirector?: (director: AdminDirector) => void;
  onAddDirector?: (director: AdminDirector) => void;
  onNavigateToApprovals?: () => void;
  isLoggedIn?: boolean;
}

export const AdminDirectorsPage: React.FC<AdminDirectorsPageProps> = ({
  onOpenGetStarted,
  directors,
  schools,
  onOpenRegisterModal,
  onUpdateDirector,
  onAddDirector,
  onNavigateToApprovals,
  isLoggedIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [naturezaFilter, setNaturezaFilter] = useState('all');
  const [formacaoFilter, setFormacaoFilter] = useState('all');

  // Pagination state (default: 10 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detailed stored director registration records (source of truth for rich dossiers)
  const [detailedDirectors, setDetailedDirectors] = useState<DirectorRegistrationData[]>(() => {
    return getStoredDirectors();
  });

  // Modals / Drawer state
  const [detailModalDirector, setDetailModalDirector] = useState<DirectorRegistrationData | null>(null);
  const [editingDirectorData, setEditingDirectorData] = useState<DirectorRegistrationData | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Pending Director Candidacies Workflow State
  const [activeTab, setActiveTab] = useState<'diretores' | 'candidaturas'>('diretores');
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>(() => {
    return getPendingApplications('diretor').filter((a) => a.status === 'pendente');
  });
  const [selectedApplication, setSelectedApplication] = useState<PendingApplication | null>(null);
  const [approvalToast, setApprovalToast] = useState<string | null>(null);

  const refreshPending = () => {
    setPendingApplications(getPendingApplications('diretor').filter((a) => a.status === 'pendente'));
  };

  // Sync stored directors and pending candidacies on mount and real-time updates
  useEffect(() => {
    const handleSync = () => {
      setDetailedDirectors(getStoredDirectors());
      refreshPending();
    };
    handleSync();
    window.addEventListener('sigre-data-synced', handleSync);
    return () => window.removeEventListener('sigre-data-synced', handleSync);
  }, []);

  const handleApproveApplication = (appId: string) => {
    const res = approveApplication(appId, 'Administrador Central (DME)');
    if (res.success && res.app) {
      const updated = res.app;
      refreshPending();
      setApprovalToast(`Candidatura de ${updated.fullName} homologada com sucesso! Diretor(a) credenciado(a).`);
      setTimeout(() => setApprovalToast(null), 4500);

      if (onAddDirector) {
        const newDirector: AdminDirector = {
          id: 'dir-' + Date.now(),
          name: updated.fullName,
          schoolName: updated.schoolName,
          email: updated.email,
          phone: updated.phone,
          status: 'Ativo',
          appointmentYear: 2026,
          performanceRating: 9.8,
          teachersCount: 24,
          studentsCount: 650,
          location: updated.municipality || 'Luanda',
        };
        onAddDirector(newDirector);
      }
    }
  };

  const handleRejectApplication = (appId: string, reason: string) => {
    const res = rejectApplication(appId, reason, 'Administrador Central (DME)');
    if (res.success) {
      refreshPending();
      setApprovalToast(`Candidatura recusada. Notificação emitida para o candidato.`);
      setTimeout(() => setApprovalToast(null), 4500);
    }
  };

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, naturezaFilter, formacaoFilter, pageSize]);

  // Helper to resolve detailed registration dossier for any director
  const getDossierForDirector = (d: AdminDirector): DirectorRegistrationData => {
    if (d.registrationData) return d.registrationData;
    const found = detailedDirectors.find(
      (sd) => sd.id === d.id || sd.nomeCompleto.toLowerCase() === d.name.toLowerCase() || sd.nomeEscola === d.schoolName
    );
    if (found) return found;

    const matchedSchool: AdminSchool = schools.find((s) => s.name === d.schoolName) || schools[0] || {
      id: d.id || 'esc-quessua-01',
      name: d.schoolName || 'Direcção Municipal da Educação de Quessua',
      directorName: d.name || 'Director Municipal da Educação',
      location: d.location || 'Município de Quessua',
      category: 'Ensino Primário',
      teachersCount: d.teachersCount || 0,
      roomsCount: 0,
      turmasCount: 0,
      studentsWithDocs: d.studentsCount || 0,
      studentsWithoutDocs: 0,
      performanceRate: (d.performanceRating || 0) * 10,
      attendanceRate: 100,
      phone: d.phone || '+244 923 000 000',
      email: d.email || 'dmedoquessua@gmail.com',
    };
    return buildInitialDirectorDossier(matchedSchool, 0);
  };

  // Filtered directors calculation
  const filteredDirectors = useMemo(() => {
    return directors.filter((dir) => {
      const dossier = getDossierForDirector(dir);
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        dir.name.toLowerCase().includes(query) ||
        dir.schoolName.toLowerCase().includes(query) ||
        dir.email.toLowerCase().includes(query) ||
        dir.phone.toLowerCase().includes(query) ||
        (dossier?.biNif && dossier.biNif.toLowerCase().includes(query));

      if (!matchesSearch) return false;
      if (statusFilter !== 'all' && dir.status !== statusFilter) return false;
      if (naturezaFilter !== 'all' && dossier?.naturezaEscola !== naturezaFilter) return false;
      if (formacaoFilter !== 'all' && dossier?.classificacaoPedagogica !== formacaoFilter) return false;
      return true;
    });
  }, [directors, detailedDirectors, searchTerm, statusFilter, naturezaFilter, formacaoFilter]);

  // Dynamic summary metrics calculated from actual data
  const totalDirectors = directors.length;
  const activeDirectorsCount = useMemo(() => {
    return directors.filter((d) => d.status === 'Ativo').length;
  }, [directors]);

  const evaluatingDirectorsCount = useMemo(() => {
    return directors.filter((d) => d.status === 'Em Avaliação').length;
  }, [directors]);

  // Check if any filter is active
  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    statusFilter !== 'all' ||
    naturezaFilter !== 'all' ||
    formacaoFilter !== 'all';

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setNaturezaFilter('all');
    setFormacaoFilter('all');
    setCurrentPage(1);
  };

  // Pagination slice
  const totalFiltered = filteredDirectors.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const paginatedDirectors = filteredDirectors.slice(startIndex, endIndex);

  const handleDirectorSaved = (saved: DirectorRegistrationData) => {
    saveDirector(saved, 'Administrador Municipal');
    const updatedList = getStoredDirectors();
    setDetailedDirectors(updatedList);

    const updatedAdminDirector: AdminDirector = {
      id: saved.id,
      name: saved.nomeCompleto,
      schoolName: saved.nomeEscola,
      phone: saved.telefone,
      email: saved.emailInstitucional || saved.emailPessoal,
      appointmentYear: parseInt(saved.dataNomeacao.split('-')[0], 10) || 2025,
      status: saved.situacaoMandato === 'Anterior / Histórico' ? 'Anterior' : 'Ativo',
      performanceRating: 92,
      teachersCount: saved.professoresSobDirecao || 22,
      studentsCount: saved.alunosSobDirecao || 450,
      location: `${saved.municipioEscola} (${saved.provinciaEscola})`,
      registrationData: saved,
    };

    onUpdateDirector?.(updatedAdminDirector);
    if (!directors.some((d) => d.id === saved.id)) {
      onAddDirector?.(updatedAdminDirector);
    }
    setEditingDirectorData(null);
    setIsRegisterModalOpen(false);
  };

  return (
    <div id="admin-directors-page" className="w-full min-h-screen bg-[#f8f9fb]">
      {/* Hero Header */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Meus Directores"
        customSubtitle=""
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* 1. Resumo compacto no início do body com botão Novo cadastro separado à direita */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            {/* Total de diretores */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-slate-500">Total de diretores:</span>
              <span className="text-base sm:text-lg font-bold text-[#002133]">{totalDirectors}</span>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Ativos */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {activeDirectorsCount} Ativos
              </span>
            </div>

            {/* Em avaliação */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {evaluatingDirectorsCount} Em avaliação
              </span>
            </div>
          </div>

          {/* Botão Novo cadastro à direita, separado dos filtros */}
          <button
            id="admin-btn-cadastrar-director"
            onClick={() => setIsRegisterModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Novo cadastro</span>
          </button>
        </div>

        {/* Notificação de Homologação */}
        {approvalToast && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-900">{approvalToast}</p>
            </div>
            <button
              onClick={() => setApprovalToast(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Tab Switcher: Homologados vs Candidaturas Pendentes */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          <button
            id="tab-diretores-homologados"
            onClick={() => setActiveTab('diretores')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'diretores'
                ? 'bg-[#002133] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Diretores Homologados</span>
            <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-semibold">
              {filteredDirectors.length}
            </span>
          </button>

          <button
            id="tab-candidaturas-pendentes"
            onClick={() => setActiveTab('candidaturas')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'candidaturas'
                ? 'bg-[#f75142] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Candidaturas Pendentes de Homologação</span>
            {pendingApplications.length > 0 && (
              <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-white text-[#f75142] font-black animate-pulse">
                {pendingApplications.length}
              </span>
            )}
          </button>

          {onNavigateToApprovals && (
            <button
              id="btn-goto-full-admin-approvals"
              onClick={onNavigateToApprovals}
              className="sm:ml-auto px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-amber-200" />
              <span>Central de Homologação de Inscrições</span>
            </button>
          )}
        </div>

        {/* Seção de Candidaturas Pendentes */}
        {activeTab === 'candidaturas' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Inscrições de Diretores Aguardando Validação e Despacho
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Conforme o protocolo Sigre, os novos diretores permanecem em espera até homologação pelo Administrador Central.
                  </p>
                </div>
                <button
                  onClick={refreshPending}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Atualizar
                </button>
              </div>

              {pendingApplications.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">Todas as candidaturas de diretores foram despachadas!</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Novas solicitações de gestores escolares criadas na plataforma aparecerão nesta fila de validação.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingApplications.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-white hover:shadow-md transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#002133] text-white flex items-center justify-center font-bold text-sm">
                            {app.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{app.fullName}</h4>
                            <p className="text-xs text-slate-500">{app.email}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Pendente
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Unidade Escolar:</span>
                          <span className="font-bold text-slate-800">{app.schoolName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Município / Jurisdição:</span>
                          <span className="font-semibold text-slate-700">{app.municipality}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Bilhete de Identidade:</span>
                          <span className="font-mono text-slate-800">{app.biNumber || '008921045LA044'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Submetido em:</span>
                          <span className="text-slate-600">{app.createdAt}</span>
                        </div>
                      </div>

                      {app.isPreRegistered && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Identificado no Censo Escolar Pré-Cadastrado</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">
                          Autoridade: Administrador Central
                        </span>
                        <button
                          id={`btn-validar-candidatura-${app.id}`}
                          onClick={() => setSelectedApplication(app)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Validar Candidatura</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Conteúdo do Quadro Homologado (pesquisa, filtros e tabela) */}
        {activeTab === 'diretores' && (
          <>
        {/* 2. Pesquisa com mais espaço e filtros organizados */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
          {/* Campo amplo de pesquisa */}
          <div>
            <label
              htmlFor="director-search-input"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
            >
              Pesquisar diretor
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="director-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, BI ou escola"
                className="w-full h-11 sm:h-12 pl-10 pr-10 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  title="Limpar pesquisa"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filtros em linha abaixo da pesquisa */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Filtrar por:</span>

              {/* Situação */}
              <select
                id="director-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] cursor-pointer"
              >
                <option value="all">Situação (Todas)</option>
                <option value="Ativo">Ativo ({activeDirectorsCount})</option>
                <option value="Em Avaliação">Em avaliação ({evaluatingDirectorsCount})</option>
                <option value="Anterior">Anterior</option>
              </select>

              {/* Natureza da Escola */}
              <select
                id="director-natureza-filter"
                value={naturezaFilter}
                onChange={(e) => setNaturezaFilter(e.target.value)}
                className="h-9 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] cursor-pointer"
              >
                <option value="all">Natureza da escola (Todas)</option>
                <option value="Pública">Pública</option>
                <option value="Privada">Privada</option>
                <option value="Público-Privada">Público-Privada</option>
              </select>

              {/* Classificação Pedagógica */}
              <select
                id="director-formacao-filter"
                value={formacaoFilter}
                onChange={(e) => setFormacaoFilter(e.target.value)}
                className="h-9 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] cursor-pointer"
              >
                <option value="all">Classificação pedagógica (Todas)</option>
                <option value="Com magistério e com IMNE completo">Magistério / IMNE Completo</option>
                <option value="Sem Magistério e com formação Pedagógica">Com Formação Pedagógica</option>
                <option value="Sem Magistério e sem Formação pedagógica">Sem Formação Pedagógica</option>
              </select>
            </div>

            {/* Limpar filtros visível quando houver filtros aplicados */}
            {hasActiveFilters && (
              <button
                id="director-clear-filters-btn"
                onClick={handleClearFilters}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#f75142] hover:bg-[#fef2f1] border border-[#fee4e2] transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Tabela mais legível e menos carregada (sem cartão fixo superior) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Header da listagem com contador e seletor de registros */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Listagem de Diretores
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                {totalFiltered === 0 ? (
                  <span>Nenhum diretor encontrado com os filtros selecionados</span>
                ) : (
                  <span>
                    A exibir {startIndex + 1}–{endIndex} de {totalFiltered} diretores
                    {hasActiveFilters && ' (filtrados)'}
                  </span>
                )}
              </p>
            </div>

            {/* Seletor de registros por página */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-500 font-medium">Por página:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-8 bg-slate-50 text-slate-700 text-xs font-semibold px-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#f75142] cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={31}>Todos</option>
              </select>
            </div>
          </div>

          {/* Visualização Desktop: Tabela de alta legibilidade (~14px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Diretor</th>
                  <th className="py-3.5 px-4">Escola</th>
                  <th className="py-3.5 px-4">Mandato</th>
                  <th className="py-3.5 px-4">Comunidade escolar</th>
                  <th className="py-3.5 px-4">Formação</th>
                  <th className="py-3.5 px-4">Situação</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                {paginatedDirectors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center">
                      <div className="max-w-md mx-auto text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                          <Search className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800">
                          Nenhum diretor corresponde aos critérios de pesquisa
                        </p>
                        <p className="text-xs text-slate-500">
                          Tente ajustar o termo digitado ou redefinir os filtros de situação e formação.
                        </p>
                        {hasActiveFilters && (
                          <button
                            onClick={handleClearFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f75142] text-white rounded-xl text-xs font-bold hover:bg-[#e04436] transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Limpar todos os filtros</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedDirectors.map((d) => {
                    const dossier = getDossierForDirector(d);
                    const isAtivo = d.status === 'Ativo';
                    const isEmAvaliacao = d.status === 'Em Avaliação';

                    return (
                      <tr
                        key={d.id}
                        className="hover:bg-slate-50/90 transition-colors group cursor-pointer"
                        onClick={() => setDetailModalDirector(dossier)}
                      >
                        {/* 1. Diretor: Nome em destaque (14px) e BI como secundária */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm group-hover:text-[#f75142] transition-colors">
                            {d.name}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            BI: {dossier?.biNif || '004819234LA042'}
                          </div>
                        </td>

                        {/* 2. Escola: Nome e natureza da instituição */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 text-sm">
                            {d.schoolName}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              {dossier?.naturezaEscola || 'Pública'}
                            </span>
                            <span>•</span>
                            <span>{dossier?.municipioEscola || 'Quêssua'}</span>
                          </div>
                        </td>

                        {/* 3. Mandato: Ano de início */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-700">
                            Desde {d.appointmentYear}
                          </span>
                        </td>

                        {/* 4. Comunidade escolar: Docentes e alunos claramente identificados */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-800">
                            <span className="font-semibold text-slate-900">{d.teachersCount}</span> docentes
                            <span className="text-slate-400 mx-1.5">•</span>
                            <span className="font-semibold text-slate-900">{d.studentsCount}</span> alunos
                          </div>
                        </td>

                        {/* 5. Formação: Resumo pedagógico */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <div
                            className="text-xs font-semibold text-slate-800 truncate"
                            title={dossier?.classificacaoPedagogica}
                          >
                            {dossier?.classificacaoPedagogica || 'Magistério / IMNE Completo'}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {dossier?.nivelAcademico || 'Licenciatura'}
                          </div>
                        </td>

                        {/* 6. Situação: Etiqueta verde (Ativo) e âmbar (Em avaliação) */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isAtivo && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Ativo
                            </span>
                          )}
                          {isEmAvaliacao && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Em avaliação
                            </span>
                          )}
                          {!isAtivo && !isEmAvaliacao && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              {d.status}
                            </span>
                          )}
                        </td>

                        {/* 7. Ações: Ver ficha e Editar */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div
                            className="inline-flex items-center gap-1.5 justify-end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setDetailModalDirector(dossier)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-[#002133] hover:text-white text-slate-700 transition-colors cursor-pointer"
                              title="Ver ficha completa no painel lateral"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver ficha</span>
                            </button>
                            <button
                              onClick={() => setEditingDirectorData(dossier)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:border-[#fee4e2] hover:bg-[#fef2f1] text-slate-600 hover:text-[#f75142] transition-colors cursor-pointer"
                              title="Editar ficha"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 6. Layout próprio para telemóvel: cartões compactos */}
          <div className="md:hidden divide-y divide-slate-100">
            {paginatedDirectors.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <Search className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">
                  Nenhum diretor encontrado
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f75142] text-white rounded-xl text-xs font-bold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Limpar filtros</span>
                  </button>
                )}
              </div>
            ) : (
              paginatedDirectors.map((d) => {
                const dossier = getDossierForDirector(d);
                const isAtivo = d.status === 'Ativo';
                const isEmAvaliacao = d.status === 'Em Avaliação';

                return (
                  <div
                    key={d.id}
                    className="p-4 space-y-3 hover:bg-slate-50 transition-colors"
                  >
                    {/* Linha superior: Nome e Situação */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {d.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          BI: {dossier?.biNif || '004819234LA042'}
                        </p>
                      </div>

                      {/* Situação */}
                      {isAtivo && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Ativo
                        </span>
                      )}
                      {isEmAvaliacao && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Em avaliação
                        </span>
                      )}
                      {!isAtivo && !isEmAvaliacao && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {d.status}
                        </span>
                      )}
                    </div>

                    {/* Escola e natureza */}
                    <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-[#f75142] shrink-0" />
                        <span className="truncate">{d.schoolName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                        <span>{dossier?.naturezaEscola || 'Pública'}</span>
                        <span>•</span>
                        <span>Mandato desde {d.appointmentYear}</span>
                      </div>
                    </div>

                    {/* Comunidade e formação */}
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <div>
                        <span className="font-semibold text-slate-900">{d.teachersCount}</span> docentes
                        <span className="mx-1">•</span>
                        <span className="font-semibold text-slate-900">{d.studentsCount}</span> alunos
                      </div>
                      <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                        {dossier?.classificacaoPedagogica}
                      </span>
                    </div>

                    {/* Ações no telemóvel */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setDetailModalDirector(dossier)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#002133] hover:bg-[#00314d] text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver ficha</span>
                      </button>
                      <button
                        onClick={() => setEditingDirectorData(dossier)}
                        className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 5. Paginação e controles de rodapé */}
          {totalFiltered > 0 && (
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
              <span className="text-xs text-slate-500 font-medium">
                Página {safeCurrentPage} de {totalPages} ({totalFiltered} diretores no total)
              </span>

              <div className="flex items-center gap-1">
                {/* Botão Anterior */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    safeCurrentPage <= 1
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                {/* Páginas numeradas */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        pageNum === safeCurrentPage
                          ? 'bg-[#002133] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                {/* Botão Seguinte */}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    safeCurrentPage >= totalPages
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  <span>Seguinte</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </div>

      {/* Modal: Validação de Candidatura Específica do Diretor */}
      {selectedApplication && (
        <DirectorApplicationModal
          isOpen={selectedApplication !== null}
          onClose={() => setSelectedApplication(null)}
          application={selectedApplication}
          onApprove={(appId) => {
            handleApproveApplication(appId);
            setSelectedApplication(null);
          }}
          onReject={(appId, reason) => {
            handleRejectApplication(appId, reason);
            setSelectedApplication(null);
          }}
        />
      )}

      {/* Drawer / Painel Lateral: Ver Ficha Cadastral Completa / Histórico */}
      {detailModalDirector && (
        <DirectorDetailModal
          isOpen={detailModalDirector !== null}
          onClose={() => setDetailModalDirector(null)}
          director={detailModalDirector}
          onEdit={(dir) => {
            setDetailModalDirector(null);
            setEditingDirectorData(dir);
          }}
        />
      )}

      {/* Modal: Editar Director Existente */}
      {editingDirectorData && (
        <DirectorRegistrationModal
          isOpen={editingDirectorData !== null}
          onClose={() => setEditingDirectorData(null)}
          schools={schools}
          initialData={editingDirectorData}
          authorName="Administrador Municipal"
          onSuccess={handleDirectorSaved}
        />
      )}

      {/* Modal: Homologar Novo Director */}
      {isRegisterModalOpen && (
        <DirectorRegistrationModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          schools={schools}
          authorName="Administrador Municipal"
          onSuccess={handleDirectorSaved}
        />
      )}
    </div>
  );
};

