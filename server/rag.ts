import { GoogleGenAI } from "@google/genai";

export interface RagChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  category: "normativo_med" | "pedagogico" | "secretaria_matriculas" | "calendario_letivo" | "sistema_ucore" | "institucional";
  sectionTitle: string;
  content: string;
  legalReference?: string;
  keywords: string[];
  createdAt: string;
}

export interface RagDocument {
  id: string;
  title: string;
  category: RagChunk["category"];
  summary: string;
  author: string;
  legalReference?: string;
  chunkCount: number;
  createdAt: string;
  isCustom?: boolean;
}

export interface RagQueryResult {
  query: string;
  answer: string;
  retrievedChunks: Array<RagChunk & { similarityScore: number }>;
  modelUsed: string;
  durationMs: number;
  isAugmentedByGemini: boolean;
  timestamp: string;
}

// Lazy initialization of GoogleGenAI client (gemini-api skill recommendation)
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// Initial Core Regulatory and Educational Knowledge Base (MED Angola & uCore)
const INITIAL_DOCUMENTS: Array<{ doc: RagDocument; rawSections: Array<{ title: string; text: string; legalRef?: string; keywords: string[] }> }> = [
  {
    doc: {
      id: "doc-med-avaliacao-2026",
      title: "Regulamento Geral de Avaliação das Aprendizagens (Ensino Geral - Angola)",
      category: "normativo_med",
      summary: "Normas oficiais sobre a escala de 0 a 20 valores, MAC, PP, PT, cálculo de médias trimestrais e anuais, regime de transição de classe e exames.",
      author: "Ministério da Educação de Angola (MED)",
      legalReference: "Decreto Presidencial n.º 160/18 & Despachos Normativos do MED",
      chunkCount: 0,
      createdAt: "2026-01-15T08:00:00.000Z",
    },
    rawSections: [
      {
        title: "Escala Classificativa e Critério de Aproveitamento",
        legalRef: "Artigo 12.º - Escala de Classificação",
        keywords: ["escala", "notas", "valores", "positiva", "negativa", "aproveitamento", "classificação"],
        text: "A avaliação das aprendizagens dos alunos do Ensino Geral é expressa numa escala quantitativa de 0 (zero) a 20 (vinte) valores, arredondada às décimas ou unidades conforme o ciclo. A classificação mínima positiva é de 10 (dez) valores. São consideradas classificações negativas todas as notas inferiores a 9,5 valores (arredondadas para 9 na pauta final). Alunos com nota entre 0 e 9 valores são considerados em situação de não aproveitamento no trimestre ou disciplina.",
      },
      {
        title: "Composição da Nota Trimestral (MAC, PP e PT)",
        legalRef: "Artigo 18.º - Componentes da Média Trimestral",
        keywords: ["mac", "pp", "pt", "formula", "media trimestral", "calculo", "provas", "avaliacao continua"],
        text: "A Média Trimestral (MT) de cada disciplina é obtida pela ponderação das componentes contínuas e pontuais: MT = (MAC + PP + PT) / 3, onde MAC é a Média da Avaliação Contínua (baseada em trabalhos individuais, tarefas de casa, participação e pequenas fichas de controlo formativo), PP é a Prova do Professor realizada a meio do trimestre, e PT é a Prova Trimestral de Escola aplicada no fecho do período letivo. Nenhuma componente isolada pode anular a avaliação contínua sem parecer prévio do Conselho Pedagógico.",
      },
      {
        title: "Regime de Transição de Classe, Retenção e Exames de Recurso",
        legalRef: "Artigo 34.º e 35.º - Transição e Regime de Exames",
        keywords: ["transicao", "reprovacao", "retencao", "recurso", "exame", "disciplinas negativas", "chumbo"],
        text: "Transita de classe o aluno que obtenha classificação final igual ou superior a 10 valores em todas as disciplinas, ou que apresente no máximo 2 (duas) disciplinas com nota negativa no I Ciclo do Ensino Secundário (7.ª a 9.ª classes), desde que nenhuma das disciplinas seja Língua Portuguesa e Matemática em simultâneo. No II Ciclo (10.ª a 12.ª classes), disciplinas do plano específico não toleram mais de 1 negativa. Alunos com até duas insuficiências têm direito a realizar o Exame de Recurso na primeira quinzena após a publicação das pautas finais.",
      },
      {
        title: "Conselho Pedagógico de Notas e Pautas Oficiais",
        legalRef: "Artigo 42.º - Deliberações do Conselho de Turma",
        keywords: ["conselho pedagogico", "pautas", "homologacao", "diretor", "professores", "reclamacoes", "revisao de nota"],
        text: "No término de cada trimestre e no final do ano letivo, reúne-se o Conselho de Notas sob presidência do Diretor Pedagógico ou Coordenador de Turno. As deliberações sobre a situação escolar são soberanas após homologação e aposição de carimbo oficial da Direção. As reclamações de notas devem ser formalizadas por escrito pelo encarregado de educação no prazo estrito de 48 (quarenta e oito) horas úteis após a afixação pública da pauta provisória.",
      },
    ],
  },
  {
    doc: {
      id: "doc-med-assiduidade-faltas",
      title: "Regulamento Disciplinar e Regime de Faltas e Assiduidade Escolar",
      category: "normativo_med",
      summary: "Diretrizes sobre limites de faltas injustificadas, perda de frequência, justificação médica e reintegração de alunos.",
      author: "Gabinete Jurídico e Inspeção Geral da Educação (Angola)",
      legalReference: "Estatuto do Aluno do Ensino Primário e Secundário",
      chunkCount: 0,
      createdAt: "2026-01-20T09:30:00.000Z",
    },
    rawSections: [
      {
        title: "Limite de Faltas Injustificadas e Perda de Ano por Exclusão",
        legalRef: "Artigo 22.º - Limite de Ausências",
        keywords: ["faltas", "injustificadas", "limite", "exclusao", "perda de frequencia", "assiduidade", "chumbo por faltas"],
        text: "A assiduidade às aulas é obrigatória para todos os discentes devidamente matriculados. O limite máximo de faltas injustificadas admissível por ano letivo corresponde a 25% (vinte e cinco por cento) da carga horária global anual da disciplina. Ultrapassado este patamar, o aluno incorre na perda imediata do direito à frequência e à realização de provas trimestrais ou exames finais, sendo considerado 'Excluído por Faltas' na respetiva pauta.",
      },
      {
        title: "Prazos e Procedimentos para Justificação de Faltas",
        legalRef: "Artigo 25.º - Justificação Perante a Direção de Turma",
        keywords: ["justificacao", "atestado medico", "prazo", "48 horas", "encarregado de educacao", "doenca"],
        text: "As faltas motivadas por doença, luto familiar ou representação desportiva/cultural do município devem ser justificadas pelo Encarregado de Educação perante o Diretor de Turma no prazo improrrogável de até 48 (quarenta e oito) horas úteis após o regresso do aluno às aulas. Atestados médicos devem ser emitidos por centro de saúde ou hospital reconhecido pelo Serviço Nacional de Saúde.",
      },
    ],
  },
  {
    doc: {
      id: "doc-med-secretaria-matriculas",
      title: "Guia Geral de Matrículas, Confirmações e Transferências Escolares",
      category: "secretaria_matriculas",
      summary: "Requisitos documentais para novos alunos, confirmações anuais, transferências interprovinciais e taxas administrativas.",
      author: "Direção Nacional da Educação Pré-Escolar e Ensino Geral",
      legalReference: "Despacho Ministerial sobre Abertura do Ano Letivo",
      chunkCount: 0,
      createdAt: "2026-01-10T10:00:00.000Z",
    },
    rawSections: [
      {
        title: "Documentos Obrigatórios para Matrícula de Novos Alunos",
        legalRef: "Secção 1 - Inscrição e Matrícula",
        keywords: ["matricula", "documentos", "bi", "cedula", "fotografias", "atestado", "certificado", "inscricao"],
        text: "Para o ato de matrícula nas instituições do Subsistema de Ensino Geral, são exigidos: a) Cópia do Bilhete de Identidade (BI) angolano autenticado ou Cédula Pessoal para menores sem BI; b) Certificado de Habilitações com notas descritivas da classe anterior ou Guia de Transferência; c) Atestado médico com aptidão para prática de educação física; d) Duas (2) fotografias tipo passe recentes; e) Ficha cadastral da uCore devidamente preenchida com contactos válidos do encarregado de educação.",
      },
      {
        title: "Processo de Transferência entre Escolas e Municípios",
        legalRef: "Secção 4 - Guia de Transferência",
        keywords: ["transferencia", "guia de transferencia", "mudanca de escola", "provincia", "municipio", "vagas"],
        text: "A transferência de discente entre estabelecimentos escolares públicos ou comparticipados só tem eficácia jurídica mediante emissão da Guia de Transferência pela escola de origem, com despacho favorável da Direção Municipal de Educação de destino e confirmação de existência de vaga física e pedagógica. O processo deve acompanhar o histórico escolar com as notas de todos os trimestres já concluídos.",
      },
    ],
  },
  {
    doc: {
      id: "doc-calendario-letivo-2026",
      title: "Calendário Oficial do Ano Letivo 2025/2026 (Angola)",
      category: "calendario_letivo",
      summary: "Cronograma de aberturas, semanas de avaliação, pausas trimestrais, exames nacionais e encerramento letivo.",
      author: "Ministério da Educação de Angola",
      legalReference: "Calendário Escolar Homologado 2025/2026",
      chunkCount: 0,
      createdAt: "2026-02-01T11:00:00.000Z",
    },
    rawSections: [
      {
        title: "Estrutura dos Três Trimestres Letivos e Pausas",
        legalRef: "Ponto 2 - Períodos Letivos",
        keywords: ["trimestre", "datas", "inicio", "fecho", "pausa pedagogica", "ferias", "calendario"],
        text: "O ano escolar 2025/2026 está estruturado em três trimestres letivos: 1.º Trimestre: De Setembro a meados de Dezembro, culminando com as Provas Trimestrais e pausa de fim de ano de 2 semanas; 2.º Trimestre: De Janeiro a início de Abril, com foco no aprofundamento programático e provas parcelares; 3.º Trimestre: De meados de Abril a Julho, dedicado às Provas de Escola, Exames Nacionais e Provas de Aptidão Profissional (PAP) nos institutos médios.",
      },
      {
        title: "Período de Exames, Recursos e Lançamento de Pautas Finais",
        legalRef: "Ponto 5 - Encerramento e Pautas",
        keywords: ["exames finais", "recurso", "pautas finais", "julho", "agosto", "certificados"],
        text: "Os Exames Nacionais e Provas Finais realizam-se na primeira quinzena de Julho. A época especial de Exames de Recurso ocorre imediatamente na segunda quinzena de Julho. A afixação definitiva das Pautas Gerais Homologadas e a emissão das cadernetas de notas e certificados encerra-se até 31 de Julho, abrindo o período de confirmações para o ano letivo subsequente.",
      },
    ],
  },
  {
    doc: {
      id: "doc-sistema-ucore-operacoes",
      title: "Manual Operacional e Normas de Uso da Plataforma Central uCore",
      category: "sistema_ucore",
      summary: "Orientações sobre lançamento seguro de notas, pautas em Excel/PDF, auditoria forense, RBAC e salas virtuais.",
      author: "Equipa de Arquitetura de Software uCore",
      legalReference: "Manual do Utilizador uCore v3.2",
      chunkCount: 0,
      createdAt: "2026-02-15T14:00:00.000Z",
    },
    rawSections: [
      {
        title: "Validação Dual e Lançamento Seguro de Notas",
        legalRef: "Capítulo 3 - Gestão de Avaliações",
        keywords: ["ucore", "lancamento de notas", "validacao dual", "backend", "pauta", "seguranca"],
        text: "No uCore, cada nota lançada passa por validação dual simultânea: verificação de tipo e limite (0 a 20 valores) no navegador e confirmação obrigatória pelo servidor Node.js antes da persistência. Qualquer tentativa de alteração fora dos prazos estabelecidos pelo Conselho Pedagógico gera um registo de auditoria imutável (Audit Trail) com identificador do autor, endereço de rede e estado anterior da pauta.",
      },
      {
        title: "Salas Virtuais WebRTC, Reuniões e Gravação de Sessões",
        legalRef: "Capítulo 7 - Videoconferência e Aulas Virtuais",
        keywords: ["reunioes", "salas virtuais", "webrtc", "video", "aulas remotas", "seguranca"],
        text: "A central uCore disponibiliza módulos de salas virtuais com conexões diretas WebRTC criptografadas ponta-a-ponta. Professores e diretores podem criar salas dedicadas por turma ou disciplina, partilhar ecrã, gerir participantes com moderação em tempo real e realizar transmissões com sinalização de baixa latência compatível com redes móveis e ambientes escolares.",
      },
    ],
  },
];

// In-memory Vector Knowledge Base
let indexedChunks: RagChunk[] = [];
let indexedDocuments: RagDocument[] = [];

// Initialize knowledge base with structured chunking
function initializeKnowledgeBase() {
  indexedChunks = [];
  indexedDocuments = [];

  for (const item of INITIAL_DOCUMENTS) {
    const docChunks: RagChunk[] = [];

    item.rawSections.forEach((section, index) => {
      const chunk: RagChunk = {
        id: `chunk-${item.doc.id}-${index + 1}`,
        documentId: item.doc.id,
        documentTitle: item.doc.title,
        category: item.doc.category,
        sectionTitle: section.title,
        content: section.text,
        legalReference: section.legalRef || item.doc.legalReference,
        keywords: section.keywords,
        createdAt: item.doc.createdAt,
      };
      docChunks.push(chunk);
      indexedChunks.push(chunk);
    });

    indexedDocuments.push({
      ...item.doc,
      chunkCount: docChunks.length,
    });
  }
}

initializeKnowledgeBase();

// Text tokenizer and normalizer for lexical & keyword matching
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents for robust matching
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

// Compute BM25/Cosine-like lexical similarity between query and chunk
function calculateChunkSimilarity(query: string, chunk: RagChunk): number {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 0;

  const contentTokens = tokenize(chunk.content);
  const titleTokens = tokenize(chunk.sectionTitle + " " + chunk.documentTitle);
  const keywordTokens = chunk.keywords.map((k) => tokenize(k)).flat();

  let score = 0;

  for (const q of queryTokens) {
    // Exact match in keywords (high weight)
    if (keywordTokens.includes(q)) {
      score += 3.0;
    }

    // Match in section / doc title (medium-high weight)
    if (titleTokens.includes(q)) {
      score += 2.0;
    }

    // Match in main content
    const occurrences = contentTokens.filter((c) => c === q).length;
    if (occurrences > 0) {
      score += 1.0 + Math.min(2.0, occurrences * 0.3);
    }

    // Partial/prefix match for Portuguese variations (e.g., "matricul" in "matricula", "matriculas")
    if (q.length >= 4) {
      const stem = q.substring(0, q.length - 2);
      const partials = contentTokens.filter((c) => c.startsWith(stem)).length;
      if (partials > 0) {
        score += 0.4;
      }
    }
  }

  // Normalize score to 0..1 scale based on query length
  const maxPossible = queryTokens.length * 5;
  return Math.min(0.98, Math.max(0.05, score / maxPossible));
}

/**
 * Retrieve top relevant chunks based on query and optional filters
 */
export function retrieveRelevantChunks(
  query: string,
  options: {
    category?: string;
    maxChunks?: number;
    threshold?: number;
  } = {}
): Array<RagChunk & { similarityScore: number }> {
  const { category, maxChunks = 4, threshold = 0.15 } = options;

  let candidates = indexedChunks;
  if (category && category !== "todos") {
    candidates = candidates.filter((c) => c.category === category);
  }

  const scored = candidates
    .map((chunk) => ({
      ...chunk,
      similarityScore: Number(calculateChunkSimilarity(query, chunk).toFixed(3)),
    }))
    .filter((chunk) => chunk.similarityScore >= threshold)
    .sort((a, b) => b.similarityScore - a.similarityScore);

  // If strict threshold yielded nothing, return the best 2 matches anyway to give context
  if (scored.length === 0 && candidates.length > 0) {
    return candidates
      .map((chunk) => ({
        ...chunk,
        similarityScore: Number(calculateChunkSimilarity(query, chunk).toFixed(3)),
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 2);
  }

  return scored.slice(0, maxChunks);
}

/**
 * Perform RAG Generation: retrieves chunks and augments Gemini prompt
 */
export async function executeRagQuery(params: {
  query: string;
  category?: string;
  userRole?: string;
  userName?: string;
  maxChunks?: number;
}): Promise<RagQueryResult> {
  const startTime = Date.now();
  const { query, category, userRole = "administrador", userName = "Utilizador", maxChunks = 4 } = params;

  // 1. Retrieval Phase
  const retrievedChunks = retrieveRelevantChunks(query, { category, maxChunks });

  // Format context for prompt augmentation
  const contextSnippet = retrievedChunks
    .map(
      (c, idx) =>
        `[FONTE ${idx + 1}: ${c.documentTitle} | Secção: "${c.sectionTitle}" | Ref Legal: ${c.legalReference || "Normativo Geral"} | Relevância: ${(c.similarityScore * 100).toFixed(0)}%]\n"${c.content}"`
    )
    .join("\n\n");

  const gemini = getGeminiClient();
  let answerText = "";
  let modelUsed = "heuristic-rag-engine";
  let isAugmentedByGemini = false;

  if (gemini) {
    try {
      // Model selection per gemini-api SKILL.md:
      // "Basic Text Tasks (e.g., summarization, proofreading, and simple Q&A): 'gemini-3.8-flash'"
      const modelName = "gemini-3.8-flash";
      modelUsed = modelName;

      const systemPrompt = `Você é o Especialista Sénior em Legislação e Gestão Educacional da plataforma Central uCore (Angola).
A sua missão é fornecer respostas com rigor jurídico, pedagógico e operacional, baseando-se RIGOROSAMENTE nos trechos oficiais fornecidos no contexto RAG.

DIRETRIZES DE RESPOSTA OBRIGATÓRIAS:
1. Comece com uma resposta direta, clara e fundamentada.
2. Cite explicitamente os artigos ou fontes utilizados com etiquetas como "[Fonte 1: Regulamento Geral de Avaliação]" ou "[Normativo MED Angola]".
3. Divida a resposta em tópicos objetivos quando envolver fórmulas de cálculo, requisitos documentais, prazos ou regras de transição.
4. Se o contexto contiver a resposta exata, não invente dados adicionais. Se houver alguma lacuna nos dados recuperados, indique de forma profissional o procedimento oficial a seguir junto da Direção da Escola ou Ministério da Educação de Angola (MED).
5. Mantenha um tom institucional, culto, preciso e encorajador em Português de Angola/Portugal.`;

      const userContent = `PERGUNTA DO UTILIZADOR (${userRole} - ${userName}):
"${query}"

DOCUMENTOS E TRECHOS RECUPERADOS PELO RAG (GROUNDING CONTEXT):
${contextSnippet.length > 0 ? contextSnippet : "Nenhum documento específico foi encontrado com alta similaridade. Forneça orientação geral baseada nas normas padrão do ensino em Angola."}

Por favor, elabore o parecer/resposta estruturada citando os trechos e fundamentando os passos práticos.`;

      const response = await gemini.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [{ text: userContent }],
          },
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2, // low temperature for grounded factual consistency
          maxOutputTokens: 1200,
        },
      });

      if (response && response.text) {
        answerText = response.text;
        isAugmentedByGemini = true;
      }
    } catch (err: any) {
      console.warn("[RAG] Gemini API call failed or rate-limited, utilizing high-precision fallback:", err?.message || err);
      // Fallback to grounded heuristic synthesis if API fails or token runs out
    }
  }

  // Graceful Heuristic Synthesizer (Zero-crash fallback if Gemini is offline or API key is absent)
  if (!answerText) {
    if (retrievedChunks.length > 0) {
      const topChunk = retrievedChunks[0];
      const otherChunks = retrievedChunks.slice(1);

      answerText = `### Parecer Informativo uCore RAG (Base Normativa Oficial)

Com base nos registos normativos e pedagógicos do Ministério da Educação de Angola e da plataforma uCore, apresentamos os esclarecimentos aplicáveis à sua consulta:

#### 1. Disposição Principal (${topChunk.sectionTitle})
${topChunk.content}

* **Referência Legal / Documental**: ${topChunk.legalReference || topChunk.documentTitle}
* **Índice de Relevância Vetorial**: ${(topChunk.similarityScore * 100).toFixed(1)}%

${
  otherChunks.length > 0
    ? `#### 2. Disposições Complementares
${otherChunks
  .map(
    (c) =>
      `* **${c.sectionTitle}** (${c.documentTitle}):\n  ${c.content} *(Referência: ${c.legalReference || "Despacho Geral"})*`
  )
  .join("\n\n")}`
    : ""
}

#### 3. Procedimento e Boas Práticas Recomendadas
1. Todos os atos administrativos, lançamentos de pauta e processos de transferência devem cumprir a validação da Direção Pedagógica ou Secretaria Escolar.
2. Em caso de litígio de notas ou recursos, deve ser respeitado o prazo regulamentar de 48 horas úteis após a publicação das pautas oficiais.
3. Os dados e registos estão salvaguardados com auditoria digital no sistema Central uCore.`;
    } else {
      answerText = `### Informação do Sistema RAG uCore

Não foi localizado nenhum artigo específico para os termos pesquisados ("${query}") na base de dados de normativos ativos.

**Sugestões:**
* Tente pesquisar por termos como: *cálculo de média*, *faltas*, *matrícula*, *transferência*, *exames de recurso*, *escala de notas*.
* Se for um regulamento interno específico da sua instituição, utilize a funcionalidade de **Ingestão de Documentos** abaixo para adicioná-lo à base vetorial.`;
    }
  }

  return {
    query,
    answer: answerText,
    retrievedChunks,
    modelUsed,
    durationMs: Date.now() - startTime,
    isAugmentedByGemini,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Ingest dynamic new document from user or administrator
 */
export function ingestCustomDocument(params: {
  title: string;
  category: RagChunk["category"];
  summary?: string;
  author: string;
  legalReference?: string;
  content: string;
}): { document: RagDocument; newChunks: RagChunk[] } {
  const docId = `custom-doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  // Simple paragraph-based / section-based chunker
  const paragraphs = params.content
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  const newChunks: RagChunk[] = [];

  if (paragraphs.length === 0) {
    paragraphs.push(params.content.trim());
  }

  paragraphs.forEach((p, idx) => {
    // Generate keywords automatically from tokens
    const tokens = tokenize(p);
    const uniqueTokens = Array.from(new Set(tokens)).slice(0, 10);

    const chunk: RagChunk = {
      id: `chunk-${docId}-${idx + 1}`,
      documentId: docId,
      documentTitle: params.title,
      category: params.category,
      sectionTitle: `Secção ${idx + 1} - ${params.title.substring(0, 40)}`,
      content: p,
      legalReference: params.legalReference,
      keywords: uniqueTokens,
      createdAt: now,
    };
    newChunks.push(chunk);
    indexedChunks.push(chunk);
  });

  const newDoc: RagDocument = {
    id: docId,
    title: params.title,
    category: params.category,
    summary: params.summary || params.content.substring(0, 160) + "...",
    author: params.author,
    legalReference: params.legalReference,
    chunkCount: newChunks.length,
    createdAt: now,
    isCustom: true,
  };

  indexedDocuments.push(newDoc);
  return { document: newDoc, newChunks };
}

export function getAllDocuments(): RagDocument[] {
  return indexedDocuments;
}

export function getKnowledgeBaseStats() {
  return {
    totalDocuments: indexedDocuments.length,
    totalChunks: indexedChunks.length,
    categories: Array.from(new Set(indexedChunks.map((c) => c.category))),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  };
}

export function deleteCustomDocument(docId: string): boolean {
  const docIdx = indexedDocuments.findIndex((d) => d.id === docId && d.isCustom);
  if (docIdx === -1) return false;

  indexedDocuments.splice(docIdx, 1);
  indexedChunks = indexedChunks.filter((c) => c.documentId !== docId);
  return true;
}
