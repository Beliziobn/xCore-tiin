import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  Archive,
  Calendar,
  Users,
  Building2,
  GraduationCap,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Loader2,
  Lock,
  Download,
  Clock
} from 'lucide-react';
import {
  fetchBackupsList,
  createManualBackup,
  restoreDatabaseFromBackup,
  BackupItem,
  SUPER_ADMIN_EMAIL,
  MASTER_CONFIRMATION_CODE
} from '../../services/backupService';
import type { UserAccount } from '../../types';

interface BackupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  onRestoreComplete?: () => void;
}

export const BackupManagerModal: React.FC<BackupManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRestoreComplete,
}) => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupItem | null>(null);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isSuperAdmin = currentUser?.email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL;

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const res = await fetchBackupsList();
      if (res && res.backups) {
        setBackups(res.backups);
      }
    } catch (err) {
      console.warn('Erro ao carregar backups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBackups();
      setFeedback(null);
      setSelectedBackupForRestore(null);
      setConfirmationInput('');
    }
  }, [isOpen]);

  const handleCreateSnapshot = async () => {
    setIsCreating(true);
    setFeedback(null);
    try {
      const res = await createManualBackup(
        'snapshot-manual',
        currentUser?.email || SUPER_ADMIN_EMAIL
      );
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Ponto de restauração salvo com sucesso no cofre de segurança.',
        });
        await loadBackups();
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Não foi possível gravar o backup.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao conectar ao motor de backup.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackupForRestore) return;

    if (!isSuperAdmin) {
      setFeedback({
        type: 'error',
        message: 'Apenas a conta oficial do Administrador Máximo (beliziodos20@gmail.com) pode restaurar o banco de dados.',
      });
      return;
    }

    if (confirmationInput.trim() !== MASTER_CONFIRMATION_CODE) {
      setFeedback({
        type: 'error',
        message: `Código de autorização incorreto. Digite exatamente "${MASTER_CONFIRMATION_CODE}".`,
      });
      return;
    }

    setIsRestoring(true);
    setFeedback(null);

    try {
      const res = await restoreDatabaseFromBackup(
        selectedBackupForRestore.filename,
        currentUser?.email || SUPER_ADMIN_EMAIL,
        confirmationInput.trim()
      );

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Banco de dados restaurado com sucesso! (${res.stats?.efectividade || 0} funcionários, ${res.stats?.students || 0} alunos recuperados).`,
        });
        setSelectedBackupForRestore(null);
        setConfirmationInput('');
        await loadBackups();
        if (onRestoreComplete) {
          onRestoreComplete();
        }
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Falha ao restaurar dados.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Erro inesperado na restauração.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Cofre de Backups & Integridade de Dados
                </h2>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Persistência Rígida
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Backups automáticos diários e restauração de 1 clique restrita ao Administrador Máximo Belízio.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {isSuperAdmin
                ? 'Sessão do Super Admin Belízio autenticada para restauração total.'
                : 'Acesso seguro: operações de restauração exigem a conta mestre Belízio.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateSnapshot}
              disabled={isCreating}
              className="px-4 py-2 rounded-xl bg-[#f75142] hover:bg-[#e04436] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Criar Backup Agora</span>
            </button>

            <button
              type="button"
              onClick={loadBackups}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              title="Recarregar lista"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div
            className={`p-4 border-b text-xs flex items-center gap-2 font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Restore Confirmation Drawer */}
          {selectedBackupForRestore && (
            <div className="p-5 bg-amber-50 border-2 border-amber-400 rounded-2xl space-y-3.5 animate-in slide-in-from-top-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Confirmação de Restauração em 1 Clique</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBackupForRestore(null)}
                  className="text-amber-800 hover:text-amber-950 text-xs font-bold"
                >
                  Cancelar
                </button>
              </div>

              <p className="text-xs text-amber-950 leading-relaxed">
                Você selecionou o ponto de restauro de{' '}
                <strong>{selectedBackupForRestore.isoDate}</strong> ({selectedBackupForRestore.label}).
                Esta ação recuperará todos os dados cadastrados (
                <strong>{selectedBackupForRestore.stats.efectividade} funcionários da efectividade</strong>,{' '}
                <strong>{selectedBackupForRestore.stats.students} alunos</strong> e{' '}
                <strong>{selectedBackupForRestore.stats.teachers} professores</strong>). Um snapshot de segurança do estado atual será criado antes da restauração.
              </p>

              <div className="pt-1 space-y-2">
                <label className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                  Digite o código mestre para confirmar: <span className="text-[#f75142]">SIGRE-BELIZIO-2026</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    placeholder="Digite SIGRE-BELIZIO-2026"
                    className="flex-1 min-w-[240px] h-10 px-3 rounded-xl border border-amber-300 bg-white text-xs font-mono font-bold text-slate-900 outline-none focus:border-amber-600"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    disabled={isRestoring || confirmationInput.trim() !== MASTER_CONFIRMATION_CODE}
                    className="h-10 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
                  >
                    {isRestoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    <span>Confirmar e Restaurar Agora</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List of Backups */}
          {isLoading && backups.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
              <p className="text-xs">A carregar registos do cofre de backups...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <Archive className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold">Nenhum ponto de backup encontrado no disco.</p>
              <button
                type="button"
                onClick={handleCreateSnapshot}
                className="text-xs font-bold text-[#f75142] hover:underline"
              >
                Gerar o primeiro snapshot de segurança
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                Pontos de Restauração Disponíveis ({backups.length})
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                {backups.map((b) => {
                  const isAuto = b.label.includes('diario') || b.label.includes('auto');
                  const isPreWipe = b.label.includes('esvaziamento') || b.label.includes('pre-wipe');

                  return (
                    <div
                      key={b.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {b.isoDate}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isPreWipe
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : isAuto
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {isPreWipe
                              ? 'Snapshot Pré-Esvaziamento'
                              : isAuto
                              ? 'Backup Diário Automático'
                              : 'Snapshot Manual'}
                          </span>
                        </div>

                        {/* Counts */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-mono">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <strong>{b.stats.efectividade}</strong> Efectividade
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            <strong>{b.stats.students}</strong> Alunos
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <strong>{b.stats.teachers}</strong> Docentes
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <strong>{b.stats.schools}</strong> Escolas
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBackupForRestore(b);
                            setConfirmationInput('');
                            setFeedback(null);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Restaurar Este Ponto</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Localização do Cofre: <code className="font-mono text-[11px]">/data/backups/</code></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
