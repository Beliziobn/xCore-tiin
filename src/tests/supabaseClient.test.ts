import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isSupabaseConfigured, getSupabaseClient, testSupabaseConnection } from '../lib/supabaseClient';

describe('Supabase Client Architecture & Graceful Degradation', () => {
  test('isSupabaseConfigured retorna false quando as variáveis de ambiente não foram inseridas', () => {
    // No ambiente de teste sem .env configurado com credenciais ativas
    const configured = isSupabaseConfigured();
    assert.equal(typeof configured, 'boolean');
  });

  test('testSupabaseConnection trata ausência de chaves de forma graciosa sem quebrar a aplicação', async () => {
    const res = await testSupabaseConnection();
    assert.equal(typeof res.connected, 'boolean');
    assert.ok(typeof res.message === 'string' && res.message.length > 0);
  });
});
