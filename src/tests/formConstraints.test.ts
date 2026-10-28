import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAngolaBI,
  validateAngolaPhone,
  validateEmail,
  validateGrade,
  validateFullName,
  validateBirthDate,
  validateTrimestre,
  sanitizeInput,
} from '../utils/formConstraints';

describe('TDD: Form Constraints & Input Sanitization (SSD)', () => {
  describe('Validação do Bilhete de Identidade (BI) de Angola', () => {
    test('aceita formato oficial válido de 14 caracteres (9 dígitos + 2 letras + 3 dígitos)', () => {
      const res = validateAngolaBI('008942125ME041');
      assert.equal(res.isValid, true);
      assert.equal(res.sanitizedValue, '008942125ME041');
    });

    test('aceita BI com espaços e formata para maiúsculas', () => {
      const res = validateAngolaBI(' 008942125me041 ');
      assert.equal(res.isValid, true);
      assert.equal(res.sanitizedValue, '008942125ME041');
    });

    test('rejeita BI com tamanho diferente de 14', () => {
      const res = validateAngolaBI('123456789');
      assert.equal(res.isValid, false);
      assert.match(res.error || '', /14 caracteres/);
    });

    test('rejeita BI com padrão numérico ou de letras inválido', () => {
      const res = validateAngolaBI('00894212512041'); // 14 dígitos sem letras de província
      assert.equal(res.isValid, false);
      assert.match(res.error || '', /Formato de BI inválido/);
    });
  });

  describe('Validação de Telefone de Angola', () => {
    test('aceita número com prefixo internacional +244 e 9 dígitos iniciados por 9', () => {
      const res = validateAngolaPhone('+244 923 000 000');
      assert.equal(res.isValid, true);
    });

    test('aceita número formato local 9XXXXXXXX', () => {
      const res = validateAngolaPhone('931552114');
      assert.equal(res.isValid, true);
    });

    test('rejeita número com operadora ou tamanho inválido', () => {
      const res = validateAngolaPhone('12345678');
      assert.equal(res.isValid, false);
    });
  });

  describe('Validação de Notas e Avaliações (Escala de 0 a 20 de Angola)', () => {
    test('aceita nota mínima 0.00 e arredonda', () => {
      const res = validateGrade(0);
      assert.equal(res.isValid, true);
      assert.equal(res.sanitizedValue, 0);
    });

    test('aceita nota máxima 20.00', () => {
      const res = validateGrade('20');
      assert.equal(res.isValid, true);
      assert.equal(res.sanitizedValue, 20);
    });

    test('aceita nota decimal com vírgula ou ponto', () => {
      const res = validateGrade('14,75');
      assert.equal(res.isValid, true);
      assert.equal(res.sanitizedValue, 14.75);
    });

    test('rejeita nota negativa menor que 0', () => {
      const res = validateGrade(-1);
      assert.equal(res.isValid, false);
      assert.match(res.error || '', /0.00 e 20.00/);
    });

    test('rejeita nota acima de 20', () => {
      const res = validateGrade(20.5);
      assert.equal(res.isValid, false);
      assert.match(res.error || '', /0.00 e 20.00/);
    });
  });

  describe('Validação de Nome Completo', () => {
    test('aceita nome e sobrenome válidos', () => {
      const res = validateFullName('António Manuel Quessua');
      assert.equal(res.isValid, true);
    });

    test('rejeita nome monossilábico sem sobrenome', () => {
      const res = validateFullName('Pedro');
      assert.equal(res.isValid, false);
      assert.match(res.error || '', /nome e o sobrenome/);
    });
  });

  describe('Validação de Trimestre Escolar', () => {
    test('aceita trimestres 1, 2 e 3', () => {
      assert.equal(validateTrimestre(1).isValid, true);
      assert.equal(validateTrimestre(2).isValid, true);
      assert.equal(validateTrimestre('3').isValid, true);
    });

    test('rejeita trimestre fora do intervalo', () => {
      assert.equal(validateTrimestre(4).isValid, false);
      assert.equal(validateTrimestre(0).isValid, false);
    });
  });

  describe('Sanitização SSD (Prevenção XSS / Injeção)', () => {
    test('remove tags html perigosas como <script>', () => {
      const sanitized = sanitizeInput('<script>alert("xss")</script>Pedro');
      assert.equal(sanitized.includes('<'), false);
      assert.equal(sanitized.includes('>'), false);
    });

    test('remove manipuladores de evento inline', () => {
      const sanitized = sanitizeInput('onload=steal() onload=evil()');
      assert.equal(sanitized.includes('onload='), false);
    });
  });
});
