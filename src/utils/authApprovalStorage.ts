import type { PendingApplication, UserAccount, AdminSchool, PendingApprovalComplementaryData } from '../types';
import { initialAdminSchools, initialAdminDirectors } from '../data/adminData';
import { CANONICAL_APPLICATIONS, CANONICAL_USERS } from '../data/canonicalNetworkSeed';
import { directorTeachersData } from '../data/directorData';
import {
  saveApplicationToFirestore,
  fetchApplicationsFromFirestoreWithStatus,
  isFirestoreReadQuotaExhausted,
  updateApplicationInFirestore,
  deleteApplicationFromFirestore,
  clearApprovedApplicationsFromFirestore,
  subscribeToApplications,
  saveSchoolToFirestore,
  saveTeacherToFirestore,
  saveDirectorToFirestore,
  saveDmeStaffToFirestore,
  saveStaffToFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  deleteTeacherFromFirestore,
  deleteDirectorFromFirestore,
  deleteDmeStaffFromFirestore,
  deleteStaffFromFirestore,
  isBannedSchoolOrEntity,
  isEntityTombstoned,
  removeEntityTombstone,
} from './firestoreSync';
import { encodePasswordVerifier, deleteUserCredentials } from './passwordService';
import { isExpressApiAvailable, checkExpressApiResponse } from './apiAvailability';

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

export const OFFICIAL_DME_ADMIN_EMAIL = 'dmedoquessua@gmail.com';

const STORAGE_KEY_APPLICATIONS = 'ucore_pending_applications';
const STORAGE_KEY_USERS = 'ucore_registered_users';
const STORAGE_KEY_DELETED_APPLICATIONS = 'sigre_deleted_application_ids_v1';

function getDeletedApplicationIds(): Set<string> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_APPLICATIONS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function normalizeBi(bi?: string | null): string {
  return String(bi || '').trim().replace(/\s+/g, '').toUpperCase();
}

export function addDeletedApplicationId(id: string) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || !id) return;
  try {
    const clean = id.trim().toLowerCase();
    const compact = clean.replace(/\s+/g, '');
    if (!clean || clean === OFFICIAL_DME_ADMIN_EMAIL || clean === 'beliziodos20@gmail.com') return;
    const set = getDeletedApplicationIds();
    set.add(clean);
    if (compact && compact !== clean) set.add(compact);
    localStorage.setItem(STORAGE_KEY_DELETED_APPLICATIONS, JSON.stringify(Array.from(set)));
  } catch {}
}

export function isAccountDeleted(...identifiers: (string | undefined | null)[]): boolean {
  const deletedSet = getDeletedApplicationIds();
  for (const id of identifiers) {
    if (!id) continue;
    const clean = String(id).trim().toLowerCase();
    const compact = clean.replace(/\s+/g, '');
    if (!clean || clean === OFFICIAL_DME_ADMIN_EMAIL || clean === 'beliziodos20@gmail.com') continue;
    if (deletedSet.has(clean) || (compact && deletedSet.has(compact))) return true;
  }
  return false;
}

/**
 * Permanently revokes all credentials, user profiles, and active sessions for a deleted account
 * across localStorage, passwordService, and Cloud Firestore.
 */
export function purgeDeletedAccountCredentials(params: {
  id?: string;
  userId?: string;
  email?: string;
  biNumber?: string;
}): void {
  const normEmail = (params.email || '').trim().toLowerCase();
  const normId = (params.id || '').trim();
  const normUserId = (params.userId || '').trim();
  const normBi = normalizeBi(params.biNumber);

  if (normEmail === OFFICIAL_DME_ADMIN_EMAIL || normEmail === 'beliziodos20@gmail.com') {
    return;
  }

  if (normId) addDeletedApplicationId(normId);
  if (normUserId) addDeletedApplicationId(normUserId);
  if (normEmail) addDeletedApplicationId(normEmail);
  if (normBi) addDeletedApplicationId(normBi);

  // 1. Revoke stored password and profile extra cache
  if (normEmail) {
    deleteUserCredentials(normEmail);
  }

  // 2. Remove from ucore_registered_users
  try {
    const rawUsers = localStorage.getItem(STORAGE_KEY_USERS);
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      if (Array.isArray(users)) {
        const nextUsers = users.filter((u: any) => {
          if (!u) return false;
          const uId = String(u.id || '').trim();
          const uEmail = String(u.email || '').trim().toLowerCase();
          const uBi = normalizeBi(u.biNumber);
          if (normId && uId === normId) return false;
          if (normUserId && uId === normUserId) return false;
          if (normEmail && uEmail === normEmail) return false;
          if (normBi && normBi.length >= 5 && uBi === normBi) return false;
          return true;
        });
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(nextUsers));
      }
    }
  } catch {}

  // 3. Delete from Firestore USERS_COL
  if (normEmail) {
    deleteUserFromFirestore(normEmail).catch(() => {});
  }
  if (normId) {
    deleteUserFromFirestore(normId).catch(() => {});
  }
  if (normUserId && normUserId !== normId) {
    deleteUserFromFirestore(normUserId).catch(() => {});
  }

  // 4. Terminate active session if the deleted account is currently logged in
  try {
    const rawActive = localStorage.getItem('ucore_active_user');
    if (rawActive) {
      const active = JSON.parse(rawActive);
      if (active) {
        const aId = String(active.id || '').trim();
        const aEmail = String(active.email || '').trim().toLowerCase();
        const aBi = normalizeBi(active.biNumber);
        const isCurrentDeleted =
          (normId && aId === normId) ||
          (normUserId && aId === normUserId) ||
          (normEmail && aEmail === normEmail) ||
          (normBi && normBi.length >= 5 && aBi === normBi);
        if (isCurrentDeleted) {
          localStorage.removeItem('ucore_active_user');
          sessionStorage.removeItem('ucore_session_active');
          sessionStorage.removeItem('ucore_session_view');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('sigre-account-revoked', {
                detail: { email: normEmail, id: normUserId || normId },
              })
            );
          }
        }
      }
    }
  } catch {}
}

export function removeDeletedApplicationId(...ids: (string | undefined | null)[]) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const set = getDeletedApplicationIds();
    let changed = false;
    ids.forEach((id) => {
      if (id) {
        const clean = String(id).trim().toLowerCase();
        const compact = clean.replace(/\s+/g, '');
        if (set.has(clean)) {
          set.delete(clean);
          changed = true;
        }
        if (compact && set.has(compact)) {
          set.delete(compact);
          changed = true;
        }
      }
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEY_DELETED_APPLICATIONS, JSON.stringify(Array.from(set)));
    }
  } catch {}
}

// Seed initial canonical municipal applications so new devices immediately have the synchronized roster
export const SEED_PENDING_APPLICATIONS: PendingApplication[] = CANONICAL_APPLICATIONS as PendingApplication[];

export function stripAppIdPrefix(val?: string): string {
  return String(val || '')
    .trim()
    .toLowerCase()
    .replace(/^(dir-dossier-|app-diretor-|app-professor-|app-funcionario-|app-membro_dme-|app-aluno-|app-sim-dir-|app-sim-|app_|app-)/, '');
}

export function isGenericSchoolEmail(email?: string): boolean {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return true;
  return (
    e === 'dme.quessua@med.gov.ao' ||
    e === 'constantino.gomes@gmail.com' ||
    e.startsWith('escola.') ||
    e.endsWith('@med.gov.ao')
  );
}

export function isApplicationTombstoned(rawApp?: Partial<PendingApplication> | null): boolean {
  if (!rawApp) return true;
  if (isBannedSchoolOrEntity(rawApp)) return true;
  const aId = String(rawApp.id || '').trim().toLowerCase();
  const uId = String(rawApp.userId || '').trim().toLowerCase();
  const baseId = stripAppIdPrefix(rawApp.userId || rawApp.id);
  const aEmail = String(rawApp.email || '').trim().toLowerCase();
  const aBi = normalizeBi(rawApp.biNumber);

  if (isAccountDeleted(aId, uId, baseId, !isGenericSchoolEmail(aEmail) ? aEmail : undefined, aBi)) {
    return true;
  }

  const checkCols = ['applications', 'users'];
  for (const col of checkCols) {
    if (aId && isEntityTombstoned(col, aId)) return true;
    if (uId && isEntityTombstoned(col, uId)) return true;
    if (baseId && isEntityTombstoned(col, baseId)) return true;
    if (aEmail && !isGenericSchoolEmail(aEmail) && isEntityTombstoned(col, aEmail)) return true;
    if (aBi && aBi.length >= 5 && isEntityTombstoned(col, aBi)) return true;
  }
  return false;
}

function clearTombstonesForApplication(app: Partial<PendingApplication>): void {
  const normBi = normalizeBi(app.biNumber);
  const cleanEmail = String(app.email || '').trim().toLowerCase();
  const baseId = stripAppIdPrefix(app.userId || app.id);
  removeDeletedApplicationId(
    app.id,
    app.userId,
    baseId || undefined,
    !isGenericSchoolEmail(cleanEmail) ? cleanEmail : undefined,
    normBi || undefined
  );
  const roleCol =
    app.type === 'diretor' || app.schoolRole === 'diretor_geral'
      ? 'directors'
      : app.type === 'membro_dme' || app.scope === 'administracao'
      ? 'dme_staff'
      : app.type === 'funcionario'
      ? 'staff'
      : 'teachers';
  [app.id, app.userId, baseId, !isGenericSchoolEmail(cleanEmail) ? cleanEmail : '', normBi].forEach((ident) => {
    if (ident) {
      removeEntityTombstone('applications', ident);
      removeEntityTombstone('users', ident);
      removeEntityTombstone(roleCol, ident);
    }
  });
}

/**
 * Synthesizes PendingApplication entries from registered users in localStorage
 * who are missing from applications (mirrors server.ts user->application synthesis
 * so Shared/static deployments never miss a registered candidate).
 */
export function reconcileUsersIntoApplications(): PendingApplication[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  const synthesized: PendingApplication[] = [];
  try {
    const rawUsers = localStorage.getItem(STORAGE_KEY_USERS);
    const users: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];
    if (!Array.isArray(users)) return [];

    users.forEach((u: any) => {
      if (!u || u.id === 'usr_dme_quessua') return;
      const uEmail = String(u.email || '').trim().toLowerCase();
      if (uEmail === OFFICIAL_DME_ADMIN_EMAIL || uEmail === 'beliziodos20@gmail.com') return;
      if (isBannedSchoolOrEntity(u)) return;
      const uBi = normalizeBi(u.biNumber);
      if (
        isAccountDeleted(u.id, uEmail, uBi) ||
        isEntityTombstoned('users', u.id || '') ||
        (uEmail && isEntityTombstoned('users', uEmail)) ||
        isEntityTombstoned('applications', u.id || '') ||
        (uEmail && isEntityTombstoned('applications', uEmail))
      ) {
        return;
      }

      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
      if (!fullName) return;

      const appType: PendingApplication['type'] =
        u.scope === 'administracao' || u.role === 'admin'
          ? 'membro_dme'
          : u.role === 'diretor' || u.schoolRole === 'diretor_geral'
          ? 'diretor'
          : u.schoolRole && u.schoolRole !== 'professor'
          ? 'funcionario'
          : 'professor';

      const baseSlug = stripAppIdPrefix(u.id).replace(/^usr_/, '') || sanitizeIdFallback(uEmail || fullName);
      synthesized.push({
        id: `app-${appType}-${baseSlug}`,
        userId: u.id,
        type: appType,
        scope: u.scope || (appType === 'membro_dme' ? 'administracao' : 'escola'),
        schoolRole: u.schoolRole || (appType === 'diretor' ? 'diretor_geral' : undefined),
        adminRole: u.adminRole,
        roleRequested:
          u.roleTitle ||
          u.cargoTitle ||
          (appType === 'diretor'
            ? 'Director(a) de Escola'
            : appType === 'membro_dme'
            ? 'Quadro Técnico da DME'
            : appType === 'funcionario'
            ? 'Subdirector / Quadro Escolar'
            : 'Professor(a)'),
        fullName,
        email: u.email || '',
        phone: u.phone || '+244 923 000 000',
        biNumber: uBi,
        schoolName: (u.schoolName || 'Direcção Municipal da Educação de Quêssua').trim().replace(/\s+/g, ' '),
        schoolId: u.schoolId,
        municipality: u.municipalityOrDepartment || u.municipality || 'Quêssua (Malanje)',
        targetApproverRole: 'admin',
        targetApproverEmail: OFFICIAL_DME_ADMIN_EMAIL,
        approverDirectorName: `Director Municipal da Educação (${OFFICIAL_DME_ADMIN_EMAIL})`,
        subject: u.subject,
        gradeClass: u.gradeClass,
        status: u.status === 'ativo' || Boolean(u.approvedAt) ? 'aprovado' : u.status === 'rejeitado' ? 'rejeitado' : 'pendente',
        isPreRegistered: Boolean(u.isPreRegistered),
        createdAt: u.submittedAt || u.createdAt || new Date().toLocaleString('pt-AO'),
        approvedAt: u.approvedAt,
        approvedBy: u.approvedBy,
        passwordVerifier: u.passwordVerifier,
      });
    });
  } catch {}
  return synthesized;
}

function sanitizeIdFallback(val: string): string {
  return val.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || String(Date.now());
}

/**
 * Ensures any approved applications received from Firestore/server also promote local users
 * and synchronize school/director/teacher/staff/DME rosters on this device.
 */
function reconcileApprovedAppsIntoLocalUsersAndRosters(apps: PendingApplication[]): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || !Array.isArray(apps) || apps.length === 0) return;
  const approvedApps = apps.filter((a) => a && (a.status === 'aprovado' || Boolean(a.approvedAt)));
  if (approvedApps.length === 0) return;

  try {
    const rawUsers = localStorage.getItem(STORAGE_KEY_USERS);
    const parsedUsers: any[] = rawUsers ? JSON.parse(rawUsers) : [];
    const nextUsers = Array.isArray(parsedUsers) ? [...parsedUsers] : [];
    let usersChanged = false;

    for (const appItem of approvedApps) {
      const aUid = String(appItem.userId || '').trim().toLowerCase();
      const aId = String(appItem.id || '').trim().toLowerCase();
      const aBase = stripAppIdPrefix(appItem.userId || appItem.id);
      const aEmail = String(appItem.email || '').trim().toLowerCase();
      const aBi = normalizeBi(appItem.biNumber);
      const isGeneric = isGenericSchoolEmail(aEmail);

      let matchedIdx = -1;
      for (let i = 0; i < nextUsers.length; i++) {
        const u = nextUsers[i];
        if (!u) continue;
        const uId = String(u.id || '').trim().toLowerCase();
        const uBase = stripAppIdPrefix(u.id);
        const uEmail = String(u.email || '').trim().toLowerCase();
        const uBi = normalizeBi(u.biNumber);
        if (
          (aUid && uId === aUid) ||
          (aId && uId === aId) ||
          (aBase && uBase && aBase === uBase) ||
          (!isGeneric && aEmail && uEmail === aEmail) ||
          (aBi.length >= 5 && uBi === aBi)
        ) {
          matchedIdx = i;
          if (u.status !== 'ativo') {
            nextUsers[i] = {
              ...u,
              status: 'ativo',
              approvedAt: u.approvedAt || appItem.approvedAt,
              approvedBy: u.approvedBy || appItem.approvedBy,
            };
            usersChanged = true;
          }
        }
      }

      if (matchedIdx === -1 && aEmail && !isGeneric) {
        const parts = String(appItem.fullName || '').trim().split(/\s+/).filter(Boolean);
        const isDme = appItem.scope === 'administracao' || appItem.type === 'membro_dme' || Boolean(appItem.adminRole);
        const isProf = appItem.type === 'professor' || appItem.schoolRole === 'professor';
        nextUsers.push({
          id: appItem.userId || appItem.id,
          firstName: parts[0] || 'Utilizador',
          lastName: parts.slice(1).join(' '),
          email: aEmail,
          role: isDme ? 'admin' : isProf ? 'professor' : 'diretor',
          scope: isDme ? 'administracao' : 'escola',
          schoolRole: isDme ? undefined : appItem.schoolRole || (isProf ? 'professor' : 'diretor_geral'),
          adminRole: isDme ? appItem.adminRole || 'chefe_reparticao' : undefined,
          cargoTitle: appItem.roleRequested || (isProf ? 'Professor(a) / Docente' : 'Director(a) Geral'),
          schoolName: appItem.schoolName || (isDme ? 'Direcção Municipal da Educação de Quêssua' : 'Unidade Escolar'),
          schoolId: appItem.schoolId,
          municipalityOrDepartment: appItem.municipality || 'Quêssua',
          titlePrefix: isDme ? 'Quadro DME' : isProf ? 'Prof.' : 'Director',
          greeting: `Olá ${isDme ? 'Quadro DME' : isProf ? 'Prof.' : 'Director'} ${parts[0] || 'Utilizador'}`,
          biNumber: appItem.biNumber,
          phone: appItem.phone || '+244 923 000 000',
          subject: appItem.subject,
          gradeClass: appItem.gradeClass,
          passwordVerifier: appItem.passwordVerifier,
          status: 'ativo',
          approvedAt: appItem.approvedAt,
          approvedBy: appItem.approvedBy,
          approverTargetRole: 'admin',
          approverTargetEmail: OFFICIAL_DME_ADMIN_EMAIL,
        });
        usersChanged = true;
      }
    }

    if (usersChanged) {
      const prevWinFlag = Boolean((window as any).__SIGRE_APPLYING_SERVER_STATE);
      (window as any).__SIGRE_APPLYING_SERVER_STATE = true;
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(nextUsers));
      } finally {
        (window as any).__SIGRE_APPLYING_SERVER_STATE = prevWinFlag;
      }
    }

    // Also promote currently logged-in active user if their application became approved
    const activeRaw = localStorage.getItem('ucore_active_user');
    if (activeRaw) {
      const active = JSON.parse(activeRaw);
      if (active && active.status !== 'ativo') {
        const acId = String(active.id || '').trim().toLowerCase();
        const acEm = String(active.email || '').trim().toLowerCase();
        const acBi = normalizeBi(active.biNumber);
        const matchedApproved = approvedApps.find((a) => {
          const aUid = String(a.userId || '').trim().toLowerCase();
          const aId = String(a.id || '').trim().toLowerCase();
          const aEm = String(a.email || '').trim().toLowerCase();
          const aBi = normalizeBi(a.biNumber);
          return (
            (acId && (aUid === acId || aId === acId)) ||
            (acEm && !isGenericSchoolEmail(acEm) && aEm === acEm) ||
            (acBi.length >= 5 && aBi === acBi)
          );
        });
        if (matchedApproved) {
          active.status = 'ativo';
          active.approvedAt = matchedApproved.approvedAt || new Date().toLocaleString('pt-AO');
          active.approvedBy = matchedApproved.approvedBy || `Direcção Municipal da Educação (${OFFICIAL_DME_ADMIN_EMAIL})`;
          localStorage.setItem('ucore_active_user', JSON.stringify(active));
        }
      }
    }
  } catch {}
}

/**
 * Canonically deduplicates and unifies homologation applications across all devices.
 * Prevents duplicate pending/approved requests for the same person (matched by BI, personal email,
 * base userId/id, or normalized fullName + type + schoolName) and enforces that an already-approved
 * application ('aprovado' or having approvedAt) never reverts to 'pendente'.
 */
export function deduplicateApplicationsList(apps: PendingApplication[]): PendingApplication[] {
  if (!Array.isArray(apps) || apps.length === 0) return [];
  const canonical: PendingApplication[] = [];

  for (const rawApp of apps) {
    if (!rawApp || isApplicationTombstoned(rawApp)) continue;
    const aId = String(rawApp.id || '').trim().toLowerCase();
    const uId = String(rawApp.userId || '').trim().toLowerCase();
    const baseId = stripAppIdPrefix(rawApp.userId || rawApp.id);
    const aEmail = String(rawApp.email || '').trim().toLowerCase();
    const aBi = normalizeBi(rawApp.biNumber);
    const aName = normalizeSchoolText(rawApp.fullName);
    const aSchool = normalizeSchoolText(rawApp.schoolName);

    const cleanSchoolName = rawApp.schoolName ? rawApp.schoolName.trim().replace(/\s+/g, ' ') : rawApp.schoolName;
    const isActuallyApproved = rawApp.status === 'aprovado' || Boolean(rawApp.approvedAt);
    const app: PendingApplication = {
      ...rawApp,
      ...(aBi ? { biNumber: aBi } : {}),
      ...(cleanSchoolName ? { schoolName: cleanSchoolName } : {}),
      targetApproverRole: 'admin',
      targetApproverEmail: OFFICIAL_DME_ADMIN_EMAIL,
      approverDirectorName: `Director Municipal da Educação (${OFFICIAL_DME_ADMIN_EMAIL})`,
      status: isActuallyApproved ? 'aprovado' : rawApp.status === 'rejeitado' ? 'rejeitado' : 'pendente',
    };

    const existingIdx = canonical.findIndex((c) => {
      const cId = String(c.id || '').trim().toLowerCase();
      const cUid = String(c.userId || '').trim().toLowerCase();
      const cBaseId = stripAppIdPrefix(c.userId || c.id);
      const cBi = normalizeBi(c.biNumber);
      const cEmail = String(c.email || '').trim().toLowerCase();
      const cName = normalizeSchoolText(c.fullName);
      const cSchool = normalizeSchoolText(c.schoolName);

      if (aId && cId && aId === cId) return true;
      if (uId && cUid && uId === cUid) return true;
      if (baseId && cBaseId && baseId === cBaseId) return true;
      if (aBi && cBi && aBi.length >= 5 && aBi === cBi) return true;
      if (
        aEmail &&
        cEmail &&
        !isGenericSchoolEmail(aEmail) &&
        !isGenericSchoolEmail(cEmail) &&
        aEmail === cEmail
      ) {
        return true;
      }
      if (aName && cName && aName === cName && app.type === c.type) {
        // Never merge two different people sharing a name if they have distinct valid BIs or distinct personal emails
        if (aBi.length >= 5 && cBi.length >= 5 && aBi !== cBi) return false;
        if (!isGenericSchoolEmail(aEmail) && !isGenericSchoolEmail(cEmail) && aEmail !== cEmail) return false;
        if (!aSchool || !cSchool || aSchool === cSchool || app.type === 'membro_dme') {
          return true;
        }
      }
      return false;
    });

    if (existingIdx >= 0) {
      const prev = canonical[existingIdx];
      const mergedApproved =
        prev.status === 'aprovado' ||
        app.status === 'aprovado' ||
        Boolean(prev.approvedAt) ||
        Boolean(app.approvedAt);
      const mergedRejected =
        !mergedApproved && (prev.status === 'rejeitado' || app.status === 'rejeitado');

      const preferNew = app.status === 'aprovado' && prev.status !== 'aprovado';
      const primary = preferNew ? app : prev;
      const secondary = preferNew ? prev : app;

      canonical[existingIdx] = {
        ...secondary,
        ...primary,
        id: prev.id || app.id,
        userId: prev.userId || app.userId,
        email: !isGenericSchoolEmail(primary.email)
          ? primary.email
          : !isGenericSchoolEmail(secondary.email)
          ? secondary.email
          : primary.email || secondary.email,
        biNumber: primary.biNumber || secondary.biNumber,
        schoolName: (primary.schoolName || secondary.schoolName || '').trim().replace(/\s+/g, ' '),
        targetApproverRole: 'admin',
        targetApproverEmail: OFFICIAL_DME_ADMIN_EMAIL,
        approverDirectorName: `Director Municipal da Educação (${OFFICIAL_DME_ADMIN_EMAIL})`,
        status: mergedApproved ? 'aprovado' : mergedRejected ? 'rejeitado' : 'pendente',
        approvedAt: primary.approvedAt || secondary.approvedAt,
        approvedBy: primary.approvedBy || secondary.approvedBy,
        complementaryData: primary.complementaryData || secondary.complementaryData,
      };
    } else {
      canonical.push(app);
    }
  }

  return canonical;
}

export function getPendingApplications(type?: string): PendingApplication[] {
  let list: PendingApplication[] = [];
  try {
    const rawUsers = localStorage.getItem(STORAGE_KEY_USERS);
    if (!rawUsers || rawUsers === '[]') {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(CANONICAL_USERS));
    }
    const userBackedApps = reconcileUsersIntoApplications();
    const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = deduplicateApplicationsList([...parsed, ...userBackedApps, ...SEED_PENDING_APPLICATIONS]);
      }
    }
    if (list.length === 0) {
      list = deduplicateApplicationsList([...userBackedApps, ...SEED_PENDING_APPLICATIONS]);
      writeApplicationsWithoutDirtyEcho(list);
    }
  } catch {
    list = deduplicateApplicationsList(SEED_PENDING_APPLICATIONS);
  }
  return type ? list.filter((a) => a.type === type) : list;
}

let applicationsSyncInFlight: Promise<PendingApplication[]> | null = null;
let lastApplicationsSyncAt = 0;

function writeApplicationsWithoutDirtyEcho(apps: PendingApplication[]): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  const prevWinFlag = Boolean((window as any).__SIGRE_APPLYING_SERVER_STATE);
  (window as any).__SIGRE_APPLYING_SERVER_STATE = true;
  try {
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(apps));
  } catch (err) {
    console.warn('[authApprovalStorage] Falha ao gravar candidaturas no localStorage:', err);
  } finally {
    (window as any).__SIGRE_APPLYING_SERVER_STATE = prevWinFlag;
  }
}

/**
 * Synchronizes pending applications from the backend server (primary, instant) and Firestore cloud
 * so applications created on any device appear immediately in dmedoquessua@gmail.com.
 * Uses an in-flight singleton mutex so simultaneous callers share a single fast request.
 */
const pushedAppStatusToFirestore = new Map<string, string>();

/**
 * Synchronizes pending & approved applications bidirectionally between Cloud Firestore
 * (shared across ALL devices, Preview & Shared URLs) and the backend server (/api/network/applications)
 * so approvals and registrations made on ANY device reflect immediately everywhere.
 */
export async function syncApplicationsFromServer(force: boolean = false): Promise<PendingApplication[]> {
  if (applicationsSyncInFlight) {
    return applicationsSyncInFlight;
  }
  const now = Date.now();
  if (!force && now - lastApplicationsSyncAt < 10_000) {
    return getPendingApplications();
  }

  applicationsSyncInFlight = (async (): Promise<PendingApplication[]> => {
    try {
      const combined: PendingApplication[] = [];

      // 1. Fetch Express server (only when Express API backend is active) AND Cloud Firestore in parallel
      const [serverResult, firestoreResult] = await Promise.allSettled([
        isExpressApiAvailable()
          ? Promise.race([
              fetch('/api/network/applications', { headers: { Accept: 'application/json' } }).then((r) =>
                checkExpressApiResponse(r) ? r.json() : null
              ),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
            ])
          : Promise.resolve(null),
        Promise.race([
          fetchApplicationsFromFirestoreWithStatus(),
          new Promise<{ apps: PendingApplication[]; ok: boolean; quotaExhausted: boolean }>((resolve) =>
            setTimeout(() => resolve({ apps: [], ok: false, quotaExhausted: isFirestoreReadQuotaExhausted() }), 5500)
          ),
        ]),
      ]);

      const serverApps: PendingApplication[] =
        serverResult.status === 'fulfilled' && serverResult.value && Array.isArray(serverResult.value.applications)
          ? serverResult.value.applications
          : [];
      const firestoreReadSucceeded =
        firestoreResult.status === 'fulfilled' && firestoreResult.value?.ok === true;
      const firestoreApps: PendingApplication[] =
        firestoreReadSucceeded && Array.isArray(firestoreResult.value.apps)
          ? firestoreResult.value.apps.filter((a) => a && !isApplicationTombstoned(a))
          : [];

      // Heal stale local sigre_deleted_application_ids_v1 for applications that are live (non-tombstoned) in Cloud Firestore
      if (firestoreApps.length > 0) {
        firestoreApps.forEach((fa) => {
          removeDeletedApplicationId(fa.id, fa.userId, fa.email, normalizeBi(fa.biNumber));
        });
        combined.push(...firestoreApps);
      }
      if (serverApps.length > 0) {
        const liveServerApps = serverApps.filter((a) => a && !isApplicationTombstoned(a));
        liveServerApps.forEach((sa) => {
          removeDeletedApplicationId(sa.id, sa.userId, sa.email, normalizeBi(sa.biNumber));
        });
        combined.push(...liveServerApps);
      }

      // 2. Include local applications and any user-backed applications missing from applications list
      const localApps = getPendingApplications();
      const userBackedApps = reconcileUsersIntoApplications();
      combined.push(...localApps, ...userBackedApps);

      // 3. Canonically deduplicate & unify so no candidate is duplicated and 'aprovado' ALWAYS wins over 'pendente'
      const merged = deduplicateApplicationsList(combined);
      reconcileApprovedAppsIntoLocalUsersAndRosters(merged);

      const prevRaw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
      const nextRaw = JSON.stringify(merged);
      if (prevRaw !== nextRaw) {
        writeApplicationsWithoutDirtyEcho(merged);
      }
      lastApplicationsSyncAt = Date.now();

      // 4. Mirror any missing or upgraded ('aprovado'/'rejeitado') apps to Express server in ONE batched POST
      const matchesRecordIdentity = (a: PendingApplication, b: PendingApplication): boolean => {
        if (a.id === b.id) return true;
        if (a.userId && b.userId && a.userId === b.userId) return true;
        const aBi = normalizeBi(a.biNumber);
        const bBi = normalizeBi(b.biNumber);
        if (aBi.length >= 5 && bBi === aBi) return true;
        const aEm = String(a.email || '').trim().toLowerCase();
        const bEm = String(b.email || '').trim().toLowerCase();
        return Boolean(!isGenericSchoolEmail(aEm) && !isGenericSchoolEmail(bEm) && aEm === bEm);
      };

      const missingOrUpgradedOnServer = merged.filter((ma) => {
        const srvMatch = serverApps.find((sa) => matchesRecordIdentity(sa, ma));
        if (!srvMatch) return true;
        if (ma.status === 'aprovado' && srvMatch.status !== 'aprovado') return true;
        if (ma.status === 'rejeitado' && srvMatch.status === 'pendente') return true;
        return false;
      });
      if (isExpressApiAvailable() && missingOrUpgradedOnServer.length > 0) {
        fetch('/api/network/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applications: missingOrUpgradedOnServer }),
          keepalive: true,
        }).catch(() => {});
      }

      // 5. Mirror missing or upgraded ('aprovado'/'rejeitado') apps to Cloud Firestore ONLY when Firestore read succeeded
      if (firestoreReadSucceeded) {
        const missingOrUpgradedInFirestore = merged.filter((ma) => {
          const fsMatch = firestoreApps.find((fa) => matchesRecordIdentity(fa, ma));
          const needsPush =
            !fsMatch ||
            (ma.status === 'aprovado' && fsMatch.status !== 'aprovado') ||
            (ma.status === 'rejeitado' && fsMatch.status === 'pendente');
          if (!needsPush) return false;
          const sig = `${ma.status}:${ma.approvedAt || ''}`;
          return pushedAppStatusToFirestore.get(ma.id) !== sig;
        });

        const BATCH_SIZE = 6;
        for (let i = 0; i < missingOrUpgradedInFirestore.length; i += BATCH_SIZE) {
          const chunk = missingOrUpgradedInFirestore.slice(i, i + BATCH_SIZE);
          await Promise.allSettled(
            chunk.map(async (item) => {
              const ok = await saveApplicationToFirestore(item);
              if (ok) {
                pushedAppStatusToFirestore.set(item.id, `${item.status}:${item.approvedAt || ''}`);
              }
            })
          );
        }
      }

      return merged;
    } catch (err) {
      console.warn('[authApprovalStorage] Falha ao sincronizar candidaturas:', err);
      return getPendingApplications();
    }
  })().finally(() => {
    applicationsSyncInFlight = null;
  });

  return applicationsSyncInFlight;
}

/**
 * Initializes a real-time Cloud Firestore listener that keeps this device's application list
 * AND local Express server updated instantaneously whenever any candidate signs up OR any admin
 * approves/rejects a homologation on ANY other device (Preview, Shared URL, Mobile, Desktop).
 */
let realtimeUnsubscribe: (() => void) | null = null;
export function initRealtimeApplicationsSync(
  onUpdate?: (apps: PendingApplication[]) => void
): () => void {
  if (isFirestoreReadQuotaExhausted()) {
    return () => {};
  }
  if (realtimeUnsubscribe) {
    return realtimeUnsubscribe;
  }

  let latestFirestoreApps: PendingApplication[] = [];
  let hasReceivedSnapshot = false;

  const applyCombinedSnapshot = (firestoreApps: PendingApplication[]) => {
    try {
      const liveFsApps = (firestoreApps || []).filter((a) => a && !isApplicationTombstoned(a));
      liveFsApps.forEach((fa) => {
        removeDeletedApplicationId(fa.id, fa.userId, fa.email, normalizeBi(fa.biNumber));
      });
      const localApps = getPendingApplications();
      const userBackedApps = reconcileUsersIntoApplications();
      const validApps = deduplicateApplicationsList([...liveFsApps, ...localApps, ...userBackedApps]);
      reconcileApprovedAppsIntoLocalUsersAndRosters(validApps);

      const prevRaw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
      const nextRaw = JSON.stringify(validApps);
      if (prevRaw !== nextRaw) {
        writeApplicationsWithoutDirtyEcho(validApps);
        // Mirror Cloud Firestore updates to this container's Express backend only when Express API is active
        if (isExpressApiAvailable() && liveFsApps.length > 0) {
          fetch('/api/network/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applications: validApps }),
          }).catch(() => {});
        }
        // Push any user-backed app missing from Firestore ONLY when a real snapshot arrived
        if (hasReceivedSnapshot) {
          userBackedApps.forEach((ua) => {
            const inFs = liveFsApps.some(
              (fa) =>
                fa.id === ua.id ||
                (fa.userId && ua.userId && fa.userId === ua.userId) ||
                (normalizeBi(fa.biNumber).length >= 5 && normalizeBi(fa.biNumber) === normalizeBi(ua.biNumber))
            );
            const sig = `${ua.status}:${ua.approvedAt || ''}`;
            if (!inFs && pushedAppStatusToFirestore.get(ua.id) !== sig) {
              saveApplicationToFirestore(ua)
                .then((ok) => {
                  if (ok) pushedAppStatusToFirestore.set(ua.id, sig);
                })
                .catch(() => {});
            }
          });
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sigre-data-synced'));
        }
      }
      onUpdate?.(validApps);
    } catch (e) {
      console.warn('[authApprovalStorage] Erro no listener em tempo real:', e);
    }
  };

  const fsUnsub = subscribeToApplications((firestoreApps) => {
    hasReceivedSnapshot = true;
    latestFirestoreApps = firestoreApps || [];
    applyCombinedSnapshot(latestFirestoreApps);
  });

  const handleUsersUpdated = () => {
    if (hasReceivedSnapshot) {
      applyCombinedSnapshot(latestFirestoreApps);
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('sigre-users-updated', handleUsersUpdated);
  }

  realtimeUnsubscribe = () => {
    fsUnsub();
    if (typeof window !== 'undefined') {
      window.removeEventListener('sigre-users-updated', handleUsersUpdated);
    }
    realtimeUnsubscribe = null;
  };

  return realtimeUnsubscribe;
}

export function normalizeSchoolText(value?: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function schoolsMatch(
  appSchoolName?: string,
  directorSchoolName?: string,
  appSchoolId?: string,
  directorSchoolId?: string
): boolean {
  const normAppId = (appSchoolId || '').trim().toLowerCase();
  const normDirId = (directorSchoolId || '').trim().toLowerCase();
  if (normAppId && normDirId && normAppId === normDirId) {
    return true;
  }
  const normAppName = normalizeSchoolText(appSchoolName);
  const normDirName = normalizeSchoolText(directorSchoolName);
  if (!normAppName || !normDirName) {
    return false;
  }
  return normAppName === normDirName;
}

/**
 * All homologations are now centralized exclusively in the Municipal Admin account
 * (dmedoquessua@gmail.com). School Directors no longer receive separate approval queues.
 */
export function isSchoolDirectorApproval(
  _app?: Partial<Pick<PendingApplication, 'type' | 'scope' | 'schoolRole' | 'targetApproverRole'>> | null
): boolean {
  return false;
}

/**
 * Returns applications targeted for the school director.
 * Returns an empty list because all homologations now route centrally to dmedoquessua@gmail.com.
 */
export function getApplicationsForDirector(
  _schoolName?: string,
  _schoolId?: string
): PendingApplication[] {
  return [];
}

/**
 * Returns all applications visible to the central administrator (dmedoquessua@gmail.com).
 */
export function getApplicationsForAdmin(filterType?: string): PendingApplication[] {
  const all = getPendingApplications();
  if (filterType && filterType !== 'todos') {
    return all.filter((a) => a.type === filterType);
  }
  return all;
}

function buildNormalizedPendingApplication(app: PendingApplication): PendingApplication {
  const cleanSchool = app.schoolName ? app.schoolName.trim().replace(/\s+/g, ' ') : app.schoolName;
  const appWithCleanSchool = cleanSchool ? { ...app, schoolName: cleanSchool } : app;

  return {
    ...appWithCleanSchool,
    targetApproverEmail: OFFICIAL_DME_ADMIN_EMAIL,
    targetApproverRole: 'admin',
    approverDirectorName: `Director Municipal da Educação (${OFFICIAL_DME_ADMIN_EMAIL})`,
  };
}

export function savePendingApplication(app: PendingApplication): PendingApplication {
  try {
    const rawAdjusted = buildNormalizedPendingApplication(app);
    // Clear any previous deletion tombstones across applications/users/role collections
    clearTombstonesForApplication(rawAdjusted);

    const existing = getPendingApplications();
    const mergedList = deduplicateApplicationsList([rawAdjusted, ...existing]);
    const adjBi = normalizeBi(rawAdjusted.biNumber);
    const adjEmail = String(rawAdjusted.email || '').trim().toLowerCase();
    const canonicalApp =
      mergedList.find(
        (m) =>
          m.id === rawAdjusted.id ||
          (rawAdjusted.userId && m.userId === rawAdjusted.userId) ||
          (adjBi.length >= 5 && normalizeBi(m.biNumber) === adjBi) ||
          (!isGenericSchoolEmail(adjEmail) &&
            m.email &&
            adjEmail === m.email.trim().toLowerCase()) ||
          (normalizeSchoolText(m.fullName) === normalizeSchoolText(rawAdjusted.fullName) &&
            m.type === rawAdjusted.type &&
            schoolsMatch(m.schoolName, rawAdjusted.schoolName, m.schoolId, rawAdjusted.schoolId) &&
            (adjBi.length < 5 || normalizeBi(m.biNumber).length < 5 || normalizeBi(m.biNumber) === adjBi))
      ) || rawAdjusted;

    writeApplicationsWithoutDirtyEcho(mergedList);

    // Save directly to Firestore cloud database in background
    saveApplicationToFirestore(canonicalApp).catch((e) => {
      console.warn('[authApprovalStorage] Falha ao persistir no Firestore:', e);
    });

    if (typeof window !== 'undefined') {
      if (isExpressApiAvailable()) {
        fetch('/api/network/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ application: canonicalApp }),
          keepalive: true,
        }).catch(() => {});
      }
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }
    return canonicalApp;
  } catch (e) {
    console.error('Erro ao salvar candidatura:', e);
    return app;
  }
}

/**
 * Async version that guarantees the application (and optional user account) is persisted on the central
 * backend server (/api/network/applications) AND Cloud Firestore so it appears immediately in dmedoquessua@gmail.com across all devices.
 */
export async function savePendingApplicationAsync(
  app: PendingApplication,
  userAccount?: UserAccount
): Promise<PendingApplication> {
  const rawAdjusted = buildNormalizedPendingApplication(app);
  // Clear any deletion tombstones across applications/users/role collections
  clearTombstonesForApplication(rawAdjusted);

  const existing = getPendingApplications();
  const mergedList = deduplicateApplicationsList([rawAdjusted, ...existing]);
  const adjBi = normalizeBi(rawAdjusted.biNumber);
  const adjEmail = String(rawAdjusted.email || '').trim().toLowerCase();
  const canonicalApp =
    mergedList.find(
      (m) =>
        m.id === rawAdjusted.id ||
        (rawAdjusted.userId && m.userId === rawAdjusted.userId) ||
        (adjBi.length >= 5 && normalizeBi(m.biNumber) === adjBi) ||
        (!isGenericSchoolEmail(adjEmail) &&
          m.email &&
          adjEmail === m.email.trim().toLowerCase()) ||
        (normalizeSchoolText(m.fullName) === normalizeSchoolText(rawAdjusted.fullName) &&
          m.type === rawAdjusted.type &&
          schoolsMatch(m.schoolName, rawAdjusted.schoolName, m.schoolId, rawAdjusted.schoolId) &&
          (adjBi.length < 5 || normalizeBi(m.biNumber).length < 5 || normalizeBi(m.biNumber) === adjBi))
    ) || rawAdjusted;

  writeApplicationsWithoutDirtyEcho(mergedList);

  const postToServer = async (): Promise<boolean> => {
    if (!isExpressApiAvailable()) return false;
    const res = await Promise.race([
      fetch('/api/network/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application: canonicalApp, ...(userAccount ? { user: userAccount } : {}) }),
        keepalive: true,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Server API timeout')), 8000)),
    ]);
    if (checkExpressApiResponse(res) && res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.applications)) {
        writeApplicationsWithoutDirtyEcho(deduplicateApplicationsList(data.applications));
      }
      return true;
    }
    return false;
  };

  // Reliable server persistence (when Express is available) + Firestore cloud persistence (4.5s timeout)
  const serverPromise = isExpressApiAvailable()
    ? postToServer().catch(async () => {
        await new Promise((r) => setTimeout(r, 400));
        return postToServer().catch((err) => {
          console.warn('[authApprovalStorage] Falha ao comunicar com o servidor ao salvar candidatura:', err);
          return false;
        });
      })
    : Promise.resolve(false);

  const firestorePromise = Promise.race([
    saveApplicationToFirestore(canonicalApp).then((ok) => {
      if (ok) {
        pushedAppStatusToFirestore.set(canonicalApp.id, `${canonicalApp.status}:${canonicalApp.approvedAt || ''}`);
      }
    }),
    new Promise<void>((resolve) => setTimeout(resolve, 4500)),
  ]).catch(() => {});

  const userFirestorePromise = userAccount
    ? Promise.race([
        saveUserToFirestore(userAccount),
        new Promise<void>((resolve) => setTimeout(resolve, 4500)),
      ]).catch(() => {})
    : Promise.resolve();

  await Promise.allSettled([serverPromise, firestorePromise, userFirestorePromise]);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sigre-data-synced'));
  }

  return canonicalApp;
}

/**
 * Searches whether a teacher was already pre-registered by the School Director
 * in the school roster (without an account yet).
 */
export function searchPreRegisteredTeacher(
  email: string,
  biNumber: string,
  fullName: string,
  schoolName: string = ''
): { found: boolean; teacherName?: string; details?: string; id?: string } {
  const normEmail = email.trim().toLowerCase();
  const normBi = biNumber.trim().toUpperCase();
  const normName = fullName.trim().toLowerCase();
  const normSchool = schoolName.trim().toLowerCase();

  // 1. Check in director teachers roster
  for (const t of directorTeachersData) {
    const tSchool = (t.schoolName || '').trim().toLowerCase();
    const tEmail = (t.email || '').trim().toLowerCase();
    const tBi = (t.registrationData?.biNif || '').trim().toUpperCase();
    const tName = (t.name || '').trim().toLowerCase();

    const matchesSchool =
      normSchool.length >= 3 &&
      tSchool.length >= 3 &&
      (tSchool.includes(normSchool) || normSchool.includes(tSchool));
    const matchesEmail = normEmail.length >= 5 && tEmail.length >= 5 && tEmail === normEmail;
    const matchesBi = normBi.length >= 5 && tBi.length >= 5 && tBi === normBi;
    const matchesName =
      normName.length >= 4 &&
      tName.length >= 4 &&
      (tName.includes(normName) || normName.includes(tName));

    if (matchesEmail || matchesBi || (matchesName && matchesSchool)) {
      return {
        found: true,
        teacherName: t.name,
        id: t.id,
        details: `Docente encontrado no quadro da ${t.schoolName} (${t.subject}, ${t.gradeClass}, Sala ${t.room}). Diretor responsável: ${t.directorName}.`,
      };
    }
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
  schoolName: string = ''
): { found: boolean; directorName?: string; details?: string; schoolMatched?: string } {
  const normEmail = email.trim().toLowerCase();
  const normName = fullName.trim().toLowerCase();
  const normSchool = schoolName.trim().toLowerCase();

  // Search in initialAdminDirectors & initialAdminSchools
  for (const s of initialAdminSchools) {
    const sName = (s.name || '').trim().toLowerCase();
    const sDirectorName = (s.directorName || '').trim().toLowerCase();
    const sEmail = (s.email || '').trim().toLowerCase();

    const matchesSchool =
      normSchool.length >= 3 &&
      sName.length >= 3 &&
      sDirectorName.length >= 3 &&
      (sName.includes(normSchool) || normSchool.includes(sName));
    const matchesDirectorName =
      normName.length >= 4 &&
      sDirectorName.length >= 4 &&
      (sDirectorName.includes(normName) || normName.includes(sDirectorName));
    const matchesEmail = normEmail.length >= 5 && sEmail.length >= 5 && sEmail === normEmail;

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
    const dEmail = (d.email || '').trim().toLowerCase();
    if (normEmail.length >= 5 && dEmail.length >= 5 && dEmail === normEmail) {
      return {
        found: true,
        directorName: d.name,
        schoolMatched: d.schoolName,
        details: `Diretor(a) homologado(a) no mapa de dirigentes escolares municipais da rede Sigre.`,
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
  approverName: string = 'Administrador Sigre',
  complementaryData?: PendingApprovalComplementaryData
): { success: boolean; app?: PendingApplication; activatedUser?: UserAccount; roleSyncPromises?: Promise<any>[] } {
  try {
    const applications = getPendingApplications();
    const target = applications.find((a) => a.id === applicationId);
    if (!target) return { success: false };

    const roleSyncPromises: Promise<any>[] = [];

    const updatedApp: PendingApplication = {
      ...target,
      status: 'aprovado',
      approvedBy: approverName,
      approvedAt: new Date().toLocaleString('pt-AO'),
      updatedAt: new Date().toISOString(),
      ...(complementaryData ? {
        complementaryData,
        nivelAcademico: complementaryData.nivelAcademico || target.nivelAcademico,
        nivelAcademicoOutro: complementaryData.nivelAcademicoOutro || target.nivelAcademicoOutro,
        anosServico: typeof complementaryData.anosServico === 'number' ? complementaryData.anosServico : target.anosServico,
        regimeTrabalho: complementaryData.regimeTrabalho || target.regimeTrabalho,
        classificacaoPedagogica: complementaryData.classificacaoPedagogica || target.classificacaoPedagogica,
        especialidadeCurso: complementaryData.especialidadeCurso || target.especialidadeCurso,
        numeroMecanograficoOuNif: complementaryData.numeroMecanograficoOuNif || target.numeroMecanograficoOuNif,
        numeroCertificadoDiploma: complementaryData.numeroCertificadoDiploma || target.numeroCertificadoDiploma,
        documentosConferidosPresencialmente: complementaryData.documentosConferidosPresencialmente ?? target.documentosConferidosPresencialmente,
        dataInicioFuncoes: complementaryData.dataInicioFuncoes || target.dataInicioFuncoes,
      } : {}),
    };

    const updatedList = deduplicateApplicationsList(
      applications.map((a) =>
        a.id === applicationId || (Boolean(target.userId) && a.userId === target.userId) ? updatedApp : a
      )
    );
    writeApplicationsWithoutDirtyEcho(updatedList);

    // Build canonical activated candidate UserAccount (even when the candidate is NOT in the admin's localStorage)
    const buildActivatedCandidateUser = (existingUser?: any): UserAccount => {
      const nameParts = (target.fullName || '').trim().split(/\s+/).filter(Boolean);
      const isDmeMember =
        target.scope === 'administracao' ||
        target.type === 'membro_dme' ||
        Boolean(target.adminRole);
      const isTeacher = target.type === 'professor' || target.schoolRole === 'professor';
      const resolvedRole: 'admin' | 'diretor' | 'professor' = isDmeMember
        ? 'admin'
        : isTeacher
        ? 'professor'
        : 'diretor';
      const resolvedScope: 'escola' | 'administracao' = isDmeMember ? 'administracao' : 'escola';
      const firstName = existingUser?.firstName || nameParts[0] || 'Utilizador';
      const lastName = existingUser?.lastName !== undefined ? existingUser.lastName : nameParts.slice(1).join(' ');
      const titlePrefix =
        existingUser?.titlePrefix ||
        (isDmeMember ? 'Quadro DME' : isTeacher ? 'Prof.' : 'Director');

      return {
        ...(existingUser || {}),
        id: existingUser?.id || target.userId || target.id,
        firstName,
        lastName,
        email: (existingUser?.email || target.email || '').trim().toLowerCase(),
        role: existingUser?.role || resolvedRole,
        scope: existingUser?.scope || resolvedScope,
        schoolRole:
          resolvedScope === 'escola'
            ? existingUser?.schoolRole || target.schoolRole || (isTeacher ? 'professor' : 'diretor_geral')
            : undefined,
        adminRole:
          resolvedScope === 'administracao'
            ? existingUser?.adminRole || target.adminRole || 'chefe_reparticao'
            : undefined,
        cargoTitle: existingUser?.cargoTitle || target.roleRequested || (isTeacher ? 'Professor(a) / Docente' : 'Director(a) Geral'),
        schoolName: existingUser?.schoolName || target.schoolName || (isDmeMember ? 'Direcção Municipal da Educação de Quêssua' : 'Unidade Escolar'),
        schoolId: existingUser?.schoolId || target.schoolId,
        municipalityOrDepartment: existingUser?.municipalityOrDepartment || target.municipality || 'Quêssua',
        titlePrefix,
        greeting: existingUser?.greeting || `Olá ${titlePrefix} ${firstName}`,
        biNumber: existingUser?.biNumber || target.biNumber,
        phone: existingUser?.phone || target.phone,
        subject: existingUser?.subject || target.subject,
        gradeClass: existingUser?.gradeClass || target.gradeClass,
        passwordVerifier: existingUser?.passwordVerifier || target.passwordVerifier,
        status: 'ativo',
        approvedAt: updatedApp.approvedAt,
        approvedBy: approverName,
        approverTargetRole: 'admin',
        approverTargetEmail: OFFICIAL_DME_ADMIN_EMAIL,
        ...(complementaryData ? {
          nivelAcademico: complementaryData.nivelAcademico || existingUser?.nivelAcademico || target.nivelAcademico,
          anosServico: typeof complementaryData.anosServico === 'number' ? complementaryData.anosServico : (existingUser?.anosServico ?? target.anosServico),
          regimeTrabalho: complementaryData.regimeTrabalho || existingUser?.regimeTrabalho || target.regimeTrabalho,
          classificacaoPedagogica: complementaryData.classificacaoPedagogica || existingUser?.classificacaoPedagogica || target.classificacaoPedagogica,
          numeroMecanograficoOuNif: complementaryData.numeroMecanograficoOuNif || existingUser?.numeroMecanograficoOuNif || target.numeroMecanograficoOuNif,
          documentosConferidosPresencialmente:
            typeof complementaryData.documentosConferidosPresencialmente === 'boolean'
              ? complementaryData.documentosConferidosPresencialmente
              : existingUser?.documentosConferidosPresencialmente,
        } : {}),
      };
    };

    // Always upsert candidate in ucore_registered_users with status: 'ativo' and sync to Firestore users collection
    let activatedCandidateUser: UserAccount = buildActivatedCandidateUser();
    try {
      const rawUsers = localStorage.getItem('ucore_registered_users');
      const parsedUsers = rawUsers ? JSON.parse(rawUsers) : [];
      const nextUsers: any[] = Array.isArray(parsedUsers) ? [...parsedUsers] : [];
      let matchedUser = false;
      const targetBiNorm = normalizeBi(target.biNumber);
      for (let i = 0; i < nextUsers.length; i++) {
        const u = nextUsers[i];
        if (
          u &&
          (u.id === target.userId ||
            u.id === target.id ||
            (targetBiNorm.length >= 5 && normalizeBi(u.biNumber) === targetBiNorm) ||
            (u.email && target.email && !isGenericSchoolEmail(u.email) && u.email.trim().toLowerCase() === target.email.trim().toLowerCase()))
        ) {
          activatedCandidateUser = buildActivatedCandidateUser(u);
          nextUsers[i] = activatedCandidateUser;
          matchedUser = true;
        }
      }
      if (!matchedUser && activatedCandidateUser.email) {
        nextUsers.push(activatedCandidateUser);
      }
      localStorage.setItem('ucore_registered_users', JSON.stringify(nextUsers));
    } catch {}

    // Always push candidate's active UserAccount to Firestore so login from ANY device immediately sees status: 'ativo'
    if (activatedCandidateUser.email || activatedCandidateUser.id) {
      roleSyncPromises.push(
        saveUserToFirestore(activatedCandidateUser).catch((e) => {
          console.warn('[authApprovalStorage] Falha ao ativar utilizador no Firestore:', e);
        })
      );
    }

    // If a School Director (Diretor Geral) is approved, update the school's directorName AND director rosters
    if (target.type === 'diretor' || target.schoolRole === 'diretor_geral') {
      if (target.schoolName) {
        ['ucore_admin_schools', 'ucore_registered_schools_v1'].forEach((storageKey) => {
          try {
            const rawSchools = localStorage.getItem(storageKey);
            if (rawSchools) {
              const parsedSchools = JSON.parse(rawSchools);
              if (Array.isArray(parsedSchools)) {
                const updatedSchoolItems: any[] = [];
                const nextSchools = parsedSchools.map((sc: any) => {
                  const scName = sc.name || sc.nomeOficial || '';
                  if (schoolsMatch(target.schoolName, scName, target.schoolId, sc.id)) {
                    const updatedSc = {
                      ...sc,
                      directorName: target.fullName,
                      registrationData: sc.registrationData
                        ? {
                            ...sc.registrationData,
                            director: {
                              ...(sc.registrationData.director || {}),
                              nome: target.fullName,
                              email: target.email || sc.registrationData.director?.email,
                              contacto: target.phone || sc.registrationData.director?.contacto,
                            },
                          }
                        : sc.registrationData,
                    };
                    updatedSchoolItems.push(updatedSc);
                    return updatedSc;
                  }
                  return sc;
                });
                localStorage.setItem(storageKey, JSON.stringify(nextSchools));
                updatedSchoolItems.forEach((sc) => {
                  roleSyncPromises.push(saveSchoolToFirestore(sc).catch(() => {}));
                });
              }
            }
          } catch {}
        });
      }

      const directorEntry = {
        id: target.userId || target.id,
        name: target.fullName,
        nomeCompleto: target.fullName,
        phone: target.phone || '+244 923 000 000',
        email: target.email,
        biNif: target.biNumber,
        schoolName: target.schoolName,
        nomeEscola: target.schoolName,
        schoolId: target.schoolId,
        location: target.municipality || 'Quêssua',
        yearsInRole: target.anosServico || 1,
        presenceRate: 100,
        schoolPerformance: 92,
        status: 'Ativo',
        approvedAt: updatedApp.approvedAt,
      };
      ['ucore_admin_directors', 'ucore_registered_directors_v2'].forEach((dirKey) => {
        try {
          const rawDirs = localStorage.getItem(dirKey);
          const dirList = rawDirs ? JSON.parse(rawDirs) : [];
          if (Array.isArray(dirList)) {
            const idx = dirList.findIndex(
              (d: any) =>
                d &&
                (d.id === directorEntry.id ||
                  (d.email && target.email && !isGenericSchoolEmail(d.email) && d.email.toLowerCase() === target.email.toLowerCase()) ||
                  (normalizeBi(d.biNif || d.biNumber).length >= 5 && normalizeBi(d.biNif || d.biNumber) === normalizeBi(target.biNumber)))
            );
            const nextDirs = [...dirList];
            if (idx >= 0) {
              nextDirs[idx] = { ...nextDirs[idx], ...directorEntry };
            } else {
              nextDirs.unshift(directorEntry);
            }
            localStorage.setItem(dirKey, JSON.stringify(nextDirs));
          }
        } catch {}
      });
      roleSyncPromises.push(saveDirectorToFirestore(directorEntry).catch(() => {}));
    }

    // If a Teacher (Professor) is approved, ensure their record is saved to teacher rosters
    if (target.type === 'professor') {
      try {
        const rawAdmins = localStorage.getItem('ucore_admin_teachers');
        const adminTeachers = rawAdmins ? JSON.parse(rawAdmins) : [];
        const rawDirs = localStorage.getItem('ucore_director_teachers_v1');
        const dirTeachers = rawDirs ? JSON.parse(rawDirs) : [];

        const teacherSchool = target.schoolName || 'Escola Primária do Quéssua';
        const teacherSubject = target.subject || 'Língua Portuguesa';
        const teacherClass = target.gradeClass || '4ª Classe';
        const teacherShift = 'Manhã';

        const teacherEntry: any = {
          id: target.userId || target.id,
          name: target.fullName,
          schoolName: teacherSchool,
          subject: teacherSubject,
          classAssigned: teacherClass,
          gradeClass: teacherClass,
          room: 'Sala 01',
          turma: 'Turma A',
          shift: teacherShift,
          directorName: approverName,
          status: 'Ativo',
          email: target.email,
          phone: target.phone,
          biNif: target.biNumber,
          qualification: complementaryData?.nivelAcademico || target.nivelAcademico || 'Licenciado',
          gender: 'M',
          approvedAt: updatedApp.approvedAt,
        };

        const existingAdminIdx = adminTeachers.findIndex(
          (t: any) => t.id === teacherEntry.id || (t.email && target.email && t.email.toLowerCase() === target.email.toLowerCase())
        );
        if (existingAdminIdx >= 0) {
          adminTeachers[existingAdminIdx] = { ...adminTeachers[existingAdminIdx], ...teacherEntry };
        } else {
          adminTeachers.unshift(teacherEntry);
        }
        localStorage.setItem('ucore_admin_teachers', JSON.stringify(adminTeachers));

        const existingDirIdx = dirTeachers.findIndex(
          (t: any) => t.id === teacherEntry.id || (t.email && target.email && t.email.toLowerCase() === target.email.toLowerCase())
        );
        if (existingDirIdx >= 0) {
          dirTeachers[existingDirIdx] = { ...dirTeachers[existingDirIdx], ...teacherEntry };
        } else {
          dirTeachers.unshift(teacherEntry);
        }
        localStorage.setItem('ucore_director_teachers_v1', JSON.stringify(dirTeachers));
        roleSyncPromises.push(saveTeacherToFirestore(teacherEntry).catch(() => {}));
      } catch (err) {
        console.warn('Erro ao integrar professor no quadro após aprovação:', err);
      }
    }

    // If a School Administrative Staff / Subdirector / Secretary is approved, persist into ucore_registered_staff_v1 (without assigning any teaching turma)
    if (
      target.type === 'funcionario' ||
      target.schoolRole === 'subdiretor_pedagogico' ||
      target.schoolRole === 'subdiretor_administrativo' ||
      target.schoolRole === 'secretario_escolar'
    ) {
      try {
        const rawStaff = localStorage.getItem('ucore_registered_staff_v1');
        const staffList = rawStaff ? JSON.parse(rawStaff) : [];
        const roleLabel =
          target.roleRequested ||
          (target.schoolRole === 'subdiretor_pedagogico'
            ? 'Subdirector Pedagógico'
            : target.schoolRole === 'subdiretor_administrativo'
            ? 'Subdirector Administrativo'
            : target.schoolRole === 'secretario_escolar'
            ? 'Secretário(a) Escolar'
            : 'Funcionário Administrativo');

        const staffEntry = {
          id: target.userId || target.id,
          name: target.fullName,
          fullName: target.fullName,
          role: roleLabel,
          schoolRole: target.schoolRole || 'funcionario',
          schoolName: target.schoolName || 'Unidade Escolar do Quêssua',
          schoolId: target.schoolId,
          email: target.email,
          phone: target.phone || '+244 923 000 000',
          biNumber: target.biNumber,
          qualification: complementaryData?.nivelAcademico || target.nivelAcademico || 'Licenciado',
          status: 'Ativo' as const,
          approvedAt: updatedApp.approvedAt,
          approvedBy: approverName,
        };

        const nextStaff = Array.isArray(staffList) ? [...staffList] : [];
        const existingIdx = nextStaff.findIndex(
          (s: any) =>
            s &&
            (s.id === staffEntry.id ||
              (s.email && target.email && !isGenericSchoolEmail(s.email) && s.email.toLowerCase() === target.email.toLowerCase()) ||
              (normalizeBi(s.biNumber).length >= 5 && normalizeBi(s.biNumber) === normalizeBi(target.biNumber)))
        );
        if (existingIdx >= 0) {
          nextStaff[existingIdx] = { ...nextStaff[existingIdx], ...staffEntry };
        } else {
          nextStaff.unshift(staffEntry);
        }
        localStorage.setItem('ucore_registered_staff_v1', JSON.stringify(nextStaff));
        roleSyncPromises.push(saveStaffToFirestore(staffEntry).catch(() => {}));
      } catch (err) {
        console.warn('Erro ao integrar subdirector/funcionário escolar após aprovação:', err);
      }
    }

    // If a Municipal Directorate Staff member (Membro DME) is approved, save to DME Staff roster (never to School Directors)
    if (target.type === 'membro_dme' || target.scope === 'administracao') {
      try {
        const rawDme = localStorage.getItem('ucore_dme_staff_list');
        const dmeList = rawDme ? JSON.parse(rawDme) : [];
        const dmeEntry = {
          id: target.userId || target.id,
          name: target.fullName,
          role: target.adminRole || 'chefe_reparticao',
          cargoTitle: target.roleRequested || 'Quadro Técnico da Direcção Municipal',
          department: 'Direcção Municipal da Educação de Quêssua',
          email: target.email,
          phone: target.phone || '+244 923 000 000',
          biNumber: target.biNumber,
          status: 'Ativo' as const,
          approvedAt: updatedApp.approvedAt,
        };
        const existingIdx = Array.isArray(dmeList)
          ? dmeList.findIndex(
              (m: any) =>
                m.id === dmeEntry.id ||
                (m.email && target.email && m.email.toLowerCase() === target.email.toLowerCase()) ||
                (m.role && m.role === dmeEntry.role)
            )
          : -1;
        const nextList = Array.isArray(dmeList) ? [...dmeList] : [];
        if (existingIdx >= 0) {
          nextList[existingIdx] = { ...nextList[existingIdx], ...dmeEntry };
        } else {
          nextList.unshift(dmeEntry);
        }
        localStorage.setItem('ucore_dme_staff_list', JSON.stringify(nextList));
        roleSyncPromises.push(saveDmeStaffToFirestore(dmeEntry).catch(() => {}));
      } catch (err) {
        console.warn('Erro ao integrar membro DME no quadro da Direcção Municipal:', err);
      }
    }

    // Update active user in localStorage ONLY if the currently logged-in user IS the candidate
    let activatedUser: UserAccount = activatedCandidateUser;
    const activeUserRaw = localStorage.getItem('ucore_active_user');
    if (activeUserRaw) {
      try {
        const activeUser: UserAccount = JSON.parse(activeUserRaw);
        if (activeUser.id === target.userId || (activeUser.email && target.email && activeUser.email.toLowerCase() === target.email.toLowerCase())) {
          activeUser.status = 'ativo';
          activeUser.approvedAt = updatedApp.approvedAt;
          activeUser.approvedBy = approverName;
          if (complementaryData) {
            if (complementaryData.nivelAcademico) activeUser.nivelAcademico = complementaryData.nivelAcademico;
            if (typeof complementaryData.anosServico === 'number') activeUser.anosServico = complementaryData.anosServico;
            if (complementaryData.regimeTrabalho) activeUser.regimeTrabalho = complementaryData.regimeTrabalho;
            if (complementaryData.classificacaoPedagogica) activeUser.classificacaoPedagogica = complementaryData.classificacaoPedagogica;
            if (complementaryData.numeroMecanograficoOuNif) activeUser.numeroMecanograficoOuNif = complementaryData.numeroMecanograficoOuNif;
            if (typeof complementaryData.documentosConferidosPresencialmente === 'boolean') {
              activeUser.documentosConferidosPresencialmente = complementaryData.documentosConferidosPresencialmente;
            }
          }
          localStorage.setItem('ucore_active_user', JSON.stringify(activeUser));
          activatedUser = activeUser;
        }
      } catch {}
    }

    // Push approval to Firestore cloud (also cleans any duplicate ghost 'pendente' docs for the same person)
    saveApplicationToFirestore(updatedApp).catch((e) => {
      console.warn('[authApprovalStorage] Falha ao atualizar homologação no Firestore:', e);
    });

    if (typeof window !== 'undefined') {
      if (isExpressApiAvailable()) {
        fetch('/api/network/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ application: updatedApp, user: activatedUser }),
          keepalive: true,
        }).catch(() => {});
      }
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }

    return { success: true, app: updatedApp, activatedUser, roleSyncPromises };
  } catch (e) {
    console.error('Erro ao aprovar candidatura:', e);
    return { success: false };
  }
}

/**
 * Async version of approveApplication that AWAITS persistence to BOTH Cloud Firestore
 * (applications, users, and role collections across ALL devices) and /api/network/applications
 * BEFORE returning, eliminating any race condition where an approved user still lands on 'pendente'.
 */
export async function approveApplicationAsync(
  applicationId: string,
  approverName: string = 'Administrador Sigre',
  complementaryData?: PendingApprovalComplementaryData
): Promise<{ success: boolean; app?: PendingApplication; activatedUser?: UserAccount }> {
  const res = approveApplication(applicationId, approverName, complementaryData);
  if (!res.success || !res.app) {
    return res;
  }

  const updatedApp = res.app;
  const activatedUser = res.activatedUser;
  const roleSyncPromises = res.roleSyncPromises || [];

  const postToServer = async () => {
    if (!isExpressApiAvailable()) return;
    await Promise.race([
      fetch('/api/network/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application: updatedApp, ...(activatedUser ? { user: activatedUser } : {}) }),
        keepalive: true,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000)),
    ]);
  };

  await Promise.allSettled([
    Promise.race([
      saveApplicationToFirestore(updatedApp).then((ok) => {
        if (ok) {
          pushedAppStatusToFirestore.set(updatedApp.id, `${updatedApp.status}:${updatedApp.approvedAt || ''}`);
        }
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 4500)),
    ]),
    ...(activatedUser
      ? [
          Promise.race([
            saveUserToFirestore(activatedUser),
            new Promise<void>((resolve) => setTimeout(resolve, 4500)),
          ]),
        ]
      : []),
    ...roleSyncPromises.map((p) =>
      Promise.race([p, new Promise<void>((resolve) => setTimeout(resolve, 4500))])
    ),
    ...(isExpressApiAvailable() ? [postToServer().catch(() => postToServer().catch(() => {}))] : []),
  ]);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sigre-data-synced'));
  }

  return res;
}

/**
 * Rejects a pending application with a reason
 */
export function rejectApplication(
  applicationId: string,
  reason: string,
  rejectorName: string = 'Responsável Sigre'
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

    const updatedList = deduplicateApplicationsList(
      applications.map((a) =>
        a.id === applicationId || (Boolean(target.userId) && a.userId === target.userId) ? updatedApp : a
      )
    );
    writeApplicationsWithoutDirtyEcho(updatedList);

    // Update active user in localStorage if matching
    const activeUserRaw = localStorage.getItem('ucore_active_user');
    if (activeUserRaw) {
      try {
        const activeUser: UserAccount = JSON.parse(activeUserRaw);
        if (activeUser.id === target.userId || (activeUser.email && target.email && activeUser.email.toLowerCase() === target.email.toLowerCase())) {
          activeUser.status = 'rejeitado';
          activeUser.rejectionReason = reason;
          localStorage.setItem('ucore_active_user', JSON.stringify(activeUser));
        }
      } catch {}
    }

    // Push rejection to Firestore cloud
    saveApplicationToFirestore(updatedApp).catch((e) => {
      console.warn('[authApprovalStorage] Falha ao atualizar rejeição no Firestore:', e);
    });

    if (typeof window !== 'undefined') {
      if (isExpressApiAvailable()) {
        fetch('/api/network/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ application: updatedApp }),
          keepalive: true,
        }).catch(() => {});
      }
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }

    return { success: true, app: updatedApp };
  } catch (e) {
    console.error('Erro ao rejeitar candidatura:', e);
    return { success: false };
  }
}

export async function rejectApplicationAsync(
  applicationId: string,
  reason: string,
  rejectorName: string = 'Responsável Sigre'
): Promise<{ success: boolean; app?: PendingApplication }> {
  const res = rejectApplication(applicationId, reason, rejectorName);
  if (!res.success || !res.app) {
    return res;
  }
  const updatedApp = res.app;
  await Promise.allSettled([
    Promise.race([
      saveApplicationToFirestore(updatedApp).then((ok) => {
        if (ok) {
          pushedAppStatusToFirestore.set(updatedApp.id, `${updatedApp.status}:${updatedApp.approvedAt || ''}`);
        }
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 4500)),
    ]),
    ...(isExpressApiAvailable()
      ? [
          fetch('/api/network/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ application: updatedApp }),
            keepalive: true,
          }).catch(() => {}),
        ]
      : []),
  ]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sigre-data-synced'));
  }
  return res;
}

/**
 * Checks the real-time approval status of a given user ID, email, or BI number.
 * Scans ALL matching application records and ALWAYS prioritizes 'aprovado' (or approvedAt)
 * over any stale 'pendente' duplicate so a validated user never gets trapped in waiting screen.
 */
export function checkUserApprovalStatus(
  userId: string,
  userEmail?: string,
  biNumber?: string
): { status: 'ativo' | 'pendente' | 'rejeitado'; app?: PendingApplication } {
  const applications = getPendingApplications();
  const normUid = (userId || '').trim().toLowerCase();
  const normEmail = (userEmail || '').trim().toLowerCase();
  const normBi = (biNumber || '').trim().toUpperCase();

  const matches = applications.filter((a) => {
    if (!a) return false;
    const aId = (a.id || '').trim().toLowerCase();
    const aUid = (a.userId || '').trim().toLowerCase();
    const aEmail = (a.email || '').trim().toLowerCase();
    const aBi = (a.biNumber || '').trim().toUpperCase();
    if (normUid && (aUid === normUid || aId === normUid)) return true;
    if (normEmail && !isGenericSchoolEmail(normEmail) && aEmail === normEmail) return true;
    if (normBi && normBi.length >= 5 && aBi === normBi) return true;
    return false;
  });

  if (matches.length > 0) {
    const approvedMatch = matches.find((m) => m.status === 'aprovado' || Boolean(m.approvedAt));
    if (approvedMatch) {
      return { status: 'ativo', app: approvedMatch };
    }
    const rejectedMatch = matches.find((m) => m.status === 'rejeitado');
    if (rejectedMatch) {
      return { status: 'rejeitado', app: rejectedMatch };
    }
    return { status: 'pendente', app: matches[0] };
  }
  return { status: 'ativo' };
}

/**
 * Returns a map of occupied cargos in the Municipal Directorate (DME).
 * Because the Master Admin account (dmedoquessua@gmail.com) already exists,
 * 'diretor_municipal' and 'admin_sistema' are permanently occupied, and any other
 * DME cargo ('chefe_reparticao', 'inspetor_escolar', 'tecnico_estatistica', 'tecnico_recursos_humanos')
 * that has an active/pending registration or DME staff entry cannot be registered again.
 */
export function getOccupiedDmeCargos(): Record<
  string,
  { occupied: boolean; holderName: string; holderEmail: string; status: 'ativo' | 'pendente' }
> {
  const occupiedMap: Record<
    string,
    { occupied: boolean; holderName: string; holderEmail: string; status: 'ativo' | 'pendente' }
  > = {
    diretor_municipal: {
      occupied: true,
      holderName: 'Director Municipal da Educação (Conta Titular DME)',
      holderEmail: OFFICIAL_DME_ADMIN_EMAIL,
      status: 'ativo',
    },
    admin_sistema: {
      occupied: true,
      holderName: 'Administração Central do Sistema Sigre',
      holderEmail: OFFICIAL_DME_ADMIN_EMAIL,
      status: 'ativo',
    },
  };

  try {
    // 1. Check applications (pending or approved) for administration scope
    const apps = getPendingApplications();
    apps.forEach((app) => {
      if (app.status === 'rejeitado') return;
      if (app.scope === 'administracao' || app.type === 'membro_dme' || app.adminRole) {
        let roleKey = app.adminRole;
        if (!roleKey && app.roleRequested) {
          const reqLow = app.roleRequested.toLowerCase();
          if (reqLow.includes('chefe') || reqLow.includes('repartição') || reqLow.includes('reparticao')) {
            roleKey = 'chefe_reparticao';
          } else if (reqLow.includes('inspetor') || reqLow.includes('inspector')) {
            roleKey = 'inspetor_escolar';
          } else if (reqLow.includes('estatística') || reqLow.includes('estatistica') || reqLow.includes('planeamento')) {
            roleKey = 'tecnico_estatistica';
          } else if (reqLow.includes('recursos humanos') || reqLow.includes('secretaria')) {
            roleKey = 'tecnico_recursos_humanos';
          }
        }
        if (roleKey && !occupiedMap[roleKey]) {
          occupiedMap[roleKey] = {
            occupied: true,
            holderName: app.fullName,
            holderEmail: app.email,
            status: app.status === 'aprovado' ? 'ativo' : 'pendente',
          };
        }
      }
    });

    // 2. Check DME staff list in localStorage
    const rawDme = localStorage.getItem('ucore_dme_staff_list');
    if (rawDme) {
      const dmeList = JSON.parse(rawDme);
      if (Array.isArray(dmeList)) {
        dmeList.forEach((member: any) => {
          const roleKey = member?.role;
          if (roleKey && !occupiedMap[roleKey]) {
            occupiedMap[roleKey] = {
              occupied: true,
              holderName: member.name || 'Funcionário DME',
              holderEmail: member.email || '',
              status: 'ativo',
            };
          }
        });
      }
    }
  } catch {
    // ignore
  }

  return occupiedMap;
}

/**
 * Checks whether an email or BI number is already registered in the system,
 * preventing any user from overwriting, hijacking, or duplicating another person's account.
 */
export function checkDuplicateRegistration(
  email: string,
  biNumber?: string,
  excludeId?: string
): { duplicate: boolean; reason?: string } {
  const normEmail = (email || '').trim().toLowerCase();
  const normBi = (biNumber || '').trim().toUpperCase();

  if (normEmail === OFFICIAL_DME_ADMIN_EMAIL || normEmail === 'beliziodos20@gmail.com') {
    return {
      duplicate: true,
      reason:
        'Este endereço de e-mail pertence à conta titular da Direcção Municipal da Educação e já se encontra registado. Ninguém pode criar uma nova conta com o e-mail de outro utilizador.',
    };
  }

  // Check pending and approved applications
  const apps = getPendingApplications();
  for (const app of apps) {
    if (app.status === 'rejeitado') continue;
    if (excludeId && (app.id === excludeId || app.userId === excludeId)) continue;
    if (normEmail && app.email && app.email.trim().toLowerCase() === normEmail) {
      return {
        duplicate: true,
        reason: `O e-mail "${email.trim()}" já possui uma conta registada (${app.fullName} • ${app.roleRequested || 'Utilizador'}). Por segurança, não é permitido registar nem aceder à conta de outro utilizador.`,
      };
    }
    if (normBi && normBi.length >= 5 && app.biNumber && app.biNumber.trim().toUpperCase() === normBi) {
      return {
        duplicate: true,
        reason: `O Bilhete de Identidade nº "${biNumber?.trim().toUpperCase()}" já se encontra vinculado à conta de ${app.fullName} (${app.roleRequested || 'Utilizador'}). Não é permitido ter duas contas ou registos com o mesmo número do BI.`,
      };
    }
  }

  // Check DME staff list
  try {
    const rawDme = localStorage.getItem('ucore_dme_staff_list');
    if (rawDme) {
      const dmeList = JSON.parse(rawDme);
      if (Array.isArray(dmeList)) {
        for (const m of dmeList) {
          if (!m) continue;
          if (excludeId && m.id === excludeId) continue;
          if (normEmail && m.email && m.email.trim().toLowerCase() === normEmail) {
            return {
              duplicate: true,
              reason: `Este e-mail já está registado no quadro da Direcção Municipal (${m.name} • ${m.cargoTitle}).`,
            };
          }
          if (normBi && normBi.length >= 5 && m.biNumber && m.biNumber.trim().toUpperCase() === normBi) {
            return {
              duplicate: true,
              reason: `O Bilhete de Identidade nº "${biNumber?.trim().toUpperCase()}" já pertence ao registo de ${m.name} (${m.cargoTitle || 'Direcção Municipal'}). Não pode haver duas contas no mesmo nº do BI.`,
            };
          }
        }
      }
    }
  } catch {}

  // Check registered teachers across all teacher stores by BI number
  if (normBi && normBi.length >= 5) {
    for (const teacherKey of ['ucore_registered_teachers_v2', 'ucore_admin_teachers', 'ucore_director_teachers_v1']) {
      try {
        const rawT = localStorage.getItem(teacherKey);
        if (rawT) {
          const listT = JSON.parse(rawT);
          if (Array.isArray(listT)) {
            for (const t of listT) {
              if (!t) continue;
              if (excludeId && t.id === excludeId) continue;
              const tBi = (t.biNif || t.bi || t.registrationData?.biNif || '').trim().toUpperCase();
              const tEmail = (t.email || t.registrationData?.email || '').trim().toLowerCase();
              // Allow if the same user (same email) is claiming their pre-registered teacher record
              if (tBi && tBi === normBi && (!normEmail || !tEmail || tEmail !== normEmail)) {
                const tName = t.nomeCompleto || t.name || 'Docente';
                const tSchool = t.nomeEscola || t.schoolName || 'Quadro Docente';
                return {
                  duplicate: true,
                  reason: `O Bilhete de Identidade nº "${biNumber?.trim().toUpperCase()}" já está registado no sistema para ${tName} (${tSchool}). Não pode haver duas contas com o mesmo nº do BI.`,
                };
              }
            }
          }
        }
      } catch {}
    }

    // Check registered directors by BI number
    for (const dirKey of ['ucore_registered_directors_v2', 'ucore_admin_directors']) {
      try {
        const rawD = localStorage.getItem(dirKey);
        if (rawD) {
          const listD = JSON.parse(rawD);
          if (Array.isArray(listD)) {
            for (const d of listD) {
              if (!d) continue;
              if (excludeId && d.id === excludeId) continue;
              const dBi = (d.biNif || d.registrationData?.biNif || '').trim().toUpperCase();
              const dEmail = (d.emailPessoal || d.emailInstitucional || d.email || '').trim().toLowerCase();
              if (dBi && dBi === normBi && (!normEmail || !dEmail || dEmail !== normEmail)) {
                const dName = d.nomeCompleto || d.name || 'Director(a)';
                return {
                  duplicate: true,
                  reason: `O Bilhete de Identidade nº "${biNumber?.trim().toUpperCase()}" já pertence ao registo de ${dName} (Direcção Escolar). Não pode haver duas contas com o mesmo nº do BI.`,
                };
              }
            }
          }
        }
      } catch {}
    }
  }

  return { duplicate: false };
}

/**
 * Looks up an existing registered account by email across all official stores
 * so that login strictly authenticates existing users with their true role and cargo.
 */
export function findRegisteredAccountByEmail(email: string): {
  exists: boolean;
  wasDeletedByAdmin?: boolean;
  isMasterAdmin?: boolean;
  expectedVerifier?: string;
  fullName?: string;
  app?: PendingApplication;
  dmeStaff?: any;
  director?: any;
  teacher?: any;
  registeredUser?: UserAccount;
} {
  const normEmail = (email || '').trim().toLowerCase();
  if (!normEmail) return { exists: false };

  if (normEmail === OFFICIAL_DME_ADMIN_EMAIL || normEmail === 'beliziodos20@gmail.com') {
    return {
      exists: true,
      isMasterAdmin: true,
      fullName: 'Dr. Belízio Miguel dos Santos António',
    };
  }

  // Strictly block any account whose email was deleted by the Admin/Director
  if (isAccountDeleted(normEmail)) {
    return { exists: false, wasDeletedByAdmin: true };
  }

  // 1. Check applications (pending, approved, or rejected)
  const apps = getPendingApplications();
  const matchedApp = apps.find((a) => a.email && a.email.trim().toLowerCase() === normEmail);
  if (matchedApp) {
    if (isAccountDeleted(matchedApp.id, matchedApp.userId, matchedApp.email, matchedApp.biNumber)) {
      return { exists: false, wasDeletedByAdmin: true };
    }
    return {
      exists: true,
      app: matchedApp,
      expectedVerifier: matchedApp.passwordVerifier,
      fullName: matchedApp.fullName,
    };
  }

  // 2. Check DME Staff list
  try {
    const rawDme = localStorage.getItem('ucore_dme_staff_list');
    if (rawDme) {
      const dmeList = JSON.parse(rawDme);
      if (Array.isArray(dmeList)) {
        const matchedDme = dmeList.find(
          (m: any) => m && m.email && m.email.trim().toLowerCase() === normEmail
        );
        if (matchedDme) {
          if (isAccountDeleted(matchedDme.id, matchedDme.email, matchedDme.biNumber)) {
            return { exists: false, wasDeletedByAdmin: true };
          }
          return { exists: true, dmeStaff: matchedDme };
        }
      }
    }
  } catch {}

  // 3. Check registered school directors
  for (const dirKey of ['ucore_admin_directors', 'ucore_registered_directors_v2']) {
    try {
      const rawDirs = localStorage.getItem(dirKey);
      if (rawDirs) {
        const parsedDirs = JSON.parse(rawDirs);
        if (Array.isArray(parsedDirs)) {
          const matchedDir = parsedDirs.find(
            (d: any) =>
              d &&
              ((d.email && d.email.trim().toLowerCase() === normEmail) ||
                (d.emailPessoal && d.emailPessoal.trim().toLowerCase() === normEmail))
          );
          if (matchedDir) {
            if (isAccountDeleted(matchedDir.id, matchedDir.email, matchedDir.emailPessoal, matchedDir.biNif)) {
              return { exists: false, wasDeletedByAdmin: true };
            }
            return { exists: true, director: matchedDir };
          }
        }
      }
    } catch {}
  }

  // 4. Check registered teachers
  for (const tKey of ['ucore_admin_teachers', 'ucore_director_teachers_v1', 'ucore_registered_teachers_v2']) {
    try {
      const rawTeachers = localStorage.getItem(tKey);
      if (rawTeachers) {
        const parsedTeachers = JSON.parse(rawTeachers);
        if (Array.isArray(parsedTeachers)) {
          const matchedTeacher = parsedTeachers.find(
            (t: any) => t && t.email && t.email.trim().toLowerCase() === normEmail
          );
          if (matchedTeacher) {
            if (isAccountDeleted(matchedTeacher.id, matchedTeacher.email, matchedTeacher.biNif || matchedTeacher.registrationData?.biNif)) {
              return { exists: false, wasDeletedByAdmin: true };
            }
            return { exists: true, teacher: matchedTeacher };
          }
        }
      }
    } catch {}
  }

  // 5. Check ucore_registered_users
  try {
    const rawUsers = localStorage.getItem(STORAGE_KEY_USERS);
    if (rawUsers) {
      const usersList = JSON.parse(rawUsers);
      if (Array.isArray(usersList)) {
        const matchedUser = usersList.find(
          (u: any) => u && u.email && u.email.trim().toLowerCase() === normEmail
        );
        if (matchedUser) {
          if (isAccountDeleted(matchedUser.id, matchedUser.email, matchedUser.biNumber)) {
            return { exists: false, wasDeletedByAdmin: true };
          }
          return {
            exists: true,
            registeredUser: matchedUser,
            expectedVerifier: matchedUser.passwordVerifier,
            fullName: `${matchedUser.firstName || ''} ${matchedUser.lastName || ''}`.trim(),
          };
        }
      }
    }
  } catch {}

  return { exists: false };
}

/**
 * Resolves the active Director's name for a given school from approved applications,
 * registered director dossiers, or the school record itself (e.g. "Carl").
 */
export function resolveSchoolDirectorName(
  school?: AdminSchool | null,
  fallbackSchoolName?: string
): string {
  const rawTarget = school?.name || fallbackSchoolName || '';
  const targetName = normalizeSchoolText(rawTarget);
  const cleanTargetNoParens = normalizeSchoolText(rawTarget.replace(/\([^)]*\)/g, ''));

  const isValidDirectorName = (name?: string | null): name is string => {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    if (!trimmed) return false;
    const low = trimmed.toLowerCase();
    return (
      !low.includes('a designar') &&
      !low.includes('não informado') &&
      !low.includes('nao informado') &&
      low !== 'direção geral da escola' &&
      low !== 'direcao geral da escola'
    );
  };

  const matchesTargetSchool = (candidateName?: string, candidateId?: string) => {
    if (schoolsMatch(candidateName, rawTarget, candidateId, school?.id)) return true;
    const normCand = normalizeSchoolText(candidateName);
    if (!normCand || !cleanTargetNoParens) return false;
    return normCand === cleanTargetNoParens;
  };

  if (targetName) {
    // 1. Check approved director applications for this school
    try {
      const apps = getPendingApplications();
      const approvedDir = apps.find(
        (a) =>
          a.type === 'diretor' &&
          a.status === 'aprovado' &&
          a.schoolName &&
          matchesTargetSchool(a.schoolName, a.schoolId) &&
          isValidDirectorName(a.fullName)
      );
      if (approvedDir?.fullName) {
        return approvedDir.fullName.trim();
      }
    } catch {
      // ignore
    }

    // 2. Check registered director dossiers in localStorage
    for (const dirKey of ['ucore_admin_directors', 'sigre_admin_directors', 'ucore_registered_directors_v2']) {
      try {
        const rawDirs = localStorage.getItem(dirKey);
        if (rawDirs) {
          const parsedDirs = JSON.parse(rawDirs);
          if (Array.isArray(parsedDirs)) {
            const matchedDir = parsedDirs.find((d: any) => {
              const dSchool = d?.schoolName || d?.nomeEscola || d?.registrationData?.nomeEscola || '';
              return matchesTargetSchool(dSchool, d?.schoolId);
            });
            const dName = matchedDir?.name || matchedDir?.nomeCompleto || matchedDir?.registrationData?.nomeCompleto;
            if (isValidDirectorName(dName)) {
              return dName.trim();
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 3. Check school object passed in
    const fromSchoolObj =
      school?.directorName ||
      school?.registrationData?.director?.nome;
    if (isValidDirectorName(fromSchoolObj)) {
      return fromSchoolObj.trim();
    }

    // 4. Check stored schools in localStorage
    for (const scKey of ['ucore_admin_schools', 'ucore_registered_schools_v1']) {
      try {
        const rawSchools = localStorage.getItem(scKey);
        if (rawSchools) {
          const parsedSchools = JSON.parse(rawSchools);
          if (Array.isArray(parsedSchools)) {
            const matchedSc = parsedSchools.find((s: any) => {
              const sName = s?.name || s?.nomeOficial || '';
              return matchesTargetSchool(sName, s?.id);
            });
            const sDir = matchedSc?.directorName || matchedSc?.registrationData?.director?.nome || matchedSc?.director?.nome;
            if (isValidDirectorName(sDir)) {
              return sDir.trim();
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 4b. Check detailed school registrations map (sigre_school_registrations)
    try {
      const rawRegs = localStorage.getItem('sigre_school_registrations');
      if (rawRegs) {
        const regsObj = JSON.parse(rawRegs);
        if (regsObj && typeof regsObj === 'object') {
          const entries = Array.isArray(regsObj) ? regsObj : Object.values(regsObj);
          const matchedReg: any = entries.find((r: any) =>
            matchesTargetSchool(r?.nomeOficial || r?.name, r?.id)
          );
          const regDirName = matchedReg?.director?.nome;
          if (isValidDirectorName(regDirName)) {
            return regDirName.trim();
          }
        }
      }
    } catch {
      // ignore
    }

    // 5. Check registered users & active user session for a Diretor Geral of this school
    try {
      const rawUsers = localStorage.getItem(STORAGE_KEY_USERS);
      if (rawUsers) {
        const usersList = JSON.parse(rawUsers);
        if (Array.isArray(usersList)) {
          const matchedUser = usersList.find(
            (u: any) =>
              u &&
              u.role === 'diretor' &&
              (!u.schoolRole || u.schoolRole === 'diretor_geral') &&
              matchesTargetSchool(u.schoolName, u.schoolId)
          );
          const uFull = matchedUser?.fullName || `${matchedUser?.firstName || ''} ${matchedUser?.lastName || ''}`.trim();
          if (isValidDirectorName(uFull)) {
            return uFull.trim();
          }
        }
      }
      const rawActive = localStorage.getItem('ucore_active_user');
      if (rawActive) {
        const activeUser = JSON.parse(rawActive);
        if (
          activeUser &&
          activeUser.role === 'diretor' &&
          (!activeUser.schoolRole || activeUser.schoolRole === 'diretor_geral') &&
          matchesTargetSchool(activeUser.schoolName, activeUser.schoolId)
        ) {
          const aFull = activeUser.fullName || `${activeUser.firstName || ''} ${activeUser.lastName || ''}`.trim();
          if (isValidDirectorName(aFull)) {
            return aFull.trim();
          }
        }
      }
    } catch {
      // ignore
    }
  }

  if (isValidDirectorName(school?.directorName)) {
    return school!.directorName!.trim();
  }

  return 'Direção Geral da Escola';
}

/**
 * Resolves the active Director's email for a given school from approved applications,
 * registered director dossiers, or the school record itself.
 */
export function resolveSchoolDirectorEmail(
  school?: AdminSchool | null,
  fallbackSchoolName?: string,
  fallbackSchoolId?: string
): string | undefined {
  const targetName = school?.name || fallbackSchoolName || '';
  const targetId = school?.id || fallbackSchoolId || '';

  if (targetName || targetId) {
    // 1. Check approved director applications for this school
    try {
      const apps = getPendingApplications();
      const approvedDir = apps.find(
        (a) =>
          a.type === 'diretor' &&
          a.status === 'aprovado' &&
          schoolsMatch(a.schoolName, targetName, a.schoolId, targetId)
      );
      if (approvedDir?.email && approvedDir.email.trim()) {
        return approvedDir.email.trim();
      }
    } catch {
      // ignore
    }

    // 2. Check registered director dossiers in localStorage
    for (const dirKey of ['ucore_admin_directors', 'sigre_admin_directors', 'ucore_registered_directors_v2']) {
      try {
        const rawDirs = localStorage.getItem(dirKey);
        if (rawDirs) {
          const parsedDirs = JSON.parse(rawDirs);
          if (Array.isArray(parsedDirs)) {
            const matchedDir = parsedDirs.find((d: any) => {
              const dSchool = d.schoolName || d.nomeEscola || d.registrationData?.nomeEscola || '';
              return schoolsMatch(dSchool, targetName, d.schoolId, targetId);
            });
            const dEmail =
              matchedDir?.email ||
              matchedDir?.emailPessoal ||
              matchedDir?.emailInstitucional ||
              matchedDir?.registrationData?.emailPessoal;
            if (dEmail && typeof dEmail === 'string' && dEmail.trim()) {
              return dEmail.trim();
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 3. Check school object passed in
    const fromSchoolObj =
      (school as any)?.directorEmail ||
      school?.registrationData?.director?.email;
    if (fromSchoolObj && typeof fromSchoolObj === 'string' && fromSchoolObj.trim()) {
      return fromSchoolObj.trim();
    }

    // 4. Check stored schools in localStorage
    for (const scKey of ['ucore_admin_schools', 'ucore_registered_schools_v1']) {
      try {
        const rawSchools = localStorage.getItem(scKey);
        if (rawSchools) {
          const parsedSchools = JSON.parse(rawSchools);
          if (Array.isArray(parsedSchools)) {
            const matchedSc = parsedSchools.find((s: any) => {
              const sName = s.name || s.nomeOficial || '';
              return schoolsMatch(sName, targetName, s.id, targetId);
            });
            const sEmail =
              matchedSc?.directorEmail ||
              matchedSc?.registrationData?.director?.email ||
              matchedSc?.director?.email;
            if (sEmail && typeof sEmail === 'string' && sEmail.trim()) {
              return sEmail.trim();
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }

  return undefined;
}

/**
 * Helper to get the director's name for a given school name
 */
export function getDirectorForSchool(schoolName: string): string {
  return resolveSchoolDirectorName(null, schoolName);
}

/**
 * Permanently deletes a single application (and rolls back linked records if needed)
 */
export async function deleteApplication(applicationId: string): Promise<boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    const list: PendingApplication[] = raw ? JSON.parse(raw) : [];
    const target = list.find((a) => a.id === applicationId || a.userId === applicationId);

    // Permanently revoke account credentials, password, user record, and active session
    purgeDeletedAccountCredentials({
      id: applicationId,
      userId: target?.userId,
      email: target?.email,
      biNumber: target?.biNumber,
    });

    const targetEmailNorm = (target?.email || '').trim().toLowerCase();
    const targetBiNorm = (target?.biNumber || '').trim().toUpperCase();

    const remaining = list.filter((a) => {
      if (a.id === applicationId || a.userId === applicationId) return false;
      if (target?.userId && (a.id === target.userId || a.userId === target.userId)) return false;
      if (targetEmailNorm && !isGenericSchoolEmail(targetEmailNorm) && (a.email || '').trim().toLowerCase() === targetEmailNorm) return false;
      return true;
    });
    writeApplicationsWithoutDirtyEcho(remaining);

    // Also remove from local director, teacher, staff, and DME staff rosters if it was approved
    ['ucore_admin_teachers', 'ucore_director_teachers_v1', 'ucore_registered_teachers_v2'].forEach((k) => {
      try {
        const r = localStorage.getItem(k);
        if (r) {
          const arr = JSON.parse(r);
          if (Array.isArray(arr)) {
            const f = arr.filter((t: any) => {
              if (!t) return false;
              if (t.id === applicationId || (target?.userId && t.id === target.userId) || (target?.id && t.id === target.id)) return false;
              if (targetEmailNorm && !isGenericSchoolEmail(targetEmailNorm) && (t.email || '').trim().toLowerCase() === targetEmailNorm) return false;
              if (targetBiNorm && targetBiNorm.length >= 5 && (normalizeBi(t.biNif || t.registrationData?.biNif) === normalizeBi(targetBiNorm))) return false;
              return true;
            });
            localStorage.setItem(k, JSON.stringify(f));
          }
        }
      } catch {}
    });

    ['ucore_admin_directors', 'sigre_admin_directors', 'ucore_registered_directors_v2'].forEach((k) => {
      try {
        const r = localStorage.getItem(k);
        if (r) {
          const arr = JSON.parse(r);
          if (Array.isArray(arr)) {
            const f = arr.filter((d: any) => {
              if (!d) return false;
              if (d.id === applicationId || (target?.userId && d.id === target.userId) || (target?.id && d.id === target.id)) return false;
              if (targetEmailNorm && !isGenericSchoolEmail(targetEmailNorm) && ((d.email || '').trim().toLowerCase() === targetEmailNorm || (d.emailPessoal || '').trim().toLowerCase() === targetEmailNorm)) return false;
              if (targetBiNorm && targetBiNorm.length >= 5 && (normalizeBi(d.biNif || d.registrationData?.biNif) === normalizeBi(targetBiNorm))) return false;
              return true;
            });
            localStorage.setItem(k, JSON.stringify(f));
          }
        }
      } catch {}
    });

    try {
      const rStaff = localStorage.getItem('ucore_registered_staff_v1');
      if (rStaff) {
        const arrStaff = JSON.parse(rStaff);
        if (Array.isArray(arrStaff)) {
          const fStaff = arrStaff.filter((s: any) => {
            if (!s) return false;
            if (s.id === applicationId || (target?.userId && s.id === target.userId) || (target?.id && s.id === target.id)) return false;
            if (targetEmailNorm && !isGenericSchoolEmail(targetEmailNorm) && (s.email || '').trim().toLowerCase() === targetEmailNorm) return false;
            if (targetBiNorm && targetBiNorm.length >= 5 && normalizeBi(s.biNumber || s.bi) === normalizeBi(targetBiNorm)) return false;
            return true;
          });
          localStorage.setItem('ucore_registered_staff_v1', JSON.stringify(fStaff));
        }
      }
    } catch {}

    try {
      const r = localStorage.getItem('ucore_dme_staff_list');
      if (r) {
        const arr = JSON.parse(r);
        if (Array.isArray(arr)) {
          const f = arr.filter(
            (m: any) =>
              m &&
              m.id !== applicationId &&
              (!target?.userId || m.id !== target.userId) &&
              (!target?.id || m.id !== target.id) &&
              (!targetEmailNorm || (m.email || '').trim().toLowerCase() !== targetEmailNorm)
          );
          localStorage.setItem('ucore_dme_staff_list', JSON.stringify(f));
        }
      }
    } catch {}

    // Delete from Firestore cloud
    deleteApplicationFromFirestore(applicationId).catch(() => {});
    if (target?.userId && target.userId !== applicationId) {
      deleteApplicationFromFirestore(target.userId).catch(() => {});
    }
    if (target?.type === 'professor') {
      deleteTeacherFromFirestore(target.userId || target.id).catch(() => {});
    }
    if (target?.type === 'diretor') {
      deleteDirectorFromFirestore(target.userId || target.id).catch(() => {});
    }
    if (target?.type === 'funcionario') {
      deleteStaffFromFirestore(target.userId || target.id).catch(() => {});
    }
    if (target?.type === 'membro_dme' || target?.scope === 'administracao') {
      deleteDmeStaffFromFirestore(target.userId || target.id).catch(() => {});
    }

    // Call server DELETE when Express API is available
    if (isExpressApiAvailable()) {
      try {
        await fetch(`/api/network/applications/${encodeURIComponent(applicationId)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.warn('Falha ao comunicar exclusão ao servidor:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }

    return true;
  } catch (err) {
    console.error('Erro ao eliminar candidatura:', err);
    return false;
  }
}

/**
 * Permanently deletes all already homologated (approved) data across all layers:
 * applications, homologated directors, homologated teachers, DME staff, and efectividade records.
 */
export async function clearAllHomologatedData(): Promise<{ success: boolean; count: number; message?: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    const list: PendingApplication[] = raw ? JSON.parse(raw) : [];

    // Collect IDs of approved applications to mark them as permanently deleted and revoke credentials
    const approved = list.filter((a) => a.status === 'aprovado' || a.approvedAt);
    approved.forEach((a) => {
      purgeDeletedAccountCredentials({
        id: a.id,
        userId: a.userId,
        email: a.email,
        biNumber: a.biNumber,
      });
    });

    // 1. Keep only pending or rejected applications locally
    const remaining = list.filter((a) => a.status !== 'aprovado' && !a.approvedAt);
    writeApplicationsWithoutDirtyEcho(remaining);

    // 2. Clear homologated teachers from local rosters
    ['ucore_admin_teachers', 'ucore_director_teachers_v1', 'ucore_registered_teachers_v2'].forEach((k) => {
      try {
        const r = localStorage.getItem(k);
        if (r) {
          const arr = JSON.parse(r);
          if (Array.isArray(arr)) {
            const f = arr.filter((t: any) => !t.approvedAt && !approved.some((a) => a.userId === t.id || a.email === t.email));
            localStorage.setItem(k, JSON.stringify(f));
          }
        }
      } catch {}
    });

    // 3. Clear homologated directors from local storage
    ['ucore_admin_directors', 'sigre_admin_directors', 'ucore_registered_directors_v2'].forEach((k) => {
      try {
        const r = localStorage.getItem(k);
        if (r) {
          const arr = JSON.parse(r);
          if (Array.isArray(arr)) {
            const f = arr.filter((d: any) => {
              if (d.approvedAt) return false;
              if (d.id && approved.some((a) => a.userId === d.id || a.id === d.id || a.email === d.email || a.email === d.emailPessoal)) return false;
              return true;
            });
            localStorage.setItem(k, JSON.stringify(f));
          }
        }
      } catch {}
    });

    // 3b. Clear homologated DME staff from local storage
    try {
      const rDme = localStorage.getItem('ucore_dme_staff_list');
      if (rDme) {
        const arrDme = JSON.parse(rDme);
        if (Array.isArray(arrDme)) {
          const fDme = arrDme.filter(
            (m: any) =>
              !m.approvedAt &&
              !approved.some((a) => a.userId === m.id || a.id === m.id || a.email === m.email)
          );
          localStorage.setItem('ucore_dme_staff_list', JSON.stringify(fDme));
        }
      }
    } catch {}

    // 5. Clear approved records from Firestore cloud database
    try {
      await clearApprovedApplicationsFromFirestore();
    } catch (e) {
      console.warn('[authApprovalStorage] Falha ao limpar homologados no Firestore:', e);
    }

    // Call server to clear disk store when Express API is active
    let serverCount = approved.length;
    if (isExpressApiAvailable()) {
      try {
        const res = await fetch('/api/network/clear-homologated', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (checkExpressApiResponse(res) && res.ok) {
          const data = await res.json();
          if (data.removed?.total) {
            serverCount = data.removed.total;
          }
        }
      } catch (err) {
        console.warn('Falha na chamada ao servidor para limpar homologados:', err);
      }
    }

    // 6. Broadcast event so UI everywhere updates instantly
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
      window.dispatchEvent(new CustomEvent('sigre-homologados-cleared', { detail: { count: serverCount } }));
    }

    return {
      success: true,
      count: serverCount,
      message: 'Todos os registos homologados foram eliminados com sucesso do sistema.',
    };
  } catch (err) {
    console.error('Erro ao limpar dados homologados:', err);
    return { success: false, count: 0, message: 'Erro ao limpar dados homologados.' };
  }
}

export interface UserProfileSyncUpdates {
  name?: string;
  email?: string;
  phone?: string;
  roleTitle?: string;
  biNumber?: string;
  agentNumber?: string;
  schoolName?: string;
  avatar?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  turma?: string;
  classe?: string;
  sala?: string;
  periodo?: string;
  subject?: string;
}

/**
 * Propagates user profile/settings changes (name, phone, email, BI, agent number, role, school, etc.)
 * across active user session, registered users, pending/approved applications, DME staff,
 * director rosters, teacher rosters, school records, Cloud Firestore, and backend server APIs.
 */
export function syncUpdatedUserProfileAcrossSystem(
  currentUser: UserAccount | null | undefined,
  updates: UserProfileSyncUpdates
): Partial<UserAccount> {
  const nowIso = new Date().toISOString();
  const oldEmail = (currentUser?.email || '').trim().toLowerCase();
  const newEmail = (updates.email || currentUser?.email || '').trim();
  const normNewEmail = newEmail.toLowerCase();
  const targetUserId = currentUser?.id || '';

  const fullName = (
    updates.name ||
    (currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : '')
  ).trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || currentUser?.firstName || 'Utilizador';
  const lastName = nameParts.slice(1).join(' ') || currentUser?.lastName || '';

  const updatedUserFields: Partial<UserAccount> = {
    ...(fullName ? { firstName, lastName } : {}),
    ...(newEmail ? { email: newEmail } : {}),
    ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
    ...(updates.biNumber !== undefined ? { biNumber: updates.biNumber } : {}),
    ...(updates.agentNumber !== undefined ? { numeroMecanograficoOuNif: updates.agentNumber } : {}),
    ...(updates.roleTitle !== undefined ? { cargoTitle: updates.roleTitle } : {}),
    ...(updates.schoolName !== undefined ? { schoolName: updates.schoolName } : {}),
    ...(updates.avatar !== undefined ? { avatar: updates.avatar } : {}),
    ...(updates.subject !== undefined ? { disciplina: updates.subject } : {}),
    ...(updates.classe !== undefined ? { grauClasse: updates.classe } : {}),
  };

  // 1. If email changed, migrate stored password and recompute passwordVerifier
  let newVerifier: string | undefined;
  try {
    const rawPasswords = localStorage.getItem('ucore_user_passwords');
    if (rawPasswords) {
      const pwMap = JSON.parse(rawPasswords);
      const existingPw = pwMap[oldEmail] || pwMap[normNewEmail];
      if (existingPw && typeof existingPw === 'string') {
        if (oldEmail && oldEmail !== normNewEmail) {
          delete pwMap[oldEmail];
        }
        pwMap[normNewEmail] = existingPw;
        localStorage.setItem('ucore_user_passwords', JSON.stringify(pwMap));
        if (!existingPw.startsWith('v2_')) {
          newVerifier = encodePasswordVerifier(normNewEmail, existingPw);
        }
      }
    }
  } catch {}

  const matchesRecord = (idCandidate?: string, emailCandidate?: string) => {
    const normId = (idCandidate || '').trim();
    const normEm = (emailCandidate || '').trim().toLowerCase();
    if (targetUserId && normId && normId === targetUserId) return true;
    if (oldEmail && normEm && normEm === oldEmail) return true;
    if (normNewEmail && normEm && normEm === normNewEmail) return true;
    return false;
  };

  // 2. Update ucore_active_user
  try {
    const rawActive = localStorage.getItem('ucore_active_user');
    const baseActive = rawActive ? JSON.parse(rawActive) : currentUser || {};
    if (baseActive && (baseActive.id || baseActive.email || currentUser)) {
      const mergedActive = {
        ...currentUser,
        ...baseActive,
        ...updatedUserFields,
        ...(newVerifier ? { passwordVerifier: newVerifier } : {}),
        ...(updates.birthDate !== undefined ? { birthDate: updates.birthDate } : {}),
        ...(updates.gender !== undefined ? { gender: updates.gender } : {}),
        ...(updates.address !== undefined ? { address: updates.address } : {}),
        ...(updates.emergencyContact !== undefined ? { emergencyContact: updates.emergencyContact } : {}),
        ...(updates.emergencyPhone !== undefined ? { emergencyPhone: updates.emergencyPhone } : {}),
        updatedAt: nowIso,
      };
      localStorage.setItem('ucore_active_user', JSON.stringify(mergedActive));
      if (mergedActive.id) {
        saveUserToFirestore(mergedActive).catch(() => {});
      }
    }
  } catch {}

  // 3. Update ucore_registered_users
  try {
    const rawUsers = localStorage.getItem(STORAGE_KEY_USERS);
    const users: any[] = rawUsers ? JSON.parse(rawUsers) : [];
    if (Array.isArray(users)) {
      let foundUser = false;
      const nextUsers = users.map((u) => {
        if (u && matchesRecord(u.id, u.email)) {
          foundUser = true;
          const nextU = {
            ...u,
            ...updatedUserFields,
            ...(newVerifier ? { passwordVerifier: newVerifier } : {}),
            ...(updates.birthDate !== undefined ? { birthDate: updates.birthDate } : {}),
            ...(updates.gender !== undefined ? { gender: updates.gender } : {}),
            ...(updates.address !== undefined ? { address: updates.address } : {}),
            updatedAt: nowIso,
          };
          if (nextU.id) {
            saveUserToFirestore(nextU).catch(() => {});
          }
          return nextU;
        }
        return u;
      });
      if (!foundUser && currentUser?.id) {
        const addedU = {
          ...currentUser,
          ...updatedUserFields,
          updatedAt: nowIso,
        };
        nextUsers.push(addedU);
        saveUserToFirestore(addedU as UserAccount).catch(() => {});
      }
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(nextUsers));
    }
  } catch {}

  // 4. Update ucore_pending_applications
  try {
    const rawApps = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    if (rawApps) {
      const apps: PendingApplication[] = JSON.parse(rawApps);
      if (Array.isArray(apps)) {
        let updatedAnyApp = false;
        const nextApps = apps.map((app) => {
          if (app && (matchesRecord(app.id, app.email) || matchesRecord(app.userId, app.email))) {
            updatedAnyApp = true;
            const nextApp: PendingApplication = {
              ...app,
              ...(fullName ? { fullName } : {}),
              ...(newEmail ? { email: newEmail } : {}),
              ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
              ...(updates.biNumber !== undefined ? { biNumber: updates.biNumber } : {}),
              ...(updates.agentNumber !== undefined
                ? { numeroMecanograficoOuNif: updates.agentNumber }
                : {}),
              ...(updates.roleTitle !== undefined ? { roleRequested: updates.roleTitle } : {}),
              ...(updates.schoolName !== undefined ? { schoolName: updates.schoolName } : {}),
              ...(updates.subject !== undefined ? { disciplina: updates.subject } : {}),
              ...(updates.classe !== undefined ? { grauClasse: updates.classe } : {}),
              ...(newVerifier ? { passwordVerifier: newVerifier } : {}),
              complementaryData: {
                ...(app.complementaryData || {}),
                ...(updates.birthDate !== undefined ? { dataNascimento: updates.birthDate } : {}),
                ...(updates.gender !== undefined ? { genero: updates.gender as any } : {}),
                ...(updates.address !== undefined ? { morada: updates.address } : {}),
                ...(updates.agentNumber !== undefined ? { numeroAgente: updates.agentNumber } : {}),
              },
              updatedAt: nowIso,
            } as PendingApplication;

            saveApplicationToFirestore(nextApp).catch(() => {});
            if (isExpressApiAvailable()) {
              fetch('/api/network/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ application: nextApp }),
                keepalive: true,
              }).catch(() => {});
            }

            return nextApp;
          }
          return app;
        });
        if (updatedAnyApp) {
          writeApplicationsWithoutDirtyEcho(nextApps);
        }
      }
    }
  } catch {}

  // 5. Update DME Staff List (ucore_dme_staff_list)
  try {
    const rawDme = localStorage.getItem('ucore_dme_staff_list');
    if (rawDme) {
      const dmeList = JSON.parse(rawDme);
      if (Array.isArray(dmeList)) {
        let dmeChanged = false;
        const nextDme = dmeList.map((m: any) => {
          if (m && matchesRecord(m.id, m.email)) {
            dmeChanged = true;
            const nextM = {
              ...m,
              ...(fullName ? { name: fullName } : {}),
              ...(newEmail ? { email: newEmail } : {}),
              ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
              ...(updates.biNumber !== undefined ? { biNumber: updates.biNumber } : {}),
              ...(updates.agentNumber !== undefined ? { agentNumber: updates.agentNumber } : {}),
              ...(updates.roleTitle !== undefined ? { cargoTitle: updates.roleTitle } : {}),
              ...(updates.birthDate !== undefined ? { birthDate: updates.birthDate } : {}),
              ...(updates.gender !== undefined ? { gender: updates.gender } : {}),
              ...(updates.address !== undefined ? { address: updates.address } : {}),
              updatedAt: nowIso,
            };
            saveDmeStaffToFirestore(nextM).catch(() => {});
            return nextM;
          }
          return m;
        });
        if (dmeChanged) {
          localStorage.setItem('ucore_dme_staff_list', JSON.stringify(nextDme));
        }
      }
    }
  } catch {}

  // 6. Update Director stores (ucore_admin_directors, sigre_admin_directors, ucore_registered_directors_v2)
  for (const dirKey of ['ucore_admin_directors', 'sigre_admin_directors', 'ucore_registered_directors_v2']) {
    try {
      const rawDirs = localStorage.getItem(dirKey);
      if (rawDirs) {
        const dirs = JSON.parse(rawDirs);
        if (Array.isArray(dirs)) {
          let dirChanged = false;
          const nextDirs = dirs.map((d: any) => {
            if (
              d &&
              (matchesRecord(d.id, d.email) ||
                matchesRecord(d.id, d.emailPessoal) ||
                matchesRecord(d.id, d.emailInstitucional))
            ) {
              dirChanged = true;
              const nextD = {
                ...d,
                ...(fullName ? { name: fullName, nomeCompleto: fullName } : {}),
                ...(newEmail ? { email: newEmail, emailPessoal: newEmail } : {}),
                ...(updates.phone !== undefined
                  ? { phone: updates.phone, telefonePrincipal: updates.phone }
                  : {}),
                ...(updates.biNumber !== undefined ? { biNif: updates.biNumber, biNumber: updates.biNumber } : {}),
                ...(updates.agentNumber !== undefined ? { numeroAgente: updates.agentNumber } : {}),
                ...(updates.schoolName !== undefined
                  ? { schoolName: updates.schoolName, nomeEscola: updates.schoolName }
                  : {}),
                ...(updates.avatar !== undefined ? { avatar: updates.avatar } : {}),
                registrationData: {
                  ...(d.registrationData || {}),
                  ...(fullName ? { nomeCompleto: fullName } : {}),
                  ...(newEmail ? { emailPessoal: newEmail } : {}),
                  ...(updates.phone !== undefined ? { telefonePrincipal: updates.phone } : {}),
                  ...(updates.biNumber !== undefined ? { biNif: updates.biNumber } : {}),
                  ...(updates.agentNumber !== undefined ? { numeroAgente: updates.agentNumber } : {}),
                  ...(updates.schoolName !== undefined ? { nomeEscola: updates.schoolName } : {}),
                  ...(updates.birthDate !== undefined ? { dataNascimento: updates.birthDate } : {}),
                  ...(updates.gender !== undefined ? { genero: updates.gender } : {}),
                  ...(updates.address !== undefined ? { morada: updates.address } : {}),
                },
                updatedAt: nowIso,
              };
              saveDirectorToFirestore(nextD).catch(() => {});
              return nextD;
            }
            return d;
          });
          if (dirChanged) {
            localStorage.setItem(dirKey, JSON.stringify(nextDirs));
          }
        }
      }
    } catch {}
  }

  // 7. Update Teacher stores (ucore_admin_teachers, ucore_director_teachers_v1, ucore_registered_teachers_v2)
  for (const tKey of ['ucore_admin_teachers', 'ucore_director_teachers_v1', 'ucore_registered_teachers_v2']) {
    try {
      const rawTeachers = localStorage.getItem(tKey);
      if (rawTeachers) {
        const teachers = JSON.parse(rawTeachers);
        if (Array.isArray(teachers)) {
          let teacherChanged = false;
          const nextTeachers = teachers.map((t: any) => {
            if (t && (matchesRecord(t.id, t.email) || matchesRecord(t.id, t.registrationData?.email))) {
              teacherChanged = true;
              const nextT = {
                ...t,
                ...(fullName ? { name: fullName, nomeCompleto: fullName } : {}),
                ...(newEmail ? { email: newEmail } : {}),
                ...(updates.phone !== undefined
                  ? { phone: updates.phone, telefone: updates.phone, telefonePrincipal: updates.phone }
                  : {}),
                ...(updates.biNumber !== undefined ? { biNif: updates.biNumber, bi: updates.biNumber } : {}),
                ...(updates.agentNumber !== undefined
                  ? { agentNumber: updates.agentNumber, numeroAgente: updates.agentNumber }
                  : {}),
                ...(updates.schoolName !== undefined
                  ? { schoolName: updates.schoolName, escola: updates.schoolName, nomeEscola: updates.schoolName }
                  : {}),
                ...(updates.avatar !== undefined ? { avatar: updates.avatar } : {}),
                ...(updates.turma !== undefined ? { turma: updates.turma } : {}),
                ...(updates.classe !== undefined
                  ? { classe: updates.classe, gradeClass: updates.classe }
                  : {}),
                ...(updates.sala !== undefined ? { sala: updates.sala, room: updates.sala } : {}),
                ...(updates.periodo !== undefined ? { periodo: updates.periodo, period: updates.periodo } : {}),
                ...(updates.subject !== undefined ? { subject: updates.subject } : {}),
                registrationData: {
                  ...(t.registrationData || {}),
                  ...(fullName ? { nomeCompleto: fullName } : {}),
                  ...(newEmail ? { email: newEmail } : {}),
                  ...(updates.phone !== undefined ? { telefonePrincipal: updates.phone } : {}),
                  ...(updates.biNumber !== undefined ? { biNif: updates.biNumber } : {}),
                  ...(updates.agentNumber !== undefined ? { numeroAgente: updates.agentNumber } : {}),
                  ...(updates.schoolName !== undefined ? { nomeEscola: updates.schoolName } : {}),
                  ...(updates.birthDate !== undefined ? { dataNascimento: updates.birthDate } : {}),
                  ...(updates.gender !== undefined ? { genero: updates.gender } : {}),
                  ...(updates.address !== undefined ? { morada: updates.address } : {}),
                },
                updatedAt: nowIso,
              };
              saveTeacherToFirestore(nextT).catch(() => {});
              return nextT;
            }
            return t;
          });
          if (teacherChanged) {
            localStorage.setItem(tKey, JSON.stringify(nextTeachers));
          }
        }
      }
    } catch {}
  }

  // 8. If Director, also update school record's directorName / directorPhone / directorEmail
  if (currentUser?.role === 'diretor') {
    const targetSchoolName = (updates.schoolName || currentUser.schoolName || '').trim().toLowerCase();
    for (const scKey of ['ucore_admin_schools', 'ucore_registered_schools_v1']) {
      try {
        const rawSchools = localStorage.getItem(scKey);
        if (rawSchools) {
          const schools = JSON.parse(rawSchools);
          if (Array.isArray(schools)) {
            let schoolChanged = false;
            const nextSchools = schools.map((s: any) => {
              if (!s) return s;
              const sName = (s.name || s.nomeOficial || '').trim().toLowerCase();
              const sDirEmail = (s.directorEmail || s.registrationData?.director?.email || '')
                .trim()
                .toLowerCase();
              if (
                (targetSchoolName && sName && (sName === targetSchoolName || sName.includes(targetSchoolName))) ||
                (oldEmail && sDirEmail === oldEmail) ||
                (normNewEmail && sDirEmail === normNewEmail)
              ) {
                schoolChanged = true;
                const nextS = {
                  ...s,
                  ...(fullName ? { directorName: fullName } : {}),
                  ...(updates.phone !== undefined ? { directorPhone: updates.phone } : {}),
                  ...(newEmail ? { directorEmail: newEmail } : {}),
                  registrationData: s.registrationData
                    ? {
                        ...s.registrationData,
                        director: {
                          ...(s.registrationData.director || {}),
                          ...(fullName ? { nome: fullName } : {}),
                          ...(updates.phone !== undefined ? { telefone: updates.phone } : {}),
                          ...(newEmail ? { email: newEmail } : {}),
                          ...(updates.biNumber !== undefined ? { biNif: updates.biNumber } : {}),
                        },
                      }
                    : s.registrationData,
                  updatedAt: nowIso,
                };
                if (scKey === 'ucore_admin_schools') {
                  saveSchoolToFirestore(nextS).catch(() => {});
                }
                return nextS;
              }
              return s;
            });
            if (schoolChanged) {
              localStorage.setItem(scKey, JSON.stringify(nextSchools));
            }
          }
        }
      } catch {}
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sigre-data-synced'));
  }

  return updatedUserFields;
}



