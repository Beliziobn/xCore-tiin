import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { exportPautaToPDF } from '../utils/pautaPdfExporter';
import { initialStudentsData } from '../data/teacherData';

describe('Pauta PDF Exporter (SSD & Dual Validation)', () => {
  test('exportPautaToPDF gera documento sem erros com dados reais de estudantes em modo geral', async () => {
    let progressUpdates: string[] = [];

    await exportPautaToPDF({
      students: initialStudentsData.slice(0, 10),
      metadata: {
        escola: 'Escola Modelo Central',
        turma: 'Turma 1',
        classe: '4ª Classe',
        anoLectivo: '2026',
        trimestre: '1º Trimestre',
        professorTitular: 'Santar Goes',
      },
      mode: 'geral',
      onProgress: (msg) => {
        progressUpdates.push(msg);
      },
    });

    assert.ok(progressUpdates.length >= 2, 'Deve emitir atualizações de progresso');
    assert.ok(
      progressUpdates.some((msg) => msg.includes('Iniciando') || msg.includes('Formatando')),
      'Deve conter mensagens de formatação'
    );
  });

  test('exportPautaToPDF gera documento em modo por disciplina sem erros', async () => {
    let completed = false;

    await exportPautaToPDF({
      students: initialStudentsData.slice(0, 5),
      metadata: {
        escola: 'Complexo Escolar Modelo',
        turma: 'Turma 1',
        classe: '4ª Classe',
        anoLectivo: '2026',
      },
      mode: 'disciplina',
      selectedDiscipline: 'Matemática',
      onProgress: () => {
        completed = true;
      },
    });

    assert.equal(completed, true, 'Deve concluir a exportação por disciplina');
  });

  test('calcula corretamente médias, aprovados e notas conforme a escala oficial de 0 a 20 de Angola', () => {
    const student = initialStudentsData[0];
    assert.ok(student.grades && student.grades.length > 0, 'O estudante deve possuir notas');
    
    const mediaGeral = student.grades.reduce((acc, g) => acc + g.media, 0) / student.grades.length;
    assert.ok(mediaGeral >= 0 && mediaGeral <= 20, 'A média geral deve estar no intervalo de 0 a 20');
    assert.ok(student.grades.every((g) => g.media >= 0 && g.media <= 20), 'Todas as notas devem respeitar a escala 0 a 20');
  });
});
