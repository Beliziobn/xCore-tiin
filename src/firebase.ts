import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  setLogLevel,
  terminate,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase app singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Preserve error-level @firebase/firestore logs (index/permission/offline failures)
// while avoiding verbose debug/info noise
try {
  setLogLevel('error');
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
// (prevents WebStorageSharedClientState QuotaExceededError b815 and WebChannel 10s proxy timeouts)
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

export let db: Firestore = initDurableFirestore();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let firestoreResetInFlight: Promise<void> | null = null;

/**
 * Terminates the active Firestore client (clearing any in-memory WriteStream mutation queue
 * stuck in exponential backoff after resource-exhausted) and spins up a fresh instance
 * so read queries/listeners can continue cleanly without background retry storms.
 */
export async function resetFirestoreInstanceAfterWriteQuota(): Promise<void> {
  if (firestoreResetInFlight) {
    return firestoreResetInFlight;
  }
  firestoreResetInFlight = (async () => {
    try {
      await Promise.race([
        terminate(db),
        new Promise<void>((resolve) => setTimeout(resolve, 1500)),
      ]);
    } catch {}
    try {
      db = initDurableFirestore();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sigre-firestore-reinitialized'));
      }
    } catch (err) {
      console.warn('[Firestore] Falha ao reinicializar instância após cota:', err);
    }
  })().finally(() => {
    firestoreResetInFlight = null;
  });

  return firestoreResetInFlight;
}

// Observe @firebase/firestore SDK error logs so resource-exhausted on WriteStream is caught
// immediately (0ms) rather than waiting for an 8s write timeout while SDK loops in backoff.
function installFirestoreQuotaConsoleObserver(): void {
  if (typeof window === 'undefined' || typeof console === 'undefined') return;
  const w = window as any;
  if (w.__sigreFsQuotaObserverInstalled) return;
  w.__sigreFsQuotaObserverInstalled = true;

  const origError = console.error.bind(console);
  console.error = (...args: any[]) => {
    try {
      const joined = args
        .map((a) => (typeof a === 'string' ? a : a instanceof Error ? a.message : ''))
        .join(' ')
        .toLowerCase();
      if (
        joined.includes('@firebase/firestore') &&
        (joined.includes('resource-exhausted') ||
          joined.includes('quota limit exceeded') ||
          joined.includes('free daily write units') ||
          joined.includes('free daily read units'))
      ) {
        const isWrite =
          joined.includes('free daily write units') ||
          joined.includes('write units') ||
          !joined.includes('read units');
        window.dispatchEvent(
          new CustomEvent('sigre-firestore-sdk-quota', {
            detail: { message: joined, isWrite },
          })
        );
      }
    } catch {}
    origError(...args);
  };
}

installFirestoreQuotaConsoleObserver();

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore at most once per browser tab session
export async function testConnection() {
  try {
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore connection test timeout')), 6000)
      ),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firebase client is offline or network connection is limited.', error);
    } else {
      console.warn('[Firestore] Aviso na verificação de ligação inicial:', error);
    }
  }
}

if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
  try {
    if (!sessionStorage.getItem('sigre_fs_conn_checked')) {
      sessionStorage.setItem('sigre_fs_conn_checked', '1');
      testConnection().catch((err) => {
        console.error('[Firestore] Erro inesperado ao testar ligação:', err);
      });
    }
  } catch {}
}
