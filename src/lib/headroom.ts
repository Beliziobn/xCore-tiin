/**
 * Headroom & OmniRoute Token Optimizer
 * Calcula a margem de segurança de tokens (Headroom), aciona compressão automática
 * e determina o tier ideal de modelo para evitar estouro de contexto.
 */

export interface HeadroomMetrics {
  totalContextLimit: number;
  tokensUsed: number;
  remainingTokens: number;
  headroomPercent: number;
  status: 'safe' | 'warning' | 'critical';
  shouldCompress: boolean;
  recommendedModelTier: 'fast' | 'balanced' | 'deep_reasoning';
}

export interface HeadroomConfig {
  safetyMarginPercent?: number; // padrão: 25%
  criticalThresholdTokens?: number; // padrão: 8000
  compressionTriggerPercent?: number; // padrão: 30%
}

/**
 * Calcula as métricas de Headroom com base no consumo atual e no limite da janela
 */
export function calculateHeadroom(
  tokensUsed: number,
  totalContextLimit = 200000,
  config: HeadroomConfig = {}
): HeadroomMetrics {
  const safetyMargin = config.safetyMarginPercent ?? 25;
  const criticalTokens = config.criticalThresholdTokens ?? 8000;
  const compressionTrigger = config.compressionTriggerPercent ?? 30;

  const remainingTokens = Math.max(0, totalContextLimit - tokensUsed);
  const headroomPercent = Math.round((remainingTokens / totalContextLimit) * 100);

  let status: 'safe' | 'warning' | 'critical' = 'safe';
  if (remainingTokens <= criticalTokens || headroomPercent < 15) {
    status = 'critical';
  } else if (headroomPercent <= safetyMargin) {
    status = 'warning';
  }

  const shouldCompress = headroomPercent <= compressionTrigger;

  let recommendedModelTier: 'fast' | 'balanced' | 'deep_reasoning' = 'balanced';
  if (headroomPercent < 20) {
    recommendedModelTier = 'fast'; // Modo econômico e rápido para evitar cortes
  } else if (headroomPercent > 60 && tokensUsed < 40000) {
    recommendedModelTier = 'deep_reasoning'; // Amplo espaço para raciocínio estendido
  }

  return {
    totalContextLimit,
    tokensUsed,
    remainingTokens,
    headroomPercent,
    status,
    shouldCompress,
    recommendedModelTier,
  };
}

/**
 * Algoritmo de compressão leve de prompt para preservar headroom
 */
export function compressPrompt(text: string): { compressedText: string; reductionPercent: number } {
  if (!text || text.length < 100) {
    return { compressedText: text, reductionPercent: 0 };
  }

  const initialLength = text.length;

  // 1. Remove linhas em branco consecutivas e espaços repetidos
  let cleaned = text.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');

  // 2. Compacta stack traces longos (tanto com tabs quanto com espaços)
  cleaned = cleaned.replace(/(?:[ \t]*at [^\n]+\n?){4,}/g, (match) => {
    const lines = match.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length >= 4) {
      return `  ${lines[0].trim()}\n  ... [${lines.length - 2} frames ocultos] ...\n  ${lines[lines.length - 1].trim()}\n`;
    }
    return match;
  });

  const finalLength = cleaned.length;
  const reductionPercent = Math.round(((initialLength - finalLength) / initialLength) * 100);

  return {
    compressedText: cleaned,
    reductionPercent,
  };
}
