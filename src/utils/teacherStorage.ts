import type {
  AdminSchool,
  AdminTeacher,
  DirectorTeacher,
  TeacherRegistrationData,
  TeacherFaixaEtaria,
  TeacherNaturezaEscola,
  TeacherTipoInstituicao,
  TeacherFuncaoCategoria,
  TeacherClassificacaoPedagogica,
  TeacherNivelAcademico,
  TeacherRegimeTrabalho,
  TeacherTeachingLevel,
  TeacherAuditLog,
} from '../types';

export const STORAGE_KEY_TEACHERS = 'ucore_registered_teachers_v2';

// 1. Calculate Age and Age Bracket (Faixa Etária)
export function calculateAge(birthDateString: string): number {
  if (!birthDateString) return 30;
  const birth = new Date(birthDateString);
  if (isNaN(birth.getTime())) return 30;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function calculateFaixaEtaria(birthDateString: string): TeacherFaixaEtaria {
  const age = calculateAge(birthDateString);
  if (age < 18) return 'menor de 18';
  if (age <= 19) return '18-19';
  if (age <= 24) return '20-24';
  if (age <= 29) return '25-29';
  if (age <= 34) return '30-34';
  if (age <= 39) return '35-39';
  return 'mais de 39 anos';
}

// 2. Cascade Pedagogical Classification
export function computeClassificacaoPedagogica(
  temFormacao: boolean,
  temMagisterio: boolean,
  temImne: boolean,
  temOutra: boolean
): TeacherClassificacaoPedagogica {
  if (!temFormacao) {
    return 'Sem Magistério e sem Formação pedagógica';
  }
  if (temMagisterio || temImne) {
    return 'Com magistério e com IMNE completo';
  }
  if (temOutra) {
    return 'Sem Magistério e com formação Pedagógica';
  }
  return 'Sem Magistério e sem Formação pedagógica';
}

// Standard Teaching Level Definitions
export const TEACHING_LEVELS_CATALOG: {
  id: string;
  nome: string;
  tipoDetalhe?: 'etapa' | 'modulo' | 'ano_eja' | 'texto' | 'classe';
  opcoesDetalhe?: string[];
}[] = [
  { id: 'pre_escola', nome: 'Pré-escola / Classe de Iniciação' },
  {
    id: 'primario',
    nome: 'Ensino Primário (1.ª a 6.ª classe)',
    tipoDetalhe: 'classe',
    opcoesDetalhe: ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe', '6ª Classe'],
  },
  { id: 'praeer', nome: 'PRAEER', tipoDetalhe: 'etapa', opcoesDetalhe: ['Etapa 1', 'Etapa 2', 'Etapa 3'] },
  { id: 'primario_adultos', nome: 'Ensino Primário de Adultos' },
  { id: 'alfabetizacao', nome: 'Alfabetização', tipoDetalhe: 'modulo', opcoesDetalhe: ['Módulo 1', 'Módulo 2', 'Módulo 3'] },
  { id: 'eja', nome: 'EJA', tipoDetalhe: 'ano_eja', opcoesDetalhe: ['Módulo 1', 'Módulo 2', 'Módulo 3'] },
  {
    id: 'i_ciclo_geral',
    nome: 'I Ciclo do Ensino Secundário Geral (7.ª a 9.ª classe)',
    tipoDetalhe: 'classe',
    opcoesDetalhe: ['7ª Classe', '8ª Classe', '9ª Classe'],
  },
  {
    id: 'i_ciclo_tecnico',
    nome: 'I Ciclo do Ensino Secundário Técnico-Profissional',
    tipoDetalhe: 'classe',
    opcoesDetalhe: ['7ª Classe', '8ª Classe', '9ª Classe'],
  },
  { id: 'ii_ciclo_geral', nome: 'II Ciclo do Ensino Secundário Geral' },
  { id: 'ii_ciclo_tecnico', nome: 'II Ciclo do Ensino Secundário Técnico-Profissional' },
  { id: 'ii_ciclo_formacao_prof', nome: 'II Ciclo do Ensino Secundário de Formação de Professores' },
  { id: 'outro', nome: 'Outro', tipoDetalhe: 'texto' },
];

export const NATUREZA_OPTIONS: TeacherNaturezaEscola[] = ['Pública', 'Público-Privada', 'Privada'];

export const TIPO_INSTITUICAO_OPTIONS: TeacherTipoInstituicao[] = [
  'Creche',
  'Jardim de infância',
  'Centro infantil',
  'CIC / CEC',
  'Escola com classe de Iniciação',
  'Outro',
];

export const FUNCAO_CATEGORIA_OPTIONS: TeacherFuncaoCategoria[] = [
  'Educador(a) de Infância',
  'Auxiliar de Acção Educativa',
  'Docente / Professor',
  'Alfabetizador(a)',
  'Outro',
];

export const NIVEL_ACADEMICO_OPTIONS: TeacherNivelAcademico[] = [
  'Até à 6.ª classe',
  '7.ª a 8.ª classe',
  '9.ª a 10.ª classe',
  '11.ª a 12.ª classe',
  'Bacharelato',
  'Licenciado',
  'Pós-licenciado (mestrado / doutoramento)',
  'Outro',
];

export const REGIME_TRABALHO_OPTIONS: TeacherRegimeTrabalho[] = [
  'Efectivo',
  'Contratado',
  'Voluntário',
  'Colaborador',
  'Outro',
];

// Initial Seed Data with rich profiles
export const initialTeachersList: TeacherRegistrationData[] = [];

// LocalStorage Management
export function getStoredTeachers(): TeacherRegistrationData[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return initialTeachersList;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEACHERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(initialTeachersList));
      return initialTeachersList;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const filtered = parsed.filter(
        (t: TeacherRegistrationData) => !String(t?.nomeEscola || '').trim().toLowerCase().includes('modelo central')
      );
      if (filtered.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(filtered));
      }
      return filtered;
    }
    return initialTeachersList;
  } catch {
    return initialTeachersList;
  }
}

export function saveTeacher(
  teacher: TeacherRegistrationData,
  authorName: string = 'Administrador'
): TeacherRegistrationData[] {
  const current = getStoredTeachers();
  const existingIndex = current.findIndex((t) => t.id === teacher.id);
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  let updatedList: TeacherRegistrationData[];

  if (existingIndex >= 0) {
    const existing = current[existingIndex];
    const newLog: TeacherAuditLog = {
      id: `log-${Date.now()}`,
      data: now,
      autor: authorName,
      acao: 'Atualização',
      detalhes: 'Dados cadastrais e habilitações atualizados no sistema Sigre.',
    };

    const updatedTeacher: TeacherRegistrationData = {
      ...teacher,
      faixaEtaria: calculateFaixaEtaria(teacher.dataNascimento),
      classificacaoPedagogica: computeClassificacaoPedagogica(
        teacher.temFormacaoPedagogica,
        teacher.temMagisterioCompleto,
        teacher.temImneCompleto,
        teacher.temOutraFormacaoPedagogica
      ),
      historicoAlteracoes: [newLog, ...(existing.historicoAlteracoes || [])],
      atualizadoEm: new Date().toISOString(),
    };

    updatedList = [...current];
    updatedList[existingIndex] = updatedTeacher;
  } else {
    const newLog: TeacherAuditLog = {
      id: `log-${Date.now()}`,
      data: now,
      autor: authorName,
      acao: 'Criação',
      detalhes: 'Homologação e registro cadastral inicial do docente.',
    };

    const newTeacher: TeacherRegistrationData = {
      ...teacher,
      faixaEtaria: calculateFaixaEtaria(teacher.dataNascimento),
      classificacaoPedagogica: computeClassificacaoPedagogica(
        teacher.temFormacaoPedagogica,
        teacher.temMagisterioCompleto,
        teacher.temImneCompleto,
        teacher.temOutraFormacaoPedagogica
      ),
      historicoAlteracoes: [newLog],
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    updatedList = [newTeacher, ...current];
  }

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(updatedList));

      const savedRecord = updatedList.find((t) => t.id === teacher.id) || updatedList[0];

      // 1) Sincronizar com ucore_admin_teachers
      const rawAdminTeachers = localStorage.getItem('ucore_admin_teachers');
      const adminTeachers: AdminTeacher[] = rawAdminTeachers ? JSON.parse(rawAdminTeachers) : [];
      const adminEntry: AdminTeacher = {
        id: savedRecord.id,
        name: savedRecord.nomeCompleto,
        phone: savedRecord.telefone || '+244 923 000 000',
        gradeClass: savedRecord.niveisLecciona?.[0]?.nome || 'Ensino Primário',
        room: 'Sala 01',
        turma: 'Turma A',
        category: savedRecord.funcaoCategoria || 'Docente / Professor',
        location: `${savedRecord.municipioEscola || 'Quêssua'} (${savedRecord.provinciaEscola || 'Malanje'})`,
        schoolName: savedRecord.nomeEscola,
        schoolId: savedRecord.escolaId,
        presenceRate: 99.0,
        subject: savedRecord.disciplinas || 'Língua Portuguesa & Matemática',
        gender: savedRecord.sexo === 'Feminino' ? 'F' : 'M',
        qualification: savedRecord.nivelAcademico,
        registrationData: savedRecord,
      };
      const existingAdminIdx = adminTeachers.findIndex(
        (at) =>
          at.id === savedRecord.id ||
          at.name.trim().toLowerCase() === savedRecord.nomeCompleto.trim().toLowerCase()
      );
      if (existingAdminIdx >= 0) {
        adminTeachers[existingAdminIdx] = {
          ...adminTeachers[existingAdminIdx],
          ...adminEntry,
        };
      } else {
        adminTeachers.unshift(adminEntry);
      }
      localStorage.setItem('ucore_admin_teachers', JSON.stringify(adminTeachers));

      // 2) Sincronizar com ucore_director_teachers_v1
      const rawDirTeachers = localStorage.getItem('ucore_director_teachers_v1');
      const dirTeachers: DirectorTeacher[] = rawDirTeachers ? JSON.parse(rawDirTeachers) : [];
      const shiftVal = savedRecord.turnos?.[0] === 'Tarde' ? 'Tarde' : 'Manhã';
      const dirEntry: DirectorTeacher = {
        id: savedRecord.id,
        name: savedRecord.nomeCompleto,
        schoolName: savedRecord.nomeEscola,
        gradeClass: savedRecord.niveisLecciona?.[0]?.nome || 'Ensino Primário',
        room: 'Sala 01',
        turma: 'Turma A',
        directorName: authorName,
        location: `${savedRecord.municipioEscola || 'Quêssua'}`,
        subject: savedRecord.disciplinas || 'Língua Portuguesa & Matemática',
        presenceRate: 100,
        shift: shiftVal,
        phone: savedRecord.telefone,
        email: savedRecord.email,
        registrationData: savedRecord,
        schedule: [
          {
            day: 'Segunda',
            period: shiftVal === 'Tarde' ? '13h00 - 17h15' : '07h30 - 12h00',
            subject: savedRecord.disciplinas || 'Língua Portuguesa & Matemática',
            room: 'Sala 01',
          },
        ],
      };
      const existingDirIdx = dirTeachers.findIndex(
        (dt) =>
          dt.id === savedRecord.id ||
          dt.name.trim().toLowerCase() === savedRecord.nomeCompleto.trim().toLowerCase()
      );
      if (existingDirIdx >= 0) {
        dirTeachers[existingDirIdx] = {
          ...dirTeachers[existingDirIdx],
          ...dirEntry,
        };
      } else {
        dirTeachers.unshift(dirEntry);
      }
      localStorage.setItem('ucore_director_teachers_v1', JSON.stringify(dirTeachers));

      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    } catch (e) {
      console.error('Failed to persist teachers to localStorage', e);
    }
  }

  return updatedList;
}

export function deleteTeacher(id: string, teacherName?: string): TeacherRegistrationData[] {
  const normTargetName = (teacherName || '').trim().toLowerCase();
  const current = getStoredTeachers();
  const removed = current.find(
    (t) =>
      t.id === id ||
      (normTargetName && t.nomeCompleto.trim().toLowerCase() === normTargetName)
  );
  const targetName = normTargetName || (removed?.nomeCompleto || '').trim().toLowerCase();

  const updated = current.filter(
    (t) =>
      t.id !== id &&
      (!targetName || t.nomeCompleto.trim().toLowerCase() !== targetName)
  );
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(updated));

      // Remover de ucore_admin_teachers
      const rawAdmin = localStorage.getItem('ucore_admin_teachers');
      if (rawAdmin) {
        const adminList: AdminTeacher[] = JSON.parse(rawAdmin);
        const filteredAdmin = adminList.filter(
          (at) =>
            at.id !== id &&
            (!targetName || at.name.trim().toLowerCase() !== targetName)
        );
        localStorage.setItem('ucore_admin_teachers', JSON.stringify(filteredAdmin));
      }

      // Remover de ucore_director_teachers_v1
      const rawDir = localStorage.getItem('ucore_director_teachers_v1');
      if (rawDir) {
        const dirList: DirectorTeacher[] = JSON.parse(rawDir);
        const filteredDir = dirList.filter(
          (dt) =>
            dt.id !== id &&
            (!targetName || dt.name.trim().toLowerCase() !== targetName)
        );
        localStorage.setItem('ucore_director_teachers_v1', JSON.stringify(filteredDir));
      }

      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    } catch (e) {
      console.error('Failed to delete teacher from localStorage', e);
    }
  }
  return updated;
}

export function deleteAllTeachers(): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify([]));
      localStorage.setItem('ucore_admin_teachers', JSON.stringify([]));
      localStorage.setItem('ucore_director_teachers_v1', JSON.stringify([]));
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    } catch (e) {
      console.error('Failed to clear all teachers', e);
    }
  }
}

export interface SchoolTeacherQuotaStatus {
  schoolId: string;
  schoolName: string;
  declaredTotal: number;
  registeredCount: number;
  pendingCount: number;
  progressPercent: number;
  declaredComFormacao: number;
  declaredSemFormacao: number;
  registeredComFormacao: number;
  registeredSemFormacao: number;
  declaredNaoDocentes: number;
  registeredNaoDocentes: number;
  pendingNaoDocentes: number;
  registeredTeachers: TeacherRegistrationData[];
}

export function getSchoolTeacherQuotaStatus(
  school: AdminSchool,
  overrideAdminTeachers?: AdminTeacher[]
): SchoolTeacherQuotaStatus {
  const allDetailed = getStoredTeachers();
  const normSchoolName = (school.name || '').trim().toLowerCase();
  const normCodigoSige = (school.codigoSIGE || school.registrationData?.codigoSIGE || '').trim().toLowerCase();

  // Também verificar ucore_admin_teachers caso haja docentes registados apenas lá
  let adminList: AdminTeacher[] = Array.isArray(overrideAdminTeachers) ? overrideAdminTeachers : [];
  if (adminList.length === 0 && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('ucore_admin_teachers');
      if (raw) adminList = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  const unifiedMap = new Map<string, TeacherRegistrationData>();
  allDetailed.forEach((t) => {
    unifiedMap.set(t.id, t);
  });
  adminList.forEach((at) => {
    const alreadyByName = Array.from(unifiedMap.values()).some(
      (t) => t.nomeCompleto.trim().toLowerCase() === at.name.trim().toLowerCase()
    );
    if (!unifiedMap.has(at.id) && !alreadyByName) {
      if (at.registrationData) {
        unifiedMap.set(at.id, at.registrationData);
      } else {
        unifiedMap.set(
          at.id,
          getRegistrationDataFromDirectorTeacher(
            {
              id: at.id,
              name: at.name,
              schoolName: at.schoolName,
              gradeClass: at.gradeClass,
              room: at.room,
              turma: at.turma,
              subject: at.subject,
              phone: at.phone,
            },
            at.schoolName
          )
        );
      }
    }
  });

  const matchedTeachers = Array.from(unifiedMap.values()).filter((t) => {
    const matchId = Boolean(t.escolaId && t.escolaId === school.id);
    const tName = (t.nomeEscola || '').trim().toLowerCase();
    const matchName = Boolean(normSchoolName && tName === normSchoolName);
    const tCode = (t.codigoEscola || '').trim().toLowerCase();
    const matchCode = Boolean(normCodigoSige && tCode && tCode === normCodigoSige);
    return matchId || matchName || matchCode;
  });

  // Separar pessoal docente vs não-docente/auxiliar se necessário, ou contabilizar todos os docentes cadastrados para a escola
  const docentesCadastradosList = matchedTeachers.filter(
    (t) => t.funcaoCategoria !== 'Auxiliar de Acção Educativa'
  );
  const naoDocentesCadastradosList = matchedTeachers.filter(
    (t) => t.funcaoCategoria === 'Auxiliar de Acção Educativa'
  );

  // Caso o utilizador cadastre todos pelo formulário de professor esperando abater da meta de docentes:
  const effectiveRegisteredTeachers = matchedTeachers;

  const declaredTotal =
    school.registrationData?.pessoal?.totalDocentesProfessores ??
    school.teachersCount ??
    0;

  const registeredCount = effectiveRegisteredTeachers.length;
  // Se o diretor declarou 32 docentes, começa com 32 pendentes; cadastrou 1 -> 31 pendentes; cadastrou 2 -> 30 pendentes...
  const pendingCount = Math.max(0, declaredTotal - registeredCount);

  const declaredComFormacao =
    school.registrationData?.pessoal?.docentesComFormacaoPedagogica ??
    Math.round(declaredTotal * 0.85);
  const declaredSemFormacao =
    school.registrationData?.pessoal?.docentesSemFormacaoPedagogica ??
    Math.max(0, declaredTotal - declaredComFormacao);

  const registeredComFormacao = effectiveRegisteredTeachers.filter(
    (t) => t.temFormacaoPedagogica
  ).length;
  const registeredSemFormacao = Math.max(0, registeredCount - registeredComFormacao);

  const declaredNaoDocentes =
    (school.registrationData?.pessoal?.totalPessoalNaoDocente || 0) +
    (school.registrationData?.pessoal?.totalAuxiliaresAccaoEducativa || 0);
  const registeredNaoDocentes = naoDocentesCadastradosList.length;
  const pendingNaoDocentes = Math.max(0, declaredNaoDocentes - registeredNaoDocentes);

  const progressPercent =
    declaredTotal > 0
      ? Math.min(100, Math.round((registeredCount / declaredTotal) * 100))
      : registeredCount > 0
      ? 100
      : 0;

  return {
    schoolId: school.id,
    schoolName: school.name,
    declaredTotal,
    registeredCount,
    pendingCount,
    progressPercent,
    declaredComFormacao,
    declaredSemFormacao,
    registeredComFormacao,
    registeredSemFormacao,
    declaredNaoDocentes,
    registeredNaoDocentes,
    pendingNaoDocentes,
    registeredTeachers: effectiveRegisteredTeachers,
  };
}

// Analytical Cross-Tabulation Matrix
export interface AnalyticalMatrixResult {
  totalTeachers: number;
  byNaturezaAndClassificacao: {
    natureza: TeacherNaturezaEscola;
    comMagisterioImne: number;
    semMagisterioComFormacao: number;
    semMagisterioSemFormacao: number;
    total: number;
  }[];
  byFaixaEtariaAndNivelAcademico: {
    faixa: TeacherFaixaEtaria;
    ate6: number;
    setimaOitava: number;
    nonaDecima: number;
    decimaPrimeiraSegunda: number;
    bacharelato: number;
    licenciado: number;
    posLicenciado: number;
    outro: number;
    total: number;
  }[];
  byNivelEnsino: {
    nivelNome: string;
    count: number;
    percent: number;
  }[];
  byRegimeTrabalho: {
    regime: TeacherRegimeTrabalho;
    count: number;
    validados: number;
    naoValidados: number;
  }[];
}

export function generateAnalyticalMatrix(teachers: TeacherRegistrationData[]): AnalyticalMatrixResult {
  const total = teachers.length || 1;

  // 1. Natureza × Formação Pedagógica
  const naturezas: TeacherNaturezaEscola[] = ['Pública', 'Público-Privada', 'Privada'];
  const byNaturezaAndClassificacao = naturezas.map((nat) => {
    const filtered = teachers.filter((t) => t.naturezaEscola === nat);
    const comMagisterioImne = filtered.filter(
      (t) => t.classificacaoPedagogica === 'Com magistério e com IMNE completo'
    ).length;
    const semMagisterioComFormacao = filtered.filter(
      (t) => t.classificacaoPedagogica === 'Sem Magistério e com formação Pedagógica'
    ).length;
    const semMagisterioSemFormacao = filtered.filter(
      (t) => t.classificacaoPedagogica === 'Sem Magistério e sem Formação pedagógica'
    ).length;

    return {
      natureza: nat,
      comMagisterioImne,
      semMagisterioComFormacao,
      semMagisterioSemFormacao,
      total: filtered.length,
    };
  });

  // 2. Faixa Etária × Nível Académico
  const faixas: TeacherFaixaEtaria[] = [
    '18-19',
    '20-24',
    '25-29',
    '30-34',
    '35-39',
    'mais de 39 anos',
    'menor de 18',
  ];

  const byFaixaEtariaAndNivelAcademico = faixas.map((fx) => {
    const list = teachers.filter((t) => t.faixaEtaria === fx);
    return {
      faixa: fx,
      ate6: list.filter((t) => t.nivelAcademico === 'Até à 6.ª classe').length,
      setimaOitava: list.filter((t) => t.nivelAcademico === '7.ª a 8.ª classe').length,
      nonaDecima: list.filter((t) => t.nivelAcademico === '9.ª a 10.ª classe').length,
      decimaPrimeiraSegunda: list.filter((t) => t.nivelAcademico === '11.ª a 12.ª classe').length,
      bacharelato: list.filter((t) => t.nivelAcademico === 'Bacharelato').length,
      licenciado: list.filter((t) => t.nivelAcademico === 'Licenciado').length,
      posLicenciado: list.filter((t) => t.nivelAcademico === 'Pós-licenciado (mestrado / doutoramento)').length,
      outro: list.filter((t) => t.nivelAcademico === 'Outro').length,
      total: list.length,
    };
  });

  // 3. Nível de Ensino / Modalidade
  const levelCounts: Record<string, number> = {};
  teachers.forEach((t) => {
    t.niveisLecciona.forEach((nl) => {
      const key = nl.nome + (nl.detalhe ? ` (${nl.detalhe})` : '');
      levelCounts[key] = (levelCounts[key] || 0) + 1;
    });
  });

  const byNivelEnsino = Object.entries(levelCounts).map(([nivelNome, count]) => ({
    nivelNome,
    count,
    percent: Math.round((count / total) * 100),
  }));

  // 4. Regime de Trabalho & Validação
  const regimes: TeacherRegimeTrabalho[] = ['Efectivo', 'Contratado', 'Voluntário', 'Colaborador', 'Outro'];
  const byRegimeTrabalho = regimes.map((reg) => {
    const list = teachers.filter((t) => t.regimeTrabalho === reg);
    const validados = list.filter((t) => t.possuiValidacaoHabilitacoes).length;
    return {
      regime: reg,
      count: list.length,
      validados,
      naoValidados: list.length - validados,
    };
  });

  return {
    totalTeachers: teachers.length,
    byNaturezaAndClassificacao,
    byFaixaEtariaAndNivelAcademico,
    byNivelEnsino,
    byRegimeTrabalho,
  };
}

// CSV Export Generator
export function generateTeachersCSV(teachers: TeacherRegistrationData[]): string {
  const headers = [
    'ID',
    'Nome Completo',
    'BI/NIF',
    'Sexo',
    'Data Nascimento',
    'Faixa Etária',
    'Telefone',
    'E-mail',
    'Província Residência',
    'Município Residência',
    'Morada',
    'Natureza Escola',
    'Nome Escola',
    'Código Escola',
    'Tipo Instituição',
    'Níveis / Modalidades',
    'Função / Categoria',
    'Tem Formação Pedagógica',
    'Magistério Completo',
    'IMNE Completo',
    'Classificação Pedagógica',
    'Nível Académico',
    'Regime de Trabalho',
    'Anos de Serviço',
    'Disciplinas',
    'Habilitações Validadas',
    'Nº Turmas',
    'Nº Alunos Aproximado',
    'Turnos',
    'Data Cadastro',
  ];

  const rows = teachers.map((t) => [
    t.id,
    `"${t.nomeCompleto.replace(/"/g, '""')}"`,
    t.biNif,
    t.sexo,
    t.dataNascimento,
    t.faixaEtaria,
    t.telefone,
    t.email,
    t.provinciaResidencia,
    t.municipioResidencia,
    `"${t.morada.replace(/"/g, '""')}"`,
    t.naturezaEscola,
    `"${t.nomeEscola.replace(/"/g, '""')}"`,
    t.codigoEscola || '',
    t.tipoInstituicao,
    `"${t.niveisLecciona.map((n) => n.nome + (n.detalhe ? ` [${n.detalhe}]` : '')).join('; ')}"`,
    t.funcaoCategoria,
    t.temFormacaoPedagogica ? 'Sim' : 'Não',
    t.temMagisterioCompleto ? 'Sim' : 'Não',
    t.temImneCompleto ? 'Sim' : 'Não',
    `"${t.classificacaoPedagogica}"`,
    `"${t.nivelAcademico}"`,
    t.regimeTrabalho,
    t.anosServico,
    `"${t.disciplinas.replace(/"/g, '""')}"`,
    t.possuiValidacaoHabilitacoes ? 'Sim' : 'Não',
    t.numeroTurmas,
    t.numeroAlunosAproximado,
    `"${t.turnos.join(', ')}"`,
    t.criadoEm ? t.criadoEm.substring(0, 10) : '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Converte ou localiza os dados de registro ministerial (TeacherRegistrationData)
 * a partir de um objeto simplificado de professor da direção (DirectorTeacher).
 */
export function getRegistrationDataFromDirectorTeacher(
  dt: {
    id: string;
    name: string;
    schoolName?: string;
    gradeClass?: string;
    room?: string;
    turma?: string;
    directorName?: string;
    location?: string;
    subject?: string;
    shift?: 'Manhã' | 'Tarde' | 'Integral';
    phone?: string;
    email?: string;
    registrationData?: TeacherRegistrationData;
  },
  defaultSchoolName: string = '',
  defaultDirectorName: string = 'Diretor de Escola'
): TeacherRegistrationData {
  if (dt.registrationData) {
    return dt.registrationData;
  }

  const stored = getStoredTeachers();
  const found = stored.find(
    (t) => t.id === dt.id || t.nomeCompleto.toLowerCase() === dt.name.toLowerCase()
  );
  if (found) {
    return found;
  }

  const shiftToTurno = dt.shift === 'Integral' ? 'Manhã' : (dt.shift || 'Manhã');

  return {
    id: dt.id,
    nomeCompleto: dt.name,
    biNif: '004928172ME041',
    sexo: 'Masculino',
    dataNascimento: '1988-05-14',
    faixaEtaria: '35-39',
    telefone: dt.phone || '+244 923 000 000',
    email: dt.email || `${dt.name.toLowerCase().replace(/\s+/g, '.')}@ucore.edu.ao`,
    morada: 'Bairro Central',
    provinciaResidencia: 'Malanje',
    municipioResidencia: 'Quêssua',
    naturezaEscola: 'Pública',
    nomeEscola: dt.schoolName || defaultSchoolName,
    codigoEscola: 'EMC-042',
    provinciaEscola: 'Malanje',
    municipioEscola: 'Quêssua',
    tipoInstituicao: 'Escola com classe de Iniciação',
    niveisLecciona: [
      { id: 'primario', nome: dt.gradeClass || 'Ensino Primário (1.ª a 6.ª classe)' },
    ],
    funcaoCategoria: 'Docente / Professor',
    temFormacaoPedagogica: true,
    temMagisterioCompleto: true,
    temImneCompleto: false,
    temOutraFormacaoPedagogica: false,
    classificacaoPedagogica: 'Com magistério e com IMNE completo',
    nivelAcademico: 'Licenciado',
    regimeTrabalho: 'Efectivo',
    anosServico: 8,
    disciplinas: dt.subject || 'Língua Portuguesa',
    possuiValidacaoHabilitacoes: true,
    observacoes: `Alocado(a) à ${dt.room || 'Sala 01'}, ${dt.turma || 'Turma A'}, Turno ${dt.shift || 'Manhã'}. Direção de ${dt.directorName || defaultDirectorName}.`,
    numeroTurmas: 1,
    numeroAlunosAproximado: 45,
    turnos: [shiftToTurno as 'Manhã' | 'Tarde' | 'Noite'],
    historicoAlteracoes: [
      {
        id: `log-init-${dt.id}`,
        data: new Date().toISOString().replace('T', ' ').substring(0, 16),
        autor: dt.directorName || defaultDirectorName,
        acao: 'Criação',
        detalhes: 'Dossiê inicial importado do quadro docente da escola.',
      },
    ],
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };
}

