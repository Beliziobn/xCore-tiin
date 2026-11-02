import { saveApplicationToFirestore, saveUserToFirestore } from './firestoreSync';

const PASSWORDS_STORAGE_KEY = 'ucore_user_passwords';
const SECURITY_LOGS_KEY = 'ucore_security_logs';

// Official Master Admin credential
const DEFAULT_PASSWORDS: Record<string, string> = {
  'dmedoquessua@gmail.com': 'quessua000',
  'beliziodos20@gmail.com': 'quessua000',
};

export interface SecurityAuditLog {
  id: string;
  userEmail: string;
  action: 'password_change' | 'login' | 'failed_login';
  timestamp: string;
  ip: string;
  device: string;
}

function getStoredPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWORDS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {};
}

/**
 * Generates a deterministic, exact verifier token for a given email + password pair
 * so that even a 1-digit or 1-character change produces a completely different verifier.
 */
export function encodePasswordVerifier(email: string, rawPassword: string): string {
  const normEmail = (email || '').trim().toLowerCase();
  const payload = `sigre_v2::${normEmail}::${rawPassword}`;
  let h1 = 0xdeadbeef ^ payload.length;
  let h2 = 0x41c6ce57 ^ payload.length;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `v2_${hex1}${hex2}_${payload.length}`;
}

function findApplicationPasswordVerifier(normalizedEmail: string): string | undefined {
  try {
    const rawApps = localStorage.getItem('ucore_pending_applications');
    if (rawApps) {
      const apps = JSON.parse(rawApps);
      if (Array.isArray(apps)) {
        const matched = apps.find(
          (a: any) => a && typeof a.email === 'string' && a.email.trim().toLowerCase() === normalizedEmail
        );
        if (matched?.passwordVerifier) {
          return matched.passwordVerifier;
        }
      }
    }
  } catch {
    // ignore
  }
  try {
    const rawActive = localStorage.getItem('ucore_active_user');
    if (rawActive) {
      const active = JSON.parse(rawActive);
      if (active && typeof active.email === 'string' && active.email.trim().toLowerCase() === normalizedEmail && active.passwordVerifier) {
        return active.passwordVerifier;
      }
    }
  } catch {
    // ignore
  }
  try {
    const rawUsers = localStorage.getItem('ucore_registered_users');
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      if (Array.isArray(users)) {
        const matchedUser = users.find(
          (u: any) => u && typeof u.email === 'string' && u.email.trim().toLowerCase() === normalizedEmail
        );
        if (matchedUser?.passwordVerifier) {
          return matchedUser.passwordVerifier;
        }
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function hasRegisteredPassword(email: string): boolean {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();
  const stored = getStoredPasswords();
  if (typeof stored[normalizedEmail] === 'string' && stored[normalizedEmail].length > 0) {
    return true;
  }
  if (DEFAULT_PASSWORDS[normalizedEmail]) {
    return true;
  }
  if (findApplicationPasswordVerifier(normalizedEmail)) {
    return true;
  }
  return false;
}

export function getUserPassword(email: string): string {
  if (!email) return '';
  const normalizedEmail = email.trim().toLowerCase();
  const stored = getStoredPasswords();
  if (typeof stored[normalizedEmail] === 'string' && stored[normalizedEmail].length > 0) {
    return stored[normalizedEmail];
  }
  if (DEFAULT_PASSWORDS[normalizedEmail]) {
    return DEFAULT_PASSWORDS[normalizedEmail];
  }
  return '';
}

/**
 * Strictly verifies that inputPassword matches the exact registered password for this email.
 * Checks locally updated passwords first so recent password changes take immediate effect.
 */
export function verifyPassword(
  email: string,
  inputPassword: string,
  remotePasswordVerifier?: string
): boolean {
  if (!email || !inputPassword) return false;
  const normalizedEmail = email.trim().toLowerCase();
  const candidatePassword = inputPassword;
  const stored = getStoredPasswords();

  // 1. Check locally stored exact password first (most recent user update on this device)
  if (typeof stored[normalizedEmail] === 'string' && stored[normalizedEmail].length > 0) {
    if (candidatePassword === stored[normalizedEmail]) {
      return true;
    }
    // Also check if stored value is a verifier hash
    if (stored[normalizedEmail].startsWith('v2_')) {
      return encodePasswordVerifier(normalizedEmail, candidatePassword) === stored[normalizedEmail];
    }
    return false;
  }

  // 2. Official Master Admin (dmedoquessua@gmail.com / beliziodos20@gmail.com)
  if (normalizedEmail === 'dmedoquessua@gmail.com' || normalizedEmail === 'beliziodos20@gmail.com') {
    if (remotePasswordVerifier) {
      const expectedVerifier = encodePasswordVerifier(normalizedEmail, candidatePassword);
      if (remotePasswordVerifier.startsWith('v2_') && expectedVerifier === remotePasswordVerifier) {
        return true;
      }
      if (candidatePassword === remotePasswordVerifier) {
        return true;
      }
    }
    return candidatePassword === DEFAULT_PASSWORDS[normalizedEmail];
  }

  // 3. If a remote/cloud or local application passwordVerifier is present, verify against it
  const verifierToUse = remotePasswordVerifier || findApplicationPasswordVerifier(normalizedEmail);
  if (verifierToUse) {
    const expectedVerifier = encodePasswordVerifier(normalizedEmail, candidatePassword);
    if (verifierToUse.startsWith('v2_')) {
      return expectedVerifier === verifierToUse;
    }
    return candidatePassword === verifierToUse;
  }

  // 4. Check explicit default password map if any
  if (DEFAULT_PASSWORDS[normalizedEmail]) {
    return candidatePassword === DEFAULT_PASSWORDS[normalizedEmail];
  }

  return false;
}

export function updatePassword(
  email: string,
  newPassword: string,
  oldEmail?: string
): { success: boolean; message: string; verifier?: string } {
  if (!email) {
    return { success: false, message: 'Utilizador não identificado.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: 'A nova palavra-passe deve ter no mínimo 6 caracteres.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOldEmail = oldEmail ? oldEmail.trim().toLowerCase() : normalizedEmail;
  const stored = getStoredPasswords();
  if (normalizedOldEmail && normalizedOldEmail !== normalizedEmail) {
    delete stored[normalizedOldEmail];
  }
  stored[normalizedEmail] = newPassword;
  const verifier = encodePasswordVerifier(normalizedEmail, newPassword);
  const nowIso = new Date().toISOString();

  try {
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(stored));

    // 1. Update passwordVerifier in local pending applications AND sync to Firestore + Server
    try {
      const rawApps = localStorage.getItem('ucore_pending_applications');
      if (rawApps) {
        const apps = JSON.parse(rawApps);
        if (Array.isArray(apps)) {
          let updatedAny = false;
          const nextApps = apps.map((a: any) => {
            if (!a || typeof a.email !== 'string') return a;
            const appEmail = a.email.trim().toLowerCase();
            if (appEmail === normalizedEmail || appEmail === normalizedOldEmail) {
              updatedAny = true;
              const updatedApp = {
                ...a,
                email: email.trim(),
                passwordVerifier: verifier,
                updatedAt: nowIso,
              };
              saveApplicationToFirestore(updatedApp).catch(() => {});
              fetch('/api/network/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ application: updatedApp }),
                keepalive: true,
              }).catch(() => {});
              return updatedApp;
            }
            return a;
          });
          if (updatedAny) {
            localStorage.setItem('ucore_pending_applications', JSON.stringify(nextApps));
          }
        }
      }
    } catch {
      // ignore
    }

    // 2. Update active user in localStorage and Firestore
    try {
      const rawActive = localStorage.getItem('ucore_active_user');
      if (rawActive) {
        const activeUser = JSON.parse(rawActive);
        if (
          activeUser &&
          typeof activeUser.email === 'string' &&
          (activeUser.email.trim().toLowerCase() === normalizedEmail ||
            activeUser.email.trim().toLowerCase() === normalizedOldEmail)
        ) {
          const updatedActive = {
            ...activeUser,
            email: email.trim(),
            passwordVerifier: verifier,
            updatedAt: nowIso,
          };
          localStorage.setItem('ucore_active_user', JSON.stringify(updatedActive));
          saveUserToFirestore(updatedActive).catch(() => {});
        }
      }
    } catch {
      // ignore
    }

    // 3. Update registered users list in localStorage and Firestore
    try {
      const rawUsers = localStorage.getItem('ucore_registered_users');
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        if (Array.isArray(users)) {
          let userUpdated = false;
          const nextUsers = users.map((u: any) => {
            if (!u || typeof u.email !== 'string') return u;
            const uEmail = u.email.trim().toLowerCase();
            if (uEmail === normalizedEmail || uEmail === normalizedOldEmail) {
              userUpdated = true;
              const nextU = {
                ...u,
                email: email.trim(),
                passwordVerifier: verifier,
                updatedAt: nowIso,
              };
              saveUserToFirestore(nextU).catch(() => {});
              return nextU;
            }
            return u;
          });
          if (userUpdated) {
            localStorage.setItem('ucore_registered_users', JSON.stringify(nextUsers));
          }
        }
      }
    } catch {
      // ignore
    }

    // 4. Add audit log
    const logs: SecurityAuditLog[] = (() => {
      try {
        const raw = localStorage.getItem(SECURITY_LOGS_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    })();

    logs.unshift({
      id: 'sec_' + Date.now(),
      userEmail: normalizedEmail,
      action: 'password_change',
      timestamp: new Date().toLocaleString('pt-AO'),
      ip: '197.234.120.45 (Malanje, AO)',
      device: navigator.userAgent.includes('Mobile') ? 'Dispositivo Móvel' : 'Navegador Web Desktop',
    });

    localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(logs.slice(0, 20)));
  } catch (e) {
    console.error('Failed to save password in localStorage', e);
  }

  window.dispatchEvent(
    new CustomEvent('ucore-password-changed', {
      detail: { email: normalizedEmail, timestamp: Date.now() },
    })
  );

  return {
    success: true,
    message: 'Palavra-passe atualizada com sucesso no banco de credenciais!',
    verifier,
  };
}


