import type {
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
  tipoDetalhe?: 'etapa' | 'modulo' | 'ano_eja' | 'texto';
  opcoesDetalhe?: string[];
}[] = [
  { id: 'pre_escola', nome: 'Pré-escola / Classe de Iniciação' },
  { id: 'primario', nome: 'Ensino Primário (1.ª a 6.ª classe)' },
  { id: 'praeer', nome: 'PRAEER', tipoDetalhe: 'etapa', opcoesDetalhe: ['Etapa 1', 'Etapa 2', 'Etapa 3'] },
  { id: 'primario_adultos', nome: 'Ensino Primário de Adultos' },
  { id: 'alfabetizacao', nome: 'Alfabetização', tipoDetalhe: 'modulo', opcoesDetalhe: ['Módulo 1', 'Módulo 2', 'Módulo 3'] },
  { id: 'eja', nome: 'EJA', tipoDetalhe: 'ano_eja', opcoesDetalhe: ['1.º ano', '2.º ano', 'Total'] },
  { id: 'i_ciclo_geral', nome: 'I Ciclo do Ensino Secundário Geral' },
  { id: 'i_ciclo_tecnico', nome: 'I Ciclo do Ensino Secundário Técnico-Profissional' },
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
export const initialTeachersList: TeacherRegistrationData[] = [
  {
    id: 'prof-01-santar',
    nomeCompleto: 'Santar Goes',
    biNif: '004928172ME041',
    sexo: 'Masculino',
    dataNascimento: '1988-05-14',
    faixaEtaria: '35-39',
    telefone: '+244 931 224 550',
    email: 'santar.goes@ucore.edu.ao',
    morada: 'Bairro Comercial, Casa 14',
    provinciaResidencia: 'Malanje',
    municipioResidencia: 'Quêssua',
    naturezaEscola: 'Pública',
    nomeEscola: 'Escola Modelo Central de Quêssua',
    codigoEscola: 'EMC-042',
    provinciaEscola: 'Malanje',
    municipioEscola: 'Quêssua',
    tipoInstituicao: 'Escola com classe de Iniciação',
    niveisLecciona: [
      { id: 'primario', nome: 'Ensino Primário (1.ª a 6.ª classe)' },
      { id: 'praeer', nome: 'PRAEER', detalhe: 'Etapa 2' },
    ],
    funcaoCategoria: 'Docente / Professor',
    temFormacaoPedagogica: true,
    temMagisterioCompleto: true,
    temImneCompleto: true,
    temOutraFormacaoPedagogica: true,
    outraFormacaoPedagogicaDesc: 'Capacitação em Metodologias Inclusivas (CFL Quêssua)',
    classificacaoPedagogica: 'Com magistério e com IMNE completo',
    nivelAcademico: 'Licenciado',
    regimeTrabalho: 'Efectivo',
    anosServico: 12,
    disciplinas: 'Língua Portuguesa & Matemática',
    possuiValidacaoHabilitacoes: true,
    documentoValidacaoNome: 'Diploma_Magisterio_Homologado_00492.pdf',
    documentoValidacaoUrl: '#',
    observacoes: 'Professor titular da 4ª classe. Coordenador da comissão de avaliação letiva.',
    documentosAnexos: [
      {
        id: 'doc-1',
        nome: 'Certificado_Licenciatura_Educacao.pdf',
        tamanho: '1.4 MB',
        tipo: 'PDF',
        data: '2026-02-10',
      },
      {
        id: 'doc-2',
        nome: 'BI_Copia_Autenticada.pdf',
        tamanho: '850 KB',
        tipo: 'PDF',
        data: '2026-01-15',
      },
    ],
    numeroTurmas: 2,
    numeroAlunosAproximado: 84,
    turnos: ['Manhã', 'Tarde'],
    necessidadesFormacaoContinua: 'Didática digital e gestão de turmas superlotadas.',
    disponibilidadeOutrosNiveis: 'Disponível para apoio ao I Ciclo ou programas PRAEER aos sábados.',
    historicoAlteracoes: [
      {
        id: 'log-1',
        data: '2026-02-01 09:30',
        autor: 'Admin. Geral',
        acao: 'Criação',
        detalhes: 'Cadastro inicial validado conforme diretrizes do MED.',
      },
      {
        id: 'log-2',
        data: '2026-03-05 14:15',
        autor: 'Diretor Fert Horlan',
        acao: 'Validação',
        detalhes: 'Conferência física de diplomas e averbação no livro municipal.',
      },
    ],
    criadoEm: '2026-02-01T09:30:00Z',
    atualizadoEm: '2026-03-05T14:15:00Z',
  },
  {
    id: 'prof-02-helena',
    nomeCompleto: 'Maria Helena Santos',
    biNif: '007812934ME039',
    sexo: 'Feminino',
    dataNascimento: '1995-11-20',
    faixaEtaria: '30-34',
    telefone: '+244 923 881 202',
    email: 'helena.santos@ucore.edu.ao',
    morada: 'Rua Principal da Missão de Quêssua',
    provinciaResidencia: 'Malanje',
    municipioResidencia: 'Quêssua',
    naturezaEscola: 'Pública',
    nomeEscola: 'Escola Primária Nº 1024 - Quêssua',
    codigoEscola: 'EP-1024',
    provinciaEscola: 'Malanje',
    municipioEscola: 'Quêssua',
    tipoInstituicao: 'Escola com classe de Iniciação',
    niveisLecciona: [
      { id: 'primario', nome: 'Ensino Primário (1.ª a 6.ª classe)' },
    ],
    funcaoCategoria: 'Docente / Professor',
    temFormacaoPedagogica: true,
    temMagisterioCompleto: true,
    temImneCompleto: false,
    temOutraFormacaoPedagogica: false,
    classificacaoPedagogica: 'Com magistério e com IMNE completo',
    nivelAcademico: 'Licenciado',
    regimeTrabalho: 'Efectivo',
    anosServico: 6,
    disciplinas: 'Matemática & Ciências Naturais',
    possuiValidacaoHabilitacoes: true,
    documentoValidacaoNome: 'Certificado_Magisterio_Helena.pdf',
    observacoes: 'Docente destacada em projetos de feiras de ciências escolares.',
    documentosAnexos: [
      {
        id: 'doc-3',
        nome: 'Diploma_Licenciatura_Matematica.pdf',
        tamanho: '2.1 MB',
        tipo: 'PDF',
        data: '2026-01-20',
      },
    ],
    numeroTurmas: 1,
    numeroAlunosAproximado: 45,
    turnos: ['Manhã'],
    necessidadesFormacaoContinua: 'Metodologias práticas de ensino de frações e geometria.',
    disponibilidadeOutrosNiveis: 'Interesse em lecionar no I Ciclo do Ensino Secundário.',
    historicoAlteracoes: [
      {
        id: 'log-3',
        data: '2026-02-10 11:00',
        autor: 'Admin. Geral',
        acao: 'Criação',
        detalhes: 'Cadastro criado via portal de homologação de docentes.',
      },
    ],
    criadoEm: '2026-02-10T11:00:00Z',
    atualizadoEm: '2026-02-10T11:00:00Z',
  },
  {
    id: 'prof-03-joao',
    nomeCompleto: 'João Carlos Silva',
    biNif: '002391024ME028',
    sexo: 'Masculino',
    dataNascimento: '1979-08-04',
    faixaEtaria: 'mais de 39 anos',
    telefone: '+244 925 443 991',
    email: 'joao.silva@ucore.edu.ao',
    morada: 'Sector 3, Vila de Quêssua',
    provinciaResidencia: 'Malanje',
    municipioResidencia: 'Quêssua',
    naturezaEscola: 'Público-Privada',
    nomeEscola: 'Colégio Esperança do Saber',
    codigoEscola: 'CES-019',
    provinciaEscola: 'Malanje',
    municipioEscola: 'Quêssua',
    tipoInstituicao: 'Centro infantil',
    niveisLecciona: [
      { id: 'pre_escola', nome: 'Pré-escola / Classe de Iniciação' },
      { id: 'alfabetizacao', nome: 'Alfabetização', detalhe: 'Módulo 1' },
    ],
    funcaoCategoria: 'Alfabetizador(a)',
    temFormacaoPedagogica: true,
    temMagisterioCompleto: false,
    temImneCompleto: false,
    temOutraFormacaoPedagogica: true,
    outraFormacaoPedagogicaDesc: 'Capacitação Nacional em Alfabetização de Adultos (Sim Eu Posso)',
    classificacaoPedagogica: 'Sem Magistério e com formação Pedagógica',
    nivelAcademico: '11.ª a 12.ª classe',
    regimeTrabalho: 'Contratado',
    anosServico: 18,
    disciplinas: 'Alfabetização & Iniciação',
    possuiValidacaoHabilitacoes: true,
    documentoValidacaoNome: 'Validacao_Alfabetizador_MEC.pdf',
    observacoes: 'Grande experiência com turmas comunitárias no interior de Quêssua.',
    documentosAnexos: [],
    numeroTurmas: 2,
    numeroAlunosAproximado: 60,
    turnos: ['Tarde', 'Noite'],
    necessidadesFormacaoContinua: 'Materiais didáticos adaptados para adultos não alfabetizados.',
    disponibilidadeOutrosNiveis: 'Disponível para módulos 2 e 3 de alfabetização.',
    historicoAlteracoes: [
      {
        id: 'log-4',
        data: '2026-02-15 16:20',
        autor: 'Diretor Fert Horlan',
        acao: 'Criação',
        detalhes: 'Cadastro presencial de professor do programa de alfabetização.',
      },
    ],
    criadoEm: '2026-02-15T16:20:00Z',
    atualizadoEm: '2026-02-15T16:20:00Z',
  },
  {
    id: 'prof-04-esperanca',
    nomeCompleto: 'Esperança Beatriz Neto',
    biNif: '009182374ME052',
    sexo: 'Feminino',
    dataNascimento: '2001-04-18',
    faixaEtaria: '25-29',
    telefone: '+244 944 551 223',
    email: 'esperanca.neto@ucore.edu.ao',
    morada: 'Bairro dos Professores, Quêssua',
    provinciaResidencia: 'Malanje',
    municipioResidencia: 'Quêssua',
    naturezaEscola: 'Privada',
    nomeEscola: 'Complexo Escolar Sagrada Família',
    codigoEscola: 'CESF-008',
    provinciaEscola: 'Malanje',
    municipioEscola: 'Quêssua',
    tipoInstituicao: 'Jardim de infância',
    niveisLecciona: [
      { id: 'pre_escola', nome: 'Pré-escola / Classe de Iniciação' },
    ],
    funcaoCategoria: 'Educador(a) de Infância',
    temFormacaoPedagogica: false,
    temMagisterioCompleto: false,
    temImneCompleto: false,
    temOutraFormacaoPedagogica: false,
    classificacaoPedagogica: 'Sem Magistério e sem Formação pedagógica',
    nivelAcademico: '11.ª a 12.ª classe',
    regimeTrabalho: 'Contratado',
    anosServico: 2,
    disciplinas: 'Educação Infantil & Psicomotricidade',
    possuiValidacaoHabilitacoes: false,
    observacoes: 'Necessita inscrição urgente no plano municipal de formação pedagógica contínua.',
    documentosAnexos: [],
    numeroTurmas: 1,
    numeroAlunosAproximado: 28,
    turnos: ['Manhã'],
    necessidadesFormacaoContinua: 'Curso de agregação pedagógica e desenvolvimento infantil.',
    disponibilidadeOutrosNiveis: 'Interesse prioritário em concluir formação pedagógica.',
    historicoAlteracoes: [
      {
        id: 'log-5',
        data: '2026-03-01 10:00',
        autor: 'Admin. Geral',
        acao: 'Criação',
        detalhes: 'Cadastro inserido com sinalização para plano de formação contínua.',
      },
    ],
    criadoEm: '2026-03-01T10:00:00Z',
    atualizadoEm: '2026-03-01T10:00:00Z',
  },
];

// LocalStorage Management
export function getStoredTeachers(): TeacherRegistrationData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEACHERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(initialTeachersList));
      return initialTeachersList;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
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
      detalhes: 'Dados cadastrais e habilitações atualizados no sistema uCore.',
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

  try {
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(updatedList));
  } catch (e) {
    console.error('Failed to persist teachers to localStorage', e);
  }

  return updatedList;
}

export function deleteTeacher(id: string): TeacherRegistrationData[] {
  const current = getStoredTeachers();
  const updated = current.filter((t) => t.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete teacher from localStorage', e);
  }
  return updated;
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
  defaultSchoolName: string = 'Escola Modelo Central',
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

