/**
 * Runtime detector & network guard for whether the Express Node.js backend (/api/*)
 * is active in the current deployment environment.
 *
 * When the app is hosted as a static SPA on Vercel CDN (via vercel.json, on .vercel.app
 * or any custom domain), there is no Express server handling /api/* or /socket.io/* —
 * Cloud Firestore handles 100% of real-time multi-device persistence directly.
 *
 * Blocking all /api/* and /socket.io/* calls (across fetch, XMLHttpRequest, and sendBeacon)
 * on static CDN hosts eliminates 100% of wasted Vercel Edge / CDN Requests.
 */

const SESSION_FLAG_KEY = 'sigre_static_cdn_api_disabled';

function isLikelyStaticVercelHost(): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  const host = (window.location.hostname || '').toLowerCase();
  // The Express backend (server.ts) only runs on localhost/127.0.0.1 and AI Studio / Cloud Run (*.run.app).
  // Any other domain (.vercel.app or any custom domain on Vercel) is a static CDN deployment.
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.run.app')) {
    return false;
  }
  return true;
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
    res.status === 503 ||
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
  expressApiState = isLikelyStaticVercelHost() ? 'static-only' : 'unknown';
  try {
    if (typeof sessionStorage !== 'undefined' && expressApiState !== 'static-only') {
      sessionStorage.removeItem(SESSION_FLAG_KEY);
    }
  } catch {}
}

function isSameOriginBackendPath(rawUrl: string): boolean {
  if (!rawUrl) return false;
  if (rawUrl.startsWith('/api/') || rawUrl === '/api' || rawUrl.startsWith('/socket.io/') || rawUrl.startsWith('/socket.io?')) {
    return true;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (
      rawUrl.startsWith(`${origin}/api/`) ||
      rawUrl === `${origin}/api` ||
      rawUrl.startsWith(`${origin}/socket.io/`) ||
      rawUrl.startsWith(`${origin}/socket.io?`)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Installs a transparent same-origin `/api/*` and `/socket.io/*` interceptor across
 * `window.fetch`, `XMLHttpRequest`, and `navigator.sendBeacon`.
 * - On Express/Node.js deployments: completely transparent passthrough.
 * - On static CDN deployments (Vercel / custom domains): blocks all `/api/*` and `/socket.io/*`
 *   requests locally in the browser with zero CDN traffic.
 */
export function installStaticCdnApiGuard(): void {
  if (guardInstalled || typeof window === 'undefined') {
    return;
  }
  guardInstalled = true;

  // 1. Guard window.fetch
  try {
    if (typeof window.fetch === 'function') {
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

        if (!isSameOriginBackendPath(rawUrl)) {
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
    }
  } catch {}

  // 2. Guard XMLHttpRequest (used by socket.io-client polling)
  try {
    if (typeof XMLHttpRequest !== 'undefined') {
      const rawOpen = XMLHttpRequest.prototype.open;
      const rawSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function (
        method: string,
        url: string | URL,
        async?: boolean,
        username?: string | null,
        password?: string | null
      ) {
        const urlStr = typeof url === 'string' ? url : url?.toString() || '';
        (this as any).__sigreBlockedStaticApi =
          expressApiState === 'static-only' && isSameOriginBackendPath(urlStr);
        return rawOpen.call(
          this,
          method,
          url,
          async !== undefined ? async : true,
          username,
          password
        );
      };

      XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
        if ((this as any).__sigreBlockedStaticApi) {
          setTimeout(() => {
            try {
              this.dispatchEvent(new Event('error'));
            } catch {}
          }, 0);
          return;
        }
        return rawSend.call(this, body);
      };
    }
  } catch {}

  // 3. Guard navigator.sendBeacon
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const rawBeacon = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = (url: string | URL, data?: BodyInit | null): boolean => {
        const urlStr = typeof url === 'string' ? url : url?.toString() || '';
        if (expressApiState === 'static-only' && isSameOriginBackendPath(urlStr)) {
          return true;
        }
        return rawBeacon(url, data);
      };
    }
  } catch {}
}

// Auto-install immediately when module is imported so it is active before any other module's top-level code runs
if (typeof window !== 'undefined') {
  installStaticCdnApiGuard();
}

