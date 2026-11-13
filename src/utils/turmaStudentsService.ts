import { getStoredStudents } from './studentStorage';
import { initialStudentsData as teacherStudents } from '../data/teacherData';
import { initialAdminStudents } from '../data/adminData';
import { directorStudentsData } from '../data/directorData';
import { ALL_SCHOOL_CLASSES, STANDARD_TURMAS } from '../data/classesConfig';
import { resolveSchoolDirectorName } from './authApprovalStorage';

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
 * Normalizes class strings so "4ª", "4ª Classe", "4.ª Classe", "Classe de Iniciação",
 * "10.ª Classe" .. "13.ª Classe", "Etapa 1", etc. match consistently.
 */
export function normalizeClasseName(c: string): string {
  if (!c || !c.trim()) return '';
  const clean = c.trim();
  const low = clean.toLowerCase();

  // If formatted like "4.ª Classe - Turma A", extract only the class portion
  const splitParts = clean.split(/\s+-\s+/);
  if (splitParts.length > 1 && /turma/i.test(splitParts[splitParts.length - 1])) {
    return normalizeClasseName(splitParts.slice(0, -1).join(' - '));
  }

  if (low.includes('iniciação especial') || low.includes('iniciacao especial')) {
    return 'Iniciação Especial';
  }
  if (low.includes('iniciação') || low.includes('iniciacao')) return 'Iniciação';

  // Check two-digit classes BEFORE single-digit classes so "11.ª" never matches "1ª"
  if (/\b13[ªaºo.]*/i.test(clean)) return '13ª Classe';
  if (/\b12[ªaºo.]*/i.test(clean)) return '12ª Classe';
  if (/\b11[ªaºo.]*/i.test(clean)) return '11ª Classe';
  if (/\b10[ªaºo.]*/i.test(clean)) return '10ª Classe';

  if (/\b1\s*[.ªaºo]/i.test(clean) && !/ano/i.test(clean)) return '1ª Classe';
  if (/\b2\s*[.ªaºo]/i.test(clean) && !/ano/i.test(clean)) return '2ª Classe';
  if (/\b3\s*[.ªaºo]/i.test(clean) && !/ano/i.test(clean)) return '3ª Classe';
  if (/\b4\s*[.ªaºo]/i.test(clean) && !/ano/i.test(clean)) return '4ª Classe';
  if (/\b5\s*[.ªaºo]/i.test(clean) && !/ano/i.test(clean)) return '5ª Classe';
  if (/\b6\s*[.ªaºo]/i.test(clean) && !/ano/i.test(clean)) return '6ª Classe';
  if (/\b7\s*[.ªaºo]/i.test(clean) && !/ano/i.test(clean)) return '7ª Classe';
  if (/\b8\s*[.ªaºo]/i.test(clean) && !/ano/i.test(clean)) return '8ª Classe';
  if (/\b9\s*[.ªaºo]/i.test(clean) && !/ano/i.test(clean)) return '9ª Classe';

  // Bare digit classes ("1".."13")
  if (/^\d{1,2}$/.test(clean)) {
    return `${clean}ª Classe`;
  }

  if (low.includes('módulo 1') || low.includes('modulo 1')) return 'Módulo 1';
  if (low.includes('módulo 2') || low.includes('modulo 2')) return 'Módulo 2';
  if (low.includes('módulo 3') || low.includes('modulo 3')) return 'Módulo 3';
  if (low.includes('etapa 1')) return 'PRAEER Etapa 1';
  if (low.includes('etapa 2')) return 'PRAEER Etapa 2';
  if (low.includes('etapa 3')) return 'PRAEER Etapa 3';
  if (low.includes('1.º ano') || low.includes('1º ano')) return '1.º Ano';
  if (low.includes('2.º ano') || low.includes('2º ano')) return '2.º Ano';

  return clean;
}

/**
 * Normalizes turma strings so "Turma 1" or "1" or "A" -> "Turma A",
 * "Turma B" / "2" -> "Turma B", etc., without false positives on the 'a' inside "turma".
 */
export function normalizeTurmaName(t: string): string {
  if (!t || !t.trim()) return 'Turma A';
  let clean = t.trim();

  // Handle composite teacher format like "4.ª Classe - Turma B"
  const turmaSegmentMatch = clean.match(/turma\s+([a-f1-6])\b/i);
  if (turmaSegmentMatch) {
    clean = turmaSegmentMatch[1];
  } else {
    clean = clean.replace(/^turma\s+/i, '').trim();
  }

  const upper = clean.toUpperCase();
  if (upper === '1' || upper === 'A') return 'Turma A';
  if (upper === '2' || upper === 'B') return 'Turma B';
  if (upper === '3' || upper === 'C') return 'Turma C';
  if (upper === '4' || upper === 'D') return 'Turma D';
  if (upper === '5' || upper === 'E') return 'Turma E';
  if (upper === '6' || upper === 'F') return 'Turma F';

  if (/^turma\s+/i.test(t.trim())) return t.trim();
  return `Turma ${clean}`;
}

function safeReadLocalArray(key: string): any[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function computeAgeFromDob(dob?: string): number {
  if (!dob) return 9;
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return 9;
  const now = new Date();
  let age = now.getFullYear() - parsed.getFullYear();
  const m = now.getMonth() - parsed.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < parsed.getDate())) {
    age--;
  }
  return Math.max(1, age);
}

function resolveCondicaoLabel(rawCondicao?: string, transferido?: boolean, alunoRepetente?: boolean): 'Novo' | 'Repetente' | 'Transferido' {
  if (transferido) return 'Transferido';
  const low = (rawCondicao || '').trim().toLowerCase();
  if (alunoRepetente || low === 'repetente') return 'Repetente';
  if (low === 'transferido') return 'Transferido';
  return 'Novo';
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
 * Returns dynamic class and turma options combining standard catalog options
 * with any classes/turmas present on live registered students.
 */
export function getAvailableClassesAndTurmasFromStudents(): {
  classes: string[];
  turmas: string[];
} {
  const classSet = new Set<string>(ALL_SCHOOL_CLASSES);
  const turmaSet = new Set<string>(STANDARD_TURMAS);

  const inspectRecord = (item: any) => {
    if (!item || typeof item !== 'object') return;
    const rawCls =
      item.classeEtapaModulo ||
      item.classe ||
      item.gradeClass ||
      item.registrationData?.classeEtapaModulo ||
      item.registrationData?.classe ||
      '';
    const rawTur = item.turma || item.registrationData?.turma || '';

    const normCls = normalizeClasseName(rawCls || rawTur);
    if (normCls) classSet.add(normCls);

    if (rawTur) {
      const normTur = normalizeTurmaName(rawTur);
      if (normTur) turmaSet.add(normTur);
    }
  };

  getStoredStudents().forEach(inspectRecord);
  safeReadLocalArray('ucore_admin_students').forEach(inspectRecord);
  safeReadLocalArray('ucore_director_students').forEach(inspectRecord);
  safeReadLocalArray('ucore_teacher_students').forEach(inspectRecord);

  return {
    classes: Array.from(classSet),
    turmas: Array.from(turmaSet),
  };
}

/**
 * Retrieves the complete, official student roster for a specific turma and class,
 * strictly including all newly registered students (from localStorage + Firestore sync)
 * alongside baseline fixtures, organized alphabetically from A to Z.
 */
export function getStudentsForTurma(options: GetTurmaStudentsOptions = {}): TurmaStudentListResult {
  const normalizedClass = normalizeClasseName(options.gradeClass || '4ª Classe') || '4ª Classe';
  const normalizedTurma = normalizeTurmaName(options.turma || 'Turma A');
  let resolvedSchoolName = options.schoolName || 'Unidade Escolar Municipal de Quêssua';

  // Gather all existing and newly registered students across live storages and fixtures
  const storedDetailed = getStoredStudents();
  const localAdminStudents = safeReadLocalArray('ucore_admin_students');
  const localDirectorStudents = safeReadLocalArray('ucore_director_students');
  const localTeacherStudents = safeReadLocalArray('ucore_teacher_students');

  const collectedMap = new Map<string, TurmaStudentItem>();
  let detectedTurno = '';
  let detectedSala = '';
  let detectedSchool = '';

  const addStudentCandidate = (candidate: any) => {
    if (!candidate || typeof candidate !== 'object') return;
    const reg = candidate.registrationData && typeof candidate.registrationData === 'object'
      ? candidate.registrationData
      : null;

    const rawName = (
      candidate.nomeCompleto ||
      candidate.name ||
      reg?.nomeCompleto ||
      reg?.name ||
      ''
    ).trim();
    if (!rawName) return;

    const rawTurmaField = String(candidate.turma || reg?.turma || '').trim();
    const rawClassField = String(
      candidate.classeEtapaModulo ||
      candidate.classe ||
      candidate.gradeClass ||
      reg?.classeEtapaModulo ||
      reg?.classe ||
      ''
    ).trim();

    // If rawClassField is missing but rawTurmaField is composite ("4.ª Classe - Turma B")
    const candClass = normalizeClasseName(rawClassField || rawTurmaField);
    const candTurma = normalizeTurmaName(rawTurmaField || 'Turma A');

    if (candClass !== normalizedClass || candTurma !== normalizedTurma) {
      return;
    }

    const dedupeKey = rawName.toLowerCase();
    const existing = collectedMap.get(dedupeKey);

    const rawGender = String(candidate.genero || candidate.gender || reg?.genero || '').trim().toLowerCase();
    const resolvedGenero: 'M' | 'F' =
      rawGender === 'm' || rawGender === 'masculino'
        ? 'M'
        : rawGender === 'f' || rawGender === 'feminino'
        ? 'F'
        : ['a', 'e', 'ia'].some((end) => rawName.split(' ')[0].toLowerCase().endsWith(end))
        ? 'F'
        : 'M';

    const rawDocType = candidate.tipoDocumento || candidate.documentType || reg?.tipoDocumento;
    const hasDocs =
      candidate.hasDocuments ??
      candidate.temDocumentos ??
      (rawDocType ? rawDocType !== 'sem Documento' : true);
    const tipoDoc = rawDocType || (hasDocs ? 'BI' : 'Pendente de Certidão');
    const numDoc =
      candidate.numeroDocumento ||
      reg?.numeroDocumento ||
      (hasDocs ? 'Regularizado' : 'Em emissão');

    const dob = candidate.dataNascimento || reg?.dataNascimento || '2016-04-12';
    const numericAge = Number(candidate.idade ?? candidate.age ?? reg?.idade);
    const resolvedAge = Number.isFinite(numericAge) && numericAge > 0 ? numericAge : computeAgeFromDob(dob);

    const rawCodigo = candidate.codigoMatricula || reg?.codigoMatricula || existing?.codigoMatricula || '';
    const condicao = resolveCondicaoLabel(
      candidate.condicaoMatricula || reg?.condicaoMatricula,
      Boolean(candidate.transferido || reg?.transferido),
      Boolean(candidate.alunoRepetente || reg?.alunoRepetente)
    );

    const candidateTurno = candidate.turno || candidate.periodo || reg?.turno || reg?.periodo;
    const candidateSala = candidate.sala || candidate.room || reg?.sala;
    const candidateEscola = candidate.escola || candidate.schoolName || reg?.escola;
    if (!detectedTurno && candidateTurno) detectedTurno = String(candidateTurno);
    if (!detectedSala && candidateSala) detectedSala = String(candidateSala);
    if (!detectedSchool && candidateEscola && !String(candidateEscola).toLowerCase().includes('modelo central')) {
      detectedSchool = String(candidateEscola);
    }

    collectedMap.set(dedupeKey, {
      id: candidate.id || existing?.id || `st_${Math.random().toString(36).substring(2, 9)}`,
      numeroOrdem: existing?.numeroOrdem || 0,
      codigoMatricula: rawCodigo,
      nomeCompleto: rawName,
      genero: resolvedGenero,
      dataNascimento: dob,
      idade: resolvedAge,
      tipoDocumento: tipoDoc,
      numeroDocumento: numDoc,
      temDocumento: Boolean(hasDocs),
      encarregado:
        candidate.encarregado ||
        candidate.guardianName ||
        candidate.guardian ||
        reg?.encarregado ||
        existing?.encarregado ||
        'Encarregado Institucional',
      telefone: candidate.telefone || candidate.phone || reg?.telefone || existing?.telefone || '+244 923 000 000',
      condicaoMatricula: condicao,
      endereco: candidate.endereco || candidate.location || reg?.endereco || existing?.endereco || 'Quêssua, Malanje',
      observacoes: candidate.observacoes || reg?.observacoes || existing?.observacoes,
    });
  };

  // Ingest static fixtures first, then override/append with live registered records (highest fidelity last)
  teacherStudents.forEach((ts) =>
    addStudentCandidate({
      ...ts,
      classe: ts.classe || '4ª Classe',
      turma: ts.turma || 'Turma A',
    })
  );
  initialAdminStudents.forEach(addStudentCandidate);
  directorStudentsData.forEach(addStudentCandidate);

  localTeacherStudents.forEach(addStudentCandidate);
  localDirectorStudents.forEach(addStudentCandidate);
  localAdminStudents.forEach(addStudentCandidate);
  storedDetailed.forEach(addStudentCandidate);

  // Strict A-Z sorting
  const studentList = Array.from(collectedMap.values());
  studentList.sort((a, b) =>
    a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-PT', { sensitivity: 'base' })
  );

  // Assign sequential number based on strict alphabetical A-Z order, preserving registered matrícula codes
  studentList.forEach((st, idx) => {
    st.numeroOrdem = idx + 1;
    if (!st.codigoMatricula) {
      st.codigoMatricula = `MAT-2026/${String(idx + 1).padStart(3, '0')}`;
    }
  });

  // Compute accurate statistics
  const total = studentList.length;
  const meninos = studentList.filter((s) => s.genero === 'M').length;
  const meninas = studentList.filter((s) => s.genero === 'F').length;
  const comDocumentos = studentList.filter((s) => s.temDocumento).length;
  const semDocumentos = total - comDocumentos;
  const repetentes = studentList.filter((s) => s.condicaoMatricula === 'Repetente').length;
  const avgAge =
    total > 0 ? (studentList.reduce((acc, s) => acc + s.idade, 0) / total).toFixed(1) : '0';

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

  if (
    (!options.schoolName ||
      options.schoolName === 'Unidade Escolar Municipal' ||
      options.schoolName === 'Unidade Escolar Municipal de Quêssua') &&
    detectedSchool
  ) {
    resolvedSchoolName = detectedSchool;
  }

  const room = detectedSala || (normalizedTurma.includes('A') ? 'Sala 03' : 'Sala 04');
  const shift =
    detectedTurno ||
    (normalizedTurma.includes('B') ? 'Tarde (13h00 - 17h30)' : 'Manhã (07h30 - 12h30)');
  const teacher = normalizedClass.includes('4ª')
    ? 'Prof. Santar Goes'
    : normalizedClass.includes('5ª')
    ? 'Profª. Maria Helena Santos'
    : normalizedClass.includes('6ª')
    ? 'Prof. João Carlos Silva'
    : 'Prof. Regente Titular';

  const monthsPt = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const now = new Date();
  const dataEmissao = `${now.getDate()} de ${monthsPt[now.getMonth()]} de ${now.getFullYear()}`;

  const safeClsCode = normalizedClass.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  const safeTurCode = normalizedTurma.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
  const codigoAutenticacao = `MED-AO/MAL-QSS-2026-${safeClsCode}-${safeTurCode}-${Math.floor(1000 + Math.random() * 9000)}`;

  const resolvedDirector = resolveSchoolDirectorName(null, resolvedSchoolName);

  const metadata: TurmaMetadata = {
    pais: 'REPÚBLICA DE ANGOLA',
    ministerio: 'MINISTÉRIO DA EDUCAÇÃO',
    provincia: 'GOVERNO PROVINCIAL DE MALANJE',
    municipio: 'ADMINISTRAÇÃO MUNICIPAL DO QUÊSSUA',
    direccao: 'DIRECÇÃO MUNICIPAL DE EDUCAÇÃO',
    escola: resolvedSchoolName,
    anoLectivo: '2026 / 2027',
    classe: normalizedClass,
    turma: normalizedTurma,
    turno: shift,
    sala: room,
    professorTitular: teacher,
    diretorEscola: resolvedDirector || 'Direcção da Escola',
    subdiretorPedagogico: 'Subdirecção Pedagógica',
    dataEmissao,
    codigoAutenticacao,
  };

  return {
    metadata,
    students: studentList,
    stats,
  };
}
