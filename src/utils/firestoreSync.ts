import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { PendingApplication, QuickServiceRequest, UserAccount } from '../types';

const APPLICATIONS_COL = 'applications';
const QUICK_REQUESTS_COL = 'quickRequests';
const USERS_COL = 'users';

// Helper to remove undefined values for Firestore serialization
function cleanObject<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        result[key] = cleanObject(val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

// ============================================================================
// APPLICATIONS (HOMOLOGAÇÕES) - FIRESTORE CLOUD STORE
// ============================================================================

/**
 * Persists an application directly to the Firestore cloud database.
 * This guarantees the application is instantly available on all devices (mobile/desktop).
 */
export async function saveApplicationToFirestore(app: PendingApplication): Promise<void> {
  try {
    const docId = String(app.id || app.userId).trim();
    if (!docId) return;
    const ref = doc(db, APPLICATIONS_COL, docId);
    await setDoc(ref, cleanObject(app), { merge: true });
    console.log('[Firestore] Candidatura/Homologação gravada na nuvem com sucesso:', docId);
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar candidatura no Firestore (fallback ativo):', error);
  }
}

/**
 * Fetches all applications directly from Firestore cloud.
 */
export async function fetchApplicationsFromFirestore(): Promise<PendingApplication[]> {
  try {
    const ref = collection(db, APPLICATIONS_COL);
    const snapshot = await getDocs(ref);
    const list: PendingApplication[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as PendingApplication);
    });
    console.log(`[Firestore] ${list.length} candidaturas recuperadas da nuvem.`);
    return list;
  } catch (error) {
    console.warn('[Firestore] Erro ao buscar candidaturas na nuvem:', error);
    return [];
  }
}

/**
 * Updates an application's status in Firestore (approval, rejection, or updates).
 */
export async function updateApplicationInFirestore(
  appId: string,
  updates: Partial<PendingApplication>
): Promise<void> {
  try {
    const ref = doc(db, APPLICATIONS_COL, appId);
    await updateDoc(ref, cleanObject(updates));
    console.log('[Firestore] Candidatura atualizada na nuvem:', appId);
  } catch (error) {
    console.warn('[Firestore] Erro ao atualizar candidatura no Firestore:', error);
  }
}

/**
 * Deletes an application from Firestore.
 */
export async function deleteApplicationFromFirestore(appId: string): Promise<void> {
  try {
    const ref = doc(db, APPLICATIONS_COL, appId);
    await deleteDoc(ref);
    console.log('[Firestore] Candidatura eliminada da nuvem:', appId);
  } catch (error) {
    console.warn('[Firestore] Erro ao eliminar candidatura do Firestore:', error);
  }
}

/**
 * Batch deletes all approved applications from Firestore.
 */
export async function clearApprovedApplicationsFromFirestore(): Promise<number> {
  try {
    const ref = collection(db, APPLICATIONS_COL);
    const snapshot = await getDocs(ref);
    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((d) => {
      const data = d.data() as PendingApplication;
      if (data.status === 'aprovado' || data.approvedAt) {
        batch.delete(d.ref);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`[Firestore] ${count} candidaturas homologadas eliminadas em lote.`);
    }
    return count;
  } catch (error) {
    console.warn('[Firestore] Erro ao limpar candidaturas homologadas:', error);
    return 0;
  }
}

/**
 * Subscribes to real-time changes of all applications in Firestore.
 * Automatically notifies callback whenever any candidate registers or an admin homologates.
 */
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
        console.warn('[Firestore] Realtime subscription error:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Falha ao iniciar listener em tempo real de candidaturas:', err);
    return () => {};
  }
}

// ============================================================================
// QUICK REQUESTS (SERVIÇOS RÁPIDOS) - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveQuickRequestToFirestore(request: QuickServiceRequest): Promise<void> {
  try {
    const docId = String(request.id).trim();
    if (!docId) return;
    const ref = doc(db, QUICK_REQUESTS_COL, docId);
    await setDoc(ref, cleanObject(request), { merge: true });
    console.log('[Firestore] Pedido de Serviço Rápido gravado na nuvem:', docId);
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
    const ref = doc(db, QUICK_REQUESTS_COL, id);
    await updateDoc(ref, cleanObject(updates));
  } catch (error) {
    console.warn('[Firestore] Erro ao atualizar pedido de serviço rápido no Firestore:', error);
  }
}

export async function deleteQuickRequestFromFirestore(id: string): Promise<void> {
  try {
    const ref = doc(db, QUICK_REQUESTS_COL, id);
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
      batch.delete(d.ref);
      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`[Firestore] ${count} pedidos de serviços rápidos eliminados em lote.`);
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
    console.warn('[Firestore] Falha ao iniciar listener em tempo real de pedidos rápidos:', err);
    return () => {};
  }
}

// ============================================================================
// USERS - FIRESTORE CLOUD STORE
// ============================================================================

export async function saveUserToFirestore(user: UserAccount): Promise<void> {
  try {
    const docId = String(user.id || user.email).trim().toLowerCase();
    if (!docId) return;
    const ref = doc(db, USERS_COL, docId);
    await setDoc(ref, cleanObject(user), { merge: true });
    console.log('[Firestore] Usuário sincronizado na nuvem:', docId);
  } catch (error) {
    console.warn('[Firestore] Erro ao gravar usuário no Firestore:', error);
  }
}

export async function fetchUserFromFirestore(userIdOrEmail: string): Promise<UserAccount | null> {
  try {
    const key = userIdOrEmail.trim().toLowerCase();
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
