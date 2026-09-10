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

export function buildPessoalDocenteSheet(workbook) {
  const ws = workbook.addWorksheet('2 - PESSOAL_DOCENTE', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 6, showGridLines: true }]
  });

  ws.columns = [
    { width: 28 }, // A: Nível / Natureza
    { width: 25 }, // B: Categoria / Habilitação
    { width: 14 }, // C: Total (MF)
    { width: 14 }, // D: Total (F)
    { width: 14 }, // E: Doutoramento / Mestrado (MF)
    { width: 14 }, // F: Doutoramento / Mestrado (F)
    { width: 14 }, // G: Licenciatura em Ensino (MF)
    { width: 14 }, // H: Licenciatura em Ensino (F)
    { width: 14 }, // I: Outra Licenciatura (MF)
    { width: 14 }, // J: Outra Licenciatura (F)
    { width: 14 }, // K: Bacharelato (MF)
    { width: 14 }, // L: Bacharelato (F)
    { width: 14 }, // M: Médio Pedagógico (MF)
    { width: 14 }, // N: Médio Pedagógico (F)
    { width: 14 }, // O: Outro Médio (MF)
    { width: 14 }  // P: Outro Médio (F)
  ];

  // Section Header
  ws.mergeCells('A2:P2');
  const a2 = ws.getCell('A2');
  a2.value = 'SECÇÃO 2 - DADOS ESTATÍSTICOS SOBRE PESSOAL DOCENTE EM EXERCÍCIO';
  a2.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLOR_HEADER_FILL } };
  a2.alignment = { vertical: 'middle', horizontal: 'left' };

  const naturezas = ['PÚBLICA', 'PÚBLICO-PRIVADA', 'PRIVADA'];
  const qualColsMF = ['E', 'G', 'I', 'K', 'M', 'O'];
  const qualColsF = ['F', 'H', 'J', 'L', 'N', 'P'];

  function setupDocenteTableHeaders(startRow, title) {
    ws.getCell(`A${startRow}`).value = title;
    ws.getCell(`A${startRow}`).font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };

    const h1 = startRow + 1;
    const h2 = startRow + 2;

    ws.mergeCells(`A${h1}:A${h2}`);
    styleHeaderCell(ws.getCell(`A${h1}`), 'NATUREZA DA ESCOLA');
    ws.mergeCells(`B${h1}:B${h2}`);
    styleHeaderCell(ws.getCell(`B${h1}`), 'CATEGORIA / FUNÇÃO');

    ws.mergeCells(`C${h1}:D${h1}`);
    styleHeaderCell(ws.getCell(`C${h1}`), 'TOTAL DE DOCENTES');
    styleHeaderCell(ws.getCell(`C${h2}`), 'Total (MF)');
    styleHeaderCell(ws.getCell(`D${h2}`), 'Total (F)');

    const qualifications = [
      { label: 'Mestrado / Doutoramento', mf: 'E', f: 'F' },
      { label: 'Licenciatura em Ensino', mf: 'G', f: 'H' },
      { label: 'Outras Licenciaturas', mf: 'I', f: 'J' },
      { label: 'Bacharelato', mf: 'K', f: 'L' },
      { label: 'Técnico Médio Pedagógico', mf: 'M', f: 'N' },
      { label: 'Outros Técnicos Médios', mf: 'O', f: 'P' }
    ];

    qualifications.forEach(q => {
      ws.mergeCells(`${q.mf}${h1}:${q.f}${h1}`);
      styleHeaderCell(ws.getCell(`${q.mf}${h1}`), q.label);
      styleHeaderCell(ws.getCell(`${q.mf}${h2}`), 'MF');
      styleHeaderCell(ws.getCell(`${q.f}${h2}`), 'F');
    });

    return h2 + 1; // First data row
  }

  function addDocenteRows(firstRow, tableType) {
    const roles = ['Educadores / Professores Titulares', 'Professores Coadjuvantes', 'Professores Estagiários'];
    let curRow = firstRow;

    naturezas.forEach(nat => {
      const startNatRow = curRow;
      roles.forEach(role => {
        styleLabelCell(ws.getCell(`A${curRow}`), curRow === startNatRow ? nat : '');
        styleLabelCell(ws.getCell(`B${curRow}`), role);

        fillInputPairs(ws, curRow, qualColsMF, qualColsF);
        const sumMF = qualColsMF.map(c => `${c}${curRow}`).join(',');
        const sumF = qualColsF.map(c => `${c}${curRow}`).join(',');
        styleFormulaCell(ws.getCell(`C${curRow}`), `SUM(${sumMF})`);
        styleFormulaCell(ws.getCell(`D${curRow}`), `SUM(${sumF})`);

        curRow++;
      });

      ws.mergeCells(`A${startNatRow}:A${curRow - 1}`);
      ws.getCell(`A${startNatRow}`).alignment = { vertical: 'middle', horizontal: 'left' };

      // Subtotal Natureza
      styleSubtotalCell(ws.getCell(`A${curRow}`), 'SUBTOTAL');
      styleSubtotalCell(ws.getCell(`B${curRow}`), nat);
      ['C', 'D', ...qualColsMF, ...qualColsF].forEach(col => {
        styleSubtotalCell(ws.getCell(`${col}${curRow}`), `SUM(${col}${startNatRow}:${col}${curRow - 1})`, true);
      });
      curRow++;
    });

    // Total da Tabela
    const totalRow = curRow;
    styleSubtotalCell(ws.getCell(`A${totalRow}`), 'TOTAL');
    styleSubtotalCell(ws.getCell(`B${totalRow}`), tableType);
    ['C', 'D', ...qualColsMF, ...qualColsF].forEach(col => {
      // Sum of the 3 subtotals
      const sub1 = firstRow + 3;
      const sub2 = sub1 + 4;
      const sub3 = sub2 + 4;
      styleSubtotalCell(ws.getCell(`${col}${totalRow}`), `SUM(${col}${sub1},${col}${sub2},${col}${sub3})`, true);
    });

    return totalRow;
  }

  // 1. EDUCAÇÃO PRÉ-ESCOLAR
  const r1Start = setupDocenteTableHeaders(4, 'TABELA 2.1 – Pessoal Docente na Educação Pré-Escolar');
  const r1End = addDocenteRows(r1Start, 'PRÉ-ESCOLAR');

  // 2. ENSINO PRIMÁRIO
  const r2Start = setupDocenteTableHeaders(r1End + 3, 'TABELA 2.2 – Pessoal Docente no Ensino Primário (Regular, PRAEER, EJA e Especial)');
  const r2End = addDocenteRows(r2Start, 'ENSINO PRIMÁRIO');

  // 3. ENSINO SECUNDÁRIO I CICLO
  const r3Start = setupDocenteTableHeaders(r2End + 3, 'TABELA 2.3 – Pessoal Docente no Ensino Secundário do I Ciclo');
  const r3End = addDocenteRows(r3Start, 'SECUNDÁRIO I CICLO');

  // 4. ENSINO SECUNDÁRIO II CICLO
  const r4Start = setupDocenteTableHeaders(r3End + 3, 'TABELA 2.4 – Pessoal Docente no Ensino Secundário do II Ciclo (Geral, Técnico e Pedagógico)');
  const r4End = addDocenteRows(r4Start, 'SECUNDÁRIO II CICLO');

  // CONSOLIDADO GERAL DE DOCENTES
  const rConsol = r4End + 3;
  ws.mergeCells(`A${rConsol}:D${rConsol}`);
  const cConsol = ws.getCell(`A${rConsol}`);
  cConsol.value = 'CONSOLIDADO GERAL DE PESSOAL DOCENTE';
  cConsol.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FFFFFF' } };
  cConsol.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_FILL } };
  cConsol.alignment = { vertical: 'middle', horizontal: 'center' };

  styleHeaderCell(ws.getCell(`A${rConsol + 1}`), 'NÍVEL DE ENSINO');
  styleHeaderCell(ws.getCell(`B${rConsol + 1}`), 'DISCRIMINAÇÃO');
  styleHeaderCell(ws.getCell(`C${rConsol + 1}`), 'TOTAL DOCENTES (MF)');
  styleHeaderCell(ws.getCell(`D${rConsol + 1}`), 'TOTAL DOCENTES (F)');

  const docTotals = [
    { name: 'Educação Pré-Escolar', row: r1End },
    { name: 'Ensino Primário', row: r2End },
    { name: 'Ensino Secundário I Ciclo', row: r3End },
    { name: 'Ensino Secundário II Ciclo', row: r4End }
  ];

  docTotals.forEach((t, i) => {
    const row = rConsol + 2 + i;
    styleLabelCell(ws.getCell(`A${row}`), t.name);
    styleLabelCell(ws.getCell(`B${row}`), 'Docentes em Exercício');
    styleFormulaCell(ws.getCell(`C${row}`), `C${t.row}`);
    styleFormulaCell(ws.getCell(`D${row}`), `D${t.row}`);
  });

  const finalRow = rConsol + 2 + docTotals.length;
  styleSubtotalCell(ws.getCell(`A${finalRow}`), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell(`B${finalRow}`), 'TODOS OS NÍVEIS');
  styleSubtotalCell(ws.getCell(`C${finalRow}`), `SUM(C${rConsol + 2}:C${finalRow - 1})`, true);
  styleSubtotalCell(ws.getCell(`D${finalRow}`), `SUM(D${rConsol + 2}:D${finalRow - 1})`, true);
}
