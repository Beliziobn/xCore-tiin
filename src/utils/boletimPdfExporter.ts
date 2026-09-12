import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

/**
 * Helper to safely obtain the jsPDF constructor across different ESM/CJS bundlers
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

export interface ExportPdfOptions {
  studentName?: string;
  matriculaCode?: string;
  onProgress?: (status: string) => void;
}

/**
 * Exporta o Boletim Oficial de Matrícula para PDF em formato A4 padronizado (210mm x 297mm)
 * Preserva logótipo da instituição, insígnia nacional, assinatura digital e carimbo.
 */
export async function exportBoletimToPDF(
  element: HTMLElement,
  options: ExportPdfOptions = {}
): Promise<void> {
  const { studentName = 'Aluno', matriculaCode = 'MAT-2025', onProgress } = options;

  onProgress?.('Preparando documento A4...');

  try {
    // Captura com alta densidade de pixels para qualidade de impressão 300 DPI
    onProgress?.('Renderizando elementos gráficos...');
    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2.2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      filter: (node) => {
        // Ignora elementos marcados como no-print
        if (node instanceof HTMLElement && node.classList.contains('no-print')) {
          return false;
        }
        return true;
      },
    });

    onProgress?.('Gerando ficheiro PDF oficial...');
    const Ctor = getJsPDFConstructor();
    const pdf = new Ctor({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;

    // Adiciona a imagem capturada ocupando a página inteira A4
    pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

    const safeName = studentName.trim().replace(/[^a-zA-Z0-9À-ÿ_-]/g, '_') || 'Aluno';
    const safeMatricula = matriculaCode.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'MAT';
    const fileName = `Boletim_Matricula_${safeMatricula}_${safeName}.pdf`;

    pdf.save(fileName);
    onProgress?.('Download do PDF concluído!');
  } catch (error) {
    console.error('Erro ao gerar PDF do boletim:', error);
    throw error;
  }
}
