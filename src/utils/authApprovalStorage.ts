import type { PendingApplication, UserAccount, AdminSchool, PendingApprovalComplementaryData } from '../types';
import { initialAdminSchools, initialAdminDirectors } from '../data/adminData';
import { directorTeachersData } from '../data/directorData';
import {
  saveApplicationToFirestore,
  fetchApplicationsFromFirestore,
  updateApplicationInFirestore,
  deleteApplicationFromFirestore,
  clearApprovedApplicationsFromFirestore,
  subscribeToApplications,
  saveSchoolToFirestore,
  saveTeacherToFirestore,
  saveDirectorToFirestore,
  saveDmeStaffToFirestore,
  deleteTeacherFromFirestore,
  deleteDirectorFromFirestore,
  deleteDmeStaffFromFirestore,
} from './firestoreSync';

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

export function removeDeletedApplicationId(...ids: (string | undefined)[]) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const set = getDeletedApplicationIds();
    let changed = false;
    ids.forEach((id) => {
      if (id) {
        const clean = id.trim().toLowerCase();
        if (set.has(clean)) {
          set.delete(clean);
          changed = true;
        }
      }
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEY_DELETED_APPLICATIONS, JSON.stringify(Array.from(set)));
    }
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
 * Synchronizes pending applications from the Firestore cloud database and the server's persistent disk store
 * so applications created in any session, browser, or mobile device are instantly visible to their supervisor.
 */
export async function syncApplicationsFromServer(): Promise<PendingApplication[]> {
  try {
    const deletedIds = getDeletedApplicationIds();
    const map = new Map<string, PendingApplication>();

    // 1. Fetch authoritative cloud data from Firebase Firestore
    try {
      const firestoreApps = await fetchApplicationsFromFirestore();
      if (Array.isArray(firestoreApps) && firestoreApps.length > 0) {
        firestoreApps.forEach((fa) => {
          const key = String(fa.id || fa.userId || fa.email).trim().toLowerCase();
          if (!key || deletedIds.has(key)) return;
          map.set(key, fa);
        });
      }
    } catch (err) {
      console.warn('[authApprovalStorage] Falha ao carregar do Firestore:', err);
    }

    // 2. Fetch server applications
    try {
      const res = await fetch('/api/network/applications');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.applications)) {
          const serverApps: PendingApplication[] = data.applications;
          serverApps.forEach((sa) => {
            const key = String(sa.id || sa.userId || sa.email).trim().toLowerCase();
            if (!key || deletedIds.has(key)) return;
            if (!map.has(key)) {
              map.set(key, sa);
              // Push to Firestore if not already present
              saveApplicationToFirestore(sa).catch(() => {});
            }
          });
        }
      }
    } catch {}

    // 3. Local applications
    const localApps = getPendingApplications();
    localApps.forEach((la) => {
      const key = String(la.id || la.userId || la.email).trim().toLowerCase();
      if (!key || deletedIds.has(key)) return;
      if (!map.has(key)) {
        if (la.status === 'pendente') {
          map.set(key, la);
          saveApplicationToFirestore(la).catch(() => {});
        }
      }
    });

    const merged = Array.from(map.values());
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.warn('[authApprovalStorage] Falha ao sincronizar candidaturas:', err);
    return getPendingApplications();
  }
}

/**
 * Initializes a real-time cloud listener that keeps this device's application list
 * updated in real time whenever any candidate signs up on any mobile or desktop device.
 */
let realtimeUnsubscribe: (() => void) | null = null;
export function initRealtimeApplicationsSync(
  onUpdate?: (apps: PendingApplication[]) => void
): () => void {
  if (realtimeUnsubscribe) {
    return realtimeUnsubscribe;
  }

  realtimeUnsubscribe = subscribeToApplications((firestoreApps) => {
    try {
      const deletedIds = getDeletedApplicationIds();
      const validApps = firestoreApps.filter((a) => {
        const aId = String(a.id || '').trim().toLowerCase();
        const uId = String(a.userId || '').trim().toLowerCase();
        return !deletedIds.has(aId) && !deletedIds.has(uId);
      });

      localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(validApps));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sigre-data-synced'));
      }
      onUpdate?.(validApps);
    } catch (e) {
      console.warn('[authApprovalStorage] Erro no listener em tempo real:', e);
    }
  });

  return realtimeUnsubscribe;
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
    // Clear any previous deletion tombstone so this registration is never blocked
    removeDeletedApplicationId(app.id, app.userId, app.email);

    const normalizedApp: PendingApplication = {
      ...app,
      // The Director Municipal da Educação (dmedoquessua@gmail.com) oversees ALL applications across the entire municipality
      targetApproverEmail: OFFICIAL_DME_ADMIN_EMAIL,
      targetApproverRole: 'admin',
      approverDirectorName: `Director Municipal da Educação (${OFFICIAL_DME_ADMIN_EMAIL})`,
    };

    const existing = getPendingApplications();
    const updated = [
      normalizedApp,
      ...existing.filter((a) => a.id !== normalizedApp.id && a.userId !== normalizedApp.userId),
    ];
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(updated));

    // Save directly to Firestore cloud database in background
    saveApplicationToFirestore(normalizedApp).catch((e) => {
      console.warn('[authApprovalStorage] Falha ao persistir no Firestore:', e);
    });

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
 * Async version that ensures the application is physically persisted on the Firebase Firestore cloud
 * and backend server so it appears immediately on the administrator's mobile device.
 */
export async function savePendingApplicationAsync(app: PendingApplication): Promise<PendingApplication> {
  // Clear any deletion tombstone
  removeDeletedApplicationId(app.id, app.userId, app.email);

  const normalizedApp: PendingApplication = {
    ...app,
    targetApproverEmail: OFFICIAL_DME_ADMIN_EMAIL,
    targetApproverRole: 'admin',
    approverDirectorName: `Director Municipal da Educação (${OFFICIAL_DME_ADMIN_EMAIL})`,
  };

  savePendingApplication(normalizedApp);

  // Guarantee parallel persistence to both Cloud Firestore and Node.js network store
  const firestorePromise = Promise.race([
    saveApplicationToFirestore(normalizedApp),
    new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 3500)),
  ]).catch((err) => {
    console.warn('[authApprovalStorage] Aviso ao gravar no Firestore:', err);
  });

  const serverPromise = Promise.race([
    fetch('/api/network/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application: normalizedApp }),
      keepalive: true,
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.applications)) {
          localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(data.applications));
        }
      }
    }),
    new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Server API timeout')), 3500)),
  ]).catch((err) => {
    console.warn('[authApprovalStorage] Falha ao comunicar com o servidor ao salvar candidatura:', err);
  });

  await Promise.allSettled([firestorePromise, serverPromise]);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sigre-data-synced'));
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
              nextSchools.forEach((sc: any) => {
                const scName = (sc.name || sc.nomeOficial || '').trim().toLowerCase();
                if (scName && (scName === normSchool || scName.includes(normSchool) || normSchool.includes(scName))) {
                  saveSchoolToFirestore(sc).catch(() => {});
                }
              });
            }
          }
        } catch {
          // ignore
        }
      });

      // Also persist approved Director record to Firestore directors collection
      saveDirectorToFirestore({
        id: target.userId || target.id,
        name: target.fullName,
        nomeCompleto: target.fullName,
        phone: target.phone || '+244 923 000 000',
        email: target.email,
        schoolName: target.schoolName,
        nomeEscola: target.schoolName,
        location: target.municipality || 'Quêssua',
        yearsInRole: target.anosServico || 1,
        presenceRate: 100,
        schoolPerformance: 92,
        status: 'Ativo',
        approvedAt: updatedApp.approvedAt,
      }).catch(() => {});
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
        saveTeacherToFirestore(teacherEntry).catch(() => {});
      } catch (err) {
        console.warn('Erro ao integrar professor no quadro após aprovação:', err);
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
                (m.email && m.email.toLowerCase() === target.email.toLowerCase()) ||
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
        saveDmeStaffToFirestore(dmeEntry).catch(() => {});
      } catch (err) {
        console.warn('Erro ao integrar membro DME no quadro da Direcção Municipal:', err);
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

    // Push approval to Firestore cloud
    saveApplicationToFirestore(updatedApp).catch((e) => {
      console.warn('[authApprovalStorage] Falha ao atualizar homologação no Firestore:', e);
    });

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

    // Push rejection to Firestore cloud
    saveApplicationToFirestore(updatedApp).catch((e) => {
      console.warn('[authApprovalStorage] Falha ao atualizar rejeição no Firestore:', e);
    });

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
  biNumber?: string
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
    if (normEmail && app.email && app.email.trim().toLowerCase() === normEmail) {
      return {
        duplicate: true,
        reason: `O e-mail "${email.trim()}" já possui uma conta registada (${app.fullName} • ${app.roleRequested || 'Utilizador'}). Por segurança, não é permitido registar nem aceder à conta de outro utilizador.`,
      };
    }
    if (normBi && normBi.length >= 5 && app.biNumber && app.biNumber.trim().toUpperCase() === normBi) {
      return {
        duplicate: true,
        reason: `O Bilhete de Identidade "${biNumber?.trim()}" já se encontra vinculado à conta de ${app.fullName} (${app.roleRequested || 'Utilizador'}).`,
      };
    }
  }

  // Check DME staff list
  try {
    const rawDme = localStorage.getItem('ucore_dme_staff_list');
    if (rawDme) {
      const dmeList = JSON.parse(rawDme);
      if (Array.isArray(dmeList)) {
        const foundDme = dmeList.find(
          (m: any) => m && m.email && m.email.trim().toLowerCase() === normEmail
        );
        if (foundDme) {
          return {
            duplicate: true,
            reason: `Este e-mail já está registado no quadro da Direcção Municipal (${foundDme.name} • ${foundDme.cargoTitle}).`,
          };
        }
      }
    }
  } catch {}

  return { duplicate: false };
}

/**
 * Looks up an existing registered account by email across all official stores
 * so that login strictly authenticates existing users with their true role and cargo.
 */
export function findRegisteredAccountByEmail(email: string): {
  exists: boolean;
  isMasterAdmin?: boolean;
  app?: PendingApplication;
  dmeStaff?: any;
  director?: any;
  teacher?: any;
} {
  const normEmail = (email || '').trim().toLowerCase();
  if (!normEmail) return { exists: false };

  if (normEmail === OFFICIAL_DME_ADMIN_EMAIL || normEmail === 'beliziodos20@gmail.com') {
    return { exists: true, isMasterAdmin: true };
  }

  // 1. Check applications (pending, approved, or rejected)
  const apps = getPendingApplications();
  const matchedApp = apps.find((a) => a.email && a.email.trim().toLowerCase() === normEmail);
  if (matchedApp) {
    return { exists: true, app: matchedApp };
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
            return { exists: true, director: matchedDir };
          }
        }
      }
    } catch {}
  }

  // 4. Check registered teachers
  for (const tKey of ['ucore_admin_teachers', 'ucore_director_teachers_v1']) {
    try {
      const rawTeachers = localStorage.getItem(tKey);
      if (rawTeachers) {
        const parsedTeachers = JSON.parse(rawTeachers);
        if (Array.isArray(parsedTeachers)) {
          const matchedTeacher = parsedTeachers.find(
            (t: any) => t && t.email && t.email.trim().toLowerCase() === normEmail
          );
          if (matchedTeacher) {
            return { exists: true, teacher: matchedTeacher };
          }
        }
      }
    } catch {}
  }

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

    // Also remove from local director, teacher, and DME staff rosters if it was approved
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

    if (target?.type === 'membro_dme' || target?.scope === 'administracao') {
      try {
        const r = localStorage.getItem('ucore_dme_staff_list');
        if (r) {
          const arr = JSON.parse(r);
          if (Array.isArray(arr)) {
            const f = arr.filter((m: any) => m.id !== target.userId && m.id !== target.id && m.email !== target.email);
            localStorage.setItem('ucore_dme_staff_list', JSON.stringify(f));
          }
        }
      } catch {}
    }

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
    if (target?.type === 'membro_dme' || target?.scope === 'administracao') {
      deleteDmeStaffFromFirestore(target.userId || target.id).catch(() => {});
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
 * applications, homologated directors, homologated teachers, DME staff, and efectividade records.
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

    // 5. Clear approved records from Firestore cloud database
    try {
      await clearApprovedApplicationsFromFirestore();
    } catch (e) {
      console.warn('[authApprovalStorage] Falha ao limpar homologados no Firestore:', e);
    }

    // Call server to clear disk store
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


