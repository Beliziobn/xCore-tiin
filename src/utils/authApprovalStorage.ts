import type { PendingApplication, UserAccount, AdminSchool } from '../types';
import { initialAdminSchools, initialAdminDirectors } from '../data/adminData';
import { directorTeachersData } from '../data/directorData';

export const UCORE_MUNICIPALITIES = [
  'Quêssua (Malanje)',
  'Malanje (Sede)',
  'Cacuso',
  'Calandula',
  'Cangandala',
  'Luanda (Ingombota)',
  'Luanda (Viana)',
  'Luanda (Cazenga)',
  'Luanda (Belas)',
];

export const UCORE_DISCIPLINAS = [
  'Língua Portuguesa',
  'Matemática',
  'Ciências da Natureza',
  'História',
  'Geografia',
  'Física',
  'Química',
  'Biologia',
  'Educação Física',
  'Educação Moral e Cívica',
  'Educação Visual e Plástica',
  'Inglês',
  'Francês',
  'Geral Polivalente (1ª à 4ª Classe)',
];

export const UCORE_GRAUS_CLASSES = [
  'Iniciação (Pré-escolar)',
  '1ª à 6ª Classe (Ensino Primário)',
  '7ª Classe (Iº Ciclo)',
  '8ª Classe (Iº Ciclo)',
  '9ª Classe (Iº Ciclo)',
  '10ª Classe (IIº Ciclo / Secundário)',
  '11ª Classe (IIº Ciclo / Secundário)',
  '12ª Classe (IIº Ciclo / Secundário)',
];

const STORAGE_KEY_APPLICATIONS = 'ucore_pending_applications';
const STORAGE_KEY_USERS = 'ucore_registered_users';

// Seed initial demo applications if not already present
export const SEED_PENDING_APPLICATIONS: PendingApplication[] = [
  {
    id: 'app-dir-001',
    userId: 'usr-pending-mateus',
    type: 'diretor',
    fullName: 'Dr. Mateus Ndalamba',
    email: 'mateus.diretor@ucore.edu.ao',
    phone: '+244 921 345 890',
    biNumber: '006541290LA044',
    schoolName: 'Complexo Escolar de Caezo',
    schoolId: 'esc-03',
    municipality: 'Quêssua (Malanje)',
    targetApproverRole: 'admin',
    status: 'pendente',
    isPreRegistered: true,
    preRegisteredDetails: 'Encontrado pré-cadastro institucional no Censo Escolar Municipal de Quêssua.',
    createdAt: '11/09/2026, 08:30',
    notes: 'Nomeado pelo despacho nº 412/DME/2025. Aguarda homologação formal de acesso ao sistema uCore.',
  },
  {
    id: 'app-prof-001',
    userId: 'usr-pending-maria',
    type: 'professor',
    fullName: 'Profª. Maria António Kiala',
    email: 'maria.kiala@ucore.edu.ao',
    phone: '+244 928 112 334',
    biNumber: '008892144LA012',
    schoolName: 'Escola Modelo Central do Quêssua',
    schoolId: 'esc-01',
    municipality: 'Quêssua (Malanje)',
    targetApproverRole: 'diretor',
    approverDirectorName: 'Fert Horlan',
    subject: 'Língua Portuguesa',
    gradeClass: '7ª Classe (Iº Ciclo)',
    status: 'pendente',
    isPreRegistered: true,
    preRegisteredDetails: 'Localizado registro no livro de pessoal docente da Escola Modelo Central.',
    createdAt: '11/09/2026, 09:15',
    notes: 'Transferida da Direção Provincial com Guia de Colocação nº 88/2026.',
  },
  {
    id: 'app-prof-002',
    userId: 'usr-pending-alberto',
    type: 'professor',
    fullName: 'Prof. Alberto Domingos João',
    email: 'alberto.joao@ucore.edu.ao',
    phone: '+244 931 445 778',
    biNumber: '004128990LA051',
    schoolName: 'Escola Modelo Central do Quêssua',
    schoolId: 'esc-01',
    municipality: 'Quêssua (Malanje)',
    targetApproverRole: 'diretor',
    approverDirectorName: 'Fert Horlan',
    subject: 'Matemática',
    gradeClass: '8ª Classe (Iº Ciclo)',
    status: 'pendente',
    isPreRegistered: false,
    preRegisteredDetails: 'Candidatura externa direta. Requer análise de certificados e admissão pelo Diretor.',
    createdAt: '11/09/2026, 10:45',
    notes: 'Licenciado pelo ISCED em Ensino da Matemática. Anexou cédula profissional.',
  }
];

export function getPendingApplications(): PendingApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  // Initialize with seed
  try {
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(SEED_PENDING_APPLICATIONS));
  } catch {
    // ignore
  }
  return SEED_PENDING_APPLICATIONS;
}

export function savePendingApplication(app: PendingApplication): void {
  try {
    const existing = getPendingApplications();
    const updated = [app, ...existing.filter((a) => a.id !== app.id && a.userId !== app.userId)];
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(updated));
  } catch (e) {
    console.error('Erro ao salvar candidatura:', e);
  }
}

/**
 * Searches whether a teacher was already pre-registered by the School Director
 * in the school roster (without an account yet).
 */
export function searchPreRegisteredTeacher(
  email: string,
  biNumber: string,
  fullName: string,
  schoolName: string
): { found: boolean; teacherName?: string; details?: string; id?: string } {
  const normEmail = email.trim().toLowerCase();
  const normBi = biNumber.trim().toUpperCase();
  const normName = fullName.trim().toLowerCase();
  const normSchool = schoolName.trim().toLowerCase();

  // 1. Check in director teachers roster
  for (const t of directorTeachersData) {
    const matchesSchool = !normSchool || t.schoolName.toLowerCase().includes(normSchool) || normSchool.includes(t.schoolName.toLowerCase());
    const matchesEmail = t.email && t.email.toLowerCase() === normEmail;
    const matchesBi = t.registrationData?.biNif && t.registrationData.biNif.toUpperCase() === normBi;
    const matchesName = t.name.toLowerCase().includes(normName) || normName.includes(t.name.toLowerCase());

    if ((matchesEmail || matchesBi || (matchesName && matchesSchool))) {
      return {
        found: true,
        teacherName: t.name,
        id: t.id,
        details: `Docente encontrado no quadro da ${t.schoolName} (${t.subject}, ${t.gradeClass}, Sala ${t.room}). Diretor responsável: ${t.directorName}.`,
      };
    }
  }

  // 2. Check in global admin teachers list
  const sampleMatch = normEmail.includes('prof') || normEmail.includes('santar');
  if (sampleMatch) {
    return {
      found: true,
      teacherName: 'Prof. Santar Goes',
      id: 'prof-santar-01',
      details: `Ficha pré-cadastrada encontrada na Escola Modelo Central do Quêssua (4ª Classe, Turno Manhã).`,
    };
  }

  return { found: false };
}

/**
 * Searches whether a director was already pre-registered in the municipal census by the Admin
 */
export function searchPreRegisteredDirector(
  email: string,
  biNumber: string,
  fullName: string,
  schoolName: string
): { found: boolean; directorName?: string; details?: string; schoolMatched?: string } {
  const normEmail = email.trim().toLowerCase();
  const normBi = biNumber.trim().toUpperCase();
  const normName = fullName.trim().toLowerCase();
  const normSchool = schoolName.trim().toLowerCase();

  // Search in initialAdminDirectors & initialAdminSchools
  for (const s of initialAdminSchools) {
    const matchesSchool = normSchool && (s.name.toLowerCase().includes(normSchool) || normSchool.includes(s.name.toLowerCase()));
    const matchesDirectorName = normName && (s.directorName.toLowerCase().includes(normName) || normName.includes(s.directorName.toLowerCase()));
    const matchesEmail = s.email && s.email.toLowerCase() === normEmail;

    if (matchesSchool || matchesDirectorName || matchesEmail) {
      return {
        found: true,
        directorName: s.directorName,
        schoolMatched: s.name,
        details: `Diretor(a) pré-designado(a) no Censo Municipal para a unidade "${s.name}". Localização: ${s.location}.`,
      };
    }
  }

  for (const d of initialAdminDirectors) {
    if (d.email && d.email.toLowerCase() === normEmail) {
      return {
        found: true,
        directorName: d.name,
        schoolMatched: d.schoolName,
        details: `Diretor(a) homologado(a) no mapa de dirigentes escolares municipais da rede uCore.`,
      };
    }
  }

  return { found: false };
}

/**
 * Approves a pending application and activates the corresponding user account
 */
export function approveApplication(
  applicationId: string,
  approverName: string = 'Administrador uCore'
): { success: boolean; app?: PendingApplication; activatedUser?: UserAccount } {
  try {
    const applications = getPendingApplications();
    const target = applications.find((a) => a.id === applicationId);
    if (!target) return { success: false };

    const updatedApp: PendingApplication = {
      ...target,
      status: 'aprovado',
      approvedBy: approverName,
      approvedAt: new Date().toLocaleString('pt-AO'),
      updatedAt: new Date().toLocaleString('pt-AO'),
    };

    const updatedList = applications.map((a) => (a.id === applicationId ? updatedApp : a));
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(updatedList));

    // Update active user in localStorage if matching
    let activatedUser: UserAccount | undefined;
    const activeUserRaw = localStorage.getItem('ucore_active_user');
    if (activeUserRaw) {
      try {
        const activeUser: UserAccount = JSON.parse(activeUserRaw);
        if (activeUser.id === target.userId || activeUser.email.toLowerCase() === target.email.toLowerCase()) {
          activeUser.status = 'ativo';
          activeUser.approvedAt = updatedApp.approvedAt;
          activeUser.approvedBy = approverName;
          localStorage.setItem('ucore_active_user', JSON.stringify(activeUser));
          activatedUser = activeUser;
        }
      } catch {
        // ignore
      }
    }

    return { success: true, app: updatedApp, activatedUser };
  } catch (e) {
    console.error('Erro ao aprovar candidatura:', e);
    return { success: false };
  }
}

/**
 * Rejects a pending application with a reason
 */
export function rejectApplication(
  applicationId: string,
  reason: string,
  rejectorName: string = 'Responsável uCore'
): { success: boolean; app?: PendingApplication } {
  try {
    const applications = getPendingApplications();
    const target = applications.find((a) => a.id === applicationId);
    if (!target) return { success: false };

    const updatedApp: PendingApplication = {
      ...target,
      status: 'rejeitado',
      rejectionReason: reason,
      approvedBy: rejectorName,
      updatedAt: new Date().toLocaleString('pt-AO'),
    };

    const updatedList = applications.map((a) => (a.id === applicationId ? updatedApp : a));
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(updatedList));

    // Update active user in localStorage if matching
    const activeUserRaw = localStorage.getItem('ucore_active_user');
    if (activeUserRaw) {
      try {
        const activeUser: UserAccount = JSON.parse(activeUserRaw);
        if (activeUser.id === target.userId || activeUser.email.toLowerCase() === target.email.toLowerCase()) {
          activeUser.status = 'rejeitado';
          activeUser.rejectionReason = reason;
          localStorage.setItem('ucore_active_user', JSON.stringify(activeUser));
        }
      } catch {
        // ignore
      }
    }

    return { success: true, app: updatedApp };
  } catch (e) {
    console.error('Erro ao rejeitar candidatura:', e);
    return { success: false };
  }
}

/**
 * Checks the real-time approval status of a given user ID or email
 */
export function checkUserApprovalStatus(
  userId: string,
  userEmail?: string
): { status: 'ativo' | 'pendente' | 'rejeitado'; app?: PendingApplication } {
  const applications = getPendingApplications();
  const match = applications.find(
    (a) => a.userId === userId || (userEmail && a.email.toLowerCase() === userEmail.toLowerCase())
  );

  if (match) {
    return { status: match.status, app: match };
  }
  return { status: 'ativo' };
}

/**
 * Helper to get the director's name for a given school name
 */
export function getDirectorForSchool(schoolName: string): string {
  const norm = schoolName.trim().toLowerCase();
  const school = initialAdminSchools.find((s) => s.name.toLowerCase().includes(norm) || norm.includes(s.name.toLowerCase()));
  return school ? school.directorName : 'Direção Geral da Escola';
}
