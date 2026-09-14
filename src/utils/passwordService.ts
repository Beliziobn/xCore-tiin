const PASSWORDS_STORAGE_KEY = 'ucore_user_passwords';
const SECURITY_LOGS_KEY = 'ucore_security_logs';

// Default mock passwords for existing demonstration accounts
const DEFAULT_PASSWORDS: Record<string, string> = {
  'admin@ucore.ao': 'admin123',
  'diretor@escola.ao': 'diretor123',
  'carl.diretor@escola.ao': 'diretor123',
  'professor@escola.ao': 'professor123',
  'santar.prof@escola.ao': 'professor123',
  'docente@escola.ao': 'professor123',
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

export function getUserPassword(email: string): string {
  if (!email) return '12345678';
  const normalizedEmail = email.trim().toLowerCase();
  const stored = getStoredPasswords();
  if (stored[normalizedEmail]) {
    return stored[normalizedEmail];
  }
  // Check known demo defaults
  if (DEFAULT_PASSWORDS[normalizedEmail]) {
    return DEFAULT_PASSWORDS[normalizedEmail];
  }
  // General platform fallback password for demo purposes
  return '12345678';
}

export function verifyPassword(email: string, inputPassword: string): boolean {
  if (!inputPassword) return false;
  const current = getUserPassword(email);
  const trimmed = inputPassword.trim();

  // Accept if it matches the current stored password
  if (trimmed === current) return true;

  // Also accept demo standard passwords if user hasn't explicitly set a custom one
  const stored = getStoredPasswords();
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!stored[normalizedEmail]) {
    if (trimmed === '123456' || trimmed === '12345678' || trimmed === 'admin123' || trimmed === 'diretor123' || trimmed === 'professor123' || trimmed === 'ucore2026') {
      return true;
    }
  }

  return false;
}

export function updatePassword(
  email: string,
  newPassword: string
): { success: boolean; message: string } {
  if (!email) {
    return { success: false, message: 'Utilizador não identificado.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: 'A nova palavra-passe deve ter no mínimo 6 caracteres.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const stored = getStoredPasswords();
  stored[normalizedEmail] = newPassword;

  try {
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(stored));
    
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
      ip: '197.234.120.45 (Luanda, AO)',
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
  };
}
