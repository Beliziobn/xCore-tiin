import React, { lazy, type ComponentType } from 'react';

/**
 * Blindagem de Carregamento & Recuperação de Runtime para Domínio Personalizado
 * (Cloudflare + GoDaddy + Vercel — sigredmedoquessua.com)
 *
 * Responsabilidades:
 * 1. Desregistar Service Workers antigos/presos e limpar Cache Storage obsoleto no arranque.
 * 2. Intercetar erros de atualização de chunks após deploy (vite:preloadError, ChunkLoadError,
 *    Failed to fetch dynamically imported module) e forçar uma recarga limpa controlada sem loop infinito.
 * 3. Higienizar chaves JSON corrompidas no localStorage/sessionStorage que possam bloquear o arranque.
 * 4. Fornecer ação manual "Limpar Cache e Recarregar" para o GlobalErrorBoundary.
 */

const CHUNK_RELOAD_GUARD_KEY = 'sigre_chunk_reload_guard_ts';
const CHUNK_RELOAD_COOLDOWN_MS = 20_000;
const SW_CLEANUP_DONE_KEY = 'sigre_sw_cache_cleanup_v2';

let recoveryInstalled = false;

/**
 * Verifica se uma mensagem de erro corresponde a falha de carregamento de chunk/módulo
 * causada por cache desatualizado na Cloudflare ou navegador após novo deploy na Vercel.
 */
export function isChunkOrModuleLoadError(errOrMessage: unknown): boolean {
  if (!errOrMessage) return false;
  const raw =
    typeof errOrMessage === 'string'
      ? errOrMessage
      : errOrMessage instanceof Error
      ? `${errOrMessage.name}: ${errOrMessage.message}`
      : String((errOrMessage as any)?.message || errOrMessage);

  const msg = raw.toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('chunkloaderror') ||
    msg.includes('loading chunk') ||
    msg.includes('loading css chunk') ||
    msg.includes('unable to preload css') ||
    msg.includes('failed to load module script') ||
    msg.includes('expected a javascript module script') ||
    msg.includes('mime type of "text/html"') ||
    msg.includes('outdated optimize dep') ||
    msg.includes("cannot read properties of null (reading 'usestate')") ||
    msg.includes("cannot read properties of null (reading 'useeffect')") ||
    msg.includes("cannot read properties of null (reading 'usecontext')") ||
    msg.includes("cannot read properties of null (reading 'usememo')")
  );
}

/**
 * Remove Service Workers obsoletos e caches da Cache Storage API que possam
 * estar a reter versões antigas do index.html ou chunks JS no domínio personalizado.
 */
export async function cleanupStaleServiceWorkersAndCaches(forceAll: boolean = false): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 1. Desregistar qualquer Service Worker ativo ou em espera no domínio
    if ('serviceWorker' in navigator && typeof navigator.serviceWorker.getRegistrations === 'function') {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        await Promise.allSettled(
          registrations.map(async (reg) => {
            try {
              await reg.unregister();
              console.info('[SIGRE Recovery] Service Worker obsoleto desregistado:', reg.scope);
            } catch {}
          })
        );
      }
    }

    // 2. Limpar buckets da Cache Storage API (Workbox / PWA / Vite caches antigos)
    if ('caches' in window && typeof window.caches?.keys === 'function') {
      const alreadyCleaned = !forceAll && sessionStorage.getItem(SW_CLEANUP_DONE_KEY) === '1';
      if (!alreadyCleaned) {
        const keys = await window.caches.keys();
        if (keys.length > 0) {
          await Promise.allSettled(
            keys.map(async (key) => {
              try {
                await window.caches.delete(key);
                console.info('[SIGRE Recovery] Cache Storage antigo removido:', key);
              } catch {}
            })
          );
        }
        try {
          sessionStorage.setItem(SW_CLEANUP_DONE_KEY, '1');
        } catch {}
      }
    }
  } catch (err) {
    console.warn('[SIGRE Recovery] Aviso durante limpeza preventiva de Service Workers/Caches:', err);
  }
}

/**
 * Verifica e remove apenas entradas de localStorage cujo JSON esteja truncado/corrompido,
 * preservando todos os dados válidos do utilizador.
 */
export function sanitizeCorruptedLocalStorageKeys(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

  const jsonKeysToVerify = [
    'ucore_active_user',
    'ucore_admin_schools',
    'ucore_admin_teachers',
    'ucore_admin_students',
    'ucore_admin_directors',
    'ucore_pending_applications',
    'ucore_registered_users',
    'sigre_quick_services_local_cache',
    'sigre_deleted_entities_tombstones_v1',
    'ucore_teacher_students',
    'ucore_teacher_profile',
    'ucore_chat_channels_v3',
    'ucore_chat_messages',
  ];

  for (const key of jsonKeysToVerify) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null && raw.trim() !== '') {
        JSON.parse(raw);
      }
    } catch {
      console.warn(`[SIGRE Recovery] Chave localStorage corrompida detetada e limpa: ${key}`);
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  }
}

/**
 * Executa uma recarga controlada com cache-busting (evita loops infinitos através de cooldown em sessionStorage).
 */
export async function triggerControlledCacheBustingReload(reason: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const now = Date.now();
    const lastReloadRaw = sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY);
    const lastReloadTs = lastReloadRaw ? Number(lastReloadRaw) : 0;

    if (lastReloadTs > 0 && now - lastReloadTs < CHUNK_RELOAD_COOLDOWN_MS) {
      console.warn(
        `[SIGRE Recovery] Recarga automática ignorada (já executada há ${Math.round((now - lastReloadTs) / 1000)}s). Motivo: ${reason}`
      );
      return false;
    }

    sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, String(now));
  } catch {
    // Se sessionStorage estiver indisponível, prosseguir com cautela
  }

  console.info(`[SIGRE Recovery] A atualizar recursos após novo deploy (${reason})...`);
  await cleanupStaleServiceWorkersAndCaches(true);

  try {
    const url = new URL(window.location.href);
    url.searchParams.set('_v', String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
  return true;
}

/**
 * Ação manual acionada pelo botão "Limpar Cache e Recarregar" no ErrorBoundary.
 * Limpa Service Workers, Cache Storage, flags transitórias de sessão e chaves corrompidas,
 * e força um carregamento limpo da aplicação.
 */
export async function performHardCacheResetAndReload(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    await cleanupStaleServiceWorkersAndCaches(true);
    sanitizeCorruptedLocalStorageKeys();

    // Limpar estado transitório de visualização que possa estar preso numa rota com erro
    try {
      sessionStorage.removeItem('ucore_session_view');
      sessionStorage.removeItem(CHUNK_RELOAD_GUARD_KEY);
      sessionStorage.removeItem(SW_CLEANUP_DONE_KEY);
    } catch {}
  } catch {}

  try {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('_reset', String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

/**
 * Instala os listeners globais para intercetação de ChunkLoadError, vite:preloadError
 * e falhas de carregamento de scripts/estilos no domínio personalizado.
 */
export function installChunkLoadErrorRecovery(): void {
  if (recoveryInstalled || typeof window === 'undefined') return;
  recoveryInstalled = true;

  // Limpar parâmetro temporário de cache-busting (_v ou _reset) da barra de endereço sem recarregar
  try {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.has('_v') || currentUrl.searchParams.has('_reset')) {
      currentUrl.searchParams.delete('_v');
      currentUrl.searchParams.delete('_reset');
      window.history.replaceState({}, document.title, currentUrl.pathname + currentUrl.search + currentUrl.hash);
    }
  } catch {}

  // 1. Higienizar JSON corrompido no localStorage e limpar Service Workers obsoletos
  sanitizeCorruptedLocalStorageKeys();
  cleanupStaleServiceWorkersAndCaches(false).catch(() => {});

  // 2. Listener oficial do Vite para erros de preload de chunks (vite:preloadError)
  window.addEventListener('vite:preloadError', (event: Event) => {
    try {
      event.preventDefault();
    } catch {}
    const payload = (event as CustomEvent)?.detail || 'vite:preloadError';
    triggerControlledCacheBustingReload(String(payload?.message || payload));
  });

  // 3. Listener global para falhas de <script> ou <link rel="modulepreload"> (ex.: 404 em /assets/*.js)
  window.addEventListener(
    'error',
    (event: ErrorEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
        const src =
          (target as HTMLScriptElement).src ||
          (target as HTMLLinkElement).href ||
          '';
        if (src.includes('/assets/')) {
          triggerControlledCacheBustingReload(`Asset load failed: ${src}`);
          return;
        }
      }
      if (isChunkOrModuleLoadError(event.error || event.message)) {
        triggerControlledCacheBustingReload(event.message || 'Module script error');
      }
    },
    true
  );

  // 4. Listener global para Promises rejeitadas em import() dinâmicos (React.lazy)
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    if (isChunkOrModuleLoadError(event.reason)) {
      try {
        event.preventDefault();
      } catch {}
      const reasonMsg =
        event.reason instanceof Error ? event.reason.message : String(event.reason);
      triggerControlledCacheBustingReload(reasonMsg);
    }
  });
}

/**
 * Wrapper para React.lazy() que interceta falhas de carregamento de chunks dinâmicos
 * (ChunkLoadError / Failed to fetch dynamically imported module após novo deploy na Vercel),
 * limpa Service Workers/Cache Storage e força um único reload controlado via sessionStorage
 * antes que o React exiba uma tela em branco.
 */
export function lazyWithChunkRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await importer();
      return mod;
    } catch (error) {
      console.warn('[SIGRE lazyWithChunkRetry] Falha ao importar chunk dinâmico:', error);
      if (isChunkOrModuleLoadError(error)) {
        const reloaded = await triggerControlledCacheBustingReload(
          error instanceof Error ? error.message : 'Dynamic import chunk load error'
        );
        if (reloaded) {
          // Suspende a árvore enquanto o navegador recarrega a página limpa
          return new Promise<{ default: T }>(() => {});
        }
      }
      throw error;
    }
  });
}

