import jsPDF from 'jspdf';
import emblemAngolaImg from '../assets/images/Emblem_of_Angola.svg.webp';
import { loadEmblemPngDataUrl } from './declaracaoPdfGenerator';
import type { TurmaStudentListResult, TurmaStudentItem } from './turmaStudentsService';

/**
 * Obtém o construtor jsPDF de forma segura em ambientes ESM/CJS.
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
 * Gera e descarrega a Lista Nominal de Alunos por Turma em PDF A4 nativo,
 * seguindo rigorosamente o mesmo sistema estrutural, margens (16mm / 14mm),
 * insígnia oficial (22mm), hierarquia tipográfica (10pt negrito / 8pt normal)
 * e grelhas em preto puro (#000000) da Ficha Individual (Anexo III).
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
  const marginX = 16;
  const marginTop = 14;
  const marginBottom = 14;
  const usableWidth = pageWidth - marginX * 2; // 178mm
  const centerX = pageWidth / 2;

  const cleanTurma = data.metadata.turma.replace(/^Turma\s+/i, '');
  const cleanSala = data.metadata.sala.replace(/^Sala\s+/i, '');

  // Colunas da tabela nominal (soma = 178mm)
  const columns: {
    key: string;
    title: string;
    width: number;
    align: 'left' | 'center' | 'right';
  }[] = [
    { key: 'ordem', title: 'Nº', width: 12, align: 'center' },
    { key: 'codigo', title: 'Código', width: 28, align: 'center' },
    { key: 'nome', title: 'Nome Completo do Aluno', width: 82, align: 'left' },
    { key: 'genero', title: 'Sexo', width: 14, align: 'center' },
    { key: 'idade', title: 'Idade', width: 14, align: 'center' },
    { key: 'situacao', title: 'Observação', width: 28, align: 'center' },
  ];

  pdf.setDrawColor(0, 0, 0);
  pdf.setTextColor(0, 0, 0);
  pdf.setLineWidth(0.3);

  let y = marginTop;

  // =========================================================================
  // 1. CABEÇALHO INSTITUCIONAL COM INSÍGNIA DA REPÚBLICA DE ANGOLA
  // =========================================================================
  const emblemData = await loadEmblemPngDataUrl(emblemAngolaImg);
  if (emblemData) {
    const emblemHeight = 22;
    const emblemWidth = emblemHeight * emblemData.ratio;
    pdf.addImage(
      emblemData.dataUrl,
      'PNG',
      centerX - emblemWidth / 2,
      y,
      emblemWidth,
      emblemHeight
    );
    y += emblemHeight + 5;
  } else {
    y += 8;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('REPÚBLICA DE ANGOLA', centerX, y, { align: 'center' });
  y += 4.5;
  pdf.text('GOVERNO PROVINCIAL DE MALANJE', centerX, y, { align: 'center' });
  y += 4.5;
  pdf.text('ADMINISTRAÇÃO MUNICIPAL DO QUÊSSUA', centerX, y, { align: 'center' });
  y += 4.5;
  pdf.text('DIRECÇÃO MUNICIPAL DE EDUCAÇÃO', centerX, y, { align: 'center' });
  y += 6;

  pdf.setFontSize(10);
  pdf.text(
    `LISTA NOMINAL DOS ALUNOS POR TURMA — ANO LECTIVO ${data.metadata.anoLectivo}`,
    centerX,
    y,
    { align: 'center' }
  );
  y += 5.5;

  // =========================================================================
  // 2. IDENTIFICAÇÃO DA ESCOLA E DA TURMA (a), b), c) — BORDAS 0.3mm PRETAS)
  // =========================================================================
  const idRowH = 6.8;
  pdf.setLineWidth(0.3);

  // Linha 1: a) Malanje | b) Quêssua
  const halfW = usableWidth / 2;
  pdf.rect(marginX, y, halfW, idRowH);
  pdf.rect(marginX + halfW, y, halfW, idRowH);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('a) Província: Malanje', marginX + 3, y + 4.6);
  pdf.text('b) Município: Quêssua', marginX + halfW + 3, y + 4.6);
  y += idRowH;

  // Linha 2: c) Escola / Instituição
  pdf.rect(marginX, y, usableWidth, idRowH);
  pdf.text(`c) Escola / Instituição: ${data.metadata.escola}`, marginX + 3, y + 4.6);
  y += idRowH;

  // Linha 3: Classe | Turma | Período | Sala
  const metaWidths = [42, 32, 68, 36]; // sum = 178
  const metaTexts = [
    `Classe: ${data.metadata.classe}`,
    `Turma: ${cleanTurma}`,
    `Período: ${data.metadata.turno}`,
    `Sala: ${cleanSala}`,
  ];
  let mx = marginX;
  for (let i = 0; i < metaWidths.length; i++) {
    pdf.rect(mx, y, metaWidths[i], idRowH);
    pdf.text(metaTexts[i], mx + 3, y + 4.6);
    mx += metaWidths[i];
  }
  y += idRowH;

  // Linha 4: Professor Titular | Data de Emissão
  pdf.rect(marginX, y, halfW, idRowH);
  pdf.rect(marginX + halfW, y, halfW, idRowH);
  pdf.text(`Professor(a) Titular: ${data.metadata.professorTitular}`, marginX + 3, y + 4.6);
  pdf.text(`Data de Emissão: ${data.metadata.dataEmissao}`, marginX + halfW + 3, y + 4.6);
  y += idRowH + 6;

  // =========================================================================
  // 3. TABELA NOMINAL DOS ALUNOS
  // =========================================================================
  const drawSectionTitle = (title: string) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(title, marginX, y);
    y += 3;
  };

  const renderTableHeader = () => {
    const headerH = 7;
    let cx = marginX;
    pdf.setLineWidth(0.3);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    columns.forEach((col) => {
      pdf.rect(cx, y, col.width, headerH);
      const tx =
        col.align === 'center'
          ? cx + col.width / 2
          : col.align === 'right'
          ? cx + col.width - 2.5
          : cx + 2.5;
      pdf.text(col.title, tx, y + 4.8, { align: col.align });
      cx += col.width;
    });
    y += headerH;
  };

  const renderStudentRow = (student: TurmaStudentItem) => {
    const rowH = 6.5;
    let cx = marginX;
    pdf.setLineWidth(0.3);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);

    columns.forEach((col) => {
      pdf.rect(cx, y, col.width, rowH);
      let val = '';
      if (col.key === 'ordem') {
        val = String(student.numeroOrdem).padStart(2, '0');
      } else if (col.key === 'codigo') {
        val = student.codigoMatricula || '—';
      } else if (col.key === 'nome') {
        val = student.nomeCompleto;
      } else if (col.key === 'genero') {
        val = student.genero;
      } else if (col.key === 'idade') {
        val = `${student.idade}`;
      } else if (col.key === 'situacao') {
        val =
          (student.condicaoMatricula as string) === 'Matriculado' ||
          student.condicaoMatricula === 'Novo'
            ? ''
            : student.condicaoMatricula;
      }

      const maxTextW = col.width - 4;
      let printVal = val;
      if (pdf.getTextWidth(printVal) > maxTextW) {
        while (pdf.getTextWidth(printVal + '...') > maxTextW && printVal.length > 3) {
          printVal = printVal.slice(0, -1);
        }
        printVal = printVal + '...';
      }

      const tx =
        col.align === 'center'
          ? cx + col.width / 2
          : col.align === 'right'
          ? cx + col.width - 2.5
          : cx + 2.5;
      pdf.text(printVal, tx, y + 4.4, { align: col.align });
      cx += col.width;
    });

    y += rowH;
  };

  onProgress?.('Renderizando lista nominal dos alunos...');
  drawSectionTitle('Relação Nominal dos Alunos');
  renderTableHeader();

  const rowH = 6.5;
  const maxPageY = pageHeight - marginBottom;

  if (data.students.length === 0) {
    pdf.rect(marginX, y, usableWidth, 10);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('Nenhum aluno registado para os critérios selecionados.', centerX, y + 6.5, {
      align: 'center',
    });
    y += 10;
  } else {
    for (let i = 0; i < data.students.length; i++) {
      if (y + rowH > maxPageY) {
        pdf.addPage('a4', 'portrait');
        y = marginTop + 2;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(
          `${data.metadata.escola.toUpperCase()} — ${data.metadata.classe} (${data.metadata.turma}) — Continuação`,
          marginX,
          y
        );
        y += 4;
        renderTableHeader();
      }
      renderStudentRow(data.students[i]);
    }
  }

  y += 6;

  // =========================================================================
  // 4. ASSINATURAS DE HOMOLOGAÇÃO
  // =========================================================================
  const sigBlockHeight = 32;
  if (y + sigBlockHeight > maxPageY) {
    pdf.addPage('a4', 'portrait');
    y = marginTop + 8;
  } else {
    y += 6;
  }

  // Bloco de Assinaturas (estilo Ficha Individual: 10pt negrito + linha 0.3mm + nome 8pt)
  const colCenter1 = marginX + usableWidth * 0.25;
  const colCenter2 = marginX + usableWidth * 0.75;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('O(A) Professor(a) / Director(a) de Turma', colCenter1, y, { align: 'center' });
  pdf.text('O(A) Director(a) da Escola', colCenter2, y, { align: 'center' });
  y += 14;

  pdf.setLineWidth(0.3);
  pdf.line(colCenter1 - 35, y, colCenter1 + 35, y);
  pdf.line(colCenter2 - 35, y, colCenter2 + 35, y);
  y += 4.5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(data.metadata.professorTitular, colCenter1, y, { align: 'center' });
  pdf.text(data.metadata.diretorEscola, colCenter2, y, { align: 'center' });

  onProgress?.('Finalizando documento e descarregando...');

  const safeClass = data.metadata.classe.replace(/[^a-zA-Z0-9]/g, '_');
  const safeTurma = data.metadata.turma.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Lista_Alunos_${safeClass}_${safeTurma}_Ordem_AZ.pdf`;

  pdf.save(fileName);
  onProgress?.('Download concluído com sucesso!');
}
