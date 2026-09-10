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

export function buildAlunosMatriculadosSheet(workbook) {
  const ws = workbook.addWorksheet('1 - ALUNOS MATRICULADOS', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 9, showGridLines: true }]
  });

  // Set standard column widths
  ws.columns = [
    { width: 30 }, // A: Etapa / Natureza
    { width: 22 }, // B: Natureza / Subsistema
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
    { width: 11 }, // X
    { width: 11 }, // Y
    { width: 24 }  // Z: Observações
  ];

  // Section Header
  ws.mergeCells('A2:P2');
  const a2 = ws.getCell('A2');
  a2.value = 'SECÇÃO 1 - DADOS ESTATÍSTICOS SOBRE ALUNOS MATRICULADOS';
  a2.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLOR_HEADER_FILL } };
  a2.alignment = { vertical: 'middle', horizontal: 'left' };

  // 1. EDUCAÇÃO PRÉ-ESCOLAR
  ws.getCell('A5').value = '1. EDUCAÇÃO PRÉ-ESCOLAR';
  ws.getCell('A5').font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: '000000' } };

  ws.getCell('A6').value = 'TABELA 1.1 – Crianças matriculadas nas Creches, Jardins de Infância, Centros Infantis, Centros Infantis Comunitários e Centros de Educação Comunitária';
  ws.getCell('A6').font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };

  // Headers (Row 8 & 9)
  ws.mergeCells('A8:A9');
  styleHeaderCell(ws.getCell('A8'), 'ETAPA');
  ws.mergeCells('B8:B9');
  styleHeaderCell(ws.getCell('B8'), 'NATUREZA DE ENSINO');
  
  ws.mergeCells('C8:D8');
  styleHeaderCell(ws.getCell('C8'), 'TOTAL');
  styleHeaderCell(ws.getCell('C9'), 'Total (MF)');
  styleHeaderCell(ws.getCell('D9'), 'Total (F)');

  const t11AgeHeaders = [
    { label: '3 Meses aos 3 anos', colMF: 'E', colF: 'F' },
    { label: '3 Anos', colMF: 'G', colF: 'H' },
    { label: '4 Anos', colMF: 'I', colF: 'J' },
    { label: '5 Anos', colMF: 'K', colF: 'L' },
    { label: '6 Anos', colMF: 'M', colF: 'N' },
    { label: 'Mais de 6 Anos', colMF: 'O', colF: 'P' }
  ];

  t11AgeHeaders.forEach(h => {
    ws.mergeCells(`${h.colMF}8:${h.colF}8`);
    styleHeaderCell(ws.getCell(`${h.colMF}8`), h.label);
    styleHeaderCell(ws.getCell(`${h.colMF}9`), 'MF');
    styleHeaderCell(ws.getCell(`${h.colF}9`), 'F');
  });

  ws.mergeCells('R8:R9');
  styleHeaderCell(ws.getCell('R8'), 'OBSERVAÇÕES');

  // Table 1.1 Data Rows (10 to 27)
  const t11Stages = [
    { name: 'CRECHE', rows: [10, 11, 12] },
    { name: 'JARDIM DE INFANCIA1', rows: [13, 14, 15] },
    { name: 'JARDIM DE INFANCIA2', rows: [16, 17, 18] },
    { name: 'CENTROS INFANTIS', rows: [19, 20, 21] },
    { name: 'CENTROS INFANTIS COMUNITÁRIOS', rows: [22, 23, 24] },
    { name: 'CENTROS DE EDUCAÇÃO COMUNITÁRIA', rows: [25, 26, 27] }
  ];

  const naturezas = ['PÚBLICA', 'PÚBLICO-PRIVADA', 'PRIVADA'];
  const ageColsMF = ['E', 'G', 'I', 'K', 'M', 'O'];
  const ageColsF = ['F', 'H', 'J', 'L', 'N', 'P'];

  t11Stages.forEach(stg => {
    stg.rows.forEach((r, idx) => {
      styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? stg.name : '');
      styleLabelCell(ws.getCell(`B${r}`), naturezas[idx]);

      // Inputs for ages init with 0
      fillInputPairs(ws, r, ageColsMF, ageColsF);

      // Formulas for C and D
      const sumMF = ageColsMF.map(c => `${c}${r}`).join(',');
      const sumF = ageColsF.map(c => `${c}${r}`).join(',');
      styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
      styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
      styleLabelCell(ws.getCell(`R${r}`), '');
    });
  });

  // Merge vertical stage labels
  t11Stages.forEach(stg => {
    ws.mergeCells(`A${stg.rows[0]}:A${stg.rows[2]}`);
    ws.getCell(`A${stg.rows[0]}`).alignment = { vertical: 'middle', horizontal: 'left' };
  });

  // Table 1.1 Totals (Rows 28 to 31)
  const t11PublicRows = [10, 13, 16, 19, 22, 25];
  const t11PubPrivRows = [11, 14, 17, 20, 23, 26];
  const t11PrivRows = [12, 15, 18, 21, 24, 27];

  // 28: TOTAL PÚBLICA
  styleSubtotalCell(ws.getCell('A28'), 'TOTAL');
  styleSubtotalCell(ws.getCell('B28'), 'PÚBLICA');
  ['C', 'D', ...ageColsMF, ...ageColsF].forEach(col => {
    const list = t11PublicRows.map(r => `${col}${r}`).join(',');
    styleSubtotalCell(ws.getCell(`${col}28`), `SUM(${list})`, true);
  });

  // 29: TOTAL PÚBLICO-PRIVADA
  styleSubtotalCell(ws.getCell('A29'), 'TOTAL');
  styleSubtotalCell(ws.getCell('B29'), 'PÚBLICO-PRIVADA');
  ['C', 'D', ...ageColsMF, ...ageColsF].forEach(col => {
    const list = t11PubPrivRows.map(r => `${col}${r}`).join(',');
    styleSubtotalCell(ws.getCell(`${col}29`), `SUM(${list})`, true);
  });

  // 30: TOTAL PRIVADA
  styleSubtotalCell(ws.getCell('A30'), 'TOTAL');
  styleSubtotalCell(ws.getCell('B30'), 'PRIVADA');
  ['C', 'D', ...ageColsMF, ...ageColsF].forEach(col => {
    const list = t11PrivRows.map(r => `${col}${r}`).join(',');
    styleSubtotalCell(ws.getCell(`${col}30`), `SUM(${list})`, true);
  });

  // 31: TOTAL GERAL
  styleSubtotalCell(ws.getCell('A31'), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell('B31'), 'TODAS');
  ['C', 'D', ...ageColsMF, ...ageColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}31`), `SUM(${col}28:${col}30)`, true);
  });

  // ==========================================
  // TABELA 1.2 – Alunos matriculados na Classe de Iniciação nas escolas
  // ==========================================
  ws.getCell('A34').value = 'TABELA 1.2 – Alunos matriculados na Classe de Iniciação nas escolas';
  ws.getCell('A34').font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };

  // Headers (Row 35 & 36)
  ws.mergeCells('A35:A36');
  styleHeaderCell(ws.getCell('A35'), 'CLASSE');
  ws.mergeCells('B35:B36');
  styleHeaderCell(ws.getCell('B35'), 'NATUREZA DE ENSINO');
  ws.mergeCells('C35:D35');
  styleHeaderCell(ws.getCell('C35'), 'TOTAL');
  styleHeaderCell(ws.getCell('C36'), 'Total (MF)');
  styleHeaderCell(ws.getCell('D36'), 'Total (F)');

  const t12Ages = [
    { label: '5 Anos', mf: 'E', f: 'F' },
    { label: '6 Anos', mf: 'G', f: 'H' },
    { label: '7 Anos', mf: 'I', f: 'J' },
    { label: '8 Anos', mf: 'K', f: 'L' },
    { label: '9 Anos', mf: 'M', f: 'N' },
    { label: '10 Anos', mf: 'O', f: 'P' },
    { label: '11 Anos', mf: 'Q', f: 'R' },
    { label: '12 Anos', mf: 'S', f: 'T' },
    { label: '13 Anos', mf: 'U', f: 'V' },
    { label: 'Mais de 13 Anos', mf: 'W', f: 'X' }
  ];

  t12Ages.forEach(h => {
    ws.mergeCells(`${h.mf}35:${h.f}35`);
    styleHeaderCell(ws.getCell(`${h.mf}35`), h.label);
    styleHeaderCell(ws.getCell(`${h.mf}36`), 'MF');
    styleHeaderCell(ws.getCell(`${h.f}36`), 'F');
  });

  const t12ColsMF = t12Ages.map(a => a.mf);
  const t12ColsF = t12Ages.map(a => a.f);

  // Rows 37-39
  naturezas.forEach((nat, idx) => {
    const r = 37 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'INICIAÇÃO' : '');
    styleLabelCell(ws.getCell(`B${r}`), nat);
    fillInputPairs(ws, r, t12ColsMF, t12ColsF);

    const sumMF = t12ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = t12ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A37:A39');
  ws.getCell('A37').alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 40: Total Iniciação
  styleSubtotalCell(ws.getCell('A40'), 'TOTAL');
  styleSubtotalCell(ws.getCell('B40'), 'TODAS');
  ['C', 'D', ...t12ColsMF, ...t12ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}40`), `SUM(${col}37:${col}39)`, true);
  });

  // ==========================================
  // TABELA 1.3 – Alunos com deficiência em escolas específicas de Ensino Especial (Sensorial / Iniciação)
  // ==========================================
  ws.getCell('A42').value = 'TABELA 1.3 – Alunos com deficiência em escolas específicas de Ensino Especial (Sensorial / Iniciação)';
  ws.getCell('A42').font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };

  ws.mergeCells('A44:A45');
  styleHeaderCell(ws.getCell('A44'), 'ETAPA');
  ws.mergeCells('B44:B45');
  styleHeaderCell(ws.getCell('B44'), 'NATUREZA DE ENSINO');
  ws.mergeCells('C44:D44');
  styleHeaderCell(ws.getCell('C44'), 'TOTAL');
  styleHeaderCell(ws.getCell('C45'), 'Total (MF)');
  styleHeaderCell(ws.getCell('D45'), 'Total (F)');

  const disabList = [
    { label: 'Auditiva', mf: 'E', f: 'F' },
    { label: 'Intelectual', mf: 'G', f: 'H' },
    { label: 'Visual', mf: 'I', f: 'J' },
    { label: 'Surdo-Cegueira', mf: 'K', f: 'L' },
    { label: 'Múltipla', mf: 'M', f: 'N' },
    { label: 'Físico Motora', mf: 'O', f: 'P' },
    { label: 'Espectro-Autista', mf: 'Q', f: 'R' },
    { label: 'Altas Habilidades', mf: 'S', f: 'T' }
  ];

  disabList.forEach(d => {
    ws.mergeCells(`${d.mf}44:${d.f}44`);
    styleHeaderCell(ws.getCell(`${d.mf}44`), d.label);
    styleHeaderCell(ws.getCell(`${d.mf}45`), 'MF');
    styleHeaderCell(ws.getCell(`${d.f}45`), 'F');
  });

  const disColsMF = disabList.map(d => d.mf);
  const disColsF = disabList.map(d => d.f);

  naturezas.forEach((nat, idx) => {
    const r = 46 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'EDUCAÇÃO ESPECIAL' : '');
    styleLabelCell(ws.getCell(`B${r}`), nat);
    fillInputPairs(ws, r, disColsMF, disColsF);
    const sumMF = disColsMF.map(c => `${c}${r}`).join(',');
    const sumF = disColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A46:A48');
  ws.getCell('A46').alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 49: Total
  styleSubtotalCell(ws.getCell('A49'), 'TOTAL');
  styleSubtotalCell(ws.getCell('B49'), 'TODAS');
  ['C', 'D', ...disColsMF, ...disColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}49`), `SUM(${col}46:${col}48)`, true);
  });

  // ==========================================
  // 2. ENSINO PRIMÁRIO
  // ==========================================
  ws.getCell('A57').value = '2. ENSINO PRIMÁRIO';
  ws.getCell('A57').font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: '000000' } };

  ws.getCell('A58').value = 'TABELA 2.1 – Alunos Matriculados no Ensino Primário Regular';
  ws.getCell('A58').font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };

  ws.getCell('A59').value = 'ATENÇÃO: NÃO DEVEM ESTAR SOMADOS OS DADOS DE PRAEER, EJA NEM EDUCAÇÃO ESPECIAL';
  ws.getCell('A59').font = { name: FONT_FAMILY, size: 9, italic: true, bold: true, color: { argb: COLOR_NOTICE } };

  // Headers (Row 60 & 61)
  ws.mergeCells('A60:A61');
  styleHeaderCell(ws.getCell('A60'), 'NATUREZA DE ENSINO');
  ws.mergeCells('B60:B61');
  styleHeaderCell(ws.getCell('B60'), 'SUBSISTEMA');
  ws.mergeCells('C60:C61');
  styleHeaderCell(ws.getCell('C60'), 'CLASSE');

  ws.mergeCells('D60:E60');
  styleHeaderCell(ws.getCell('D60'), 'TOTAL');
  styleHeaderCell(ws.getCell('D61'), 'Total (MF)');
  styleHeaderCell(ws.getCell('E61'), 'Total (F)');

  const t21Ages = [
    { label: '5 Anos', mf: 'F', f: 'G' },
    { label: '6 Anos', mf: 'H', f: 'I' },
    { label: '7 Anos', mf: 'J', f: 'K' },
    { label: '8 Anos', mf: 'L', f: 'M' },
    { label: '9 Anos', mf: 'N', f: 'O' },
    { label: '10 Anos', mf: 'P', f: 'Q' },
    { label: '11 Anos', mf: 'R', f: 'S' },
    { label: '12 Anos', mf: 'T', f: 'U' },
    { label: '13 Anos', mf: 'V', f: 'W' },
    { label: 'Mais de 13 Anos', mf: 'X', f: 'Y' }
  ];

  t21Ages.forEach(h => {
    ws.mergeCells(`${h.mf}60:${h.f}61`);
    styleHeaderCell(ws.getCell(`${h.mf}60`), h.label);
  });

  const t21ColsMF = t21Ages.map(a => a.mf);
  const t21ColsF = t21Ages.map(a => a.f);

  const classesPrimario = ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe', '6ª Classe'];

  // PÚBLICA (Rows 62-67, Subtotal 68)
  classesPrimario.forEach((cls, idx) => {
    const r = 62 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICA' : '');
    styleLabelCell(ws.getCell(`B${r}`), 'Ensino Primário');
    styleLabelCell(ws.getCell(`C${r}`), cls);

    fillInputPairs(ws, r, t21ColsMF, t21ColsF);
    const sumMF = t21ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = t21ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`E${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A62:A67');
  ws.getCell('A62').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A68'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B68'), 'PÚBLICA');
  styleSubtotalCell(ws.getCell('C68'), '1ª a 6ª');
  ['D', 'E', ...t21ColsMF, ...t21ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}68`), `SUM(${col}62:${col}67)`, true);
  });

  // PÚBLICO-PRIVADA (Rows 69-74, Subtotal 75)
  classesPrimario.forEach((cls, idx) => {
    const r = 69 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICO-PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), 'Ensino Primário');
    styleLabelCell(ws.getCell(`C${r}`), cls);

    fillInputPairs(ws, r, t21ColsMF, t21ColsF);
    const sumMF = t21ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = t21ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`E${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A69:A74');
  ws.getCell('A69').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A75'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B75'), 'PÚBLICO-PRIVADA');
  styleSubtotalCell(ws.getCell('C75'), '1ª a 6ª');
  ['D', 'E', ...t21ColsMF, ...t21ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}75`), `SUM(${col}69:${col}74)`, true);
  });

  // PRIVADA (Rows 76-81, Subtotal 82)
  classesPrimario.forEach((cls, idx) => {
    const r = 76 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), 'Ensino Primário');
    styleLabelCell(ws.getCell(`C${r}`), cls);

    fillInputPairs(ws, r, t21ColsMF, t21ColsF);
    const sumMF = t21ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = t21ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`E${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A76:A81');
  ws.getCell('A76').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A82'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B82'), 'PRIVADA');
  styleSubtotalCell(ws.getCell('C82'), '1ª a 6ª');
  ['D', 'E', ...t21ColsMF, ...t21ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}82`), `SUM(${col}76:${col}81)`, true);
  });

  // TOTAL POR CLASSE (Rows 83-88, Total 89)
  classesPrimario.forEach((cls, idx) => {
    const r = 83 + idx;
    const rPub = 62 + idx;
    const rPubPriv = 69 + idx;
    const rPriv = 76 + idx;

    styleSubtotalCell(ws.getCell(`A${r}`), 'TOTAL POR CLASSE');
    styleSubtotalCell(ws.getCell(`B${r}`), 'TODAS');
    styleSubtotalCell(ws.getCell(`C${r}`), cls);

    ['D', 'E', ...t21ColsMF, ...t21ColsF].forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${r}`), `SUM(${col}${rPub},${col}${rPubPriv},${col}${rPriv})`, true);
    });
  });

  // Row 89: TOTAL GERAL REGULAR
  styleSubtotalCell(ws.getCell('A89'), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell('B89'), 'REGULAR');
  styleSubtotalCell(ws.getCell('C89'), '1ª a 6ª');
  ['D', 'E', ...t21ColsMF, ...t21ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}89`), `SUM(${col}68,${col}75,${col}82)`, true);
  });

  // ==========================================
  // TABELA 2.2 – Primário em escolas específicas de Ensino Especial
  // ==========================================
  ws.getCell('A92').value = 'TABELA 2.2 – Alunos do Ensino Primário em escolas específicas de Ensino Especial (Apenas Pública)';
  ws.getCell('A92').font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };

  ws.mergeCells('A94:A95');
  styleHeaderCell(ws.getCell('A94'), 'NATUREZA');
  ws.mergeCells('B94:B95');
  styleHeaderCell(ws.getCell('B94'), 'CLASSE');
  ws.mergeCells('C94:D94');
  styleHeaderCell(ws.getCell('C94'), 'TOTAL');
  styleHeaderCell(ws.getCell('C95'), 'Total (MF)');
  styleHeaderCell(ws.getCell('D95'), 'Total (F)');

  disabList.forEach(d => {
    ws.mergeCells(`${d.mf}94:${d.f}94`);
    styleHeaderCell(ws.getCell(`${d.mf}94`), d.label);
    styleHeaderCell(ws.getCell(`${d.mf}95`), 'MF');
    styleHeaderCell(ws.getCell(`${d.f}95`), 'F');
  });

  classesPrimario.forEach((cls, idx) => {
    const r = 96 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, disColsMF, disColsF);
    const sumMF = disColsMF.map(c => `${c}${r}`).join(',');
    const sumF = disColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A96:A101');
  ws.getCell('A96').alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 102: Total Especial Primario
  styleSubtotalCell(ws.getCell('A102'), 'TOTAL');
  styleSubtotalCell(ws.getCell('B102'), '1ª a 6ª');
  ['C', 'D', ...disColsMF, ...disColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}102`), `SUM(${col}96:${col}101)`, true);
  });

  // ==========================================
  // TABELA 2.3 – PRAEER (Programa de Aceleração Escolar)
  // ==========================================
  ws.getCell('A106').value = 'TABELA 2.3 – Alunos Matriculados no PRAEER (Programa de Aceleração Escolar)';
  ws.getCell('A106').font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };

  ws.mergeCells('A108:A109');
  styleHeaderCell(ws.getCell('A108'), 'NATUREZA');
  ws.mergeCells('B108:B109');
  styleHeaderCell(ws.getCell('B108'), 'ETAPA');
  ws.mergeCells('C108:D108');
  styleHeaderCell(ws.getCell('C108'), 'TOTAL');
  styleHeaderCell(ws.getCell('C109'), 'Total (MF)');
  styleHeaderCell(ws.getCell('D109'), 'Total (F)');

  const praeerAges = [
    { label: '7 Anos', mf: 'E', f: 'F' },
    { label: '8 Anos', mf: 'G', f: 'H' },
    { label: '9 Anos', mf: 'I', f: 'J' },
    { label: '10 Anos', mf: 'K', f: 'L' },
    { label: '11 Anos', mf: 'M', f: 'N' },
    { label: '12 Anos', mf: 'O', f: 'P' },
    { label: '13 Anos', mf: 'Q', f: 'R' },
    { label: '14 Anos', mf: 'S', f: 'T' },
    { label: 'Mais de 14 Anos', mf: 'U', f: 'V' }
  ];

  praeerAges.forEach(h => {
    ws.mergeCells(`${h.mf}108:${h.f}108`);
    styleHeaderCell(ws.getCell(`${h.mf}108`), h.label);
    styleHeaderCell(ws.getCell(`${h.mf}109`), 'MF');
    styleHeaderCell(ws.getCell(`${h.f}109`), 'F');
  });

  const praColsMF = praeerAges.map(a => a.mf);
  const praColsF = praeerAges.map(a => a.f);

  const etapasPRAEER = ['Etapa 1', 'Etapa 2', 'Etapa 3'];

  // 113-115: PÚBLICA, 116: Subtotal
  etapasPRAEER.forEach((et, idx) => {
    const r = 113 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICA' : '');
    styleLabelCell(ws.getCell(`B${r}`), et);
    fillInputPairs(ws, r, praColsMF, praColsF);
    const sumMF = praColsMF.map(c => `${c}${r}`).join(',');
    const sumF = praColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A113:A115');
  ws.getCell('A113').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A116'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B116'), 'PÚBLICA');
  ['C', 'D', ...praColsMF, ...praColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}116`), `SUM(${col}113:${col}115)`, true);
  });

  // 117-119: PÚBLICO-PRIVADA, 120: Subtotal
  etapasPRAEER.forEach((et, idx) => {
    const r = 117 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICO-PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), et);
    fillInputPairs(ws, r, praColsMF, praColsF);
    const sumMF = praColsMF.map(c => `${c}${r}`).join(',');
    const sumF = praColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A117:A119');
  ws.getCell('A117').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A120'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B120'), 'PÚBLICO-PRIVADA');
  ['C', 'D', ...praColsMF, ...praColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}120`), `SUM(${col}117:${col}119)`, true);
  });

  // 121-123: PRIVADA, 124: Subtotal
  etapasPRAEER.forEach((et, idx) => {
    const r = 121 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), et);
    fillInputPairs(ws, r, praColsMF, praColsF);
    const sumMF = praColsMF.map(c => `${c}${r}`).join(',');
    const sumF = praColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A121:A123');
  ws.getCell('A121').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A124'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B124'), 'PRIVADA');
  ['C', 'D', ...praColsMF, ...praColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}124`), `SUM(${col}121:${col}123)`, true);
  });

  // 125-127: Totais por Etapa, 128: TOTAL GERAL PRAEER
  etapasPRAEER.forEach((et, idx) => {
    const r = 125 + idx;
    const rPub = 113 + idx;
    const rPubPriv = 117 + idx;
    const rPriv = 121 + idx;
    styleSubtotalCell(ws.getCell(`A${r}`), 'TOTAL POR ETAPA');
    styleSubtotalCell(ws.getCell(`B${r}`), et);
    ['C', 'D', ...praColsMF, ...praColsF].forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${r}`), `SUM(${col}${rPub},${col}${rPubPriv},${col}${rPriv})`, true);
    });
  });

  styleSubtotalCell(ws.getCell('A128'), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell('B128'), 'PRAEER');
  ['C', 'D', ...praColsMF, ...praColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}128`), `SUM(${col}116,${col}120,${col}124)`, true);
  });

  // ==========================================
  // TABELA 2.4 – EJA Primário (Módulos 1, 2, 3)
  // ==========================================
  ws.getCell('A132').value = 'TABELA 2.4 – Alunos Matriculados na Educação de Jovens e Adultos (EJA) - Ensino Primário';
  ws.getCell('A132').font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };

  ws.mergeCells('A134:A135');
  styleHeaderCell(ws.getCell('A134'), 'NATUREZA');
  ws.mergeCells('B134:B135');
  styleHeaderCell(ws.getCell('B134'), 'MÓDULO');
  ws.mergeCells('C134:D134');
  styleHeaderCell(ws.getCell('C134'), 'TOTAL');
  styleHeaderCell(ws.getCell('C135'), 'Total (MF)');
  styleHeaderCell(ws.getCell('D135'), 'Total (F)');

  const ejaAges = [
    { label: 'Menos de 16 Anos', mf: 'E', f: 'F' },
    { label: '16 Anos', mf: 'G', f: 'H' },
    { label: '17 Anos', mf: 'I', f: 'J' },
    { label: '18 Anos', mf: 'K', f: 'L' },
    { label: '19 Anos', mf: 'M', f: 'N' },
    { label: '20 Anos', mf: 'O', f: 'P' },
    { label: '21 Anos', mf: 'Q', f: 'R' },
    { label: '22 Anos', mf: 'S', f: 'T' },
    { label: '23 Anos', mf: 'U', f: 'V' },
    { label: 'Mais de 23 Anos', mf: 'W', f: 'X' }
  ];

  ejaAges.forEach(h => {
    ws.mergeCells(`${h.mf}134:${h.f}134`);
    styleHeaderCell(ws.getCell(`${h.mf}134`), h.label);
    styleHeaderCell(ws.getCell(`${h.mf}135`), 'MF');
    styleHeaderCell(ws.getCell(`${h.f}135`), 'F');
  });

  const ejaColsMF = ejaAges.map(a => a.mf);
  const ejaColsF = ejaAges.map(a => a.f);
  const modulosEJA = ['Módulo 1', 'Módulo 2', 'Módulo 3'];

  // 137-139 Pública, 140 Subtotal
  modulosEJA.forEach((mod, idx) => {
    const r = 137 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICA' : '');
    styleLabelCell(ws.getCell(`B${r}`), mod);
    fillInputPairs(ws, r, ejaColsMF, ejaColsF);
    const sumMF = ejaColsMF.map(c => `${c}${r}`).join(',');
    const sumF = ejaColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A137:A139');
  ws.getCell('A137').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A140'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B140'), 'PÚBLICA');
  ['C', 'D', ...ejaColsMF, ...ejaColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}140`), `SUM(${col}137:${col}139)`, true);
  });

  // 141-143 Público-Privada, 144 Subtotal
  modulosEJA.forEach((mod, idx) => {
    const r = 141 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICO-PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), mod);
    fillInputPairs(ws, r, ejaColsMF, ejaColsF);
    const sumMF = ejaColsMF.map(c => `${c}${r}`).join(',');
    const sumF = ejaColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A141:A143');
  ws.getCell('A141').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A144'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B144'), 'PÚBLICO-PRIVADA');
  ['C', 'D', ...ejaColsMF, ...ejaColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}144`), `SUM(${col}141:${col}143)`, true);
  });

  // 145-147 Privada, 148 Subtotal
  modulosEJA.forEach((mod, idx) => {
    const r = 145 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), mod);
    fillInputPairs(ws, r, ejaColsMF, ejaColsF);
    const sumMF = ejaColsMF.map(c => `${c}${r}`).join(',');
    const sumF = ejaColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A145:A147');
  ws.getCell('A145').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A148'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B148'), 'PRIVADA');
  ['C', 'D', ...ejaColsMF, ...ejaColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}148`), `SUM(${col}145:${col}147)`, true);
  });

  // 149-151: Totais por Módulo, 152: TOTAL GERAL EJA
  modulosEJA.forEach((mod, idx) => {
    const r = 149 + idx;
    const rPub = 137 + idx;
    const rPubPriv = 141 + idx;
    const rPriv = 145 + idx;
    styleSubtotalCell(ws.getCell(`A${r}`), 'TOTAL POR MÓDULO');
    styleSubtotalCell(ws.getCell(`B${r}`), mod);
    ['C', 'D', ...ejaColsMF, ...ejaColsF].forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${r}`), `SUM(${col}${rPub},${col}${rPubPriv},${col}${rPriv})`, true);
    });
  });

  styleSubtotalCell(ws.getCell('A152'), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell('B152'), 'EJA PRIMÁRIO');
  ['C', 'D', ...ejaColsMF, ...ejaColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}152`), `SUM(${col}140,${col}144,${col}148)`, true);
  });

  // ==========================================
  // 3. ENSINO SECUNDÁRIO I CICLO
  // ==========================================
  ws.getCell('A156').value = '3. ENSINO SECUNDÁRIO DO I CICLO';
  ws.getCell('A156').font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: '000000' } };

  ws.getCell('A157').value = 'TABELA 3.1 – Alunos Matriculados no I Ciclo do Ensino Secundário Geral Regular';
  ws.getCell('A157').font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };

  ws.mergeCells('A159:A160');
  styleHeaderCell(ws.getCell('A159'), 'NATUREZA');
  ws.mergeCells('B159:B160');
  styleHeaderCell(ws.getCell('B159'), 'CLASSE');
  ws.mergeCells('C159:D159');
  styleHeaderCell(ws.getCell('C159'), 'TOTAL');
  styleHeaderCell(ws.getCell('C160'), 'Total (MF)');
  styleHeaderCell(ws.getCell('D160'), 'Total (F)');

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
    ws.mergeCells(`${h.mf}159:${h.f}159`);
    styleHeaderCell(ws.getCell(`${h.mf}159`), h.label);
    styleHeaderCell(ws.getCell(`${h.mf}160`), 'MF');
    styleHeaderCell(ws.getCell(`${h.f}160`), 'F');
  });

  const sec1ColsMF = sec1Ages.map(a => a.mf);
  const sec1ColsF = sec1Ages.map(a => a.f);
  const classesSec1 = ['7ª Classe', '8ª Classe', '9ª Classe'];

  // 163-165: Pública, 166: Subtotal
  classesSec1.forEach((cls, idx) => {
    const r = 163 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, sec1ColsMF, sec1ColsF);
    const sumMF = sec1ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = sec1ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A163:A165');
  ws.getCell('A163').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A166'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B166'), 'PÚBLICA');
  ['C', 'D', ...sec1ColsMF, ...sec1ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}166`), `SUM(${col}163:${col}165)`, true);
  });

  // 167-169: Público-Privada, 170: Subtotal
  classesSec1.forEach((cls, idx) => {
    const r = 167 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICO-PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, sec1ColsMF, sec1ColsF);
    const sumMF = sec1ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = sec1ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A167:A169');
  ws.getCell('A167').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A170'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B170'), 'PÚBLICO-PRIVADA');
  ['C', 'D', ...sec1ColsMF, ...sec1ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}170`), `SUM(${col}167:${col}169)`, true);
  });

  // 171-173: Privada, 174: Subtotal
  classesSec1.forEach((cls, idx) => {
    const r = 171 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, sec1ColsMF, sec1ColsF);
    const sumMF = sec1ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = sec1ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A171:A173');
  ws.getCell('A171').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A174'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B174'), 'PRIVADA');
  ['C', 'D', ...sec1ColsMF, ...sec1ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}174`), `SUM(${col}171:${col}173)`, true);
  });

  // 175-177 Totais por Classe, 178 TOTAL GERAL I CICLO GERAL
  classesSec1.forEach((cls, idx) => {
    const r = 175 + idx;
    const rPub = 163 + idx;
    const rPubPriv = 167 + idx;
    const rPriv = 171 + idx;
    styleSubtotalCell(ws.getCell(`A${r}`), 'TOTAL POR CLASSE');
    styleSubtotalCell(ws.getCell(`B${r}`), cls);
    ['C', 'D', ...sec1ColsMF, ...sec1ColsF].forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${r}`), `SUM(${col}${rPub},${col}${rPubPriv},${col}${rPriv})`, true);
    });
  });

  styleSubtotalCell(ws.getCell('A178'), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell('B178'), 'I CICLO GERAL');
  ['C', 'D', ...sec1ColsMF, ...sec1ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}178`), `SUM(${col}166,${col}170,${col}174)`, true);
  });

  // TABELA 3.2 – I Ciclo Educação Especial
  ws.getCell('A181').value = 'TABELA 3.2 – Alunos do I Ciclo em escolas específicas de Ensino Especial';
  ws.getCell('A181').font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };

  ws.mergeCells('A183:A184');
  styleHeaderCell(ws.getCell('A183'), 'NATUREZA');
  ws.mergeCells('B183:B184');
  styleHeaderCell(ws.getCell('B183'), 'CLASSE');
  ws.mergeCells('C183:D183');
  styleHeaderCell(ws.getCell('C183'), 'TOTAL');
  styleHeaderCell(ws.getCell('C184'), 'Total (MF)');
  styleHeaderCell(ws.getCell('D184'), 'Total (F)');

  disabList.forEach(d => {
    ws.mergeCells(`${d.mf}183:${d.f}183`);
    styleHeaderCell(ws.getCell(`${d.mf}183`), d.label);
    styleHeaderCell(ws.getCell(`${d.mf}184`), 'MF');
    styleHeaderCell(ws.getCell(`${d.f}184`), 'F');
  });

  classesSec1.forEach((cls, idx) => {
    const r = 185 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, disColsMF, disColsF);
    const sumMF = disColsMF.map(c => `${c}${r}`).join(',');
    const sumF = disColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A185:A187');
  ws.getCell('A185').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A188'), 'TOTAL');
  styleSubtotalCell(ws.getCell('B188'), '7ª a 9ª');
  ['C', 'D', ...disColsMF, ...disColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}188`), `SUM(${col}185:${col}187)`, true);
  });

  // TABELA 3.3 – I Ciclo Técnico-Profissional (7ª, 8ª, 9ª)
  ws.getCell('A192').value = 'TABELA 3.3 – Alunos Matriculados no I Ciclo do Ensino Técnico-Profissional';
  ws.getCell('A192').font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };

  ws.mergeCells('A194:A195');
  styleHeaderCell(ws.getCell('A194'), 'NATUREZA');
  ws.mergeCells('B194:B195');
  styleHeaderCell(ws.getCell('B194'), 'CLASSE');
  ws.mergeCells('C194:D194');
  styleHeaderCell(ws.getCell('C194'), 'TOTAL');
  styleHeaderCell(ws.getCell('C195'), 'Total (MF)');
  styleHeaderCell(ws.getCell('D195'), 'Total (F)');

  sec1Ages.forEach(h => {
    ws.mergeCells(`${h.mf}194:${h.f}194`);
    styleHeaderCell(ws.getCell(`${h.mf}194`), h.label);
    styleHeaderCell(ws.getCell(`${h.mf}195`), 'MF');
    styleHeaderCell(ws.getCell(`${h.f}195`), 'F');
  });

  // 199-201 Pública, 202 Subtotal
  classesSec1.forEach((cls, idx) => {
    const r = 199 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, sec1ColsMF, sec1ColsF);
    const sumMF = sec1ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = sec1ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A199:A201');
  ws.getCell('A199').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A202'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B202'), 'PÚBLICA');
  ['C', 'D', ...sec1ColsMF, ...sec1ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}202`), `SUM(${col}199:${col}201)`, true);
  });

  // 203-205 Público-Privada, 206 Subtotal
  classesSec1.forEach((cls, idx) => {
    const r = 203 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICO-PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, sec1ColsMF, sec1ColsF);
    const sumMF = sec1ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = sec1ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A203:A205');
  ws.getCell('A203').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A206'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B206'), 'PÚBLICO-PRIVADA');
  ['C', 'D', ...sec1ColsMF, ...sec1ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}206`), `SUM(${col}203:${col}205)`, true);
  });

  // 207-209 Privada, 210 Subtotal
  classesSec1.forEach((cls, idx) => {
    const r = 207 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, sec1ColsMF, sec1ColsF);
    const sumMF = sec1ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = sec1ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A207:A209');
  ws.getCell('A207').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A210'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B210'), 'PRIVADA');
  ['C', 'D', ...sec1ColsMF, ...sec1ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}210`), `SUM(${col}207:${col}209)`, true);
  });

  // 211-213 Totais por Classe, 214 TOTAL GERAL I CICLO TÉCNICO
  classesSec1.forEach((cls, idx) => {
    const r = 211 + idx;
    const rPub = 199 + idx;
    const rPubPriv = 203 + idx;
    const rPriv = 207 + idx;
    styleSubtotalCell(ws.getCell(`A${r}`), 'TOTAL POR CLASSE');
    styleSubtotalCell(ws.getCell(`B${r}`), cls);
    ['C', 'D', ...sec1ColsMF, ...sec1ColsF].forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${r}`), `SUM(${col}${rPub},${col}${rPubPriv},${col}${rPriv})`, true);
    });
  });

  styleSubtotalCell(ws.getCell('A214'), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell('B214'), 'I CICLO TÉCNICO');
  ['C', 'D', ...sec1ColsMF, ...sec1ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}214`), `SUM(${col}202,${col}206,${col}210)`, true);
  });

  // TABELA 3.4 – I Ciclo EJA (1º Ano, 2º Ano)
  ws.getCell('A218').value = 'TABELA 3.4 – Alunos Matriculados no I Ciclo da Educação de Jovens e Adultos (EJA)';
  ws.getCell('A218').font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };

  ws.mergeCells('A220:A221');
  styleHeaderCell(ws.getCell('A220'), 'NATUREZA');
  ws.mergeCells('B220:B221');
  styleHeaderCell(ws.getCell('B220'), 'ANO');
  ws.mergeCells('C220:D220');
  styleHeaderCell(ws.getCell('C220'), 'TOTAL');
  styleHeaderCell(ws.getCell('C221'), 'Total (MF)');
  styleHeaderCell(ws.getCell('D221'), 'Total (F)');

  ejaAges.forEach(h => {
    ws.mergeCells(`${h.mf}220:${h.f}220`);
    styleHeaderCell(ws.getCell(`${h.mf}220`), h.label);
    styleHeaderCell(ws.getCell(`${h.mf}221`), 'MF');
    styleHeaderCell(ws.getCell(`${h.f}221`), 'F');
  });

  const anosEJASec1 = ['1º Ano', '2º Ano'];

  // 223-224 Pública, 225 Subtotal
  anosEJASec1.forEach((an, idx) => {
    const r = 223 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICA' : '');
    styleLabelCell(ws.getCell(`B${r}`), an);
    fillInputPairs(ws, r, ejaColsMF, ejaColsF);
    const sumMF = ejaColsMF.map(c => `${c}${r}`).join(',');
    const sumF = ejaColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A223:A224');
  ws.getCell('A223').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A225'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B225'), 'PÚBLICA');
  ['C', 'D', ...ejaColsMF, ...ejaColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}225`), `SUM(${col}223:${col}224)`, true);
  });

  // 226-227 Público-Privada, 228 Subtotal
  anosEJASec1.forEach((an, idx) => {
    const r = 226 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICO-PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), an);
    fillInputPairs(ws, r, ejaColsMF, ejaColsF);
    const sumMF = ejaColsMF.map(c => `${c}${r}`).join(',');
    const sumF = ejaColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A226:A227');
  ws.getCell('A226').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A228'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B228'), 'PÚBLICO-PRIVADA');
  ['C', 'D', ...ejaColsMF, ...ejaColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}228`), `SUM(${col}226:${col}227)`, true);
  });

  // 229-230 Privada, 231 Subtotal
  anosEJASec1.forEach((an, idx) => {
    const r = 229 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), an);
    fillInputPairs(ws, r, ejaColsMF, ejaColsF);
    const sumMF = ejaColsMF.map(c => `${c}${r}`).join(',');
    const sumF = ejaColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A229:A230');
  ws.getCell('A229').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A231'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B231'), 'PRIVADA');
  ['C', 'D', ...ejaColsMF, ...ejaColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}231`), `SUM(${col}229:${col}230)`, true);
  });

  // 232-233 Totais por Ano, 234 TOTAL GERAL I CICLO EJA
  anosEJASec1.forEach((an, idx) => {
    const r = 232 + idx;
    const rPub = 223 + idx;
    const rPubPriv = 226 + idx;
    const rPriv = 229 + idx;
    styleSubtotalCell(ws.getCell(`A${r}`), 'TOTAL POR ANO');
    styleSubtotalCell(ws.getCell(`B${r}`), an);
    ['C', 'D', ...ejaColsMF, ...ejaColsF].forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${r}`), `SUM(${col}${rPub},${col}${rPubPriv},${col}${rPriv})`, true);
    });
  });

  styleSubtotalCell(ws.getCell('A234'), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell('B234'), 'I CICLO EJA');
  ['C', 'D', ...ejaColsMF, ...ejaColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}234`), `SUM(${col}225,${col}228,${col}231)`, true);
  });

  // ==========================================
  // 4. ENSINO SECUNDÁRIO II CICLO
  // ==========================================
  ws.getCell('A238').value = '4. ENSINO SECUNDÁRIO DO II CICLO';
  ws.getCell('A238').font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: '000000' } };

  // TABELA 4.1 – II Ciclo Geral (10ª, 11ª, 12ª)
  ws.getCell('A240').value = 'TABELA 4.1 – Alunos Matriculados no II Ciclo do Ensino Secundário Geral';
  ws.getCell('A240').font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };

  ws.mergeCells('A242:A243');
  styleHeaderCell(ws.getCell('A242'), 'NATUREZA');
  ws.mergeCells('B242:B243');
  styleHeaderCell(ws.getCell('B242'), 'CLASSE');
  ws.mergeCells('C242:D242');
  styleHeaderCell(ws.getCell('C242'), 'TOTAL');
  styleHeaderCell(ws.getCell('C243'), 'Total (MF)');
  styleHeaderCell(ws.getCell('D243'), 'Total (F)');

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
    ws.mergeCells(`${h.mf}242:${h.f}242`);
    styleHeaderCell(ws.getCell(`${h.mf}242`), h.label);
    styleHeaderCell(ws.getCell(`${h.mf}243`), 'MF');
    styleHeaderCell(ws.getCell(`${h.f}243`), 'F');
  });

  const sec2ColsMF = sec2Ages.map(a => a.mf);
  const sec2ColsF = sec2Ages.map(a => a.f);
  const classesSec2Geral = ['10ª Classe', '11ª Classe', '12ª Classe'];

  // 245-247 Pública, 248 Subtotal
  classesSec2Geral.forEach((cls, idx) => {
    const r = 245 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, sec2ColsMF, sec2ColsF);
    const sumMF = sec2ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = sec2ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A245:A247');
  ws.getCell('A245').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A248'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B248'), 'PÚBLICA');
  ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}248`), `SUM(${col}245:${col}247)`, true);
  });

  // 249-251 Público-Privada, 252 Subtotal
  classesSec2Geral.forEach((cls, idx) => {
    const r = 249 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICO-PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, sec2ColsMF, sec2ColsF);
    const sumMF = sec2ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = sec2ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A249:A251');
  ws.getCell('A249').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A252'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B252'), 'PÚBLICO-PRIVADA');
  ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}252`), `SUM(${col}249:${col}251)`, true);
  });

  // 253-255 Privada, 256 Subtotal
  classesSec2Geral.forEach((cls, idx) => {
    const r = 253 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, sec2ColsMF, sec2ColsF);
    const sumMF = sec2ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = sec2ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A253:A255');
  ws.getCell('A253').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A256'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B256'), 'PRIVADA');
  ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}256`), `SUM(${col}253:${col}255)`, true);
  });

  // 257-259 Totais por Classe, 260 TOTAL GERAL II CICLO GERAL
  classesSec2Geral.forEach((cls, idx) => {
    const r = 257 + idx;
    const rPub = 245 + idx;
    const rPubPriv = 249 + idx;
    const rPriv = 253 + idx;
    styleSubtotalCell(ws.getCell(`A${r}`), 'TOTAL POR CLASSE');
    styleSubtotalCell(ws.getCell(`B${r}`), cls);
    ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${r}`), `SUM(${col}${rPub},${col}${rPubPriv},${col}${rPriv})`, true);
    });
  });

  styleSubtotalCell(ws.getCell('A260'), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell('B260'), 'II CICLO GERAL');
  ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}260`), `SUM(${col}248,${col}252,${col}256)`, true);
  });

  // TABELA 4.2 – II Ciclo Educação Especial (10ª a 13ª, por deficiência)
  ws.getCell('A263').value = 'TABELA 4.2 – Alunos do II Ciclo em escolas específicas de Ensino Especial';
  ws.getCell('A263').font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };

  ws.mergeCells('A265:A266');
  styleHeaderCell(ws.getCell('A265'), 'NATUREZA');
  ws.mergeCells('B265:B266');
  styleHeaderCell(ws.getCell('B265'), 'CLASSE');
  ws.mergeCells('C265:D265');
  styleHeaderCell(ws.getCell('C265'), 'TOTAL');
  styleHeaderCell(ws.getCell('C266'), 'Total (MF)');
  styleHeaderCell(ws.getCell('D266'), 'Total (F)');

  disabList.forEach(d => {
    ws.mergeCells(`${d.mf}265:${d.f}265`);
    styleHeaderCell(ws.getCell(`${d.mf}265`), d.label);
    styleHeaderCell(ws.getCell(`${d.mf}266`), 'MF');
    styleHeaderCell(ws.getCell(`${d.f}266`), 'F');
  });

  const classesSec2Especial = ['10ª Classe', '11ª Classe', '12ª Classe', '13ª Classe'];
  classesSec2Especial.forEach((cls, idx) => {
    const r = 267 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, disColsMF, disColsF);
    const sumMF = disColsMF.map(c => `${c}${r}`).join(',');
    const sumF = disColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A267:A270');
  ws.getCell('A267').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A271'), 'TOTAL');
  styleSubtotalCell(ws.getCell('B271'), '10ª a 13ª');
  ['C', 'D', ...disColsMF, ...disColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}271`), `SUM(${col}267:${col}270)`, true);
  });

  // TABELA 4.3 – II Ciclo Técnico-Profissional (10ª a 13ª)
  ws.getCell('A274').value = 'TABELA 4.3 – Alunos Matriculados no Ensino Técnico-Profissional (II Ciclo)';
  ws.getCell('A274').font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };

  ws.mergeCells('A276:A277');
  styleHeaderCell(ws.getCell('A276'), 'NATUREZA');
  ws.mergeCells('B276:B277');
  styleHeaderCell(ws.getCell('B276'), 'CLASSE');
  ws.mergeCells('C276:D276');
  styleHeaderCell(ws.getCell('C276'), 'TOTAL');
  styleHeaderCell(ws.getCell('C277'), 'Total (MF)');
  styleHeaderCell(ws.getCell('D277'), 'Total (F)');

  sec2Ages.forEach(h => {
    ws.mergeCells(`${h.mf}276:${h.f}276`);
    styleHeaderCell(ws.getCell(`${h.mf}276`), h.label);
    styleHeaderCell(ws.getCell(`${h.mf}277`), 'MF');
    styleHeaderCell(ws.getCell(`${h.f}277`), 'F');
  });

  const classesSec2Quatro = ['10ª Classe', '11ª Classe', '12ª Classe', '13ª Classe'];

  // 280-283 Pública, 284 Subtotal
  classesSec2Quatro.forEach((cls, idx) => {
    const r = 280 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, sec2ColsMF, sec2ColsF);
    const sumMF = sec2ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = sec2ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A280:A283');
  ws.getCell('A280').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A284'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B284'), 'PÚBLICA');
  ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}284`), `SUM(${col}280:${col}283)`, true);
  });

  // 285-288 Público-Privada, 289 Subtotal
  classesSec2Quatro.forEach((cls, idx) => {
    const r = 285 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICO-PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, sec2ColsMF, sec2ColsF);
    const sumMF = sec2ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = sec2ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A285:A288');
  ws.getCell('A285').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A289'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B289'), 'PÚBLICO-PRIVADA');
  ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}289`), `SUM(${col}285:${col}288)`, true);
  });

  // 290-293 Privada, 294 Subtotal
  classesSec2Quatro.forEach((cls, idx) => {
    const r = 290 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, sec2ColsMF, sec2ColsF);
    const sumMF = sec2ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = sec2ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A290:A293');
  ws.getCell('A290').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A294'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B294'), 'PRIVADA');
  ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}294`), `SUM(${col}290:${col}293)`, true);
  });

  // 295-298 Totais por Classe, 299 TOTAL GERAL II CICLO TÉCNICO
  classesSec2Quatro.forEach((cls, idx) => {
    const r = 295 + idx;
    const rPub = 280 + idx;
    const rPubPriv = 285 + idx;
    const rPriv = 290 + idx;
    styleSubtotalCell(ws.getCell(`A${r}`), 'TOTAL POR CLASSE');
    styleSubtotalCell(ws.getCell(`B${r}`), cls);
    ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${r}`), `SUM(${col}${rPub},${col}${rPubPriv},${col}${rPriv})`, true);
    });
  });

  styleSubtotalCell(ws.getCell('A299'), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell('B299'), 'II CICLO TÉCNICO');
  ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}299`), `SUM(${col}284,${col}289,${col}294)`, true);
  });

  // TABELA 4.4 – II Ciclo Formação de Professores (10ª a 13ª)
  ws.getCell('A303').value = 'TABELA 4.4 – Alunos Matriculados no Ensino Pedagógico / Magistério (Formação de Professores)';
  ws.getCell('A303').font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };

  ws.mergeCells('A304:A305');
  styleHeaderCell(ws.getCell('A304'), 'NATUREZA');
  ws.mergeCells('B304:B305');
  styleHeaderCell(ws.getCell('B304'), 'CLASSE');
  ws.mergeCells('C304:D304');
  styleHeaderCell(ws.getCell('C304'), 'TOTAL');
  styleHeaderCell(ws.getCell('C305'), 'Total (MF)');
  styleHeaderCell(ws.getCell('D305'), 'Total (F)');

  sec2Ages.forEach(h => {
    ws.mergeCells(`${h.mf}304:${h.f}304`);
    styleHeaderCell(ws.getCell(`${h.mf}304`), h.label);
    styleHeaderCell(ws.getCell(`${h.mf}305`), 'MF');
    styleHeaderCell(ws.getCell(`${h.f}305`), 'F');
  });

  // 306-309 Pública, 310 Subtotal
  classesSec2Quatro.forEach((cls, idx) => {
    const r = 306 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, sec2ColsMF, sec2ColsF);
    const sumMF = sec2ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = sec2ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A306:A309');
  ws.getCell('A306').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A310'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B310'), 'PÚBLICA');
  ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}310`), `SUM(${col}306:${col}309)`, true);
  });

  // 311-314 Público-Privada, 315 Subtotal
  classesSec2Quatro.forEach((cls, idx) => {
    const r = 311 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PÚBLICO-PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, sec2ColsMF, sec2ColsF);
    const sumMF = sec2ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = sec2ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A311:A314');
  ws.getCell('A311').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A315'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B315'), 'PÚBLICO-PRIVADA');
  ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}315`), `SUM(${col}311:${col}314)`, true);
  });

  // 316-319 Privada, 320 Subtotal
  classesSec2Quatro.forEach((cls, idx) => {
    const r = 316 + idx;
    styleLabelCell(ws.getCell(`A${r}`), idx === 0 ? 'PRIVADA' : '');
    styleLabelCell(ws.getCell(`B${r}`), cls);
    fillInputPairs(ws, r, sec2ColsMF, sec2ColsF);
    const sumMF = sec2ColsMF.map(c => `${c}${r}`).join(',');
    const sumF = sec2ColsF.map(c => `${c}${r}`).join(',');
    styleFormulaCell(ws.getCell(`C${r}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${r}`), `SUM(${sumF})`);
  });
  ws.mergeCells('A316:A319');
  ws.getCell('A316').alignment = { vertical: 'middle', horizontal: 'left' };

  styleSubtotalCell(ws.getCell('A320'), 'SUBTOTAL');
  styleSubtotalCell(ws.getCell('B320'), 'PRIVADA');
  ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}320`), `SUM(${col}316:${col}319)`, true);
  });

  // 321-324 Totais por Classe, 325 TOTAL GERAL MAGISTÉRIO
  classesSec2Quatro.forEach((cls, idx) => {
    const r = 321 + idx;
    const rPub = 306 + idx;
    const rPubPriv = 311 + idx;
    const rPriv = 316 + idx;
    styleSubtotalCell(ws.getCell(`A${r}`), 'TOTAL POR CLASSE');
    styleSubtotalCell(ws.getCell(`B${r}`), cls);
    ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${r}`), `SUM(${col}${rPub},${col}${rPubPriv},${col}${rPriv})`, true);
    });
  });

  styleSubtotalCell(ws.getCell('A325'), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell('B325'), 'MAGISTÉRIO');
  ['C', 'D', ...sec2ColsMF, ...sec2ColsF].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}325`), `SUM(${col}310,${col}315,${col}320)`, true);
  });

  // ==========================================
  // CONSOLIDADO FINAL DE ALUNOS MATRICULADOS
  // ==========================================
  const rConsol = 330;
  ws.mergeCells(`A${rConsol}:D${rConsol}`);
  const cConsol = ws.getCell(`A${rConsol}`);
  cConsol.value = 'TOTAL DE ALUNOS MATRICULADOS - CONSOLIDADO';
  cConsol.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FFFFFF' } };
  cConsol.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_FILL } };
  cConsol.alignment = { vertical: 'middle', horizontal: 'center' };

  styleHeaderCell(ws.getCell(`A${rConsol + 1}`), 'NÍVEL / SUBSISTEMA');
  styleHeaderCell(ws.getCell(`B${rConsol + 1}`), 'DISCRIMINAÇÃO');
  styleHeaderCell(ws.getCell(`C${rConsol + 1}`), 'TOTAL (MF)');
  styleHeaderCell(ws.getCell(`D${rConsol + 1}`), 'TOTAL (F)');

  const consolItems = [
    { level: 'Educação Pré-Escolar (Creches e Jardins)', refMF: 'C31', refF: 'D31' },
    { level: 'Classe de Iniciação', refMF: 'C40', refF: 'D40' },
    { level: 'Educação Especial (Iniciação)', refMF: 'C49', refF: 'D49' },
    { level: 'Ensino Primário Regular', refMF: 'D89', refF: 'E89' },
    { level: 'Ensino Primário Especial', refMF: 'C102', refF: 'D102' },
    { level: 'PRAEER (Aceleração Escolar)', refMF: 'C128', refF: 'D128' },
    { level: 'EJA Primário', refMF: 'C152', refF: 'D152' },
    { level: 'I Ciclo Geral Regular', refMF: 'C178', refF: 'D178' },
    { level: 'I Ciclo Educação Especial', refMF: 'C188', refF: 'D188' },
    { level: 'I Ciclo Técnico-Profissional', refMF: 'C214', refF: 'D214' },
    { level: 'I Ciclo EJA', refMF: 'C234', refF: 'D234' },
    { level: 'II Ciclo Geral Regular', refMF: 'C260', refF: 'D260' },
    { level: 'II Ciclo Educação Especial', refMF: 'C271', refF: 'D271' },
    { level: 'II Ciclo Técnico-Profissional', refMF: 'C299', refF: 'D299' },
    { level: 'II Ciclo Magistério / Pedagógico', refMF: 'C325', refF: 'D325' }
  ];

  consolItems.forEach((it, idx) => {
    const row = rConsol + 2 + idx;
    styleLabelCell(ws.getCell(`A${row}`), it.level);
    styleLabelCell(ws.getCell(`B${row}`), 'Total Consolidado');
    styleFormulaCell(ws.getCell(`C${row}`), `${it.refMF}`);
    styleFormulaCell(ws.getCell(`D${row}`), `${it.refF}`);
  });

  const rowFinalTotal = rConsol + 2 + consolItems.length;
  styleSubtotalCell(ws.getCell(`A${rowFinalTotal}`), 'TOTAL GERAL DO MUNICÍPIO');
  styleSubtotalCell(ws.getCell(`B${rowFinalTotal}`), 'TODOS OS NÍVEIS');
  styleSubtotalCell(ws.getCell(`C${rowFinalTotal}`), `SUM(C${rConsol + 2}:C${rowFinalTotal - 1})`, true);
  styleSubtotalCell(ws.getCell(`D${rowFinalTotal}`), `SUM(D${rConsol + 2}:D${rowFinalTotal - 1})`, true);
}
