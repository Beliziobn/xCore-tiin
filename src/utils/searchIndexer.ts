/**
 * Motor de Índices de Busca (Search Column Indexer)
 * Gera índices compostos e tokens de pesquisa em colunas chave (BI, Nome, Escola, Turma, Cargo)
 * para permitir queries eficientes O(1) e O(log N) no cliente e Firestore.
 */

export class SearchIndexer {
  /**
   * Normaliza texto removendo acentuações e caracteres especiais
   */
  static normalizeText(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ª/g, 'a')
      .replace(/º/g, 'o')
      .trim();
  }

  /**
   * Gera lista de tokens indexáveis para colunas de busca (ex: nome, bi, email)
   */
  static generateSearchTokens(fields: (string | undefined | null)[]): string[] {
    const tokens = new Set<string>();

    fields.forEach((field) => {
      if (!field) return;
      const normalized = this.normalizeText(String(field));
      if (!normalized) return;

      // Token exato
      tokens.add(normalized);

      // Subtermos por palavra
      const words = normalized.split(/[\s\-_\/.,]+/);
      words.forEach((w) => {
        if (w.length >= 2) {
          tokens.add(w);
          // Prefixos para auto-complete (até 15 caracteres)
          for (let i = 2; i <= Math.min(w.length, 15); i++) {
            tokens.add(w.substring(0, i));
          }
        }
      });
    });

    return Array.from(tokens);
  }

  /**
   * Constrói chave de índice composto para filtragem rápida
   * Ex: "escola:escola modelo central#turma:turma a#status:ativo"
   */
  static buildCompoundIndexKey(attributes: Record<string, string | number | undefined>): string {
    return Object.entries(attributes)
      .filter(([_, val]) => val !== undefined && val !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}:${this.normalizeText(String(val))}`)
      .join('#');
  }

  /**
   * Filtra uma lista de itens usando o índice de busca em memória
   */
  static queryByIndex<T extends { searchTokens?: string[] }>(
    items: T[],
    searchTerm: string
  ): T[] {
    if (!searchTerm || !searchTerm.trim()) return items;
    const term = this.normalizeText(searchTerm);

    return items.filter((item) => {
      if (!item.searchTokens || !Array.isArray(item.searchTokens)) {
        return false;
      }
      return item.searchTokens.includes(term);
    });
  }
}

/**
 * Estrutura formal de índices do Firestore para a plataforma uCore
 */
export const REQUIRED_FIRESTORE_INDEXES = [
  {
    collectionGroup: 'users',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'role', order: 'ASCENDING' },
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'createdAt', order: 'DESCENDING' },
    ],
  },
  {
    collectionGroup: 'students',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'schoolId', order: 'ASCENDING' },
      { fieldPath: 'turma', order: 'ASCENDING' },
      { fieldPath: 'nomeCompleto', order: 'ASCENDING' },
    ],
  },
  {
    collectionGroup: 'teachers',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'schoolId', order: 'ASCENDING' },
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'nome', order: 'ASCENDING' },
    ],
  },
  {
    collectionGroup: 'audit_logs',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'action', order: 'ASCENDING' },
      { fieldPath: 'timestamp', order: 'DESCENDING' },
    ],
  },
  {
    collectionGroup: 'audit_logs',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'actorId', order: 'ASCENDING' },
      { fieldPath: 'timestamp', order: 'DESCENDING' },
    ],
  },
];
