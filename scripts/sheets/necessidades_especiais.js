import {
  fillInputPairs,
  FONT_FAMILY,
  COLOR_HEADER_FILL,
  COLOR_SUBTOTAL_FILL,
  COLOR_FORMULA_FILL,
  borderThin,
  styleHeaderCell,
  styleSubtotalCell,
  styleFormulaCell,
  styleInputCell,
  styleLabelCell
} from '../sige_styles.js';

export function buildNecessidadesEspeciaisSheet(workbook) {
  const ws = workbook.addWorksheet('6 - NECESSIDADES EDUCATIVA ESPE', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 6, showGridLines: true }]
  });

  ws.columns = [
    { width: 28 }, // A: Nível / Natureza
    { width: 22 }, // B: Discriminação
    { width: 14 }, // C: Total (MF)
    { width: 14 }, // D: Total (F)
    { width: 13 }, // E: Visual (MF)
    { width: 13 }, // F: Visual (F)
    { width: 13 }, // G: Auditiva (MF)
    { width: 13 }, // H: Auditiva (F)
    { width: 13 }, // I: Físico-Motora (MF)
    { width: 13 }, // J: Físico-Motora (F)
    { width: 13 }, // K: Intelectual (MF)
    { width: 13 }, // L: Intelectual (F)
    { width: 13 }, // M: Espectro Autista (MF)
    { width: 13 }, // N: Espectro Autista (F)
    { width: 13 }, // O: Outras NEE (MF)
    { width: 13 }  // P: Outras NEE (F)
  ];

  // Section Header
  ws.mergeCells('A2:P2');
  const a2 = ws.getCell('A2');
  a2.value = 'SECÇÃO 6 - ALUNOS COM NECESSIDADES EDUCATIVAS ESPECIAIS (NEE)';
  a2.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLOR_HEADER_FILL } };
  a2.alignment = { vertical: 'middle', horizontal: 'left' };

  const naturezas = ['PÚBLICA', 'PÚBLICO-PRIVADA', 'PRIVADA'];
  const disColsMF = ['E', 'G', 'I', 'K', 'M', 'O'];
  const disColsF = ['F', 'H', 'J', 'L', 'N', 'P'];

  const disList = [
    { label: 'Visual', mf: 'E', f: 'F' },
    { label: 'Auditiva', mf: 'G', f: 'H' },
    { label: 'Físico-Motora', mf: 'I', f: 'J' },
    { label: 'Intelectual', mf: 'K', f: 'L' },
    { label: 'Espectro Autista', mf: 'M', f: 'N' },
    { label: 'Outras NEE', mf: 'O', f: 'P' }
  ];

  function setupNEETable(startRow, title, levelLabel) {
    ws.getCell(`A${startRow}`).value = title;
    ws.getCell(`A${startRow}`).font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };

    const h1 = startRow + 1;
    const h2 = startRow + 2;

    ws.mergeCells(`A${h1}:A${h2}`);
    styleHeaderCell(ws.getCell(`A${h1}`), 'NATUREZA DA ESCOLA');
    ws.mergeCells(`B${h1}:B${h2}`);
    styleHeaderCell(ws.getCell(`B${h1}`), 'NÍVEL / ETAPA');

    ws.mergeCells(`C${h1}:D${h1}`);
    styleHeaderCell(ws.getCell(`C${h1}`), 'TOTAL NEE');
    styleHeaderCell(ws.getCell(`C${h2}`), 'Total (MF)');
    styleHeaderCell(ws.getCell(`D${h2}`), 'Total (F)');

    disList.forEach(d => {
      ws.mergeCells(`${d.mf}${h1}:${d.f}${h1}`);
      styleHeaderCell(ws.getCell(`${d.mf}${h1}`), d.label);
      styleHeaderCell(ws.getCell(`${d.mf}${h2}`), 'MF');
      styleHeaderCell(ws.getCell(`${d.f}${h2}`), 'F');
    });

    const firstData = h2 + 1;
    let r = firstData;

    naturezas.forEach((nat, idx) => {
      styleLabelCell(ws.getCell(`A${r}`), nat);
      styleLabelCell(ws.getCell(`B${r}`), levelLabel);

      fillInputPairs(ws, r, disColsMF, disColsF);
      const sumMF = disColsMF.map(c => `${c}${r}`).join(',');
      const sumF = disColsF.map(c => `${c}${r}`).join(',');
      styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
      styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
      r++;
    });

    // Subtotal / Total da Tabela
    const totRow = r;
    styleSubtotalCell(ws.getCell(`A${totRow}`), 'TOTAL');
    styleSubtotalCell(ws.getCell(`B${totRow}`), levelLabel);
    ['C', 'D', ...disColsMF, ...disColsF].forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${totRow}`), `SUM(${col}${firstData}:${col}${totRow - 1})`, true);
    });

    return totRow;
  }

  const tables = [
    { title: 'TABELA 6.1 – NEE na Classe de Iniciação', level: 'Iniciação' },
    { title: 'TABELA 6.2 – NEE no Ensino Primário Regular', level: 'Ensino Primário' },
    { title: 'TABELA 6.3 – NEE no PRAEER', level: 'PRAEER' },
    { title: 'TABELA 6.4 – NEE na EJA - Ensino Primário', level: 'EJA Primário' },
    { title: 'TABELA 6.5 – NEE no I Ciclo Geral Regular', level: 'I Ciclo Geral' },
    { title: 'TABELA 6.6 – NEE no I Ciclo Técnico-Profissional', level: 'I Ciclo Técnico' },
    { title: 'TABELA 6.7 – NEE no I Ciclo EJA', level: 'I Ciclo EJA' },
    { title: 'TABELA 6.8 – NEE no II Ciclo Geral', level: 'II Ciclo Geral' },
    { title: 'TABELA 6.9 – NEE no II Ciclo Técnico-Profissional', level: 'II Ciclo Técnico' },
    { title: 'TABELA 6.10 – NEE no II Ciclo Formação de Professores', level: 'II Ciclo Magistério' }
  ];

  let nextRow = 4;
  const totalRowsRecorded = [];

  tables.forEach(t => {
    const endRow = setupNEETable(nextRow, t.title, t.level);
    totalRowsRecorded.push({ level: t.level, row: endRow });
    nextRow = endRow + 3;
  });

  // CONSOLIDADO NEE
  const rConsol = nextRow;
  ws.mergeCells(`A${rConsol}:D${rConsol}`);
  const cConsol = ws.getCell(`A${rConsol}`);
  cConsol.value = 'CONSOLIDADO GERAL DE ALUNOS COM NEE';
  cConsol.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FFFFFF' } };
  cConsol.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_FILL } };
  cConsol.alignment = { vertical: 'middle', horizontal: 'center' };

  styleHeaderCell(ws.getCell(`A${rConsol + 1}`), 'SUBSISTEMA / NÍVEL');
  styleHeaderCell(ws.getCell(`B${rConsol + 1}`), 'DISCRIMINAÇÃO');
  styleHeaderCell(ws.getCell(`C${rConsol + 1}`), 'TOTAL NEE (MF)');
  styleHeaderCell(ws.getCell(`D${rConsol + 1}`), 'TOTAL NEE (F)');

  totalRowsRecorded.forEach((tr, idx) => {
    const r = rConsol + 2 + idx;
    styleLabelCell(ws.getCell(`A${r}`), tr.level);
    styleLabelCell(ws.getCell(`B${r}`), 'Total Consolidado');
    styleFormulaCell(ws.getCell(`C${r}`), `C${tr.row}`);
    styleFormulaCell(ws.getCell(`D${r}`), `D${tr.row}`);
  });

  const rowFinal = rConsol + 2 + totalRowsRecorded.length;
  styleSubtotalCell(ws.getCell(`A${rowFinal}`), 'TOTAL GERAL NEE');
  styleSubtotalCell(ws.getCell(`B${rowFinal}`), 'TODOS OS NÍVEIS');
  styleSubtotalCell(ws.getCell(`C${rowFinal}`), `SUM(C${rConsol + 2}:C${rowFinal - 1})`, true);
  styleSubtotalCell(ws.getCell(`D${rowFinal}`), `SUM(D${rConsol + 2}:D${rowFinal - 1})`, true);
}
