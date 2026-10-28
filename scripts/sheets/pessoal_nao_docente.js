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

export function buildPessoalNaoDocenteSheet(workbook) {
  const ws = workbook.addWorksheet('7 - PESSOAL_NAO_DOCENTE', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 6, showGridLines: true }]
  });

  ws.columns = [
    { width: 32 }, // A: Tipo / Categoria
    { width: 22 }, // B: Natureza
    { width: 14 }, // C: Total (MF)
    { width: 14 }, // D: Total (F)
    { width: 14 }, // E
    { width: 14 }, // F
    { width: 14 }, // G
    { width: 14 }, // H
    { width: 14 }, // I
    { width: 14 }, // J
    { width: 14 }, // K
    { width: 14 }, // L
    { width: 14 }, // M
    { width: 14 }, // N
    { width: 14 }, // O
    { width: 14 }  // P
  ];

  // Section Header
  ws.mergeCells('A2:P2');
  const a2 = ws.getCell('A2');
  a2.value = 'SECÇÃO 7 - DADOS ESTATÍSTICOS SOBRE PESSOAL NÃO DOCENTE, ADMINISTRATIVO E AUXILIAR';
  a2.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLOR_HEADER_FILL } };
  a2.alignment = { vertical: 'middle', horizontal: 'left' };

  const naturezas = ['PÚBLICA', 'PÚBLICO-PRIVADA', 'PRIVADA'];

  // ==========================================
  // TABELA 1: Pessoal nas Creches / Jardins / Centros Infantis
  // ==========================================
  ws.getCell('A4').value = 'TABELA 7.1 – Pessoal nas Creches, Jardins de Infância e Centros Infantis';
  ws.getCell('A4').font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };

  ws.mergeCells('A5:A6');
  styleHeaderCell(ws.getCell('A5'), 'ESTABELECIMENTO');
  ws.mergeCells('B5:B6');
  styleHeaderCell(ws.getCell('B5'), 'NATUREZA');
  ws.mergeCells('C5:D5');
  styleHeaderCell(ws.getCell('C5'), 'TOTAL GERAL');
  styleHeaderCell(ws.getCell('C6'), 'Total (MF)');
  styleHeaderCell(ws.getCell('D6'), 'Total (F)');

  const rolesInfantil = [
    { label: 'Educadores de Infância', mf: 'E', f: 'F' },
    { label: 'Auxiliares de Acção Educativa', mf: 'G', f: 'H' },
    { label: 'Secretárias', mf: 'I', f: 'J' },
    { label: 'Auxiliares de Limpeza', mf: 'K', f: 'L' },
    { label: 'Guardas', mf: 'M', f: 'N' },
    { label: 'Vigilantes de Saúde / Outros', mf: 'O', f: 'P' }
  ];

  rolesInfantil.forEach(r => {
    ws.mergeCells(`${r.mf}5:${r.f}5`);
    styleHeaderCell(ws.getCell(`${r.mf}5`), r.label);
    styleHeaderCell(ws.getCell(`${r.mf}6`), 'MF');
    styleHeaderCell(ws.getCell(`${r.f}6`), 'F');
  });

  const colsMF1 = rolesInfantil.map(r => r.mf);
  const colsF1 = rolesInfantil.map(r => r.f);

  let curRow = 7;
  const t1Start = curRow;

  naturezas.forEach(nat => {
    styleLabelCell(ws.getCell(`A${curRow}`), 'Centros Infantis e Jardins');
    styleLabelCell(ws.getCell(`B${curRow}`), nat);

    fillInputPairs(ws, curRow, colsMF1, colsF1);
    const sumMF = colsMF1.map(c => `${c}${curRow}`).join(',');
    const sumF = colsF1.map(c => `${c}${curRow}`).join(',');
    styleFormulaCell(ws.getCell(`C${curRow}`), `SUM(${sumMF})`);
    styleFormulaCell(ws.getCell(`D${curRow}`), `SUM(${sumF})`);
    curRow++;
  });
  ws.mergeCells(`A${t1Start}:A${curRow - 1}`);
  ws.getCell(`A${t1Start}`).alignment = { vertical: 'middle', horizontal: 'left' };

  const totRow1 = curRow;
  styleSubtotalCell(ws.getCell(`A${totRow1}`), 'TOTAL');
  styleSubtotalCell(ws.getCell(`B${totRow1}`), 'PRÉ-ESCOLAR');
  ['C', 'D', ...colsMF1, ...colsF1].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}${totRow1}`), `SUM(${col}${t1Start}:${col}${totRow1 - 1})`, true);
  });
  curRow++;

  // ==========================================
  // TABELA 2: Pessoal Administrativo e Auxiliar por Tipo de Escola
  // ==========================================
  curRow += 2;
  ws.getCell(`A${curRow}`).value = 'TABELA 7.2 – Pessoal Administrativo e Auxiliar por Tipo de Escola e Natureza';
  ws.getCell(`A${curRow}`).font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };
  curRow++;

  const h1T2 = curRow;
  const h2T2 = curRow + 1;
  ws.mergeCells(`A${h1T2}:A${h2T2}`);
  styleHeaderCell(ws.getCell(`A${h1T2}`), 'TIPO DE ESCOLA');
  ws.mergeCells(`B${h1T2}:B${h2T2}`);
  styleHeaderCell(ws.getCell(`B${h1T2}`), 'NATUREZA');
  ws.mergeCells(`C${h1T2}:D${h1T2}`);
  styleHeaderCell(ws.getCell(`C${h1T2}`), 'TOTAL PESSOAL');
  styleHeaderCell(ws.getCell(`C${h2T2}`), 'Total (MF)');
  styleHeaderCell(ws.getCell(`D${h2T2}`), 'Total (F)');

  const rolesEscola = [
    { label: 'Docentes Administrativos', mf: 'E', f: 'F' },
    { label: 'Técnicos Administrativos / Secretárias', mf: 'G', f: 'H' },
    { label: 'Guardas / Segurança', mf: 'I', f: 'J' },
    { label: 'Pessoal de Limpeza', mf: 'K', f: 'L' },
    { label: 'Outros Auxiliares', mf: 'M', f: 'N' }
  ];

  rolesEscola.forEach(r => {
    ws.mergeCells(`${r.mf}${h1T2}:${r.f}${h1T2}`);
    styleHeaderCell(ws.getCell(`${r.mf}${h1T2}`), r.label);
    styleHeaderCell(ws.getCell(`${r.mf}${h2T2}`), 'MF');
    styleHeaderCell(ws.getCell(`${r.f}${h2T2}`), 'F');
  });

  const colsMF2 = rolesEscola.map(r => r.mf);
  const colsF2 = rolesEscola.map(r => r.f);

  const schoolTypes = [
    'Escolas Primárias',
    'Colégios',
    'Escolas Técnicas',
    'Liceus',
    'Institutos Politécnicos',
    'Magistérios',
    'Complexos Escolares',
    'Escolas Específicas de Educação Especial'
  ];

  curRow = h2T2 + 1;
  const schoolSubtotals = [];

  schoolTypes.forEach(stype => {
    const startType = curRow;
    naturezas.forEach(nat => {
      styleLabelCell(ws.getCell(`A${curRow}`), curRow === startType ? stype : '');
      styleLabelCell(ws.getCell(`B${curRow}`), nat);

      fillInputPairs(ws, curRow, colsMF2, colsF2);
      const sumMF = colsMF2.map(c => `${c}${curRow}`).join(',');
      const sumF = colsF2.map(c => `${c}${curRow}`).join(',');
      styleFormulaCell(ws.getCell(`C${curRow}`), `SUM(${sumMF})`);
      styleFormulaCell(ws.getCell(`D${curRow}`), `SUM(${sumF})`);
      curRow++;
    });

    ws.mergeCells(`A${startType}:A${curRow - 1}`);
    ws.getCell(`A${startType}`).alignment = { vertical: 'middle', horizontal: 'left' };

    const sub = curRow;
    schoolSubtotals.push(sub);
    styleSubtotalCell(ws.getCell(`A${sub}`), 'SUBTOTAL');
    styleSubtotalCell(ws.getCell(`B${sub}`), stype);
    ['C', 'D', ...colsMF2, ...colsF2].forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${sub}`), `SUM(${col}${startType}:${col}${sub - 1})`, true);
    });
    curRow++;
  });

  // TOTAL GERAL TABELA 2
  const totRow2 = curRow;
  styleSubtotalCell(ws.getCell(`A${totRow2}`), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell(`B${totRow2}`), 'ADMINISTRATIVO / AUXILIAR');
  ['C', 'D', ...colsMF2, ...colsF2].forEach(col => {
    const list = schoolSubtotals.map(r => `${col}${r}`).join(',');
    styleSubtotalCell(ws.getCell(`${col}${totRow2}`), `SUM(${list})`, true);
  });
}
