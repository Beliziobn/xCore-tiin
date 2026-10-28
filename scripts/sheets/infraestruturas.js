import {
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

export function buildInfraestruturasSheet(workbook) {
  const ws = workbook.addWorksheet('3 - INFRAESTRUTURAS', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 6, showGridLines: true }]
  });

  ws.columns = [
    { width: 32 }, // A: Designação da Escola
    { width: 22 }, // B: Natureza da Escola
    { width: 16 }, // C: Nº de Escolas em Funcionamento
    { width: 16 }, // D: Salas Definitivas
    { width: 16 }, // E: Salas Provisórias
    { width: 16 }, // F: Salas ao Ar Livre / Tendas
    { width: 16 }, // G: Total de Salas de Aula
    { width: 15 }, // H: Casas de Banho
    { width: 15 }, // I: Água Potável (Sim/Não ou Nº)
    { width: 15 }, // J: Eletricidade (Sim/Não ou Nº)
    { width: 15 }, // K: Computadores p/ Alunos
    { width: 15 }  // L: Ligação à Internet
  ];

  // Section Header
  ws.mergeCells('A2:L2');
  const a2 = ws.getCell('A2');
  a2.value = 'SECÇÃO 3 - DADOS ESTATÍSTICOS SOBRE INFRAESTRUTURAS E ESCOLAS EM FUNCIONAMENTO';
  a2.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLOR_HEADER_FILL } };
  a2.alignment = { vertical: 'middle', horizontal: 'left' };

  ws.getCell('A4').value = 'TABELA 3.1 – Estabelecimentos de Ensino e Salas de Aula em Funcionamento por Tipologia e Natureza';
  ws.getCell('A4').font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };

  // Headers (Row 5 & 6)
  ws.mergeCells('A5:A6');
  styleHeaderCell(ws.getCell('A5'), 'DESIGNAÇÃO / TIPO DE ESCOLA');
  ws.mergeCells('B5:B6');
  styleHeaderCell(ws.getCell('B5'), 'NATUREZA JURÍDICA');
  ws.mergeCells('C5:C6');
  styleHeaderCell(ws.getCell('C5'), 'ESCOLAS EM FUNCIONAMENTO');

  ws.mergeCells('D5:G5');
  styleHeaderCell(ws.getCell('D5'), 'SALAS DE AULA UTILIZADAS');
  styleHeaderCell(ws.getCell('D6'), 'Definitivas');
  styleHeaderCell(ws.getCell('E6'), 'Provisórias');
  styleHeaderCell(ws.getCell('F6'), 'Ar Livre / Tendas');
  styleHeaderCell(ws.getCell('G6'), 'TOTAL SALAS');

  ws.mergeCells('H5:H6');
  styleHeaderCell(ws.getCell('H5'), 'LAVATÓRIOS / SANITÁRIOS');
  ws.mergeCells('I5:I6');
  styleHeaderCell(ws.getCell('I5'), 'COM ÁGUA');
  ws.mergeCells('J5:J6');
  styleHeaderCell(ws.getCell('J5'), 'COM ELETRICIDADE');
  ws.mergeCells('K5:K6');
  styleHeaderCell(ws.getCell('K5'), 'COMPUTADORES');
  ws.mergeCells('L5:L6');
  styleHeaderCell(ws.getCell('L5'), 'COM INTERNET');

  const schoolTypes = [
    'Escola Primária',
    'Colégio',
    'Escola Secundária do I Ciclo',
    'Liceu',
    'Instituto Politécnico / Técnico',
    'Magistério / Instituto Médio Pedagógico',
    'Complexo Escolar (Iniciação ao Primário)',
    'Complexo Escolar (Primário e I Ciclo)',
    'Complexo Escolar (I e II Ciclo)',
    'Complexo Escolar (Geral Completo)',
    'Escola Específica de Educação Especial',
    'Creches e Jardins de Infância'
  ];

  const naturezas = ['PÚBLICA', 'PÚBLICO-PRIVADA', 'PRIVADA'];
  let curRow = 7;
  const subtotalRows = [];

  schoolTypes.forEach(stype => {
    const startTypeRow = curRow;
    naturezas.forEach((nat, nIdx) => {
      styleLabelCell(ws.getCell(`A${curRow}`), nIdx === 0 ? stype : '');
      styleLabelCell(ws.getCell(`B${curRow}`), nat);

      // C: Escolas (input)
      styleInputCell(ws.getCell(`C${curRow}`), 0);
      // D, E, F: Salas (inputs)
      styleInputCell(ws.getCell(`D${curRow}`), 0);
      styleInputCell(ws.getCell(`E${curRow}`), 0);
      styleInputCell(ws.getCell(`F${curRow}`), 0);
      // G: Total Salas formula
      styleFormulaCell(ws.getCell(`G${curRow}`), `SUM(D${curRow}:F${curRow})`);

      // H, I, J, K, L: Inputs
      styleInputCell(ws.getCell(`H${curRow}`), 0);
      styleInputCell(ws.getCell(`I${curRow}`), 0);
      styleInputCell(ws.getCell(`J${curRow}`), 0);
      styleInputCell(ws.getCell(`K${curRow}`), 0);
      styleInputCell(ws.getCell(`L${curRow}`), 0);

      curRow++;
    });

    ws.mergeCells(`A${startTypeRow}:A${curRow - 1}`);
    ws.getCell(`A${startTypeRow}`).alignment = { vertical: 'middle', horizontal: 'left' };

    // Subtotal da tipologia
    const subRow = curRow;
    subtotalRows.push(subRow);
    styleSubtotalCell(ws.getCell(`A${subRow}`), `SUBTOTAL`);
    styleSubtotalCell(ws.getCell(`B${subRow}`), stype);
    ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${subRow}`), `SUM(${col}${startTypeRow}:${col}${subRow - 1})`, true);
    });
    curRow++;
  });

  // TOTAL GERAL DE INFRAESTRUTURAS
  const totalRow = curRow;
  styleSubtotalCell(ws.getCell(`A${totalRow}`), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell(`B${totalRow}`), 'TODAS AS TIPOLOGIAS');
  ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach(col => {
    const list = subtotalRows.map(r => `${col}${r}`).join(',');
    styleSubtotalCell(ws.getCell(`${col}${totalRow}`), `SUM(${list})`, true);
  });
}
