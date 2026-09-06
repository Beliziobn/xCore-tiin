export type RoleType = 'admin' | 'diretor' | 'professor' | 'custom';

export interface SessionCard {
  id: string;
  title: string;
  value: string;
  icon: 'home' | 'user' | 'users' | 'flag';
  description?: string;
  details?: string[];
  actionText?: string;
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
  titlePrefix?: string;
  greeting?: string;
  avatar?: string;
  rememberMe?: boolean;
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
  schedule: {
    day: string;
    period: string;
    subject: string;
    room: string;
  }[];
}

export type StudentDocumentType = 'BI' | 'Cedula pessoal' | 'Assento' | 'sem Documento';

export interface StudentRegistrationData {
  id?: string;
  name: string;
  genero: 'M' | 'F';
  dataNascimento: string;
  idade: number;
  tipoDocumento: StudentDocumentType;
  numeroDocumento?: string;
  anexoDocumento?: string; // base64 or file URL
  anexoDocumentoNome?: string;
  classe: string; // e.g. "4ª Classe"
  turma: string; // e.g. "Turma A"
  periodo?: string; // "Manhã" | "Tarde" | "Integral"
  sala?: string; // "Sala 03"
  condicaoMatricula: 'primeira_vez' | 'repetente';
  foto?: string;
  nomePai?: string;
  nomeMae?: string;
  encarregado: string;
  parentescoEncarregado?: string;
  telefone: string;
  telefoneAlternativo?: string;
  endereco?: string;
  observacoes?: string;
  escola?: string;
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

export interface DirectorClass {
  id: string;
  name: string; // "1ª Classe", "4ª Classe", etc.
  period: string; // "Manhã" | "Tarde" | "Manhã e Tarde"
  room: string; // "Sala 03"
  studentCount: number; // e.g. 48
  teachers: string[];
  turmas: string[];
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
  performanceRate: number; // e.g. 79
  attendanceRate: number; // e.g. 96.2
  category: 'Ensino Primário' | 'Iº Ciclo' | 'IIº Ciclo' | 'Polivalente';
  phone: string;
  email: string;
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
  presenceRate: number;
  subject: string;
}

export interface AdminStudent {
  id: string;
  name: string;
  gender: 'F' | 'M';
  gradeClass: string;
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
  condicaoMatricula?: 'primeira_vez' | 'repetente';
  foto?: string;
  anexoDocumentoNome?: string;
  performanceScore: number; // 0 to 10 or 0 to 100
  schoolName: string;
}

export interface AdminDirector {
  id: string;
  name: string;
  schoolName: string;
  phone: string;
  email: string;
  appointmentYear: number;
  status: 'Ativo' | 'Em Avaliação';
  performanceRating: number;
  teachersCount: number;
  studentsCount: number;
  location: string;
}


