/**
 * Storage and helper utilities for Guia de Colocação (Serviços SIGRE)
 * República de Angola · Governo Provincial de Malanje · Direcção Municipal de Educação
 */

export interface GuiaColocacaoRecord {
  id: string;
  num: string; // Número da guia (opcional, pode ficar em branco na emissão)
  ano: string; // Ano da guia (ex: 2026)
  trat: 'M' | 'F'; // 'M' = o senhor professor | 'F' = a senhora professora
  nome: string; // Nome completo do professor
  cat: string; // Categoria profissional (ex: P.E.P.E.S.)
  grau: string; // Grau (ex: 13º Grau, Auxiliar 3º Grau)
  agente: string; // Número de agente (apenas algarismos)
  escola: string; // Escola de destino
  local: string; // Local de emissão (ex: Quêssua / Mucari / Caculama)
  data: string; // Data de emissão (YYYY-MM-DD)
  dir: string; // Nome do Director Municipal
  prov: string; // Província (ex: Malanje)
  mun: string; // Município (ex: Quêssua / Mucari)
  criado: string;
}

const STORAGE_KEY = 'sigre_guias_colocacao_records_v1';

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

export const GRAUS_COLOCACAO_SUGGESTIONS = [
  'Auxiliar 3º Grau',
  '5º Grau',
  '6º Grau',
  '10º Grau',
  '11º Grau',
  '12º Grau',
  '13º Grau',
];

export const ESCOLAS_COLOCACAO_SUGGESTIONS = [
  'Liceu Nº 314 MJE - 4 de Janeiro – Quêssua',
  'Instituto Técnico Agrário do Quêssua-27009 - MJE',
  'Complexo Escolar Católico n.º 166 MJE São Pedro – Quêssua',
  'Complexo Escolar Católico n.º 269 MJE – Lar Nazaré – Quêssua',
  'Complexo Escolar Católico n.º 274 MJE – Nossa Senhora de Guadalupe – Quêssua',
  'Complexo Escolar Católico n.º 282 MJE – Kudyelela – Quêssua',
  'Complexo Escolar Católico n.º 290 MJE – Paz e Amor – Quêssua',
  'Complexo Escolar Católico n.º 293 MJE – São Francisco de Assis – Quêssua',
  'Complexo Escolar Metodista n.º 294 MJE – Missão do Quêssua – Quêssua',
  'Complexo Escolar Metodista Sião n.º 288 MJE – Episcopal Africana – Quêssua',
  'Complexo Escolar Metodista Sião n.º 289 MJE – Monte Sinai – Quêssua',
  'Complexo Escolar Missionário n.º 263 MJE – Bom Deus – Quêssua',
  'Complexo Escolar n.º 285 MJE – Cambondo – Quêssua',
  'Complexo Escolar n.º 291 MJE – Quissol – Quêssua',
  'Complexo Escolar n.º 292 MJE – Samora Machel – Quêssua',
  'Escola Primária Metodista n.º 209 MJE – São Paulo – Quêssua',
  'Escola Primária Metodista Sião n.º 207 MJE – Rei Salomão – Quêssua',
  'Escola Primária Católica n.º 202 MJE – Edith Almeida De Sousa – Quêssua',
  'Escola Primária Católica n.º 208 MJE – Santa Teresinha – Quêssua',
  'Escola Primária Católica n.º 210 MJE – Vila Matilde – Quêssua',
  'Escola Primária IEPA n.º 163 MJE – Rev. Ferreira Francisco – Quêssua',
  'Escola Primária n.º 115 MJE – Cabuabuata – Quêssua',
  'Escola Primária n.º 199 MJE – Campo da Vitória – Quêssua',
  'Escola Primária n.º 200 MJE – Comandante Gika – Quêssua',
  'Escola Primária n.º 201 MJE – Dr. António Agostinho Neto – Quêssua',
  'Escola Primária n.º 203 MJE – Luzia Inglês Van – Quêssua',
  'Escola Primária n.º 204 MJE – Major Kanhangulo – Quêssua',
  'Escola Primária n.º 205 MJE – Quizanga – Quêssua',
  'Escola Primária n.º 206 MJE – Quizanga da Barraca – Quêssua',
  'Escola Primária n.º 125 – Cazeta – Quêssua',
  'Escola Primária nº 9 – 1 de Junho',
  'Escola Primária nº 12 – 28 de Agosto',
  'Escola Primária nº 06 / Comandante Hoje-Ya-Henda',
  'Escola Primária nº 05 / 11 de Novembro',
  'Complexo Escolar Rei Ngola Kiluanje de Mucari nº 15',
];

export function getTodayIsoColocacao(): string {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function formatColocacaoDateExtenso(v: string): string {
  if (!v) return '';
  const parts = v.split('-');
  if (parts.length < 3) return '';
  const a = parts[0];
  const m = parseInt(parts[1], 10);
  const d = parts[2];
  if (!m || m < 1 || m > 12) return '';
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

export function formatColocacaoDateShort(v: string): string {
  if (!v || v.length < 10) return '';
  const [a, m, d] = v.split('-');
  return `${d}/${m}/${a}`;
}

export function formatCategoriaGrauColocacao(cat: string, grau: string): string {
  const c = (cat || '').trim();
  const g = (grau || '').trim();
  if (!c && !g) return '';
  if (!c) return g;
  if (!g) return c;
  return `${c} ${g}`;
}

export function getStoredGuiaColocacaoRecords(): GuiaColocacaoRecord[] {
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

export function saveGuiaColocacaoRecord(
  record: Omit<GuiaColocacaoRecord, 'id' | 'criado'> & { id?: string }
): {
  success: boolean;
  record: GuiaColocacaoRecord;
} {
  const existing = getStoredGuiaColocacaoRecords();
  const nowIso = new Date().toISOString();

  const targetId =
    record.id || `guia-colocacao-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const finalRecord: GuiaColocacaoRecord = {
    ...record,
    id: targetId,
    criado: nowIso,
  };

  const filtered = existing.filter((r) => r.id !== targetId);
  const updated = [finalRecord, ...filtered];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sigre-guia-colocacao-updated', { detail: finalRecord }));
  } catch {}

  return { success: true, record: finalRecord };
}

export function deleteGuiaColocacaoRecord(id: string): boolean {
  const existing = getStoredGuiaColocacaoRecords();
  const filtered = existing.filter((r) => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('sigre-guia-colocacao-updated'));
    return true;
  } catch {
    return false;
  }
}

export function findDuplicateGuiaColocacao(
  agente: string,
  escola: string,
  data: string,
  num?: string,
  ano?: string,
  excludeId?: string
): { isDuplicate: boolean; reason?: 'agente_escola_data' | 'guia'; duplicateRecord?: GuiaColocacaoRecord } {
  const records = getStoredGuiaColocacaoRecords();
  const cleanAgente = (agente || '').trim().toLowerCase();
  const cleanEscola = (escola || '').trim().toLowerCase();
  const cleanData = (data || '').trim();
  const cleanNum = (num || '').trim().toLowerCase();
  const cleanAno = (ano || '').trim().toLowerCase();

  for (const r of records) {
    if (excludeId && r.id === excludeId) continue;
    if (
      cleanNum &&
      cleanAno &&
      r.num.trim().toLowerCase() === cleanNum &&
      r.ano.trim().toLowerCase() === cleanAno
    ) {
      return { isDuplicate: true, reason: 'guia', duplicateRecord: r };
    }
    if (
      cleanAgente &&
      cleanEscola &&
      cleanData &&
      r.agente.trim().toLowerCase() === cleanAgente &&
      r.escola.trim().toLowerCase() === cleanEscola &&
      r.data.trim() === cleanData
    ) {
      return { isDuplicate: true, reason: 'agente_escola_data', duplicateRecord: r };
    }
  }

  return { isDuplicate: false };
}
