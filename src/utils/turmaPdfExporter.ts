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

  // Colors
  const COLOR_PRIMARY = [0, 33, 51]; // #002133 deep navy
  const COLOR_ACCENT = [247, 81, 66]; // #f75142 crimson coral
  const COLOR_GOLD = [202, 138, 4]; // #ca8a04
  const COLOR_TEXT = [15, 23, 42]; // #0f172a slate-900
  const COLOR_MUTED = [100, 116, 139]; // #64748b slate-500
  const COLOR_BORDER = [203, 213, 225]; // #cbd5e1 slate-300
  const COLOR_ROW_ALT = [248, 250, 252]; // #f8fafc slate-50
  const COLOR_HEADER_BG = [241, 245, 249]; // #f1f5f9 slate-100

  // Column definitions (Sum = 186mm) - Estritamente: Nome, Sexo, Idade, Situação (+ Nº)
  const columns: { key: string; title: string; width: number; align: 'left' | 'center' | 'right' }[] = [
    { key: 'ordem', title: 'Nº', width: 12, align: 'center' },
    { key: 'nome', title: 'Nome do Aluno (Ordem A-Z)', width: 92, align: 'left' },
    { key: 'genero', title: 'Sexo', width: 26, align: 'center' },
    { key: 'idade', title: 'Idade', width: 24, align: 'center' },
    { key: 'situacao', title: 'Situação', width: 32, align: 'center' },
  ];

  const students = data.students;
  const totalStudents = students.length;

  // Determine row count per page
  // If total <= 24, single page layout
  // Otherwise split across 2 pages
  const isSinglePage = totalStudents <= 24;
  const maxRowsPage1 = isSinglePage ? 24 : 25;
  const page1Students = students.slice(0, maxRowsPage1);
  const page2Students = isSinglePage ? [] : students.slice(maxRowsPage1);
  const totalPages = isSinglePage ? 1 : 2;

  const renderHeader = (pageNumber: number) => {
    if (pageNumber === 1) {
      // Top National Stripe
      pdf.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
      pdf.rect(marginX, 10, contentWidth, 2, 'F');

      // Emblem / Crest Mockup (Star & Book Motif in Vector)
      const crestX = marginX + 6;
      const crestY = 17;
      pdf.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.circle(crestX, crestY, 4, 'F');
      pdf.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
      pdf.circle(crestX, crestY, 2, 'F');

      // Right Crest
      const rightCrestX = marginX + contentWidth - 6;
      pdf.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.circle(rightCrestX, crestY, 4, 'F');
      pdf.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
      pdf.circle(rightCrestX, crestY, 2, 'F');

      // Official Institution Titles
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.text(data.metadata.pais, pageWidth / 2, 16, { align: 'center' });

      pdf.setFontSize(8.5);
      pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      pdf.text(data.metadata.ministerio, pageWidth / 2, 20.5, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.text(`${data.metadata.provincia} • ${data.metadata.direccao}`, pageWidth / 2, 24.5, { align: 'center' });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.text(data.metadata.escola.toUpperCase(), pageWidth / 2, 29, { align: 'center' });

      // Title Banner
      pdf.setFillColor(COLOR_HEADER_BG[0], COLOR_HEADER_BG[1], COLOR_HEADER_BG[2]);
      pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
      pdf.rect(marginX, 32, contentWidth, 7, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.text(
        'PAUTA / LISTA NOMINAL DOS ALUNOS POR TURMA (ORDEM ALFABÉTICA DE A A Z)',
        pageWidth / 2,
        36.8,
        { align: 'center' }
      );

      // Turma Metadata Box (2 Rows of information)
      const metaBoxY = 41;
      const metaBoxHeight = 15;
      pdf.setFillColor(255, 255, 255);
      pdf.rect(marginX, metaBoxY, contentWidth, metaBoxHeight, 'D');

      // Left Column Metadata
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      pdf.text('ANO LECTIVO:', marginX + 3, metaBoxY + 4.5);
      pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      pdf.text(data.metadata.anoLectivo, marginX + 24, metaBoxY + 4.5);

      pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      pdf.text('CLASSE / TURMA:', marginX + 3, metaBoxY + 9.5);
      pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.text(`${data.metadata.classe} • ${data.metadata.turma}`, marginX + 27, metaBoxY + 9.5);

      pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      pdf.text('TURNO / SALA:', marginX + 3, metaBoxY + 13.5);
      pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      pdf.text(`${data.metadata.turno} • ${data.metadata.sala}`, marginX + 24, metaBoxY + 13.5);

      // Right Column Metadata
      const rightMetaX = marginX + 105;
      pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      pdf.text('PROF. TITULAR:', rightMetaX, metaBoxY + 4.5);
      pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      pdf.text(data.metadata.professorTitular, rightMetaX + 21, metaBoxY + 4.5);

      pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      pdf.text('TOTAL DE ALUNOS:', rightMetaX, metaBoxY + 9.5);
      pdf.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
      pdf.text(
        `${data.stats.total} Estudantes (${data.stats.meninas} Feminino / ${data.stats.meninos} Masculino)`,
        rightMetaX + 26,
        metaBoxY + 9.5
      );

      pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      pdf.text('DATA DE EMISSÃO:', rightMetaX, metaBoxY + 13.5);
      pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      pdf.text(data.metadata.dataEmissao, rightMetaX + 26, metaBoxY + 13.5);

      return metaBoxY + metaBoxHeight + 2; // Returns Y for table header
    } else {
      // Continuation Header for Page 2
      pdf.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.rect(marginX, 10, contentWidth, 1.5, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      pdf.text(
        `${data.metadata.pais} • ${data.metadata.escola.toUpperCase()}`,
        marginX,
        15
      );

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.text(
        `PAUTA DA TURMA: ${data.metadata.classe} - ${data.metadata.turma} (CONTINUAÇÃO A-Z)`,
        marginX,
        19.5
      );

      pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
      pdf.line(marginX, 21.5, marginX + contentWidth, 21.5);

      return 23;
    }
  };

  const renderTableHeader = (startY: number) => {
    const headerHeight = 6.5;
    pdf.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    pdf.rect(marginX, startY, contentWidth, headerHeight, 'F');

    let currentX = marginX;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);

    columns.forEach((col) => {
      let textX = currentX + 1.5;
      if (col.align === 'center') {
        textX = currentX + col.width / 2;
      } else if (col.align === 'right') {
        textX = currentX + col.width - 1.5;
      }

      pdf.text(col.title, textX, startY + 4.5, { align: col.align });
      currentX += col.width;
    });

    return startY + headerHeight;
  };

  const renderStudentRow = (student: TurmaStudentItem, y: number, isAlt: boolean) => {
    const rowHeight = 6.8;

    // Background fill
    if (isAlt) {
      pdf.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
      pdf.rect(marginX, y, contentWidth, rowHeight, 'F');
    }

    // Row bottom border
    pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    pdf.line(marginX, y + rowHeight, marginX + contentWidth, y + rowHeight);

    let currentX = marginX;
    const textY = y + 4.7;

    columns.forEach((col) => {
      let val = '';
      let isBold = false;
      let textColor = COLOR_TEXT;

      if (col.key === 'ordem') {
        val = String(student.numeroOrdem);
        isBold = true;
        textColor = COLOR_PRIMARY;
      } else if (col.key === 'nome') {
        val = student.nomeCompleto;
        isBold = true;
        textColor = COLOR_TEXT;
      } else if (col.key === 'genero') {
        val = student.genero === 'F' ? 'Feminino' : 'Masculino';
        textColor = student.genero === 'F' ? [190, 24, 93] : [3, 105, 161];
        isBold = true;
      } else if (col.key === 'idade') {
        val = `${student.idade} anos`;
        textColor = COLOR_TEXT;
      } else if (col.key === 'situacao') {
        val = student.condicaoMatricula;
        textColor = student.condicaoMatricula === 'Repetente'
          ? [180, 83, 9]
          : student.condicaoMatricula === 'Transferido'
          ? [109, 40, 217]
          : [4, 120, 87];
        isBold = true;
      }

      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setFontSize(6.8);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);

      let textX = currentX + 1.5;
      if (col.align === 'center') {
        textX = currentX + col.width / 2;
      } else if (col.align === 'right') {
        textX = currentX + col.width - 1.5;
      }

      // Truncate text if exceeds column width
      const maxColTextWidth = col.width - 3;
      let printVal = val;
      if (pdf.getTextWidth(printVal) > maxColTextWidth) {
        while (pdf.getTextWidth(printVal + '..') > maxColTextWidth && printVal.length > 3) {
          printVal = printVal.slice(0, -1);
        }
        printVal = printVal + '..';
      }

      pdf.text(printVal, textX, textY, { align: col.align });

      // Column vertical subtle divider
      pdf.setDrawColor(235, 240, 245);
      pdf.line(currentX + col.width, y, currentX + col.width, y + rowHeight);

      currentX += col.width;
    });

    return y + rowHeight;
  };

  const renderFooter = (pageNumber: number) => {
    const footerY = 289;
    pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    pdf.line(marginX, footerY - 2, marginX + contentWidth, footerY - 2);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    pdf.text(
      `Autenticação SIGE / uCore Angola • Cód: ${data.metadata.codigoAutenticacao}`,
      marginX,
      footerY + 1.5
    );

    pdf.setFont('helvetica', 'bold');
    pdf.text(
      `Página ${pageNumber} de ${totalPages} • Ordem Alfabética A-Z`,
      pageWidth - marginX,
      footerY + 1.5,
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
  const COLOR_PRIMARY = [0, 33, 51];
  const COLOR_TEXT = [15, 23, 42];
  const COLOR_MUTED = [100, 116, 139];
  const COLOR_BORDER = [203, 213, 225];
  const COLOR_HEADER_BG = [241, 245, 249];

  // 1. Resumo Estatístico Box
  const statsBoxHeight = 14;
  pdf.setFillColor(COLOR_HEADER_BG[0], COLOR_HEADER_BG[1], COLOR_HEADER_BG[2]);
  pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  pdf.rect(marginX, startY, contentWidth, statsBoxHeight, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  pdf.text('RESUMO ESTATÍSTICO DA TURMA:', marginX + 4, startY + 4.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);

  const statsY = startY + 9.5;
  const colWidth = contentWidth / 4;

  pdf.text(`Total Matriculados: ${data.stats.total} alunos`, marginX + 4, statsY);
  pdf.text(`Meninas: ${data.stats.meninas} (${data.stats.percentualF})`, marginX + colWidth + 2, statsY);
  pdf.text(`Meninos: ${data.stats.meninos} (${data.stats.percentualM})`, marginX + colWidth * 2 + 2, statsY);
  pdf.text(
    `Regularizados: ${data.stats.comDocumentos} | Pendentes: ${data.stats.semDocumentos}`,
    marginX + colWidth * 3 + 2,
    statsY
  );

  // 2. Termo de Homologação e Assinaturas (3 columns)
  const signY = startY + statsBoxHeight + 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  pdf.text('TERMO DE CONFERÊNCIA E HOMOLOGAÇÃO DA LISTA NOMINAL:', marginX, signY);

  const blockWidth = (contentWidth - 8) / 3;
  const blockTop = signY + 3;
  const blockHeight = 26;

  const signatures = [
    {
      title: 'O(A) PROFESSOR(A) TITULAR',
      name: data.metadata.professorTitular,
      role: 'Regência e Gestão de Turma',
    },
    {
      title: 'O(A) SUBDIRECTOR(A) PEDAGÓGICO(A)',
      name: data.metadata.subdiretorPedagogico,
      role: 'Supervisão Pedagógica',
    },
    {
      title: 'O(A) DIRECTOR(A) DA ESCOLA',
      name: data.metadata.diretorEscola,
      role: 'Homologação e Carimbo Oficial',
    },
  ];

  signatures.forEach((sig, idx) => {
    const blockX = marginX + idx * (blockWidth + 4);

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    pdf.rect(blockX, blockTop, blockWidth, blockHeight, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    pdf.text(sig.title, blockX + blockWidth / 2, blockTop + 4.5, { align: 'center' });

    // Dotted signature line
    const lineY = blockTop + 16;
    pdf.setDrawColor(148, 163, 184);
    pdf.line(blockX + 6, lineY, blockX + blockWidth - 6, lineY);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    pdf.text(sig.name, blockX + blockWidth / 2, lineY + 4, { align: 'center' });

    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(6);
    pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    pdf.text(sig.role, blockX + blockWidth / 2, lineY + 7.5, { align: 'center' });
  });
}
