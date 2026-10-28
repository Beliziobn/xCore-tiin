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
  numeroChamada: number;
  name: string;
  genero: 'M' | 'F';
  dataNascimento?: string;
  idade?: number;
  tipoDocumento?: 'BI' | 'Cedula pessoal' | 'Assento' | 'sem Documento';
  numeroDocumento?: string;
  anexoDocumento?: string;
  anexoDocumentoNome?: string;
  condicaoMatricula?: 'primeira_vez' | 'repetente';
  foto?: string;
  nomePai?: string;
  nomeMae?: string;
  parentescoEncarregado?: string;
  telefoneAlternativo?: string;
  endereco?: string;
  turma: string;
  periodo: string;
  classe: string;
  sala: string;
  encarregado: string;
  telefone: string;
  temDocumentos: boolean;
  presencaPercent: number;
  faltas?: number;
  disciplinas: string[];
  grades: StudentGrade[];
  observacoes?: string;
}

export interface TeacherData {
  name: string;
  turma: string;
  periodo: string;
  classe: string;
  sala: string;
  telefone: string;
  email: string;
  escola: string;
  totalAlunos: number;
  disciplinas: string[];
  bio: string;
  avatar?: string;
  horario: {
    dia: string;
    tempo1: string;
    tempo2: string;
    tempo3: string;
    tempo4: string;
  }[];
}

export const defaultDisciplinasList = [
  'Língua Portuguesa',
  'Matemática',
  'Ciências Naturais',
  'História',
  'Geografia',
  'Educação Física',
  'Educação Visual e Plástica',
];

export const initialTeacherData: TeacherData = {
  name: 'Docente',
  turma: 'Turma A',
  periodo: 'Manhã',
  classe: '1ª Classe',
  sala: 'Sala 01',
  telefone: '+244 923 000 000',
  email: 'docente@ucore.edu.ao',
  escola: 'Escola Municipal',
  totalAlunos: 0,
  disciplinas: defaultDisciplinasList,
  bio: 'Docente titular do Ensino Geral.',
  horario: [
    { dia: 'Segunda-feira', tempo1: 'Língua Portuguesa', tempo2: 'Língua Portuguesa', tempo3: 'Matemática', tempo4: 'Educação Física' },
    { dia: 'Terça-feira', tempo1: 'Matemática', tempo2: 'Matemática', tempo3: 'Ciências Naturais', tempo4: 'História' },
    { dia: 'Quarta-feira', tempo1: 'Língua Portuguesa', tempo2: 'Língua Portuguesa', tempo3: 'Geografia', tempo4: 'Educação Visual' },
    { dia: 'Quinta-feira', tempo1: 'Matemática', tempo2: 'Ciências Naturais', tempo3: 'História', tempo4: 'Geografia' },
    { dia: 'Sexta-feira', tempo1: 'Língua Portuguesa', tempo2: 'Educação Física', tempo3: 'Estudo Orientado', tempo4: 'Avaliação Semanal' },
  ],
};

// Initialized empty for real data entry
export const initialStudentsData: StudentProfile[] = [];

export interface ClassMetrics {
  total: number;
  meninas: number;
  meninos: number;
  comDocs: number;
  semDocs: number;
  meninasComDoc: number;
  meninasSemDoc: number;
  meninosComDoc: number;
  meninosSemDoc: number;
  avgPresenca: number;
  avgMedia: number;
  aprovados: number;
  reprovados: number;
  aprovacaoPercent: number;
  reprovacaoPercent: number;
}

export function calculateMetrics(students: StudentProfile[]): ClassMetrics {
  const total = students.length;
  const meninas = students.filter((s) => s.genero === 'F').length;
  const meninos = students.filter((s) => s.genero === 'M').length;
  const comDocs = students.filter((s) => s.temDocumentos).length;
  const semDocs = students.filter((s) => !s.temDocumentos).length;

  const meninasComDoc = students.filter((s) => s.genero === 'F' && s.temDocumentos).length;
  const meninasSemDoc = students.filter((s) => s.genero === 'F' && !s.temDocumentos).length;
  const meninosComDoc = students.filter((s) => s.genero === 'M' && s.temDocumentos).length;
  const meninosSemDoc = students.filter((s) => s.genero === 'M' && !s.temDocumentos).length;

  const avgPresenca = total > 0 
    ? Math.round(students.reduce((acc, s) => acc + s.presencaPercent, 0) / total) 
    : 0;

  const allMedias = students.map((s) => {
    const sum = s.grades.reduce((acc, g) => acc + g.media, 0);
    return s.grades.length > 0 ? sum / s.grades.length : 0;
  });

  const avgMedia = allMedias.length > 0 
    ? Number((allMedias.reduce((a, b) => a + b, 0) / allMedias.length).toFixed(1)) 
    : 0;

  const aprovados = allMedias.filter((m) => m >= 10).length;
  const reprovados = total > 0 ? total - aprovados : 0;

  const aprovacaoPercent = total > 0 ? Math.round((aprovados / total) * 100) : 0;
  const reprovacaoPercent = total > 0 ? 100 - aprovacaoPercent : 0;

  return {
    total,
    meninas,
    meninos,
    comDocs,
    semDocs,
    meninasComDoc,
    meninasSemDoc,
    meninosComDoc,
    meninosSemDoc,
    avgPresenca,
    avgMedia,
    aprovados,
    reprovados,
    aprovacaoPercent,
    reprovacaoPercent,
  };
}

export const computeClassStats = calculateMetrics;

