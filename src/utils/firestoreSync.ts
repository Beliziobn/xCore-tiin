import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
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
const TOMBSTONES_COL = 'tombstones';

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
          setDoc(
            doc(db, TOMBSTONES_COL, tombDocId),
            { key: tombKey, col, id: cleanId, deletedAt: new Date().toISOString() },
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

    const rawPayload: Record<string, any> = {
      ...app,
      id: app.id || docId,
      ...(normBi ? { biNumber: normBi } : {}),
      targetApproverRole: 'admin',
      targetApproverEmail: 'dmedoquessua@gmail.com',
      approverDirectorName: 'Director Municipal da Educação (dmedoquessua@gmail.com)',
      status: safeStatus,
      _updatedAt: Date.now(),
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
    await setDoc(ref, cleanObject(rawPayload), { merge: true });
    return true;
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao gravar candidatura no Firestore:', error);
    return false;
  }
}

export interface FirestoreApplicationsFetchResult {
  apps: PendingApplication[];
  ok: boolean;
  quotaExhausted: boolean;
}

export async function fetchApplicationsFromFirestoreWithStatus(): Promise<FirestoreApplicationsFetchResult> {
  if (isFirestoreReadQuotaExhausted()) {
    return { apps: [], ok: false, quotaExhausted: true };
  }
  try {
    const ref = collection(db, APPLICATIONS_COL);
    const snapshot = await Promise.race([
      getDocs(ref),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore read timeout')), 5000)),
    ]);
    const list: PendingApplication[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as PendingApplication);
    });
    if (firestoreReadCooldownUntil !== 0) {
      firestoreReadCooldownUntil = 0;
      notifyFirestoreQuotaStatus(false, isFirestoreWriteQuotaExhausted());
    }
    return { apps: list, ok: true, quotaExhausted: false };
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'read');
    return { apps: [], ok: false, quotaExhausted: isFirestoreReadQuotaExhausted() };
  }
}

export async function fetchApplicationsFromFirestore(): Promise<PendingApplication[]> {
  const res = await fetchApplicationsFromFirestoreWithStatus();
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
    await setDoc(ref, cleanObject(updates), { merge: true });
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
  }
}

export async function deleteApplicationFromFirestore(appId: string): Promise<void> {
  try {
    const docId = sanitizeDocId(appId);
    if (!docId) return;
    addEntityTombstone(APPLICATIONS_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    const ref = doc(db, APPLICATIONS_COL, docId);
    await deleteDoc(ref);
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
  }
}

export async function clearApprovedApplicationsFromFirestore(): Promise<number> {
  if (isFirestoreReadQuotaExhausted() || isFirestoreWriteQuotaExhausted()) return 0;
  try {
    const ref = collection(db, APPLICATIONS_COL);
    const snapshot = await getDocs(ref);
    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((d) => {
      const data = d.data() as PendingApplication;
      if (data.status === 'aprovado' || data.approvedAt) {
        addEntityTombstone(APPLICATIONS_COL, d.id);
        batch.delete(d.ref);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }
    return count;
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'read');
    return 0;
  }
}

export function subscribeToApplications(
  onUpdate: (apps: PendingApplication[]) => void
): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const ref = collection(db, APPLICATIONS_COL);
    return onSnapshot(
      ref,
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
        markFirestoreQuotaIfExhausted(error, 'read');
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
    await setDoc(ref, cleanObject(request), { merge: true });
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
  }
}

export async function fetchQuickRequestsFromFirestore(): Promise<QuickServiceRequest[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const ref = collection(db, QUICK_REQUESTS_COL);
    const snapshot = await getDocs(ref);
    const list: QuickServiceRequest[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as QuickServiceRequest);
    });
    return list;
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'read');
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
    await setDoc(ref, cleanObject(updates), { merge: true });
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
  }
}

export async function deleteQuickRequestFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(QUICK_REQUESTS_COL, docId);
    if (isFirestoreWriteQuotaExhausted()) return;
    const ref = doc(db, QUICK_REQUESTS_COL, docId);
    await deleteDoc(ref);
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
  }
}

export async function clearAllQuickRequestsFromFirestore(): Promise<number> {
  if (isFirestoreReadQuotaExhausted() || isFirestoreWriteQuotaExhausted()) return 0;
  try {
    const ref = collection(db, QUICK_REQUESTS_COL);
    const snapshot = await getDocs(ref);
    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((d) => {
      addEntityTombstone(QUICK_REQUESTS_COL, d.id);
      batch.delete(d.ref);
      count++;
    });

    if (count > 0) {
      await batch.commit();
    }
    return count;
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'read');
    return 0;
  }
}

export function subscribeToQuickRequests(
  onUpdate: (requests: QuickServiceRequest[]) => void
): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    const ref = collection(db, QUICK_REQUESTS_COL);
    return onSnapshot(
      ref,
      (snapshot) => {
        const list: QuickServiceRequest[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as QuickServiceRequest);
        });
        onUpdate(list);
      },
      (error) => {
        markFirestoreQuotaIfExhausted(error, 'read');
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
    const rawUser: Record<string, any> = {
      ...user,
      userId: user.id || docId,
      status: safeStatus,
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
    await setDoc(ref, cleanObject(rawUser), { merge: true });
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
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
    await deleteDoc(doc(db, USERS_COL, docId));
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
    const ref = collection(db, USERS_COL);
    return onSnapshot(
      ref,
      (snapshot) => {
        const list: UserAccount[] = [];
        snapshot.forEach((d) => list.push(d.data() as UserAccount));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
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
    const nowTs = Number((school as any)._updatedAt || Date.now());
    const ref = doc(db, SCHOOLS_COL, docId);
    await setDoc(
      ref,
      cleanObject({
        ...school,
        _updatedAt: nowTs,
        updatedAt: new Date(nowTs).toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar escola no Firestore:', error);
  }
}

export async function deleteSchoolFromFirestore(schoolId: string, schoolName?: string): Promise<void> {
  try {
    const docId = sanitizeDocId(schoolId);
    if (docId) {
      addEntityTombstone(SCHOOLS_COL, docId);
      await deleteDoc(doc(db, SCHOOLS_COL, docId));
    }
    if (schoolName) {
      const nameId = sanitizeDocId(schoolName.trim().toLowerCase());
      addEntityTombstone(SCHOOLS_COL, schoolName.trim().toLowerCase());
      if (nameId && nameId !== docId) {
        await deleteDoc(doc(db, SCHOOLS_COL, nameId)).catch(() => {});
      }
    }
  } catch (error) {
    console.warn('[Firestore] Erro ao apagar escola no Firestore:', error);
  }
}

export async function fetchSchoolsFromFirestore(): Promise<AdminSchool[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const snapshot = await getDocs(collection(db, SCHOOLS_COL));
    const list: AdminSchool[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as AdminSchool;
      if (data && data.name && !data.name.toLowerCase().includes('modelo central')) {
        list.push(data);
      }
    });
    return list;
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'read');
    console.warn('[Firestore] Erro ao buscar escolas no Firestore:', error);
    return [];
  }
}

export function subscribeToSchools(onUpdate: (schools: AdminSchool[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, SCHOOLS_COL),
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
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Schools subscription error:', err);
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
    const ref = doc(db, TEACHERS_COL, id);
    await setDoc(
      ref,
      cleanObject({
        ...cleanTeacher,
        id,
        name: rawName || (cleanTeacher as any).name,
        nomeCompleto: rawName || (cleanTeacher as any).nomeCompleto,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar professor no Firestore:', error);
  }
}

export async function deleteTeacherFromFirestore(teacherId: string): Promise<void> {
  try {
    const docId = sanitizeDocId(teacherId);
    if (!docId) return;
    addEntityTombstone(TEACHERS_COL, docId);
    await deleteDoc(doc(db, TEACHERS_COL, docId));
  } catch (error) {
    console.warn('[Firestore] Erro ao eliminar professor no Firestore:', error);
  }
}

export async function clearAllTeachersFromFirestore(): Promise<number> {
  try {
    const snapshot = await getDocs(collection(db, TEACHERS_COL));
    const batch = writeBatch(db);
    let count = 0;
    snapshot.forEach((d) => {
      addEntityTombstone(TEACHERS_COL, d.id);
      batch.delete(d.ref);
      count++;
    });
    if (count > 0) await batch.commit();
    return count;
  } catch (error) {
    console.warn('[Firestore] Erro ao limpar professores no Firestore:', error);
    return 0;
  }
}

export async function fetchTeachersFromFirestore(): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const snapshot = await getDocs(collection(db, TEACHERS_COL));
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return [];
  }
}

export function subscribeToTeachers(onUpdate: (teachers: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, TEACHERS_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Teachers subscription error:', err);
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
    const ref = doc(db, STUDENTS_COL, id);
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
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar aluno no Firestore:', error);
  }
}

export async function deleteStudentFromFirestore(studentId: string): Promise<void> {
  try {
    const docId = sanitizeDocId(studentId);
    if (!docId) return;
    addEntityTombstone(STUDENTS_COL, docId);
    await deleteDoc(doc(db, STUDENTS_COL, docId));
  } catch (error) {
    console.warn('[Firestore] Erro ao eliminar aluno no Firestore:', error);
  }
}

export async function clearAllStudentsFromFirestore(): Promise<number> {
  try {
    const snapshot = await getDocs(collection(db, STUDENTS_COL));
    const batch = writeBatch(db);
    let count = 0;
    snapshot.forEach((d) => {
      addEntityTombstone(STUDENTS_COL, d.id);
      batch.delete(d.ref);
      count++;
    });
    if (count > 0) await batch.commit();
    return count;
  } catch (error) {
    console.warn('[Firestore] Erro ao limpar alunos no Firestore:', error);
    return 0;
  }
}

export async function fetchStudentsFromFirestore(): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const snapshot = await getDocs(collection(db, STUDENTS_COL));
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return [];
  }
}

export function subscribeToStudents(onUpdate: (students: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, STUDENTS_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Students subscription error:', err);
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
  try {
    const rawName = (director as any).nomeCompleto || (director as any).name || (director as any).registrationData?.nomeCompleto || '';
    const id = sanitizeDocId(director.id || rawName);
    if (!id) return;
    removeEntityTombstone(DIRECTORS_COL, id);
    if (director.id) removeEntityTombstone(DIRECTORS_COL, String(director.id));
    if (rawName) removeEntityTombstone(DIRECTORS_COL, String(rawName));
    const cleanDirector = stripNestedRegistrationData(director as any);
    const ref = doc(db, DIRECTORS_COL, id);
    await setDoc(
      ref,
      cleanObject({
        ...cleanDirector,
        id,
        name: rawName || (cleanDirector as any).name,
        nomeCompleto: rawName || (cleanDirector as any).nomeCompleto,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar diretor no Firestore:', error);
  }
}

export async function deleteDirectorFromFirestore(directorId: string): Promise<void> {
  try {
    const docId = sanitizeDocId(directorId);
    if (!docId) return;
    addEntityTombstone(DIRECTORS_COL, docId);
    await deleteDoc(doc(db, DIRECTORS_COL, docId));
  } catch (error) {
    console.warn('[Firestore] Erro ao eliminar diretor no Firestore:', error);
  }
}

export function subscribeToDirectors(onUpdate: (directors: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, DIRECTORS_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Directors subscription error:', err);
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
    const ref = doc(db, DME_STAFF_COL, id);
    await setDoc(ref, cleanObject({ ...staff, id, updatedAt: new Date().toISOString() }), { merge: true });
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao gravar membro DME no Firestore:', error);
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
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao eliminar membro DME no Firestore:', error);
  }
}

export function subscribeToDmeStaff(onUpdate: (staff: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, DME_STAFF_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] DME Staff subscription error:', err);
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
    const ref = doc(db, STAFF_COL, id);
    await setDoc(
      ref,
      cleanObject({
        ...staffMember,
        id,
        nomeCompleto,
        name: nomeCompleto,
        funcao,
        schoolName,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar funcionário no Firestore:', error);
  }
}

export async function deleteStaffFromFirestore(staffId: string): Promise<void> {
  try {
    const docId = sanitizeDocId(staffId);
    if (!docId) return;
    addEntityTombstone(STAFF_COL, docId);
    await deleteDoc(doc(db, STAFF_COL, docId));
  } catch (error) {
    console.warn('[Firestore] Erro ao eliminar funcionário no Firestore:', error);
  }
}

export async function fetchStaffFromFirestore(): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const snapshot = await getDocs(collection(db, STAFF_COL));
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return [];
  }
}

export function subscribeToStaff(onUpdate: (staff: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, STAFF_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Staff subscription error:', err);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// High-capacity chunked batch writers (supports thousands of records in chunks of 450)
export async function saveBatchStudentsToFirestore(students: Record<string, any>[]): Promise<number> {
  if (!Array.isArray(students) || students.length === 0) return 0;
  let saved = 0;
  const CHUNK_SIZE = 450;
  for (let i = 0; i < students.length; i += CHUNK_SIZE) {
    const chunk = students.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((student) => {
      const id = sanitizeDocId(student.id || student.nomeCompleto || student.name);
      if (!id) return;
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
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
      saved++;
    });
    await batch.commit();
  }
  return saved;
}

export async function saveBatchTeachersToFirestore(teachers: Record<string, any>[]): Promise<number> {
  if (!Array.isArray(teachers) || teachers.length === 0) return 0;
  let saved = 0;
  const CHUNK_SIZE = 450;
  for (let i = 0; i < teachers.length; i += CHUNK_SIZE) {
    const chunk = teachers.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((teacher) => {
      const id = sanitizeDocId(teacher.id || teacher.nomeCompleto || teacher.name);
      if (!id) return;
      const ref = doc(db, TEACHERS_COL, id);
      batch.set(ref, cleanObject({ ...teacher, id, updatedAt: new Date().toISOString() }), { merge: true });
      saved++;
    });
    await batch.commit();
  }
  return saved;
}

export async function saveBatchStaffToFirestore(staffList: Record<string, any>[]): Promise<number> {
  if (!Array.isArray(staffList) || staffList.length === 0) return 0;
  let saved = 0;
  const CHUNK_SIZE = 450;
  for (let i = 0; i < staffList.length; i += CHUNK_SIZE) {
    const chunk = staffList.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((staffMember) => {
      const id = sanitizeDocId(
        staffMember.id || staffMember.bi || staffMember.agente || staffMember.nomeCompleto || staffMember.name
      );
      if (!id) return;
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
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
      saved++;
    });
    await batch.commit();
  }
  return saved;
}

// ============================================================================
// 8. EFECTIVIDADE - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveEfectividadeToFirestore(record: Record<string, any>): Promise<void> {
  try {
    const docId = sanitizeDocId(record.id || record.bi || record.agente);
    if (!docId) return;
    removeEntityTombstone(EFECTIVIDADE_COL, docId);
    const ref = doc(db, EFECTIVIDADE_COL, docId);
    await setDoc(ref, cleanObject({ ...record, id: record.id || docId }), { merge: true });
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar efectividade no Firestore:', error);
  }
}

export async function deleteEfectividadeFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(EFECTIVIDADE_COL, docId);
    await deleteDoc(doc(db, EFECTIVIDADE_COL, docId));
  } catch (error) {
    console.warn('[Firestore] Erro ao eliminar efectividade no Firestore:', error);
  }
}

export async function clearAllEfectividadeFromFirestore(): Promise<number> {
  try {
    const snapshot = await getDocs(collection(db, EFECTIVIDADE_COL));
    const batch = writeBatch(db);
    let count = 0;
    snapshot.forEach((d) => {
      addEntityTombstone(EFECTIVIDADE_COL, d.id);
      batch.delete(d.ref);
      count++;
    });
    if (count > 0) await batch.commit();
    return count;
  } catch (error) {
    console.warn('[Firestore] Erro ao esvaziar efectividade no Firestore:', error);
    return 0;
  }
}

export async function fetchEfectividadeFromFirestore(): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const snapshot = await getDocs(collection(db, EFECTIVIDADE_COL));
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return [];
  }
}

export function subscribeToEfectividade(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, EFECTIVIDADE_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Efectividade subscription error:', err);
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
  try {
    const docId = sanitizeDocId(record.id || record.ref || record.bi || record.agente);
    if (!docId) return;
    removeEntityTombstone(DECLARACAO_SERVICO_COL, docId);
    const ref = doc(db, DECLARACAO_SERVICO_COL, docId);
    await setDoc(ref, cleanObject({ ...record, id: record.id || docId }), { merge: true });
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar Declaração de Serviço no Firestore:', error);
  }
}

export async function deleteDeclaracaoServicoFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(DECLARACAO_SERVICO_COL, docId);
    await deleteDoc(doc(db, DECLARACAO_SERVICO_COL, docId));
  } catch (error) {
    console.warn('[Firestore] Erro ao eliminar Declaração de Serviço no Firestore:', error);
  }
}

export async function clearAllDeclaracaoServicoFromFirestore(): Promise<number> {
  try {
    const snapshot = await getDocs(collection(db, DECLARACAO_SERVICO_COL));
    const batch = writeBatch(db);
    let count = 0;
    snapshot.forEach((d) => {
      addEntityTombstone(DECLARACAO_SERVICO_COL, d.id);
      batch.delete(d.ref);
      count++;
    });
    if (count > 0) await batch.commit();
    return count;
  } catch (error) {
    console.warn('[Firestore] Erro ao esvaziar Declaração de Serviço no Firestore:', error);
    return 0;
  }
}

export async function fetchDeclaracaoServicoFromFirestore(): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const snapshot = await getDocs(collection(db, DECLARACAO_SERVICO_COL));
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return [];
  }
}

export function subscribeToDeclaracaoServico(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, DECLARACAO_SERVICO_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Declaração de Serviço subscription error:', err);
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
    const ref = doc(db, GRADES_COL, docId);
    await setDoc(ref, cleanObject({ ...record, id: record.id || docId }), { merge: true });
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao gravar mini-pauta no Firestore:', error);
  }
}

export function subscribeToMiniPautas(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, GRADES_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Grades/MiniPautas subscription error:', err);
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
  try {
    const targetId = kind === 'student' ? record.studentId : record.teacherId;
    const docId = sanitizeDocId(`${kind}_${targetId}_${record.date}`);
    if (!docId) return;
    const ref = doc(db, ATTENDANCE_COL, docId);
    await setDoc(ref, cleanObject({ ...record, attendanceKind: kind, docId }), { merge: true });
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar presença no Firestore:', error);
  }
}

export async function saveBatchAttendanceToFirestore(
  records: Record<string, any>[],
  kind: 'student' | 'teacher'
): Promise<void> {
  try {
    if (!Array.isArray(records) || records.length === 0) return;
    const batch = writeBatch(db);
    records.forEach((record) => {
      const targetId = kind === 'student' ? record.studentId : record.teacherId;
      const docId = sanitizeDocId(`${kind}_${targetId}_${record.date}`);
      if (docId) {
        const ref = doc(db, ATTENDANCE_COL, docId);
        batch.set(ref, cleanObject({ ...record, attendanceKind: kind, docId }), { merge: true });
      }
    });
    await batch.commit();
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar lote de presenças no Firestore:', error);
  }
}

export function subscribeToAttendance(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, ATTENDANCE_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Attendance subscription error:', err);
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
    const ref = doc(db, ANNOUNCEMENTS_COL, docId);
    await setDoc(ref, cleanObject(announcement), { merge: true });
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao gravar anúncio no Firestore:', error);
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
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao eliminar anúncio no Firestore:', error);
  }
}

export function subscribeToAnnouncements(onUpdate: (list: SchoolAnnouncement[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, ANNOUNCEMENTS_COL),
      (snapshot) => {
        const list: SchoolAnnouncement[] = [];
        snapshot.forEach((d) => list.push(d.data() as SchoolAnnouncement));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Announcements subscription error:', err);
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
    const ref = doc(db, ROOMS_COL, docId);
    await setDoc(ref, cleanObject(room), { merge: true });
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao gravar sala no Firestore:', error);
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
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao eliminar sala no Firestore:', error);
  }
}

export function subscribeToRooms(onUpdate: (list: DirectorRoom[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, ROOMS_COL),
      (snapshot) => {
        const list: DirectorRoom[] = [];
        snapshot.forEach((d) => list.push(d.data() as DirectorRoom));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Rooms subscription error:', err);
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
    const ref = doc(db, CLASSES_COL, docId);
    await setDoc(ref, cleanObject(cls), { merge: true });
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao gravar classe no Firestore:', error);
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
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao eliminar classe no Firestore:', error);
  }
}

export function subscribeToClasses(onUpdate: (list: DirectorClass[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, CLASSES_COL),
      (snapshot) => {
        const list: DirectorClass[] = [];
        snapshot.forEach((d) => list.push(d.data() as DirectorClass));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Classes subscription error:', err);
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
    const ref = doc(db, CHAT_MESSAGES_COL, docId);
    await setDoc(ref, cleanObject(message), { merge: true });
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao gravar mensagem de chat no Firestore:', error);
  }
}

export function subscribeToChatMessages(onUpdate: (list: ChatMessage[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, CHAT_MESSAGES_COL),
      (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((d) => list.push(d.data() as ChatMessage));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] ChatMessages subscription error:', err);
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
  try {
    const docId = sanitizeDocId(record.id || `${record.ng || ''}_${record.ang || ''}_${record.agente || ''}`);
    if (!docId) return;
    removeEntityTombstone(GUIAS_FERIAS_COL, docId);
    const ref = doc(db, GUIAS_FERIAS_COL, docId);
    await setDoc(ref, cleanObject({ ...record, id: record.id || docId }), { merge: true });
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar Guia de Férias no Firestore:', error);
  }
}

export async function deleteGuiaFeriasFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(GUIAS_FERIAS_COL, docId);
    await deleteDoc(doc(db, GUIAS_FERIAS_COL, docId));
  } catch (error) {
    console.warn('[Firestore] Erro ao eliminar Guia de Férias no Firestore:', error);
  }
}

export async function fetchGuiasFeriasFromFirestore(): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const snapshot = await getDocs(collection(db, GUIAS_FERIAS_COL));
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return [];
  }
}

export function subscribeToGuiasFerias(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, GUIAS_FERIAS_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Guias de Férias subscription error:', err);
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
    const ref = doc(db, GUIAS_COLOCACAO_COL, docId);
    await setDoc(ref, cleanObject({ ...record, id: record.id || docId }), { merge: true });
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao gravar Guia de Colocação no Firestore:', error);
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
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao eliminar Guia de Colocação no Firestore:', error);
  }
}

export async function fetchGuiasColocacaoFromFirestore(): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const snapshot = await getDocs(collection(db, GUIAS_COLOCACAO_COL));
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return [];
  }
}

export function subscribeToGuiasColocacao(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, GUIAS_COLOCACAO_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Guias de Colocação subscription error:', err);
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
    const ref = doc(db, FICHAS_AVALIACAO_COL, docId);
    await setDoc(ref, cleanObject({ ...record, id: record.id || docId }), { merge: true });
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao gravar Ficha de Avaliação no Firestore:', error);
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
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao eliminar Ficha de Avaliação no Firestore:', error);
  }
}

export async function fetchFichasAvaliacaoFromFirestore(): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const snapshot = await getDocs(collection(db, FICHAS_AVALIACAO_COL));
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return [];
  }
}

export function subscribeToFichasAvaliacao(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, FICHAS_AVALIACAO_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Fichas de Avaliação subscription error:', err);
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
    const ref = doc(db, CADASTRO_DOCENTE_COL, docId);
    await setDoc(ref, cleanObject({ ...record, id: record.id || docId }), { merge: true });
  } catch (error) {
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao gravar Cadastro Docente no Firestore:', error);
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
    markFirestoreQuotaIfExhausted(error, 'write');
    console.warn('[Firestore] Erro ao eliminar Cadastro Docente no Firestore:', error);
  }
}

export async function fetchCadastroDocenteFromFirestore(): Promise<any[]> {
  if (isFirestoreReadQuotaExhausted()) return [];
  try {
    const snapshot = await getDocs(collection(db, CADASTRO_DOCENTE_COL));
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return [];
  }
}

export function subscribeToCadastroDocente(onUpdate: (records: any[]) => void): Unsubscribe {
  if (isFirestoreReadQuotaExhausted()) return () => {};
  try {
    return onSnapshot(
      collection(db, CADASTRO_DOCENTE_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => {
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Cadastro Docente subscription error:', err);
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
    return onSnapshot(
      collection(db, TOMBSTONES_COL),
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
        markFirestoreQuotaIfExhausted(err, 'read');
        console.warn('[Firestore] Tombstones subscription error:', err);
      }
    );
  } catch (err) {
    markFirestoreQuotaIfExhausted(err, 'read');
    return () => {};
  }
}

// ============================================================================
// 12. GLOBAL REAL-TIME UNIFIED DATABASE ORCHESTRATOR
// Synchronizes and unifies all collections between Firestore, localStorage, and Backend
// ============================================================================

let globalRealtimeUnsubscribe: (() => void) | null = null;

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

export function initUnifiedRealtimeDatabaseSync(): () => void {
  if (typeof window === 'undefined') return () => {};
  if (isFirestoreReadQuotaExhausted()) return () => {};
  if (globalRealtimeUnsubscribe) {
    return globalRealtimeUnsubscribe;
  }

  const unsubs: Unsubscribe[] = [];
  const norm = (s?: string) => (s || '').trim().toLowerCase();
  const pushedMissingKeys = new Set<string>();
  const shouldPushMissing = (col: string, key: string): boolean => {
    const token = `${col}::${key}`;
    if (!key || pushedMissingKeys.has(token)) return false;
    pushedMissingKeys.add(token);
    return true;
  };

  // 0. REAL-TIME TOMBSTONES & BANNED ENTITY PURGE ORCHESTRATION
  // Union-merge Firestore tombstones with local/server tombstones so neither side overwrites the other
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

  // 1. REAL-TIME SCHOOLS UNIFICATION (ucore_admin_schools & sigre_school_registrations)
  unsubs.push(
    subscribeToSchools((cloudSchools) => {
      try {
        const localAdminSchools = safeReadJsonArray<AdminSchool>('ucore_admin_schools');
        const localRegSchools = safeReadJsonArray<any>('sigre_school_registrations');
        const map = new Map<string, AdminSchool>();

        // Push any unsynced local schools to Firestore
        localAdminSchools.forEach((ls) => {
          if (!ls || !ls.name || isBannedSchoolOrEntity(ls)) return;
          const k = norm(ls.id || ls.name);
          if (isEntityTombstoned(SCHOOLS_COL, ls.id) || isEntityTombstoned(SCHOOLS_COL, ls.name)) return;
          map.set(k, ls);
          const inCloud = cloudSchools.some(
            (cs) => norm(cs.id) === norm(ls.id) || norm(cs.name) === norm(ls.name)
          );
          if (!inCloud && shouldPushMissing(SCHOOLS_COL, k)) {
            saveSchoolToFirestore(ls).catch(() => {});
          }
        });

        // Also ensure schools registered in sigre_school_registrations are represented
        localRegSchools.forEach((reg) => {
          if (!reg || !reg.nomeOficial || isBannedSchoolOrEntity(reg)) return;
          if (isEntityTombstoned(SCHOOLS_COL, reg.id) || isEntityTombstoned(SCHOOLS_COL, reg.nomeOficial)) return;
          const matchKey =
            Array.from(map.keys()).find((k) => {
              const item = map.get(k);
              return item && (norm(item.id) === norm(reg.id) || norm(item.name) === norm(reg.nomeOficial));
            }) || norm(reg.id || reg.nomeOficial);
          const existing = map.get(matchKey);
          if (existing) {
            if (!existing.registrationData) {
              map.set(matchKey, { ...existing, registrationData: reg });
            }
          }
        });

        // Merge authoritative cloud schools (and delete banned ones from Firestore), comparing timestamps so newest edits win
        cloudSchools.forEach((cs) => {
          if (!cs || !cs.name) return;
          if (isBannedSchoolOrEntity(cs)) {
            if (cs.id) deleteDoc(doc(db, SCHOOLS_COL, sanitizeDocId(cs.id))).catch(() => {});
            return;
          }
          if (isEntityTombstoned(SCHOOLS_COL, cs.id) || isEntityTombstoned(SCHOOLS_COL, cs.name)) return;
          const matchKey =
            Array.from(map.keys()).find((k) => {
              const item = map.get(k);
              return item && (norm(item.id) === norm(cs.id) || norm(item.name) === norm(cs.name));
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

        const unifiedSchools = Array.from(map.values());
        const changedSchools = safeWriteJsonIfChanged('ucore_admin_schools', unifiedSchools);
        safeWriteJsonIfChanged('ucore_registered_schools_v1', unifiedSchools);

        const unifiedRegs = unifiedSchools
          .map((s) => s.registrationData)
          .filter(Boolean);
        safeWriteJsonIfChanged('sigre_school_registrations', unifiedRegs);

        // Mirror unified schools into local Express backend so both stay 100% consistent across containers
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
    })
  );

  // 2. REAL-TIME TEACHERS UNIFICATION (ucore_registered_teachers_v2, ucore_admin_teachers, ucore_director_teachers_v1)
  unsubs.push(
    subscribeToTeachers((cloudTeachers) => {
      try {
        const localReg = safeReadJsonArray<TeacherRegistrationData>('ucore_registered_teachers_v2');
        const localAdmin = safeReadJsonArray<AdminTeacher>('ucore_admin_teachers');
        const localDir = safeReadJsonArray<DirectorTeacher>('ucore_director_teachers_v1');

        const regMap = new Map<string, TeacherRegistrationData>();
        const adminMap = new Map<string, AdminTeacher>();
        const dirMap = new Map<string, DirectorTeacher>();

        const ingestTeacherItem = (item: any, fromCloud: boolean) => {
          if (!item) return;
          if (isBannedSchoolOrEntity(item)) {
            if (fromCloud && item.id) {
              deleteDoc(doc(db, TEACHERS_COL, sanitizeDocId(item.id))).catch(() => {});
            }
            return;
          }
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
            name: name,
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

          if (!fromCloud) {
            const existsInCloud = cloudTeachers.some(
              (ct) => norm(ct.id) === norm(id) || norm(ct.nomeCompleto || ct.name) === norm(name)
            );
            if (!existsInCloud && shouldPushMissing(TEACHERS_COL, key)) {
              saveTeacherToFirestore(regData || adminObj).catch(() => {});
            }
          }
        };

        localReg.forEach((t) => ingestTeacherItem(t, false));
        localAdmin.forEach((t) => ingestTeacherItem(t, false));
        localDir.forEach((t) => ingestTeacherItem(t, false));
        cloudTeachers.forEach((t) => ingestTeacherItem(t, true));

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
    })
  );

  // 3. REAL-TIME STUDENTS UNIFICATION (ucore_registered_students_v2, ucore_admin_students, ucore_director_students, ucore_teacher_students)
  unsubs.push(
    subscribeToStudents((cloudStudents) => {
      try {
        const localReg = safeReadJsonArray<StudentRegistrationData>('ucore_registered_students_v2');
        const localAdmin = safeReadJsonArray<AdminStudent>('ucore_admin_students');
        const localDir = safeReadJsonArray<DirectorStudent>('ucore_director_students');
        const localTeacher = safeReadJsonArray<any>('ucore_teacher_students');

        const regMap = new Map<string, StudentRegistrationData>();
        const adminMap = new Map<string, AdminStudent>();
        const dirMap = new Map<string, DirectorStudent>();
        const teacherMap = new Map<string, any>();

        const ingestStudentItem = (item: any, fromCloud: boolean) => {
          if (!item) return;
          if (isBannedSchoolOrEntity(item)) {
            if (fromCloud && item.id) {
              deleteDoc(doc(db, STUDENTS_COL, sanitizeDocId(item.id))).catch(() => {});
            }
            return;
          }
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

          if (!fromCloud) {
            const existsInCloud = cloudStudents.some(
              (cs) => norm(cs.id) === norm(studentId) || norm(cs.nomeCompleto || cs.name) === norm(name)
            );
            if (!existsInCloud && shouldPushMissing(STUDENTS_COL, key)) {
              saveStudentToFirestore(regObj).catch(() => {});
            }
          }
        };

        localReg.forEach((s) => ingestStudentItem(s, false));
        localAdmin.forEach((s) => ingestStudentItem(s, false));
        localDir.forEach((s) => ingestStudentItem(s, false));
        localTeacher.forEach((s) => ingestStudentItem(s, false));
        cloudStudents.forEach((s) => ingestStudentItem(s, true));

        const unifiedAdminStudents = Array.from(adminMap.values());
        const c1 = safeWriteJsonIfChanged('ucore_registered_students_v2', Array.from(regMap.values()));
        const c2 = safeWriteJsonIfChanged('ucore_admin_students', unifiedAdminStudents);
        const c3 = safeWriteJsonIfChanged('ucore_director_students', Array.from(dirMap.values()));
        const c4 = safeWriteJsonIfChanged('ucore_teacher_students', Array.from(teacherMap.values()));

        // Reconcile school student counters automatically
        const currentSchools = safeReadJsonArray<AdminSchool>('ucore_admin_schools');
        if (currentSchools.length > 0) {
          const updatedSchools = currentSchools.map((sc) => {
            const belongs = unifiedAdminStudents.filter(
              (st) =>
                (st.schoolId && st.schoolId === sc.id) ||
                norm(st.schoolName) === norm(sc.name) ||
                norm(st.registrationData?.escola) === norm(sc.name)
            );
            const preservedDeclared =
              typeof sc.declaredStudentsCount === 'number'
                ? sc.declaredStudentsCount
                : typeof sc.registrationData?.pessoal?.totalAlunosDeclarados === 'number'
                ? sc.registrationData.pessoal.totalAlunosDeclarados
                : (sc.studentsWithDocs || 0) + (sc.studentsWithoutDocs || 0);
            const withDocs = belongs.filter((st) => st.hasDocuments).length;
            const withoutDocs = belongs.length - withDocs;
            return {
              ...sc,
              declaredStudentsCount: preservedDeclared,
              studentsWithDocs: withDocs,
              studentsWithoutDocs: withoutDocs,
            };
          });
          safeWriteJsonIfChanged('ucore_admin_schools', updatedSchools);
        }

        if (c1 || c2 || c3 || c4) {
          window.dispatchEvent(new CustomEvent('sigre-data-synced'));
        }
      } catch (e) {
        console.warn('[UnifiedSync] Erro ao unificar alunos:', e);
      }
    })
  );

  // 4. REAL-TIME DIRECTORS & DME STAFF UNIFICATION
  unsubs.push(
    subscribeToDirectors((cloudDirs) => {
      try {
        const localReg = safeReadJsonArray<DirectorRegistrationData>('ucore_registered_directors_v2');
        const localAdmin = safeReadJsonArray<AdminDirector>('ucore_admin_directors');

        const regMap = new Map<string, DirectorRegistrationData>();
        const adminMap = new Map<string, AdminDirector>();

        const ingestDirector = (item: any, fromCloud: boolean) => {
          if (!item) return;
          if (isBannedSchoolOrEntity(item)) {
            if (fromCloud && item.id) {
              deleteDoc(doc(db, DIRECTORS_COL, sanitizeDocId(item.id))).catch(() => {});
            }
            return;
          }
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

          if (!fromCloud) {
            const existsInCloud = cloudDirs.some(
              (cd) => norm(cd.id) === norm(id) || norm(cd.nomeCompleto || cd.name) === norm(name)
            );
            if (!existsInCloud && shouldPushMissing(DIRECTORS_COL, key)) {
              saveDirectorToFirestore(regData || adminObj).catch(() => {});
            }
          }
        };

        localReg.forEach((d) => ingestDirector(d, false));
        localAdmin.forEach((d) => ingestDirector(d, false));
        cloudDirs.forEach((d) => ingestDirector(d, true));

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
          const inCloud = cloudStaff.some((cs) => norm(cs.id || cs.email || cs.role) === k);
          if (!inCloud && shouldPushMissing(DME_STAFF_COL, k)) {
            saveDmeStaffToFirestore(s).catch(() => {});
          }
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

  // 5. REAL-TIME EFECTIVIDADE UNIFICATION
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
          const inCloud = cloudRecords.some((cr) => cr && cr.id === lr.id);
          if (!inCloud && shouldPushMissing(EFECTIVIDADE_COL, norm(lr.id))) {
            saveEfectividadeToFirestore(lr).catch(() => {});
          }
        });

        cloudRecords.forEach((cr) => {
          if (!cr || !cr.id) return;
          if (isBannedSchoolOrEntity(cr)) {
            deleteDoc(doc(db, EFECTIVIDADE_COL, sanitizeDocId(cr.id))).catch(() => {});
            return;
          }
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

  // 5B. REAL-TIME DECLARAÇÃO DE SERVIÇO UNIFICATION (ISOLATED FROM EFECTIVIDADE)
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
          const inCloud = cloudRecords.some((cr) => cr && cr.id === lr.id);
          if (!inCloud && shouldPushMissing(DECLARACAO_SERVICO_COL, norm(lr.id))) {
            saveDeclaracaoServicoToFirestore(lr).catch(() => {});
          }
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

  // 5C. REAL-TIME OUTROS FUNCIONÁRIOS (STAFF) UNIFICATION
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
          const inCloud = cloudStaff.some(
            (cs) => norm(cs.id || cs.bi || cs.agente || cs.nomeCompleto || cs.name) === k
          );
          if (!inCloud && shouldPushMissing(STAFF_COL, k)) {
            saveStaffToFirestore(ls).catch(() => {});
          }
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

  // 6. REAL-TIME MINI-PAUTAS / GRADES UNIFICATION
  unsubs.push(
    subscribeToMiniPautas((cloudPautas) => {
      try {
        const localPautas = safeReadJsonArray<any>('sigre_teacher_mini_pautas_v5_blank');
        const map = new Map<string, any>();
        const getKey = (r: any) =>
          `${norm(r.classe)}::${norm(r.turma)}::${norm(r.disciplina)}::${norm(r.schoolName)}`;

        localPautas.forEach((lp) => {
          if (!lp || isBannedSchoolOrEntity(lp)) return;
          const k = getKey(lp);
          map.set(k, lp);
          const inCloud = cloudPautas.some((cp) => getKey(cp) === k);
          if (!inCloud && shouldPushMissing(GRADES_COL, k)) {
            saveMiniPautaToFirestore(lp).catch(() => {});
          }
        });

        cloudPautas.forEach((cp) => {
          if (!cp || isBannedSchoolOrEntity(cp)) return;
          const k = getKey(cp);
          map.set(k, { ...(map.get(k) || {}), ...cp });
        });

        const merged = Array.from(map.values());
        if (safeWriteJsonIfChanged('sigre_teacher_mini_pautas_v5_blank', merged)) {
          window.dispatchEvent(new CustomEvent('sigre-minipautas-updated'));
          window.dispatchEvent(new CustomEvent('sigre-data-synced'));
        }
      } catch (e) {
        console.warn('[UnifiedSync] Erro ao unificar mini-pautas:', e);
      }
    })
  );

  // 7. REAL-TIME ATTENDANCE UNIFICATION
  unsubs.push(
    subscribeToAttendance((cloudAttendance) => {
      try {
        const localStudentsAtt = safeReadJsonArray<any>('ucore_student_attendance_records_v2');
        const localTeachersAtt = safeReadJsonArray<any>('ucore_teacher_attendance_records_v2');

        const stuMap = new Map<string, any>();
        const teaMap = new Map<string, any>();

        localStudentsAtt.forEach((r) => {
          if (!r || !r.studentId || !r.date || isBannedSchoolOrEntity(r)) return;
          const k = `${r.studentId}_${r.date}`;
          stuMap.set(k, r);
          const inCloud = cloudAttendance.some(
            (ca) => ca.attendanceKind === 'student' && ca.studentId === r.studentId && ca.date === r.date
          );
          if (!inCloud && shouldPushMissing(`${ATTENDANCE_COL}_student`, k)) {
            saveAttendanceToFirestore(r, 'student').catch(() => {});
          }
        });

        localTeachersAtt.forEach((r) => {
          if (!r || !r.teacherId || !r.date || isBannedSchoolOrEntity(r)) return;
          const k = `${r.teacherId}_${r.date}`;
          teaMap.set(k, r);
          const inCloud = cloudAttendance.some(
            (ca) => ca.attendanceKind === 'teacher' && ca.teacherId === r.teacherId && ca.date === r.date
          );
          if (!inCloud && shouldPushMissing(`${ATTENDANCE_COL}_teacher`, k)) {
            saveAttendanceToFirestore(r, 'teacher').catch(() => {});
          }
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

  // 8. REAL-TIME ANNOUNCEMENTS, ROOMS, CLASSES & USERS UNIFICATION
  unsubs.push(
    subscribeToAnnouncements((cloudAnn) => {
      try {
        const localAnn = safeReadJsonArray<SchoolAnnouncement>('ucore_school_announcements_v1');
        const map = new Map<string, SchoolAnnouncement>();

        localAnn.forEach((la) => {
          if (!la || !la.id || isEntityTombstoned(ANNOUNCEMENTS_COL, la.id) || isBannedSchoolOrEntity(la)) return;
          map.set(la.id, la);
          if (!cloudAnn.some((ca) => ca.id === la.id) && shouldPushMissing(ANNOUNCEMENTS_COL, la.id)) {
            saveAnnouncementToFirestore(la).catch(() => {});
          }
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

  unsubs.push(
    subscribeToRooms((cloudRooms) => {
      try {
        const localRooms = safeReadJsonArray<DirectorRoom>('ucore_director_rooms');
        const map = new Map<string, DirectorRoom>();
        localRooms.forEach((lr) => {
          if (!lr || !lr.id || isEntityTombstoned(ROOMS_COL, lr.id) || isBannedSchoolOrEntity(lr)) return;
          map.set(lr.id, lr);
          if (!cloudRooms.some((cr) => cr.id === lr.id) && shouldPushMissing(ROOMS_COL, lr.id)) {
            saveRoomToFirestore(lr).catch(() => {});
          }
        });
        cloudRooms.forEach((cr) => {
          if (!cr || !cr.id || isEntityTombstoned(ROOMS_COL, cr.id) || isBannedSchoolOrEntity(cr)) return;
          map.set(cr.id, { ...(map.get(cr.id) || {}), ...cr });
        });
        const merged = Array.from(map.values());
        if (safeWriteJsonIfChanged('ucore_director_rooms', merged)) {
          window.dispatchEvent(new CustomEvent('sigre-data-synced'));
        }
      } catch {}
    })
  );

  unsubs.push(
    subscribeToClasses((cloudClasses) => {
      try {
        const localClasses = safeReadJsonArray<DirectorClass>('ucore_director_classes');
        const map = new Map<string, DirectorClass>();
        localClasses.forEach((lc) => {
          if (!lc || !lc.id || isEntityTombstoned(CLASSES_COL, lc.id) || isBannedSchoolOrEntity(lc)) return;
          map.set(lc.id, lc);
          if (!cloudClasses.some((cc) => cc.id === lc.id) && shouldPushMissing(CLASSES_COL, lc.id)) {
            saveClassToFirestore(lc).catch(() => {});
          }
        });
        cloudClasses.forEach((cc) => {
          if (!cc || !cc.id || isEntityTombstoned(CLASSES_COL, cc.id) || isBannedSchoolOrEntity(cc)) return;
          map.set(cc.id, { ...(map.get(cc.id) || {}), ...cc });
        });
        const merged = Array.from(map.values());
        if (safeWriteJsonIfChanged('ucore_director_classes', merged)) {
          window.dispatchEvent(new CustomEvent('sigre-data-synced'));
        }
      } catch {}
    })
  );

  // 9. REAL-TIME GUIAS DE FÉRIAS, GUIAS DE COLOCAÇÃO, FICHAS DE AVALIAÇÃO & CADASTRO DOCENTE UNIFICATION
  unsubs.push(
    subscribeToGuiasFerias((cloudGuias) => {
      try {
        const localGuias = safeReadJsonArray<any>('sigre_guias_ferias_records_v1');
        const map = new Map<string, any>();

        localGuias.forEach((lg) => {
          if (!lg || !lg.id || isEntityTombstoned(GUIAS_FERIAS_COL, lg.id) || isBannedSchoolOrEntity(lg)) return;
          map.set(lg.id, lg);
          if (!cloudGuias.some((cg) => cg && cg.id === lg.id) && shouldPushMissing(GUIAS_FERIAS_COL, lg.id)) {
            saveGuiaFeriasToFirestore(lg).catch(() => {});
          }
        });

        cloudGuias.forEach((cg) => {
          if (!cg || !cg.id || isEntityTombstoned(GUIAS_FERIAS_COL, cg.id) || isBannedSchoolOrEntity(cg)) return;
          map.set(cg.id, { ...(map.get(cg.id) || {}), ...cg });
        });

        const merged = Array.from(map.values());
        if (safeWriteJsonIfChanged('sigre_guias_ferias_records_v1', merged)) {
          window.dispatchEvent(new CustomEvent('sigre-guia-ferias-updated'));
          window.dispatchEvent(new CustomEvent('sigre-data-synced'));
        }
      } catch {}
    })
  );

  unsubs.push(
    subscribeToGuiasColocacao((cloudGuias) => {
      try {
        const localGuias = safeReadJsonArray<any>('sigre_guias_colocacao_records_v1');
        const map = new Map<string, any>();

        localGuias.forEach((lg) => {
          if (!lg || !lg.id || isEntityTombstoned(GUIAS_COLOCACAO_COL, lg.id) || isBannedSchoolOrEntity(lg)) return;
          map.set(lg.id, lg);
          if (!cloudGuias.some((cg) => cg && cg.id === lg.id) && shouldPushMissing(GUIAS_COLOCACAO_COL, lg.id)) {
            saveGuiaColocacaoToFirestore(lg).catch(() => {});
          }
        });

        cloudGuias.forEach((cg) => {
          if (!cg || !cg.id || isEntityTombstoned(GUIAS_COLOCACAO_COL, cg.id) || isBannedSchoolOrEntity(cg)) return;
          map.set(cg.id, { ...(map.get(cg.id) || {}), ...cg });
        });

        const merged = Array.from(map.values());
        if (safeWriteJsonIfChanged('sigre_guias_colocacao_records_v1', merged)) {
          window.dispatchEvent(new CustomEvent('sigre-guia-colocacao-updated'));
          window.dispatchEvent(new CustomEvent('sigre-data-synced'));
        }
      } catch {}
    })
  );

  unsubs.push(
    subscribeToFichasAvaliacao((cloudFichas) => {
      try {
        const localFichas = safeReadJsonArray<any>('sigre_fichas_avaliacao_records_v1');
        const map = new Map<string, any>();

        localFichas.forEach((lf) => {
          if (!lf || !lf.id || isEntityTombstoned(FICHAS_AVALIACAO_COL, lf.id) || isBannedSchoolOrEntity(lf)) return;
          map.set(lf.id, lf);
          if (!cloudFichas.some((cf) => cf && cf.id === lf.id) && shouldPushMissing(FICHAS_AVALIACAO_COL, lf.id)) {
            saveFichaAvaliacaoToFirestore(lf).catch(() => {});
          }
        });

        cloudFichas.forEach((cf) => {
          if (!cf || !cf.id || isEntityTombstoned(FICHAS_AVALIACAO_COL, cf.id) || isBannedSchoolOrEntity(cf)) return;
          map.set(cf.id, { ...(map.get(cf.id) || {}), ...cf });
        });

        const merged = Array.from(map.values());
        if (safeWriteJsonIfChanged('sigre_fichas_avaliacao_records_v1', merged)) {
          window.dispatchEvent(new CustomEvent('sigre-ficha-avaliacao-updated'));
          window.dispatchEvent(new CustomEvent('sigre-data-synced'));
        }
      } catch {}
    })
  );

  unsubs.push(
    subscribeToCadastroDocente((cloudCadastros) => {
      try {
        const localCadastros = safeReadJsonArray<any>('cadastro-docente-registos');
        const map = new Map<string, any>();

        localCadastros.forEach((lc) => {
          if (!lc || !lc.id || isEntityTombstoned(CADASTRO_DOCENTE_COL, lc.id) || isBannedSchoolOrEntity(lc)) return;
          map.set(String(lc.id), lc);
          if (!cloudCadastros.some((cc) => cc && String(cc.id) === String(lc.id)) && shouldPushMissing(CADASTRO_DOCENTE_COL, String(lc.id))) {
            saveCadastroDocenteToFirestore(lc).catch(() => {});
          }
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
          if (!cloudUsers.some((cu) => norm(cu.email) === k) && shouldPushMissing(USERS_COL, k)) {
            saveUserToFirestore(normalizedLocal).catch(() => {});
          }
        });
        cloudUsers.forEach((cu) => {
          if (!cu || !cu.email) return;
          if (isBannedSchoolOrEntity(cu)) {
            deleteDoc(doc(db, USERS_COL, sanitizeDocId(cu.email))).catch(() => {});
            return;
          }
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
          // Self-heal stale Firestore users doc if application was already approved
          if (isApproved && cu.status === 'pendente' && shouldPushMissing(USERS_COL, `heal_active_${k}`)) {
            saveUserToFirestore(mergedUser).catch(() => {});
          }
        });
        if (safeWriteJsonIfChanged('ucore_registered_users', Array.from(map.values()))) {
          window.dispatchEvent(new CustomEvent('sigre-users-updated'));
          window.dispatchEvent(new CustomEvent('sigre-data-synced'));
        }
      } catch {}
    })
  );

  // Real-time persistence is handled immediately by explicit API/Firestore writes and the dirty-tracked sync engine
  // (No blind full-localStorage startup/25s dumps that could push stale client state to the server)
  globalRealtimeUnsubscribe = () => {
    unsubs.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
    globalRealtimeUnsubscribe = null;
  };

  return globalRealtimeUnsubscribe;
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
