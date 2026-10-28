export interface AdvancedSchoolFilterCriteria {
  // 1. Identificação
  search: string; // Nome, código SIGE ou director
  directorName: string; // 'all' ou nome específico do director

  // 2. Localização
  zone: string; // 'all' ou zona (Quêssua, Cassembele, Alto-Guiné, etc.)

  // 3. Natureza
  natureza: 'all' | 'Pública' | 'Público-Privada' | 'Privada' | 'Comunitária';

  // 4. Tipo de Instituição & Complexidade
  institutionType: 'all' | 'regular' | 'complexo' | 'sede' | 'especial';
  isComplexo: 'all' | 'sim' | 'nao';

  // 5. Desempenho
  performanceRange: 'all' | '<70' | '<80' | '70-84' | '85-89' | '90+';

  // 6. Dimensão da Escola (Alunos)
  dimension: 'all' | 'pequena' | 'media' | 'grande' | '>300';

  // 7. Documentação
  documentStatus: 'all' | 'regularizada' | 'em_tratamento' | 'pendente';

  // 8. Frequência / Assiduidade
  attendanceRange: 'all' | '<90' | '90-95' | '>95';

  // 9. Estado da Rede / Atualização
  networkStatus: 'all' | 'ativa' | 'sem_dados_recentes' | 'pendente_atualizacao';
}

export const defaultSchoolFilterCriteria: AdvancedSchoolFilterCriteria = {
  search: '',
  directorName: 'all',
  zone: 'all',
  natureza: 'all',
  institutionType: 'all',
  isComplexo: 'all',
  performanceRange: 'all',
  dimension: 'all',
  documentStatus: 'all',
  attendanceRange: 'all',
  networkStatus: 'all',
};
