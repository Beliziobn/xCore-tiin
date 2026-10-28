/**
 * Serviço de Gerenciamento de Backups e Cofre de Restauração em 1 Clique (SIGRE Angola)
 * Fornece sincronização diária, snapshots de integridade e restauração restrita ao Administrador Máximo (Belízio).
 */

export interface BackupItem {
  id: string;
  filename: string;
  timestamp: string;
  isoDate: string;
  label: string;
  actor: string;
  stats: {
    schools: number;
    directors: number;
    teachers: number;
    students: number;
    applications: number;
    efectividade: number;
    totalRecords: number;
  };
  sizeBytes: number;
}

export interface BackupListResponse {
  success: boolean;
  count: number;
  backups: BackupItem[];
  currentStats: {
    schools: number;
    directors: number;
    teachers: number;
    students: number;
    efectividade: number;
  };
}

export const SUPER_ADMIN_EMAIL = 'beliziodos20@gmail.com';
export const MASTER_CONFIRMATION_CODE = 'SIGRE-BELIZIO-2026';

/**
 * Consulta a lista de backups disponíveis no servidor
 */
export async function fetchBackupsList(): Promise<BackupListResponse> {
  try {
    const res = await fetch('/api/backup/list');
    if (!res.ok) {
      throw new Error(`Falha ao obter lista de backups: status ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[backupService] Falha ao comunicar com o servidor de backups:', err);
    return {
      success: false,
      count: 0,
      backups: [],
      currentStats: { schools: 0, directors: 0, teachers: 0, students: 0, efectividade: 0 },
    };
  }
}

/**
 * Cria um snapshot de backup manual ou de segurança
 */
export async function createManualBackup(label: string = 'manual', actorEmail: string = SUPER_ADMIN_EMAIL): Promise<{
  success: boolean;
  message?: string;
  backup?: BackupItem;
  error?: string;
}> {
  try {
    const res = await fetch('/api/backup/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, actorEmail }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erro ao criar ponto de restauro.' };
    }
    return { success: true, message: data.message, backup: data.backup };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha na conexão com o servidor.' };
  }
}

/**
 * Restaura o banco de dados a partir de um arquivo de backup
 * Restrito ao Super Admin Belízio com o código mestre SIGRE-BELIZIO-2026
 */
export async function restoreDatabaseFromBackup(
  backupIdOrFilename: string,
  adminEmail: string = SUPER_ADMIN_EMAIL,
  confirmationCode: string = MASTER_CONFIRMATION_CODE
): Promise<{ success: boolean; message?: string; stats?: any; error?: string }> {
  try {
    const res = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        backupId: backupIdOrFilename,
        filename: backupIdOrFilename.endsWith('.json') ? backupIdOrFilename : undefined,
        adminEmail,
        confirmationCode,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Falha ao restaurar dados.' };
    }

    // Trigger local storage refresh events so all components and open tabs reload immediately
    window.dispatchEvent(new CustomEvent('sigre-database-restored', { detail: data }));
    window.dispatchEvent(new CustomEvent('sigre-efectividade-updated', { detail: { restored: true } }));
    window.dispatchEvent(new CustomEvent('storage'));

    return { success: true, message: data.message, stats: data.stats };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao comunicar com o motor de restauração.' };
  }
}
