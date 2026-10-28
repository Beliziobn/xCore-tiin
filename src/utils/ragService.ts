import type { RagDocumentClient, RagQueryResultClient, RagStatsClient, RagChunkClient, RagCategory } from '../types';

export const ragService = {
  /**
   * Execute an intelligent RAG query with vector retrieval and Gemini grounding
   */
  async query(params: {
    query: string;
    category?: string;
    userRole?: string;
    userName?: string;
    maxChunks?: number;
  }): Promise<RagQueryResultClient> {
    const res = await fetch('/api/rag/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha na comunicação com o servidor RAG' }));
      throw new Error(err.message || err.error || 'Erro ao consultar RAG');
    }

    const data = await res.json();
    return {
      query: data.query,
      answer: data.answer,
      retrievedChunks: data.retrievedChunks || [],
      modelUsed: data.modelUsed,
      durationMs: data.durationMs,
      isAugmentedByGemini: data.isAugmentedByGemini,
      timestamp: data.timestamp,
    };
  },

  /**
   * Retrieve all indexed regulatory documents
   */
  async getDocuments(): Promise<RagDocumentClient[]> {
    const res = await fetch('/api/rag/documents');
    if (!res.ok) throw new Error('Não foi possível carregar os documentos RAG');
    const data = await res.json();
    return data.documents || [];
  },

  /**
   * Get RAG knowledge base statistics
   */
  async getStats(): Promise<RagStatsClient> {
    const res = await fetch('/api/rag/stats');
    if (!res.ok) throw new Error('Erro ao obter estatísticas RAG');
    const data = await res.json();
    return data.stats;
  },

  /**
   * Ingest a new document into the RAG vector base
   */
  async ingestDocument(params: {
    title: string;
    category: RagCategory;
    summary?: string;
    author: string;
    legalReference?: string;
    content: string;
  }): Promise<{ document: RagDocumentClient; chunksCreated: number }> {
    const res = await fetch('/api/rag/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha na ingestão do documento' }));
      throw new Error(err.message || err.error || 'Erro ao indexar documento');
    }

    const data = await res.json();
    return {
      document: data.document,
      chunksCreated: data.chunksCreated,
    };
  },

  /**
   * Delete custom document
   */
  async deleteDocument(id: string): Promise<boolean> {
    const res = await fetch(`/api/rag/documents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  /**
   * Raw chunk similarity search inspector
   */
  async searchChunks(query: string, category?: string): Promise<RagChunkClient[]> {
    const res = await fetch('/api/rag/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, category, maxChunks: 8 }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.chunks || [];
  },
};
