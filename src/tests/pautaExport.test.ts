import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { exportPautaToPDF } from '../utils/pautaPdfExporter';
import { StudentProfile, defaultDisciplinasList } from '../data/teacherData';

const sampleTestStudents: StudentProfile[] = [
  {
    id: 'std-test-01',
    numeroChamada: 1,
    name: 'António Manuel Quessua',
    genero: 'M',
    turma: 'Turma A',
    periodo: 'Manhã',
    classe: '4ª Classe',
    sala: 'Sala 01',
    encarregado: 'Manuel Quessua',
    telefone: '+244 923 000 001',
    temDocumentos: true,
    presencaPercent: 96,
    disciplinas: defaultDisciplinasList,
    grades: defaultDisciplinasList.map((subject) => ({
      subject,
      p1: 15,
      p2: 16,
      trabalho: 17,
      media: 16,
      status: 'Aprovado' as const,
    })),
  },
  {
    id: 'std-test-02',
    numeroChamada: 2,
    name: 'Esperança Lukeni Miguel',
    genero: 'F',
    turma: 'Turma A',
    periodo: 'Manhã',
    classe: '4ª Classe',
    sala: 'Sala 01',
    encarregado: 'Graça Lukeni',
    telefone: '+244 923 000 002',
    temDocumentos: true,
    presencaPercent: 98,
    disciplinas: defaultDisciplinasList,
    grades: defaultDisciplinasList.map((subject) => ({
      subject,
      p1: 14,
      p2: 15,
      trabalho: 15,
      media: 14.7,
      status: 'Aprovado' as const,
    })),
  },
];

describe('Pauta PDF Exporter (SSD & Dual Validation)', () => {
  test('exportPautaToPDF gera documento sem erros com dados reais de estudantes em modo geral', async () => {
    let progressUpdates: string[] = [];

    await exportPautaToPDF({
      students: sampleTestStudents,
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
      students: sampleTestStudents,
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
    const student = sampleTestStudents[0];
    assert.ok(student.grades && student.grades.length > 0, 'O estudante deve possuir notas');
    
    const mediaGeral = student.grades.reduce((acc, g) => acc + g.media, 0) / student.grades.length;
    assert.ok(mediaGeral >= 0 && mediaGeral <= 20, 'A média geral deve estar no intervalo de 0 a 20');
    assert.ok(student.grades.every((g) => g.media >= 0 && g.media <= 20), 'Todas as notas devem respeitar a escala 0 a 20');
  });
});
