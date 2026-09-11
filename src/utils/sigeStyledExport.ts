import ExcelJS from 'exceljs';
import type { SystemDataset } from './excelExport';
import {
  aggregateSigeDataset,
  buildSigeCapaRows,
  buildSigeAlunosMatriculadosRows,
  buildSigePessoalDocenteRows,
  buildSigeInfraestruturasRows,
  buildSigeAproveitamentoRows,
  buildSigeAlunosRepetentesRows,
  buildSigeNeeRows,
  buildSigePessoalNaoDocenteRows,
  buildSigeConsolidadoRows,
  buildSigeEscolasSemDadosRows,
  type SigeAggregatedReport
} from './sigeAggregation';

/**
 * ============================================================================
 * EXPORTAÇÃO SIGE COM DESIGN E IDENTIDADE VISUAL OFICIAL (2026 / 2027)
 * ============================================================================
 * Replica fielmente o visual do "Painel Oficial SIGE":
 * - Cabeçalhos em Azul-Petróleo Oficial (#0B3D5C / #0E7490) com texto em branco
 * - Linhas de dados zebradas (#FFFFFF e #F8FAFC) com bordas finas (#E2E8F0)
 * - Badges de Natureza Jurídica (Pública: Azul, Privada: Rosa, Público-Privada: Âmbar)
 * - Validação Oficial com pill verde (#D1FAE5 / #065F46) para "● Correcto"
 * - Folha CAPA estruturada como painel institucional (Cabeçalho, Metadados e Indicadores)
 * - Congelamento de cabeçalhos e auto-filtros activos
 * - Números com formatação tabular e alinhamento à direita
 * ============================================================================
 */

// Paleta Oficial SIGE Angola
const SIGE_COLORS = {
  petroleumDark: 'FF0B3D5C', // #0b3d5c
  petroleumMedium: 'FF0E7490', // #0e7490
  cyanAccent: 'FF0891B2', // #0891b2
  bgLight: 'FFF4F6F9', // #f4f6f9
  zebraEven: 'FFF8FAFC', // #f8fafc
  borderSubtle: 'FFE2E8F0', // #e2e8f0
  textDark: 'FF1E293B', // #1e293b
  textMuted: 'FF64748B', // #64748b
  white: 'FFFFFFFF',
  // Natureza
  publicaBg: 'FFDBEAFE', // #dbeafe
  publicaText: 'FF1E40AF', // #1e40af
  privadaBg: 'FFFCE7F3', // #fce7f3
  privadaText: 'FF9D174D', // #9d174d
  ppBg: 'FFFEF3C7', // #fef3c7
  ppText: 'FF92400E', // #92400e
  // Validação
  validBg: 'FFD1FAE5', // #d1fae5
  validText: 'FF065F46', // #065f46
  invalidBg: 'FFFEE2E2', // #fee2e2
  invalidText: 'FF991B1B', // #991b1b
  // Destaque Totais
  totalBg: 'FFE0F2FE', // #e0f2fe
  totalText: 'FF0B3D5C'
};

/**
 * Cria a folha CAPA estilizada como o dashboard institucional
 */
function buildStyledCapaSheet(wb: ExcelJS.Workbook, report: SigeAggregatedReport) {
  const ws = wb.addWorksheet('CAPA', {
    properties: { tabColor: { argb: SIGE_COLORS.petroleumDark } },
    views: [{ showGridLines: true }]
  });

  // Larguras das colunas
  ws.columns = [
    { width: 4 },  // A (margem)
    { width: 34 }, // B (Campo)
    { width: 38 }, // C (Valor)
    { width: 38 }, // D (Nota / Validação)
    { width: 14 }, // E
    { width: 14 }, // F
    { width: 14 }, // G
    { width: 14 }, // H
  ];

  // 1. BANNER INSTITUCIONAL PRINCIPAL (Linhas 2-4)
  ws.mergeCells('B2:H2');
  const titleCell = ws.getCell('B2');
  titleCell.value = 'REPÚBLICA DE ANGOLA — MINISTÉRIO DA EDUCAÇÃO';
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SIGE_COLORS.petroleumDark } };
  titleCell.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: SIGE_COLORS.white } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 32;

  ws.mergeCells('B3:H3');
  const subCell = ws.getCell('B3');
  subCell.value = 'GABINETE DE ESTUDOS, PLANEAMENTO E ESTATÍSTICA (GEPE) · SIGE';
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SIGE_COLORS.petroleumMedium } };
  subCell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: SIGE_COLORS.white } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(3).height = 24;

  ws.mergeCells('B4:H4');
  const instCell = ws.getCell('B4');
  instCell.value = `INSTRUMENTO COMPLEMENTAR DE ESTATÍSTICA OFICIAL ${report.meta.anoLectivo} · MUNICÍPIO DE ${report.meta.municipio.toUpperCase()} (${report.meta.provincia.toUpperCase()})`;
  instCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SIGE_COLORS.cyanAccent } };
  instCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: SIGE_COLORS.white } };
  instCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(4).height = 22;

  // 2. SECTOR 1: IDENTIFICAÇÃO INSTITUCIONAL
  ws.mergeCells('B6:D6');
  const sec1 = ws.getCell('B6');
  sec1.value = '1. IDENTIFICAÇÃO INSTITUCIONAL DO INSTRUMENTO';
  sec1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SIGE_COLORS.petroleumDark } };
  sec1.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: SIGE_COLORS.white } };
  sec1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(6).height = 24;

  const metaRows = [
    ['País', report.meta.pais, 'Instrumento Nacional Homologado'],
    ['Ministério', report.meta.ministerio, 'Órgão Central Tutelar'],
    ['Direcção Competente', report.meta.direccao, 'Gabinete de Estudos, Planeamento e Estatística (GEPE)'],
    ['Província', report.meta.provincia, 'Unidade Provincial'],
    ['Município', report.meta.municipio, 'Circunscrição Municipal Oficial'],
    ['Ano Lectivo de Referência', report.meta.anoLectivo, 'Período Oficial de Recolha Censitária'],
    ['Data da Emissão dos Dados', report.meta.dataEmissao, 'Homologado na Data da Exportação'],
    ['Responsável Técnico', report.meta.responsavel, report.meta.cargo],
    ['Contacto Institucional', report.meta.contactoInstitucional, 'Canal oficial de validação estatística'],
  ];

  let curRow = 7;
  metaRows.forEach((r, idx) => {
    const row = ws.getRow(curRow);
    row.height = 20;
    const isEven = idx % 2 === 1;

    ['B', 'C', 'D'].forEach((col, cIdx) => {
      const cell = ws.getCell(`${col}${curRow}`);
      cell.value = r[cIdx];
      cell.font = {
        name: 'Segoe UI',
        size: 9.5,
        bold: cIdx === 0,
        color: { argb: cIdx === 0 ? SIGE_COLORS.petroleumDark : SIGE_COLORS.textDark }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? SIGE_COLORS.zebraEven : SIGE_COLORS.white }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: SIGE_COLORS.borderSubtle } },
        bottom: { style: 'thin', color: { argb: SIGE_COLORS.borderSubtle } },
        left: { style: 'thin', color: { argb: SIGE_COLORS.borderSubtle } },
        right: { style: 'thin', color: { argb: SIGE_COLORS.borderSubtle } },
      };
      cell.alignment = { vertical: 'middle', horizontal: cIdx === 0 ? 'left' : 'left', indent: 1 };
    });
    curRow++;
  });

  curRow++; // Linha em branco

  // 3. SECTOR 2: SÍNTESE DOS PRINCIPAIS INDICADORES AGREGADOS
  ws.mergeCells(`B${curRow}:D${curRow}`);
  const sec2 = ws.getCell(`B${curRow}`);
  sec2.value = '2. SÍNTESE DOS PRINCIPAIS INDICADORES MUNICIPAIS (QUÊSSUA)';
  sec2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SIGE_COLORS.petroleumMedium } };
  sec2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: SIGE_COLORS.white } };
  sec2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(curRow).height = 24;
  curRow++;

  const t = report.totaisGerais;
  const kpiRows = [
    ['Total de Unidades Escolares', t.totalEscolas, 'Escolas activas cadastradas no município'],
    ['Total de Salas de Aula', t.totalSalas, 'Salas definitivas e provisórias'],
    ['Total de Turmas em Funcionamento', t.totalTurmas, 'Distribuídas nos 3 turnos (manhã, tarde, noite)'],
    ['Total de Alunos Matriculados (MF)', t.totalAlunosMatriculados.mf, `Total Feminino: ${t.totalAlunosMatriculados.f} (${t.totalAlunosMatriculados.mf > 0 ? ((t.totalAlunosMatriculados.f / t.totalAlunosMatriculados.mf) * 100).toFixed(1) : 0}%)`],
    ['Total de Alunos Repetentes (MF)', t.totalAlunosRepetentes.mf, `Total Feminino: ${t.totalAlunosRepetentes.f}`],
    ['Alunos com Necessidades Especiais (NEE)', t.totalAlunosNEE.mf, `Total Feminino: ${t.totalAlunosNEE.f}`],
    ['Total de Pessoal Docente (Professores)', t.totalDocentes.mf, `Total Feminino: ${t.totalDocentes.f} (${t.totalDocentes.mf > 0 ? ((t.totalDocentes.f / t.totalDocentes.mf) * 100).toFixed(1) : 0}%)`],
    ['Total de Pessoal Não Docente', t.totalNaoDocentes.mf, `Total Feminino: ${t.totalNaoDocentes.f}`],
  ];

  kpiRows.forEach((r, idx) => {
    const row = ws.getRow(curRow);
    row.height = 21;
    const isEven = idx % 2 === 1;

    ['B', 'C', 'D'].forEach((col, cIdx) => {
      const cell = ws.getCell(`${col}${curRow}`);
      cell.value = r[cIdx];
      cell.font = {
        name: 'Segoe UI',
        size: 9.5,
        bold: cIdx === 1 || cIdx === 0,
        color: { argb: cIdx === 1 ? SIGE_COLORS.petroleumDark : SIGE_COLORS.textDark }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? SIGE_COLORS.zebraEven : SIGE_COLORS.white }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: SIGE_COLORS.borderSubtle } },
        bottom: { style: 'thin', color: { argb: SIGE_COLORS.borderSubtle } },
        left: { style: 'thin', color: { argb: SIGE_COLORS.borderSubtle } },
        right: { style: 'thin', color: { argb: SIGE_COLORS.borderSubtle } },
      };
      if (cIdx === 1 && typeof r[cIdx] === 'number') {
        cell.numFmt = '#,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      }
    });
    curRow++;
  });

  curRow++; // Linha em branco

  // 4. BANNER DE CONFORMIDADE E PRIVACIDADE SIGE
  ws.mergeCells(`B${curRow}:D${curRow}`);
  const privCell = ws.getCell(`B${curRow}`);
  privCell.value = '✓ CONFORMIDADE SIGE: Instrumento 100% numérico e agregado (Zero nomes, Zero B.I., Zero e-mails pessoais).';
  privCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SIGE_COLORS.validBg } };
  privCell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: SIGE_COLORS.validText } };
  privCell.alignment = { vertical: 'middle', horizontal: 'center' };
  privCell.border = {
    top: { style: 'medium', color: { argb: 'FF10B981' } },
    bottom: { style: 'medium', color: { argb: 'FF10B981' } },
    left: { style: 'medium', color: { argb: 'FF10B981' } },
    right: { style: 'medium', color: { argb: 'FF10B981' } },
  };
  ws.getRow(curRow).height = 26;
}

/**
 * Converte índice de coluna (1-based) para letra no Excel (A, B, ..., Z, AA, AB, ...)
 */
function getColumnLetter(colNumber: number): string {
  let temp: number;
  let letter = '';
  while (colNumber > 0) {
    temp = (colNumber - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colNumber = Math.floor((colNumber - temp - 1) / 26);
  }
  return letter;
}

/**
 * Adiciona e formata uma folha de dados agregados com o design oficial SIGE
 */
function addStyledDataSheet(
  wb: ExcelJS.Workbook,
  sheetName: string,
  rows: Record<string, any>[],
  tabColor: string = SIGE_COLORS.petroleumMedium
) {
  const ws = wb.addWorksheet(sheetName, {
    properties: { tabColor: { argb: tabColor } },
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
  });

  if (!rows || rows.length === 0) {
    ws.addRow(['Sem dados registados para este relatório']);
    return ws;
  }

  const columns = Object.keys(rows[0]);

  // Larguras das colunas calculadas com folga
  ws.columns = columns.map(col => {
    let maxLen = col.length;
    for (const r of rows) {
      const v = r[col];
      const str = v !== undefined && v !== null ? String(v) : '';
      if (str.length > maxLen) maxLen = str.length;
    }
    return {
      header: col,
      key: col,
      width: Math.min(Math.max(maxLen + 4, 12), 44)
    };
  });

  // Formatação do Cabeçalho (Linha 1) - Estilo Azul-Petróleo Oficial
  const headerRow = ws.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SIGE_COLORS.petroleumDark }
    };
    cell.font = {
      name: 'Segoe UI',
      size: 9.5,
      bold: true,
      color: { argb: SIGE_COLORS.white }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'medium', color: { argb: SIGE_COLORS.cyanAccent } },
      bottom: { style: 'medium', color: { argb: SIGE_COLORS.cyanAccent } },
      left: { style: 'thin', color: { argb: SIGE_COLORS.petroleumDark } },
      right: { style: 'thin', color: { argb: SIGE_COLORS.petroleumDark } }
    };
  });

  // Preenchimento e Estilização de Linhas de Dados
  rows.forEach((rowData, index) => {
    const row = ws.addRow(rowData);
    row.height = 22;
    const isEven = index % 2 === 1;

    // Detectar se é linha de Total / Consolidado
    const rowStr = Object.values(rowData).join(' ').toLowerCase();
    const isTotalRow = rowStr.includes('total geral') || rowStr.includes('total consolidado') || rowStr.includes('total da rede');

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const colKey = columns[colNumber - 1];
      const val = cell.value;
      const strVal = String(val ?? '').trim();

      // Fonte padrão
      cell.font = {
        name: 'Segoe UI',
        size: 9.5,
        color: { argb: isTotalRow ? SIGE_COLORS.totalText : SIGE_COLORS.textDark },
        bold: isTotalRow
      };

      // Bordas sutis
      cell.border = {
        top: { style: 'thin', color: { argb: SIGE_COLORS.borderSubtle } },
        bottom: { style: 'thin', color: { argb: SIGE_COLORS.borderSubtle } },
        left: { style: 'thin', color: { argb: SIGE_COLORS.borderSubtle } },
        right: { style: 'thin', color: { argb: SIGE_COLORS.borderSubtle } }
      };

      // Fundo zebrado ou destaque
      if (isTotalRow) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: SIGE_COLORS.totalBg }
        };
      } else if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: SIGE_COLORS.zebraEven }
        };
      } else {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: SIGE_COLORS.white }
        };
      }

      // Formatação Numérica e Alinhamento
      if (typeof val === 'number') {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (Number.isInteger(val)) {
          cell.numFmt = '#,##0';
        } else {
          cell.numFmt = '#,##0.0';
        }
      } else if (strVal.endsWith('%')) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      // Badges de Natureza Jurídica
      if (colKey.toUpperCase().includes('NATUREZA')) {
        if (strVal.toLowerCase().includes('pública') || strVal.toLowerCase() === 'publica') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SIGE_COLORS.publicaBg } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: SIGE_COLORS.publicaText } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (strVal.toLowerCase().includes('privada')) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SIGE_COLORS.privadaBg } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: SIGE_COLORS.privadaText } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (strVal.toLowerCase().includes('comparticipada') || strVal.toLowerCase().includes('público-privada') || strVal.toLowerCase().includes('publico-privada')) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SIGE_COLORS.ppBg } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: SIGE_COLORS.ppText } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      }

      // Badges de Validação Oficial (Aproveitamento)
      if (colKey.toUpperCase().includes('VALIDAÇÃO')) {
        if (strVal.toLowerCase().includes('correcto') || strVal.toLowerCase().includes('correto')) {
          cell.value = '● Correcto';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SIGE_COLORS.validBg } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: SIGE_COLORS.validText } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (strVal.toLowerCase().includes('inconsistente')) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SIGE_COLORS.invalidBg } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: SIGE_COLORS.invalidText } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      }
    });
  });

  // Auto-filtro activo abrangendo toda a área de dados (do cabeçalho à última linha preenchida)
  const lastRowIndex = ws.actualRowCount;
  if (lastRowIndex > 1 && columns.length > 0) {
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: lastRowIndex, column: columns.length }
    };
  }

  return ws;
}

/**
 * ============================================================================
 * EXPORTAÇÃO OFICIAL EXCEL (.XLSX) COM DESIGN SIGE
 * ============================================================================
 */
export async function exportOfficialSigeExcel(
  dataset: SystemDataset,
  customFileName?: string
): Promise<void> {
  const report = aggregateSigeDataset(dataset);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SIGE - Ministério da Educação (GEPE)';
  wb.lastModifiedBy = 'DME Quêssua';
  wb.created = new Date();
  wb.modified = new Date();

  // 1. CAPA
  buildStyledCapaSheet(wb, report);

  // 2. 1 - ALUNOS MATRICULADOS
  const alunosRows = buildSigeAlunosMatriculadosRows(report);
  addStyledDataSheet(wb, '1 - ALUNOS MATRICULADOS', alunosRows, SIGE_COLORS.petroleumMedium);

  // 3. 2 - PESSOAL_DOCENTE
  const docentesRows = buildSigePessoalDocenteRows(report);
  addStyledDataSheet(wb, '2 - PESSOAL_DOCENTE', docentesRows, SIGE_COLORS.petroleumMedium);

  // 4. 3 - INFRAESTRUTURAS
  const infraRows = buildSigeInfraestruturasRows(report);
  addStyledDataSheet(wb, '3 - INFRAESTRUTURAS', infraRows, SIGE_COLORS.petroleumMedium);

  // 5. 4 - APROVEITAMENTO
  const aprovRows = buildSigeAproveitamentoRows(report);
  addStyledDataSheet(wb, '4 - APROVEITAMENTO', aprovRows, SIGE_COLORS.cyanAccent);

  // 6. 5 - ALUNOS REPETENTES
  const repRows = buildSigeAlunosRepetentesRows(report);
  addStyledDataSheet(wb, '5 - ALUNOS REPETENTES', repRows, SIGE_COLORS.petroleumMedium);

  // 7. 6 - NEE
  const neeRows = buildSigeNeeRows(report);
  addStyledDataSheet(wb, '6 - NEE', neeRows, SIGE_COLORS.petroleumMedium);

  // 8. 7 - PESSOAL_NAO_DOCENTE
  const naoDocRows = buildSigePessoalNaoDocenteRows(report);
  addStyledDataSheet(wb, '7 - PESSOAL_NAO_DOCENTE', naoDocRows, SIGE_COLORS.petroleumMedium);

  // 9. 9 - CONSOLIDADO
  const consolidadoRows = buildSigeConsolidadoRows(report);
  addStyledDataSheet(wb, '9 - CONSOLIDADO', consolidadoRows, SIGE_COLORS.petroleumDark);

  // 10. ESCOLAS SEM DADOS
  const escolasSemDadosRows = buildSigeEscolasSemDadosRows(dataset);
  addStyledDataSheet(wb, 'ESCOLAS SEM DADOS', escolasSemDadosRows, SIGE_COLORS.textMuted);

  const dateTag = new Date().toISOString().substring(0, 10);
  const filename = customFileName || `SIGE_2026_2027_Estatistica_Oficial_${report.meta.municipio}_${dateTag}.xlsx`;

  // Gerar Buffer e accionar download no browser
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * ============================================================================
 * EXPORTAÇÃO DE RELATÓRIO WEB OFICIAL STANDALONE (.HTML)
 * Ficheiro autónomo que abre em qualquer navegador com as 9 abas, filtros
 * e o mesmo design visual exacto do painel interactivo!
 * ============================================================================
 */
export function exportStandaloneSigeHtml(
  dataset: SystemDataset,
  customFileName?: string
): void {
  const report = aggregateSigeDataset(dataset);
  const dateTag = new Date().toISOString().substring(0, 10);
  const filename = customFileName || `SIGE_2026_2027_Relatorio_Oficial_${report.meta.municipio}_${dateTag}.html`;

  const htmlContent = generateStandaloneHtmlDocument(report, dataset);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Constrói o documento HTML 100% autónomo com identidade visual SIGE
 */
function generateStandaloneHtmlDocument(report: SigeAggregatedReport, dataset: SystemDataset): string {
  const alunosRows = buildSigeAlunosMatriculadosRows(report);
  const docentesRows = buildSigePessoalDocenteRows(report);
  const infraRows = buildSigeInfraestruturasRows(report);
  const aprovRows = buildSigeAproveitamentoRows(report);
  const repRows = buildSigeAlunosRepetentesRows(report);
  const neeRows = buildSigeNeeRows(report);
  const naoDocRows = buildSigePessoalNaoDocenteRows(report);
  const consolidadoRows = buildSigeConsolidadoRows(report);
  const t = report.totaisGerais;

  function renderTableRows(rows: Record<string, any>[]): string {
    if (!rows || rows.length === 0) return '<tr><td colspan="10" style="padding:20px;text-align:center;">Sem dados</td></tr>';
    const cols = Object.keys(rows[0]);
    let html = '<thead><tr>';
    cols.forEach(c => html += `<th>${c}</th>`);
    html += '</tr></thead><tbody>';

    rows.forEach(r => {
      const isTotal = Object.values(r).join(' ').toLowerCase().includes('total');
      html += `<tr class="${isTotal ? 'total-row' : ''}">`;
      cols.forEach(c => {
        const val = r[c] ?? '';
        const strVal = String(val);
        const isNum = typeof val === 'number';
        let badgeClass = '';
        if (c.toUpperCase().includes('NATUREZA')) {
          if (strVal.toLowerCase().includes('pública') || strVal.toLowerCase() === 'publica') badgeClass = 'badge-publica';
          else if (strVal.toLowerCase().includes('privada')) badgeClass = 'badge-privada';
          else badgeClass = 'badge-pp';
        }
        let pillClass = '';
        if (c.toUpperCase().includes('VALIDAÇÃO')) {
          if (strVal.toLowerCase().includes('correcto')) pillClass = 'pill-valid';
          else if (strVal.toLowerCase().includes('inconsistente')) pillClass = 'pill-invalid';
        }

        if (badgeClass) {
          html += `<td style="text-align:center;"><span class="badge ${badgeClass}">${strVal}</span></td>`;
        } else if (pillClass) {
          html += `<td style="text-align:center;"><span class="pill ${pillClass}">● ${strVal.replace(/^[●\s]+/, '')}</span></td>`;
        } else if (isNum) {
          html += `<td style="text-align:right;font-variant-numeric:tabular-nums;">${val.toLocaleString('pt-AO')}</td>`;
        } else {
          html += `<td>${strVal}</td>`;
        }
      });
      html += '</tr>';
    });
    html += '</tbody>';
    return html;
  }

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIGE 2026/2027 · Estatística Oficial — Quêssua</title>
  <style>
    :root {
      --bg: #f4f6f9;
      --surface: #ffffff;
      --border: #e2e8f0;
      --text: #1e293b;
      --muted: #64748b;
      --header-bg: linear-gradient(135deg, #0b3d5c 0%, #0e7490 100%);
      --accent: #0891b2;
      --table-header: #0b3d5c;
      --zebra: #f8fafc;
      --hover: #e0f2fe;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      font-size: 13px;
    }
    header {
      background: var(--header-bg);
      color: #fff;
      padding: 16px 24px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .sige-badge {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25);
      font-weight: 800;
      font-size: 15px;
      letter-spacing: 1px;
      padding: 8px 12px;
      border-radius: 8px;
    }
    .header-title h1 { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
    .header-title p { font-size: 12px; opacity: 0.9; color: #cffafe; }
    .meta-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .meta-pill {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
    }
    .pill-green { background: rgba(16,185,129,0.25); border-color: rgba(52,211,153,0.4); color: #a7f3d0; }
    nav {
      background: #fff;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      overflow-x: auto;
      padding: 0 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .tab-btn {
      padding: 12px 16px;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      font-size: 12px;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active {
      color: #0b3d5c;
      border-bottom-color: var(--accent);
      font-weight: 700;
    }
    .controls {
      padding: 12px 24px;
      background: #fff;
      border-bottom: 1px solid var(--border);
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }
    .search-input, .filter-select {
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 12px;
      outline: none;
      background: #fff;
    }
    .search-input { min-width: 240px; flex: 1; }
    .search-input:focus, .filter-select:focus { border-color: var(--accent); }
    .main-content { padding: 20px 24px; max-width: 1500px; margin: 0 auto; }
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }
    .capa-container { display: flex; flex-direction: column; gap: 20px; }
    .info-card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .info-card h2 { font-size: 15px; font-weight: 700; color: #0b3d5c; margin-bottom: 14px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-item .label { font-size: 11px; color: var(--muted); text-transform: uppercase; font-weight: 600; }
    .info-item .val { font-size: 13px; font-weight: 600; color: var(--text); }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .kpi-card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .kpi-card .num { font-size: 24px; font-weight: 800; color: #0b3d5c; font-variant-numeric: tabular-nums; }
    .kpi-card .title { font-size: 12px; font-weight: 600; color: var(--muted); }
    .kpi-card .sub { font-size: 11px; color: var(--accent); font-weight: 500; }
    .table-container {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow-x: auto;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th {
      background: var(--table-header);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 10px 14px;
      white-space: nowrap;
      border-right: 1px solid rgba(255,255,255,0.1);
    }
    td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      font-size: 12px;
      color: var(--text);
    }
    tr:nth-child(even) { background: var(--zebra); }
    tr:hover { background: var(--hover); }
    tr.total-row { background: #e0f2fe; font-weight: 700; color: #0b3d5c; }
    .badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; display: inline-block; }
    .badge-publica { background: #dbeafe; color: #1e40af; }
    .badge-privada { background: #fce7f3; color: #9d174d; }
    .badge-pp { background: #fef3c7; color: #92400e; }
    .pill { padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; display: inline-block; }
    .pill-valid { background: #d1fae5; color: #065f46; }
    .pill-invalid { background: #fee2e2; color: #991b1b; }
    footer {
      padding: 16px 24px;
      text-align: center;
      font-size: 11px;
      color: var(--muted);
      border-top: 1px solid var(--border);
      background: #fff;
      margin-top: 40px;
    }
    @media print {
      header, nav, .controls, footer { display: none !important; }
      .tab-pane { display: block !important; margin-bottom: 40px; }
      body { background: #fff; }
      .table-container { border: none; box-shadow: none; }
      th { background: #0b3d5c !important; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-left">
      <div class="sige-badge">SIGE</div>
      <div class="header-title">
        <h1>Instrumento Complementar 2026/2027</h1>
        <p>Estatística Oficial · Município de ${report.meta.municipio} · Província de ${report.meta.provincia}</p>
      </div>
    </div>
    <div class="meta-pills">
      <span class="meta-pill">Ano lectivo ${report.meta.anoLectivo}</span>
      <span class="meta-pill">Emissão ${report.meta.dataEmissao}</span>
      <span class="meta-pill pill-green">✓ Apenas dados agregados</span>
      <button onclick="window.print()" style="background:#fff;color:#0b3d5c;border:none;padding:5px 12px;border-radius:6px;font-weight:700;cursor:pointer;font-size:11px;">Imprimir / PDF</button>
    </div>
  </header>

  <nav id="nav-tabs">
    <button class="tab-btn active" onclick="switchTab('capa')">CAPA</button>
    <button class="tab-btn" onclick="switchTab('alunos')">1 · Alunos Matriculados</button>
    <button class="tab-btn" onclick="switchTab('docentes')">2 · Pessoal Docente</button>
    <button class="tab-btn" onclick="switchTab('infra')">3 · Infraestruturas</button>
    <button class="tab-btn" onclick="switchTab('aprov')">4 · Aproveitamento</button>
    <button class="tab-btn" onclick="switchTab('rep')">5 · Repetentes</button>
    <button class="tab-btn" onclick="switchTab('nee')">6 · NEE</button>
    <button class="tab-btn" onclick="switchTab('naodoc')">7 · Pessoal Não Docente</button>
    <button class="tab-btn" onclick="switchTab('consol')">9 · Consolidado</button>
  </nav>

  <div class="controls" id="table-controls">
    <input type="text" id="searchInput" class="search-input" placeholder="Pesquisar nas tabelas...">
    <select id="naturezaSelect" class="filter-select">
      <option value="">Todas as Naturezas</option>
      <option value="Pública">Pública</option>
      <option value="Privada">Privada</option>
      <option value="Público-Privada">Público-Privada</option>
    </select>
    <span id="rowCount" style="font-size:11px;color:var(--muted);margin-left:auto;"></span>
  </div>

  <main class="main-content">
    <!-- CAPA -->
    <div id="pane-capa" class="tab-pane active">
      <div class="capa-container">
        <div class="info-card">
          <h2>Informação Institucional do Instrumento Complementar</h2>
          <div class="info-grid">
            <div class="info-item"><span class="label">País</span><span class="val">${report.meta.pais}</span></div>
            <div class="info-item"><span class="label">Ministério</span><span class="val">${report.meta.ministerio}</span></div>
            <div class="info-item"><span class="label">Direcção Central</span><span class="val">${report.meta.direccao}</span></div>
            <div class="info-item"><span class="label">Província</span><span class="val">${report.meta.provincia}</span></div>
            <div class="info-item"><span class="label">Município</span><span class="val">${report.meta.municipio}</span></div>
            <div class="info-item"><span class="label">Ano Lectivo</span><span class="val">${report.meta.anoLectivo}</span></div>
            <div class="info-item"><span class="label">Data de Emissão</span><span class="val">${report.meta.dataEmissao}</span></div>
            <div class="info-item"><span class="label">Responsável</span><span class="val">${report.meta.responsavel}</span></div>
            <div class="info-item"><span class="label">Cargo</span><span class="val">${report.meta.cargo}</span></div>
            <div class="info-item"><span class="label">Contacto</span><span class="val">${report.meta.contactoInstitucional}</span></div>
          </div>
        </div>

        <div class="info-card">
          <h2>Síntese Geral dos Indicadores Municipais (Quêssua)</h2>
          <div class="kpi-grid">
            <div class="kpi-card"><span class="num">${t.totalEscolas}</span><span class="title">Unidades Escolares</span><span class="sub">Rede Activa</span></div>
            <div class="kpi-card"><span class="num">${t.totalSalas}</span><span class="title">Salas de Aula</span><span class="sub">Definitivas e Provisórias</span></div>
            <div class="kpi-card"><span class="num">${t.totalTurmas}</span><span class="title">Turmas</span><span class="sub">Turnos M/T/N</span></div>
            <div class="kpi-card"><span class="num">${t.totalAlunosMatriculados.mf.toLocaleString('pt-AO')}</span><span class="title">Alunos Matriculados</span><span class="sub">${t.totalAlunosMatriculados.f.toLocaleString('pt-AO')} Feminino</span></div>
            <div class="kpi-card"><span class="num">${t.totalAlunosRepetentes.mf.toLocaleString('pt-AO')}</span><span class="title">Alunos Repetentes</span><span class="sub">${t.totalAlunosRepetentes.f.toLocaleString('pt-AO')} Feminino</span></div>
            <div class="kpi-card"><span class="num">${t.totalAlunosNEE.mf.toLocaleString('pt-AO')}</span><span class="title">Necessidades Especiais</span><span class="sub">${t.totalAlunosNEE.f.toLocaleString('pt-AO')} Feminino</span></div>
            <div class="kpi-card"><span class="num">${t.totalDocentes.mf.toLocaleString('pt-AO')}</span><span class="title">Pessoal Docente</span><span class="sub">${t.totalDocentes.f.toLocaleString('pt-AO')} Feminino</span></div>
            <div class="kpi-card"><span class="num">${t.totalNaoDocentes.mf.toLocaleString('pt-AO')}</span><span class="title">Pessoal Não Docente</span><span class="sub">${t.totalNaoDocentes.f.toLocaleString('pt-AO')} Feminino</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 1 · ALUNOS -->
    <div id="pane-alunos" class="tab-pane">
      <div class="table-container"><table>${renderTableRows(alunosRows)}</table></div>
    </div>

    <!-- 2 · DOCENTES -->
    <div id="pane-docentes" class="tab-pane">
      <div class="table-container"><table>${renderTableRows(docentesRows)}</table></div>
    </div>

    <!-- 3 · INFRAESTRUTURAS -->
    <div id="pane-infra" class="tab-pane">
      <div class="table-container"><table>${renderTableRows(infraRows)}</table></div>
    </div>

    <!-- 4 · APROVEITAMENTO -->
    <div id="pane-aprov" class="tab-pane">
      <div class="table-container"><table>${renderTableRows(aprovRows)}</table></div>
    </div>

    <!-- 5 · REPETENTES -->
    <div id="pane-rep" class="tab-pane">
      <div class="table-container"><table>${renderTableRows(repRows)}</table></div>
    </div>

    <!-- 6 · NEE -->
    <div id="pane-nee" class="tab-pane">
      <div class="table-container"><table>${renderTableRows(neeRows)}</table></div>
    </div>

    <!-- 7 · NAO DOCENTE -->
    <div id="pane-naodoc" class="tab-pane">
      <div class="table-container"><table>${renderTableRows(naoDocRows)}</table></div>
    </div>

    <!-- 9 · CONSOLIDADO -->
    <div id="pane-consol" class="tab-pane">
      <div class="table-container"><table>${renderTableRows(consolidadoRows)}</table></div>
    </div>
  </main>

  <footer>
    Documento oficial emitido em conformidade com as directrizes estatísticas do Ministério da Educação de Angola (GEPE/DME) · Estritamente Agregado
  </footer>

  <script>
    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(tabId));
      if (btn) btn.classList.add('active');
      const pane = document.getElementById('pane-' + tabId);
      if (pane) pane.classList.add('active');

      document.getElementById('table-controls').style.display = tabId === 'capa' ? 'none' : 'flex';
      filterCurrentTable();
    }

    const searchInput = document.getElementById('searchInput');
    const naturezaSelect = document.getElementById('naturezaSelect');

    function filterCurrentTable() {
      const q = searchInput.value.toLowerCase().trim();
      const nat = naturezaSelect.value.toLowerCase().trim();
      const activePane = document.querySelector('.tab-pane.active');
      if (!activePane) return;
      const rows = activePane.querySelectorAll('tbody tr');
      let visible = 0;

      rows.forEach(r => {
        const text = r.innerText.toLowerCase();
        const matchesSearch = !q || text.includes(q);
        const matchesNat = !nat || text.includes(nat);
        if (matchesSearch && matchesNat) {
          r.style.display = '';
          visible++;
        } else {
          r.style.display = 'none';
        }
      });
      document.getElementById('rowCount').innerText = visible + ' linha(s) visíveis';
    }

    searchInput.addEventListener('input', filterCurrentTable);
    naturezaSelect.addEventListener('change', filterCurrentTable);
    switchTab('capa');
  </script>
</body>
</html>`;
}
