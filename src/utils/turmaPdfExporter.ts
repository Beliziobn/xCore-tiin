import jsPDF from 'jspdf';
import type { TurmaStudentListResult, TurmaStudentItem } from './turmaStudentsService';

/**
 * Robust constructor getter to handle various ESM/CJS bundler quirks for jsPDF
 */
function getJsPDFConstructor(): any {
  if (typeof (jsPDF as any)?.jsPDF === 'function') {
    return (jsPDF as any).jsPDF;
  }
  if (typeof jsPDF === 'function') {
    return jsPDF;
  }
  if (typeof (jsPDF as any)?.default?.jsPDF === 'function') {
    return (jsPDF as any).default.jsPDF;
  }
  return (jsPDF as any).default || jsPDF;
}

export interface ExportTurmaPdfOptions {
  onProgress?: (message: string) => void;
  openInNewTab?: boolean;
}

/**
 * Generates an official, publication-ready vector PDF for the student list of any turma,
 * strictly organized from A to Z with official Angolan Ministry of Education styling.
 */
export async function exportTurmaStudentListToPDF(
  data: TurmaStudentListResult,
  options: ExportTurmaPdfOptions = {}
): Promise<void> {
  const { onProgress } = options;

  onProgress?.('Preparando documento oficial A4...');

  const Ctor = getJsPDFConstructor();
  const pdf = new Ctor({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 12;
  const contentWidth = 186;

  // Colors (Clean Official School Document Black/Slate)
  const COLOR_PRIMARY = [15, 23, 42]; // #0f172a
  const COLOR_TEXT = [15, 23, 42]; // #0f172a
  const COLOR_MUTED = [71, 85, 105]; // #475569
  const COLOR_BORDER = [30, 41, 59]; // #1e293b formal grid border
  const COLOR_HEADER_BG = [241, 245, 249]; // #f1f5f9

  // Column definitions (Sum = 186mm)
  const columns: { key: string; title: string; width: number; align: 'left' | 'center' | 'right' }[] = [
    { key: 'ordem', title: 'Nº', width: 12, align: 'center' },
    { key: 'nome', title: 'NOME COMPLETO DO ALUNO', width: 104, align: 'left' },
    { key: 'genero', title: 'SEXO', width: 18, align: 'center' },
    { key: 'idade', title: 'IDADE', width: 18, align: 'center' },
    { key: 'situacao', title: 'OBSERVAÇÃO', width: 34, align: 'center' },
  ];

  const students = data.students;
  const totalStudents = students.length;

  // Determine row count per page
  const isSinglePage = totalStudents <= 28;
  const maxRowsPage1 = isSinglePage ? 28 : 30;
  const page1Students = students.slice(0, maxRowsPage1);
  const page2Students = isSinglePage ? [] : students.slice(maxRowsPage1);
  const totalPages = isSinglePage ? 1 : 2;

  const renderHeader = (pageNumber: number) => {
    if (pageNumber === 1) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.text('REPÚBLICA DE ANGOLA', pageWidth / 2, 14, { align: 'center' });
      pdf.text('MINISTÉRIO DA EDUCAÇÃO', pageWidth / 2, 18.5, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(`${data.metadata.provincia.toUpperCase()} • ${data.metadata.direccao.toUpperCase()}`, pageWidth / 2, 23, { align: 'center' });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(data.metadata.escola.toUpperCase(), pageWidth / 2, 28, { align: 'center' });

      pdf.setFontSize(9.5);
      pdf.text('LISTA NOMINAL DOS ALUNOS', pageWidth / 2, 34.5, { align: 'center' });

      // Metadata Line
      const metaY = 38.5;
      pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
      pdf.line(marginX, metaY, marginX + contentWidth, metaY);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      const cleanTurma = data.metadata.turma.replace(/^Turma\s+/i, '');
      const cleanSala = data.metadata.sala.replace(/^Sala\s+/i, '');
      pdf.text(`Ano Lectivo: ${data.metadata.anoLectivo}`, marginX, metaY + 4.5);
      pdf.text(`Classe: ${data.metadata.classe}`, marginX + 44, metaY + 4.5);
      pdf.text(`Turma: ${cleanTurma}`, marginX + 82, metaY + 4.5);
      pdf.text(`Período: ${data.metadata.turno}`, marginX + 114, metaY + 4.5);
      pdf.text(`Sala: ${cleanSala}`, marginX + 158, metaY + 4.5);

      pdf.line(marginX, metaY + 6.5, marginX + contentWidth, metaY + 6.5);

      return metaY + 9;
    } else {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.text(
        `${data.metadata.escola.toUpperCase()} — LISTA NOMINAL: ${data.metadata.classe} (${data.metadata.turma})`,
        marginX,
        15
      );
      pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
      pdf.line(marginX, 17, marginX + contentWidth, 17);
      return 20;
    }
  };

  const renderTableHeader = (startY: number) => {
    const headerHeight = 6.5;
    pdf.setFillColor(COLOR_HEADER_BG[0], COLOR_HEADER_BG[1], COLOR_HEADER_BG[2]);
    pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    pdf.rect(marginX, startY, contentWidth, headerHeight, 'FD');

    let currentX = marginX;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);

    columns.forEach((col, i) => {
      let textX = currentX + 2;
      if (col.align === 'center') {
        textX = currentX + col.width / 2;
      } else if (col.align === 'right') {
        textX = currentX + col.width - 2;
      }

      pdf.text(col.title, textX, startY + 4.5, { align: col.align });
      if (i < columns.length - 1) {
        pdf.line(currentX + col.width, startY, currentX + col.width, startY + headerHeight);
      }
      currentX += col.width;
    });

    return startY + headerHeight;
  };

  const renderStudentRow = (student: TurmaStudentItem, y: number, _isAlt: boolean) => {
    const rowHeight = 6.4;

    pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    pdf.rect(marginX, y, contentWidth, rowHeight, 'D');

    let currentX = marginX;
    const textY = y + 4.4;

    columns.forEach((col, i) => {
      let val = '';
      let isBold = false;

      if (col.key === 'ordem') {
        val = String(student.numeroOrdem).padStart(2, '0');
        isBold = true;
      } else if (col.key === 'nome') {
        val = student.nomeCompleto;
      } else if (col.key === 'genero') {
        val = student.genero;
      } else if (col.key === 'idade') {
        val = String(student.idade);
      } else if (col.key === 'situacao') {
        val = student.condicaoMatricula === 'Matriculado' ? '' : student.condicaoMatricula;
      }

      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);

      let textX = currentX + 2;
      if (col.align === 'center') {
        textX = currentX + col.width / 2;
      } else if (col.align === 'right') {
        textX = currentX + col.width - 2;
      }

      const maxColTextWidth = col.width - 4;
      let printVal = val;
      if (pdf.getTextWidth(printVal) > maxColTextWidth) {
        while (pdf.getTextWidth(printVal + '..') > maxColTextWidth && printVal.length > 3) {
          printVal = printVal.slice(0, -1);
        }
        printVal = printVal + '..';
      }

      pdf.text(printVal, textX, textY, { align: col.align });

      if (i < columns.length - 1) {
        pdf.line(currentX + col.width, y, currentX + col.width, y + rowHeight);
      }

      currentX += col.width;
    });

    return y + rowHeight;
  };

  const renderFooter = (pageNumber: number) => {
    const footerY = 289;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    pdf.text(
      `Página ${pageNumber} de ${totalPages}`,
      pageWidth - marginX,
      footerY,
      { align: 'right' }
    );
  };

  // --- RENDER PAGE 1 ---
  onProgress?.('Renderizando estudantes (Página 1)...');
  let currentY = renderHeader(1);
  currentY = renderTableHeader(currentY);

  page1Students.forEach((student, idx) => {
    currentY = renderStudentRow(student, currentY, idx % 2 === 1);
  });

  renderFooter(1);

  // If single page, render statistical summary and signatures on page 1
  if (isSinglePage) {
    renderStatsAndSignatures(pdf, currentY + 3, data, marginX, contentWidth);
  } else {
    // --- RENDER PAGE 2 ---
    onProgress?.('Renderizando continuação e termo de homologação (Página 2)...');
    pdf.addPage('a4', 'portrait');

    currentY = renderHeader(2);
    currentY = renderTableHeader(currentY);

    page2Students.forEach((student, idx) => {
      currentY = renderStudentRow(student, currentY, idx % 2 === 1);
    });

    renderStatsAndSignatures(pdf, currentY + 4, data, marginX, contentWidth);
    renderFooter(2);
  }

  onProgress?.('Finalizando documento e descarregando...');

  // Safe file naming
  const safeClass = data.metadata.classe.replace(/[^a-zA-Z0-9]/g, '_');
  const safeTurma = data.metadata.turma.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Lista_Alunos_${safeClass}_${safeTurma}_Ordem_AZ.pdf`;

  pdf.save(fileName);
  onProgress?.('Download concluído com sucesso!');
}

/**
 * Renders statistical summary box and official 3-signature block for class pauta validation
 */
function renderStatsAndSignatures(
  pdf: any,
  startY: number,
  data: TurmaStudentListResult,
  marginX: number,
  contentWidth: number
): void {
  const COLOR_TEXT = [15, 23, 42];
  const COLOR_BORDER = [100, 116, 139];

  // 1. Summary Line
  const lineY1 = startY + 2;
  pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  pdf.line(marginX, lineY1, marginX + contentWidth, lineY1);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);

  const statsY = lineY1 + 4.5;
  pdf.text(`Total de Alunos: ${data.stats.total}`, marginX, statsY);
  pdf.text(`Masculinos (M): ${data.stats.meninos}`, marginX + 50, statsY);
  pdf.text(`Femininos (F): ${data.stats.meninas}`, marginX + 100, statsY);
  pdf.text(`Data: ${data.metadata.dataEmissao}`, marginX + contentWidth, statsY, { align: 'right' });

  pdf.line(marginX, lineY1 + 6.5, marginX + contentWidth, lineY1 + 6.5);

  // 2. Classic 2-Column Signature Lines
  const signTop = lineY1 + 15;
  const colCenter1 = marginX + contentWidth * 0.25;
  const colCenter2 = marginX + contentWidth * 0.75;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('O(A) PROFESSOR(A) / DIRECTOR(A) DE TURMA', colCenter1, signTop, { align: 'center' });
  pdf.text('O(A) SUBDIRECTOR(A) PEDAGÓGICO(A)', colCenter2, signTop, { align: 'center' });

  const sigLineY = signTop + 12;
  pdf.setDrawColor(15, 23, 42);
  pdf.line(colCenter1 - 35, sigLineY, colCenter1 + 35, sigLineY);
  pdf.line(colCenter2 - 35, sigLineY, colCenter2 + 35, sigLineY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.text(data.metadata.professorTitular, colCenter1, sigLineY + 4.5, { align: 'center' });
  pdf.text(data.metadata.subdiretorPedagogico, colCenter2, sigLineY + 4.5, { align: 'center' });
}
