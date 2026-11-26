import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  setLogLevel,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase app singleton safely so module evaluation never throws on custom domains
function initSafeFirebaseApp(): FirebaseApp {
  try {
    return !getApps().length ? initializeApp(firebaseConfig) : getApp();
  } catch (err) {
    console.warn('[SIGRE Firebase] Aviso ao inicializar FirebaseApp, a reutilizar instância:', err);
    return getApp();
  }
}

const app = initSafeFirebaseApp();

// Suppress internal @firebase/firestore transport timeout warnings in console.error
// while preserving explicit application & permission error handling via handleFirestoreError
try {
  setLogLevel('silent');
} catch {}

// Clear any orphaned Firestore WebStorage multi-tab keys that may have exhausted localStorage quota
function purgeLegacyFirestoreWebStorage(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('firestore_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  } catch {}
}

// Initialize Firestore with in-memory local cache and automatic long-polling fallback
// (prevents WebStorageSharedClientState QuotaExceededError b815 and WebChannel 10s proxy timeouts behind Cloudflare)
function initDurableFirestore(): Firestore {
  purgeLegacyFirestoreWebStorage();
  const databaseId = (firebaseConfig as Record<string, any>).firestoreDatabaseId;
  try {
    const settings = {
      localCache: memoryLocalCache(),
      experimentalAutoDetectLongPolling: true,
    };
    return databaseId
      ? initializeFirestore(app, settings, databaseId)
      : initializeFirestore(app, settings);
  } catch {
    return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  }
}

function initSafeAuth(): Auth {
  try {
    return getAuth(app);
  } catch (err) {
    console.warn('[SIGRE Firebase] Aviso ao inicializar Firebase Auth:', err);
    return getAuth();
  }
}

export const db = initDurableFirestore();
export const auth = initSafeAuth();
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Logs structured Firestore error diagnostics without throwing an uncaught synchronous exception
 * that could unmount the React render tree on custom domains.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Validate connection to Firestore non-blockingly at most once per browser tab session
export async function testConnection(): Promise<void> {
  try {
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      new Promise<void>((resolve) => setTimeout(resolve, 4000)),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network connection is limited.');
    }
  }
}

if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
  try {
    if (!sessionStorage.getItem('sigre_fs_conn_checked')) {
      sessionStorage.setItem('sigre_fs_conn_checked', '1');
    }
  } catch {}
}

