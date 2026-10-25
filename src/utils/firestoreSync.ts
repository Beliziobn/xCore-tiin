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

const APPLICATIONS_COL = 'applications';
const QUICK_REQUESTS_COL = 'quickRequests';
const USERS_COL = 'users';
const SCHOOLS_COL = 'schools';
const DIRECTORS_COL = 'directors';
const DME_STAFF_COL = 'dme_staff';
const TEACHERS_COL = 'teachers';
const STUDENTS_COL = 'students';
const EFECTIVIDADE_COL = 'efectividade';
const GRADES_COL = 'grades';
const ATTENDANCE_COL = 'attendance';
const ANNOUNCEMENTS_COL = 'announcements';
const ROOMS_COL = 'rooms';
const CLASSES_COL = 'classes';
const CHAT_MESSAGES_COL = 'chatMessages';

const DELETED_ENTITIES_KEY = 'sigre_deleted_entities_tombstones_v1';

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
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function addEntityTombstone(col: string, id: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || !id) return;
  try {
    const set = getEntityTombstones();
    set.add(`${col}::${sanitizeDocId(id).toLowerCase()}`);
    localStorage.setItem(DELETED_ENTITIES_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function removeEntityTombstone(col: string, id: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || !id) return;
  try {
    const set = getEntityTombstones();
    const key = `${col}::${sanitizeDocId(id).toLowerCase()}`;
    if (set.has(key)) {
      set.delete(key);
      localStorage.setItem(DELETED_ENTITIES_KEY, JSON.stringify(Array.from(set)));
    }
  } catch {}
}

export function isEntityTombstoned(col: string, id: string): boolean {
  if (!id) return false;
  const set = getEntityTombstones();
  return set.has(`${col}::${sanitizeDocId(id).toLowerCase()}`);
}

// ============================================================================
// 1. APPLICATIONS (HOMOLOGAÇÕES) - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveApplicationToFirestore(app: PendingApplication): Promise<void> {
  try {
    const docId = sanitizeDocId(app.id || app.userId);
    if (!docId) return;
    removeEntityTombstone(APPLICATIONS_COL, docId);
    const ref = doc(db, APPLICATIONS_COL, docId);
    await setDoc(ref, cleanObject(app), { merge: true });
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar candidatura no Firestore:', error);
  }
}

export async function fetchApplicationsFromFirestore(): Promise<PendingApplication[]> {
  try {
    const ref = collection(db, APPLICATIONS_COL);
    const snapshot = await getDocs(ref);
    const list: PendingApplication[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as PendingApplication);
    });
    return list;
  } catch (error) {
    console.warn('[Firestore] Erro ao buscar candidaturas na nuvem:', error);
    return [];
  }
}

export async function updateApplicationInFirestore(
  appId: string,
  updates: Partial<PendingApplication>
): Promise<void> {
  try {
    const docId = sanitizeDocId(appId);
    if (!docId) return;
    const ref = doc(db, APPLICATIONS_COL, docId);
    await setDoc(ref, cleanObject(updates), { merge: true });
  } catch (error) {
    console.warn('[Firestore] Erro ao atualizar candidatura no Firestore:', error);
  }
}

export async function deleteApplicationFromFirestore(appId: string): Promise<void> {
  try {
    const docId = sanitizeDocId(appId);
    if (!docId) return;
    addEntityTombstone(APPLICATIONS_COL, docId);
    const ref = doc(db, APPLICATIONS_COL, docId);
    await deleteDoc(ref);
  } catch (error) {
    console.warn('[Firestore] Erro ao eliminar candidatura do Firestore:', error);
  }
}

export async function clearApprovedApplicationsFromFirestore(): Promise<number> {
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
    console.warn('[Firestore] Erro ao limpar candidaturas homologadas:', error);
    return 0;
  }
}

export function subscribeToApplications(
  onUpdate: (apps: PendingApplication[]) => void
): Unsubscribe {
  try {
    const ref = collection(db, APPLICATIONS_COL);
    return onSnapshot(
      ref,
      (snapshot) => {
        const apps: PendingApplication[] = [];
        snapshot.forEach((docSnap) => {
          apps.push(docSnap.data() as PendingApplication);
        });
        onUpdate(apps);
      },
      (error) => {
        console.warn('[Firestore] Realtime applications subscription error:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Falha ao iniciar listener de candidaturas:', err);
    return () => {};
  }
}

// ============================================================================
// 2. QUICK REQUESTS (SERVIÇOS RÁPIDOS) - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveQuickRequestToFirestore(request: QuickServiceRequest): Promise<void> {
  try {
    const docId = sanitizeDocId(request.id);
    if (!docId) return;
    removeEntityTombstone(QUICK_REQUESTS_COL, docId);
    const ref = doc(db, QUICK_REQUESTS_COL, docId);
    await setDoc(ref, cleanObject(request), { merge: true });
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar pedido de serviço rápido no Firestore:', error);
  }
}

export async function fetchQuickRequestsFromFirestore(): Promise<QuickServiceRequest[]> {
  try {
    const ref = collection(db, QUICK_REQUESTS_COL);
    const snapshot = await getDocs(ref);
    const list: QuickServiceRequest[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as QuickServiceRequest);
    });
    return list;
  } catch (error) {
    console.warn('[Firestore] Erro ao buscar pedidos de serviços rápidos na nuvem:', error);
    return [];
  }
}

export async function updateQuickRequestInFirestore(
  id: string,
  updates: Partial<QuickServiceRequest>
): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    const ref = doc(db, QUICK_REQUESTS_COL, docId);
    await setDoc(ref, cleanObject(updates), { merge: true });
  } catch (error) {
    console.warn('[Firestore] Erro ao atualizar pedido de serviço rápido no Firestore:', error);
  }
}

export async function deleteQuickRequestFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(QUICK_REQUESTS_COL, docId);
    const ref = doc(db, QUICK_REQUESTS_COL, docId);
    await deleteDoc(ref);
  } catch (error) {
    console.warn('[Firestore] Erro ao eliminar pedido no Firestore:', error);
  }
}

export async function clearAllQuickRequestsFromFirestore(): Promise<number> {
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
    console.warn('[Firestore] Erro ao limpar pedidos de serviços rápidos:', error);
    return 0;
  }
}

export function subscribeToQuickRequests(
  onUpdate: (requests: QuickServiceRequest[]) => void
): Unsubscribe {
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
        console.warn('[Firestore] QuickRequests real-time subscription error:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Falha ao iniciar listener de pedidos rápidos:', err);
    return () => {};
  }
}

// ============================================================================
// 3. USERS - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveUserToFirestore(user: UserAccount): Promise<void> {
  try {
    const docId = sanitizeDocId((user.email || user.id || '').trim().toLowerCase());
    if (!docId) return;
    const ref = doc(db, USERS_COL, docId);
    await setDoc(ref, cleanObject({ ...user, userId: user.id || docId }), { merge: true });
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar usuário no Firestore:', error);
  }
}

export async function fetchUserFromFirestore(userIdOrEmail: string): Promise<UserAccount | null> {
  try {
    const key = sanitizeDocId(userIdOrEmail.trim().toLowerCase());
    if (!key) return null;
    const ref = doc(db, USERS_COL, key);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserAccount;
    }
    return null;
  } catch (error) {
    console.warn('[Firestore] Erro ao buscar usuário no Firestore:', error);
    return null;
  }
}

export function subscribeToUsers(onUpdate: (users: UserAccount[]) => void): Unsubscribe {
  try {
    const ref = collection(db, USERS_COL);
    return onSnapshot(
      ref,
      (snapshot) => {
        const list: UserAccount[] = [];
        snapshot.forEach((d) => list.push(d.data() as UserAccount));
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Users subscription error:', err)
    );
  } catch {
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
    removeEntityTombstone(SCHOOLS_COL, school.name.trim().toLowerCase());
    const ref = doc(db, SCHOOLS_COL, docId);
    await setDoc(ref, cleanObject({ ...school, updatedAt: new Date().toISOString() }), { merge: true });
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
    console.warn('[Firestore] Erro ao buscar escolas no Firestore:', error);
    return [];
  }
}

export function subscribeToSchools(onUpdate: (schools: AdminSchool[]) => void): Unsubscribe {
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
      (err) => console.warn('[Firestore] Schools subscription error:', err)
    );
  } catch {
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
    const id = sanitizeDocId(teacher.id || (teacher as any).nomeCompleto || (teacher as any).name);
    if (!id) return;
    removeEntityTombstone(TEACHERS_COL, id);
    const ref = doc(db, TEACHERS_COL, id);
    await setDoc(ref, cleanObject({ ...teacher, id, updatedAt: new Date().toISOString() }), { merge: true });
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
  try {
    const snapshot = await getDocs(collection(db, TEACHERS_COL));
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch {
    return [];
  }
}

export function subscribeToTeachers(onUpdate: (teachers: any[]) => void): Unsubscribe {
  try {
    return onSnapshot(
      collection(db, TEACHERS_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Teachers subscription error:', err)
    );
  } catch {
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
    const id = sanitizeDocId(student.id || (student as any).nomeCompleto || (student as any).name);
    if (!id) return;
    removeEntityTombstone(STUDENTS_COL, id);
    const nomeCompleto = (student as any).nomeCompleto || (student as any).name || 'Estudante';
    const schoolId = (student as any).schoolId || (student as any).escola || (student as any).schoolName || 'escola_municipal';
    const turma = (student as any).turma || 'Turma A';
    const classe = (student as any).classe || (student as any).gradeClass || (student as any).classeEtapaModulo || '1ª Classe';

    const ref = doc(db, STUDENTS_COL, id);
    await setDoc(
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
  try {
    const snapshot = await getDocs(collection(db, STUDENTS_COL));
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch {
    return [];
  }
}

export function subscribeToStudents(onUpdate: (students: any[]) => void): Unsubscribe {
  try {
    return onSnapshot(
      collection(db, STUDENTS_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Students subscription error:', err)
    );
  } catch {
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
    const id = sanitizeDocId(director.id || (director as any).nomeCompleto || (director as any).name);
    if (!id) return;
    removeEntityTombstone(DIRECTORS_COL, id);
    const ref = doc(db, DIRECTORS_COL, id);
    await setDoc(ref, cleanObject({ ...director, id, updatedAt: new Date().toISOString() }), { merge: true });
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
  try {
    return onSnapshot(
      collection(db, DIRECTORS_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Directors subscription error:', err)
    );
  } catch {
    return () => {};
  }
}

export async function saveDmeStaffToFirestore(staff: Record<string, any>): Promise<void> {
  try {
    const id = sanitizeDocId(staff.id || staff.email || staff.role);
    if (!id) return;
    removeEntityTombstone(DME_STAFF_COL, id);
    const ref = doc(db, DME_STAFF_COL, id);
    await setDoc(ref, cleanObject({ ...staff, id, updatedAt: new Date().toISOString() }), { merge: true });
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar membro DME no Firestore:', error);
  }
}

export async function deleteDmeStaffFromFirestore(staffId: string): Promise<void> {
  try {
    const docId = sanitizeDocId(staffId);
    if (!docId) return;
    addEntityTombstone(DME_STAFF_COL, docId);
    await deleteDoc(doc(db, DME_STAFF_COL, docId));
  } catch (error) {
    console.warn('[Firestore] Erro ao eliminar membro DME no Firestore:', error);
  }
}

export function subscribeToDmeStaff(onUpdate: (staff: any[]) => void): Unsubscribe {
  try {
    return onSnapshot(
      collection(db, DME_STAFF_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] DME Staff subscription error:', err)
    );
  } catch {
    return () => {};
  }
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
  try {
    const snapshot = await getDocs(collection(db, EFECTIVIDADE_COL));
    const list: any[] = [];
    snapshot.forEach((d) => list.push(d.data()));
    return list;
  } catch {
    return [];
  }
}

export function subscribeToEfectividade(onUpdate: (records: any[]) => void): Unsubscribe {
  try {
    return onSnapshot(
      collection(db, EFECTIVIDADE_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Efectividade subscription error:', err)
    );
  } catch {
    return () => {};
  }
}

// ============================================================================
// 9. MINI-PAUTAS & GRADES - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveMiniPautaToFirestore(record: Record<string, any>): Promise<void> {
  try {
    const key = `${record.classe || ''}_${record.turma || ''}_${record.disciplina || ''}_${record.schoolName || ''}`
      .trim()
      .toLowerCase();
    const docId = sanitizeDocId(record.id || key);
    if (!docId) return;
    const ref = doc(db, GRADES_COL, docId);
    await setDoc(ref, cleanObject({ ...record, id: record.id || docId }), { merge: true });
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar mini-pauta no Firestore:', error);
  }
}

export function subscribeToMiniPautas(onUpdate: (records: any[]) => void): Unsubscribe {
  try {
    return onSnapshot(
      collection(db, GRADES_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Grades/MiniPautas subscription error:', err)
    );
  } catch {
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
  try {
    return onSnapshot(
      collection(db, ATTENDANCE_COL),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push(d.data()));
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Attendance subscription error:', err)
    );
  } catch {
    return () => {};
  }
}

// ============================================================================
// 11. ANNOUNCEMENTS, ROOMS, CLASSES & CHAT - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveAnnouncementToFirestore(announcement: SchoolAnnouncement): Promise<void> {
  try {
    const docId = sanitizeDocId(announcement.id);
    if (!docId) return;
    removeEntityTombstone(ANNOUNCEMENTS_COL, docId);
    const ref = doc(db, ANNOUNCEMENTS_COL, docId);
    await setDoc(ref, cleanObject(announcement), { merge: true });
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar anúncio no Firestore:', error);
  }
}

export async function deleteAnnouncementFromFirestore(id: string): Promise<void> {
  try {
    const docId = sanitizeDocId(id);
    if (!docId) return;
    addEntityTombstone(ANNOUNCEMENTS_COL, docId);
    await deleteDoc(doc(db, ANNOUNCEMENTS_COL, docId));
  } catch (error) {
    console.warn('[Firestore] Erro ao eliminar anúncio no Firestore:', error);
  }
}

export function subscribeToAnnouncements(onUpdate: (list: SchoolAnnouncement[]) => void): Unsubscribe {
  try {
    return onSnapshot(
      collection(db, ANNOUNCEMENTS_COL),
      (snapshot) => {
        const list: SchoolAnnouncement[] = [];
        snapshot.forEach((d) => list.push(d.data() as SchoolAnnouncement));
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Announcements subscription error:', err)
    );
  } catch {
    return () => {};
  }
}

export async function saveRoomToFirestore(room: DirectorRoom): Promise<void> {
  try {
    const docId = sanitizeDocId(room.id || room.roomNumber);
    if (!docId) return;
    const ref = doc(db, ROOMS_COL, docId);
    await setDoc(ref, cleanObject(room), { merge: true });
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar sala no Firestore:', error);
  }
}

export function subscribeToRooms(onUpdate: (list: DirectorRoom[]) => void): Unsubscribe {
  try {
    return onSnapshot(
      collection(db, ROOMS_COL),
      (snapshot) => {
        const list: DirectorRoom[] = [];
        snapshot.forEach((d) => list.push(d.data() as DirectorRoom));
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Rooms subscription error:', err)
    );
  } catch {
    return () => {};
  }
}

export async function saveClassToFirestore(cls: DirectorClass): Promise<void> {
  try {
    const docId = sanitizeDocId(cls.id || cls.name);
    if (!docId) return;
    const ref = doc(db, CLASSES_COL, docId);
    await setDoc(ref, cleanObject(cls), { merge: true });
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar classe no Firestore:', error);
  }
}

export function subscribeToClasses(onUpdate: (list: DirectorClass[]) => void): Unsubscribe {
  try {
    return onSnapshot(
      collection(db, CLASSES_COL),
      (snapshot) => {
        const list: DirectorClass[] = [];
        snapshot.forEach((d) => list.push(d.data() as DirectorClass));
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Classes subscription error:', err)
    );
  } catch {
    return () => {};
  }
}

export async function saveChatMessageToFirestore(message: ChatMessage): Promise<void> {
  try {
    const docId = sanitizeDocId(message.id);
    if (!docId) return;
    const ref = doc(db, CHAT_MESSAGES_COL, docId);
    await setDoc(ref, cleanObject(message), { merge: true });
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar mensagem de chat no Firestore:', error);
  }
}

export function subscribeToChatMessages(onUpdate: (list: ChatMessage[]) => void): Unsubscribe {
  try {
    return onSnapshot(
      collection(db, CHAT_MESSAGES_COL),
      (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((d) => list.push(d.data() as ChatMessage));
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] ChatMessages subscription error:', err)
    );
  } catch {
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
  }
}

export function initUnifiedRealtimeDatabaseSync(): () => void {
  if (typeof window === 'undefined') return () => {};
  if (globalRealtimeUnsubscribe) {
    return globalRealtimeUnsubscribe;
  }

  const unsubs: Unsubscribe[] = [];
  const norm = (s?: string) => (s || '').trim().toLowerCase();

  // 1. REAL-TIME SCHOOLS UNIFICATION (ucore_admin_schools & sigre_school_registrations)
  unsubs.push(
    subscribeToSchools((cloudSchools) => {
      try {
        const localAdminSchools = safeReadJsonArray<AdminSchool>('ucore_admin_schools');
        const map = new Map<string, AdminSchool>();

        // Push any unsynced local schools to Firestore
        localAdminSchools.forEach((ls) => {
          if (!ls || !ls.name || norm(ls.name).includes('modelo central')) return;
          const k = norm(ls.id || ls.name);
          if (isEntityTombstoned(SCHOOLS_COL, ls.id) || isEntityTombstoned(SCHOOLS_COL, ls.name)) return;
          map.set(k, ls);
          const inCloud = cloudSchools.some(
            (cs) => norm(cs.id) === norm(ls.id) || norm(cs.name) === norm(ls.name)
          );
          if (!inCloud) {
            saveSchoolToFirestore(ls).catch(() => {});
          }
        });

        // Merge authoritative cloud schools
        cloudSchools.forEach((cs) => {
          if (!cs || !cs.name || norm(cs.name).includes('modelo central')) return;
          if (isEntityTombstoned(SCHOOLS_COL, cs.id) || isEntityTombstoned(SCHOOLS_COL, cs.name)) return;
          const matchKey =
            Array.from(map.keys()).find((k) => {
              const item = map.get(k);
              return item && (norm(item.id) === norm(cs.id) || norm(item.name) === norm(cs.name));
            }) || norm(cs.id || cs.name);
          const existing = map.get(matchKey);
          map.set(matchKey, existing ? { ...existing, ...cs, registrationData: cs.registrationData || existing.registrationData } : cs);
        });

        const unifiedSchools = Array.from(map.values());
        const changedSchools = safeWriteJsonIfChanged('ucore_admin_schools', unifiedSchools);

        const unifiedRegs = unifiedSchools
          .map((s) => s.registrationData)
          .filter(Boolean);
        if (unifiedRegs.length > 0) {
          safeWriteJsonIfChanged('sigre_school_registrations', unifiedRegs);
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
          const id = String(item.id || item.nomeCompleto || item.name || '').trim();
          const name = String(item.nomeCompleto || item.name || item.registrationData?.nomeCompleto || '').trim();
          if (!id && !name) return;
          if (isEntityTombstoned(TEACHERS_COL, id) || isEntityTombstoned(TEACHERS_COL, name)) return;

          const schoolName = String(
            item.nomeEscola || item.schoolName || item.registrationData?.nomeEscola || 'Escola Municipal de Quêssua'
          ).trim();
          if (norm(schoolName).includes('modelo central')) return;

          const key = norm(id || name);
          const regData: TeacherRegistrationData | undefined =
            item.nomeCompleto ? item : item.registrationData;

          if (regData && regData.nomeCompleto) {
            regMap.set(key, { ...(regMap.get(key) || {}), ...regData });
          }

          const subject = String(item.subject || item.disciplinas || regData?.disciplinas || 'Língua Portuguesa');
          const gradeClass = String(
            item.gradeClass || item.niveisLecciona?.[0]?.nome || regData?.niveisLecciona?.[0]?.nome || 'Ensino Primário'
          );
          const phone = String(item.phone || item.telefone || regData?.telefone || '+244 923 000 000');
          const email = String(item.email || regData?.email || '');
          const room = String(item.room || 'Sala 01');
          const turma = String(item.turma || 'Turma A');

          const adminObj: AdminTeacher = {
            id: id || `prof-${Date.now()}`,
            name: name,
            phone,
            gradeClass,
            room,
            turma,
            category: item.category || item.funcaoCategoria || regData?.funcaoCategoria || 'Docente / Professor',
            location: item.location || `${item.municipioEscola || regData?.municipioEscola || 'Quêssua'}`,
            schoolName,
            schoolId: item.schoolId || item.escolaId || regData?.escolaId,
            presenceRate: typeof item.presenceRate === 'number' ? item.presenceRate : 100,
            subject,
            gender: (item.gender || (item.sexo === 'Feminino' || regData?.sexo === 'Feminino' ? 'F' : 'M')) as 'M' | 'F',
            qualification: item.qualification || item.nivelAcademico || regData?.nivelAcademico,
            registrationData: regData || adminMap.get(key)?.registrationData,
          };
          adminMap.set(key, { ...(adminMap.get(key) || {}), ...adminObj });

          const shiftVal = (item.shift || (item.turnos?.[0] === 'Tarde' ? 'Tarde' : 'Manhã')) as 'Manhã' | 'Tarde';
          const dirObj: DirectorTeacher = {
            id: adminObj.id,
            name: adminObj.name,
            schoolName: adminObj.schoolName,
            gradeClass: adminObj.gradeClass,
            room: adminObj.room,
            turma: adminObj.turma,
            directorName: item.directorName || 'Direção Escolar',
            location: adminObj.location,
            subject: adminObj.subject,
            presenceRate: adminObj.presenceRate,
            shift: shiftVal,
            phone: adminObj.phone,
            email: email || undefined,
            registrationData: adminObj.registrationData,
            schedule: item.schedule || dirMap.get(key)?.schedule || [
              {
                day: 'Segunda',
                period: shiftVal === 'Tarde' ? '13h00 - 17h15' : '07h30 - 12h00',
                subject: adminObj.subject,
                room: adminObj.room,
              },
            ],
          };
          dirMap.set(key, { ...(dirMap.get(key) || {}), ...dirObj });

          if (!fromCloud) {
            const existsInCloud = cloudTeachers.some(
              (ct) => norm(ct.id) === norm(id) || norm(ct.nomeCompleto || ct.name) === norm(name)
            );
            if (!existsInCloud) {
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
        const localTeacher = safeReadJsonArray< any >('ucore_teacher_students');

        const regMap = new Map<string, StudentRegistrationData>();
        const adminMap = new Map<string, AdminStudent>();
        const dirMap = new Map<string, DirectorStudent>();
        const teacherMap = new Map<string, any>();

        const ingestStudentItem = (item: any, fromCloud: boolean) => {
          if (!item) return;
          const id = String(item.id || '').trim();
          const name = String(item.nomeCompleto || item.name || item.registrationData?.nomeCompleto || '').trim();
          if (!id && !name) return;
          if (isEntityTombstoned(STUDENTS_COL, id) || isEntityTombstoned(STUDENTS_COL, name)) return;

          const schoolName = String(
            item.escola || item.schoolName || item.registrationData?.escola || 'Escola Oficial'
          ).trim();
          if (norm(schoolName).includes('modelo central')) return;

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

          const regObj: StudentRegistrationData = {
            ...(regMap.get(key) || {}),
            ...(item.registrationData || {}),
            ...(item.nomeCompleto || item.escola ? item : {}),
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
            if (!existsInCloud) {
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
          const id = String(item.id || '').trim();
          const name = String(item.nomeCompleto || item.name || item.registrationData?.nomeCompleto || '').trim();
          if (!id && !name) return;
          if (isEntityTombstoned(DIRECTORS_COL, id) || isEntityTombstoned(DIRECTORS_COL, name)) return;

          const schoolName = String(
            item.nomeEscola || item.schoolName || item.registrationData?.nomeEscola || ''
          ).trim();
          if (norm(schoolName).includes('modelo central')) return;

          const key = norm(id || name);
          const regData: DirectorRegistrationData | undefined =
            item.nomeCompleto ? item : item.registrationData;
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
            if (!existsInCloud) {
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
          if (!s) return;
          const k = norm(s.id || s.email || s.role);
          if (!k || isEntityTombstoned(DME_STAFF_COL, k)) return;
          map.set(k, s);
          const inCloud = cloudStaff.some((cs) => norm(cs.id || cs.email || cs.role) === k);
          if (!inCloud) {
            saveDmeStaffToFirestore(s).catch(() => {});
          }
        });

        cloudStaff.forEach((cs) => {
          if (!cs) return;
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
          if (!lr || !lr.id) return;
          if (deletedSet.has(norm(lr.id)) || isEntityTombstoned(EFECTIVIDADE_COL, lr.id)) return;
          map.set(lr.id, lr);
          const inCloud = cloudRecords.some((cr) => cr && cr.id === lr.id);
          if (!inCloud) {
            saveEfectividadeToFirestore(lr).catch(() => {});
          }
        });

        cloudRecords.forEach((cr) => {
          if (!cr || !cr.id) return;
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

  // 6. REAL-TIME MINI-PAUTAS / GRADES UNIFICATION
  unsubs.push(
    subscribeToMiniPautas((cloudPautas) => {
      try {
        const localPautas = safeReadJsonArray<any>('sigre_teacher_mini_pautas_v5_blank');
        const map = new Map<string, any>();
        const getKey = (r: any) =>
          `${norm(r.classe)}::${norm(r.turma)}::${norm(r.disciplina)}::${norm(r.schoolName)}`;

        localPautas.forEach((lp) => {
          if (!lp) return;
          const k = getKey(lp);
          map.set(k, lp);
          const inCloud = cloudPautas.some((cp) => getKey(cp) === k);
          if (!inCloud) {
            saveMiniPautaToFirestore(lp).catch(() => {});
          }
        });

        cloudPautas.forEach((cp) => {
          if (!cp) return;
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
          if (!r || !r.studentId || !r.date) return;
          const k = `${r.studentId}_${r.date}`;
          stuMap.set(k, r);
          const inCloud = cloudAttendance.some(
            (ca) => ca.attendanceKind === 'student' && ca.studentId === r.studentId && ca.date === r.date
          );
          if (!inCloud) {
            saveAttendanceToFirestore(r, 'student').catch(() => {});
          }
        });

        localTeachersAtt.forEach((r) => {
          if (!r || !r.teacherId || !r.date) return;
          const k = `${r.teacherId}_${r.date}`;
          teaMap.set(k, r);
          const inCloud = cloudAttendance.some(
            (ca) => ca.attendanceKind === 'teacher' && ca.teacherId === r.teacherId && ca.date === r.date
          );
          if (!inCloud) {
            saveAttendanceToFirestore(r, 'teacher').catch(() => {});
          }
        });

        cloudAttendance.forEach((ca) => {
          if (!ca) return;
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
          if (!la || !la.id || isEntityTombstoned(ANNOUNCEMENTS_COL, la.id)) return;
          map.set(la.id, la);
          if (!cloudAnn.some((ca) => ca.id === la.id)) {
            saveAnnouncementToFirestore(la).catch(() => {});
          }
        });

        cloudAnn.forEach((ca) => {
          if (!ca || !ca.id || isEntityTombstoned(ANNOUNCEMENTS_COL, ca.id)) return;
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
          if (!lr || !lr.id) return;
          map.set(lr.id, lr);
          if (!cloudRooms.some((cr) => cr.id === lr.id)) {
            saveRoomToFirestore(lr).catch(() => {});
          }
        });
        cloudRooms.forEach((cr) => {
          if (!cr || !cr.id) return;
          map.set(cr.id, { ...(map.get(cr.id) || {}), ...cr });
        });
        const merged = Array.from(map.values());
        if (merged.length > 0 && safeWriteJsonIfChanged('ucore_director_rooms', merged)) {
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
          if (!lc || !lc.id) return;
          map.set(lc.id, lc);
          if (!cloudClasses.some((cc) => cc.id === lc.id)) {
            saveClassToFirestore(lc).catch(() => {});
          }
        });
        cloudClasses.forEach((cc) => {
          if (!cc || !cc.id) return;
          map.set(cc.id, { ...(map.get(cc.id) || {}), ...cc });
        });
        const merged = Array.from(map.values());
        if (merged.length > 0 && safeWriteJsonIfChanged('ucore_director_classes', merged)) {
          window.dispatchEvent(new CustomEvent('sigre-data-synced'));
        }
      } catch {}
    })
  );

  unsubs.push(
    subscribeToUsers((cloudUsers) => {
      try {
        const localUsers = safeReadJsonArray<UserAccount>('ucore_registered_users');
        const map = new Map<string, UserAccount>();
        localUsers.forEach((lu) => {
          if (!lu || !lu.email) return;
          const k = norm(lu.email);
          map.set(k, lu);
          if (!cloudUsers.some((cu) => norm(cu.email) === k)) {
            saveUserToFirestore(lu).catch(() => {});
          }
        });
        cloudUsers.forEach((cu) => {
          if (!cu || !cu.email) return;
          const k = norm(cu.email);
          map.set(k, { ...(map.get(k) || {}), ...cu });
        });
        safeWriteJsonIfChanged('ucore_registered_users', Array.from(map.values()));
      } catch {}
    })
  );

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
