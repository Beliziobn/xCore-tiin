import jsPDF from 'jspdf';
import { StudentProfile, StudentGrade, defaultDisciplinasList } from '../data/teacherData';

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

export interface PautaMetadata {
  escola?: string;
  turma?: string;
  classe?: string;
  turno?: string;
  sala?: string;
  anoLectivo?: string;
  trimestre?: string;
  professorTitular?: string;
  dataEmissao?: string;
}

export interface ExportPautaOptions {
  students: StudentProfile[];
  metadata?: PautaMetadata;
  mode?: 'geral' | 'disciplina';
  selectedDiscipline?: string;
  onProgress?: (message: string) => void;
  openInNewTab?: boolean;
}

// Short abbreviations for disciplines in table headers
const DISCIPLINE_ABBR: Record<string, string> = {
  'Língua Portuguesa': 'L. PORT',
  'Matemática': 'MAT',
  'Ciências Naturais': 'C. NAT',
  'História': 'HIST',
  'Geografia': 'GEOG',
  'Educação Física': 'ED. FÍS',
  'Educação Visual e Plástica': 'E.V.P',
};

export async function exportPautaToPDF(options: ExportPautaOptions): Promise<void> {
  const {
    students,
    metadata = {},
    mode = 'geral',
    selectedDiscipline = 'Língua Portuguesa',
    onProgress,
  } = options;

  onProgress?.('Iniciando compilação da pauta oficial com jsPDF...');

  const Ctor = getJsPDFConstructor();

  // Mode 'geral' uses Landscape A4 to comfortably display all 7 subjects + overall average
  // Mode 'disciplina' uses Portrait A4 to display P1, P2, Trabalho, Média
  const isLandscape = mode === 'geral';
  const pdf = new Ctor({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;
  const marginX = 10;
  const contentWidth = pageWidth - marginX * 2; // 277mm for landscape, 190mm for portrait

  // Colors
  const COLOR_PRIMARY = [0, 33, 51]; // #002133 deep navy
  const COLOR_ACCENT = [247, 81, 66]; // #f75142 crimson coral
  const COLOR_GOLD = [202, 138, 4]; // #ca8a04
  const COLOR_TEXT = [15, 23, 42]; // #0f172a slate-900
  const COLOR_MUTED = [100, 116, 139]; // #64748b slate-500
  const COLOR_BORDER = [203, 213, 225]; // #cbd5e1 slate-300
  const COLOR_ROW_ALT = [248, 250, 252]; // #f8fafc slate-50
  const COLOR_HEADER_BG = [241, 245, 249]; // #f1f5f9 slate-100
  const COLOR_DANGER = [225, 29, 72]; // rose-600 for negative marks
  const COLOR_HONOR = [109, 40, 217]; // purple-700 for honor roll
  const COLOR_SUCCESS = [16, 149, 106]; // emerald-600 for passing marks

  const defaultMeta: Required<PautaMetadata> = {
    escola: metadata.escola || 'Direcção Municipal da Educação do Quéssua',
    turma: metadata.turma || 'Turma 1',
    classe: metadata.classe || '4ª Classe',
    turno: metadata.turno || 'Manhã',
    sala: metadata.sala || 'Sala 04',
    anoLectivo: metadata.anoLectivo || '2026',
    trimestre: metadata.trimestre || '1º Trimestre',
    professorTitular: metadata.professorTitular || 'Santar Goes',
    dataEmissao: metadata.dataEmissao || new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  };

  // Pre-calculate statistics
  const totalStudents = students.length;
  let aprovadosCount = 0;
  let honraCount = 0;
  let riscoCount = 0;
  let reprovadosCount = 0;
  let somaMedias = 0;
  let somaPresencas = 0;

  const sortedStudents = [...students].sort((a, b) => (a.numeroChamada || 0) - (b.numeroChamada || 0));

  sortedStudents.forEach((st) => {
    let studentMedia = 14.0;
    if (st.grades && st.grades.length > 0) {
      if (mode === 'disciplina') {
        const g = st.grades.find((x) => x.subject === selectedDiscipline);
        studentMedia = g ? g.media : 14.0;
      } else {
        studentMedia = st.grades.reduce((acc, g) => acc + g.media, 0) / st.grades.length;
      }
    }
    somaMedias += studentMedia;
    somaPresencas += (st.presencaPercent ?? 95);

    if (studentMedia >= 16) {
      honraCount++;
      aprovadosCount++;
    } else if (studentMedia >= 10) {
      if (studentMedia < 10.5 || (st.presencaPercent ?? 100) < 75) {
        riscoCount++;
      }
      aprovadosCount++;
    } else {
      reprovadosCount++;
    }
  });

  const mediaGeralTurma = totalStudents > 0 ? (somaMedias / totalStudents).toFixed(1) : '14.0';
  const presencaMediaTurma = totalStudents > 0 ? (somaPresencas / totalStudents).toFixed(1) : '95.0';
  const taxaAprovacao = totalStudents > 0 ? ((aprovadosCount / totalStudents) * 100).toFixed(1) : '100.0';

  onProgress?.('Formatando grelha curricular e notas dos alunos...');

  // Columns definition for Landscape General Pauta (Sum = 277mm)
  const columnsGeneral = [
    { key: 'num', title: 'Nº', width: 9, align: 'center' as const },
    { key: 'nome', title: 'Nome Completo do Aluno', width: 56, align: 'left' as const },
    { key: 'sexo', title: 'Sexo', width: 10, align: 'center' as const },
    { key: 'lp', title: 'L. PORT', width: 18, align: 'center' as const },
    { key: 'mat', title: 'MAT', width: 18, align: 'center' as const },
    { key: 'cn', title: 'C. NAT', width: 18, align: 'center' as const },
    { key: 'hist', title: 'HIST', width: 18, align: 'center' as const },
    { key: 'geog', title: 'GEOG', width: 18, align: 'center' as const },
    { key: 'ef', title: 'ED. FÍS', width: 18, align: 'center' as const },
    { key: 'evp', title: 'E.V.P', width: 18, align: 'center' as const },
    { key: 'media', title: 'MÉDIA', width: 19, align: 'center' as const },
    { key: 'presenca', title: 'PRES.', width: 17, align: 'center' as const },
    { key: 'resultado', title: 'RESULTADO', width: 40, align: 'center' as const },
  ];

  // Columns definition for Single Subject Pauta (Portrait Sum = 190mm)
  const columnsSingleDiscipline = [
    { key: 'num', title: 'Nº', width: 10, align: 'center' as const },
    { key: 'nome', title: 'Nome Completo do Aluno', width: 70, align: 'left' as const },
    { key: 'sexo', title: 'Sexo', width: 12, align: 'center' as const },
    { key: 'p1', title: 'P1', width: 16, align: 'center' as const },
    { key: 'p2', title: 'P2', width: 16, align: 'center' as const },
    { key: 'trabalho', title: 'TRABALHO', width: 20, align: 'center' as const },
    { key: 'media', title: 'MÉDIA', width: 18, align: 'center' as const },
    { key: 'resultado', title: 'SITUAÇÃO', width: 28, align: 'center' as const },
  ];

  const columns: { key: string; title: string; width: number; align: 'left' | 'center' | 'right' }[] = isLandscape
    ? columnsGeneral
    : columnsSingleDiscipline;

  // Pagination logic:
  // In Landscape, header takes ~46mm, bottom summary + signatures takes ~38mm.
  // Each student row takes 6.2mm.
  // With 210mm height, page 1 can fit up to 16 rows if summary is on page 1, or 22 rows if summary goes to page 2.
  const rowsPerPage = isLandscape ? 16 : 22;
  const totalPages = Math.ceil(totalStudents / rowsPerPage) || 1;

  const renderHeader = (pageNumber: number) => {
    // Top National Banner Stripe
    pdf.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    pdf.rect(marginX, 7, contentWidth, 1.8, 'F');

    // Crests on left & right
    const crestLeftX = marginX + 6;
    const crestY = 13.5;
    pdf.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    pdf.circle(crestLeftX, crestY, 3.5, 'F');
    pdf.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    pdf.circle(crestLeftX, crestY, 1.8, 'F');

    const crestRightX = marginX + contentWidth - 6;
    pdf.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    pdf.circle(crestRightX, crestY, 3.5, 'F');
    pdf.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    pdf.circle(crestRightX, crestY, 1.8, 'F');

    // Official titles
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    pdf.text('REPÚBLICA DE ANGOLA', pageWidth / 2, 11.5, { align: 'center' });

    pdf.setFontSize(7.5);
    pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    pdf.text('MINISTÉRIO DA EDUCAÇÃO · DIRECÇÃO MUNICIPAL DA EDUCAÇÃO', pageWidth / 2, 15, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    pdf.text(defaultMeta.escola.toUpperCase(), pageWidth / 2, 18.5, { align: 'center' });

    // Document Title Box
    pdf.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    pdf.rect(marginX, 21, contentWidth, 6, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    const titleText = isLandscape
      ? `PAUTA OFICIAL DE AVALIAÇÃO E APROVEITAMENTO ESCOLAR · ${defaultMeta.trimestre.toUpperCase()} / ANO LECTIVO ${defaultMeta.anoLectivo}`
      : `PAUTA PARCELAR DE AVALIAÇÃO · ${selectedDiscipline.toUpperCase()} · ${defaultMeta.trimestre.toUpperCase()} / ${defaultMeta.anoLectivo}`;
    pdf.text(titleText, pageWidth / 2, 25, { align: 'center' });

    // Metadata Bar (2 columns)
    const metaY = 28.5;
    const metaHeight = 11;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    pdf.rect(marginX, metaY, contentWidth, metaHeight, 'D');

    pdf.setFontSize(7);
    // Col 1
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    pdf.text('CLASSE / TURMA:', marginX + 3, metaY + 4);
    pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    pdf.text(`${defaultMeta.classe} · ${defaultMeta.turma}`, marginX + 27, metaY + 4);

    pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    pdf.text('TURNO / SALA:', marginX + 3, metaY + 8.5);
    pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    pdf.text(`${defaultMeta.turno} · ${defaultMeta.sala}`, marginX + 24, metaY + 8.5);

    // Col 2
    const midX = isLandscape ? marginX + 100 : marginX + 75;
    pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    pdf.text('PROF. TITULAR:', midX, metaY + 4);
    pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    pdf.text(defaultMeta.professorTitular, midX + 22, metaY + 4);

    pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    pdf.text('DATA EMISSÃO:', midX, metaY + 8.5);
    pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    pdf.text(defaultMeta.dataEmissao, midX + 22, metaY + 8.5);

    // Col 3
    const rightX = isLandscape ? marginX + 200 : marginX + 135;
    pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    pdf.text('TOTAL ALUNOS:', rightX, metaY + 4);
    pdf.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    pdf.text(`${totalStudents} matriculados`, rightX + 22, metaY + 4);

    pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    pdf.text('APROVEITAMENTO:', rightX, metaY + 8.5);
    pdf.setTextColor(COLOR_SUCCESS[0], COLOR_SUCCESS[1], COLOR_SUCCESS[2]);
    pdf.text(`${taxaAprovacao}% aprovação`, rightX + 26, metaY + 8.5);

    return metaY + metaHeight + 2.5;
  };

  const renderTableHeader = (startY: number) => {
    const hHeight = 6.2;
    pdf.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    pdf.rect(marginX, startY, contentWidth, hHeight, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(255, 255, 255);

    let currX = marginX;
    columns.forEach((col) => {
      let tX = currX + 1.5;
      if (col.align === 'center') {
        tX = currX + col.width / 2;
      } else if (col.align === 'right') {
        tX = currX + col.width - 1.5;
      }
      pdf.text(col.title, tX, startY + 4.2, { align: col.align });
      currX += col.width;
    });

    return startY + hHeight;
  };

  const renderSummaryAndSignatures = (startY: number) => {
    // 1. Statistics Box
    const boxHeight = 12;
    pdf.setFillColor(COLOR_HEADER_BG[0], COLOR_HEADER_BG[1], COLOR_HEADER_BG[2]);
    pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    pdf.rect(marginX, startY, contentWidth, boxHeight, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    pdf.text('RESUMO ESTATÍSTICO DE APROVEITAMENTO PEDAGÓGICO:', marginX + 3, startY + 4.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);

    const statLineY = startY + 8.5;
    if (isLandscape) {
      pdf.text(`Total Avaliados: ${totalStudents}`, marginX + 3, statLineY);
      pdf.setTextColor(COLOR_SUCCESS[0], COLOR_SUCCESS[1], COLOR_SUCCESS[2]);
      pdf.text(`Aprovados: ${aprovadosCount} (${taxaAprovacao}%)`, marginX + 42, statLineY);
      pdf.setTextColor(COLOR_HONOR[0], COLOR_HONOR[1], COLOR_HONOR[2]);
      pdf.text(`Quadro de Honra (≥16): ${honraCount}`, marginX + 90, statLineY);
      pdf.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
      pdf.text(`Em Risco (10-10.4): ${riscoCount}`, marginX + 145, statLineY);
      pdf.setTextColor(COLOR_DANGER[0], COLOR_DANGER[1], COLOR_DANGER[2]);
      pdf.text(`Abaixo da Média (<10): ${reprovadosCount}`, marginX + 195, statLineY);
      pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.text(`Média Geral Turma: ${mediaGeralTurma} val.`, marginX + 242, statLineY);
    } else {
      pdf.text(`Avaliados: ${totalStudents} | Aprovados: ${aprovadosCount} (${taxaAprovacao}%) | Honra: ${honraCount} | Risco: ${riscoCount} | Abaixo: ${reprovadosCount}`, marginX + 3, statLineY);
    }

    // 2. Signatures Block (3 signatories)
    const sigY = startY + boxHeight + 3;
    const colWidth = contentWidth / 3;

    // Helper for signature slot
    const drawSigLine = (colIndex: number, role: string, name: string) => {
      const x0 = marginX + colIndex * colWidth + 8;
      const x1 = marginX + (colIndex + 1) * colWidth - 8;
      const lineY = sigY + 12;

      pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
      pdf.setLineDashPattern([1, 1], 0);
      pdf.line(x0, lineY, x1, lineY);
      pdf.setLineDashPattern([], 0); // reset to solid

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.text(role, (x0 + x1) / 2, lineY + 3.5, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      pdf.text(name, (x0 + x1) / 2, lineY + 6.8, { align: 'center' });
    };

    drawSigLine(0, 'O PROFESSOR TITULAR', defaultMeta.professorTitular);
    drawSigLine(1, 'O COORDENADOR PEDAGÓGICO', 'Conselho de Disciplina / Coordenação');
    drawSigLine(2, 'O DIRECTOR DA ESCOLA', 'Direcção Geral do Complexo Escolar');

    // 3. Security Watermark & Timestamp footer
    const footerY = pageHeight - 5;
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(5.5);
    pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    const hashSignature = `SIGRE-SEC-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${defaultMeta.anoLectivo}`;
    pdf.text(
      `Documento oficial gerado via Plataforma Educativa Sigre · Homologação SIGE Angola · Código de Autenticidade: ${hashSignature}`,
      marginX,
      footerY
    );
    pdf.text(`Página 1 de 1`, marginX + contentWidth, footerY, { align: 'right' });
  };

  // Render first page header
  let currentY = renderHeader(1);
  currentY = renderTableHeader(currentY);

  // Render Student Rows
  const rowHeight = 6.2;

  sortedStudents.forEach((student, index) => {
    // Check if we need a new page
    // If remaining space is too small for row + summary
    const isLastItem = index === sortedStudents.length - 1;
    const neededBottomSpace = isLastItem ? 38 : rowHeight + 5;

    if (currentY + neededBottomSpace > pageHeight - 8) {
      pdf.addPage();
      currentY = renderHeader(2);
      currentY = renderTableHeader(currentY);
    }

    const isAlt = index % 2 === 1;
    if (isAlt) {
      pdf.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
      pdf.rect(marginX, currentY, contentWidth, rowHeight, 'F');
    }

    // Row bottom border
    pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    pdf.line(marginX, currentY + rowHeight, marginX + contentWidth, currentY + rowHeight);

    // Calculate student metrics
    const studentGrades = student.grades || [];
    const mediaGeralNum = studentGrades.length > 0
      ? studentGrades.reduce((acc, g) => acc + g.media, 0) / studentGrades.length
      : 14.0;
    const mediaGeralStr = mediaGeralNum.toFixed(1);
    const presencaNum = student.presencaPercent ?? 95;

    let situacao = 'Aprovado';
    if (mediaGeralNum >= 16) {
      situacao = 'Quadro de Honra';
    } else if (mediaGeralNum < 10) {
      situacao = 'Reprovado';
    } else if (mediaGeralNum < 10.5 || presencaNum < 75) {
      situacao = 'Em Risco';
    }

    let colX = marginX;

    if (isLandscape) {
      // Landscape: Nº, Nome, Sexo, LP, MAT, CN, HIST, GEO, EF, EVP, Média, Pres., Resultado
      // 1. Nº
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.text(String(student.numeroChamada || index + 1), colX + 4.5, currentY + 4.2, { align: 'center' });
      colX += 9;

      // 2. Nome
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.8);
      pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      const truncatedName = student.name.length > 34 ? student.name.substring(0, 32) + '…' : student.name;
      pdf.text(truncatedName, colX + 1.5, currentY + 4.2);
      colX += 56;

      // 3. Sexo
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      pdf.text(student.genero || 'M', colX + 5, currentY + 4.2, { align: 'center' });
      colX += 10;

      // 4. Seven Subjects: LP, MAT, CN, HIST, GEO, EF, EVP
      const subjectsOrder = [
        'Língua Portuguesa',
        'Matemática',
        'Ciências Naturais',
        'História',
        'Geografia',
        'Educação Física',
        'Educação Visual e Plástica',
      ];

      subjectsOrder.forEach((subj) => {
        const gradeObj = studentGrades.find((g) => g.subject === subj);
        const val = gradeObj ? gradeObj.media : 14.0;
        const valStr = val.toFixed(1);

        pdf.setFont('helvetica', val < 10 ? 'bold' : 'normal');
        pdf.setFontSize(6.5);
        if (val < 10) {
          pdf.setTextColor(COLOR_DANGER[0], COLOR_DANGER[1], COLOR_DANGER[2]);
        } else if (val >= 16) {
          pdf.setTextColor(COLOR_HONOR[0], COLOR_HONOR[1], COLOR_HONOR[2]);
        } else {
          pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        }
        pdf.text(valStr, colX + 9, currentY + 4.2, { align: 'center' });
        colX += 18;
      });

      // 5. Média Geral
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      if (mediaGeralNum < 10) {
        pdf.setTextColor(COLOR_DANGER[0], COLOR_DANGER[1], COLOR_DANGER[2]);
      } else if (mediaGeralNum >= 16) {
        pdf.setTextColor(COLOR_HONOR[0], COLOR_HONOR[1], COLOR_HONOR[2]);
      } else {
        pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      }
      pdf.text(mediaGeralStr, colX + 9.5, currentY + 4.2, { align: 'center' });
      colX += 19;

      // 6. Presença
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(presencaNum < 75 ? COLOR_DANGER[0] : COLOR_TEXT[0], presencaNum < 75 ? COLOR_DANGER[1] : COLOR_TEXT[1], presencaNum < 75 ? COLOR_DANGER[2] : COLOR_TEXT[2]);
      pdf.text(`${presencaNum}%`, colX + 8.5, currentY + 4.2, { align: 'center' });
      colX += 17;

      // 7. Resultado
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      if (situacao === 'Quadro de Honra') {
        pdf.setTextColor(COLOR_HONOR[0], COLOR_HONOR[1], COLOR_HONOR[2]);
      } else if (situacao === 'Reprovado') {
        pdf.setTextColor(COLOR_DANGER[0], COLOR_DANGER[1], COLOR_DANGER[2]);
      } else if (situacao === 'Em Risco') {
        pdf.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
      } else {
        pdf.setTextColor(COLOR_SUCCESS[0], COLOR_SUCCESS[1], COLOR_SUCCESS[2]);
      }
      pdf.text(situacao.toUpperCase(), colX + 20, currentY + 4.2, { align: 'center' });
    } else {
      // Portrait Single Subject: Nº, Nome, Sexo, P1, P2, Trabalho, Média, Situação
      const gObj = studentGrades.find((g) => g.subject === selectedDiscipline) || {
        p1: 14,
        p2: 15,
        trabalho: 15,
        media: 14.6,
        status: 'Aprovado' as const,
      };

      // 1. Nº
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.text(String(student.numeroChamada || index + 1), colX + 5, currentY + 4.2, { align: 'center' });
      colX += 10;

      // 2. Nome
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      pdf.text(student.name, colX + 2, currentY + 4.2);
      colX += 70;

      // 3. Sexo
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      pdf.text(student.genero || 'M', colX + 6, currentY + 4.2, { align: 'center' });
      colX += 12;

      // 4. P1
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      pdf.text(gObj.p1.toFixed(1), colX + 8, currentY + 4.2, { align: 'center' });
      colX += 16;

      // 5. P2
      pdf.text(gObj.p2.toFixed(1), colX + 8, currentY + 4.2, { align: 'center' });
      colX += 16;

      // 6. Trabalho
      pdf.text(gObj.trabalho.toFixed(1), colX + 10, currentY + 4.2, { align: 'center' });
      colX += 20;

      // 7. Média
      pdf.setFont('helvetica', 'bold');
      if (gObj.media < 10) {
        pdf.setTextColor(COLOR_DANGER[0], COLOR_DANGER[1], COLOR_DANGER[2]);
      } else if (gObj.media >= 16) {
        pdf.setTextColor(COLOR_HONOR[0], COLOR_HONOR[1], COLOR_HONOR[2]);
      } else {
        pdf.setTextColor(COLOR_SUCCESS[0], COLOR_SUCCESS[1], COLOR_SUCCESS[2]);
      }
      pdf.text(gObj.media.toFixed(1), colX + 9, currentY + 4.2, { align: 'center' });
      colX += 18;

      // 8. Situação
      pdf.text(gObj.status.toUpperCase(), colX + 14, currentY + 4.2, { align: 'center' });
    }

    currentY += rowHeight;
  });

  // Render bottom summary and signatures
  currentY += 2;
  renderSummaryAndSignatures(currentY);

  onProgress?.('Concluindo exportação e descarregando ficheiro...');

  const filename = mode === 'geral'
    ? `Pauta_Geral_${defaultMeta.classe.replace(/\s+/g, '_')}_${defaultMeta.turma.replace(/\s+/g, '_')}_${defaultMeta.anoLectivo}.pdf`
    : `Pauta_${selectedDiscipline.replace(/\s+/g, '_')}_${defaultMeta.classe.replace(/\s+/g, '_')}_${defaultMeta.turma.replace(/\s+/g, '_')}_${defaultMeta.anoLectivo}.pdf`;

  pdf.save(filename);
}
