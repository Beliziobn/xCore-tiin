import type { 
  DirectorTeacher, 
  DirectorStudent, 
  DirectorRoom, 
  DirectorClass, 
  DirectorProfileInfo 
} from '../types';

export const directorProfileData: DirectorProfileInfo = {
  name: 'Direcção Escolar',
  schoolName: 'Escola Municipal',
  periods: 'Manhã e Tarde',
  classesCount: '0 Classes',
  roomsCount: '0 Salas',
  phone: '+244 923 000 000',
  turmasCount: '0 Turmas',
  studentsCount: '0 Alunos',
  teachersCount: '0 Professores',
  email: 'escola@ucore.edu.ao',
  status: 'Ano Lectivo 2026/2027',
};

// Initialized empty for live registration
export const directorTeachersData: DirectorTeacher[] = [];

// Initialized empty for live registration
export const directorStudentsData: DirectorStudent[] = [];

// Initialized empty for live registration
export const directorRoomsData: DirectorRoom[] = [];

// Classes oficiais do sistema de ensino
export const directorClassesData: DirectorClass[] = [
  {
    id: 'cls-1',
    name: '1ª Classe',
    category: 'regular',
    period: 'Manhã',
    room: 'Sala 01',
    studentCount: 32,
    teachers: ['Prof.ª Teresa Manuel Quessua'],
    turmas: ['Turma A', 'Turma B'],
  },
  {
    id: 'cls-2',
    name: '2ª Classe',
    category: 'regular',
    period: 'Manhã',
    room: 'Sala 02',
    studentCount: 30,
    teachers: ['Prof. João Baptista Ndongo'],
    turmas: ['Turma A', 'Turma B'],
  },
  {
    id: 'cls-3',
    name: '3ª Classe',
    category: 'regular',
    period: 'Tarde',
    room: 'Sala 03',
    studentCount: 30,
    teachers: ['Prof.ª Celeste Kiala'],
    turmas: ['Turma A'],
  },
  {
    id: 'cls-4',
    name: '4ª Classe',
    category: 'regular',
    period: 'Manhã',
    room: 'Sala 04',
    studentCount: 35,
    teachers: ['Prof. Santar Manuel Goes'],
    turmas: ['Turma A'],
  },
  {
    id: 'cls-5',
    name: '5ª Classe',
    category: 'regular',
    period: 'Tarde',
    room: 'Sala 05',
    studentCount: 34,
    teachers: ['Prof. Ernesto B. Ngonga', 'Prof. Carlos Alberto Silva'],
    turmas: ['Turma A', 'Turma B'],
  },
  {
    id: 'cls-6',
    name: '6ª Classe',
    category: 'regular',
    period: 'Tarde',
    room: 'Sala 06',
    studentCount: 31,
    teachers: ['Prof.ª Domingas Kahombo'],
    turmas: ['Turma A'],
  },
  {
    id: 'cls-7',
    name: '7ª Classe',
    category: 'regular',
    period: 'Manhã',
    room: 'Sala 07',
    studentCount: 36,
    teachers: ['Prof.ª Helena Mateus', 'Prof. Carlos Alberto Silva'],
    turmas: ['Turma A'],
  },
  {
    id: 'cls-8',
    name: '8ª Classe',
    category: 'regular',
    period: 'Manhã',
    room: 'Sala 08',
    studentCount: 32,
    teachers: ['Prof. Domingos Cazenga'],
    turmas: ['Turma A'],
  },
  {
    id: 'cls-9',
    name: '9ª Classe',
    category: 'regular',
    period: 'Tarde',
    room: 'Sala 09',
    studentCount: 30,
    teachers: ['Prof.ª Engrácia Bumba'],
    turmas: ['Turma A'],
  },
  {
    id: 'cls-praeer-1',
    name: 'PRAEER Etapa 1',
    category: 'praeer',
    period: 'Tarde',
    room: 'Sala 10',
    studentCount: 25,
    teachers: ['Prof. Afonso Ngola'],
    turmas: ['Turma A'],
  },
  {
    id: 'cls-praeer-2',
    name: 'PRAEER Etapa 2',
    category: 'praeer',
    period: 'Tarde',
    room: 'Sala 11',
    studentCount: 24,
    teachers: ['Prof.ª Beatriz Muhongo'],
    turmas: ['Turma A'],
  },
  {
    id: 'cls-praeer-3',
    name: 'PRAEER Etapa 3',
    category: 'praeer',
    period: 'Tarde',
    room: 'Sala 12',
    studentCount: 22,
    teachers: ['Prof. Joaquim Cambuta'],
    turmas: ['Turma A'],
  },
  {
    id: 'cls-mod-1',
    name: 'Módulo 1',
    category: 'modulo',
    period: 'Noite',
    room: 'Sala 13',
    studentCount: 28,
    teachers: ['Prof.ª Esperança Lukamba'],
    turmas: ['Turma A'],
  },
  {
    id: 'cls-mod-2',
    name: 'Módulo 2',
    category: 'modulo',
    period: 'Noite',
    room: 'Sala 14',
    studentCount: 26,
    teachers: ['Prof. Mateus Sebastião'],
    turmas: ['Turma A'],
  },
  {
    id: 'cls-mod-3',
    name: 'Módulo 3',
    category: 'modulo',
    period: 'Noite',
    room: 'Sala 15',
    studentCount: 24,
    teachers: ['Prof.ª Filomena Dala'],
    turmas: ['Turma A'],
  },
];

export const directorStatsData = {
  summaryCards: [
    { id: 'stat-salas', title: 'Salas', value: '0', icon: 'home' },
    { id: 'stat-profs', title: 'Professores', value: '0', icon: 'user' },
    { id: 'stat-alunos', title: 'Alunos', value: '0', icon: 'users' },
  ],
  genderData: {
    femaleCount: 0,
    femaleLabel: '0',
    maleCount: 0,
    maleLabel: '0',
  },
  academicPerformance: [
    { semester: '2026.1', approval: 0, reproval: 0 },
  ],
  attendanceTrends: {
    years: ['2026'],
    ead: [0],
    presencial: [0],
  },
  documentsComparison: {
    withoutDocs: { female: 0, male: 0 },
    withDocs: { female: 0, male: 0 },
  },
};
