/**
 * SIGE 2024/2025 Business Rules & Consistency Engine
 * 
 * Implements Ministério da Educação de Angola statistical consistency standards:
 * 1. Gender Validation Rule: F (Feminino) <= MF (Total)
 * 2. Aproveitamento Consistency: Matriculados = Aprovados + Reprovados + Desistidos
 * 3. Residual Difference: Residual = Matriculados - (Aprovados + Reprovados + Desistidos) === 0
 * 4. Aggregations: Total MF and Total F sum parity
 */

export interface GenderValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface AproveitamentoValidationResult {
  isValid: boolean;
  status: 'Correcto' | 'Falso';
  residual: number;
  matriculados: number;
  totalComponentes: number;
}

/**
 * Validates that female count does not exceed total (F <= MF)
 */
export function validateGenderCount(mf: number, f: number): GenderValidationResult {
  if (f < 0 || mf < 0) {
    return {
      isValid: false,
      errorMessage: 'Valores não podem ser negativos'
    };
  }
  if (f > mf) {
    return {
      isValid: false,
      errorMessage: 'F não pode ser Superior a MF'
    };
  }
  return {
    isValid: true
  };
}

/**
 * Validates Aproveitamento consistency:
 * Matriculados = Aprovados + Reprovados + Desistidos
 */
export function validateAproveitamento(
  matriculados: number,
  aprovados: number,
  reprovados: number,
  desistidos: number
): AproveitamentoValidationResult {
  const totalComponentes = (aprovados || 0) + (reprovados || 0) + (desistidos || 0);
  const residual = (matriculados || 0) - totalComponentes;
  const isValid = residual === 0;

  return {
    isValid,
    status: isValid ? 'Correcto' : 'Falso',
    residual,
    matriculados: matriculados || 0,
    totalComponentes
  };
}

/**
 * Ensures safe gender distribution where female is always <= total
 */
export function distributeGender(total: number, femaleRatio: number = 0.48): { mf: number; f: number; m: number } {
  const mf = Math.max(0, Math.round(total));
  const safeRatio = Math.min(1, Math.max(0, femaleRatio));
  const f = Math.min(mf, Math.round(mf * safeRatio));
  const m = mf - f;
  return { mf, f, m };
}

/**
 * Auto-balances aproveitamento components to ensure residual is exactly zero
 */
export function balanceAproveitamento(
  matriculados: number,
  aprovadosRatio: number = 0.82,
  reprovadosRatio: number = 0.13
): {
  matriculados: number;
  aprovados: number;
  reprovados: number;
  desistidos: number;
  residual: number;
  status: 'Correcto' | 'Falso';
} {
  const mat = Math.max(0, Math.round(matriculados));
  const aprovados = Math.round(mat * aprovadosRatio);
  const maxReprovados = mat - aprovados;
  const reprovados = Math.min(maxReprovados, Math.round(mat * reprovadosRatio));
  const desistidos = Math.max(0, mat - (aprovados + reprovados));
  const residual = mat - (aprovados + reprovados + desistidos);

  return {
    matriculados: mat,
    aprovados,
    reprovados,
    desistidos,
    residual,
    status: residual === 0 ? 'Correcto' : 'Falso'
  };
}
