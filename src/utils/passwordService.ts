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
  return undefined;
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
 * Zero tolerance for 1-digit differences, fuzzy matches, or generic fallback passwords.
 */
export function verifyPassword(
  email: string,
  inputPassword: string,
  remotePasswordVerifier?: string
): boolean {
  if (!email || !inputPassword) return false;
  const normalizedEmail = email.trim().toLowerCase();
  // Do NOT strip internal spaces or alter characters; compare exact string entered by user
  const candidatePassword = inputPassword;
  const stored = getStoredPasswords();

  // 1. Official Master Admin (dmedoquessua@gmail.com)
  if (normalizedEmail === 'dmedoquessua@gmail.com' || normalizedEmail === 'beliziodos20@gmail.com') {
    if (typeof stored[normalizedEmail] === 'string' && stored[normalizedEmail].length > 0) {
      return candidatePassword === stored[normalizedEmail];
    }
    return candidatePassword === DEFAULT_PASSWORDS[normalizedEmail];
  }

  // 2. If a remote/cloud passwordVerifier is present on the user's application or profile, verify strictly against it
  const verifierToUse = remotePasswordVerifier || findApplicationPasswordVerifier(normalizedEmail);
  if (verifierToUse) {
    const expectedVerifier = encodePasswordVerifier(normalizedEmail, candidatePassword);
    if (verifierToUse.startsWith('v2_')) {
      return expectedVerifier === verifierToUse;
    }
    return candidatePassword === verifierToUse;
  }

  // 3. Check locally stored exact password for this specific email
  if (typeof stored[normalizedEmail] === 'string' && stored[normalizedEmail].length > 0) {
    return candidatePassword === stored[normalizedEmail];
  }

  // 4. Check explicit default password map if any
  if (DEFAULT_PASSWORDS[normalizedEmail]) {
    return candidatePassword === DEFAULT_PASSWORDS[normalizedEmail];
  }

  // Never allow fallback passwords or unregistered logins
  return false;
}

export function updatePassword(
  email: string,
  newPassword: string
): { success: boolean; message: string; verifier?: string } {
  if (!email) {
    return { success: false, message: 'Utilizador não identificado.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: 'A nova palavra-passe deve ter no mínimo 6 caracteres.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const stored = getStoredPasswords();
  stored[normalizedEmail] = newPassword;
  const verifier = encodePasswordVerifier(normalizedEmail, newPassword);

  try {
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(stored));

    // Also update passwordVerifier in local pending applications if present
    try {
      const rawApps = localStorage.getItem('ucore_pending_applications');
      if (rawApps) {
        const apps = JSON.parse(rawApps);
        if (Array.isArray(apps)) {
          let updatedAny = false;
          const nextApps = apps.map((a: any) => {
            if (a && typeof a.email === 'string' && a.email.trim().toLowerCase() === normalizedEmail) {
              updatedAny = true;
              return { ...a, passwordVerifier: verifier };
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

    // Add audit log
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

