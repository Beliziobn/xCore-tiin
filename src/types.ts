export type RoleType = 'admin' | 'diretor' | 'professor' | 'aluno' | 'custom';

// Flexão de Funções no Âmbito Escolar (School Scope)
export type SchoolStaffRole = 
  | 'diretor_geral'              // Diretor(a) Geral
  | 'subdiretor_pedagogico'      // Subdiretor(a) Pedagógico(a)
  | 'subdiretor_administrativo'  // Subdiretor(a) Administrativo(a)
  | 'professor'                  // Professor(a) / Docente
  | 'secretario_escolar'         // Secretário(a) Escolar
  | 'coordenador_pedagogico';    // Coordenador(a) Pedagógico(a) / de Turno

// Flexão de Funções no Âmbito Administrativo Municipal (DME - Direção Municipal da Educação / Nível Central)
export type AdminStaffRole = 
  | 'diretor_municipal'          // Diretor(a) Municipal da Educação
  | 'chefe_reparticao'           // Chefe de Repartição / Departamento de Ensino Geral
  | 'inspetor_escolar'           // Inspetor(a) Escolar Municipal
  | 'tecnico_estatistica'        // Técnico(a) de Planeamento e Estatística
  | 'tecnico_recursos_humanos'   // Técnico(a) de Recursos Humanos / Secretaria Municipal
  | 'admin_sistema';             // Administrador(a) de Sistema Sigre

export interface SessionCard {
  id: string;
  title: string;
  value: string;
  icon: 'home' | 'user' | 'users' | 'flag';
  description?: string;
  details?: string[];
  actionText?: string;
  isClickable?: boolean;
  targetView?: string;
}

export interface SessionSettings {
  autoSync: boolean;
  emailAlerts: boolean;
  dailyReports: boolean;
  showPercentages: boolean;
  privacyLevel: 'institucional' | 'restrito' | 'publico';
  accessScope: string;
  allowedActions: string[];
}

export interface SessionProfile {
  id: string;
  role: RoleType;
  name: string;
  greeting: string; // e.g. "Olá Admin. Fred", "Olá Diretor Carl", "Olá Prof. John"
  title: string;
  email: string;
  unit: string;
  academicYear: string;
  cards: SessionCard[];
  settings: SessionSettings;
  notifications: NotificationItem[];
  pages: { id: string; title: string; desc: string }[];
}

export interface SchoolStat {
  id: string;
  title: string;
  count: string;
  iconName: 'school' | 'teacher' | 'students';
  description: string;
  growth: string;
  details: string[];
}

export interface EducationalModule {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  features: string[];
  status: 'Ativo' | 'Disponível';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'academic' | 'alert' | 'event';
}

export interface UserAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: RoleType;
  scope?: 'escola' | 'administracao';
  schoolRole?: SchoolStaffRole;
  adminRole?: AdminStaffRole;
  cargoTitle?: string;
  schoolName?: string;
  schoolId?: string;
  municipalityOrDepartment?: string;
  titlePrefix?: string;
  greeting?: string;
  avatar?: string;
  rememberMe?: boolean;
  accountValidated?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  fullName?: string;
  // Authorization & Pending Approval Workflow
  status?: 'ativo' | 'pendente' | 'rejeitado';
  biNumber?: string;
  phone?: string;
  subject?: string;
  gradeClass?: string;
  linkedPreRegistrationId?: string;
  isPreRegistered?: boolean;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  approverTargetRole?: 'admin' | 'diretor';
  approverTargetSchoolName?: string;
  approverTargetEmail?: string;
  rejectionReason?: string;
  nivelAcademico?: string;
  anosServico?: number;
  regimeTrabalho?: string;
  classificacaoPedagogica?: string;
  numeroMecanograficoOuNif?: string;
  documentosConferidosPresencialmente?: boolean;
  passwordVerifier?: string;
}

export interface PendingApprovalComplementaryData {
  nivelAcademico?: string;
  nivelAcademicoOutro?: string;
  anosServico?: number;
  classificacaoPedagogica?: string;
  especialidadeCurso?: string;
  regimeTrabalho?: string;
  numeroMecanograficoOuNif?: string;
  numeroCertificadoDiploma?: string;
  documentosConferidosPresencialmente?: boolean;
  dataInicioFuncoes?: string;
  observacoesComplementares?: string;
  condicaoMatricula?: 'primeira_vez' | 'repetente';
  documentoTipoApresentado?: string;
  grauEscolaridadeAnterior?: string;
}

export interface PendingApplication {
  id: string;
  userId: string;
  type: 'diretor' | 'professor' | 'aluno' | 'funcionario' | 'membro_dme' | string;
  scope?: 'escola' | 'administracao';
  schoolRole?: SchoolStaffRole;
  adminRole?: AdminStaffRole;
  fullName: string;
  email: string;
  phone: string;
  biNumber: string;
  schoolName: string;
  schoolId?: string;
  municipality: string;
  targetApproverRole: 'admin' | 'diretor';
  targetApproverEmail?: string;
  approverDirectorName?: string;
  subject?: string;
  gradeClass?: string;
  roleRequested?: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  isPreRegistered: boolean;
  preRegisteredDetails?: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  passwordVerifier?: string;
  // Complementary data added upon approval by Director or Admin
  complementaryData?: PendingApprovalComplementaryData;
  nivelAcademico?: string;
  nivelAcademicoOutro?: string;
  anosServico?: number;
  regimeTrabalho?: string;
  classificacaoPedagogica?: string;
  especialidadeCurso?: string;
  numeroMecanograficoOuNif?: string;
  numeroCertificadoDiploma?: string;
  documentosConferidosPresencialmente?: boolean;
  dataInicioFuncoes?: string;
  assignedRoom?: string;
  assignedTurma?: string;
  assignedShift?: string;
}

export type DirectorPageType = 
  | 'dashboard' 
  | 'estatisticas' 
  | 'professores' 
  | 'alunos' 
  | 'salas' 
  | 'classes' 
  | 'perfil';

export interface DirectorTeacher {
  id: string;
  name: string;
  schoolName: string;
  gradeClass: string; // e.g. "4ª Classe"
  room: string; // e.g. "Sala 03"
  turma: string; // e.g. "Turma A"
  directorName: string; // "Fert Horlan"
  location: string; // "Pavilhão 1 - Bloco B"
  subject: string;
  presenceRate: number; // e.g. 98.5
  shift: 'Manhã' | 'Tarde' | 'Integral';
  phone?: string;
  email?: string;
  registrationData?: TeacherRegistrationData;
  schedule: {
    day: string;
    period: string;
    subject: string;
    room: string;
  }[];
}

export type StudentDocumentType = 'BI' | 'Cedula pessoal' | 'Cédula' | 'Passaporte' | 'Assento' | 'sem Documento';

export type StudentNaturezaEscola = 'Pública' | 'Público-Privada' | 'Privada';

export type StudentTipoDeficiencia =
  | 'Auditiva'
  | 'Intelectual'
  | 'Visual'
  | 'Surdo-cegueira'
  | 'Múltiplas'
  | 'Físico-autista'
  | 'Altas habilidades';

export type StudentModalidadeKey =
  | 'pre_escolar' // A. Educação Pré-Escolar
  | 'iniciacao' // B. Classe de Iniciação
  | 'especial_pre_escolar' // C. Ensino Especial – Pré-escolar / Iniciação
  | 'primario_regular' // D. Ensino Primário Regular
  | 'primario_especial' // E. Ensino Primário Especial
  | 'praeer' // F. PRAEER
  | 'primario_adultos' // G. Ensino Primário de Adultos
  | 'ciclo1_geral' // H. Iº Ciclo do Ensino Secundário Geral
  | 'ciclo1_especial' // I. Iº Ciclo Ensino Especial
  | 'ciclo1_tecnico' // J. Iº Ciclo Técnico-Profissional
  | 'ciclo1_adultos_eja' // K. Iº Ciclo do Ensino Secundário de Adultos (EJA)
  | 'ciclo2_geral' // L. IIº Ciclo do Ensino Secundário Geral
  | 'ciclo2_especial' // M. IIº Ciclo Ensino Especial
  | 'ciclo2_tecnico' // N. IIº Ciclo Técnico-Profissional
  | 'ciclo2_formacao_professores'; // O. IIº Ciclo Formação de Professores

export interface StudentRegistrationData {
  id?: string;
  name: string;
  nomeCompleto?: string;
  genero: 'M' | 'F' | 'Outro';
  dataNascimento: string;
  idade: number;
  faixaEtariaCalculada?: string;

  // Documents
  tipoDocumento: StudentDocumentType;
  numeroDocumento?: string;
  anexoDocumento?: string; // base64 or file URL
  anexoDocumentoNome?: string;
  foto?: string;

  // School and Modality (Categories A to O)
  naturezaEscola?: StudentNaturezaEscola;
  tipoEscolaModalidade?: StudentModalidadeKey;
  tipoEscolaNome?: string;
  classeEtapaModulo?: string;
  idadeEspecificaNivel?: string;
  isEnsinoEspecial?: boolean;
  tiposDeficiencia?: StudentTipoDeficiencia[];

  // Classes & Scheduling
  classe: string; // e.g. "4ª Classe"
  turma: string; // e.g. "Turma A"
  periodo?: string; // "Manhã" | "Tarde" | "Integral"
  turno?: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
  sala?: string; // "Sala 03"
  escola?: string;
  schoolId?: string;
  categoriaEscola?: string;

  // Additional data
  condicaoMatricula: 'primeira_vez' | 'repetente';
  alunoRepetente?: boolean;
  temNecessidadesEspeciais?: boolean;
  deficienciasInclusivas?: StudentTipoDeficiencia[];
  transferido?: boolean;
  escolaOrigem?: string;

  // Family & Contacts
  nomePai?: string;
  nomeMae?: string;
  encarregado: string;
  parentescoEncarregado?: string;
  telefone: string;
  telefoneAlternativo?: string;
  endereco?: string;
  provincia?: string;
  municipio?: string;
  observacoes?: string;

  // Audit
  dataCadastro?: string;
  codigoMatricula?: string;

  // Compatibility & SIGE Aggregation Fields
  nomeEscola?: string;
  idadeCalculada?: number;
  faixaEtariaSelecionada?: string;
  possuiDocumento?: boolean;
  documentType?: string;
  attendanceRate?: number;
  averageGrade?: number;
  statusAcademico?: string;
  modalidadeKey?: StudentModalidadeKey;
}

export interface DirectorStudent {
  id: string;
  name: string;
  gradeClass: string; // "4ª Classe"
  room: string; // "Sala 03"
  turma: string; // "Turma A"
  teacherName: string;
  guardianName: string; // Encarregado
  location: string;
  hasDocuments: boolean; // com documentos vs sem documentos
  documentType?: StudentDocumentType | string;
  numeroDocumento?: string;
  dataNascimento?: string;
  idade?: number;
  condicaoMatricula?: 'primeira_vez' | 'repetente';
  foto?: string;
  anexoDocumentoNome?: string;
  performanceScore: number; // e.g. 8.4
  presenceRate: number; // e.g. 96.2
  registrationData?: StudentRegistrationData;
}

export interface DirectorRoom {
  id: string;
  roomNumber: string; // "Sala 01", "Sala 02", etc.
  name: string;
  turmasCount: number; // e.g. 2
  turmas: string[];
  period: string; // "Manhã / Tarde"
  classes: string[]; // ["4ª Classe", "5ª Classe"]
  teachers: string[];
  capacity: number;
  currentStudents: number;
  status: 'Ativa' | 'Manutenção' | 'Especial';
  type: 'Regular' | 'Laboratório' | 'Recursos Multifuncionais (AEE)' | 'Biblioteca';
}

export const MAX_TURMA_CAPACITY = 45;

export interface TurmaDetail {
  name: string;
  studentCount: number;
  maxCapacity: number;
  shift?: string;
  room?: string;
  isFull?: boolean;
}

export interface DirectorClass {
  id: string;
  name: string; // "1ª Classe", "4ª Classe", "Módulo 1", "PRAEER Etapa 1", etc.
  category?: 'regular' | 'modulo' | 'praeer';
  period: string; // "Manhã" | "Tarde" | "Manhã e Tarde"
  room: string; // "Sala 03"
  studentCount: number; // e.g. 48
  teachers: string[];
  turmas: string[];
  turmasDetails?: TurmaDetail[];
}

export interface DirectorProfileInfo {
  name: string; // "Fert Horlan"
  schoolName: string; // "Escola Modelo Central"
  periods: string; // "Manhã e Tarde"
  classesCount: string; // "1ª à 9ª Classe"
  roomsCount: string; // "11 Salas"
  phone: string; // "+244 923 456 789"
  turmasCount: string; // "16 Turmas"
  studentsCount: string; // "478 Alunos"
  teachersCount: string; // "23 Professores"
  email: string;
  status: string;
  avatar?: string;
}

export type SchoolNatureza = 'Pública' | 'Público-Privada' | 'Privada';

export type SchoolDeficiencia =
  | 'Auditiva'
  | 'Intelectual'
  | 'Visual'
  | 'Surdo-cegueira'
  | 'Múltiplas'
  | 'Físico-motora'
  | 'Físico-autista'
  | 'Altas habilidades';

export interface SchoolInfraestrutura {
  salasDefinitivas: number;
  salasProvisorias: number;
  salasImprovisadas: number;
  salasAoArLivre: number;
  totalSalas: number;
  turmasFuncionamento: number;
  turnos: ('Manhã' | 'Tarde' | 'Noite')[];
  temBiblioteca: boolean;
  temCantinaRefeitorio: boolean;
  temAguaPotavel: boolean;
  tipoAgua?: string;
  temElectricidade: boolean;
  tipoElectricidade?: string;
  acessibilidadeDeficiencia: boolean;
  detalhesAcessibilidade?: string;
}

export interface SchoolOfertaEducativa {
  // Pré-Escolar
  preEscolar: {
    activo: boolean;
    creche: boolean;
    jardim1: boolean;
    jardim2: boolean;
    centroInfantil: boolean;
    cicCec: boolean;
    iniciacao: boolean;
  };
  // Ensino Primário
  primario: {
    activo: boolean;
    regular1a6: boolean;
    adultosModulos: boolean;
    praeerEtapas: boolean;
  };
  // Ensino Secundário
  secundario: {
    activo: boolean;
    ciclo1Geral: boolean; // 7ª, 8ª e 9ª
    ciclo1TecnicoProfissional: boolean;
    ciclo1AdultosEJA: boolean; // 1º e 2º ano
    ciclo2Geral: boolean; // 10ª, 11ª e 12ª
    ciclo2TecnicoProfissional: boolean; // 10ª a 13ª
    ciclo2FormacaoProfessores: boolean; // 10ª a 13ª
  };
  // Ensino Especial (escolas específicas)
  ensinoEspecial: {
    activo: boolean;
    preEscolarIniciacao: boolean;
    primarioEspecial: boolean;
    ciclo1Especial: boolean;
    ciclo2Especial: boolean;
    tiposDeficiencia: SchoolDeficiencia[];
  };
}

export interface SchoolPessoal {
  totalEducadoresInfancia: number;
  totalAuxiliaresAccaoEducativa: number;
  totalDocentesProfessores: number;
  totalAlfabetizadores: number;
  totalPessoalNaoDocente: number;
  docentesComFormacaoPedagogica: number;
  docentesSemFormacaoPedagogica: number;
  totalAlunosDeclarados?: number;
}

export interface SchoolSituacaoFuncionamento {
  emPlenoFuncionamento: boolean;
  escolaNovaCriada: boolean;
  regimeComplexoEscolar: boolean;
  observacoesDificuldades: string;
}

export interface SchoolValidacaoDocumentos {
  documentoCriacaoNumero: string; // Alvará / Decreto executivo / Portaria
  dataDocumentoCriacao?: string;
  orgaoEmissor?: string;
  dataUltimaActualizacao: string;
  responsavelPreenchimentoNome: string;
  responsavelPreenchimentoCargo: string;
}

export interface SchoolAuditHistoryItem {
  id: string;
  data: string;
  usuario: string;
  cargo: string;
  acao: string;
  detalhes: string;
}

export interface SchoolRegistrationData {
  id: string;
  // 1. Identificação
  nomeOficial: string;
  codigoSIGE?: string;
  endereco: {
    rua: string;
    bairro: string;
    comuna: string;
    municipio: string;
    provincia: string;
  };
  coordenadas?: {
    latitude: string;
    longitude: string;
  };
  contactoTelefonico: string;
  emailDireccao: string;
  director: {
    nome: string;
    contacto: string;
    email?: string;
  };
  anoCriacao: number | string;

  // 2. Natureza
  natureza: SchoolNatureza;

  // 3. Oferta Educativa
  oferta: SchoolOfertaEducativa;

  // 4. Infra-estruturas
  infraestrutura: SchoolInfraestrutura;

  // 5. Pessoal
  pessoal: SchoolPessoal;

  // 6. Situação de Funcionamento
  situacao: SchoolSituacaoFuncionamento;

  // 7. Validação e Documentos
  validacao: SchoolValidacaoDocumentos;

  // Auditoria
  historicoAlteracoes: SchoolAuditHistoryItem[];
}

export interface AdminSchool {
  id: string;
  name: string;
  directorName: string;
  teachersCount: number;
  classesCount: number;
  roomsCount: number;
  turmasCount: number;
  location: string;
  studentsWithDocs: number;
  studentsWithoutDocs: number;
  declaredStudentsCount?: number;
  performanceRate: number; // e.g. 79
  attendanceRate: number; // e.g. 96.2
  category: 'Ensino Primário' | 'Iº Ciclo' | 'IIº Ciclo' | 'Polivalente';
  natureza?: SchoolNatureza;
  codigoSIGE?: string;
  phone: string;
  email: string;
  logoSvg?: string;
  registrationData?: SchoolRegistrationData;
}

export interface AdminTeacher {
  id: string;
  name: string;
  phone: string;
  gradeClass: string;
  room: string;
  turma: string;
  category: string; // e.g. "Professor Efetivo", "Licenciado", "Coordenador"
  location: string;
  schoolName: string;
  schoolId?: string;
  presenceRate: number;
  subject: string;
  gender?: 'F' | 'M' | string;
  qualification?: string;
  registrationData?: TeacherRegistrationData;
}

export interface AdminStudent {
  id: string;
  name: string;
  gender: 'F' | 'M';
  gradeClass: string;
  grade?: string;
  room: string;
  turma: string;
  guardianName: string;
  location: string;
  presenceRate: number;
  hasDocuments: boolean;
  documentType?: StudentDocumentType | string;
  numeroDocumento?: string;
  dataNascimento?: string;
  idade?: number;
  age?: number;
  condicaoMatricula?: 'primeira_vez' | 'repetente';
  foto?: string;
  anexoDocumentoNome?: string;
  performanceScore: number; // 0 to 10 or 0 to 100
  schoolName: string;
  schoolId?: string;
  schoolType?: string;
  birthDate?: string;
  status?: string;
  attendanceRate?: number;
  averageGrade?: number;
  registrationData?: StudentRegistrationData;
}

export interface AdminDirector {
  id: string;
  name: string;
  schoolName: string;
  phone: string;
  email: string;
  appointmentYear: number;
  status: 'Ativo' | 'Em Avaliação' | 'Anterior';
  performanceRating: number;
  teachersCount: number;
  studentsCount: number;
  location: string;
  registrationData?: DirectorRegistrationData;
}

// ==========================================
// NOVO MODELO DE CADASTRO DE DIRECTORES
// ==========================================

export type DirectorCargo = 
  | 'Director(a) Geral'
  | 'Subdirector(a) Pedagógico(a)'
  | 'Subdirector(a) Administrativo(a)'
  | 'Director(a)'
  | 'Director(a) Adjunto(a)'
  | 'Secretário(a) Geral / Administrativo'
  | 'Coordenador(a) Pedagógico(a)'
  | 'Outro';

export type DirectorRegime = 
  | 'Efectivo'
  | 'Contratado'
  | 'Em comissão de serviço'
  | 'Outro';

export type DirectorDedicacao = 'Tempo Inteiro' | 'Acumula com leccionação';

export interface DirectorAttachedDoc {
  id: string;
  nome: string;
  tamanho?: string;
  tipo: 'nomeacao' | 'diploma' | 'certificado' | 'outro';
  data: string;
  url?: string;
}

export interface DirectorAuditLog {
  id: string;
  data: string;
  autor: string;
  acao: 'Criação' | 'Atualização' | 'Validação' | 'Homologação' | 'Transição de Mandato';
  detalhes: string;
}

export interface PreviousDirectorRecord {
  id: string;
  nomeCompleto: string;
  cargo: DirectorCargo;
  periodoInicio: string; // e.g. "2018"
  periodoFim: string; // e.g. "2023"
  motivoSaida?: string;
  observacoes?: string;
}

export interface DirectorRegistrationData {
  id: string;
  
  // 1. Identificação do Director(a)
  nomeCompleto: string;
  biNif: string;
  sexo: 'Masculino' | 'Feminino' | 'Outro';
  dataNascimento: string; // YYYY-MM-DD
  idade: number; // Calculada automaticamente
  faixaEtaria: TeacherFaixaEtaria; // Calculada automaticamente (18-19, 20-24, etc.)
  telefone: string;
  emailPessoal: string;
  emailInstitucional?: string;
  morada: string;
  provinciaResidencia: string;
  municipioResidencia: string;

  // 2. Ligação à Escola
  escolaId?: string;
  nomeEscola: string;
  codigoEscola?: string;
  naturezaEscola: TeacherNaturezaEscola; // Herdada da escola e confirmável
  provinciaEscola: string;
  municipioEscola: string;
  niveisEscolaOferece: string[]; // Lista de níveis
  niveisEscolaOutro?: string;

  // 3. Situação na Direcção
  cargo: DirectorCargo;
  cargoOutro?: string;
  dataNomeacao: string; // YYYY-MM-DD
  regime: DirectorRegime;
  regimeOutro?: string;
  dedicacao: DirectorDedicacao; // Tempo Inteiro ou Acumula com leccionação
  anosExperienciaDirector: number;
  anosServicoEducacao: number;
  situacaoMandato: 'Atual / Em Exercício' | 'Anterior / Histórico';

  // 4. Formação Pedagógica e Académica (igual ao dos professores)
  temFormacaoPedagogica: boolean;
  temMagisterioCompleto: boolean;
  temImneCompleto: boolean;
  temOutraFormacaoPedagogica: boolean;
  outraFormacaoPedagogicaDesc?: string;
  classificacaoPedagogica: TeacherClassificacaoPedagogica;
  nivelAcademico: TeacherNivelAcademico;
  nivelAcademicoOutro?: string;

  // 5. Formação Específica em Gestão Escolar
  temFormacaoAdministracaoGestao: boolean;
  temFormacaoLiderancaSupervisao: boolean;
  outrasFormacoesGestao?: string;
  anoUltimaFormacaoGestao?: number | string;

  // 6. Experiência e Validação
  foiDirectorOutrasEscolas: boolean;
  experienciaOutrasEscolasDetalhe?: string;
  possuiValidacaoHabilitacoesCargo: boolean;
  documentosAnexos?: DirectorAttachedDoc[];
  observacoes?: string;

  // 7. Dados Complementares Úteis
  professoresSobDirecao: number;
  alunosSobDirecao: number;
  desafiosGestao: string[];
  desafiosGestaoOutro?: string;
  disponibilidadeFormacaoContinua: 'Total' | 'Parcial' | 'Não Disponível';

  // Histórico e Auditoria
  directoresAnteriores?: PreviousDirectorRecord[];
  historicoAlteracoes: DirectorAuditLog[];
  criadoEm: string;
  atualizadoEm: string;
}

export type ChatRole = 'admin' | 'diretor' | 'professor' | 'suporte';

export interface ChatMessage {
  id: string;
  channelId: string;
  schoolId?: string;
  schoolName?: string;
  senderId: string;
  senderName: string;
  senderRole: ChatRole;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  attachmentName?: string;
  attachmentSize?: string;
  attachmentType?: 'image' | 'pdf' | 'document' | 'other';
  attachmentUrl?: string;
  isHelpRequest?: boolean;
}

export type ChatChannelMember = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  online?: boolean;
};

export interface ChatChannel {
  id: string;
  schoolName: string;
  name: string;
  category: string;
  description: string;
  iconType: 'support' | 'shield' | 'school' | 'user' | 'bell';
  targetAudience: string;
  unreadCount: number;
  lastMessageSnippet?: string;
  lastMessageTime?: string;
  members?: ChatChannelMember[];
}

export type SchoolDemandType = 'notas' | 'matriculas' | 'geral';

export interface SchoolAnnouncement {
  id: string;
  title: string;
  demandType: SchoolDemandType;
  headline: string;
  description: string;
  displayUrl: string;
  targetSchools: string; // e.g. "Todas as Escolas" or specific school names
  coverImage?: string;
  coverImageName?: string;
  createdAt: string;
  createdBy: string;
  expirationDate: string; // ISO date-time string e.g. "2026-09-15T23:59"
  ctaText?: string;
  badgeText?: string;
  priority?: 'urgente' | 'alta' | 'normal';
  viewsCount?: number;
  clicksCount?: number;
}

// ==========================================
// NOVO MODELO DE CADASTRO DE PROFESSORES
// ==========================================

export type TeacherFaixaEtaria = 
  | 'menor de 18'
  | '18-19'
  | '20-24'
  | '25-29'
  | '30-34'
  | '35-39'
  | 'mais de 39 anos';

export type TeacherNaturezaEscola = 'Pública' | 'Público-Privada' | 'Privada';

export type TeacherTipoInstituicao = 
  | 'Creche'
  | 'Jardim de infância'
  | 'Centro infantil'
  | 'CIC / CEC'
  | 'Escola com classe de Iniciação'
  | 'Outro';

export type TeacherFuncaoCategoria = 
  | 'Educador(a) de Infância'
  | 'Auxiliar de Acção Educativa'
  | 'Docente / Professor'
  | 'Alfabetizador(a)'
  | 'Outro';

export type TeacherClassificacaoPedagogica = 
  | 'Com magistério e com IMNE completo'
  | 'Sem Magistério e com formação Pedagógica'
  | 'Sem Magistério e sem Formação pedagógica';

export type TeacherNivelAcademico = 
  | 'Até à 6.ª classe'
  | '7.ª a 8.ª classe'
  | '9.ª a 10.ª classe'
  | '11.ª a 12.ª classe'
  | 'Bacharelato'
  | 'Licenciado'
  | 'Pós-licenciado (mestrado / doutoramento)'
  | 'Outro';

export type TeacherRegimeTrabalho = 'Efectivo' | 'Contratado' | 'Voluntário' | 'Colaborador' | 'Outro';

export interface TeacherTeachingLevel {
  id: string; // e.g. 'pre_escola', 'primario', 'praeer', 'primario_adultos', 'alfabetizacao', 'eja', 'i_ciclo_geral', 'i_ciclo_tecnico', 'ii_ciclo_geral', 'ii_ciclo_tecnico', 'ii_ciclo_formacao_prof', 'outro'
  nome: string;
  detalhe?: string; // Etapa 1/2/3, Módulo 1/2/3, 1º ano/2º ano/total, ou texto de Outro
}

export interface TeacherAttachedDoc {
  id: string;
  nome: string;
  tamanho?: string;
  tipo?: string;
  data: string;
  url?: string;
}

export interface TeacherAuditLog {
  id: string;
  data: string;
  autor: string;
  acao: 'Criação' | 'Atualização' | 'Validação' | 'Homologação';
  detalhes: string;
}

export interface TeacherRegistrationData {
  id: string;
  // 1. Identificação do Professor
  nomeCompleto: string;
  biNif: string;
  sexo: 'Masculino' | 'Feminino' | 'Outro';
  dataNascimento: string; // YYYY-MM-DD
  faixaEtaria: TeacherFaixaEtaria;
  telefone: string;
  email: string;
  morada: string;
  provinciaResidencia: string;
  municipioResidencia: string;

  // 2. Natureza e Tipo de Escola onde lecciona
  escolaId?: string;
  naturezaEscola: TeacherNaturezaEscola;
  nomeEscola: string;
  codigoEscola?: string;
  provinciaEscola: string;
  municipioEscola: string;
  tipoInstituicao: TeacherTipoInstituicao;
  tipoInstituicaoOutro?: string;

  // 3. Nível / Modalidade em que lecciona (múltiplos)
  niveisLecciona: TeacherTeachingLevel[];

  // 4. Função / Categoria
  funcaoCategoria: TeacherFuncaoCategoria;
  funcaoCategoriaOutro?: string;

  // 5. Formação Pedagógica (em cascata)
  temFormacaoPedagogica: boolean;
  temMagisterioCompleto: boolean;
  temImneCompleto: boolean;
  temOutraFormacaoPedagogica: boolean;
  outraFormacaoPedagogicaDesc?: string;
  classificacaoPedagogica: TeacherClassificacaoPedagogica;

  // 6. Nível Académico / Habilitação Literária
  nivelAcademico: TeacherNivelAcademico;
  nivelAcademicoOutro?: string;

  // 7. Situação Profissional e Validação
  regimeTrabalho: TeacherRegimeTrabalho;
  regimeTrabalhoOutro?: string;
  anosServico: number;
  disciplinas: string;
  possuiValidacaoHabilitacoes: boolean;
  documentoValidacaoNome?: string;
  documentoValidacaoUrl?: string;
  observacoes?: string;
  documentosAnexos?: TeacherAttachedDoc[];

  // 8. Dados Adicionais Úteis para Organização
  numeroTurmas: number;
  numeroAlunosAproximado: number;
  turnos: ('Manhã' | 'Tarde' | 'Noite')[];
  necessidadesFormacaoContinua?: string;
  disponibilidadeOutrosNiveis?: string;

  // Auditoria
  historicoAlteracoes: TeacherAuditLog[];
  criadoEm: string;
  atualizadoEm: string;
}

// ============================================================================
// RAG INTELIGENTE: ESTRUTURA DE DADOS VETORIAIS E GERAÇÃO AUMENTADA
// ============================================================================
export type RagCategory =
  | 'normativo_med'
  | 'pedagogico'
  | 'secretaria_matriculas'
  | 'calendario_letivo'
  | 'sistema_ucore'
  | 'institucional';

export interface RagChunkClient {
  id: string;
  documentId: string;
  documentTitle: string;
  category: RagCategory;
  sectionTitle: string;
  content: string;
  legalReference?: string;
  keywords: string[];
  createdAt: string;
  similarityScore?: number;
}

export interface RagDocumentClient {
  id: string;
  title: string;
  category: RagCategory;
  summary: string;
  author: string;
  legalReference?: string;
  chunkCount: number;
  createdAt: string;
  isCustom?: boolean;
}

export interface RagQueryResultClient {
  query: string;
  answer: string;
  retrievedChunks: RagChunkClient[];
  modelUsed: string;
  durationMs: number;
  isAugmentedByGemini: boolean;
  timestamp: string;
}

export interface RagStatsClient {
  totalDocuments: number;
  totalChunks: number;
  categories: RagCategory[];
  geminiConfigured: boolean;
}

// ============================================================================
// SERVIÇOS RÁPIDOS (SELF-SERVICE / PUBLIC CITIZEN SERVICES WITHOUT LOGIN)
// ============================================================================
export type QuickServiceType = 
  | 'BOLETIM_NOTAS' 
  | 'DECLARACAO_EFECTIVIDADE' 
  | 'DECLARACAO_SERVICO'
  | 'GUIA_FERIAS'
  | 'GUIA_COLOCACAO'
  | 'DECLARACAO_MATRICULA' 
  | 'GUIA_TRANSFERENCIA';

export type QuickServiceStatus = 'PENDENTE' | 'EM_ANALISE' | 'CONCLUIDO' | 'REJEITADO';

export interface QuickServiceRequest {
  id: string;
  protocol: string; // Ex: SR-2026-8492
  serviceType: QuickServiceType;
  title: string;
  status: QuickServiceStatus;
  createdAt: string;
  updatedAt: string;

  // Requester (public citizen / encarregado / funcionário - no login required)
  requesterName: string;
  requesterPhone: string;
  requesterEmail?: string;
  requesterRoleTitle?: string;

  // Target routing
  targetRole: 'DIRECTOR' | 'ADMIN';
  targetSchoolId?: string;
  targetSchoolName?: string;
  targetDirectorEmail?: string;
  targetAdminEmail?: string;

  // Request specifics
  details: {
    // Boletim de notas
    studentName?: string;
    studentBiOrProcesso?: string;
    studentClasse?: string;
    studentTurma?: string;
    studentPeriodo?: string;
    trimestre?: string;
    academicYear?: string;

    // Declaração de efectividade
    employeeName?: string;
    employeeBi?: string;
    employeeAgente?: string;
    employeeSchoolOrDepartment?: string;
    employeeCategory?: string;
    referenceMonthYear?: string;
    purpose?: string;

    // General & notes
    notes?: string;
    responseMessage?: string;
    resolvedAt?: string;
    resolvedBy?: string;
  };
}



