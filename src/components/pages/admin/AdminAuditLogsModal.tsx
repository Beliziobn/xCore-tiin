import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Info,
  Clock,
  User,
  Filter,
  Download,
  RefreshCw,
  Search,
  Lock,
  RotateCcw,
  CheckCircle2,
  Undo2,
  ShieldAlert,
} from 'lucide-react';
import { AuditLogger } from '../../../services/auditLogger';
import { RollbackManager, StateTransaction } from '../../../services/rollbackManager';
import { AuditLog, AuditSeverity } from '../../../types/audit';

interface AdminAuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminAuditLogsModal: React.FC<AdminAuditLogsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'rollback'>('audit');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [transactions, setTransactions] = useState<StateTransaction[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<AuditSeverity | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rollbackStatusMessage, setRollbackStatusMessage] = useState<string | null>(null);

  const loadData = () => {
    setIsRefreshing(true);
    try {
      const fetchedLogs = AuditLogger.getAuditLogs();
      setLogs(fetchedLogs);
      const fetchedTx = RollbackManager.getTransactions();
      setTransactions(fetchedTx);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRollback = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    const confirmMsg = `Tem a certeza de que pretende reverter a operação "${tx.description}" (${tx.entityType} ID: ${tx.entityId})? Esta ação restaurará o estado anterior.`;
    if (!window.confirm(confirmMsg)) return;

    const result = RollbackManager.rollback(txId, {
      id: 'admin-current',
      name: 'Super Administrador',
      role: 'admin',
    });

    if (result.success) {
      setRollbackStatusMessage(result.message);
      loadData();
    } else {
      alert(`Falha no rollback: ${result.message}`);
    }

    setTimeout(() => setRollbackStatusMessage(null), 5000);
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedSeverity !== 'ALL' && log.severity !== selectedSeverity) {
      return false;
    }
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term) ||
      (log.actorEmail && log.actorEmail.toLowerCase().includes(term)) ||
      log.actorRole.toLowerCase().includes(term) ||
      (log.targetType && log.targetType.toLowerCase().includes(term))
    );
  });

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      tx.description.toLowerCase().includes(term) ||
      tx.entityType.toLowerCase().includes(term) ||
      tx.entityId.toLowerCase().includes(term) ||
      tx.action.toLowerCase().includes(term) ||
      tx.authorName.toLowerCase().includes(term)
    );
  });

  const getSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> Crítico
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> Aviso
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <Info className="w-3 h-3" /> Info
          </span>
        );
    }
  };

  const exportLogsAsJson = () => {
    const exportData = activeTab === 'audit' ? logs : transactions;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `ucore_${activeTab}_export_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/20 rounded-xl border border-brand-500/30 text-brand-400">
              <Lock className="w-6 h-6 text-[#f75142]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Segurança, Auditoria & Rollback (SSD)
                </h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-xs font-mono">
                  Zero Trust / Atomic Rollback
                </span>
              </div>
              <p className="text-sm text-slate-300">
                Trilha imutável de auditoria, proteção contra IDOR, validação simultânea e reversão atómica de estado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              title="Atualizar dados"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportLogsAsJson}
              title="Exportar JSON"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-600 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Exportar
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security Metrics Banner */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>RLS:</strong> Least-Privilege
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              <strong>IDOR:</strong> Protegido
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Dual Valid.:</strong> Síncrona
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Rollback:</strong> Ativo ({transactions.length})
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Lock className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Anti-Cópia:</strong> Ativo
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 pt-2">
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-[#f75142] text-[#f75142] bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" /> Trilha de Auditoria ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('rollback')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'rollback'
                ? 'border-[#f75142] text-[#f75142] bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-4 h-4" /> Histórico de Transações & Rollback ({transactions.length})
          </button>
        </div>

        {/* Rollback Notification Message */}
        {rollbackStatusMessage && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{rollbackStatusMessage}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'audit' ? 'Pesquisar ação, ator ou detalhes...' : 'Pesquisar transação, entidade, autor...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {activeTab === 'audit' && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Severidade:</span>
              <div className="flex gap-1">
                {(['ALL', 'INFO', 'WARNING', 'CRITICAL'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                      selectedSeverity === sev
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sev === 'ALL' ? 'Todos' : sev}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Trilha de Auditoria */}
        {activeTab === 'audit' && (
          <div className="flex-1 overflow-y-auto p-6">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300" />
                <p className="text-base font-medium text-slate-600">Nenhum registo de auditoria encontrado</p>
                <p className="text-xs text-slate-400 mt-1">Ajuste os filtros de pesquisa ou gere uma ação no sistema.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-colors shadow-sm text-left flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getSeverityBadge(log.severity)}
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                        {log.targetType && (
                          <span className="text-xs text-slate-500">
                            Alvo: <strong className="text-slate-700">{log.targetType}</strong>
                          </span>
                        )}
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <span className="text-xs font-mono text-slate-400">
                          {new Date(log.timestamp).toLocaleString('pt-AO')}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 font-sans">{log.details}</p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {log.actorEmail || log.actorId} ({log.actorRole})
                        </span>
                        {log.checksum && (
                          <span className="hidden sm:inline text-slate-400">
                            Assinatura: {log.checksum}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400">ID: {log.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Histórico de Transações & Rollback */}
        {activeTab === 'rollback' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-4 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Mecanismo de Rollback Atómico:</strong> Permite anular operações indevidas e restaurar o estado cadastral anterior de Estudantes, Docentes e Instituições com preservação integral de rastreabilidade.
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <RotateCcw className="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300" />
                <p className="text-base font-medium text-slate-600">Nenhuma transação registada para reversão</p>
                <p className="text-xs text-slate-400 mt-1">Operações de cadastro, atualização ou exclusão aparecerão aqui automaticamente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-4 rounded-xl border transition-colors shadow-sm text-left flex flex-col gap-2 ${
                      tx.rolledBack
                        ? 'border-slate-200 bg-slate-50/60 opacity-80'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                            tx.action === 'CREATE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.action === 'UPDATE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tx.action}
                        </span>

                        <span className="text-xs font-bold text-slate-700 uppercase">
                          Entidade: {tx.entityType}
                        </span>

                        <span className="text-xs font-mono text-slate-500">
                          ID: {tx.entityId}
                        </span>

                        {tx.rolledBack ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Undo2 className="w-3 h-3" /> Revertido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Ativo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!tx.rolledBack && (
                          <button
                            onClick={() => handleRollback(tx.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reverter (Rollback)
                          </button>
                        )}
                        <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
                          {new Date(tx.timestamp).toLocaleString('pt-AO')}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-800 font-sans font-medium">{tx.description}</p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Autor: {tx.authorName} ({tx.authorRole})
                      </span>

                      {tx.rolledBack && tx.rolledBackBy && (
                        <span className="text-amber-700">
                          Revertido por: {tx.rolledBackBy} às {tx.rolledBackAt ? new Date(tx.rolledBackAt).toLocaleTimeString('pt-AO') : ''}
                        </span>
                      )}

                      <span className="text-slate-400">TxID: {tx.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Apenas administradores credenciados podem executar reversão e inspecionar trilhas atómicas.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};
