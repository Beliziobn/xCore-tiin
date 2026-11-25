import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  increment,
  Unsubscribe,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db, auth, OperationType } from '../firebase';
import type {
  PendingApplication,
  QuickServiceRequest,
  UserAccount,
  AdminSchool,
  AdminTeacher,
  AdminStudent,
  AdminDirector,
  TeacherRegistrationData,
  StudentRegistrationData,
  DirectorRegistrationData,
  DirectorTeacher,
  DirectorStudent,
  DirectorRoom,
  DirectorClass,
  SchoolAnnouncement,
  ChatMessage,
} from '../types';
import { defaultDisciplinasList } from '../data/teacherData';
import { extractFlatRegistrationData, stripNestedRegistrationData } from './svgSanitizer';
import { isExpressApiAvailable } from './apiAvailability';
import {
  areSameCanonicalSchool,
  deduplicateSchoolsCanonical,
  isPlaceholderSchoolName,
  isRetiredDuplicateOrPlaceholderSchoolId,
} from './schoolMatcher';

const APPLICATIONS_COL = 'applications';
const QUICK_REQUESTS_COL = 'quickRequests';
const USERS_COL = 'users';
const SCHOOLS_COL = 'schools';
const DIRECTORS_COL = 'directors';
const DME_STAFF_COL = 'dme_staff';
const STAFF_COL = 'staff';
const TEACHERS_COL = 'teachers';
const STUDENTS_COL = 'students';
const EFECTIVIDADE_COL = 'efectividade';
const DECLARACAO_SERVICO_COL = 'declaracao_servico';
const GRADES_COL = 'grades';
const ATTENDANCE_COL = 'attendance';
const ANNOUNCEMENTS_COL = 'announcements';
const ROOMS_COL = 'rooms';
const CLASSES_COL = 'classes';
const CHAT_MESSAGES_COL = 'chatMessages';
const GUIAS_FERIAS_COL = 'guias_ferias';
const GUIAS_COLOCACAO_COL = 'guias_colocacao';
const FICHAS_AVALIACAO_COL = 'fichas_avaliacao';
const CADASTRO_DOCENTE_COL = 'cadastro_docente';
const AUDIT_LOGS_COL = 'audit_logs';
const TOMBSTONES_COL = 'tombstones';
const STATS_COL = 'stats';
const DASHBOARD_STATS_DOC_ID = 'dashboard';

export const REALTIME_LISTENER_LIMIT = 30;
export const PAGINATION_PAGE_SIZE = 30;
export const ANNOUNCEMENTS_LIMIT = 30;
export const SCHOOLS_LIST_LIMIT = 100;
const ACTIVE_QUICK_REQUEST_STATUSES = [
  'PENDENTE',
  'EM_ANALISE',
  'AGUARDANDO_VAGA_DESTINO',
  'VAGA_CONFIRMADA',
] as const;

const DELETED_ENTITIES_KEY = 'sigre_deleted_entities_tombstones_v1';

const BANNED_ENTITY_IDS = new Set([
  'sch-1790810466749',
  'sch-1792936202845',
  'sige-113013',
  'usr_1790893847062',
  'dir-dossier-usr_1790893847062',
  'dir-dossier-usr_1793568518418',
  'usr_1793568518418',
  'std-1793571845753',
  'std-1793575332234',
  'std-1793568820276',
  'efec-1792754014681-206',
  'efec-1792944193609-356',
  'efec-1792963605316-86',
]);

let firestoreReadCooldownUntil = 0;
let firestoreWriteCooldownUntil = 0;

function notifyFirestoreQuotaStatus(readExhausted: boolean, writeExhausted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent('sigre-firestore-quota-status', {
        detail: { readExhausted, writeExhausted },
      })
    );
  } catch {}
}

export function isFirestoreReadQuotaExhausted(): boolean {
  if (firestoreReadCooldownUntil === 0) return false;
  if (Date.now() >= firestoreReadCooldownUntil) {
    firestoreReadCooldownUntil = 0;
    return false;
  }
  return true;
}

export function isFirestoreWriteQuotaExhausted(): boolean {
  if (firestoreWriteCooldownUntil === 0) return false;
  if (Date.now() >= firestoreWriteCooldownUntil) {
    firestoreWriteCooldownUntil = 0;
    return false;
  }
  return true;
}

export function isFirestoreQuotaExhausted(): boolean {
  return isFirestoreReadQuotaExhausted() || isFirestoreWriteQuotaExhausted();
}

export function markFirestoreQuotaIfExhausted(err: any, operation: 'read' | 'write' = 'read'): void {
  const code = String(err?.code || '').toLowerCase();
  const msg = String(err?.message || err || '').toLowerCase();
  const isQuotaErr =
    code === 'resource-exhausted' ||
    msg.includes('resource-exhausted') ||
    (msg.includes('quota') && !msg.includes('deadline')) ||
    msg.includes('free daily read units') ||
    msg.includes('free daily write units');
  if (!isQuotaErr) return;

  const isReadSpecific =
    msg.includes('read units') ||
    msg.includes('read quota') ||
    (operation === 'read' && !msg.includes('write units'));

  if (isReadSpecific) {
    const wasExhausted = isFirestoreReadQuotaExhausted();
    firestoreReadCooldownUntil = Date.now() + 120_000;
    if (!wasExhausted) {
      notifyFirestoreQuotaStatus(true, isFirestoreWriteQuotaExhausted());
    }
  } else {
    const wasWriteExhausted = isFirestoreWriteQuotaExhausted();
    firestoreWriteCooldownUntil = Date.now() + 60_000;
    if (!wasWriteExhausted) {
      notifyFirestoreQuotaStatus(isFirestoreReadQuotaExhausted(), true);
    }
  }
}

function logFirestorePermissionOrQuotaError(
  err: unknown,
  operationType: OperationType,
  path: string
): void {
  markFirestoreQuotaIfExhausted(err, operationType === OperationType.WRITE || operationType === OperationType.CREATE || operationType === OperationType.UPDATE || operationType === OperationType.DELETE ? 'write' : 'read');
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.toLowerCase().includes('missing or insufficient permissions') || msg.toLowerCase().includes('permission-denied')) {
    const errInfo = {
      error: msg,
      operationType,
      path,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
      },
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
}

function resolveNowTimestamp(existingTs?: any): { nowTs: number; nowIso: string } {
  const numeric = typeof existingTs === 'number' && Number.isFinite(existingTs) && existingTs > 1_000_000_000_000
    ? existingTs
    : Date.now();
  return {
    nowTs: numeric,
    nowIso: new Date(numeric).toISOString(),
  };
}

// ============================================================================
// 0. DASHBOARD STATS AGGREGATOR (stats/dashboard) & SERVER COUNTING
// Eliminates full-collection .length / .size client counts (Rule 4)
// ============================================================================

export interface DashboardStats {
  totalSchools: number;
  totalTeachers: number;
  totalStudents: number;
  totalDirectors: number;
  totalStaff: number;
  totalUsers: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalQuickRequests: number;
  pendingQuickRequests: number;
  completedQuickRequests?: number;
  totalEfectividade: number;
  totalDeclaracaoServico: number;
  updatedAt?: string;
}

export async function fetchDashboardStats(): Promise<DashboardStats | null> {
  if (isFirestoreReadQuotaExhausted()) return null;
  try {
    const snap = await getDoc(doc(db, STATS_COL, DASHBOARD_STATS_DOC_ID));
    if (snap.exists()) {
      return snap.data() as DashboardStats;
    }
    return null;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.GET, `${STATS_COL}/${DASHBOARD_STATS_DOC_ID}`);
    return null;
  }
}

export function subscribeToDashboardStats(
  onUpdate: (stats: DashboardStats) => void
): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      doc(db, STATS_COL, DASHBOARD_STATS_DOC_ID),
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as DashboardStats);
        }
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.GET, `${STATS_COL}/${DASHBOARD_STATS_DOC_ID}`);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

export async function incrementDashboardStats(
  deltas: Partial<Record<Exclude<keyof DashboardStats, 'updatedAt'>, number>>
): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    let hasNonZero = false;
    for (const [k, v] of Object.entries(deltas)) {
      if (typeof v === 'number' && v !== 0) {
        updatePayload[k] = increment(v);
        hasNonZero = true;
      }
    }
    if (!hasNonZero) return;
    await setDoc(doc(db, STATS_COL, DASHBOARD_STATS_DOC_ID), updatePayload, { merge: true });
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.UPDATE, `${STATS_COL}/${DASHBOARD_STATS_DOC_ID}`);
  }
}

export async function fetchCollectionCount(
  colName: string,
  filters?: Array<{ field: string; op?: '==' | 'in'; value: any }>
): Promise<number> {
  if (isFirestoreReadQuotaExhausted()) return 0;
  try {
    const constraints: QueryConstraint[] = [];
    if (filters && filters.length > 0) {
      filters.forEach((f) => constraints.push(where(f.field, f.op || '==', f.value)));
    }
    const q = constraints.length > 0 ? query(collection(db, colName), ...constraints) : collection(db, colName);
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, colName);
    return 0;
  }
}

export async function refreshDashboardStatsFromServerCounts(): Promise<DashboardStats | null> {
  if (isFirestoreReadQuotaExhausted()) return null;
  try {
    const [
      totalSchools,
      totalTeachers,
      totalStudents,
      totalDirectors,
      totalStaff,
      totalUsers,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalQuickRequests,
      pendingQuickRequests,
      totalEfectividade,
      totalDeclaracaoServico,
    ] = await Promise.all([
      fetchCollectionCount(SCHOOLS_COL),
      fetchCollectionCount(TEACHERS_COL),
      fetchCollectionCount(STUDENTS_COL),
      fetchCollectionCount(DIRECTORS_COL),
      fetchCollectionCount(STAFF_COL),
      fetchCollectionCount(USERS_COL),
      fetchCollectionCount(APPLICATIONS_COL),
      fetchCollectionCount(APPLICATIONS_COL, [{ field: 'status', value: 'pendente' }]),
      fetchCollectionCount(APPLICATIONS_COL, [{ field: 'status', value: 'aprovado' }]),
      fetchCollectionCount(APPLICATIONS_COL, [{ field: 'status', value: 'rejeitado' }]),
      fetchCollectionCount(QUICK_REQUESTS_COL),
      fetchCollectionCount(QUICK_REQUESTS_COL, [
        { field: 'status', op: 'in', value: [...ACTIVE_QUICK_REQUEST_STATUSES] },
      ]),
      fetchCollectionCount(EFECTIVIDADE_COL),
      fetchCollectionCount(DECLARACAO_SERVICO_COL),
    ]);

    const payload: DashboardStats = {
      totalSchools,
      totalTeachers,
      totalStudents,
      totalDirectors,
      totalStaff,
      totalUsers,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalQuickRequests,
      pendingQuickRequests,
      totalEfectividade,
      totalDeclaracaoServico,
      updatedAt: new Date().toISOString(),
    };

    if (!isFirestoreWriteQuotaExhausted()) {
      await setDoc(doc(db, STATS_COL, DASHBOARD_STATS_DOC_ID), payload, { merge: true }).catch(() => {});
    }
    return payload;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.GET, `${STATS_COL}/${DASHBOARD_STATS_DOC_ID}`);
    return null;
  }
}

export interface FirestorePageResult<T> {
  items: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  ok: boolean;
  quotaExhausted: boolean;
}

export async function fetchCollectionPage<T = any>(
  colName: string,
  options?: {
    pageSize?: number;
    cursor?: QueryDocumentSnapshot<DocumentData> | null;
    constraints?: QueryConstraint[];
    orderField?: string;
    orderDirection?: 'asc' | 'desc';
  }
): Promise<FirestorePageResult<T>> {
  if (isFirestoreReadQuotaExhausted()) {
    return { items: [], lastDoc: null, hasMore: false, ok: false, quotaExhausted: true };
  }
  const maxLimitForCollection =
    colName === SCHOOLS_COL
      ? SCHOOLS_LIST_LIMIT
      : colName === ANNOUNCEMENTS_COL
      ? ANNOUNCEMENTS_LIMIT
      : 50;
  const maxPageSize = Math.max(1, maxLimitForCollection - 1);
  const pageSize = Math.min(Math.max(options?.pageSize ?? PAGINATION_PAGE_SIZE, 1), maxPageSize);
  const orderField = options?.orderField || 'updatedAt';
  const orderDirection = options?.orderDirection || 'desc';
  try {
    const queryParts: QueryConstraint[] = [
      ...(options?.constraints || []),
      orderBy(orderField, orderDirection),
      ...(options?.cursor ? [startAfter(options.cursor)] : []),
      limit(pageSize + 1),
    ];
    const snap = await getDocs(query(collection(db, colName), ...queryParts));
    const hasMore = snap.docs.length > pageSize;
    const docs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;
    const items = docs.map((d) => d.data() as T);
    const lastDoc = docs.length > 0 ? docs[docs.length - 1] : null;
    return { items, lastDoc, hasMore, ok: true, quotaExhausted: false };
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, colName);
    return {
      items: [],
      lastDoc: null,
      hasMore: false,
      ok: false,
      quotaExhausted: isFirestoreReadQuotaExhausted(),
    };
  }
}

export function isBannedSchoolOrEntity(item: any): boolean {
  if (!item) return false;
  if (typeof item === 'string') {
    const s = item.trim().toLowerCase();
    if (!s) return false;
    if (BANNED_ENTITY_IDS.has(s)) return true;
    return (
      s.includes('modelo central') ||
      s.includes('só ciência da educação') ||
      s.includes('so ciencia da educacao') ||
      s === 'só da educação' ||
      s === 'so da educacao' ||
      s.includes('sige-113013')
    );
  }
  const id = String(item.id || item.userId || '').trim().toLowerCase();
  if (id && BANNED_ENTITY_IDS.has(id)) return true;

  const fieldsToCheck = [
    item.id,
    item.userId,
    item.schoolId,
    item.escolaId,
    item.codigoSIGE,
    item.codigoEscola,
    item.name,
    item.nomeOficial,
    item.nomeCompleto,
    item.nome,
    item.schoolName,
    item.nomeEscola,
    item.escola,
    item.sector,
    item.unidadeOrganica,
    item.escolaDestino,
    item.registrationData?.id,
    item.registrationData?.schoolId,
    item.registrationData?.escolaId,
    item.registrationData?.nomeOficial,
    item.registrationData?.nomeEscola,
    item.registrationData?.escola,
    item.registrationData?.codigoSIGE,
  ];

  for (const val of fieldsToCheck) {
    if (typeof val === 'string' && val.trim() && isBannedSchoolOrEntity(val)) {
      return true;
    }
  }
  return false;
}

export function sanitizeDocId(rawId: string | undefined | null): string {
  if (!rawId) return '';
  return String(rawId)
    .trim()
    .replace(/[\/\\.#$[\]]/g, '_')
    .slice(0, 120);
}

// Recursively remove undefined values from objects and arrays for safe Firestore serialization
export function cleanObject<T>(val: T): T {
  if (val === undefined) {
    return null as unknown as T;
  }
  if (val === null || typeof val !== 'object' || val instanceof Date) {
    return val;
  }
  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== undefined)
      .map((item) => cleanObject(item)) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const [key, itemVal] of Object.entries(val as Record<string, any>)) {
    if (itemVal !== undefined) {
      result[key] = cleanObject(itemVal);
    }
  }
  return result as T;
}

// Tombstone registry to prevent deleted items from resurrecting during bidirectional sync
export function getEntityTombstones(): Set<string> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_ENTITIES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(
      (Array.isArray(parsed) ? parsed : []).filter(
        (k: any) => typeof k === 'string' && !k.toLowerCase().includes('socienciadaeduca2018')
      )
    );
  } catch {
    return new Set();
  }
}

export function addEntityTombstone(col: string, id: string, skipRemotePropagation: boolean = false): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || !id) return;
  try {
    const rawClean = String(id).trim().toLowerCase();
    if (!rawClean || rawClean.includes('socienciadaeduca2018')) return;
    const cleanId = sanitizeDocId(id).toLowerCase();
    if (!cleanId) return;
    const tombKey = `${col}::${cleanId}`;
    const set = getEntityTombstones();
    const isNew = !set.has(tombKey);
    set.add(tombKey);
    set.add(`${col}:${rawClean}`);
    localStorage.setItem(DELETED_ENTITIES_KEY, JSON.stringify(Array.from(set)));

    if (!skipRemotePropagation) {
      if (!isFirestoreWriteQuotaExhausted()) {
        const tombDocId = sanitizeDocId(tombKey);
        if (tombDocId) {
          const { nowTs, nowIso } = resolveNowTimestamp();
          setDoc(
            doc(db, TOMBSTONES_COL, tombDocId),
            { key: tombKey, col, id: cleanId, deletedAt: nowIso, updatedAt: nowIso, _updatedAt: nowTs },
            { merge: true }
          ).catch((e) => markFirestoreQuotaIfExhausted(e, 'write'));
        }
      }
      if (isExpressApiAvailable()) {
        fetch(`/api/network/entity/${encodeURIComponent(col)}/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        }).catch(() => {});
      }
    }
  } catch {}
}

export function removeEntityTombstone(col: string, id: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || !id) return;
  try {
    const set = getEntityTombstones();
    const rawClean = String(id).trim().toLowerCase();
    const cleanId = sanitizeDocId(id).toLowerCase();
    const keysToDelete = [
      `${col}::${cleanId}`,
      `${col}:${cleanId}`,
      `${col}::${rawClean}`,
      `${col}:${rawClean}`,
      cleanId,
      rawClean,
    ];
    let removed = false;
    keysToDelete.forEach((k) => {
      if (set.has(k)) {
        set.delete(k);
        removed = true;
      }
    });
    if (removed) {
      localStorage.setItem(DELETED_ENTITIES_KEY, JSON.stringify(Array.from(set)));
    }
    if (!isFirestoreWriteQuotaExhausted()) {
      const candidateDocIds = new Set(
        [sanitizeDocId(`${col}::${cleanId}`), sanitizeDocId(`${col}:${rawClean}`)].filter(Boolean)
      );
      candidateDocIds.forEach((tombDocId) => {
        deleteDoc(doc(db, TOMBSTONES_COL, tombDocId)).catch((e) => markFirestoreQuotaIfExhausted(e, 'write'));
      });
    }
  } catch {}
}

export function isEntityTombstoned(col: string, id: string): boolean {
  if (!id) return false;
  if (isBannedSchoolOrEntity(id)) return true;
  const set = getEntityTombstones();
  const rawClean = String(id).trim().toLowerCase();
  const cleanId = sanitizeDocId(id).toLowerCase();
  return (
    set.has(`${col}::${cleanId}`) ||
    set.has(`${col}:${cleanId}`) ||
    set.has(`${col}::${rawClean}`) ||
    set.has(`${col}:${rawClean}`) ||
    set.has(`*::${cleanId}`) ||
    set.has(`*:${rawClean}`) ||
    set.has(rawClean)
  );
}

// ============================================================================
// 1. APPLICATIONS (HOMOLOGAÇÕES) - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveApplicationToFirestore(app: PendingApplication): Promise<boolean> {
  if (isFirestoreWriteQuotaExhausted()) return false;
  try {
    const docId = sanitizeDocId(app.id || app.userId);
    if (!docId) return false;

    const normBi = typeof app.biNumber === 'string' ? app.biNumber.trim().replace(/\s+/g, '').toUpperCase() : '';
    const cleanEmail = typeof app.email === 'string' ? app.email.trim().slice(0, 180) : '';

    // Clear any tombstones across applications, users, and target role collection
    const roleCol =
      app.type === 'diretor' || app.schoolRole === 'diretor_geral'
        ? DIRECTORS_COL
        : app.type === 'membro_dme' || app.scope === 'administracao'
        ? DME_STAFF_COL
        : app.type === 'funcionario'
        ? STAFF_COL
        : TEACHERS_COL;
    [app.id, app.userId, cleanEmail, normBi, docId].forEach((ident) => {
      if (ident) {
        removeEntityTombstone(APPLICATIONS_COL, ident);
        removeEntityTombstone(USERS_COL, ident);
        removeEntityTombstone(roleCol, ident);
      }
    });

    const isApproved = app.status === 'aprovado' || Boolean(app.approvedAt);
    const safeStatus: 'pendente' | 'aprovado' | 'rejeitado' = isApproved
      ? 'aprovado'
      : app.status === 'rejeitado'
      ? 'rejeitado'
      : 'pendente';

    const { nowTs, nowIso } = resolveNowTimestamp();
    const rawPayload: Record<string, any> = {
      ...app,
      id: app.id || docId,
      ...(normBi ? { biNumber: normBi } : {}),
      targetApproverRole: 'admin',
      targetApproverEmail: 'dmedoquessua@gmail.com',
      approverDirectorName: 'Director Municipal da Educação (dmedoquessua@gmail.com)',
      status: safeStatus,
      updatedAt: nowIso,
      _updatedAt: nowTs,
    };
    if (cleanEmail) {
      rawPayload.email = cleanEmail;
    } else {
      delete rawPayload.email;
    }
    // Strip top-level null values so Firestore rules (e.g. email is string) never reject null fields
    Object.keys(rawPayload).forEach((k) => {
      if (rawPayload[k] === null || rawPayload[k] === undefined) {
        delete rawPayload[k];
      }
    });

    const ref = doc(db, APPLICATIONS_COL, docId);
    let prevStatus: string | null = null;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const existingSnap = await getDoc(ref);
        if (existingSnap.exists()) {
          prevStatus = String(existingSnap.data()?.status || 'pendente');
        }
      } catch {}
    }

    await setDoc(ref, cleanObject(rawPayload), { merge: true });

    // Keep stats/dashboard atomically synchronized without client full-collection counts
    if (prevStatus === null) {
      incrementDashboardStats({
        totalApplications: 1,
        ...(safeStatus === 'pendente'
          ? { pendingApplications: 1 }
          : safeStatus === 'aprovado'
          ? { approvedApplications: 1 }
          : { rejectedApplications: 1 }),
      }).catch(() => {});
    } else if (prevStatus !== safeStatus) {
      incrementDashboardStats({
        ...(prevStatus === 'pendente'
          ? { pendingApplications: -1 }
          : prevStatus === 'aprovado'
          ? { approvedApplications: -1 }
          : prevStatus === 'rejeitado'
          ? { rejectedApplications: -1 }
          : {}),
        ...(safeStatus === 'pendente'
          ? { pendingApplications: 1 }
          : safeStatus === 'aprovado'
          ? { approvedApplications: 1 }
          : { rejectedApplications: 1 }),
      }).catch(() => {});
    }
    return true;
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, APPLICATIONS_COL);
    console.warn('[Firestore] Erro ao gravar candidatura no Firestore:', error);
    return false;
  }
}

export interface FirestoreApplicationsFetchResult {
  apps: PendingApplication[];
  ok: boolean;
  quotaExhausted: boolean;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
  hasMore?: boolean;
}

/**
 * Paginated on-demand query via getDocs (Rule 2: archived/completed states fetched on demand, never onSnapshot).
 */
export async function fetchApplicationsByStatusPage(options?: {
  status?: 'pendente' | 'aprovado' | 'rejeitado' | 'todos';
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<FirestorePageResult<PendingApplication>> {
  const status = options?.status || 'pendente';
  const constraints: QueryConstraint[] =
    status !== 'todos' ? [where('status', '==', status)] : [];
  return fetchCollectionPage<PendingApplication>(APPLICATIONS_COL, {
    pageSize: options?.pageSize ?? PAGINATION_PAGE_SIZE,
    cursor: options?.cursor ?? null,
    constraints,
    orderField: 'updatedAt',
    orderDirection: 'desc',
  });
}

export async function fetchApplicationsFromFirestoreWithStatus(
  statusFilter: 'pendente' | 'aprovado' | 'rejeitado' | 'todos' = 'pendente',
  pageSize: number = REALTIME_LISTENER_LIMIT
): Promise<FirestoreApplicationsFetchResult> {
  if (isFirestoreReadQuotaExhausted()) {
    return { apps: [], ok: false, quotaExhausted: true };
  }
  try {
    const res = await Promise.race([
      fetchApplicationsByStatusPage({ status: statusFilter, pageSize }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore read timeout')), 5500)),
    ]);
    if (res.ok && firestoreReadCooldownUntil !== 0) {
      firestoreReadCooldownUntil = 0;
      notifyFirestoreQuotaStatus(false, isFirestoreWriteQuotaExhausted());
    }
    return {
      apps: res.items,
      ok: res.ok,
      quotaExhausted: res.quotaExhausted,
      lastDoc: res.lastDoc,
      hasMore: res.hasMore,
    };
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.LIST, APPLICATIONS_COL);
    return { apps: [], ok: false, quotaExhausted: isFirestoreReadQuotaExhausted() };
  }
}

export async function fetchApplicationsFromFirestore(): Promise<PendingApplication[]> {
  const res = await fetchApplicationsFromFirestoreWithStatus('pendente', REALTIME_LISTENER_LIMIT);
  return res.apps;
}

export async function updateApplicationInFirestore(
  appId: string,
  updates: Partial<PendingApplication>
): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const docId = sanitizeDocId(appId);
    if (!docId) return;
    const ref = doc(db, APPLICATIONS_COL, docId);
    const { nowTs, nowIso } = resolveNowTimestamp();
    let prevStatus: string | null = null;
    if (updates.status && !isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) prevStatus = String(snap.data()?.status || 'pendente');
      } catch {}
    }
    await setDoc(
      ref,
      cleanObject({ ...updates, updatedAt: nowIso, _updatedAt: nowTs }),
      { merge: true }
    );
    if (updates.status && prevStatus !== null && prevStatus !== updates.status) {
      const nextStatus = updates.status;
      incrementDashboardStats({
        ...(prevStatus === 'pendente'
          ? { pendingApplications: -1 }
          : prevStatus === 'aprovado'
          ? { approvedApplications: -1 }
          : prevStatus === 'rejeitado'
          ? { rejectedApplications: -1 }
          : {}),
        ...(nextStatus === 'pendente'
          ? { pendingApplications: 1 }
          : nextStatus === 'aprovado'
          ? { approvedApplications: 1 }
          : nextStatus === 'rejeitado'
          ? { rejectedApplications: 1 }
          : {}),
      }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.UPDATE, APPLICATIONS_COL);
  }
}

export async function deleteApplicationFromFirestore(appId: string): Promise<void> {
  try {
    const docId = sanitizeDocId(appId);
    if (!docId) return;
    addEntityTombstone(APPLICATIONS_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    const ref = doc(db, APPLICATIONS_COL, docId);
    let prevStatus: string | null = null;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) prevStatus = String(snap.data()?.status || 'pendente');
      } catch {}
    }
    await deleteDoc(ref);
    if (prevStatus !== null) {
      incrementDashboardStats({
        totalApplications: -1,
        ...(prevStatus === 'pendente'
          ? { pendingApplications: -1 }
          : prevStatus === 'aprovado'
          ? { approvedApplications: -1 }
          : prevStatus === 'rejeitado'
          ? { rejectedApplications: -1 }
          : {}),
      }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, APPLICATIONS_COL);
  }
}

export async function clearApprovedApplicationsFromFirestore(): Promise<number> {
  if (isFirestoreReadQuotaExhausted() || isFirestoreWriteQuotaExhausted()) return 0;
  try {
    let totalDeleted = 0;
    while (true) {
      const q = query(
        collection(db, APPLICATIONS_COL),
        where('status', '==', 'aprovado'),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) break;
      const batch = writeBatch(db);
      snapshot.forEach((d) => {
        addEntityTombstone(APPLICATIONS_COL, d.id);
        batch.delete(d.ref);
        totalDeleted++;
      });
      await batch.commit();
      if (snapshot.size < 50) break;
    }
    if (totalDeleted > 0) {
      incrementDashboardStats({
        totalApplications: -totalDeleted,
        approvedApplications: -totalDeleted,
      }).catch(() => {});
    }
    return totalDeleted;
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, APPLICATIONS_COL);
    return 0;
  }
}

/**
 * Rule 1 & Rule 2: Operational work-queue listener strictly bounded to
 * active/pending items, ordered by updatedAt desc, limited to 30 records.
 */
export function subscribeToApplications(
  onUpdate: (apps: PendingApplication[]) => void
): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, APPLICATIONS_COL),
      where('status', '==', 'pendente'),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        if (firestoreReadCooldownUntil !== 0) {
          firestoreReadCooldownUntil = 0;
          notifyFirestoreQuotaStatus(false, isFirestoreWriteQuotaExhausted());
        }
        const apps: PendingApplication[] = [];
        snapshot.forEach((docSnap) => {
          apps.push(docSnap.data() as PendingApplication);
        });
        onUpdate(apps);
      },
      (error) => {
        logFirestorePermissionOrQuotaError(error, OperationType.LIST, APPLICATIONS_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// ============================================================================
// 2. QUICK REQUESTS (SERVIÇOS RÁPIDOS) - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveQuickRequestToFirestore(request: QuickServiceRequest): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const docId = sanitizeDocId(request.id);
    if (!docId) return;
    removeEntityTombstone(QUICK_REQUESTS_COL, docId);
    const ref = doc(db, QUICK_REQUESTS_COL, docId);
    const { nowTs, nowIso } = resolveNowTimestamp();
    let prevStatus: string | null = null;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) prevStatus = String(snap.data()?.status || '');
      } catch {}
    }
    await setDoc(
      ref,
      cleanObject({ ...request, updatedAt: nowIso, _updatedAt: nowTs }),
      { merge: true }
    );
    const isNowActive = ACTIVE_QUICK_REQUEST_STATUSES.includes(request.status as any);
    const isNowCompleted = request.status === 'CONCLUIDO';
    if (prevStatus === null) {
      incrementDashboardStats({
        totalQuickRequests: 1,
        ...(isNowActive ? { pendingQuickRequests: 1 } : {}),
        ...(isNowCompleted ? { completedQuickRequests: 1 } : {}),
      }).catch(() => {});
    } else if (prevStatus !== request.status) {
      const wasActive = ACTIVE_QUICK_REQUEST_STATUSES.includes(prevStatus as any);
      const wasCompleted = prevStatus === 'CONCLUIDO';
      const deltas: Partial<Record<Exclude<keyof DashboardStats, 'updatedAt'>, number>> = {};
      if (wasActive !== isNowActive) {
        deltas.pendingQuickRequests = isNowActive ? 1 : -1;
      }
      if (wasCompleted !== isNowCompleted) {
        deltas.completedQuickRequests = isNowCompleted ? 1 : -1;
      }
      if (Object.keys(deltas).length > 0) {
        incrementDashboardStats(deltas).catch(() => {});
      }
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, QUICK_REQUESTS_COL);
  }
}

export async function fetchQuickRequestsByStatusPage(options?: {
  status?: string;
  statuses?: string[];
  schoolId?: string;
  protocol?: string;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<FirestorePageResult<QuickServiceRequest>> {
  const constraints: QueryConstraint[] = [];
  if (options?.protocol) {
    constraints.push(where('protocol', '==', options.protocol.toUpperCase()));
  } else if (options?.statuses && options.statuses.length > 0) {
    constraints.push(where('status', 'in', options.statuses));
  } else if (options?.status && options.status !== 'TODOS') {
    constraints.push(where('status', '==', options.status));
  }
  if (options?.schoolId) {
    constraints.push(where('targetSchoolId', '==', options.schoolId));
  }
  return fetchCollectionPage<QuickServiceRequest>(QUICK_REQUESTS_COL, {
    pageSize: options?.pageSize ?? PAGINATION_PAGE_SIZE,
    cursor: options?.cursor ?? null,
    constraints,
    orderField: 'updatedAt',
    orderDirection: 'desc',
  });
}

export async function fetchQuickRequestsFromFirestore(options?: {
  includeArchived?: boolean;
  status?: string;
  protocol?: string;
  limitCount?: number;
}): Promise<QuickServiceRequest[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const res = await fetchQuickRequestsByStatusPage({
      protocol: options?.protocol,
      status: options?.status,
      statuses: !options?.includeArchived && !options?.status && !options?.protocol
        ? [...ACTIVE_QUICK_REQUEST_STATUSES]
        : undefined,
      pageSize: options?.limitCount ?? REALTIME_LISTENER_LIMIT,
    });
    return res.items;
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.LIST, QUICK_REQUESTS_COL);
    return [];
  }
}

export async function updateQuickRequestInFirestore(
  id: string,
  updates: Partial<QuickServiceRequest>
): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    const ref = doc(db, QUICK_REQUESTS_COL, docId);
    const { nowTs, nowIso } = resolveNowTimestamp();
    let prevStatus: string | null = null;
    if (updates.status && !isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) prevStatus = String(snap.data()?.status || '');
      } catch {}
    }
    await setDoc(
      ref,
      cleanObject({ ...updates, updatedAt: nowIso, _updatedAt: nowTs }),
      { merge: true }
    );
    if (updates.status && prevStatus !== null && prevStatus !== updates.status) {
      const wasActive = ACTIVE_QUICK_REQUEST_STATUSES.includes(prevStatus as any);
      const isNowActive = ACTIVE_QUICK_REQUEST_STATUSES.includes(updates.status as any);
      const wasCompleted = prevStatus === 'CONCLUIDO';
      const isNowCompleted = updates.status === 'CONCLUIDO';
      const deltas: Partial<Record<Exclude<keyof DashboardStats, 'updatedAt'>, number>> = {};
      if (wasActive !== isNowActive) {
        deltas.pendingQuickRequests = isNowActive ? 1 : -1;
      }
      if (wasCompleted !== isNowCompleted) {
        deltas.completedQuickRequests = isNowCompleted ? 1 : -1;
      }
      if (Object.keys(deltas).length > 0) {
        incrementDashboardStats(deltas).catch(() => {});
      }
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.UPDATE, QUICK_REQUESTS_COL);
  }
}

export async function deleteQuickRequestFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(QUICK_REQUESTS_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    const ref = doc(db, QUICK_REQUESTS_COL, docId);
    let wasActive = false;
    let wasCompleted = false;
    let existed = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          existed = true;
          const st = snap.data()?.status;
          wasActive = ACTIVE_QUICK_REQUEST_STATUSES.includes(st);
          wasCompleted = st === 'CONCLUIDO';
        }
      } catch {}
    }
    await deleteDoc(ref);
    if (existed) {
      incrementDashboardStats({
        totalQuickRequests: -1,
        ...(wasActive ? { pendingQuickRequests: -1 } : {}),
        ...(wasCompleted ? { completedQuickRequests: -1 } : {}),
      }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, QUICK_REQUESTS_COL);
  }
}

export async function clearAllQuickRequestsFromFirestore(): Promise<number> {
  if (isFirestoreReadQuotaExhausted() || isFirestoreWriteQuotaExhausted()) return 0;
  try {
    let totalDeleted = 0;
    let deletedActive = 0;
    let deletedCompleted = 0;
    while (true) {
      const snapshot = await getDocs(
        query(collection(db, QUICK_REQUESTS_COL), orderBy('updatedAt', 'desc'), limit(50))
      );
      if (snapshot.empty) break;
      const batch = writeBatch(db);
      snapshot.forEach((d) => {
        const st = d.data()?.status;
        if (ACTIVE_QUICK_REQUEST_STATUSES.includes(st)) deletedActive++;
        if (st === 'CONCLUIDO') deletedCompleted++;
        addEntityTombstone(QUICK_REQUESTS_COL, d.id);
        batch.delete(d.ref);
        totalDeleted++;
      });
      await batch.commit();
      if (snapshot.size < 50) break;
    }
    if (totalDeleted > 0) {
      incrementDashboardStats({
        totalQuickRequests: -totalDeleted,
        ...(deletedActive > 0 ? { pendingQuickRequests: -deletedActive } : {}),
        ...(deletedCompleted > 0 ? { completedQuickRequests: -deletedCompleted } : {}),
      }).catch(() => {});
    }
    return totalDeleted;
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, QUICK_REQUESTS_COL);
    return 0;
  }
}

/**
 * Rule 1 & Rule 2: Listen strictly to active/pending quick requests (max 30),
 * ordered by updatedAt desc. Completed/rejected/cancelled requests are loaded on demand via getDocs.
 */
export function subscribeToQuickRequests(
  onUpdate: (requests: QuickServiceRequest[]) => void
): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, QUICK_REQUESTS_COL),
      where('status', 'in', [...ACTIVE_QUICK_REQUEST_STATUSES]),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: QuickServiceRequest[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as QuickServiceRequest);
        });
        onUpdate(list);
      },
      (error) => {
        logFirestorePermissionOrQuotaError(error, OperationType.LIST, QUICK_REQUESTS_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// ============================================================================
// 3. USERS - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveUserToFirestore(user: UserAccount): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const cleanEmail = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
    const docId = sanitizeDocId(cleanEmail || user.id || '');
    if (!docId) return;
    const normBi = typeof user.biNumber === 'string' ? user.biNumber.trim().replace(/\s+/g, '').toUpperCase() : '';
    [docId, user.id, cleanEmail, normBi].forEach((ident) => {
      if (ident) {
        removeEntityTombstone(USERS_COL, ident);
        removeEntityTombstone(APPLICATIONS_COL, ident);
      }
    });
    const safeStatus: 'ativo' | 'pendente' | 'rejeitado' =
      user.status === 'ativo' || Boolean(user.approvedAt)
        ? 'ativo'
        : user.status === 'rejeitado'
        ? 'rejeitado'
        : 'pendente';
    const { nowTs, nowIso } = resolveNowTimestamp();
    const rawUser: Record<string, any> = {
      ...user,
      userId: user.id || docId,
      status: safeStatus,
      updatedAt: nowIso,
      _updatedAt: nowTs,
      ...(normBi ? { biNumber: normBi } : {}),
    };
    if (cleanEmail) {
      rawUser.email = cleanEmail;
    } else {
      delete rawUser.email;
    }
    Object.keys(rawUser).forEach((k) => {
      if (rawUser[k] === null || rawUser[k] === undefined) {
        delete rawUser[k];
      }
    });
    const ref = doc(db, USERS_COL, docId);
    let isNew = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        isNew = !snap.exists();
      } catch {}
    }
    await setDoc(ref, cleanObject(rawUser), { merge: true });
    if (isNew) {
      incrementDashboardStats({ totalUsers: 1 }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, USERS_COL);
  }
}

export async function fetchUserFromFirestore(userIdOrEmail: string): Promise<UserAccount | null> {
  if (isFirestoreReadQuotaExhausted()) return null;
  try {
    const key = sanitizeDocId(userIdOrEmail.trim().toLowerCase());
    if (!key) return null;
    if (isEntityTombstoned(USERS_COL, key) || isEntityTombstoned(APPLICATIONS_COL, key)) {
      return null;
    }
    const ref = doc(db, USERS_COL, key);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as UserAccount;
      if (
        (data?.email && isEntityTombstoned(USERS_COL, data.email)) ||
        (data?.id && isEntityTombstoned(USERS_COL, data.id)) ||
        (data?.id && isEntityTombstoned(APPLICATIONS_COL, data.id))
      ) {
        return null;
      }
      return data;
    }
    return null;
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'read');
    console.warn('[Firestore] Erro ao buscar usuário no Firestore:', error);
    return null;
  }
}

export async function deleteUserFromFirestore(userIdOrEmail: string): Promise<void> {
  try {
    const docId = sanitizeDocId((userIdOrEmail || '').trim().toLowerCase());
    if (!docId) return;
    addEntityTombstone(USERS_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    const ref = doc(db, USERS_COL, docId);
    let existed = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        existed = snap.exists();
      } catch {}
    }
    await deleteDoc(ref);
    if (existed) {
      incrementDashboardStats({ totalUsers: -1 }).catch(() => {});
    }
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao eliminar usuário no Firestore:', error);
  }
}

export function subscribeToSingleUserStatus(
  userIdOrEmail: string,
  onUpdate: (user: UserAccount) => void
): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const docId = sanitizeDocId((userIdOrEmail || '').trim().toLowerCase());
    if (!docId) return () => {};
    const ref = doc(db, USERS_COL, docId);
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as UserAccount);
        }
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

export function subscribeToUsers(onUpdate: (users: UserAccount[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, USERS_COL),
      where('status', '==', 'pendente'),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: UserAccount[] = [];
        snapshot.forEach((d) => list.push(d.data() as UserAccount));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, USERS_COL);
        console.warn('[Firestore] Users subscription error:', err);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// ============================================================================
// 4. SCHOOLS (UNIDADES ESCOLARES) - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveSchoolToFirestore(school: AdminSchool): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    if (!school || !school.name || school.name.toLowerCase().includes('modelo central')) return;
    const docId = sanitizeDocId(school.id || school.name.toLowerCase());
    if (!docId) return;
    removeEntityTombstone(SCHOOLS_COL, docId);
    removeEntityTombstone(SCHOOLS_COL, school.id || '');
    removeEntityTombstone(SCHOOLS_COL, school.name.trim().toLowerCase());
    if (school.codigoSIGE) {
      removeEntityTombstone(SCHOOLS_COL, school.codigoSIGE);
    }
    const { nowTs, nowIso } = resolveNowTimestamp((school as any)._updatedAt);
    const ref = doc(db, SCHOOLS_COL, docId);
    let isNew = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        isNew = !snap.exists();
      } catch {}
    }
    await setDoc(
      ref,
      cleanObject({
        ...school,
        _updatedAt: nowTs,
        updatedAt: nowIso,
      }),
      { merge: true }
    );
    if (isNew) {
      incrementDashboardStats({ totalSchools: 1 }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, SCHOOLS_COL);
  }
}

export async function deleteSchoolFromFirestore(schoolId: string, schoolName?: string): Promise<void> {
  try {
    const docId = sanitizeDocId(schoolId);
    let existed = false;
    if (docId) {
      addEntityTombstone(SCHOOLS_COL, docId);
      if (!isFirestoreWriteQuotaExhausted()) {
        const ref = doc(db, SCHOOLS_COL, docId);
        if (!isFirestoreReadQuotaExhausted()) {
          try {
            const snap = await getDoc(ref);
            existed = snap.exists();
          } catch {}
        }
        await deleteDoc(ref);
      }
    }
    if (schoolName && !isFirestoreWriteQuotaExhausted()) {
      const nameId = sanitizeDocId(schoolName.trim().toLowerCase());
      addEntityTombstone(SCHOOLS_COL, schoolName.trim().toLowerCase());
      if (nameId && nameId !== docId) {
        await deleteDoc(doc(db, SCHOOLS_COL, nameId)).catch(() => {});
      }
    }
    if (existed) {
      incrementDashboardStats({ totalSchools: -1 }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, SCHOOLS_COL);
  }
}

export async function fetchSchoolsFromFirestore(limitCount: number = SCHOOLS_LIST_LIMIT): Promise<AdminSchool[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), SCHOOLS_LIST_LIMIT);
    const q = query(
      collection(db, SCHOOLS_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: AdminSchool[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as AdminSchool;
      if (data && data.name && !data.name.toLowerCase().includes('modelo central')) {
        list.push(data);
      }
    });
    return list;
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.LIST, SCHOOLS_COL);
    return [];
  }
}

export function subscribeToSchools(
  onUpdate: (schools: AdminSchool[]) => void,
  maxLimit: number = SCHOOLS_LIST_LIMIT
): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const safeLimit = Math.min(Math.max(maxLimit, 1), SCHOOLS_LIST_LIMIT);
    const q = query(
      collection(db, SCHOOLS_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: AdminSchool[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as AdminSchool;
          if (data && data.name && !data.name.toLowerCase().includes('modelo central')) {
            list.push(data);
          }
        });
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, SCHOOLS_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// ============================================================================
// 5. TEACHERS (PROFESSORES / DOCENTES) - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveTeacherToFirestore(
  teacher: AdminTeacher | TeacherRegistrationData | DirectorTeacher
): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const rawName = (teacher as any).nomeCompleto || (teacher as any).name || (teacher as any).registrationData?.nomeCompleto || '';
    const rawBi = (teacher as any).biNif || (teacher as any).bi || (teacher as any).registrationData?.biNif || '';
    const id = sanitizeDocId(teacher.id || rawName);
    if (!id) return;
    removeEntityTombstone(TEACHERS_COL, id);
    if (teacher.id) removeEntityTombstone(TEACHERS_COL, teacher.id);
    if (rawName) removeEntityTombstone(TEACHERS_COL, rawName);
    if (rawBi) removeEntityTombstone(TEACHERS_COL, rawBi);
    const cleanTeacher = stripNestedRegistrationData(teacher as any);
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, TEACHERS_COL, id);
    let isNew = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        isNew = !snap.exists();
      } catch {}
    }
    await setDoc(
      ref,
      cleanObject({
        ...cleanTeacher,
        id,
        name: rawName || (cleanTeacher as any).name,
        nomeCompleto: rawName || (cleanTeacher as any).nomeCompleto,
        _updatedAt: nowTs,
        updatedAt: nowIso,
      }),
      { merge: true }
    );
    if (isNew) {
      incrementDashboardStats({ totalTeachers: 1 }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, TEACHERS_COL);
  }
}

export async function deleteTeacherFromFirestore(teacherId: string): Promise<void> {
  try {
    const docId = sanitizeDocId(teacherId);
    if (!docId) return;
    addEntityTombstone(TEACHERS_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    const ref = doc(db, TEACHERS_COL, docId);
    let existed = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        existed = snap.exists();
      } catch {}
    }
    await deleteDoc(ref);
    if (existed) {
      incrementDashboardStats({ totalTeachers: -1 }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, TEACHERS_COL);
  }
}

export async function clearAllTeachersFromFirestore(): Promise<number> {
  if (isFirestoreReadQuotaExhausted() || isFirestoreWriteQuotaExhausted()) return 0;
  try {
    let totalDeleted = 0;
    while (true) {
      const snapshot = await getDocs(
        query(collection(db, TEACHERS_COL), orderBy('updatedAt', 'desc'), limit(50))
      );
      if (snapshot.empty) break;
      const batch = writeBatch(db);
      snapshot.forEach((d) => {
        addEntityTombstone(TEACHERS_COL, d.id);
        batch.delete(d.ref);
        totalDeleted++;
      });
      await batch.commit();
      if (snapshot.size < 50) break;
    }
    if (totalDeleted > 0) {
      incrementDashboardStats({ totalTeachers: -totalDeleted }).catch(() => {});
    }
    return totalDeleted;
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, TEACHERS_COL);
    return 0;
  }
}

export async function fetchTeachersFromFirestore(options?: {
  schoolId?: string;
  limitCount?: number;
}): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const constraints: QueryConstraint[] = [];
    if (options?.schoolId) {
      constraints.push(where('schoolId', '==', options.schoolId));
    }
    const safeLimit = Math.min(Math.max(options?.limitCount ?? PAGINATION_PAGE_SIZE, 1), 50);
    constraints.push(orderBy('updatedAt', 'desc'), limit(safeLimit));
    const snapshot = await getDocs(query(collection(db, TEACHERS_COL), ...constraints));
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, TEACHERS_COL);
    return [];
  }
}

export function subscribeToTeachers(
  onUpdate: (teachers: any[]) => void,
  options?: { schoolId?: string; limitCount?: number }
): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const constraints: QueryConstraint[] = [];
    if (options?.schoolId) {
      constraints.push(where('schoolId', '==', options.schoolId));
    }
    const safeLimit = Math.min(Math.max(options?.limitCount ?? REALTIME_LISTENER_LIMIT, 1), 50);
    constraints.push(orderBy('updatedAt', 'desc'), limit(safeLimit));
    return onSnapshot(
      query(collection(db, TEACHERS_COL), ...constraints),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, TEACHERS_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// ============================================================================
// 6. STUDENTS (ALUNOS / DISCENTES) - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveStudentToFirestore(
  student: StudentRegistrationData | AdminStudent | DirectorStudent | Record<string, any>
): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const nomeCompleto =
      (student as any).nomeCompleto ||
      (student as any).name ||
      (student as any).registrationData?.nomeCompleto ||
      'Estudante';
    const id = sanitizeDocId(student.id || nomeCompleto);
    if (!id) return;
    removeEntityTombstone(STUDENTS_COL, id);
    if (student.id) removeEntityTombstone(STUDENTS_COL, String(student.id));
    if (nomeCompleto) removeEntityTombstone(STUDENTS_COL, String(nomeCompleto));
    const numDoc = (student as any).numeroDocumento || (student as any).registrationData?.numeroDocumento;
    if (numDoc) removeEntityTombstone(STUDENTS_COL, String(numDoc));

    const schoolId =
      (student as any).schoolId ||
      (student as any).escola ||
      (student as any).schoolName ||
      (student as any).registrationData?.escola ||
      'escola_municipal';
    const turma = (student as any).turma || (student as any).registrationData?.turma || 'Turma A';
    const classe =
      (student as any).classe ||
      (student as any).gradeClass ||
      (student as any).classeEtapaModulo ||
      (student as any).registrationData?.classe ||
      '1ª Classe';

    const cleanStudent = stripNestedRegistrationData(student as any);
    const flatReg = extractFlatRegistrationData(cleanStudent) || {};
    const { registrationData: _omitStReg, ...studentRoot } = cleanStudent;
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, STUDENTS_COL, id);
    let isNew = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        isNew = !snap.exists();
      } catch {}
    }
    await setDoc(
      ref,
      cleanObject({
        ...flatReg,
        ...studentRoot,
        id,
        nomeCompleto,
        name: nomeCompleto,
        schoolId,
        turma,
        classe,
        _updatedAt: nowTs,
        updatedAt: nowIso,
      }),
      { merge: true }
    );
    if (isNew) {
      incrementDashboardStats({ totalStudents: 1 }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, STUDENTS_COL);
  }
}

export async function deleteStudentFromFirestore(studentId: string): Promise<void> {
  try {
    const docId = sanitizeDocId(studentId);
    if (!docId) return;
    addEntityTombstone(STUDENTS_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    const ref = doc(db, STUDENTS_COL, docId);
    let existed = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        existed = snap.exists();
      } catch {}
    }
    await deleteDoc(ref);
    if (existed) {
      incrementDashboardStats({ totalStudents: -1 }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, STUDENTS_COL);
  }
}

export async function clearAllStudentsFromFirestore(): Promise<number> {
  if (isFirestoreReadQuotaExhausted() || isFirestoreWriteQuotaExhausted()) return 0;
  try {
    let totalDeleted = 0;
    while (true) {
      const snapshot = await getDocs(
        query(collection(db, STUDENTS_COL), orderBy('updatedAt', 'desc'), limit(50))
      );
      if (snapshot.empty) break;
      const batch = writeBatch(db);
      snapshot.forEach((d) => {
        addEntityTombstone(STUDENTS_COL, d.id);
        batch.delete(d.ref);
        totalDeleted++;
      });
      await batch.commit();
      if (snapshot.size < 50) break;
    }
    if (totalDeleted > 0) {
      incrementDashboardStats({ totalStudents: -totalDeleted }).catch(() => {});
    }
    return totalDeleted;
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, STUDENTS_COL);
    return 0;
  }
}

export async function fetchStudentsFromFirestore(options?: {
  schoolId?: string;
  limitCount?: number;
}): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const constraints: QueryConstraint[] = [];
    if (options?.schoolId) {
      constraints.push(where('schoolId', '==', options.schoolId));
    }
    const safeLimit = Math.min(Math.max(options?.limitCount ?? PAGINATION_PAGE_SIZE, 1), 50);
    constraints.push(orderBy('updatedAt', 'desc'), limit(safeLimit));
    const snapshot = await getDocs(query(collection(db, STUDENTS_COL), ...constraints));
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, STUDENTS_COL);
    return [];
  }
}

export function subscribeToStudents(
  onUpdate: (students: any[]) => void,
  options?: { schoolId?: string; limitCount?: number }
): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const constraints: QueryConstraint[] = [];
    if (options?.schoolId) {
      constraints.push(where('schoolId', '==', options.schoolId));
    }
    const safeLimit = Math.min(Math.max(options?.limitCount ?? REALTIME_LISTENER_LIMIT, 1), 50);
    constraints.push(orderBy('updatedAt', 'desc'), limit(safeLimit));
    return onSnapshot(
      query(collection(db, STUDENTS_COL), ...constraints),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, STUDENTS_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// ============================================================================
// 7. DIRECTORS & DME STAFF - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveDirectorToFirestore(
  director: AdminDirector | DirectorRegistrationData | Record<string, any>
): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const rawName = (director as any).nomeCompleto || (director as any).name || (director as any).registrationData?.nomeCompleto || '';
    const id = sanitizeDocId(director.id || rawName);
    if (!id) return;
    removeEntityTombstone(DIRECTORS_COL, id);
    if (director.id) removeEntityTombstone(DIRECTORS_COL, String(director.id));
    if (rawName) removeEntityTombstone(DIRECTORS_COL, String(rawName));
    const cleanDirector = stripNestedRegistrationData(director as any);
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, DIRECTORS_COL, id);
    let isNew = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        isNew = !snap.exists();
      } catch {}
    }
    await setDoc(
      ref,
      cleanObject({
        ...cleanDirector,
        id,
        name: rawName || (cleanDirector as any).name,
        nomeCompleto: rawName || (cleanDirector as any).nomeCompleto,
        _updatedAt: nowTs,
        updatedAt: nowIso,
      }),
      { merge: true }
    );
    if (isNew) {
      incrementDashboardStats({ totalDirectors: 1 }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, DIRECTORS_COL);
  }
}

export async function deleteDirectorFromFirestore(directorId: string): Promise<void> {
  try {
    const docId = sanitizeDocId(directorId);
    if (!docId) return;
    addEntityTombstone(DIRECTORS_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    const ref = doc(db, DIRECTORS_COL, docId);
    let existed = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        existed = snap.exists();
      } catch {}
    }
    await deleteDoc(ref);
    if (existed) {
      incrementDashboardStats({ totalDirectors: -1 }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, DIRECTORS_COL);
  }
}

export async function fetchDirectorsFromFirestore(limitCount: number = PAGINATION_PAGE_SIZE): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), 50);
    const q = query(
      collection(db, DIRECTORS_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, DIRECTORS_COL);
    return [];
  }
}

export function subscribeToDirectors(onUpdate: (directors: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, DIRECTORS_COL),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, DIRECTORS_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

export async function saveDmeStaffToFirestore(staff: Record<string, any>): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const id = sanitizeDocId(staff.id || staff.email || staff.role);
    if (!id) return;
    removeEntityTombstone(DME_STAFF_COL, id);
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, DME_STAFF_COL, id);
    await setDoc(ref, cleanObject({ ...staff, id, _updatedAt: nowTs, updatedAt: nowIso }), { merge: true });
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, DME_STAFF_COL);
  }
}

export async function deleteDmeStaffFromFirestore(staffId: string): Promise<void> {
  try {
    const docId = sanitizeDocId(staffId);
    if (!docId) return;
    addEntityTombstone(DME_STAFF_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    await deleteDoc(doc(db, DME_STAFF_COL, docId));
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, DME_STAFF_COL);
  }
}

export async function fetchDmeStaffFromFirestore(limitCount: number = PAGINATION_PAGE_SIZE): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), 50);
    const q = query(
      collection(db, DME_STAFF_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, DME_STAFF_COL);
    return [];
  }
}

export function subscribeToDmeStaff(onUpdate: (staff: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, DME_STAFF_COL),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, DME_STAFF_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// ============================================================================
// 7B. OUTROS FUNCIONÁRIOS (ADMINISTRATIVOS, SECRETARIADO, AUXILIARES, SEGURANÇA)
// ============================================================================

export async function saveStaffToFirestore(staffMember: Record<string, any>): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const id = sanitizeDocId(
      staffMember.id || staffMember.bi || staffMember.agente || staffMember.nomeCompleto || staffMember.name
    );
    if (!id) return;
    removeEntityTombstone(STAFF_COL, id);
    const nomeCompleto = staffMember.nomeCompleto || staffMember.name || 'Funcionário';
    const funcao = staffMember.funcao || staffMember.role || staffMember.cargo || 'Administrativo / Apoio';
    const schoolName =
      staffMember.schoolName || staffMember.escola || staffMember.nomeEscola || 'Direcção Municipal de Educação';
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, STAFF_COL, id);
    let isNew = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        isNew = !snap.exists();
      } catch {}
    }
    await setDoc(
      ref,
      cleanObject({
        ...staffMember,
        id,
        nomeCompleto,
        name: nomeCompleto,
        funcao,
        schoolName,
        _updatedAt: nowTs,
        updatedAt: nowIso,
      }),
      { merge: true }
    );
    if (isNew) {
      incrementDashboardStats({ totalStaff: 1 }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, STAFF_COL);
  }
}

export async function deleteStaffFromFirestore(staffId: string): Promise<void> {
  try {
    const docId = sanitizeDocId(staffId);
    if (!docId) return;
    addEntityTombstone(STAFF_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    const ref = doc(db, STAFF_COL, docId);
    let existed = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        existed = snap.exists();
      } catch {}
    }
    await deleteDoc(ref);
    if (existed) {
      incrementDashboardStats({ totalStaff: -1 }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, STAFF_COL);
  }
}

export async function fetchStaffFromFirestore(limitCount: number = PAGINATION_PAGE_SIZE): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), 50);
    const q = query(
      collection(db, STAFF_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, STAFF_COL);
    return [];
  }
}

export function subscribeToStaff(onUpdate: (staff: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, STAFF_COL),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, STAFF_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// High-capacity chunked batch writers (supports thousands of records in chunks of 450)
export async function saveBatchStudentsToFirestore(students: Record<string, any>[]): Promise<number> {
  if (!Array.isArray(students) || students.length === 0 || isFirestoreWriteQuotaExhausted()) return 0;
  let saved = 0;
  let newCount = 0;
  const existingIds = new Set(
    safeReadJsonArray<any>('ucore_admin_students').map((s) => sanitizeDocId(s?.id || s?.nomeCompleto || s?.name))
  );
  const CHUNK_SIZE = 450;
  const { nowTs, nowIso } = resolveNowTimestamp();
  for (let i = 0; i < students.length; i += CHUNK_SIZE) {
    const chunk = students.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((student) => {
      const id = sanitizeDocId(student.id || student.nomeCompleto || student.name);
      if (!id) return;
      if (!existingIds.has(id)) {
        existingIds.add(id);
        newCount++;
      }
      const nomeCompleto = student.nomeCompleto || student.name || 'Estudante';
      const schoolId = student.schoolId || student.escola || student.schoolName || 'escola_municipal';
      const turma = student.turma || 'Turma A';
      const classe = student.classe || student.gradeClass || student.classeEtapaModulo || '1ª Classe';
      const ref = doc(db, STUDENTS_COL, id);
      batch.set(
        ref,
        cleanObject({
          ...student,
          id,
          nomeCompleto,
          name: nomeCompleto,
          schoolId,
          turma,
          classe,
          _updatedAt: nowTs,
          updatedAt: nowIso,
        }),
        { merge: true }
      );
      saved++;
    });
    await batch.commit();
  }
  if (newCount > 0) {
    incrementDashboardStats({ totalStudents: newCount }).catch(() => {});
  }
  return saved;
}

export async function saveBatchTeachersToFirestore(teachers: Record<string, any>[]): Promise<number> {
  if (!Array.isArray(teachers) || teachers.length === 0 || isFirestoreWriteQuotaExhausted()) return 0;
  let saved = 0;
  let newCount = 0;
  const existingIds = new Set(
    safeReadJsonArray<any>('ucore_admin_teachers').map((t) => sanitizeDocId(t?.id || t?.nomeCompleto || t?.name))
  );
  const CHUNK_SIZE = 450;
  const { nowTs, nowIso } = resolveNowTimestamp();
  for (let i = 0; i < teachers.length; i += CHUNK_SIZE) {
    const chunk = teachers.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((teacher) => {
      const id = sanitizeDocId(teacher.id || teacher.nomeCompleto || teacher.name);
      if (!id) return;
      if (!existingIds.has(id)) {
        existingIds.add(id);
        newCount++;
      }
      const ref = doc(db, TEACHERS_COL, id);
      batch.set(
        ref,
        cleanObject({ ...teacher, id, _updatedAt: nowTs, updatedAt: nowIso }),
        { merge: true }
      );
      saved++;
    });
    await batch.commit();
  }
  if (newCount > 0) {
    incrementDashboardStats({ totalTeachers: newCount }).catch(() => {});
  }
  return saved;
}

export async function saveBatchStaffToFirestore(staffList: Record<string, any>[]): Promise<number> {
  if (!Array.isArray(staffList) || staffList.length === 0 || isFirestoreWriteQuotaExhausted()) return 0;
  let saved = 0;
  let newCount = 0;
  const existingIds = new Set(
    safeReadJsonArray<any>('ucore_registered_staff_v1').map((s) =>
      sanitizeDocId(s?.id || s?.bi || s?.agente || s?.nomeCompleto || s?.name)
    )
  );
  const CHUNK_SIZE = 450;
  const { nowTs, nowIso } = resolveNowTimestamp();
  for (let i = 0; i < staffList.length; i += CHUNK_SIZE) {
    const chunk = staffList.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((staffMember) => {
      const id = sanitizeDocId(
        staffMember.id || staffMember.bi || staffMember.agente || staffMember.nomeCompleto || staffMember.name
      );
      if (!id) return;
      if (!existingIds.has(id)) {
        existingIds.add(id);
        newCount++;
      }
      const nomeCompleto = staffMember.nomeCompleto || staffMember.name || 'Funcionário';
      const funcao = staffMember.funcao || staffMember.role || staffMember.cargo || 'Administrativo / Apoio';
      const schoolName =
        staffMember.schoolName || staffMember.escola || staffMember.nomeEscola || 'Direcção Municipal de Educação';
      const ref = doc(db, STAFF_COL, id);
      batch.set(
        ref,
        cleanObject({
          ...staffMember,
          id,
          nomeCompleto,
          name: nomeCompleto,
          funcao,
          schoolName,
          _updatedAt: nowTs,
          updatedAt: nowIso,
        }),
        { merge: true }
      );
      saved++;
    });
    await batch.commit();
  }
  if (newCount > 0) {
    incrementDashboardStats({ totalStaff: newCount }).catch(() => {});
  }
  return saved;
}

// ============================================================================
// 8. EFECTIVIDADE - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveEfectividadeToFirestore(record: Record<string, any>): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const docId = sanitizeDocId(record.id || record.bi || record.agente);
    if (!docId) return;
    removeEntityTombstone(EFECTIVIDADE_COL, docId);
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, EFECTIVIDADE_COL, docId);
    let isNew = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        isNew = !snap.exists();
      } catch {}
    }
    await setDoc(
      ref,
      cleanObject({ ...record, id: record.id || docId, _updatedAt: nowTs, updatedAt: nowIso }),
      { merge: true }
    );
    if (isNew) {
      incrementDashboardStats({ totalEfectividade: 1 }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, EFECTIVIDADE_COL);
  }
}

export async function deleteEfectividadeFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(EFECTIVIDADE_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    const ref = doc(db, EFECTIVIDADE_COL, docId);
    let existed = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        existed = snap.exists();
      } catch {}
    }
    await deleteDoc(ref);
    if (existed) {
      incrementDashboardStats({ totalEfectividade: -1 }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, EFECTIVIDADE_COL);
  }
}

export async function clearAllEfectividadeFromFirestore(): Promise<number> {
  if (isFirestoreReadQuotaExhausted() || isFirestoreWriteQuotaExhausted()) return 0;
  try {
    let totalDeleted = 0;
    while (true) {
      const snapshot = await getDocs(
        query(collection(db, EFECTIVIDADE_COL), orderBy('updatedAt', 'desc'), limit(50))
      );
      if (snapshot.empty) break;
      const batch = writeBatch(db);
      snapshot.forEach((d) => {
        addEntityTombstone(EFECTIVIDADE_COL, d.id);
        batch.delete(d.ref);
        totalDeleted++;
      });
      await batch.commit();
      if (snapshot.size < 50) break;
    }
    if (totalDeleted > 0) {
      incrementDashboardStats({ totalEfectividade: -totalDeleted }).catch(() => {});
    }
    return totalDeleted;
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, EFECTIVIDADE_COL);
    return 0;
  }
}

export async function fetchEfectividadeFromFirestore(limitCount: number = PAGINATION_PAGE_SIZE): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), 50);
    const q = query(
      collection(db, EFECTIVIDADE_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, EFECTIVIDADE_COL);
    return [];
  }
}

export function subscribeToEfectividade(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, EFECTIVIDADE_COL),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, EFECTIVIDADE_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// ============================================================================
// 8B. DECLARAÇÃO DE SERVIÇO - FIRESTORE CLOUD STORE (INDEPENDENT OF EFECTIVIDADE)
// ============================================================================

export async function saveDeclaracaoServicoToFirestore(record: Record<string, any>): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const docId = sanitizeDocId(record.id || record.ref || record.bi || record.agente);
    if (!docId) return;
    removeEntityTombstone(DECLARACAO_SERVICO_COL, docId);
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, DECLARACAO_SERVICO_COL, docId);
    let isNew = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        isNew = !snap.exists();
      } catch {}
    }
    await setDoc(
      ref,
      cleanObject({ ...record, id: record.id || docId, _updatedAt: nowTs, updatedAt: nowIso }),
      { merge: true }
    );
    if (isNew) {
      incrementDashboardStats({ totalDeclaracaoServico: 1 }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, DECLARACAO_SERVICO_COL);
  }
}

export async function deleteDeclaracaoServicoFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(DECLARACAO_SERVICO_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    const ref = doc(db, DECLARACAO_SERVICO_COL, docId);
    let existed = false;
    if (!isFirestoreReadQuotaExhausted()) {
      try {
        const snap = await getDoc(ref);
        existed = snap.exists();
      } catch {}
    }
    await deleteDoc(ref);
    if (existed) {
      incrementDashboardStats({ totalDeclaracaoServico: -1 }).catch(() => {});
    }
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, DECLARACAO_SERVICO_COL);
  }
}

export async function clearAllDeclaracaoServicoFromFirestore(): Promise<number> {
  if (isFirestoreReadQuotaExhausted() || isFirestoreWriteQuotaExhausted()) return 0;
  try {
    let totalDeleted = 0;
    while (true) {
      const snapshot = await getDocs(
        query(collection(db, DECLARACAO_SERVICO_COL), orderBy('updatedAt', 'desc'), limit(50))
      );
      if (snapshot.empty) break;
      const batch = writeBatch(db);
      snapshot.forEach((d) => {
        addEntityTombstone(DECLARACAO_SERVICO_COL, d.id);
        batch.delete(d.ref);
        totalDeleted++;
      });
      await batch.commit();
      if (snapshot.size < 50) break;
    }
    if (totalDeleted > 0) {
      incrementDashboardStats({ totalDeclaracaoServico: -totalDeleted }).catch(() => {});
    }
    return totalDeleted;
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, DECLARACAO_SERVICO_COL);
    return 0;
  }
}

export async function fetchDeclaracaoServicoFromFirestore(limitCount: number = PAGINATION_PAGE_SIZE): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), 50);
    const q = query(
      collection(db, DECLARACAO_SERVICO_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, DECLARACAO_SERVICO_COL);
    return [];
  }
}

export function subscribeToDeclaracaoServico(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, DECLARACAO_SERVICO_COL),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, DECLARACAO_SERVICO_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// ============================================================================
// 9. MINI-PAUTAS & GRADES - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveMiniPautaToFirestore(record: Record<string, any>): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const key = `${record.classe || ''}_${record.turma || ''}_${record.disciplina || ''}_${record.schoolName || ''}`
      .trim()
      .toLowerCase();
    const docId = sanitizeDocId(record.id || key);
    if (!docId) return;
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, GRADES_COL, docId);
    await setDoc(
      ref,
      cleanObject({ ...record, id: record.id || docId, _updatedAt: nowTs, updatedAt: nowIso }),
      { merge: true }
    );
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, GRADES_COL);
  }
}

export async function fetchMiniPautasFromFirestore(limitCount: number = PAGINATION_PAGE_SIZE): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), 50);
    const q = query(
      collection(db, GRADES_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, GRADES_COL);
    return [];
  }
}

export function subscribeToMiniPautas(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, GRADES_COL),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, GRADES_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// ============================================================================
// 10. ATTENDANCE (ASSIDUIDADE DE ALUNOS E PROFESSORES) - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveAttendanceToFirestore(
  record: Record<string, any>,
  kind: 'student' | 'teacher'
): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const targetId = kind === 'student' ? record.studentId : record.teacherId;
    const docId = sanitizeDocId(`${kind}_${targetId}_${record.date}`);
    if (!docId) return;
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, ATTENDANCE_COL, docId);
    await setDoc(
      ref,
      cleanObject({ ...record, attendanceKind: kind, docId, _updatedAt: nowTs, updatedAt: nowIso }),
      { merge: true }
    );
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, ATTENDANCE_COL);
  }
}

export async function saveBatchAttendanceToFirestore(
  records: Record<string, any>[],
  kind: 'student' | 'teacher'
): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    if (!Array.isArray(records) || records.length === 0) return;
    const { nowTs, nowIso } = resolveNowTimestamp();
    const batch = writeBatch(db);
    records.forEach((record) => {
      const targetId = kind === 'student' ? record.studentId : record.teacherId;
      const docId = sanitizeDocId(`${kind}_${targetId}_${record.date}`);
      if (docId) {
        const ref = doc(db, ATTENDANCE_COL, docId);
        batch.set(
          ref,
          cleanObject({ ...record, attendanceKind: kind, docId, _updatedAt: nowTs, updatedAt: nowIso }),
          { merge: true }
        );
      }
    });
    await batch.commit();
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, ATTENDANCE_COL);
  }
}

export async function fetchAttendanceFromFirestore(limitCount: number = PAGINATION_PAGE_SIZE): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), 50);
    const q = query(
      collection(db, ATTENDANCE_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, ATTENDANCE_COL);
    return [];
  }
}

export function subscribeToAttendance(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, ATTENDANCE_COL),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, ATTENDANCE_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// ============================================================================
// 11. ANNOUNCEMENTS, ROOMS, CLASSES & CHAT - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveAnnouncementToFirestore(announcement: SchoolAnnouncement): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const docId = sanitizeDocId(announcement.id);
    if (!docId) return;
    removeEntityTombstone(ANNOUNCEMENTS_COL, docId);
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, ANNOUNCEMENTS_COL, docId);
    await setDoc(
      ref,
      cleanObject({ ...announcement, _updatedAt: nowTs, updatedAt: nowIso }),
      { merge: true }
    );
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, ANNOUNCEMENTS_COL);
  }
}

export async function deleteAnnouncementFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(ANNOUNCEMENTS_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    await deleteDoc(doc(db, ANNOUNCEMENTS_COL, docId));
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, ANNOUNCEMENTS_COL);
  }
}

export async function fetchAnnouncementsFromFirestore(
  limitCount: number = ANNOUNCEMENTS_LIMIT
): Promise<SchoolAnnouncement[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), ANNOUNCEMENTS_LIMIT);
    const q = query(
      collection(db, ANNOUNCEMENTS_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: SchoolAnnouncement[] = [];
    snapshot.forEach((d) => list.push(d.data() as SchoolAnnouncement));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, ANNOUNCEMENTS_COL);
    return [];
  }
}

export function subscribeToAnnouncements(onUpdate: (list: SchoolAnnouncement[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, ANNOUNCEMENTS_COL),
      orderBy('updatedAt', 'desc'),
      limit(ANNOUNCEMENTS_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: SchoolAnnouncement[] = [];
        snapshot.forEach((d) => list.push(d.data() as SchoolAnnouncement));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, ANNOUNCEMENTS_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

export async function saveRoomToFirestore(room: DirectorRoom): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const docId = sanitizeDocId(room.id || room.roomNumber);
    if (!docId) return;
    removeEntityTombstone(ROOMS_COL, docId);
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, ROOMS_COL, docId);
    await setDoc(ref, cleanObject({ ...room, _updatedAt: nowTs, updatedAt: nowIso }), { merge: true });
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, ROOMS_COL);
  }
}

export async function deleteRoomFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(ROOMS_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    await deleteDoc(doc(db, ROOMS_COL, docId));
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, ROOMS_COL);
  }
}

export async function fetchRoomsFromFirestore(limitCount: number = PAGINATION_PAGE_SIZE): Promise<DirectorRoom[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), 50);
    const q = query(
      collection(db, ROOMS_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: DirectorRoom[] = [];
    snapshot.forEach((d) => list.push(d.data() as DirectorRoom));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, ROOMS_COL);
    return [];
  }
}

export function subscribeToRooms(onUpdate: (list: DirectorRoom[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, ROOMS_COL),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: DirectorRoom[] = [];
        snapshot.forEach((d) => list.push(d.data() as DirectorRoom));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, ROOMS_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

export async function saveClassToFirestore(cls: DirectorClass): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const docId = sanitizeDocId(cls.id || cls.name);
    if (!docId) return;
    removeEntityTombstone(CLASSES_COL, docId);
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, CLASSES_COL, docId);
    await setDoc(ref, cleanObject({ ...cls, _updatedAt: nowTs, updatedAt: nowIso }), { merge: true });
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, CLASSES_COL);
  }
}

export async function deleteClassFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(CLASSES_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    await deleteDoc(doc(db, CLASSES_COL, docId));
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, CLASSES_COL);
  }
}

export async function fetchClassesFromFirestore(limitCount: number = PAGINATION_PAGE_SIZE): Promise<DirectorClass[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), 50);
    const q = query(
      collection(db, CLASSES_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: DirectorClass[] = [];
    snapshot.forEach((d) => list.push(d.data() as DirectorClass));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, CLASSES_COL);
    return [];
  }
}

export function subscribeToClasses(onUpdate: (list: DirectorClass[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, CLASSES_COL),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: DirectorClass[] = [];
        snapshot.forEach((d) => list.push(d.data() as DirectorClass));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, CLASSES_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

export async function saveChatMessageToFirestore(message: ChatMessage): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const docId = sanitizeDocId(message.id);
    if (!docId) return;
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, CHAT_MESSAGES_COL, docId);
    await setDoc(
      ref,
      cleanObject({ ...message, _updatedAt: nowTs, updatedAt: nowIso }),
      { merge: true }
    );
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, CHAT_MESSAGES_COL);
  }
}

export function subscribeToChatMessages(onUpdate: (list: ChatMessage[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, CHAT_MESSAGES_COL),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((d) => list.push(d.data() as ChatMessage));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, CHAT_MESSAGES_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// ============================================================================
// 11B. GUIAS DE FÉRIAS & GUIAS DE COLOCAÇÃO - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveGuiaFeriasToFirestore(record: Record<string, any>): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const docId = sanitizeDocId(record.id || `${record.ng || ''}_${record.ang || ''}_${record.agente || ''}`);
    if (!docId) return;
    removeEntityTombstone(GUIAS_FERIAS_COL, docId);
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, GUIAS_FERIAS_COL, docId);
    await setDoc(
      ref,
      cleanObject({ ...record, id: record.id || docId, _updatedAt: nowTs, updatedAt: nowIso }),
      { merge: true }
    );
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, GUIAS_FERIAS_COL);
  }
}

export async function deleteGuiaFeriasFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(GUIAS_FERIAS_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    await deleteDoc(doc(db, GUIAS_FERIAS_COL, docId));
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, GUIAS_FERIAS_COL);
  }
}

export async function fetchGuiasFeriasFromFirestore(limitCount: number = PAGINATION_PAGE_SIZE): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), 50);
    const q = query(
      collection(db, GUIAS_FERIAS_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, GUIAS_FERIAS_COL);
    return [];
  }
}

export function subscribeToGuiasFerias(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, GUIAS_FERIAS_COL),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, GUIAS_FERIAS_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

export async function saveGuiaColocacaoToFirestore(record: Record<string, any>): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const docId = sanitizeDocId(record.id || `${record.num || ''}_${record.ano || ''}_${record.agente || ''}`);
    if (!docId) return;
    removeEntityTombstone(GUIAS_COLOCACAO_COL, docId);
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, GUIAS_COLOCACAO_COL, docId);
    await setDoc(
      ref,
      cleanObject({ ...record, id: record.id || docId, _updatedAt: nowTs, updatedAt: nowIso }),
      { merge: true }
    );
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, GUIAS_COLOCACAO_COL);
  }
}

export async function deleteGuiaColocacaoFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(GUIAS_COLOCACAO_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    await deleteDoc(doc(db, GUIAS_COLOCACAO_COL, docId));
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, GUIAS_COLOCACAO_COL);
  }
}

export async function fetchGuiasColocacaoFromFirestore(limitCount: number = PAGINATION_PAGE_SIZE): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), 50);
    const q = query(
      collection(db, GUIAS_COLOCACAO_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, GUIAS_COLOCACAO_COL);
    return [];
  }
}

export function subscribeToGuiasColocacao(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, GUIAS_COLOCACAO_COL),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, GUIAS_COLOCACAO_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

export async function saveFichaAvaliacaoToFirestore(record: Record<string, any>): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const docId = sanitizeDocId(record.id || `${record.agente || ''}_${record.dataAval || ''}`);
    if (!docId) return;
    removeEntityTombstone(FICHAS_AVALIACAO_COL, docId);
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, FICHAS_AVALIACAO_COL, docId);
    await setDoc(
      ref,
      cleanObject({ ...record, id: record.id || docId, _updatedAt: nowTs, updatedAt: nowIso }),
      { merge: true }
    );
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, FICHAS_AVALIACAO_COL);
  }
}

export async function deleteFichaAvaliacaoFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(FICHAS_AVALIACAO_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    await deleteDoc(doc(db, FICHAS_AVALIACAO_COL, docId));
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, FICHAS_AVALIACAO_COL);
  }
}

export async function fetchFichasAvaliacaoFromFirestore(limitCount: number = PAGINATION_PAGE_SIZE): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), 50);
    const q = query(
      collection(db, FICHAS_AVALIACAO_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, FICHAS_AVALIACAO_COL);
    return [];
  }
}

export function subscribeToFichasAvaliacao(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, FICHAS_AVALIACAO_COL),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, FICHAS_AVALIACAO_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

export async function saveCadastroDocenteToFirestore(record: Record<string, any>): Promise<void> {
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const docId = sanitizeDocId(record.id || `${record.numNota || ''}_${record.bi || ''}_${record.nome || ''}`);
    if (!docId) return;
    removeEntityTombstone(CADASTRO_DOCENTE_COL, docId);
    const { nowTs, nowIso } = resolveNowTimestamp();
    const ref = doc(db, CADASTRO_DOCENTE_COL, docId);
    await setDoc(
      ref,
      cleanObject({ ...record, id: record.id || docId, _updatedAt: nowTs, updatedAt: nowIso }),
      { merge: true }
    );
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.WRITE, CADASTRO_DOCENTE_COL);
  }
}

export async function deleteCadastroDocenteFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(CADASTRO_DOCENTE_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    await deleteDoc(doc(db, CADASTRO_DOCENTE_COL, docId));
  } catch (error) {
    logFirestorePermissionOrQuotaError(error, OperationType.DELETE, CADASTRO_DOCENTE_COL);
  }
}

export async function fetchCadastroDocenteFromFirestore(limitCount: number = PAGINATION_PAGE_SIZE): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), 50);
    const q = query(
      collection(db, CADASTRO_DOCENTE_COL),
      orderBy('updatedAt', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, CADASTRO_DOCENTE_COL);
    return [];
  }
}

export function subscribeToCadastroDocente(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, CADASTRO_DOCENTE_COL),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, CADASTRO_DOCENTE_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

export async function fetchAuditLogsFromFirestore(limitCount: number = PAGINATION_PAGE_SIZE): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const safeLimit = Math.min(Math.max(limitCount, 1), 50);
    const q = query(
      collection(db, AUDIT_LOGS_COL),
      orderBy('timestamp', 'desc'),
      limit(safeLimit)
    );
    const snapshot = await getDocs(q);
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    logFirestorePermissionOrQuotaError(err, OperationType.LIST, AUDIT_LOGS_COL);
    return [];
  }
}

export function subscribeToAuditLogs(onUpdate: (logs: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, AUDIT_LOGS_COL),
      orderBy('timestamp', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, AUDIT_LOGS_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

export function subscribeToTombstones(onUpdate: (keys: string[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const q = query(
      collection(db, TOMBSTONES_COL),
      orderBy('updatedAt', 'desc'),
      limit(REALTIME_LISTENER_LIMIT)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const keys: string[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data && typeof data.key === 'string') {
            keys.push(data.key);
          } else if (data && data.col && data.id) {
            keys.push(`${data.col}::${sanitizeDocId(data.id).toLowerCase()}`);
          }
        });
        onUpdate(keys);
      },
      (err) => {
        logFirestorePermissionOrQuotaError(err, OperationType.LIST, TOMBSTONES_COL);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// ============================================================================
// 12. VIEW-SCOPED REAL-TIME DATABASE ORCHESTRATOR
// Synchronizes ONLY active view collections (Rule 1, 2, 3, 5) with clean teardowns
// ============================================================================

export interface RealtimeSyncScope {
  view?: string;
  role?: string;
  schoolId?: string;
}

let globalRealtimeUnsubscribe: (() => void) | null = null;
let activeRealtimeScopeKey: string | null = null;

function safeReadJsonArray<T = any>(key: string): T[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteJsonIfChanged(key: string, data: any): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  const prevWinFlag = Boolean((window as any).__SIGRE_APPLYING_SERVER_STATE);
  (window as any).__SIGRE_APPLYING_SERVER_STATE = true;
  try {
    const nextStr = JSON.stringify(data);
    const prevStr = localStorage.getItem(key);
    if (prevStr !== nextStr) {
      localStorage.setItem(key, nextStr);
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    (window as any).__SIGRE_APPLYING_SERVER_STATE = prevWinFlag;
  }
}

function resolveScopeCollections(scope?: RealtimeSyncScope): Set<string> {
  const view = String(scope?.view || 'admin-dashboard').toLowerCase();
  const role = String(scope?.role || 'admin').toLowerCase();
  const active = new Set<string>(['tombstones']);

  if (view.includes('dashboard') || view === 'overview' || view === 'home') {
    active.add('announcements');
    if (role === 'admin' || role === 'director' || role === 'diretor') {
      active.add('applications_pending');
      active.add('quickRequests_active');
    }
    if (role === 'admin') {
      active.add('schools');
    }
  } else if (view.includes('approvals') || view.includes('aprovac') || view.includes('inscric')) {
    active.add('applications_pending');
    active.add('users_pending');
  } else if (view.includes('schools') || view.includes('escola')) {
    active.add('schools');
    active.add('directors');
  } else if (view.includes('directors') || view.includes('directores') || view.includes('diretores')) {
    active.add('directors');
    active.add('dme_staff');
    active.add('schools');
  } else if (view.includes('teachers') || view.includes('professor')) {
    active.add('teachers');
    active.add('schools');
  } else if (view.includes('students') || view.includes('aluno')) {
    active.add('students');
    active.add('schools');
  } else if (view.includes('staff') || view.includes('funcionar')) {
    active.add('staff');
    active.add('schools');
  } else if (view.includes('efectividade')) {
    active.add('efectividade');
    active.add('schools');
  } else if (view.includes('declaracao')) {
    active.add('declaracao_servico');
  } else if (view.includes('cadastro-docente') || view.includes('guias') || view.includes('ferias')) {
    active.add('cadastro_docente');
    active.add('guias_ferias');
    active.add('guias_colocacao');
    active.add('fichas_avaliacao');
  } else if (view.includes('grades') || view.includes('pauta') || view.includes('analytics')) {
    active.add('grades');
    active.add('students');
  } else if (view.includes('attendance') || view.includes('assiduidade') || view.includes('presenca')) {
    active.add('attendance');
  } else if (view.includes('rooms') || view.includes('salas')) {
    active.add('rooms');
  } else if (view.includes('classes') || view.includes('turmas')) {
    active.add('classes');
  } else if (view.includes('announcements') || view.includes('comunicados') || view.includes('anuncios')) {
    active.add('announcements');
  } else if (view.includes('quick-services') || view.includes('servicos')) {
    active.add('quickRequests_active');
    active.add('schools');
  } else if (view.includes('statistics') || view.includes('estatistic')) {
    active.add('schools');
  } else {
    active.add('schools');
  }

  return active;
}

export function initViewScopedRealtimeSync(scope?: RealtimeSyncScope): () => void {
  if (typeof window === 'undefined') return () => {};
  if (isFirestoreReadQuotaExhausted()) return () => {};

  const scopeKey = `${scope?.view || 'default'}::${scope?.role || 'default'}::${scope?.schoolId || 'all'}`;
  if (globalRealtimeUnsubscribe && activeRealtimeScopeKey === scopeKey) {
    return globalRealtimeUnsubscribe;
  }
  if (globalRealtimeUnsubscribe) {
    globalRealtimeUnsubscribe();
  }

  const enabledCols = resolveScopeCollections(scope);
  const roleLower = String(scope?.role || '').toLowerCase();
  const scopedSchoolId =
    roleLower === 'director' || roleLower === 'diretor' || roleLower === 'teacher' || roleLower === 'professor'
      ? scope?.schoolId
      : undefined;
  const unsubs: Unsubscribe[] = [];
  const norm = (s?: string) => (s || '').trim().toLowerCase();

  // 0. DASHBOARD AGGREGATOR LISTENER (Single doc: stats/dashboard)
  unsubs.push(
    subscribeToDashboardStats((stats) => {
      try {
        window.dispatchEvent(new CustomEvent('sigre-dashboard-stats-updated', { detail: { stats } }));
      } catch {}
    })
  );

  // 0B. REAL-TIME TOMBSTONES MERGE (Bounded limit 30)
  if (enabledCols.has('tombstones')) {
    unsubs.push(
      subscribeToTombstones((cloudTombstoneKeys) => {
        try {
          if (!Array.isArray(cloudTombstoneKeys)) return;
          const existingLocal = getEntityTombstones();
          const normalizedUnion = Array.from(
            new Set(
              [...existingLocal, ...cloudTombstoneKeys]
                .filter((k) => typeof k === 'string' && k.trim() !== '' && !k.toLowerCase().includes('socienciadaeduca2018'))
                .map((k) => k.trim().toLowerCase())
            )
          );
          if (safeWriteJsonIfChanged(DELETED_ENTITIES_KEY, normalizedUnion)) {
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch {}
      })
    );
  }

  // 1. REAL-TIME SCHOOLS UNIFICATION (Bounded <= 100)
  if (enabledCols.has('schools')) {
    unsubs.push(
      subscribeToSchools((cloudSchools) => {
        try {
          const localAdminSchools = safeReadJsonArray<AdminSchool>('ucore_admin_schools');
          const localRegSchools = safeReadJsonArray<any>('sigre_school_registrations');
          const map = new Map<string, AdminSchool>();

          localAdminSchools.forEach((ls) => {
            if (
              !ls ||
              !ls.name ||
              isBannedSchoolOrEntity(ls) ||
              isPlaceholderSchoolName(ls.name) ||
              isRetiredDuplicateOrPlaceholderSchoolId(ls.id)
            ) {
              return;
            }
            const k = norm(ls.id || ls.name);
            if (isEntityTombstoned(SCHOOLS_COL, ls.id) || isEntityTombstoned(SCHOOLS_COL, ls.name)) return;
            map.set(k, ls);
          });

          localRegSchools.forEach((reg) => {
            if (!reg || !reg.nomeOficial || isBannedSchoolOrEntity(reg) || isPlaceholderSchoolName(reg.nomeOficial)) return;
            if (isEntityTombstoned(SCHOOLS_COL, reg.id) || isEntityTombstoned(SCHOOLS_COL, reg.nomeOficial)) return;
            const matchKey = Array.from(map.keys()).find((k) => {
              const item = map.get(k);
              return item && areSameCanonicalSchool(item, { id: reg.id, name: reg.nomeOficial });
            });
            if (matchKey) {
              const existing = map.get(matchKey);
              if (existing && !existing.registrationData) {
                map.set(matchKey, { ...existing, registrationData: reg });
              }
            }
          });

          cloudSchools.forEach((cs) => {
            if (!cs || !cs.name) return;
            if (isBannedSchoolOrEntity(cs) || isPlaceholderSchoolName(cs.name) || isRetiredDuplicateOrPlaceholderSchoolId(cs.id)) {
              return;
            }
            if (isEntityTombstoned(SCHOOLS_COL, cs.id) || isEntityTombstoned(SCHOOLS_COL, cs.name)) return;
            const matchKey =
              Array.from(map.keys()).find((k) => {
                const item = map.get(k);
                return item && areSameCanonicalSchool(item, cs);
              }) || norm(cs.id || cs.name);
            const existing = map.get(matchKey);
            if (existing) {
              const eTs = Number((existing as any)._updatedAt || Date.parse((existing as any).updatedAt || '') || 0);
              const cTs = Number((cs as any)._updatedAt || Date.parse((cs as any).updatedAt || '') || 0);
              const primary = cTs >= eTs ? cs : existing;
              const secondary = cTs >= eTs ? existing : cs;
              map.set(matchKey, {
                ...secondary,
                ...primary,
                registrationData: primary.registrationData || secondary.registrationData,
              });
            } else {
              map.set(matchKey, cs);
            }
          });

          const unifiedSchools = deduplicateSchoolsCanonical(
            Array.from(map.values()),
            (sc) =>
              isBannedSchoolOrEntity(sc) ||
              isEntityTombstoned(SCHOOLS_COL, sc.id) ||
              isEntityTombstoned(SCHOOLS_COL, sc.name)
          );
          const changedSchools = safeWriteJsonIfChanged('ucore_admin_schools', unifiedSchools);
          safeWriteJsonIfChanged('ucore_registered_schools_v1', unifiedSchools);

          const unifiedRegs = unifiedSchools.map((s) => s.registrationData).filter(Boolean);
          safeWriteJsonIfChanged('sigre_school_registrations', unifiedRegs);

          const validUnifiedSchools = unifiedSchools.filter(
            (cs) => cs && cs.name && !isBannedSchoolOrEntity(cs) && !isEntityTombstoned(SCHOOLS_COL, cs.id) && !isEntityTombstoned(SCHOOLS_COL, cs.name)
          );
          if (
            isExpressApiAvailable() &&
            validUnifiedSchools.length > 0 &&
            (changedSchools || validUnifiedSchools.length !== localAdminSchools.length)
          ) {
            fetch('/api/network/schools', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ schools: validUnifiedSchools }),
            }).catch(() => {});
          }
          if (changedSchools) {
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch (e) {
          console.warn('[UnifiedSync] Erro ao unificar escolas:', e);
        }
      }, SCHOOLS_LIST_LIMIT)
    );
  }

  // 2. REAL-TIME TEACHERS UNIFICATION (Bounded limit 30)
  if (enabledCols.has('teachers')) {
    unsubs.push(
      subscribeToTeachers(
        (cloudTeachers) => {
          try {
            const localReg = safeReadJsonArray<TeacherRegistrationData>('ucore_registered_teachers_v2');
            const localAdmin = safeReadJsonArray<AdminTeacher>('ucore_admin_teachers');
            const localDir = safeReadJsonArray<DirectorTeacher>('ucore_director_teachers_v1');

            const regMap = new Map<string, TeacherRegistrationData>();
            const adminMap = new Map<string, AdminTeacher>();
            const dirMap = new Map<string, DirectorTeacher>();

            const ingestTeacherItem = (item: any) => {
              if (!item || isBannedSchoolOrEntity(item)) return;
              const id = String(item.id || item.nomeCompleto || item.name || '').trim();
              const name = String(item.nomeCompleto || item.name || item.registrationData?.nomeCompleto || '').trim();
              if (!id && !name) return;
              if (isEntityTombstoned(TEACHERS_COL, id) || isEntityTombstoned(TEACHERS_COL, name)) return;

              const schoolName = String(
                item.nomeEscola || item.schoolName || item.registrationData?.nomeEscola || 'Escola Municipal de Quêssua'
              ).trim();
              if (isBannedSchoolOrEntity(schoolName)) return;

              const key = norm(id || name);
              const regData = extractFlatRegistrationData(item) as TeacherRegistrationData | undefined;
              if (regData && regData.nomeCompleto) {
                regMap.set(key, { ...(regMap.get(key) || {}), ...regData });
              }

              const existingAdmin = adminMap.get(key);
              const existingDir = dirMap.get(key);
              const mergedReg = regMap.get(key) || regData;
              const assignedTurmas =
                item.assignedTurmas ||
                mergedReg?.assignedTurmas ||
                existingDir?.assignedTurmas ||
                existingAdmin?.assignedTurmas;
              const primaryTurmaEntry = assignedTurmas?.[0];

              const subject = String(
                item.subject ||
                  primaryTurmaEntry?.subject ||
                  item.disciplinas ||
                  mergedReg?.disciplinas ||
                  existingDir?.subject ||
                  'Língua Portuguesa'
              );
              const gradeClass = String(
                item.gradeClass ||
                  item.primaryGradeClass ||
                  mergedReg?.primaryGradeClass ||
                  primaryTurmaEntry?.gradeClass ||
                  existingDir?.gradeClass ||
                  item.niveisLecciona?.[0]?.nome ||
                  mergedReg?.niveisLecciona?.[0]?.nome ||
                  'Ensino Primário'
              );
              const phone = String(item.phone || item.telefone || mergedReg?.telefone || existingDir?.phone || '+244 923 000 000');
              const email = String(item.email || mergedReg?.email || existingDir?.email || '');
              const room = String(
                item.room ||
                  item.primaryRoom ||
                  mergedReg?.primaryRoom ||
                  primaryTurmaEntry?.room ||
                  existingDir?.room ||
                  existingAdmin?.room ||
                  'Sala 01'
              );
              const turma = String(
                item.turma ||
                  item.primaryTurma ||
                  mergedReg?.primaryTurma ||
                  primaryTurmaEntry?.turma ||
                  existingDir?.turma ||
                  existingAdmin?.turma ||
                  'Turma A'
              );

              const adminObj: AdminTeacher = {
                id: id || existingAdmin?.id || `prof-${Date.now()}`,
                name,
                phone,
                gradeClass,
                room,
                turma,
                category: item.category || item.funcaoCategoria || mergedReg?.funcaoCategoria || existingAdmin?.category || 'Docente / Professor',
                location: item.location || existingAdmin?.location || `${item.municipioEscola || mergedReg?.municipioEscola || 'Quêssua'}`,
                schoolName,
                schoolId: item.schoolId || item.escolaId || mergedReg?.escolaId || existingAdmin?.schoolId,
                presenceRate: typeof item.presenceRate === 'number' ? item.presenceRate : (existingAdmin?.presenceRate ?? 100),
                subject,
                gender: (item.gender || (item.sexo === 'Feminino' || mergedReg?.sexo === 'Feminino' ? 'F' : 'M')) as 'M' | 'F',
                qualification: item.qualification || item.nivelAcademico || mergedReg?.nivelAcademico || existingAdmin?.qualification,
                assignedTurmas,
                registrationData: mergedReg || existingAdmin?.registrationData,
              };
              adminMap.set(key, { ...(existingAdmin || {}), ...adminObj });

              const shiftVal = (
                item.shift ||
                item.primaryShift ||
                mergedReg?.primaryShift ||
                primaryTurmaEntry?.shift ||
                existingDir?.shift ||
                (item.turnos?.[0] === 'Tarde' || mergedReg?.turnos?.[0] === 'Tarde' ? 'Tarde' : 'Manhã')
              ) as 'Manhã' | 'Tarde' | 'Integral';

              const dirObj: DirectorTeacher = {
                id: adminObj.id,
                name: adminObj.name,
                schoolName: adminObj.schoolName,
                gradeClass: adminObj.gradeClass,
                room: adminObj.room,
                turma: adminObj.turma,
                directorName: item.directorName || existingDir?.directorName || 'Direção Escolar',
                location: adminObj.location,
                subject: adminObj.subject,
                presenceRate: adminObj.presenceRate,
                shift: shiftVal,
                phone: adminObj.phone,
                email: email || undefined,
                assignedTurmas,
                registrationData: adminObj.registrationData,
                schedule: item.schedule || existingDir?.schedule || [
                  {
                    day: 'Segunda',
                    period: shiftVal === 'Tarde' ? '13h00 - 17h15' : '07h30 - 12h00',
                    subject: adminObj.subject,
                    room: adminObj.room,
                  },
                ],
              };
              dirMap.set(key, { ...(existingDir || {}), ...dirObj });
            };

            localReg.forEach(ingestTeacherItem);
            localAdmin.forEach(ingestTeacherItem);
            localDir.forEach(ingestTeacherItem);
            cloudTeachers.forEach(ingestTeacherItem);

            const c1 = safeWriteJsonIfChanged('ucore_registered_teachers_v2', Array.from(regMap.values()));
            const c2 = safeWriteJsonIfChanged('ucore_admin_teachers', Array.from(adminMap.values()));
            const c3 = safeWriteJsonIfChanged('ucore_director_teachers_v1', Array.from(dirMap.values()));

            if (c1 || c2 || c3) {
              window.dispatchEvent(new CustomEvent('ucore-teachers-updated'));
              window.dispatchEvent(new CustomEvent('sigre-data-synced'));
            }
          } catch (e) {
            console.warn('[UnifiedSync] Erro ao unificar professores:', e);
          }
        },
        scopedSchoolId ? { schoolId: scopedSchoolId } : undefined
      )
    );
  }

  // 3. REAL-TIME STUDENTS UNIFICATION (Bounded limit 30)
  if (enabledCols.has('students')) {
    unsubs.push(
      subscribeToStudents(
        (cloudStudents) => {
          try {
            const localReg = safeReadJsonArray<StudentRegistrationData>('ucore_registered_students_v2');
            const localAdmin = safeReadJsonArray<AdminStudent>('ucore_admin_students');
            const localDir = safeReadJsonArray<DirectorStudent>('ucore_director_students');
            const localTeacher = safeReadJsonArray<any>('ucore_teacher_students');

            const regMap = new Map<string, StudentRegistrationData>();
            const adminMap = new Map<string, AdminStudent>();
            const dirMap = new Map<string, DirectorStudent>();
            const teacherMap = new Map<string, any>();

            const ingestStudentItem = (item: any) => {
              if (!item || isBannedSchoolOrEntity(item)) return;
              const id = String(item.id || '').trim();
              const name = String(item.nomeCompleto || item.name || item.registrationData?.nomeCompleto || '').trim();
              if (!id && !name) return;
              if (isEntityTombstoned(STUDENTS_COL, id) || isEntityTombstoned(STUDENTS_COL, name)) return;

              const schoolName = String(
                item.escola || item.schoolName || item.registrationData?.escola || 'Escola Oficial'
              ).trim();
              if (isBannedSchoolOrEntity(schoolName)) return;

              const key = norm(id || `${name}::${schoolName}`);
              const studentId = id || `std-${Math.abs(key.split('').reduce((a, c) => a + c.charCodeAt(0), 1000))}`;
              const genero: 'M' | 'F' =
                item.genero === 'M' || item.gender === 'M' || item.registrationData?.genero === 'M' ? 'M' : 'F';
              const classe = String(
                item.classeEtapaModulo || item.classe || item.gradeClass || item.registrationData?.classe || '1.ª Classe'
              );
              const turma = String(item.turma || item.registrationData?.turma || 'Turma A');
              const sala = String(item.sala || item.room || item.registrationData?.sala || 'Sala 01');
              const tipoDoc = item.tipoDocumento || item.documentType || item.registrationData?.tipoDocumento || (item.hasDocuments === false ? 'sem Documento' : 'BI');
              const hasDocs = tipoDoc !== 'sem Documento';
              const encarregado = String(
                item.encarregado || item.guardianName || item.registrationData?.encarregado || 'Encarregado de Educação'
              );
              const endereco = String(
                item.endereco || item.location || item.registrationData?.endereco || 'Quêssua, Malanje'
              );
              const dataNascimento = String(
                item.dataNascimento || item.registrationData?.dataNascimento || '2016-05-10'
              );
              const idade = Number(item.idade ?? item.age ?? item.registrationData?.idade ?? 9);

              const flatStudentBase = extractFlatRegistrationData(item) || {};
              const regObj: StudentRegistrationData = {
                ...(regMap.get(key) || {}),
                ...flatStudentBase,
                id: studentId,
                name,
                nomeCompleto: name,
                genero,
                dataNascimento,
                idade,
                tipoDocumento: tipoDoc as any,
                numeroDocumento: item.numeroDocumento || item.registrationData?.numeroDocumento,
                naturezaEscola: item.naturezaEscola || item.schoolType || item.registrationData?.naturezaEscola || 'Pública',
                tipoEscolaModalidade: item.tipoEscolaModalidade || item.registrationData?.tipoEscolaModalidade || 'primario_regular',
                classeEtapaModulo: classe,
                classe,
                turma,
                sala,
                escola: schoolName,
                schoolId: item.schoolId || item.registrationData?.schoolId,
                condicaoMatricula: item.condicaoMatricula || item.registrationData?.condicaoMatricula || 'primeira_vez',
                alunoRepetente: Boolean(item.alunoRepetente || item.condicaoMatricula === 'repetente'),
                encarregado,
                telefone: item.telefone || item.registrationData?.telefone || '+244 923 000 000',
                endereco,
              };
              delete (regObj as any).registrationData;
              regMap.set(key, regObj);

              const adminObj: AdminStudent = {
                id: studentId,
                name,
                gender: genero,
                gradeClass: classe,
                room: sala,
                turma,
                guardianName: encarregado,
                location: endereco,
                presenceRate: typeof item.presenceRate === 'number' ? item.presenceRate : 98,
                hasDocuments: hasDocs,
                documentType: tipoDoc,
                numeroDocumento: regObj.numeroDocumento,
                dataNascimento,
                idade,
                condicaoMatricula: regObj.condicaoMatricula,
                foto: item.foto || regObj.foto,
                anexoDocumentoNome: item.anexoDocumentoNome || regObj.anexoDocumentoNome,
                performanceScore: typeof item.performanceScore === 'number' ? item.performanceScore : 8.5,
                schoolName,
                schoolId: regObj.schoolId,
                schoolType: regObj.naturezaEscola,
                registrationData: regObj,
              };
              adminMap.set(key, adminObj);

              const dirObj: DirectorStudent = {
                id: studentId,
                name,
                gradeClass: classe,
                room: sala,
                turma,
                teacherName: item.teacherName || 'Corpo Docente',
                guardianName: encarregado,
                location: endereco,
                hasDocuments: hasDocs,
                documentType: tipoDoc,
                numeroDocumento: regObj.numeroDocumento,
                dataNascimento,
                idade,
                condicaoMatricula: regObj.condicaoMatricula,
                foto: adminObj.foto,
                anexoDocumentoNome: adminObj.anexoDocumentoNome,
                performanceScore: adminObj.performanceScore,
                presenceRate: adminObj.presenceRate,
              };
              dirMap.set(key, dirObj);

              const existingTeacherSt = teacherMap.get(key);
              const teacherStObj = {
                ...(existingTeacherSt || {}),
                id: studentId,
                name,
                numeroChamada: existingTeacherSt?.numeroChamada || teacherMap.size + 1,
                sala,
                turma,
                periodo: item.periodo || regObj.periodo || 'Manhã',
                classe,
                genero,
                idade,
                dataNascimento,
                condicaoMatricula: regObj.condicaoMatricula,
                foto: adminObj.foto,
                tipoDocumento: tipoDoc,
                numeroDocumento: regObj.numeroDocumento,
                anexoDocumentoNome: adminObj.anexoDocumentoNome,
                temDocumentos: hasDocs,
                nomePai: item.nomePai || regObj.nomePai,
                nomeMae: item.nomeMae || regObj.nomeMae,
                encarregado,
                parentescoEncarregado: item.parentescoEncarregado || regObj.parentescoEncarregado,
                telefone: regObj.telefone,
                endereco,
                observacoes: item.observacoes || regObj.observacoes,
                presencaPercent: item.presencaPercent ?? existingTeacherSt?.presencaPercent ?? 100,
                faltas: item.faltas ?? existingTeacherSt?.faltas ?? 0,
                disciplinas: item.disciplinas || existingTeacherSt?.disciplinas || defaultDisciplinasList,
                grades:
                  item.grades ||
                  existingTeacherSt?.grades ||
                  defaultDisciplinasList.map((disc) => ({
                    subject: disc,
                    p1: 0,
                    p2: 0,
                    trabalho: 0,
                    media: 0,
                    status: 'Aprovado' as const,
                  })),
              };
              teacherMap.set(key, teacherStObj);
            };

            localReg.forEach(ingestStudentItem);
            localAdmin.forEach(ingestStudentItem);
            localDir.forEach(ingestStudentItem);
            localTeacher.forEach(ingestStudentItem);
            cloudStudents.forEach(ingestStudentItem);

            const unifiedAdminStudents = Array.from(adminMap.values());
            const c1 = safeWriteJsonIfChanged('ucore_registered_students_v2', Array.from(regMap.values()));
            const c2 = safeWriteJsonIfChanged('ucore_admin_students', unifiedAdminStudents);
            const c3 = safeWriteJsonIfChanged('ucore_director_students', Array.from(dirMap.values()));
            const c4 = safeWriteJsonIfChanged('ucore_teacher_students', Array.from(teacherMap.values()));

            if (c1 || c2 || c3 || c4) {
              window.dispatchEvent(new CustomEvent('sigre-data-synced'));
            }
          } catch (e) {
            console.warn('[UnifiedSync] Erro ao unificar alunos:', e);
          }
        },
        scopedSchoolId ? { schoolId: scopedSchoolId } : undefined
      )
    );
  }

  // 4. REAL-TIME DIRECTORS & DME STAFF UNIFICATION (Bounded limit 30)
  if (enabledCols.has('directors')) {
    unsubs.push(
      subscribeToDirectors((cloudDirs) => {
        try {
          const localReg = safeReadJsonArray<DirectorRegistrationData>('ucore_registered_directors_v2');
          const localAdmin = safeReadJsonArray<AdminDirector>('ucore_admin_directors');
          const regMap = new Map<string, DirectorRegistrationData>();
          const adminMap = new Map<string, AdminDirector>();

          const ingestDirector = (item: any) => {
            if (!item || isBannedSchoolOrEntity(item)) return;
            const id = String(item.id || '').trim();
            const name = String(item.nomeCompleto || item.name || item.registrationData?.nomeCompleto || '').trim();
            if (!id && !name) return;
            if (isEntityTombstoned(DIRECTORS_COL, id) || isEntityTombstoned(DIRECTORS_COL, name)) return;

            const schoolName = String(
              item.nomeEscola || item.schoolName || item.registrationData?.nomeEscola || ''
            ).trim();
            if (isBannedSchoolOrEntity(schoolName)) return;

            const key = norm(id || name);
            const regData = extractFlatRegistrationData(item) as DirectorRegistrationData | undefined;
            if (regData && regData.nomeCompleto) {
              regMap.set(key, { ...(regMap.get(key) || {}), ...regData });
            }

            const adminObj: AdminDirector = {
              id: id || `dir-${Date.now()}`,
              name,
              schoolName: schoolName || 'Unidade Escolar Municipal',
              phone: item.phone || item.telefone || regData?.telefone || '+244 923 000 000',
              email: item.email || item.emailInstitucional || item.emailPessoal || regData?.emailPessoal || '',
              appointmentYear: item.appointmentYear || (regData?.dataNomeacao ? parseInt(regData.dataNomeacao.split('-')[0], 10) : 2026) || 2026,
              status: item.status || (regData?.situacaoMandato === 'Anterior / Histórico' ? 'Anterior' : 'Ativo'),
              performanceRating: item.performanceRating ?? 95,
              teachersCount: item.teachersCount ?? regData?.professoresSobDirecao ?? 0,
              studentsCount: item.studentsCount ?? regData?.alunosSobDirecao ?? 0,
              location: item.location || `${regData?.municipioEscola || 'Quêssua'}`,
              registrationData: regData || adminMap.get(key)?.registrationData,
            };
            adminMap.set(key, { ...(adminMap.get(key) || {}), ...adminObj });
          };

          localReg.forEach(ingestDirector);
          localAdmin.forEach(ingestDirector);
          cloudDirs.forEach(ingestDirector);

          const c1 = safeWriteJsonIfChanged('ucore_registered_directors_v2', Array.from(regMap.values()));
          const c2 = safeWriteJsonIfChanged('ucore_admin_directors', Array.from(adminMap.values()));
          if (c1 || c2) {
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch (e) {
          console.warn('[UnifiedSync] Erro ao unificar diretores:', e);
        }
      })
    );
  }

  if (enabledCols.has('dme_staff')) {
    unsubs.push(
      subscribeToDmeStaff((cloudStaff) => {
        try {
          const localStaff = safeReadJsonArray<any>('ucore_dme_staff_list');
          const map = new Map<string, any>();
          localStaff.forEach((s) => {
            if (!s || isBannedSchoolOrEntity(s)) return;
            const k = norm(s.id || s.email || s.role);
            if (!k || isEntityTombstoned(DME_STAFF_COL, k)) return;
            map.set(k, s);
          });
          cloudStaff.forEach((cs) => {
            if (!cs || isBannedSchoolOrEntity(cs)) return;
            const k = norm(cs.id || cs.email || cs.role);
            if (!k || isEntityTombstoned(DME_STAFF_COL, k)) return;
            map.set(k, { ...(map.get(k) || {}), ...cs });
          });
          if (safeWriteJsonIfChanged('ucore_dme_staff_list', Array.from(map.values()))) {
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch (e) {
          console.warn('[UnifiedSync] Erro ao unificar equipa DME:', e);
        }
      })
    );
  }

  // 5. REAL-TIME EFECTIVIDADE UNIFICATION (Bounded limit 30)
  if (enabledCols.has('efectividade')) {
    unsubs.push(
      subscribeToEfectividade((cloudRecords) => {
        try {
          const localRecs = safeReadJsonArray<any>('sigre_cadastramento_efectividade_v2');
          const deletedRaw = safeReadJsonArray<string>('sigre_deleted_efectividade_ids_v2');
          const deletedSet = new Set(deletedRaw.map((id) => norm(id)));
          const map = new Map<string, any>();

          localRecs.forEach((lr) => {
            if (!lr || !lr.id || isBannedSchoolOrEntity(lr)) return;
            if (deletedSet.has(norm(lr.id)) || isEntityTombstoned(EFECTIVIDADE_COL, lr.id)) return;
            map.set(lr.id, lr);
          });
          cloudRecords.forEach((cr) => {
            if (!cr || !cr.id || isBannedSchoolOrEntity(cr)) return;
            if (deletedSet.has(norm(cr.id)) || isEntityTombstoned(EFECTIVIDADE_COL, cr.id)) return;
            map.set(cr.id, { ...(map.get(cr.id) || {}), ...cr });
          });

          const merged = Array.from(map.values());
          if (safeWriteJsonIfChanged('sigre_cadastramento_efectividade_v2', merged)) {
            window.dispatchEvent(new CustomEvent('sigre-efectividade-updated', { detail: { records: merged } }));
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch (e) {
          console.warn('[UnifiedSync] Erro ao unificar efectividade:', e);
        }
      })
    );
  }

  // 5B. REAL-TIME DECLARAÇÃO DE SERVIÇO UNIFICATION (Bounded limit 30)
  if (enabledCols.has('declaracao_servico')) {
    unsubs.push(
      subscribeToDeclaracaoServico((cloudRecords) => {
        try {
          const localRecs = safeReadJsonArray<any>('sigre_declaracao_servico_v1');
          const deletedRaw = safeReadJsonArray<string>('sigre_deleted_declaracao_servico_ids_v1');
          const deletedSet = new Set(deletedRaw.map((id) => norm(id)));
          const map = new Map<string, any>();

          localRecs.forEach((lr) => {
            if (!lr || !lr.id || isBannedSchoolOrEntity(lr)) return;
            if (deletedSet.has(norm(lr.id)) || isEntityTombstoned(DECLARACAO_SERVICO_COL, lr.id)) return;
            map.set(lr.id, lr);
          });
          cloudRecords.forEach((cr) => {
            if (!cr || !cr.id || isBannedSchoolOrEntity(cr)) return;
            if (deletedSet.has(norm(cr.id)) || isEntityTombstoned(DECLARACAO_SERVICO_COL, cr.id)) return;
            map.set(cr.id, { ...(map.get(cr.id) || {}), ...cr });
          });

          const merged = Array.from(map.values());
          if (safeWriteJsonIfChanged('sigre_declaracao_servico_v1', merged)) {
            window.dispatchEvent(new CustomEvent('sigre-declaracao-servico-updated', { detail: { records: merged } }));
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch (e) {
          console.warn('[UnifiedSync] Erro ao unificar Declaração de Serviço:', e);
        }
      })
    );
  }

  // 5C. REAL-TIME OUTROS FUNCIONÁRIOS (Bounded limit 30)
  if (enabledCols.has('staff')) {
    unsubs.push(
      subscribeToStaff((cloudStaff) => {
        try {
          const localStaff = safeReadJsonArray<any>('ucore_registered_staff_v1');
          const map = new Map<string, any>();
          localStaff.forEach((ls) => {
            if (!ls || isBannedSchoolOrEntity(ls)) return;
            const k = norm(ls.id || ls.bi || ls.agente || ls.nomeCompleto || ls.name);
            if (!k || isEntityTombstoned(STAFF_COL, k) || (ls.id && isEntityTombstoned(STAFF_COL, ls.id))) return;
            map.set(k, ls);
          });
          cloudStaff.forEach((cs) => {
            if (!cs || isBannedSchoolOrEntity(cs)) return;
            const k = norm(cs.id || cs.bi || cs.agente || cs.nomeCompleto || cs.name);
            if (!k || isEntityTombstoned(STAFF_COL, k) || (cs.id && isEntityTombstoned(STAFF_COL, cs.id))) return;
            map.set(k, { ...(map.get(k) || {}), ...cs });
          });
          const merged = Array.from(map.values());
          if (safeWriteJsonIfChanged('ucore_registered_staff_v1', merged)) {
            window.dispatchEvent(new CustomEvent('sigre-staff-updated', { detail: { records: merged } }));
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch (e) {
          console.warn('[UnifiedSync] Erro ao unificar outros funcionários:', e);
        }
      })
    );
  }

  // 6. REAL-TIME MINI-PAUTAS / GRADES (Bounded limit 30)
  if (enabledCols.has('grades')) {
    unsubs.push(
      subscribeToMiniPautas((cloudPautas) => {
        try {
          const localPautas = safeReadJsonArray<any>('sigre_teacher_mini_pautas_v5_blank');
          const map = new Map<string, any>();
          const getKey = (r: any) =>
            `${norm(r.classe)}::${norm(r.turma)}::${norm(r.disciplina)}::${norm(r.schoolName)}`;
          localPautas.forEach((lp) => {
            if (!lp || isBannedSchoolOrEntity(lp)) return;
            map.set(getKey(lp), lp);
          });
          cloudPautas.forEach((cp) => {
            if (!cp || isBannedSchoolOrEntity(cp)) return;
            const k = getKey(cp);
            map.set(k, { ...(map.get(k) || {}), ...cp });
          });
          if (safeWriteJsonIfChanged('sigre_teacher_mini_pautas_v5_blank', Array.from(map.values()))) {
            window.dispatchEvent(new CustomEvent('sigre-minipautas-updated'));
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch (e) {
          console.warn('[UnifiedSync] Erro ao unificar mini-pautas:', e);
        }
      })
    );
  }

  // 7. REAL-TIME ATTENDANCE (Bounded limit 30)
  if (enabledCols.has('attendance')) {
    unsubs.push(
      subscribeToAttendance((cloudAttendance) => {
        try {
          const localStudentsAtt = safeReadJsonArray<any>('ucore_student_attendance_records_v2');
          const localTeachersAtt = safeReadJsonArray<any>('ucore_teacher_attendance_records_v2');
          const stuMap = new Map<string, any>();
          const teaMap = new Map<string, any>();

          localStudentsAtt.forEach((r) => {
            if (!r || !r.studentId || !r.date || isBannedSchoolOrEntity(r)) return;
            stuMap.set(`${r.studentId}_${r.date}`, r);
          });
          localTeachersAtt.forEach((r) => {
            if (!r || !r.teacherId || !r.date || isBannedSchoolOrEntity(r)) return;
            teaMap.set(`${r.teacherId}_${r.date}`, r);
          });
          cloudAttendance.forEach((ca) => {
            if (!ca || isBannedSchoolOrEntity(ca)) return;
            if (ca.attendanceKind === 'student' || ca.studentId) {
              const k = `${ca.studentId}_${ca.date}`;
              stuMap.set(k, { ...(stuMap.get(k) || {}), ...ca });
            } else if (ca.attendanceKind === 'teacher' || ca.teacherId) {
              const k = `${ca.teacherId}_${ca.date}`;
              teaMap.set(k, { ...(teaMap.get(k) || {}), ...ca });
            }
          });
          const c1 = safeWriteJsonIfChanged('ucore_student_attendance_records_v2', Array.from(stuMap.values()));
          const c2 = safeWriteJsonIfChanged('ucore_teacher_attendance_records_v2', Array.from(teaMap.values()));
          if (c1 || c2) {
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch (e) {
          console.warn('[UnifiedSync] Erro ao unificar presenças:', e);
        }
      })
    );
  }

  // 8. REAL-TIME ANNOUNCEMENTS, ROOMS, CLASSES (Bounded limit 30)
  if (enabledCols.has('announcements')) {
    unsubs.push(
      subscribeToAnnouncements((cloudAnn) => {
        try {
          const localAnn = safeReadJsonArray<SchoolAnnouncement>('ucore_school_announcements_v1');
          const map = new Map<string, SchoolAnnouncement>();
          localAnn.forEach((la) => {
            if (!la || !la.id || isEntityTombstoned(ANNOUNCEMENTS_COL, la.id) || isBannedSchoolOrEntity(la)) return;
            map.set(la.id, la);
          });
          cloudAnn.forEach((ca) => {
            if (!ca || !ca.id || isEntityTombstoned(ANNOUNCEMENTS_COL, ca.id) || isBannedSchoolOrEntity(ca)) return;
            map.set(ca.id, { ...(map.get(ca.id) || {}), ...ca });
          });
          if (safeWriteJsonIfChanged('ucore_school_announcements_v1', Array.from(map.values()))) {
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch {}
      })
    );
  }

  if (enabledCols.has('rooms')) {
    unsubs.push(
      subscribeToRooms((cloudRooms) => {
        try {
          const localRooms = safeReadJsonArray<DirectorRoom>('ucore_director_rooms');
          const map = new Map<string, DirectorRoom>();
          localRooms.forEach((lr) => {
            if (!lr || !lr.id || isEntityTombstoned(ROOMS_COL, lr.id) || isBannedSchoolOrEntity(lr)) return;
            map.set(lr.id, lr);
          });
          cloudRooms.forEach((cr) => {
            if (!cr || !cr.id || isEntityTombstoned(ROOMS_COL, cr.id) || isBannedSchoolOrEntity(cr)) return;
            map.set(cr.id, { ...(map.get(cr.id) || {}), ...cr });
          });
          if (safeWriteJsonIfChanged('ucore_director_rooms', Array.from(map.values()))) {
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch {}
      })
    );
  }

  if (enabledCols.has('classes')) {
    unsubs.push(
      subscribeToClasses((cloudClasses) => {
        try {
          const localClasses = safeReadJsonArray<DirectorClass>('ucore_director_classes');
          const map = new Map<string, DirectorClass>();
          localClasses.forEach((lc) => {
            if (!lc || !lc.id || isEntityTombstoned(CLASSES_COL, lc.id) || isBannedSchoolOrEntity(lc)) return;
            map.set(lc.id, lc);
          });
          cloudClasses.forEach((cc) => {
            if (!cc || !cc.id || isEntityTombstoned(CLASSES_COL, cc.id) || isBannedSchoolOrEntity(cc)) return;
            map.set(cc.id, { ...(map.get(cc.id) || {}), ...cc });
          });
          if (safeWriteJsonIfChanged('ucore_director_classes', Array.from(map.values()))) {
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch {}
      })
    );
  }

  // 9. REAL-TIME GUIAS, FICHAS, CADASTRO DOCENTE & ACTIVE USERS (Bounded limit 30)
  if (enabledCols.has('guias_ferias')) {
    unsubs.push(
      subscribeToGuiasFerias((cloudGuias) => {
        try {
          const localGuias = safeReadJsonArray<any>('sigre_guias_ferias_records_v1');
          const map = new Map<string, any>();
          localGuias.forEach((lg) => {
            if (!lg || !lg.id || isEntityTombstoned(GUIAS_FERIAS_COL, lg.id) || isBannedSchoolOrEntity(lg)) return;
            map.set(lg.id, lg);
          });
          cloudGuias.forEach((cg) => {
            if (!cg || !cg.id || isEntityTombstoned(GUIAS_FERIAS_COL, cg.id) || isBannedSchoolOrEntity(cg)) return;
            map.set(cg.id, { ...(map.get(cg.id) || {}), ...cg });
          });
          if (safeWriteJsonIfChanged('sigre_guias_ferias_records_v1', Array.from(map.values()))) {
            window.dispatchEvent(new CustomEvent('sigre-guia-ferias-updated'));
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch {}
      })
    );
  }

  if (enabledCols.has('guias_colocacao')) {
    unsubs.push(
      subscribeToGuiasColocacao((cloudGuias) => {
        try {
          const localGuias = safeReadJsonArray<any>('sigre_guias_colocacao_records_v1');
          const map = new Map<string, any>();
          localGuias.forEach((lg) => {
            if (!lg || !lg.id || isEntityTombstoned(GUIAS_COLOCACAO_COL, lg.id) || isBannedSchoolOrEntity(lg)) return;
            map.set(lg.id, lg);
          });
          cloudGuias.forEach((cg) => {
            if (!cg || !cg.id || isEntityTombstoned(GUIAS_COLOCACAO_COL, cg.id) || isBannedSchoolOrEntity(cg)) return;
            map.set(cg.id, { ...(map.get(cg.id) || {}), ...cg });
          });
          if (safeWriteJsonIfChanged('sigre_guias_colocacao_records_v1', Array.from(map.values()))) {
            window.dispatchEvent(new CustomEvent('sigre-guia-colocacao-updated'));
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch {}
      })
    );
  }

  if (enabledCols.has('fichas_avaliacao')) {
    unsubs.push(
      subscribeToFichasAvaliacao((cloudFichas) => {
        try {
          const localFichas = safeReadJsonArray<any>('sigre_fichas_avaliacao_records_v1');
          const map = new Map<string, any>();
          localFichas.forEach((lf) => {
            if (!lf || !lf.id || isEntityTombstoned(FICHAS_AVALIACAO_COL, lf.id) || isBannedSchoolOrEntity(lf)) return;
            map.set(lf.id, lf);
          });
          cloudFichas.forEach((cf) => {
            if (!cf || !cf.id || isEntityTombstoned(FICHAS_AVALIACAO_COL, cf.id) || isBannedSchoolOrEntity(cf)) return;
            map.set(cf.id, { ...(map.get(cf.id) || {}), ...cf });
          });
          if (safeWriteJsonIfChanged('sigre_fichas_avaliacao_records_v1', Array.from(map.values()))) {
            window.dispatchEvent(new CustomEvent('sigre-ficha-avaliacao-updated'));
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch {}
      })
    );
  }

  if (enabledCols.has('cadastro_docente')) {
    unsubs.push(
      subscribeToCadastroDocente((cloudCadastros) => {
        try {
          const localCadastros = safeReadJsonArray<any>('cadastro-docente-registos');
          const map = new Map<string, any>();
          localCadastros.forEach((lc) => {
            if (!lc || !lc.id || isEntityTombstoned(CADASTRO_DOCENTE_COL, lc.id) || isBannedSchoolOrEntity(lc)) return;
            map.set(String(lc.id), lc);
          });
          cloudCadastros.forEach((cc) => {
            if (!cc || !cc.id || isEntityTombstoned(CADASTRO_DOCENTE_COL, cc.id) || isBannedSchoolOrEntity(cc)) return;
            map.set(String(cc.id), { ...(map.get(String(cc.id)) || {}), ...cc });
          });
          const merged = Array.from(map.values());
          if (safeWriteJsonIfChanged('cadastro-docente-registos', merged)) {
            window.dispatchEvent(new CustomEvent('sigre-cadastro-docente-updated', { detail: { records: merged } }));
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch {}
      })
    );
  }

  // Pending Users queue listener (Rule 2: status == 'pendente', limit 30)
  if (enabledCols.has('users_pending')) {
    unsubs.push(
      subscribeToUsers((cloudUsers) => {
        try {
          const localUsers = safeReadJsonArray<UserAccount>('ucore_registered_users');
          const localApps = safeReadJsonArray<PendingApplication>('ucore_pending_applications');
          const approvedEmails = new Set<string>();
          const approvedIds = new Set<string>();
          localApps.forEach((a) => {
            if (a && (a.status === 'aprovado' || Boolean(a.approvedAt))) {
              if (a.email) approvedEmails.add(norm(a.email));
              if (a.userId) approvedIds.add(norm(a.userId));
              if (a.id) approvedIds.add(norm(a.id));
            }
          });

          const map = new Map<string, UserAccount>();
          localUsers.forEach((lu) => {
            if (!lu || !lu.email || isBannedSchoolOrEntity(lu)) return;
            if (
              isEntityTombstoned(USERS_COL, lu.email) ||
              (lu.id && isEntityTombstoned(USERS_COL, lu.id)) ||
              isEntityTombstoned(APPLICATIONS_COL, lu.email) ||
              (lu.id && isEntityTombstoned(APPLICATIONS_COL, lu.id))
            ) {
              return;
            }
            const k = norm(lu.email);
            const isApproved = approvedEmails.has(k) || (lu.id ? approvedIds.has(norm(lu.id)) : false);
            const normalizedLocal: UserAccount = isApproved && lu.status !== 'ativo' ? { ...lu, status: 'ativo' } : lu;
            map.set(k, normalizedLocal);
          });
          cloudUsers.forEach((cu) => {
            if (!cu || !cu.email || isBannedSchoolOrEntity(cu)) return;
            if (
              isEntityTombstoned(USERS_COL, cu.email) ||
              (cu.id && isEntityTombstoned(USERS_COL, cu.id)) ||
              isEntityTombstoned(APPLICATIONS_COL, cu.email) ||
              (cu.id && isEntityTombstoned(APPLICATIONS_COL, cu.id))
            ) {
              return;
            }
            const k = norm(cu.email);
            const prev = map.get(k);
            const isApproved =
              prev?.status === 'ativo' ||
              cu.status === 'ativo' ||
              approvedEmails.has(k) ||
              (cu.id ? approvedIds.has(norm(cu.id)) : false);
            const mergedUser: UserAccount = {
              ...(prev || {}),
              ...cu,
              status: isApproved ? 'ativo' : cu.status || prev?.status || 'pendente',
            };
            map.set(k, mergedUser);
          });
          if (safeWriteJsonIfChanged('ucore_registered_users', Array.from(map.values()))) {
            window.dispatchEvent(new CustomEvent('sigre-users-updated'));
            window.dispatchEvent(new CustomEvent('sigre-data-synced'));
          }
        } catch {}
      })
    );
  }

  activeRealtimeScopeKey = scopeKey;
  globalRealtimeUnsubscribe = () => {
    unsubs.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
    globalRealtimeUnsubscribe = null;
    activeRealtimeScopeKey = null;
  };

  return globalRealtimeUnsubscribe;
}

export function initUnifiedRealtimeDatabaseSync(): () => void {
  return initViewScopedRealtimeSync();
}

/**
 * Flushes all local collections (schools, directors, dmeStaff, teachers, students, staff, applications,
 * efectividade, declaracaoServico, guiasFerias, guiasColocacao, fichasAvaliacao, cadastroDocente,
 * miniPautas, rooms, classes, users, quickRequests, tombstones)
 * to both the shared backend disk store (/api/network/sync) and Firestore cloud database.
 */
export async function flushAllLocalDataToCloudAndServer(useBeaconOrKeepalive: boolean = false): Promise<void> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const schools = safeReadJsonArray<AdminSchool>('ucore_admin_schools').filter((s) => !isBannedSchoolOrEntity(s));
    const directors = safeReadJsonArray<any>('ucore_admin_directors').filter((d) => !isBannedSchoolOrEntity(d));
    const regDirectors = safeReadJsonArray<any>('ucore_registered_directors_v2').filter((d) => !isBannedSchoolOrEntity(d));
    const dmeStaff = safeReadJsonArray<any>('ucore_dme_staff_list').filter((s) => !isBannedSchoolOrEntity(s));
    const teachers = safeReadJsonArray<any>('ucore_admin_teachers').filter((t) => !isBannedSchoolOrEntity(t));
    const regTeachers = safeReadJsonArray<any>('ucore_registered_teachers_v2').filter((t) => !isBannedSchoolOrEntity(t));
    const dirTeachers = safeReadJsonArray<any>('ucore_director_teachers_v1').filter((t) => !isBannedSchoolOrEntity(t));
    const students = safeReadJsonArray<any>('ucore_admin_students').filter((s) => !isBannedSchoolOrEntity(s));
    const regStudents = safeReadJsonArray<any>('ucore_registered_students_v2').filter((s) => !isBannedSchoolOrEntity(s));
    const dirStudents = safeReadJsonArray<any>('ucore_director_students').filter((s) => !isBannedSchoolOrEntity(s));
    const staff = safeReadJsonArray<any>('ucore_registered_staff_v1').filter((s) => !isBannedSchoolOrEntity(s));
    const applications = safeReadJsonArray<any>('ucore_pending_applications').filter((a) => !isBannedSchoolOrEntity(a));
    const quickRequestsPrimary = safeReadJsonArray<any>('sigre_quick_services_local_cache');
    const quickRequestsLegacy = safeReadJsonArray<any>('ucore_quick_service_requests_v1');
    const quickRequests = [...quickRequestsLegacy, ...quickRequestsPrimary].filter((q) => !isBannedSchoolOrEntity(q));
    const efectividade = safeReadJsonArray<any>('sigre_cadastramento_efectividade_v2').filter((e) => !isBannedSchoolOrEntity(e));
    const declaracaoServico = safeReadJsonArray<any>('sigre_declaracao_servico_v1').filter((d) => !isBannedSchoolOrEntity(d));
    const guiasFerias = safeReadJsonArray<any>('sigre_guias_ferias_records_v1').filter((g) => !isBannedSchoolOrEntity(g));
    const guiasColocacao = safeReadJsonArray<any>('sigre_guias_colocacao_records_v1').filter((g) => !isBannedSchoolOrEntity(g));
    const fichasAvaliacao = safeReadJsonArray<any>('sigre_fichas_avaliacao_records_v1').filter((f) => !isBannedSchoolOrEntity(f));
    const cadastroDocente = safeReadJsonArray<any>('cadastro-docente-registos').filter((c) => !isBannedSchoolOrEntity(c));
    const miniPautas = safeReadJsonArray<any>('sigre_teacher_mini_pautas_v5_blank').filter((m) => !isBannedSchoolOrEntity(m));
    const rooms = safeReadJsonArray<any>('ucore_director_rooms').filter((r) => !isBannedSchoolOrEntity(r));
    const classes = safeReadJsonArray<any>('ucore_director_classes').filter((c) => !isBannedSchoolOrEntity(c));
    const users = safeReadJsonArray<any>('ucore_registered_users').filter((u) => !isBannedSchoolOrEntity(u));
    const payload = {
      schools,
      directors: directors.length > 0 ? directors : regDirectors,
      dmeStaff,
      teachers: teachers.length > 0 ? teachers : regTeachers.length > 0 ? regTeachers : dirTeachers,
      students: students.length > 0 ? students : regStudents.length > 0 ? regStudents : dirStudents,
      staff,
      applications,
      quickRequests,
      efectividade,
      declaracaoServico,
      guiasFerias,
      guiasColocacao,
      fichasAvaliacao,
      cadastroDocente,
      miniPautas,
      rooms,
      classes,
      users,
    };

    if (!isExpressApiAvailable()) {
      return;
    }

    const jsonBody = JSON.stringify(payload);

    if (useBeaconOrKeepalive && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([jsonBody], { type: 'application/json' });
        navigator.sendBeacon('/api/network/sync', blob);
        return;
      } catch {}
    }

    await fetch('/api/network/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonBody,
      keepalive: useBeaconOrKeepalive,
    }).catch(() => null);
  } catch {}
}
