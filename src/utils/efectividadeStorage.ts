import {
  saveEfectividadeToFirestore,
  deleteEfectividadeFromFirestore,
  clearAllEfectividadeFromFirestore,
  fetchEfectividadeFromFirestore,
} from './firestoreSync';

export interface CadastramentoEfectividadeRecord {
  id: string;
  // 1. Identificação pessoal
  nome: string;
  tratamento: 'Senhor' | 'Senhora';
  nascimento: string; // YYYY-MM-DD
  pai: string;
  mae: string;
  naturalidade: string;
  provNat: string;

  // 2. Bilhete de Identidade
  bi: string; // 9 dígitos + 2 letras + 3 dígitos
  biEmissao: string; // YYYY-MM-DD

  // 3. Enquadramento profissional
  sector: string; // Ex: Educação
  funcao: string; // Ex: Docente
  municipio: string; // Ex: Quêssua
  agente: string; // Dígitos
  escola: string; // Nome da Escola / Complexo
  categoria: string; // Ex: P.E.P.E.S.
  grau: string; // Ex: 11.º Grau

  // 4. Finalidade da declaração
  finalidade: string;

  // 5. Entidade emissora (Opcional / Homologação)
  governoProv: string; // Ex: Malanje
  administracao: string; // Ex: Quêssua
  direccao: string; // Ex: Educação
  director: string; // Nome do Director
  local: string; // Ex: Quêssua
  dataEmissao: string; // YYYY-MM-DD

  // Metadados do sistema
  cadastradoEm: string;
  actualizadoEm?: string;
  status: 'ativo' | 'homologado' | 'pendente';
}

export const ANGOLA_PROVINCIAS = [
  'Bengo',
  'Benguela',
  'Bié',
  'Cabinda',
  'Cuando',
  'Cubango',
  'Cuanza Norte',
  'Cuanza Sul',
  'Cunene',
  'Huambo',
  'Huíla',
  'Icolo e Bengo',
  'Luanda',
  'Lunda Norte',
  'Lunda Sul',
  'Malanje',
  'Moxico',
  'Moxico Leste',
  'Namibe',
  'Uíge',
  'Zaire',
];

const STORAGE_KEY_EFECTIVIDADE = 'sigre_cadastramento_efectividade_v2';
const STORAGE_KEY_DELETED = 'sigre_deleted_efectividade_ids_v2';

function getDeletedIds(): Set<string> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function addDeletedId(id: string) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const set = getDeletedIds();
    set.add(id);
    localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

function removeDeletedId(id: string) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const set = getDeletedIds();
    set.delete(id);
    localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

// Empty default records: personnel is registered exclusively via the form
const INITIAL_EFECTIVIDADE_RECORDS: CadastramentoEfectividadeRecord[] = [];

/**
 * Retrieve all registered personnel records from database (localStorage)
 */
export function getStoredEfectividadeRecords(): CadastramentoEfectividadeRecord[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    // Clear old v1 key if present to ensure complete database wipe
    if (localStorage.getItem('sigre_cadastramento_efectividade_v1')) {
      localStorage.removeItem('sigre_cadastramento_efectividade_v1');
    }

    const raw = localStorage.getItem(STORAGE_KEY_EFECTIVIDADE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_EFECTIVIDADE, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const deleted = getDeletedIds();
      return parsed.filter((r) => r && r.id && !deleted.has(r.id));
    }
    return [];
  } catch (err) {
    console.error('Erro ao ler registos de efectividade:', err);
    return [];
  }
}

/**
 * Empty all registered personnel records in the database
 * Strictly restricted to Super Admin Belízio with the master confirmation code
 */
export async function clearAllEfectividadeRecords(
  adminEmail: string = 'beliziodos20@gmail.com',
  confirmationCode: string = 'SIGRE-BELIZIO-2026'
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { success: false, error: 'Ambiente sem suporte a armazenamento local.' };
  }

  if (adminEmail !== 'beliziodos20@gmail.com' || confirmationCode !== 'SIGRE-BELIZIO-2026') {
    return {
      success: false,
      error: 'Operação não autorizada. Apenas o Administrador Máximo (beliziodos20@gmail.com) tem permissão de esvaziamento.',
    };
  }

  try {
    // Send authenticated wipe command to server
    const res = await fetch('/api/efectividade', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-email': adminEmail,
        'x-confirmation-code': confirmationCode,
      },
      body: JSON.stringify({ adminEmail, confirmationCode }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Falha ao esvaziar base de dados no servidor.' };
    }

    localStorage.setItem(STORAGE_KEY_EFECTIVIDADE, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEY_DELETED);
    await clearAllEfectividadeFromFirestore().catch(() => {});
    window.dispatchEvent(new CustomEvent('sigre-efectividade-updated', { detail: { cleared: true } }));
    return { success: true };
  } catch (err: any) {
    console.error('Erro ao esvaziar base de dados:', err);
    return { success: false, error: err?.message || 'Falha na comunicação com o servidor.' };
  }
}

/**
 * Synchronizes efectividade personnel records with the shared server database.
 * Ensures data is fixed, persistent, and accessible across multiple users and admin accounts.
 * Anti-resurrection safeguard: prevents deleted records from reappearing.
 */
export async function syncEfectividadeFromServer(schoolFilter?: string): Promise<CadastramentoEfectividadeRecord[]> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const localRecords = getStoredEfectividadeRecords();
    const deletedIds = getDeletedIds();
    const recordMap = new Map<string, CadastramentoEfectividadeRecord>();

    // 1. Pull authoritative records from Firebase Firestore
    try {
      const cloudRecords = await fetchEfectividadeFromFirestore();
      if (Array.isArray(cloudRecords)) {
        cloudRecords.forEach((cr: any) => {
          if (cr && cr.id && !deletedIds.has(cr.id)) {
            recordMap.set(cr.id, cr as CadastramentoEfectividadeRecord);
          }
        });
      }
    } catch {}

    const url = schoolFilter && schoolFilter !== 'ALL'
      ? `/api/efectividade?school=${encodeURIComponent(schoolFilter)}`
      : '/api/efectividade';

    const res = await fetch(url);
    if (!res.ok && recordMap.size === 0) {
      return localRecords;
    }
    const data = res.ok ? await res.json() : { records: [] };
    if (data && Array.isArray(data.records)) {
      const serverRecords: CadastramentoEfectividadeRecord[] = data.records;

      // Load server records, excluding locally deleted ones
      serverRecords.forEach((sr) => {
        if (sr && sr.id && !deletedIds.has(sr.id)) {
          recordMap.set(sr.id, sr);
        }
      });

      // Merge any local records that haven't reached the server yet and were NOT deleted
      let hasUnsynced = false;
      const unsyncedList: CadastramentoEfectividadeRecord[] = [];

      localRecords.forEach((lr) => {
        if (lr && lr.id && !deletedIds.has(lr.id) && !recordMap.has(lr.id)) {
          recordMap.set(lr.id, lr);
          unsyncedList.push(lr);
          hasUnsynced = true;
        }
      });

      const merged = Array.from(recordMap.values());
      localStorage.setItem(STORAGE_KEY_EFECTIVIDADE, JSON.stringify(merged));

      if (hasUnsynced && unsyncedList.length > 0) {
        // Send unsynced local records to server
        fetch('/api/efectividade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: unsyncedList }),
        }).catch(() => {});
      }

      window.dispatchEvent(new CustomEvent('sigre-efectividade-updated', { detail: { records: merged } }));
      return merged;
    }
  } catch (err) {
    console.warn('Falha na sincronização de efectividade com servidor:', err);
  }
  return getStoredEfectividadeRecords();
}

/**
 * Check if a duplicate record exists by BI or by Agent Number
 */
export function findDuplicateEfectividade(
  bi: string,
  agente: string,
  excludeId?: string
): { isDuplicate: boolean; duplicateRecord?: CadastramentoEfectividadeRecord; reason?: 'bi' | 'agente' } {
  const records = getStoredEfectividadeRecords();
  const cleanBi = (bi || '').trim().toUpperCase().replace(/\s+/g, '');
  const cleanAgente = (agente || '').trim().replace(/\s+/g, '');

  if (!cleanBi && !cleanAgente) {
    return { isDuplicate: false };
  }

  for (const r of records) {
    if (excludeId && r.id === excludeId) continue;

    const rBi = (r.bi || '').trim().toUpperCase().replace(/\s+/g, '');
    const rAgente = (r.agente || '').trim().replace(/\s+/g, '');

    if (cleanBi && rBi === cleanBi) {
      return { isDuplicate: true, duplicateRecord: r, reason: 'bi' };
    }
    if (cleanAgente && rAgente === cleanAgente) {
      return { isDuplicate: true, duplicateRecord: r, reason: 'agente' };
    }
  }

  return { isDuplicate: false };
}

/**
 * Save new or update existing record with duplicate prevention
 */
export function saveEfectividadeRecord(
  record: Omit<CadastramentoEfectividadeRecord, 'id' | 'cadastradoEm'> & { id?: string }
): { success: boolean; record?: CadastramentoEfectividadeRecord; error?: string } {
  const records = getStoredEfectividadeRecords();
  const isEditing = Boolean(record.id);

  // Duplication check
  const dupCheck = findDuplicateEfectividade(record.bi, record.agente, record.id);
  if (dupCheck.isDuplicate && dupCheck.duplicateRecord) {
    const dup = dupCheck.duplicateRecord;
    const mot = dupCheck.reason === 'bi' ? `com o B.I. "${dup.bi}"` : `com o Nº de Agente "${dup.agente}"`;
    return {
      success: false,
      error: `Já existe um funcionário cadastrado no sistema ${mot}: ${dup.nome} (${dup.escola}). Para evitar duplicações, utilize a opção de edição na tabela de cadastrados.`,
      record: dup,
    };
  }

  const nowStr = new Date().toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });

  let savedRecord: CadastramentoEfectividadeRecord;
  let nextRecords: CadastramentoEfectividadeRecord[];

  if (isEditing && record.id) {
    const existingIndex = records.findIndex((r) => r.id === record.id);
    if (existingIndex >= 0) {
      savedRecord = {
        ...records[existingIndex],
        ...record,
        id: record.id,
        actualizadoEm: nowStr,
      };
      nextRecords = [...records];
      nextRecords[existingIndex] = savedRecord;
    } else {
      savedRecord = {
        ...record,
        id: record.id,
        cadastradoEm: nowStr,
        status: record.status || 'ativo',
      };
      nextRecords = [savedRecord, ...records];
    }
  } else {
    savedRecord = {
      ...record,
      id: `efec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cadastradoEm: nowStr,
      status: record.status || 'ativo',
    };
    nextRecords = [savedRecord, ...records];
  }

  try {
    if (savedRecord && savedRecord.id) {
      removeDeletedId(savedRecord.id);
    }
    localStorage.setItem(STORAGE_KEY_EFECTIVIDADE, JSON.stringify(nextRecords));
    window.dispatchEvent(new CustomEvent('sigre-efectividade-updated', { detail: savedRecord }));

    // Persist immediately to Firebase Firestore cloud database in real time
    saveEfectividadeToFirestore(savedRecord).catch(() => {});

    // Persist immediately on the shared backend database so it never disappears and is shared
    fetch('/api/efectividade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record: savedRecord }),
    }).catch((err) => {
      console.warn('Falha temporária ao sincronizar registo no servidor:', err);
    });

    return { success: true, record: savedRecord };
  } catch (err) {
    console.error('Erro ao guardar no localStorage:', err);
    return { success: false, error: 'Falha ao gravar no banco de dados local.' };
  }
}

/**
 * Delete a record permanently
 */
export function deleteEfectividadeRecord(id: string): boolean {
  if (!id) return false;
  addDeletedId(id);
  const records = getStoredEfectividadeRecords();
  const next = records.filter((r) => r.id !== id && r.bi !== id && r.agente !== id);
  try {
    localStorage.setItem(STORAGE_KEY_EFECTIVIDADE, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('sigre-efectividade-updated', { detail: { id, deleted: true } }));

    // Delete immediately on Firebase Firestore cloud database
    deleteEfectividadeFromFirestore(id).catch(() => {});

    // Delete immediately on the shared backend database
    fetch(`/api/efectividade/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch((err) => {
      console.warn('Falha temporária ao eliminar registo no servidor:', err);
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Format Angolan date (YYYY-MM-DD -> DD/MM/YYYY)
 */
export function formatAngolanDate(isoDateString?: string): string {
  if (!isoDateString) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDateString.trim());
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return isoDateString;
}

const MESES_ANGOLA = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/**
 * Format Angolan date by extenso (e.g. 7 de Agosto de 1971)
 */
export function formatAngolanDateExtenso(isoDateString?: string): string {
  if (!isoDateString) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDateString.trim());
  if (match) {
    const year = match[1];
    const monthIdx = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const monthName = MESES_ANGOLA[monthIdx] || match[2];
    return `${day} de ${monthName} de ${year}`;
  }
  return isoDateString;
}

