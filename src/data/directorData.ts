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

// Initialized empty for live registration
export const directorClassesData: DirectorClass[] = [];

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
