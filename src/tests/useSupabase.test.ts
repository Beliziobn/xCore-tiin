import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatSupabaseError } from '../hooks/useSupabase';

describe('useSupabase Hook & Error Handler Architecture', () => {
  describe('Formatação Inteligente de Erros do Supabase / PostgreSQL', () => {
    test('formata erro de chave duplicada (código 23505)', () => {
      const err = {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
        details: 'Key (bi_number)=(008941215LA041) already exists.',
      };
      const formatted = formatSupabaseError(err);
      assert.match(formatted, /Registo duplicado/);
      assert.match(formatted, /008941215LA041/);
    });

    test('formata violação de integridade referencial (código 23503)', () => {
      const err = {
        code: '23503',
        message: 'foreign key constraint failed',
        details: 'Key (turma_id)=(xyz) is not present in table turmas.',
      };
      const formatted = formatSupabaseError(err);
      assert.match(formatted, /integridade referencial/);
      assert.match(formatted, /não existe/);
    });

    test('formata restrição de segurança RLS / Acesso negado (código 42501)', () => {
      const err = {
        code: '42501',
        message: 'permission denied for table student_grades',
      };
      const formatted = formatSupabaseError(err);
      assert.match(formatted, /Acesso negado/);
      assert.match(formatted, /RLS/);
    });

    test('trata erros de conexão e falha de rede (NetworkError / Failed to fetch)', () => {
      const err = new Error('Failed to fetch from https://xyz.supabase.co');
      const formatted = formatSupabaseError(err);
      assert.match(formatted, /Falha de conexão com os servidores do Supabase/);
    });

    test('trata erros genéricos ou nulos sem lançar exceções', () => {
      assert.equal(typeof formatSupabaseError(null), 'string');
      assert.equal(typeof formatSupabaseError(undefined), 'string');
      assert.equal(formatSupabaseError('Erro arbitrário'), 'Erro arbitrário');
    });
  });
});
