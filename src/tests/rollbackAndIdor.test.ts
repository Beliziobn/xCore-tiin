import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { RollbackManager } from '../services/rollbackManager';
import { IDORGuard, SecurityActor, TargetResource } from '../utils/idorGuard';
import {
  validateAngolaBI,
  validateAngolaPhone,
  validateGrade,
  validateTrimestre,
  validateFullName,
} from '../utils/formConstraints';

describe('TDD: Rollback Manager, IDOR Protection & Dual Validation (SSD)', () => {
  describe('Rollback Manager (Reversão de Estado Atómica)', () => {
    test('regista uma nova transação e armazena snapshots de estado', () => {
      const tx = RollbackManager.recordTransaction({
        entityType: 'student',
        entityId: 'std-test-101',
        action: 'UPDATE',
        description: 'Atualização de turma do estudante',
        authorId: 'admin-01',
        authorName: 'Super Administrador',
        previousState: { id: 'std-test-101', turma: 'Turma A', classe: '1ª Classe' },
        newState: { id: 'std-test-101', turma: 'Turma B', classe: '1ª Classe' },
      });

      assert.ok(tx.id.startsWith('tx-'));
      assert.equal(tx.entityType, 'student');
      assert.equal(tx.entityId, 'std-test-101');
      assert.equal(tx.rolledBack, false);
      assert.equal(tx.previousState.turma, 'Turma A');
      assert.equal(tx.newState.turma, 'Turma B');
    });

    test('recupera transações da lista', () => {
      const list = RollbackManager.getTransactions();
      assert.ok(list.length > 0);
      assert.ok(list.some((t) => t.entityId === 'std-test-101'));
    });

    test('executa o rollback com sucesso restaurando estado anterior', () => {
      const tx = RollbackManager.recordTransaction({
        entityType: 'student',
        entityId: 'std-rollback-test',
        action: 'UPDATE',
        description: 'Teste de reversão',
        authorId: 'admin-01',
        authorName: 'Administrador',
        previousState: { id: 'std-rollback-test', nomeCompleto: 'Nome Antigo' },
        newState: { id: 'std-rollback-test', nomeCompleto: 'Nome Novo' },
      });

      const res = RollbackManager.rollback(tx.id, {
        id: 'admin-01',
        name: 'Super Administrador',
        role: 'admin',
      });

      assert.equal(res.success, true);
      assert.equal(res.transactionId, tx.id);

      // Tentar reverter novamente deve falhar (idempotência contra replay)
      const resDouble = RollbackManager.rollback(tx.id, {
        id: 'admin-01',
        name: 'Super Administrador',
        role: 'admin',
      });
      assert.equal(resDouble.success, false);
      assert.match(resDouble.message, /já foi revertida/);
    });
  });

  describe('IDOR Guard (Proteção contra Insecure Direct Object References)', () => {
    test('Super Administrador tem acesso irrestrito a qualquer recurso', () => {
      const adminActor: SecurityActor = {
        id: 'usr-admin',
        name: 'Administrador Geral',
        role: 'admin',
      };
      const anyTarget: TargetResource = {
        type: 'student',
        id: 'std-999',
        schoolId: 'Escola Qualquer',
      };

      const result = IDORGuard.verifyAccess(adminActor, anyTarget, 'READ');
      assert.equal(result.allowed, true);
    });

    test('Estudante não pode aceder a registos de outro estudante (IDOR Bloqueado)', () => {
      const studentActor: SecurityActor = {
        id: 'usr-std-1',
        studentId: 'std-1',
        name: 'Estudante João',
        role: 'estudante',
      };
      const otherStudentTarget: TargetResource = {
        type: 'student',
        id: 'std-2',
        studentId: 'std-2',
        schoolId: 'Escola Central',
      };

      const result = IDORGuard.verifyAccess(studentActor, otherStudentTarget, 'READ');
      assert.equal(result.allowed, false);
      assert.equal(result.violationType, 'UNAUTHORIZED_CROSS_STUDENT');
    });

    test('Estudante pode aceder ao seu próprio registo', () => {
      const studentActor: SecurityActor = {
        id: 'usr-std-1',
        studentId: 'std-1',
        name: 'Estudante João',
        role: 'estudante',
      };
      const ownTarget: TargetResource = {
        type: 'student',
        id: 'std-1',
        studentId: 'std-1',
        schoolId: 'Escola Central',
      };

      const result = IDORGuard.verifyAccess(studentActor, ownTarget, 'READ');
      assert.equal(result.allowed, true);
    });

    test('Estudante não pode modificar dados cadastrais (Write Negado)', () => {
      const studentActor: SecurityActor = {
        id: 'usr-std-1',
        studentId: 'std-1',
        name: 'Estudante João',
        role: 'estudante',
      };
      const ownTarget: TargetResource = {
        type: 'student',
        id: 'std-1',
        studentId: 'std-1',
      };

      const result = IDORGuard.verifyAccess(studentActor, ownTarget, 'WRITE');
      assert.equal(result.allowed, false);
      assert.equal(result.violationType, 'ROLE_PRIVILEGE_MISMATCH');
    });

    test('Diretor de uma escola não pode aceder a registos de outra escola (IDOR Inter-Institucional)', () => {
      const directorActor: SecurityActor = {
        id: 'dir-01',
        name: 'Diretor Silva',
        role: 'diretor',
        schoolName: 'Complexo Escolar Quêssua',
      };
      const foreignSchoolTarget: TargetResource = {
        type: 'student',
        id: 'std-450',
        schoolName: 'Escola Primária Nº 1024 - Quêssua',
      };

      const result = IDORGuard.verifyAccess(directorActor, foreignSchoolTarget, 'READ');
      assert.equal(result.allowed, false);
      assert.equal(result.violationType, 'UNAUTHORIZED_CROSS_SCHOOL');
    });

    test('Diretor acede livremente a registos da sua própria instituição', () => {
      const directorActor: SecurityActor = {
        id: 'dir-01',
        name: 'Diretor Silva',
        role: 'diretor',
        schoolName: 'Complexo Escolar Quêssua',
      };
      const ownSchoolTarget: TargetResource = {
        type: 'student',
        id: 'std-120',
        schoolName: 'Complexo Escolar Quêssua',
      };

      const result = IDORGuard.verifyAccess(directorActor, ownSchoolTarget, 'READ');
      assert.equal(result.allowed, true);
    });

    test('Visitante não autenticado tem acesso estritamente negado a recursos privados', () => {
      const visitorActor: SecurityActor = {
        id: 'anon-01',
        name: 'Anónimo',
        role: 'visitante',
      };
      const privateTarget: TargetResource = {
        type: 'student',
        id: 'std-120',
      };

      const result = IDORGuard.verifyAccess(visitorActor, privateTarget, 'READ');
      assert.equal(result.allowed, false);
      assert.equal(result.violationType, 'PUBLIC_DENIED');
    });
  });

  describe('Dual Validation Parity (Regras de Validação Síncronas)', () => {
    test('validação de BI Angolano é rigorosa (14 carateres: 9 dígitos + 2 letras + 3 dígitos)', () => {
      assert.equal(validateAngolaBI('008942125ME041').isValid, true);
      assert.equal(validateAngolaBI('123456').isValid, false);
      assert.equal(validateAngolaBI('00894212512345').isValid, false); // sem letras provinciais
    });

    test('validação de Nota escolar (escala oficial de Angola: 0 a 20 valores)', () => {
      assert.equal(validateGrade(14.5).isValid, true);
      assert.equal(validateGrade(0).isValid, true);
      assert.equal(validateGrade(20).isValid, true);
      assert.equal(validateGrade(20.5).isValid, false); // acima do limite
      assert.equal(validateGrade(-1).isValid, false); // abaixo de zero
      assert.equal(validateGrade('abc').isValid, false);
    });

    test('validação de Trimestre Escolar (1, 2 ou 3)', () => {
      assert.equal(validateTrimestre(1).isValid, true);
      assert.equal(validateTrimestre(2).isValid, true);
      assert.equal(validateTrimestre(3).isValid, true);
      assert.equal(validateTrimestre(4).isValid, false);
    });

    test('validação de Nome Completo exige pelo menos dois termos', () => {
      assert.equal(validateFullName('Teresa Manuel').isValid, true);
      assert.equal(validateFullName('Teresa').isValid, false);
    });
  });
});
