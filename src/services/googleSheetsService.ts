import { getAccessToken } from '../utils/googleAuth';
import type { SystemDataset } from '../utils/excelExport';
import {
  buildExecutiveSummarySheet,
  buildTeachersSheetData,
  buildDirectorsSheetData,
  buildStudentsSheetData,
  buildSchoolsSheetData,
  getUnifiedSystemDataset,
} from '../utils/excelExport';
import type { AdminTeacher, AdminStudent } from '../types';

export interface SheetDataDefinition {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface GoogleSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  sheetsCount: number;
  totalRows: number;
  createdAt: string;
}

export interface SavedSpreadsheetRecord {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  sheets: string[];
  totalRows: number;
}

/**
 * Converts an array of objects to headers and rows for Google Sheets
 */
export function recordsToSheetDefinition(title: string, records: Record<string, any>[]): SheetDataDefinition {
  if (!records || records.length === 0) {
    return {
      title,
      headers: ['Mensagem'],
      rows: [['Nenhum dado disponível']],
    };
  }

  const headers = Object.keys(records[0]);
  const rows = records.map((record) =>
    headers.map((key) => {
      const val = record[key];
      if (val === null || val === undefined) return '';
      return val;
    })
  );

  return {
    title,
    headers,
    rows,
  };
}

/**
 * Creates a brand new Google Spreadsheet in the authenticated user's Google Drive
 * and populates it with rich, multi-tab educational data and professional styling.
 */
export async function createGoogleSpreadsheet(
  title: string,
  sheets: SheetDataDefinition[]
): Promise<GoogleSpreadsheetResult> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Sessão Google não autenticada. Por favor, conecte a sua conta Google primeiro.');
  }

  // 1. Create the spreadsheet structure with tab titles and frozen header row
  const createPayload = {
    properties: {
      title,
      locale: 'pt_PT',
      autoRecalc: 'ON_CHANGE',
    },
    sheets: sheets.map((sheet) => ({
      properties: {
        title: sheet.title,
        gridProperties: {
          rowCount: Math.max(sheet.rows.length + 10, 50),
          columnCount: Math.max(sheet.headers.length + 2, 10),
          frozenRowCount: 1,
        },
      },
    })),
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errJson = await createRes.json().catch(() => ({}));
    const errMsg = errJson?.error?.message || createRes.statusText;
    throw new Error(`Falha ao criar folha no Google Sheets: ${errMsg}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl =
    createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Populate values in batch
  const valuesData = sheets.map((sheet) => ({
    range: `'${sheet.title}'!A1`,
    values: [sheet.headers, ...sheet.rows],
  }));

  const updateValuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valuesData,
      }),
    }
  );

  if (!updateValuesRes.ok) {
    console.warn('Aviso: Falha ao preencher valores iniciais da folha de cálculo');
  }

  // 3. Format header rows (uCore institutional navy #002133 background with crisp white bold text)
  try {
    const formatRequests: any[] = [];
    createdData.sheets?.forEach((sheetObj: any) => {
      const sheetId = sheetObj.properties.sheetId;
      // Style header row (Row 0)
      formatRequests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: 0 / 255,
                green: 33 / 255,
                blue: 51 / 255,
              },
              textFormat: {
                foregroundColor: { red: 1, green: 1, blue: 1 },
                bold: true,
                fontSize: 10,
              },
              horizontalAlignment: 'LEFT',
              verticalAlignment: 'MIDDLE',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
        },
      });

      // Auto-resize dimensions for legible columns
      formatRequests.push({
        autoResizeDimensions: {
          dimensions: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 25,
          },
        },
      });
    });

    if (formatRequests.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: formatRequests }),
      });
    }
  } catch (formatErr) {
    console.warn('Formatação adicional não aplicada, mantendo dados brutos legíveis:', formatErr);
  }

  const totalRows = sheets.reduce((acc, s) => acc + s.rows.length, 0);
  const result: GoogleSpreadsheetResult = {
    spreadsheetId,
    spreadsheetUrl,
    title,
    sheetsCount: sheets.length,
    totalRows,
    createdAt: new Date().toISOString(),
  };

  // Save to local session history for quick access and synchronization
  saveSpreadsheetToHistory({
    id: spreadsheetId,
    title,
    url: spreadsheetUrl,
    createdAt: result.createdAt,
    sheets: sheets.map((s) => s.title),
    totalRows,
  });

  return result;
}

/**
 * Updates an existing Google Spreadsheet sheet with new values.
 * IMPORTANT: Calling code MUST present user confirmation dialog before calling this mutating function!
 */
export async function updateExistingSpreadsheet(
  spreadsheetId: string,
  sheets: SheetDataDefinition[]
): Promise<{ updatedRows: number; spreadsheetUrl: string }> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Sessão Google não autenticada.');
  }

  const valuesData = sheets.map((sheet) => ({
    range: `'${sheet.title}'!A1`,
    values: [sheet.headers, ...sheet.rows],
  }));

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valuesData,
      }),
    }
  );

  if (!updateRes.ok) {
    const errJson = await updateRes.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || 'Falha ao atualizar dados na planilha Google existente.');
  }

  const totalRows = sheets.reduce((acc, s) => acc + s.rows.length, 0);
  return {
    updatedRows: totalRows,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Fetches metadata and available tabs of a Google Spreadsheet
 */
export async function fetchSpreadsheetMetadata(spreadsheetId: string): Promise<{
  id: string;
  title: string;
  sheets: { id: number; title: string; rowCount: number; colCount: number }[];
}> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Sessão Google não autenticada.');
  }

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Planilha não encontrada ou sem permissão de acesso (${res.status}).`);
  }

  const data = await res.json();
  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Planilha Sem Título',
    sheets: (data.sheets || []).map((s: any) => ({
      id: s.properties?.sheetId,
      title: s.properties?.title || 'Aba',
      rowCount: s.properties?.gridProperties?.rowCount || 0,
      colCount: s.properties?.gridProperties?.columnCount || 0,
    })),
  };
}

/**
 * Reads tabular values from a specific tab in a Google Spreadsheet
 */
export async function fetchSheetValues(
  spreadsheetId: string,
  sheetTitle: string,
  range = 'A1:Z100'
): Promise<{ headers: string[]; rows: string[][] }> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Sessão Google não autenticada.');
  }

  const targetRange = `'${sheetTitle}'!${range}`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetRange)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Falha ao ler dados da aba '${sheetTitle}'.`);
  }

  const data = await res.json();
  const rawValues: string[][] = data.values || [];
  if (rawValues.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = rawValues[0];
  const rows = rawValues.slice(1);
  return { headers, rows };
}

/**
 * Builds standard full system dataset definitions for Google Sheets export
 */
export function buildFullSystemSheetDefinitions(dataset?: SystemDataset): SheetDataDefinition[] {
  const unified = dataset || getUnifiedSystemDataset();
  const summaryRecords = buildExecutiveSummarySheet(unified);
  const teachersRecords = buildTeachersSheetData(unified.teachers);
  const directorsRecords = buildDirectorsSheetData(unified.directors);
  const studentsRecords = buildStudentsSheetData(unified.students);
  const schoolsRecords = buildSchoolsSheetData(unified.schools);

  return [
    recordsToSheetDefinition('Resumo Executivo', summaryRecords),
    recordsToSheetDefinition('Alunos da Rede', studentsRecords),
    recordsToSheetDefinition('Quadro de Professores', teachersRecords),
    recordsToSheetDefinition('Directores Escolares', directorsRecords),
    recordsToSheetDefinition('Rede de Escolas', schoolsRecords),
  ];
}

/**
 * Builds specific students sheet definition
 */
export function buildStudentsSheetDefinition(students: AdminStudent[]): SheetDataDefinition[] {
  const records = buildStudentsSheetData(students);
  return [recordsToSheetDefinition('Alunos Matriculados', records)];
}

/**
 * Builds specific teachers sheet definition
 */
export function buildTeachersSheetDefinition(teachers: AdminTeacher[]): SheetDataDefinition[] {
  const records = buildTeachersSheetData(teachers);
  return [recordsToSheetDefinition('Professores e Docentes', records)];
}

// Session history helpers
const STORAGE_KEY = 'ucore_google_sheets_history';

export function getSavedSpreadsheets(): SavedSpreadsheetRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSpreadsheetToHistory(record: SavedSpreadsheetRecord): void {
  try {
    const current = getSavedSpreadsheets();
    const filtered = current.filter((item) => item.id !== record.id);
    const updated = [record, ...filtered].slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Erro ao guardar histórico de folhas Google:', err);
  }
}
