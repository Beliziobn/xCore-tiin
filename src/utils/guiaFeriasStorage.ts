/**
 * Storage and helper utilities for Guia de Férias (Serviços SIGRE)
 * República de Angola · Governo Provincial de Malanje · Administração Municipal do Quêssua
 */

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

export function calculateFimDate(ini: string, dias: number): string {
  const d = parseDateParts(ini);
  if (!d || !dias) return '';
  const dateObj = new Date(Date.UTC(d.y, d.m - 1, d.d + dias));
  return dateObj.toISOString().slice(0, 10);
}

export function getStoredGuiaFeriasRecords(): GuiaFeriasRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
    window.dispatchEvent(new CustomEvent('sigre-guia-ferias-updated', { detail: finalRecord }));
  } catch {}

  return { success: true, record: finalRecord };
}

export function deleteGuiaFeriasRecord(id: string): boolean {
  const existing = getStoredGuiaFeriasRecords();
  const filtered = existing.filter((r) => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('sigre-guia-ferias-updated'));
    return true;
  } catch {
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

