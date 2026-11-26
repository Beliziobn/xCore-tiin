import type { AdminSchool } from '../types';

export interface CanonicalSchoolTarget {
  id: string;
  name: string;
}

/**
 * Explicit, evidence-verified remap of retired duplicate school IDs to their single
 * canonical surviving school. Used to transparently heal stale client caches without
 * ever dropping linked people or records.
 */
export const RETIRED_DUPLICATE_SCHOOL_ID_MAP: Record<string, CanonicalSchoolTarget> = {
  'sch-quessua-1387566848': {
    id: 'sch-1795519701839',
    name: 'Complexo Escolar Católico n.º 166 MJE São Pedro - Quêssua',
  },
  'sch-1795638958030': {
    id: 'sch-1794582677807',
    name: 'Complexo Escolar Católico n.º 274 MJE – Nossa Senhora de Guadalupe – Quêssua',
  },
  'sch-quessua-1791255843': {
    id: 'sch-1795514067747',
    name: 'Complexo Escolar n.º 291 MJE – Quissol',
  },
  'sch-quessua-787189302': {
    id: 'sch-1795513514808',
    name: 'Escola Primária Católica n.º 202 MJE - Edith Almeida de Sousa - Quéssua',
  },
  'sch-quessua-382104544': {
    id: 'sch-1795520976161',
    name: 'Escola Primária n.º 209 - São Paulo',
  },
};

export const RETIRED_PLACEHOLDER_SCHOOL_IDS = new Set<string>([
  'sch-quessua-1998243298', // Escola Teste
  'sch-quessua-572132273',  // Unidade Escolar
  'sch-quessua-1751998582', // Complexo Escolar do Quêssua (only rejected test accounts)
]);

const GENERIC_SCHOOL_WORDS = new Set([
  'escola',
  'primaria',
  'complexo',
  'escolar',
  'catolico',
  'catolica',
  'metodista',
  'siao',
  'missionario',
  'missionaria',
  'iepa',
  'evangelico',
  'evangelica',
  'envagelico',
  'envagelica',
  'privado',
  'privada',
  'colegio',
  'liceu',
  'instituto',
  'tecnico',
  'unida',
  'unido',
  'mje',
  'quessua',
  'de',
  'do',
  'da',
  'dos',
  'das',
  'e',
  'n',
  'no',
]);

export function normalizeSchoolText(str?: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[–—−]/g, '-')
    .replace(/\bn\.?\s*[ºo°]\s*/g, ' n ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractSchoolNumber(name?: string): string | null {
  if (!name) return null;
  const norm = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const explicit =
    norm.match(/\bn\.?\s*[ºo°]?\s*(\d{2,5})\b/i) ||
    norm.match(/\b(\d{2,5})\s*mje\b/i) ||
    norm.match(/quessua\s*[-–]?\s*(\d{4,5})\b/i);
  if (explicit) return explicit[1];
  return null;
}

export function extractSchoolCoreTokens(name?: string): string[] {
  const norm = normalizeSchoolText(name);
  if (!norm) return [];
  return norm
    .split(' ')
    .filter((token) => token.length > 0 && !GENERIC_SCHOOL_WORDS.has(token) && !/^\d+$/.test(token));
}

export function normalizeSchoolKeyWithoutSuffix(name?: string): string {
  return normalizeSchoolText(name)
    .replace(/\bmje\b/g, ' ')
    .replace(/\bquessua\b/g, ' ')
    .replace(/\bn\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isPlaceholderSchoolName(name?: string): boolean {
  const norm = normalizeSchoolText(name);
  if (!norm) return true;
  if (
    norm === 'escola teste' ||
    norm === 'unidade escolar' ||
    norm === 'escola oficial' ||
    norm === 'complexo escolar do quessua' ||
    norm === 'escola municipal de quessua' ||
    norm === 'unidade escolar municipal de quessua' ||
    norm.includes('modelo central') ||
    norm.includes('ciencia da educacao') ||
    norm.includes('socienciadaeduca') ||
    norm.includes('direccao municipal') ||
    norm.includes('direcao municipal')
  ) {
    return true;
  }
  return false;
}

export function isRetiredDuplicateOrPlaceholderSchoolId(id?: string): boolean {
  if (!id) return false;
  const clean = String(id).trim().toLowerCase();
  return Boolean(RETIRED_DUPLICATE_SCHOOL_ID_MAP[clean]) || RETIRED_PLACEHOLDER_SCHOOL_IDS.has(clean);
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Returns true ONLY when two school records are unambiguously the exact same real school
 * (same ID, same normalized name ignoring dashes/accents/MJE/Quêssua suffix, or same
 * official school number + matching proper name tokens).
 * Never merges two schools with different official numbers or different proper names.
 */
export function areSameCanonicalSchool(
  a: { id?: string; name?: string; codigoSIGE?: string; registrationData?: { nomeOficial?: string; codigoSIGE?: string } },
  b: { id?: string; name?: string; codigoSIGE?: string; registrationData?: { nomeOficial?: string; codigoSIGE?: string } }
): boolean {
  const idA = String(a?.id || '').trim().toLowerCase();
  const idB = String(b?.id || '').trim().toLowerCase();
  if (idA && idB && idA === idB) return true;

  // Check explicit retired remap
  const mappedA = idA ? RETIRED_DUPLICATE_SCHOOL_ID_MAP[idA]?.id : undefined;
  const mappedB = idB ? RETIRED_DUPLICATE_SCHOOL_ID_MAP[idB]?.id : undefined;
  if ((mappedA && idB && mappedA === idB) || (mappedB && idA && mappedB === idA)) {
    return true;
  }

  const nameA = a?.name || a?.registrationData?.nomeOficial || '';
  const nameB = b?.name || b?.registrationData?.nomeOficial || '';
  if (!nameA || !nameB) return false;

  const normA = normalizeSchoolText(nameA);
  const normB = normalizeSchoolText(nameB);
  if (normA && normB && normA === normB) return true;

  const numA = extractSchoolNumber(nameA);
  const numB = extractSchoolNumber(nameB);
  // Two schools with DIFFERENT explicit official numbers are NEVER the same school
  if (numA && numB && numA !== numB) return false;

  const keyA = normalizeSchoolKeyWithoutSuffix(nameA);
  const keyB = normalizeSchoolKeyWithoutSuffix(nameB);
  if (keyA && keyB && keyA === keyB) return true;

  // Same official school number AND matching core proper name (e.g. "209 São Paulo" with/without "Metodista MJE Quêssua")
  if (numA && numB && numA === numB) {
    const coreA = extractSchoolCoreTokens(nameA).join(' ');
    const coreB = extractSchoolCoreTokens(nameB).join(' ');
    if (coreA && coreB) {
      if (coreA === coreB) return true;
      const maxLen = Math.max(coreA.length, coreB.length);
      if (maxLen >= 5 && levenshteinDistance(coreA, coreB) <= 2) return true;
    }
  }

  return false;
}

export interface DuplicateSchoolCheckResult {
  matchedSchool: AdminSchool;
  reason: 'exact' | 'same_number' | 'similar_spelling' | 'same_sige';
  similarity: number;
}

/**
 * Checks whether a candidate school name / SIGE code matches or is dangerously similar
 * (e.g., typo / swapped letter / dash difference / same official number) to an already
 * registered school, preventing accidental duplicates during school creation/editing.
 */
export function findPotentialDuplicateSchool(
  candidateName: string,
  existingSchools: AdminSchool[],
  options?: { excludeId?: string; codigoSIGE?: string }
): DuplicateSchoolCheckResult | null {
  const cleanCandidate = (candidateName || '').trim();
  if (!cleanCandidate) return null;

  const excludeId = String(options?.excludeId || '').trim().toLowerCase();
  const candNum = extractSchoolNumber(cleanCandidate);
  const candCore = extractSchoolCoreTokens(cleanCandidate).join(' ');
  const candSige = normalizeSchoolText(options?.codigoSIGE);

  for (const sc of existingSchools) {
    if (!sc || !sc.name) continue;
    const scId = String(sc.id || '').trim().toLowerCase();
    if (excludeId && scId === excludeId) continue;

    // 1. Exact canonical match (dashes, accents, MJE, Quêssua suffix, or same number + core)
    if (areSameCanonicalSchool({ name: cleanCandidate }, sc)) {
      return { matchedSchool: sc, reason: 'exact', similarity: 1 };
    }

    // 2. Same official SIGE code (ignoring default placeholder)
    const scSige = normalizeSchoolText(sc.codigoSIGE || sc.registrationData?.codigoSIGE);
    if (candSige && scSige && candSige !== 'sige 102012' && candSige === scSige) {
      return { matchedSchool: sc, reason: 'same_sige', similarity: 1 };
    }

    const scNum = extractSchoolNumber(sc.name);
    // If both have explicit DIFFERENT numbers (e.g., 205 vs 206), they are distinct schools
    if (candNum && scNum && candNum !== scNum) continue;

    // 3. Same official school number
    if (candNum && scNum && candNum === scNum) {
      return { matchedSchool: sc, reason: 'same_number', similarity: 0.95 };
    }

    // 4. Near-duplicate spelling / swapped letters on core proper name (e.g. "Kulifunena" vs "Kulifunina")
    const scCore = extractSchoolCoreTokens(sc.name).join(' ');
    if (candCore.length >= 5 && scCore.length >= 5) {
      const dist = levenshteinDistance(candCore, scCore);
      const maxLen = Math.max(candCore.length, scCore.length);
      const sim = 1 - dist / maxLen;
      if ((dist <= 2 && maxLen >= 7) || sim >= 0.85) {
        return { matchedSchool: sc, reason: 'similar_spelling', similarity: sim };
      }
    }
  }

  return null;
}

function isRealDirectorName(name?: string): boolean {
  const n = normalizeSchoolText(name);
  return Boolean(n && !n.includes('designar') && !n.includes('fert horlan') && !n.includes('a definir'));
}

function scoreSchoolRecord(sc: AdminSchool): number {
  let score = 0;
  const id = String(sc.id || '').toLowerCase();
  if (id.startsWith('sch-179')) score += 50;
  else if (!id.startsWith('sch-quessua-')) score += 20;
  if (isRealDirectorName(sc.directorName)) score += 30;
  if (sc.location && !normalizeSchoolText(sc.location).startsWith('quessua quessua')) score += 15;
  if (sc.codigoSIGE && !sc.codigoSIGE.startsWith('SIGE-000')) score += 10;
  if ((sc.teachersCount || 0) > 0) score += 5;
  return score;
}

/**
 * Deduplicates a list of AdminSchool records into the single canonical list,
 * merging metadata cleanly when canonical duplicates exist and sorting A–Z in Portuguese.
 */
export function deduplicateSchoolsCanonical(
  schools: AdminSchool[],
  isTombstonedFn?: (school: AdminSchool) => boolean
): AdminSchool[] {
  const result: AdminSchool[] = [];

  for (const sc of schools || []) {
    if (!sc || !sc.name) continue;
    if (isPlaceholderSchoolName(sc.name)) continue;
    if (RETIRED_PLACEHOLDER_SCHOOL_IDS.has(String(sc.id || '').trim().toLowerCase())) continue;
    if (isTombstonedFn && isTombstonedFn(sc)) continue;

    // If this record has a retired duplicate ID, skip if its canonical target is already present
    const lowerId = String(sc.id || '').trim().toLowerCase();
    const remap = RETIRED_DUPLICATE_SCHOOL_ID_MAP[lowerId];
    const normalizedCandidate: AdminSchool = remap
      ? {
          ...sc,
          id: remap.id,
          name: remap.name,
          registrationData: sc.registrationData
            ? { ...sc.registrationData, id: remap.id, nomeOficial: remap.name }
            : sc.registrationData,
        }
      : sc;

    const existingIdx = result.findIndex((item) => areSameCanonicalSchool(item, normalizedCandidate));
    if (existingIdx >= 0) {
      const prev = result[existingIdx];
      const prevScore = scoreSchoolRecord(prev);
      const nextScore = scoreSchoolRecord(normalizedCandidate);
      const prevTs = Number((prev as any)._updatedAt || Date.parse((prev as any).updatedAt || '') || 0);
      const nextTs = Number((normalizedCandidate as any)._updatedAt || Date.parse((normalizedCandidate as any).updatedAt || '') || 0);

      // Prefer higher-quality canonical record (real sch-179... over sch-quessua-...), breaking ties by newest timestamp
      const nextWins = nextScore > prevScore || (nextScore === prevScore && nextTs >= prevTs);
      const primary = nextWins ? normalizedCandidate : prev;
      const secondary = nextWins ? prev : normalizedCandidate;

      const resolvedDirector = isRealDirectorName(primary.directorName)
        ? primary.directorName
        : isRealDirectorName(secondary.directorName)
        ? secondary.directorName
        : primary.directorName || secondary.directorName;

      result[existingIdx] = {
        ...secondary,
        ...primary,
        id: primary.id || secondary.id,
        name: primary.name || secondary.name,
        directorName: resolvedDirector,
        teachersCount: Math.max(primary.teachersCount || 0, secondary.teachersCount || 0),
        registrationData: primary.registrationData || secondary.registrationData,
      };
    } else {
      result.push(normalizedCandidate);
    }
  }

  return result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt'));
}

/**
 * Resolves a single canonical AdminSchool from a list of registered schools given
 * a candidate { schoolId, schoolName }.
 * CRITICAL: When both schoolName and schoolId are present but point to two DIFFERENT schools
 * (e.g. because schoolId was historically defaulted to schools[0].id), the explicit non-placeholder
 * schoolName takes precedence so a record never jumps to schools[0].
 */
export function resolveCanonicalSchool(
  schools: AdminSchool[],
  candidate?: { schoolId?: string; schoolName?: string }
): AdminSchool | undefined {
  if (!schools || schools.length === 0 || !candidate) return undefined;

  const cleanName = (candidate.schoolName || '').trim();
  const cleanId = (candidate.schoolId || '').trim();

  let byName: AdminSchool | undefined;
  if (cleanName && !isPlaceholderSchoolName(cleanName)) {
    const normCand = normalizeSchoolText(cleanName);
    // 1. Exact normalized text match first
    byName =
      schools.find((s) => normalizeSchoolText(s.name) === normCand) ||
      schools.find((s) => areSameCanonicalSchool({ name: cleanName }, s)) ||
      schools.find((s) => {
        const sige = normalizeSchoolText(s.codigoSIGE || s.registrationData?.codigoSIGE);
        return Boolean(sige && sige !== 'sige 102012' && sige === normCand);
      });
  }

  let byId: AdminSchool | undefined;
  if (cleanId) {
    const lowerId = cleanId.toLowerCase();
    byId =
      schools.find((s) => String(s.id || '').trim().toLowerCase() === lowerId) ||
      schools.find((s) => areSameCanonicalSchool({ id: cleanId }, s));
  }

  // If explicit schoolName resolves to a real registered school, prefer it over a conflicting schoolId
  if (byName) return byName;
  return byId;
}

/**
 * Strictly determines whether a student record belongs to a target school.
 * Prevents the dual (matchId || matchName) bug where a student with escola="School B"
 * and a stale/defaulted schoolId="School A" was matched to School A.
 */
export function doesStudentBelongToSchool(
  student: {
    schoolId?: string;
    escola?: string;
    nomeEscola?: string;
    schoolName?: string;
    registrationData?: {
      schoolId?: string;
      escola?: string;
      nomeEscola?: string;
    } | null;
  },
  school: AdminSchool,
  allSchools?: AdminSchool[]
): boolean {
  if (!student || !school) return false;

  const rawName = (
    student.escola ||
    student.nomeEscola ||
    student.registrationData?.escola ||
    student.registrationData?.nomeEscola ||
    student.schoolName ||
    ''
  ).trim();

  const rawId = (student.schoolId || student.registrationData?.schoolId || '').trim();
  const schoolCodeNorm = normalizeSchoolText(school.codigoSIGE || school.registrationData?.codigoSIGE);

  if (rawName && !isPlaceholderSchoolName(rawName)) {
    const normRawName = normalizeSchoolText(rawName);
    const matchesByName =
      normRawName === normalizeSchoolText(school.name) ||
      areSameCanonicalSchool({ name: rawName }, school) ||
      Boolean(schoolCodeNorm && schoolCodeNorm !== 'sige 102012' && normRawName === schoolCodeNorm);

    if (matchesByName) return true;

    // If the student has a real non-placeholder school name that does NOT match this school,
    // never allow a conflicting schoolId to pull the student into this school!
    if (allSchools && allSchools.length > 0) {
      const matchedOther = resolveCanonicalSchool(allSchools, { schoolName: rawName });
      if (matchedOther && !areSameCanonicalSchool(matchedOther, school)) {
        return false;
      }
    }
    return false;
  }

  // Only when the student record has no valid/non-placeholder school name, fall back to schoolId
  if (rawId) {
    return areSameCanonicalSchool({ id: rawId }, school);
  }

  return false;
}

