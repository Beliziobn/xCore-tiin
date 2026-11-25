import type {
  QuickServiceRequest,
  QuickServiceType,
  QuickServiceStatus,
  QuickServiceGradeItem,
} from '../types';
import { MAX_TURMA_CAPACITY } from '../types';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import {
  saveQuickRequestToFirestore,
  fetchQuickRequestsFromFirestore,
  fetchQuickRequestsByStatusPage,
  fetchDashboardStats,
  type FirestorePageResult,
  PAGINATION_PAGE_SIZE,
  updateQuickRequestInFirestore,
  deleteQuickRequestFromFirestore,
  clearAllQuickRequestsFromFirestore,
  subscribeToQuickRequests,
  fetchStudentsFromFirestore,
} from './firestoreSync';
import { getStoredStudents } from './studentStorage';
import { isExpressApiAvailable, checkExpressApiResponse } from './apiAvailability';
import {
  normalizeClasseName,
  normalizeTurmaName,
} from './turmaStudentsService';
import {
  consolidateTurmaPauta,
  getStoredMiniPautas,
  getGradingScaleForClass,
  formatGradeForClass,
  isPassingGradeForClass,
  getDisciplinasForClass,
} from './miniPautaStorage';

const STORAGE_KEY = 'sigre_quick_services_local_cache';

function normalizeText(val?: string | null): string {
  return String(val || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const GENERIC_SCHOOL_NAMES = new Set([
  'escola oficial',
  'escola municipal',
  'direccao escolar',
  'direcao escolar',
  'unidade escolar municipal',
  'unidade escolar municipal de quessua',
]);

export function schoolsMatch(schoolA?: string | null, schoolB?: string | null): boolean {
  const a = normalizeText(schoolA);
  const b = normalizeText(schoolB);
  if (!a || !b) return false;
  if (GENERIC_SCHOOL_NAMES.has(a) || GENERIC_SCHOOL_NAMES.has(b)) return false;
  if (a === b) return true;

  // Compare core school numbers if present (e.g. "166", "314", "269")
  const numA = a.match(/\b\d{2,5}\b/)?.[0];
  const numB = b.match(/\b\d{2,5}\b/)?.[0];
  if (numA && numB) {
    return numA === numB;
  }
  if ((numA && !numB) || (!numA && numB)) {
    return false;
  }

  if (a.length >= 12 && b.length >= 12 && (a.includes(b) || b.includes(a))) {
    return true;
  }
  return false;
}

function collectAllRealSchoolStudentRecords(): any[] {
  const collected: any[] = [];
  const seenKeys = new Set<string>();

  const pushUnique = (item: any) => {
    if (!item || typeof item !== 'object') return;
    const reg = item.registrationData && typeof item.registrationData === 'object' ? item.registrationData : null;
    const rawName = String(item.nomeCompleto || item.name || reg?.nomeCompleto || reg?.name || '').trim();
    if (!rawName) return;
    const rawSchool = String(item.escola || item.nomeEscola || item.schoolName || reg?.escola || '').trim();
    const key = `${normalizeText(rawName)}::${normalizeText(rawSchool)}::${normalizeText(
      item.codigoMatricula || item.numeroDocumento || reg?.codigoMatricula || ''
    )}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    collected.push(item);
  };

  getStoredStudents().forEach(pushUnique);

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    for (const storageKey of ['ucore_admin_students', 'ucore_director_students', 'ucore_teacher_students']) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) arr.forEach(pushUnique);
        }
      } catch {}
    }
  }

  return collected;
}

export interface StudentEnrollmentVerificationResult {
  isEnrolled: boolean;
  studentId?: string;
  matchedName?: string;
  matchedBiOrProcesso?: string;
  matchedSchoolName?: string;
  codigoMatricula?: string;
  classe?: string;
  turma?: string;
  turno?: string;
  sala?: string;
  reason?: string;
}

export function findStudentEnrolledSchoolAnywhere(params: {
  studentName?: string;
  studentBiOrProcesso?: string;
}): { schoolName: string; studentName: string; classe?: string; turma?: string } | null {
  const targetName = normalizeText(params.studentName);
  const targetBi = normalizeText(params.studentBiOrProcesso);
  if (!targetName && !targetBi) return null;

  const allStudents = collectAllRealSchoolStudentRecords();
  for (const st of allStudents) {
    const reg = st.registrationData && typeof st.registrationData === 'object' ? st.registrationData : null;
    const stNameRaw = String(st.nomeCompleto || st.name || reg?.nomeCompleto || reg?.name || '').trim();
    const stName = normalizeText(stNameRaw);
    const stBi = normalizeText(st.numeroDocumento || reg?.numeroDocumento || '');
    const stCod = normalizeText(st.codigoMatricula || reg?.codigoMatricula || '');
    const stSchool = String(st.escola || st.nomeEscola || st.schoolName || reg?.escola || '').trim();
    if (!stSchool || GENERIC_SCHOOL_NAMES.has(normalizeText(stSchool))) continue;

    const nameMatches =
      targetName &&
      stName &&
      (stName === targetName ||
        (targetName.length >= 6 && stName.includes(targetName)) ||
        (stName.length >= 6 && targetName.includes(stName)));
    const biMatches =
      targetBi &&
      targetBi !== 'registo escolar' &&
      targetBi !== 'nao informado' &&
      ((stBi && (stBi === targetBi || stBi.includes(targetBi))) ||
        (stCod && (stCod === targetBi || stCod.includes(targetBi))));

    if (nameMatches || biMatches) {
      return {
        schoolName: stSchool,
        studentName: stNameRaw,
        classe: normalizeClasseName(st.classeEtapaModulo || st.classe || st.gradeClass || reg?.classe || ''),
        turma: normalizeTurmaName(st.turma || reg?.turma || 'Turma A'),
      };
    }
  }

  const miniPautas = getStoredMiniPautas();
  for (const mp of miniPautas) {
    const mpSchool = String(mp.schoolName || '').trim();
    if (!mpSchool || GENERIC_SCHOOL_NAMES.has(normalizeText(mpSchool))) continue;
    for (const row of mp.rows || []) {
      const rowName = normalizeText(row.nomeCompleto);
      const rowCode = normalizeText(row.codigo || row.studentId);
      const nameMatches =
        targetName &&
        rowName &&
        (rowName === targetName ||
          (targetName.length >= 6 && rowName.includes(targetName)) ||
          (rowName.length >= 6 && targetName.includes(rowName)));
      const codeMatches =
        targetBi &&
        targetBi !== 'registo escolar' &&
        rowCode &&
        (rowCode === targetBi || rowCode.includes(targetBi));
      if (nameMatches || codeMatches) {
        return {
          schoolName: mpSchool,
          studentName: row.nomeCompleto,
          classe: normalizeClasseName(mp.classe),
          turma: normalizeTurmaName(mp.turma),
        };
      }
    }
  }

  return null;
}

/**
 * Verifica se o aluno consta efetivamente matriculado numa turma da escola indicada.
 */
export function verifyStudentEnrollmentInSchool(params: {
  schoolName?: string;
  studentName?: string;
  studentBiOrProcesso?: string;
  studentClasse?: string;
  studentTurma?: string;
}): StudentEnrollmentVerificationResult {
  const targetName = normalizeText(params.studentName);
  const targetBi = normalizeText(params.studentBiOrProcesso);
  const targetSchool = (params.schoolName || '').trim();
  const normClasse = params.studentClasse ? normalizeClasseName(params.studentClasse) : '';
  const normTurma = params.studentTurma ? normalizeTurmaName(params.studentTurma) : '';

  if (!targetName && !targetBi) {
    return {
      isEnrolled: false,
      reason: 'Nome ou número de identificação do aluno não informado no pedido.',
    };
  }

  if (!targetSchool) {
    return {
      isEnrolled: false,
      reason: 'A instituição escolar do pedido não foi especificada.',
    };
  }

  // 1. Procurar estritamente nos estudantes registados da escola indicada
  const allRealStudents = collectAllRealSchoolStudentRecords();
  for (const st of allRealStudents) {
    const reg = st.registrationData && typeof st.registrationData === 'object' ? st.registrationData : null;
    const stNameRaw = String(st.nomeCompleto || st.name || reg?.nomeCompleto || reg?.name || '').trim();
    const stName = normalizeText(stNameRaw);
    const stBi = normalizeText(st.numeroDocumento || reg?.numeroDocumento || '');
    const stCod = normalizeText(st.codigoMatricula || reg?.codigoMatricula || '');
    const stIdNorm = normalizeText(st.id || '');
    const stSchool = String(st.escola || st.nomeEscola || st.schoolName || reg?.escola || '').trim();

    if (!stSchool || !schoolsMatch(stSchool, targetSchool)) continue;

    const nameMatches =
      targetName &&
      stName &&
      (stName === targetName ||
        (targetName.length >= 6 && stName.includes(targetName)) ||
        (stName.length >= 6 && targetName.includes(stName)));
    const biMatches =
      targetBi &&
      targetBi !== 'registo escolar' &&
      targetBi !== 'nao informado' &&
      ((stBi && (stBi === targetBi || stBi.includes(targetBi))) ||
        (stCod && (stCod === targetBi || stCod.includes(targetBi))) ||
        (stIdNorm && stIdNorm === targetBi));

    if (nameMatches || biMatches) {
      const rawCls = st.classeEtapaModulo || st.classe || st.gradeClass || reg?.classe || normClasse || '7ª Classe';
      const rawTur = st.turma || reg?.turma || normTurma || 'Turma A';
      const resolvedClasse = normalizeClasseName(rawCls);
      const resolvedTurma = normalizeTurmaName(rawTur);
      return {
        isEnrolled: true,
        studentId: st.id || `st_${stName}`,
        matchedName: stNameRaw,
        matchedBiOrProcesso:
          st.numeroDocumento || st.codigoMatricula || reg?.codigoMatricula || params.studentBiOrProcesso || 'Confirmado',
        matchedSchoolName: stSchool,
        codigoMatricula:
          st.codigoMatricula ||
          reg?.codigoMatricula ||
          `MAT-2026/${String(st.id || '001').slice(-3).toUpperCase()}`,
        classe: resolvedClasse,
        turma: resolvedTurma,
        turno: st.turno || st.periodo || reg?.turno || (resolvedTurma.includes('B') ? 'Tarde' : 'Manhã'),
        sala: st.sala || st.room || reg?.sala || (resolvedTurma.includes('B') ? 'Sala 04' : 'Sala 03'),
      };
    }
  }

  // 2. Procurar nas Mini-Pautas submetidas especificamente pelos professores desta escola
  const miniPautas = getStoredMiniPautas();
  for (const mp of miniPautas) {
    if (!mp.schoolName || !schoolsMatch(mp.schoolName, targetSchool)) continue;

    for (const row of mp.rows || []) {
      const rowName = normalizeText(row.nomeCompleto);
      const rowCode = normalizeText(row.codigo || row.studentId);

      const nameMatches =
        targetName &&
        rowName &&
        (rowName === targetName ||
          (targetName.length >= 6 && rowName.includes(targetName)) ||
          (rowName.length >= 6 && targetName.includes(rowName)));
      const codeMatches =
        targetBi &&
        targetBi !== 'registo escolar' &&
        rowCode &&
        (rowCode === targetBi || rowCode.includes(targetBi));

      if (nameMatches || codeMatches) {
        return {
          isEnrolled: true,
          studentId: row.studentId,
          matchedName: row.nomeCompleto,
          matchedBiOrProcesso: row.codigo || params.studentBiOrProcesso || 'Confirmado',
          matchedSchoolName: mp.schoolName,
          codigoMatricula: row.codigo || `MAT-2026/${String(row.numero).padStart(3, '0')}`,
          classe: normalizeClasseName(mp.classe),
          turma: normalizeTurmaName(mp.turma),
          turno: mp.turno || 'Manhã',
          sala: mp.sala || 'Sala 01',
        };
      }
    }
  }

  // Verificar se o aluno existe matriculado numa OUTRA escola para dar mensagem precisa
  const otherSchoolMatch = findStudentEnrolledSchoolAnywhere({
    studentName: params.studentName,
    studentBiOrProcesso: params.studentBiOrProcesso,
  });

  if (otherSchoolMatch && !schoolsMatch(otherSchoolMatch.schoolName, targetSchool)) {
    return {
      isEnrolled: false,
      reason: `O aluno "${otherSchoolMatch.studentName}" está matriculado na instituição "${otherSchoolMatch.schoolName}", e NÃO pertence à instituição "${targetSchool}".`,
    };
  }

  return {
    isEnrolled: false,
    reason: `O aluno "${params.studentName || 'Não identificado'}" não consta matriculado em nenhuma turma registada na instituição "${targetSchool}".`,
  };
}

let lastCloudStudentsSyncAt = 0;

export async function verifyStudentEnrollmentInSchoolAsync(params: {
  schoolName?: string;
  studentName?: string;
  studentBiOrProcesso?: string;
  studentClasse?: string;
  studentTurma?: string;
}): Promise<StudentEnrollmentVerificationResult> {
  const localResult = verifyStudentEnrollmentInSchool(params);
  if (localResult.isEnrolled) return localResult;

  // Se ainda não sincronizamos alunos da nuvem recentemente, garante leitura fresca do Firestore antes de bloquear
  const now = Date.now();
  if (now - lastCloudStudentsSyncAt > 30000) {
    lastCloudStudentsSyncAt = now;
    try {
      const cloudStudents = await fetchStudentsFromFirestore();
      if (Array.isArray(cloudStudents) && cloudStudents.length > 0 && typeof localStorage !== 'undefined') {
        const prevFlag = Boolean((window as any).__SIGRE_APPLYING_SERVER_STATE);
        (window as any).__SIGRE_APPLYING_SERVER_STATE = true;
        try {
          const existing = getStoredStudents();
          const map = new Map<string, any>();
          existing.forEach((s: any) => {
            if (s && (s.id || s.nomeCompleto)) {
              map.set(String(s.id || `${s.nomeCompleto}::${s.escola || ''}`), s);
            }
          });
          cloudStudents.forEach((s: any) => {
            if (s && (s.id || s.nomeCompleto || s.name)) {
              map.set(String(s.id || `${s.nomeCompleto || s.name}::${s.escola || s.schoolName || ''}`), s);
            }
          });
          localStorage.setItem('ucore_registered_students_v2', JSON.stringify(Array.from(map.values())));
        } finally {
          (window as any).__SIGRE_APPLYING_SERVER_STATE = prevFlag;
        }
      }
    } catch {
      // ignore cloud sync error
    }
  }

  return verifyStudentEnrollmentInSchool(params);
}

export interface ExtractedStudentGradesResult {
  hasLaunchedGrades: boolean;
  launchedDisciplinesCount: number;
  totalDisciplinesCount: number;
  gradesSnapshot: QuickServiceGradeItem[];
  overallAverage: string;
  academicStatus: string;
  gradingScaleType: 'qualitativo' | 'escala_0_10' | 'escala_0_20';
  gradingScaleLabel: string;
}

/**
 * Puxa automaticamente as notas do aluno a partir das Mini-Pautas e Pautas consolidadas da turma.
 */
export function extractStudentGradesFromPautas(params: {
  schoolName?: string;
  studentName?: string;
  studentBiOrProcesso?: string;
  classe: string;
  turma: string;
  trimestre?: string;
}): ExtractedStudentGradesResult {
  const normClasse = normalizeClasseName(params.classe || '7ª Classe');
  const normTurma = normalizeTurmaName(params.turma || 'Turma A');
  const scale = getGradingScaleForClass(normClasse);
  const officialDisciplinas = getDisciplinasForClass(normClasse);

  const consolidated = consolidateTurmaPauta(
    normClasse,
    normTurma,
    params.schoolName || 'Complexo Escolar do Quêssua'
  );

  const targetName = normalizeText(params.studentName);
  const targetBi = normalizeText(params.studentBiOrProcesso);

  // Locate student inside consolidated pauta
  const matchedStudent = consolidated.students.find((stu) => {
    const stuName = normalizeText(stu.nomeCompleto);
    const stuCode = normalizeText(stu.codigo || stu.studentId);
    const byName =
      targetName &&
      stuName &&
      (stuName === targetName ||
        (targetName.length >= 6 && stuName.includes(targetName)) ||
        (stuName.length >= 6 && targetName.includes(stuName)));
    const byCode =
      targetBi &&
      targetBi !== 'registo escolar' &&
      stuCode &&
      (stuCode === targetBi || stuCode.includes(targetBi));
    return Boolean(byName || byCode);
  });

  // Determine active trimester ('I' | 'II' | 'III' | 'FINAL')
  const trimNorm = normalizeText(params.trimestre || '1º Trimestre');
  const isFinal = trimNorm.includes('final') || trimNorm.includes('anual');
  const trimKey: 't1' | 't2' | 't3' = trimNorm.includes('2')
    ? 't2'
    : trimNorm.includes('3')
    ? 't3'
    : 't1';

  const disciplinasList =
    consolidated.disciplinas.length > 0 ? consolidated.disciplinas : officialDisciplinas;

  if (!matchedStudent) {
    return {
      hasLaunchedGrades: false,
      launchedDisciplinesCount: 0,
      totalDisciplinesCount: disciplinasList.length,
      gradesSnapshot: disciplinasList.map((disc) => ({
        subject: disc,
        mac: '—',
        npp: '—',
        npt: '—',
        mt: '—',
        mt1: '—',
        mt2: '—',
        mt3: '—',
        mfd: '—',
        isPassing: false,
      })),
      overallAverage: '—',
      academicStatus: 'Sem Notas Lançadas nas Mini-Pautas',
      gradingScaleType: scale.type,
      gradingScaleLabel: scale.shortScaleLabel,
    };
  }

  let launchedCount = 0;
  let numericSum = 0;

  const gradesSnapshot: QuickServiceGradeItem[] = disciplinasList.map((disc) => {
    const dRecord = matchedStudent.byDiscipline[disc];
    if (!dRecord) {
      return {
        subject: disc,
        mac: '—',
        npp: '—',
        npt: '—',
        mt: '—',
        mt1: '—',
        mt2: '—',
        mt3: '—',
        mfd: '—',
        isPassing: false,
      };
    }

    launchedCount++;
    const activeTrim = dRecord[trimKey];
    const mainScore = isFinal ? dRecord.mfd : activeTrim.mt;
    numericSum += Number(mainScore || 0);

    return {
      subject: disc,
      mac: formatGradeForClass(activeTrim.mac, normClasse, 'compact'),
      npp: formatGradeForClass(activeTrim.npp, normClasse, 'compact'),
      npt: formatGradeForClass(activeTrim.npt, normClasse, 'compact'),
      mt: formatGradeForClass(mainScore, normClasse, 'full'),
      mt1: formatGradeForClass(dRecord.t1.mt, normClasse, 'compact'),
      mt2: formatGradeForClass(dRecord.t2.mt, normClasse, 'compact'),
      mt3: formatGradeForClass(dRecord.t3.mt, normClasse, 'compact'),
      mfd: formatGradeForClass(dRecord.mfd, normClasse, 'full'),
      isPassing: isPassingGradeForClass(mainScore, normClasse),
      teacherName: dRecord.teacherName,
    };
  });

  const avgNumeric = launchedCount > 0 ? Math.round((numericSum / launchedCount) * 10) / 10 : 0;
  const overallAverage =
    launchedCount > 0 ? formatGradeForClass(avgNumeric, normClasse, 'full') : '—';
  const passedOverall = launchedCount > 0 && isPassingGradeForClass(avgNumeric, normClasse);

  return {
    hasLaunchedGrades: launchedCount > 0,
    launchedDisciplinesCount: launchedCount,
    totalDisciplinesCount: disciplinasList.length,
    gradesSnapshot,
    overallAverage,
    academicStatus:
      launchedCount === 0
        ? 'Aguardando Lançamento de Mini-Pautas'
        : passedOverall
        ? 'APROVADO(A) / TRANSITA'
        : 'NÃO TRANSITA / EM RECUPERAÇÃO',
    gradingScaleType: scale.type,
    gradingScaleLabel: scale.shortScaleLabel,
  };
}

export interface DestinationTurmaVacancyInfo {
  turma: string;
  turno: string;
  sala: string;
  enrolledCount: number;
  reservedCount: number;
  occupiedTotal: number;
  maxCapacity: number;
  availableVacancies: number;
  isFull: boolean;
}

/**
 * Calcula a disponibilidade real de vagas por Turma na Escola de Destino para uma determinada Classe.
 */
export function getDestinationSchoolTurmaVacancies(params: {
  destinationSchoolName: string;
  classe: string;
  allRequests?: QuickServiceRequest[];
}): DestinationTurmaVacancyInfo[] {
  const normClasse = normalizeClasseName(params.classe || '7ª Classe');
  const destSchool = params.destinationSchoolName || '';
  const turmas = ['Turma A', 'Turma B', 'Turma C', 'Turma D'];
  const storedStudents = getStoredStudents();

  // Check existing reserved seats in quick requests
  let requestsList: QuickServiceRequest[] = params.allRequests || [];
  if (requestsList.length === 0 && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) requestsList = JSON.parse(raw);
    } catch {}
  }

  return turmas.map((turmaName, idx) => {
    const normTurma = normalizeTurmaName(turmaName);
    const turno = idx % 2 === 0 ? 'Manhã' : 'Tarde';
    const sala = `Sala 0${idx + 1}`;

    // Count students explicitly registered in this destination school + classe + turma
    const enrolledInStorage = storedStudents.filter((s) => {
      const sSchool = s.escola || s.nomeEscola || '';
      const sClasse = normalizeClasseName(s.classe || '');
      const sTurma = normalizeTurmaName(s.turma || '');
      return schoolsMatch(sSchool, destSchool) && sClasse === normClasse && sTurma === normTurma;
    }).length;

    // Count students already reserved via confirmed transfer requests to this destination school + classe + turma
    const reservedTransfers = requestsList.filter((r) => {
      if (r.serviceType !== 'GUIA_TRANSFERENCIA') return false;
      if (r.status !== 'VAGA_CONFIRMADA' && r.status !== 'CONCLUIDO') return false;
      const rDest = r.destinationSchoolName || r.details?.destinationSchool || r.details?.purpose || '';
      const rClasse = normalizeClasseName(r.details?.studentClasse || '');
      const rTurma = normalizeTurmaName(r.details?.reservedTurma || '');
      return schoolsMatch(rDest, destSchool) && rClasse === normClasse && rTurma === normTurma;
    }).length;

    const occupiedTotal = Math.min(MAX_TURMA_CAPACITY, enrolledInStorage + reservedTransfers);
    const availableVacancies = Math.max(0, MAX_TURMA_CAPACITY - occupiedTotal);

    return {
      turma: normTurma,
      turno,
      sala,
      enrolledCount: enrolledInStorage,
      reservedCount: reservedTransfers,
      occupiedTotal,
      maxCapacity: MAX_TURMA_CAPACITY,
      availableVacancies,
      isFull: availableVacancies <= 0,
    };
  });
}

export async function fetchQuickRequests(filters?: {
  schoolId?: string;
  targetRole?: 'DIRECTOR' | 'ADMIN';
  protocol?: string;
  phone?: string;
  id?: string;
}): Promise<QuickServiceRequest[]> {
  const hasFilters = Boolean(
    filters?.schoolId || filters?.targetRole || filters?.protocol || filters?.phone || filters?.id
  );

  // Return cached results if we just fetched within the last 15 seconds (prevents multi-component mount / event storms)
  const now = Date.now();
  if (!hasFilters && now - lastQuickRequestsFetchAt < 15000) {
    const cachedList = getCachedQuickRequests();
    if (cachedList.length > 0) {
      return cachedList;
    }
  }

  if (!hasFilters && quickRequestsInFlight) {
    return quickRequestsInFlight;
  }

  const runFetch = async (): Promise<QuickServiceRequest[]> => {
    const map = new Map<string, QuickServiceRequest>();

    // 1. Fetch from Firestore Cloud Database (bounded to active queue or explicit status/protocol)
    try {
      const cloudRequests = await fetchQuickRequestsFromFirestore({
        protocol: filters?.protocol,
      });
      if (Array.isArray(cloudRequests) && cloudRequests.length > 0) {
        cloudRequests.forEach((r) => {
          if (r && r.id) map.set(r.id, r);
        });
      }
    } catch (err) {
      console.warn('[QuickServices] Cloud fetch warning:', err);
    }

    // 2. Fetch from backend API (only when Express API backend is active)
    if (isExpressApiAvailable()) {
      try {
        const params = new URLSearchParams();
        if (filters?.schoolId) params.append('schoolId', filters.schoolId);
        if (filters?.targetRole) params.append('targetRole', filters.targetRole);
        if (filters?.protocol) params.append('protocol', filters.protocol);
        if (filters?.phone) params.append('phone', filters.phone);
        if (filters?.id) params.append('id', filters.id);

        const res = await fetch(`/api/quick-requests?${params.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        if (checkExpressApiResponse(res)) {
          const data = await res.json();
          if (Array.isArray(data.requests)) {
            data.requests.forEach((r: QuickServiceRequest) => {
              if (r && r.id && !map.has(r.id)) {
                map.set(r.id, r);
                saveQuickRequestToFirestore(r).catch(() => {});
              }
            });
          }
        }
      } catch (err) {
        console.warn('[QuickServices] Server API fetch failed, continuing with cloud/local:', err);
      }
    }

    // 3. Fallback to local cache if map is still empty
    if (map.size === 0) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const list: QuickServiceRequest[] = JSON.parse(cached);
          list.forEach((r) => {
            if (r && r.id) map.set(r.id, r);
          });
        }
      } catch {}
    }

    let list = Array.from(map.values());

    // Cache in localStorage WITHOUT triggering Storage.prototype.setItem dirty sync loop
    writeQuickCacheQuietly(list);
    if (!hasFilters) {
      lastQuickRequestsFetchAt = Date.now();
    }

    // Apply filters
    if (filters?.protocol) {
      list = list.filter((r) => r.protocol?.toUpperCase() === filters.protocol?.toUpperCase());
    }
    if (filters?.schoolId) {
      list = list.filter((r) => r.targetSchoolId === filters.schoolId);
    }
    if (filters?.targetRole) {
      list = list.filter((r) => r.targetRole === filters.targetRole);
    }
    if (filters?.phone) {
      list = list.filter((r) => r.requesterPhone?.includes(filters.phone || ''));
    }

    return list;
  };

  if (!hasFilters) {
    quickRequestsInFlight = runFetch().finally(() => {
      quickRequestsInFlight = null;
    });
    return quickRequestsInFlight;
  }

  return runFetch();
}

let lastQuickRequestsFetchAt = 0;
let quickRequestsInFlight: Promise<QuickServiceRequest[]> | null = null;

export function getCachedQuickRequests(): QuickServiceRequest[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return [];
    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQuickCacheQuietly(list: QuickServiceRequest[]): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  const prevFlag = Boolean((window as any).__SIGRE_APPLYING_SERVER_STATE);
  (window as any).__SIGRE_APPLYING_SERVER_STATE = true;
  try {
    const nextJson = JSON.stringify(list);
    const prevJson = localStorage.getItem(STORAGE_KEY);
    if (prevJson !== nextJson) {
      localStorage.setItem(STORAGE_KEY, nextJson);
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    (window as any).__SIGRE_APPLYING_SERVER_STATE = prevFlag;
  }
}

export async function submitQuickServiceRequest(payload: {
  serviceType: QuickServiceType;
  title: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail?: string;
  requesterRoleTitle?: string;
  targetRole?: 'DIRECTOR' | 'ADMIN';
  targetSchoolId?: string;
  targetSchoolName?: string;
  targetDirectorEmail?: string;
  targetAdminEmail?: string;
  destinationSchoolId?: string;
  destinationSchoolName?: string;
  details: QuickServiceRequest['details'];
}): Promise<{ success: boolean; request?: QuickServiceRequest; protocol?: string; message?: string; error?: string }> {
  try {
    let createdRequest: QuickServiceRequest | undefined;

    if (isExpressApiAvailable()) {
      try {
        const res = await fetch('/api/quick-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (checkExpressApiResponse(res)) {
          const data = await res.json();
          if (data.success && data.request) {
            createdRequest = {
              ...data.request,
              destinationSchoolId: payload.destinationSchoolId || payload.details?.destinationSchoolId,
              destinationSchoolName: payload.destinationSchoolName || payload.details?.destinationSchool,
              details: {
                ...payload.details,
                ...(data.request.details || {}),
              },
            };
          }
        }
      } catch {}
    }

    if (!createdRequest) {
      // Offline fallback: generate structured protocol
      const code = String(Math.floor(1000 + Math.random() * 9000));
      createdRequest = {
        id: `sr_${Date.now()}_${code}`,
        protocol: `SR-2026-${code}`,
        serviceType: payload.serviceType,
        title: payload.title,
        status: 'PENDENTE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        requesterName: payload.requesterName,
        requesterPhone: payload.requesterPhone,
        requesterEmail: payload.requesterEmail,
        requesterRoleTitle: payload.requesterRoleTitle,
        targetRole: payload.serviceType === 'DECLARACAO_EFECTIVIDADE' ? 'ADMIN' : 'DIRECTOR',
        targetSchoolId: payload.targetSchoolId,
        targetSchoolName: payload.targetSchoolName,
        targetDirectorEmail: payload.targetDirectorEmail,
        targetAdminEmail: 'dmedoquessua@gmail.com',
        destinationSchoolId: payload.destinationSchoolId || payload.details?.destinationSchoolId,
        destinationSchoolName: payload.destinationSchoolName || payload.details?.destinationSchool,
        details: payload.details,
      };
    }

    // Persist directly to Firebase Firestore cloud database
    await saveQuickRequestToFirestore(createdRequest);

    // Update local cache
    const list = getCachedQuickRequests();
    list.unshift(createdRequest);
    writeQuickCacheQuietly(list);
    lastQuickRequestsFetchAt = Date.now();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigre_quick_request_created', { detail: createdRequest }));
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }

    return {
      success: true,
      request: createdRequest,
      protocol: createdRequest.protocol,
      message: 'Pedido submetido e sincronizado na nuvem com sucesso.',
    };
  } catch (err: any) {
    console.error('[QuickServices] Submit error:', err);
    return { success: false, error: err.message || 'Erro ao submeter pedido.' };
  }
}

export async function updateQuickRequestStatus(
  id: string,
  updates: {
    status?: QuickServiceStatus;
    responseMessage?: string;
    resolvedBy?: string;
    destinationSchoolId?: string;
    destinationSchoolName?: string;
    details?: Partial<QuickServiceRequest['details']>;
  }
): Promise<{ success: boolean; request?: QuickServiceRequest; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const list = getCachedQuickRequests();
    const existingItem = list.find((r) => r.id === id);

    const mergedDetails: QuickServiceRequest['details'] = {
      ...(existingItem?.details || {}),
      ...(updates.details || {}),
      ...(updates.responseMessage !== undefined ? { responseMessage: updates.responseMessage } : {}),
      ...(updates.resolvedBy !== undefined
        ? { resolvedBy: updates.resolvedBy, resolvedAt: nowIso }
        : {}),
    };

    const firestorePayload: Partial<QuickServiceRequest> = {
      ...(updates.status ? { status: updates.status } : {}),
      ...(updates.destinationSchoolId ? { destinationSchoolId: updates.destinationSchoolId } : {}),
      ...(updates.destinationSchoolName ? { destinationSchoolName: updates.destinationSchoolName } : {}),
      details: mergedDetails,
      updatedAt: nowIso,
    };

    // 1. Update in Firestore Cloud
    await updateQuickRequestInFirestore(id, firestorePayload);

    // 2. Update via server endpoint (only if Express API is available)
    if (isExpressApiAvailable()) {
      try {
        await fetch(`/api/quick-requests/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...updates,
            details: mergedDetails,
          }),
        });
      } catch {}
    }

    // 3. Update local cache
    let updatedObj: QuickServiceRequest | undefined;
    const idx = list.findIndex((r) => r.id === id);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        ...firestorePayload,
        details: {
          ...(list[idx].details || {}),
          ...mergedDetails,
        },
      };
      updatedObj = list[idx];
      writeQuickCacheQuietly(list);
      lastQuickRequestsFetchAt = Date.now();
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sigre_quick_request_updated', { detail: updatedObj || { id, ...firestorePayload } })
      );
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }

    return { success: true, request: updatedObj };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao atualizar pedido.' };
  }
}

export async function updateSubmittedQuickServiceRequest(
  id: string,
  payload: {
    title?: string;
    requesterName?: string;
    requesterPhone?: string;
    requesterEmail?: string;
    requesterRoleTitle?: string;
    targetRole?: 'DIRECTOR' | 'ADMIN';
    targetSchoolId?: string;
    targetSchoolName?: string;
    destinationSchoolId?: string;
    destinationSchoolName?: string;
    status?: QuickServiceStatus;
    details: QuickServiceRequest['details'];
  }
): Promise<{ success: boolean; request?: QuickServiceRequest; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const list = getCachedQuickRequests();
    const existingItem = list.find((r) => r.id === id);

    const nextStatus: QuickServiceStatus =
      payload.status ||
      (existingItem?.status === 'REJEITADO' || existingItem?.status === 'SEM_VAGA_DESTINO'
        ? 'PENDENTE'
        : existingItem?.status || 'PENDENTE');

    const mergedDetails: QuickServiceRequest['details'] = {
      ...(existingItem?.details || {}),
      ...(payload.details || {}),
      lastEditedByRequesterAt: nowIso,
    };

    const firestorePayload: Partial<QuickServiceRequest> = {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.requesterName !== undefined ? { requesterName: payload.requesterName } : {}),
      ...(payload.requesterPhone !== undefined ? { requesterPhone: payload.requesterPhone } : {}),
      ...(payload.requesterEmail !== undefined ? { requesterEmail: payload.requesterEmail } : {}),
      ...(payload.requesterRoleTitle !== undefined ? { requesterRoleTitle: payload.requesterRoleTitle } : {}),
      ...(payload.targetRole !== undefined ? { targetRole: payload.targetRole } : {}),
      ...(payload.targetSchoolId !== undefined ? { targetSchoolId: payload.targetSchoolId } : {}),
      ...(payload.targetSchoolName !== undefined ? { targetSchoolName: payload.targetSchoolName } : {}),
      ...(payload.destinationSchoolId !== undefined
        ? { destinationSchoolId: payload.destinationSchoolId }
        : {}),
      ...(payload.destinationSchoolName !== undefined
        ? { destinationSchoolName: payload.destinationSchoolName }
        : {}),
      status: nextStatus,
      details: mergedDetails,
      updatedAt: nowIso,
    };

    await updateQuickRequestInFirestore(id, firestorePayload);

    if (isExpressApiAvailable()) {
      try {
        await fetch(`/api/quick-requests/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(firestorePayload),
        });
      } catch {}
    }

    let updatedObj: QuickServiceRequest | undefined;
    const idx = list.findIndex((r) => r.id === id);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        ...firestorePayload,
        details: mergedDetails,
      };
      updatedObj = list[idx];
      writeQuickCacheQuietly(list);
      lastQuickRequestsFetchAt = Date.now();
    } else if (existingItem) {
      updatedObj = {
        ...existingItem,
        ...firestorePayload,
        details: mergedDetails,
      };
    }

    if (typeof window !== 'undefined' && updatedObj) {
      window.dispatchEvent(new CustomEvent('sigre_quick_request_updated', { detail: updatedObj }));
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }

    return { success: true, request: updatedObj };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao alterar pedido submetido.' };
  }
}

export async function cancelQuickServiceRequest(
  id: string,
  reason?: string
): Promise<{ success: boolean; request?: QuickServiceRequest; error?: string }> {
  const nowIso = new Date().toISOString();
  const cleanReason =
    (reason || '').trim() || 'Pedido cancelado pelo requerente antes da emissão final.';
  return updateQuickRequestStatus(id, {
    status: 'CANCELADO',
    responseMessage: cleanReason,
    details: {
      cancelledAt: nowIso,
      cancelledByRequester: true,
      cancelReason: cleanReason,
    },
  });
}

export async function deleteQuickRequest(id: string): Promise<boolean> {
  try {
    // Delete from Firestore Cloud
    await deleteQuickRequestFromFirestore(id);

    // Call server DELETE (only if Express API is available)
    if (isExpressApiAvailable()) {
      try {
        await fetch(`/api/quick-requests/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      } catch {}
    }

    // Update local cache
    const list = getCachedQuickRequests();
    const filtered = list.filter((r) => r.id !== id);
    writeQuickCacheQuietly(filtered);
    lastQuickRequestsFetchAt = Date.now();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigre_quick_request_deleted', { detail: { id } }));
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Zeros / purges all quick requests across cloud and local storage
 */
export async function clearAllQuickRequests(): Promise<{ success: boolean; count: number }> {
  try {
    const cloudCount = await clearAllQuickRequestsFromFirestore();

    // Clear server store (only if Express API is available)
    if (isExpressApiAvailable()) {
      try {
        await fetch('/api/quick-requests/clear-all', { method: 'POST' });
      } catch {}
    }

    // Clear local storage
    writeQuickCacheQuietly([]);
    lastQuickRequestsFetchAt = Date.now();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigre_quick_requests_cleared'));
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }

    return { success: true, count: cloudCount };
  } catch (err) {
    console.error('Erro ao zerar pedidos de serviços rápidos:', err);
    return { success: false, count: 0 };
  }
}

/**
 * Fetches archived/completed quick requests on demand via paginated getDocs (Rule 2).
 */
export async function fetchArchivedQuickRequestsPage(options: {
  status?: QuickServiceStatus | 'TODOS';
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<FirestorePageResult<QuickServiceRequest>> {
  const page = await fetchQuickRequestsByStatusPage({
    status: options.status === 'TODOS' ? undefined : options.status,
    pageSize: options.pageSize ?? PAGINATION_PAGE_SIZE,
    cursor: options.cursor ?? null,
  });

  if (page.items.length > 0) {
    const cached = getCachedQuickRequests();
    const map = new Map<string, QuickServiceRequest>();
    cached.forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });
    page.items.forEach((item) => {
      if (item && item.id) map.set(item.id, { ...(map.get(item.id) || {}), ...item });
    });
    writeQuickCacheQuietly(Array.from(map.values()));
  }

  return page;
}

/**
 * Returns authoritative quick requests counts strictly from stats/dashboard single-doc aggregator (Rule 5).
 */
export async function getQuickRequestsServerCounts(): Promise<{
  total: number;
  pendentes: number;
  concluidos: number;
}> {
  try {
    const stats = await fetchDashboardStats();
    const cached = getCachedQuickRequests();
    if (stats && typeof stats.totalQuickRequests === 'number') {
      return {
        total: stats.totalQuickRequests,
        pendentes: stats.pendingQuickRequests ?? 0,
        concluidos:
          typeof stats.completedQuickRequests === 'number'
            ? stats.completedQuickRequests
            : cached.filter((r) => r.status === 'CONCLUIDO').length,
      };
    }
    return {
      total: cached.length,
      pendentes: cached.filter((r) => r.status === 'PENDENTE').length,
      concluidos: cached.filter((r) => r.status === 'CONCLUIDO').length,
    };
  } catch {
    const cached = getCachedQuickRequests();
    return {
      total: cached.length,
      pendentes: cached.filter((r) => r.status === 'PENDENTE').length,
      concluidos: cached.filter((r) => r.status === 'CONCLUIDO').length,
    };
  }
}

/**
 * Initializes real-time listener strictly for active quick requests (limit 30) and merges
 * cleanly with cached archive entries, guaranteeing clean unsubscribe teardown (Rules 1, 2, 3).
 */
let quickRequestsUnsubscribe: (() => void) | null = null;
export function initRealtimeQuickRequestsSync(
  onUpdate?: (requests: QuickServiceRequest[]) => void
): () => void {
  if (quickRequestsUnsubscribe) {
    return quickRequestsUnsubscribe;
  }

  const fsUnsub = subscribeToQuickRequests((activeCloudList) => {
    try {
      const cached = getCachedQuickRequests();
      const map = new Map<string, QuickServiceRequest>();
      // Retain previously loaded archived requests in local cache
      cached.forEach((item) => {
        if (
          item &&
          item.id &&
          (item.status === 'CONCLUIDO' ||
            item.status === 'REJEITADO' ||
            item.status === 'CANCELADO' ||
            item.status === 'SEM_VAGA_DESTINO')
        ) {
          map.set(item.id, item);
        }
      });
      activeCloudList.forEach((item) => {
        if (item && item.id) {
          map.set(item.id, { ...(map.get(item.id) || {}), ...item });
        }
      });
      const merged = Array.from(map.values());
      const changed = writeQuickCacheQuietly(merged);
      lastQuickRequestsFetchAt = Date.now();
      if (changed && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sigre-data-synced'));
      }
      onUpdate?.(merged);
    } catch (e) {
      console.warn('[QuickServices] Erro no listener em tempo real:', e);
    }
  });

  quickRequestsUnsubscribe = () => {
    try {
      fsUnsub();
    } catch {}
    quickRequestsUnsubscribe = null;
  };

  return quickRequestsUnsubscribe;
}
