import type { QuickServiceRequest, QuickServiceType, QuickServiceStatus } from '../types';

const STORAGE_KEY = 'sigre_quick_services_local_cache';

export async function fetchQuickRequests(filters?: {
  schoolId?: string;
  targetRole?: 'DIRECTOR' | 'ADMIN';
  protocol?: string;
  phone?: string;
  id?: string;
}): Promise<QuickServiceRequest[]> {
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
        // Cache in localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.requests));
        } catch {}
        return data.requests;
      }
    }
  } catch (err) {
    console.warn('[QuickServices] Network fetch failed, reading from local cache:', err);
  }

  // Fallback to local cache
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      let list: QuickServiceRequest[] = JSON.parse(cached);
      if (filters?.protocol) {
        list = list.filter((r) => r.protocol?.toUpperCase() === filters.protocol?.toUpperCase());
      }
      if (filters?.schoolId) {
        list = list.filter((r) => r.targetSchoolId === filters.schoolId);
      }
      if (filters?.targetRole) {
        list = list.filter((r) => r.targetRole === filters.targetRole);
      }
      return list;
    }
  } catch {}

  return [];
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

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.request) {
        // Update local cache
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          const list: QuickServiceRequest[] = cached ? JSON.parse(cached) : [];
          list.unshift(data.request);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch {}

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sigre_quick_request_created', { detail: data.request }));
        }

        return {
          success: true,
          request: data.request,
          protocol: data.protocol || data.request.protocol,
          message: data.message,
        };
      }
    }
    const errData = await res.json().catch(() => ({}));
    return { success: false, error: errData.error || 'Erro ao processar o pedido no servidor.' };
  } catch (err: any) {
    console.error('[QuickServices] Submit error:', err);
    // Offline fallback: generate mock protocol
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const fallbackRequest: QuickServiceRequest = {
      id: `local_${Date.now()}_${code}`,
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
      targetAdminEmail: 'beliziodos20@gmail.com',
      details: payload.details,
    };

    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      const list: QuickServiceRequest[] = cached ? JSON.parse(cached) : [];
      list.unshift(fallbackRequest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}

    return {
      success: true,
      request: fallbackRequest,
      protocol: fallbackRequest.protocol,
      message: 'Pedido gravado localmente (modo offline).',
    };
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
    const res = await fetch(`/api/quick-requests/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.request) {
        // Update local cache
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            const list: QuickServiceRequest[] = JSON.parse(cached);
            const idx = list.findIndex((r) => r.id === id);
            if (idx !== -1) {
              list[idx] = data.request;
              localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            }
          }
        } catch {}

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sigre_quick_request_updated', { detail: data.request }));
        }
        return { success: true, request: data.request };
      }
    }
    return { success: false, error: 'Não foi possível atualizar o pedido.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro de conexão.' };
  }
}

export async function deleteQuickRequest(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/quick-requests/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const list: QuickServiceRequest[] = JSON.parse(cached);
          const filtered = list.filter((r) => r.id !== id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        }
      } catch {}
      return true;
    }
  } catch {}
  return false;
}
