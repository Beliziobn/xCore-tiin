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
  Trash2
} from 'lucide-react';
import type { QuickServiceRequest, QuickServiceStatus, QuickServiceType, UserAccount } from '../../types';
import { fetchQuickRequests, updateQuickRequestStatus, deleteQuickRequest, clearAllQuickRequests } from '../../utils/quickServicesStorage';
import { OfficialDocumentModal } from './OfficialDocumentModal';
import { isFemaleFirstName } from '../../utils/genderGrammar';

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
  
  // Modals state
  const [documentModalRequest, setDocumentModalRequest] = useState<QuickServiceRequest | null>(null);
  const [notifyModalRequest, setNotifyModalRequest] = useState<QuickServiceRequest | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [targetStatus, setTargetStatus] = useState<QuickServiceStatus>('CONCLUIDO');
  const [isDispatching, setIsDispatching] = useState(false);
  const [copiedProtocol, setCopiedProtocol] = useState<string | null>(null);

  const isMasterAdmin =
    currentUser?.email?.trim().toLowerCase() === 'dmedoquessua@gmail.com' ||
    currentUser?.role === 'admin' ||
    activeRole === 'admin';

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
      const res = await clearAllQuickRequests();
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
    // Live polling every 6 seconds to capture new public citizen submissions
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

  // Filter requests based on user role and assigned scope
  const scopedRequests = useMemo(() => {
    // Master admin dmedoquessua@gmail.com or municipal admin has full scope across all schools and services
    if (isMasterAdmin) {
      return requests;
    }

    if (activeRole === 'diretor') {
      const dirSchool = (schoolName || currentUser?.schoolName || '').trim().toLowerCase();
      return requests.filter((r) => {
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
  }, [requests, isMasterAdmin, activeRole, schoolName, currentUser]);

  // Apply service type, status filter and search query
  const displayedRequests = useMemo(() => {
    return scopedRequests.filter((r) => {
      if (typeFilter !== 'TODOS' && r.serviceType !== typeFilter) {
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
        const matchesPurpose = (r.details?.purpose || '').toLowerCase().includes(query);
        return (
          matchesProtocol ||
          matchesRequester ||
          matchesPhone ||
          matchesStudent ||
          matchesEmployee ||
          matchesSchool ||
          matchesPurpose
        );
      }
      return true;
    });
  }, [scopedRequests, typeFilter, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      total: scopedRequests.length,
      pendentes: scopedRequests.filter((r) => r.status === 'PENDENTE').length,
      emAnalise: scopedRequests.filter((r) => r.status === 'EM_ANALISE').length,
      concluidos: scopedRequests.filter((r) => r.status === 'CONCLUIDO').length,
      efectividade: scopedRequests.filter((r) => r.serviceType === 'DECLARACAO_EFECTIVIDADE').length,
      servico: scopedRequests.filter((r) => r.serviceType === 'DECLARACAO_SERVICO').length,
      ferias: scopedRequests.filter((r) => r.serviceType === 'GUIA_FERIAS').length,
      colocacao: scopedRequests.filter((r) => r.serviceType === 'GUIA_COLOCACAO').length,
      boletins: scopedRequests.filter((r) => r.serviceType === 'BOLETIM_NOTAS').length,
      matriculas: scopedRequests.filter((r) => r.serviceType === 'DECLARACAO_MATRICULA').length,
      transferencias: scopedRequests.filter((r) => r.serviceType === 'GUIA_TRANSFERENCIA').length,
    };
  }, [scopedRequests]);

  const handleCopyProtocol = (protocol: string) => {
    navigator.clipboard.writeText(protocol);
    setCopiedProtocol(protocol);
    if (showToast) showToast(`Protocolo "${protocol}" copiado para a área de transferência!`);
    setTimeout(() => setCopiedProtocol(null), 2500);
  };

  const handleOpenNotifyModal = (
    req: QuickServiceRequest,
    presetType: 'LEVANTAMENTO' | 'CONCLUIDO' | 'EM_ANALISE' | 'COMPARECER' = 'LEVANTAMENTO'
  ) => {
    setNotifyModalRequest(req);
    const citizenName = req.requesterName || 'Cidadão';
    const isFem = isFemaleFirstName(req.details?.employeeName || req.requesterName);
    const saudacao = isFem ? `Exma. Senhora ${citizenName}` : `Exmo. Senhor ${citizenName}`;
    const munidoMunida = isFem ? 'munida' : 'munido';
    const proto = req.protocol;
    const servTitle = req.title;

    if (presetType === 'LEVANTAMENTO') {
      setTargetStatus('CONCLUIDO');
      setNotificationMessage(
        `${saudacao}, informamos que o seu pedido com protocolo nº ${proto} (${servTitle}) foi deferido com sucesso pelos serviços da Direcção Municipal da Educação do Quêssua. O documento oficial encontra-se devidamente emitido, assinado e autenticado, pronto para levantamento presencial na nossa instituição (Secretaria Geral), nos dias úteis das 08h00 às 15h30. Por favor, compareça ${munidoMunida} do seu Bilhete de Identidade original.`
      );
    } else if (presetType === 'CONCLUIDO') {
      setTargetStatus('CONCLUIDO');
      setNotificationMessage(
        `${saudacao}, confirmamos que a sua solicitação ${proto} (${servTitle}) foi processada com êxito pela Direcção Municipal da Educação. O documento encontra-se concluído e pronto.`
      );
    } else if (presetType === 'EM_ANALISE') {
      setTargetStatus('EM_ANALISE');
      setNotificationMessage(
        `${saudacao}, a sua solicitação com protocolo ${proto} foi recebida e encontra-se presentemente em fase de análise e conferência nos arquivos da Repartição da Educação.`
      );
    } else {
      setTargetStatus('EM_ANALISE');
      setNotificationMessage(
        `${saudacao}, referente ao pedido ${proto}, solicitamos que compareça à Direcção Municipal da Educação (Secretaria Geral) para apresentação de documentação complementar necessária à emissão do documento.`
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
        window.open(`https://wa.me/${fullPhone}?text=${encoded}`, '_blank');
      }

      setNotifyModalRequest(null);
    } else {
      if (showToast) {
        showToast(res.error || 'Erro ao gravar o despacho do pedido.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-[14px] p-6 border border-[#e8e8ea] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#002133] tracking-tight">
              Serviços Rápidos & Despachos de Cidadãos
            </h1>
            {isMasterAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f4f4f6] text-[#52606d] border border-[#e8e8ea]">
                Gabinete Central DME • dmedoquessua@gmail.com
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#52606d] mt-1">
            Recepção, verificação e emissão de declarações de efectividade, boletins de notas e guias solicitadas pela comunidade.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenNewRequestModal && (
            <button
              type="button"
              onClick={onOpenNewRequestModal}
              className="btn--primary text-xs flex items-center gap-2"
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
          <span className="kpi__meta text-xs mt-1">Entradas consolidadas</span>
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
          <span className="kpi__meta text-xs text-[#a34a08] mt-1">Aguardam despacho</span>
        </div>

        <div
          onClick={() => setStatusFilter('EM_ANALISE')}
          className={`kpi cursor-pointer ${
            statusFilter === 'EM_ANALISE' ? 'ring-2 ring-[#002133]' : ''
          }`}
        >
          <span className="kpi__label text-xs font-medium text-[#52606d]">Em Análise</span>
          <span className="kpi__value numeric text-3xl font-bold text-[#002133] tracking-tight mt-1">
            {counts.emAnalise}
          </span>
          <span className="kpi__meta text-xs text-[#52606d] mt-1">Na secretaria / repartição</span>
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
          <span className="kpi__meta text-xs text-[#0b7a54] mt-1">Prontos ou entregues</span>
        </div>
      </div>

      {/* Service Type Filter Tabs — Neutral Filter Chips without decorative icons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setTypeFilter('TODOS')}
          className={`filter-chip whitespace-nowrap ${typeFilter === 'TODOS' ? 'is-active' : ''}`}
        >
          Todos os Serviços ({counts.total})
        </button>

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

      {/* Search and Status Toolbar */}
      <div className="bg-white rounded-[14px] p-4 border border-[#e8e8ea] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#52606d] absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar protocolo, nome, telefone, aluno ou BI..."
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
          {(['TODOS', 'PENDENTE', 'EM_ANALISE', 'CONCLUIDO', 'REJEITADO'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`filter-chip ${statusFilter === st ? 'is-active' : ''}`}
            >
              {st === 'TODOS' && 'Todos os Estados'}
              {st === 'PENDENTE' && 'Pendentes'}
              {st === 'EM_ANALISE' && 'Em Análise'}
              {st === 'CONCLUIDO' && 'Concluídos'}
              {st === 'REJEITADO' && 'Rejeitados'}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List — Flat Surface Cards (Zero Card-in-Card nested gray boxes) */}
      {isLoading && requests.length === 0 ? (
        <div className="bg-white rounded-[14px] p-12 border border-[#e8e8ea] text-center">
          <Loader2 className="w-7 h-7 text-[#002133] animate-spin mx-auto mb-2" />
          <p className="text-sm font-medium text-[#52606d]">A carregar solicitações em tempo real...</p>
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="bg-white rounded-[14px] p-12 border border-[#e8e8ea] text-center space-y-3">
          <h3 className="text-base font-semibold text-[#002133]">
            Nenhuma solicitação encontrada com os filtros actuais
          </h3>
          <p className="text-xs text-[#52606d] max-w-md mx-auto">
            {searchQuery || statusFilter !== 'TODOS' || typeFilter !== 'TODOS'
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
              Limpar Filtros e Ver Todos ({counts.total})
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedRequests.map((req) => {
            const cleanPhone = (req.requesterPhone || '').replace(/\D/g, '');
            const fullPhone = cleanPhone.startsWith('244') ? cleanPhone : `244${cleanPhone}`;
            const details = req.details || {};

            return (
              <div
                key={req.id}
                className="bg-white rounded-[14px] p-5 border border-[#e8e8ea] hover:border-[#d1d1d6] transition-colors"
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
                      {req.status === 'CONCLUIDO' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge--success">
                          Concluído / Emitido
                        </span>
                      )}
                      {req.status === 'REJEITADO' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge--danger">
                          Requer Comparência
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
                          • {req.targetSchoolName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Zona 4: Ações Secundárias Outline (Zero botões cheios repetidos em cada card) */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDocumentModalRequest(req)}
                      className="btn--secondary text-xs flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#52606d]" />
                      <span>Emitir Documento Oficial</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenNotifyModal(req, 'LEVANTAMENTO')}
                      className="btn--secondary text-xs flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#52606d]" />
                      <span>Notificar Levantamento</span>
                    </button>

                    {req.status !== 'EM_ANALISE' && req.status !== 'CONCLUIDO' && (
                      <button
                        type="button"
                        onClick={() => handleOpenNotifyModal(req, 'EM_ANALISE')}
                        className="btn--tertiary text-xs"
                      >
                        Marcar em Análise
                      </button>
                    )}
                  </div>
                </div>

                {/* Zona 2 & 3: Dados do Pedinte e Especificações em Superfície Plana (Sem sub-caixas cinzas) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 text-xs">
                  {/* Coluna 1: Identificação do Pedinte */}
                  <div className="space-y-1.5 lg:border-r lg:border-[#e8e8ea] lg:pr-5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#52606d] uppercase tracking-wider text-[10px]">
                        Identificação do Pedinte
                      </span>
                      <span className="text-[11px] font-medium text-[#52606d]">
                        {req.requesterRoleTitle || 'Cidadão'}
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
                      Especificações & Dados Submetidos
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
                            {details.studentClasse || '8ª Classe'} - {details.studentTurma || 'A'}
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
                            {details.studentBiOrProcesso || 'Não informado'}
                          </span>
                        </div>
                      </div>
                    )}

                    {req.serviceType === 'DECLARACAO_MATRICULA' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Aluno</span>
                          <span className="font-semibold text-[#002133] text-xs">{details.studentName}</span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Classe / Ano</span>
                          <span className="font-medium text-[#002133] text-xs numeric">
                            {details.studentClasse} ({details.academicYear || '2025/2026'})
                          </span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Processo</span>
                          <span className="font-mono font-medium text-[#002133] text-xs numeric">
                            {details.studentBiOrProcesso || 'Geral'}
                          </span>
                        </div>
                      </div>
                    )}

                    {req.serviceType === 'GUIA_TRANSFERENCIA' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Aluno</span>
                          <span className="font-semibold text-[#002133] text-xs">{details.studentName}</span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Classe Atual</span>
                          <span className="font-medium text-[#002133] text-xs">{details.studentClasse}</span>
                        </div>
                        <div>
                          <span className="text-[#52606d] block text-[11px]">Destino Solicitado</span>
                          <span className="font-medium text-[#002133] text-xs">
                            {details.purpose || 'Instituição pretendida'}
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
                        <span className="font-medium text-[#002133]">Observações do Pedinte:</span>{' '}
                        <span>{details.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Despacho & Resolution History */}
                {details.responseMessage && (
                  <div className="mt-4 pt-3 border-t border-[#e8e8ea] text-xs space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-[#0b7a54]">
                      <span>Despacho Oficial Emitido ao Pedinte</span>
                      {details.resolvedAt && (
                        <span className="text-[11px] text-[#52606d] font-normal numeric">
                          Despachado em: {new Date(details.resolvedAt).toLocaleDateString('pt-PT')} por{' '}
                          {details.resolvedBy}
                        </span>
                      )}
                    </div>
                    <p className="text-[#52606d] leading-relaxed">
                      "{details.responseMessage}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Official Document Emission & Print Modal */}
      <OfficialDocumentModal
        isOpen={Boolean(documentModalRequest)}
        onClose={() => setDocumentModalRequest(null)}
        request={documentModalRequest}
        onOpenNotifyModal={(req) => handleOpenNotifyModal(req, 'LEVANTAMENTO')}
        onMarkAsConcluidoAndNotify={async (req) => {
          const author = isMasterAdmin
            ? 'Belízio dos Santos (Administrador Central DME - dmedoquessua@gmail.com)'
            : 'Direção Escolar';
          const defaultMsg = `Documento oficial referente ao protocolo ${req.protocol} foi emitido com sucesso e autenticado pela Direcção Municipal de Educação do Quêssua. Encontra-se pronto para levantamento presencial na nossa instituição.`;

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
                  Notificar Pedinte & Instruções de Levantamento
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
                Modelos de Notificação Imediata
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleOpenNotifyModal(notifyModalRequest, 'LEVANTAMENTO')}
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-xl text-left font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>🏛️ Levantamento na Instituição</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenNotifyModal(notifyModalRequest, 'CONCLUIDO')}
                  className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 rounded-xl text-left font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>✅ Documento Emitido / Pronto</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenNotifyModal(notifyModalRequest, 'EM_ANALISE')}
                  className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-xl text-left font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>⏳ Em Análise na Repartição</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenNotifyModal(notifyModalRequest, 'COMPARECER')}
                  className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200 rounded-xl text-left font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>⚠️ Documentos Complementares</span>
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
                <option value="CONCLUIDO">Concluído (Documento emitido / Disponível para levantamento)</option>
                <option value="EM_ANALISE">Em Análise (Processamento nos arquivos escolares)</option>
                <option value="PENDENTE">Pendente</option>
                <option value="REJEITADO">Requer Comparência Presencial</option>
              </select>
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mensagem Oficial ao Pedinte (Visualizada na Consulta & Enviada por WhatsApp) *
              </label>
              <textarea
                rows={5}
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Escreva as orientações para o pedinte comparecer à instituição..."
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
                  <span>Registar Despacho Oficial</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
