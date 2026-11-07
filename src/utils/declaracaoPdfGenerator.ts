import { jsPDF } from 'jspdf';
import emblemAngolaImg from '../assets/images/Emblem_of_Angola.svg.webp';
import type { CadastramentoEfectividadeRecord } from './efectividadeStorage';
import type { DeclaracaoServicoRecord } from './declaracaoServicoStorage';
import { fmtDateDeclaracaoServico, fmtKz } from './declaracaoServicoStorage';
import type { GuiaFeriasRecord } from './guiaFeriasStorage';
import { formatDateExtenso } from './guiaFeriasStorage';
import type { GuiaColocacaoRecord } from './guiaColocacaoStorage';
import { formatColocacaoDateExtenso, formatCategoriaGrauColocacao } from './guiaColocacaoStorage';
import type { FichaAvaliacaoRecord } from './fichaAvaliacaoStorage';
import {
  INDICADORES_AVALIACAO,
  ANUAL_INDICADORES_ORDER,
  computeFichaAvaliacaoMetrics,
  formatAvaliacaoDateShort,
  splitAvaliacaoDateParts,
  formatAvaliacaoNumber,
} from './fichaAvaliacaoStorage';
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
  const directorNome =
    (record.director?.trim() || 'Belízio Miguel dos Santos António').replace(/Belizio/g, 'Belízio');

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
      margin: ${elementId === 'ficha-avaliacao-a4-sheet' ? '12mm 16mm' : '0mm'} !important;
    }
    * {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: ${
        elementId === 'ficha-avaliacao-a4-sheet'
          ? "'Century Gothic', CenturyGothic, AppleGothic, sans-serif"
          : "'Times New Roman', Times, serif"
      } !important;
      color: #000000 !important;
    }
    html, body {
      width: ${elementId === 'ficha-avaliacao-a4-sheet' ? '100%' : '210mm'} !important;
      height: ${elementId === 'ficha-avaliacao-a4-sheet' ? 'auto' : '296mm'} !important;
      max-height: ${elementId === 'ficha-avaliacao-a4-sheet' ? 'none' : '296mm'} !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      overflow: ${elementId === 'ficha-avaliacao-a4-sheet' ? 'visible' : 'hidden'} !important;
      ${
        elementId === 'ficha-avaliacao-a4-sheet'
          ? ''
          : `page-break-after: avoid !important;
      page-break-before: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;`
      }
    }
    #${elementId} {
      width: ${elementId === 'ficha-avaliacao-a4-sheet' ? '100%' : '210mm'} !important;
      max-width: ${elementId === 'ficha-avaliacao-a4-sheet' ? '100%' : '210mm'} !important;
      height: ${elementId === 'ficha-avaliacao-a4-sheet' ? 'auto' : '296mm'} !important;
      max-height: ${elementId === 'ficha-avaliacao-a4-sheet' ? 'none' : '296mm'} !important;
      padding: ${elementId === 'ficha-avaliacao-a4-sheet' ? '0' : '15mm 20mm'} !important;
      margin: 0 auto !important;
      border: 0 !important;
      outline: 0 !important;
      box-shadow: none !important;
      background: #ffffff !important;
      overflow: ${elementId === 'ficha-avaliacao-a4-sheet' ? 'visible' : 'hidden'} !important;
      ${
        elementId === 'ficha-avaliacao-a4-sheet'
          ? ''
          : `page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      break-after: avoid !important;`
      }
    }
    .a4-emblem-img, img {
      width: 60px !important;
      height: auto !important;
      max-height: 60px !important;
      object-fit: contain !important;
      display: block !important;
      margin: ${elementId === 'declaracao-servico-a4-sheet' ? '0 auto 14pt auto' : '0 auto 6px auto'} !important;
    }
    .a4-header-block {
      text-align: center !important;
      margin-bottom: ${elementId === 'declaracao-servico-a4-sheet' ? '26pt' : '10pt'} !important;
      padding-bottom: 0 !important;
      border: 0 !important;
    }
    .a4-header-block p.a4-republic-title,
    h2.doc-rep-title {
      font-size: 14pt !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.03em !important;
      line-height: ${elementId === 'declaracao-servico-a4-sheet' ? '1.35' : '1.25'} !important;
      margin: 0 0 ${elementId === 'declaracao-servico-a4-sheet' ? '6pt' : '2pt'} 0 !important;
      text-align: center !important;
    }
    .a4-header-block p.a4-inst-line,
    h3.doc-text-12,
    h4.doc-text-12 {
      font-size: 12pt !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.01em !important;
      line-height: ${elementId === 'declaracao-servico-a4-sheet' ? '1.35' : '1.25'} !important;
      margin: ${elementId === 'declaracao-servico-a4-sheet' ? '3.5pt' : '1.5pt'} 0 !important;
      text-align: center !important;
    }
    .a4-title-wrap {
      padding-top: ${elementId === 'declaracao-servico-a4-sheet' ? '14pt' : '12pt'} !important;
      padding-bottom: ${elementId === 'declaracao-servico-a4-sheet' ? '12pt' : '4pt'} !important;
      margin-bottom: ${elementId === 'declaracao-servico-a4-sheet' ? '20pt' : '0'} !important;
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
      margin-top: ${elementId === 'declaracao-servico-a4-sheet' ? '18pt' : '10pt'} !important;
      font-size: 12pt !important;
      line-height: ${
        elementId === 'oficial-a4-sheet' || elementId === 'official-modal-print-sheet'
          ? '1.42'
          : elementId === 'declaracao-servico-a4-sheet'
          ? '1.75'
          : '1.5'
      } !important;
      text-align: justify !important;
    }
    .a4-body-copy p,
    .doc-text-12 p {
      font-size: 12pt !important;
      line-height: ${
        elementId === 'oficial-a4-sheet' || elementId === 'official-modal-print-sheet'
          ? '1.42'
          : elementId === 'declaracao-servico-a4-sheet'
          ? '1.75'
          : '1.5'
      } !important;
      text-align: justify !important;
      text-indent: 1.25cm !important;
      margin: 0 0 ${
        elementId === 'oficial-a4-sheet' || elementId === 'official-modal-print-sheet'
          ? '8pt'
          : elementId === 'declaracao-servico-a4-sheet'
          ? '18pt'
          : '10pt'
      } 0 !important;
    }
    .a4-body-copy p.a4-equals-divider,
    .a4-body-copy p.a4-underscore-divider {
      text-indent: 0 !important;
      text-align: left !important;
      margin: 10pt 0 !important;
      overflow: hidden !important;
    }
    .a4-divider-line {
      display: block !important;
      width: 100% !important;
      overflow: hidden !important;
      white-space: nowrap !important;
      text-indent: 0 !important;
      line-height: 1.5 !important;
    }
    .a4-body-copy strong,
    .doc-text-12 strong {
      font-size: 12pt !important;
      font-weight: 700 !important;
    }
    .a4-footer-block {
      margin-top: ${elementId === 'declaracao-servico-a4-sheet' ? '38pt' : '14pt'} !important;
      padding-top: ${elementId === 'declaracao-servico-a4-sheet' ? '8pt' : '2pt'} !important;
      border: 0 !important;
    }
    .a4-date-line,
    .a4-date-line span {
      font-size: 12pt !important;
      line-height: 1.35 !important;
      text-align: ${elementId === 'oficial-a4-sheet' || elementId === 'official-modal-print-sheet' ? 'right' : 'center'} !important;
      margin-bottom: ${elementId === 'declaracao-servico-a4-sheet' ? '34pt' : '20pt'} !important;
      display: block !important;
    }
    .a4-sig-container {
      text-align: center !important;
      width: 280px !important;
      margin: 0 auto !important;
      position: relative !important;
    }
    .a4-sig-role {
      font-size: 12pt !important;
      font-weight: 700 !important;
      line-height: 1.3 !important;
      margin: 0 0 ${elementId === 'oficial-a4-sheet' ? '2pt' : elementId === 'declaracao-servico-a4-sheet' ? '34pt' : '26pt'} 0 !important;
      text-align: center !important;
    }
    .a4-sig-img-wrap {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 72px !important;
      margin: -12px auto -18px auto !important;
      position: relative !important;
      z-index: 2 !important;
    }
    .a4-sig-img {
      height: 80px !important;
      max-height: 80px !important;
      width: auto !important;
      max-width: 260px !important;
      object-fit: contain !important;
      filter: brightness(0) !important;
      -webkit-filter: brightness(0) !important;
      display: block !important;
      margin: 0 auto !important;
    }
    .a4-sig-line {
      border-bottom: 1px solid #000000 !important;
      width: 250px !important;
      margin: 0 auto !important;
      position: relative !important;
      z-index: 1 !important;
    }
    .a4-sig-name {
      font-size: 12pt !important;
      font-weight: 700 !important;
      line-height: 1.3 !important;
      margin: 5pt 0 0 0 !important;
      text-align: center !important;
    }
    .text-left { text-align: left !important; }
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .text-justify { text-align: justify !important; }
    .font-bold { font-weight: 700 !important; }
    .font-normal { font-weight: 400 !important; }
    .uppercase { text-transform: uppercase !important; }
    .mx-auto { margin-left: auto !important; margin-right: auto !important; }
    .w-full { width: 100% !important; }
    .w-80 { width: 320px !important; }
    .border-b { border-bottom: 1px solid #000000 !important; }
    .border { border: 1px solid #000000 !important; }
    .flex { display: flex !important; }
    .inline-flex { display: inline-flex !important; }
    .inline-block { display: inline-block !important; }
    .flex-col { flex-direction: column !important; }
    .flex-wrap { flex-wrap: wrap !important; }
    .flex-1 { flex: 1 1 0% !important; }
    .items-center { align-items: center !important; }
    .items-baseline { align-items: baseline !important; }
    .justify-center { justify-content: center !important; }
    .shrink-0 { flex-shrink: 0 !important; }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: ${elementId === 'ficha-avaliacao-a4-sheet' ? '2pt 0 5pt 0' : '6pt 0'} !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    th, td {
      border: 1px solid #000000 !important;
      padding: ${elementId === 'ficha-avaliacao-a4-sheet' ? '4pt 6pt' : '3pt 5pt'} !important;
      font-size: ${elementId === 'ficha-avaliacao-a4-sheet' ? '8pt' : '11pt'} !important;
      font-weight: ${elementId === 'ficha-avaliacao-a4-sheet' ? '400' : 'inherit'} !important;
      vertical-align: middle !important;
    }
    #ficha-avaliacao-a4-sheet p,
    #ficha-avaliacao-a4-sheet span,
    #ficha-avaliacao-a4-sheet td,
    #ficha-avaliacao-a4-sheet div {
      font-size: 8pt !important;
      font-weight: 400 !important;
    }
    #ficha-avaliacao-a4-sheet h1,
    #ficha-avaliacao-a4-sheet th,
    #ficha-avaliacao-a4-sheet .ficha-title-10,
    #ficha-avaliacao-a4-sheet .font-bold,
    #ficha-avaliacao-a4-sheet p.font-bold,
    #ficha-avaliacao-a4-sheet th.font-bold,
    #ficha-avaliacao-a4-sheet td.font-bold,
    #ficha-avaliacao-a4-sheet span.font-bold {
      font-weight: 700 !important;
      font-size: 10pt !important;
    }
    #ficha-avaliacao-a4-sheet .a4-eval-section {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin-bottom: 8pt !important;
    }
    #ficha-avaliacao-a4-sheet .a4-page-break-after {
      page-break-after: always !important;
      break-after: page !important;
    }
    #ficha-avaliacao-a4-sheet .ficha-comment-line {
      height: 19px !important;
      border-bottom: 1px solid #000000 !important;
      width: 100% !important;
      display: block !important;
    }
    #ficha-avaliacao-a4-sheet .ficha-sig-line {
      width: 250px !important;
      border-bottom: 1px solid #000000 !important;
      margin: 0 auto !important;
      height: 1px !important;
      display: block !important;
    }
    #ficha-avaliacao-a4-sheet img,
    #ficha-avaliacao-a4-sheet .ficha-emblem-img {
      width: 80px !important;
      height: 80px !important;
      max-height: 80px !important;
      object-fit: contain !important;
      display: block !important;
      margin: 0 auto 6pt auto !important;
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
  const { extractStudentGradesFromPautas, verifyStudentEnrollmentInSchool } = await import(
    './quickServicesStorage'
  );
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

  const artigoAluno = isFeminino ? 'a aluna' : 'o aluno';
  const identificadoIdentificada = isFeminino ? 'identificada' : 'identificado';
  const matriculadoMatriculada = isFeminino ? 'matriculada' : 'matriculado';
  const aoAEstudante = isFeminino ? 'à estudante' : 'ao estudante';
  const doDaAluno = isFeminino ? 'da aluna' : 'do aluno';

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

  const enrollmentCheck = verifyStudentEnrollmentInSchool({
    schoolName: request.targetSchoolName,
    studentName: details.studentName || request.requesterName,
    studentBiOrProcesso: details.studentBiOrProcesso,
    studentClasse: details.enrolledClasse || details.studentClasse,
    studentTurma: details.enrolledTurma || details.studentTurma,
  });

  const resolvedClasse =
    details.enrolledClasse || enrollmentCheck.classe || details.studentClasse || '7ª Classe';
  const resolvedTurma =
    details.enrolledTurma || enrollmentCheck.turma || details.studentTurma || 'Turma A';
  const resolvedPeriodo =
    details.enrolledTurno || enrollmentCheck.turno || details.studentPeriodo || 'Manhã';
  const resolvedSala = details.enrolledSala || enrollmentCheck.sala || 'Sala 01';
  const resolvedProcesso =
    details.enrolledCodigoMatricula ||
    enrollmentCheck.codigoMatricula ||
    details.studentBiOrProcesso ||
    'Confirmado';

  if (request.serviceType === 'DECLARACAO_EFECTIVIDADE') {
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
  } else if (request.serviceType === 'BOLETIM_NOTAS') {
    const liveGrades = extractStudentGradesFromPautas({
      schoolName: request.targetSchoolName,
      studentName: details.studentName || request.requesterName,
      studentBiOrProcesso: details.studentBiOrProcesso,
      classe: resolvedClasse,
      turma: resolvedTurma,
      trimestre: details.trimestre || '1º Trimestre',
    });
    const gradeRows =
      details.gradesSnapshot && details.gradesSnapshot.length > 0
        ? details.gradesSnapshot
        : liveGrades.gradesSnapshot;
    const overallAvg = details.overallAverage || liveGrades.overallAverage;
    const academicStatusLabel = details.academicStatus || liveGrades.academicStatus;
    const isFinalBoletim =
      (details.trimestre || '').toLowerCase().includes('final') ||
      (details.trimestre || '').toLowerCase().includes('anual');

    const intro: TextSegment[] = [
      {
        text: `A Direcção ${getPreposicaoEscola(request.targetSchoolName) === 'na' ? 'da' : 'do'} `,
      },
      { text: request.targetSchoolName || 'Complexo Escolar do Quêssua', bold: true },
      {
        text: ` certifica que ${artigoAluno} `,
      },
      { text: details.studentName || request.requesterName, bold: true },
      {
        text: `, com o N.º de Matrícula / BI `,
      },
      { text: resolvedProcesso, bold: true },
      {
        text: `, da `,
      },
      { text: `${resolvedClasse} (${resolvedTurma} • ${resolvedPeriodo})`, bold: true },
      {
        text: `, obteve o seguinte rendimento pedagógico extraído das Mini-Pautas e Pautas Oficiais referente ao `,
      },
      { text: `${details.trimestre || '1º Trimestre'} (${details.academicYear || '2025/2026'}):`, bold: true },
    ];
    y = renderJustifiedParagraph(doc, intro, marginX, y, usableWidth, 0, lineHeightMm, 11.5);
    y += 3;

    // Draw grades table
    const colWidths = [86, 20, 20, 20, 24];
    const rowH = 6.2;
    const headers = isFinalBoletim
      ? ['Disciplina Curricular', 'MT1', 'MT2', 'MT3', 'MFD']
      : ['Disciplina Curricular', 'MAC', 'NPP', 'NPT', 'Média (MT)'];

    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    let cx = marginX;
    for (let i = 0; i < headers.length; i++) {
      doc.rect(cx, y, colWidths[i], rowH);
      doc.text(headers[i], i === 0 ? cx + 2 : cx + colWidths[i] / 2, y + 4.3, {
        align: i === 0 ? 'left' : 'center',
      });
      cx += colWidths[i];
    }
    y += rowH;

    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    for (const row of gradeRows) {
      cx = marginX;
      const vals = isFinalBoletim
        ? [
            row.subject,
            String(row.mt1 ?? row.mac),
            String(row.mt2 ?? row.npp),
            String(row.mt3 ?? row.npt),
            String(row.mfd ?? row.mt),
          ]
        : [
            row.subject,
            String(row.mac),
            String(row.npp),
            String(row.npt),
            String(row.mt),
          ];
      for (let i = 0; i < vals.length; i++) {
        doc.rect(cx, y, colWidths[i], rowH);
        doc.setFont('times', i === 0 || i === 4 ? 'bold' : 'normal');
        doc.text(vals[i], i === 0 ? cx + 2 : cx + colWidths[i] / 2, y + 4.3, {
          align: i === 0 ? 'left' : 'center',
        });
        cx += colWidths[i];
      }
      y += rowH;
    }

    // Footer row
    doc.setFont('times', 'bold');
    doc.rect(marginX, y, colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], rowH);
    doc.text('MÉDIA GERAL APURADA NAS PAUTAS', marginX + 2, y + 4.3);
    doc.rect(marginX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, colWidths[4], rowH);
    doc.text(
      String(overallAvg),
      marginX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] / 2,
      y + 4.3,
      { align: 'center' }
    );
    y += rowH + 4;

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text(`Situação Académica: ${academicStatusLabel}`, marginX, y);
    y += 4;
  } else if (request.serviceType === 'DECLARACAO_MATRICULA') {
    const p1: TextSegment[] = [
      {
        text: `Para os devidos efeitos legais e por ter sido solicitada ${interessadoInteressada}, a Direcção ${getPreposicaoEscola(request.targetSchoolName) === 'na' ? 'da' : 'do'} `,
      },
      { text: request.targetSchoolName || 'Complexo Escolar do Quêssua', bold: true },
      {
        text: ` faz constar, após conferência nos registos oficiais de matrícula e nas listas de turmas, e `,
      },
      { text: 'DECLARA', bold: true },
      { text: ` que ${artigoAluno} ` },
      { text: details.studentName || request.requesterName, bold: true },
      { text: `, com o N.º de Matrícula / BI ` },
      { text: resolvedProcesso, bold: true },
      {
        text: `, encontra-se devidamente ${matriculadoMatriculada} e a frequentar regularmente as aulas curriculares normais na `,
      },
      { text: `${resolvedClasse} (${resolvedTurma} • ${resolvedSala} • Período da ${resolvedPeriodo})`, bold: true },
      { text: ` durante o Ano Lectivo de ` },
      { text: `${details.academicYear || '2025/2026'}.`, bold: true },
    ];

    const p2: TextSegment[] = [
      {
        text: `A presente declaração destina-se ${finalidadeFormatted.preposition} `,
      },
      { text: `${finalidadeFormatted.text}.`, bold: true },
    ];

    y = renderJustifiedParagraph(doc, p1, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);
    y += paragraphGapMm;
    y = renderJustifiedParagraph(doc, p2, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);
  } else {
    // GUIA_TRANSFERENCIA
    const destSchool =
      request.destinationSchoolName ||
      details.destinationSchool ||
      details.purpose ||
      'Instituição Indicada';
    const p1: TextSegment[] = [
      {
        text: `A Direcção ${getPreposicaoEscola(request.targetSchoolName) === 'na' ? 'da' : 'do'} `,
      },
      { text: request.targetSchoolName || 'Complexo Escolar do Quêssua', bold: true },
      { text: ` concede por este meio a presente ` },
      { text: 'GUIA OFICIAL DE TRANSFERÊNCIA ESCOLAR', bold: true },
      { text: ` ${aoAEstudante} ` },
      { text: details.studentName || request.requesterName, bold: true },
      { text: `, com o N.º de Matrícula / BI ` },
      { text: resolvedProcesso, bold: true },
      { text: `, proveniente da ` },
      { text: `${resolvedClasse} (${resolvedTurma} • ${resolvedPeriodo})`, bold: true },
      { text: `, para transferência com destino a ` },
      { text: `${destSchool}.`, bold: true },
    ];

    const p2: TextSegment[] = details.reservedTurma
      ? [
          {
            text: `Consta confirmada e reservada a vaga na escola receptora na `,
          },
          {
            text: `${details.reservedTurma} (${details.reservedTurno || 'Manhã'}${details.reservedSala ? ` • ${details.reservedSala}` : ''})`,
            bold: true,
          },
          {
            text: details.vacancyRespondedBy
              ? `, devidamente validada por ${details.vacancyRespondedBy}.`
              : '.',
          },
        ]
      : [
          {
            text: `Mais se declara que o vínculo de matrícula na escola de origem e a consulta de vaga foram devidamente verificados.`,
          },
        ];

    const p3: TextSegment[] = [
      {
        text: `O processo individual ${doDaAluno} encontra-se regularizado e sem quaisquer impedimentos legais ou disciplinares, podendo a escola de destino proceder ao enquadramento definitivo.`,
      },
    ];

    y = renderJustifiedParagraph(doc, p1, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);
    y += paragraphGapMm;
    y = renderJustifiedParagraph(doc, p2, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);
    y += paragraphGapMm;
    y = renderJustifiedParagraph(doc, p3, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);
  }

  y += 10;
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.text(`Direcção Municipal de Educação do Quêssua, Quêssua aos ${issueDate}.`, pageWidth - marginX, y, {
    align: 'right',
  });

  y += 14;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(
    request.serviceType === 'DECLARACAO_EFECTIVIDADE' ? 'O Director Municipal' : 'A Direcção Escolar / O Director',
    centerX,
    y,
    { align: 'center' }
  );

  y += 15;
  doc.setLineWidth(0.35);
  doc.line(centerX - 33, y, centerX + 33, y);

  y += 5.5;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(
    request.serviceType === 'DECLARACAO_EFECTIVIDADE'
      ? 'Belízio Miguel dos Santos António'
      : details.resolvedBy || request.targetSchoolName || 'Direcção Escolar Oficial',
    centerX,
    y,
    { align: 'center' }
  );

  const safeName = (targetPersonName || 'Requerente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  doc.save(`Documento_Oficial_${safeName}.pdf`);
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
  const lineHeightMm = 7.4;
  const paragraphGapMm = 7.5;

  const isFem = record.tratamento === 'Senhora';

  let y = 20;

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
    y += emblemHeight + 8.5;
  } else {
    y += 12;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('REPÚBLICA DE ANGOLA', centerX, y, { align: 'center' });
  y += 6.5;

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  if (record.provEmissao) {
    doc.text(`GOVERNO PROVINCIAL DE ${record.provEmissao.toUpperCase()}`, centerX, y, { align: 'center' });
    y += 5.8;
  }
  if (record.municipioAdm) {
    doc.text(`ADMINISTRAÇÃO MUNICIPAL DE ${record.municipioAdm.toUpperCase()}`, centerX, y, { align: 'center' });
    y += 5.8;
  }
  if (record.direccao) {
    doc.text(record.direccao.toUpperCase(), centerX, y, { align: 'center' });
    y += 5.8;
  }
  y += 12;

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  const titleText = 'DECLARAÇÃO DE SERVIÇO';
  doc.text(titleText, centerX, y, { align: 'center' });
  const titleW = doc.getTextWidth(titleText);
  doc.setLineWidth(0.45);
  doc.line(centerX - titleW / 2, y + 1.2, centerX + titleW / 2, y + 1.2);

  y += 16;

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

  y += 18;
  const localParts = [record.direccao, record.localEmissao].filter(Boolean).join(', ');
  const dateLine =
    (localParts ? `${localParts} ` : '') +
    (record.dataEmissao ? `aos ${fmtDateDeclaracaoServico(record.dataEmissao)}.` : '');

  if (dateLine) {
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(dateLine, centerX, y, { align: 'center' });
    y += 18;
  } else {
    y += 14;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('O Director Municipal', centerX, y, { align: 'center' });

  y += 18;
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
  y += 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  let underLine = '_';
  while (doc.getTextWidth(underLine + '_') <= usableWidth) {
    underLine += '_';
  }
  for (let i = 0; i < 7; i++) {
    doc.text(underLine, marginX, y);
    y += lineHeightMm;
  }
  y += 3.2;
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

/**
 * Gera e descarrega a Guia de Colocação (Serviços SIGRE)
 * em formato PDF nativo, garantido em 1 única página A4, 100% Times New Roman (14pt títulos / 12pt texto).
 */
export async function downloadGuiaColocacaoPdf(
  record: GuiaColocacaoRecord
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
  const prepMun = mun.toLowerCase().includes('quêssua') || mun.toLowerCase().includes('quessua') ? 'DO' : 'DE';
  doc.text(`GOVERNO PROVINCIAL DE ${prov.toUpperCase()}`, centerX, y, { align: 'center' });
  y += 5.0;
  doc.text(`ADMINISTRAÇÃO MUNICIPAL ${prepMun} ${mun.toUpperCase()}`, centerX, y, { align: 'center' });
  y += 5.0;
  doc.text(`DIRECÇÃO MUNICIPAL DE EDUCAÇÃO ${prepMun} ${mun.toUpperCase()}`, centerX, y, { align: 'center' });
  y += 11.5;

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  const num = record.num?.trim() || '_______';
  const ano = record.ano?.trim() || '____';
  const titleText = `GUIA DE COLOCAÇÃO Nº ${num}/${ano}`;
  doc.text(titleText, centerX, y, { align: 'center' });
  const titleW = doc.getTextWidth(titleText);
  doc.setLineWidth(0.45);
  doc.line(centerX - titleW / 2, y + 1.2, centerX + titleW / 2, y + 1.2);

  y += 12;

  const isFem = record.trat === 'F';
  const tratLabel = isFem ? 'a senhora professora' : 'o senhor professor';
  const catGrau = formatCategoriaGrauColocacao(record.cat, record.grau) || '[categoria e grau]';
  const dataExt = formatColocacaoDateExtenso(record.data) || '[data]';

  const p1: TextSegment[] = [
    {
      text: 'Por esta Direcção, se faz constar às autoridades a quem o conhecimento desta competir que, segue viagem desta Direcção para ',
    },
    { text: record.escola?.trim() || '[escola de destino]', bold: true },
    { text: `, ${tratLabel} ` },
    { text: record.nome?.trim() || '[nome completo]', bold: true },
    { text: ', com a categoria de ' },
    { text: catGrau, bold: true },
    { text: ', titular de agente nº ' },
    { text: record.agente?.trim() || '[nº de agente]', bold: true },
    { text: ', para reiniciar as suas funções de professor.' },
  ];

  const p2: TextSegment[] = [
    {
      text: 'Para que não lhe ponham impedimento, mandei passar a presente guia que vai por mim assinada e autenticada com o carimbo a óleo, em uso nesta Direcção.',
    },
  ];

  y = renderJustifiedParagraph(doc, p1, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);
  y += 2;
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  let eqLine = '=';
  while (doc.getTextWidth(eqLine + '=') <= usableWidth) {
    eqLine += '=';
  }
  for (let i = 0; i < 5; i++) {
    doc.text(eqLine, marginX, y);
    y += lineHeightMm;
  }
  y += 3.2;
  y = renderJustifiedParagraph(doc, p2, marginX, y, usableWidth, firstLineIndent, lineHeightMm, 12);

  y += 12;
  const localEmi = record.local?.trim() || mun;
  const prepDateMun = mun.toLowerCase().includes('quêssua') || mun.toLowerCase().includes('quessua') ? 'do' : 'de';
  const dateLine = `Direcção Municipal de Educação ${prepDateMun} ${mun}, ${localEmi} aos ${dataExt}.`;

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

  const safeName = (record.nome || record.num || 'Professor')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  doc.save(`Guia_Colocacao_${safeName}.pdf`);
}

/**
 * Gera e descarrega a Ficha de Avaliação de Desempenho Docente (Anexo III — Diário da República)
 * em formato PDF nativo, estruturada rigorosamente em 3 páginas A4 bem enquadradas.
 */
export async function downloadFichaAvaliacaoPdf(
  record: FichaAvaliacaoRecord
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const marginTop = 14;
  const usableWidth = pageWidth - marginX * 2; // 178mm
  const centerX = pageWidth / 2;

  const metrics = computeFichaAvaliacaoMetrics(record.notas);

  let y = marginTop;

  // =========================================================================
  // PÁGINA 1: Cabeçalho + Identificação + Período + Indicadores Trimestrais + Nota (1 a 6)
  // =========================================================================
  const emblemData = await loadEmblemPngDataUrl(emblemAngolaImg);
  if (emblemData) {
    const emblemHeight = 22;
    const emblemWidth = emblemHeight * emblemData.ratio;
    doc.addImage(
      emblemData.dataUrl,
      'PNG',
      centerX - emblemWidth / 2,
      y,
      emblemWidth,
      emblemHeight
    );
    y += emblemHeight + 5;
  } else {
    y += 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('REPÚBLICA DE ANGOLA', centerX, y, { align: 'center' });
  y += 4.5;
  doc.text('GOVERNO PROVINCIAL DE MALANJE', centerX, y, { align: 'center' });
  y += 4.5;
  doc.text('ADMINISTRAÇÃO MUNICIPAL DO QUÊSSUA', centerX, y, { align: 'center' });
  y += 4.5;
  doc.text('DIRECÇÃO MUNICIPAL DE EDUCAÇÃO', centerX, y, { align: 'center' });
  y += 6;

  doc.setFontSize(10);
  doc.text(
    'FICHA DE AVALIAÇÃO DE DESEMPENHO ANUAL DO EDUCADOR DE INFÂNCIA',
    centerX,
    y,
    { align: 'center' }
  );
  y += 4.5;
  doc.text('E DO PROFESSOR DO ENSINO PRIMÁRIO E SECUNDÁRIO', centerX, y, { align: 'center' });
  y += 6.5;

  const drawLabeledLine = (
    label: string,
    val: string,
    startX: number,
    curY: number,
    totalW: number
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(label, startX, curY);
    const lw = doc.getTextWidth(label) + 2.5;
    const lineStart = startX + lw;
    const lineEnd = startX + totalW;
    if (val) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(val, lineStart + 2, curY - 0.5);
    }
    doc.setLineWidth(0.3);
    doc.line(lineStart, curY + 1.1, lineEnd, curY + 1.1);
  };

  const drawSlashDateLine = (
    prefixLabel: string,
    isoDate: string | undefined,
    startX: number,
    curY: number,
    segW: number = 18,
    centered: boolean = false,
    boldLabel: boolean = false
  ) => {
    const [d, m, a] = splitAvaliacaoDateParts(isoDate);
    doc.setFont('helvetica', boldLabel ? 'bold' : 'normal');
    doc.setFontSize(boldLabel ? 10 : 8);
    const labelW = prefixLabel ? doc.getTextWidth(prefixLabel) + 2.5 : 0;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const slashW = doc.getTextWidth(' / ');
    const yearW = segW + 4;
    const totalW = labelW + segW + slashW * 2 + segW + yearW;
    let x = centered ? centerX - totalW / 2 : startX;

    if (prefixLabel) {
      doc.setFont('helvetica', boldLabel ? 'bold' : 'normal');
      doc.setFontSize(boldLabel ? 10 : 8);
      doc.text(prefixLabel, x, curY);
      x += labelW;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setLineWidth(0.3);
    if (d) doc.text(d, x + segW / 2, curY - 0.5, { align: 'center' });
    doc.line(x, curY + 1.1, x + segW, curY + 1.1);
    x += segW;
    doc.text(' / ', x, curY);
    x += slashW;

    if (m) doc.text(m, x + segW / 2, curY - 0.5, { align: 'center' });
    doc.line(x, curY + 1.1, x + segW, curY + 1.1);
    x += segW;
    doc.text(' / ', x, curY);
    x += slashW;

    if (a) doc.text(a, x + yearW / 2, curY - 0.5, { align: 'center' });
    doc.line(x, curY + 1.1, x + yearW, curY + 1.1);
    return x + yearW;
  };

  // Identificação: a), b), c) e Dados do Avaliado (em Tabela)
  const idRowH = 6.8;
  const idRows: Array<{ label: string; value: string }> = [
    { label: 'a)', value: record.provincia || '' },
    { label: 'b)', value: record.municipio || '' },
    { label: 'c)', value: record.escola || '' },
    { label: 'Nome Completo:', value: record.nome || '' },
    { label: 'Categoria:', value: record.categoria || '' },
    { label: 'Agente nº:', value: record.agente || '' },
  ];
  doc.setLineWidth(0.3);
  for (const row of idRows) {
    doc.rect(marginX, y, usableWidth, idRowH);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(row.label, marginX + 3, y + 4.6);
    const lw = doc.getTextWidth(row.label) + 2.5;
    if (row.value) {
      doc.text(row.value, marginX + 3 + lw, y + 4.6);
    }
    y += idRowH;
  }
  const dateRowH = 7.4;
  doc.rect(marginX, y, usableWidth, dateRowH);
  drawSlashDateLine('Data de Avaliação:', record.dataAval, marginX + 3, y + 5.0, 18, false, false);
  y += dateRowH + 5;

  // Período a que respeita avaliação (em Tabela)
  const perHeaderH = 7.0;
  const perBodyH = 7.6;
  doc.setLineWidth(0.3);
  doc.rect(marginX, y, usableWidth, perHeaderH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Período a que respeita avaliação', centerX, y + 4.9, { align: 'center' });
  y += perHeaderH;

  doc.rect(marginX, y, usableWidth, perBodyH);
  const afterDeX = drawSlashDateLine('De', record.de, marginX + 28, y + 5.1, 16, false, false);
  drawSlashDateLine(' :a', record.ate, afterDeX + 4, y + 5.1, 16, false, false);
  y += perBodyH + 6;

  // Classificação dos Indicadores Anual Trimestral
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Classificação dos Indicadores Anual Trimestral', marginX, y);
  y += 3.0;

  const colW3 = [12, 86, 20, 20, 20, 20]; // sum = 178
  const rowH3 = 6.8;
  const headers3 = ['Nº', 'Indicadores', 'Iº Trim', 'IIº Trim', 'IIIº Trim', 'Média'];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  let cx = marginX;
  for (let i = 0; i < headers3.length; i++) {
    doc.rect(cx, y, colW3[i], rowH3);
    doc.text(headers3[i], i === 1 ? cx + 2.5 : cx + colW3[i] / 2, y + 4.7, {
      align: i === 1 ? 'left' : 'center',
    });
    cx += colW3[i];
  }
  y += rowH3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (let r = 0; r < INDICADORES_AVALIACAO.length; r++) {
    cx = marginX;
    const rowVals = [
      String(r + 1),
      INDICADORES_AVALIACAO[r],
      formatAvaliacaoNumber(record.notas?.[r]?.[0]),
      formatAvaliacaoNumber(record.notas?.[r]?.[1]),
      formatAvaliacaoNumber(record.notas?.[r]?.[2]),
      formatAvaliacaoNumber(metrics.mediasIndicadores[r]),
    ];
    for (let c = 0; c < rowVals.length; c++) {
      doc.rect(cx, y, colW3[c], rowH3);
      doc.text(rowVals[c], c === 1 ? cx + 2.5 : cx + colW3[c] / 2, y + 4.6, {
        align: c === 1 ? 'left' : 'center',
      });
      cx += colW3[c];
    }
    y += rowH3;
  }

  // Classificação Quantitativa row
  cx = marginX;
  doc.rect(cx, y, colW3[0], rowH3);
  cx += colW3[0];
  doc.rect(cx, y, colW3[1], rowH3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Classificação Quantitativa', cx + 2.5, y + 4.7);
  cx += colW3[1];
  const quantVals = [
    formatAvaliacaoNumber(metrics.quantTrim[0]),
    formatAvaliacaoNumber(metrics.quantTrim[1]),
    formatAvaliacaoNumber(metrics.quantTrim[2]),
    formatAvaliacaoNumber(metrics.quantMedia),
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (let c = 0; c < 4; c++) {
    doc.rect(cx, y, colW3[c + 2], rowH3);
    doc.text(quantVals[c], cx + colW3[c + 2] / 2, y + 4.6, { align: 'center' });
    cx += colW3[c + 2];
  }
  y += rowH3;

  // Classificação Qualitativa row
  cx = marginX;
  doc.rect(cx, y, colW3[0], rowH3);
  cx += colW3[0];
  doc.rect(cx, y, colW3[1], rowH3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Classificação Qualitativa', cx + 2.5, y + 4.7);
  cx += colW3[1];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (let c = 0; c < 4; c++) {
    doc.rect(cx, y, colW3[c + 2], rowH3);
    doc.text(
      metrics.qualTrim[c] || record.qualTrim?.[c] || '',
      cx + colW3[c + 2] / 2,
      y + 4.6,
      { align: 'center' }
    );
    cx += colW3[c + 2];
  }
  y += rowH3 + 5;

  // Nota: 1 a 6 (na Página 1)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Nota:', marginX, y);
  y += 4.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const notasExplicativas = [
    '1. A pontuação trimestral é a nota atribuída pelo avaliador, resultado da soma de todos indicadores.',
    '2. Classificação Quantitativa ou Notas de Classificação é a soma das notas obtidas por cada indicador.',
    '3. Classificação Qualitativa ou Faixa Correspondente é o resultado atribuído a cada Nota de Classificação.',
    '4. A média final é a soma dos trimestres dividida pelos trimestres lectivos do ano.',
    '5. Classificação final é a soma das médias dos indicadores.',
    '6. Os comentários devem ser efectuados por trimestre.',
  ];
  for (const notaLine of notasExplicativas) {
    const splitLines = doc.splitTextToSize(notaLine, usableWidth);
    for (const sl of splitLines) {
      doc.text(sl, marginX, y);
      y += 4.0;
    }
  }

  // =========================================================================
  // PÁGINA 2: Classificação Anual + Classificação Final + Apreciação Geral (4 Comentários × 5 linhas)
  // =========================================================================
  doc.addPage();
  y = marginTop + 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Classificação Anual dos Indicadores', marginX, y);
  y += 3.0;

  const colW4 = [12, 130, 36]; // sum = 178
  const rowH4 = 6.8;
  const headers4 = ['Nº', 'Indicadores', 'Média Final'];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  cx = marginX;
  for (let i = 0; i < headers4.length; i++) {
    doc.rect(cx, y, colW4[i], rowH4);
    doc.text(headers4[i], i === 1 ? cx + 2.5 : cx + colW4[i] / 2, y + 4.7, {
      align: i === 1 ? 'left' : 'center',
    });
    cx += colW4[i];
  }
  y += rowH4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (let pos = 0; pos < ANUAL_INDICADORES_ORDER.length; pos++) {
    const indIdx = ANUAL_INDICADORES_ORDER[pos];
    cx = marginX;
    doc.rect(cx, y, colW4[0], rowH4);
    doc.text(String(pos + 1), cx + colW4[0] / 2, y + 4.6, { align: 'center' });
    cx += colW4[0];

    doc.rect(cx, y, colW4[1], rowH4);
    doc.text(INDICADORES_AVALIACAO[indIdx], cx + 2.5, y + 4.6);
    cx += colW4[1];

    doc.rect(cx, y, colW4[2], rowH4);
    doc.text(formatAvaliacaoNumber(metrics.anualMedias[pos]), cx + colW4[2] / 2, y + 4.6, {
      align: 'center',
    });
    y += rowH4;
  }
  y += 6;

  // Classificação Final
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Classificação Final', marginX, y);
  y += 3.0;

  // Row 1: Quantitativa
  doc.rect(marginX, y, colW4[0], rowH4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('1', marginX + colW4[0] / 2, y + 4.6, { align: 'center' });
  doc.rect(marginX + colW4[0], y, colW4[1], rowH4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Quantitativa', marginX + colW4[0] + 2.5, y + 4.7);
  doc.rect(marginX + colW4[0] + colW4[1], y, colW4[2], rowH4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    formatAvaliacaoNumber(metrics.finalQuant),
    marginX + colW4[0] + colW4[1] + colW4[2] / 2,
    y + 4.6,
    { align: 'center' }
  );
  y += rowH4;

  // Row 2: Qualitativa
  doc.rect(marginX, y, colW4[0], rowH4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('2', marginX + colW4[0] / 2, y + 4.6, { align: 'center' });
  doc.rect(marginX + colW4[0], y, colW4[1], rowH4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Qualitativa', marginX + colW4[0] + 2.5, y + 4.7);
  doc.rect(marginX + colW4[0] + colW4[1], y, colW4[2], rowH4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    metrics.finalQual || record.finalQual || '',
    marginX + colW4[0] + colW4[1] + colW4[2] / 2,
    y + 4.6,
    { align: 'center' }
  );
  y += rowH4 + 7;

  // Apreciação Geral (Comentários dos Avaliadores)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Apreciação Geral', marginX, y);
  y += 4.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('(Comentários dos Avaliadores)', marginX, y);
  y += 6.0;

  const drawCommentBlock = (title: string, textVal: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title, marginX, y);
    y += 5.5;
    const lineSpacing = 5.6;
    const startY = y;
    if (textVal && textVal.trim()) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const splitLines = doc.splitTextToSize(textVal.trim(), usableWidth - 4).slice(0, 5);
      for (const sl of splitLines) {
        doc.text(sl, marginX + 2, y);
        y += lineSpacing;
      }
    }
    doc.setLineWidth(0.25);
    let lineY = startY + 1.2;
    for (let i = 0; i < 5; i++) {
      doc.line(marginX, lineY, marginX + usableWidth, lineY);
      lineY += lineSpacing;
    }
    y = startY + 5 * lineSpacing + 2.5;
  };

  drawCommentBlock('Comentário 1', record.c1 || '');
  drawCommentBlock('Comentário 2', record.c2 || '');
  drawCommentBlock('Comentário 3', record.c3 || '');
  drawCommentBlock('Comentário Final', record.cf || '');

  // =========================================================================
  // PÁGINA 3: Identificação e Assinatura do Avaliador + Concordância e Homologação
  // =========================================================================
  doc.addPage();
  y = marginTop + 8;

  const avRowH = 7.4;
  doc.setLineWidth(0.3);
  // Linha 1: Nome
  doc.rect(marginX, y, usableWidth, avRowH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Nome:', marginX + 3, y + 5.0);
  const nomeLw = doc.getTextWidth('Nome:') + 2.5;
  if (record.avNome) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(record.avNome, marginX + 3 + nomeLw, y + 5.0);
  }
  y += avRowH;

  // Linha 2: Função
  doc.rect(marginX, y, usableWidth, avRowH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Função:', marginX + 3, y + 5.0);
  const funcLw = doc.getTextWidth('Função:') + 2.5;
  if (record.avFuncao) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(record.avFuncao, marginX + 3 + funcLw, y + 5.0);
  }
  y += avRowH;

  // Linha 3: Data
  doc.rect(marginX, y, usableWidth, avRowH);
  drawSlashDateLine('Data:', record.avData, marginX + 3, y + 5.0, 18, false, true);
  y += avRowH + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('O Avaliador', centerX, y, { align: 'center' });
  y += 14;
  doc.setLineWidth(0.35);
  doc.line(centerX - 42, y, centerX + 42, y);
  if (record.avNome) {
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(record.avNome, centerX, y, { align: 'center' });
  }
  y += 16;

  // Concordância com Avaliação e Homologação
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Concordância com Avaliação', marginX, y);
  y += 9;

  const drawBoxOption = (label: string, checked: boolean, bx: number, by: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(label, bx, by);
    const lw = doc.getTextWidth(label) + 2.5;
    doc.rect(bx + lw, by - 3.6, 5.0, 5.0);
    if (checked) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('X', bx + lw + 2.5, by - 0.3, { align: 'center' });
    }
    return bx + lw + 22;
  };

  let nextX = marginX;
  nextX = drawBoxOption('Concordo', record.conc === 'Sim', nextX, y);
  drawBoxOption('Não concordo', record.conc === 'Não', nextX, y);
  y += 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('O Avaliado', centerX, y, { align: 'center' });
  y += 14;
  doc.setLineWidth(0.35);
  doc.line(centerX - 42, y, centerX + 42, y);
  y += 13;

  drawSlashDateLine('Data', record.avdData, marginX, y, 16, true, true);
  y += 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('O Homologante', centerX, y, { align: 'center' });
  y += 14;
  doc.setLineWidth(0.35);
  doc.line(centerX - 42, y, centerX + 42, y);

  // Numerar páginas no rodapé
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - marginX, pageHeight - 10, {
      align: 'right',
    });
  }

  const safeName = (record.nome || record.agente || 'Docente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  doc.save(`Ficha_Avaliacao_Docente_${safeName}.pdf`);
}





