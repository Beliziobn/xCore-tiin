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

export function buildConsolidadoSheet(workbook) {
  const ws = workbook.addWorksheet('9 - CONSOLIDADO', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 4, showGridLines: true }]
  });

  ws.columns = [
    { width: 34 }, // A: Nível / Categoria
    { width: 26 }, // B: Detalhe / Subsistema
    { width: 16 }, // C: Total (MF) / Matriculados (MF)
    { width: 16 }, // D: Total (F) / Matriculados (F)
    { width: 16 }, // E: Aprovados (MF)
    { width: 16 }, // F: Aprovados (F)
    { width: 16 }, // G: Reprovados (MF)
    { width: 16 }, // H: Reprovados (F)
    { width: 16 }, // I: Desistidos (MF)
    { width: 16 }, // J: Desistidos (F)
    { width: 16 }, // K: Validação (MF)
    { width: 16 }, // L: Validação (F)
    { width: 16 }  // M: Residual (MF)
  ];

  // Section Header
  ws.mergeCells('A2:M2');
  const a2 = ws.getCell('A2');
  a2.value = 'SECÇÃO 9 - QUADRO RESUMO E INDICADORES CONSOLIDADOS DO MUNICÍPIO';
  a2.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLOR_HEADER_FILL } };
  a2.alignment = { vertical: 'middle', horizontal: 'left' };

  // ==========================================
  // TABELA 1: Total de Alunos Matriculados – Consolidado
  // ==========================================
  ws.getCell('A4').value = 'TABELA 1 – Total de Alunos Matriculados – Consolidado por Nível de Ensino';
  ws.getCell('A4').font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };

  styleHeaderCell(ws.getCell('A5'), 'NÍVEL DE ENSINO');
  styleHeaderCell(ws.getCell('B5'), 'SUBSISTEMA');
  styleHeaderCell(ws.getCell('C5'), 'TOTAL (MF)');
  styleHeaderCell(ws.getCell('D5'), 'TOTAL (F)');

  const matriculadosNiveis = [
    { nivel: 'Educação Pré-Escolar', sub: 'Creches, Jardins e Iniciação', refMF: "'1 - ALUNOS MATRICULADOS'!C31+'1 - ALUNOS MATRICULADOS'!C40", refF: "'1 - ALUNOS MATRICULADOS'!D31+'1 - ALUNOS MATRICULADOS'!D40" },
    { nivel: 'Ensino Primário', sub: 'Regular, PRAEER e EJA', refMF: "'1 - ALUNOS MATRICULADOS'!D89+'1 - ALUNOS MATRICULADOS'!C128+'1 - ALUNOS MATRICULADOS'!C152", refF: "'1 - ALUNOS MATRICULADOS'!E89+'1 - ALUNOS MATRICULADOS'!D128+'1 - ALUNOS MATRICULADOS'!D152" },
    { nivel: 'Ensino Secundário I Ciclo', sub: 'Geral, Técnico e EJA', refMF: "'1 - ALUNOS MATRICULADOS'!C178+'1 - ALUNOS MATRICULADOS'!C214+'1 - ALUNOS MATRICULADOS'!C234", refF: "'1 - ALUNOS MATRICULADOS'!D178+'1 - ALUNOS MATRICULADOS'!D214+'1 - ALUNOS MATRICULADOS'!D234" },
    { nivel: 'Ensino Secundário II Ciclo', sub: 'Geral, Técnico e Magistério', refMF: "'1 - ALUNOS MATRICULADOS'!C260+'1 - ALUNOS MATRICULADOS'!C299+'1 - ALUNOS MATRICULADOS'!C325", refF: "'1 - ALUNOS MATRICULADOS'!D260+'1 - ALUNOS MATRICULADOS'!D299+'1 - ALUNOS MATRICULADOS'!D325" }
  ];

  matriculadosNiveis.forEach((m, idx) => {
    const r = 6 + idx;
    styleLabelCell(ws.getCell(`A${r}`), m.nivel);
    styleLabelCell(ws.getCell(`B${r}`), m.sub);
    styleFormulaCell(ws.getCell(`C${r}`), m.refMF);
    styleFormulaCell(ws.getCell(`D${r}`), m.refF);
  });

  styleSubtotalCell(ws.getCell('A10'), 'TOTAL GERAL MATRICULADOS');
  styleSubtotalCell(ws.getCell('B10'), 'TODOS OS NÍVEIS');
  styleSubtotalCell(ws.getCell('C10'), 'SUM(C6:C9)', true);
  styleSubtotalCell(ws.getCell('D10'), 'SUM(D6:D9)', true);

  // ==========================================
  // TABELA 2: Total de Pessoal Docente em Exercício – Consolidado
  // ==========================================
  ws.getCell('A12').value = 'TABELA 2 – Total de Pessoal Docente em Exercício – Consolidado';
  ws.getCell('A12').font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };

  styleHeaderCell(ws.getCell('A13'), 'NÍVEL DE ENSINO');
  styleHeaderCell(ws.getCell('B13'), 'REGIME');
  styleHeaderCell(ws.getCell('C13'), 'TOTAL DOCENTES (MF)');
  styleHeaderCell(ws.getCell('D13'), 'TOTAL DOCENTES (F)');

  const docentesNiveis = [
    { nivel: 'Educação Pré-Escolar', refMF: "'2 - PESSOAL_DOCENTE'!C19", refF: "'2 - PESSOAL_DOCENTE'!D19" },
    { nivel: 'Ensino Primário', refMF: "'2 - PESSOAL_DOCENTE'!C37", refF: "'2 - PESSOAL_DOCENTE'!D37" },
    { nivel: 'Ensino Secundário I Ciclo', refMF: "'2 - PESSOAL_DOCENTE'!C55", refF: "'2 - PESSOAL_DOCENTE'!D55" },
    { nivel: 'Ensino Secundário II Ciclo', refMF: "'2 - PESSOAL_DOCENTE'!C73", refF: "'2 - PESSOAL_DOCENTE'!D73" }
  ];

  docentesNiveis.forEach((d, idx) => {
    const r = 14 + idx;
    styleLabelCell(ws.getCell(`A${r}`), d.nivel);
    styleLabelCell(ws.getCell(`B${r}`), 'Docentes em Função');
    styleFormulaCell(ws.getCell(`C${r}`), d.refMF);
    styleFormulaCell(ws.getCell(`D${r}`), d.refF);
  });

  styleSubtotalCell(ws.getCell('A18'), 'TOTAL GERAL DOCENTES');
  styleSubtotalCell(ws.getCell('B18'), 'TODOS OS NÍVEIS');
  styleSubtotalCell(ws.getCell('C18'), 'SUM(C14:C17)', true);
  styleSubtotalCell(ws.getCell('D18'), 'SUM(D14:D17)', true);

  // ==========================================
  // TABELA 3 & 4: Escolas e Salas de Aula em Funcionamento
  // ==========================================
  ws.getCell('A20').value = 'TABELA 3 & 4 – Total de Escolas e Salas de Aula em Funcionamento – Consolidado';
  ws.getCell('A20').font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };

  styleHeaderCell(ws.getCell('A21'), 'INDICADOR');
  styleHeaderCell(ws.getCell('B21'), 'FONTE / FOLHA');
  styleHeaderCell(ws.getCell('C21'), 'QUANTIDADE TOTAL');
  styleHeaderCell(ws.getCell('D21'), 'OBSERVAÇÕES');

  const infraItems = [
    { label: 'Total de Escolas em Funcionamento', ref: "'3 - INFRAESTRUTURAS'!C55", obs: 'Todos os subsistemas' },
    { label: 'Salas de Aula Definitivas', ref: "'3 - INFRAESTRUTURAS'!D55", obs: 'Construção convencional' },
    { label: 'Salas de Aula Provisórias', ref: "'3 - INFRAESTRUTURAS'!E55", obs: 'Contentores / Chapas' },
    { label: 'Salas ao Ar Livre / Tendas', ref: "'3 - INFRAESTRUTURAS'!F55", obs: 'Precárias' },
    { label: 'Total de Salas de Aula Utilizadas', ref: "'3 - INFRAESTRUTURAS'!G55", obs: 'Capacidade instalada' }
  ];

  infraItems.forEach((it, idx) => {
    const r = 22 + idx;
    styleLabelCell(ws.getCell(`A${r}`), it.label);
    styleLabelCell(ws.getCell(`B${r}`), 'Infraestruturas');
    styleFormulaCell(ws.getCell(`C${r}`), it.ref);
    styleLabelCell(ws.getCell(`D${r}`), it.obs);
  });

  // ==========================================
  // TABELA 5: Total de Alunos Repetentes – Consolidado
  // ==========================================
  ws.getCell('A28').value = 'TABELA 5 – Total de Alunos Repetentes – Consolidado';
  ws.getCell('A28').font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };

  styleHeaderCell(ws.getCell('A29'), 'NÍVEL DE ENSINO');
  styleHeaderCell(ws.getCell('B29'), 'REGIME');
  styleHeaderCell(ws.getCell('C29'), 'REPETENTES (MF)');
  styleHeaderCell(ws.getCell('D29'), 'REPETENTES (F)');

  const repetNiveis = [
    { nivel: 'Ensino Primário', refMF: "'5 - ALUNOS REPETENTES'!C36", refF: "'5 - ALUNOS REPETENTES'!D36" },
    { nivel: 'Ensino Secundário I Ciclo', refMF: "'5 - ALUNOS REPETENTES'!C76", refF: "'5 - ALUNOS REPETENTES'!D76" },
    { nivel: 'Ensino Secundário II Ciclo', refMF: "'5 - ALUNOS REPETENTES'!C117", refF: "'5 - ALUNOS REPETENTES'!D117" }
  ];

  repetNiveis.forEach((rObj, idx) => {
    const r = 30 + idx;
    styleLabelCell(ws.getCell(`A${r}`), rObj.nivel);
    styleLabelCell(ws.getCell(`B${r}`), 'Regular');
    styleFormulaCell(ws.getCell(`C${r}`), rObj.refMF);
    styleFormulaCell(ws.getCell(`D${r}`), rObj.refF);
  });

  styleSubtotalCell(ws.getCell('A33'), 'TOTAL GERAL REPETENTES');
  styleSubtotalCell(ws.getCell('B33'), 'TODOS OS NÍVEIS');
  styleSubtotalCell(ws.getCell('C33'), 'SUM(C30:C32)', true);
  styleSubtotalCell(ws.getCell('D33'), 'SUM(D30:D32)', true);

  // ==========================================
  // TABELA 6: Total de Alunos com NEE – Consolidado
  // ==========================================
  ws.getCell('A35').value = 'TABELA 6 – Total de Alunos com Necessidades Educativas Especiais (NEE) – Consolidado';
  ws.getCell('A35').font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };

  styleHeaderCell(ws.getCell('A36'), 'NÍVEL / PROGRAMA');
  styleHeaderCell(ws.getCell('B36'), 'DISCRIMINAÇÃO');
  styleHeaderCell(ws.getCell('C36'), 'TOTAL NEE (MF)');
  styleHeaderCell(ws.getCell('D36'), 'TOTAL NEE (F)');

  const neeNiveis = [
    { nivel: 'Classe de Iniciação', refMF: "'6 - NECESSIDADES EDUCATIVA ESPE'!C10", refF: "'6 - NECESSIDADES EDUCATIVA ESPE'!D10" },
    { nivel: 'Ensino Primário Regular', refMF: "'6 - NECESSIDADES EDUCATIVA ESPE'!C19", refF: "'6 - NECESSIDADES EDUCATIVA ESPE'!D19" },
    { nivel: 'I Ciclo do Ensino Secundário', refMF: "'6 - NECESSIDADES EDUCATIVA ESPE'!C46", refF: "'6 - NECESSIDADES EDUCATIVA ESPE'!D46" },
    { nivel: 'II Ciclo do Ensino Secundário', refMF: "'6 - NECESSIDADES EDUCATIVA ESPE'!C73", refF: "'6 - NECESSIDADES EDUCATIVA ESPE'!D73" }
  ];

  neeNiveis.forEach((n, idx) => {
    const r = 37 + idx;
    styleLabelCell(ws.getCell(`A${r}`), n.nivel);
    styleLabelCell(ws.getCell(`B${r}`), 'Alunos Integrados com NEE');
    styleFormulaCell(ws.getCell(`C${r}`), n.refMF);
    styleFormulaCell(ws.getCell(`D${r}`), n.refF);
  });

  styleSubtotalCell(ws.getCell('A41'), 'TOTAL GERAL NEE');
  styleSubtotalCell(ws.getCell('B41'), 'TODOS OS NÍVEIS');
  styleSubtotalCell(ws.getCell('C41'), 'SUM(C37:C40)', true);
  styleSubtotalCell(ws.getCell('D41'), 'SUM(D37:D40)', true);

  // Spacing / Notice
  ws.getCell('A44').value = 'CONSISTÊNCIA DE DADOS: MATRICULADOS = APROVADOS + REPROVADOS + DESISTIDOS';
  ws.getCell('A44').font = { name: FONT_FAMILY, size: 9, italic: true, color: { argb: '595959' } };

  // ==========================================
  // TABELA 7: Aproveitamento Escolar – Síntese Consolidada
  // Header: Rows 47 & 48
  // Row 49: TOTAL CONSOLIDADO GERAL (K49, L49, M49)
  // Row 50: EDUCAÇÃO PRÉ-ESCOLAR (C50 = '4 - APROVEITAMENTO'!D275)
  // Row 51: ENSINO PRIMÁRIO (C51 = '4 - APROVEITAMENTO'!D327)
  // Row 52: I CICLO DO ENSINO SECUNDÁRIO (C52 = '4 - APROVEITAMENTO'!D351)
  // Row 53: II CICLO DO ENSINO SECUNDÁRIO (C53 = '4 - APROVEITAMENTO'!D371)
  // ==========================================
  ws.getCell('A46').value = 'TABELA 7 – Aproveitamento Escolar – Síntese Consolidada e Validação de Consistência';
  ws.getCell('A46').font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };

  ws.mergeCells('A47:A48');
  styleHeaderCell(ws.getCell('A47'), 'NÍVEL DE ENSINO');

  ws.mergeCells('B47:B48');
  styleHeaderCell(ws.getCell('B47'), 'SUBSISTEMA / ETAPA');

  ws.mergeCells('C47:D47');
  styleHeaderCell(ws.getCell('C47'), 'MATRICULADOS');
  styleHeaderCell(ws.getCell('C48'), 'MF');
  styleHeaderCell(ws.getCell('D48'), 'F');

  ws.mergeCells('E47:F47');
  styleHeaderCell(ws.getCell('E47'), 'APROVADOS');
  styleHeaderCell(ws.getCell('E48'), 'MF');
  styleHeaderCell(ws.getCell('F48'), 'F');

  ws.mergeCells('G47:H47');
  styleHeaderCell(ws.getCell('G47'), 'REPROVADOS');
  styleHeaderCell(ws.getCell('G48'), 'MF');
  styleHeaderCell(ws.getCell('H48'), 'F');

  ws.mergeCells('I47:J47');
  styleHeaderCell(ws.getCell('I47'), 'DESISTIDOS');
  styleHeaderCell(ws.getCell('I48'), 'MF');
  styleHeaderCell(ws.getCell('J48'), 'F');

  ws.mergeCells('K47:L47');
  styleHeaderCell(ws.getCell('K47'), 'VALIDAÇÃO');
  styleHeaderCell(ws.getCell('K48'), 'MF');
  styleHeaderCell(ws.getCell('L48'), 'F');

  ws.mergeCells('M47:M48');
  styleHeaderCell(ws.getCell('M47'), 'RESIDUAL (MF)');

  // ------------------------------------------
  // ROW 49: TOTAL CONSOLIDADO GERAL
  // ------------------------------------------
  styleSubtotalCell(ws.getCell('A49'), 'TOTAL GERAL');
  styleSubtotalCell(ws.getCell('B49'), 'TODOS OS SUBSISTEMAS');

  // Sums across rows 50 to 53 for C through J
  ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
    styleSubtotalCell(ws.getCell(`${col}49`), `SUM(${col}50:${col}53)`, true);
  });

  // Validation MF on Row 49: =IF(C49=E49+G49+I49,"Correcto","Falso")
  const k49 = ws.getCell('K49');
  k49.value = { formula: 'IF(C49=E49+G49+I49,"Correcto","Falso")' };
  k49.font = { name: FONT_FAMILY, size: 9, bold: true };
  k49.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBTOTAL_FILL } };
  k49.alignment = { vertical: 'middle', horizontal: 'center' };
  k49.border = borderThin;

  // Validation F on Row 49: =IF(D49=F49+H49+J49,"Correcto","Falso")
  const l49 = ws.getCell('L49');
  l49.value = { formula: 'IF(D49=F49+H49+J49,"Correcto","Falso")' };
  l49.font = { name: FONT_FAMILY, size: 9, bold: true };
  l49.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBTOTAL_FILL } };
  l49.alignment = { vertical: 'middle', horizontal: 'center' };
  l49.border = borderThin;

  // Residual MF on Row 49: =C49-(E49+G49+I49)
  const m49 = ws.getCell('M49');
  m49.value = { formula: 'C49-(E49+G49+I49)' };
  m49.font = { name: FONT_FAMILY, size: 9, bold: true };
  m49.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBTOTAL_FILL } };
  m49.alignment = { vertical: 'middle', horizontal: 'center' };
  m49.border = borderThin;
  m49.numFmt = '#,##0';

  // ------------------------------------------
  // ROWS 50, 51, 52, 53: Níveis de Ensino com referências cruzadas à Folha 4
  // ------------------------------------------
  const t7Levels = [
    {
      row: 50,
      nivel: 'EDUCAÇÃO PRÉ-ESCOLAR',
      etapa: 'Creches, Jardins e Iniciação',
      aprovRow: 275 // C50 = '4 - APROVEITAMENTO'!D275
    },
    {
      row: 51,
      nivel: 'ENSINO PRIMÁRIO',
      etapa: 'Regular, PRAEER e EJA',
      aprovRow: 327 // C51 = '4 - APROVEITAMENTO'!D327
    },
    {
      row: 52,
      nivel: 'I CICLO DO ENSINO SECUNDÁRIO',
      etapa: 'Geral, Técnico e EJA',
      aprovRow: 351 // C52 = '4 - APROVEITAMENTO'!D351
    },
    {
      row: 53,
      nivel: 'II CICLO DO ENSINO SECUNDÁRIO',
      etapa: 'Geral, Técnico e Magistério',
      aprovRow: 371 // C53 = '4 - APROVEITAMENTO'!D371
    }
  ];

  t7Levels.forEach(item => {
    const r = item.row;
    const aR = item.aprovRow;

    styleLabelCell(ws.getCell(`A${r}`), item.nivel, true);
    styleLabelCell(ws.getCell(`B${r}`), item.etapa);

    // Cross-sheet references to Folha 4
    styleFormulaCell(ws.getCell(`C${r}`), `'4 - APROVEITAMENTO'!D${aR}`); // Matriculados MF
    styleFormulaCell(ws.getCell(`D${r}`), `'4 - APROVEITAMENTO'!E${aR}`); // Matriculados F
    styleFormulaCell(ws.getCell(`E${r}`), `'4 - APROVEITAMENTO'!F${aR}`); // Aprovados MF
    styleFormulaCell(ws.getCell(`F${r}`), `'4 - APROVEITAMENTO'!G${aR}`); // Aprovados F
    styleFormulaCell(ws.getCell(`G${r}`), `'4 - APROVEITAMENTO'!H${aR}`); // Reprovados MF
    styleFormulaCell(ws.getCell(`H${r}`), `'4 - APROVEITAMENTO'!I${aR}`); // Reprovados F
    styleFormulaCell(ws.getCell(`I${r}`), `'4 - APROVEITAMENTO'!J${aR}`); // Desistidos MF
    styleFormulaCell(ws.getCell(`J${r}`), `'4 - APROVEITAMENTO'!K${aR}`); // Desistidos F

    // Validação MF: =IF(C=E+G+I,"Correcto","Falso")
    const valMF = ws.getCell(`K${r}`);
    valMF.value = { formula: `IF(C${r}=E${r}+G${r}+I${r},"Correcto","Falso")` };
    valMF.font = { name: FONT_FAMILY, size: 9, bold: true };
    valMF.alignment = { vertical: 'middle', horizontal: 'center' };
    valMF.border = borderThin;

    // Validação F: =IF(D=F+H+J,"Correcto","Falso")
    const valF = ws.getCell(`L${r}`);
    valF.value = { formula: `IF(D${r}=F${r}+H${r}+J${r},"Correcto","Falso")` };
    valF.font = { name: FONT_FAMILY, size: 9, bold: true };
    valF.alignment = { vertical: 'middle', horizontal: 'center' };
    valF.border = borderThin;

    // Residual MF: =C-(E+G+I)
    const resCell = ws.getCell(`M${r}`);
    resCell.value = { formula: `C${r}-(E${r}+G${r}+I${r})` };
    resCell.font = { name: FONT_FAMILY, size: 9, bold: true };
    resCell.alignment = { vertical: 'middle', horizontal: 'center' };
    resCell.border = borderThin;
    resCell.numFmt = '#,##0';
  });
}
