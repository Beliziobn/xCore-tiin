import jsPDF from 'jspdf';
import { StudentProfile, StudentGrade } from '../data/teacherData';
import {
  getGradingScaleForClass,
  getDisciplinasForClass,
  formatGradeForClass,
  isPassingGradeForClass,
} from './miniPautaStorage';

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
  periodo?: 'I' | 'II' | 'III' | 'FINAL';
  professorTitular?: string;
  dataEmissao?: string;
}

export interface ExportPautaOptions {
  students: StudentProfile[];
  metadata?: PautaMetadata;
  mode?: 'geral' | 'disciplina';
  periodo?: 'I' | 'II' | 'III' | 'FINAL';
  selectedDiscipline?: string;
  onProgress?: (message: string) => void;
  openInNewTab?: boolean;
}

// Short abbreviations for disciplines in table headers
const DISCIPLINE_ABBR: Record<string, string> = {
  'Língua Portuguesa': 'L. PORT',
  'Matemática': 'MAT',
  'Estudo do Meio': 'EST. MEIO',
  'Educação Manual e Plástica': 'E.M.P',
  'Educação Musical': 'ED. MUS',
  'Educação Física': 'ED. FÍS',
  'Ciências da Natureza': 'C. NAT',
  'Ciências Naturais': 'C. NAT',
  'História': 'HIST',
  'Geografia': 'GEOG',
  'Educação Moral e Cívica': 'E.M.C',
  'Educação Visual e Plástica (EVP)': 'E.V.P',
  'Educação Visual e Plástica': 'E.V.P',
  'Língua Estrangeira (Inglês)': 'INGLÊS',
  'Biologia': 'BIOL',
  'Física': 'FÍS',
  'Química': 'QUÍM',
  'Educação Laboral': 'ED. LAB',
  'História e Geografia': 'HIST/GEO',
};

export async function exportPautaToPDF(options: ExportPautaOptions): Promise<void> {
  const {
    students,
    metadata = {},
    mode = 'geral',
    periodo = 'I',
    selectedDiscipline = 'Língua Portuguesa',
    onProgress,
  } = options;

  onProgress?.('Iniciando compilação da pauta oficial com jsPDF...');

  const Ctor = getJsPDFConstructor();

  const isAllDisciplines = mode === 'geral' || selectedDiscipline === 'TODAS';
  const isFinal = periodo === 'FINAL';

  // Landscape when showing all disciplines OR when showing Pauta Final of 1 discipline (to fit Iº, IIº, IIIº Trimestres + MFD)
  const isLandscape = isAllDisciplines || isFinal;
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

  const periodoLabel =
    periodo === 'FINAL'
      ? 'PAUTA FINAL (Iº, IIº E IIIº TRIMESTRE)'
      : `${periodo}º TRIMESTRE`;

  const defaultMeta = {
    escola: metadata.escola || 'Direcção Municipal da Educação do Quéssua',
    turma: metadata.turma || 'Turma A',
    classe: metadata.classe || '4ª Classe',
    turno: metadata.turno || 'Manhã',
    sala: metadata.sala || 'Sala 04',
    anoLectivo: metadata.anoLectivo || '2026',
    trimestre: metadata.trimestre || periodoLabel,
    professorTitular: metadata.professorTitular || 'Santar Goes',
    dataEmissao:
      metadata.dataEmissao ||
      new Date().toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
  };

  const classScale = getGradingScaleForClass(defaultMeta.classe);
  const classDisciplinas = getDisciplinasForClass(defaultMeta.classe);
  const normValForClass = (raw: number) =>
    classScale.maxNumeric === 10 && raw > 10
      ? Number((raw / 2).toFixed(1))
      : classScale.maxNumeric === 20 && raw <= 10 && raw > 0
      ? Number((raw * 2).toFixed(1))
      : Number(raw.toFixed(1));

  // Helper to get trimester-specific or final values for a student & discipline (sem notas fictícias)
  const getStudentDisciplineMetrics = (student: StudentProfile, subj: string) => {
    const g = (student.grades || []).find((x) => x.subject === subj);
    if (!g) {
      return null;
    }
    const baseMac = normValForClass(g.p1);
    const baseNpp = normValForClass(g.p2);
    const baseNpt = normValForClass(g.trabalho);
    const mt1 = Number(((baseMac + baseNpp + baseNpt) / 3).toFixed(1));

    const t2Mac = baseMac;
    const t2Npp = baseNpp;
    const t2Npt = baseNpt;
    const mt2 = mt1;

    const t3Mac = baseMac;
    const t3Npp = baseNpp;
    const t3Npt = baseNpt;
    const mt3 = mt1;

    const mfd = Number(((mt1 + mt2 + mt3) / 3).toFixed(1));

    return {
      t1: { mac: baseMac, npp: baseNpp, npt: baseNpt, mt: mt1 },
      t2: { mac: t2Mac, npp: t2Npp, npt: t2Npt, mt: mt2 },
      t3: { mac: t3Mac, npp: t3Npp, npt: t3Npt, mt: mt3 },
      mfd,
    };
  };

  const getActivePeriodScore = (student: StudentProfile, subj: string): number | null => {
    const m = getStudentDisciplineMetrics(student, subj);
    if (!m) return null;
    if (periodo === 'I') return m.t1.mt;
    if (periodo === 'II') return m.t2.mt;
    if (periodo === 'III') return m.t3.mt;
    return m.mfd;
  };

  // Pre-calculate statistics strictly for the chosen period and discipline filter
  const totalStudents = students.length;
  let evaluatedCount = 0;
  let aprovadosCount = 0;
  let honraCount = 0;
  let riscoCount = 0;
  let reprovadosCount = 0;
  let somaMedias = 0;

  const sortedStudents = [...students].sort((a, b) => (a.numeroChamada || 0) - (b.numeroChamada || 0));

  sortedStudents.forEach((st) => {
    let studentMedia: number | null = null;
    if (!isAllDisciplines) {
      studentMedia = getActivePeriodScore(st, selectedDiscipline);
    } else {
      const validScores = classDisciplinas
        .map((subj) => getActivePeriodScore(st, subj))
        .filter((v): v is number => v !== null);
      if (validScores.length > 0) {
        studentMedia = validScores.reduce((a, b) => a + b, 0) / validScores.length;
      }
    }
    if (studentMedia === null) return;
    evaluatedCount++;
    somaMedias += studentMedia;

    const honraCut = classScale.maxNumeric === 10 ? 8 : 16;
    const riscoCut = classScale.maxNumeric === 10 ? 5.4 : 10.5;

    if (studentMedia >= honraCut) {
      honraCount++;
      aprovadosCount++;
    } else if (isPassingGradeForClass(studentMedia, defaultMeta.classe)) {
      if (studentMedia < riscoCut || (st.presencaPercent ?? 100) < 75) {
        riscoCount++;
      }
      aprovadosCount++;
    } else {
      reprovadosCount++;
    }
  });

  const mediaGeralTurmaNum = evaluatedCount > 0 ? somaMedias / evaluatedCount : 0;
  const mediaGeralTurma =
    evaluatedCount > 0 ? formatGradeForClass(mediaGeralTurmaNum, defaultMeta.classe, 'compact') : '—';
  const taxaAprovacao =
    evaluatedCount > 0 ? ((aprovadosCount / evaluatedCount) * 100).toFixed(1) : '0.0';

  onProgress?.('Formatando grelha curricular e notas dos alunos...');

  const mtHeaderLabel = periodo === 'FINAL' ? 'MFD' : `MT${periodo === 'I' ? '1' : periodo === 'II' ? '2' : '3'}`;
  const isManySubjects = classDisciplinas.length > 7;
  const fixedNumW = 8;
  const fixedNameW = isManySubjects ? 44 : 56;
  const fixedSexoW = 9;
  const fixedMediaW = isManySubjects ? 16 : 21;
  const fixedObsW = isManySubjects ? 24 : 34;
  const availSubjW = contentWidth - (fixedNumW + fixedNameW + fixedSexoW + fixedMediaW + fixedObsW);
  const dynamicSubjW = Number((availSubjW / Math.max(1, classDisciplinas.length)).toFixed(2));

  interface TableColumn {
    key: string;
    title: string;
    width: number;
    align: 'left' | 'center' | 'right';
  }

  // Columns definition for Landscape All Disciplines (Sum = 277mm)
  const columnsGeneral: TableColumn[] = [
    { key: 'num', title: 'Nº', width: fixedNumW, align: 'center' },
    { key: 'nome', title: 'Nome Completo do Aluno', width: fixedNameW, align: 'left' },
    { key: 'sexo', title: 'Sexo', width: fixedSexoW, align: 'center' },
    ...classDisciplinas.map((subj, idx) => ({
      key: `subj_${idx}`,
      title: `${DISCIPLINE_ABBR[subj] || subj.slice(0, 7).toUpperCase()} (${mtHeaderLabel})`,
      width: dynamicSubjW,
      align: 'center' as const,
    })),
    { key: 'media', title: isFinal ? 'MÉDIA FINAL' : `MÉDIA ${periodo}º T`, width: fixedMediaW, align: 'center' as const },
    { key: 'resultado', title: 'OBSERVAÇÃO', width: fixedObsW, align: 'center' as const },
  ];

  // Columns definition for Single Discipline - Single Trimester (Portrait Sum = 190mm)
  // ONLY shows the selected trimester!
  const columnsSingleDisciplineTrimester: TableColumn[] = [
    { key: 'num', title: 'Nº', width: 10, align: 'center' },
    { key: 'nome', title: 'Nome Completo do Aluno', width: 72, align: 'left' },
    { key: 'sexo', title: 'Sexo', width: 12, align: 'center' },
    { key: 'p1', title: `MAC (${periodo}ºT)`, width: 17, align: 'center' },
    { key: 'p2', title: `NPP (${periodo}ºT)`, width: 17, align: 'center' },
    { key: 'trabalho', title: `NPT (${periodo}ºT)`, width: 17, align: 'center' },
    { key: 'media', title: `MT${periodo === 'I' ? '1' : periodo === 'II' ? '2' : '3'}`, width: 18, align: 'center' },
    { key: 'resultado', title: 'OBSERVAÇÃO', width: 27, align: 'center' },
  ];

  // Columns definition for Single Discipline - Pauta Final (Landscape Sum = 277mm)
  // Shows Iº Trimestre, IIº Trimestre, IIIº Trimestre and MFD for ONLY the chosen discipline!
  const columnsSingleDisciplineFinal: TableColumn[] = [
    { key: 'num', title: 'Nº', width: 9, align: 'center' },
    { key: 'nome', title: 'Nome Completo do Aluno', width: 58, align: 'left' },
    { key: 'sexo', title: 'Sexo', width: 10, align: 'center' },
    { key: 't1_mac', title: 'T1 MAC', width: 13, align: 'center' },
    { key: 't1_npp', title: 'T1 NPP', width: 13, align: 'center' },
    { key: 't1_npt', title: 'T1 NPT', width: 13, align: 'center' },
    { key: 't1_mt', title: 'MT1', width: 14, align: 'center' },
    { key: 't2_mac', title: 'T2 MAC', width: 13, align: 'center' },
    { key: 't2_npp', title: 'T2 NPP', width: 13, align: 'center' },
    { key: 't2_npt', title: 'T2 NPT', width: 13, align: 'center' },
    { key: 't2_mt', title: 'MT2', width: 14, align: 'center' },
    { key: 't3_mac', title: 'T3 MAC', width: 13, align: 'center' },
    { key: 't3_npp', title: 'T3 NPP', width: 13, align: 'center' },
    { key: 't3_npt', title: 'T3 NPT', width: 13, align: 'center' },
    { key: 't3_mt', title: 'MT3', width: 14, align: 'center' },
    { key: 'mfd', title: 'MFD', width: 15, align: 'center' },
    { key: 'resultado', title: 'OBS.', width: 26, align: 'center' },
  ];

  const columns = isAllDisciplines
    ? columnsGeneral
    : isFinal
    ? columnsSingleDisciplineFinal
    : columnsSingleDisciplineTrimester;

  const renderHeader = (_pageNumber: number) => {
    pdf.setFont('times', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text('REPÚBLICA DE ANGOLA', pageWidth / 2, 12, { align: 'center' });
    pdf.text('ADMINISTRAÇÃO MUNICIPAL DO QUÉSSUA', pageWidth / 2, 16, { align: 'center' });
    pdf.text('DIRECÇÃO MUNICIPAL DA EDUCAÇÃO DO QUÉSSUA', pageWidth / 2, 20, { align: 'center' });

    pdf.setFont('times', 'bold');
    pdf.setFontSize(10);
    const headerDocTitle = isFinal
      ? 'PAUTA FINAL'
      : isAllDisciplines
      ? `PAUTA FINAL DO ${periodo}º TRIMESTRE`
      : `MINI-PAUTA DO ${periodo}º TRIMESTRE`;
    pdf.text(headerDocTitle, pageWidth / 2, 24.5, {
      align: 'center',
    });
    pdf.text(defaultMeta.escola.toUpperCase(), pageWidth / 2, 29, { align: 'center' });

    // Single identification line above table
    const lineY = 35;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(0, 0, 0);
    const discLabel = isAllDisciplines ? 'TODAS AS DISCIPLINAS' : selectedDiscipline.toUpperCase();
    const cleanTurma = defaultMeta.turma.replace(/^Turma\s+/i, '').toUpperCase();

    pdf.text(`DISCIPLINA: ${discLabel}`, marginX, lineY);
    pdf.text(
      `CLASSE: ${defaultMeta.classe.toUpperCase()}      TURMA: ${cleanTurma}      ANO LECTIVO: ${defaultMeta.anoLectivo}`,
      marginX + contentWidth,
      lineY,
      { align: 'right' }
    );

    return lineY + 2;
  };

  const renderTableHeader = (startY: number) => {
    const hHeight = 6.5;
    pdf.setFillColor(217, 234, 211); // #d9ead3 classic school green header
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(marginX, startY, contentWidth, hHeight, 'FD');

    pdf.setFont('times', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(0, 0, 0);

    let currX = marginX;
    columns.forEach((col, idx) => {
      let tX = currX + 1.5;
      if (col.align === 'center') {
        tX = currX + col.width / 2;
      } else if (col.align === 'right') {
        tX = currX + col.width - 1.5;
      }
      pdf.text(col.title, tX, startY + 4.3, { align: col.align });
      if (idx < columns.length - 1) {
        pdf.line(currX + col.width, startY, currX + col.width, startY + hHeight);
      }
      currX += col.width;
    });

    return startY + hHeight;
  };

  const renderSummaryAndSignatures = (startY: number) => {
    const sigY = startY + 8;
    const leftSigX = pageWidth * 0.28;
    const rightSigX = pageWidth * 0.72;
    const isMiniPautaDisciplina = !isAllDisciplines && !isFinal;

    pdf.setFont('times', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);

    if (isMiniPautaDisciplina) {
      pdf.text('O(A) Professor(a)', leftSigX, sigY, { align: 'center' });
      pdf.text('O(A) Subdirector(a) Pedagógico(a)', rightSigX, sigY, { align: 'center' });
    } else {
      pdf.text('O(A) Subdirector(a) Pedagógico(a)', leftSigX, sigY, { align: 'center' });
      pdf.text('O(A) Director(a) da Escola', rightSigX, sigY, { align: 'center' });
    }

    pdf.setDrawColor(0, 0, 0);
    pdf.line(leftSigX - 35, sigY + 9, leftSigX + 35, sigY + 9);
    pdf.line(rightSigX - 35, sigY + 9, rightSigX + 35, sigY + 9);
  };

  let currentY = renderHeader(1);
  currentY = renderTableHeader(currentY);

  const rowHeight = 6.2;
  const minPass = classScale.minPassNumeric;
  const honraCut = classScale.maxNumeric === 10 ? 8 : 16;

  if (sortedStudents.length === 0) {
    const emptyRowsCount = isLandscape ? 20 : 25;
    for (let i = 0; i < emptyRowsCount; i++) {
      let cx = marginX;
      columns.forEach((col, cIdx) => {
        const isShaded =
          col.key === 'media' ||
          col.key === 'mfd' ||
          col.key === 'resultado' ||
          col.key === 't1_mt' ||
          col.key === 't2_mt' ||
          col.key === 't3_mt';
        if (isShaded) {
          pdf.setFillColor(198, 224, 180); // #c6e0b4
          pdf.rect(cx, currentY, col.width, rowHeight, 'F');
        }
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(cx, currentY, col.width, rowHeight, 'D');
        if (cIdx === 0) {
          pdf.setFont('times', 'normal');
          pdf.setFontSize(7);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${i + 1}.`, cx + 1.5, currentY + 4.2);
        }
        cx += col.width;
      });
      currentY += rowHeight;
    }
  }

  sortedStudents.forEach((student, index) => {
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

    pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    pdf.line(marginX, currentY + rowHeight, marginX + contentWidth, currentY + rowHeight);

    let colX = marginX;

    if (isAllDisciplines) {
      // All disciplines for the chosen periodo (I, II, III, or FINAL)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(isManySubjects ? 5.8 : 6.5);
      pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.text(String(student.numeroChamada || index + 1), colX + fixedNumW / 2, currentY + 4.2, { align: 'center' });
      colX += fixedNumW;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(isManySubjects ? 5.8 : 6.8);
      pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      const maxNameChars = isManySubjects ? 26 : 34;
      const truncatedName = student.name.length > maxNameChars ? student.name.substring(0, maxNameChars - 2) + '…' : student.name;
      pdf.text(truncatedName, colX + 1.5, currentY + 4.2);
      colX += fixedNameW;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(isManySubjects ? 5.8 : 6.5);
      pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      pdf.text(student.genero || 'M', colX + fixedSexoW / 2, currentY + 4.2, { align: 'center' });
      colX += fixedSexoW;

      let sumSubj = 0;
      let validSubjCount = 0;
      classDisciplinas.forEach((subj) => {
        const val = getActivePeriodScore(student, subj);
        if (val === null) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(isManySubjects ? 5.6 : 6.5);
          pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
          pdf.text('—', colX + dynamicSubjW / 2, currentY + 4.2, { align: 'center' });
          colX += dynamicSubjW;
          return;
        }
        sumSubj += val;
        validSubjCount++;
        const valStr = formatGradeForClass(val, defaultMeta.classe, 'compact');

        pdf.setFont('helvetica', val < minPass ? 'bold' : 'normal');
        pdf.setFontSize(isManySubjects ? 5.6 : 6.5);
        if (val < minPass) {
          pdf.setTextColor(COLOR_DANGER[0], COLOR_DANGER[1], COLOR_DANGER[2]);
        } else if (val >= honraCut) {
          pdf.setTextColor(COLOR_HONOR[0], COLOR_HONOR[1], COLOR_HONOR[2]);
        } else {
          pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        }
        pdf.text(valStr, colX + dynamicSubjW / 2, currentY + 4.2, { align: 'center' });
        colX += dynamicSubjW;
      });

      if (validSubjCount === 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(isManySubjects ? 5.8 : 6.5);
        pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
        pdf.text('—', colX + fixedMediaW / 2, currentY + 4.2, { align: 'center' });
        colX += fixedMediaW;
        pdf.text('—', colX + fixedObsW / 2, currentY + 4.2, { align: 'center' });
      } else {
        const avgVal = Number((sumSubj / validSubjCount).toFixed(1));
        const avgStr = formatGradeForClass(avgVal, defaultMeta.classe, 'compact');
        const passed = isPassingGradeForClass(avgVal, defaultMeta.classe);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(isManySubjects ? 6.2 : 7);
        if (!passed) {
          pdf.setTextColor(COLOR_DANGER[0], COLOR_DANGER[1], COLOR_DANGER[2]);
        } else {
          pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        }
        pdf.text(avgStr, colX + fixedMediaW / 2, currentY + 4.2, { align: 'center' });
        colX += fixedMediaW;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(isManySubjects ? 5.8 : 6.5);
        if (passed) {
          pdf.setTextColor(COLOR_SUCCESS[0], COLOR_SUCCESS[1], COLOR_SUCCESS[2]);
        } else {
          pdf.setTextColor(COLOR_DANGER[0], COLOR_DANGER[1], COLOR_DANGER[2]);
        }
        const obsLabel = isFinal ? (passed ? 'TRANSITA' : 'NÃO TRANSITA') : (passed ? 'POSITIVA' : 'NEGATIVA');
        pdf.text(obsLabel, colX + fixedObsW / 2, currentY + 4.2, { align: 'center' });
      }
    } else if (!isFinal) {
      // Single Discipline + Single Trimester (I, II, or III): ONLY that trimester's MAC, NPP, NPT, MT
      const m = getStudentDisciplineMetrics(student, selectedDiscipline);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.text(String(student.numeroChamada || index + 1), colX + 5, currentY + 4.2, { align: 'center' });
      colX += 10;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      pdf.text(student.name, colX + 2, currentY + 4.2);
      colX += 72;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      pdf.text(student.genero || 'M', colX + 6, currentY + 4.2, { align: 'center' });
      colX += 12;

      if (!m) {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
        pdf.text('—', colX + 8.5, currentY + 4.2, { align: 'center' });
        colX += 17;
        pdf.text('—', colX + 8.5, currentY + 4.2, { align: 'center' });
        colX += 17;
        pdf.text('—', colX + 8.5, currentY + 4.2, { align: 'center' });
        colX += 17;
        pdf.text('—', colX + 9, currentY + 4.2, { align: 'center' });
        colX += 18;
        pdf.text('—', colX + 13.5, currentY + 4.2, { align: 'center' });
      } else {
        const triObj = periodo === 'I' ? m.t1 : periodo === 'II' ? m.t2 : m.t3;
        const passed = isPassingGradeForClass(triObj.mt, defaultMeta.classe);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        pdf.text(formatGradeForClass(triObj.mac, defaultMeta.classe, 'compact'), colX + 8.5, currentY + 4.2, { align: 'center' });
        colX += 17;

        pdf.text(formatGradeForClass(triObj.npp, defaultMeta.classe, 'compact'), colX + 8.5, currentY + 4.2, { align: 'center' });
        colX += 17;

        pdf.text(formatGradeForClass(triObj.npt, defaultMeta.classe, 'compact'), colX + 8.5, currentY + 4.2, { align: 'center' });
        colX += 17;

        pdf.setFont('helvetica', 'bold');
        if (!passed) {
          pdf.setTextColor(COLOR_DANGER[0], COLOR_DANGER[1], COLOR_DANGER[2]);
        } else {
          pdf.setTextColor(COLOR_SUCCESS[0], COLOR_SUCCESS[1], COLOR_SUCCESS[2]);
        }
        pdf.text(formatGradeForClass(triObj.mt, defaultMeta.classe, 'compact'), colX + 9, currentY + 4.2, { align: 'center' });
        colX += 18;

        const sitLabel = passed ? 'POSITIVA' : 'NEGATIVA';
        pdf.text(sitLabel, colX + 13.5, currentY + 4.2, { align: 'center' });
      }
    } else {
      // Single Discipline + Pauta Final: Iº, IIº, IIIº Trimestre + MFD of ONLY selectedDiscipline
      const m = getStudentDisciplineMetrics(student, selectedDiscipline);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      pdf.text(String(student.numeroChamada || index + 1), colX + 4.5, currentY + 4.2, { align: 'center' });
      colX += 9;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.8);
      pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      const truncatedName = student.name.length > 34 ? student.name.substring(0, 32) + '…' : student.name;
      pdf.text(truncatedName, colX + 1.5, currentY + 4.2);
      colX += 58;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      pdf.text(student.genero || 'M', colX + 5, currentY + 4.2, { align: 'center' });
      colX += 10;

      if (!m) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.2);
        pdf.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
        for (let b = 0; b < 3; b++) {
          pdf.text('—', colX + 6.5, currentY + 4.2, { align: 'center' });
          colX += 13;
          pdf.text('—', colX + 6.5, currentY + 4.2, { align: 'center' });
          colX += 13;
          pdf.text('—', colX + 6.5, currentY + 4.2, { align: 'center' });
          colX += 13;
          pdf.text('—', colX + 7, currentY + 4.2, { align: 'center' });
          colX += 14;
        }
        pdf.text('—', colX + 7.5, currentY + 4.2, { align: 'center' });
        colX += 15;
        pdf.text('—', colX + 13, currentY + 4.2, { align: 'center' });
      } else {
        const passed = isPassingGradeForClass(m.mfd, defaultMeta.classe);

        const drawTriBlock = (tri: { mac: number; npp: number; npt: number; mt: number }) => {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(6.2);
          pdf.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
          pdf.text(formatGradeForClass(tri.mac, defaultMeta.classe, 'compact'), colX + 6.5, currentY + 4.2, { align: 'center' });
          colX += 13;
          pdf.text(formatGradeForClass(tri.npp, defaultMeta.classe, 'compact'), colX + 6.5, currentY + 4.2, { align: 'center' });
          colX += 13;
          pdf.text(formatGradeForClass(tri.npt, defaultMeta.classe, 'compact'), colX + 6.5, currentY + 4.2, { align: 'center' });
          colX += 13;

          pdf.setFont('helvetica', 'bold');
          const triPass = isPassingGradeForClass(tri.mt, defaultMeta.classe);
          pdf.setTextColor(
            triPass ? COLOR_PRIMARY[0] : COLOR_DANGER[0],
            triPass ? COLOR_PRIMARY[1] : COLOR_DANGER[1],
            triPass ? COLOR_PRIMARY[2] : COLOR_DANGER[2]
          );
          pdf.text(formatGradeForClass(tri.mt, defaultMeta.classe, 'compact'), colX + 7, currentY + 4.2, { align: 'center' });
          colX += 14;
        };

        drawTriBlock(m.t1);
        drawTriBlock(m.t2);
        drawTriBlock(m.t3);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(
          passed ? COLOR_SUCCESS[0] : COLOR_DANGER[0],
          passed ? COLOR_SUCCESS[1] : COLOR_DANGER[1],
          passed ? COLOR_SUCCESS[2] : COLOR_DANGER[2]
        );
        pdf.text(formatGradeForClass(m.mfd, defaultMeta.classe, 'compact'), colX + 7.5, currentY + 4.2, { align: 'center' });
        colX += 15;

        pdf.setFontSize(6.2);
        pdf.text(passed ? 'TRANSITA' : 'NÃO TRANSITA', colX + 13, currentY + 4.2, { align: 'center' });
      }
    }

    currentY += rowHeight;
  });

  currentY += 2;
  renderSummaryAndSignatures(currentY);

  onProgress?.('Concluindo exportação e descarregando ficheiro...');

  const periodSlug =
    periodo === 'FINAL'
      ? 'Pauta_Final'
      : isAllDisciplines
      ? `Pauta_Final_${periodo}_Trimestre`
      : `Mini_Pauta_${periodo}_Trimestre`;
  const discSlug = isAllDisciplines ? 'Todas_Disciplinas' : selectedDiscipline.replace(/\s+/g, '_');
  const filename = `${periodSlug}_${discSlug}_${defaultMeta.classe.replace(/\s+/g, '_')}_${defaultMeta.turma.replace(/\s+/g, '_')}.pdf`;

  pdf.save(filename);
}
