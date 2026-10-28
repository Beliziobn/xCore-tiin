/**
 * Referential Integrity Engine (Foreign Key Enforcement)
 * Garante que nenhuma entidade órfã seja criada e valida integridade relacional.
 */

export interface IntegrityError {
  entity: string;
  field: string;
  value: string;
  referencedEntity: string;
  message: string;
}

export interface IntegrityCheckResult {
  isValid: boolean;
  errors: IntegrityError[];
}

export class ReferentialIntegrityService {
  /**
   * Valida integridade referencial de um Estudante (School FK e Turma FK)
   */
  static validateStudentForeignKeys(
    student: { escola?: string; schoolId?: string; turma?: string; turmaId?: string },
    existingSchools: Array<{ id?: string; name?: string; nome?: string }>,
    existingTurmas: string[] = ['Turma A', 'Turma B', 'Turma C', 'Turma D', 'Turma E', 'Turma F']
  ): IntegrityCheckResult {
    const errors: IntegrityError[] = [];

    const targetSchool = (student.schoolId || student.escola || '').trim().toLowerCase();
    if (!targetSchool) {
      errors.push({
        entity: 'Student',
        field: 'schoolId',
        value: targetSchool,
        referencedEntity: 'School',
        message: 'A escola vinculada (FK) é obrigatória para o cadastro do aluno.',
      });
    } else {
      const schoolExists = existingSchools.some(
        (s) =>
          (s.id && s.id.toLowerCase() === targetSchool) ||
          (s.name && s.name.toLowerCase() === targetSchool) ||
          (s.nome && s.nome.toLowerCase() === targetSchool)
      );

      if (!schoolExists) {
        errors.push({
          entity: 'Student',
          field: 'schoolId',
          value: targetSchool,
          referencedEntity: 'School',
          message: `Violação de Chave Estrangeira (FK): A escola "${student.escola || student.schoolId}" não foi encontrada no registo de escolas homologadas.`,
        });
      }
    }

    const targetTurma = (student.turmaId || student.turma || '').trim();
    if (!targetTurma) {
      errors.push({
        entity: 'Student',
        field: 'turma',
        value: targetTurma,
        referencedEntity: 'Turma',
        message: 'A turma vinculada (FK) é obrigatória para o aluno.',
      });
    } else if (existingTurmas.length > 0) {
      const turmaExists = existingTurmas.some(
        (t) => t.toLowerCase() === targetTurma.toLowerCase()
      );
      if (!turmaExists) {
        errors.push({
          entity: 'Student',
          field: 'turma',
          value: targetTurma,
          referencedEntity: 'Turma',
          message: `Violação de Chave Estrangeira (FK): A turma "${targetTurma}" não existe na matriz curricular da escola.`,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida integridade referencial de um Professor (School FK)
   */
  static validateTeacherForeignKeys(
    teacher: { school?: string; schoolId?: string },
    existingSchools: Array<{ id?: string; name?: string; nome?: string }>
  ): IntegrityCheckResult {
    const errors: IntegrityError[] = [];
    const targetSchool = (teacher.schoolId || teacher.school || '').trim().toLowerCase();

    if (!targetSchool) {
      errors.push({
        entity: 'Teacher',
        field: 'schoolId',
        value: targetSchool,
        referencedEntity: 'School',
        message: 'A escola vinculada (FK) é obrigatória para a lotação do docente.',
      });
    } else {
      const schoolExists = existingSchools.some(
        (s) =>
          (s.id && s.id.toLowerCase() === targetSchool) ||
          (s.name && s.name.toLowerCase() === targetSchool) ||
          (s.nome && s.nome.toLowerCase() === targetSchool)
      );

      if (!schoolExists) {
        errors.push({
          entity: 'Teacher',
          field: 'schoolId',
          value: targetSchool,
          referencedEntity: 'School',
          message: `Violação de Chave Estrangeira (FK): O docente não pode ser alocado na escola inexistente "${teacher.school || teacher.schoolId}".`,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida integridade de Notas (Student FK, Teacher FK, Turma FK)
   */
  static validateGradeForeignKeys(
    grade: { studentId: string; turma: string; professorId?: string },
    existingStudentIds: string[],
    existingTurmas: string[]
  ): IntegrityCheckResult {
    const errors: IntegrityError[] = [];

    if (!existingStudentIds.includes(grade.studentId)) {
      errors.push({
        entity: 'Grade',
        field: 'studentId',
        value: grade.studentId,
        referencedEntity: 'Student',
        message: `Violação de Chave Estrangeira (FK): Não é possível atribuir notas ao aluno ID "${grade.studentId}", pois o mesmo não está matriculado.`,
      });
    }

    if (!existingTurmas.includes(grade.turma)) {
      errors.push({
        entity: 'Grade',
        field: 'turma',
        value: grade.turma,
        referencedEntity: 'Turma',
        message: `Violação de Chave Estrangeira (FK): A turma "${grade.turma}" não existe na matriz desta pauta.`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
