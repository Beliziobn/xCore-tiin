import type {
  QuickServiceRequest,
  QuickServiceType,
  QuickServiceStatus,
  QuickServiceGradeItem,
} from '../types';
import { MAX_TURMA_CAPACITY } from '../types';
import {
  saveQuickRequestToFirestore,
  fetchQuickRequestsFromFirestore,
  updateQuickRequestInFirestore,
  deleteQuickRequestFromFirestore,
  clearAllQuickRequestsFromFirestore,
  subscribeToQuickRequests,
} from './firestoreSync';
import { getStoredStudents } from './studentStorage';
import {
  getStudentsForTurma,
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

function schoolsMatch(schoolA?: string | null, schoolB?: string | null): boolean {
  const a = normalizeText(schoolA);
  const b = normalizeText(schoolB);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  // Compare core school numbers if present (e.g. "166", "314", "269")
  const numA = a.match(/\b\d{3,5}\b/)?.[0];
  const numB = b.match(/\b\d{3,5}\b/)?.[0];
  if (numA && numB && numA === numB) return true;
  return false;
}

export interface StudentEnrollmentVerificationResult {
  isEnrolled: boolean;
  studentId?: string;
  matchedName?: string;
  matchedBiOrProcesso?: string;
  codigoMatricula?: string;
  classe?: string;
  turma?: string;
  turno?: string;
  sala?: string;
  reason?: string;
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
  const targetSchool = params.schoolName || '';
  const normClasse = params.studentClasse ? normalizeClasseName(params.studentClasse) : '';
  const normTurma = params.studentTurma ? normalizeTurmaName(params.studentTurma) : '';

  if (!targetName && !targetBi) {
    return {
      isEnrolled: false,
      reason: 'Nome ou número de identificação do aluno não informado no pedido.',
    };
  }

  // 1. Procurar nos estudantes registados em studentStorage
  const storedStudents = getStoredStudents();
  for (const st of storedStudents) {
    const stName = normalizeText(st.nomeCompleto || st.name);
    const stBi = normalizeText(st.numeroDocumento || st.codigoMatricula || st.id);
    const stSchool = st.escola || st.nomeEscola || '';

    const schoolOk = !targetSchool || !stSchool || schoolsMatch(stSchool, targetSchool);
    if (!schoolOk) continue;

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
      stBi &&
      (stBi === targetBi || stBi.includes(targetBi));

    if (nameMatches || biMatches) {
      const resolvedClasse = normalizeClasseName(st.classe || normClasse || '7ª Classe');
      const resolvedTurma = normalizeTurmaName(st.turma || normTurma || 'Turma A');
      return {
        isEnrolled: true,
        studentId: st.id || `st_${stName}`,
        matchedName: st.nomeCompleto || st.name,
        matchedBiOrProcesso: st.numeroDocumento || st.codigoMatricula || params.studentBiOrProcesso || 'Confirmado',
        codigoMatricula: st.codigoMatricula || `MAT-2026/${String(st.id || '001').slice(-3).toUpperCase()}`,
        classe: resolvedClasse,
        turma: resolvedTurma,
        turno: st.turno || st.periodo || (resolvedTurma.includes('B') ? 'Tarde' : 'Manhã'),
        sala: st.sala || (resolvedTurma.includes('B') ? 'Sala 04' : 'Sala 03'),
      };
    }
  }

  // 2. Procurar nas Mini-Pautas submetidas pelos professores da escola
  const miniPautas = getStoredMiniPautas();
  for (const mp of miniPautas) {
    const schoolOk = !targetSchool || !mp.schoolName || schoolsMatch(mp.schoolName, targetSchool);
    if (!schoolOk) continue;

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
          codigoMatricula: row.codigo || `MAT-2026/${String(row.numero).padStart(3, '0')}`,
          classe: normalizeClasseName(mp.classe),
          turma: normalizeTurmaName(mp.turma),
          turno: mp.turno || 'Manhã',
          sala: mp.sala || 'Sala 01',
        };
      }
    }
  }

  // 3. Procurar nas listas de turmas oficiais da escola (turmaStudentsService)
  const classesToCheck = normClasse
    ? [normClasse]
    : ['Iniciação', '1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe', '6ª Classe', '7ª Classe', '8ª Classe', '9ª Classe'];
  const turmasToCheck = normTurma ? [normTurma] : ['Turma A', 'Turma B', 'Turma C', 'Turma D'];

  for (const cl of classesToCheck) {
    for (const tm of turmasToCheck) {
      const roster = getStudentsForTurma({
        schoolName: targetSchool || undefined,
        gradeClass: cl,
        turma: tm,
      });
      for (const st of roster.students) {
        const stName = normalizeText(st.nomeCompleto);
        const stDoc = normalizeText(st.numeroDocumento);
        const stCod = normalizeText(st.codigoMatricula);

        const nameMatches =
          targetName &&
          stName &&
          (stName === targetName ||
            (targetName.length >= 6 && stName.includes(targetName)) ||
            (stName.length >= 6 && targetName.includes(stName)));
        const biMatches =
          targetBi &&
          targetBi !== 'registo escolar' &&
          ((stDoc && stDoc === targetBi) || (stCod && stCod === targetBi));

        if (nameMatches || biMatches) {
          return {
            isEnrolled: true,
            studentId: st.id,
            matchedName: st.nomeCompleto,
            matchedBiOrProcesso: st.numeroDocumento || st.codigoMatricula,
            codigoMatricula: st.codigoMatricula,
            classe: roster.metadata.classe,
            turma: roster.metadata.turma,
            turno: roster.metadata.turno.split(' ')[0] || 'Manhã',
            sala: roster.metadata.sala,
          };
        }
      }
    }
  }

  return {
    isEnrolled: false,
    reason: `O aluno "${params.studentName || 'Não identificado'}" não consta matriculado em nenhuma turma registada na instituição ${targetSchool || 'escolar'}.`,
  };
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
  const map = new Map<string, QuickServiceRequest>();

  // 1. Fetch from Firestore Cloud Database (Multi-device source of truth)
  try {
    const cloudRequests = await fetchQuickRequestsFromFirestore();
    if (Array.isArray(cloudRequests) && cloudRequests.length > 0) {
      cloudRequests.forEach((r) => {
        if (r && r.id) map.set(r.id, r);
      });
    }
  } catch (err) {
    console.warn('[QuickServices] Cloud fetch warning:', err);
  }

  // 2. Fetch from backend API
  try {
    const params = new URLSearchParams();
    if (filters?.schoolId) params.append('schoolId', filters.schoolId);
    if (filters?.targetRole) params.append('targetRole', filters.targetRole);
    if (filters?.protocol) params.append('protocol', filters.protocol);
    if (filters?.phone) params.append('phone', filters.phone);
    if (filters?.id) params.append('id', filters.id);

    const res = await fetch(`/api/quick-requests?${params.toString()}`);
    if (res.ok) {
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

  // Cache in localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}

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
    const res = await fetch('/api/quick-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    let createdRequest: QuickServiceRequest | undefined;

    if (res.ok) {
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
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      const list: QuickServiceRequest[] = cached ? JSON.parse(cached) : [];
      list.unshift(createdRequest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}

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
    let existingItem: QuickServiceRequest | undefined;

    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const list: QuickServiceRequest[] = JSON.parse(cached);
        existingItem = list.find((r) => r.id === id);
      }
    } catch {}

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

    // 2. Update via server endpoint
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

    // 3. Update local cache
    let updatedObj: QuickServiceRequest | undefined;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const list: QuickServiceRequest[] = JSON.parse(cached);
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
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }
      }
    } catch {}

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

export async function deleteQuickRequest(id: string): Promise<boolean> {
  try {
    // Delete from Firestore Cloud
    await deleteQuickRequestFromFirestore(id);

    // Call server DELETE
    try {
      await fetch(`/api/quick-requests/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {}

    // Update local cache
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const list: QuickServiceRequest[] = JSON.parse(cached);
        const filtered = list.filter((r) => r.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch {}

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

    // Clear server store
    try {
      await fetch('/api/quick-requests/clear-all', { method: 'POST' });
    } catch {}

    // Clear local storage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch {}

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
 * Initializes real-time listener for quick requests
 */
let quickRequestsUnsubscribe: (() => void) | null = null;
export function initRealtimeQuickRequestsSync(
  onUpdate?: (requests: QuickServiceRequest[]) => void
): () => void {
  if (quickRequestsUnsubscribe) {
    return quickRequestsUnsubscribe;
  }

  quickRequestsUnsubscribe = subscribeToQuickRequests((list) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sigre-data-synced'));
      }
      onUpdate?.(list);
    } catch (e) {
      console.warn('[QuickServices] Erro no listener em tempo real:', e);
    }
  });

  return quickRequestsUnsubscribe;
}
