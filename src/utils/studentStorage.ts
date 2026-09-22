import type {
  StudentRegistrationData,
  StudentModalidadeKey,
  StudentNaturezaEscola,
  StudentTipoDeficiencia,
  StudentDocumentType,
} from '../types';

export interface StudentModalityConfig {
  key: StudentModalidadeKey;
  code: string;
  label: string;
  categoryName: string;
  description: string;
  isSpecialEducation: boolean;
  fixedNatureza?: StudentNaturezaEscola;
  etapasOuClasses: string[];
  agePresets: string[];
  supportsDisabilities: boolean;
}

export const STUDENT_MODALITIES_CATALOG: StudentModalityConfig[] = [
  {
    key: 'pre_escolar',
    code: 'A',
    label: 'A. Educação Pré-Escolar',
    categoryName: 'Educação Pré-Escolar',
    description: 'Escolas específicas de pré-escolar (Creche, Jardim, Centro Infantil)',
    isSpecialEducation: false,
    etapasOuClasses: [
      'Creche',
      'Jardim de Infância 1',
      'Jardim de Infância 2',
      'Centro Infantil',
      'Centro Infantil Comunitário',
      'Total (Consolidado)'
    ],
    agePresets: [
      '3 meses a 3 anos',
      '3 anos',
      '4 anos',
      '5 anos',
      '6 anos',
      'Mais de 6 anos'
    ],
    supportsDisabilities: false,
  },
  {
    key: 'iniciacao',
    code: 'B',
    label: 'B. Classe de Iniciação',
    categoryName: 'Classe de Iniciação',
    description: 'Em Complexos Escolares ou Escolas Primárias',
    isSpecialEducation: false,
    etapasOuClasses: ['Classe de Iniciação'],
    agePresets: [
      '5 anos',
      '6 anos',
      '7 anos',
      '8 anos',
      '9 anos',
      '10 anos',
      '11 anos',
      '12 anos',
      '13 anos',
      'Mais de 13 anos'
    ],
    supportsDisabilities: false,
  },
  {
    key: 'especial_pre_escolar',
    code: 'C',
    label: 'C. Ensino Especial – Pré-escolar / Iniciação',
    categoryName: 'Ensino Especial Pré-Escolar',
    description: 'Escolas específicas de Ensino Especial (Natureza Pública fixa)',
    isSpecialEducation: true,
    fixedNatureza: 'Pública',
    etapasOuClasses: ['Sensorial', 'Iniciação Especial'],
    agePresets: [
      '3 meses a 3 anos',
      '3 anos',
      '4 anos',
      '5 anos',
      '6 anos',
      'Mais de 6 anos'
    ],
    supportsDisabilities: true,
  },
  {
    key: 'primario_regular',
    code: 'D',
    label: 'D. Ensino Primário Regular',
    categoryName: 'Ensino Primário Regular',
    description: 'Ensino Primário Regular do 1.º ao 6.º ano',
    isSpecialEducation: false,
    etapasOuClasses: [
      '1.ª Classe',
      '2.ª Classe',
      '3.ª Classe',
      '4.ª Classe',
      '5.ª Classe',
      '6.ª Classe'
    ],
    agePresets: [
      '5 anos',
      '6 anos',
      '7 anos',
      '8 anos',
      '9 anos',
      '10 anos',
      '11 anos',
      '12 anos',
      '13 anos',
      'Mais de 13 anos'
    ],
    supportsDisabilities: false,
  },
  {
    key: 'primario_especial',
    code: 'E',
    label: 'E. Ensino Primário Especial',
    categoryName: 'Ensino Primário Especial',
    description: 'Escolas específicas de Ensino Especial Primário (Natureza Pública fixa)',
    isSpecialEducation: true,
    fixedNatureza: 'Pública',
    etapasOuClasses: [
      '1.ª Classe',
      '2.ª Classe',
      '3.ª Classe',
      '4.ª Classe',
      '5.ª Classe',
      '6.ª Classe'
    ],
    agePresets: [
      '5 a 7 anos',
      '8 a 10 anos',
      '11 a 13 anos',
      'Mais de 13 anos'
    ],
    supportsDisabilities: true,
  },
  {
    key: 'praeer',
    code: 'F',
    label: 'F. PRAEER',
    categoryName: 'PRAEER',
    description: 'Programa de Aceleração Escolar e Recuperação de Atraso',
    isSpecialEducation: false,
    etapasOuClasses: ['Etapa 1', 'Etapa 2', 'Etapa 3'],
    agePresets: [
      '7 anos',
      '8 anos',
      '9 anos',
      '10 anos',
      '11 anos',
      '12 anos',
      '13 anos',
      '14 anos',
      'Mais de 14 anos'
    ],
    supportsDisabilities: false,
  },
  {
    key: 'primario_adultos',
    code: 'G',
    label: 'G. Ensino Primário de Adultos',
    categoryName: 'Primário de Adultos / Alfabetização',
    description: 'Alfabetização e Educação de Adultos (Módulos 1, 2 e 3)',
    isSpecialEducation: false,
    etapasOuClasses: ['Módulo 1', 'Módulo 2', 'Módulo 3'],
    agePresets: [
      'Menos de 16 anos',
      '16 anos',
      '17 anos',
      '18 anos',
      '19 anos',
      '20 anos',
      '21 anos',
      '22 anos',
      '23 anos',
      'Mais de 23 anos'
    ],
    supportsDisabilities: false,
  },
  {
    key: 'ciclo1_geral',
    code: 'H',
    label: 'H. Iº Ciclo do Ensino Secundário Geral',
    categoryName: 'Iº Ciclo Secundário Geral',
    description: 'Ensino Secundário Geral (7.ª, 8.ª e 9.ª classes)',
    isSpecialEducation: false,
    etapasOuClasses: ['7.ª Classe', '8.ª Classe', '9.ª Classe'],
    agePresets: [
      '12 anos',
      '13 anos',
      '14 anos',
      '15 anos',
      '16 anos',
      '17 anos',
      '18 anos',
      'Mais de 18 anos'
    ],
    supportsDisabilities: false,
  },
  {
    key: 'ciclo1_especial',
    code: 'I',
    label: 'I. Iº Ciclo Ensino Especial',
    categoryName: 'Iº Ciclo Especial',
    description: 'Escolas específicas de Ensino Especial Iº Ciclo (Natureza Pública fixa)',
    isSpecialEducation: true,
    fixedNatureza: 'Pública',
    etapasOuClasses: ['7.ª Classe', '8.ª Classe', '9.ª Classe'],
    agePresets: [
      '12 a 15 anos',
      '16 a 18 anos',
      'Mais de 18 anos'
    ],
    supportsDisabilities: true,
  },
  {
    key: 'ciclo1_tecnico',
    code: 'J',
    label: 'J. Iº Ciclo Técnico-Profissional / Formação Profissional Básica Regular',
    categoryName: 'Iº Ciclo Técnico-Profissional',
    description: 'Formação Profissional Básica Regular',
    isSpecialEducation: false,
    etapasOuClasses: ['7.ª Classe', '8.ª Classe', '9.ª Classe'],
    agePresets: [
      '12 a 18 anos',
      'Mais de 18 anos'
    ],
    supportsDisabilities: false,
  },
  {
    key: 'ciclo1_adultos_eja',
    code: 'K',
    label: 'K. Iº Ciclo do Ensino Secundário de Adultos (EJA)',
    categoryName: 'Iº Ciclo EJA Adultos',
    description: 'Educação de Jovens e Adultos (1.º e 2.º anos)',
    isSpecialEducation: false,
    etapasOuClasses: ['1.º Ano', '2.º Ano'],
    agePresets: [
      'Menos de 16 anos',
      '16 a 23 anos',
      'Mais de 23 anos'
    ],
    supportsDisabilities: false,
  },
  {
    key: 'ciclo2_geral',
    code: 'L',
    label: 'L. IIº Ciclo do Ensino Secundário Geral',
    categoryName: 'IIº Ciclo Secundário Geral',
    description: 'Liceu Geral / Puniv (10.ª, 11.ª e 12.ª classes)',
    isSpecialEducation: false,
    etapasOuClasses: ['10.ª Classe', '11.ª Classe', '12.ª Classe'],
    agePresets: [
      'Menos de 15 anos',
      '15 anos',
      '16 anos',
      '17 anos',
      '18 anos',
      '19 anos',
      '20 anos',
      'Mais de 20 anos'
    ],
    supportsDisabilities: false,
  },
  {
    key: 'ciclo2_especial',
    code: 'M',
    label: 'M. IIº Ciclo Ensino Especial',
    categoryName: 'IIº Ciclo Especial',
    description: 'Escolas específicas de Ensino Especial IIº Ciclo (Natureza Pública fixa)',
    isSpecialEducation: true,
    fixedNatureza: 'Pública',
    etapasOuClasses: ['10.ª Classe', '11.ª Classe', '12.ª Classe', '13.ª Classe'],
    agePresets: [
      '15 a 18 anos',
      '19 a 20 anos',
      'Mais de 20 anos'
    ],
    supportsDisabilities: true,
  },
  {
    key: 'ciclo2_tecnico',
    code: 'N',
    label: 'N. IIº Ciclo Técnico-Profissional',
    categoryName: 'IIº Ciclo Técnico-Profissional',
    description: 'Institutos Politécnicos e Técnicos Médios (10.ª a 13.ª classes)',
    isSpecialEducation: false,
    etapasOuClasses: ['10.ª Classe', '11.ª Classe', '12.ª Classe', '13.ª Classe'],
    agePresets: [
      'Menos de 15 anos',
      '15 a 17 anos',
      '18 a 20 anos',
      'Mais de 20 anos'
    ],
    supportsDisabilities: false,
  },
  {
    key: 'ciclo2_formacao_professores',
    code: 'O',
    label: 'O. IIº Ciclo Formação de Professores',
    categoryName: 'IIº Ciclo Formação de Professores',
    description: 'Escolas de Magistério e Formação Docente (10.ª a 13.ª classes)',
    isSpecialEducation: false,
    etapasOuClasses: ['10.ª Classe', '11.ª Classe', '12.ª Classe', '13.ª Classe'],
    agePresets: [
      'Menos de 15 anos',
      '15 anos',
      '16 anos',
      '17 anos',
      '18 anos',
      '19 anos',
      '20 anos',
      'Mais de 20 anos'
    ],
    supportsDisabilities: false,
  },
];

export const DISABILITY_TYPES_OPTIONS: StudentTipoDeficiencia[] = [
  'Auditiva',
  'Intelectual',
  'Visual',
  'Surdo-cegueira',
  'Múltiplas',
  'Físico-autista',
  'Altas habilidades',
];

/**
 * Calculates student age and matches the corresponding faixa etária
 * according to the selected modality.
 */
export function calculateStudentAgeAndFaixa(
  birthDateStr: string,
  modalityKey: StudentModalidadeKey = 'primario_regular'
): { age: number; ageLabel: string; isBaby: boolean; suggestedFaixa: string } {
  if (!birthDateStr) {
    return { age: 0, ageLabel: 'Não informada', isBaby: false, suggestedFaixa: 'N/A' };
  }

  const birthDate = new Date(birthDateStr);
  const today = new Date();
  if (isNaN(birthDate.getTime())) {
    return { age: 0, ageLabel: 'Data inválida', isBaby: false, suggestedFaixa: 'N/A' };
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Calculate months if under 3 years old
  const totalMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
  const isBaby = totalMonths < 36 && age < 3;

  let ageLabel = `${age} anos`;
  if (isBaby) {
    ageLabel = `${Math.max(1, totalMonths)} meses`;
  }

  // Suggest faixa according to modality catalog
  const config = STUDENT_MODALITIES_CATALOG.find((c) => c.key === modalityKey);
  let suggestedFaixa = `${age} anos`;

  if (config) {
    if (modalityKey === 'pre_escolar' || modalityKey === 'especial_pre_escolar') {
      if (isBaby || totalMonths <= 36) suggestedFaixa = '3 meses a 3 anos';
      else if (age === 3) suggestedFaixa = '3 anos';
      else if (age === 4) suggestedFaixa = '4 anos';
      else if (age === 5) suggestedFaixa = '5 anos';
      else if (age === 6) suggestedFaixa = '6 anos';
      else suggestedFaixa = 'Mais de 6 anos';
    } else if (modalityKey === 'iniciacao' || modalityKey === 'primario_regular') {
      if (age < 5) suggestedFaixa = '5 anos';
      else if (age > 13) suggestedFaixa = 'Mais de 13 anos';
      else suggestedFaixa = `${age} anos`;
    } else if (modalityKey === 'praeer') {
      if (age < 7) suggestedFaixa = '7 anos';
      else if (age > 14) suggestedFaixa = 'Mais de 14 anos';
      else suggestedFaixa = `${age} anos`;
    } else if (modalityKey === 'primario_adultos' || modalityKey === 'ciclo1_adultos_eja') {
      if (age < 16) suggestedFaixa = 'Menos de 16 anos';
      else if (age > 23) suggestedFaixa = 'Mais de 23 anos';
      else suggestedFaixa = `${age} anos`;
    } else if (modalityKey === 'ciclo1_geral' || modalityKey === 'ciclo1_tecnico') {
      if (age < 12) suggestedFaixa = '12 anos';
      else if (age > 18) suggestedFaixa = 'Mais de 18 anos';
      else suggestedFaixa = `${age} anos`;
    } else if (
      modalityKey === 'ciclo2_geral' ||
      modalityKey === 'ciclo2_tecnico' ||
      modalityKey === 'ciclo2_formacao_professores'
    ) {
      if (age < 15) suggestedFaixa = 'Menos de 15 anos';
      else if (age > 20) suggestedFaixa = 'Mais de 20 anos';
      else suggestedFaixa = `${age} anos`;
    }
  }

  return {
    age: Math.max(0, age),
    ageLabel,
    isBaby,
    suggestedFaixa,
  };
}

const STORAGE_KEY = 'ucore_registered_students_v2';

/**
 * Initial dataset of students - Initialized empty for live municipal student registration
 */
export const initialDetailedStudents: StudentRegistrationData[] = [];

export function getStoredStudents(): StudentRegistrationData[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Error reading students from localStorage:', err);
    return [];
  }
}

export function saveStudent(studentData: StudentRegistrationData): StudentRegistrationData {
  const currentList = getStoredStudents();
  let updatedList: StudentRegistrationData[];

  const ensuredData: StudentRegistrationData = {
    ...studentData,
    id: studentData.id || `std-${Date.now()}`,
    dataCadastro: studentData.dataCadastro || new Date().toISOString().substring(0, 10),
    codigoMatricula:
      studentData.codigoMatricula ||
      `MAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
  };

  const existingIndex = currentList.findIndex((s) => s.id === ensuredData.id);
  if (existingIndex >= 0) {
    updatedList = [...currentList];
    updatedList[existingIndex] = ensuredData;
  } else {
    updatedList = [ensuredData, ...currentList];
  }

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (err) {
      console.error('Error saving student in localStorage:', err);
    }
  }

  return ensuredData;
}

export function deleteStudent(id: string): boolean {
  const currentList = getStoredStudents();
  const filtered = currentList.filter((s) => s.id !== id);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (err) {
      console.error('Error deleting student:', err);
      return false;
    }
  }
  return true;
}

/**
 * Generates Cross-Tabulations for the Student Analytical Matrix
 */
export function generateStudentAnalyticalMatrix(students: StudentRegistrationData[]) {
  // 1. By Natureza × Modalidade
  const modalidadesList = STUDENT_MODALITIES_CATALOG;
  const byNaturezaAndModalidade = modalidadesList.map((mod) => {
    const matching = students.filter((s) => s.tipoEscolaModalidade === mod.key);
    return {
      modalidadeKey: mod.key,
      modalidadeCode: mod.code,
      modalidadeLabel: mod.label,
      publica: matching.filter((s) => s.naturezaEscola === 'Pública').length,
      publicoPrivada: matching.filter((s) => s.naturezaEscola === 'Público-Privada').length,
      privada: matching.filter((s) => s.naturezaEscola === 'Privada').length,
      total: matching.length,
    };
  });

  // 2. By Gender & Documentation Status
  const byDocumentType = {
    bi: students.filter((s) => s.tipoDocumento === 'BI').length,
    cedula: students.filter((s) => s.tipoDocumento === 'Cedula pessoal').length,
    passaporte: students.filter((s) => s.tipoDocumento === 'Passaporte').length,
    semDocumento: students.filter((s) => s.tipoDocumento === 'sem Documento').length,
    total: students.length,
  };

  const byGender = {
    feminino: students.filter((s) => s.genero === 'F').length,
    masculino: students.filter((s) => s.genero === 'M').length,
    outro: students.filter((s) => s.genero === 'Outro').length,
    total: students.length,
  };

  // 3. Special Needs / Disabilities distribution
  const specialNeedsCounts: Record<string, number> = {};
  DISABILITY_TYPES_OPTIONS.forEach((d) => {
    specialNeedsCounts[d] = students.filter(
      (s) => s.tiposDeficiencia?.includes(d) || s.deficienciasInclusivas?.includes(d)
    ).length;
  });

  const totalSpecialNeedsStudents = students.filter(
    (s) => s.isEnsinoEspecial || s.temNecessidadesEspeciais || (s.tiposDeficiencia && s.tiposDeficiencia.length > 0)
  ).length;

  // 4. Age groups overall
  const ageDistribution = {
    ate5: students.filter((s) => s.idade <= 5).length,
    faixa6a9: students.filter((s) => s.idade >= 6 && s.idade <= 9).length,
    faixa10a13: students.filter((s) => s.idade >= 10 && s.idade <= 13).length,
    faixa14a17: students.filter((s) => s.idade >= 14 && s.idade <= 17).length,
    mais18: students.filter((s) => s.idade >= 18).length,
  };

  return {
    totalStudents: students.length,
    byNaturezaAndModalidade,
    byDocumentType,
    byGender,
    specialNeedsCounts,
    totalSpecialNeedsStudents,
    ageDistribution,
  };
}

/**
 * Generates CSV Export for official student census / school management
 */
export function generateStudentsCSV(students: StudentRegistrationData[]): string {
  const headers = [
    'Código Matrícula',
    'Nome Completo',
    'Sexo',
    'Data de Nascimento',
    'Idade',
    'Faixa Etária Oficial',
    'Tipo Documento',
    'N.º Documento',
    'Natureza Escola',
    'Tipo Escola / Modalidade',
    'Classe / Etapa / Módulo',
    'Ensino Especial',
    'Deficiências',
    'Escola',
    'Turma',
    'Turno',
    'Encarregado',
    'Contacto Telefónico',
    'Morada',
    'Município',
    'Repetente',
    'Transferido',
  ];

  const rows = students.map((s) => [
    `"${s.codigoMatricula || ''}"`,
    `"${s.nomeCompleto || s.name || ''}"`,
    `"${s.genero || ''}"`,
    `"${s.dataNascimento || ''}"`,
    `"${s.idade ?? ''}"`,
    `"${s.faixaEtariaCalculada || s.idadeEspecificaNivel || ''}"`,
    `"${s.tipoDocumento || ''}"`,
    `"${s.numeroDocumento || 'Sem documento'}"`,
    `"${s.naturezaEscola || 'Pública'}"`,
    `"${s.tipoEscolaNome || s.tipoEscolaModalidade || ''}"`,
    `"${s.classeEtapaModulo || s.classe || ''}"`,
    `"${s.isEnsinoEspecial ? 'Sim' : 'Não'}"`,
    `"${(s.tiposDeficiencia || []).join(', ') || 'Nenhuma'}"`,
    `"${s.escola || ''}"`,
    `"${s.turma || ''}"`,
    `"${s.turno || s.periodo || ''}"`,
    `"${s.encarregado || ''}"`,
    `"${s.telefone || ''}"`,
    `"${s.endereco || ''}"`,
    `"${s.municipio || 'Quêssua'}"`,
    `"${s.alunoRepetente || s.condicaoMatricula === 'repetente' ? 'Sim' : 'Não'}"`,
    `"${s.transferido ? 'Sim' : 'Não'}"`,
  ]);

  return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
}
