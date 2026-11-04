/**
 * Storage and helper utilities for Ficha de Avaliação de Desempenho Docente (Serviços SIGRE)
 * Modelo Oficial: Diário da República, I Série — N.º 18, de 27 de Janeiro de 2022, Anexo III
 * República de Angola · Governo Provincial de Malanje · Direcção Municipal de Educação do Quêssua
 */
import { saveFichaAvaliacaoToFirestore, deleteFichaAvaliacaoFromFirestore } from './firestoreSync';

export const INDICADORES_AVALIACAO = [
  'Qualidade do processo de ensino e aprendizagem',
  'Progresso do aluno ou desenvolvimento do aluno',
  'Responsabilidade',
  'Aperfeiçoamento profissional e Inovação pedagógica',
  'Relações Humanas',
] as const;

/**
 * Ordem da tabela 4 (Classificação anual dos indicadores) conforme Anexo III:
 * [0, 1, 3, 2, 4]
 */
export const ANUAL_INDICADORES_ORDER = [0, 1, 3, 2, 4] as const;

export const CATEGORIAS_DOCENTE_SUGGESTIONS = [
  'P.E.P.E.S. Auxiliar do 3º Grau',
  'P.E.P.E.S. do 5º Grau',
  'P.E.P.E.S. do 6º Grau',
  'P.E.P.E.S. do 10º Grau',
  'P.E.P.E.S. do 11º Grau',
  'P.E.P.E.S. do 12º Grau',
  'P.E.P.E.S. do 13º Grau',
  'Professor do Ensino Primário e Secundário Diplomado do 6ºEscalão',
  'Professor do I Ciclo do Ensino Secundário Diplomado',
  'Professor do II Ciclo do Ensino Secundário Diplomado',
];

export const ESCOLAS_AVALIACAO_SUGGESTIONS = [
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
  'Escola Primária Católica n.º 202 MJE – Edith Al MJEida De Sousa - Quéssua',
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
  'Complexo Escolar Católico n.º 166 MJE São Pedro Quêssua',
  'Liceu Nº 314 MJE - 4 de Janeiro – Quêssua',
  'Instituto Técnico Agrário do Quêssua-27009 - MJE',
];

export const QUALITATIVA_SUGGESTIONS = [
  'Excelente',
  'Muito Bom',
  'Bom',
  'Suficiente',
  'Medíocre',
  'Mau',
];

export interface FichaAvaliacaoRecord {
  id: string;
  criado: string;

  // 1. Identificação do avaliado
  provincia: string;
  municipio: string;
  escola: string;
  nome: string;
  categoria: string;
  agente: string;
  dataAval: string;

  // 2. Período a que respeita a avaliação
  de: string;
  ate: string;

  // 3. Classificação dos indicadores (5 indicadores x 3 trimestres)
  notas: (number | null)[][];
  qualTrim: [string, string, string, string]; // [I Trim, II Trim, III Trim, Média]

  // 4. Classificação anual dos indicadores
  finalQual: string;

  // 5. Apreciação geral (Comentários dos avaliadores por trimestre)
  c1: string;
  c2: string;
  c3: string;
  cf: string;

  // 6. Avaliador
  avNome: string;
  avFuncao: string;
  avData: string;

  // 7. Concordância com a avaliação
  conc: 'Sim' | 'Não' | '';
  avdData: string;
}

export interface ComputedFichaAvaliacaoMetrics {
  mediasIndicadores: (number | null)[]; // [m0, m1, m2, m3, m4]
  quantTrim: (number | null)[]; // [q0, q1, q2]
  quantMedia: number | null; // q3
  qualTrim: [string, string, string, string]; // [qual I, qual II, qual III, qual Média]
  anualMedias: (number | null)[]; // [a0, a1, a2, a3, a4] ordered by ANUAL_INDICADORES_ORDER
  finalQuant: number | null; // fq = sum of non-null mediasIndicadores
  finalQual: string; // Classificação final qualitativa automática
}

export function computeQualitativaFromScore(
  score: number | null | undefined,
  isHundredScale: boolean = false
): string {
  if (score === null || score === undefined || Number.isNaN(score)) return '';
  // Normaliza para a escala de 0 a 20 caso as notas por indicador tenham sido inseridas na escala 0–20 (soma até 100)
  const normalized = isHundredScale || score > 20 ? score / 5 : score;
  const rounded = Math.round(normalized * 100) / 100;
  if (rounded >= 17) return 'Muito Bom';
  if (rounded >= 14) return 'Bom';
  if (rounded >= 10) return 'Suficiente';
  if (rounded >= 7) return 'Medíocre';
  return 'Mau';
}

const STORAGE_KEY = 'sigre_fichas_avaliacao_records_v1';

export function getTodayIsoAvaliacao(): string {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function formatAvaliacaoDateShort(v?: string): string {
  if (!v || v.length < 10) return '';
  const [a, m, d] = v.split('-');
  if (!a || !m || !d) return v;
  return `${d}/${m}/${a}`;
}

export function splitAvaliacaoDateParts(v?: string): [string, string, string] {
  if (!v || v.length < 10) return ['', '', ''];
  const [a, m, d] = v.split('-');
  if (!a || !m || !d) return ['', '', ''];
  return [d, m, a];
}

export function formatAvaliacaoNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '';
  const r = Math.round(n * 100) / 100;
  return String(r).replace('.', ',');
}

export function computeFichaAvaliacaoMetrics(
  notas: (number | null)[][]
): ComputedFichaAvaliacaoMetrics {
  const safeNotas: (number | null)[][] = Array.from({ length: 5 }, (_, i) => {
    const row = Array.isArray(notas?.[i]) ? notas[i] : [];
    return [0, 1, 2].map((t) => {
      const val = row[t];
      if (val === null || val === undefined || (val as unknown) === '') return null;
      const num = Number(val);
      return Number.isNaN(num) ? null : num;
    });
  });

  const allEnteredValues = safeNotas
    .flat()
    .filter((v): v is number => v !== null);
  const isHundredScale = allEnteredValues.some((v) => v > 4);

  const mediasIndicadores = safeNotas.map((row) => {
    const valid = row.filter((v): v is number => v !== null);
    if (!valid.length) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  });

  const quantTrim = [0, 1, 2].map((t) => {
    const col = safeNotas.map((r) => r[t]).filter((v): v is number => v !== null);
    if (!col.length) return null;
    return col.reduce((a, b) => a + b, 0);
  });

  const validTrims = quantTrim.filter((v): v is number => v !== null);
  const quantMedia = validTrims.length
    ? validTrims.reduce((a, b) => a + b, 0) / validTrims.length
    : null;

  const qualTrim: [string, string, string, string] = [
    computeQualitativaFromScore(quantTrim[0], isHundredScale),
    computeQualitativaFromScore(quantTrim[1], isHundredScale),
    computeQualitativaFromScore(quantTrim[2], isHundredScale),
    computeQualitativaFromScore(quantMedia, isHundredScale),
  ];

  const anualMedias = ANUAL_INDICADORES_ORDER.map((idx) => mediasIndicadores[idx]);

  const validMedias = mediasIndicadores.filter((v): v is number => v !== null);
  const finalQuant = validMedias.length
    ? validMedias.reduce((a, b) => a + b, 0)
    : null;

  const finalQual = computeQualitativaFromScore(finalQuant, isHundredScale);

  return {
    mediasIndicadores,
    quantTrim,
    quantMedia,
    qualTrim,
    anualMedias,
    finalQuant,
    finalQual,
  };
}

export function getStoredFichaAvaliacaoRecords(): FichaAvaliacaoRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const today = getTodayIsoAvaliacao();
      const defaultRecord: FichaAvaliacaoRecord = {
        id: 'ficha-avaliacao-default-1',
        criado: new Date().toISOString(),
        provincia: 'Malanje',
        municipio: 'Quêssua',
        escola: 'Complexo Escolar Metodista n.º 294 MJE – Missão do Quêssua – Quêssua',
        nome: 'Gilson José Cassengue',
        categoria: 'P.E.P.E.S. Auxiliar do 3º Grau',
        agente: '88212320',
        dataAval: today,
        de: '2025-09-01',
        ate: '2026-07-31',
        notas: [
          [18, 18, 19],
          [17, 18, 18],
          [19, 19, 20],
          [17, 17, 18],
          [19, 19, 19],
        ],
        qualTrim: ['Bom', 'Bom', 'Muito Bom', 'Bom'],
        finalQual: 'Bom',
        c1: 'Demonstrou elevado domínio científico e pedagógico durante o I Trimestre.',
        c2: 'Manteve excelente assiduidade, pontualidade e acompanhamento contínuo dos alunos.',
        c3: 'Concluiu o programa curricular com aproveitamento positivo e forte espírito de equipa.',
        cf: 'Docente dedicado, assíduo e comprometido com a qualidade do processo de ensino e aprendizagem.',
        avNome: 'Belízio Miguel dos Santos António',
        avFuncao: 'Director Municipal da Educação',
        avData: today,
        conc: 'Sim',
        avdData: today,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultRecord]));
      return [defaultRecord];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFichaAvaliacaoRecord(
  record: Omit<FichaAvaliacaoRecord, 'id' | 'criado'> & { id?: string; criado?: string }
): {
  success: boolean;
  record: FichaAvaliacaoRecord;
} {
  const existing = getStoredFichaAvaliacaoRecords();
  const nowIso = new Date().toISOString();

  const targetId =
    record.id || `ficha-avaliacao-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const finalRecord: FichaAvaliacaoRecord = {
    ...record,
    id: targetId,
    criado: record.criado || nowIso,
  };

  const filtered = existing.filter((r) => r.id !== targetId);
  const updated = [finalRecord, ...filtered];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    saveFichaAvaliacaoToFirestore(finalRecord).catch(() => {});
    fetch('/api/network/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fichasAvaliacao: updated }),
    }).catch(() => {});
    window.dispatchEvent(new CustomEvent('sigre-ficha-avaliacao-updated', { detail: finalRecord }));
  } catch {}

  return { success: true, record: finalRecord };
}

export function deleteFichaAvaliacaoRecord(id: string): boolean {
  const existing = getStoredFichaAvaliacaoRecords();
  const filtered = existing.filter((r) => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    deleteFichaAvaliacaoFromFirestore(id).catch(() => {});
    window.dispatchEvent(new CustomEvent('sigre-ficha-avaliacao-updated'));
    return true;
  } catch {
    return false;
  }
}

export function findDuplicateFichaAvaliacao(
  agente: string,
  dataAval: string,
  excludeId?: string
): {
  isDuplicate: boolean;
  duplicateRecord?: FichaAvaliacaoRecord;
} {
  const records = getStoredFichaAvaliacaoRecords();
  const cleanAgente = (agente || '').trim().toLowerCase();
  const cleanData = (dataAval || '').trim();
  if (!cleanAgente) return { isDuplicate: false };

  for (const r of records) {
    if (excludeId && r.id === excludeId) continue;
    if (
      r.agente.trim().toLowerCase() === cleanAgente &&
      (!cleanData || r.dataAval.trim() === cleanData)
    ) {
      return { isDuplicate: true, duplicateRecord: r };
    }
  }
  return { isDuplicate: false };
}
