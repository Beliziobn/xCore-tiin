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

// Seed initial demo applications if not already present
export const SEED_PENDING_APPLICATIONS: PendingApplication[] = [];

export function getPendingApplications(type?: string): PendingApplication[] {
  let list: PendingApplication[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
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
 */
export async function syncApplicationsFromServer(): Promise<PendingApplication[]> {
  try {
    const res = await fetch('/api/network/applications');
    if (!res.ok) return getPendingApplications();
    const data = await res.json();
    if (data && Array.isArray(data.applications)) {
      const serverApps: PendingApplication[] = data.applications;
      const localApps = getPendingApplications();

      const map = new Map<string, PendingApplication>();
      localApps.forEach((a) => {
        const key = String(a.id || a.userId || a.email).trim().toLowerCase();
        if (key) map.set(key, a);
      });

      serverApps.forEach((sa) => {
        const key = String(sa.id || sa.userId || sa.email).trim().toLowerCase();
        if (!key) return;
        const existing = map.get(key);
        if (!existing) {
          map.set(key, sa);
        } else {
          // If server state was approved or rejected, take it
          if (sa.status !== 'pendente' && existing.status === 'pendente') {
            map.set(key, sa);
          } else {
            map.set(key, { ...existing, ...sa });
          }
        }
      });

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
 * Teachers always route here.
 */
export function getApplicationsForDirector(schoolName?: string): PendingApplication[] {
  const all = getPendingApplications();
  return all.filter((a) => {
    const isTarget = a.targetApproverRole === 'diretor' || a.type === 'professor';
    if (!isTarget) return false;
    if (!schoolName) return true;
    const normA = (a.schoolName || '').trim().toLowerCase();
    const normS = schoolName.trim().toLowerCase();
    return normA === normS || normA.includes(normS) || normS.includes(normA);
  });
}

/**
 * Returns applications targeted for the central administrator (dmedoquessua@gmail.com).
 * Administration members and school general directors always route here.
 */
export function getApplicationsForAdmin(): PendingApplication[] {
  const all = getPendingApplications();
  return all.filter((a) => {
    return (
      a.targetApproverRole === 'admin' ||
      a.type === 'diretor' ||
      a.type === 'membro_dme' ||
      a.scope === 'administracao' ||
      a.targetApproverEmail === OFFICIAL_DME_ADMIN_EMAIL
    );
  });
}

export function savePendingApplication(app: PendingApplication): void {
  try {
    // Explicit Supervisor Assignment:
    // 1. Administration staff & School General Directors -> Master Admin (dmedoquessua@gmail.com)
    // 2. Teachers & School staff -> School Director of that specific school
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
      }).catch(() => {});
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }
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
