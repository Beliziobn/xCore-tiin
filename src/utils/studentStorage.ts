import type {
  StudentRegistrationData,
  StudentModalidadeKey,
  StudentNaturezaEscola,
  StudentTipoDeficiencia,
  StudentDocumentType,
  AdminSchool,
  AdminStudent,
  SchoolRegistrationData,
  DirectorStudent,
} from '../types';
import { convertRegistrationDataToAdminSchool } from './schoolStorage';
import {
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  clearAllStudentsFromFirestore,
  saveSchoolToFirestore,
} from './firestoreSync';

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
 * Calculates the normative Classe / Etapa / Módulo that a student should attend
 * in the current school year based on their age (or faixa etária) and the chosen teaching modality.
 */
export function calculateSuggestedClassForAgeAndModality(
  ageOrFaixa: number | string,
  modalityKey: StudentModalidadeKey = 'primario_regular',
  isBaby: boolean = false
): string {
  const config =
    STUDENT_MODALITIES_CATALOG.find((c) => c.key === modalityKey) ||
    STUDENT_MODALITIES_CATALOG[3];

  let numericAge = typeof ageOrFaixa === 'number' ? ageOrFaixa : 10;
  if (typeof ageOrFaixa === 'string') {
    const lower = ageOrFaixa.toLowerCase();
    if (lower.includes('3 meses')) {
      numericAge = 2;
    } else if (lower.includes('5 a 7')) {
      numericAge = 6;
    } else if (lower.includes('8 a 10')) {
      numericAge = 9;
    } else if (lower.includes('11 a 13')) {
      numericAge = 11;
    } else if (lower.includes('mais de')) {
      const m = lower.match(/\d+/);
      numericAge = m ? parseInt(m[0], 10) + 1 : 14;
    } else if (lower.includes('menos de')) {
      const m = lower.match(/\d+/);
      numericAge = m ? Math.max(1, parseInt(m[0], 10) - 1) : 14;
    } else {
      const m = lower.match(/\d+/);
      if (m) numericAge = parseInt(m[0], 10);
    }
  }

  switch (modalityKey) {
    case 'pre_escolar':
      if (isBaby || numericAge < 3) return 'Creche';
      if (numericAge === 3) return 'Jardim de Infância 1';
      if (numericAge === 4) return 'Jardim de Infância 2';
      if (numericAge === 5) return 'Centro Infantil';
      return 'Centro Infantil Comunitário';

    case 'iniciacao':
      return 'Classe de Iniciação';

    case 'especial_pre_escolar':
      return numericAge <= 4 ? 'Sensorial' : 'Iniciação Especial';

    case 'primario_regular':
    case 'primario_especial':
      if (numericAge <= 6) return '1.ª Classe';
      if (numericAge === 7) return '2.ª Classe';
      if (numericAge === 8) return '3.ª Classe';
      if (numericAge === 9) return '4.ª Classe';
      if (numericAge === 10) return '5.ª Classe';
      return '6.ª Classe';

    case 'praeer':
      if (numericAge <= 9) return 'Etapa 1';
      if (numericAge <= 11) return 'Etapa 2';
      return 'Etapa 3';

    case 'primario_adultos':
      if (numericAge <= 17) return 'Módulo 1';
      if (numericAge <= 20) return 'Módulo 2';
      return 'Módulo 3';

    case 'ciclo1_geral':
    case 'ciclo1_especial':
    case 'ciclo1_tecnico':
      if (numericAge <= 12) return '7.ª Classe';
      if (numericAge === 13) return '8.ª Classe';
      return '9.ª Classe';

    case 'ciclo1_adultos_eja':
      return numericAge <= 18 ? '1.º Ano' : '2.º Ano';

    case 'ciclo2_geral':
      if (numericAge <= 15) return '10.ª Classe';
      if (numericAge === 16) return '11.ª Classe';
      return '12.ª Classe';

    case 'ciclo2_especial':
    case 'ciclo2_tecnico':
    case 'ciclo2_formacao_professores':
      if (numericAge <= 15) return '10.ª Classe';
      if (numericAge === 16) return '11.ª Classe';
      if (numericAge === 17) return '12.ª Classe';
      return '13.ª Classe';

    default:
      return config.etapasOuClasses[0] || '1.ª Classe';
  }
}

/**
 * Calculates student age and matches the corresponding faixa etária
 * and normative Classe according to the selected modality.
 */
export function calculateStudentAgeAndFaixa(
  birthDateStr: string,
  modalityKey: StudentModalidadeKey = 'primario_regular'
): { age: number; ageLabel: string; isBaby: boolean; suggestedFaixa: string; suggestedClass: string } {
  if (!birthDateStr) {
    return {
      age: 0,
      ageLabel: 'Não informada',
      isBaby: false,
      suggestedFaixa: 'N/A',
      suggestedClass: calculateSuggestedClassForAgeAndModality(10, modalityKey, false),
    };
  }

  const birthDate = new Date(birthDateStr);
  const today = new Date();
  if (isNaN(birthDate.getTime())) {
    return {
      age: 0,
      ageLabel: 'Data inválida',
      isBaby: false,
      suggestedFaixa: 'N/A',
      suggestedClass: calculateSuggestedClassForAgeAndModality(10, modalityKey, false),
    };
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

  const safeAge = Math.max(0, age);
  const suggestedClass = calculateSuggestedClassForAgeAndModality(safeAge, modalityKey, isBaby);

  return {
    age: safeAge,
    ageLabel,
    isBaby,
    suggestedFaixa,
    suggestedClass,
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
      const filtered = parsed.filter((s: any) => {
        const esc = String(s?.escola || s?.nomeEscola || '').trim().toLowerCase();
        return !esc.includes('modelo central');
      });
      if (filtered.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
      return filtered;
    }
    return [];
  } catch (err) {
    console.error('Error reading students from localStorage:', err);
    return [];
  }
}

export function getRegisteredSchoolsFromStorage(): AdminSchool[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  const norm = (str?: string) => (str || '').trim().toLowerCase();
  const map = new Map<string, AdminSchool>();

  try {
    const raw = localStorage.getItem('ucore_admin_schools');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((sc: AdminSchool) => {
          const n = norm(sc?.name);
          if (n && !n.includes('modelo central')) {
            map.set(n, sc);
          }
        });
      }
    }

    // Also merge detailed school registrations if present
    const rawReg = localStorage.getItem('sigre_school_registrations');
    if (rawReg) {
      const parsedReg = JSON.parse(rawReg);
      if (Array.isArray(parsedReg)) {
        parsedReg.forEach((reg: SchoolRegistrationData) => {
          const n = norm(reg?.nomeOficial);
          if (n && !n.includes('modelo central')) {
            const existing = map.get(n);
            const converted = convertRegistrationDataToAdminSchool(reg, existing);
            map.set(n, converted);
          }
        });
      }
    }

    return Array.from(map.values());
  } catch {
    return [];
  }
}

export function getSuggestedModalityForSchool(school?: AdminSchool | null): StudentModalidadeKey {
  if (!school) return 'primario_regular';
  const oferta = school.registrationData?.oferta;
  if (oferta?.ensinoEspecial?.activo) {
    if (oferta.ensinoEspecial.preEscolarIniciacao) return 'especial_pre_escolar';
    if (oferta.ensinoEspecial.ciclo1Especial) return 'ciclo1_especial';
    if (oferta.ensinoEspecial.ciclo2Especial) return 'ciclo2_especial';
    return 'primario_especial';
  }
  if (school.category === 'IIº Ciclo') {
    if (oferta?.secundario?.ciclo2TecnicoProfissional) return 'ciclo2_tecnico';
    if (oferta?.secundario?.ciclo2FormacaoProfessores) return 'ciclo2_formacao_professores';
    return 'ciclo2_geral';
  }
  if (school.category === 'Iº Ciclo') {
    if (oferta?.secundario?.ciclo1TecnicoProfissional) return 'ciclo1_tecnico';
    if (oferta?.secundario?.ciclo1AdultosEJA) return 'ciclo1_adultos_eja';
    return 'ciclo1_geral';
  }
  if (oferta?.preEscolar?.activo && !oferta?.primario?.activo) {
    if (oferta.preEscolar.iniciacao) return 'iniciacao';
    return 'pre_escolar';
  }
  return 'primario_regular';
}

export interface SchoolStudentQuotaStatus {
  schoolId: string;
  schoolName: string;
  declaredTotal: number;
  registeredCount: number;
  registeredFemaleCount: number;
  registeredMaleCount: number;
  registeredWithDocs: number;
  registeredWithoutDocs: number;
  pendingCount: number;
  progressPercent: number;
  registeredStudents: StudentRegistrationData[];
}

const ACTIVE_DIRECTOR_SCHOOL_KEY = 'ucore_active_director_school_id';

export function setActiveDirectorSchoolId(schoolId: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_DIRECTOR_SCHOOL_KEY, schoolId);
  } catch {}
}

export function getActiveDirectorSchool(
  schoolsList?: AdminSchool[],
  currentUserSchoolName?: string
): AdminSchool | undefined {
  const schools = schoolsList && schoolsList.length > 0 ? schoolsList : getRegisteredSchoolsFromStorage();
  if (schools.length === 0) return undefined;

  const norm = (str?: string) => (str || '').trim().toLowerCase();

  // 1. If currentUser has a specific schoolName that matches a registered school, prefer it
  if (currentUserSchoolName && !norm(currentUserSchoolName).includes('modelo central')) {
    const byUser = schools.find((s) => norm(s.name) === norm(currentUserSchoolName));
    if (byUser) return byUser;
  }

  // 2. Check active director school stored in localStorage
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const savedId = localStorage.getItem(ACTIVE_DIRECTOR_SCHOOL_KEY);
      if (savedId) {
        const byId = schools.find((s) => s.id === savedId || norm(s.name) === norm(savedId));
        if (byId) return byId;
      }
    } catch {}
  }

  // 3. Default to the first registered school
  return schools[0];
}

/**
 * Reconciles the declared total students of a school (e.g. 567) against the
 * students actually registered in the system for that school.
 * - Declared students do NOT enter the spreadsheet directly; they remain as PENDING.
 * - As each student is registered in the school, pendingCount decreases (e.g. 567 -> 566 -> ... -> 21 when 546 are registered)
 *   and registeredCount enters the Instrumento Complementar 2026/2027 spreadsheet.
 */
export function getSchoolStudentQuotaStatus(
  school: AdminSchool,
  extraStudents?: Array<AdminStudent | StudentRegistrationData>
): SchoolStudentQuotaStatus {
  const norm = (str?: string) => (str || '').trim().toLowerCase();
  const schoolNameNorm = norm(school.name);
  const schoolCodeNorm = norm(school.codigoSIGE || school.registrationData?.codigoSIGE);

  const storedDetailed = getStoredStudents();

  // Match detailed students belonging to this school
  const matchedDetailed = storedDetailed.filter((s) => {
    const matchId = Boolean(s.schoolId && s.schoolId === school.id);
    const sSchool = norm(s.escola || (s as any).nomeEscola);
    const matchName = Boolean(schoolNameNorm && sSchool === schoolNameNorm);
    const matchCode = Boolean(schoolCodeNorm && sSchool === schoolCodeNorm);
    return matchId || matchName || matchCode;
  });

  const combinedMap = new Map<string, StudentRegistrationData>();
  matchedDetailed.forEach((s) => {
    const key = s.id || `${norm(s.nomeCompleto || s.name)}::${norm(s.escola)}`;
    combinedMap.set(key, s);
  });

  if (extraStudents && extraStudents.length > 0) {
    extraStudents.forEach((item) => {
      const isDetailedItem = 'escola' in item || 'nomeCompleto' in item;
      if (isDetailedItem) {
        const s = item as StudentRegistrationData;
        const matchId = Boolean(s.schoolId && s.schoolId === school.id);
        const sSchool = norm(s.escola || (s as any).nomeEscola);
        const matchName = Boolean(schoolNameNorm && sSchool === schoolNameNorm);
        const matchCode = Boolean(schoolCodeNorm && sSchool === schoolCodeNorm);
        if (matchId || matchName || matchCode) {
          const alreadyById = s.id && combinedMap.has(s.id);
          const alreadyByName = Array.from(combinedMap.values()).some(
            (existing) => norm(existing.nomeCompleto || existing.name) === norm(s.nomeCompleto || s.name)
          );
          if (!alreadyById && !alreadyByName) {
            combinedMap.set(s.id || `${norm(s.nomeCompleto || s.name)}::${schoolNameNorm}`, s);
          }
        }
        return;
      }

      const ast = item as AdminStudent;
      const d = ast.registrationData;
      const matchId = Boolean((ast.schoolId && ast.schoolId === school.id) || (d?.schoolId && d.schoolId === school.id));
      const astSchool = norm(d?.escola || (d as any)?.nomeEscola || ast.schoolName);
      const matchName = Boolean(schoolNameNorm && (astSchool === schoolNameNorm || norm(ast.schoolName) === schoolNameNorm));
      const matchCode = Boolean(schoolCodeNorm && (astSchool === schoolCodeNorm || norm(ast.schoolName) === schoolCodeNorm));

      if (matchId || matchName || matchCode) {
        const alreadyById = ast.id && combinedMap.has(ast.id);
        const alreadyByName = Array.from(combinedMap.values()).some(
          (existing) => norm(existing.nomeCompleto || existing.name) === norm(ast.name)
        );
        if (!alreadyById && !alreadyByName) {
          const fallbackReg: StudentRegistrationData = d || {
            id: ast.id,
            name: ast.name,
            nomeCompleto: ast.name,
            genero: ast.gender === 'M' ? 'M' : 'F',
            dataNascimento: ast.dataNascimento || '2016-05-10',
            idade: ast.idade || ast.age || 9,
            tipoDocumento: (ast.documentType as any) || (ast.hasDocuments ? 'BI' : 'sem Documento'),
            numeroDocumento: ast.numeroDocumento,
            naturezaEscola: (school.natureza as StudentNaturezaEscola) || 'Pública',
            tipoEscolaModalidade: getSuggestedModalityForSchool(school),
            classeEtapaModulo: ast.gradeClass || '1.ª Classe',
            classe: ast.gradeClass || '1ª Classe',
            turma: ast.turma || 'Turma A',
            sala: ast.room || 'Sala 01',
            escola: school.name,
            schoolId: school.id,
            condicaoMatricula: ast.condicaoMatricula || 'primeira_vez',
            alunoRepetente: ast.condicaoMatricula === 'repetente',
            encarregado: ast.guardianName || 'Encarregado de Educação',
            telefone: '+244 923 000 000',
          };
          combinedMap.set(ast.id || `${norm(ast.name)}::${schoolNameNorm}`, fallbackReg);
        }
      }
    });
  }

  const registeredStudents = Array.from(combinedMap.values());
  const registeredCount = registeredStudents.length;

  const declaredFromProp =
    typeof school.declaredStudentsCount === 'number' && school.declaredStudentsCount > 0
      ? school.declaredStudentsCount
      : typeof school.registrationData?.pessoal?.totalAlunosDeclarados === 'number' &&
        school.registrationData.pessoal.totalAlunosDeclarados > 0
      ? school.registrationData.pessoal.totalAlunosDeclarados
      : (school.studentsWithDocs || 0) + (school.studentsWithoutDocs || 0);

  const declaredTotal = Math.max(declaredFromProp, 0);
  const pendingCount = Math.max(0, declaredTotal - registeredCount);

  const registeredFemaleCount = registeredStudents.filter(
    (s) => s.genero === 'F' || (s as any).sexo === 'Feminino'
  ).length;
  const registeredMaleCount = Math.max(0, registeredCount - registeredFemaleCount);
  const registeredWithDocs = registeredStudents.filter((s) => s.tipoDocumento !== 'sem Documento').length;
  const registeredWithoutDocs = Math.max(0, registeredCount - registeredWithDocs);

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
    registeredFemaleCount,
    registeredMaleCount,
    registeredWithDocs,
    registeredWithoutDocs,
    pendingCount,
    progressPercent,
    registeredStudents,
  };
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

      // Sync with ucore_admin_students so all admin & SIGE spreadsheets immediately include this student
      const rawAdminStudents = localStorage.getItem('ucore_admin_students');
      const adminStudentsList: AdminStudent[] = rawAdminStudents ? JSON.parse(rawAdminStudents) : [];
      const hasDocs = ensuredData.tipoDocumento !== 'sem Documento';
      const syncedAdminStudent: AdminStudent = {
        id: ensuredData.id!,
        name: ensuredData.nomeCompleto || ensuredData.name,
        gender: ensuredData.genero === 'M' ? 'M' : 'F',
        gradeClass: ensuredData.classeEtapaModulo || ensuredData.classe || '1.ª Classe',
        room: ensuredData.sala || 'Sala 01',
        turma: ensuredData.turma || 'Turma A',
        guardianName: ensuredData.encarregado || 'Encarregado de Educação',
        location: ensuredData.endereco || `${ensuredData.municipio || 'Quêssua'}, ${ensuredData.provincia || 'Malanje'}`,
        presenceRate: 97.5,
        hasDocuments: hasDocs,
        documentType: ensuredData.tipoDocumento,
        numeroDocumento: ensuredData.numeroDocumento,
        dataNascimento: ensuredData.dataNascimento,
        idade: ensuredData.idade,
        condicaoMatricula: ensuredData.condicaoMatricula,
        foto: ensuredData.foto,
        anexoDocumentoNome: ensuredData.anexoDocumentoNome,
        performanceScore: 8.5,
        schoolName: ensuredData.escola || 'Escola Oficial',
        schoolId: ensuredData.schoolId,
        schoolType: ensuredData.naturezaEscola || 'Pública',
        registrationData: ensuredData,
      };

      const existingAdminIdx = adminStudentsList.findIndex(
        (s) => s.id === syncedAdminStudent.id || (s.name.toLowerCase() === syncedAdminStudent.name.toLowerCase() && s.schoolName === syncedAdminStudent.schoolName)
      );
      let nextAdminStudents: AdminStudent[];
      if (existingAdminIdx >= 0) {
        nextAdminStudents = [...adminStudentsList];
        nextAdminStudents[existingAdminIdx] = {
          ...nextAdminStudents[existingAdminIdx],
          ...syncedAdminStudent,
        };
      } else {
        nextAdminStudents = [syncedAdminStudent, ...adminStudentsList];
      }
      localStorage.setItem('ucore_admin_students', JSON.stringify(nextAdminStudents));

      // Sync with ucore_director_students so Director portal immediately sees the student
      const rawDirStudents = localStorage.getItem('ucore_director_students');
      const dirStudentsList: DirectorStudent[] = rawDirStudents ? JSON.parse(rawDirStudents) : [];
      const syncedDirStudent: DirectorStudent = {
        id: syncedAdminStudent.id,
        name: syncedAdminStudent.name,
        age: ensuredData.idade || 10,
        gender: syncedAdminStudent.gender,
        gradeClass: syncedAdminStudent.gradeClass,
        room: syncedAdminStudent.room,
        turma: syncedAdminStudent.turma,
        shift: (ensuredData.turno === 'Tarde' || ensuredData.periodo === 'Tarde' ? 'Tarde' : 'Manhã') as 'Manhã' | 'Tarde',
        teacherName: 'Docente Titular',
        guardianName: syncedAdminStudent.guardianName,
        guardianPhone: ensuredData.telefone || '+244 923 000 000',
        hasDocuments: syncedAdminStudent.hasDocuments,
        presenceRate: syncedAdminStudent.presenceRate,
        averageGrade: 14,
        registrationData: ensuredData,
      };
      const existingDirIdx = Array.isArray(dirStudentsList)
        ? dirStudentsList.findIndex(
            (s) => s.id === syncedDirStudent.id || s.name.trim().toLowerCase() === syncedDirStudent.name.trim().toLowerCase()
          )
        : -1;
      const nextDirStudents = Array.isArray(dirStudentsList) ? [...dirStudentsList] : [];
      if (existingDirIdx >= 0) {
        nextDirStudents[existingDirIdx] = { ...nextDirStudents[existingDirIdx], ...syncedDirStudent };
      } else {
        nextDirStudents.unshift(syncedDirStudent);
      }
      localStorage.setItem('ucore_director_students', JSON.stringify(nextDirStudents));

      // Sync with ucore_teacher_students so Teacher portal immediately sees the student
      const rawTeacherStudents = localStorage.getItem('ucore_teacher_students');
      const teacherStudentsList: any[] = rawTeacherStudents ? JSON.parse(rawTeacherStudents) : [];
      const existingTeachIdx = Array.isArray(teacherStudentsList)
        ? teacherStudentsList.findIndex(
            (s) => s.id === syncedAdminStudent.id || String(s.name || '').trim().toLowerCase() === syncedAdminStudent.name.trim().toLowerCase()
          )
        : -1;
      const nextTeachStudents = Array.isArray(teacherStudentsList) ? [...teacherStudentsList] : [];
      const teacherStudentEntry = {
        id: syncedAdminStudent.id,
        name: syncedAdminStudent.name,
        age: ensuredData.idade || 10,
        gender: syncedAdminStudent.gender === 'F' ? 'Feminino' : 'Masculino',
        turma: `${syncedAdminStudent.gradeClass} - ${syncedAdminStudent.turma}`,
        attendance: syncedAdminStudent.presenceRate,
        status: 'Ativo' as const,
        guardian: syncedAdminStudent.guardianName,
        phone: ensuredData.telefone || '+244 923 000 000',
        grades: existingTeachIdx >= 0 ? nextTeachStudents[existingTeachIdx]?.grades || [] : [],
        notes: ensuredData.observacoes || '',
      };
      if (existingTeachIdx >= 0) {
        nextTeachStudents[existingTeachIdx] = { ...nextTeachStudents[existingTeachIdx], ...teacherStudentEntry };
      } else {
        nextTeachStudents.unshift(teacherStudentEntry);
      }
      localStorage.setItem('ucore_teacher_students', JSON.stringify(nextTeachStudents));

      // Also sync school student counters in ucore_admin_schools
      const rawSchools = localStorage.getItem('ucore_admin_schools');
      if (rawSchools) {
        const schoolsList: AdminSchool[] = JSON.parse(rawSchools);
        if (Array.isArray(schoolsList) && schoolsList.length > 0) {
          const updatedSchools = schoolsList.map((sc) => {
            const belongsToSchool = nextAdminStudents.filter(
              (st) =>
                (st.schoolId && st.schoolId === sc.id) ||
                st.schoolName.trim().toLowerCase() === sc.name.trim().toLowerCase() ||
                (st.registrationData?.escola && st.registrationData.escola.trim().toLowerCase() === sc.name.trim().toLowerCase())
            );
            if (
              (ensuredData.schoolId && ensuredData.schoolId === sc.id) ||
              (ensuredData.escola && ensuredData.escola.trim().toLowerCase() === sc.name.trim().toLowerCase()) ||
              belongsToSchool.length > 0
            ) {
              const preservedDeclared =
                typeof sc.declaredStudentsCount === 'number'
                  ? sc.declaredStudentsCount
                  : typeof sc.registrationData?.pessoal?.totalAlunosDeclarados === 'number'
                  ? sc.registrationData.pessoal.totalAlunosDeclarados
                  : (sc.studentsWithDocs || 0) + (sc.studentsWithoutDocs || 0);
              const withDocs = belongsToSchool.filter((st) => st.hasDocuments).length;
              const withoutDocs = belongsToSchool.length - withDocs;
              const updatedSc = {
                ...sc,
                declaredStudentsCount: preservedDeclared,
                studentsWithDocs: withDocs,
                studentsWithoutDocs: withoutDocs,
              };
              saveSchoolToFirestore(updatedSc).catch(() => {});
              return updatedSc;
            }
            return sc;
          });
          localStorage.setItem('ucore_admin_schools', JSON.stringify(updatedSchools));
        }
      }

      // Persist immediately to Firebase Firestore and backend network store
      saveStudentToFirestore(ensuredData).catch(() => {});
      fetch('/api/network/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: nextAdminStudents }),
      }).catch(() => {});

      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    } catch (err) {
      console.error('Error saving student in localStorage:', err);
    }
  }

  return ensuredData;
}

export function deleteStudent(id: string, studentName?: string): boolean {
  const normTargetName = (studentName || '').trim().toLowerCase();
  const currentList = getStoredStudents();
  const removedDetailed = currentList.find(
    (s) =>
      s.id === id ||
      (normTargetName &&
        ((s.name || '').trim().toLowerCase() === normTargetName ||
          (s.nomeCompleto || '').trim().toLowerCase() === normTargetName))
  );
  const targetName = normTargetName || (removedDetailed?.nomeCompleto || removedDetailed?.name || '').trim().toLowerCase();

  const filtered = currentList.filter(
    (s) =>
      s.id !== id &&
      (!targetName ||
        ((s.name || '').trim().toLowerCase() !== targetName &&
          (s.nomeCompleto || '').trim().toLowerCase() !== targetName))
  );

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

      // Remove from ucore_admin_students
      const rawAdminStudents = localStorage.getItem('ucore_admin_students');
      let nextAdminStudents: AdminStudent[] = [];
      if (rawAdminStudents) {
        const parsedAdmin: AdminStudent[] = JSON.parse(rawAdminStudents);
        if (Array.isArray(parsedAdmin)) {
          nextAdminStudents = parsedAdmin.filter(
            (st) => st.id !== id && (!targetName || (st.name || '').trim().toLowerCase() !== targetName)
          );
          localStorage.setItem('ucore_admin_students', JSON.stringify(nextAdminStudents));
        }
      }

      // Remove from ucore_director_students
      const rawDirectorStudents = localStorage.getItem('ucore_director_students');
      if (rawDirectorStudents) {
        const parsedDir = JSON.parse(rawDirectorStudents);
        if (Array.isArray(parsedDir)) {
          const nextDir = parsedDir.filter(
            (st: any) => st.id !== id && (!targetName || (st.name || '').trim().toLowerCase() !== targetName)
          );
          localStorage.setItem('ucore_director_students', JSON.stringify(nextDir));
        }
      }

      // Remove from ucore_teacher_students
      const rawTeacherStudents = localStorage.getItem('ucore_teacher_students');
      if (rawTeacherStudents) {
        const parsedTeacher = JSON.parse(rawTeacherStudents);
        if (Array.isArray(parsedTeacher)) {
          const nextTeacher = parsedTeacher.filter(
            (st: any) => st.id !== id && (!targetName || (st.name || '').trim().toLowerCase() !== targetName)
          );
          localStorage.setItem('ucore_teacher_students', JSON.stringify(nextTeacher));
        }
      }

      // Recalculate school student counters in ucore_admin_schools
      const rawSchools = localStorage.getItem('ucore_admin_schools');
      if (rawSchools) {
        const schoolsList: AdminSchool[] = JSON.parse(rawSchools);
        if (Array.isArray(schoolsList) && schoolsList.length > 0) {
          const updatedSchools = schoolsList.map((sc) => {
            const preservedDeclared =
              typeof sc.declaredStudentsCount === 'number'
                ? sc.declaredStudentsCount
                : typeof sc.registrationData?.pessoal?.totalAlunosDeclarados === 'number'
                ? sc.registrationData.pessoal.totalAlunosDeclarados
                : (sc.studentsWithDocs || 0) + (sc.studentsWithoutDocs || 0);
            const belongsToSchool = nextAdminStudents.filter(
              (st) =>
                (st.schoolId && st.schoolId === sc.id) ||
                st.schoolName.trim().toLowerCase() === sc.name.trim().toLowerCase() ||
                (st.registrationData?.escola &&
                  st.registrationData.escola.trim().toLowerCase() === sc.name.trim().toLowerCase())
            );
            const withDocs = belongsToSchool.filter((st) => st.hasDocuments).length;
            const withoutDocs = belongsToSchool.length - withDocs;
            return {
              ...sc,
              declaredStudentsCount: preservedDeclared,
              studentsWithDocs: withDocs,
              studentsWithoutDocs: withoutDocs,
            };
          });
          localStorage.setItem('ucore_admin_schools', JSON.stringify(updatedSchools));
        }
      }

      // Delete from Firestore in real time
      deleteStudentFromFirestore(id).catch(() => {});
      if (targetName) {
        deleteStudentFromFirestore(targetName).catch(() => {});
      }

      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
      return true;
    } catch (err) {
      console.error('Error deleting student:', err);
      return false;
    }
  }
  return true;
}

export function deleteAllStudents(): boolean {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem('ucore_admin_students', JSON.stringify([]));
      localStorage.setItem('ucore_director_students', JSON.stringify([]));
      localStorage.setItem('ucore_teacher_students', JSON.stringify([]));
      clearAllStudentsFromFirestore().catch(() => {});

      const rawSchools = localStorage.getItem('ucore_admin_schools');
      if (rawSchools) {
        const schoolsList: AdminSchool[] = JSON.parse(rawSchools);
        if (Array.isArray(schoolsList)) {
          const updatedSchools = schoolsList.map((sc) => {
            const preservedDeclared =
              typeof sc.declaredStudentsCount === 'number'
                ? sc.declaredStudentsCount
                : typeof sc.registrationData?.pessoal?.totalAlunosDeclarados === 'number'
                ? sc.registrationData.pessoal.totalAlunosDeclarados
                : (sc.studentsWithDocs || 0) + (sc.studentsWithoutDocs || 0);
            return {
              ...sc,
              declaredStudentsCount: preservedDeclared,
              studentsWithDocs: 0,
              studentsWithoutDocs: 0,
            };
          });
          localStorage.setItem('ucore_admin_schools', JSON.stringify(updatedSchools));
        }
      }

      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
      return true;
    } catch (err) {
      console.error('Error deleting all students:', err);
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
