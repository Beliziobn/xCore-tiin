export interface AdvancedFilterCriteria {
  // Filtros principais visíveis
  schools: string[]; // ['all'] ou array com IDs de escolas
  academicYear: string; // '2026/2027', '2025/2026', '2024/2025', etc.
  periodType: 'anual' | 'semestre' | 'trimestre' | 'intervalo';
  periodDetail: string; // '1º Trimestre', '2º Trimestre', '3º Trimestre', '1º Semestre', '2º Semestre', 'Ano Completo'
  dateRangeStart?: string;
  dateRangeEnd?: string;
  gradeClass: string; // 'all', '1ª Classe', '2ª Classe', etc.
  turma: string; // 'all', 'Turma A', 'Turma B', etc.
  shift: 'all' | 'Manhã' | 'Tarde' | 'Noite';
  modality: 'all' | 'Presencial' | 'EAD';

  // Mais filtros (painel expansível)
  userType: 'all' | 'alunos' | 'professores' | 'diretores';
  gender: 'all' | 'F' | 'M';
  ageRange: 'all' | '<6' | '6-11' | '12-14' | '15-17' | '18+';
  enrollmentStatus: 'all' | 'ativo' | 'transferido' | 'concluido' | 'inativo';
  documentStatus: 'all' | 'com_documento' | 'sem_documento' | 'pendente';
  performanceStatus: 'all' | 'aprovacao' | 'em_risco' | 'reprovacao';
  attendanceRange: 'all' | '95-100' | '85-94' | '75-84' | '<75';
}

export const defaultFilterCriteria: AdvancedFilterCriteria = {
  schools: ['all'],
  academicYear: '2026/2027',
  periodType: 'anual',
  periodDetail: 'Ano Completo',
  gradeClass: 'all',
  turma: 'all',
  shift: 'all',
  modality: 'all',
  userType: 'all',
  gender: 'all',
  ageRange: 'all',
  enrollmentStatus: 'all',
  documentStatus: 'all',
  performanceStatus: 'all',
  attendanceRange: 'all',
};
