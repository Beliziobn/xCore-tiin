import { SchoolAnnouncement, SchoolDemandType } from '../types';

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
export const initialAnnouncements: SchoolAnnouncement[] = [
  {
    id: 'ad-notas-trimestre-1',
    title: 'Lançamento de Notas - 1º Trimestre 2026',
    demandType: 'notas',
    headline: 'Período Regulamentar de Inserção de Notas e Médias no Sistema uCore',
    description: 'Aviso urgente a todos os docentes e direções pedagógicas: o prazo para lançamento das pautas de P1, P2 e Trabalhos práticos encerra rigorosamente no prazo estipulado. Após a expiração, o sistema bloqueará novas inserções.',
    displayUrl: 'ucore.edu.ao > gestao-academica > lancamento-notas-2026',
    targetSchools: 'Todas as 31 Escolas Municipais do Quêssua',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
    coverImageName: 'pauta-notas-1trim.jpg',
    createdAt: '2026-09-01T08:00',
    createdBy: 'Administração Geral do Quêssua',
    // Active deadline: September 28, 2026
    expirationDate: '2026-09-28T23:59',
    ctaText: 'Lançar Notas da Turma',
    badgeText: 'Anúncio Oficial • MED',
    priority: 'urgente',
    viewsCount: 1420,
    clicksCount: 394,
  },
  {
    id: 'ad-matriculas-2026',
    title: 'Campanha Geral de Matrículas e Confirmações',
    demandType: 'matriculas',
    headline: 'Inscrição e Validação de Novos Alunos nas Unidades da Rede Municipal',
    description: 'Diretores escolares: realize o cadastro presencial e validação documental de novos estudantes para o ano letivo. Fique atento à data limite para garantia de vagas nas salas de aula.',
    displayUrl: 'ucore.edu.ao > secretarias > matriculas-e-vagas',
    targetSchools: 'Todas as 31 Escolas Municipais do Quêssua',
    coverImage: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
    coverImageName: 'matriculas-estudantes.jpg',
    createdAt: '2026-09-02T09:30',
    createdBy: 'Administração Geral do Quêssua',
    // Active deadline: September 30, 2026
    expirationDate: '2026-09-30T18:00',
    ctaText: 'Acessar Matrículas',
    badgeText: 'Edital de Vagas',
    priority: 'alta',
    viewsCount: 980,
    clicksCount: 275,
  },
  {
    id: 'ad-censo-expirado',
    title: 'Recadastramento do Censo Docente 2026',
    demandType: 'geral',
    headline: 'Atualização de Cadastro e Diplomas do Corpo Docente Municipal',
    description: 'Prazo especial concedido pelo Governo Provincial para validação de certificados de habilitação dos professores das escolas públicas do município.',
    displayUrl: 'educacao.gov.ao > censo-docente > quessua-encerrado',
    targetSchools: 'Escolas do Ensino Primário e Iº Ciclo',
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    coverImageName: 'censo-docente.jpg',
    createdAt: '2026-08-10T08:00',
    createdBy: 'Direção Provincial de Educação',
    // Expired deadline: August 31, 2026
    expirationDate: '2026-08-31T23:59',
    ctaText: 'Prazo Encerrado',
    badgeText: 'Processo Concluído',
    priority: 'normal',
    viewsCount: 2150,
    clicksCount: 812,
  },
];

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
  return initialAnnouncements;
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
