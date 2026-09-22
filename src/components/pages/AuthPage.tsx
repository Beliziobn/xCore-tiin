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
  Phone
} from 'lucide-react';
import teacherImg from '../../assets/images/teacher_classroom_1788697035170.jpg';
import { verifyPassword, updatePassword } from '../../utils/passwordService';
import type { UserAccount, SchoolStaffRole, AdminStaffRole } from '../../types';
import { GoogleSignInButton } from '../common/GoogleSignInButton';
import { googleSignIn } from '../../utils/googleAuth';
import { 
  UCORE_MUNICIPALITIES, 
  UCORE_DISCIPLINAS, 
  UCORE_GRAUS_CLASSES, 
  searchPreRegisteredTeacher, 
  searchPreRegisteredDirector,
  savePendingApplication,
  checkUserApprovalStatus
} from '../../utils/authApprovalStorage';
import { initialAdminSchools } from '../../data/adminData';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onLoginSuccess: (user: UserAccount) => void;
  onBackToHome: () => void;
  hideHeader?: boolean;
  onAuthLoadingChange?: (loading: boolean, action?: 'login' | 'register') => void;
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
    cargoFull: 'Diretor Geral da Escola Modelo Central',
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
    id: 'diretor_municipal',
    label: 'Diretor(a) Municipal da Educação',
    badge: 'Liderança DME',
    icon: Landmark,
    desc: 'Liderança executiva municipal, coordenação da rede de todas as escolas do município',
    prefix: 'Diretor Municipal',
    baseRole: 'admin',
    defaultEmail: 'admin.fred@ucore.edu.br',
    defaultFirst: 'Fred',
    defaultLast: 'Silva',
    cargoFull: 'Diretor Municipal da Educação de Quêssua',
  },
  {
    id: 'inspetor_escolar',
    label: 'Inspetor(a) Escolar Municipal',
    badge: 'Inspecção & Auditoria',
    icon: Eye,
    desc: 'Inspecção técnica, auditoria curricular, supervisão pedagógica e conformidade legal',
    prefix: 'Inspetor Municipal',
    baseRole: 'admin',
    defaultEmail: 'inspetor.marcos@ucore.edu.br',
    defaultFirst: 'Marcos',
    defaultLast: 'Dinis',
    cargoFull: 'Inspetor Técnico da Repartição Municipal',
  },
  {
    id: 'chefe_reparticao',
    label: 'Chefe de Repartição / Ensino Geral',
    badge: 'Repartição de Ensino',
    icon: Award,
    desc: 'Supervisão do ensino primário e secundário, distribuição docente e rede curricular',
    prefix: 'Chefe de Repartição',
    baseRole: 'admin',
    defaultEmail: 'chefe.ensino@ucore.edu.br',
    defaultFirst: 'Augusto',
    defaultLast: 'Nvula',
    cargoFull: 'Chefe da Repartição do Ensino Geral',
  },
  {
    id: 'tecnico_estatistica',
    label: 'Técnico(a) de Planeamento & Estatística',
    badge: 'Planeamento & Dados',
    icon: BarChart3,
    desc: 'Consolidação de dados do Censo Escolar, taxas de aprovação, fluxo e infraestrutura',
    prefix: 'Técnico de Estatística',
    baseRole: 'admin',
    defaultEmail: 'estatistica.dme@ucore.edu.br',
    defaultFirst: 'Helena',
    defaultLast: 'Manuel',
    cargoFull: 'Técnica de Estatística & Planeamento DME',
  },
  {
    id: 'admin_sistema',
    label: 'Administrador(a) de Sistema Sigre',
    badge: 'Super Admin TI',
    icon: Settings,
    desc: 'Gestão global da plataforma, parametrização dos módulos, utilizadores e segurança',
    prefix: 'Admin.',
    baseRole: 'admin',
    defaultEmail: 'admin.sistema@sigre.edu.ao',
    defaultFirst: 'Suporte',
    defaultLast: 'Sigre',
    cargoFull: 'Superintendente & Administrador de Sistemas TI',
  },
];

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onLoginSuccess,
  onBackToHome,
  hideHeader = false,
  onAuthLoadingChange,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
  const [loading, setLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Institutional Scope & Role Flexion State
  const [institutionalScope, setInstitutionalScope] = useState<'escola' | 'administracao'>('escola');
  const [schoolRole, setSchoolRole] = useState<SchoolStaffRole>('diretor_geral');
  const [adminRole, setAdminRole] = useState<AdminStaffRole>('diretor_municipal');
  const [schoolOrUnitName, setSchoolOrUnitName] = useState('');
  
  // Sigre Predefined System Selection Options
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>(UCORE_MUNICIPALITIES[0]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(initialAdminSchools[0]?.id || 'esc-01');
  const [biNumber, setBiNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>(UCORE_DISCIPLINAS[0]);
  const [selectedGradeClass, setSelectedGradeClass] = useState<string>(UCORE_GRAUS_CLASSES[1]);
  const [preRegResult, setPreRegResult] = useState<{ found: boolean; details?: string; teacherName?: string; directorName?: string } | null>(null);

  const [loginPresetTab, setLoginPresetTab] = useState<'escola' | 'administracao'>('escola');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Real-time pre-registration search across Sigre roster
  useEffect(() => {
    if (mode !== 'register') {
      setPreRegResult(null);
      return;
    }
    const currentSchool = initialAdminSchools.find((s) => s.id === selectedSchoolId)?.name || initialAdminSchools[0]?.name || '';
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
      const res = searchPreRegisteredDirector(email, biNumber, fullName, selectedMunicipality);
      setPreRegResult(res.found ? res : null);
    }
  }, [mode, email, biNumber, firstName, lastName, selectedSchoolId, selectedMunicipality, schoolRole, institutionalScope]);

  const handleGoogleSignInFlow = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMsg(null);
      const res = await googleSignIn();
      // If user closed the popup or cancelled without signing in, gracefully return
      if (!res || res.cancelled || !res.user) {
        return;
      }
      const user = res.user;
      const names = (user.displayName || 'Utilizador Google').split(' ');
      const gFirst = names[0] || 'Utilizador';
      const gLast = names.slice(1).join(' ') || 'Google';

      const googleAccount: UserAccount = {
        id: user.uid,
        firstName: gFirst,
        lastName: gLast,
        email: user.email || 'google.user@ucore.edu.ao',
        role: 'admin',
        scope: 'administracao',
        adminRole: 'admin_sistema',
        cargoTitle: 'Administrador de Sistema (Google)',
        schoolName: 'Direcção Municipal da Educação de Quêssua',
        municipalityOrDepartment: 'Quêssua / Malanje',
        titlePrefix: 'Admin.',
        greeting: `Olá, ${gFirst}`,
      };

      onLoginSuccess(googleAccount);
    } catch (err: any) {
      const isCancellation =
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        (typeof err?.message === 'string' && err.message.includes('auth/popup-closed-by-user'));

      if (isCancellation) {
        return;
      }

      console.warn('Aviso de autenticação Google:', err?.message || err);
      setErrorMsg(err?.message || 'Erro ao autenticar com o Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [initialMode]);

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setForgotPasswordOpen(false);
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
    setSchoolOrUnitName('Escola Modelo Central');
    setAgreeTerms(true);
  };

  const handleFillAdminPreset = (roleId: AdminStaffRole) => {
    const config = ADMIN_ROLES_CONFIG.find((c) => c.id === roleId);
    if (!config) return;
    setInstitutionalScope('administracao');
    setAdminRole(roleId);
    setEmail(config.defaultEmail);
    setPassword('Ucore@2026');
    setFirstName(config.defaultFirst);
    setLastName(config.defaultLast);
    setSchoolOrUnitName('Direcção Municipal da Educação de Quêssua');
    setAgreeTerms(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'login') {
      if (!email.trim() || !password.trim()) {
        setErrorMsg('Por favor, informe seu e-mail e palavra-passe.');
        return;
      }

      if (!verifyPassword(email.trim(), password.trim())) {
        setErrorMsg('A palavra-passe informada está incorreta para este e-mail.');
        return;
      }

      setLoading(true);
      onAuthLoadingChange?.(true, 'login');

      setTimeout(() => {
        setLoading(false);
        
        // Find if matches preset or detect context
        let matchedScope: 'escola' | 'administracao' = institutionalScope;
        let matchedSchoolRole = schoolRole;
        let matchedAdminRole = adminRole;
        let resolvedCargoTitle = '';
        let resolvedPrefix = '';
        let resolvedRole: 'admin' | 'diretor' | 'professor' = 'admin';

        if (institutionalScope === 'escola') {
          const cfg = SCHOOL_ROLES_CONFIG.find(c => c.id === schoolRole) || SCHOOL_ROLES_CONFIG[0];
          resolvedRole = cfg.baseRole;
          resolvedCargoTitle = cfg.label;
          resolvedPrefix = cfg.prefix;
        } else {
          const cfg = ADMIN_ROLES_CONFIG.find(c => c.id === adminRole) || ADMIN_ROLES_CONFIG[0];
          resolvedRole = cfg.baseRole;
          resolvedCargoTitle = cfg.label;
          resolvedPrefix = cfg.prefix;
        }

        // Email heuristics override if user typed freeform
        const lowEmail = email.toLowerCase();
        if (lowEmail.includes('prof') || lowEmail.includes('santar') || lowEmail.includes('docente')) {
          matchedScope = 'escola';
          matchedSchoolRole = 'professor';
          resolvedRole = 'professor';
          resolvedCargoTitle = 'Professor(a) / Docente';
          resolvedPrefix = 'Prof.';
        } else if (lowEmail.includes('pedagogico')) {
          matchedScope = 'escola';
          matchedSchoolRole = 'subdiretor_pedagogico';
          resolvedRole = 'diretor';
          resolvedCargoTitle = 'Subdirector(a) Pedagógico(a)';
          resolvedPrefix = 'Subdiretor Pedagógico';
        } else if (lowEmail.includes('adm') && lowEmail.includes('subdiretor')) {
          matchedScope = 'escola';
          matchedSchoolRole = 'subdiretor_administrativo';
          resolvedRole = 'diretor';
          resolvedCargoTitle = 'Subdirector(a) Administrativo(a)';
          resolvedPrefix = 'Subdiretor Adm.';
        } else if (lowEmail.includes('inspetor')) {
          matchedScope = 'administracao';
          matchedAdminRole = 'inspetor_escolar';
          resolvedRole = 'admin';
          resolvedCargoTitle = 'Inspetor(a) Escolar Municipal';
          resolvedPrefix = 'Inspetor';
        } else if (lowEmail.includes('diretor') && (lowEmail.includes('carl') || lowEmail.includes('escola'))) {
          matchedScope = 'escola';
          matchedSchoolRole = 'diretor_geral';
          resolvedRole = 'diretor';
          resolvedCargoTitle = 'Director(a) Geral';
          resolvedPrefix = 'Diretor Geral';
        } else if (lowEmail.includes('fred') || lowEmail.includes('dme') || lowEmail.includes('municipal')) {
          matchedScope = 'administracao';
          matchedAdminRole = 'diretor_municipal';
          resolvedRole = 'admin';
          resolvedCargoTitle = 'Director(a) Municipal da Educação';
          resolvedPrefix = 'Diretor Municipal';
        }

        const resolvedFirst = firstName.trim() || (resolvedRole === 'admin' ? 'Fred' : resolvedRole === 'diretor' ? 'Carl' : 'Santar');
        
        const matchedSchool = initialAdminSchools.find((s) => s.id === selectedSchoolId) || initialAdminSchools[0];

        const loggedUser: UserAccount = {
          id: 'usr_' + Date.now(),
          firstName: resolvedFirst,
          lastName: lastName.trim() || 'Sigre',
          email: email.trim(),
          role: resolvedRole,
          scope: matchedScope,
          schoolRole: matchedScope === 'escola' ? matchedSchoolRole : undefined,
          adminRole: matchedScope === 'administracao' ? matchedAdminRole : undefined,
          cargoTitle: resolvedCargoTitle,
          schoolName: matchedScope === 'escola' ? (matchedSchool.name) : undefined,
          schoolId: matchedScope === 'escola' ? matchedSchool.id : undefined,
          municipalityOrDepartment: selectedMunicipality,
          titlePrefix: resolvedPrefix,
          greeting: `Olá ${resolvedPrefix} ${resolvedFirst}`,
          rememberMe,
        };

        // Check if this account is pending approval
        const approvalCheck = checkUserApprovalStatus(loggedUser.id, email.trim());
        if (approvalCheck.status === 'pendente') {
          loggedUser.status = 'pendente';
          setSuccessMsg(`A sua candidatura continua em análise aguardando despacho. Redirecionando para a tela de espera...`);
        } else if (approvalCheck.status === 'rejeitado') {
          setErrorMsg(`A sua candidatura foi recusada pela administração: ${approvalCheck.app?.rejectionReason || 'Contacte a direcção'}`);
          setLoading(false);
          onAuthLoadingChange?.(false);
          return;
        } else {
          loggedUser.status = 'ativo';
          setSuccessMsg(`Bem-vindo, ${loggedUser.greeting}! Redirecionando para o ambiente de ${resolvedCargoTitle}...`);
        }

        setTimeout(() => {
          onAuthLoadingChange?.(false);
          onLoginSuccess(loggedUser);
        }, 800);
      }, 650);
    } else {
      // Register validation
      if (!firstName.trim()) {
        setErrorMsg('Por favor, informe o seu primeiro nome.');
        return;
      }
      if (!biNumber.trim()) {
        setErrorMsg('Por favor, indique o número do Bilhete de Identidade (BI) para verificação institucional.');
        return;
      }
      if (!email.trim()) {
        setErrorMsg('Por favor, informe um endereço de e-mail institucional válido.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMsg('A senha deve possuir pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas digitadas não coincidem.');
        return;
      }
      if (!agreeTerms) {
        setErrorMsg('É necessário aceitar os Termos de Uso e a Política de Privacidade.');
        return;
      }

      setLoading(true);
      onAuthLoadingChange?.(true, 'register');
      setTimeout(() => {
        setLoading(false);
        const userFirst = firstName.trim();

        const chosenConfig = institutionalScope === 'escola'
          ? (SCHOOL_ROLES_CONFIG.find(c => c.id === schoolRole) || SCHOOL_ROLES_CONFIG[0])
          : (ADMIN_ROLES_CONFIG.find(c => c.id === adminRole) || ADMIN_ROLES_CONFIG[0]);

        const prefix = chosenConfig.prefix;
        const baseRole = chosenConfig.baseRole;
        const cargoTitle = chosenConfig.label;
        const matchedSchool = initialAdminSchools.find((s) => s.id === selectedSchoolId) || initialAdminSchools[0];

        const isDirectorCandidate = baseRole === 'diretor';
        const isTeacherCandidate = baseRole === 'professor';
        const isPending = isDirectorCandidate || isTeacherCandidate;
        const newUserId = 'usr_' + Date.now();

        // Save custom password in storage
        updatePassword(email.trim(), password.trim());

        // Create pending application record
        if (isPending) {
          const appId = `app-${baseRole}-${Date.now()}`;
          savePendingApplication({
            id: appId,
            userId: newUserId,
            type: isDirectorCandidate ? 'diretor' : 'professor',
            fullName: `${userFirst} ${lastName.trim() || 'Sigre'}`.trim(),
            email: email.trim(),
            phone: phone.trim() || '+244 923 000 000',
            biNumber: biNumber.trim(),
            schoolName: matchedSchool.name,
            schoolId: matchedSchool.id,
            municipality: selectedMunicipality,
            targetApproverRole: isDirectorCandidate ? 'admin' : 'diretor',
            approverDirectorName: isTeacherCandidate ? matchedSchool.directorName : undefined,
            subject: isTeacherCandidate ? selectedSubject : undefined,
            gradeClass: isTeacherCandidate ? selectedGradeClass : undefined,
            status: 'pendente',
            isPreRegistered: Boolean(preRegResult?.found),
            preRegisteredDetails: preRegResult?.details,
            createdAt: new Date().toLocaleString('pt-AO'),
            notes: preRegResult?.found 
              ? `Registro pré-existente localizado no sistema. Ficha associada automaticamente.` 
              : `Nova candidatura institucional para ${matchedSchool.name}.`,
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
          schoolName: institutionalScope === 'escola' ? matchedSchool.name : undefined,
          schoolId: matchedSchool.id,
          municipalityOrDepartment: selectedMunicipality,
          titlePrefix: prefix,
          greeting: `Olá ${prefix} ${userFirst}`,
          rememberMe: true,
          status: isPending ? 'pendente' : 'ativo',
          biNumber: biNumber.trim(),
          phone: phone.trim() || '+244 923 000 000',
          subject: isTeacherCandidate ? selectedSubject : undefined,
          gradeClass: isTeacherCandidate ? selectedGradeClass : undefined,
          isPreRegistered: Boolean(preRegResult?.found),
          submittedAt: new Date().toLocaleString('pt-AO'),
        };

        if (isPending) {
          setSuccessMsg(
            isDirectorCandidate
              ? `Candidatura enviada! A sua conta de Diretor aguarda validação do Administrador Central.`
              : `Inscrição submetida! A sua conta de Professor aguarda validação da Direção da ${matchedSchool.name}.`
          );
        } else {
          setSuccessMsg(`Conta criada com sucesso! Acessando ambiente de ${cargoTitle} (${userFirst})...`);
        }

        setTimeout(() => {
          onAuthLoadingChange?.(false);
          onLoginSuccess(newUser);
        }, 850);
      }, 700);
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
      className="min-h-screen w-full bg-gradient-to-b from-[#f8f9fb] via-[#f3f5f8] to-[#edf1f5] text-slate-900 flex flex-col justify-between selection:bg-[#f75142] selection:text-white font-sans"
    >
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
              <div className="w-10 h-10 rounded-xl bg-[#f75142] flex items-center justify-center shadow-md group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300">
                <Box className="w-5 h-5 text-white" strokeWidth={2.5} />
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

      {/* Main Content Area: Balanced 1120px Card */}
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-bold tracking-wide uppercase text-white/90">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f75142]" />
                Rede de Ensino Integrada
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
                A sua escola, mais conectada.
              </h3>
              <p className="text-xs text-white/80 leading-relaxed font-normal pt-0.5">
                Organização eficiente de turmas, docentes e rendimento escolar com a tecnologia Sigre.
              </p>
            </div>
          </div>

          {/* Right Column: High-Comfort Form */}
          <div className="col-span-1 md:col-span-7 lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white">
            
            {/* Forgot Password Sub-view */}
            {forgotPasswordOpen ? (
              <div className="max-w-[420px] mx-auto w-full space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#f75142] bg-[#fef2f1] px-3 py-1 rounded-full mb-2">
                    Recuperação de Acesso
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#002133] tracking-tight">
                    Recuperar senha
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Indique o seu e-mail institucional para receber o link de redefinição.
                  </p>
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
            ) : mode === 'login' ? (
              /* LOGIN VIEW */
              <div className="max-w-[420px] mx-auto w-full space-y-5">
                
                {/* Header with refined typography */}
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#f75142] bg-[#fef2f1] px-3 py-1 rounded-full mb-2">
                    Acesso Institucional
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002133] tracking-tight">
                    Bem-vindo à Central
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Introduza as suas credenciais para aceder à gestão escolar do Sigre.
                  </p>
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

                {/* Profile Demo Selector with Scope Switcher */}
                <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#f75142]" />
                      <span>Acesso rápido por perfil:</span>
                    </span>
                    {/* Scope Tabs in Login */}
                    <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setLoginPresetTab('escola')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          loginPresetTab === 'escola'
                            ? 'bg-white text-[#002133] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Escola
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginPresetTab('administracao')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          loginPresetTab === 'administracao'
                            ? 'bg-white text-[#002133] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Administração (DME)
                      </button>
                    </div>
                  </div>

                  {loginPresetTab === 'escola' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        id="preset-diretor-geral-btn"
                        onClick={() => handleFillSchoolPreset('diretor_geral')}
                        className={`py-2 px-2 rounded-xl text-xs transition-all border cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 ${
                          institutionalScope === 'escola' && schoolRole === 'diretor_geral'
                            ? 'bg-[#002133] text-white border-[#002133] font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-[#f75142] shrink-0" />
                        <span className="font-bold text-[11px] leading-tight">Diretor Geral</span>
                        <span className="text-[9px] opacity-75 font-normal">Carl Mendes</span>
                      </button>

                      <button
                        type="button"
                        id="preset-subdir-pedagogico-btn"
                        onClick={() => handleFillSchoolPreset('subdiretor_pedagogico')}
                        className={`py-2 px-2 rounded-xl text-xs transition-all border cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 ${
                          institutionalScope === 'escola' && schoolRole === 'subdiretor_pedagogico'
                            ? 'bg-[#002133] text-white border-[#002133] font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="font-bold text-[11px] leading-tight">Subdir. Pedagógico</span>
                        <span className="text-[9px] opacity-75 font-normal">Carlos Silva</span>
                      </button>

                      <button
                        type="button"
                        id="preset-subdir-adm-btn"
                        onClick={() => handleFillSchoolPreset('subdiretor_administrativo')}
                        className={`py-2 px-2 rounded-xl text-xs transition-all border cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 ${
                          institutionalScope === 'escola' && schoolRole === 'subdiretor_administrativo'
                            ? 'bg-[#002133] text-white border-[#002133] font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-bold text-[11px] leading-tight">Subdir. Adm.</span>
                        <span className="text-[9px] opacity-75 font-normal">Teresa Santos</span>
                      </button>

                      <button
                        type="button"
                        id="preset-professor-btn"
                        onClick={() => handleFillSchoolPreset('professor')}
                        className={`py-2 px-2 rounded-xl text-xs transition-all border cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 ${
                          institutionalScope === 'escola' && schoolRole === 'professor'
                            ? 'bg-[#002133] text-white border-[#002133] font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-bold text-[11px] leading-tight">Professor(a)</span>
                        <span className="text-[9px] opacity-75 font-normal">Santar Goes</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        id="preset-diretor-municipal-btn"
                        onClick={() => handleFillAdminPreset('diretor_municipal')}
                        className={`py-2 px-2 rounded-xl text-xs transition-all border cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 ${
                          institutionalScope === 'administracao' && adminRole === 'diretor_municipal'
                            ? 'bg-[#002133] text-white border-[#002133] font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <Landmark className="w-3.5 h-3.5 text-[#f75142] shrink-0" />
                        <span className="font-bold text-[11px] leading-tight">Diretor Municipal</span>
                        <span className="text-[9px] opacity-75 font-normal">Fred Silva</span>
                      </button>

                      <button
                        type="button"
                        id="preset-inspetor-escolar-btn"
                        onClick={() => handleFillAdminPreset('inspetor_escolar')}
                        className={`py-2 px-2 rounded-xl text-xs transition-all border cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 ${
                          institutionalScope === 'administracao' && adminRole === 'inspetor_escolar'
                            ? 'bg-[#002133] text-white border-[#002133] font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-bold text-[11px] leading-tight">Inspetor Escolar</span>
                        <span className="text-[9px] opacity-75 font-normal">Marcos Dinis</span>
                      </button>

                      <button
                        type="button"
                        id="preset-chefe-reparticao-btn"
                        onClick={() => handleFillAdminPreset('chefe_reparticao')}
                        className={`py-2 px-2 rounded-xl text-xs transition-all border cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 ${
                          institutionalScope === 'administracao' && adminRole === 'chefe_reparticao'
                            ? 'bg-[#002133] text-white border-[#002133] font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                        <span className="font-bold text-[11px] leading-tight">Chefe Repartição</span>
                        <span className="text-[9px] opacity-75 font-normal">Augusto Nvula</span>
                      </button>

                      <button
                        type="button"
                        id="preset-admin-sistema-btn"
                        onClick={() => handleFillAdminPreset('admin_sistema')}
                        className={`py-2 px-2 rounded-xl text-xs transition-all border cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 ${
                          institutionalScope === 'administracao' && adminRole === 'admin_sistema'
                            ? 'bg-[#002133] text-white border-[#002133] font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-bold text-[11px] leading-tight">Admin Sistema</span>
                        <span className="text-[9px] opacity-75 font-normal">Super TI</span>
                      </button>
                    </div>
                  )}
                </div>

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
                        placeholder="nome@ucore.edu.br"
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
                      />
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

                  {/* Google Workspace Sign In */}
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-white px-2.5 text-slate-400 font-bold tracking-wider">
                        ou acesse com conta Google
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <GoogleSignInButton
                      onClick={handleGoogleSignInFlow}
                      isLoading={isGoogleLoading}
                      label="Entrar com o Google"
                      className="w-full max-w-full justify-center"
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
            ) : (
              /* REGISTER VIEW */
              <div className="max-w-[440px] mx-auto w-full space-y-4">
                
                {/* Header */}
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#f75142] bg-[#fef2f1] px-3 py-1 rounded-full mb-2">
                    Novo Cadastro
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002133] tracking-tight">
                    Crie a sua conta
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Junte-se à plataforma Sigre para gerir turmas, notas e indicadores escolares.
                  </p>
                </div>

                {/* Feedback Alerts */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  
                  {/* 1. Âmbito Institucional de Atuação */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>1. Âmbito Institucional de Atuação</span>
                      <span className="text-[10px] font-normal text-slate-500">Selecione o seu setor</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInstitutionalScope('escola')}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2.5 ${
                          institutionalScope === 'escola'
                            ? 'bg-[#002133] text-white border-[#002133] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          institutionalScope === 'escola' ? 'bg-[#f75142] text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight">Âmbito Escolar</div>
                          <div className="text-[10px] opacity-75">Direção, coordenação e docentes</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInstitutionalScope('administracao')}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2.5 ${
                          institutionalScope === 'administracao'
                            ? 'bg-[#002133] text-white border-[#002133] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          institutionalScope === 'administracao' ? 'bg-[#f75142] text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Landmark className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight">Administração (DME)</div>
                          <div className="text-[10px] opacity-75">Direção municipal e inspecção</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 2. Flexão da Função / Cargo Específico */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>2. Função / Cargo a Desempenhar</span>
                      <span className="text-[10px] font-semibold text-[#f75142]">Flexão Hierárquica</span>
                    </label>

                    {institutionalScope === 'escola' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {SCHOOL_ROLES_CONFIG.map((roleItem) => {
                            const isSelected = schoolRole === roleItem.id;
                            const RoleIcon = roleItem.icon;
                            return (
                              <button
                                key={roleItem.id}
                                type="button"
                                onClick={() => setSchoolRole(roleItem.id)}
                                className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-1 ${
                                  isSelected
                                    ? 'bg-[#002133] text-white border-[#002133] shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <RoleIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#f75142]' : 'text-slate-500'}`} />
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {roleItem.badge}
                                  </span>
                                </div>
                                <span className="text-xs font-bold leading-tight">{roleItem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        {/* Selected Role Info Pill */}
                        {(() => {
                          const active = SCHOOL_ROLES_CONFIG.find(r => r.id === schoolRole);
                          return active ? (
                            <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-[#f75142] shrink-0" />
                              <span>{active.desc}</span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {ADMIN_ROLES_CONFIG.map((roleItem) => {
                            const isSelected = adminRole === roleItem.id;
                            const RoleIcon = roleItem.icon;
                            return (
                              <button
                                key={roleItem.id}
                                type="button"
                                onClick={() => setAdminRole(roleItem.id)}
                                className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-1 ${
                                  isSelected
                                    ? 'bg-[#002133] text-white border-[#002133] shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <RoleIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#f75142]' : 'text-slate-500'}`} />
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {roleItem.badge}
                                  </span>
                                </div>
                                <span className="text-xs font-bold leading-tight">{roleItem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        {/* Selected Role Info Pill */}
                        {(() => {
                          const active = ADMIN_ROLES_CONFIG.find(r => r.id === adminRole);
                          return active ? (
                            <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-[#f75142] shrink-0" />
                              <span>{active.desc}</span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* 3. Lotação Institucional Pré-Definida no Sigre */}
                  <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-[#002133]" />
                        3. Lotação Institucional Sigre
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Opções Cadastradas na Rede
                      </span>
                    </div>

                    {/* Município Dropdown */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Município / Repartição da Educação
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Landmark className="w-4 h-4" />
                        </div>
                        <select
                          id="register-municipality-select"
                          value={selectedMunicipality}
                          onChange={(e) => setSelectedMunicipality(e.target.value)}
                          className="w-full h-[44px] pl-9 pr-8 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-2 focus:ring-[#f75142]/10 text-xs font-semibold text-slate-900 outline-none transition-all shadow-xs cursor-pointer"
                        >
                          {UCORE_MUNICIPALITIES.map((mun) => (
                            <option key={mun} value={mun}>
                              {mun}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Escola Dropdown (only for school scope) */}
                    {institutionalScope === 'escola' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                          <span>Unidade Escolar de Lotação</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {initialAdminSchools.length} escolas municipais
                          </span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <School className="w-4 h-4" />
                          </div>
                          <select
                            id="register-school-select"
                            value={selectedSchoolId}
                            onChange={(e) => setSelectedSchoolId(e.target.value)}
                            className="w-full h-[44px] pl-9 pr-8 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-2 focus:ring-[#f75142]/10 text-xs font-semibold text-slate-900 outline-none transition-all shadow-xs cursor-pointer truncate"
                          >
                            {initialAdminSchools.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.category})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Se Professor: Disciplina & Classe */}
                    {institutionalScope === 'escola' && schoolRole === 'professor' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Disciplina / Cadeira
                          </label>
                          <select
                            id="register-subject-select"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="w-full h-[42px] px-3 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-2 focus:ring-[#f75142]/10 text-xs font-semibold text-slate-900 outline-none transition-all shadow-xs cursor-pointer"
                          >
                            {UCORE_DISCIPLINAS.map((disc) => (
                              <option key={disc} value={disc}>
                                {disc}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Nível / Grau
                          </label>
                          <select
                            id="register-grade-select"
                            value={selectedGradeClass}
                            onChange={(e) => setSelectedGradeClass(e.target.value)}
                            className="w-full h-[42px] px-3 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-2 focus:ring-[#f75142]/10 text-xs font-semibold text-slate-900 outline-none transition-all shadow-xs cursor-pointer"
                          >
                            {UCORE_GRAUS_CLASSES.map((grau) => (
                              <option key={grau} value={grau}>
                                {grau}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Documento de Identificação (BI) e Contacto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nº Bilhete de Identidade (BI) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <input
                          id="register-bi-input"
                          type="text"
                          required
                          value={biNumber}
                          onChange={(e) => setBiNumber(e.target.value)}
                          placeholder="Ex: 008892144LA012"
                          className="w-full h-[46px] pl-10 pr-3 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-xs text-slate-900 uppercase font-semibold placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Telefone / Telemóvel
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          id="register-phone-input"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+244 923 000 000"
                          className="w-full h-[46px] pl-10 pr-3 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Real-time Pre-Registration Detection Banner */}
                  {preRegResult?.found ? (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 animate-in fade-in">
                      <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-bold text-emerald-900">
                          Registro Pré-Existente Localizado no Sistema Sigre!
                        </p>
                        <p className="text-emerald-700 mt-0.5">
                          {preRegResult.details}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Homologação simplificada ativada
                        </span>
                      </div>
                    </div>
                  ) : (
                    (schoolRole.includes('diretor') || schoolRole === 'professor') && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-[11px] text-slate-500">
                        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>
                          {schoolRole.includes('diretor')
                            ? 'A candidatura de Diretor será enviada ao Administrador Central (DME) para homologação.'
                            : 'A inscrição docente será enviada à Direção da escola selecionada para aprovação.'}
                        </span>
                      </div>
                    )
                  )}

                  {/* Nome e Sobrenome lado a lado no desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Primeiro Nome
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="register-firstname-input"
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Ex: Carlos"
                          className="w-full h-[48px] pl-10 pr-3 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Sobrenome
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="register-lastname-input"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Ex: Silva"
                          className="w-full h-[48px] pl-10 pr-3 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* E-mail Institucional */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      E-mail Institucional
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="register-email-input"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu.nome@sigre.edu.ao"
                        className="w-full h-[48px] pl-10 pr-3 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Senha e Confirmação lado a lado com orientação */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Senha
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="register-password-input"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full h-[48px] pl-10 pr-9 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="register-confirm-password-input"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a senha"
                          className="w-full h-[48px] pl-10 pr-9 rounded-xl border border-slate-200 bg-white focus:border-[#f75142] focus:ring-4 focus:ring-[#f75142]/10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Orientação de senha próxima ao campo */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>A senha deve possuir no mínimo 6 caracteres para assegurar o acesso.</span>
                  </div>

                  {/* Termos de uso */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-[#f75142] focus:ring-[#f75142] border-slate-300 cursor-pointer"
                      />
                      <span className="leading-tight">
                        Concordo com os <span className="text-[#f75142] font-semibold underline">Termos de Uso</span> e a <span className="text-[#f75142] font-semibold underline">Política de Privacidade</span> do Sigre.
                      </span>
                    </label>
                  </div>

                  {/* Create Account Button */}
                  <button
                    id="submit-register-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full h-[48px] sm:h-[50px] rounded-xl bg-[#f75142] hover:bg-[#e04436] text-white font-bold text-sm tracking-wide shadow-[0_6px_20px_rgba(247,81,66,0.25)] hover:shadow-[0_8px_24px_rgba(247,81,66,0.35)] transition-all duration-200 cursor-pointer active:scale-[0.99] disabled:opacity-70 mt-1 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>A criar conta institucional...</span>
                      </>
                    ) : (
                      <>
                        <span>Criar Minha Conta</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Switch to Login */}
                  <div className="text-center pt-2 text-xs text-slate-600">
                    Já possui cadastro na plataforma?{' '}
                    <button
                      type="button"
                      id="switch-to-login-btn"
                      onClick={() => switchMode('login')}
                      className="font-bold text-[#f75142] hover:underline cursor-pointer"
                    >
                      Entrar na Central
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Note (when standalone) */}
      {!hideHeader && (
        <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-200/80 bg-white">
          Sigre • Sistema Integrado de Gestão Escolar para Escolas, Professores e Alunos
        </footer>
      )}
    </div>
  );
};
