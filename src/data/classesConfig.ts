import { MAX_TURMA_CAPACITY } from '../types';

export { MAX_TURMA_CAPACITY };

export interface ClassDefinition {
  id: string;
  name: string;
  category: 'regular' | 'modulo' | 'praeer';
  categoryLabel: string;
  description: string;
}

export const REGULAR_CLASSES = [
  'Iniciação',
  '1ª Classe',
  '2ª Classe',
  '3ª Classe',
  '4ª Classe',
  '5ª Classe',
  '6ª Classe',
  '7ª Classe',
  '8ª Classe',
  '9ª Classe',
];

export const MODULO_CLASSES = [
  'Módulo 1',
  'Módulo 2',
  'Módulo 3',
];

export const PRAEER_CLASSES = [
  'PRAEER Etapa 1',
  'PRAEER Etapa 2',
  'PRAEER Etapa 3',
];

export const ALL_SCHOOL_CLASSES = [
  ...REGULAR_CLASSES,
  ...MODULO_CLASSES,
  ...PRAEER_CLASSES,
];

export const CLASS_GROUPS = [
  {
    group: 'Ensino Regular (Iniciação à 9ª Classe)',
    category: 'regular' as const,
    items: REGULAR_CLASSES,
  },
  {
    group: 'Módulos de Aceleração e Alfabetização',
    category: 'modulo' as const,
    items: MODULO_CLASSES,
  },
  {
    group: 'PRAEER (Recuperação do Atraso Escolar)',
    category: 'praeer' as const,
    items: PRAEER_CLASSES,
  },
];

export const STANDARD_TURMAS = [
  'Turma A',
  'Turma B',
  'Turma C',
  'Turma D',
  'Turma 1',
  'Turma 2',
];

/**
 * Baseline initial student count per (class, turma).
 * Note: Turmas with 45 students are at full capacity and strictly ineligible for new enrollments.
 */
export const initialTurmaOccupancy: Record<string, number> = {
  // 4ª Classe
  '4ª Classe::Turma A': 45, // Full - Ineligible
  '4ª Classe::Turma B': 38, // 7 open slots
  '4ª Classe::Turma C': 42, // 3 open slots
  '4ª Classe::Turma 1': 45, // Full - Ineligible

  // 1ª à 3ª Classe
  '1ª Classe::Turma A': 45, // Full
  '1ª Classe::Turma B': 41,
  '2ª Classe::Turma A': 45, // Full
  '3ª Classe::Turma A': 43,

  // 5ª à 9ª Classe
  '5ª Classe::Turma A': 45, // Full
  '5ª Classe::Turma B': 39,
  '6ª Classe::Turma A': 44,
  '7ª Classe::Turma A': 45, // Full
  '8ª Classe::Turma A': 42,
  '9ª Classe::Turma A': 45, // Full

  // Módulos
  'Módulo 1::Turma A': 45, // Full - Ineligible
  'Módulo 1::Turma B': 32, // 13 open slots
  'Módulo 2::Turma A': 41, // 4 open slots
  'Módulo 2::Turma B': 33, // 12 open slots
  'Módulo 3::Turma A': 45, // Full - Ineligible
  'Módulo 3::Turma B': 28, // 17 open slots

  // PRAEER
  'PRAEER Etapa 1::Turma A': 45, // Full - Ineligible
  'PRAEER Etapa 1::Turma B': 40, // 5 open slots
  'PRAEER Etapa 2::Turma A': 45, // Full - Ineligible
  'PRAEER Etapa 2::Turma B': 35, // 10 open slots
  'PRAEER Etapa 3::Turma A': 39, // 6 open slots
  'PRAEER Etapa 3::Turma B': 29, // 16 open slots
};

// In-memory occupancy cache for runtime updates
const runtimeOccupancy = { ...initialTurmaOccupancy };

export function getTurmaKey(gradeClass: string, turma: string): string {
  return `${gradeClass.trim()}::${turma.trim()}`;
}

export function getTurmaOccupancy(gradeClass: string, turma: string): number {
  const key = getTurmaKey(gradeClass, turma);
  if (key in runtimeOccupancy) {
    return runtimeOccupancy[key];
  }
  // Default for unspecified combinations
  if (turma.includes('A') || turma.includes('1')) {
    return 45; // Demonstrate full turma
  }
  return 36;
}

export function isTurmaFull(gradeClass: string, turma: string): boolean {
  return getTurmaOccupancy(gradeClass, turma) >= MAX_TURMA_CAPACITY;
}

export function getTurmaRemainingSlots(gradeClass: string, turma: string): number {
  const count = getTurmaOccupancy(gradeClass, turma);
  return Math.max(0, MAX_TURMA_CAPACITY - count);
}

export function incrementTurmaOccupancy(gradeClass: string, turma: string): number {
  const key = getTurmaKey(gradeClass, turma);
  const current = getTurmaOccupancy(gradeClass, turma);
  if (current >= MAX_TURMA_CAPACITY) {
    return current;
  }
  const next = current + 1;
  runtimeOccupancy[key] = next;
  return next;
}
