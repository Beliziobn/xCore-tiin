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
  Sparkles
} from 'lucide-react';
import type { QuickServiceRequest, QuickServiceStatus, UserAccount } from '../../types';
import { fetchQuickRequests, updateQuickRequestStatus, deleteQuickRequest } from '../../utils/quickServicesStorage';

interface QuickRequestsManagementViewProps {
  currentUser?: UserAccount | null;
  activeRole: 'admin' | 'diretor' | 'professor';
  schoolName?: string;
  onNavigateToDeclaracaoEfectividade?: () => void;
  showToast?: (msg: string) => void;
}

export const QuickRequestsManagementView: React.FC<QuickRequestsManagementViewProps> = ({
  currentUser,
  activeRole,
  schoolName = '',
  onNavigateToDeclaracaoEfectividade,
  showToast,
}) => {
  const [requests, setRequests] = useState<QuickServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | QuickServiceStatus>('TODOS');
  const [selectedRequest, setSelectedRequest] = useState<QuickServiceRequest | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [newStatus, setNewStatus] = useState<QuickServiceStatus>('CONCLUIDO');

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await fetchQuickRequests();
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 8000);
    return () => clearInterval(interval);
  }, []);

  // Filter requests based on user role and assigned school
  const roleFilteredRequests = useMemo(() => {
    if (activeRole === 'diretor') {
      const dirSchool = (schoolName || currentUser?.schoolName || '').trim().toLowerCase();
      return requests.filter((r) => {
        // Direct routing: Requests destined for Director
        if (r.targetRole !== 'DIRECTOR') return false;
        if (!dirSchool) return true;
        const targetSchool = (r.targetSchoolName || '').trim().toLowerCase();
        return (
          targetSchool.includes(dirSchool) ||
          dirSchool.includes(targetSchool) ||
          !r.targetSchoolName
        );
      });
    }

    if (activeRole === 'admin') {
      // Municipal Admin sees all requests, prioritizing municipal declarations
      return requests;
    }

    return requests;
  }, [requests, activeRole, schoolName, currentUser]);

  // Apply search query and status filter
  const displayedRequests = useMemo(() => {
    return roleFilteredRequests.filter((r) => {
      if (statusFilter !== 'TODOS' && r.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesProtocol = r.protocol.toLowerCase().includes(query);
        const matchesRequester = r.requesterName.toLowerCase().includes(query);
        const matchesPhone = r.requesterPhone.includes(query);
        const matchesStudent = (r.details?.studentName || '').toLowerCase().includes(query);
        const matchesEmployee = (r.details?.employeeName || '').toLowerCase().includes(query);
        const matchesSchool = (r.targetSchoolName || '').toLowerCase().includes(query);
        return matchesProtocol || matchesRequester || matchesPhone || matchesStudent || matchesEmployee || matchesSchool;
      }
      return true;
    });
  }, [roleFilteredRequests, statusFilter, searchQuery]);

  const pendingCount = useMemo(() => {
    return roleFilteredRequests.filter((r) => r.status === 'PENDENTE').length;
  }, [roleFilteredRequests]);

  const handleOpenResponseModal = (req: QuickServiceRequest, targetStatus: QuickServiceStatus = 'CONCLUIDO') => {
    setSelectedRequest(req);
    setNewStatus(targetStatus);
    if (targetStatus === 'CONCLUIDO') {
      if (req.serviceType === 'BOLETIM_NOTAS') {
        setResponseMessage(
          `Boletim de notas de ${req.details?.studentName || 'estudante'} referente ao ${req.details?.trimestre || 'ano letivo'} emitido com sucesso pela Direção. O documento está disponível na secretaria da escola para levantamento.`
        );
      } else if (req.serviceType === 'DECLARACAO_EFECTIVIDADE') {
        setResponseMessage(
          `Declaração oficial de efectividade emitida e autenticada pelo Gabinete Municipal de Educação de Quêssua para os devidos efeitos legais.`
        );
      } else {
        setResponseMessage(`Pedido processado e concluído com sucesso pela Direção Escolar.`);
      }
    } else if (targetStatus === 'EM_ANALISE') {
      setResponseMessage('Pedido recebido pela Direção. Os registos académicos estão a ser consultados na pauta.');
    } else {
      setResponseMessage('Dados insuficientes para localização do registo. Por favor dirija-se à secretaria da escola.');
    }
    setResponseModalOpen(true);
  };

  const handleSaveStatusUpdate = async () => {
    if (!selectedRequest) return;
    setIsUpdating(true);

    const resolvedBy = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName} (${activeRole === 'diretor' ? 'Diretor Geral' : 'Admin Municipal'})`
      : 'Direção Escolar';

    const res = await updateQuickRequestStatus(selectedRequest.id, {
      status: newStatus,
      responseMessage: responseMessage.trim(),
      resolvedBy,
    });

    setIsUpdating(false);
    setResponseModalOpen(false);

    if (res.success && res.request) {
      setRequests((prev) =>
        prev.map((r) => (r.id === selectedRequest.id ? res.request! : r))
      );
      if (showToast) {
        showToast(`Pedido ${selectedRequest.protocol} atualizado para "${newStatus}".`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stat Cards */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#002133] tracking-tight">
                {activeRole === 'diretor'
                  ? 'Pedidos de Boletins & Serviços Rápidos da Escola'
                  : 'Serviços Rápidos & Declarações Municipais'}
              </h2>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white animate-pulse">
                  {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {activeRole === 'diretor'
                ? `Solicitações públicas feitas por pais e encarregados encaminhadas diretamente à Direção de ${schoolName || 'sua escola'}.`
                : 'Demandas públicas de efectividade e pedidos escolares encaminhados diretamente à Administração Central de Belízio.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadRequests}
            disabled={isLoading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          {activeRole === 'admin' && onNavigateToDeclaracaoEfectividade && (
            <button
              type="button"
              onClick={onNavigateToDeclaracaoEfectividade}
              className="px-4 py-2.5 bg-[#f75142] hover:bg-[#e04335] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Emitir Efectividade Oficial</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por protocolo, aluno, encarregado..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
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
              {st === 'TODOS' && 'Todos'}
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
          <p className="text-sm font-semibold text-slate-600">A carregar pedidos em tempo real...</p>
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhum pedido pendente com estes critérios
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeRole === 'diretor'
              ? 'Todos os pedidos de boletins e certificados da sua escola foram respondidos ou ainda não foram submetidos pelos encarregados.'
              : 'Nenhum pedido de efectividade ou certidão pendente no momento.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedRequests.map((req) => (
            <div
              key={req.id}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-xs ${
                req.status === 'PENDENTE'
                  ? 'border-amber-300 bg-amber-50/10 ring-1 ring-amber-200/50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    req.serviceType === 'BOLETIM_NOTAS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : req.serviceType === 'DECLARACAO_EFECTIVIDADE'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {req.serviceType === 'BOLETIM_NOTAS' && <GraduationCap className="w-5 h-5" />}
                    {req.serviceType === 'DECLARACAO_EFECTIVIDADE' && <FileCheck className="w-5 h-5" />}
                    {req.serviceType === 'DECLARACAO_MATRICULA' && <FileText className="w-5 h-5" />}
                    {req.serviceType === 'GUIA_TRANSFERENCIA' && <ExternalLink className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-xs sm:text-sm bg-slate-900 text-amber-400 px-2.5 py-0.5 rounded-lg">
                        {req.protocol}
                      </span>
                      <h4 className="text-base font-black text-[#002133]">
                        {req.title}
                      </h4>
                      {req.status === 'PENDENTE' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-full border border-amber-200">
                          Pendente
                        </span>
                      )}
                      {req.status === 'EM_ANALISE' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black uppercase rounded-full border border-blue-200">
                          Em Análise
                        </span>
                      )}
                      {req.status === 'CONCLUIDO' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full border border-emerald-200">
                          Concluído
                        </span>
                      )}
                      {req.status === 'REJEITADO' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black uppercase rounded-full border border-rose-200">
                          Rejeitado
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>Submetido em: {new Date(req.createdAt).toLocaleDateString('pt-PT')} às {new Date(req.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                      {req.targetSchoolName && (
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <School className="w-3.5 h-3.5 text-slate-400" />
                          {req.targetSchoolName}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {req.status !== 'CONCLUIDO' && (
                    <button
                      type="button"
                      onClick={() => handleOpenResponseModal(req, 'CONCLUIDO')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{req.serviceType === 'BOLETIM_NOTAS' ? 'Emitir & Concluir Boletim' : 'Concluir Pedido'}</span>
                    </button>
                  )}

                  {req.status === 'PENDENTE' && (
                    <button
                      type="button"
                      onClick={() => handleOpenResponseModal(req, 'EM_ANALISE')}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Marcar Em Análise</span>
                    </button>
                  )}

                  {req.status === 'CONCLUIDO' && (
                    <button
                      type="button"
                      onClick={() => handleOpenResponseModal(req, 'CONCLUIDO')}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Editar Resposta</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Request Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
                {/* Requester Contact */}
                <div className="bg-slate-50 p-3 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-700 uppercase tracking-wider block">
                    Contacto do Requerente
                  </span>
                  <div className="font-semibold text-slate-900">{req.requesterName}</div>
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{req.requesterPhone}</span>
                    <a
                      href={`https://wa.me/244${req.requesterPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold hover:bg-emerald-200 ml-1"
                    >
                      WhatsApp
                    </a>
                  </div>
                  {req.requesterEmail && (
                    <div className="text-slate-500 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.requesterEmail}</span>
                    </div>
                  )}
                </div>

                {/* Academic / Student Details */}
                <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 md:col-span-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider block">
                    {req.serviceType === 'BOLETIM_NOTAS' ? 'Detalhes Académicos do Aluno' : 'Especificações da Solicitação'}
                  </span>

                  {req.serviceType === 'BOLETIM_NOTAS' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <span className="text-slate-400 block">Aluno:</span>
                        <span className="font-bold text-slate-900">{req.details?.studentName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Classe / Turma:</span>
                        <span className="font-semibold text-slate-800">{req.details?.studentClasse} - {req.details?.studentTurma || 'Única'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Trimestre:</span>
                        <span className="font-bold text-indigo-700">{req.details?.trimestre}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">BI / Processo:</span>
                        <span className="font-mono text-slate-700">{req.details?.studentBiOrProcesso || 'Não informado'}</span>
                      </div>
                    </div>
                  )}

                  {req.serviceType === 'DECLARACAO_EFECTIVIDADE' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <span className="text-slate-400 block">Funcionário:</span>
                        <span className="font-bold text-slate-900">{req.details?.employeeName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">BI / Agente:</span>
                        <span className="font-mono text-slate-800">{req.details?.employeeBi} {req.details?.employeeAgente ? `(${req.details.employeeAgente})` : ''}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Categoria:</span>
                        <span className="font-semibold text-slate-800">{req.details?.employeeCategory}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Finalidade:</span>
                        <span className="font-semibold text-slate-800">{req.details?.purpose}</span>
                      </div>
                    </div>
                  )}

                  {req.details?.notes && (
                    <div className="text-slate-600 pt-1 border-t border-slate-200/60 mt-1">
                      <span className="font-semibold text-slate-700">Observações:</span> {req.details.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution Note if available */}
              {req.details?.responseMessage && (
                <div className="mt-3 bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-950">
                    <span>Despacho / Resposta emitida ao cidadão:</span>
                    {req.details.resolvedAt && (
                      <span className="text-[10px] text-emerald-700 font-normal">
                        Respondido em: {new Date(req.details.resolvedAt).toLocaleDateString('pt-PT')} por {req.details.resolvedBy}
                      </span>
                    )}
                  </div>
                  <p className="text-emerald-900 italic">"{req.details.responseMessage}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {responseModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-[#002133]">
                  Despacho da Solicitação ({selectedRequest.protocol})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esta mensagem ficará visível ao cidadão na consulta do pedido.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResponseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Estado do Pedido
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as QuickServiceStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none"
              >
                <option value="CONCLUIDO">Concluído (Documento emitido / Disponível)</option>
                <option value="EM_ANALISE">Em Análise (Processamento na secretaria)</option>
                <option value="PENDENTE">Pendente</option>
                <option value="REJEITADO">Rejeitado / Requer comparência</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mensagem de Resposta ao Requerente *
              </label>
              <textarea
                rows={4}
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Indique os detalhes do levantamento ou parecer institucional..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResponseModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveStatusUpdate}
                disabled={isUpdating || !responseMessage.trim()}
                className="px-5 py-2.5 bg-[#002133] hover:bg-[#00314a] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Gravar & Notificar Cidadão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
