import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { calculateHeadroom, compressPrompt } from '../lib/headroom';
import { taskObserver } from '../lib/taskObserver';

describe('Claude Code Setup, OmniRoute, Headroom, Claude-Mem & Task Observer', () => {
  describe('1. Verificação de Arquivos de Configuração do Claude Code', () => {
    test('CLAUDE.md existe e contém as diretrizes do projeto e regras do MED Angola', () => {
      const claudeMdPath = path.join(process.cwd(), 'CLAUDE.md');
      assert.ok(fs.existsSync(claudeMdPath), 'CLAUDE.md deve existir na raiz');
      const content = fs.readFileSync(claudeMdPath, 'utf8');
      assert.match(content, /uCore/);
      assert.match(content, /0 a 20 valores/);
      assert.match(content, /OmniRoute/);
      assert.match(content, /claude-mem/i);
      assert.match(content, /Headroom/i);
    });

    test('.claude/config.json e .claude/settings.json são válidos', () => {
      const configPath = path.join(process.cwd(), '.claude', 'config.json');
      const settingsPath = path.join(process.cwd(), '.claude', 'settings.json');
      assert.ok(fs.existsSync(configPath), '.claude/config.json deve existir');
      assert.ok(fs.existsSync(settingsPath), '.claude/settings.json deve existir');

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.equal(config.name, 'ucore-school-platform');
      assert.equal(config.aiIntegration.provider, 'omniroute');

      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      assert.ok(settings.mcpServers['claude-mem']);
      assert.ok(settings.mcpServers['omniroute']);
    });

    test('omniroute.config.json possui estratégia headroom-based configurada', () => {
      const omniPath = path.join(process.cwd(), 'omniroute.config.json');
      assert.ok(fs.existsSync(omniPath), 'omniroute.config.json deve existir');

      const omni = JSON.parse(fs.readFileSync(omniPath, 'utf8'));
      assert.equal(omni.routing.strategy, 'headroom-based');
      assert.equal(omni.routing.headroom.safetyMarginPercent, 25);
      assert.ok(omni.routing.tiers.fast);
      assert.ok(omni.routing.tiers.balanced);
    });

    test('claude-mem possui diretório de memórias persistentes inicializado', () => {
      const archPath = path.join(process.cwd(), '.claude', 'memories', 'architecture.md');
      const decisionsPath = path.join(process.cwd(), '.claude', 'memories', 'decisions.md');
      const indexPath = path.join(process.cwd(), '.claude', 'memories', 'index.json');

      assert.ok(fs.existsSync(archPath));
      assert.ok(fs.existsSync(decisionsPath));
      assert.ok(fs.existsSync(indexPath));
    });

    test('task-observer meta-skill e log persistente existem', () => {
      const skillPath = path.join(process.cwd(), '.claude', 'skills', 'task-observer.md');
      const logPath = path.join(process.cwd(), '.claude', 'skill-observations', 'log.md');

      assert.ok(fs.existsSync(skillPath));
      assert.ok(fs.existsSync(logPath));
      const logContent = fs.readFileSync(logPath, 'utf8');
      assert.match(logContent, /Task Observer/);
    });
  });

  describe('2. Algoritmo de Headroom e Token Optimization', () => {
    test('calcula status safe quando o headroom está acima da margem de segurança', () => {
      const metrics = calculateHeadroom(50000, 200000);
      assert.equal(metrics.headroomPercent, 75);
      assert.equal(metrics.status, 'safe');
      assert.equal(metrics.shouldCompress, false);
    });

    test('calcula status warning e recomenda compressão quando o headroom cai abaixo de 30%', () => {
      const metrics = calculateHeadroom(150000, 200000);
      assert.equal(metrics.headroomPercent, 25);
      assert.equal(metrics.status, 'warning');
      assert.equal(metrics.shouldCompress, true);
    });

    test('calcula status critical quando a janela atinge o limite crítico', () => {
      const metrics = calculateHeadroom(195000, 200000);
      assert.equal(metrics.status, 'critical');
      assert.equal(metrics.recommendedModelTier, 'fast');
    });

    test('compressPrompt reduz espaços e compacta stack traces longos', () => {
      const longText = `
        Erro detectado:
        \tat Module.load (/app/node_modules/pkg/index.js:1:1)
        \tat Module.compile (/app/node_modules/pkg/index.js:2:1)
        \tat Module.exec (/app/node_modules/pkg/index.js:3:1)
        \tat Module.run (/app/node_modules/pkg/index.js:4:1)
        \tat Module.start (/app/node_modules/pkg/index.js:5:1)
        \tat Object.<anonymous> (/app/index.js:10:1)
      `;
      const res = compressPrompt(longText);
      assert.ok(res.reductionPercent > 0);
      assert.match(res.compressedText, /frames ocultos/);
    });
  });

  describe('3. Task Observer Supervisor', () => {
    test('inicia, monitora e finaliza tarefas com estado consistente', () => {
      const taskId = `test-task-${Date.now()}`;
      const started = taskObserver.startTask(taskId, 'Lançamento de Pauta Trimestral');
      assert.equal(started.status, 'in_progress');

      const completed = taskObserver.completeTask(taskId, 'completed');
      assert.ok(completed);
      assert.equal(completed?.status, 'completed');
    });

    test('regista e recupera observações persistíveis', () => {
      const obs = taskObserver.recordObservation({
        component: 'Pautas',
        context: 'Lançamento de notas da 4ª classe',
        challengeOrCorrection: 'Garantir validação de 0 a 20',
        solution: 'Adição de check constraint no Postgres',
        ruleLearned: 'Notas sempre em 0-20',
      });

      assert.ok(obs.id.startsWith('obs-'));
      const list = taskObserver.getObservations();
      assert.ok(list.some((o) => o.id === obs.id));
    });
  });
});
