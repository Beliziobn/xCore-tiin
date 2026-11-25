/**
 * Runtime detector & fetch guard for whether the Express Node.js backend (/api/*)
 * is active in the current deployment environment.
 *
 * When the app is hosted as a static SPA on Vercel CDN (via vercel.json),
 * there is no Express server handling /api/* — Cloud Firestore handles 100% of
 * real-time multi-device persistence directly over WebSockets.
 *
 * Short-circuiting redundant /api/* calls after the first non-JSON / 404 probe
 * prevents thousands of wasted Vercel Edge / CDN Requests per session while
 * keeping full Express functionality intact on Node.js deployments.
 */

const SESSION_FLAG_KEY = 'sigre_static_cdn_api_disabled';

function isLikelyStaticVercelHost(): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  const host = (window.location.hostname || '').toLowerCase();
  // On Vercel static SPA deployments (.vercel.app or custom domain without Express),
  // AI Studio & Cloud Run preview domains use .run.app or localhost.
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.run.app')) {
    return false;
  }
  if (host.endsWith('.vercel.app')) {
    return true;
  }
  return false;
}

let expressApiState: 'unknown' | 'available' | 'static-only' = (() => {
  try {
    if (isLikelyStaticVercelHost()) {
      return 'static-only';
    }
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_FLAG_KEY) === '1') {
      return 'static-only';
    }
  } catch {}
  return 'unknown';
})();

let guardInstalled = false;

export function isExpressApiAvailable(): boolean {
  return expressApiState !== 'static-only';
}

export function markExpressApiStaticOnly(): void {
  expressApiState = 'static-only';
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_FLAG_KEY, '1');
    }
  } catch {}
}

export function checkExpressApiResponse(res: Response | null | undefined): boolean {
  if (!res) return false;
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const isJson = contentType.includes('application/json');

  if (
    res.status === 404 ||
    res.status === 405 ||
    (res.ok && !isJson && contentType.includes('text/html'))
  ) {
    markExpressApiStaticOnly();
    return false;
  }

  if (res.ok || res.status === 304) {
    expressApiState = 'available';
    return true;
  }

  return false;
}

export function resetExpressApiAvailability(): void {
  expressApiState = 'unknown';
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_FLAG_KEY);
    }
  } catch {}
}

/**
 * Installs a transparent same-origin `/api/*` fetch interceptor once at app boot.
 * - On Express/Node.js deployments: completely transparent passthrough (zero impact).
 * - On static CDN deployments (e.g. Vercel): after the first 404/HTML probe, all
 *   subsequent `/api/*` calls short-circuit locally in the browser without hitting the CDN.
 */
export function installStaticCdnApiGuard(): void {
  if (guardInstalled || typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return;
  }
  guardInstalled = true;

  try {
    const nativeFetch = window.fetch.bind(window);
    const guardedFetch: typeof window.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      const rawUrl =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.toString()
          : input?.url || '';

      const isSameOriginApi =
        rawUrl.startsWith('/api/') ||
        rawUrl.startsWith('/socket.io/') ||
        (typeof window !== 'undefined' &&
          (rawUrl.startsWith(`${window.location.origin}/api/`) ||
            rawUrl.startsWith(`${window.location.origin}/socket.io/`)));

      if (!isSameOriginApi) {
        return nativeFetch(input, init);
      }

      if (expressApiState === 'static-only') {
        return new Response(JSON.stringify({ success: false, staticCdnMode: true }), {
          status: 503,
          statusText: 'Static CDN Mode',
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const res = await nativeFetch(input, init);
      checkExpressApiResponse(res);
      return res;
    };

    const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (descriptor && descriptor.writable) {
      window.fetch = guardedFetch;
    } else if (!descriptor || descriptor.configurable) {
      Object.defineProperty(window, 'fetch', {
        value: guardedFetch,
        writable: true,
        configurable: true,
      });
    }
  } catch {
    // Some sandboxed/browser environments define window.fetch as a non-configurable getter;
    // explicit isExpressApiAvailable() checks in storage modules still protect against CDN loops.
  }
}
