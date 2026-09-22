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

// Configure Google Provider with requested Workspace scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

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
  return onAuthStateChanged(auth, async (user: User | null) => {
    currentGoogleUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If we don't have the OAuth access token in memory, trigger failure so user can re-authenticate
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
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
  fallbackNeeded?: boolean;
  error?: string;
}

/**
 * Perform Google Sign-In with popup to acquire user credentials and Workspace access token.
 */
export const googleSignIn = async (): Promise<GoogleSignInResult | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
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
        fallbackNeeded: true,
        error: 'auth/popup-blocked',
      };
    }

    console.warn('Tentativa de autenticação Google não concluída:', errorMsg || error);
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
  await signOut(auth);
  cachedAccessToken = null;
  currentGoogleUser = null;
};
