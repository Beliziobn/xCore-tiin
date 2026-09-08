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
  name: 'Santar Goes',
  turma: '1',
  periodo: 'Manhã',
  classe: '4ª',
  sala: 'Sala 04',
  telefone: '+244 931 224 550',
  email: 'santar.goes@ucore.edu.ao',
  escola: 'Escola Primária Nº 1024 - Luanda Sul',
  totalAlunos: 46,
  disciplinas: defaultDisciplinasList,
  bio: 'Docente titular do 4º Ano do Ensino Primário. Especialista em Metodologias Ativas de Alfabetização, Avaliação Formativa e Gestão de Sala de Aula Inclusiva.',
  horario: [
    { dia: 'Segunda-feira', tempo1: 'Língua Portuguesa', tempo2: 'Língua Portuguesa', tempo3: 'Matemática', tempo4: 'Educação Física' },
    { dia: 'Terça-feira', tempo1: 'Matemática', tempo2: 'Matemática', tempo3: 'Ciências Naturais', tempo4: 'História' },
    { dia: 'Quarta-feira', tempo1: 'Língua Portuguesa', tempo2: 'Língua Portuguesa', tempo3: 'Geografia', tempo4: 'Educação Visual' },
    { dia: 'Quinta-feira', tempo1: 'Matemática', tempo2: 'Ciências Naturais', tempo3: 'História', tempo4: 'Geografia' },
    { dia: 'Sexta-feira', tempo1: 'Língua Portuguesa', tempo2: 'Educação Física', tempo3: 'Estudo Orientado', tempo4: 'Avaliação Semanal' },
  ],
};

export const initialStudentsData: StudentProfile[] = [
  {
    id: 'student-albert-golph',
    numeroChamada: 1,
    name: 'Albert Golph',
    genero: 'M',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'Manuel Golph',
    telefone: '+244 923 456 789',
    temDocumentos: true,
    presencaPercent: 96,
    disciplinas: defaultDisciplinasList,
    grades: [
      { subject: 'Língua Portuguesa', p1: 16, p2: 17, trabalho: 18, media: 16.8, status: 'Aprovado' },
      { subject: 'Matemática', p1: 18, p2: 19, trabalho: 19, media: 18.6, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 15, p2: 16, trabalho: 17, media: 15.8, status: 'Aprovado' },
      { subject: 'História', p1: 17, p2: 18, trabalho: 18, media: 17.6, status: 'Aprovado' },
      { subject: 'Geografia', p1: 16, p2: 15, trabalho: 18, media: 16.0, status: 'Aprovado' },
      { subject: 'Educação Física', p1: 19, p2: 20, trabalho: 20, media: 19.6, status: 'Aprovado' },
      { subject: 'Educação Visual e Plástica', p1: 17, p2: 18, trabalho: 19, media: 17.8, status: 'Aprovado' },
    ],
    observacoes: 'Excelente desempenho e assiduidade regular. Participativo nas aulas de matemática.',
  },
  {
    id: 'student-beatriz-silva',
    numeroChamada: 2,
    name: 'Beatriz Silva',
    genero: 'F',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'João Silva',
    telefone: '+244 923 112 334',
    temDocumentos: true,
    presencaPercent: 98,
    disciplinas: defaultDisciplinasList,
    grades: [
      { subject: 'Língua Portuguesa', p1: 18, p2: 19, trabalho: 19, media: 18.6, status: 'Aprovado' },
      { subject: 'Matemática', p1: 15, p2: 16, trabalho: 17, media: 15.8, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 17, p2: 17, trabalho: 18, media: 17.2, status: 'Aprovado' },
      { subject: 'História', p1: 16, p2: 17, trabalho: 18, media: 16.8, status: 'Aprovado' },
      { subject: 'Geografia', p1: 17, p2: 16, trabalho: 17, media: 16.6, status: 'Aprovado' },
      { subject: 'Educação Física', p1: 18, p2: 18, trabalho: 19, media: 18.2, status: 'Aprovado' },
      { subject: 'Educação Visual e Plástica', p1: 19, p2: 19, trabalho: 20, media: 19.2, status: 'Aprovado' },
    ],
    observacoes: 'Destaque em leitura e redação. Líder de grupo nos projetos de ciências.',
  },
  {
    id: 'student-carlos-manuel',
    numeroChamada: 3,
    name: 'Carlos Manuel',
    genero: 'M',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'Teresa Manuel',
    telefone: '+244 934 556 778',
    temDocumentos: false,
    presencaPercent: 88,
    disciplinas: defaultDisciplinasList,
    grades: [
      { subject: 'Língua Portuguesa', p1: 14, p2: 15, trabalho: 15, media: 14.6, status: 'Aprovado' },
      { subject: 'Matemática', p1: 17, p2: 18, trabalho: 18, media: 17.6, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 16, p2: 16, trabalho: 17, media: 16.2, status: 'Aprovado' },
      { subject: 'História', p1: 13, p2: 14, trabalho: 15, media: 13.8, status: 'Aprovado' },
      { subject: 'Geografia', p1: 14, p2: 13, trabalho: 16, media: 14.0, status: 'Aprovado' },
      { subject: 'Educação Física', p1: 18, p2: 19, trabalho: 18, media: 18.4, status: 'Aprovado' },
      { subject: 'Educação Visual e Plástica', p1: 15, p2: 16, trabalho: 17, media: 15.8, status: 'Aprovado' },
    ],
    observacoes: 'Documentação pendente: aguardando cópia de cédula pessoal. Bom raciocínio lógico.',
  },
  {
    id: 'student-daniela-costa',
    numeroChamada: 4,
    name: 'Daniela Costa',
    genero: 'F',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'Paulo Costa',
    telefone: '+244 912 889 001',
    temDocumentos: true,
    presencaPercent: 97,
    disciplinas: defaultDisciplinasList,
    grades: [
      { subject: 'Língua Portuguesa', p1: 19, p2: 20, trabalho: 19, media: 19.4, status: 'Aprovado' },
      { subject: 'Matemática', p1: 18, p2: 17, trabalho: 19, media: 17.8, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 18, p2: 19, trabalho: 20, media: 18.8, status: 'Aprovado' },
      { subject: 'História', p1: 19, p2: 18, trabalho: 19, media: 18.6, status: 'Aprovado' },
      { subject: 'Geografia', p1: 18, p2: 19, trabalho: 19, media: 18.6, status: 'Aprovado' },
      { subject: 'Educação Física', p1: 17, p2: 18, trabalho: 18, media: 17.6, status: 'Aprovado' },
      { subject: 'Educação Visual e Plástica', p1: 19, p2: 19, trabalho: 20, media: 19.2, status: 'Aprovado' },
    ],
    observacoes: 'Melhor média geral da turma. Extremamente dedicada e pontual.',
  },
  {
    id: 'student-eduardo-kiala',
    numeroChamada: 5,
    name: 'Eduardo Kiala',
    genero: 'M',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'Mateus Kiala',
    telefone: '+244 927 441 330',
    temDocumentos: true,
    presencaPercent: 92,
    disciplinas: defaultDisciplinasList,
    grades: [
      { subject: 'Língua Portuguesa', p1: 12, p2: 11, trabalho: 13, media: 11.8, status: 'Aprovado' },
      { subject: 'Matemática', p1: 14, p2: 13, trabalho: 15, media: 13.8, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 13, p2: 14, trabalho: 14, media: 13.6, status: 'Aprovado' },
      { subject: 'História', p1: 11, p2: 12, trabalho: 13, media: 11.8, status: 'Aprovado' },
      { subject: 'Geografia', p1: 12, p2: 12, trabalho: 14, media: 12.4, status: 'Aprovado' },
      { subject: 'Educação Física', p1: 19, p2: 18, trabalho: 19, media: 18.6, status: 'Aprovado' },
      { subject: 'Educação Visual e Plástica', p1: 14, p2: 15, trabalho: 16, media: 14.8, status: 'Aprovado' },
    ],
    observacoes: 'Apresenta evolução nas disciplinas de exatas. Requer reforço em ortografia.',
  },
  {
    id: 'student-fatima-santos',
    numeroChamada: 6,
    name: 'Fátima dos Santos',
    genero: 'F',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'Rosa dos Santos',
    telefone: '+244 931 992 441',
    temDocumentos: false,
    presencaPercent: 91,
    disciplinas: defaultDisciplinasList,
    grades: [
      { subject: 'Língua Portuguesa', p1: 15, p2: 16, trabalho: 16, media: 15.6, status: 'Aprovado' },
      { subject: 'Matemática', p1: 13, p2: 14, trabalho: 15, media: 13.8, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 16, p2: 17, trabalho: 17, media: 16.6, status: 'Aprovado' },
      { subject: 'História', p1: 15, p2: 15, trabalho: 16, media: 15.2, status: 'Aprovado' },
      { subject: 'Geografia', p1: 16, p2: 16, trabalho: 17, media: 16.2, status: 'Aprovado' },
      { subject: 'Educação Física', p1: 17, p2: 17, trabalho: 18, media: 17.2, status: 'Aprovado' },
      { subject: 'Educação Visual e Plástica', p1: 18, p2: 18, trabalho: 19, media: 18.2, status: 'Aprovado' },
    ],
    observacoes: 'Certidão em processo junto à Conservatória local. Excelente convívio interpessoal.',
  },
  {
    id: 'student-gabriel-bengue',
    numeroChamada: 7,
    name: 'Gabriel Bengue',
    genero: 'M',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'Afonso Bengue',
    telefone: '+244 945 110 223',
    temDocumentos: true,
    presencaPercent: 95,
    disciplinas: defaultDisciplinasList,
    grades: [
      { subject: 'Língua Portuguesa', p1: 16, p2: 16, trabalho: 17, media: 16.2, status: 'Aprovado' },
      { subject: 'Matemática', p1: 18, p2: 17, trabalho: 19, media: 17.8, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 17, p2: 18, trabalho: 18, media: 17.6, status: 'Aprovado' },
      { subject: 'História', p1: 16, p2: 16, trabalho: 17, media: 16.2, status: 'Aprovado' },
      { subject: 'Geografia', p1: 15, p2: 16, trabalho: 17, media: 15.8, status: 'Aprovado' },
      { subject: 'Educação Física', p1: 20, p2: 20, trabalho: 20, media: 20.0, status: 'Aprovado' },
      { subject: 'Educação Visual e Plástica', p1: 17, p2: 18, trabalho: 18, media: 17.6, status: 'Aprovado' },
    ],
    observacoes: 'Destaque desportivo e líder de equipa. Muito participativo em atividades coletivas.',
  },
  {
    id: 'student-helena-quessua',
    numeroChamada: 8,
    name: 'Helena Quessua',
    genero: 'F',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'Esperança Quessua',
    telefone: '+244 926 778 990',
    temDocumentos: true,
    presencaPercent: 99,
    disciplinas: defaultDisciplinasList,
    grades: [
      { subject: 'Língua Portuguesa', p1: 17, p2: 18, trabalho: 18, media: 17.6, status: 'Aprovado' },
      { subject: 'Matemática', p1: 19, p2: 19, trabalho: 20, media: 19.2, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 18, p2: 18, trabalho: 19, media: 18.2, status: 'Aprovado' },
      { subject: 'História', p1: 17, p2: 17, trabalho: 18, media: 17.2, status: 'Aprovado' },
      { subject: 'Geografia', p1: 18, p2: 18, trabalho: 19, media: 18.2, status: 'Aprovado' },
      { subject: 'Educação Física', p1: 18, p2: 18, trabalho: 19, media: 18.2, status: 'Aprovado' },
      { subject: 'Educação Visual e Plástica', p1: 19, p2: 20, trabalho: 20, media: 19.6, status: 'Aprovado' },
    ],
    observacoes: 'Assiduidade de 99%. Excelente capacidade de concentração e escrita analítica.',
  },
  {
    id: 'student-isac-domingos',
    numeroChamada: 9,
    name: 'Isac Domingos',
    genero: 'M',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'Simão Domingos',
    telefone: '+244 933 661 229',
    temDocumentos: false,
    presencaPercent: 86,
    disciplinas: defaultDisciplinasList,
    grades: [
      { subject: 'Língua Portuguesa', p1: 11, p2: 10, trabalho: 12, media: 10.8, status: 'Aprovado' },
      { subject: 'Matemática', p1: 12, p2: 11, trabalho: 13, media: 11.8, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 13, p2: 12, trabalho: 14, media: 12.8, status: 'Aprovado' },
      { subject: 'História', p1: 10, p2: 11, trabalho: 12, media: 10.8, status: 'Aprovado' },
      { subject: 'Geografia', p1: 11, p2: 12, trabalho: 13, media: 11.8, status: 'Aprovado' },
      { subject: 'Educação Física', p1: 17, p2: 18, trabalho: 18, media: 17.6, status: 'Aprovado' },
      { subject: 'Educação Visual e Plástica', p1: 14, p2: 14, trabalho: 15, media: 14.2, status: 'Aprovado' },
    ],
    observacoes: 'Necessita de acompanhamento personalizado em Língua Portuguesa e entrega de comprovativo de nascimento.',
  },
  {
    id: 'student-juliana-morais',
    numeroChamada: 10,
    name: 'Juliana Morais',
    genero: 'F',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'Ana Morais',
    telefone: '+244 918 223 344',
    temDocumentos: true,
    presencaPercent: 94,
    disciplinas: defaultDisciplinasList,
    grades: [
      { subject: 'Língua Portuguesa', p1: 17, p2: 16, trabalho: 18, media: 16.8, status: 'Aprovado' },
      { subject: 'Matemática', p1: 16, p2: 15, trabalho: 17, media: 15.8, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 16, p2: 17, trabalho: 18, media: 16.8, status: 'Aprovado' },
      { subject: 'História', p1: 18, p2: 17, trabalho: 19, media: 17.8, status: 'Aprovado' },
      { subject: 'Geografia', p1: 17, p2: 16, trabalho: 18, media: 16.8, status: 'Aprovado' },
      { subject: 'Educação Física', p1: 18, p2: 18, trabalho: 19, media: 18.2, status: 'Aprovado' },
      { subject: 'Educação Visual e Plástica', p1: 18, p2: 19, trabalho: 19, media: 18.6, status: 'Aprovado' },
    ],
    observacoes: 'Excelente desempenho nas disciplinas de ciências humanas.',
  },
  {
    id: 'student-lucas-fernandes',
    numeroChamada: 11,
    name: 'Lucas Fernandes',
    genero: 'M',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'Jorge Fernandes',
    telefone: '+244 929 554 112',
    temDocumentos: true,
    presencaPercent: 93,
    disciplinas: defaultDisciplinasList,
    grades: [
      { subject: 'Língua Portuguesa', p1: 15, p2: 15, trabalho: 16, media: 15.2, status: 'Aprovado' },
      { subject: 'Matemática', p1: 16, p2: 17, trabalho: 17, media: 16.6, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 15, p2: 15, trabalho: 16, media: 15.2, status: 'Aprovado' },
      { subject: 'História', p1: 14, p2: 15, trabalho: 16, media: 14.8, status: 'Aprovado' },
      { subject: 'Geografia', p1: 15, p2: 14, trabalho: 16, media: 14.8, status: 'Aprovado' },
      { subject: 'Educação Física', p1: 19, p2: 19, trabalho: 20, media: 19.2, status: 'Aprovado' },
      { subject: 'Educação Visual e Plástica', p1: 16, p2: 16, trabalho: 17, media: 16.2, status: 'Aprovado' },
    ],
    observacoes: 'Estudante com ritmo constante e bom relacionamento com colegas.',
  },
  {
    id: 'student-madalena-baptista',
    numeroChamada: 12,
    name: 'Madalena Baptista',
    genero: 'F',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'Carla Baptista',
    telefone: '+244 941 887 665',
    temDocumentos: true,
    presencaPercent: 96,
    disciplinas: defaultDisciplinasList,
    grades: [
      { subject: 'Língua Portuguesa', p1: 18, p2: 18, trabalho: 19, media: 18.2, status: 'Aprovado' },
      { subject: 'Matemática', p1: 17, p2: 18, trabalho: 18, media: 17.6, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 18, p2: 19, trabalho: 19, media: 18.6, status: 'Aprovado' },
      { subject: 'História', p1: 17, p2: 18, trabalho: 18, media: 17.6, status: 'Aprovado' },
      { subject: 'Geografia', p1: 18, p2: 17, trabalho: 18, media: 17.6, status: 'Aprovado' },
      { subject: 'Educação Física', p1: 18, p2: 18, trabalho: 19, media: 18.2, status: 'Aprovado' },
      { subject: 'Educação Visual e Plástica', p1: 20, p2: 20, trabalho: 20, media: 20.0, status: 'Aprovado' },
    ],
    observacoes: 'Altas habilidades em artes visuais e expressão plástica. Perfil colaborativo.',
  },
];

// Helper calculations for class statistics
export function computeClassStats(students: StudentProfile[]) {
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
    : 95;

  const allMedias = students.map((s) => {
    const sum = s.grades.reduce((acc, g) => acc + g.media, 0);
    return s.grades.length > 0 ? sum / s.grades.length : 0;
  });

  const avgMedia = allMedias.length > 0 
    ? Number((allMedias.reduce((a, b) => a + b, 0) / allMedias.length).toFixed(1)) 
    : 16.5;

  const aprovados = allMedias.filter((m) => m >= 10).length;
  const reprovados = total - aprovados;

  const aprovacaoPercent = total > 0 ? Math.round((aprovados / total) * 100) : 85;
  const reprovacaoPercent = 100 - aprovacaoPercent;

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
