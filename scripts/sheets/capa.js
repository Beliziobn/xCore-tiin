import {
  FONT_FAMILY,
  COLOR_HEADER_FILL,
  borderThin,
  borderMedium
} from '../sige_styles.js';

export function buildCapaSheet(workbook) {
  const ws = workbook.addWorksheet('CAPA', {
    views: [{ showGridLines: true }]
  });

  // Column widths
  ws.columns = [
    { width: 22 }, // A
    { width: 18 }, // B
    { width: 18 }, // C
    { width: 18 }, // D
    { width: 18 }, // E
    { width: 18 }, // F
    { width: 18 }, // G
    { width: 18 }, // H
    { width: 18 }  // I
  ];

  // Republic of Angola header
  ws.mergeCells('A4:I4');
  const a4 = ws.getCell('A4');
  a4.value = 'REPÚBLICA DE ANGOLA';
  a4.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: '000000' } };
  a4.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('A5:I5');
  const a5 = ws.getCell('A5');
  a5.value = 'MINISTÉRIO DA EDUCAÇÃO';
  a5.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: '000000' } };
  a5.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('A6:I6');
  const a6 = ws.getCell('A6');
  a6.value = 'GABINETE DE ESTUDOS, PLANEAMENTO E ESTATÍSTICA';
  a6.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };
  a6.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('A7:I7');
  const a7 = ws.getCell('A7');
  a7.value = 'DEPARTAMENTO DE ESTUDOS E ESTATÍSTICA';
  a7.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '595959' } };
  a7.alignment = { vertical: 'middle', horizontal: 'center' };

  // Main Instrument title (A10:I12)
  ws.mergeCells('A10:I12');
  const a10 = ws.getCell('A10');
  a10.value = 'INSTRUMENTO COMPLEMENTAR DO SIGE 2024/2025';
  a10.font = { name: FONT_FAMILY, size: 18, bold: true, color: { argb: 'FFFFFF' } };
  a10.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_FILL } };
  a10.alignment = { vertical: 'middle', horizontal: 'center' };
  a10.border = borderMedium;

  // Province and Municipality input rows
  const labelFont = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: '1F4E79' } };
  const inputFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };

  ws.getCell('A15').value = 'PROVÍNCIA:';
  ws.getCell('A15').font = labelFont;
  ws.getCell('A15').alignment = { vertical: 'middle', horizontal: 'left' };

  ws.mergeCells('B15:I15');
  const b15 = ws.getCell('B15');
  b15.value = '';
  b15.font = { name: FONT_FAMILY, size: 11, bold: true };
  b15.fill = inputFill;
  b15.border = {
    bottom: { style: 'medium', color: { argb: '1F4E79' } },
    top: { style: 'thin', color: { argb: 'D3D3D3' } },
    left: { style: 'thin', color: { argb: 'D3D3D3' } },
    right: { style: 'thin', color: { argb: 'D3D3D3' } }
  };
  b15.alignment = { vertical: 'middle', horizontal: 'left' };

  ws.getCell('A16').value = 'MUNICÍPIO:';
  ws.getCell('A16').font = labelFont;
  ws.getCell('A16').alignment = { vertical: 'middle', horizontal: 'left' };

  ws.mergeCells('B16:I16');
  const b16 = ws.getCell('B16');
  b16.value = '';
  b16.font = { name: FONT_FAMILY, size: 11, bold: true };
  b16.fill = inputFill;
  b16.border = {
    bottom: { style: 'medium', color: { argb: '1F4E79' } },
    top: { style: 'thin', color: { argb: 'D3D3D3' } },
    left: { style: 'thin', color: { argb: 'D3D3D3' } },
    right: { style: 'thin', color: { argb: 'D3D3D3' } }
  };
  b16.alignment = { vertical: 'middle', horizontal: 'left' };

  ws.getCell('A17').value = 'ESCOLA:';
  ws.getCell('A17').font = labelFont;
  ws.getCell('A17').alignment = { vertical: 'middle', horizontal: 'left' };

  ws.mergeCells('B17:I17');
  const b17 = ws.getCell('B17');
  b17.value = '';
  b17.font = { name: FONT_FAMILY, size: 11, bold: true };
  b17.fill = inputFill;
  b17.border = {
    bottom: { style: 'medium', color: { argb: '1F4E79' } },
    top: { style: 'thin', color: { argb: 'D3D3D3' } },
    left: { style: 'thin', color: { argb: 'D3D3D3' } },
    right: { style: 'thin', color: { argb: 'D3D3D3' } }
  };
  b17.alignment = { vertical: 'middle', horizontal: 'left' };

  ws.getCell('A18').value = 'CÓDIGO SIGE:';
  ws.getCell('A18').font = labelFont;
  ws.getCell('A18').alignment = { vertical: 'middle', horizontal: 'left' };

  ws.mergeCells('B18:I18');
  const b18 = ws.getCell('B18');
  b18.value = '';
  b18.font = { name: FONT_FAMILY, size: 11, bold: true };
  b18.fill = inputFill;
  b18.border = {
    bottom: { style: 'medium', color: { argb: '1F4E79' } },
    top: { style: 'thin', color: { argb: 'D3D3D3' } },
    left: { style: 'thin', color: { argb: 'D3D3D3' } },
    right: { style: 'thin', color: { argb: 'D3D3D3' } }
  };
  b18.alignment = { vertical: 'middle', horizontal: 'left' };

  // Section OBSERVAÇÕES GERAIS (A23:I23)
  ws.mergeCells('A23:I23');
  const a23 = ws.getCell('A23');
  a23.value = 'OBSERVAÇÕES GERAIS';
  a23.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FFFFFF' } };
  a23.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_FILL } };
  a23.alignment = { vertical: 'middle', horizontal: 'center' };
  a23.border = borderThin;

  // Educational Levels List (B24:B31)
  const levels = [
    'EDUCAÇÃO PRÉ-ESCOLAR',
    'ENSINO PRIMÁRIO',
    'ENSINO SECUNDÁRIO I CICLO',
    'ENSINO SECUNDÁRIO II CICLO',
    'EDUCAÇÃO ESPECIAL',
    'EDUCAÇÃO DE JOVENS E ADULTOS',
    'COMPLEXO ESCOLAR',
    'TOTAL'
  ];

  levels.forEach((lvl, idx) => {
    const row = 24 + idx;
    ws.mergeCells(`B${row}:C${row}`);
    const cell = ws.getCell(`B${row}`);
    cell.value = lvl;
    cell.font = { name: FONT_FAMILY, size: 10, bold: lvl === 'TOTAL', color: { argb: lvl === 'TOTAL' ? '1F4E79' : '000000' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lvl === 'TOTAL' ? 'D9D9D9' : 'F2F2F2' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = borderThin;
  });

  // Instructions text (E24:I31 merged)
  ws.mergeCells('E24:I31');
  const e24 = ws.getCell('E24');
  e24.value = `INSTRUÇÕES DE PREENCHIMENTO:

1. Por definição, todos os campos estarão preenchidos com 0;
2. Sempre colar dados provenientes de outros instrumentos, deve-se colar como número/valores para não remover a formatação da célula;
3. Não alterar a estrutura de colunas, linhas e fórmulas automáticas;
4. Distinguir sempre MF (Masculino + Feminino) de F (Feminino);
5. O preenchimento fidedigno é de carácter obrigatório nos termos da legislação em vigor.`;
  e24.font = { name: FONT_FAMILY, size: 10, italic: false, color: { argb: '1F4E79' } };
  e24.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } }; // Light yellow
  e24.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
  e24.border = borderThin;

  // Delivery dates section (row 33)
  ws.mergeCells('A33:B33');
  const a33 = ws.getCell('A33');
  a33.value = 'Data de entrega pelo GEPE:';
  a33.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '000000' } };
  a33.alignment = { vertical: 'middle', horizontal: 'left' };

  ws.mergeCells('C33:D33');
  const c33 = ws.getCell('C33');
  c33.value = '23 de Setembro de 2025';
  c33.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '1F4E79' } };
  c33.alignment = { vertical: 'middle', horizontal: 'center' };
  c33.border = borderThin;

  ws.mergeCells('F33:G33');
  const f33 = ws.getCell('F33');
  f33.value = 'Data de entrega ao GPE/SPE pela DME/SME:';
  f33.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '000000' } };
  f33.alignment = { vertical: 'middle', horizontal: 'right' };

  ws.mergeCells('H33:I33');
  const h33 = ws.getCell('H33');
  h33.value = '';
  h33.font = { name: FONT_FAMILY, size: 10 };
  h33.alignment = { vertical: 'middle', horizontal: 'center' };
  h33.border = {
    bottom: { style: 'medium', color: { argb: '1F4E79' } },
    top: { style: 'thin', color: { argb: 'D3D3D3' } },
    left: { style: 'thin', color: { argb: 'D3D3D3' } },
    right: { style: 'thin', color: { argb: 'D3D3D3' } }
  };
}
