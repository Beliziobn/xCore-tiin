export interface StudentGrade {
  subject: string;
  p1: number;
  p2: number;
  trabalho: number;
  media: number;
  status: 'Aprovado' | 'Recuperação' | 'Reprovado';
}

export interface StudentProfile {
  id: string;
  name: string;
  turma: string;
  periodo: string;
  classe: string;
  sala: string;
  encarregado: string;
  telefone: string;
  disciplinas: string[];
  grades: StudentGrade[];
}

export interface TeacherData {
  name: string;
  turma: string;
  periodo: string;
  classe: string;
  sala: string;
  telefone: string;
  totalAlunos: number;
  disciplinas: string[];
  bio: string;
}

export const initialTeacherData: TeacherData = {
  name: 'Santar Goes',
  turma: '1',
  periodo: 'Manhã',
  classe: '4ª',
  sala: 'Sala 04',
  telefone: '+244 923 881 204',
  totalAlunos: 46,
  disciplinas: ['Língua Portuguesa', 'Matemática', 'Ciências Naturais', 'História', 'Geografia', 'Educação Física'],
  bio: 'Docente titular do 4º Ano do Ensino Primário. Especialista em Metodologias Ativas de Alfabetização e Gestão Pedagógica.',
};

export const initialStudentsData: StudentProfile[] = [
  {
    id: 'student-albert-golph',
    name: 'Albert Golph',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'Maria Golph',
    telefone: '+244 912 345 678',
    disciplinas: [
      'Língua Portuguesa',
      'Matemática',
      'Ciências Naturais',
      'História',
      'Geografia',
      'Educação Física',
      'Educação Visual e Plástica',
    ],
    grades: [
      { subject: 'Língua Portuguesa', p1: 16, p2: 17, trabalho: 18, media: 17.0, status: 'Aprovado' },
      { subject: 'Matemática', p1: 18, p2: 19, trabalho: 19, media: 18.7, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 15, p2: 16, trabalho: 17, media: 16.0, status: 'Aprovado' },
      { subject: 'História', p1: 17, p2: 18, trabalho: 18, media: 17.7, status: 'Aprovado' },
      { subject: 'Geografia', p1: 16, p2: 15, trabalho: 18, media: 16.3, status: 'Aprovado' },
      { subject: 'Educação Física', p1: 19, p2: 20, trabalho: 20, media: 19.7, status: 'Aprovado' },
      { subject: 'Educação Visual e Plástica', p1: 17, p2: 18, trabalho: 19, media: 18.0, status: 'Aprovado' },
    ],
  },
  {
    id: 'student-beatriz-silva',
    name: 'Beatriz Silva',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'João Silva',
    telefone: '+244 923 112 334',
    disciplinas: ['Língua Portuguesa', 'Matemática', 'Ciências Naturais', 'História', 'Geografia'],
    grades: [
      { subject: 'Língua Portuguesa', p1: 18, p2: 19, trabalho: 19, media: 18.7, status: 'Aprovado' },
      { subject: 'Matemática', p1: 15, p2: 16, trabalho: 17, media: 16.0, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 17, p2: 17, trabalho: 18, media: 17.3, status: 'Aprovado' },
    ],
  },
  {
    id: 'student-carlos-manuel',
    name: 'Carlos Manuel',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'Teresa Manuel',
    telefone: '+244 934 556 778',
    disciplinas: ['Língua Portuguesa', 'Matemática', 'Ciências Naturais', 'História', 'Geografia'],
    grades: [
      { subject: 'Língua Portuguesa', p1: 14, p2: 15, trabalho: 15, media: 14.7, status: 'Aprovado' },
      { subject: 'Matemática', p1: 17, p2: 18, trabalho: 18, media: 17.7, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 16, p2: 16, trabalho: 17, media: 16.3, status: 'Aprovado' },
    ],
  },
  {
    id: 'student-daniela-costa',
    name: 'Daniela Costa',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'Paulo Costa',
    telefone: '+244 912 889 001',
    disciplinas: ['Língua Portuguesa', 'Matemática', 'Ciências Naturais', 'História', 'Geografia'],
    grades: [
      { subject: 'Língua Portuguesa', p1: 19, p2: 20, trabalho: 19, media: 19.3, status: 'Aprovado' },
      { subject: 'Matemática', p1: 18, p2: 17, trabalho: 19, media: 18.0, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 18, p2: 19, trabalho: 20, media: 19.0, status: 'Aprovado' },
    ],
  },
];
