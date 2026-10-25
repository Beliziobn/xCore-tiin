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
  ArrowRight
} from 'lucide-react';
import type { QuickServiceRequest, QuickServiceStatus, QuickServiceType, UserAccount } from '../../types';
import { fetchQuickRequests, updateQuickRequestStatus, deleteQuickRequest } from '../../utils/quickServicesStorage';
import { OfficialDocumentModal } from './OfficialDocumentModal';

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
    const proto = req.protocol;
    const servTitle = req.title;

    if (presetType === 'LEVANTAMENTO') {
      setTargetStatus('CONCLUIDO');
      setNotificationMessage(
        `Exmo(a) Sr(a). ${citizenName}, informamos que o seu pedido com protocolo nº ${proto} (${servTitle}) foi deferido com sucesso pelos serviços da Direcção Municipal da Educação do Quêssua. O documento oficial encontra-se devidamente emitido, assinado e autenticado, pronto para levantamento presencial na nossa instituição (Secretaria Geral), nos dias úteis das 08h00 às 15h30. Por favor, compareça munido(a) do seu Bilhete de Identidade original.`
      );
    } else if (presetType === 'CONCLUIDO') {
      setTargetStatus('CONCLUIDO');
      setNotificationMessage(
        `Exmo(a) Sr(a). ${citizenName}, confirmamos que a sua solicitação ${proto} (${servTitle}) foi processada com êxito pela Direcção Municipal da Educação. O documento encontra-se concluído e pronto.`
      );
    } else if (presetType === 'EM_ANALISE') {
      setTargetStatus('EM_ANALISE');
      setNotificationMessage(
        `Exmo(a) Sr(a). ${citizenName}, a sua solicitação com protocolo ${proto} foi recebida e encontra-se presentemente em fase de análise e conferência nos arquivos da Repartição da Educação.`
      );
    } else {
      setTargetStatus('EM_ANALISE');
      setNotificationMessage(
        `Exmo(a) Sr(a). ${citizenName}, referente ao pedido ${proto}, solicitamos que compareça à Direcção Municipal da Educação (Secretaria Geral) para apresentação de documentação complementar necessária à emissão do documento.`
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
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#002133] text-amber-400 flex items-center justify-center shrink-0 border border-slate-800 shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#002133] tracking-tight">
                Serviços Rápidos & Despachos de Cidadãos
              </h1>
              {isMasterAdmin && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-200">
                  Gabinete Central DME • dmedoquessua@gmail.com
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Recepção, verificação e emissão de declarações de efectividade, boletins de notas e guias solicitadas pela comunidade.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenNewRequestModal && (
            <button
              type="button"
              onClick={onOpenNewRequestModal}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              title="Registar nova solicitação de cidadão/utente"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>+ Novo Pedido</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadRequests}
            disabled={isLoading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          {isMasterAdmin && onNavigateToDeclaracaoEfectividade && (
            <button
              type="button"
              onClick={onNavigateToDeclaracaoEfectividade}
              className="px-4 py-2.5 bg-[#002133] hover:bg-[#00314a] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Emitir Efectividade</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => {
            setStatusFilter('TODOS');
            setTypeFilter('TODOS');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'TODOS' && typeFilter === 'TODOS'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-75">Total de Pedidos</div>
          <div className="text-2xl font-black mt-1">{counts.total}</div>
          <div className="text-[10px] opacity-75 mt-0.5">Entradas em tempo real</div>
        </div>

        <div
          onClick={() => setStatusFilter('PENDENTE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'PENDENTE'
              ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20'
              : 'bg-white text-amber-900 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pendentes</span>
            {counts.pendentes > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-black mt-1">{counts.pendentes}</div>
          <div className="text-[10px] opacity-80 mt-0.5">Aguardam despacho</div>
        </div>

        <div
          onClick={() => setStatusFilter('EM_ANALISE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'EM_ANALISE'
              ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-600/20'
              : 'bg-white text-blue-900 border-blue-200 hover:border-blue-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider">Em Análise</div>
          <div className="text-2xl font-black mt-1">{counts.emAnalise}</div>
          <div className="text-[10px] opacity-80 mt-0.5">Na secretaria / repartição</div>
        </div>

        <div
          onClick={() => setStatusFilter('CONCLUIDO')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'CONCLUIDO'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-600/20'
              : 'bg-white text-emerald-900 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider">Concluídos / Emitidos</div>
          <div className="text-2xl font-black mt-1">{counts.concluidos}</div>
          <div className="text-[10px] opacity-80 mt-0.5">Prontos ou entregues</div>
        </div>
      </div>

      {/* Service Type Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setTypeFilter('TODOS')}
          className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            typeFilter === 'TODOS'
              ? 'bg-[#002133] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todos os Serviços ({counts.total})
        </button>

        <button
          type="button"
          onClick={() => setTypeFilter('DECLARACAO_EFECTIVIDADE')}
          className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            typeFilter === 'DECLARACAO_EFECTIVIDADE'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Efectividade DME ({counts.efectividade})</span>
        </button>

        <button
          type="button"
          onClick={() => setTypeFilter('BOLETIM_NOTAS')}
          className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            typeFilter === 'BOLETIM_NOTAS'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Boletins de Notas ({counts.boletins})</span>
        </button>

        <button
          type="button"
          onClick={() => setTypeFilter('DECLARACAO_MATRICULA')}
          className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            typeFilter === 'DECLARACAO_MATRICULA'
              ? 'bg-indigo-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Matrículas & Frequência ({counts.matriculas})</span>
        </button>

        <button
          type="button"
          onClick={() => setTypeFilter('GUIA_TRANSFERENCIA')}
          className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            typeFilter === 'GUIA_TRANSFERENCIA'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Transferências ({counts.transferencias})</span>
        </button>
      </div>

      {/* Search and Status Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar protocolo, nome, telefone, aluno ou BI..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#002133] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
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

      {/* Requests List */}
      {isLoading && requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">A carregar solicitações em tempo real...</p>
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhuma solicitação encontrada com os filtros actuais
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
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
              className="px-4 py-2 bg-[#002133] hover:bg-[#00314a] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Limpar Filtros e Ver Todos ({counts.total})
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {displayedRequests.map((req) => {
            const cleanPhone = (req.requesterPhone || '').replace(/\D/g, '');
            const fullPhone = cleanPhone.startsWith('244') ? cleanPhone : `244${cleanPhone}`;
            const details = req.details || {};

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-xs ${
                  req.status === 'PENDENTE'
                    ? 'border-amber-300 bg-amber-50/15 ring-1 ring-amber-300/60'
                    : req.status === 'EM_ANALISE'
                    ? 'border-blue-200 hover:border-blue-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Request Header Banner */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        req.serviceType === 'BOLETIM_NOTAS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.serviceType === 'DECLARACAO_EFECTIVIDADE'
                          ? 'bg-blue-100 text-blue-800'
                          : req.serviceType === 'DECLARACAO_MATRICULA'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.serviceType === 'BOLETIM_NOTAS' && <GraduationCap className="w-6 h-6" />}
                      {req.serviceType === 'DECLARACAO_EFECTIVIDADE' && <FileCheck className="w-6 h-6" />}
                      {req.serviceType === 'DECLARACAO_MATRICULA' && <FileText className="w-6 h-6" />}
                      {req.serviceType === 'GUIA_TRANSFERENCIA' && <ExternalLink className="w-6 h-6" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyProtocol(req.protocol)}
                          className="font-mono font-black text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-amber-400 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Clique para copiar protocolo"
                        >
                          <span>{req.protocol}</span>
                          <Copy className="w-3 h-3 text-slate-400" />
                        </button>

                        <h3 className="text-base font-black text-[#002133]">{req.title}</h3>

                        {req.status === 'PENDENTE' && (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black uppercase rounded-full border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                            <span>Pendente</span>
                          </span>
                        )}
                        {req.status === 'EM_ANALISE' && (
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-black uppercase rounded-full border border-blue-300">
                            Em Análise
                          </span>
                        )}
                        {req.status === 'CONCLUIDO' && (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase rounded-full border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Concluído / Emitido</span>
                          </span>
                        )}
                        {req.status === 'REJEITADO' && (
                          <span className="px-2.5 py-0.5 bg-rose-100 text-rose-900 text-[10px] font-black uppercase rounded-full border border-rose-300">
                            Requer Comparência
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                        <span>
                          Submetido: {new Date(req.createdAt).toLocaleDateString('pt-PT')} às{' '}
                          {new Date(req.createdAt).toLocaleTimeString('pt-PT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {req.targetSchoolName && (
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <School className="w-3.5 h-3.5 text-slate-400" />
                            {req.targetSchoolName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Action Buttons: EMIT DOCUMENT & NOTIFY */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDocumentModalRequest(req)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Emitir Documento Oficial</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenNotifyModal(req, 'LEVANTAMENTO')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Notificar Levantamento</span>
                    </button>

                    {req.status !== 'EM_ANALISE' && req.status !== 'CONCLUIDO' && (
                      <button
                        type="button"
                        onClick={() => handleOpenNotifyModal(req, 'EM_ANALISE')}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 inline mr-1" />
                        <span>Em Análise</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Content Grid: Citizen Contact & Request Data */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4 text-xs">
                  {/* Citizen Contact Card */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        Identificação do Pedinte
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {req.requesterRoleTitle || 'Cidadão'}
                      </span>
                    </div>

                    <div className="font-black text-sm text-slate-900">{req.requesterName}</div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={`https://wa.me/${fullPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg font-bold flex items-center gap-1 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-emerald-700" />
                        <span>WhatsApp: {req.requesterPhone}</span>
                      </a>

                      <a
                        href={`tel:${cleanPhone}`}
                        className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold"
                        title="Ligar"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {req.requesterEmail && (
                      <div className="text-slate-600 flex items-center gap-1.5 pt-1 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={`mailto:${req.requesterEmail}`}
                          className="hover:underline text-indigo-600 truncate"
                        >
                          {req.requesterEmail}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Specification & Data Fields */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 lg:col-span-2">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                      Especificações & Dados Submetidos
                    </span>

                    {/* Declaração de Efectividade Fields */}
                    {req.serviceType === 'DECLARACAO_EFECTIVIDADE' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Funcionário(a):</span>
                          <span className="font-black text-slate-900 text-xs">
                            {details.employeeName || req.requesterName}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">B.I. / Agente:</span>
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {details.employeeBi || 'Registo Geral'}
                            {details.employeeAgente ? ` (${details.employeeAgente})` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Categoria:</span>
                          <span className="font-semibold text-slate-800 text-xs">
                            {details.employeeCategory || 'Docente'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Mês de Referência:</span>
                          <span className="font-bold text-indigo-800 text-xs">
                            {details.referenceMonthYear || '2026'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Boletim de Notas Fields */}
                    {req.serviceType === 'BOLETIM_NOTAS' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Estudante:</span>
                          <span className="font-black text-slate-900 text-xs">
                            {details.studentName || 'Nome do Aluno'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Classe / Turma:</span>
                          <span className="font-bold text-slate-800 text-xs">
                            {details.studentClasse || '8ª Classe'} - {details.studentTurma || 'A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Trimestre:</span>
                          <span className="font-bold text-indigo-800 text-xs">
                            {details.trimestre || '1º Trimestre'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">B.I. / Processo:</span>
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {details.studentBiOrProcesso || 'Não informado'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Matrícula Fields */}
                    {req.serviceType === 'DECLARACAO_MATRICULA' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Aluno:</span>
                          <span className="font-black text-slate-900 text-xs">{details.studentName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Classe / Ano:</span>
                          <span className="font-bold text-slate-800 text-xs">
                            {details.studentClasse} ({details.academicYear || '2025/2026'})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Processo:</span>
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {details.studentBiOrProcesso || 'Geral'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Guia de Transferência Fields */}
                    {req.serviceType === 'GUIA_TRANSFERENCIA' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Aluno:</span>
                          <span className="font-black text-slate-900 text-xs">{details.studentName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Classe Atual:</span>
                          <span className="font-bold text-slate-800 text-xs">{details.studentClasse}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Destino Solicitado:</span>
                          <span className="font-bold text-indigo-800 text-xs">
                            {details.purpose || 'Instituição pretendida'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Purpose / Legal destination if applicable */}
                    {details.purpose && req.serviceType !== 'GUIA_TRANSFERENCIA' && (
                      <div className="text-slate-600 text-xs pt-1 border-t border-slate-200/60">
                        <span className="font-semibold text-slate-700">Finalidade Declarada:</span>{' '}
                        {details.purpose}
                      </div>
                    )}

                    {/* Citizen Notes */}
                    {details.notes && (
                      <div className="text-slate-600 text-xs pt-1">
                        <span className="font-semibold text-slate-700">Observações do Pedinte:</span>{' '}
                        <span className="italic">{details.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Despacho & Resolution History */}
                {details.responseMessage && (
                  <div className="mt-3.5 bg-emerald-50/70 border border-emerald-300/80 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-emerald-950">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Despacho Oficial Emitido ao Pedinte:</span>
                      </span>
                      {details.resolvedAt && (
                        <span className="text-[10px] text-emerald-700 font-medium">
                          Despachado em: {new Date(details.resolvedAt).toLocaleDateString('pt-PT')} por{' '}
                          {details.resolvedBy}
                        </span>
                      )}
                    </div>
                    <p className="text-emerald-900 leading-relaxed italic pl-5">
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
