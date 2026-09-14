export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'ucore_theme';
const FALLBACK_KEY = 'ucore_profile_theme';

export function getStoredTheme(): ThemeMode {
  return 'light';
}

export function applyTheme(theme: ThemeMode = 'light'): void {
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
    localStorage.removeItem(FALLBACK_KEY);
  } catch {
    // ignore
  }

  const root = document.documentElement;
  root.classList.remove('dark');
  root.setAttribute('data-theme', 'light');

  window.dispatchEvent(new CustomEvent('ucore-theme-change', { detail: { theme: 'light', isDark: false } }));
}

export function initTheme(): void {
  applyTheme('light');
}

