import {
  FONT_FAMILY,
  COLOR_HEADER_FILL,
  borderThin,
  styleHeaderCell,
  styleLabelCell
} from '../sige_styles.js';

export function buildEscolasSemDadosSheet(workbook) {
  const ws = workbook.addWorksheet('8 - ESCOLAS Q N ENVIARAM DADOS', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 4, showGridLines: true }]
  });

  ws.columns = [
    { width: 35 }, // A: Nome da Escola
    { width: 18 }, // B: Número da Escola
    { width: 22 }, // C: Natureza da Escola
    { width: 25 }, // D: Designação da Escola
    { width: 28 }, // E: Oferta Educativa
    { width: 22 }, // F: Contactos da Escola
    { width: 24 }, // G: Foi contabilizada nas escolas em funcionamento? (SIM/NÃO)
    { width: 22 }, // H: Forneceu dados do início do ano? (SIM/NÃO)
    { width: 20 }, // I: Forneceu aproveitamento? (SIM/NÃO)
    { width: 30 }  // J: Observação
  ];

  // Title
  ws.mergeCells('A2:J2');
  const a2 = ws.getCell('A2');
  a2.value = 'SECÇÃO 8 - RELAÇÃO DE ESCOLAS QUE NÃO ENVIARAM DADOS ESTATÍSTICOS AO SIGE';
  a2.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLOR_HEADER_FILL } };
  a2.alignment = { vertical: 'middle', horizontal: 'left' };

  // Headers (Row 4)
  const headers = [
    'NOME DA ESCOLA',
    'NÚMERO DA ESCOLA',
    'NATUREZA DA ESCOLA',
    'DESIGNAÇÃO DA ESCOLA',
    'OFERTA EDUCATIVA',
    'CONTACTOS DA ESCOLA',
    'FOI CONTABILIZADA NAS ESCOLAS EM FUNCIONAMENTO? (SIM/NÃO)',
    'FORNECEU DADOS DO INÍCIO DO ANO? (SIM/NÃO)',
    'FORNECEU APROVEITAMENTO? (SIM/NÃO)',
    'OBSERVAÇÃO'
  ];

  headers.forEach((h, idx) => {
    const colLetter = String.fromCharCode(65 + idx);
    const cell = ws.getCell(`${colLetter}4`);
    styleHeaderCell(cell, h);
  });
  ws.getRow(4).height = 36;

  // 200 blank rows ready for input
  for (let r = 5; r <= 205; r++) {
    for (let c = 0; c < 10; c++) {
      const colLetter = String.fromCharCode(65 + c);
      const cell = ws.getCell(`${colLetter}${r}`);
      cell.value = '';
      cell.font = { name: FONT_FAMILY, size: 10 };
      cell.border = borderThin;
      cell.alignment = { vertical: 'middle', horizontal: c === 1 || c >= 6 && c <= 8 ? 'center' : 'left' };
    }
  }
}
