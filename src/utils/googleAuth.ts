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

/**
 * Perform Google Sign-In with popup to acquire user credentials and Workspace access token.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string; cancelled?: boolean } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso Google.');
    }

    cachedAccessToken = credential.accessToken;
    currentGoogleUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken, cancelled: false };
  } catch (error: any) {
    const isPopupClosedByUser =
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      (typeof error?.message === 'string' && error.message.includes('auth/popup-closed-by-user')) ||
      (typeof error?.message === 'string' && error.message.includes('auth/cancelled-popup-request'));

    if (isPopupClosedByUser) {
      // User closed the popup or cancelled the sign-in prompt - this is standard user behavior
      console.info('Autenticação Google cancelada pelo utilizador (janela fechada).');
      return null;
    }

    const isPopupBlocked =
      error?.code === 'auth/popup-blocked' ||
      (typeof error?.message === 'string' && error.message.includes('auth/popup-blocked'));

    if (isPopupBlocked) {
      console.warn('Pop-up Google bloqueado pelo navegador.');
      throw new Error(
        'A janela de autenticação foi bloqueada pelo navegador. Por favor, permita janelas de pop-up para este site ou abra a aplicação num novo separador.'
      );
    }

    console.warn('Tentativa de autenticação Google não concluída:', error?.message || error);
    throw error;
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
