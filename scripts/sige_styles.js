import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

// Palette & formatting constants
const COLOR_HEADER_FILL = '1F4E79'; // Dark Blue
const COLOR_SUBTOTAL_FILL = 'D9D9D9'; // Light Gray
const COLOR_FORMULA_FILL = 'FFF2CC'; // Light Yellow
const COLOR_NOTICE = 'C00000'; // Red
const FONT_FAMILY = 'Arial';

const borderThin = {
  top: { style: 'thin', color: { argb: 'D3D3D3' } },
  left: { style: 'thin', color: { argb: 'D3D3D3' } },
  bottom: { style: 'thin', color: { argb: 'D3D3D3' } },
  right: { style: 'thin', color: { argb: 'D3D3D3' } }
};

const borderMedium = {
  top: { style: 'medium', color: { argb: '1F4E79' } },
  left: { style: 'medium', color: { argb: '1F4E79' } },
  bottom: { style: 'medium', color: { argb: '1F4E79' } },
  right: { style: 'medium', color: { argb: '1F4E79' } }
};

function styleHeaderCell(cell, text) {
  if (text !== undefined) cell.value = text;
  cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FFFFFF' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_FILL } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = borderThin;
}

function styleSubtotalCell(cell, value, isFormula = false) {
  if (isFormula) {
    cell.value = { formula: value };
  } else if (value !== undefined) {
    cell.value = value;
  }
  cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '000000' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBTOTAL_FILL } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.border = borderThin;
  if (typeof cell.value === 'number' || isFormula) cell.numFmt = '#,##0';
}

function styleFormulaCell(cell, formula) {
  cell.value = { formula };
  cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '000000' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_FORMULA_FILL } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.border = borderThin;
  cell.numFmt = '#,##0';
}

function applyFValidation(cell, mfCellRef) {
  cell.dataValidation = {
    type: 'whole',
    operator: 'lessThanOrEqual',
    allowBlank: true,
    formulae: [mfCellRef],
    showErrorMessage: true,
    errorTitle: 'Mensagem de Erro',
    error: 'F não pode ser Superior a MF'
  };
}

function applyFValidationRange(ws, colF, colMF, startRow, endRow) {
  for (let r = startRow; r <= endRow; r++) {
    applyFValidation(ws.getCell(`${colF}${r}`), `${colMF}${r}`);
  }
}

function styleInputCell(cell, value = 0, mfCellRef = null) {
  cell.value = value;
  cell.font = { name: FONT_FAMILY, size: 10, color: { argb: '000000' } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.border = borderThin;
  cell.numFmt = '#,##0';
  if (mfCellRef) {
    applyFValidation(cell, mfCellRef);
  }
}

function fillInputPairs(ws, r, colsMF, colsF) {
  colsMF.forEach((colMF, i) => {
    const colF = colsF[i];
    styleInputCell(ws.getCell(`${colMF}${r}`), 0);
    styleInputCell(ws.getCell(`${colF}${r}`), 0, `${colMF}${r}`);
  });
}

function styleLabelCell(cell, text, bold = false, align = 'left') {
  cell.value = text;
  cell.font = { name: FONT_FAMILY, size: 10, bold, color: { argb: '000000' } };
  cell.alignment = { vertical: 'middle', horizontal: align };
  cell.border = borderThin;
}

export {
  ExcelJS,
  COLOR_HEADER_FILL,
  COLOR_SUBTOTAL_FILL,
  COLOR_FORMULA_FILL,
  COLOR_NOTICE,
  FONT_FAMILY,
  borderThin,
  borderMedium,
  styleHeaderCell,
  styleSubtotalCell,
  styleFormulaCell,
  styleInputCell,
  styleLabelCell,
  applyFValidation,
  applyFValidationRange,
  fillInputPairs
};
