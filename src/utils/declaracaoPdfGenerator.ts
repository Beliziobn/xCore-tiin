import { jsPDF } from 'jspdf';
import emblemAngolaImg from '../assets/images/Emblem_of_Angola.svg.webp';
import type { CadastramentoEfectividadeRecord } from './efectividadeStorage';
import type { DeclaracaoServicoRecord } from './declaracaoServicoStorage';
import { fmtDateDeclaracaoServico, fmtKz } from './declaracaoServicoStorage';
import type { GuiaFeriasRecord } from './guiaFeriasStorage';
import { formatDateExtenso } from './guiaFeriasStorage';
import type { QuickServiceRequest } from '../types';
import { formatAngolanDateExtenso } from './efectividadeStorage';
import {
  isFemaleFirstName,
  resolveIsFeminino,
  adaptOccupationalTextToGender,
  getPreposicaoEscola,
  getPreposicaoProvincia,
  formatFinalidadeWithPreposition,
} from './genderGrammar';

export interface TextSegment {
  text: string;
  bold?: boolean;
}

interface WordToken {
  word: string;
  bold: boolean;
  width: number;
}

/**
 * Converte a imagem da Insígnia da República de Angola para PNG DataURL
 * para incorporação nítida no ficheiro PDF.
 */
async function loadEmblemPngDataUrl(src: string): Promise<{ dataUrl: string; ratio: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth || 240;
        const h = img.naturalHeight || 240;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          ratio: w / h,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Renderiza um parágrafo justificado em Times New Roman (12pt) com suporte a
 * trechos em negrito e recuo na primeira linha (1.25cm = 12.5mm).
 */
function renderJustifiedParagraph(
  doc: jsPDF,
  segments: TextSegment[],
  startX: number,
  startY: number,
  maxWidth: number,
  firstLineIndent: number,
  lineHeightMm: number,
  fontSizePt: number = 12
): number {
  doc.setFontSize(fontSizePt);
  doc.setTextColor(0, 0, 0);

  // Tokenize segments into words while preserving bold state and attaching punctuation properly
  const rawTokens: { word: string; bold: boolean }[] = [];

  for (const seg of segments) {
    if (!seg.text) continue;
    const isBold = Boolean(seg.bold);
    // Split by whitespace
    const parts = seg.text.split(/\s+/);
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      // If token starts with punctuation like "," or "." and previous segment had no trailing space, merge with previous word if possible
      const startsWithNoLeadingSpace = i === 0 && !/^\s/.test(seg.text);
      if (
        startsWithNoLeadingSpace &&
        rawTokens.length > 0 &&
        /^[,.;:!?)]+$/.test(part)
      ) {
        // Attach punctuation directly to the previous token
        rawTokens[rawTokens.length - 1].word += part;
      } else {
        rawTokens.push({ word: part, bold: isBold });
      }
    }
  }

  // Measure each word
  const tokens: WordToken[] = rawTokens.map((t) => {
    doc.setFont('times', t.bold ? 'bold' : 'normal');
    return {
      word: t.word,
      bold: t.bold,
      width: doc.getTextWidth(t.word),
    };
  });

  doc.setFont('times', 'normal');
  const minSpaceWidth = doc.getTextWidth(' ');

  // Break tokens into lines
  const lines: { words: WordToken[]; isLastLine: boolean; indent: number }[] = [];
  let currentLine: WordToken[] = [];
  let currentLineWidth = 0;
  let isFirstLine = true;

  for (const token of tokens) {
    const lineIndent = isFirstLine ? firstLineIndent : 0;
    const availableWidth = maxWidth - lineIndent;
    const spaceNeeded = currentLine.length > 0 ? minSpaceWidth : 0;

    if (currentLine.length > 0 && currentLineWidth + spaceNeeded + token.width > availableWidth) {
      lines.push({
        words: currentLine,
        isLastLine: false,
        indent: lineIndent,
      });
      currentLine = [token];
      currentLineWidth = token.width;
      isFirstLine = false;
    } else {
      currentLine.push(token);
      currentLineWidth += spaceNeeded + token.width;
    }
  }

  if (currentLine.length > 0) {
    lines.push({
      words: currentLine,
      isLastLine: true,
      indent: isFirstLine ? firstLineIndent : 0,
    });
  }

  // Draw each line
  let currentY = startY;
  for (const line of lines) {
    const lineAvailableWidth = maxWidth - line.indent;
    const totalWordsWidth = line.words.reduce((sum, w) => sum + w.width, 0);
    const gapsCount = line.words.length - 1;

    let spaceStep = minSpaceWidth;
    if (!line.isLastLine && gapsCount > 0) {
      const extraSpace = lineAvailableWidth - totalWordsWidth;
      // Avoid excessive stretching if a line has very few words
      const calculatedGap = extraSpace / gapsCount;
      if (calculatedGap <= minSpaceWidth * 3.5) {
        spaceStep = calculatedGap;
      }
    }

    let cursorX = startX + line.indent;
    for (let i = 0; i < line.words.length; i++) {
      const w = line.words[i];
      doc.setFont('times', w.bold ? 'bold' : 'normal');
      doc.text(w.word, cursorX, currentY);
      cursorX += w.width + (i < gapsCount ? spaceStep : 0);
    }

    currentY += lineHeightMm;
  }

  return currentY;
}

/**
 * Gera e descarrega diretamente um ficheiro PDF oficial de 1 única página A4
 * sem qualquer cabeçalho/rodapé do navegador (sem data/hora extra e sem moldura),
 * 100% em Times New Roman, títulos em 14pt e restantes textos em 12pt.
 */
export async function downloadDeclaracaoEfectividadePdf(
  record: CadastramentoEfectividadeRecord,
  genderOverride?: 'Senhor' | 'Senhora' | null
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const marginX = 20;
  const usableWidth = pageWidth - marginX * 2; // 170mm
  const centerX = pageWidth / 2; // 105mm

  const isFeminino = resolveIsFeminino(record.nome, record.tratamento, genderOverride);

  const artigoTratamento = isFeminino ? 'a Senhora' : 'o Senhor';
  const filhoFilha = isFeminino ? 'filha' : 'filho';
  const nascidoNascida = isFeminino ? 'nascida' : 'nascido';
  const portadorPortadora = isFeminino ? 'portadora' : 'portador';
  const funcionarioFuncionaria = isFeminino ? 'funcionária' : 'funcionário';
  const colocadoColocada = isFeminino ? 'colocada' : 'colocado';
  const enquadradoEnquadrada = isFeminino ? 'enquadrada' : 'enquadrado';
  const inscritoInscrita = isFeminino ? 'inscrita' : 'inscrito';
  const referidoFuncionario = isFeminino ? 'a referida funcionária' : 'o referido funcionário';
  const doDaFuncionario = isFeminino ? 'da funcionária' : 'do funcionário';
  const peloMesmoPelaMesma = isFeminino ? 'pela mesma' : 'pelo mesmo';
  const interessadoInteressada = isFeminino ? 'pela interessada' : 'pelo interessado';

  const prepProvincia = getPreposicaoProvincia(record.provNat);
  const prepEscola = getPreposicaoEscola(record.escola);

  const rawFuncao = (record.funcao || 'Docente').trim();
  const adaptedFuncao = adaptOccupationalTextToGender(rawFuncao, isFeminino);
  const funcaoTexto = rawFuncao.toLowerCase().includes('docente')
    ? 'função docente'
    : rawFuncao.toLowerCase().startsWith('funções')
    ? `função ${adaptedFuncao.replace(/^funções\s+/i, '').replace(/s\b/g, '')}`
    : rawFuncao.toLowerCase().startsWith('função')
    ? adaptedFuncao
    : `a função de ${adaptedFuncao}`;

  const adaptedCategoria = adaptOccupationalTextToGender(
    record.categoria || 'P.E.P.E.S.',
    isFeminino
  );

  const finalidadeFormatted = formatFinalidadeWithPreposition(record.finalidade, isFeminino);
  const dataEmissaoExtenso = formatAngolanDateExtenso(record.dataEmissao);
  const nascimentoExtenso = formatAngolanDateExtenso(record.nascimento);
  const biEmissaoExtenso = formatAngolanDateExtenso(record.biEmissao);
  const directorNome = record.director?.trim() || 'Belizio Miguel dos Santos António';

  let y = 17;

  // 1. Insígnia da República de Angola
  const emblemData = await loadEmblemPngDataUrl(emblemAngolaImg);
  if (emblemData) {
    const emblemHeight = 16.5;
    const emblemWidth = emblemHeight * emblemData.ratio;
    doc.addImage(
      emblemData.dataUrl,
      'PNG',
      centerX - emblemWidth / 2,
      y,
      emblemWidth,
      emblemHeight
    );
    y += emblemHeight + 5.5;
  } else {
    y += 10;
  }

  // 2. Cabeçalho Institucional (Times New Roman)
  // Título principal: REPÚBLICA DE ANGOLA (14pt Bold)
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('REPÚBLICA DE ANGOLA', centerX, y, { align: 'center' });
  y += 5.4;

  // Subtítulos institucionais (12pt Bold)
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  const govProv = `GOVERNO PROVINCIAL DE ${(record.governoProv || 'MALANJE').toUpperCase()}`;
  const admMun = `ADMINISTRAÇÃO MUNICIPAL DO ${(record.administracao || 'QUÊSSUA').toUpperCase()}`;
  const dirMun = `DIRECÇÃO MUNICIPAL DE ${(record.direccao || 'EDUCAÇÃO').toUpperCase()}`;

  doc.text(govProv, centerX, y, { align: 'center' });
  y += 5.0;
  doc.text(admMun, centerX, y, { align: 'center' });
  y += 5.0;
  doc.text(dirMun, centerX, y, { align: 'center' });
  y += 10.5;

  // 3. Título do Documento: DECLARAÇÃO DE EFECTIVIDADE (14pt Bold com sublinhado)
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  const mainTitle = 'DECLARAÇÃO DE EFECTIVIDADE';
  doc.text(mainTitle, centerX, y, { align: 'center' });
  const titleWidth = doc.getTextWidth(mainTitle);
  doc.setLineWidth(0.45);
  doc.setDrawColor(0, 0, 0);
  doc.line(centerX - titleWidth / 2, y + 1.2, centerX + titleWidth / 2, y + 1.2);
  y += 11.5;

  // 4. Corpo da Declaração (12pt Times New Roman, justificado, recuo 12.5mm)
  const firstLineIndent = 12.5;
  const lineHeightMm = 6.0;
  const paragraphGapMm = 4.2;

  const p1: TextSegment[] = [
    {
      text: `Para os devidos efeitos legais e administrativos, a Direcção Municipal da Educação do Quêssua declara, para os fins a que se destina, que ${artigoTratamento} `,
    },
    { text: record.nome, bold: true },
    { text: `, ${filhoFilha} de ` },
    { text: record.pai, bold: true },
    { text: ' e de ' },
    { text: record.mae, bold: true },
    { text: ', natural de ' },
    { text: record.naturalidade, bold: true },
    { text: `, Província ${prepProvincia} ` },
    { text: record.provNat, bold: true },
    { text: `, ${nascidoNascida} aos ` },
    { text: nascimentoExtenso, bold: true },
    { text: `, ${portadorPortadora} do Bilhete de Identidade n.º ` },
    { text: record.bi, bold: true },
    { text: ', emitido aos ' },
    { text: biEmissaoExtenso, bold: true },
    {
      text: `, é ${funcionarioFuncionaria} do Sector da Educação, exercendo ${funcaoTexto} no Município do ${record.municipio}, onde se encontra ${colocadoColocada} ${prepEscola} `,
    },
    { text: record.escola, bold: true },
    { text: `, ${enquadradoEnquadrada} na categoria de ` },
    { text: adaptedCategoria, bold: true },
    { text: ' do ' },
    { text: record.grau, bold: true },
    { text: `, ${inscritoInscrita} sob o número de agente ` },
    { text: `${record.agente}.`, bold: true },
  ];

  const p2: TextSegment[] = [
    {
      text: `Mais se declara que ${referidoFuncionario} se encontra no efectivo exercício da sua função e que a presente declaração é emitida para efeitos de comprovação da sua efectividade no Sector da Educação, destinando-se, especificamente, ${finalidadeFormatted.preposition} ${finalidadeFormatted.text}, para os fins administrativos e profissionais legalmente previstos.`,
    },
  ];

  const p3: TextSegment[] = [
    {
      text: `A presente declaração comprova os elementos de identificação e de enquadramento profissional ${doDaFuncionario} acima indicados, devendo ser utilizada exclusivamente ${peloMesmoPelaMesma} para a finalidade que motivou a sua emissão, sem prejuízo da apresentação de outros documentos exigidos pelas entidades competentes no âmbito do referido processo concursal.`,
    },
  ];

  const p4: TextSegment[] = [
    {
      text: `Por corresponder à verdade e por ter sido solicitada ${interessadoInteressada}, mandei passar a presente declaração, que vai por mim assinada e autenticada com o carimbo a óleo em uso nesta Direcção, para que produza os efeitos administrativos a que se destina.`,
    },
  ];

  y = renderJustifiedParagraph(doc, p1, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);
  y += paragraphGapMm;
  y = renderJustifiedParagraph(doc, p2, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);
  y += paragraphGapMm;
  y = renderJustifiedParagraph(doc, p3, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);
  y += paragraphGapMm;
  y = renderJustifiedParagraph(doc, p4, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);

  // 5. Data e Local (12pt Times New Roman, alinhado à direita)
  y += 8.5;
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  const dateLineText = `Direcção Municipal de Educação do Quêssua, Quêssua aos ${dataEmissaoExtenso}.`;
  doc.text(dateLineText, pageWidth - marginX, y, { align: 'right' });

  // 6. Bloco de Assinatura (12pt Times New Roman Bold, centrado)
  y += 14;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('O Director Municipal', centerX, y, { align: 'center' });

  y += 15;
  doc.setLineWidth(0.35);
  doc.line(centerX - 33, y, centerX + 33, y);

  y += 5.5;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(directorNome, centerX, y, { align: 'center' });

  // Nome limpo para guardar o ficheiro PDF
  const safeName = (record.nome || 'Funcionario')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  doc.save(`Declaracao_Efectividade_${safeName}.pdf`);
}

/**
 * Imprime o elemento #oficial-a4-sheet ou #official-modal-print-sheet num iframe
 * isolado de página única A4 (margin: 0mm no @page + padding interno 15mm 20mm),
 * removendo completamente cabeçalhos/rodapés do navegador (como data/hora e título)
 * e garantindo rigorosamente 1 única página A4 sem moldura.
 */
export function printSinglePageA4Clean(elementId: string = 'oficial-a4-sheet'): void {
  const targetEl = document.getElementById(elementId);
  if (!targetEl) {
    window.print();
    return;
  }

  const existingIframe = document.getElementById('sigre-isolated-a4-print-frame');
  if (existingIframe && existingIframe.parentNode) {
    existingIframe.parentNode.removeChild(existingIframe);
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'sigre-isolated-a4-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc || !iframe.contentWindow) {
    window.print();
    return;
  }

  const previousParentTitle = document.title;
  // Limpa o título do documento pai temporariamente para que o navegador não imprima texto no cabeçalho
  document.title = '';

  const sheetHtml = targetEl.outerHTML;

  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <title></title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0mm !important;
    }
    * {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: 'Times New Roman', Times, serif !important;
      color: #000000 !important;
    }
    html, body {
      width: 210mm !important;
      height: 296mm !important;
      max-height: 296mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      overflow: hidden !important;
      page-break-after: avoid !important;
      page-break-before: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    #${elementId} {
      width: 210mm !important;
      max-width: 210mm !important;
      height: 296mm !important;
      max-height: 296mm !important;
      padding: 15mm 20mm !important;
      margin: 0 auto !important;
      border: 0 !important;
      outline: 0 !important;
      box-shadow: none !important;
      background: #ffffff !important;
      overflow: hidden !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    .a4-emblem-img, img {
      width: 60px !important;
      height: auto !important;
      max-height: 60px !important;
      object-fit: contain !important;
      display: block !important;
      margin: 0 auto 6px auto !important;
    }
    .a4-header-block {
      text-align: center !important;
      margin-bottom: 10pt !important;
      padding-bottom: 0 !important;
      border: 0 !important;
    }
    .a4-header-block p.a4-republic-title,
    h2.doc-rep-title {
      font-size: 14pt !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.03em !important;
      line-height: 1.25 !important;
      margin: 0 0 2pt 0 !important;
      text-align: center !important;
    }
    .a4-header-block p.a4-inst-line,
    h3.doc-text-12,
    h4.doc-text-12 {
      font-size: 12pt !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.01em !important;
      line-height: 1.25 !important;
      margin: 1.5pt 0 !important;
      text-align: center !important;
    }
    .a4-title-wrap {
      padding-top: 12pt !important;
      padding-bottom: 4pt !important;
      text-align: center !important;
    }
    .a4-title-wrap h1,
    h1.doc-main-title {
      display: inline-block !important;
      font-size: 14pt !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.03em !important;
      line-height: 1.25 !important;
      border-bottom: 1.5px solid #000000 !important;
      padding-bottom: 2pt !important;
      margin: 0 !important;
    }
    .a4-body-copy,
    .doc-text-12 {
      margin-top: 10pt !important;
      font-size: 12pt !important;
      line-height: ${elementId === 'declaracao-servico-a4-sheet' ? '1.5' : '1.42'} !important;
      text-align: justify !important;
    }
    .a4-body-copy p,
    .doc-text-12 p {
      font-size: 12pt !important;
      line-height: ${elementId === 'declaracao-servico-a4-sheet' ? '1.5' : '1.42'} !important;
      text-align: justify !important;
      text-indent: 1.25cm !important;
      margin: 0 0 ${elementId === 'declaracao-servico-a4-sheet' ? '10pt' : '8pt'} 0 !important;
    }
    .a4-body-copy strong,
    .doc-text-12 strong {
      font-size: 12pt !important;
      font-weight: 700 !important;
    }
    .a4-footer-block {
      margin-top: 14pt !important;
      padding-top: 2pt !important;
      border: 0 !important;
    }
    .a4-date-line,
    .a4-date-line span {
      font-size: 12pt !important;
      line-height: 1.35 !important;
      text-align: right !important;
      margin-bottom: 20pt !important;
      display: block !important;
    }
    .a4-sig-container {
      text-align: center !important;
      width: 280px !important;
      margin: 0 auto !important;
    }
    .a4-sig-role {
      font-size: 12pt !important;
      font-weight: 700 !important;
      line-height: 1.3 !important;
      margin: 0 0 26pt 0 !important;
      text-align: center !important;
    }
    .a4-sig-line {
      border-bottom: 1px solid #000000 !important;
      width: 250px !important;
      margin: 0 auto !important;
    }
    .a4-sig-name {
      font-size: 12pt !important;
      font-weight: 700 !important;
      line-height: 1.3 !important;
      margin: 5pt 0 0 0 !important;
      text-align: center !important;
    }
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .text-justify { text-align: justify !important; }
    .font-bold { font-weight: 700 !important; }
    .uppercase { text-transform: uppercase !important; }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 6pt 0 !important;
    }
    th, td {
      border: 1px solid #000000 !important;
      padding: 3pt 5pt !important;
      font-size: 11pt !important;
    }
  </style>
</head>
<body>
  ${sheetHtml}
</body>
</html>`);
  iframeDoc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        document.title = previousParentTitle;
      }, 800);
    }
  };

  const imgs = iframeDoc.images;
  if (imgs.length === 0) {
    setTimeout(triggerPrint, 120);
  } else {
    let loaded = 0;
    const checkDone = () => {
      loaded++;
      if (loaded >= imgs.length) {
        setTimeout(triggerPrint, 120);
      }
    };
    for (let i = 0; i < imgs.length; i++) {
      if (imgs[i].complete) {
        checkDone();
      } else {
        imgs[i].onload = checkDone;
        imgs[i].onerror = checkDone;
      }
    }
  }
}

/**
 * Descarrega diretamente em PDF (1 única página A4, Times New Roman 14pt/12pt,
 * sem cabeçalhos do navegador e sem moldura) um pedido de Serviço Rápido.
 */
export async function downloadQuickServiceDocumentPdf(
  request: QuickServiceRequest,
  genderOverride?: 'M' | 'F' | null
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const marginX = 20;
  const usableWidth = pageWidth - marginX * 2;
  const centerX = pageWidth / 2;

  const details = request.details || {};
  const issueDate = new Date().toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const targetPersonName =
    request.serviceType === 'DECLARACAO_EFECTIVIDADE'
      ? details.employeeName || request.requesterName
      : details.studentName || request.requesterName;

  const isFeminino =
    genderOverride === 'F'
      ? true
      : genderOverride === 'M'
      ? false
      : isFemaleFirstName(targetPersonName);

  const artigoTratamento = isFeminino ? 'a Senhora' : 'o Senhor';
  const portadorPortadora = isFeminino ? 'portadora' : 'portador';
  const funcionarioFuncionaria = isFeminino ? 'funcionária' : 'funcionário';
  const colocadoColocada = isFeminino ? 'colocada' : 'colocado';
  const enquadradoEnquadrada = isFeminino ? 'enquadrada' : 'enquadrado';
  const inscritoInscrita = isFeminino ? 'inscrita' : 'inscrito';
  const interessadoInteressada = isFeminino ? 'pela interessada' : 'pelo interessado';
  const doDaFuncionario = isFeminino ? 'da funcionária' : 'do funcionário';
  const peloMesmoPelaMesma = isFeminino ? 'pela mesma' : 'pelo mesmo';

  const schoolOrDept =
    details.employeeSchoolOrDepartment || request.targetSchoolName || 'Rede Municipal do Quêssua';
  const prepEscola = getPreposicaoEscola(schoolOrDept);
  const adaptedCategory = adaptOccupationalTextToGender(
    details.employeeCategory || 'Docente',
    isFeminino
  );
  const finalidadeFormatted = formatFinalidadeWithPreposition(
    details.purpose || 'Fins Legais e Bancários',
    isFeminino
  );

  let y = 17;

  const emblemData = await loadEmblemPngDataUrl(emblemAngolaImg);
  if (emblemData) {
    const emblemHeight = 16.5;
    const emblemWidth = emblemHeight * emblemData.ratio;
    doc.addImage(
      emblemData.dataUrl,
      'PNG',
      centerX - emblemWidth / 2,
      y,
      emblemWidth,
      emblemHeight
    );
    y += emblemHeight + 5.5;
  } else {
    y += 10;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('REPÚBLICA DE ANGOLA', centerX, y, { align: 'center' });
  y += 5.4;

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('GOVERNO PROVINCIAL DE MALANJE', centerX, y, { align: 'center' });
  y += 5.0;
  doc.text('ADMINISTRAÇÃO MUNICIPAL DO QUÊSSUA', centerX, y, { align: 'center' });
  y += 5.0;
  doc.text('DIRECÇÃO MUNICIPAL DE EDUCAÇÃO', centerX, y, { align: 'center' });
  y += 10.5;

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  const docTitleText =
    request.serviceType === 'DECLARACAO_EFECTIVIDADE'
      ? 'DECLARAÇÃO DE EFECTIVIDADE'
      : request.serviceType === 'BOLETIM_NOTAS'
      ? 'BOLETIM OFICIAL DE APROVEITAMENTO ESCOLAR'
      : request.serviceType === 'DECLARACAO_MATRICULA'
      ? 'DECLARAÇÃO DE MATRÍCULA & FREQUÊNCIA'
      : 'GUIA OFICIAL DE TRANSFERÊNCIA ESCOLAR';

  doc.text(docTitleText, centerX, y, { align: 'center' });
  const titleWidth = doc.getTextWidth(docTitleText);
  doc.setLineWidth(0.45);
  doc.setDrawColor(0, 0, 0);
  doc.line(centerX - titleWidth / 2, y + 1.2, centerX + titleWidth / 2, y + 1.2);
  y += 6.5;

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(`N.º Registo Oficial: ${request.protocol}/DME-Q/2026`, centerX, y, { align: 'center' });
  y += 9.5;

  const firstLineIndent = 12.5;
  const lineHeightMm = 6.0;
  const paragraphGapMm = 4.2;

  const p1: TextSegment[] = [
    {
      text: `Para os devidos efeitos legais e administrativos, e por ter sido solicitada ${interessadoInteressada}, o Director Municipal da Educação do Município do Quêssua, Província de Malanje, `,
    },
    { text: 'DECLARA', bold: true },
    { text: ` que ${artigoTratamento} ` },
    { text: details.employeeName || request.requesterName, bold: true },
    { text: `, ${portadorPortadora} do Bilhete de Identidade n.º ` },
    { text: details.employeeBi || 'Conforme Registo', bold: true },
    { text: ` e ${inscritoInscrita} sob o número de agente público ` },
    { text: details.employeeAgente || 'REG-DME-2026', bold: true },
    { text: `, é ${funcionarioFuncionaria} do Sector da Educação, onde se encontra ${colocadoColocada} ${prepEscola} ` },
    { text: schoolOrDept, bold: true },
    { text: `, ${enquadradoEnquadrada} na categoria e função de ` },
    { text: `${adaptedCategory}.`, bold: true },
  ];

  const p2: TextSegment[] = [
    {
      text: 'Mais se declara que se encontra no pleno exercício da sua função nesta circunscrição municipal, mantendo ',
    },
    { text: 'EFECTIVIDADE PLENA', bold: true },
    { text: ' e assiduidade ininterrupta no período de referência de ' },
    { text: details.referenceMonthYear || 'Fevereiro / 2026', bold: true },
    {
      text: `, sem registo de faltas injustificadas nem quaisquer sanções disciplinares averbadas no processo individual ${doDaFuncionario}.`,
    },
  ];

  const p3: TextSegment[] = [
    {
      text: `A presente declaração é emitida em conformidade com o Estatuto da Carreira Docente da República de Angola, destinando-se especificamente ${finalidadeFormatted.preposition} `,
    },
    { text: finalidadeFormatted.text, bold: true },
    {
      text: `, devendo ser utilizada exclusivamente ${peloMesmoPelaMesma} para os fins legalmente previstos.`,
    },
  ];

  const p4: TextSegment[] = [
    {
      text: `Por corresponder à verdade e por ter sido solicitada ${interessadoInteressada}, mandei passar a presente declaração que vai por mim assinada e autenticada com o carimbo a óleo em uso nesta Direcção Municipal.`,
    },
  ];

  y = renderJustifiedParagraph(doc, p1, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);
  y += paragraphGapMm;
  y = renderJustifiedParagraph(doc, p2, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);
  y += paragraphGapMm;
  y = renderJustifiedParagraph(doc, p3, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);
  y += paragraphGapMm;
  y = renderJustifiedParagraph(doc, p4, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);

  y += 10;
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.text(`Direcção Municipal de Educação do Quêssua, Quêssua aos ${issueDate}.`, pageWidth - marginX, y, {
    align: 'right',
  });

  y += 14;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('O Director Municipal', centerX, y, { align: 'center' });

  y += 15;
  doc.setLineWidth(0.35);
  doc.line(centerX - 33, y, centerX + 33, y);

  y += 5.5;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('Belizio Miguel dos Santos António', centerX, y, { align: 'center' });

  const safeName = (targetPersonName || 'Requerente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  doc.save(`Declaracao_${safeName}.pdf`);
}

/**
 * Gera e descarrega a Declaração de Serviço (Módulo Independente • Conta Bancária e Salário)
 * em formato PDF nativo, garantido em 1 única página A4, 100% Times New Roman (14pt títulos / 12pt texto).
 */
export async function downloadDeclaracaoServicoPdf(
  record: DeclaracaoServicoRecord
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const marginX = 20;
  const usableWidth = pageWidth - marginX * 2;
  const centerX = pageWidth / 2;
  const firstLineIndent = 12.5;
  const lineHeightMm = 6.8;
  const paragraphGapMm = 5.2;

  const isFem = record.tratamento === 'Senhora';

  let y = 18;

  const emblemData = await loadEmblemPngDataUrl(emblemAngolaImg);
  if (emblemData) {
    const emblemHeight = 16.5;
    const emblemWidth = emblemHeight * emblemData.ratio;
    doc.addImage(
      emblemData.dataUrl,
      'PNG',
      centerX - emblemWidth / 2,
      y,
      emblemWidth,
      emblemHeight
    );
    y += emblemHeight + 5.5;
  } else {
    y += 10;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('REPÚBLICA DE ANGOLA', centerX, y, { align: 'center' });
  y += 5.4;

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  if (record.provEmissao) {
    doc.text(`GOVERNO PROVINCIAL DE ${record.provEmissao.toUpperCase()}`, centerX, y, { align: 'center' });
    y += 5.0;
  }
  if (record.municipioAdm) {
    doc.text(`ADMINISTRAÇÃO MUNICIPAL DE ${record.municipioAdm.toUpperCase()}`, centerX, y, { align: 'center' });
    y += 5.0;
  }
  if (record.direccao) {
    doc.text(record.direccao.toUpperCase(), centerX, y, { align: 'center' });
    y += 5.0;
  }
  y += 6.5;

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  const titleText = 'DECLARAÇÃO DE SERVIÇO';
  doc.text(titleText, centerX, y, { align: 'center' });
  const titleW = doc.getTextWidth(titleText);
  doc.setLineWidth(0.45);
  doc.line(centerX - titleW / 2, y + 1.2, centerX + titleW / 2, y + 1.2);

  y += 12;

  const filiacao =
    (isFem ? 'filha' : 'filho') +
    ' de ' +
    (record.pai && record.pai.trim() ? `${record.pai.trim()} e de ${record.mae}` : record.mae);

  const p1: TextSegment[] = [
    { text: `Para os devidos efeitos achados convenientes, declara-se que ${isFem ? 'a senhora ' : 'o senhor '}` },
    { text: record.nome, bold: true },
    { text: `, ${filiacao}, natural de ${record.naturalidade}, Província de ${record.provNat}, ${isFem ? 'nascida' : 'nascido'} aos ${fmtDateDeclaracaoServico(record.nascimento)}, ${isFem ? 'portadora' : 'portador'} do BI nº ` },
    { text: record.bi, bold: true },
    { text: `, emitido aos ${fmtDateDeclaracaoServico(record.biData)}, ${record.profissao} do ${record.grau}, ${isFem ? 'colocada' : 'colocado'} no Município de ${record.municipio}, local de trabalho: ` },
    { text: record.escola, bold: true },
    { text: `, com a categoria de ${record.categoria}, Agente nº ` },
    { text: record.agente, bold: true },
    { text: `, é cliente do ` },
    { text: record.bancoNome, bold: true },
    { text: `, titular da conta bancária nº ` },
    { text: record.conta, bold: true },
    { text: `, auferindo o salário líquido de ` },
    { text: `${fmtKz(record.salarioKz)} Kz (${record.extenso}).`, bold: true },
  ];

  const p2: TextSegment[] = [
    { text: 'Observação: ', bold: true },
    { text: `A presente declaração destina-se ${record.finalidade.replace(/\.$/, '')}.` },
  ];

  const p3: TextSegment[] = [
    {
      text: 'Por ser verdade e me ter sido pedido, mandei passar a presente declaração, que vai por mim assinada e autenticada com carimbo a óleo em uso nesta Direcção.',
    },
  ];

  y = renderJustifiedParagraph(doc, p1, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);
  y += paragraphGapMm;
  y = renderJustifiedParagraph(doc, p2, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);
  y += paragraphGapMm;
  y = renderJustifiedParagraph(doc, p3, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);

  y += 12;
  const localParts = [record.direccao, record.localEmissao].filter(Boolean).join(', ');
  const dateLine =
    (localParts ? `${localParts} ` : '') +
    (record.dataEmissao ? `aos ${fmtDateDeclaracaoServico(record.dataEmissao)}.` : '');

  if (dateLine) {
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(dateLine, centerX, y, { align: 'center' });
    y += 14;
  } else {
    y += 10;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('O Director Municipal', centerX, y, { align: 'center' });

  y += 15;
  doc.setLineWidth(0.35);
  doc.line(centerX - 35, y, centerX + 35, y);

  if (record.director) {
    y += 5.5;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(record.director, centerX, y, { align: 'center' });
  }

  const safeName = (record.nome || record.ref || 'Funcionario')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  doc.save(`Declaracao_Servico_${safeName}.pdf`);
}

/**
 * Gera e descarrega a Guia de Férias (Serviços SIGRE)
 * em formato PDF nativo, garantido em 1 única página A4, 100% Times New Roman (14pt títulos / 12pt texto).
 */
export async function downloadGuiaFeriasPdf(
  record: GuiaFeriasRecord
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const marginX = 20;
  const usableWidth = pageWidth - marginX * 2;
  const centerX = pageWidth / 2;
  const firstLineIndent = 12.5;
  const lineHeightMm = 6.8;
  const paragraphGapMm = 5.2;

  let y = 18;

  const emblemData = await loadEmblemPngDataUrl(emblemAngolaImg);
  if (emblemData) {
    const emblemHeight = 16.5;
    const emblemWidth = emblemHeight * emblemData.ratio;
    doc.addImage(
      emblemData.dataUrl,
      'PNG',
      centerX - emblemWidth / 2,
      y,
      emblemWidth,
      emblemHeight
    );
    y += emblemHeight + 5.5;
  } else {
    y += 10;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('REPÚBLICA DE ANGOLA', centerX, y, { align: 'center' });
  y += 5.4;

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  const prov = record.prov?.trim() || 'Malanje';
  const mun = record.mun?.trim() || 'Quêssua';
  doc.text(`GOVERNO PROVINCIAL DE ${prov.toUpperCase()}`, centerX, y, { align: 'center' });
  y += 5.0;
  doc.text(`ADMINISTRAÇÃO MUNICIPAL DO ${mun.toUpperCase()}`, centerX, y, { align: 'center' });
  y += 5.0;
  doc.text(`DIRECÇÃO MUNICIPAL DE EDUCAÇÃO DO ${mun.toUpperCase()}`, centerX, y, { align: 'center' });
  y += 11.5;

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  const ng = record.ng?.trim() || '____';
  const ang = record.ang?.trim() || '____';
  const titleText = `GUIA DE FÉRIAS Nº ${ng}/${ang}`;
  doc.text(titleText, centerX, y, { align: 'center' });
  const titleW = doc.getTextWidth(titleText);
  doc.setLineWidth(0.45);
  doc.line(centerX - titleW / 2, y + 1.2, centerX + titleW / 2, y + 1.2);

  y += 12;

  const escBase = [record.tipoesc?.trim(), record.nesc?.trim() ? `nº ${record.nesc.trim()}` : '']
    .filter(Boolean)
    .join(' ');
  const col = [escBase, record.local?.trim()].filter(Boolean).join(' – ') || '[Escola e Localidade]';

  const iniFmt = formatDateExtenso(record.ini) || '[Data de Início]';
  const fimFmt = formatDateExtenso(record.fim) || '[Data de Término]';
  const demiFmt = formatDateExtenso(record.demi) || '[Data de Emissão]';

  const p1: TextSegment[] = [
    {
      text: `Por esta Direcção Municipal de Educação do ${mun}, faz-se constar às autoridades a quem o conhecimento desta competir que segue viagem deste Município em gozo de `,
    },
    { text: record.tipolic || 'Licença Disciplinar (férias)', bold: true },
    { text: ' (' },
    { text: `${record.dias || 30} dias`, bold: true },
    { text: ') referente ao ano económico de ' },
    { text: record.ano || '2026', bold: true },
    { text: `, ${record.trat || 'o Senhor'} ` },
    { text: record.nome || '[Nome Completo]', bold: true },
    { text: `, ${record.cat || 'P.E.P.E.S.'} ${record.grau || '10º Grau'}, sob o agente nº ` },
    { text: record.agente || '[Nº de Agente]', bold: true },
    { text: ', com a função de ' },
    { text: record.funcao || '[Função]', bold: true },
    { text: ', colocado(a) na ' },
    { text: col, bold: true },
    { text: ', a partir do dia ' },
    { text: iniFmt, bold: true },
    { text: ' com término a ' },
    { text: `${fimFmt}.`, bold: true },
  ];

  const p2: TextSegment[] = [
    {
      text: 'Para que não lhe ponham impedimento, mandei passar a presente guia que vai por mim assinada e autenticada com o carimbo a óleo, em uso nesta Direcção.',
    },
  ];

  y = renderJustifiedParagraph(doc, p1, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);
  y += paragraphGapMm;
  y = renderJustifiedParagraph(doc, p2, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);

  y += 12;
  const lemi = record.lemi?.trim() || 'Quêssua';
  const dateLine = `A Direcção Municipal de Educação do ${mun}, ${lemi}, aos ${demiFmt}.`;

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(dateLine, centerX, y, { align: 'center' });
  y += 16;

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('O Director Municipal', centerX, y, { align: 'center' });

  y += 16;
  doc.setLineWidth(0.35);
  doc.line(centerX - 35, y, centerX + 35, y);

  if (record.dir) {
    y += 5.5;
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(record.dir, centerX, y, { align: 'center' });
  }

  const safeName = (record.nome || record.ng || 'Funcionario')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  doc.save(`Guia_Ferias_${safeName}.pdf`);
}



