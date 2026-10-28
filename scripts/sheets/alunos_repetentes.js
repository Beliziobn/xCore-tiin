import {
  fillInputPairs,
  FONT_FAMILY,
  COLOR_HEADER_FILL,
  COLOR_SUBTOTAL_FILL,
  COLOR_FORMULA_FILL,
  COLOR_NOTICE,
  borderThin,
  styleHeaderCell,
  styleSubtotalCell,
  styleFormulaCell,
  styleInputCell,
  styleLabelCell
} from '../sige_styles.js';

export function buildAlunosRepetentesSheet(workbook) {
  const ws = workbook.addWorksheet('5 - ALUNOS REPETENTES', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 6, showGridLines: true }]
  });

  ws.columns = [
    { width: 32 }, // A: Natureza / Subsistema
    { width: 24 }, // B: Nível / Classe
    { width: 14 }, // C: Total (MF)
    { width: 14 }, // D: Total (F)
    { width: 11 }, // E
    { width: 11 }, // F
    { width: 11 }, // G
    { width: 11 }, // H
    { width: 11 }, // I
    { width: 11 }, // J
    { width: 11 }, // K
    { width: 11 }, // L
    { width: 11 }, // M
    { width: 11 }, // N
    { width: 11 }, // O
    { width: 11 }, // P
    { width: 11 }, // Q
    { width: 11 }, // R
    { width: 11 }, // S
    { width: 11 }, // T
    { width: 11 }, // U
    { width: 11 }, // V
    { width: 11 }, // W
    { width: 11 }  // X
  ];

  // Section Header
  ws.mergeCells('A2:P2');
  const a2 = ws.getCell('A2');
  a2.value = 'SECÇÃO 5 - DADOS ESTATÍSTICOS SOBRE ALUNOS REPETENTES';
  a2.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLOR_HEADER_FILL } };
  a2.alignment = { vertical: 'middle', horizontal: 'left' };

  const naturezas = ['PÚBLICA', 'PÚBLICO-PRIVADA', 'PRIVADA'];
  let curRow = 4;

  // ==========================================
  // TABELA 5.1 – Classe de Iniciação Repetentes
  // ==========================================
  ws.getCell(`A${curRow}`).value = 'TABELA 5.1 – Alunos Repetentes na Classe de Iniciação (Pré-Escolar)';
  ws.getCell(`A${curRow}`).font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };
  curRow++;

  const h1Ini = curRow;
  const h2Ini = curRow + 1;
  ws.mergeCells(`A${h1Ini}:A${h2Ini}`);
  styleHeaderCell(ws.getCell(`A${h1Ini}`), 'NATUREZA DE ENSINO');
  ws.mergeCells(`B${h1Ini}:B${h2Ini}`);
  styleHeaderCell(ws.getCell(`B${h1Ini}`), 'CLASSE / ETAPA');
  ws.mergeCells(`C${h1Ini}:D${h1Ini}`);
  styleHeaderCell(ws.getCell(`C${h1Ini}`), 'TOTAL REPETENTES');
  styleHeaderCell(ws.getCell(`C${h2Ini}`), 'Total (MF)');
  styleHeaderCell(ws.getCell(`D${h2Ini}`), 'Total (F)');

  const iniAges = [
    { label: '5 Anos', mf: 'E', f: 'F' },
    { label: '6 Anos', mf: 'G', f: 'H' },
    { label: 'Mais de 6 Anos', mf: 'I', f: 'J' }
  ];

  iniAges.forEach(h => {
    ws.mergeCells(`${h.mf}${h1Ini}:${h.f}${h1Ini}`);
    styleHeaderCell(ws.getCell(`${h.mf}${h1Ini}`), h.label);
    styleHeaderCell(ws.getCell(`${h.mf}${h2Ini}`), 'MF');
    styleHeaderCell(ws.getCell(`${h.f}${h2Ini}`), 'F');
  });

  const iniColsMF = iniAges.map(a => a.mf);
  const iniColsF = iniAges.map(a => a.f);

  curRow = h2Ini + 1;
  const iniStartRow = curRow;

  naturezas.forEach(nat => {
    styleLabelCell(ws.getCell(`A${curRow}`), nat);
    styleLabelCell(ws.getCell(`B${curRow}`), 'Iniciação');

    fillInputPairs(ws, curRow, iniColsMF, iniColsF);
    const sumMF = iniColsMF.map(c => `${c}${curRow}`).join(',');
    const sumF = iniColsF.map(c => `${c}${curRow}`).join(',');
    styleFormulaCell(ws.getCell(`C${curRow}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${curRow}`), `SUM(${sumF})`);
    curRow++;
  });

  const totIniRow = curRow;
  styleSubtotalCell(ws.getCell(`A${totIniRow}`), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell(`B${totIniRow}`), 'INICIAÇÃO');
  ['C', 'D', ...iniColsMF, ...iniColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}${totIniRow}`), `SUM(${col}${iniStartRow}:${col}${totIniRow - 1})`, true);
  });
  curRow += 2;

  // ==========================================
  // TABELA 5.2 – Ensino Primário Regular Repetentes
  // ==========================================
  ws.getCell(`A${curRow}`).value = 'TABELA 5.2 – Alunos Repetentes no Ensino Primário Regular';
  ws.getCell(`A${curRow}`).font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };
  curRow++;

  const h1Prim = curRow;
  const h2Prim = curRow + 1;
  ws.mergeCells(`A${h1Prim}:A${h2Prim}`);
  styleHeaderCell(ws.getCell(`A${h1Prim}`), 'NATUREZA DE ENSINO');
  ws.mergeCells(`B${h1Prim}:B${h2Prim}`);
  styleHeaderCell(ws.getCell(`B${h1Prim}`), 'CLASSE');
  ws.mergeCells(`C${h1Prim}:D${h1Prim}`);
  styleHeaderCell(ws.getCell(`C${h1Prim}`), 'TOTAL REPETENTES');
  styleHeaderCell(ws.getCell(`C${h2Prim}`), 'Total (MF)');
  styleHeaderCell(ws.getCell(`D${h2Prim}`), 'Total (F)');

  const t21Ages = [
    { label: '6 Anos', mf: 'E', f: 'F' },
    { label: '7 Anos', mf: 'G', f: 'H' },
    { label: '8 Anos', mf: 'I', f: 'J' },
    { label: '9 Anos', mf: 'K', f: 'L' },
    { label: '10 Anos', mf: 'M', f: 'N' },
    { label: '11 Anos', mf: 'O', f: 'P' },
    { label: '12 Anos', mf: 'Q', f: 'R' },
    { label: '13 Anos', mf: 'S', f: 'T' },
    { label: 'Mais de 13 Anos', mf: 'U', f: 'V' }
  ];

  t21Ages.forEach(h => {
    ws.mergeCells(`${h.mf}${h1Prim}:${h.f}${h1Prim}`);
    styleHeaderCell(ws.getCell(`${h.mf}${h1Prim}`), h.label);
    styleHeaderCell(ws.getCell(`${h.mf}${h2Prim}`), 'MF');
    styleHeaderCell(ws.getCell(`${h.f}${h2Prim}`), 'F');
  });

  const t21ColsMF = t21Ages.map(a => a.mf);
  const t21ColsF = t21Ages.map(a => a.f);
  const classesPrimario = ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe', '6ª Classe'];

  curRow = h2Prim + 1;
  const primSubtotals = [];

  naturezas.forEach(nat => {
    const startNatRow = curRow;
    classesPrimario.forEach(cls => {
      styleLabelCell(ws.getCell(`A${curRow}`), curRow === startNatRow ? nat : '');
      styleLabelCell(ws.getCell(`B${curRow}`), cls);

      fillInputPairs(ws, curRow, t21ColsMF, t21ColsF);
      const sumMF = t21ColsMF.map(c => `${c}${curRow}`).join(',');
      const sumF = t21ColsF.map(c => `${c}${curRow}`).join(',');
      styleFormulaCell(ws.getCell(`C${curRow}`), `SUM(${sumMF})`);
      styleFormulaCell(ws.getCell(`D${curRow}`), `SUM(${sumF})`);
      curRow++;
    });

    ws.mergeCells(`A${startNatRow}:A${curRow - 1}`);
    ws.getCell(`A${startNatRow}`).alignment = { vertical: 'middle', horizontal: 'left' };

    const subRow = curRow;
    primSubtotals.push(subRow);
    styleSubtotalCell(ws.getCell(`A${subRow}`), 'SUBTOTAL');
    styleSubtotalCell(ws.getCell(`B${subRow}`), nat);
    ['C', 'D', ...t21ColsMF, ...t21ColsF].forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${subRow}`), `SUM(${col}${startNatRow}:${col}${curRow - 1})`, true);
    });
    curRow++;
  });

  // TOTAL PRIMARIO
  const totPrimRow = curRow;
  styleSubtotalCell(ws.getCell(`A${totPrimRow}`), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell(`B${totPrimRow}`), 'ENSINO PRIMÁRIO');
  ['C', 'D', ...t21ColsMF, ...t21ColsF].forEach(col => {
    const list = primSubtotals.map(r => `${col}${r}`).join(',');
    styleSubtotalCell(ws.getCell(`${col}${totPrimRow}`), `SUM(${list})`, true);
  });
  curRow += 2;

  // ==========================================
  // TABELA 5.3 – PRAEER (Aceleração Escolar) Repetentes
  // ==========================================
  ws.getCell(`A${curRow}`).value = 'TABELA 5.3 – Alunos Repetentes no PRAEER (Aceleração Escolar)';
  ws.getCell(`A${curRow}`).font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };
  curRow++;

  const h1Praeer = curRow;
  const h2Praeer = curRow + 1;
  ws.mergeCells(`A${h1Praeer}:A${h2Praeer}`);
  styleHeaderCell(ws.getCell(`A${h1Praeer}`), 'NATUREZA DE ENSINO');
  ws.mergeCells(`B${h1Praeer}:B${h2Praeer}`);
  styleHeaderCell(ws.getCell(`B${h1Praeer}`), 'ETAPA / MÓDULO');
  ws.mergeCells(`C${h1Praeer}:D${h1Praeer}`);
  styleHeaderCell(ws.getCell(`C${h1Praeer}`), 'TOTAL REPETENTES');
  styleHeaderCell(ws.getCell(`C${h2Praeer}`), 'Total (MF)');
  styleHeaderCell(ws.getCell(`D${h2Praeer}`), 'Total (F)');

  t21Ages.forEach(h => {
    ws.mergeCells(`${h.mf}${h1Praeer}:${h.f}${h1Praeer}`);
    styleHeaderCell(ws.getCell(`${h.mf}${h1Praeer}`), h.label);
    styleHeaderCell(ws.getCell(`${h.mf}${h2Praeer}`), 'MF');
    styleHeaderCell(ws.getCell(`${h.f}${h2Praeer}`), 'F');
  });

  const etapasPraeer = ['Etapa 1', 'Etapa 2', 'Etapa 3'];
  curRow = h2Praeer + 1;
  const praeerStartRow = curRow;

  naturezas.forEach(nat => {
    etapasPraeer.forEach(etp => {
      styleLabelCell(ws.getCell(`A${curRow}`), nat);
      styleLabelCell(ws.getCell(`B${curRow}`), etp);

      fillInputPairs(ws, curRow, t21ColsMF, t21ColsF);
      const sumMF = t21ColsMF.map(c => `${c}${curRow}`).join(',');
      const sumF = t21ColsF.map(c => `${c}${curRow}`).join(',');
      styleFormulaCell(ws.getCell(`C${curRow}`), `SUM(${sumMF})`);
      styleFormulaCell(ws.getCell(`D${curRow}`), `SUM(${sumF})`);
      curRow++;
    });
  });

  const totPraeerRow = curRow;
  styleSubtotalCell(ws.getCell(`A${totPraeerRow}`), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell(`B${totPraeerRow}`), 'PRAEER');
  ['C', 'D', ...t21ColsMF, ...t21ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}${totPraeerRow}`), `SUM(${col}${praeerStartRow}:${col}${totPraeerRow - 1})`, true);
  });
  curRow += 2;

  // ==========================================
  // TABELA 5.4 – Secundário I Ciclo (Geral e Técnico) Repetentes
  // ==========================================
  ws.getCell(`A${curRow}`).value = 'TABELA 5.4 – Alunos Repetentes no Ensino Secundário do I Ciclo (Geral e Técnico)';
  ws.getCell(`A${curRow}`).font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };
  curRow++;

  const h1Sec1 = curRow;
  const h2Sec1 = curRow + 1;
  ws.mergeCells(`A${h1Sec1}:A${h2Sec1}`);
  styleHeaderCell(ws.getCell(`A${h1Sec1}`), 'NATUREZA DE ENSINO');
  ws.mergeCells(`B${h1Sec1}:B${h2Sec1}`);
  styleHeaderCell(ws.getCell(`B${h1Sec1}`), 'CLASSE / SUBSISTEMA');
  ws.mergeCells(`C${h1Sec1}:D${h1Sec1}`);
  styleHeaderCell(ws.getCell(`C${h1Sec1}`), 'TOTAL REPETENTES');
  styleHeaderCell(ws.getCell(`C${h2Sec1}`), 'Total (MF)');
  styleHeaderCell(ws.getCell(`D${h2Sec1}`), 'Total (F)');

  const sec1Ages = [
    { label: '12 Anos', mf: 'E', f: 'F' },
    { label: '13 Anos', mf: 'G', f: 'H' },
    { label: '14 Anos', mf: 'I', f: 'J' },
    { label: '15 Anos', mf: 'K', f: 'L' },
    { label: '16 Anos', mf: 'M', f: 'N' },
    { label: '17 Anos', mf: 'O', f: 'P' },
    { label: '18 Anos', mf: 'Q', f: 'R' },
    { label: 'Mais de 18 Anos', mf: 'S', f: 'T' }
  ];

  sec1Ages.forEach(h => {
    ws.mergeCells(`${h.mf}${h1Sec1}:${h.f}${h1Sec1}`);
    styleHeaderCell(ws.getCell(`${h.mf}${h1Sec1}`), h.label);
    styleHeaderCell(ws.getCell(`${h.mf}${h2Sec1}`), 'MF');
    styleHeaderCell(ws.getCell(`${h.f}${h2Sec1}`), 'F');
  });

  const sec1ColsMF = sec1Ages.map(a => a.mf);
  const sec1ColsF = sec1Ages.map(a => a.f);
  const classesSec1 = [
    '7ª Classe (Geral)',
    '8ª Classe (Geral)',
    '9ª Classe (Geral)',
    '7ª Classe (Técnico)',
    '8ª Classe (Técnico)',
    '9ª Classe (Técnico)'
  ];

  curRow = h2Sec1 + 1;
  const sec1Subtotals = [];

  naturezas.forEach(nat => {
    const startNatRow = curRow;
    classesSec1.forEach(cls => {
      styleLabelCell(ws.getCell(`A${curRow}`), curRow === startNatRow ? nat : '');
      styleLabelCell(ws.getCell(`B${curRow}`), cls);

      fillInputPairs(ws, curRow, sec1ColsMF, sec1ColsF);
      const sumMF = sec1ColsMF.map(c => `${c}${curRow}`).join(',');
      const sumF = sec1ColsF.map(c => `${c}${curRow}`).join(',');
      styleFormulaCell(ws.getCell(`C${curRow}`), `SUM(${sumMF})`);
      styleFormulaCell(ws.getCell(`D${curRow}`), `SUM(${sumF})`);
      curRow++;
    });

    ws.mergeCells(`A${startNatRow}:A${curRow - 1}`);
    ws.getCell(`A${startNatRow}`).alignment = { vertical: 'middle', horizontal: 'left' };

    const subRow = curRow;
    sec1Subtotals.push(subRow);
    styleSubtotalCell(ws.getCell(`A${subRow}`), 'SUBTOTAL');
    styleSubtotalCell(ws.getCell(`B${subRow}`), nat);
    ['C', 'D', ...sec1ColsMF, ...sec1ColsF].forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${subRow}`), `SUM(${col}${startNatRow}:${col}${curRow - 1})`, true);
    });
    curRow++;
  });

  const totSec1Row = curRow;
  styleSubtotalCell(ws.getCell(`A${totSec1Row}`), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell(`B${totSec1Row}`), 'I CICLO');
  ['C', 'D', ...sec1ColsMF, ...sec1ColsF].forEach(col => {
    const list = sec1Subtotals.map(r => `${col}${r}`).join(',');
    styleSubtotalCell(ws.getCell(`${col}${totSec1Row}`), `SUM(${list})`, true);
  });
  curRow += 2;

  // ==========================================
  // TABELA 5.5 – Secundário II Ciclo (Geral, Técnico e Formação) Repetentes
  // ==========================================
  ws.getCell(`A${curRow}`).value = 'TABELA 5.5 – Alunos Repetentes no Ensino Secundário do II Ciclo (Geral, Técnico e Formação)';
  ws.getCell(`A${curRow}`).font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };
  curRow++;

  const h1Sec2 = curRow;
  const h2Sec2 = curRow + 1;
  ws.mergeCells(`A${h1Sec2}:A${h2Sec2}`);
  styleHeaderCell(ws.getCell(`A${h1Sec2}`), 'NATUREZA DE ENSINO');
  ws.mergeCells(`B${h1Sec2}:B${h2Sec2}`);
  styleHeaderCell(ws.getCell(`B${h1Sec2}`), 'CLASSE / SUBSISTEMA');
  ws.mergeCells(`C${h1Sec2}:D${h1Sec2}`);
  styleHeaderCell(ws.getCell(`C${h1Sec2}`), 'TOTAL REPETENTES');
  styleHeaderCell(ws.getCell(`C${h2Sec2}`), 'Total (MF)');
  styleHeaderCell(ws.getCell(`D${h2Sec2}`), 'Total (F)');

  const sec2Ages = [
    { label: 'Menos de 15 Anos', mf: 'E', f: 'F' },
    { label: '15 Anos', mf: 'G', f: 'H' },
    { label: '16 Anos', mf: 'I', f: 'J' },
    { label: '17 Anos', mf: 'K', f: 'L' },
    { label: '18 Anos', mf: 'M', f: 'N' },
    { label: '19 Anos', mf: 'O', f: 'P' },
    { label: '20 Anos', mf: 'Q', f: 'R' },
    { label: 'Mais de 20 Anos', mf: 'S', f: 'T' }
  ];

  sec2Ages.forEach(h => {
    ws.mergeCells(`${h.mf}${h1Sec2}:${h.f}${h1Sec2}`);
    styleHeaderCell(ws.getCell(`${h.mf}${h1Sec2}`), h.label);
    styleHeaderCell(ws.getCell(`${h.mf}${h2Sec2}`), 'MF');
    styleHeaderCell(ws.getCell(`${h.f}${h2Sec2}`), 'F');
  });

  const sec2ColsMF = sec2Ages.map(a => a.mf);
  const sec2ColsF = sec2Ages.map(a => a.f);
  const classesSec2 = [
    '10ª Classe (Geral)',
    '11ª Classe (Geral)',
    '12ª Classe (Geral)',
    '10ª Classe (Técnico)',
    '11ª Classe (Técnico)',
    '12ª Classe (Técnico)',
    '13ª Classe (Técnico)',
    '10ª Classe (Magistério)',
    '11ª Classe (Magistério)',
    '12ª Classe (Magistério)',
    '13ª Classe (Magistério)'
  ];

  curRow = h2Sec2 + 1;
  const sec2Subtotals = [];

  naturezas.forEach(nat => {
    const startNatRow = curRow;
    classesSec2.forEach(cls => {
      styleLabelCell(ws.getCell(`A${curRow}`), curRow === startNatRow ? nat : '');
      styleLabelCell(ws.getCell(`B${curRow}`), cls);

      fillInputPairs(ws, curRow, sec2ColsMF, sec2ColsF);
      const sumMF = sec2ColsMF.map(c => `${c}${curRow}`).join(',');
      const sumF = sec2ColsF.map(c => `${c}${curRow}`).join(',');
      styleFormulaCell(ws.getCell(`C${curRow}`), `SUM(${sumMF})`);
      styleFormulaCell(ws.getCell(`D${curRow}`), `SUM(${sumF})`);
      curRow++;
    });

    ws.mergeCells(`A${startNatRow}:A${curRow - 1}`);
    ws.getCell(`A${startNatRow}`).alignment = { vertical: 'middle', horizontal: 'left' };

    const subRow = curRow;
    sec2Subtotals.push(subRow);
    styleSubtotalCell(ws.getCell(`A${subRow}`), 'SUBTOTAL');
    styleSubtotalCell(ws.getCell(`B${subRow}`), nat);
    ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${subRow}`), `SUM(${col}${startNatRow}:${col}${curRow - 1})`, true);
    });
    curRow++;
  });

  const totSec2Row = curRow;
  styleSubtotalCell(ws.getCell(`A${totSec2Row}`), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell(`B${totSec2Row}`), 'II CICLO');
  ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
    const list = sec2Subtotals.map(r => `${col}${r}`).join(',');
    styleSubtotalCell(ws.getCell(`${col}${totSec2Row}`), `SUM(${list})`, true);
  });
  curRow += 2;

  // ==========================================
  // CONSOLIDADO FINAL DE REPETENTES
  // ==========================================
  const rConsol = curRow;
  ws.mergeCells(`A${rConsol}:D${rConsol}`);
  const cConsol = ws.getCell(`A${rConsol}`);
  cConsol.value = 'TOTAL DE ALUNOS REPETENTES - CONSOLIDADO';
  cConsol.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FFFFFF' } };
  cConsol.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_FILL } };
  cConsol.alignment = { vertical: 'middle', horizontal: 'center' };

  styleHeaderCell(ws.getCell(`A${rConsol + 1}`), 'NÍVEL DE ENSINO');
  styleHeaderCell(ws.getCell(`B${rConsol + 1}`), 'DISCRIMINAÇÃO');
  styleHeaderCell(ws.getCell(`C${rConsol + 1}`), 'TOTAL REPETENTES (MF)');
  styleHeaderCell(ws.getCell(`D${rConsol + 1}`), 'TOTAL REPETENTES (F)');

  const consolItems = [
    { level: 'Classe de Iniciação', row: totIniRow },
    { level: 'Ensino Primário Regular', row: totPrimRow },
    { level: 'PRAEER (Aceleração Escolar)', row: totPraeerRow },
    { level: 'Ensino Secundário I Ciclo', row: totSec1Row },
    { level: 'Ensino Secundário II Ciclo', row: totSec2Row }
  ];

  consolItems.forEach((it, idx) => {
    const r = rConsol + 2 + idx;
    styleLabelCell(ws.getCell(`A${r}`), it.level);
    styleLabelCell(ws.getCell(`B${r}`), 'Total Repetentes');
    styleFormulaCell(ws.getCell(`C${r}`), `C${it.row}`);
    styleFormulaCell(ws.getCell(`D${r}`), `D${it.row}`);
  });

  const rowFinal = rConsol + 2 + consolItems.length;
  styleSubtotalCell(ws.getCell(`A${rowFinal}`), 'TOTAL GERAL REPETENTES');
  styleSubtotalCell(ws.getCell(`B${rowFinal}`), 'MUNICÍPIO');
  styleSubtotalCell(ws.getCell(`C${rowFinal}`), `SUM(C${rConsol + 2}:C${rowFinal - 1})`, true);
  styleSubtotalCell(ws.getCell(`D${rowFinal}`), `SUM(D${rConsol + 2}:D${rowFinal - 1})`, true);

  return {
    totIniRow,
    totPrimRow,
    totPraeerRow,
    totSec1Row,
    totSec2Row,
    rowFinal
  };
}
