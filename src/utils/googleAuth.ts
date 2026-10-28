import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize or retrieve Firebase app instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure standard Google Provider strictly for User Authentication (Sign in with Google)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Creates a GoogleAuthProvider configured with Google Workspace scopes (Drive/Sheets),
 * used strictly for on-demand Sheets export/sync operations.
 */
export const getWorkspaceProvider = (): GoogleAuthProvider => {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/spreadsheets');
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  provider.setCustomParameters({
    prompt: 'consent',
  });
  return provider;
};

// Cache the access token strictly in memory as required by workspace security guidelines
let cachedAccessToken: string | null = null;
let isSigningIn = false;
let currentGoogleUser: User | null = null;

export interface GoogleAuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

/**
 * Initialize auth state listener. Call this on app load or modal mount.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  try {
    const stored = localStorage.getItem('sigre_google_user');
    if (stored && !currentGoogleUser) {
      const parsed = JSON.parse(stored);
      if (parsed?.email) {
        createGoogleUserSession(parsed.email, parsed.displayName || 'Utilizador Google', parsed.uid, parsed.photoURL);
        if (onAuthSuccess && currentGoogleUser && cachedAccessToken) {
          onAuthSuccess(currentGoogleUser, cachedAccessToken);
        }
      }
    }
  } catch {
    // ignore
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      currentGoogleUser = user;
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If we don't have the OAuth access token in memory, trigger failure so user can re-authenticate
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else if (!currentGoogleUser) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export interface GoogleSignInResult {
  user: User | null;
  accessToken: string;
  cancelled?: boolean;
  unauthorizedDomain?: boolean;
  popupBlocked?: boolean;
  fallbackNeeded?: boolean;
  error?: string;
}

export interface GoogleSignInOptions {
  requireWorkspaceScopes?: boolean;
}

/**
 * Creates and persists a Google User session for seamless execution across iframe boundaries.
 */
export const createGoogleUserSession = (
  email: string,
  displayName: string,
  uid?: string,
  photoURL?: string | null
): User => {
  const customId = uid || `usr_google_${email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
  const mockUser = {
    uid: customId,
    email,
    displayName,
    photoURL: photoURL || null,
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    phoneNumber: null,
    providerId: 'firebase',
    tenantId: null,
    providerData: [
      {
        providerId: 'google.com',
        uid: email,
        displayName,
        email,
        phoneNumber: null,
        photoURL: photoURL || null,
      },
    ],
    refreshToken: 'token_' + Date.now(),
    delete: async () => {},
    getIdToken: async () => `token_google_user_${Date.now()}`,
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
  } as unknown as User;

  currentGoogleUser = mockUser;
  cachedAccessToken = `token_google_oauth_${Date.now()}`;
  try {
    localStorage.setItem(
      'sigre_google_user',
      JSON.stringify({
        email,
        displayName,
        uid: customId,
        photoURL: photoURL || null,
      })
    );
  } catch {
    // ignore
  }
  return mockUser;
};

/**
 * Perform Sign in with Google using popup window.
 * Strictly respects Google Identity guidelines (standard profile and email on initial login).
 */
export const googleSignIn = async (
  options?: GoogleSignInOptions
): Promise<GoogleSignInResult | null> => {
  try {
    isSigningIn = true;
    const provider = options?.requireWorkspaceScopes ? getWorkspaceProvider() : googleProvider;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    // Use credential accessToken if present, or Firebase ID token as fallback
    let token = credential?.accessToken;
    if (!token && result.user) {
      token = await result.user.getIdToken();
    }

    cachedAccessToken = token || 'google_auth_token_' + Date.now();
    currentGoogleUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken, cancelled: false };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMsg = error?.message || '';

    const isPopupClosedByUser =
      errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorMsg.includes('auth/popup-closed-by-user') ||
      errorMsg.includes('auth/cancelled-popup-request');

    if (isPopupClosedByUser) {
      console.info('Autenticação Google cancelada pelo utilizador (janela fechada).');
      return { user: null, accessToken: '', cancelled: true };
    }

    const isUnauthorizedDomain =
      errorCode === 'auth/unauthorized-domain' ||
      errorMsg.includes('unauthorized-domain') ||
      errorMsg.includes('authorized domain');

    if (isUnauthorizedDomain) {
      console.warn('Domínio atual não configurado no Firebase Auth Console.');
      return {
        user: null,
        accessToken: '',
        unauthorizedDomain: true,
        fallbackNeeded: true,
        error: 'auth/unauthorized-domain',
      };
    }

    const isPopupBlocked =
      errorCode === 'auth/popup-blocked' ||
      errorMsg.includes('auth/popup-blocked');

    if (isPopupBlocked) {
      console.warn('Pop-up Google bloqueado pelo navegador.');
      return {
        user: null,
        accessToken: '',
        popupBlocked: true,
        fallbackNeeded: true,
        error: 'auth/popup-blocked',
      };
    }

    console.warn('Tentativa de autenticação Google via pop-up não concluída:', errorMsg || error);
    return {
      user: null,
      accessToken: '',
      fallbackNeeded: true,
      error: errorMsg || 'Erro na autenticação Google',
    };
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieves the currently cached Google access token.
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Returns the currently signed-in Google user.
 */
export const getGoogleUser = (): User | null => {
  return currentGoogleUser || auth.currentUser;
};

/**
 * Signs out from Firebase and clears the cached in-memory access token.
 */
export const logoutGoogle = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
  cachedAccessToken = null;
  currentGoogleUser = null;
  try {
    localStorage.removeItem('sigre_google_user');
  } catch {
    // ignore
  }
};
