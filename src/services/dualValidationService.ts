/**
 * Serviço de Validação Síncrona Frontend + Backend (Dual Validation)
 * Garante que regras de negócio e restrições de integridade são validadas simultaneamente
 * na camada de apresentação (UX instantânea) e na camada de servidor (SSD / Zero Trust).
 */

import {
  validateAngolaBI,
  validateAngolaPhone,
  validateEmail,
  validateGrade,
  validateFullName,
  validateBirthDate,
  validateTrimestre,
  ValidationResult,
} from '../utils/formConstraints';

export interface DualValidationResult {
  isValid: boolean;
  errors: string[];
  clientValid: boolean;
  serverValid: boolean;
  sanitizedPayload?: any;
}

export class DualValidationService {
  /**
   * Valida dados de Estudante simultaneamente no Frontend e no Backend
   */
  public static async validateStudent(data: {
    nomeCompleto: string;
    biOuCedula: string;
    tipoDocumento?: string;
    dataNascimento?: string;
    nomeEscola?: string;
  }): Promise<DualValidationResult> {
    const clientErrors: string[] = [];

    // 1. Validação no Frontend
    const nameVal = validateFullName(data.nomeCompleto);
    if (!nameVal.isValid && nameVal.error) {
      clientErrors.push(nameVal.error);
    }

    if (data.tipoDocumento === 'BI' || (!data.tipoDocumento && data.biOuCedula)) {
      const biVal = validateAngolaBI(data.biOuCedula);
      if (!biVal.isValid && biVal.error) {
        clientErrors.push(biVal.error);
      }
    }

    if (data.dataNascimento) {
      const birthVal = validateBirthDate(data.dataNascimento);
      if (!birthVal.isValid && birthVal.error) {
        clientErrors.push(birthVal.error);
      }
    }

    if (!data.nomeEscola || !data.nomeEscola.trim()) {
      clientErrors.push('A instituição escolar é obrigatória.');
    }

    const clientValid = clientErrors.length === 0;

    // 2. Validação no Backend (em simultâneo)
    let serverValid = true;
    const serverErrors: string[] = [];

    try {
      const res = await fetch('/api/validate/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        if (!json.isValid && json.errors) {
          serverValid = false;
          serverErrors.push(...json.errors);
        }
      } else if (res.status === 400 || res.status === 422) {
        const json = await res.json().catch(() => ({}));
        serverValid = false;
        if (json.errors && Array.isArray(json.errors)) {
          serverErrors.push(...json.errors);
        } else if (json.error) {
          serverErrors.push(json.error);
        }
      }
    } catch (err) {
      // Se a rede estiver indisponível ou em modo offline, prevalece a validação client
      console.warn('Verificação de backend indisponível, recorrendo à validação local SSD:', err);
    }

    const combinedErrors = Array.from(new Set([...clientErrors, ...serverErrors]));

    return {
      isValid: clientValid && serverValid,
      clientValid,
      serverValid,
      errors: combinedErrors,
    };
  }

  /**
   * Valida dados de Professor/Docente simultaneamente no Frontend e no Backend
   */
  public static async validateTeacher(data: {
    nomeCompleto: string;
    biNif: string;
    telefone: string;
    email?: string;
    nomeEscola?: string;
  }): Promise<DualValidationResult> {
    const clientErrors: string[] = [];

    // 1. Validação no Frontend
    const nameVal = validateFullName(data.nomeCompleto);
    if (!nameVal.isValid && nameVal.error) {
      clientErrors.push(nameVal.error);
    }

    const biVal = validateAngolaBI(data.biNif);
    if (!biVal.isValid && biVal.error) {
      clientErrors.push(biVal.error);
    }

    const phoneVal = validateAngolaPhone(data.telefone);
    if (!phoneVal.isValid && phoneVal.error) {
      clientErrors.push(phoneVal.error);
    }

    if (data.email) {
      const emailVal = validateEmail(data.email, false);
      if (!emailVal.isValid && emailVal.error) {
        clientErrors.push(emailVal.error);
      }
    }

    if (!data.nomeEscola || !data.nomeEscola.trim()) {
      clientErrors.push('A instituição escolar onde leciona é obrigatória.');
    }

    const clientValid = clientErrors.length === 0;

    // 2. Validação no Backend (em simultâneo)
    let serverValid = true;
    const serverErrors: string[] = [];

    try {
      const res = await fetch('/api/validate/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        if (!json.isValid && json.errors) {
          serverValid = false;
          serverErrors.push(...json.errors);
        }
      } else if (res.status === 400 || res.status === 422) {
        const json = await res.json().catch(() => ({}));
        serverValid = false;
        if (json.errors && Array.isArray(json.errors)) {
          serverErrors.push(...json.errors);
        } else if (json.error) {
          serverErrors.push(json.error);
        }
      }
    } catch (err) {
      console.warn('Verificação de backend indisponível para professor:', err);
    }

    const combinedErrors = Array.from(new Set([...clientErrors, ...serverErrors]));

    return {
      isValid: clientValid && serverValid,
      clientValid,
      serverValid,
      errors: combinedErrors,
    };
  }

  /**
   * Valida notas e pautas escolares (0 a 20 valores) em simultâneo
   */
  public static async validateGradeEntry(data: {
    studentId: string;
    disciplina: string;
    nota: number | string;
    trimestre: number | string;
  }): Promise<DualValidationResult> {
    const clientErrors: string[] = [];

    const gradeVal = validateGrade(data.nota);
    if (!gradeVal.isValid && gradeVal.error) {
      clientErrors.push(gradeVal.error);
    }

    const trimVal = validateTrimestre(data.trimestre);
    if (!trimVal.isValid && trimVal.error) {
      clientErrors.push(trimVal.error);
    }

    if (!data.studentId) {
      clientErrors.push('O estudante é obrigatório para atribuição de notas.');
    }

    const clientValid = clientErrors.length === 0;
    let serverValid = true;
    const serverErrors: string[] = [];

    try {
      const res = await fetch('/api/validate/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        serverValid = false;
        if (json.error) serverErrors.push(json.error);
        if (json.errors) serverErrors.push(...json.errors);
      }
    } catch (err) {
      console.warn('Verificação de backend indisponível para nota:', err);
    }

    return {
      isValid: clientValid && serverValid,
      clientValid,
      serverValid,
      errors: Array.from(new Set([...clientErrors, ...serverErrors])),
    };
  }
}
