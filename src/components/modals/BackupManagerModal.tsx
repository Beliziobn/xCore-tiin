import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Lock,
} from 'lucide-react';
import {
  fetchBackupsList,
  createManualBackup,
  restoreDatabaseFromBackup,
  BackupItem,
  SUPER_ADMIN_EMAIL,
  MASTER_CONFIRMATION_CODE,
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
        message:
          'Apenas a conta oficial do Administrador Máximo (beliziodos20@gmail.com) pode restaurar o banco de dados.',
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

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      id="modal-backup"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cofre de Backups & Integridade"
        className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-xl flex flex-col max-h-[85vh]"
      >
        {/* Cabeçalho escuro minimalista */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Cofre de Backups & Integridade</h3>
            <p className="text-[11px] text-slate-400">
              Restauração de 1 clique restrita ao Administrador Belízio
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mensagem de feedback */}
        {feedback && (
          <div
            className={`px-6 py-3 border-b text-xs flex items-center gap-2 font-medium ${
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

        {/* Corpo do Modal */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">
              {backups.length} {backups.length === 1 ? 'ponto de restauração disponível' : 'pontos de restauração disponíveis'}
            </span>
            <button
              type="button"
              onClick={handleCreateSnapshot}
              disabled={isCreating}
              className="px-3 py-1.5 rounded-lg bg-[#e11d48] text-white text-xs font-medium hover:bg-[#be123c] disabled:opacity-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>+ Criar Snapshot Agora</span>
            </button>
          </div>

          {/* Confirmação de Restauração */}
          {selectedBackupForRestore && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Confirmar restauro ({selectedBackupForRestore.isoDate})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBackupForRestore(null)}
                  className="text-amber-700 hover:text-amber-900 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Digite o código de segurança <strong className="font-mono">{MASTER_CONFIRMATION_CODE}</strong> para restaurar este ponto:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder={MASTER_CONFIRMATION_CODE}
                  className="flex-1 h-9 px-3 rounded-lg border border-amber-300 bg-white text-xs font-mono text-slate-900 outline-none focus:border-slate-900"
                />
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={isRestoring || confirmationInput.trim() !== MASTER_CONFIRMATION_CODE}
                  className="h-9 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  {isRestoring && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirmar</span>
                </button>
              </div>
            </div>
          )}

          {/* Lista de Pontos de Restauração */}
          {isLoading && backups.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>A carregar pontos de restauração...</span>
            </div>
          ) : backups.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 border border-slate-200/80 rounded-xl">
              Nenhum ponto de restauração registado no momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden text-xs">
              {backups.map((b) => {
                const isAuto = b.label.includes('diario') || b.label.includes('auto');
                return (
                  <div
                    key={b.id}
                    className="p-3.5 flex items-center justify-between gap-3 bg-white hover:bg-slate-50/60 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 tabular-nums">
                          {b.isoDate}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          · {isAuto ? 'Automático' : 'Snapshot Manual'}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-0.5 tabular-nums">
                        {b.stats.efectividade} Efetividade · {b.stats.students} Alunos ·{' '}
                        {b.stats.teachers} Docentes
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBackupForRestore(b);
                        setConfirmationInput('');
                        setFeedback(null);
                      }}
                      className="px-2.5 py-1 rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-medium transition cursor-pointer shrink-0"
                    >
                      Restaurar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
          <span>Localização: /data/backups/</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
