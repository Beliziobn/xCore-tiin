import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ReferentialIntegrityService } from '../services/referentialIntegrity';

describe('TDD: Referential Integrity & Foreign Key Enforcement', () => {
  const existingSchools = [
    { id: 'sch-001', name: 'Escola Modelo Central', nome: 'Escola Modelo Central' },
    { id: 'sch-002', name: 'Complexo Escolar de Quêssua', nome: 'Complexo Escolar de Quêssua' },
  ];

  const existingTurmas = ['Turma A', 'Turma B', 'Turma C'];

  describe('Validação de Chave Estrangeira de Estudante (Student FK)', () => {
    test('aprova estudante com escola e turma existentes no catálogo', () => {
      const student = {
        escola: 'Escola Modelo Central',
        turma: 'Turma A',
      };
      const result = ReferentialIntegrityService.validateStudentForeignKeys(
        student,
        existingSchools,
        existingTurmas
      );
      assert.equal(result.isValid, true);
      assert.equal(result.errors.length, 0);
    });

    test('rejeita estudante com escola inexistente (Prevenção de Órfão)', () => {
      const student = {
        escola: 'Escola Fantasma Desconhecida',
        turma: 'Turma A',
      };
      const result = ReferentialIntegrityService.validateStudentForeignKeys(
        student,
        existingSchools,
        existingTurmas
      );
      assert.equal(result.isValid, false);
      assert.equal(result.errors.length, 1);
      assert.match(result.errors[0].message, /Violação de Chave Estrangeira/);
      assert.equal(result.errors[0].field, 'schoolId');
    });

    test('rejeita estudante com turma inexistente na matriz', () => {
      const student = {
        escola: 'Escola Modelo Central',
        turma: 'Turma Z_Inexistente',
      };
      const result = ReferentialIntegrityService.validateStudentForeignKeys(
        student,
        existingSchools,
        existingTurmas
      );
      assert.equal(result.isValid, false);
      assert.equal(result.errors[0].field, 'turma');
    });
  });

  describe('Validação de Chave Estrangeira de Docente (Teacher FK)', () => {
    test('aprova docente vinculado a escola válida', () => {
      const teacher = { school: 'Complexo Escolar de Quêssua' };
      const result = ReferentialIntegrityService.validateTeacherForeignKeys(teacher, existingSchools);
      assert.equal(result.isValid, true);
    });

    test('rejeita docente sem vínculo escolar ou com escola inexistente', () => {
      const teacher = { school: 'Colégio Não Registado' };
      const result = ReferentialIntegrityService.validateTeacherForeignKeys(teacher, existingSchools);
      assert.equal(result.isValid, false);
      assert.match(result.errors[0].message, /não pode ser alocado na escola inexistente/);
    });
  });

  describe('Validação de Chave Estrangeira de Pautas e Notas (Grade FK)', () => {
    const registeredStudentIds = ['std-001', 'std-002', 'std-003'];

    test('aprova lançamento de nota para aluno matriculado na turma correta', () => {
      const grade = { studentId: 'std-001', turma: 'Turma A' };
      const result = ReferentialIntegrityService.validateGradeForeignKeys(
        grade,
        registeredStudentIds,
        existingTurmas
      );
      assert.equal(result.isValid, true);
    });

    test('rejeita nota atribuída a studentId que não existe no sistema escolar', () => {
      const grade = { studentId: 'std-999-fantasma', turma: 'Turma A' };
      const result = ReferentialIntegrityService.validateGradeForeignKeys(
        grade,
        registeredStudentIds,
        existingTurmas
      );
      assert.equal(result.isValid, false);
      assert.match(result.errors[0].message, /não está matriculado/);
    });
  });
});
