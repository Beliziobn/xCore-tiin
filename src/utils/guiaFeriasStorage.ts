/**
 * Storage and helper utilities for Guia de Férias (Serviços SIGRE)
 * República de Angola · Governo Provincial de Malanje · Administração Municipal do Quêssua
 */
import {
  saveGuiaFeriasToFirestore,
  deleteGuiaFeriasFromFirestore,
  fetchGuiasFeriasFromFirestore,
  isEntityTombstoned,
  isBannedSchoolOrEntity,
} from './firestoreSync';
import { isExpressApiAvailable } from './apiAvailability';

export interface GuiaFeriasRecord {
  id: string;
  ng: string; // Nº da guia
  ang: string; // Ano da guia (ex: 2026)
  trat: 'o Senhor' | 'a Senhora';
  agente: string;
  nome: string;
  cat: string; // Categoria (ex: P.E.P.E.S.)
  grau: string; // Grau (ex: 10º Grau)
  funcao: string; // Função
  tipoesc: string; // Tipo de escola (ex: Escola Primária)
  nesc: string; // Nº da escola (ex: 126)
  local: string; // Localidade (ex: Campo da Victória)
  tipolic: string; // Tipo de licença (ex: Licença Disciplinar (férias))
  ano: string; // Ano económico (ex: 2026)
  dias: number; // Duração em dias (ex: 30)
  ini: string; // Data início (YYYY-MM-DD)
  fim: string; // Data fim (YYYY-MM-DD)
  lemi: string; // Local emissão (Quêssua)
  demi: string; // Data emissão (YYYY-MM-DD)
  dir: string; // Nome Director Municipal
  prov: string; // Província (Malanje)
  mun: string; // Município (Quêssua)
  criadoEm: string;
}

const STORAGE_KEY = 'sigre_guias_ferias_records_v1';

const MESES = [
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

export function getTodayIso(): string {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function parseDateParts(s: string): { d: number; m: number; y: number } | null {
  if (!s) return null;
  const parts = s.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return null;
  return { y: parts[0], m: parts[1], d: parts[2] };
}

export function formatDateExtenso(s: string): string {
  const d = parseDateParts(s);
  if (!d) return '';
  return `${d.d} de ${MESES[d.m - 1]} de ${d.y}`;
}

export interface GuiaFeriasDateBreakdown {
  ini: string;
  fim: string;
  businessDays: number;
  weekendDaysExcluded: number;
  totalCalendarDays: number;
}

/**
 * Calcula a data de término / regresso da Guia de Férias contando APENAS dias úteis
 * (segunda a sexta-feira). Sábados e domingos não são contabilizados nem subtraídos da duração.
 */
export function calculateFimDate(ini: string, dias: number): string {
  const breakdown = getGuiaFeriasDateBreakdown(ini, dias);
  return breakdown ? breakdown.fim : '';
}

export function getGuiaFeriasDateBreakdown(
  ini: string,
  dias: number
): GuiaFeriasDateBreakdown | null {
  const d = parseDateParts(ini);
  const totalBusinessDays = Math.floor(Number(dias));
  if (!d || !Number.isFinite(totalBusinessDays) || totalBusinessDays < 1) return null;

  const startMs = Date.UTC(d.y, d.m - 1, d.d);
  const cur = new Date(startMs);
  let weekendDaysExcluded = 0;

  // Se a data de início cair num sábado (6) ou domingo (0), o gozo em dias úteis inicia no próximo dia útil
  while (cur.getUTCDay() === 0 || cur.getUTCDay() === 6) {
    weekendDaysExcluded++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  // Avança exactamente `totalBusinessDays` dias úteis (segunda a sexta), saltando todos os sábados e domingos
  let counted = 0;
  while (counted < totalBusinessDays) {
    cur.setUTCDate(cur.getUTCDate() + 1);
    const dow = cur.getUTCDay();
    if (dow === 0 || dow === 6) {
      weekendDaysExcluded++;
    } else {
      counted++;
    }
  }

  const endMs = cur.getTime();
  const totalCalendarDays = Math.round((endMs - startMs) / (24 * 60 * 60 * 1000));

  return {
    ini,
    fim: cur.toISOString().slice(0, 10),
    businessDays: totalBusinessDays,
    weekendDaysExcluded,
    totalCalendarDays,
  };
}

export function getStoredGuiaFeriasRecords(): GuiaFeriasRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r: any) =>
        r &&
        r.id &&
        !isEntityTombstoned('guias_ferias', r.id) &&
        !isBannedSchoolOrEntity(r)
    );
  } catch {
    return [];
  }
}

export function mergeGuiaFeriasCloudSnapshot(cloudRecords: any[]): GuiaFeriasRecord[] {
  const local = getStoredGuiaFeriasRecords();
  const mergedMap = new Map<string, GuiaFeriasRecord>();
  local.forEach((r) => {
    if (r && r.id && !isEntityTombstoned('guias_ferias', r.id) && !isBannedSchoolOrEntity(r)) {
      mergedMap.set(r.id, r);
    }
  });
  (Array.isArray(cloudRecords) ? cloudRecords : []).forEach((r: GuiaFeriasRecord) => {
    if (r && r.id && !isEntityTombstoned('guias_ferias', r.id) && !isBannedSchoolOrEntity(r)) {
      mergedMap.set(r.id, r);
    }
  });
  const merged = Array.from(mergedMap.values());
  if (typeof window !== 'undefined') {
    const prevRaw = localStorage.getItem(STORAGE_KEY);
    const nextRaw = JSON.stringify(merged);
    if (prevRaw !== nextRaw) {
      localStorage.setItem(STORAGE_KEY, nextRaw);
    }
  }
  return merged;
}

export async function syncGuiaFeriasFromServer(): Promise<GuiaFeriasRecord[]> {
  if (typeof window === 'undefined') return [];
  const local = getStoredGuiaFeriasRecords();
  try {
    if (!isExpressApiAvailable()) {
      const cloudRecords = await fetchGuiasFeriasFromFirestore(30);
      if (Array.isArray(cloudRecords) && cloudRecords.length > 0) {
        return mergeGuiaFeriasCloudSnapshot(cloudRecords);
      }
      return local;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    try {
      const res = await fetch('/api/network/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guiasFerias: local }),
        signal: controller.signal,
      });
      if (!res.ok) return local;
      const data = await res.json();
      if (Array.isArray(data.guiasFerias)) {
        const merged = mergeGuiaFeriasCloudSnapshot(data.guiasFerias);
        window.dispatchEvent(new CustomEvent('sigre-guia-ferias-updated'));
        return merged;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    console.error('[GuiaFeriasStorage] Erro ao sincronizar com servidor:', err);
  }
  return local;
}

export function saveGuiaFeriasRecord(record: Omit<GuiaFeriasRecord, 'id' | 'criadoEm'> & { id?: string }): {
  success: boolean;
  record: GuiaFeriasRecord;
} {
  const existing = getStoredGuiaFeriasRecords();
  const nowIso = new Date().toISOString();

  let targetId = record.id;
  if (!targetId) {
    targetId = `guia-ferias-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  }

  const finalRecord: GuiaFeriasRecord = {
    ...record,
    id: targetId,
    criadoEm: nowIso,
  };

  const filtered = existing.filter((r) => r.id !== targetId);
  const updated = [finalRecord, ...filtered];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    saveGuiaFeriasToFirestore(finalRecord).catch((err) =>
      console.error('[GuiaFeriasStorage] Erro ao gravar no Firestore:', err)
    );
    fetch('/api/network/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guiasFerias: updated }),
    }).catch((err) => console.error('[GuiaFeriasStorage] Erro ao sincronizar gravação:', err));
    window.dispatchEvent(new CustomEvent('sigre-guia-ferias-updated', { detail: finalRecord }));
  } catch (err) {
    console.error('[GuiaFeriasStorage] Erro ao guardar localmente:', err);
  }

  return { success: true, record: finalRecord };
}

export function deleteGuiaFeriasRecord(id: string): boolean {
  const existing = getStoredGuiaFeriasRecords();
  const filtered = existing.filter((r) => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    deleteGuiaFeriasFromFirestore(id).catch((err) =>
      console.error('[GuiaFeriasStorage] Erro ao eliminar no Firestore:', err)
    );
    fetch('/api/network/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guiasFerias: filtered }),
    }).catch((err) => console.error('[GuiaFeriasStorage] Erro ao sincronizar eliminação:', err));
    window.dispatchEvent(new CustomEvent('sigre-guia-ferias-updated'));
    return true;
  } catch (err) {
    console.error('[GuiaFeriasStorage] Erro ao eliminar registo:', err);
    return false;
  }
}

export function findDuplicateGuiaFerias(
  agente: string,
  ng: string,
  ang: string,
  excludeId?: string
): { isDuplicate: boolean; reason?: 'agente' | 'guia'; duplicateRecord?: GuiaFeriasRecord } {
  const records = getStoredGuiaFeriasRecords();
  const cleanAgente = (agente || '').trim().toLowerCase();
  const cleanNg = (ng || '').trim().toLowerCase();
  const cleanAng = (ang || '').trim().toLowerCase();

  for (const r of records) {
    if (excludeId && r.id === excludeId) continue;
    if (cleanNg && cleanAng && r.ng.trim().toLowerCase() === cleanNg && r.ang.trim().toLowerCase() === cleanAng) {
      return { isDuplicate: true, reason: 'guia', duplicateRecord: r };
    }
    if (cleanAgente && r.agente.trim().toLowerCase() === cleanAgente && r.ang.trim().toLowerCase() === cleanAng) {
      return { isDuplicate: true, reason: 'agente', duplicateRecord: r };
    }
  }

  return { isDuplicate: false };
}

