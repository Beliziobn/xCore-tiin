import { SchoolAnnouncement, SchoolDemandType } from '../types';
import {
  saveAnnouncementToFirestore,
  deleteAnnouncementFromFirestore,
} from './firestoreSync';

const STORAGE_KEY = 'ucore_school_announcements_v1';

export const PRESET_COVER_IMAGES = [
  {
    id: 'cover-grades',
    name: 'Pauta e Avaliação',
    url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
    category: 'notas',
  },
  {
    id: 'cover-matricula',
    name: 'Matrículas e Estudantes',
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
    category: 'matriculas',
  },
  {
    id: 'cover-exam',
    name: 'Sala de Aulas e Provas',
    url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&auto=format&fit=crop&q=80',
    category: 'notas',
  },
  {
    id: 'cover-graduation',
    name: 'Calendário e Administração',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    category: 'geral',
  },
  {
    id: 'cover-library',
    name: 'Biblioteca Escolar',
    url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=80',
    category: 'geral',
  },
];

// Initial demonstration announcements (realistic deadlines)
export const initialAnnouncements: SchoolAnnouncement[] = [];

export function getStoredAnnouncements(): SchoolAnnouncement[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar anúncios:', err);
  }
  return [];
}

export function saveAnnouncement(announcement: SchoolAnnouncement): SchoolAnnouncement[] {
  const current = getStoredAnnouncements();
  const existingIndex = current.findIndex((a) => a.id === announcement.id);
  let updated: SchoolAnnouncement[];

  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = announcement;
  } else {
    updated = [announcement, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    saveAnnouncementToFirestore(announcement).catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }
  } catch (err) {
    console.warn('Erro ao salvar anúncio:', err);
  }
  return updated;
}

export function deleteAnnouncement(id: string): SchoolAnnouncement[] {
  const current = getStoredAnnouncements();
  const updated = current.filter((a) => a.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    deleteAnnouncementFromFirestore(id).catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }
  } catch (err) {
    console.warn('Erro ao excluir anúncio:', err);
  }
  return updated;
}

/**
 * Checks if a specific announcement has expired
 */
export function isAnnouncementExpired(announcement: SchoolAnnouncement, refDate = new Date()): boolean {
  try {
    const expTime = new Date(announcement.expirationDate).getTime();
    return expTime <= refDate.getTime();
  } catch {
    return false;
  }
}

/**
 * Checks the status of a specific demand type across announcements.
 * If any demand of this type has an active deadline, action is allowed.
 * If all demands of this type are expired (or the latest demand is expired), action is blocked!
 */
export function getDemandStatus(demandType: SchoolDemandType): {
  isAllowed: boolean;
  activeAnnouncement?: SchoolAnnouncement;
  expiredAnnouncement?: SchoolAnnouncement;
  formattedExpirationDate?: string;
  message?: string;
} {
  const announcements = getStoredAnnouncements();
  const relevant = announcements.filter((a) => a.demandType === demandType || a.demandType === 'geral');

  if (relevant.length === 0) {
    // If no announcement was ever created for this demand, default to allowed
    return { isAllowed: true };
  }

  // Find any active announcement
  const activeOne = relevant.find((a) => !isAnnouncementExpired(a));

  if (activeOne) {
    const expDate = new Date(activeOne.expirationDate);
    return {
      isAllowed: true,
      activeAnnouncement: activeOne,
      formattedExpirationDate: expDate.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }

  // Otherwise, all announcements for this demand have expired!
  const latestExpired = relevant[0];
  const expDate = new Date(latestExpired.expirationDate);

  const demandLabels: Record<SchoolDemandType, string> = {
    notas: 'Lançamento de Notas',
    matriculas: 'Matrículas & Confirmações',
    geral: 'Demanda Administrativa',
  };

  return {
    isAllowed: false,
    expiredAnnouncement: latestExpired,
    formattedExpirationDate: expDate.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    message: `O prazo para ${demandLabels[demandType]} encerrou em ${expDate.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })} conforme determinação do anúncio "${latestExpired.title}". Não é mais permitido efetuar esta operação.`,
  };
}
