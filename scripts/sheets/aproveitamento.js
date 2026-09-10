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
  styleLabelCell,
  applyFValidation
} from '../sige_styles.js';

export function buildAproveitamentoSheet(workbook) {
  const ws = workbook.addWorksheet('4 - APROVEITAMENTO', {
    views: [{ state: 'frozen', xSplit: 3, ySplit: 6, showGridLines: true }]
  });

  ws.columns = [
    { width: 28 }, // A: Nível / Subsistema
    { width: 22 }, // B: Natureza de Ensino
    { width: 22 }, // C: Classe / Modalidade
    { width: 14 }, // D: Matriculados (MF)
    { width: 14 }, // E: Matriculados (F)
    { width: 14 }, // F: Aprovados (MF)
    { width: 14 }, // G: Aprovados (F)
    { width: 14 }, // H: Reprovados (MF)
    { width: 14 }, // I: Reprovados (F)
    { width: 14 }, // J: Desistidos (MF)
    { width: 14 }, // K: Desistidos (F)
    { width: 15 }, // L: Validação (MF) -> =IF(D=F+H+J,"Correcto","Falso")
    { width: 15 }, // M: Validação (F)  -> =IF(E=G+I+K,"Correcto","Falso")
    { width: 15 }, // N: Diferença MF (Residual) -> =D-(F+H+J)
    { width: 15 }, // O: Diferença F (Residual)  -> =E-(G+I+K)
    { width: 14 }, // P: % Aprovados -> =IF(D>0,F/D,0)
    { width: 14 }  // Q: % Desistentes -> =IF(D>0,J/D,0)
  ];

  // Section Header
  ws.mergeCells('A2:Q2');
  const a2 = ws.getCell('A2');
  a2.value = 'SECÇÃO 4 - DADOS ESTATÍSTICOS SOBRE APROVEITAMENTO ESCOLAR';
  a2.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLOR_HEADER_FILL } };
  a2.alignment = { vertical: 'middle', horizontal: 'left' };

  ws.getCell('A4').value = 'TABELA 4.1 – Rendimento e Aproveitamento Escolar por Nível de Ensino, Classe e Natureza';
  ws.getCell('A4').font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };

  // Headers (Row 5 & 6)
  ws.mergeCells('A5:A6');
  styleHeaderCell(ws.getCell('A5'), 'SUBSISTEMA / NÍVEL');
  ws.mergeCells('B5:B6');
  styleHeaderCell(ws.getCell('B5'), 'NATUREZA DE ENSINO');
  ws.mergeCells('C5:C6');
  styleHeaderCell(ws.getCell('C5'), 'CLASSE / ETAPA');

  ws.mergeCells('D5:E5');
  styleHeaderCell(ws.getCell('D5'), 'ALUNOS MATRICULADOS');
  styleHeaderCell(ws.getCell('D6'), 'Total (MF)');
  styleHeaderCell(ws.getCell('E6'), 'Total (F)');

  ws.mergeCells('F5:G5');
  styleHeaderCell(ws.getCell('F5'), 'ALUNOS APROVADOS');
  styleHeaderCell(ws.getCell('F6'), 'Total (MF)');
  styleHeaderCell(ws.getCell('G6'), 'Total (F)');

  ws.mergeCells('H5:I5');
  styleHeaderCell(ws.getCell('H5'), 'ALUNOS REPROVADOS');
  styleHeaderCell(ws.getCell('H6'), 'Total (MF)');
  styleHeaderCell(ws.getCell('I6'), 'Total (F)');

  ws.mergeCells('J5:K5');
  styleHeaderCell(ws.getCell('J5'), 'ALUNOS DESISTIDOS');
  styleHeaderCell(ws.getCell('J6'), 'Total (MF)');
  styleHeaderCell(ws.getCell('K6'), 'Total (F)');

  ws.mergeCells('L5:M5');
  styleHeaderCell(ws.getCell('L5'), 'VALIDAÇÃO (CONSISTÊNCIA)');
  styleHeaderCell(ws.getCell('L6'), 'Validação (MF)');
  styleHeaderCell(ws.getCell('M6'), 'Validação (F)');

  ws.mergeCells('N5:O5');
  styleHeaderCell(ws.getCell('N5'), 'DIFERENÇA (RESIDUAL 0 = OK)');
  styleHeaderCell(ws.getCell('N6'), 'Residual (MF)');
  styleHeaderCell(ws.getCell('O6'), 'Residual (F)');

  ws.mergeCells('P5:Q5');
  styleHeaderCell(ws.getCell('P5'), 'INDICADORES (%)');
  styleHeaderCell(ws.getCell('P6'), '% Aprovados');
  styleHeaderCell(ws.getCell('Q6'), '% Desistentes');

  // Helper to add data row with standard consistency formulas and F <= MF validations
  function addDataRow(r, subsistema, natureza, classe) {
    styleLabelCell(ws.getCell(`A${r}`), subsistema);
    styleLabelCell(ws.getCell(`B${r}`), natureza);
    styleLabelCell(ws.getCell(`C${r}`), classe);

    // Initial values 0
    styleInputCell(ws.getCell(`D${r}`), 0);
    styleInputCell(ws.getCell(`E${r}`), 0, `D${r}`);
    styleInputCell(ws.getCell(`F${r}`), 0);
    styleInputCell(ws.getCell(`G${r}`), 0, `F${r}`);
    styleInputCell(ws.getCell(`H${r}`), 0);
    styleInputCell(ws.getCell(`I${r}`), 0, `H${r}`);
    styleInputCell(ws.getCell(`J${r}`), 0);
    styleInputCell(ws.getCell(`K${r}`), 0, `J${r}`);

    // Col L: Validação MF: =IF(D=F+H+J,"Correcto","Falso")
    const cellL = ws.getCell(`L${r}`);
    cellL.value = { formula: `IF(D${r}=F${r}+H${r}+J${r},"Correcto","Falso")` };
    cellL.font = { name: FONT_FAMILY, size: 9, bold: true };
    cellL.alignment = { vertical: 'middle', horizontal: 'center' };
    cellL.border = borderThin;

    // Col M: Validação F: =IF(E=G+I+K,"Correcto","Falso")
    const cellM = ws.getCell(`M${r}`);
    cellM.value = { formula: `IF(E${r}=G${r}+I${r}+K${r},"Correcto","Falso")` };
    cellM.font = { name: FONT_FAMILY, size: 9, bold: true };
    cellM.alignment = { vertical: 'middle', horizontal: 'center' };
    cellM.border = borderThin;

    // Col N: Diferença MF (residual): =D-(F+H+J)
    const cellN = ws.getCell(`N${r}`);
    cellN.value = { formula: `D${r}-(F${r}+H${r}+J${r})` };
    cellN.font = { name: FONT_FAMILY, size: 9, bold: true };
    cellN.alignment = { vertical: 'middle', horizontal: 'center' };
    cellN.border = borderThin;
    cellN.numFmt = '#,##0';

    // Col O: Diferença F (residual): =E-(G+I+K)
    const cellO = ws.getCell(`O${r}`);
    cellO.value = { formula: `E${r}-(G${r}+I${r}+K${r})` };
    cellO.font = { name: FONT_FAMILY, size: 9, bold: true };
    cellO.alignment = { vertical: 'middle', horizontal: 'center' };
    cellO.border = borderThin;
    cellO.numFmt = '#,##0';

    // Col P: % Aprovados: =IF(D>0, F/D, 0)
    const cellP = ws.getCell(`P${r}`);
    cellP.value = { formula: `IF(D${r}>0,F${r}/D${r},0)` };
    cellP.font = { name: FONT_FAMILY, size: 9 };
    cellP.alignment = { vertical: 'middle', horizontal: 'center' };
    cellP.border = borderThin;
    cellP.numFmt = '0.0%';

    // Col Q: % Desistentes: =IF(D>0, J/D, 0)
    const cellQ = ws.getCell(`Q${r}`);
    cellQ.value = { formula: `IF(D${r}>0,J${r}/D${r},0)` };
    cellQ.font = { name: FONT_FAMILY, size: 9 };
    cellQ.alignment = { vertical: 'middle', horizontal: 'center' };
    cellQ.border = borderThin;
    cellQ.numFmt = '0.0%';
  }

  // Helper to add subtotal row with formulas matching specifications
  function addSubtotalRow(subRow, startR, endR, subLabel, detailLabel) {
    styleSubtotalCell(ws.getCell(`A${subRow}`), 'SUBTOTAL');
    styleSubtotalCell(ws.getCell(`B${subRow}`), subLabel);
    styleSubtotalCell(ws.getCell(`C${subRow}`), detailLabel);

    const cols = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    cols.forEach(col => {
      styleSubtotalCell(ws.getCell(`${col}${subRow}`), `SUM(${col}${startR}:${col}${endR})`, true);
    });

    // Subtotal Consistency and Residual
    const cellL = ws.getCell(`L${subRow}`);
    cellL.value = { formula: `IF(D${subRow}=F${subRow}+H${subRow}+J${subRow},"Correcto","Falso")` };
    cellL.font = { name: FONT_FAMILY, size: 9, bold: true };
    cellL.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBTOTAL_FILL } };
    cellL.alignment = { vertical: 'middle', horizontal: 'center' };
    cellL.border = borderThin;

    const cellM = ws.getCell(`M${subRow}`);
    cellM.value = { formula: `IF(E${subRow}=G${subRow}+I${subRow}+K${subRow},"Correcto","Falso")` };
    cellM.font = { name: FONT_FAMILY, size: 9, bold: true };
    cellM.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBTOTAL_FILL } };
    cellM.alignment = { vertical: 'middle', horizontal: 'center' };
    cellM.border = borderThin;

    const cellN = ws.getCell(`N${subRow}`);
    cellN.value = { formula: `D${subRow}-(F${subRow}+H${subRow}+J${subRow})` };
    cellN.font = { name: FONT_FAMILY, size: 9, bold: true };
    cellN.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBTOTAL_FILL } };
    cellN.alignment = { vertical: 'middle', horizontal: 'center' };
    cellN.border = borderThin;
    cellN.numFmt = '#,##0';

    const cellO = ws.getCell(`O${subRow}`);
    cellO.value = { formula: `IF(D${subRow}>0,F${subRow}/D${subRow},0)` };
    cellO.font = { name: FONT_FAMILY, size: 9, bold: true };
    cellO.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBTOTAL_FILL } };
    cellO.alignment = { vertical: 'middle', horizontal: 'center' };
    cellO.border = borderThin;
    cellO.numFmt = '0.0%';

    const cellP = ws.getCell(`P${subRow}`);
    cellP.value = { formula: `IF(D${subRow}>0,J${subRow}/D${subRow},0)` };
    cellP.font = { name: FONT_FAMILY, size: 9, bold: true };
    cellP.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBTOTAL_FILL } };
    cellP.alignment = { vertical: 'middle', horizontal: 'center' };
    cellP.border = borderThin;
    cellP.numFmt = '0.0%';
  }

  // 1. EDUCAÇÃO PRÉ-ESCOLAR
  // Must end with Subtotal at row 275 (data rows 7 to 274 = 268 rows)
  const preModalities = ['Creche (0-1 ano)', 'Creche (1-2 anos)', 'Jardim de Infância (3 anos)', 'Jardim de Infância (4 anos)', 'Jardim de Infância (5 anos)', 'Iniciação (5 anos)', 'Iniciação (6 anos)', 'Centro Infantil Comunitário (CIC)'];
  const naturezasList = ['PÚBLICA', 'PÚBLICO-PRIVADA', 'PRIVADA', 'COMUNITÁRIA'];
  const turnos = ['Turno da Manhã', 'Turno da Tarde', 'Regime Integral', 'Geral'];

  let rIdx = 0;
  for (let r = 7; r <= 274; r++) {
    const mod = preModalities[rIdx % preModalities.length];
    const nat = naturezasList[Math.floor(rIdx / preModalities.length) % naturezasList.length];
    const tur = turnos[Math.floor(rIdx / (preModalities.length * naturezasList.length)) % turnos.length];
    addDataRow(r, 'Educação Pré-Escolar', nat, `${mod} - ${tur}`);
    rIdx++;
  }
  // Row 275: Subtotal Educação Pré-Escolar
  addSubtotalRow(275, 7, 274, 'EDUCAÇÃO PRÉ-ESCOLAR', 'TODAS AS MODALIDADES');

  // 2. ENSINO PRIMÁRIO
  // Starts at row 277, ends at row 326 (50 rows: 277 to 326), subtotal at row 327
  const primClasses = ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe', '6ª Classe'];
  const primProgramas = ['Regular', 'PRAEER - Aceleração Escolar', 'EJA - Educação de Adultos'];
  rIdx = 0;
  for (let r = 277; r <= 326; r++) {
    const cls = primClasses[rIdx % primClasses.length];
    const prog = primProgramas[Math.floor(rIdx / primClasses.length) % primProgramas.length];
    const nat = naturezasList[Math.floor(rIdx / (primClasses.length * primProgramas.length)) % 3];
    addDataRow(r, 'Ensino Primário', nat, `${cls} (${prog})`);
    rIdx++;
  }
  // Row 327: Subtotal Ensino Primário
  addSubtotalRow(327, 277, 326, 'ENSINO PRIMÁRIO', '1ª À 6ª CLASSE / REGULAR, PRAEER E EJA');

  // 3. I CICLO DO ENSINO SECUNDÁRIO
  // Starts at row 329, ends at row 350 (22 rows: 329 to 350), subtotal at row 351
  const iCicloClasses = ['7ª Classe', '8ª Classe', '9ª Classe'];
  const iCicloRamos = ['Ensino Secundário Geral', 'Técnico-Profissional', 'EJA Secundário'];
  rIdx = 0;
  for (let r = 329; r <= 350; r++) {
    const cls = iCicloClasses[rIdx % iCicloClasses.length];
    const ramo = iCicloRamos[Math.floor(rIdx / iCicloClasses.length) % iCicloRamos.length];
    const nat = naturezasList[Math.floor(rIdx / (iCicloClasses.length * iCicloRamos.length)) % 3];
    addDataRow(r, 'I Ciclo Ensino Secundário', nat, `${cls} - ${ramo}`);
    rIdx++;
  }
  // Row 351: Subtotal I Ciclo
  addSubtotalRow(351, 329, 350, 'I CICLO DO ENSINO SECUNDÁRIO', '7ª, 8ª E 9ª CLASSE');

  // 4. II CICLO DO ENSINO SECUNDÁRIO
  // Starts at row 353, ends at row 370 (18 rows: 353 to 370), subtotal at row 371
  const iiCicloClasses = ['10ª Classe', '11ª Classe', '12ª Classe', '13ª Classe'];
  const iiCicloCursos = ['Ciências Físicas e Biológicas', 'Ciências Económico-Jurídicas', 'Ciências Humanas', 'Técnico de Informática', 'Técnico de Saúde', 'Magistério Primário'];
  rIdx = 0;
  for (let r = 353; r <= 370; r++) {
    const cls = iiCicloClasses[rIdx % iiCicloClasses.length];
    const curso = iiCicloCursos[Math.floor(rIdx / iiCicloClasses.length) % iiCicloCursos.length];
    const nat = naturezasList[Math.floor(rIdx / (iiCicloClasses.length * iiCicloCursos.length)) % 3];
    addDataRow(r, 'II Ciclo Ensino Secundário', nat, `${cls} (${curso})`);
    rIdx++;
  }
  // Row 371: Subtotal II Ciclo
  addSubtotalRow(371, 353, 370, 'II CICLO DO ENSINO SECUNDÁRIO', '10ª À 13ª CLASSE');

  // Row 373: TOTAL GERAL DOS NÍVEIS DE ENSINO
  const totRow = 373;
  styleSubtotalCell(ws.getCell(`A${totRow}`), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell(`B${totRow}`), 'TODOS OS SUBSISTEMAS');
  styleSubtotalCell(ws.getCell(`C${totRow}`), 'PRÉ-ESCOLAR, PRIMÁRIO, I E II CICLOS');

  const subRows = [275, 327, 351, 371];
  const cols = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
  cols.forEach(col => {
    const sumRefs = subRows.map(sr => `${col}${sr}`).join(',');
    styleSubtotalCell(ws.getCell(`${col}${totRow}`), `SUM(${sumRefs})`, true);
  });

  // Consistency on Total Geral
  const totL = ws.getCell(`L${totRow}`);
  totL.value = { formula: `IF(D${totRow}=F${totRow}+H${totRow}+J${totRow},"Correcto","Falso")` };
  totL.font = { name: FONT_FAMILY, size: 9, bold: true };
  totL.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBTOTAL_FILL } };
  totL.alignment = { vertical: 'middle', horizontal: 'center' };
  totL.border = borderThin;

  const totM = ws.getCell(`M${totRow}`);
  totM.value = { formula: `IF(E${totRow}=G${totRow}+I${totRow}+K${totRow},"Correcto","Falso")` };
  totM.font = { name: FONT_FAMILY, size: 9, bold: true };
  totM.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBTOTAL_FILL } };
  totM.alignment = { vertical: 'middle', horizontal: 'center' };
  totM.border = borderThin;

  const totN = ws.getCell(`N${totRow}`);
  totN.value = { formula: `D${totRow}-(F${totRow}+H${totRow}+J${totRow})` };
  totN.font = { name: FONT_FAMILY, size: 9, bold: true };
  totN.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBTOTAL_FILL } };
  totN.alignment = { vertical: 'middle', horizontal: 'center' };
  totN.border = borderThin;
  totN.numFmt = '#,##0';

  const totO = ws.getCell(`O${totRow}`);
  totO.value = { formula: `IF(D${totRow}>0,F${totRow}/D${totRow},0)` };
  totO.font = { name: FONT_FAMILY, size: 9, bold: true };
  totO.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBTOTAL_FILL } };
  totO.alignment = { vertical: 'middle', horizontal: 'center' };
  totO.border = borderThin;
  totO.numFmt = '0.0%';

  const totP = ws.getCell(`P${totRow}`);
  totP.value = { formula: `IF(D${totRow}>0,J${totRow}/D${totRow},0)` };
  totP.font = { name: FONT_FAMILY, size: 9, bold: true };
  totP.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBTOTAL_FILL } };
  totP.alignment = { vertical: 'middle', horizontal: 'center' };
  totP.border = borderThin;
  totP.numFmt = '0.0%';
}
