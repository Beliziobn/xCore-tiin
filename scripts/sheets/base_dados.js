import {
  FONT_FAMILY,
  COLOR_HEADER_FILL,
  borderThin,
  styleHeaderCell
} from '../sige_styles.js';

export function buildBaseDadosSheet(workbook) {
  const ws = workbook.addWorksheet('10 - BASE DE DADOS', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 4, showGridLines: true }]
  });

  ws.columns = [
    { width: 16 }, // A: ID / Código SIGE
    { width: 34 }, // B: Nome da Escola
    { width: 18 }, // C: Província
    { width: 20 }, // D: Município
    { width: 22 }, // E: Comuna / Distrito
    { width: 18 }, // F: Natureza
    { width: 26 }, // G: Nível Ministrado
    { width: 20 }, // H: Regime (Turnos)
    { width: 14 }, // I: Total Salas
    { width: 14 }, // J: Total Turmas
    { width: 15 }, // K: Alunos Mat. (MF)
    { width: 15 }, // L: Alunos Mat. (F)
    { width: 15 }, // M: Alunos Aprov. (MF)
    { width: 15 }, // N: Alunos Aprov. (F)
    { width: 15 }, // O: Alunos Reprov. (MF)
    { width: 15 }, // P: Alunos Reprov. (F)
    { width: 15 }, // Q: Alunos Desist. (MF)
    { width: 15 }, // R: Alunos Desist. (F)
    { width: 15 }, // S: Professores (MF)
    { width: 15 }, // T: Professores (F)
    { width: 15 }, // U: Não Docente (MF)
    { width: 15 }, // V: Não Docente (F)
    { width: 16 }, // W: Água Potável
    { width: 16 }, // X: Eletricidade
    { width: 16 }, // Y: Computadores
    { width: 16 }, // Z: Internet
    { width: 20 }, // AA: Telefone
    { width: 28 }  // AB: Email / Obs
  ];

  // Section Header
  ws.mergeCells('A2:AB2');
  const a2 = ws.getCell('A2');
  a2.value = 'SECÇÃO 10 - BASE DE DADOS GERAL DE ESCOLAS DO MUNICÍPIO (REGISTO ESCOLA-A-ESCOLA)';
  a2.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: COLOR_HEADER_FILL } };
  a2.alignment = { vertical: 'middle', horizontal: 'left' };

  const headers = [
    'CÓDIGO SIGE',
    'NOME DA ESCOLA',
    'PROVÍNCIA',
    'MUNICÍPIO',
    'COMUNA / DISTRITO',
    'NATUREZA',
    'NÍVEL MINISTRADO',
    'REGIME (TURNOS)',
    'TOTAL SALAS',
    'TOTAL TURMAS',
    'ALUNOS MAT. (MF)',
    'ALUNOS MAT. (F)',
    'ALUNOS APROV. (MF)',
    'ALUNOS APROV. (F)',
    'ALUNOS REPROV. (MF)',
    'ALUNOS REPROV. (F)',
    'ALUNOS DESIST. (MF)',
    'ALUNOS DESIST. (F)',
    'PROFESSORES (MF)',
    'PROFESSORES (F)',
    'NÃO DOCENTE (MF)',
    'NÃO DOCENTE (F)',
    'ÁGUA POTÁVEL',
    'ELETRICIDADE',
    'COMPUTADORES',
    'INTERNET',
    'CONTACTO TELEFÓNICO',
    'EMAIL / OBSERVAÇÕES'
  ];

  // Helper to convert 1-based index to Excel column letters (A, B, ..., Z, AA, AB)
  function getColLetter(colIdx) {
    let letter = '';
    let temp = colIdx;
    while (temp > 0) {
      let rem = (temp - 1) % 26;
      letter = String.fromCharCode(65 + rem) + letter;
      temp = Math.floor((temp - 1) / 26);
    }
    return letter;
  }

  headers.forEach((h, idx) => {
    const colStr = getColLetter(idx + 1);
    const cell = ws.getCell(`${colStr}4`);
    styleHeaderCell(cell, h);
  });
  ws.getRow(4).height = 36;

  // 150 rows prepared
  for (let r = 5; r <= 155; r++) {
    for (let c = 1; c <= headers.length; c++) {
      const colStr = getColLetter(c);
      const cell = ws.getCell(`${colStr}${r}`);
      // Numeric fields default to 0 for statistical columns
      if (c >= 9 && c <= 22) {
        cell.value = 0;
        cell.numFmt = '#,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.value = '';
        cell.alignment = { vertical: 'middle', horizontal: c === 1 || (c >= 23 && c <= 26) ? 'center' : 'left' };
      }
      cell.font = { name: FONT_FAMILY, size: 10 };
      cell.border = borderThin;
    }
  }
}
