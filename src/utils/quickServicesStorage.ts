import type { QuickServiceRequest, QuickServiceType, QuickServiceStatus } from '../types';
import {
  saveQuickRequestToFirestore,
  fetchQuickRequestsFromFirestore,
  updateQuickRequestInFirestore,
  deleteQuickRequestFromFirestore,
  clearAllQuickRequestsFromFirestore,
  subscribeToQuickRequests,
} from './firestoreSync';

const STORAGE_KEY = 'sigre_quick_services_local_cache';

export async function fetchQuickRequests(filters?: {
  schoolId?: string;
  targetRole?: 'DIRECTOR' | 'ADMIN';
  protocol?: string;
  phone?: string;
  id?: string;
}): Promise<QuickServiceRequest[]> {
  const map = new Map<string, QuickServiceRequest>();

  // 1. Fetch from Firestore Cloud Database (Multi-device source of truth)
  try {
    const cloudRequests = await fetchQuickRequestsFromFirestore();
    if (Array.isArray(cloudRequests) && cloudRequests.length > 0) {
      cloudRequests.forEach((r) => {
        if (r && r.id) map.set(r.id, r);
      });
    }
  } catch (err) {
    console.warn('[QuickServices] Cloud fetch warning:', err);
  }

  // 2. Fetch from backend API
  try {
    const params = new URLSearchParams();
    if (filters?.schoolId) params.append('schoolId', filters.schoolId);
    if (filters?.targetRole) params.append('targetRole', filters.targetRole);
    if (filters?.protocol) params.append('protocol', filters.protocol);
    if (filters?.phone) params.append('phone', filters.phone);
    if (filters?.id) params.append('id', filters.id);

    const res = await fetch(`/api/quick-requests?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.requests)) {
        data.requests.forEach((r: QuickServiceRequest) => {
          if (r && r.id && !map.has(r.id)) {
            map.set(r.id, r);
            saveQuickRequestToFirestore(r).catch(() => {});
          }
        });
      }
    }
  } catch (err) {
    console.warn('[QuickServices] Server API fetch failed, continuing with cloud/local:', err);
  }

  // 3. Fallback to local cache if map is still empty
  if (map.size === 0) {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const list: QuickServiceRequest[] = JSON.parse(cached);
        list.forEach((r) => {
          if (r && r.id) map.set(r.id, r);
        });
      }
    } catch {}
  }

  let list = Array.from(map.values());

  // Cache in localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}

  // Apply filters
  if (filters?.protocol) {
    list = list.filter((r) => r.protocol?.toUpperCase() === filters.protocol?.toUpperCase());
  }
  if (filters?.schoolId) {
    list = list.filter((r) => r.targetSchoolId === filters.schoolId);
  }
  if (filters?.targetRole) {
    list = list.filter((r) => r.targetRole === filters.targetRole);
  }
  if (filters?.phone) {
    list = list.filter((r) => r.requesterPhone?.includes(filters.phone || ''));
  }

  return list;
}

export async function submitQuickServiceRequest(payload: {
  serviceType: QuickServiceType;
  title: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail?: string;
  requesterRoleTitle?: string;
  targetSchoolId?: string;
  targetSchoolName?: string;
  targetDirectorEmail?: string;
  details: QuickServiceRequest['details'];
}): Promise<{ success: boolean; request?: QuickServiceRequest; protocol?: string; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/quick-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    let createdRequest: QuickServiceRequest | undefined;

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.request) {
        createdRequest = data.request;
      }
    }

    if (!createdRequest) {
      // Offline fallback: generate structured protocol
      const code = String(Math.floor(1000 + Math.random() * 9000));
      createdRequest = {
        id: `sr_${Date.now()}_${code}`,
        protocol: `SR-2026-${code}`,
        serviceType: payload.serviceType,
        title: payload.title,
        status: 'PENDENTE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        requesterName: payload.requesterName,
        requesterPhone: payload.requesterPhone,
        requesterEmail: payload.requesterEmail,
        requesterRoleTitle: payload.requesterRoleTitle,
        targetRole: payload.serviceType === 'DECLARACAO_EFECTIVIDADE' ? 'ADMIN' : 'DIRECTOR',
        targetSchoolId: payload.targetSchoolId,
        targetSchoolName: payload.targetSchoolName,
        targetDirectorEmail: payload.targetDirectorEmail,
        targetAdminEmail: 'dmedoquessua@gmail.com',
        details: payload.details,
      };
    }

    // Persist directly to Firebase Firestore cloud database
    await saveQuickRequestToFirestore(createdRequest);

    // Update local cache
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      const list: QuickServiceRequest[] = cached ? JSON.parse(cached) : [];
      list.unshift(createdRequest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigre_quick_request_created', { detail: createdRequest }));
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }

    return {
      success: true,
      request: createdRequest,
      protocol: createdRequest.protocol,
      message: 'Pedido submetido e sincronizado na nuvem com sucesso.',
    };
  } catch (err: any) {
    console.error('[QuickServices] Submit error:', err);
    return { success: false, error: err.message || 'Erro ao submeter pedido.' };
  }
}

export async function updateQuickRequestStatus(
  id: string,
  updates: {
    status?: QuickServiceStatus;
    responseMessage?: string;
    resolvedBy?: string;
    details?: Partial<QuickServiceRequest['details']>;
  }
): Promise<{ success: boolean; request?: QuickServiceRequest; error?: string }> {
  try {
    // 1. Update in Firestore Cloud
    await updateQuickRequestInFirestore(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    // 2. Update via server endpoint
    try {
      await fetch(`/api/quick-requests/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {}

    // 3. Update local cache
    let updatedObj: QuickServiceRequest | undefined;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const list: QuickServiceRequest[] = JSON.parse(cached);
        const idx = list.findIndex((r) => r.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
          updatedObj = list[idx];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }
      }
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigre_quick_request_updated', { detail: { id, updates } }));
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }

    return { success: true, request: updatedObj };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao atualizar pedido.' };
  }
}

export async function deleteQuickRequest(id: string): Promise<boolean> {
  try {
    // Delete from Firestore Cloud
    await deleteQuickRequestFromFirestore(id);

    // Call server DELETE
    try {
      await fetch(`/api/quick-requests/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {}

    // Update local cache
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const list: QuickServiceRequest[] = JSON.parse(cached);
        const filtered = list.filter((r) => r.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigre_quick_request_deleted', { detail: { id } }));
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Zeros / purges all quick requests across cloud and local storage
 */
export async function clearAllQuickRequests(): Promise<{ success: boolean; count: number }> {
  try {
    const cloudCount = await clearAllQuickRequestsFromFirestore();

    // Clear server store
    try {
      await fetch('/api/quick-requests/clear-all', { method: 'POST' });
    } catch {}

    // Clear local storage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigre_quick_requests_cleared'));
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }

    return { success: true, count: cloudCount };
  } catch (err) {
    console.error('Erro ao zerar pedidos de serviços rápidos:', err);
    return { success: false, count: 0 };
  }
}

/**
 * Initializes real-time listener for quick requests
 */
let quickRequestsUnsubscribe: (() => void) | null = null;
export function initRealtimeQuickRequestsSync(
  onUpdate?: (requests: QuickServiceRequest[]) => void
): () => void {
  if (quickRequestsUnsubscribe) {
    return quickRequestsUnsubscribe;
  }

  quickRequestsUnsubscribe = subscribeToQuickRequests((list) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sigre-data-synced'));
      }
      onUpdate?.(list);
    } catch (e) {
      console.warn('[QuickServices] Erro no listener em tempo real:', e);
    }
  });

  return quickRequestsUnsubscribe;
}
