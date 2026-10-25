import type { PendingApplication, UserAccount, AdminSchool, PendingApprovalComplementaryData } from '../types';
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

function addDeletedApplicationId(id: string) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || !id) return;
  try {
    const set = getDeletedApplicationIds();
    set.add(id.trim().toLowerCase());
    localStorage.setItem(STORAGE_KEY_DELETED_APPLICATIONS, JSON.stringify(Array.from(set)));
  } catch {}
}

// Seed initial demo applications if not already present
export const SEED_PENDING_APPLICATIONS: PendingApplication[] = [];

export function getPendingApplications(type?: string): PendingApplication[] {
  let list: PendingApplication[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const deletedIds = getDeletedApplicationIds();
        list = parsed.filter((a) => {
          if (!a) return false;
          const aId = String(a.id || '').trim().toLowerCase();
          const uId = String(a.userId || '').trim().toLowerCase();
          return !deletedIds.has(aId) && !deletedIds.has(uId);
        });
      }
    }
  } catch {
    // ignore
  }
  return type ? list.filter((a) => a.type === type) : list;
}

/**
 * Synchronizes pending applications from the server's persistent disk store
 * so applications created in any session/browser are instantly visible to their supervisor.
 * Includes bidirectional syncing for pending applications while respecting server purges.
 */
export async function syncApplicationsFromServer(): Promise<PendingApplication[]> {
  try {
    const res = await fetch('/api/network/applications');
    if (!res.ok) return getPendingApplications();
    const data = await res.json();
    if (data && Array.isArray(data.applications)) {
      const serverApps: PendingApplication[] = data.applications;
      const localApps = getPendingApplications();
      const deletedIds = getDeletedApplicationIds();

      // If server has no approved applications, clean local approved applications to stay in lockstep
      const serverApprovedKeys = new Set(
        serverApps
          .filter((sa) => sa.status === 'aprovado' || sa.approvedAt)
          .map((sa) => String(sa.id || sa.userId || sa.email).trim().toLowerCase())
      );

      const map = new Map<string, PendingApplication>();

      // Server applications are authoritative
      serverApps.forEach((sa) => {
        const key = String(sa.id || sa.userId || sa.email).trim().toLowerCase();
        if (!key || deletedIds.has(key)) return;
        map.set(key, sa);
      });

      // Local applications: only keep if not in deleted set and, if approved, it must exist on server
      localApps.forEach((la) => {
        const key = String(la.id || la.userId || la.email).trim().toLowerCase();
        if (!key || deletedIds.has(key)) return;
        if (la.status === 'aprovado' && !serverApprovedKeys.has(key)) {
          // Server already purged this approved record; discard from local
          return;
        }
        if (!map.has(key)) {
          // If it's a pending application not yet on server, keep it
          if (la.status === 'pendente') {
            map.set(key, la);
          }
        }
      });

      // BIDIRECTIONAL SYNC: Only push PENDING applications that are missing from server
      const missingOnServer = Array.from(map.values()).filter((item) => {
        if (item.status !== 'pendente') return false;
        const key = String(item.id || item.userId || item.email).trim().toLowerCase();
        return !serverApps.some((sa) => String(sa.id || sa.userId || sa.email).trim().toLowerCase() === key);
      });

      if (missingOnServer.length > 0) {
        fetch('/api/network/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applications: missingOnServer }),
          keepalive: true,
        }).catch(() => {});
      }

      const merged = Array.from(map.values());
      localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('[authApprovalStorage] Falha ao sincronizar candidaturas do servidor:', err);
  }
  return getPendingApplications();
}

/**
 * Returns applications targeted for the school director, optionally filtered by school name.
 * Teachers and school staff route here.
 */
export function getApplicationsForDirector(schoolName?: string): PendingApplication[] {
  const all = getPendingApplications();
  return all.filter((a) => {
    const isTarget = a.targetApproverRole === 'diretor' || a.type === 'professor' || a.type === 'funcionario';
    if (!isTarget) return false;
    if (!schoolName) return true;
    const normA = (a.schoolName || '').trim().toLowerCase();
    const normS = schoolName.trim().toLowerCase();
    return normA === normS || normA.includes(normS) || normS.includes(normA);
  });
}

/**
 * Returns applications visible to the central administrator (DME Quêssua).
 * The municipal director oversees ALL applications across the entire municipality,
 * while allowing filtering by role.
 */
export function getApplicationsForAdmin(filterType?: string): PendingApplication[] {
  const all = getPendingApplications();
  if (filterType && filterType !== 'todos') {
    return all.filter((a) => a.type === filterType);
  }
  return all;
}

export function savePendingApplication(app: PendingApplication): void {
  try {
    const isAdminTarget =
      app.scope === 'administracao' ||
      app.type === 'diretor' ||
      app.type === 'membro_dme' ||
      app.targetApproverRole === 'admin';

    const normalizedApp: PendingApplication = {
      ...app,
      targetApproverRole: isAdminTarget ? 'admin' : 'diretor',
      targetApproverEmail: isAdminTarget ? OFFICIAL_DME_ADMIN_EMAIL : undefined,
      approverDirectorName: isAdminTarget
        ? `Director Municipal da Educação (${OFFICIAL_DME_ADMIN_EMAIL})`
        : app.approverDirectorName || resolveSchoolDirectorName(null, app.schoolName),
    };

    const existing = getPendingApplications();
    const updated = [
      normalizedApp,
      ...existing.filter((a) => a.id !== normalizedApp.id && a.userId !== normalizedApp.userId),
    ];
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      fetch('/api/network/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application: normalizedApp }),
        keepalive: true,
      }).catch(() => {});
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }
  } catch (e) {
    console.error('Erro ao salvar candidatura:', e);
  }
}

/**
 * Async version that ensures the application is physically persisted on the backend server
 */
export async function savePendingApplicationAsync(app: PendingApplication): Promise<PendingApplication> {
  savePendingApplication(app);

  const isAdminTarget =
    app.scope === 'administracao' ||
    app.type === 'diretor' ||
    app.type === 'membro_dme' ||
    app.targetApproverRole === 'admin';

  const normalizedApp: PendingApplication = {
    ...app,
    targetApproverRole: isAdminTarget ? 'admin' : 'diretor',
    targetApproverEmail: isAdminTarget ? OFFICIAL_DME_ADMIN_EMAIL : undefined,
    approverDirectorName: isAdminTarget
      ? `Director Municipal da Educação (${OFFICIAL_DME_ADMIN_EMAIL})`
      : app.approverDirectorName || resolveSchoolDirectorName(null, app.schoolName),
  };

  try {
    const res = await fetch('/api/network/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application: normalizedApp }),
      keepalive: true,
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.applications)) {
        localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(data.applications));
      }
    }
  } catch (err) {
    console.warn('Falha ao comunicar com o servidor ao salvar candidatura:', err);
  }
  return normalizedApp;
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

    const updatedList = applications.map((a) => (a.id === applicationId ? updatedApp : a));
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(updatedList));

    // If a School Director (Diretor Geral) is approved, update the school's directorName in storage
    if (target.type === 'diretor' && target.schoolName) {
      const normSchool = target.schoolName.trim().toLowerCase();
      ['ucore_admin_schools', 'ucore_registered_schools_v1'].forEach((storageKey) => {
        try {
          const rawSchools = localStorage.getItem(storageKey);
          if (rawSchools) {
            const parsedSchools = JSON.parse(rawSchools);
            if (Array.isArray(parsedSchools)) {
              const nextSchools = parsedSchools.map((sc: any) => {
                const scName = (sc.name || sc.nomeOficial || '').trim().toLowerCase();
                if (scName && (scName === normSchool || scName.includes(normSchool) || normSchool.includes(scName))) {
                  return {
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
                }
                return sc;
              });
              localStorage.setItem(storageKey, JSON.stringify(nextSchools));
            }
          }
        } catch {
          // ignore
        }
      });
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
          qualification: complementaryData?.nivelAcademico || target.nivelAcademico || 'Licenciado',
          gender: 'M',
        };

        const existingAdminIdx = adminTeachers.findIndex(
          (t: any) => t.id === teacherEntry.id || (t.email && t.email.toLowerCase() === target.email.toLowerCase())
        );
        if (existingAdminIdx >= 0) {
          adminTeachers[existingAdminIdx] = { ...adminTeachers[existingAdminIdx], ...teacherEntry };
        } else {
          adminTeachers.unshift(teacherEntry);
        }
        localStorage.setItem('ucore_admin_teachers', JSON.stringify(adminTeachers));

        const existingDirIdx = dirTeachers.findIndex(
          (t: any) => t.id === teacherEntry.id || (t.email && t.email.toLowerCase() === target.email.toLowerCase())
        );
        if (existingDirIdx >= 0) {
          dirTeachers[existingDirIdx] = { ...dirTeachers[existingDirIdx], ...teacherEntry };
        } else {
          dirTeachers.unshift(teacherEntry);
        }
        localStorage.setItem('ucore_director_teachers_v1', JSON.stringify(dirTeachers));
      } catch (err) {
        console.warn('Erro ao integrar professor no quadro após aprovação:', err);
      }
    }

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
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined') {
      fetch('/api/network/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application: updatedApp }),
        keepalive: true,
      }).catch(() => {});
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
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

    if (typeof window !== 'undefined') {
      fetch('/api/network/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application: updatedApp }),
        keepalive: true,
      }).catch(() => {});
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
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
    const userStatus: 'ativo' | 'pendente' | 'rejeitado' =
      match.status === 'aprovado' ? 'ativo' : match.status;
    return { status: userStatus, app: match };
  }
  return { status: 'ativo' };
}

/**
 * Resolves the active Director's name for a given school from approved applications,
 * registered director dossiers, or the school record itself (e.g. "Carl").
 */
export function resolveSchoolDirectorName(
  school?: AdminSchool | null,
  fallbackSchoolName?: string
): string {
  const targetName = (school?.name || fallbackSchoolName || '').trim().toLowerCase();

  if (targetName) {
    // 1. Check approved director applications for this school
    try {
      const apps = getPendingApplications();
      const approvedDir = apps.find(
        (a) =>
          a.type === 'diretor' &&
          a.status === 'aprovado' &&
          a.schoolName &&
          (a.schoolName.trim().toLowerCase() === targetName ||
            a.schoolName.trim().toLowerCase().includes(targetName) ||
            targetName.includes(a.schoolName.trim().toLowerCase()))
      );
      if (approvedDir?.fullName) {
        return approvedDir.fullName;
      }
    } catch {
      // ignore
    }

    // 2. Check registered director dossiers in localStorage
    for (const dirKey of ['ucore_admin_directors', 'ucore_registered_directors_v2']) {
      try {
        const rawDirs = localStorage.getItem(dirKey);
        if (rawDirs) {
          const parsedDirs = JSON.parse(rawDirs);
          if (Array.isArray(parsedDirs)) {
            const matchedDir = parsedDirs.find((d: any) => {
              const dSchool = (d.schoolName || d.nomeEscola || d.registrationData?.nomeEscola || '')
                .trim()
                .toLowerCase();
              return (
                dSchool &&
                (dSchool === targetName || dSchool.includes(targetName) || targetName.includes(dSchool))
              );
            });
            const dName = matchedDir?.name || matchedDir?.nomeCompleto || matchedDir?.registrationData?.nomeCompleto;
            if (dName && dName.trim()) {
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
    if (
      fromSchoolObj &&
      fromSchoolObj.trim() &&
      !fromSchoolObj.toLowerCase().includes('a designar')
    ) {
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
              const sName = (s.name || s.nomeOficial || '').trim().toLowerCase();
              return sName && (sName === targetName || sName.includes(targetName) || targetName.includes(sName));
            });
            const sDir = matchedSc?.directorName || matchedSc?.registrationData?.director?.nome || matchedSc?.director?.nome;
            if (sDir && sDir.trim()) {
              return sDir.trim();
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }

  if (school?.directorName && school.directorName.trim()) {
    return school.directorName.trim();
  }

  return 'Direção Geral da Escola';
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

    addDeletedApplicationId(applicationId);
    if (target?.userId) addDeletedApplicationId(target.userId);
    if (target?.email) addDeletedApplicationId(target.email);

    const remaining = list.filter((a) => a.id !== applicationId && a.userId !== applicationId);
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(remaining));

    // Also remove from local director and teacher rosters if it was approved
    if (target?.type === 'professor') {
      ['ucore_admin_teachers', 'ucore_director_teachers_v1'].forEach((k) => {
        try {
          const r = localStorage.getItem(k);
          if (r) {
            const arr = JSON.parse(r);
            if (Array.isArray(arr)) {
              const f = arr.filter((t: any) => t.id !== target.userId && t.id !== target.id && t.email !== target.email);
              localStorage.setItem(k, JSON.stringify(f));
            }
          }
        } catch {}
      });
    }

    if (target?.type === 'diretor') {
      ['sigre_admin_directors', 'ucore_registered_directors_v2'].forEach((k) => {
        try {
          const r = localStorage.getItem(k);
          if (r) {
            const arr = JSON.parse(r);
            if (Array.isArray(arr)) {
              const f = arr.filter((d: any) => d.id !== target.userId && d.id !== target.id && d.email !== target.email && d.emailPessoal !== target.email);
              localStorage.setItem(k, JSON.stringify(f));
            }
          }
        } catch {}
      });
    }

    // Call server DELETE
    try {
      await fetch(`/api/network/applications/${encodeURIComponent(applicationId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.warn('Falha ao comunicar exclusão ao servidor:', err);
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
 * applications, homologated directors, homologated teachers, and efectividade records.
 */
export async function clearAllHomologatedData(): Promise<{ success: boolean; count: number; message?: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    const list: PendingApplication[] = raw ? JSON.parse(raw) : [];

    // Collect IDs of approved applications to mark them as permanently deleted
    const approved = list.filter((a) => a.status === 'aprovado' || a.approvedAt);
    approved.forEach((a) => {
      if (a.id) addDeletedApplicationId(a.id);
      if (a.userId) addDeletedApplicationId(a.userId);
      if (a.email) addDeletedApplicationId(a.email);
    });

    // 1. Keep only pending or rejected applications locally
    const remaining = list.filter((a) => a.status !== 'aprovado' && !a.approvedAt);
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(remaining));

    // 2. Clear homologated teachers from local rosters
    ['ucore_admin_teachers', 'ucore_director_teachers_v1'].forEach((k) => {
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
    ['sigre_admin_directors', 'ucore_registered_directors_v2'].forEach((k) => {
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

    // 4. Reset active user if it was homologated
    try {
      const activeRaw = localStorage.getItem('ucore_active_user');
      if (activeRaw) {
        const activeUser = JSON.parse(activeRaw);
        if (activeUser && (activeUser.status === 'ativo' || activeUser.approvedAt)) {
          const wasApprovedApp = approved.some(
            (a) => a.userId === activeUser.id || (a.email && a.email.toLowerCase() === (activeUser.email || '').toLowerCase())
          );
          if (wasApprovedApp) {
            activeUser.status = 'pendente';
            delete activeUser.approvedAt;
            delete activeUser.approvedBy;
            localStorage.setItem('ucore_active_user', JSON.stringify(activeUser));
          }
        }
      }
    } catch {}

    // 5. Call server to clear disk store
    let serverCount = approved.length;
    try {
      const res = await fetch('/api/network/clear-homologated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.removed?.total) {
          serverCount = data.removed.total;
        }
      }
    } catch (err) {
      console.warn('Falha na chamada ao servidor para limpar homologados:', err);
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

