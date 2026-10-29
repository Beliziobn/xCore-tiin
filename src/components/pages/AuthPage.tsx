import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  GraduationCap,
  Box,
  Loader2,
  Info,
  BookOpen,
  FileText,
  Landmark,
  Award,
  BarChart3,
  Settings,
  School,
  Briefcase,
  Check,
  Sparkles,
  Phone,
  X,
  MapPin,
  Users,
  Layers,
  Clock,
  DoorOpen,
  ArrowRight,
  ChevronDown,
  ClipboardList,
  LayoutGrid,
  CreditCard
} from 'lucide-react';
import teacherImg from '../../assets/images/teacher_classroom_1788697035170.jpg';
import { verifyPassword, updatePassword, encodePasswordVerifier } from '../../utils/passwordService';
import type { UserAccount, SchoolStaffRole, AdminStaffRole, AdminSchool } from '../../types';
import { GoogleSignInButton } from '../common/GoogleSignInButton';
import { googleSignIn, createGoogleUserSession } from '../../utils/googleAuth';
import { 
  UCORE_MUNICIPALITIES, 
  UCORE_DISCIPLINAS, 
  UCORE_GRAUS_CLASSES, 
  searchPreRegisteredTeacher, 
  searchPreRegisteredDirector,
  savePendingApplication,
  savePendingApplicationAsync,
  checkUserApprovalStatus,
  resolveSchoolDirectorName,
  syncApplicationsFromServer,
  getOccupiedDmeCargos,
  checkDuplicateRegistration,
  findRegisteredAccountByEmail,
} from '../../utils/authApprovalStorage';
import { initialAdminSchools } from '../../data/adminData';
import { getRegisteredSchoolsFromStorage } from '../../utils/studentStorage';
import { getSchoolRegistrationData, getOfferedLevelsBadges, syncSchoolsFromServer } from '../../utils/schoolStorage';
import { saveUserToFirestore, fetchUserFromFirestore } from '../../utils/firestoreSync';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onModeChange?: (mode: 'login' | 'register') => void;
  onLoginSuccess: (user: UserAccount) => void;
  onBackToHome: () => void;
  hideHeader?: boolean;
  onAuthLoadingChange?: (loading: boolean, action?: 'login' | 'register') => void;
  schools?: AdminSchool[];
}

export const SCHOOL_ROLES_CONFIG: {
  id: SchoolStaffRole;
  label: string;
  badge: string;
  icon: any;
  desc: string;
  prefix: string;
  baseRole: 'diretor' | 'professor';
  defaultEmail: string;
  defaultFirst: string;
  defaultLast: string;
  cargoFull: string;
}[] = [
  {
    id: 'diretor_geral',
    label: 'Diretor(a) Geral',
    badge: 'Direção Máxima',
    icon: Building2,
    desc: 'Liderança executiva, representação institucional e gestão global da unidade escolar',
    prefix: 'Diretor Geral',
    baseRole: 'diretor',
    defaultEmail: 'diretor.carl@ucore.edu.br',
    defaultFirst: 'Carl',
    defaultLast: 'Mendes',
    cargoFull: 'Diretor Geral da Unidade Escolar',
  },
  {
    id: 'subdiretor_pedagogico',
    label: 'Subdiretor(a) Pedagógico(a)',
    badge: 'Pedagógico',
    icon: GraduationCap,
    desc: 'Supervisão pedagógica, planos de aula, avaliações, turmas e rendimento escolar',
    prefix: 'Subdiretor Pedagógico',
    baseRole: 'diretor',
    defaultEmail: 'subdiretor.pedagogico@ucore.edu.br',
    defaultFirst: 'Carlos',
    defaultLast: 'Silva',
    cargoFull: 'Subdiretor Pedagógico do Iº e IIº Ciclos',
  },
  {
    id: 'subdiretor_administrativo',
    label: 'Subdiretor(a) Administrativo(a)',
    badge: 'Administração',
    icon: ShieldCheck,
    desc: 'Gestão administrativa, recursos humanos locais, secretaria escolar e património',
    prefix: 'Subdiretor Adm.',
    baseRole: 'diretor',
    defaultEmail: 'subdiretor.adm@ucore.edu.br',
    defaultFirst: 'Teresa',
    defaultLast: 'Santos',
    cargoFull: 'Subdiretora Administrativa e Financeira',
  },
  {
    id: 'professor',
    label: 'Professor(a) / Docente',
    badge: 'Docência',
    icon: BookOpen,
    desc: 'Regência de disciplinas, lançamento de notas contínuas, pautas e assiduidade',
    prefix: 'Prof.',
    baseRole: 'professor',
    defaultEmail: 'prof.santar@ucore.edu.br',
    defaultFirst: 'Santar',
    defaultLast: 'Goes',
    cargoFull: 'Professor Primário Efetivo - 4ª Classe',
  },
  {
    id: 'secretario_escolar',
    label: 'Secretário(a) Escolar',
    badge: 'Secretaria',
    icon: FileText,
    desc: 'Matrículas, arquivos discentes, declarações com notas e processos administrativos',
    prefix: 'Secretário(a)',
    baseRole: 'diretor',
    defaultEmail: 'secretaria.paula@ucore.edu.br',
    defaultFirst: 'Paula',
    defaultLast: 'Costa',
    cargoFull: 'Secretária Geral da Unidade Escolar',
  },
];

export const ADMIN_ROLES_CONFIG: {
  id: AdminStaffRole;
  label: string;
  badge: string;
  icon: any;
  desc: string;
  prefix: string;
  baseRole: 'admin';
  defaultEmail: string;
  defaultFirst: string;
  defaultLast: string;
  cargoFull: string;
}[] = [
  {
    id: 'chefe_reparticao',
    label: 'Chefe de Repartição / Ensino Geral',
    badge: 'Repartição de Ensino',
    icon: Award,
    desc: 'Supervisão do ensino primário e secundário, distribuição docente e rede curricular na DME',
    prefix: 'Chefe de Repartição',
    baseRole: 'admin',
    defaultEmail: 'chefe.ensino@ucore.edu.br',
    defaultFirst: 'Augusto',
    defaultLast: 'Nvula',
    cargoFull: 'Chefe de Repartição / Ensino Geral',
  },
  {
    id: 'inspetor_escolar',
    label: 'Inspector(a) Escolar Municipal',
    badge: 'Inspecção & Auditoria',
    icon: Eye,
    desc: 'Inspecção técnica, auditoria curricular, supervisão pedagógica e conformidade legal na DME',
    prefix: 'Inspector(a) Escolar',
    baseRole: 'admin',
    defaultEmail: 'inspetor.marcos@ucore.edu.br',
    defaultFirst: 'Marcos',
    defaultLast: 'Dinis',
    cargoFull: 'Inspector(a) Escolar Municipal',
  },
  {
    id: 'tecnico_estatistica',
    label: 'Técnico(a) de Planeamento & Estatística',
    badge: 'Planeamento & Dados',
    icon: BarChart3,
    desc: 'Consolidação de dados do Censo Escolar, taxas de aprovação, fluxo e infraestrutura na DME',
    prefix: 'Técnico(a) DME',
    baseRole: 'admin',
    defaultEmail: 'estatistica.dme@ucore.edu.br',
    defaultFirst: 'Helena',
    defaultLast: 'Manuel',
    cargoFull: 'Técnico(a) de Planeamento & Estatística',
  },
  {
    id: 'tecnico_recursos_humanos',
    label: 'Técnico(a) de Recursos Humanos / Secretaria',
    badge: 'Secretaria DME',
    icon: Briefcase,
    desc: 'Gestão de processos de pessoal, efectividade municipal e expediente da Direcção Municipal',
    prefix: 'Técnico(a) RH',
    baseRole: 'admin',
    defaultEmail: 'rh.dme@ucore.edu.br',
    defaultFirst: 'Teresa',
    defaultLast: 'Sebastião',
    cargoFull: 'Técnico(a) de Recursos Humanos / Secretaria DME',
  },
  {
    id: 'diretor_municipal',
    label: 'Director(a) Municipal da Educação',
    badge: 'Titular DME',
    icon: Landmark,
    desc: 'Cargo titular exclusivo já provido pela conta oficial dmedoquessua@gmail.com (indisponível para novo cadastro)',
    prefix: 'Director Municipal',
    baseRole: 'admin',
    defaultEmail: 'dmedoquessua@gmail.com',
    defaultFirst: 'Director Municipal',
    defaultLast: 'da Educação',
    cargoFull: 'Director Municipal da Educação de Quessua',
  },
  {
    id: 'admin_sistema',
    label: 'Administrador(a) Geral do Sistema',
    badge: 'Conta Central',
    icon: Settings,
    desc: 'Administração central vinculada ao perfil titular da Direcção Municipal (dmedoquessua@gmail.com)',
    prefix: 'Admin.',
    baseRole: 'admin',
    defaultEmail: 'dmedoquessua@gmail.com',
    defaultFirst: 'Administração',
    defaultLast: 'Central DME',
    cargoFull: 'Administrador Geral do Sistema Sigre',
  },
];

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onModeChange,
  onLoginSuccess,
  onBackToHome,
  hideHeader = false,
  onAuthLoadingChange,
  schools: propSchools,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isGoogleLockedEmail, setIsGoogleLockedEmail] = useState<boolean>(false);
  const [googleAuthMeta, setGoogleAuthMeta] = useState<{ uid?: string; photoURL?: string | null } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [storageRevision, setStorageRevision] = useState(0);

  // Sync registered schools from server and localStorage events so other people signing up see all registered schools
  useEffect(() => {
    let mounted = true;
    syncSchoolsFromServer().then(() => {
      if (mounted) setStorageRevision((r) => r + 1);
    });
    const handleStorageUpdate = () => {
      if (mounted) setStorageRevision((r) => r + 1);
    };
    window.addEventListener('sigre-data-synced', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('sigre-data-synced', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [mode]);

  // Escolas já cadastradas no sistema (prop + localStorage + servidor + initialAdminSchools)
  const registeredSchools = React.useMemo(() => {
    const fromStorage = getRegisteredSchoolsFromStorage();
    const combined = [...(propSchools || []), ...fromStorage, ...initialAdminSchools];
    const uniqueMap = new Map<string, AdminSchool>();
    combined.forEach((sc) => {
      if (sc && sc.name) {
        const key = sc.name.trim().toLowerCase();
        const existing = uniqueMap.get(key);
        uniqueMap.set(key, existing ? { ...existing, ...sc, registrationData: sc.registrationData || existing.registrationData } : sc);
      }
    });
    return Array.from(uniqueMap.values());
  }, [propSchools, mode, storageRevision]);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Institutional Scope & Role Flexion State
  const [institutionalScope, setInstitutionalScope] = useState<'escola' | 'administracao'>('escola');
  const [schoolRole, setSchoolRole] = useState<SchoolStaffRole>('diretor_geral');
  const [adminRole, setAdminRole] = useState<AdminStaffRole>('chefe_reparticao');
  const [schoolOrUnitName, setSchoolOrUnitName] = useState('');

  // Occupied DME cargos map (prevents registering duplicate DME cargos or another Director Municipal)
  const occupiedDmeCargos = React.useMemo(() => {
    return getOccupiedDmeCargos();
  }, [mode, storageRevision]);

  // Ensure selected adminRole in registration defaults to an available DME cargo
  useEffect(() => {
    if (mode === 'register' && institutionalScope === 'administracao') {
      if (occupiedDmeCargos[adminRole]?.occupied) {
        const firstAvailable = ADMIN_ROLES_CONFIG.find((r) => !occupiedDmeCargos[r.id]?.occupied);
        if (firstAvailable && firstAvailable.id !== adminRole) {
          setAdminRole(firstAvailable.id);
        }
      }
    }
  }, [mode, institutionalScope, occupiedDmeCargos, adminRole]);
  
  // Sigre Predefined System Selection Options
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>(UCORE_MUNICIPALITIES[0]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(() => registeredSchools[0]?.id || '');
  const [biNumber, setBiNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>(UCORE_DISCIPLINAS[0]);
  const [selectedGradeClass, setSelectedGradeClass] = useState<string>(UCORE_GRAUS_CLASSES[1]);
  const [preRegResult, setPreRegResult] = useState<{ found: boolean; details?: string; teacherName?: string; directorName?: string } | null>(null);

  const [loginPresetTab, setLoginPresetTab] = useState<'escola' | 'administracao'>('escola');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // 3-Step Registration Wizard State
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [hasChosenRole, setHasChosenRole] = useState<boolean>(false);
  const [regMunicipalityValue, setRegMunicipalityValue] = useState<string>('quessua');
  const [stepErrors, setStepErrors] = useState<{ [key: number]: string }>({});
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [registrationSubmitted, setRegistrationSubmitted] = useState<boolean>(false);
  const [submittedUserAccount, setSubmittedUserAccount] = useState<UserAccount | null>(null);

  // Keep selectedSchoolId synced with registeredSchools and auto-fill municipality from registered school data
  useEffect(() => {
    if (registeredSchools.length > 0) {
      const exists = registeredSchools.some((s) => s.id === selectedSchoolId);
      const targetSc = exists
        ? registeredSchools.find((s) => s.id === selectedSchoolId)!
        : registeredSchools[0];
      if (!exists) {
        setSelectedSchoolId(targetSc.id);
      }
      setSchoolOrUnitName(targetSc.name);
      const regData = getSchoolRegistrationData(targetSc);
      const schoolMun = regData.endereco?.municipio?.trim();
      if (schoolMun) {
        const matchedMun = UCORE_MUNICIPALITIES.find((m) =>
          m.toLowerCase().includes(schoolMun.toLowerCase()) ||
          schoolMun.toLowerCase().includes(m.toLowerCase())
        );
        if (matchedMun) {
          setSelectedMunicipality(matchedMun);
        }
      }
    } else {
      setSelectedSchoolId('');
      setSchoolOrUnitName('');
    }
  }, [registeredSchools, selectedSchoolId]);

  // Real-time pre-registration search across Sigre roster (ONLY for school scope; DME staff are NEVER school directors)
  useEffect(() => {
    if (mode !== 'register') {
      setPreRegResult(null);
      return;
    }
    const currentSchool = registeredSchools.find((s) => s.id === selectedSchoolId)?.name || registeredSchools[0]?.name || '';
    const fullName = `${firstName} ${lastName}`.trim();

    if (institutionalScope === 'escola') {
      if (schoolRole === 'professor') {
        const res = searchPreRegisteredTeacher(email, biNumber, fullName, currentSchool);
        setPreRegResult(res.found ? res : null);
      } else if (schoolRole.includes('diretor')) {
        const res = searchPreRegisteredDirector(email, biNumber, fullName, currentSchool);
        setPreRegResult(res.found ? res : null);
      } else {
        setPreRegResult(null);
      }
    } else {
      // Pessoal da Direcção Municipal (DME) nunca deve ser vinculado como Director de Escola
      setPreRegResult(null);
    }
  }, [mode, email, biNumber, firstName, lastName, selectedSchoolId, selectedMunicipality, schoolRole, institutionalScope, registeredSchools]);

  const completeGoogleLogin = async (
    targetEmail: string,
    targetName: string,
    uid?: string,
    photoURL?: string | null,
    manualRoleHint?: string
  ) => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    const isDirectorMunicipal =
      cleanEmail === 'dmedoquessua@gmail.com' ||
      cleanEmail.includes('dmedoquessua');
    const isSuperAdmin =
      cleanEmail === 'beliziodos20@gmail.com' ||
      cleanEmail.includes('belizio');

    // 1. Sync fresh applications from server / Firestore to ensure we check any existing application
    let approvalCheck = checkUserApprovalStatus(uid || '', cleanEmail);
    if (!approvalCheck.app) {
      try {
        const freshApps = await syncApplicationsFromServer();
        const matchedApp = freshApps.find(
          (a) =>
            (uid && a.userId === uid) ||
            (cleanEmail && a.email?.trim().toLowerCase() === cleanEmail)
        );
        if (matchedApp) {
          approvalCheck = {
            status: matchedApp.status === 'aprovado' ? 'ativo' : matchedApp.status,
            app: matchedApp,
          };
        }
      } catch {}
    }

    // 2. Check registered accounts strictly by email
    const existingAccountLookup = findRegisteredAccountByEmail(cleanEmail);

    // 3. Check Firestore user document by email
    let existingFirestoreUser: UserAccount | null = null;
    try {
      existingFirestoreUser = await fetchUserFromFirestore(cleanEmail);
    } catch {}

    // Check if account already exists in the system for this exact email
    const hasExistingAccount = Boolean(
      isDirectorMunicipal ||
      isSuperAdmin ||
      existingAccountLookup.exists ||
      approvalCheck.app ||
      existingFirestoreUser
    );

    const names = targetName.trim().split(' ');
    let gFirst = names[0] || 'Utilizador';
    let gLast = names.slice(1).join(' ') || '';

    // SE NÃO TEM AINDA UMA CONTA CRIADA E CADASTRADA NO SISTEMA:
    // Leva automaticamente o utilizador à página de inscrição (Passo 1) com o e-mail do Google bloqueado
    if (!hasExistingAccount) {
      setIsGoogleLoading(false);
      setLoading(false);
      onAuthLoadingChange?.(false);

      // Preenche os dados identificados na conta Google e bloqueia o e-mail
      setEmail(cleanEmail);
      setIsGoogleLockedEmail(true);
      setGoogleAuthMeta({ uid, photoURL });
      if (gFirst && gFirst !== 'Utilizador' && gFirst !== 'Google') {
        setFirstName(gFirst);
      } else {
        setFirstName('');
      }
      if (gLast && gLast !== 'Google') {
        setLastName(gLast);
      } else {
        setLastName('');
      }

      // Reinicia o assistente de inscrição no Passo 1 (escolher perfil e escola)
      setRegStep(1);
      setRegistrationSubmitted(false);
      setHasChosenRole(false);
      setStepErrors({});
      setFieldErrors({});
      setErrorMsg(null);
      setSuccessMsg(null);

      // Altera automaticamente para a página de inscrição
      setMode('register');
      onModeChange?.('register');
      setGoogleNotice(
        `O e-mail ${cleanEmail} ainda não possui conta registada no sistema. Selecione o seu perfil e escola (Passo 1 e 2) e conclua a sua inscrição com este e-mail.`
      );

      // Rola suavemente até ao início do formulário de inscrição
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const cardContainer = document.getElementById('auth-card-container');
        if (cardContainer) {
          cardContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 80);
      return;
    }

    // SE JÁ POSSUI CONTA CADASTRADA:
    // 1. Se a candidatura estiver pendente de homologação
    if (approvalCheck.app && approvalCheck.status === 'pendente') {
      const app = approvalCheck.app;
      const isDmeMember = app.scope === 'administracao' || app.type === 'membro_dme' || Boolean(app.adminRole);
      const dmeCfg = isDmeMember ? ADMIN_ROLES_CONFIG.find((c) => c.id === app.adminRole) : undefined;
      const pendingUser: UserAccount = {
        id: app.userId || uid || 'usr_' + Date.now(),
        firstName: gFirst,
        lastName: gLast,
        email: cleanEmail,
        role: isDmeMember ? 'admin' : app.type === 'professor' || app.schoolRole === 'professor' ? 'professor' : 'diretor',
        scope: isDmeMember ? 'administracao' : app.scope || 'escola',
        schoolRole: isDmeMember ? undefined : app.schoolRole,
        adminRole: isDmeMember ? (app.adminRole || 'chefe_reparticao') : undefined,
        cargoTitle: app.roleRequested || dmeCfg?.label || 'Candidato Institucional',
        schoolName: isDmeMember ? 'Direcção Municipal da Educação de Quêssua' : (app.schoolName || 'Unidade Escolar'),
        schoolId: isDmeMember ? undefined : app.schoolId,
        municipalityOrDepartment: app.municipality || 'Quêssua',
        titlePrefix: isDmeMember
          ? (dmeCfg?.prefix || 'Quadro DME')
          : app.type === 'professor' || app.schoolRole === 'professor'
          ? 'Prof.'
          : 'Director',
        greeting: `Olá ${gFirst}`,
        avatar: photoURL || undefined,
        status: 'pendente',
      };
      setSuccessMsg(
        `A sua candidatura como ${app.roleRequested} continua em análise na Direção Municipal da Educação. A aceder ao ambiente de acompanhamento...`
      );
      setTimeout(() => {
        onLoginSuccess(pendingUser);
      }, 600);
      return;
    }

    // 2. Se foi indeferida
    if (approvalCheck.app && approvalCheck.status === 'rejeitado') {
      setErrorMsg(
        `A sua candidatura foi indeferida pela administração: ${approvalCheck.app.rejectionReason || 'Contacte a Direção Municipal da Educação.'}`
      );
      setIsGoogleLoading(false);
      return;
    }

    // 3. Se possui conta ativa, resolver credenciais e entrar
    let resolvedRole: 'admin' | 'diretor' | 'professor' = 'diretor';
    let resolvedScope: 'escola' | 'administracao' = 'escola';
    let resolvedSchoolRole: SchoolStaffRole | undefined = undefined;
    let resolvedAdminRole: AdminStaffRole | undefined = undefined;
    let resolvedCargo = isSuperAdmin
      ? 'Administrador de Sistema Sigre (Super Admin)'
      : isDirectorMunicipal
      ? 'Director Municipal da Educação de Quessua'
      : 'Quadro Institucional';
    let resolvedPrefix = isSuperAdmin ? 'Admin.' : isDirectorMunicipal ? 'Dr.' : 'Sr(a).';
    let resolvedSchoolName: string | undefined = registeredSchools[0]?.name || 'Unidade Escolar';
    let resolvedSchoolId: string | undefined = registeredSchools[0]?.id;

    if (isSuperAdmin) {
      resolvedRole = 'admin';
      resolvedScope = 'administracao';
      resolvedAdminRole = 'admin_sistema';
      resolvedCargo = 'Administrador de Sistema Sigre (Super Admin)';
      resolvedPrefix = 'Admin.';
      resolvedSchoolName = 'Direcção Municipal da Educação de Quessua';
      gFirst = 'Belízio';
      gLast = gLast && gLast !== 'Utilizador' && gLast !== 'Google' ? gLast : 'Administrador';
    } else if (isDirectorMunicipal) {
      resolvedRole = 'admin';
      resolvedScope = 'administracao';
      resolvedAdminRole = 'diretor_municipal';
      resolvedCargo = 'Director Municipal da Educação de Quessua';
      resolvedPrefix = 'Dr.';
      resolvedSchoolName = 'Direcção Municipal da Educação de Quessua';
      gFirst = 'Director Municipal';
      gLast = 'da Educação';
    } else if (approvalCheck.app) {
      const app = approvalCheck.app;
      const isDmeMember = app.scope === 'administracao' || app.type === 'membro_dme' || Boolean(app.adminRole);
      if (isDmeMember) {
        const dmeCfg = ADMIN_ROLES_CONFIG.find((c) => c.id === app.adminRole);
        resolvedRole = 'admin';
        resolvedScope = 'administracao';
        resolvedSchoolRole = undefined;
        resolvedAdminRole = app.adminRole || 'chefe_reparticao';
        resolvedCargo = app.roleRequested || dmeCfg?.label || 'Chefe de Repartição / Ensino Geral';
        resolvedPrefix = dmeCfg?.prefix || resolvedCargo;
        resolvedSchoolName = 'Direcção Municipal da Educação de Quêssua';
        resolvedSchoolId = undefined;
      } else {
        const schCfg = SCHOOL_ROLES_CONFIG.find((c) => c.id === app.schoolRole);
        resolvedScope = 'escola';
        resolvedSchoolRole = app.schoolRole || (app.type === 'professor' ? 'professor' : 'diretor_geral');
        resolvedAdminRole = undefined;
        resolvedRole = app.type === 'professor' || app.schoolRole === 'professor' ? 'professor' : 'diretor';
        resolvedCargo = app.roleRequested || schCfg?.label || (resolvedRole === 'professor' ? 'Professor(a) / Docente' : 'Diretor(a) Geral');
        resolvedPrefix = schCfg?.prefix || (resolvedRole === 'professor' ? 'Prof.' : 'Director');
        resolvedSchoolName = app.schoolName || resolvedSchoolName;
        resolvedSchoolId = app.schoolId;
      }
      const appNames = (app.fullName || '').trim().split(' ');
      if (appNames[0]) gFirst = appNames[0];
      if (appNames.length > 1) gLast = appNames.slice(1).join(' ');
    } else if (existingFirestoreUser) {
      resolvedRole =
        existingFirestoreUser.role === 'admin' || existingFirestoreUser.role === 'professor'
          ? existingFirestoreUser.role
          : 'diretor';
      resolvedScope = existingFirestoreUser.scope || resolvedScope;
      resolvedSchoolRole = existingFirestoreUser.schoolRole;
      resolvedAdminRole = existingFirestoreUser.adminRole;
      resolvedCargo = existingFirestoreUser.cargoTitle || resolvedCargo;
      resolvedSchoolName = existingFirestoreUser.schoolName;
      resolvedSchoolId = existingFirestoreUser.schoolId;
      resolvedPrefix = existingFirestoreUser.titlePrefix || resolvedPrefix;
      if (existingFirestoreUser.firstName) gFirst = existingFirestoreUser.firstName;
      if (existingFirestoreUser.lastName) gLast = existingFirestoreUser.lastName;
    } else if (existingAccountLookup.dmeStaff) {
      const staff = existingAccountLookup.dmeStaff;
      const staffRole: AdminStaffRole = staff.role || 'chefe_reparticao';
      const dmeCfg = ADMIN_ROLES_CONFIG.find((c) => c.id === staffRole) || ADMIN_ROLES_CONFIG[0];
      resolvedRole = 'admin';
      resolvedScope = 'administracao';
      resolvedSchoolRole = undefined;
      resolvedAdminRole = staffRole;
      resolvedCargo = staff.cargoTitle || dmeCfg.label;
      resolvedPrefix = dmeCfg.prefix;
      resolvedSchoolName = staff.department || 'Direcção Municipal da Educação de Quêssua';
      resolvedSchoolId = undefined;
      const sNames = (staff.name || '').trim().split(' ');
      if (sNames[0]) gFirst = sNames[0];
      if (sNames.length > 1) gLast = sNames.slice(1).join(' ');
    } else if (existingAccountLookup.teacher) {
      const t = existingAccountLookup.teacher;
      resolvedRole = 'professor';
      resolvedScope = 'escola';
      resolvedSchoolRole = 'professor';
      resolvedAdminRole = undefined;
      resolvedCargo = 'Professor(a) / Docente';
      resolvedPrefix = 'Prof.';
      resolvedSchoolName = t.schoolName || registeredSchools[0]?.name || 'Unidade Escolar';
      resolvedSchoolId = registeredSchools[0]?.id;
      if (t.name) {
        const tNames = t.name.trim().split(' ');
        if (tNames[0]) gFirst = tNames[0];
        if (tNames.length > 1) gLast = tNames.slice(1).join(' ');
      }
    } else if (existingAccountLookup.director) {
      const d = existingAccountLookup.director;
      resolvedRole = 'diretor';
      resolvedScope = 'escola';
      resolvedSchoolRole = 'diretor_geral';
      resolvedAdminRole = undefined;
      resolvedCargo = 'Director(a) Geral';
      resolvedPrefix = 'Director';
      resolvedSchoolName = d.schoolName || d.nomeEscola || registeredSchools[0]?.name || 'Unidade Escolar';
      resolvedSchoolId = registeredSchools[0]?.id;
      const dirFullName = d.name || d.nomeCompleto || '';
      if (dirFullName) {
        const dNames = dirFullName.trim().split(' ');
        if (dNames[0]) gFirst = dNames[0];
        if (dNames.length > 1) gLast = dNames.slice(1).join(' ');
      }
    } else if (manualRoleHint === 'professor') {
      resolvedRole = 'professor';
      resolvedScope = 'escola';
      resolvedSchoolRole = 'professor';
      resolvedAdminRole = undefined;
      resolvedCargo = 'Professor(a) / Docente';
      resolvedPrefix = 'Prof.';
      resolvedSchoolName = registeredSchools[0]?.name || 'Unidade Escolar';
      resolvedSchoolId = registeredSchools[0]?.id;
    } else if (manualRoleHint === 'diretor') {
      resolvedRole = 'diretor';
      resolvedScope = 'escola';
      resolvedSchoolRole = 'diretor_geral';
      resolvedAdminRole = undefined;
      resolvedCargo = 'Director(a) Geral';
      resolvedPrefix = 'Director';
      resolvedSchoolName = registeredSchools[0]?.name || 'Unidade Escolar';
      resolvedSchoolId = registeredSchools[0]?.id;
    }

    createGoogleUserSession(cleanEmail, `${gFirst} ${gLast}`.trim(), uid, photoURL);

    const googleAccount: UserAccount = {
      id: uid || (isSuperAdmin ? 'usr_belizio_admin' : isDirectorMunicipal ? 'usr_dme_quessua' : 'usr_google_' + Date.now()),
      firstName: gFirst,
      lastName: gLast,
      email: cleanEmail,
      role: resolvedRole,
      scope: resolvedScope,
      schoolRole: resolvedSchoolRole,
      adminRole: resolvedAdminRole,
      cargoTitle: resolvedCargo,
      schoolName: resolvedSchoolName || (resolvedScope === 'administracao' ? 'Direcção Municipal da Educação de Quessua' : registeredSchools[0]?.name || 'Unidade Escolar'),
      schoolId: resolvedSchoolId || (resolvedScope === 'escola' ? registeredSchools[0]?.id : undefined),
      municipalityOrDepartment: 'Quessua',
      titlePrefix: resolvedPrefix,
      greeting: `Olá ${resolvedPrefix} ${gFirst}`,
      avatar: photoURL || undefined,
      status: 'ativo',
    };

    setSuccessMsg(`Autenticado com sucesso via Google (${cleanEmail})! A aceder à plataforma...`);
    setTimeout(() => {
      onLoginSuccess(googleAccount);
    }, 400);
  };

  const handleGoogleSignInFlow = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      setGoogleNotice(null);
      const res = await googleSignIn();
      if (!res || res.cancelled) {
        return;
      }
      if (res.user && res.user.email) {
        await completeGoogleLogin(
          res.user.email,
          res.user.displayName || 'Utilizador Google',
          res.user.uid,
          res.user.photoURL
        );
        return;
      }
      if (res.popupBlocked) {
        setErrorMsg(
          'O pop-up de início de sessão do Google foi bloqueado pelo navegador. Por favor, permita pop-ups para este site e tente novamente.'
        );
        return;
      }
      setErrorMsg(
        'Não foi possível concluir a autenticação padrão com o Google. Tente novamente.'
      );
    } catch (err: any) {
      console.warn('Google sign-in tentativa capturada:', err?.message || err);
      setErrorMsg(
        'Não foi possível concluir a autenticação padrão com o Google. Tente novamente.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    setMode((prevMode) => {
      if (prevMode !== initialMode) {
        setErrorMsg(null);
        setSuccessMsg(null);
        setGoogleNotice(null);
        setIsGoogleLockedEmail(false);
        setGoogleAuthMeta(null);
        if (initialMode === 'register') {
          setRegStep(1);
        }
      }
      return initialMode;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [initialMode]);

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    onModeChange?.(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setGoogleNotice(null);
    setIsGoogleLockedEmail(false);
    setGoogleAuthMeta(null);
    setForgotPasswordOpen(false);
    setRegistrationSubmitted(false);
    setStepErrors({});
    setFieldErrors({});
    if (newMode === 'register') {
      setRegStep(1);
    }
  };

  const clearStepValidation = (step: number) => {
    setStepErrors((prev) => {
      const next = { ...prev };
      delete next[step];
      return next;
    });
    setFieldErrors({});
    setErrorMsg(null);
  };

  const clearSingleFieldError = (fieldName: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const validateRegistrationStep = (step: 1 | 2 | 3): boolean => {
    clearStepValidation(step);

    if (step === 1) {
      if (!institutionalScope) {
        setStepErrors((prev) => ({ ...prev, 1: 'Selecione o âmbito institucional.' }));
        return false;
      }
      if (!hasChosenRole) {
        setStepErrors((prev) => ({ ...prev, 1: 'Selecione a função que desempenha na instituição.' }));
        return false;
      }
      if (institutionalScope === 'administracao' && occupiedDmeCargos[adminRole]?.occupied) {
        setStepErrors((prev) => ({
          ...prev,
          1: `O cargo selecionado já se encontra ocupado (${occupiedDmeCargos[adminRole]?.holderName}). Selecione uma função disponível.`,
        }));
        return false;
      }
      return true;
    }

    if (step === 2) {
      const newFieldErrors: { [key: string]: string } = {};
      if (!regMunicipalityValue) {
        newFieldErrors.municipality = 'Selecione o município.';
        setFieldErrors(newFieldErrors);
        setStepErrors((prev) => ({ ...prev, 2: 'Informe o município ou repartição.' }));
        return false;
      }
      if (institutionalScope === 'escola' && !selectedSchoolId) {
        newFieldErrors.school = 'Selecione a unidade escolar.';
        setFieldErrors(newFieldErrors);
        setStepErrors((prev) => ({ ...prev, 2: 'Selecione a unidade escolar associada à sua conta.' }));
        return false;
      }
      return true;
    }

    if (step === 3) {
      const newFieldErrors: { [key: string]: string } = {};
      const requiredChecks: [string, string, string][] = [
        ['bi', biNumber, 'Informe o número do Bilhete de Identidade.'],
        ['phone', phone, 'Informe o seu telefone.'],
        ['firstName', firstName, 'Informe o seu primeiro nome.'],
        ['lastName', lastName, 'Informe o seu sobrenome.'],
        ['email', email, 'Informe o seu e-mail institucional.'],
        ['password', password, 'Defina uma senha.'],
      ];

      for (const [key, val, msg] of requiredChecks) {
        if (!val.trim()) {
          newFieldErrors[key] = msg;
          setFieldErrors(newFieldErrors);
          setStepErrors((prev) => ({ ...prev, 3: msg }));
          return false;
        }
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newFieldErrors.email = 'Informe um e-mail válido.';
        setFieldErrors(newFieldErrors);
        setStepErrors((prev) => ({ ...prev, 3: 'Informe um e-mail institucional válido.' }));
        return false;
      }

      if (password.length < 6) {
        newFieldErrors.password = 'A senha deve ter pelo menos 6 caracteres.';
        setFieldErrors(newFieldErrors);
        setStepErrors((prev) => ({ ...prev, 3: 'A senha deve ter pelo menos 6 caracteres.' }));
        return false;
      }

      if (!confirmPassword.trim()) {
        newFieldErrors.passwordConfirm = 'Confirme a sua senha.';
        setFieldErrors(newFieldErrors);
        setStepErrors((prev) => ({ ...prev, 3: 'Confirme a sua senha.' }));
        return false;
      }

      if (password !== confirmPassword) {
        newFieldErrors.passwordConfirm = 'As senhas não coincidem.';
        setFieldErrors(newFieldErrors);
        setStepErrors((prev) => ({ ...prev, 3: 'As senhas informadas não coincidem.' }));
        return false;
      }

      if (!agreeTerms) {
        newFieldErrors.terms = 'Aceite os termos de uso e a política de privacidade.';
        setFieldErrors(newFieldErrors);
        setStepErrors((prev) => ({ ...prev, 3: 'Aceite os termos de uso e a política de privacidade.' }));
        return false;
      }

      return true;
    }

    return true;
  };

  const handleNextRegStep = () => {
    if (!validateRegistrationStep(regStep)) return;
    if (regStep < 3) {
      setRegStep((prev) => (prev + 1) as 1 | 2 | 3);
      if (window.innerWidth < 1000) {
        const panel = document.getElementById('sigre-register-form-panel');
        panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePrevRegStep = () => {
    if (regStep > 1) {
      clearStepValidation(regStep);
      setRegStep((prev) => (prev - 1) as 1 | 2 | 3);
      if (window.innerWidth < 1000) {
        const panel = document.getElementById('sigre-register-form-panel');
        panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleFillSchoolPreset = (roleId: SchoolStaffRole) => {
    const config = SCHOOL_ROLES_CONFIG.find((c) => c.id === roleId);
    if (!config) return;
    setInstitutionalScope('escola');
    setSchoolRole(roleId);
    setEmail(config.defaultEmail);
    setPassword('Ucore@2026');
    setFirstName(config.defaultFirst);
    setLastName(config.defaultLast);
    setSchoolOrUnitName('Unidade Escolar Municipal');
    setAgreeTerms(true);
  };

  const handleFillAdminPreset = (roleId: AdminStaffRole) => {
    const config = ADMIN_ROLES_CONFIG.find((c) => c.id === roleId);
    if (!config) return;
    setInstitutionalScope('administracao');
    setAdminRole(roleId);
    setEmail(config.defaultEmail);
    if (roleId === 'diretor_municipal') {
      setPassword('quessua000');
    } else {
      setPassword('Ucore@2026');
    }
    setFirstName(config.defaultFirst);
    setLastName(config.defaultLast);
    setSchoolOrUnitName('Direcção Municipal da Educação de Quessua');
    setAgreeTerms(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'login') {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password) {
        setErrorMsg('Por favor, informe o seu e-mail e a sua palavra-passe.');
        return;
      }

      setLoading(true);
      onAuthLoadingChange?.(true, 'login');

      try {
        // 1. Sync applications and user records from cloud/server before authenticating
        await syncApplicationsFromServer().catch(() => {});
        let firestoreUser: UserAccount | null = null;
        try {
          firestoreUser = await fetchUserFromFirestore(cleanEmail);
        } catch {}

        const accountLookup = findRegisteredAccountByEmail(cleanEmail);
        const hasRegisteredAccount = Boolean(accountLookup.exists || firestoreUser);

        if (!hasRegisteredAccount) {
          setLoading(false);
          onAuthLoadingChange?.(false);
          setErrorMsg(
            'Nenhuma conta registada foi localizada para este endereço de e-mail. Crie a sua própria conta antes de iniciar sessão.'
          );
          return;
        }

        // 2. Strict 100% Exact Password Verification (zero tolerance for 1-digit differences or accessing someone else's account)
        const remoteVerifier = accountLookup.app?.passwordVerifier || firestoreUser?.passwordVerifier;
        if (!verifyPassword(cleanEmail, password, remoteVerifier)) {
          setLoading(false);
          onAuthLoadingChange?.(false);
          setErrorMsg(
            'A palavra-passe introduzida está incorreta para esta conta. Por segurança, o acesso foi bloqueado — verifique todos os caracteres e dígitos.'
          );
          return;
        }

        // 3. Resolve exact role, scope, and cargo from the authenticated user's record
        //    (NEVER treat DME staff as School Directors or as the Municipal Director!)
        const isMasterAdmin =
          cleanEmail === 'dmedoquessua@gmail.com' || cleanEmail === 'beliziodos20@gmail.com';

        let matchedScope: 'escola' | 'administracao' = 'escola';
        let matchedSchoolRole: SchoolStaffRole | undefined = undefined;
        let matchedAdminRole: AdminStaffRole | undefined = undefined;
        let resolvedRole: 'admin' | 'diretor' | 'professor' = 'diretor';
        let resolvedCargoTitle = '';
        let resolvedPrefix = '';
        let resolvedFirst = firstName.trim() || 'Utilizador';
        let resolvedLast = lastName.trim() || 'Sigre';
        let resolvedSchoolName = 'Unidade Escolar';
        let resolvedSchoolId: string | undefined = undefined;
        let resolvedUserId = 'usr_' + Date.now();

        if (isMasterAdmin) {
          matchedScope = 'administracao';
          matchedAdminRole = cleanEmail === 'beliziodos20@gmail.com' ? 'admin_sistema' : 'diretor_municipal';
          resolvedRole = 'admin';
          resolvedCargoTitle =
            cleanEmail === 'beliziodos20@gmail.com'
              ? 'Administrador de Sistema Sigre (Super Admin)'
              : 'Director Municipal da Educação de Quessua';
          resolvedPrefix = cleanEmail === 'beliziodos20@gmail.com' ? 'Admin.' : 'Dr.';
          resolvedFirst = cleanEmail === 'beliziodos20@gmail.com' ? 'Belízio' : 'Director Municipal';
          resolvedLast = cleanEmail === 'beliziodos20@gmail.com' ? 'Administrador' : 'da Educação';
          resolvedSchoolName = 'Direcção Municipal da Educação de Quêssua';
          resolvedUserId = cleanEmail === 'beliziodos20@gmail.com' ? 'usr_belizio_admin' : 'usr_dme_quessua';
        } else if (accountLookup.app) {
          const app = accountLookup.app;
          resolvedUserId = app.userId || app.id || resolvedUserId;
          const nameParts = (app.fullName || '').trim().split(' ');
          if (nameParts[0]) resolvedFirst = nameParts[0];
          if (nameParts.length > 1) resolvedLast = nameParts.slice(1).join(' ');

          const isDmeStaff =
            app.scope === 'administracao' || app.type === 'membro_dme' || Boolean(app.adminRole);

          if (isDmeStaff) {
            // Pessoal da Direcção Municipal (Chefe de Repartição, Inspector Escolar, Técnico DME, etc.)
            let detectedAdminRole: AdminStaffRole = app.adminRole || 'chefe_reparticao';
            if (!app.adminRole && app.roleRequested) {
              const reqLow = app.roleRequested.toLowerCase();
              if (reqLow.includes('inspetor') || reqLow.includes('inspector')) {
                detectedAdminRole = 'inspetor_escolar';
              } else if (reqLow.includes('estatística') || reqLow.includes('estatistica') || reqLow.includes('planeamento')) {
                detectedAdminRole = 'tecnico_estatistica';
              } else if (reqLow.includes('recursos humanos') || reqLow.includes('secretaria')) {
                detectedAdminRole = 'tecnico_recursos_humanos';
              } else {
                detectedAdminRole = 'chefe_reparticao';
              }
            }
            const dmeCfg = ADMIN_ROLES_CONFIG.find((c) => c.id === detectedAdminRole) || ADMIN_ROLES_CONFIG[0];
            matchedScope = 'administracao';
            matchedAdminRole = detectedAdminRole;
            matchedSchoolRole = undefined;
            resolvedRole = 'admin';
            resolvedCargoTitle = app.roleRequested || dmeCfg.label;
            resolvedPrefix = dmeCfg.prefix;
            resolvedSchoolName = 'Direcção Municipal da Educação de Quêssua';
            resolvedSchoolId = undefined;
          } else {
            // Pessoal de Unidade Escolar (Director de Escola, Subdirector, Professor, Secretário Escolar)
            const isProf = app.type === 'professor' || app.schoolRole === 'professor';
            const detectedSchoolRole: SchoolStaffRole =
              app.schoolRole || (isProf ? 'professor' : 'diretor_geral');
            const schCfg = SCHOOL_ROLES_CONFIG.find((c) => c.id === detectedSchoolRole) || SCHOOL_ROLES_CONFIG[0];
            matchedScope = 'escola';
            matchedSchoolRole = detectedSchoolRole;
            matchedAdminRole = undefined;
            resolvedRole = isProf ? 'professor' : 'diretor';
            resolvedCargoTitle = app.roleRequested || schCfg.label;
            resolvedPrefix = schCfg.prefix;
            resolvedSchoolName = app.schoolName || registeredSchools[0]?.name || 'Unidade Escolar';
            resolvedSchoolId = app.schoolId || registeredSchools[0]?.id;
          }
        } else if (accountLookup.dmeStaff) {
          const staff = accountLookup.dmeStaff;
          const staffRole: AdminStaffRole = staff.role || 'chefe_reparticao';
          const dmeCfg = ADMIN_ROLES_CONFIG.find((c) => c.id === staffRole) || ADMIN_ROLES_CONFIG[0];
          const nameParts = (staff.name || '').trim().split(' ');
          if (nameParts[0]) resolvedFirst = nameParts[0];
          if (nameParts.length > 1) resolvedLast = nameParts.slice(1).join(' ');
          matchedScope = 'administracao';
          matchedAdminRole = staffRole;
          matchedSchoolRole = undefined;
          resolvedRole = 'admin';
          resolvedCargoTitle = staff.cargoTitle || dmeCfg.label;
          resolvedPrefix = dmeCfg.prefix;
          resolvedSchoolName = staff.department || 'Direcção Municipal da Educação de Quêssua';
          resolvedUserId = staff.id || resolvedUserId;
        } else if (firestoreUser) {
          resolvedUserId = firestoreUser.id || resolvedUserId;
          resolvedFirst = firestoreUser.firstName || resolvedFirst;
          resolvedLast = firestoreUser.lastName || resolvedLast;
          matchedScope = firestoreUser.scope || (firestoreUser.role === 'admin' ? 'administracao' : 'escola');
          matchedSchoolRole = firestoreUser.schoolRole;
          matchedAdminRole = firestoreUser.adminRole;
          resolvedRole =
            firestoreUser.role === 'admin' || firestoreUser.role === 'diretor' || firestoreUser.role === 'professor'
              ? firestoreUser.role
              : 'diretor';
          resolvedCargoTitle = firestoreUser.cargoTitle || 'Utilizador Institucional';
          resolvedPrefix = firestoreUser.titlePrefix || '';
          resolvedSchoolName = firestoreUser.schoolName || 'Unidade Escolar';
          resolvedSchoolId = firestoreUser.schoolId;
        } else if (accountLookup.teacher) {
          const t = accountLookup.teacher;
          const nameParts = (t.name || '').trim().split(' ');
          if (nameParts[0]) resolvedFirst = nameParts[0];
          if (nameParts.length > 1) resolvedLast = nameParts.slice(1).join(' ');
          matchedScope = 'escola';
          matchedSchoolRole = 'professor';
          matchedAdminRole = undefined;
          resolvedRole = 'professor';
          resolvedCargoTitle = 'Professor(a) / Docente';
          resolvedPrefix = 'Prof.';
          resolvedSchoolName = t.schoolName || registeredSchools[0]?.name || 'Unidade Escolar';
          resolvedUserId = t.id || resolvedUserId;
        } else if (accountLookup.director) {
          const d = accountLookup.director;
          const nameParts = (d.name || d.nomeCompleto || '').trim().split(' ');
          if (nameParts[0]) resolvedFirst = nameParts[0];
          if (nameParts.length > 1) resolvedLast = nameParts.slice(1).join(' ');
          matchedScope = 'escola';
          matchedSchoolRole = 'diretor_geral';
          matchedAdminRole = undefined;
          resolvedRole = 'diretor';
          resolvedCargoTitle = 'Diretor(a) Geral';
          resolvedPrefix = 'Diretor Geral';
          resolvedSchoolName = d.schoolName || d.nomeEscola || registeredSchools[0]?.name || 'Unidade Escolar';
          resolvedUserId = d.id || resolvedUserId;
        }

        const loggedUser: UserAccount = {
          id: resolvedUserId,
          firstName: resolvedFirst,
          lastName: resolvedLast,
          email: cleanEmail,
          role: resolvedRole,
          scope: matchedScope,
          schoolRole: matchedScope === 'escola' ? matchedSchoolRole : undefined,
          adminRole: matchedScope === 'administracao' ? matchedAdminRole : undefined,
          cargoTitle: resolvedCargoTitle,
          schoolName: resolvedSchoolName,
          schoolId: matchedScope === 'escola' ? resolvedSchoolId : undefined,
          municipalityOrDepartment: selectedMunicipality || 'Quêssua (Malanje)',
          titlePrefix: resolvedPrefix,
          greeting: `Olá ${resolvedPrefix ? resolvedPrefix + ' ' : ''}${resolvedFirst}`,
          rememberMe,
        };

        const approvalCheck = checkUserApprovalStatus(loggedUser.id, cleanEmail);
        if (approvalCheck.app) {
          const app = approvalCheck.app;
          if (app.biNumber) loggedUser.biNumber = app.biNumber;
          if (app.phone) loggedUser.phone = app.phone;
          if (app.subject) loggedUser.subject = app.subject;
          if (app.gradeClass) loggedUser.gradeClass = app.gradeClass;
          if (app.nivelAcademico) loggedUser.nivelAcademico = app.nivelAcademico;
          if (typeof app.anosServico === 'number') loggedUser.anosServico = app.anosServico;
          if (app.regimeTrabalho) loggedUser.regimeTrabalho = app.regimeTrabalho;
          loggedUser.approverTargetRole = app.targetApproverRole;
          loggedUser.approverTargetSchoolName = app.schoolName;
        }

        if (approvalCheck.status === 'pendente' && !isMasterAdmin) {
          loggedUser.status = 'pendente';
          setSuccessMsg(
            `A sua candidatura como ${loggedUser.cargoTitle} continua em análise na Direção Municipal da Educação. Redirecionando para o acompanhamento...`
          );
        } else if (approvalCheck.status === 'rejeitado' && !isMasterAdmin) {
          setErrorMsg(
            `A sua candidatura foi recusada pela administração: ${approvalCheck.app?.rejectionReason || 'Contacte a direcção'}`
          );
          setLoading(false);
          onAuthLoadingChange?.(false);
          return;
        } else {
          loggedUser.status = 'ativo';
          setSuccessMsg(
            `Bem-vindo(a), ${loggedUser.greeting}! A aceder ao painel de ${loggedUser.cargoTitle}...`
          );
        }

        setLoading(false);
        setTimeout(() => {
          onAuthLoadingChange?.(false);
          onLoginSuccess(loggedUser);
        }, 650);
      } catch (err) {
        console.error('Erro ao autenticar:', err);
        setLoading(false);
        onAuthLoadingChange?.(false);
        setErrorMsg('Erro ao verificar as credenciais na base de dados. Tente novamente.');
      }
    } else {
      // Register validation (3-step wizard)
      if (!validateRegistrationStep(3)) {
        return;
      }

      setLoading(true);
      setErrorMsg(null);
      setStepErrors({});

      try {
        // Sync fresh applications from cloud before checking duplicate accounts or occupied DME cargos
        await syncApplicationsFromServer().catch(() => {});

        // 1. Block duplicate registration of an existing email or BI (no one can overwrite or hijack another user's account)
        const dupCheck = checkDuplicateRegistration(email.trim(), biNumber.trim());
        if (dupCheck.duplicate) {
          setLoading(false);
          onAuthLoadingChange?.(false);
          const msg = dupCheck.reason || 'Este e-mail ou BI já pertence a outro utilizador registado.';
          setErrorMsg(msg);
          setStepErrors((prev) => ({ ...prev, 3: msg }));
          return;
        }

        // Also check Firestore directly for duplicate email
        try {
          const existingCloudUser = await fetchUserFromFirestore(email.trim().toLowerCase());
          if (existingCloudUser && existingCloudUser.email) {
            setLoading(false);
            onAuthLoadingChange?.(false);
            const cloudMsg = `O e-mail "${email.trim()}" já pertence à conta de ${existingCloudUser.firstName} ${existingCloudUser.lastName}. Por segurança, ninguém pode aceder ou recriar a conta de outro utilizador.`;
            setErrorMsg(cloudMsg);
            setStepErrors((prev) => ({ ...prev, 3: cloudMsg }));
            return;
          }
        } catch {}

        // 2. If registering in Administração (DME), strictly block registering an already occupied cargo
        if (institutionalScope === 'administracao') {
          const freshOccupied = getOccupiedDmeCargos();
          const chosenDmeConfig = ADMIN_ROLES_CONFIG.find((c) => c.id === adminRole) || ADMIN_ROLES_CONFIG[0];
          if (freshOccupied[adminRole]?.occupied) {
            setLoading(false);
            onAuthLoadingChange?.(false);
            const occMsg = `O cargo de "${chosenDmeConfig.label}" na Direcção Municipal da Educação já se encontra ocupado (${freshOccupied[adminRole].holderName}). Através da existência da conta oficial da DME, não é permitido cadastrar outro utilizador com o mesmo cargo.`;
            setErrorMsg(occMsg);
            setStepErrors((prev) => ({ ...prev, 3: occMsg }));
            return;
          }
        }

        setSuccessMsg('A registrar a sua inscrição e a sincronizar na base de dados central...');
        onAuthLoadingChange?.(true, 'register');

        const userFirst = firstName.trim();

        const chosenConfig = institutionalScope === 'escola'
          ? (SCHOOL_ROLES_CONFIG.find(c => c.id === schoolRole) || SCHOOL_ROLES_CONFIG[0])
          : (ADMIN_ROLES_CONFIG.find(c => c.id === adminRole) || ADMIN_ROLES_CONFIG[0]);

        const prefix = chosenConfig.prefix;
        const baseRole = chosenConfig.baseRole;
        const cargoTitle = chosenConfig.label;
        const matchedSchool = registeredSchools.length > 0
          ? (registeredSchools.find((s) => s.id === selectedSchoolId) || registeredSchools[0])
          : null;
        const resolvedSchoolName = institutionalScope === 'escola'
          ? (matchedSchool?.name || schoolOrUnitName || 'Só Ciência da Educação')
          : 'Direcção Municipal da Educação de Quêssua';
        const resolvedSchoolId = institutionalScope === 'escola'
          ? (matchedSchool?.id || selectedSchoolId || 'sige-113013')
          : undefined;

        const isPending = true;

        const appType = institutionalScope === 'administracao'
          ? 'membro_dme'
          : schoolRole === 'diretor_geral'
          ? 'diretor'
          : schoolRole === 'professor'
          ? 'professor'
          : 'funcionario';

        const newUserId = googleAuthMeta?.uid || 'usr_' + Date.now();

        // Save exact password and generate deterministic verifier token
        const pwdRes = updatePassword(email.trim(), password);
        const passwordVerifier = pwdRes.verifier || encodePasswordVerifier(email.trim(), password);

        // Create pending application record directly targeted to dmedoquessua@gmail.com
        if (isPending) {
          const appId = `app-${appType}-${Date.now()}`;
          await savePendingApplicationAsync({
            id: appId,
            userId: newUserId,
            type: appType,
            scope: institutionalScope,
            schoolRole: institutionalScope === 'escola' ? schoolRole : undefined,
            adminRole: institutionalScope === 'administracao' ? adminRole : undefined,
            roleRequested: cargoTitle,
            fullName: `${userFirst} ${lastName.trim() || 'Sigre'}`.trim(),
            email: email.trim(),
            phone: phone.trim() || '+244 923 000 000',
            biNumber: biNumber.trim(),
            schoolName: resolvedSchoolName,
            schoolId: resolvedSchoolId,
            municipality: selectedMunicipality,
            targetApproverRole: 'admin',
            targetApproverEmail: 'dmedoquessua@gmail.com',
            approverDirectorName: 'Director Municipal da Educação (dmedoquessua@gmail.com)',
            subject: institutionalScope === 'escola' && schoolRole === 'professor' ? selectedSubject : undefined,
            gradeClass: institutionalScope === 'escola' && schoolRole === 'professor' ? selectedGradeClass : undefined,
            status: 'pendente',
            isPreRegistered: institutionalScope === 'escola' ? Boolean(preRegResult?.found) : false,
            preRegisteredDetails: institutionalScope === 'escola' ? preRegResult?.details : undefined,
            createdAt: new Date().toLocaleString('pt-AO'),
            passwordVerifier,
            notes:
              institutionalScope === 'administracao'
                ? `Inscrição para o cargo de ${cargoTitle} no quadro da Direcção Municipal da Educação de Quêssua. Enviada ao Director Municipal (dmedoquessua@gmail.com) para homologação.`
                : preRegResult?.found
                ? `Registro pré-existente localizado no sistema. Ficha associada automaticamente.`
                : `Inscrição de ${cargoTitle} (${resolvedSchoolName}) enviada diretamente ao Administrador Central (DME - dmedoquessua@gmail.com) para homologação ministerial.`,
          });
        }

        const newUser: UserAccount = {
          id: newUserId,
          firstName: userFirst,
          lastName: lastName.trim() || 'Sigre',
          email: email.trim(),
          role: baseRole,
          scope: institutionalScope,
          schoolRole: institutionalScope === 'escola' ? schoolRole : undefined,
          adminRole: institutionalScope === 'administracao' ? adminRole : undefined,
          cargoTitle: cargoTitle,
          schoolName: resolvedSchoolName,
          schoolId: resolvedSchoolId,
          municipalityOrDepartment: selectedMunicipality,
          titlePrefix: prefix,
          greeting: `Olá ${prefix} ${userFirst}`,
          avatar: googleAuthMeta?.photoURL || undefined,
          rememberMe: true,
          status: 'pendente',
          biNumber: biNumber.trim(),
          phone: phone.trim() || '+244 923 000 000',
          subject: institutionalScope === 'escola' && schoolRole === 'professor' ? selectedSubject : undefined,
          gradeClass: institutionalScope === 'escola' && schoolRole === 'professor' ? selectedGradeClass : undefined,
          isPreRegistered: institutionalScope === 'escola' ? Boolean(preRegResult?.found) : false,
          submittedAt: new Date().toLocaleString('pt-AO'),
          approverTargetRole: 'admin',
          approverTargetSchoolName: resolvedSchoolName,
          passwordVerifier,
        };

        // Persist user account directly to Firebase Firestore Cloud Database
        try {
          await saveUserToFirestore(newUser);
        } catch (err) {
          console.warn('[AuthPage] Erro ao sincronizar usuário no Firestore:', err);
        }

        setSubmittedUserAccount(newUser);
        setRegistrationSubmitted(true);
        setSuccessMsg(null);
        onAuthLoadingChange?.(false);
      } catch (err) {
        console.error('Erro ao registar utilizador:', err);
        const failMsg = 'Ocorreu um problema ao submeter a inscrição na base de dados central. Por favor, tente novamente.';
        setErrorMsg(failMsg);
        setStepErrors((prev) => ({ ...prev, 3: failMsg }));
        onAuthLoadingChange?.(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setForgotPasswordOpen(false);
    }, 2500);
  };

  return (
    <div 
      id="auth-full-page" 
      className="min-h-screen w-full bg-[#f2f5f8] text-[#173047] flex flex-col justify-between selection:bg-[#f4514a] selection:text-white font-sans"
    >
      <style>{`
        .sigre-register-scope {
          --coral: #f4514a;
          --coral-dark: #d9403b;
          --navy: #062a3d;
          --navy-soft: #0b3b51;
          --ink: #173047;
          --muted: #728297;
          --line: #dbe4ec;
          --line-dark: #c7d3df;
          --surface: #ffffff;
          --soft: #f5f8fb;
          --soft-blue: #edf5f9;
          --success: #168568;
          --warning: #a86900;
          --danger: #c43d36;
          --shadow: 0 20px 50px rgba(17, 48, 72, 0.12);
          --radius: 10px;
          width: min(100% - 40px, 1240px);
          margin: 32px auto 64px;
          color: var(--ink);
          line-height: 1.4;
        }
        .sigre-register-scope .register-shell {
          display: grid;
          grid-template-columns: minmax(320px, 0.8fr) minmax(0, 1.2fr);
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: var(--radius);
          background: var(--surface);
          box-shadow: var(--shadow);
        }
        .sigre-register-scope .visual-panel {
          position: relative;
          min-height: 770px;
          overflow: hidden;
          background: var(--navy);
        }
        .sigre-register-scope .visual-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
          filter: saturate(0.82);
        }
        .sigre-register-scope .visual-cover {
          position: absolute;
          inset: 0;
          background: rgba(3, 34, 49, 0.58);
        }
        .sigre-register-scope .visual-copy {
          position: absolute;
          right: 42px;
          bottom: 42px;
          left: 42px;
          z-index: 1;
          max-width: 360px;
          color: #ffffff;
        }
        .sigre-register-scope .visual-label {
          display: inline-flex;
          margin-bottom: 16px;
          color: #b9d2dc;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
        }
        .sigre-register-scope .visual-copy h2 {
          margin: 0;
          font-size: clamp(28px, 3vw, 42px);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: 0;
        }
        .sigre-register-scope .visual-copy h2 span {
          color: #ffb0aa;
        }
        .sigre-register-scope .visual-copy p {
          max-width: 300px;
          margin: 17px 0 0;
          color: #e3edf1;
          font-size: 14px;
        }
        .sigre-register-scope .form-panel {
          min-width: 0;
          padding: 42px clamp(26px, 4vw, 58px) 30px;
          background: #ffffff;
        }
        .sigre-register-scope .form-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
        }
        .sigre-register-scope .eyebrow {
          display: block;
          margin-bottom: 9px;
          color: var(--coral-dark);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.13em;
        }
        .sigre-register-scope .form-header h1 {
          margin: 0;
          color: var(--navy);
          font-size: clamp(28px, 3vw, 36px);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: 0;
        }
        .sigre-register-scope .form-subtitle {
          max-width: 410px;
          margin: 10px 0 0;
          color: var(--muted);
          font-size: 14px;
        }
        .sigre-register-scope .step-count {
          flex: 0 0 auto;
          padding-top: 7px;
          color: var(--muted);
          font-size: 12px;
          white-space: nowrap;
        }
        .sigre-register-scope .step-count strong {
          color: var(--navy);
          font-weight: 800;
        }
        .sigre-register-scope .progress {
          margin: 31px 0 38px;
        }
        .sigre-register-scope .progress-list {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 0;
          margin: 0;
          list-style: none;
        }
        .sigre-register-scope .progress-step {
          position: relative;
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
          padding-bottom: 14px;
          color: var(--muted);
        }
        .sigre-register-scope .progress-step::after {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          height: 3px;
          border-radius: 20px;
          background: var(--line);
          content: "";
        }
        .sigre-register-scope .progress-step.is-active,
        .sigre-register-scope .progress-step.is-complete {
          color: var(--navy);
        }
        .sigre-register-scope .progress-step.is-active::after,
        .sigre-register-scope .progress-step.is-complete::after {
          background: var(--coral);
        }
        .sigre-register-scope .progress-dot {
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 1px solid var(--line-dark);
          border-radius: 50%;
          background: #ffffff;
          color: var(--muted);
          font-size: 12px;
          font-weight: 800;
        }
        .sigre-register-scope .progress-step.is-active .progress-dot,
        .sigre-register-scope .progress-step.is-complete .progress-dot {
          border-color: var(--coral);
          background: var(--coral);
          color: #ffffff;
        }
        .sigre-register-scope .progress-copy {
          min-width: 0;
        }
        .sigre-register-scope .progress-copy strong,
        .sigre-register-scope .progress-copy small {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sigre-register-scope .progress-copy strong {
          font-size: 12px;
          font-weight: 800;
        }
        .sigre-register-scope .progress-copy small {
          margin-top: 1px;
          font-size: 11px;
        }
        .sigre-register-scope .step-heading {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          margin-bottom: 25px;
        }
        .sigre-register-scope .step-number {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 8px;
          background: #fff0ee;
          color: var(--coral-dark);
          font-size: 12px;
          font-weight: 900;
        }
        .sigre-register-scope .step-heading h2 {
          margin: 0;
          color: var(--navy);
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
        }
        .sigre-register-scope .step-heading p {
          margin: 5px 0 0;
          color: var(--muted);
          font-size: 13px;
        }
        .sigre-register-scope .field-group {
          min-width: 0;
          padding: 0;
          margin: 0;
          border: 0;
        }
        .sigre-register-scope .field-group + .field-group {
          padding-top: 28px;
          margin-top: 29px;
          border-top: 1px solid var(--line);
        }
        .sigre-register-scope .field-group legend {
          display: block;
          padding: 0;
          margin-bottom: 12px;
          color: var(--navy);
          font-size: 14px;
          font-weight: 800;
        }
        .sigre-register-scope .choice-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .sigre-register-scope .choice-grid--roles {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .sigre-register-scope .choice-card {
          position: relative;
          min-width: 0;
          min-height: 73px;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: #ffffff;
          color: var(--ink);
          text-align: left;
          cursor: pointer;
          transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
        }
        .sigre-register-scope .choice-card:hover:not(:disabled) {
          border-color: #99b4c5;
          transform: translateY(-1px);
        }
        .sigre-register-scope .choice-card.is-selected {
          border-color: var(--navy);
          background: var(--navy);
          color: #ffffff;
        }
        .sigre-register-scope .choice-card:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .sigre-register-scope .choice-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 8px;
          background: var(--soft-blue);
          color: var(--navy);
        }
        .sigre-register-scope .choice-card.is-selected .choice-icon {
          background: var(--coral);
          color: #ffffff;
        }
        .sigre-register-scope .choice-copy {
          min-width: 0;
        }
        .sigre-register-scope .choice-copy strong,
        .sigre-register-scope .choice-copy small {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sigre-register-scope .choice-copy strong {
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
        }
        .sigre-register-scope .choice-copy small {
          margin-top: 3px;
          color: var(--muted);
          font-size: 11px;
          line-height: 1.25;
        }
        .sigre-register-scope .choice-card.is-selected .choice-copy small {
          color: #d6e6ed;
        }
        .sigre-register-scope .choice-check {
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          margin-left: auto;
          flex: 0 0 auto;
          border: 1px solid var(--line);
          border-radius: 50%;
          color: transparent;
        }
        .sigre-register-scope .choice-card.is-selected .choice-check {
          border-color: #ffffff;
          color: #ffffff;
        }
        .sigre-register-scope .fields-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px 12px;
        }
        .sigre-register-scope .field--full {
          grid-column: 1 / -1;
        }
        .sigre-register-scope .field-label {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 7px;
          color: var(--navy);
          font-size: 12px;
          font-weight: 700;
        }
        .sigre-register-scope .required-mark {
          color: var(--coral-dark);
        }
        .sigre-register-scope .control {
          position: relative;
          display: flex;
          align-items: center;
        }
        .sigre-register-scope .control > svg {
          position: absolute;
          left: 14px;
          z-index: 1;
          width: 18px;
          height: 18px;
          color: #8aa0b4;
          pointer-events: none;
        }
        .sigre-register-scope .control input,
        .sigre-register-scope .control select {
          width: 100%;
          height: 48px;
          border: 1px solid var(--line);
          border-radius: 8px;
          outline: 0;
          background: #ffffff;
          color: var(--ink);
          font-size: 13px;
          transition: border-color 160ms ease, box-shadow 160ms ease;
        }
        .sigre-register-scope .control input {
          padding: 0 14px 0 44px;
        }
        .sigre-register-scope .control select {
          padding: 0 42px 0 44px;
          appearance: none;
          cursor: pointer;
        }
        .sigre-register-scope .control select:disabled {
          background: var(--soft);
          color: var(--muted);
          cursor: not-allowed;
        }
        .sigre-register-scope .control input::placeholder {
          color: #98aabd;
        }
        .sigre-register-scope .control input:focus,
        .sigre-register-scope .control select:focus {
          border-color: #7899ad;
          box-shadow: 0 0 0 3px rgba(36, 113, 143, 0.11);
        }
        .sigre-register-scope .control input.is-invalid,
        .sigre-register-scope .control select.is-invalid {
          border-color: var(--danger);
          box-shadow: 0 0 0 3px rgba(196, 61, 54, 0.09);
        }
        .sigre-register-scope .select-arrow {
          right: 14px;
          left: auto !important;
          color: #8196a8 !important;
        }
        .sigre-register-scope .password-control input {
          padding-right: 49px;
        }
        .sigre-register-scope .password-toggle {
          position: absolute;
          right: 7px;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #7890a4;
          cursor: pointer;
        }
        .sigre-register-scope .password-toggle:hover {
          background: var(--soft);
          color: var(--navy);
        }
        .sigre-register-scope .field-message {
          display: none;
          margin: 6px 0 0;
          color: var(--danger);
          font-size: 11px;
        }
        .sigre-register-scope .field.has-error .field-message {
          display: block;
        }
        .sigre-register-scope .school-summary {
          padding: 17px;
          margin-top: 18px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--soft);
        }
        .sigre-register-scope .school-summary__head,
        .sigre-register-scope .school-summary__meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sigre-register-scope .school-summary__head {
          justify-content: space-between;
          gap: 18px;
        }
        .sigre-register-scope .summary-code,
        .sigre-register-scope .summary-tag {
          display: inline-flex;
          align-items: center;
          min-height: 22px;
          padding: 0 8px;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 800;
        }
        .sigre-register-scope .summary-code {
          background: var(--navy);
          color: #ffffff;
        }
        .sigre-register-scope .summary-tag {
          margin-left: 4px;
          background: #daf4e9;
          color: var(--success);
        }
        .sigre-register-scope .summary-status {
          color: var(--success);
          font-size: 11px;
          font-weight: 700;
        }
        .sigre-register-scope .school-summary__name {
          margin-top: 12px;
          color: var(--navy);
          font-size: 14px;
          font-weight: 800;
        }
        .sigre-register-scope .school-summary__meta {
          flex-wrap: wrap;
          margin-top: 12px;
          color: var(--muted);
          font-size: 11px;
          gap: 14px;
        }
        .sigre-register-scope .school-summary__meta span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .sigre-register-scope .school-summary__meta svg {
          width: 14px;
          height: 14px;
          color: var(--coral-dark);
        }
        .sigre-register-scope .notice {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          padding: 14px;
          margin-top: 19px;
          border: 1px solid #f1d38b;
          border-radius: 8px;
          background: #fffaf0;
        }
        .sigre-register-scope .notice > svg {
          width: 18px;
          height: 18px;
          flex: 0 0 auto;
          margin-top: 1px;
          color: var(--warning);
        }
        .sigre-register-scope .notice strong,
        .sigre-register-scope .notice span {
          display: block;
        }
        .sigre-register-scope .notice strong {
          color: #754d05;
          font-size: 12px;
          font-weight: 800;
        }
        .sigre-register-scope .notice span {
          margin-top: 3px;
          color: #8b6c2d;
          font-size: 11px;
        }
        .sigre-register-scope .terms-row {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 21px;
          color: var(--muted);
          font-size: 12px;
          cursor: pointer;
        }
        .sigre-register-scope .terms-row input {
          width: 17px;
          height: 17px;
          flex: 0 0 auto;
          margin: 1px 0 0;
          accent-color: var(--coral);
          cursor: pointer;
        }
        .sigre-register-scope .terms-row a {
          color: var(--coral-dark);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .sigre-register-scope .terms-row.has-error {
          color: var(--danger);
        }
        .sigre-register-scope .step-error {
          padding: 12px 14px;
          margin-top: 20px;
          border: 1px solid #efb7b2;
          border-radius: 8px;
          background: #fff3f2;
          color: var(--danger);
          font-size: 12px;
          font-weight: 600;
        }
        .sigre-register-scope .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 25px;
          margin-top: 30px;
          border-top: 1px solid var(--line);
        }
        .sigre-register-scope .button {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 18px;
          border: 1px solid transparent;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
        }
        .sigre-register-scope .button svg {
          width: 18px;
          height: 18px;
        }
        .sigre-register-scope .button:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .sigre-register-scope .button:disabled {
          cursor: wait;
          opacity: 0.7;
          transform: none;
        }
        .sigre-register-scope .button-primary {
          background: var(--coral);
          color: #ffffff;
          box-shadow: 0 9px 18px rgba(244, 81, 74, 0.19);
        }
        .sigre-register-scope .button-primary:hover:not(:disabled) {
          background: var(--coral-dark);
        }
        .sigre-register-scope .button-secondary {
          border-color: var(--line-dark);
          background: #ffffff;
          color: var(--navy);
        }
        .sigre-register-scope .button-secondary:hover:not(:disabled) {
          border-color: #91a9b9;
          background: var(--soft);
        }
        .sigre-register-scope .login-footer {
          margin: 24px 0 0;
          color: var(--muted);
          font-size: 12px;
          text-align: center;
        }
        .sigre-register-scope .login-footer button,
        .sigre-register-scope .login-footer a {
          color: var(--coral-dark);
          font-weight: 800;
          background: none;
          border: 0;
          padding: 0;
          margin-left: 4px;
          cursor: pointer;
        }
        .sigre-register-scope .success-state {
          padding: 48px 10px 24px;
          text-align: center;
        }
        .sigre-register-scope .success-icon {
          width: 62px;
          height: 62px;
          display: grid;
          place-items: center;
          margin: 0 auto 20px;
          border-radius: 50%;
          background: #daf4e9;
          color: var(--success);
        }
        .sigre-register-scope .success-icon svg {
          width: 29px;
          height: 29px;
        }
        .sigre-register-scope .success-state h2 {
          margin: 0;
          color: var(--navy);
          font-size: 25px;
          font-weight: 800;
        }
        .sigre-register-scope .success-state p {
          max-width: 390px;
          margin: 10px auto 24px;
          color: var(--muted);
          font-size: 14px;
        }
        @media (max-width: 1000px) {
          .sigre-register-scope .register-shell {
            grid-template-columns: 1fr;
          }
          .sigre-register-scope .visual-panel {
            min-height: 300px;
            max-height: 360px;
          }
          .sigre-register-scope .visual-copy {
            right: 28px;
            bottom: 28px;
            left: 28px;
          }
          .sigre-register-scope .visual-copy h2 {
            font-size: 32px;
          }
          .sigre-register-scope .form-panel {
            padding: 38px clamp(24px, 5vw, 54px) 30px;
          }
        }
        @media (max-width: 640px) {
          .sigre-register-scope {
            width: min(100% - 28px, 1240px);
            margin-top: 15px;
            margin-bottom: 32px;
          }
          .sigre-register-scope .visual-panel {
            min-height: 245px;
          }
          .sigre-register-scope .visual-copy {
            right: 21px;
            bottom: 22px;
            left: 21px;
          }
          .sigre-register-scope .visual-label {
            margin-bottom: 10px;
            font-size: 10px;
          }
          .sigre-register-scope .visual-copy h2 {
            font-size: 28px;
          }
          .sigre-register-scope .visual-copy p {
            display: none;
          }
          .sigre-register-scope .form-panel {
            padding: 30px 18px 24px;
          }
          .sigre-register-scope .form-header {
            display: block;
          }
          .sigre-register-scope .step-count {
            padding-top: 12px;
          }
          .sigre-register-scope .progress {
            margin: 25px 0 31px;
          }
          .sigre-register-scope .progress-list {
            gap: 7px;
          }
          .sigre-register-scope .progress-step {
            justify-content: center;
          }
          .sigre-register-scope .progress-copy small {
            display: none;
          }
          .sigre-register-scope .progress-copy strong {
            font-size: 11px;
          }
          .sigre-register-scope .choice-grid,
          .sigre-register-scope .choice-grid--roles,
          .sigre-register-scope .fields-grid {
            grid-template-columns: 1fr;
          }
          .sigre-register-scope .field--full {
            grid-column: auto;
          }
          .sigre-register-scope .choice-card {
            min-height: 65px;
          }
          .sigre-register-scope .form-actions {
            flex-direction: column-reverse;
          }
          .sigre-register-scope .form-actions .button {
            width: 100%;
          }
          .sigre-register-scope .school-summary__head {
            align-items: flex-start;
            flex-direction: column;
            gap: 9px;
          }
        }
      `}</style>

      {/* Top Header Bar (when standalone) */}
      {!hideHeader && (
        <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
            {/* Logo */}
            <button
              id="auth-header-logo-btn"
              onClick={onBackToHome}
              className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-1.5 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300">
                <img src="/favicon.png" alt="Sigre" className="w-7 h-7 object-contain" />
              </div>
              <span className="text-2xl font-black tracking-tight text-[#002133]">
                Sigre
              </span>
            </button>

            {/* Navigation controls */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                id="auth-back-home-btn"
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#f75142] transition-colors cursor-pointer mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Início</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="tab-login-btn"
                  onClick={() => switchMode('login')}
                  className={`text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-slate-100 text-[#002133] font-bold'
                      : 'text-slate-600 hover:text-[#002133]'
                  }`}
                >
                  Entrar
                </button>
                <button
                  id="tab-register-btn"
                  onClick={() => switchMode('register')}
                  className={`text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs ${
                    mode === 'register'
                      ? 'bg-[#002133] text-white'
                      : 'bg-[#f75142] hover:bg-[#e04436] text-white'
                  }`}
                >
                  Inscreva-se
                </button>
              </div>
            </div>
          </div>
          <div className="w-full h-[2px] bg-gradient-to-r from-[#f75142] via-[#f75142]/80 to-[#002133]" />
        </header>
      )}

      {mode === 'register' ? (
        /* REORGANIZED 3-STEP REGISTRATION VIEW */
        <main className="sigre-register-scope" id="auth-card-container">
          <section className="register-shell" aria-label="Criação de conta SIGRE">
            <aside className="visual-panel">
              <img
                className="visual-image"
                src={teacherImg}
                alt="Profissional de educação"
                referrerPolicy="no-referrer"
              />
              <div className="visual-cover" />
              <div className="visual-copy">
                <span className="visual-label">GESTÃO ESCOLAR</span>
                <h2>
                  A sua escola,
                  <br />
                  <span>mais conectada.</span>
                </h2>
                <p>Uma única conta para gerir o seu acesso institucional.</p>
              </div>
            </aside>

            <section className="form-panel" id="sigre-register-form-panel">
              <div className="form-header">
                <div>
                  <span className="eyebrow">REGISTO INSTITUCIONAL</span>
                  <h1>Crie a sua conta</h1>
                  <p className="form-subtitle">
                    Preencha apenas os dados necessários para solicitar o acesso.
                  </p>
                </div>

                <div className="step-count">
                  Passo <strong id="currentStep">{regStep}</strong> de 3
                </div>
              </div>

              <nav className="progress" aria-label="Progresso do registo">
                <ol className="progress-list">
                  <li
                    className={`progress-step ${regStep === 1 ? 'is-active' : ''} ${regStep > 1 ? 'is-complete' : ''}`}
                    data-progress="1"
                    aria-current={regStep === 1 ? 'step' : undefined}
                  >
                    <span className="progress-dot">1</span>
                    <span className="progress-copy">
                      <strong>Perfil</strong>
                      <small>Função</small>
                    </span>
                  </li>

                  <li
                    className={`progress-step ${regStep === 2 ? 'is-active' : ''} ${regStep > 2 ? 'is-complete' : ''}`}
                    data-progress="2"
                    aria-current={regStep === 2 ? 'step' : undefined}
                  >
                    <span className="progress-dot">2</span>
                    <span className="progress-copy">
                      <strong>Instituição</strong>
                      <small>Escola</small>
                    </span>
                  </li>

                  <li
                    className={`progress-step ${regStep === 3 ? 'is-active' : ''}`}
                    data-progress="3"
                    aria-current={regStep === 3 ? 'step' : undefined}
                  >
                    <span className="progress-dot">3</span>
                    <span className="progress-copy">
                      <strong>Conta</strong>
                      <small>Dados pessoais</small>
                    </span>
                  </li>
                </ol>
              </nav>

              {googleNotice && !registrationSubmitted && (
                <div className="notice" style={{ marginBottom: 20, marginTop: 0 }}>
                  <Sparkles />
                  <div>
                    <strong>Conta Google verificada ({email})</strong>
                    <span>{googleNotice}</span>
                  </div>
                </div>
              )}

              {!registrationSubmitted ? (
                <form id="signupForm" onSubmit={handleSubmit} noValidate>
                  {/* ETAPA 1 */}
                  {regStep === 1 && (
                    <section className="form-step" data-step="1" aria-labelledby="step1-title">
                      <div className="step-heading">
                        <span className="step-number">01</span>
                        <div>
                          <h2 id="step1-title">Defina o seu perfil</h2>
                          <p>Escolha o contexto e a função que desempenha.</p>
                        </div>
                      </div>

                      <fieldset className="field-group">
                        <legend>Âmbito institucional</legend>

                        <div className="choice-grid">
                          <button
                            type="button"
                            className={`choice-card ${institutionalScope === 'escola' ? 'is-selected' : ''}`}
                            data-choice-group="scope"
                            data-value="escolar"
                            aria-pressed={institutionalScope === 'escola'}
                            onClick={() => {
                              setInstitutionalScope('escola');
                              clearStepValidation(1);
                            }}
                          >
                            <span className="choice-icon">
                              <School className="w-[18px] h-[18px]" />
                            </span>

                            <span className="choice-copy">
                              <strong>Âmbito escolar</strong>
                              <small>Direção, coordenação e docência</small>
                            </span>

                            <span className="choice-check">
                              <Check className="w-[13px] h-[13px]" />
                            </span>
                          </button>

                          <button
                            type="button"
                            className={`choice-card ${institutionalScope === 'administracao' ? 'is-selected' : ''}`}
                            data-choice-group="scope"
                            data-value="administracao"
                            aria-pressed={institutionalScope === 'administracao'}
                            onClick={() => {
                              setInstitutionalScope('administracao');
                              clearStepValidation(1);
                            }}
                          >
                            <span className="choice-icon">
                              <Landmark className="w-[18px] h-[18px]" />
                            </span>

                            <span className="choice-copy">
                              <strong>Administração</strong>
                              <small>Gestão municipal e inspeção</small>
                            </span>

                            <span className="choice-check">
                              <Check className="w-[13px] h-[13px]" />
                            </span>
                          </button>
                        </div>
                      </fieldset>

                      <fieldset className="field-group">
                        <legend>Função na instituição</legend>

                        {institutionalScope === 'escola' ? (
                          <div className="choice-grid choice-grid--roles">
                            {[
                              {
                                id: 'diretor_geral' as SchoolStaffRole,
                                dataValue: 'direcao',
                                title: 'Direção',
                                subtitle: 'Gestão escolar',
                                Icon: Briefcase,
                              },
                              {
                                id: 'subdiretor_pedagogico' as SchoolStaffRole,
                                dataValue: 'coordenacao',
                                title: 'Coordenação',
                                subtitle: 'Área pedagógica',
                                Icon: Users,
                              },
                              {
                                id: 'subdiretor_administrativo' as SchoolStaffRole,
                                dataValue: 'administracao',
                                title: 'Administração',
                                subtitle: 'Gestão administrativa',
                                Icon: ShieldCheck,
                              },
                              {
                                id: 'professor' as SchoolStaffRole,
                                dataValue: 'docencia',
                                title: 'Docência',
                                subtitle: 'Professor ou professora',
                                Icon: BookOpen,
                              },
                              {
                                id: 'secretario_escolar' as SchoolStaffRole,
                                dataValue: 'secretaria',
                                title: 'Secretaria',
                                subtitle: 'Atendimento escolar',
                                Icon: ClipboardList,
                              },
                            ].map((item) => {
                              const isSelected = hasChosenRole && schoolRole === item.id;
                              const RoleIcon = item.Icon;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  className={`choice-card ${isSelected ? 'is-selected' : ''}`}
                                  data-choice-group="role"
                                  data-value={item.dataValue}
                                  aria-pressed={isSelected}
                                  onClick={() => {
                                    setSchoolRole(item.id);
                                    setHasChosenRole(true);
                                    clearStepValidation(1);
                                  }}
                                >
                                  <span className="choice-icon">
                                    <RoleIcon className="w-[18px] h-[18px]" />
                                  </span>

                                  <span className="choice-copy">
                                    <strong>{item.title}</strong>
                                    <small>{item.subtitle}</small>
                                  </span>

                                  <span className="choice-check">
                                    <Check className="w-[13px] h-[13px]" />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="choice-grid choice-grid--roles">
                            {ADMIN_ROLES_CONFIG.map((roleItem) => {
                              const occInfo = occupiedDmeCargos[roleItem.id];
                              const isOccupied = Boolean(occInfo?.occupied);
                              const isSelected = hasChosenRole && adminRole === roleItem.id && !isOccupied;
                              const RoleIcon = roleItem.icon;
                              return (
                                <button
                                  key={roleItem.id}
                                  type="button"
                                  disabled={isOccupied}
                                  className={`choice-card ${isSelected ? 'is-selected' : ''}`}
                                  data-choice-group="role"
                                  data-value={roleItem.id}
                                  aria-pressed={isSelected}
                                  onClick={() => {
                                    if (isOccupied) return;
                                    setAdminRole(roleItem.id);
                                    setHasChosenRole(true);
                                    clearStepValidation(1);
                                  }}
                                >
                                  <span className="choice-icon">
                                    <RoleIcon className="w-[18px] h-[18px]" />
                                  </span>

                                  <span className="choice-copy">
                                    <strong>{roleItem.badge}</strong>
                                    <small>{isOccupied ? 'Cargo ocupado' : roleItem.label}</small>
                                  </span>

                                  <span className="choice-check">
                                    <Check className="w-[13px] h-[13px]" />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </fieldset>

                      {stepErrors[1] && (
                        <p className="step-error" data-step-error="1" role="alert">
                          {stepErrors[1]}
                        </p>
                      )}

                      <div className="form-actions">
                        <button
                          className="button button-primary"
                          type="button"
                          data-next
                          onClick={handleNextRegStep}
                        >
                          Continuar
                          <ArrowRight />
                        </button>
                      </div>
                    </section>
                  )}

                  {/* ETAPA 2 */}
                  {regStep === 2 && (
                    <section className="form-step" data-step="2" aria-labelledby="step2-title">
                      <div className="step-heading">
                        <span className="step-number">02</span>
                        <div>
                          <h2 id="step2-title">Associe a sua instituição</h2>
                          <p>Escolha a escola onde exerce a sua função.</p>
                        </div>
                      </div>

                      <div className="fields-grid">
                        <div className={`field field--full ${fieldErrors.municipality ? 'has-error' : ''}`}>
                          <label className="field-label" htmlFor="municipality">
                            Município / repartição
                            <span className="required-mark">*</span>
                          </label>

                          <div className="control">
                            <MapPin />
                            <select
                              id="municipality"
                              name="municipality"
                              className={fieldErrors.municipality ? 'is-invalid' : ''}
                              value={regMunicipalityValue}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRegMunicipalityValue(val);
                                clearSingleFieldError('municipality');
                                if (val) {
                                  const matched = UCORE_MUNICIPALITIES.find((m) =>
                                    m.toLowerCase().includes(val.toLowerCase())
                                  );
                                  setSelectedMunicipality(matched || 'Quêssua (Malanje)');
                                }
                              }}
                            >
                              <option value="">Selecione o município</option>
                              <option value="quessua">Quêssua (Malanje)</option>
                              {UCORE_MUNICIPALITIES.filter((m) => !m.toLowerCase().includes('quêssua')).map((mun) => (
                                <option key={mun} value={mun}>
                                  {mun}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="select-arrow" />
                          </div>

                          <small className="field-message">{fieldErrors.municipality}</small>
                        </div>

                        <div className={`field field--full ${fieldErrors.school ? 'has-error' : ''}`}>
                          <label className="field-label" htmlFor="school">
                            Unidade escolar
                            <span className="required-mark">*</span>
                          </label>

                          <div className="control">
                            <Building2 />
                            {institutionalScope === 'escola' ? (
                              <select
                                id="school"
                                name="school"
                                disabled={!regMunicipalityValue}
                                className={fieldErrors.school ? 'is-invalid' : ''}
                                value={regMunicipalityValue ? selectedSchoolId : ''}
                                onChange={(e) => {
                                  const nextId = e.target.value;
                                  setSelectedSchoolId(nextId);
                                  clearSingleFieldError('school');
                                  const sc = registeredSchools.find((s) => s.id === nextId);
                                  if (sc) setSchoolOrUnitName(sc.name);
                                }}
                              >
                                {!regMunicipalityValue ? (
                                  <option value="">Selecione primeiro o município</option>
                                ) : (
                                  <>
                                    <option value="">Selecione a unidade escolar</option>
                                    {registeredSchools.length > 0 ? (
                                      registeredSchools.map((s) => {
                                        const reg = getSchoolRegistrationData(s);
                                        const code = reg.codigoSIGE || s.codigoSIGE || 'SIGE-113013';
                                        return (
                                          <option key={s.id} value={s.id}>
                                            {s.name} ({code})
                                          </option>
                                        );
                                      })
                                    ) : (
                                      <option value="sige-113013">
                                        Só Ciência da Educação (SIGE-113013)
                                      </option>
                                    )}
                                  </>
                                )}
                              </select>
                            ) : (
                              <select
                                id="school"
                                name="school"
                                disabled={!regMunicipalityValue}
                                value={regMunicipalityValue ? 'dme-quessua' : ''}
                                onChange={() => clearSingleFieldError('school')}
                              >
                                {!regMunicipalityValue ? (
                                  <option value="">Selecione primeiro o município</option>
                                ) : (
                                  <option value="dme-quessua">
                                    Direcção Municipal da Educação de Quêssua (DME)
                                  </option>
                                )}
                              </select>
                            )}
                            <ChevronDown className="select-arrow" />
                          </div>

                          <small className="field-message">{fieldErrors.school}</small>
                        </div>
                      </div>

                      {institutionalScope === 'escola' && regMunicipalityValue && selectedSchoolId && (() => {
                        const currentSc = registeredSchools.find((s) => s.id === selectedSchoolId);
                        const regData = currentSc ? getSchoolRegistrationData(currentSc) : null;
                        const code = regData?.codigoSIGE || currentSc?.codigoSIGE || 'SIGE-113013';
                        const typeLabel = (regData?.natureza || currentSc?.natureza || 'PÚBLICA').toUpperCase();
                        const nameLabel = currentSc?.name || 'Só Ciência da Educação';
                        const locationLabel = `${regData?.endereco?.municipio || 'Quêssua'} · ${regData?.endereco?.provincia || 'Malanje'}`;
                        const stageLabel = currentSc?.category || 'Ensino primário';
                        const totalRooms = currentSc?.roomsCount || regData?.infraestrutura?.totalSalas || 10;
                        const totalStaff = currentSc?.teachersCount || regData?.pessoal?.totalDocentesProfessores || 32;

                        return (
                          <div className="school-summary" id="schoolSummary">
                            <div className="school-summary__head">
                              <div>
                                <span className="summary-code" id="summaryCode">
                                  {code}
                                </span>
                                <span className="summary-tag" id="summaryType">
                                  {typeLabel}
                                </span>
                              </div>

                              <span className="summary-status">Dados encontrados</span>
                            </div>

                            <div className="school-summary__name" id="summaryName">
                              {nameLabel}
                            </div>

                            <div className="school-summary__meta">
                              <span>
                                <MapPin />
                                <span id="summaryLocation">{locationLabel}</span>
                              </span>

                              <span>
                                <GraduationCap />
                                <span id="summaryStage">{stageLabel}</span>
                              </span>

                              <span>
                                <LayoutGrid />
                                <span id="summaryRooms">{totalRooms} salas</span>
                              </span>

                              <span>
                                <Users />
                                <span id="summaryStaff">{totalStaff} docentes</span>
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="notice">
                        <ShieldCheck />
                        <div>
                          <strong>Aprovação institucional</strong>
                          <span>
                            O administrador da rede valida o pedido antes do primeiro acesso.
                          </span>
                        </div>
                      </div>

                      {stepErrors[2] && (
                        <p className="step-error" data-step-error="2" role="alert">
                          {stepErrors[2]}
                        </p>
                      )}

                      <div className="form-actions">
                        <button
                          className="button button-secondary"
                          type="button"
                          data-prev
                          onClick={handlePrevRegStep}
                        >
                          <ArrowLeft />
                          Voltar
                        </button>

                        <button
                          className="button button-primary"
                          type="button"
                          data-next
                          onClick={handleNextRegStep}
                        >
                          Continuar
                          <ArrowRight />
                        </button>
                      </div>
                    </section>
                  )}

                  {/* ETAPA 3 */}
                  {regStep === 3 && (
                    <section className="form-step" data-step="3" aria-labelledby="step3-title">
                      <div className="step-heading">
                        <span className="step-number">03</span>
                        <div>
                          <h2 id="step3-title">Finalize os seus dados</h2>
                          <p>Utilize dados válidos para recuperar o acesso.</p>
                        </div>
                      </div>

                      <div className="fields-grid">
                        <div className={`field ${fieldErrors.bi ? 'has-error' : ''}`}>
                          <label className="field-label" htmlFor="bi">
                            N.º do Bilhete de Identidade
                            <span className="required-mark">*</span>
                          </label>

                          <div className="control">
                            <CreditCard />
                            <input
                              id="bi"
                              name="bi"
                              type="text"
                              maxLength={20}
                              autoComplete="off"
                              placeholder="Ex.: 008892144AL012"
                              className={fieldErrors.bi ? 'is-invalid' : ''}
                              value={biNumber}
                              onChange={(e) => {
                                setBiNumber(e.target.value);
                                clearSingleFieldError('bi');
                              }}
                            />
                          </div>

                          <small className="field-message">{fieldErrors.bi}</small>
                        </div>

                        <div className={`field ${fieldErrors.phone ? 'has-error' : ''}`}>
                          <label className="field-label" htmlFor="phone">
                            Telefone / telemóvel
                            <span className="required-mark">*</span>
                          </label>

                          <div className="control">
                            <Phone />
                            <input
                              id="phone"
                              name="phone"
                              type="tel"
                              inputMode="tel"
                              autoComplete="tel"
                              placeholder="+244 923 000 000"
                              className={fieldErrors.phone ? 'is-invalid' : ''}
                              value={phone}
                              onChange={(e) => {
                                setPhone(e.target.value);
                                clearSingleFieldError('phone');
                              }}
                            />
                          </div>

                          <small className="field-message">{fieldErrors.phone}</small>
                        </div>

                        <div className={`field ${fieldErrors.firstName ? 'has-error' : ''}`}>
                          <label className="field-label" htmlFor="firstName">
                            Primeiro nome
                            <span className="required-mark">*</span>
                          </label>

                          <div className="control">
                            <User />
                            <input
                              id="firstName"
                              name="firstName"
                              type="text"
                              autoComplete="given-name"
                              placeholder="Ex.: Carlos"
                              className={fieldErrors.firstName ? 'is-invalid' : ''}
                              value={firstName}
                              onChange={(e) => {
                                setFirstName(e.target.value);
                                clearSingleFieldError('firstName');
                              }}
                            />
                          </div>

                          <small className="field-message">{fieldErrors.firstName}</small>
                        </div>

                        <div className={`field ${fieldErrors.lastName ? 'has-error' : ''}`}>
                          <label className="field-label" htmlFor="lastName">
                            Sobrenome
                            <span className="required-mark">*</span>
                          </label>

                          <div className="control">
                            <User />
                            <input
                              id="lastName"
                              name="lastName"
                              type="text"
                              autoComplete="family-name"
                              placeholder="Ex.: Silva"
                              className={fieldErrors.lastName ? 'is-invalid' : ''}
                              value={lastName}
                              onChange={(e) => {
                                setLastName(e.target.value);
                                clearSingleFieldError('lastName');
                              }}
                            />
                          </div>

                          <small className="field-message">{fieldErrors.lastName}</small>
                        </div>

                        <div className={`field field--full ${fieldErrors.email ? 'has-error' : ''}`}>
                          <div className="flex items-center justify-between gap-2">
                            <label className="field-label" htmlFor="email">
                              E-mail institucional
                              <span className="required-mark">*</span>
                            </label>
                            {isGoogleLockedEmail && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#168568] bg-[#eaf6f2] border border-[#b9e2d4] px-2.5 py-0.5 rounded">
                                <Lock className="w-3 h-3" />
                                Vinculado ao Google
                              </span>
                            )}
                          </div>

                          <div className="control">
                            <Mail />
                            <input
                              id="email"
                              name="email"
                              type="email"
                              autoComplete="email"
                              placeholder="seu.nome@sigre.edu.ao"
                              readOnly={isGoogleLockedEmail}
                              aria-readonly={isGoogleLockedEmail}
                              className={`${fieldErrors.email ? 'is-invalid' : ''} ${
                                isGoogleLockedEmail ? 'bg-[#f1f5f9] text-[#334155] font-semibold cursor-not-allowed select-none' : ''
                              }`}
                              value={email}
                              onChange={(e) => {
                                if (isGoogleLockedEmail) return;
                                setEmail(e.target.value);
                                clearSingleFieldError('email');
                              }}
                            />
                            {isGoogleLockedEmail && (
                              <Lock
                                className="w-4 h-4 text-[#168568]"
                                style={{ left: 'auto', right: 14 }}
                              />
                            )}
                          </div>

                          <small className="field-message">
                            {fieldErrors.email ||
                              (isGoogleLockedEmail
                                ? 'Este endereço de e-mail foi autenticado pela sua conta Google e está bloqueado para esta inscrição.'
                                : '')}
                          </small>
                        </div>

                        <div className={`field ${fieldErrors.password ? 'has-error' : ''}`}>
                          <label className="field-label" htmlFor="password">
                            Senha
                            <span className="required-mark">*</span>
                          </label>

                          <div className="control password-control">
                            <Lock />
                            <input
                              id="password"
                              name="password"
                              type={showPassword ? 'text' : 'password'}
                              minLength={6}
                              autoComplete="new-password"
                              placeholder="Mínimo de 6 caracteres"
                              className={fieldErrors.password ? 'is-invalid' : ''}
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                clearSingleFieldError('password');
                              }}
                            />

                            <button
                              className="password-toggle"
                              type="button"
                              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                              title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                              onClick={() => setShowPassword((prev) => !prev)}
                            >
                              {showPassword ? <EyeOff className="w-[17px] h-[17px]" /> : <Eye className="w-[17px] h-[17px]" />}
                            </button>
                          </div>

                          <small className="field-message">{fieldErrors.password}</small>
                        </div>

                        <div className={`field ${fieldErrors.passwordConfirm ? 'has-error' : ''}`}>
                          <label className="field-label" htmlFor="passwordConfirm">
                            Confirmar senha
                            <span className="required-mark">*</span>
                          </label>

                          <div className="control password-control">
                            <Lock />
                            <input
                              id="passwordConfirm"
                              name="passwordConfirm"
                              type={showConfirmPassword ? 'text' : 'password'}
                              minLength={6}
                              autoComplete="new-password"
                              placeholder="Repita a senha"
                              className={fieldErrors.passwordConfirm ? 'is-invalid' : ''}
                              value={confirmPassword}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                clearSingleFieldError('passwordConfirm');
                              }}
                            />

                            <button
                              className="password-toggle"
                              type="button"
                              aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                              title={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                            >
                              {showConfirmPassword ? <EyeOff className="w-[17px] h-[17px]" /> : <Eye className="w-[17px] h-[17px]" />}
                            </button>
                          </div>

                          <small className="field-message">{fieldErrors.passwordConfirm}</small>
                        </div>
                      </div>

                      <label
                        className={`terms-row ${fieldErrors.terms ? 'has-error' : ''}`}
                        id="termsRow"
                      >
                        <input
                          id="terms"
                          name="terms"
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => {
                            setAgreeTerms(e.target.checked);
                            clearSingleFieldError('terms');
                          }}
                        />

                        <span>
                          Li e aceito os{' '}
                          <a href="#termos" onClick={(e) => e.preventDefault()}>
                            Termos de Uso
                          </a>{' '}
                          e a{' '}
                          <a href="#privacidade" onClick={(e) => e.preventDefault()}>
                            Política de Privacidade
                          </a>
                          .
                        </span>
                      </label>

                      {(stepErrors[3] || errorMsg) && (
                        <p className="step-error" data-step-error="3" role="alert">
                          {stepErrors[3] || errorMsg}
                        </p>
                      )}

                      <div className="form-actions">
                        <button
                          className="button button-secondary"
                          type="button"
                          data-prev
                          onClick={handlePrevRegStep}
                        >
                          <ArrowLeft />
                          Voltar
                        </button>

                        <button
                          className="button button-primary"
                          type="submit"
                          id="submitButton"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="animate-spin" />
                              A enviar...
                            </>
                          ) : (
                            <>
                              Criar minha conta
                              <ArrowRight />
                            </>
                          )}
                        </button>
                      </div>
                    </section>
                  )}
                </form>
              ) : (
                <div className="success-state" id="successState" role="status" aria-live="polite">
                  <div className="success-icon">
                    <Check />
                  </div>

                  <h2>Pedido enviado</h2>

                  <p>
                    Os seus dados foram registados. Aguarde a validação do administrador
                    da rede escolar.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      className="button button-secondary"
                      type="button"
                      id="editRegistration"
                      onClick={() => {
                        setRegistrationSubmitted(false);
                        setRegStep(3);
                      }}
                    >
                      Voltar ao formulário
                    </button>

                    {submittedUserAccount && (
                      <button
                        className="button button-primary"
                        type="button"
                        onClick={() => onLoginSuccess(submittedUserAccount)}
                      >
                        Acompanhar pedido
                        <ArrowRight />
                      </button>
                    )}
                  </div>
                </div>
              )}

              <p className="login-footer">
                Já possui cadastro?
                <button
                  type="button"
                  id="switch-to-login-btn"
                  onClick={() => switchMode('login')}
                >
                  Entrar na Central
                </button>
              </p>
            </section>
          </section>
        </main>
      ) : (
        /* Main Content Area: Balanced 1120px Card (LOGIN & FORGOT PASSWORD) */
        <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 flex items-center justify-center">
          <div 
            id="auth-card-container"
            className="w-full bg-white rounded-3xl shadow-[0_12px_40px_-8px_rgba(0,33,51,0.08),0_2px_6px_rgba(0,33,51,0.04)] border border-slate-200/90 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[560px] lg:min-h-[600px] transition-all"
          >
            
            {/* Left Column: Visual Photography with Navy Degradé & Context */}
            <div className="hidden md:block md:col-span-5 lg:col-span-5 relative overflow-hidden bg-[#002133] select-none">
              <img
                src={teacherImg}
                alt="Professora e ambiente escolar Sigre"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top filter brightness-[0.98] contrast-[1.02] transition-transform duration-700 hover:scale-105"
              />
              
              {/* Navy Degradé on bottom third - doesn't cover face */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#002133] via-[#002133]/65 via-35% to-transparent pointer-events-none" />

              {/* Context Message */}
              <div className="absolute bottom-0 inset-x-0 p-6 lg:p-8 text-white z-10 space-y-2">
                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
                  A sua escola, mais conectada.
                </h3>
              </div>
            </div>

            {/* Right Column: High-Comfort Form */}
            <div className="col-span-1 md:col-span-7 lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white">
              
              {/* Forgot Password Sub-view */}
              {forgotPasswordOpen ? (
                <div className="max-w-[420px] mx-auto w-full space-y-5">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#002133] tracking-tight">
                      Recuperar senha
                    </h2>
                  </div>

                  {forgotSuccess ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <p className="text-xs font-semibold">
                        Link de recuperação enviado com sucesso para <span className="font-bold">{forgotEmail}</span>!
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          E-mail de cadastro
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            required
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="seu.email@ucore.edu.br"
                            className="w-full h-[48px] sm:h-[50px] pl-10 pr-4 rounded-xl border border-slate-200 focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm outline-none transition-all shadow-xs"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full h-[48px] sm:h-[50px] rounded-xl bg-[#f75142] hover:bg-[#e04436] text-white font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Enviar link de recuperação</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setForgotPasswordOpen(false)}
                          className="text-xs font-semibold text-slate-600 hover:text-[#f75142] transition-colors cursor-pointer"
                        >
                          ← Voltar ao login
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* LOGIN VIEW */
                <div className="max-w-[420px] mx-auto w-full space-y-5">
                  
                  {/* Header with refined typography */}
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002133] tracking-tight">
                      Bem-vindo à Central
                    </h1>
                  </div>

                  {/* Feedback Alerts */}
                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                  {successMsg && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Email Input: Comfortable 48-52px height */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        E-mail Institucional
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="login-email-input"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu.email@gmail.com"
                          className="w-full h-[48px] sm:h-[50px] pl-10 pr-4 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Password Input: Comfortable 48-52px height */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Senha de Acesso
                        </label>
                        <button
                          type="button"
                          onClick={() => setForgotPasswordOpen(true)}
                          className="text-xs font-semibold text-[#f75142] hover:underline cursor-pointer"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="login-password-input"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-[48px] sm:h-[50px] pl-10 pr-11 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me Checkbox */}
                    <div className="flex items-center pt-0.5">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded text-[#f75142] focus:ring-[#f75142] border-slate-300 cursor-pointer"
                        >
                        </input>
                        <span>Manter sessão iniciada neste dispositivo</span>
                      </label>
                    </div>

                    {/* Primary Submit Button: High contrast, coral Sigre, prominent focus */}
                    <button
                      id="submit-login-btn"
                      type="submit"
                      disabled={loading}
                      className="w-full h-[48px] sm:h-[50px] rounded-xl bg-[#f75142] hover:bg-[#e04436] text-white font-bold text-sm tracking-wide shadow-[0_6px_20px_rgba(247,81,66,0.25)] hover:shadow-[0_8px_24px_rgba(247,81,66,0.35)] transition-all duration-200 cursor-pointer active:scale-[0.99] disabled:opacity-70 mt-1 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          <span>A autenticar credenciais...</span>
                        </>
                      ) : (
                        <>
                          <span>Entrar na Central</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Separador Oficial Google */}
                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase">
                        <span className="bg-white px-2.5 text-slate-400 font-bold tracking-wider">
                          ou continue com
                        </span>
                      </div>
                    </div>

                    <div className="w-full flex flex-col items-center">
                      <GoogleSignInButton
                        onClick={handleGoogleSignInFlow}
                        isLoading={isGoogleLoading}
                        label="Continuar com o Google"
                        className="w-full justify-center"
                      />
                    </div>

                    {/* Switch to Register */}
                    <div className="text-center pt-2 text-xs text-slate-600">
                      Ainda não possui uma conta?{' '}
                      <button
                        type="button"
                        id="switch-to-register-btn"
                        onClick={() => switchMode('register')}
                        className="font-bold text-[#f75142] hover:underline cursor-pointer"
                      >
                        Crie a sua conta
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* Footer Note (when standalone) */}
      {!hideHeader && (
        <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-200/80 bg-white">
          Sigre • Sistema Integrado de Gestão Escolar para Escolas, Professores e Alunos
        </footer>
      )}
    </div>
  );
};
