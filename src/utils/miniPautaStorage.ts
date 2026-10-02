import jsPDF from 'jspdf';

export type ClassGradingScaleType = 'qualitativo' | 'escala_0_10' | 'escala_0_20';

export type QualitativeRatingLabel =
  | 'Muito Bom'
  | 'Bom'
  | 'Suficiente'
  | 'Mau'
  | 'Péssimo';

export interface ClassGradingScaleConfig {
  type: ClassGradingScaleType;
  scaleType: ClassGradingScaleType;
  min: number;
  max: number;
  maxNumeric: number;
  passingScore: number;
  minPassNumeric: number;
  honorScore: number;
  badgeLabel: string;
  badgeText: string;
  shortScaleLabel: string;
  description: string;
}

export const QUALITATIVE_SCALE_OPTIONS: {
  label: QualitativeRatingLabel;
  sigla: 'MB' | 'B' | 'S' | 'M' | 'P';
  shortLabel: 'MB' | 'B' | 'S' | 'M' | 'P';
  score: number;
  isPositive: boolean;
}[] = [
  { label: 'Muito Bom', sigla: 'MB', shortLabel: 'MB', score: 5, isPositive: true },
  { label: 'Bom', sigla: 'B', shortLabel: 'B', score: 4, isPositive: true },
  { label: 'Suficiente', sigla: 'S', shortLabel: 'S', score: 3, isPositive: true },
  { label: 'Mau', sigla: 'M', shortLabel: 'M', score: 2, isPositive: false },
  { label: 'Péssimo', sigla: 'P', shortLabel: 'P', score: 1, isPositive: false },
];

/**
 * Grelha oficial de disciplinas por Classe / Etapa / Módulo:
 * - 1ª, 2ª, 3ª, 4ª Classe:
 *   Língua Portuguesa, Matemática, Estudo do Meio, Educação Manual e Plástica, Educação Musical, Educação Física
 * - 5ª e 6ª Classe:
 *   Língua Portuguesa, Matemática, Ciências da Natureza, Educação Manual e Plástica, Educação Musical, Educação Física, História, Geografia, Educação Moral e Cívica
 * - 7ª, 8ª, 9ª Classe:
 *   Língua Portuguesa, Matemática, Educação Visual e Plástica (EVP), Educação Física, História, Geografia, Educação Moral e Cívica, Língua Estrangeira (Inglês), Biologia, Física, Química, Educação Laboral
 * - PRAEER 1ª Etapa e 2ª Etapa:
 *   Língua Portuguesa, Matemática, Estudo do Meio, Educação Manual e Plástica, Educação Musical, Educação Física
 * - PRAEER 3ª Etapa:
 *   Língua Portuguesa, Matemática, Ciências da Natureza, História, Geografia, Educação Moral e Cívica, Educação Manual e Plástica, Educação Musical, Educação Física
 * - Módulo 1 e Módulo 2:
 *   Língua Portuguesa, Matemática, Estudo do Meio
 * - Módulo 3:
 *   Língua Portuguesa, Matemática, Estudo do Meio, Ciências da Natureza, História e Geografia
 */
export function getDisciplinasForClass(classe: string = ''): string[] {
  const norm = classe
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Módulo 1, 2, 3
  if (norm.includes('modulo')) {
    if (norm.includes('3')) {
      return [
        'Língua Portuguesa',
        'Matemática',
        'Estudo do Meio',
        'Ciências da Natureza',
        'História e Geografia',
      ];
    }
    // Módulo 1 e Módulo 2
    return [
      'Língua Portuguesa',
      'Matemática',
      'Estudo do Meio',
    ];
  }

  // PRAEER Etapa 1, 2, 3
  if (norm.includes('praeer') || norm.includes('praaer') || norm.includes('etapa')) {
    if (norm.includes('3')) {
      return [
        'Língua Portuguesa',
        'Matemática',
        'Ciências da Natureza',
        'História',
        'Geografia',
        'Educação Moral e Cívica',
        'Educação Manual e Plástica',
        'Educação Musical',
        'Educação Física',
      ];
    }
    // PRAEER 1ª Etapa e 2ª Etapa
    return [
      'Língua Portuguesa',
      'Matemática',
      'Estudo do Meio',
      'Educação Manual e Plástica',
      'Educação Musical',
      'Educação Física',
    ];
  }

  // 7ª, 8ª, 9ª Classe
  if (norm.startsWith('7') || norm.startsWith('8') || norm.startsWith('9')) {
    return [
      'Língua Portuguesa',
      'Matemática',
      'Educação Visual e Plástica (EVP)',
      'Educação Física',
      'História',
      'Geografia',
      'Educação Moral e Cívica',
      'Língua Estrangeira (Inglês)',
      'Biologia',
      'Física',
      'Química',
      'Educação Laboral',
    ];
  }

  // 5ª e 6ª Classe
  if (norm.startsWith('5') || norm.startsWith('6')) {
    return [
      'Língua Portuguesa',
      'Matemática',
      'Ciências da Natureza',
      'Educação Manual e Plástica',
      'Educação Musical',
      'Educação Física',
      'História',
      'Geografia',
      'Educação Moral e Cívica',
    ];
  }

  // Iniciação e 1ª, 2ª, 3ª, 4ª Classe
  return [
    'Língua Portuguesa',
    'Matemática',
    'Estudo do Meio',
    'Educação Manual e Plástica',
    'Educação Musical',
    'Educação Física',
  ];
}

/**
 * Regras oficiais de avaliação por classe:
 * - Iniciação, 1ª Classe, 2ª Classe -> Qualitativo: Muito Bom, Bom, Suficiente, Mau, Péssimo
 * - 3ª, 4ª, 5ª, 6ª Classe e PRAEER Etapa 1, 2, 3 -> Quantitativo de 0 até 10 (Positiva >= 5)
 * - 7ª, 8ª, 9ª Classe e Módulo 1, 2, 3 -> Quantitativo de 0 até 20 (Positiva >= 10)
 */
export function getGradingScaleForClass(classe: string = ''): ClassGradingScaleConfig {
  const norm = classe
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // 1. Iniciação, 1ª Classe, 2ª Classe -> Muito Bom, Bom, Suficiente, Mau, Péssimo
  if (
    norm.includes('iniciacao') ||
    norm.includes('pre-escolar') ||
    norm.startsWith('1ª') ||
    norm.startsWith('1a') ||
    norm === '1 classe' ||
    norm.startsWith('2ª') ||
    norm.startsWith('2a') ||
    norm === '2 classe'
  ) {
    return {
      type: 'qualitativo',
      scaleType: 'qualitativo',
      min: 1,
      max: 5,
      maxNumeric: 10,
      passingScore: 2.5,
      minPassNumeric: 5,
      honorScore: 4.5,
      badgeLabel: 'Avaliação Qualitativa (Muito Bom, Bom, Suficiente, Mau, Péssimo)',
      badgeText: 'Muito Bom a Péssimo',
      shortScaleLabel: 'Muito Bom a Péssimo',
      description: 'Iniciação, 1ª e 2ª Classe · Qualitativa',
    };
  }

  // 2. 7ª, 8ª, 9ª Classe e Módulo 1, 2, 3 -> 0 a 20 valores
  if (
    norm.startsWith('7') ||
    norm.startsWith('8') ||
    norm.startsWith('9') ||
    norm.includes('modulo')
  ) {
    return {
      type: 'escala_0_20',
      scaleType: 'escala_0_20',
      min: 0,
      max: 20,
      maxNumeric: 20,
      passingScore: 10,
      minPassNumeric: 10,
      honorScore: 16,
      badgeLabel: 'Escala de 0 a 20 Valores (Positiva ≥ 10)',
      badgeText: '0 a 20 valores',
      shortScaleLabel: '0 a 20 valores',
      description: '7ª, 8ª, 9ª Classe e Módulos 1, 2, 3 · Positiva ≥ 10',
    };
  }

  // 3. 3ª, 4ª, 5ª, 6ª Classe e PRAEER Etapa 1, 2, 3 -> 0 até 10 valores
  return {
    type: 'escala_0_10',
    scaleType: 'escala_0_10',
    min: 0,
    max: 10,
    maxNumeric: 10,
    passingScore: 5,
    minPassNumeric: 5,
    honorScore: 8,
    badgeLabel: 'Escala de 0 a 10 Valores (Positiva ≥ 5)',
    badgeText: '0 a 10 valores',
    shortScaleLabel: '0 a 10 valores',
    description: '3ª a 6ª Classe e PRAEER Etapas 1, 2, 3 · Positiva ≥ 5',
  };
}

export function numericToQualitativeLabel(score: number, scaleMax = 5): QualitativeRatingLabel {
  const normalized =
    scaleMax === 10
      ? score / 2
      : scaleMax === 20
      ? score / 4
      : score > 5
      ? score <= 10
        ? score / 2
        : score / 4
      : score;
  if (normalized >= 4.4) return 'Muito Bom';
  if (normalized >= 3.4) return 'Bom';
  if (normalized >= 2.5) return 'Suficiente';
  if (normalized >= 1.6) return 'Mau';
  return 'Péssimo';
}

export function numericToQualitativeSigla(score: number): 'MB' | 'B' | 'S' | 'M' | 'P' {
  const label = numericToQualitativeLabel(score);
  return QUALITATIVE_SCALE_OPTIONS.find((o) => o.label === label)?.sigla || 'S';
}

export function qualitativeLabelToNumeric(label: QualitativeRatingLabel, scaleMax = 5): number {
  const base5 = QUALITATIVE_SCALE_OPTIONS.find((o) => o.label === label)?.score ?? 3;
  if (scaleMax === 10) return base5 * 2;
  if (scaleMax === 20) return base5 * 4;
  return base5;
}

export function isPassingGradeForClass(score: number, classe: string): boolean {
  const scale = getGradingScaleForClass(classe);
  if (scale.type === 'qualitativo') {
    const label = numericToQualitativeLabel(score);
    return label === 'Muito Bom' || label === 'Bom' || label === 'Suficiente';
  }
  return score >= scale.passingScore;
}

export function formatGradeForClass(
  score: number,
  classe: string,
  mode: 'full' | 'compact' = 'full'
): string {
  const scale = getGradingScaleForClass(classe);
  if (scale.type === 'qualitativo') {
    const label = numericToQualitativeLabel(score);
    if (mode === 'compact') {
      return label;
    }
    return label;
  }
  return Number(score || 0).toFixed(1);
}

export function clampScoreForClass(score: number, classe: string): number {
  const scale = getGradingScaleForClass(classe);
  const clamped = Math.max(scale.min, Math.min(scale.max, Number(score) || 0));
  return Math.round(clamped * 10) / 10;
}

export interface TrimestreGrades {
  mac: number;
  npp: number;
  npt: number;
  mt: number;
}

export interface StudentMiniPautaRow {
  studentId: string;
  numero: number;
  codigo: string;
  nomeCompleto: string;
  genero: 'M' | 'F';
  t1: TrimestreGrades;
  t2: TrimestreGrades;
  t3: TrimestreGrades;
  mfd: number;
  observacao: string;
}

export interface TeacherMiniPautaRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  schoolName: string;
  classe: string;
  turma: string;
  sala: string;
  turno: 'Manhã' | 'Tarde' | 'Noite';
  anoLectivo: string;
  regimeClasse: 'monodocente' | 'pluridocente';
  disciplina: string;
  trimestresSubmetidos: ('I' | 'II' | 'III')[];
  status: 'rascunho' | 'submetida' | 'homologada';
  updatedAt: string;
  rows: StudentMiniPautaRow[];
}

export interface ConsolidatedStudentRecord {
  studentId: string;
  numero: number;
  codigo: string;
  nomeCompleto: string;
  genero: 'M' | 'F';
  byDiscipline: Record<
    string,
    {
      t1: TrimestreGrades;
      t2: TrimestreGrades;
      t3: TrimestreGrades;
      mfd: number;
      teacherName: string;
    }
  >;
  mediaTrimestral: {
    t1: TrimestreGrades;
    t2: TrimestreGrades;
    t3: TrimestreGrades;
  };
  mediaFinalGeral: number;
  comportamento: string;
  observacaoFinal: 'Transita' | 'Não Transita';
}

export interface ConsolidatedTurmaPauta {
  classe: string;
  turma: string;
  sala: string;
  turno: 'Manhã' | 'Tarde' | 'Noite';
  anoLectivo: string;
  schoolName: string;
  regimeClasse: 'monodocente' | 'pluridocente';
  gradingScale: ClassGradingScaleConfig;
  isAutomaticTransitionClass: boolean;
  disciplinas: string[];
  teachersByDiscipline: Record<string, string>;
  contributingTeachers: {
    teacherId: string;
    teacherName: string;
    disciplinas: string[];
    updatedAt: string;
    status: 'rascunho' | 'submetida' | 'homologada';
  }[];
  students: ConsolidatedStudentRecord[];
}

const STORAGE_KEY = 'sigre_teacher_mini_pautas_v5_blank';
const LEGACY_STORAGE_KEYS = [
  'sigre_teacher_mini_pautas_v1',
  'sigre_teacher_mini_pautas_v2',
  'sigre_teacher_mini_pautas_v3',
  'sigre_teacher_mini_pautas_v4',
];

export function calcMT(mac: number, npp: number, npt: number): number {
  return Math.round(((Number(mac) + Number(npp) + Number(npt)) / 3) * 10) / 10;
}

export function calcMFD(mt1: number, mt2: number, mt3: number): number {
  return Math.round(((Number(mt1) + Number(mt2) + Number(mt3)) / 3) * 10) / 10;
}

// Inicializado em branco: nenhum professor enviou ou anexou notas ainda
export const INITIAL_TEACHER_MINI_PAUTAS: TeacherMiniPautaRecord[] = [];

export function getStoredMiniPautas(): TeacherMiniPautaRecord[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return INITIAL_TEACHER_MINI_PAUTAS;
  }
  try {
    LEGACY_STORAGE_KEYS.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TEACHER_MINI_PAUTAS));
      return INITIAL_TEACHER_MINI_PAUTAS;
    }
    const parsed: TeacherMiniPautaRecord[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_TEACHER_MINI_PAUTAS;
    }
    return parsed;
  } catch {
    return INITIAL_TEACHER_MINI_PAUTAS;
  }
}

export function saveTeacherMiniPauta(record: TeacherMiniPautaRecord): TeacherMiniPautaRecord[] {
  const current = getStoredMiniPautas();
  const normKey = (r: TeacherMiniPautaRecord) =>
    `${r.classe.trim().toLowerCase()}::${r.turma.trim().toLowerCase()}::${r.disciplina.trim().toLowerCase()}`;
  const targetKey = normKey(record);

  const reindexedRows = record.rows.map((r, i) => {
    const mac1 = clampScoreForClass(r.t1.mac, record.classe);
    const npp1 = clampScoreForClass(r.t1.npp, record.classe);
    const npt1 = clampScoreForClass(r.t1.npt, record.classe);
    const mt1 = calcMT(mac1, npp1, npt1);

    const mac2 = clampScoreForClass(r.t2.mac, record.classe);
    const npp2 = clampScoreForClass(r.t2.npp, record.classe);
    const npt2 = clampScoreForClass(r.t2.npt, record.classe);
    const mt2 = calcMT(mac2, npp2, npt2);

    const mac3 = clampScoreForClass(r.t3.mac, record.classe);
    const npp3 = clampScoreForClass(r.t3.npp, record.classe);
    const npt3 = clampScoreForClass(r.t3.npt, record.classe);
    const mt3 = calcMT(mac3, npp3, npt3);

    const mfd = calcMFD(mt1, mt2, mt3);
    return {
      ...r,
      numero: i + 1,
      t1: { mac: mac1, npp: npp1, npt: npt1, mt: mt1 },
      t2: { mac: mac2, npp: npp2, npt: npt2, mt: mt2 },
      t3: { mac: mac3, npp: npp3, npt: npt3, mt: mt3 },
      mfd,
      observacao: isPassingGradeForClass(mfd, record.classe) ? 'Transita' : 'Não Transita',
    };
  });

  const updatedRecord: TeacherMiniPautaRecord = {
    ...record,
    rows: reindexedRows,
    updatedAt: new Date().toLocaleString('pt-AO'),
  };

  const filtered = current.filter((item) => item.id !== record.id && normKey(item) !== targetKey);
  const next = [updatedRecord, ...filtered];

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('sigre-minipautas-updated'));
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    } catch {
      // ignore
    }
  }
  return next;
}

export function consolidateTurmaPauta(
  classe: string,
  turma: string,
  schoolNameFallback = 'Complexo Escolar Nº 1024 - Quêssua'
): ConsolidatedTurmaPauta {
  const all = getStoredMiniPautas();
  const gradingScale = getGradingScaleForClass(classe);
  const officialDisciplinas = getDisciplinasForClass(classe);

  const matching = all.filter(
    (r) =>
      r.classe.trim().toLowerCase() === classe.trim().toLowerCase() &&
      r.turma.trim().toLowerCase() === turma.trim().toLowerCase()
  );

  // Não gerar dados fictícios: usar apenas as mini-pautas efetivamente enviadas pelos professores para esta classe e turma
  const finalRecords: TeacherMiniPautaRecord[] = matching;

  const first = finalRecords[0];
  const disciplinas: string[] = [...officialDisciplinas];
  const teachersByDiscipline: Record<string, string> = {};
  const teacherMap = new Map<
    string,
    {
      teacherId: string;
      teacherName: string;
      disciplinas: string[];
      updatedAt: string;
      status: 'rascunho' | 'submetida' | 'homologada';
    }
  >();

  finalRecords.forEach((rec) => {
    if (!disciplinas.includes(rec.disciplina)) {
      disciplinas.push(rec.disciplina);
    }
    teachersByDiscipline[rec.disciplina] = rec.teacherName;

    const existingT = teacherMap.get(rec.teacherName);
    if (existingT) {
      if (!existingT.disciplinas.includes(rec.disciplina)) {
        existingT.disciplinas.push(rec.disciplina);
      }
    } else {
      teacherMap.set(rec.teacherName, {
        teacherId: rec.teacherId,
        teacherName: rec.teacherName,
        disciplinas: [rec.disciplina],
        updatedAt: rec.updatedAt,
        status: rec.status,
      });
    }
  });

  const studentMap = new Map<string, ConsolidatedStudentRecord>();

  finalRecords.forEach((rec) => {
    rec.rows.forEach((row) => {
      const key = row.nomeCompleto.trim().toLowerCase();
      let stu = studentMap.get(key);
      if (!stu) {
        stu = {
          studentId: row.studentId,
          numero: row.numero,
          codigo: row.codigo,
          nomeCompleto: row.nomeCompleto,
          genero: row.genero,
          byDiscipline: {},
          mediaTrimestral: {
            t1: { mac: 0, npp: 0, npt: 0, mt: 0 },
            t2: { mac: 0, npp: 0, npt: 0, mt: 0 },
            t3: { mac: 0, npp: 0, npt: 0, mt: 0 },
          },
          mediaFinalGeral: 0,
          comportamento: 'Bom',
          observacaoFinal: 'Transita',
        };
        studentMap.set(key, stu);
      }
      stu.byDiscipline[rec.disciplina] = {
        t1: row.t1,
        t2: row.t2,
        t3: row.t3,
        mfd: row.mfd,
        teacherName: rec.teacherName,
      };
    });
  });

  const students = Array.from(studentMap.values())
    .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt'))
    .map((stu, idx) => {
      const discValues = Object.values(stu.byDiscipline);
      const count = discValues.length || 1;
      const round1 = (v: number) => Math.round(v * 10) / 10;

      const t1Mac = round1(discValues.reduce((s, d) => s + d.t1.mac, 0) / count);
      const t1Npp = round1(discValues.reduce((s, d) => s + d.t1.npp, 0) / count);
      const t1Npt = round1(discValues.reduce((s, d) => s + d.t1.npt, 0) / count);
      const t1Mt = round1(discValues.reduce((s, d) => s + d.t1.mt, 0) / count);

      const t2Mac = round1(discValues.reduce((s, d) => s + d.t2.mac, 0) / count);
      const t2Npp = round1(discValues.reduce((s, d) => s + d.t2.npp, 0) / count);
      const t2Npt = round1(discValues.reduce((s, d) => s + d.t2.npt, 0) / count);
      const t2Mt = round1(discValues.reduce((s, d) => s + d.t2.mt, 0) / count);

      const t3Mac = round1(discValues.reduce((s, d) => s + d.t3.mac, 0) / count);
      const t3Npp = round1(discValues.reduce((s, d) => s + d.t3.npp, 0) / count);
      const t3Npt = round1(discValues.reduce((s, d) => s + d.t3.npt, 0) / count);
      const t3Mt = round1(discValues.reduce((s, d) => s + d.t3.mt, 0) / count);

      const mediaFinalGeral = round1(discValues.reduce((s, d) => s + d.mfd, 0) / count);

      return {
        ...stu,
        numero: idx + 1,
        mediaTrimestral: {
          t1: { mac: t1Mac, npp: t1Npp, npt: t1Npt, mt: t1Mt },
          t2: { mac: t2Mac, npp: t2Npp, npt: t2Npt, mt: t2Mt },
          t3: { mac: t3Mac, npp: t3Npp, npt: t3Npt, mt: t3Mt },
        },
        mediaFinalGeral,
        observacaoFinal: (isPassingGradeForClass(mediaFinalGeral, classe)
          ? 'Transita'
          : 'Não Transita') as 'Transita' | 'Não Transita',
      };
    });

  const contributingTeachers = Array.from(teacherMap.values());
  const isAutomaticTransitionClass = ['Iniciação', '1ª Classe', '3ª Classe', '5ª Classe'].includes(
    classe
  );

  return {
    classe,
    turma,
    sala: first?.sala || 'Sala 01',
    turno: first?.turno || 'Manhã',
    anoLectivo: first?.anoLectivo || '2026/2027',
    schoolName: first?.schoolName || schoolNameFallback,
    regimeClasse:
      contributingTeachers.length > 1
        ? 'pluridocente'
        : first?.regimeClasse || 'monodocente',
    gradingScale,
    isAutomaticTransitionClass,
    disciplinas,
    teachersByDiscipline,
    contributingTeachers,
    students,
  };
}

function getJsPDFCtor(): any {
  if (typeof (jsPDF as any)?.jsPDF === 'function') return (jsPDF as any).jsPDF;
  if (typeof jsPDF === 'function') return jsPDF;
  return (jsPDF as any).default || jsPDF;
}

export function exportConsolidatedPautaToPDF(options: {
  consolidated: ConsolidatedTurmaPauta;
  documentType?: 'pauta_final' | 'mapa_trimestral' | 'mini_pauta_disciplina';
  periodo?: 'I' | 'II' | 'III' | 'FINAL';
  trimestre?: 'I' | 'II' | 'III';
  disciplina?: string;
  disciplinaFilter?: 'TODAS' | string;
  directorName?: string;
  subDirectorName?: string;
}): void {
  const {
    consolidated,
    documentType = 'mapa_trimestral',
    periodo,
    trimestre = 'I',
    disciplina,
    disciplinaFilter,
    directorName = 'O Director da Escola',
    subDirectorName = 'O Sub-Director Pedagógico(a)',
  } = options;

  // Resolve active period ('I' | 'II' | 'III' | 'FINAL')
  const resolvedPeriodo: 'I' | 'II' | 'III' | 'FINAL' =
    periodo ||
    (documentType === 'pauta_final' ? 'FINAL' : trimestre || 'I');

  // Resolve active discipline scope ('TODAS' or a specific discipline name)
  const resolvedDiscScope: 'TODAS' | string =
    disciplinaFilter ||
    (documentType === 'mini_pauta_disciplina'
      ? disciplina || consolidated.disciplinas[0] || 'Língua Portuguesa'
      : 'TODAS');

  const isSingleDiscipline = resolvedDiscScope !== 'TODAS';
  const targetDisciplina = isSingleDiscipline
    ? resolvedDiscScope
    : consolidated.disciplinas[0] || 'Língua Portuguesa';

  const isQual = consolidated.gradingScale.type === 'qualitativo';
  const formatPdfCell = (val: number, compact = false) => {
    if (isQual) {
      return compact ? numericToQualitativeSigla(val) : numericToQualitativeLabel(val);
    }
    return val.toFixed(1);
  };

  const Ctor = getJsPDFCtor();
  const pdf = new Ctor({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 297;
  const marginX = 8;
  const contentWidth = pageWidth - marginX * 2;

  // Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('REPÚBLICA DE ANGOLA', pageWidth / 2, 10, { align: 'center' });
  pdf.setFontSize(8);
  pdf.text('GOVERNO PROVINCIAL DE MALANJE', pageWidth / 2, 14, { align: 'center' });
  pdf.text(
    'ADMINISTRAÇÃO MUNICIPAL DE QUÊSSUA · DIRECÇÃO MUNICIPAL DA EDUCAÇÃO',
    pageWidth / 2,
    18,
    { align: 'center' }
  );
  pdf.setFontSize(9);
  pdf.text(consolidated.schoolName.toUpperCase(), pageWidth / 2, 22.5, { align: 'center' });

  let docTitle = '';
  if (isSingleDiscipline) {
    if (resolvedPeriodo === 'FINAL') {
      docTitle = `PAUTA FINAL DE ${targetDisciplina.toUpperCase()} (${consolidated.classe.toUpperCase()} · ${consolidated.turma.toUpperCase()}) — ${consolidated.gradingScale.shortScaleLabel.toUpperCase()} — ${consolidated.anoLectivo}`;
    } else {
      docTitle = `MINI-PAUTA DO ${resolvedPeriodo}º TRIMESTRE — DISCIPLINA: ${targetDisciplina.toUpperCase()} (${consolidated.classe.toUpperCase()} · ${consolidated.turma.toUpperCase()})`;
    }
  } else {
    if (resolvedPeriodo === 'FINAL') {
      docTitle = `PAUTA FINAL GERAL (TODAS AS DISCIPLINAS) — ${consolidated.classe.toUpperCase()} (${consolidated.turma.toUpperCase()}) — ${consolidated.anoLectivo}`;
    } else {
      docTitle = `MINI-PAUTA GERAL DO ${resolvedPeriodo}º TRIMESTRE (TODAS AS DISCIPLINAS) — ${consolidated.classe.toUpperCase()} (${consolidated.turma.toUpperCase()})`;
    }
  }

  pdf.setFillColor(0, 33, 51);
  pdf.rect(marginX, 25, contentWidth, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8.2);
  pdf.text(docTitle, pageWidth / 2, 29, { align: 'center' });

  // Metadata bar
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(7.2);
  const profLabel = isSingleDiscipline
    ? consolidated.teachersByDiscipline[targetDisciplina] ||
      consolidated.contributingTeachers[0]?.teacherName ||
      'Em branco (Sem envio)'
    : consolidated.contributingTeachers.length > 0
    ? consolidated.contributingTeachers.map((t) => t.teacherName).join(', ')
    : 'Em branco (Sem envio)';
  const periodoLabel =
    resolvedPeriodo === 'FINAL' ? 'PAUTA FINAL ANUAL' : `${resolvedPeriodo}º TRIMESTRE`;
  const discHeaderInfo = isSingleDiscipline ? `DISCIPLINA: ${targetDisciplina.toUpperCase()}` : 'DISCIPLINAS: TODAS';

  pdf.text(
    `PROFESSOR(ES): ${profLabel.slice(0, 48)}  |  ${discHeaderInfo}  |  PERÍODO: ${periodoLabel}  |  ESCALA: ${consolidated.gradingScale.shortScaleLabel.toUpperCase()}  |  ${consolidated.classe} · ${consolidated.turma}`,
    marginX,
    35
  );

  let y = 38;
  const rowH = 6.2;

  if (isSingleDiscipline && resolvedPeriodo !== 'FINAL') {
    // =========================================================================
    // CASE 1: SINGLE DISCIPLINE + SPECIFIC TRIMESTER (Iº, IIº, or IIIº ONLY!)
    // =========================================================================
    const mtLabel = `MT${resolvedPeriodo === 'I' ? '1' : resolvedPeriodo === 'II' ? '2' : '3'}`;
    const cols = [
      { label: 'Nº', w: 14 },
      { label: 'CÓDIGO', w: 22 },
      { label: 'NOME COMPLETO DO ALUNO', w: 95 },
      { label: 'GÉN.', w: 16 },
      { label: `MAC (${resolvedPeriodo}º TRIM.)`, w: 26 },
      { label: `NPP (${resolvedPeriodo}º TRIM.)`, w: 26 },
      { label: `NPT (${resolvedPeriodo}º TRIM.)`, w: 26 },
      { label: `${mtLabel} (${resolvedPeriodo}º TRIM.)`, w: 26 },
      { label: `OBSERVAÇÃO (${resolvedPeriodo}º TRIM.)`, w: 30 },
    ];
    let x = marginX;
    pdf.setFillColor(220, 237, 200);
    pdf.rect(marginX, y, contentWidth, rowH, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.8);
    cols.forEach((c) => {
      pdf.rect(x, y, c.w, rowH, 'S');
      pdf.text(c.label, x + c.w / 2, y + 4.2, { align: 'center' });
      x += c.w;
    });
    y += rowH;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    if (consolidated.students.length === 0) {
      for (let i = 0; i < 8; i++) {
        let cx = marginX;
        cols.forEach((c, idx) => {
          pdf.rect(cx, y, c.w, rowH, 'S');
          pdf.setTextColor(148, 163, 184);
          pdf.text(idx === 0 ? String(i + 1) : '—', cx + c.w / 2, y + 4.2, { align: 'center' });
          cx += c.w;
        });
        y += rowH;
      }
    } else {
      consolidated.students.forEach((stu) => {
        const d = stu.byDiscipline[targetDisciplina];
        if (!d) {
          let cx = marginX;
          const blankVals = [String(stu.numero), stu.codigo, stu.nomeCompleto, stu.genero, '—', '—', '—', '—', '—'];
          blankVals.forEach((v, idx) => {
            const w = cols[idx].w;
            pdf.rect(cx, y, w, rowH, 'S');
            pdf.setTextColor(100, 116, 139);
            pdf.text(v, idx === 2 ? cx + 2 : cx + w / 2, y + 4.2, { align: idx === 2 ? 'left' : 'center' });
            cx += w;
          });
          y += rowH;
          return;
        }
        const tObj =
          resolvedPeriodo === 'I' ? d.t1 : resolvedPeriodo === 'II' ? d.t2 : d.t3;
        const rawScores = [tObj.mac, tObj.npp, tObj.npt, tObj.mt];
        const passedTrim = isPassingGradeForClass(tObj.mt, consolidated.classe);

        const vals = [
          String(stu.numero),
          stu.codigo,
          stu.nomeCompleto,
          stu.genero,
          ...rawScores.map((s, idx) => formatPdfCell(s, idx < 3)),
          passedTrim ? 'Transita' : 'Não Transita',
        ];

        let cx = marginX;
        vals.forEach((v, idx) => {
          const w = cols[idx].w;
          pdf.rect(cx, y, w, rowH, 'S');
          if (idx >= 4 && idx <= 7) {
            const scoreVal = rawScores[idx - 4];
            if (!isPassingGradeForClass(scoreVal, consolidated.classe)) {
              pdf.setTextColor(220, 38, 38);
            } else {
              pdf.setTextColor(15, 23, 42);
            }
          } else if (idx === 8) {
            pdf.setTextColor(passedTrim ? 5 : 220, passedTrim ? 150 : 38, passedTrim ? 105 : 38);
          } else {
            pdf.setTextColor(15, 23, 42);
          }
          pdf.text(v, idx === 2 ? cx + 2 : cx + w / 2, y + 4.2, {
            align: idx === 2 ? 'left' : 'center',
          });
          cx += w;
        });
        y += rowH;
      });
    }
  } else if (isSingleDiscipline && resolvedPeriodo === 'FINAL') {
    // =========================================================================
    // CASE 2: SINGLE DISCIPLINE + PAUTA FINAL (Iº, IIº, IIIº Trim + MFD of ONLY that discipline)
    // =========================================================================
    const cols = [
      { label: 'Nº', w: 10 },
      { label: 'NOME COMPLETO', w: 75 },
      { label: 'MAC1', w: 12 },
      { label: 'NPP1', w: 12 },
      { label: 'NPT1', w: 12 },
      { label: 'MT1', w: 13 },
      { label: 'MAC2', w: 12 },
      { label: 'NPP2', w: 12 },
      { label: 'NPT2', w: 12 },
      { label: 'MT2', w: 13 },
      { label: 'MAC3', w: 12 },
      { label: 'NPP3', w: 12 },
      { label: 'NPT3', w: 12 },
      { label: 'MT3', w: 13 },
      { label: 'MFD', w: 15 },
      { label: 'OBSERVAÇÃO', w: 32 },
    ];
    let x = marginX;
    pdf.setFillColor(220, 237, 200);
    pdf.rect(marginX, y, contentWidth, rowH, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    cols.forEach((c) => {
      pdf.rect(x, y, c.w, rowH, 'S');
      pdf.text(c.label, x + c.w / 2, y + 4, { align: 'center' });
      x += c.w;
    });
    y += rowH;

    pdf.setFont('helvetica', 'normal');
    if (consolidated.students.length === 0) {
      for (let i = 0; i < 8; i++) {
        let cx = marginX;
        cols.forEach((c, idx) => {
          pdf.rect(cx, y, c.w, rowH, 'S');
          pdf.setTextColor(148, 163, 184);
          pdf.text(idx === 0 ? String(i + 1) : '—', cx + c.w / 2, y + 4, { align: 'center' });
          cx += c.w;
        });
        y += rowH;
      }
    } else {
      consolidated.students.forEach((stu) => {
        const d = stu.byDiscipline[targetDisciplina];
        let cx = marginX;
        if (!d) {
          cols.forEach((c, idx) => {
            pdf.rect(cx, y, c.w, rowH, 'S');
            pdf.setTextColor(100, 116, 139);
            const txt = idx === 0 ? String(stu.numero) : idx === 1 ? stu.nomeCompleto : '—';
            pdf.text(txt, idx === 1 ? cx + 2 : cx + c.w / 2, y + 4, { align: idx === 1 ? 'left' : 'center' });
            cx += c.w;
          });
          y += rowH;
          return;
        }
        const rawScores = [
          d.t1.mac,
          d.t1.npp,
          d.t1.npt,
          d.t1.mt,
          d.t2.mac,
          d.t2.npp,
          d.t2.npt,
          d.t2.mt,
          d.t3.mac,
          d.t3.npp,
          d.t3.npt,
          d.t3.mt,
          d.mfd,
        ];
        const vals = [
          String(stu.numero),
          stu.nomeCompleto,
          ...rawScores.map((s) => formatPdfCell(s, true)),
          isPassingGradeForClass(d.mfd, consolidated.classe) ? 'Transita' : 'Não Transita',
        ];
        vals.forEach((v, idx) => {
          const w = cols[idx].w;
          pdf.rect(cx, y, w, rowH, 'S');
          if (idx >= 2 && idx <= 14) {
            const scoreVal = rawScores[idx - 2];
            if (!isPassingGradeForClass(scoreVal, consolidated.classe)) {
              pdf.setTextColor(220, 38, 38);
            } else {
              pdf.setTextColor(15, 23, 42);
            }
          } else {
            pdf.setTextColor(15, 23, 42);
          }
          pdf.text(v, idx === 1 ? cx + 2 : cx + w / 2, y + 4, {
            align: idx === 1 ? 'left' : 'center',
          });
          cx += w;
        });
        y += rowH;
      });
    }
  } else {
    // =========================================================================
    // CASE 3 & 4: TODAS AS DISCIPLINAS (for Iº Trimestre only, IIº Trimestre only, IIIº Trimestre only, OR Pauta Final)
    // =========================================================================
    const subjects = consolidated.disciplinas;
    const isManySubjects = subjects.length > 6;
    const fixedLeft = isManySubjects ? 7 + 11 + 42 + 7 : 10 + 14 + 54 + 10;
    const fixedMediaW = isManySubjects ? 13 : 16;
    const fixedRight = isManySubjects ? 19 : 23;
    const availForSubjects = contentWidth - fixedLeft - fixedMediaW - fixedRight;
    const subW = availForSubjects / Math.max(1, subjects.length);

    const shortSubjectTitle = (s: string) => {
      const map: Record<string, string> = {
        'Língua Portuguesa': 'L. PORT.',
        'Matemática': 'MAT.',
        'Estudo do Meio': 'EST. MEIO',
        'Educação Manual e Plástica': 'E.M.P.',
        'Educação Musical': 'ED. MUS.',
        'Educação Física': 'ED. FÍS.',
        'Ciências da Natureza': 'C. NAT.',
        'História': 'HIST.',
        'Geografia': 'GEOG.',
        'Educação Moral e Cívica': 'E.M.C.',
        'Educação Visual e Plástica (EVP)': 'E.V.P.',
        'Língua Estrangeira (Inglês)': 'INGLÊS',
        'Biologia': 'BIOL.',
        'Física': 'FÍS.',
        'Química': 'QUÍM.',
        'Educação Laboral': 'ED. LAB.',
        'História e Geografia': 'HIST/GEO',
      };
      return map[s] || s.slice(0, isManySubjects ? 8 : 14).toUpperCase();
    };

    const wNum = isManySubjects ? 7 : 10;
    const wCod = isManySubjects ? 11 : 14;
    const wName = isManySubjects ? 42 : 54;
    const wGen = isManySubjects ? 7 : 10;

    let x = marginX;
    pdf.setFillColor(241, 245, 249);
    pdf.rect(marginX, y, contentWidth, rowH * 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(isManySubjects ? 4.8 : 6);

    pdf.rect(x, y, wNum, rowH * 2, 'S');
    pdf.text('Nº', x + wNum / 2, y + 7, { align: 'center' });
    x += wNum;

    pdf.rect(x, y, wCod, rowH * 2, 'S');
    pdf.text('Código', x + wCod / 2, y + 7, { align: 'center' });
    x += wCod;

    pdf.rect(x, y, wName, rowH * 2, 'S');
    pdf.text('NOME COMPLETO', x + wName / 2, y + 7, { align: 'center' });
    x += wName;

    pdf.rect(x, y, wGen, rowH * 2, 'S');
    pdf.text('Gén.', x + wGen / 2, y + 7, { align: 'center' });
    x += wGen;

    const subCols =
      resolvedPeriodo === 'FINAL'
        ? ['MT1', 'MT2', 'MT3', 'MFD']
        : ['MAC', 'NPP', 'NPT', `MT${resolvedPeriodo === 'I' ? '1' : resolvedPeriodo === 'II' ? '2' : '3'}`];

    subjects.forEach((subj) => {
      if (subj.toLowerCase().includes('estrangeira')) {
        pdf.setFillColor(254, 240, 138);
        pdf.rect(x, y, subW, rowH * 2, 'F');
      }
      pdf.rect(x, y, subW, rowH, 'S');
      pdf.text(shortSubjectTitle(subj), x + subW / 2, y + 4, { align: 'center' });
      const cellW = subW / 4;
      subCols.forEach((sc, scIdx) => {
        pdf.rect(x + scIdx * cellW, y + rowH, cellW, rowH, 'S');
        pdf.text(sc, x + scIdx * cellW + cellW / 2, y + rowH + 4, { align: 'center' });
      });
      x += subW;
    });

    pdf.rect(x, y, fixedMediaW, rowH * 2, 'S');
    pdf.text(resolvedPeriodo === 'FINAL' ? 'MÉDIA' : `MÉD. ${resolvedPeriodo}º`, x + fixedMediaW / 2, y + 7, { align: 'center' });
    x += fixedMediaW;

    pdf.rect(x, y, fixedRight, rowH * 2, 'S');
    pdf.text('OBSERV.', x + fixedRight / 2, y + 7, { align: 'center' });
    y += rowH * 2;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(isManySubjects ? 4.8 : 6);
    if (consolidated.students.length === 0) {
      for (let i = 0; i < 8; i++) {
        let cx = marginX;
        pdf.setTextColor(148, 163, 184);
        pdf.rect(cx, y, wNum, rowH, 'S');
        pdf.text(String(i + 1), cx + wNum / 2, y + 4, { align: 'center' });
        cx += wNum;

        pdf.rect(cx, y, wCod, rowH, 'S');
        pdf.text('—', cx + wCod / 2, y + 4, { align: 'center' });
        cx += wCod;

        pdf.rect(cx, y, wName, rowH, 'S');
        pdf.text('—', cx + wName / 2, y + 4, { align: 'center' });
        cx += wName;

        pdf.rect(cx, y, wGen, rowH, 'S');
        pdf.text('—', cx + wGen / 2, y + 4, { align: 'center' });
        cx += wGen;

        subjects.forEach(() => {
          const cellW = subW / 4;
          for (let nIdx = 0; nIdx < 4; nIdx++) {
            pdf.rect(cx + nIdx * cellW, y, cellW, rowH, 'S');
            pdf.text('—', cx + nIdx * cellW + cellW / 2, y + 4, { align: 'center' });
          }
          cx += subW;
        });

        pdf.rect(cx, y, fixedMediaW, rowH, 'S');
        pdf.text('—', cx + fixedMediaW / 2, y + 4, { align: 'center' });
        cx += fixedMediaW;

        pdf.rect(cx, y, fixedRight, rowH, 'S');
        pdf.text('—', cx + fixedRight / 2, y + 4, { align: 'center' });
        y += rowH;
      }
    } else {
      consolidated.students.forEach((stu) => {
        let cx = marginX;
        pdf.setTextColor(15, 23, 42);
        pdf.rect(cx, y, wNum, rowH, 'S');
        pdf.text(String(stu.numero), cx + wNum / 2, y + 4, { align: 'center' });
        cx += wNum;

        pdf.rect(cx, y, wCod, rowH, 'S');
        pdf.text(stu.codigo, cx + wCod / 2, y + 4, { align: 'center' });
        cx += wCod;

        pdf.rect(cx, y, wName, rowH, 'S');
        pdf.text(stu.nomeCompleto.slice(0, isManySubjects ? 24 : 31), cx + 1.2, y + 4);
        cx += wName;

        pdf.rect(cx, y, wGen, rowH, 'S');
        pdf.text(stu.genero, cx + wGen / 2, y + 4, { align: 'center' });
        cx += wGen;

        subjects.forEach((subj) => {
          const d = stu.byDiscipline[subj];
          const cellW = subW / 4;
          if (!d) {
            for (let nIdx = 0; nIdx < 4; nIdx++) {
              pdf.rect(cx + nIdx * cellW, y, cellW, rowH, 'S');
              pdf.setTextColor(148, 163, 184);
              pdf.text('—', cx + nIdx * cellW + cellW / 2, y + 4, { align: 'center' });
            }
            cx += subW;
            return;
          }
          const tObj = resolvedPeriodo === 'I' ? d.t1 : resolvedPeriodo === 'II' ? d.t2 : d.t3;
          const nums =
            resolvedPeriodo === 'FINAL'
              ? [d.t1.mt, d.t2.mt, d.t3.mt, d.mfd]
              : [tObj.mac, tObj.npp, tObj.npt, tObj.mt];

          nums.forEach((n, nIdx) => {
            if (subj.toLowerCase().includes('estrangeira')) {
              pdf.setFillColor(254, 249, 195);
              pdf.rect(cx + nIdx * cellW, y, cellW, rowH, 'FD');
            } else {
              pdf.rect(cx + nIdx * cellW, y, cellW, rowH, 'S');
            }
            if (!isPassingGradeForClass(n, consolidated.classe)) pdf.setTextColor(220, 38, 38);
            else pdf.setTextColor(15, 23, 42);
            pdf.text(formatPdfCell(n, true), cx + nIdx * cellW + cellW / 2, y + 4, {
              align: 'center',
            });
          });
          cx += subW;
        });

        const periodAvg =
          resolvedPeriodo === 'FINAL'
            ? stu.mediaFinalGeral
            : resolvedPeriodo === 'I'
            ? stu.mediaTrimestral.t1.mt
            : resolvedPeriodo === 'II'
            ? stu.mediaTrimestral.t2.mt
            : stu.mediaTrimestral.t3.mt;
        const periodPassed = isPassingGradeForClass(periodAvg, consolidated.classe);

        pdf.rect(cx, y, fixedMediaW, rowH, 'S');
        if (!periodPassed) pdf.setTextColor(220, 38, 38);
        else pdf.setTextColor(15, 23, 42);
        pdf.text(formatPdfCell(periodAvg, true), cx + fixedMediaW / 2, y + 4, { align: 'center' });
        cx += fixedMediaW;

        pdf.setTextColor(periodPassed ? 5 : 220, periodPassed ? 150 : 38, periodPassed ? 105 : 38);
        pdf.rect(cx, y, fixedRight, rowH, 'S');
        pdf.text(periodPassed ? 'Transita' : 'Não Transita', cx + fixedRight / 2, y + 4, {
          align: 'center',
        });
        y += rowH;
      });
    }
  }

  if (isQual) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(
      'LEGENDA QUALITATIVA (Iniciação, 1ª e 2ª Classe): MB = Muito Bom  |  B = Bom  |  S = Suficiente  |  M = Mau  |  P = Péssimo',
      marginX,
      y + 5
    );
  }

  const sigY = Math.min(195, y + 13);
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('O CORPO DE JÚRI / PROFESSOR(ES)', marginX + 35, sigY, { align: 'center' });
  pdf.text(subDirectorName.toUpperCase(), pageWidth / 2, sigY, { align: 'center' });
  pdf.text(directorName.toUpperCase(), pageWidth - marginX - 35, sigY, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.text('_______________________________', marginX + 35, sigY + 7, { align: 'center' });
  pdf.text('_______________________________', pageWidth / 2, sigY + 7, { align: 'center' });
  pdf.text('_______________________________', pageWidth - marginX - 35, sigY + 7, { align: 'center' });

  const discSlug = isSingleDiscipline ? targetDisciplina : 'todas_disciplinas';
  const perSlug = resolvedPeriodo === 'FINAL' ? 'pauta_final' : `minipauta_${resolvedPeriodo}_trimestre`;
  const fileSlug = `${perSlug}_${discSlug}_${consolidated.classe}_${consolidated.turma}`
    .replace(/\s+/g, '_')
    .toLowerCase();
  pdf.save(`${fileSlug}.pdf`);
}
