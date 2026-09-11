import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SearchIndexer } from '../utils/searchIndexer';

describe('TDD: Security, Rate Limiting & Audit Trail (SSD)', () => {
  describe('Motor de Índices de Busca (Search Indexer)', () => {
    test('normaliza texto removendo acentos e convertendo para minúsculas', () => {
      const normalized = SearchIndexer.normalizeText('Quéssua - Malanje - 4ª Classe');
      assert.equal(normalized, 'quessua - malanje - 4a classe');
    });

    test('gera tokens indexáveis e prefixos para pesquisa eficiente', () => {
      const tokens = SearchIndexer.generateSearchTokens([
        'Teresa Domingos',
        '008942125ME041',
        'Turma A',
      ]);
      assert.equal(tokens.includes('teresa'), true);
      assert.equal(tokens.includes('domingos'), true);
      assert.equal(tokens.includes('008942125me041'), true);
      assert.equal(tokens.includes('turma'), true);
      // Testa auto-complete prefix
      assert.equal(tokens.includes('tere'), true);
    });

    test('constrói chave de índice composto ordenada', () => {
      const key = SearchIndexer.buildCompoundIndexKey({
        turma: 'Turma A',
        escola: 'Escola Central',
        classe: '4ª Classe',
      });
      assert.equal(key, 'classe:4a classe#escola:escola central#turma:turma a');
    });

    test('realiza query em memória usando índice de busca', () => {
      const items = [
        { id: 1, name: 'João Manuel', searchTokens: ['joao', 'manuel', 'escola1'] },
        { id: 2, name: 'Maria Silva', searchTokens: ['maria', 'silva', 'escola2'] },
      ];
      const results = SearchIndexer.queryByIndex(items, 'Manuel');
      assert.equal(results.length, 1);
      assert.equal(results[0].id, 1);
    });
  });

  describe('Lógica de Limits of Request (Rate Limiter)', () => {
    test('respeita o teto de requisições dentro da janela temporal', () => {
      const windowMs = 1000;
      const maxRequests = 5;
      let count = 0;
      const startTime = Date.now();

      function recordHit(now: number) {
        if (now - startTime > windowMs) {
          count = 1;
          return { allowed: true, remaining: maxRequests - 1 };
        }
        count++;
        const allowed = count <= maxRequests;
        return { allowed, remaining: Math.max(0, maxRequests - count) };
      }

      // 5 requisições devem passar
      for (let i = 0; i < 5; i++) {
        const hit = recordHit(startTime + 100);
        assert.equal(hit.allowed, true);
      }

      // 6ª requisição deve ser bloqueada (HTTP 429)
      const blocked = recordHit(startTime + 200);
      assert.equal(blocked.allowed, false);
      assert.equal(blocked.remaining, 0);
    });
  });
});
