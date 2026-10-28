import {
  saveDeclaracaoServicoToFirestore,
  deleteDeclaracaoServicoFromFirestore,
  fetchDeclaracaoServicoFromFirestore,
} from './firestoreSync';

export interface DeclaracaoServicoRecord {
  id: string;
  ref: string;
  criadoEm: string;
  actualizadoEm?: string;

  // I. Identificação pessoal
  tratamento: 'Senhor' | 'Senhora';
  nome: string;
  nascimento: string;
  naturalidade: string;
  provNat: string;

  // II. Filiação
  pai: string;
  mae: string;

  // III. Bilhete de Identidade
  bi: string;
  biData: string;

  // IV. Situação profissional
  profissao: string;
  grau: string;
  categoria: string;
  agente: string;
  municipio: string;
  escola: string;

  // V. Conta bancária e salário
  banco: string;
  bancoOutro: string;
  bancoNome: string;
  conta: string;
  salario: string;
  salarioKz: number;
  extenso: string;

  // VI. Finalidade
  finalidade: string;

  // VII. Dados da emissão
  provEmissao: string;
  municipioAdm: string;
  direccao: string;
  localEmissao: string;
  dataEmissao: string;
  director: string;
}

export const ANGOLA_PROVINCIAS_SERVICO = [
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

export const ANGOLA_BANCOS_SERVICO = [
  'BPC',
  'BAI',
  'BFA',
  'BIC',
  'Banco Sol',
  'Standard Bank',
  'Atlântico',
  'BCI',
  'Keve',
  'Outro',
];

const MESES_PT = [
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

const STORAGE_KEY_SERVICO = 'sigre_declaracao_servico_v1';
const STORAGE_KEY_SERVICO_DELETED = 'sigre_deleted_declaracao_servico_ids_v1';

/**
 * Formata uma data ISO (YYYY-MM-DD) para extenso angolano ("26 de Outubro de 2026")
 */
export function fmtDateDeclaracaoServico(v?: string): string {
  if (!v) return '';
  const parts = v.split('-').map(Number);
  if (parts.length === 3 && parts[0] && parts[1] >= 1 && parts[1] <= 12 && parts[2]) {
    return `${parts[2]} de ${MESES_PT[parts[1] - 1]} de ${parts[0]}`;
  }
  return v;
}

/**
 * Converte string de valor monetário (Kz) para número decimal
 */
export function parseKz(s?: string | number): number {
  let str = String(s ?? '').replace(/[^\d,.]/g, '');
  if (!str) return NaN;
  if (str.indexOf(',') > -1) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
    str = str.replace(/\./g, '');
  }
  return parseFloat(str);
}

/**
 * Formata número em formato monetário angolano/europeu (ex.: 185.450,00)
 */
export function fmtKz(n: number): string {
  if (!Number.isFinite(n)) return '0,00';
  return n.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const UN = [
  'zero',
  'um',
  'dois',
  'três',
  'quatro',
  'cinco',
  'seis',
  'sete',
  'oito',
  'nove',
  'dez',
  'onze',
  'doze',
  'treze',
  'catorze',
  'quinze',
  'dezasseis',
  'dezassete',
  'dezoito',
  'dezanove',
];
const DZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CT = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
];

function ate999(n: number): string {
  if (n === 100) return 'cem';
  const c = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (c) parts.push(CT[c]);
  if (r) {
    if (r < 20) {
      parts.push(UN[r]);
    } else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      parts.push(DZ[d] + (u ? ' e ' + UN[u] : ''));
    }
  }
  return parts.join(' e ');
}

function inteiroPorExtenso(n: number): string {
  if (n >= 1e9) return '';
  const m = Math.floor(n / 1e6);
  const t = Math.floor((n % 1e6) / 1000);
  const u = n % 1000;
  const parts: string[] = [];
  let last = 0;

  if (m) {
    parts.push(m === 1 ? 'um milhão' : `${ate999(m)} milhões`);
    last = m * 1e6;
  }
  if (t) {
    parts.push(t === 1 ? 'mil' : `${ate999(t)} mil`);
    last = t;
  }
  if (u) {
    parts.push(ate999(u));
    last = u;
  }
  if (parts.length < 2) return parts[0] || '';
  const head = parts.slice(0, -1).join(', ');
  const tail = parts[parts.length - 1];
  return head + (last < 100 || last % 100 === 0 ? ' e ' : ', ') + tail;
}

/**
 * Converte um valor numérico em Kwanzas para extenso ("Cento e oitenta e cinco mil kwanzas")
 */
export function extensoKz(n: number): string {
  if (!(n > 0) || !Number.isFinite(n)) return '';
  const total = Math.round(n * 100);
  const kz = Math.floor(total / 100);
  const cts = total % 100;
  let out = '';

  if (kz) {
    const w = inteiroPorExtenso(kz);
    if (!w) return '';
    out = w + (kz === 1 ? ' kwanza' : ' kwanzas');
  }
  if (cts) {
    out += (out ? ' e ' : '') + ate999(cts) + (cts === 1 ? ' cêntimo' : ' cêntimos');
  }
  return out ? out.charAt(0).toUpperCase() + out.slice(1) : '';
}

function getDeletedServicoIds(): Set<string> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SERVICO_DELETED);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function addDeletedServicoId(id: string) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const set = getDeletedServicoIds();
    set.add(id);
    localStorage.setItem(STORAGE_KEY_SERVICO_DELETED, JSON.stringify(Array.from(set)));
  } catch {}
}

function removeDeletedServicoId(id: string) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const set = getDeletedServicoIds();
    set.delete(id);
    localStorage.setItem(STORAGE_KEY_SERVICO_DELETED, JSON.stringify(Array.from(set)));
  } catch {}
}

export function getStoredDeclaracaoServicoRecords(): DeclaracaoServicoRecord[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SERVICO);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SERVICO, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const deleted = getDeletedServicoIds();
      return parsed.filter((r) => r && r.id && !deleted.has(r.id));
    }
    return [];
  } catch {
    return [];
  }
}

export function findDuplicateDeclaracaoServico(
  bi: string,
  agente: string,
  excludeId?: string
): { isDuplicate: boolean; duplicateRecord?: DeclaracaoServicoRecord; reason?: 'bi' | 'agente' } {
  const records = getStoredDeclaracaoServicoRecords();
  const cleanBi = (bi || '').trim().toUpperCase().replace(/\s+/g, '');
  const cleanAgente = (agente || '').trim().replace(/\s+/g, '');

  if (!cleanBi && !cleanAgente) return { isDuplicate: false };

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

export function saveDeclaracaoServicoRecord(
  input: Omit<DeclaracaoServicoRecord, 'id' | 'ref' | 'criadoEm'> & {
    id?: string;
    ref?: string;
    criadoEm?: string;
  }
): { success: boolean; record?: DeclaracaoServicoRecord; error?: string } {
  const records = getStoredDeclaracaoServicoRecords();
  const isEditing = Boolean(input.id);

  const dup = findDuplicateDeclaracaoServico(input.bi, input.agente, input.id);
  if (dup.isDuplicate && dup.duplicateRecord) {
    const mot = dup.reason === 'bi' ? `com o BI n.º "${dup.duplicateRecord.bi}"` : `com o Agente n.º "${dup.duplicateRecord.agente}"`;
    return {
      success: false,
      error: `Já existe um registo na Declaração de Serviço ${mot}: ${dup.duplicateRecord.nome} (${dup.duplicateRecord.escola}). Utilize a opção de edição na tabela de registos.`,
      record: dup.duplicateRecord,
    };
  }

  const nowIso = new Date().toISOString();
  const genId = input.id || `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const genRef = input.ref || `CP-${genId.slice(-6).toUpperCase()}`;

  let saved: DeclaracaoServicoRecord;
  let nextRecords: DeclaracaoServicoRecord[];

  if (isEditing && input.id) {
    const idx = records.findIndex((r) => r.id === input.id);
    if (idx >= 0) {
      saved = {
        ...records[idx],
        ...input,
        id: input.id,
        ref: records[idx].ref || genRef,
        criadoEm: records[idx].criadoEm || nowIso,
        actualizadoEm: nowIso,
      };
      nextRecords = [...records];
      nextRecords[idx] = saved;
    } else {
      saved = {
        ...input,
        id: genId,
        ref: genRef,
        criadoEm: input.criadoEm || nowIso,
      };
      nextRecords = [saved, ...records];
    }
  } else {
    saved = {
      ...input,
      id: genId,
      ref: genRef,
      criadoEm: nowIso,
    };
    nextRecords = [saved, ...records];
  }

  removeDeletedServicoId(saved.id);
  localStorage.setItem(STORAGE_KEY_SERVICO, JSON.stringify(nextRecords));

  // Sync to server & Firestore (strictly isolated in declaracao_servico)
  saveDeclaracaoServicoToFirestore(saved).catch(() => {});
  fetch('/api/declaracao-servico', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record: saved }),
  }).catch(() => {});

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sigre-declaracao-servico-updated', { detail: { records: nextRecords } }));
  }

  return { success: true, record: saved };
}

export function deleteDeclaracaoServicoRecord(id: string): void {
  addDeletedServicoId(id);
  const current = getStoredDeclaracaoServicoRecords().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY_SERVICO, JSON.stringify(current));

  deleteDeclaracaoServicoFromFirestore(id).catch(() => {});
  fetch(`/api/declaracao-servico/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch(() => {});

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sigre-declaracao-servico-updated', { detail: { records: current } }));
  }
}

export async function syncDeclaracaoServicoFromServer(): Promise<DeclaracaoServicoRecord[]> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  try {
    const localRecords = getStoredDeclaracaoServicoRecords();
    const deletedIds = getDeletedServicoIds();
    const recordMap = new Map<string, DeclaracaoServicoRecord>();

    try {
      const cloudRecords = await fetchDeclaracaoServicoFromFirestore();
      if (Array.isArray(cloudRecords)) {
        cloudRecords.forEach((cr: any) => {
          if (cr && cr.id && !deletedIds.has(cr.id)) {
            recordMap.set(cr.id, cr as DeclaracaoServicoRecord);
          }
        });
      }
    } catch {}

    const res = await fetch('/api/declaracao-servico');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.records)) {
        data.records.forEach((sr: DeclaracaoServicoRecord) => {
          if (sr && sr.id && !deletedIds.has(sr.id)) {
            recordMap.set(sr.id, sr);
          }
        });
      }
    }

    const unsynced: DeclaracaoServicoRecord[] = [];
    localRecords.forEach((lr) => {
      if (lr && lr.id && !deletedIds.has(lr.id) && !recordMap.has(lr.id)) {
        recordMap.set(lr.id, lr);
        unsynced.push(lr);
      }
    });

    const merged = Array.from(recordMap.values()).sort((a, b) =>
      String(b.criadoEm || '').localeCompare(String(a.criadoEm || ''))
    );
    localStorage.setItem(STORAGE_KEY_SERVICO, JSON.stringify(merged));

    if (unsynced.length > 0) {
      fetch('/api/declaracao-servico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: unsynced }),
      }).catch(() => {});
    }

    return merged;
  } catch {
    return getStoredDeclaracaoServicoRecords();
  }
}
