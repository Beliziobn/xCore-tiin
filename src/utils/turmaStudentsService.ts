import { getStoredStudents } from './studentStorage';
import { initialStudentsData as teacherStudents } from '../data/teacherData';
import { initialAdminStudents } from '../data/adminData';
import { directorStudentsData } from '../data/directorData';
import { ALL_SCHOOL_CLASSES, STANDARD_TURMAS } from '../data/classesConfig';

export interface TurmaStudentItem {
  id: string;
  numeroOrdem: number;
  codigoMatricula: string;
  nomeCompleto: string;
  genero: 'M' | 'F';
  dataNascimento: string;
  idade: number;
  tipoDocumento: string;
  numeroDocumento: string;
  temDocumento: boolean;
  encarregado: string;
  telefone: string;
  condicaoMatricula: 'Novo' | 'Repetente' | 'Transferido';
  endereco: string;
  observacoes?: string;
}

export interface TurmaStats {
  total: number;
  meninos: number;
  meninas: number;
  percentualM: string;
  percentualF: string;
  comDocumentos: number;
  semDocumentos: number;
  repetentes: number;
  idadeMedia: string;
}

export interface TurmaMetadata {
  pais: string;
  ministerio: string;
  provincia: string;
  municipio: string;
  direccao: string;
  escola: string;
  anoLectivo: string;
  classe: string;
  turma: string;
  turno: string;
  sala: string;
  professorTitular: string;
  diretorEscola: string;
  subdiretorPedagogico: string;
  dataEmissao: string;
  codigoAutenticacao: string;
}

export interface TurmaStudentListResult {
  metadata: TurmaMetadata;
  students: TurmaStudentItem[];
  stats: TurmaStats;
}

/**
 * Authentic Angolan full names pool for generating complete, realistic class rosters (35-45 students)
 * when a class/turma does not have all individual seats populated in localStorage.
 */
const ANGOLAN_STUDENT_NAMES_POOL: { nome: string; genero: 'M' | 'F'; encarregado: string }[] = [
  { nome: 'Abelardo Fernando da Costa', genero: 'M', encarregado: 'Fernando da Costa' },
  { nome: 'Albert Golph', genero: 'M', encarregado: 'Manuel Golph' },
  { nome: 'Albertina Domingos Kassoma', genero: 'F', encarregado: 'Manuel Kassoma & Teresa Miguel' },
  { nome: 'Alcinda Teresa de Carvalho', genero: 'F', encarregado: 'António de Carvalho' },
  { nome: 'Amílcar Agostinho Neto', genero: 'M', encarregado: 'Agostinho Neto' },
  { nome: 'Ana Beatriz Canhanga', genero: 'F', encarregado: 'Gaspar Canhanga' },
  { nome: 'António Luvualu dos Santos', genero: 'M', encarregado: 'Mateus dos Santos' },
  { nome: 'Beatriz Luísa da Silva', genero: 'F', encarregado: 'João Silva & Luzia Pedro' },
  { nome: 'Bernardo Afonso Daniel', genero: 'M', encarregado: 'Joaquim Daniel' },
  { nome: 'Carlos Alberto Mendes', genero: 'M', encarregado: 'Alberto Mendes' },
  { nome: 'Carlos Manuel Bengue', genero: 'M', encarregado: 'Domingos Bengue' },
  { nome: 'Clara Dombele Quessua', genero: 'F', encarregado: 'Engrácia Dombele' },
  { nome: 'Clara Solange Diniz', genero: 'F', encarregado: 'Engrácia Diniz' },
  { nome: 'Daniel Quaresma Lukeni', genero: 'M', encarregado: 'Manuel Quaresma' },
  { nome: 'Daniela Costa Miguel', genero: 'F', encarregado: 'Paulo Miguel Costa' },
  { nome: 'Domingos Fula Lando', genero: 'M', encarregado: 'Sebastião Lando' },
  { nome: 'Eduardo Kiala Francisco', genero: 'M', encarregado: 'Francisco Kiala' },
  { nome: 'Eliana Mafalda Vunge', genero: 'F', encarregado: 'Manuel Vunge' },
  { nome: 'Esperança Lukeni Miguel', genero: 'F', encarregado: 'Graça Lukeni' },
  { nome: 'Esperança Neves Tchissola', genero: 'F', encarregado: 'Paulina Tchissola' },
  { nome: 'Esperança Tchipilica Neto', genero: 'F', encarregado: 'Augusto Tchipilica' },
  { nome: 'Fátima dos Santos Baptista', genero: 'F', encarregado: 'Joaquim Baptista' },
  { nome: 'Francisco Binga Kassange', genero: 'M', encarregado: 'Simão Binga' },
  { nome: 'Gabriel Bengue Calandula', genero: 'M', encarregado: 'Mateus Calandula' },
  { nome: 'Graça Vunge dos Santos', genero: 'F', encarregado: 'António dos Santos' },
  { nome: 'Helena Quessua Morais', genero: 'F', encarregado: 'Sebastião Morais' },
  { nome: 'Henrique Calandula Pedro', genero: 'M', encarregado: 'Pedro Calandula' },
  { nome: 'Isac Domingos Gouveia', genero: 'M', encarregado: 'Bernardo Gouveia' },
  { nome: 'Joaquim Nzamba Kwanza', genero: 'M', encarregado: 'Manuel Nzamba' },
  { nome: 'Juliana Morais da Fonseca', genero: 'F', encarregado: 'Luzia da Fonseca' },
  { nome: 'Lucas Fernandes Silveira', genero: 'M', encarregado: 'Beatriz Silveira' },
  { nome: 'Lucrécia Bengue Miguel', genero: 'F', encarregado: 'Paulo Miguel Bengue' },
  { nome: 'Madalena Baptista Cangandala', genero: 'F', encarregado: 'Agostinho Cangandala' },
  { nome: 'Manuel Domingos Kassoma', genero: 'M', encarregado: 'Domingos Kassoma' },
  { nome: 'Maria de Fátima Chilombo', genero: 'F', encarregado: 'Fernando Chilombo' },
  { nome: 'Mateus Kiala Pedro', genero: 'M', encarregado: 'Agostinho Pedro' },
  { nome: 'Mauro Sebastião Ngunza', genero: 'M', encarregado: 'Sebastião Ngunza' },
  { nome: 'Neusa Cristina Lutete', genero: 'F', encarregado: 'Bernardo Lutete' },
  { nome: 'Otília Vanda Capenda', genero: 'F', encarregado: 'Manuel Capenda' },
  { nome: 'Paulo Jorge Catete', genero: 'M', encarregado: 'Jorge Catete' },
  { nome: 'Rosa Manuela Banza', genero: 'F', encarregado: 'António Banza' },
  { nome: 'Sebastião Ngunza Chissingui', genero: 'M', encarregado: 'Carlos Chissingui' },
  { nome: 'Teresa da Silva Miguel', genero: 'F', encarregado: 'Manuel Miguel' },
  { nome: 'Valdemar Kiaku Luanda', genero: 'M', encarregado: 'Gaspar Luanda' },
  { nome: 'Zulmira Canhanga dos Santos', genero: 'F', encarregado: 'Zacarias dos Santos' },
];

/**
 * Normalizes class strings so "4ª", "4ª Classe", "4.ª Classe", "4º Ano" match consistently.
 */
export function normalizeClasseName(c: string): string {
  if (!c) return '4ª Classe';
  const clean = c.trim();
  if (clean.includes('Iniciação')) return 'Iniciação';
  if (clean.includes('1ª') || clean.includes('1.ª') || clean.includes('1º')) return '1ª Classe';
  if (clean.includes('2ª') || clean.includes('2.ª') || clean.includes('2º')) return '2ª Classe';
  if (clean.includes('3ª') || clean.includes('3.ª') || clean.includes('3º')) return '3ª Classe';
  if (clean.includes('4ª') || clean.includes('4.ª') || clean.includes('4º')) return '4ª Classe';
  if (clean.includes('5ª') || clean.includes('5.ª') || clean.includes('5º')) return '5ª Classe';
  if (clean.includes('6ª') || clean.includes('6.ª') || clean.includes('6º')) return '6ª Classe';
  if (clean.includes('7ª') || clean.includes('7.ª') || clean.includes('7º')) return '7ª Classe';
  if (clean.includes('8ª') || clean.includes('8.ª') || clean.includes('8º')) return '8ª Classe';
  if (clean.includes('9ª') || clean.includes('9.ª') || clean.includes('9º')) return '9ª Classe';
  if (clean.includes('Módulo 1')) return 'Módulo 1';
  if (clean.includes('Módulo 2')) return 'Módulo 2';
  if (clean.includes('Módulo 3')) return 'Módulo 3';
  if (clean.includes('PRAEER Etapa 1') || clean.includes('Etapa 1')) return 'PRAEER Etapa 1';
  if (clean.includes('PRAEER Etapa 2') || clean.includes('Etapa 2')) return 'PRAEER Etapa 2';
  if (clean.includes('PRAEER Etapa 3') || clean.includes('Etapa 3')) return 'PRAEER Etapa 3';
  return clean;
}

/**
 * Normalizes turma strings so "Turma 1" or "1" maps to "Turma A", "Turma 2" maps to "Turma B".
 */
export function normalizeTurmaName(t: string): string {
  if (!t) return 'Turma A';
  const clean = t.trim();
  if (clean === '1' || clean.toLowerCase() === 'turma 1') return 'Turma A';
  if (clean === '2' || clean.toLowerCase() === 'turma 2') return 'Turma B';
  if (clean.toLowerCase().includes('a')) return 'Turma A';
  if (clean.toLowerCase().includes('b')) return 'Turma B';
  if (clean.toLowerCase().includes('c')) return 'Turma C';
  if (clean.toLowerCase().includes('d')) return 'Turma D';
  return clean;
}

export interface GetTurmaStudentsOptions {
  schoolName?: string;
  gradeClass?: string;
  turma?: string;
  minStudents?: number;
  maxStudents?: number;
  sortByAZ?: boolean;
}

/**
 * Retrieves the complete, official student roster for a specific turma and class,
 * organized alphabetically from A to Z.
 */
export function getStudentsForTurma(options: GetTurmaStudentsOptions = {}): TurmaStudentListResult {
  const normalizedClass = normalizeClasseName(options.gradeClass || '4ª Classe');
  const normalizedTurma = normalizeTurmaName(options.turma || 'Turma A');
  const schoolName = options.schoolName || 'Unidade Escolar Municipal de Quêssua';

  // Target student count (official ceiling is 45 students per Angolan standard)
  const targetCount = options.turma?.includes('B') ? 42 : 45;

  // 1. Gather all existing students across storages and fixtures
  const storedDetailed = getStoredStudents();
  const collectedMap = new Map<string, TurmaStudentItem>();

  // Helper to add student to map
  const addStudentCandidate = (candidate: {
    id?: string;
    name: string;
    genero?: 'M' | 'F' | string;
    classe?: string;
    gradeClass?: string;
    turma?: string;
    dataNascimento?: string;
    idade?: number;
    tipoDocumento?: string;
    numeroDocumento?: string;
    hasDocuments?: boolean;
    temDocumentos?: boolean;
    encarregado?: string;
    guardianName?: string;
    telefone?: string;
    condicaoMatricula?: string;
    endereco?: string;
    location?: string;
  }) => {
    const candClass = normalizeClasseName(candidate.classe || candidate.gradeClass || '');
    const candTurma = normalizeTurmaName(candidate.turma || '');

    // Check if matches or if general candidate
    const matchesExact = candClass === normalizedClass && candTurma === normalizedTurma;

    if (matchesExact) {
      const nomeCompleto = candidate.name.trim();
      const hasDocs = candidate.hasDocuments ?? candidate.temDocumentos ?? (candidate.tipoDocumento !== 'sem Documento');
      const tipoDoc = candidate.tipoDocumento || (hasDocs ? 'BI' : 'Pendente de Certidão');
      const numDoc = candidate.numeroDocumento || (hasDocs ? `00${Math.floor(10000000 + Math.random() * 89999999)}ME042` : 'Em emissão');

      collectedMap.set(nomeCompleto.toLowerCase(), {
        id: candidate.id || `st_${Math.random().toString(36).substring(2, 9)}`,
        numeroOrdem: 0,
        codigoMatricula: `MAT-2026/${String(collectedMap.size + 1).padStart(3, '0')}`,
        nomeCompleto,
        genero: (candidate.genero === 'F' || candidate.genero === 'M') ? candidate.genero : (['a', 'e', 'ia'].some((end) => nomeCompleto.split(' ')[0].toLowerCase().endsWith(end)) ? 'F' : 'M'),
        dataNascimento: candidate.dataNascimento || '2016-04-12',
        idade: candidate.idade || 9,
        tipoDocumento: tipoDoc,
        numeroDocumento: numDoc,
        temDocumento: hasDocs,
        encarregado: candidate.encarregado || candidate.guardianName || 'Encarregado Institucional',
        telefone: candidate.telefone || '+244 923 000 000',
        condicaoMatricula: (candidate.condicaoMatricula as any) || 'Novo',
        endereco: candidate.endereco || candidate.location || 'Quêssua, Malanje',
      });
    }
  };

  // Check stored detailed students
  storedDetailed.forEach((s) => addStudentCandidate(s));

  // Check teacher students (often 4ª Classe Turma A/1)
  teacherStudents.forEach((ts) => {
    addStudentCandidate({
      id: ts.id,
      name: ts.name,
      genero: ts.genero,
      classe: ts.classe || '4ª Classe',
      turma: ts.turma || 'Turma A',
      temDocumentos: ts.temDocumentos,
      encarregado: ts.encarregado,
      telefone: ts.telefone,
    });
  });

  // Check admin students
  initialAdminStudents.forEach((as) => {
    addStudentCandidate({
      id: as.id,
      name: as.name,
      genero: as.gender,
      classe: as.gradeClass,
      turma: as.turma,
      hasDocuments: as.hasDocuments,
      tipoDocumento: as.documentType,
      numeroDocumento: as.numeroDocumento,
      encarregado: as.guardianName,
      dataNascimento: as.dataNascimento,
      idade: as.idade,
      condicaoMatricula: as.condicaoMatricula,
      location: as.location,
    });
  });

  // Check director students
  directorStudentsData.forEach((ds) => {
    addStudentCandidate({
      id: ds.id,
      name: ds.name,
      classe: ds.gradeClass,
      turma: ds.turma,
      hasDocuments: ds.hasDocuments,
      tipoDocumento: ds.documentType,
      numeroDocumento: ds.numeroDocumento,
      encarregado: ds.guardianName,
      location: ds.location,
    });
  });

  // 2. STRICT A-Z SORTING (CRITICAL REQUIREMENT)
  const studentList = Array.from(collectedMap.values());
  studentList.sort((a, b) =>
    a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-PT', { sensitivity: 'base' })
  );

  // 4. Assign sequential number based on strict alphabetical A-Z order
  studentList.forEach((st, idx) => {
    st.numeroOrdem = idx + 1;
    st.codigoMatricula = `MAT-2026/${String(idx + 1).padStart(3, '0')}`;
  });

  // 5. Compute accurate statistics
  const total = studentList.length;
  const meninos = studentList.filter((s) => s.genero === 'M').length;
  const meninas = studentList.filter((s) => s.genero === 'F').length;
  const comDocumentos = studentList.filter((s) => s.temDocumento).length;
  const semDocumentos = total - comDocumentos;
  const repetentes = studentList.filter((s) => s.condicaoMatricula === 'Repetente').length;
  const avgAge = total > 0 ? (studentList.reduce((acc, s) => acc + s.idade, 0) / total).toFixed(1) : '0';

  const stats: TurmaStats = {
    total,
    meninos,
    meninas,
    percentualM: total > 0 ? `${Math.round((meninos / total) * 100)}%` : '0%',
    percentualF: total > 0 ? `${Math.round((meninas / total) * 100)}%` : '0%',
    comDocumentos,
    semDocumentos,
    repetentes,
    idadeMedia: `${avgAge} anos`,
  };

  // Determine room and teacher dynamically according to class & turma
  const room = normalizedTurma.includes('A') ? 'Sala 03' : 'Sala 04';
  const shift = normalizedTurma.includes('B') ? 'Tarde (13h00 - 17h30)' : 'Manhã (07h30 - 12h30)';
  const teacher = normalizedClass.includes('4ª') 
    ? 'Prof. Santar Goes' 
    : normalizedClass.includes('5ª') 
    ? 'Profª. Maria Helena Santos' 
    : normalizedClass.includes('6ª') 
    ? 'Prof. João Carlos Silva' 
    : 'Prof. Regente Titular';

  // Format today's date in Angolan official standard
  const monthsPt = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const now = new Date();
  const dataEmissao = `${now.getDate()} de ${monthsPt[now.getMonth()]} de ${now.getFullYear()}`;

  // Unique hash code for document authenticity validation
  const safeClsCode = normalizedClass.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  const safeTurCode = normalizedTurma.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
  const codigoAutenticacao = `MED-AO/MAL-QSS-2026-${safeClsCode}-${safeTurCode}-${Math.floor(1000 + Math.random() * 9000)}`;

  const metadata: TurmaMetadata = {
    pais: 'REPÚBLICA DE ANGOLA',
    ministerio: 'MINISTÉRIO DA EDUCAÇÃO',
    provincia: 'GOVERNO PROVINCIAL DE MALANJE',
    municipio: 'ADMINISTRAÇÃO MUNICIPAL DE QUÊSSUA',
    direccao: 'DIRECÇÃO MUNICIPAL DA EDUCAÇÃO DO QUÊSSUA',
    escola: schoolName,
    anoLectivo: '2026 / 2027',
    classe: normalizedClass,
    turma: normalizedTurma,
    turno: shift,
    sala: room,
    professorTitular: teacher,
    diretorEscola: 'Fert Horlan (Director Geral)',
    subdiretorPedagogico: 'Profª. Maria Helena Santos',
    dataEmissao,
    codigoAutenticacao,
  };

  return {
    metadata,
    students: studentList,
    stats,
  };
}
