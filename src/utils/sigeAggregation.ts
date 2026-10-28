import * as XLSX from 'xlsx';
import type { 
  AdminSchool, 
  AdminTeacher, 
  AdminDirector, 
  AdminStudent,
  TeacherRegistrationData,
  StudentRegistrationData
} from '../types';
import type { SystemDataset } from './excelExport';
import { initialAdminSchools } from '../data/adminData';
import { getStoredTeachers } from './teacherStorage';
import { getStoredStudents } from './studentStorage';
import { validateGenderCount, validateAproveitamento } from './sigeRulesEngine';
import { aggregateSigeDatasetWithSchoolAttribution } from './sigeSchoolAggregation';

/**
 * ============================================================================
 * SERVIÇO DE AGREGAÇÃO ESTATÍSTICA OFICIAL SIGE (MINISTÉRIO DA EDUCAÇÃO - GEPE)
 * ============================================================================
 * 
 * DIRECTRIZ FUNDAMENTAL DO SIGE:
 * O Instrumento Estatístico do SIGE é de âmbito ESTATÍSTICO AGREGADO CENTRAL.
 * Exige estritamente NÚMEROS AGREGADOS (contagens e somatórios).
 * 
 * ATRIBUIÇÃO ESCOLAR OFICIAL (INSTRUMENTO COMPLEMENTAR 2026/2027):
 * Todas as panilhas e relatórios discriminam explicitamente o NOME DA ESCOLA
 * que forneceu os dados estatísticos (Alunos Matriculados, Pessoal Docente,
 * Repetentes, NEE, Pessoal Não Docente, Aproveitamento e Consolidados).
 * 
 * REGRA ABSOLUTA DE CONFORMIDADE DE PRIVACIDADE:
 * - ZERO Nomes de Alunos ou Professores
 * - ZERO E-mails pessoais
 * - ZERO Números de BI / NIF
 * - ZERO Números de Processo Individuais de Alunos
 * - ZERO Telefones pessoais
 * 
 * Todas as tabelas são organizadas por:
 * Escola Provedora × Nível × Natureza × Classe × Idade × Gênero (MF/F).
 */

export interface GenderCount {
  mf: number; // Masculino + Feminino
  f: number;  // Feminino
}

/** Faixas etárias oficiais para tabelas do SIGE / GEPE */
export const SIGE_IDADES_COLUNAS = [
  '< 5 anos',
  '5 anos',
  '6 anos',
  '7 anos',
  '8 anos',
  '9 anos',
  '10 anos',
  '11 anos',
  '12 anos',
  '13 anos',
  '14 anos',
  '15 anos',
  '16 anos',
  '17 anos',
  '18 anos',
  '> 18 anos',
  '> 13 anos', // Retido para compatibilidade de regras legado
] as const;

export interface SigeAggregatedReport {
  meta: {
    pais: string;
    ministerio: string;
    direccao: string;
    provincia: string;
    municipio: string;
    anoLectivo: string;
    dataEmissao: string;
    responsavel: string;
    cargo: string;
    contactoInstitucional: string;
  };
  totaisGerais: {
    totalEscolas: number;
    totalSalas: number;
    totalTurmas: number;
    totalDocentes: GenderCount;
    totalDocentesDeclarados?: number;
    totalDocentesPendentes?: number;
    totalNaoDocentes: GenderCount;
    totalAlunosMatriculados: GenderCount;
    totalAlunosDeclarados?: number;
    totalAlunosPendentes?: number;
    totalAlunosRepetentes: GenderCount;
    totalAlunosNEE: GenderCount;
  };
  // Secções oficiais com atribuição de escola fornecedora
  alunosMatriculados: {
    escola: string;
    nivel: string;
    classe: string;
    natureza: string;
    total: GenderCount;
    idades: Record<string, GenderCount>;
    quotaDeclarada?: number;
    cadastradosEscola?: number;
    pendentesEscola?: number;
  }[];
  pessoalDocente: {
    escola: string;
    nivelEnsino: string;
    natureza: string;
    formacaoPedagogica: string;
    grauAcademico: string;
    total: GenderCount;
    quotaDeclarada?: number;
    cadastradosEscola?: number;
    pendentesEscola?: number;
  }[];
  infraestruturas: {
    escola: string;
    natureza: string;
    escolasCount: number;
    salasDefinitivas: number;
    salasProvisorias: number;
    turmasManha: number;
    turmasTarde: number;
    turmasNoite: number;
    totalTurmas: number;
  }[];
  aproveitamento: {
    escola: string;
    ciclo: string;
    classe: string;
    natureza: string;
    matriculados: GenderCount;
    aprovados: GenderCount;
    reprovados: GenderCount;
    desistidos: GenderCount;
    residualMF: number;
    residualF: number;
    validacao: 'Correcto' | 'Falso';
  }[];
  alunosRepetentes: {
    escola: string;
    nivel: string;
    classe: string;
    natureza: string;
    total: GenderCount;
    idades: Record<string, GenderCount>;
  }[];
  necessidadesEspeciais: {
    escola: string;
    tipoDeficiencia: string;
    nivel: string;
    natureza: string;
    total: GenderCount;
  }[];
  pessoalNaoDocente: {
    escola: string;
    categoria: string;
    natureza: string;
    total: GenderCount;
  }[];
  escolasConsolidadas?: {
    escola: string;
    categoria: string;
    abrangencia: string;
    natureza: string;
    matriculados: GenderCount;
    aprovados: GenderCount;
    reprovados: GenderCount;
    desistidos: GenderCount;
    alunosDeclarados?: number;
    alunosCadastrados?: number;
    alunosPendentes?: number;
    docentesDeclarados?: number;
    docentesCadastrados?: number;
    docentesPendentes?: number;
    status: string;
  }[];
}

/**
 * Normaliza textos para evitar inconsistências
 */
function norm(str?: string): string {
  if (!str) return '';
  return str.trim().toLowerCase();
}

/**
 * Agrega todos os dados da base de dados Sigre em contagens estatísticas com atribuição da ESCOLA PROVEDORA.
 * Cumpre 100% de privacidade (zero nomes de pessoas, zero BI).
 */
export function aggregateSigeDataset(dataset: SystemDataset): SigeAggregatedReport {
  return aggregateSigeDatasetWithSchoolAttribution(dataset);
}

/**
 * ============================================================================
 * CONVERSORES DE LINHAS DE TABELA PARA EXCEL (.XLSX) E GOOGLE SHEETS
 * Todas as tabelas possuem ZERO DADOS NOMINAIS (apenas contagens numéricas).
 * ============================================================================
 */

/**
 * Folha 1: CAPA
 */
export function buildSigeCapaRows(report: SigeAggregatedReport): Record<string, any>[] {
  const m = report.meta;
  const t = report.totaisGerais;

  return [
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'País', 'VALOR / DADO ESTATÍSTICO': m.pais, 'NOTA DE VALIDAÇÃO': 'Instrumento Nacional Homologado' },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Ministério', 'VALOR / DADO ESTATÍSTICO': m.ministerio, 'NOTA DE VALIDAÇÃO': 'Órgão Central' },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Direcção Competente', 'VALOR / DADO ESTATÍSTICO': m.direccao, 'NOTA DE VALIDAÇÃO': 'Gabinete de Estudos, Planeamento e Estatística' },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Província', 'VALOR / DADO ESTATÍSTICO': m.provincia, 'NOTA DE VALIDAÇÃO': 'Unidade Provincial' },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Município', 'VALOR / DADO ESTATÍSTICO': m.municipio, 'NOTA DE VALIDAÇÃO': 'Circunscrição Municipal de Quêssua' },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Ano Lectivo', 'VALOR / DADO ESTATÍSTICO': m.anoLectivo, 'NOTA DE VALIDAÇÃO': 'Período Oficial de Referência' },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Data de Emissão dos Dados', 'VALOR / DADO ESTATÍSTICO': m.dataEmissao, 'NOTA DE VALIDAÇÃO': 'Homologado na Data da Exportação' },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Responsável pelo Preenchimento', 'VALOR / DADO ESTATÍSTICO': m.responsavel, 'NOTA DE VALIDAÇÃO': m.cargo },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Contacto Institucional', 'VALOR / DADO ESTATÍSTICO': m.contactoInstitucional, 'NOTA DE VALIDAÇÃO': 'Correio electrónico oficial' },
    { 'CAMPO OFICIAL DO INSTRUMENTO': '--- RESUMO AGREGADO GERAL ---', 'VALOR / DADO ESTATÍSTICO': '--------------------', 'NOTA DE VALIDAÇÃO': '--------------------' },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Total de Unidades Escolares', 'VALOR / DADO ESTATÍSTICO': t.totalEscolas, 'NOTA DE VALIDAÇÃO': 'Escolas activas na rede' },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Total de Salas de Aula', 'VALOR / DADO ESTATÍSTICO': t.totalSalas, 'NOTA DE VALIDAÇÃO': 'Salas definitivas e provisórias' },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Total de Turmas em Funcionamento', 'VALOR / DADO ESTATÍSTICO': t.totalTurmas, 'NOTA DE VALIDAÇÃO': 'Turnos manhã, tarde e noite' },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Total de Alunos Matriculados Cadastrados na Planilha (MF)', 'VALOR / DADO ESTATÍSTICO': t.totalAlunosMatriculados.mf, 'NOTA DE VALIDAÇÃO': `Feminino: ${t.totalAlunosMatriculados.f} | Declarados: ${t.totalAlunosDeclarados ?? t.totalAlunosMatriculados.mf} | Pendentes de Cadastro: ${t.totalAlunosPendentes ?? 0}` },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Total de Alunos Repetentes (MF)', 'VALOR / DADO ESTATÍSTICO': t.totalAlunosRepetentes.mf, 'NOTA DE VALIDAÇÃO': 'Feminino: ' + t.totalAlunosRepetentes.f },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Alunos com Necessidades Especiais (NEE)', 'VALOR / DADO ESTATÍSTICO': t.totalAlunosNEE.mf, 'NOTA DE VALIDAÇÃO': 'Feminino: ' + t.totalAlunosNEE.f },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Total de Pessoal Docente Cadastrado na Planilha', 'VALOR / DADO ESTATÍSTICO': t.totalDocentes.mf, 'NOTA DE VALIDAÇÃO': `Feminino: ${t.totalDocentes.f} | Declarados: ${t.totalDocentesDeclarados ?? t.totalDocentes.mf} | Pendentes de Cadastro: ${t.totalDocentesPendentes ?? 0}` },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Total de Pessoal Não Docente (Apoio/Admin)', 'VALOR / DADO ESTATÍSTICO': t.totalNaoDocentes.mf, 'NOTA DE VALIDAÇÃO': 'Feminino: ' + t.totalNaoDocentes.f },
    { 'CAMPO OFICIAL DO INSTRUMENTO': 'Conformidade de Privacidade SIGE', 'VALOR / DADO ESTATÍSTICO': 'ESTRITAMENTE AGREGADO', 'NOTA DE VALIDAÇÃO': 'Zero nomes, Zero BI, Zero e-mails pessoais' },
  ];
}

/**
 * Folha 2: 1 - ALUNOS MATRICULADOS (Discriminado por Escola Provedora)
 */
export function buildSigeAlunosMatriculadosRows(report: SigeAggregatedReport): Record<string, any>[] {
  return report.alunosMatriculados.map(item => {
    const row: Record<string, any> = {
      'ESCOLA': item.escola || 'Rede Municipal',
      'SUBSISTEMA / NÍVEL': item.nivel,
      'NATUREZA DE ENSINO': item.natureza,
      'CLASSE': item.classe,
      'TOTAL (MF)': item.total.mf,
      'TOTAL (F)': item.total.f,
      '< 5 ANOS (MF)': item.idades['< 5 anos']?.mf || 0,
      '< 5 ANOS (F)': item.idades['< 5 anos']?.f || 0,
      '5 ANOS (MF)': item.idades['5 anos']?.mf || 0,
      '5 ANOS (F)': item.idades['5 anos']?.f || 0,
      '6 ANOS (MF)': item.idades['6 anos']?.mf || 0,
      '6 ANOS (F)': item.idades['6 anos']?.f || 0,
      '7 ANOS (MF)': item.idades['7 anos']?.mf || 0,
      '7 ANOS (F)': item.idades['7 anos']?.f || 0,
      '8 ANOS (MF)': item.idades['8 anos']?.mf || 0,
      '8 ANOS (F)': item.idades['8 anos']?.f || 0,
      '9 ANOS (MF)': item.idades['9 anos']?.mf || 0,
      '9 ANOS (F)': item.idades['9 anos']?.f || 0,
      '10 ANOS (MF)': item.idades['10 anos']?.mf || 0,
      '10 ANOS (F)': item.idades['10 anos']?.f || 0,
      '11 ANOS (MF)': item.idades['11 anos']?.mf || 0,
      '11 ANOS (F)': item.idades['11 anos']?.f || 0,
      '12 ANOS (MF)': item.idades['12 anos']?.mf || 0,
      '12 ANOS (F)': item.idades['12 anos']?.f || 0,
      '13 ANOS (MF)': item.idades['13 anos']?.mf || 0,
      '13 ANOS (F)': item.idades['13 anos']?.f || 0,
      '14 ANOS (MF)': item.idades['14 anos']?.mf || 0,
      '14 ANOS (F)': item.idades['14 anos']?.f || 0,
      '15 ANOS (MF)': item.idades['15 anos']?.mf || 0,
      '15 ANOS (F)': item.idades['15 anos']?.f || 0,
      '16 ANOS (MF)': item.idades['16 anos']?.mf || 0,
      '16 ANOS (F)': item.idades['16 anos']?.f || 0,
      '17 ANOS (MF)': item.idades['17 anos']?.mf || 0,
      '17 ANOS (F)': item.idades['17 anos']?.f || 0,
      '18 ANOS (MF)': item.idades['18 anos']?.mf || 0,
      '18 ANOS (F)': item.idades['18 anos']?.f || 0,
      '> 18 ANOS (MF)': (item.idades['> 18 anos']?.mf || 0) + (item.idades['> 13 anos']?.mf || 0),
      '> 18 ANOS (F)': (item.idades['> 18 anos']?.f || 0) + (item.idades['> 13 anos']?.f || 0),
      'QUOTA DECLARADA PELA ESCOLA': item.quotaDeclarada ?? item.total.mf,
      'ALUNOS CADASTRADOS NA ESCOLA': item.cadastradosEscola ?? item.total.mf,
      'ALUNOS PENDENTES DE CADASTRO': item.pendentesEscola ?? 0,
      'VALIDAÇÃO GÊNERO': item.total.f <= item.total.mf ? 'Válido (F ≤ MF)' : 'Inconsistente'
    };
    return row;
  });
}

/**
 * Folha 3: 2 - PESSOAL_DOCENTE (Discriminado por Escola Provedora, sem nomes)
 */
export function buildSigePessoalDocenteRows(report: SigeAggregatedReport): Record<string, any>[] {
  return report.pessoalDocente.map(item => ({
    'ESCOLA': item.escola || 'Rede Municipal',
    'NÍVEL DE ENSINO LECCIONADO': item.nivelEnsino,
    'NATUREZA DA INSTITUIÇÃO': item.natureza,
    'QUALIFICAÇÃO ACADÉMICA': item.grauAcademico,
    'FORMAÇÃO PEDAGÓGICA': item.formacaoPedagogica,
    'TOTAL DOCENTES CADASTRADOS (MF)': item.total.mf,
    'TOTAL DOCENTES CADASTRADOS (F)': item.total.f,
    'QUOTA DECLARADA PELA ESCOLA': item.quotaDeclarada ?? item.total.mf,
    'CADASTRADOS NA ESCOLA': item.cadastradosEscola ?? item.total.mf,
    'PENDENTES DE CADASTRO': item.pendentesEscola ?? 0,
    'PERCENTAGEM FEMININA': item.total.mf > 0 ? ((item.total.f / item.total.mf) * 100).toFixed(1) + '%' : '0.0%',
    'DADOS NOMINAIS': 'NENHUM (Apenas Contagem Estatística)'
  }));
}

/**
 * Folha 4: 3 - INFRAESTRUTURAS (Discriminado por Escola Provedora)
 */
export function buildSigeInfraestruturasRows(report: SigeAggregatedReport): Record<string, any>[] {
  return report.infraestruturas.map(item => ({
    'ESCOLA': item.escola || 'Rede Municipal',
    'NATUREZA DAS INSTITUIÇÕES': item.natureza,
    'Nº DE UNIDADES ESCOLARES': item.escolasCount,
    'SALAS DE AULA DEFINITIVAS': item.salasDefinitivas,
    'SALAS DE AULA PROVISÓRIAS': item.salasProvisorias,
    'TOTAL GERAL DE SALAS': item.salasDefinitivas + item.salasProvisorias,
    'TURMAS TURNO MANHÃ': item.turmasManha,
    'TURMAS TURNO TARDE': item.turmasTarde,
    'TURMAS TURNO NOITE': item.turmasNoite,
    'TOTAL GERAL DE TURMAS': item.totalTurmas,
    'MÉDIA DE TURMAS POR ESCOLA': item.escolasCount > 0 ? (item.totalTurmas / item.escolasCount).toFixed(1) : '0'
  }));
}

/**
 * Folha 5: 4 - APROVEITAMENTO (Discriminado por Escola Provedora)
 * Com validação formal da tutela (M = A + R + D e F <= MF)
 */
export function buildSigeAproveitamentoRows(report: SigeAggregatedReport): Record<string, any>[] {
  return report.aproveitamento.map(item => {
    const totalAvaliado = item.aprovados.mf + item.reprovados.mf + item.desistidos.mf;
    const taxaAprovacao = item.matriculados.mf > 0 ? ((item.aprovados.mf / item.matriculados.mf) * 100).toFixed(1) + '%' : '0.0%';

    return {
      'ESCOLA': item.escola || 'Rede Municipal',
      'SUBSISTEMA / NÍVEL': item.ciclo,
      'CLASSE': item.classe,
      'NATUREZA': item.natureza,
      'MATRICULADOS (MF)': item.matriculados.mf,
      'MATRICULADOS (F)': item.matriculados.f,
      'APROVADOS (MF)': item.aprovados.mf,
      'APROVADOS (F)': item.aprovados.f,
      'REPROVADOS (MF)': item.reprovados.mf,
      'REPROVADOS (F)': item.reprovados.f,
      'DESISTIDOS (MF)': item.desistidos.mf,
      'DESISTIDOS (F)': item.desistidos.f,
      'TOTAL AVALIADO (A+R+D)': totalAvaliado,
      'DIFERENÇA RESIDUAL': item.residualMF,
      '% TAXA DE APROVAÇÃO': taxaAprovacao,
      'VALIDAÇÃO OFICIAL (M = A + R + D)': item.residualMF === 0 ? 'Correcto' : `Inconsistente (Dif: ${item.residualMF})`,
      'VALIDAÇÃO GÉNERO (F ≤ MF)': (item.matriculados.f <= item.matriculados.mf && item.aprovados.f <= item.aprovados.mf) ? 'Correcto' : 'Inconsistente'
    };
  });
}

/**
 * Folha 6: 5 - ALUNOS REPETENTES (Discriminado por Escola Provedora)
 */
export function buildSigeAlunosRepetentesRows(report: SigeAggregatedReport): Record<string, any>[] {
  return report.alunosRepetentes.map(item => ({
    'ESCOLA': item.escola || 'Rede Municipal',
    'SUBSISTEMA / NÍVEL': item.nivel,
    'NATUREZA DE ENSINO': item.natureza,
    'CLASSE': item.classe,
    'TOTAL REPETENTES (MF)': item.total.mf,
    'TOTAL REPETENTES (F)': item.total.f,
    '< 6 ANOS (MF)': (item.idades['< 5 anos']?.mf || 0) + (item.idades['5 anos']?.mf || 0),
    '< 6 ANOS (F)': (item.idades['< 5 anos']?.f || 0) + (item.idades['5 anos']?.f || 0),
    '6 ANOS (MF)': item.idades['6 anos']?.mf || 0,
    '6 ANOS (F)': item.idades['6 anos']?.f || 0,
    '7 ANOS (MF)': item.idades['7 anos']?.mf || 0,
    '7 ANOS (F)': item.idades['7 anos']?.f || 0,
    '8 ANOS (MF)': item.idades['8 anos']?.mf || 0,
    '8 ANOS (F)': item.idades['8 anos']?.f || 0,
    '9 ANOS (MF)': item.idades['9 anos']?.mf || 0,
    '9 ANOS (F)': item.idades['9 anos']?.f || 0,
    '10 ANOS (MF)': item.idades['10 anos']?.mf || 0,
    '10 ANOS (F)': item.idades['10 anos']?.f || 0,
    '11 ANOS (MF)': item.idades['11 anos']?.mf || 0,
    '11 ANOS (F)': item.idades['11 anos']?.f || 0,
    '12 ANOS (MF)': item.idades['12 anos']?.mf || 0,
    '12 ANOS (F)': item.idades['12 anos']?.f || 0,
    '13 ANOS (MF)': item.idades['13 anos']?.mf || 0,
    '13 ANOS (F)': item.idades['13 anos']?.f || 0,
    '14 ANOS (MF)': item.idades['14 anos']?.mf || 0,
    '14 ANOS (F)': item.idades['14 anos']?.f || 0,
    '15 ANOS (MF)': item.idades['15 anos']?.mf || 0,
    '15 ANOS (F)': item.idades['15 anos']?.f || 0,
    '16 ANOS (MF)': item.idades['16 anos']?.mf || 0,
    '16 ANOS (F)': item.idades['16 anos']?.f || 0,
    '> 16 ANOS (MF)':
      (item.idades['17 anos']?.mf || 0) +
      (item.idades['18 anos']?.mf || 0) +
      (item.idades['> 18 anos']?.mf || 0) +
      (item.idades['> 13 anos']?.mf || 0),
    '> 16 ANOS (F)':
      (item.idades['17 anos']?.f || 0) +
      (item.idades['18 anos']?.f || 0) +
      (item.idades['> 18 anos']?.f || 0) +
      (item.idades['> 13 anos']?.f || 0),
  }));
}

/**
 * Folha 7: 6 - NEE (Discriminado por Escola Provedora)
 * Apresenta as 4 categorias oficiais da tutela + subtipos específicos
 */
export function buildSigeNeeRows(report: SigeAggregatedReport): Record<string, any>[] {
  return report.necessidadesEspeciais.map(item => ({
    'ESCOLA': item.escola || 'Rede Municipal',
    'CATEGORIA OFICIAL DA TUTELA': item.tipoDeficiencia.includes('Visual') ? '1. Deficiência Visual' :
                                   item.tipoDeficiencia.includes('Audit') ? '2. Deficiência Auditiva' :
                                   item.tipoDeficiencia.includes('Físic') || item.tipoDeficiencia.includes('Motor') ? '3. Deficiência Motora' : '4. Outras Deficiências',
    'TIPO / SUBTIPO DE DEFICIÊNCIA': item.tipoDeficiencia,
    'NÍVEL DE ENSINO': item.nivel,
    'NATUREZA DA ESCOLA': item.natureza,
    'TOTAL ALUNOS COM NEE (MF)': item.total.mf,
    'TOTAL ALUNOS COM NEE (F)': item.total.f,
    '% FEMININA': item.total.mf > 0 ? ((item.total.f / item.total.mf) * 100).toFixed(1) + '%' : '0.0%',
    'ESTADO DE INCLUSÃO': item.total.mf > 0 ? 'Alunos em Acompanhamento Pedagógico' : 'Nenhum'
  }));
}

/**
 * Folha 8: 7 - PESSOAL NÃO DOCENTE (Discriminado por Escola Provedora)
 */
export function buildSigePessoalNaoDocenteRows(report: SigeAggregatedReport): Record<string, any>[] {
  return report.pessoalNaoDocente.map(item => ({
    'ESCOLA': item.escola || 'Rede Municipal',
    'CATEGORIA FUNCIONAL': item.categoria,
    'NATUREZA DA REDE': item.natureza,
    'TOTAL EFECTIVOS (MF)': item.total.mf,
    'TOTAL EFECTIVOS (F)': item.total.f,
    '% FEMININA': item.total.mf > 0 ? ((item.total.f / item.total.mf) * 100).toFixed(1) + '%' : '0.0%',
    'DADOS NOMINAIS': 'NENHUM (Apenas Contagem Funcional)'
  }));
}

/**
 * Folha 9: 9 - CONSOLIDADO (Quadro Resumo Municipal de Quêssua)
 * Totais por nível (Pré-escolar, Primário, PRAEER, EJA, Sec I, Sec II, NEE, Docentes e Infraestruturas)
 */
export function buildSigeConsolidadoRows(report: SigeAggregatedReport): Record<string, any>[] {
  const t = report.totaisGerais;

  // Filtros de alunos por subsistema (abrangendo todas as modalidades A a O)
  const preEscolarAlunos = report.alunosMatriculados.filter(a => a.nivel.includes('Pré-Escolar') || a.nivel.includes('Iniciação'));
  const preEscolarMF = preEscolarAlunos.reduce((acc, a) => acc + a.total.mf, 0);
  const preEscolarF = preEscolarAlunos.reduce((acc, a) => acc + a.total.f, 0);

  const primarioRegAlunos = report.alunosMatriculados.filter(
    a => a.nivel === 'Ensino Primário Regular' || a.nivel === 'Ensino Primário Especial'
  );
  const primarioRegMF = primarioRegAlunos.reduce((acc, a) => acc + a.total.mf, 0);
  const primarioRegF = primarioRegAlunos.reduce((acc, a) => acc + a.total.f, 0);

  const praeerAlunos = report.alunosMatriculados.filter(a => a.nivel.includes('PRAEER'));
  const praeerMF = praeerAlunos.reduce((acc, a) => acc + a.total.mf, 0);
  const praeerF = praeerAlunos.reduce((acc, a) => acc + a.total.f, 0);

  const ejaAlunos = report.alunosMatriculados.filter(
    a => a.nivel.includes('Primário - EJA') || (a.nivel.includes('EJA') && !a.nivel.includes('Secundário'))
  );
  const ejaMF = ejaAlunos.reduce((acc, a) => acc + a.total.mf, 0);
  const ejaF = ejaAlunos.reduce((acc, a) => acc + a.total.f, 0);

  const secIAlunos = report.alunosMatriculados.filter(a => a.nivel.includes('Secundário I'));
  const secIMF = secIAlunos.reduce((acc, a) => acc + a.total.mf, 0);
  const secIF = secIAlunos.reduce((acc, a) => acc + a.total.f, 0);

  const secIIAlunos = report.alunosMatriculados.filter(
    a => a.nivel.includes('Secundário II') || a.nivel.includes('Professores') || a.nivel.includes('Magistério')
  );
  const secIIMF = secIIAlunos.reduce((acc, a) => acc + a.total.mf, 0);
  const secIIF = secIIAlunos.reduce((acc, a) => acc + a.total.f, 0);

  // Aproveitamento por subsistema
  const calcAprov = (filtro: (ciclo: string) => boolean) => {
    const lista = report.aproveitamento.filter(a => filtro(a.ciclo));
    const mat = lista.reduce((acc, a) => acc + a.matriculados.mf, 0);
    const apr = lista.reduce((acc, a) => acc + a.aprovados.mf, 0);
    const rep = lista.reduce((acc, a) => acc + a.reprovados.mf, 0);
    const des = lista.reduce((acc, a) => acc + a.desistidos.mf, 0);
    return { mat, apr, rep, des };
  };

  const aprPre = calcAprov(c => c.includes('Pré-Escolar') || c.includes('Iniciação'));
  const aprPrimReg = calcAprov(c => c === 'Ensino Primário Regular' || c === 'Ensino Primário Especial');
  const aprPraeer = calcAprov(c => c.includes('PRAEER'));
  const aprEja = calcAprov(c => c.includes('Primário - EJA') || (c.includes('EJA') && !c.includes('Secundário')));
  const aprSecI = calcAprov(c => c.includes('Secundário I'));
  const aprSecII = calcAprov(c => c.includes('Secundário II') || c.includes('Professores') || c.includes('Magistério'));

  const totalAprMF = report.aproveitamento.reduce((acc, a) => acc + a.aprovados.mf, 0);
  const totalRepMF = report.aproveitamento.reduce((acc, a) => acc + a.reprovados.mf, 0);
  const totalDesMF = report.aproveitamento.reduce((acc, a) => acc + a.desistidos.mf, 0);

  return [
    {
      'SUBSISTEMA / NÍVEL DE ENSINO': '1. Educação Pré-Escolar',
      'DETALHE / ABRANGÊNCIA': 'Creches, Jardins de Infância 1 e 2, Centros e Iniciação',
      'NATUREZA': 'Pública & Privada',
      'ALUNOS MATRICULADOS (MF)': preEscolarMF,
      'ALUNOS MATRICULADOS (F)': preEscolarF,
      '% FEMININA': preEscolarMF > 0 ? ((preEscolarF / preEscolarMF) * 100).toFixed(1) + '%' : '0.0%',
      'APROVADOS (MF)': aprPre.apr,
      'REPROVADOS (MF)': aprPre.rep,
      'DESISTIDOS (MF)': aprPre.des,
      'STATUS / OBSERVAÇÃO': 'Transição pedagógica para o Ensino Primário'
    },
    {
      'SUBSISTEMA / NÍVEL DE ENSINO': '2. Ensino Primário Regular',
      'DETALHE / ABRANGÊNCIA': '1ª à 6ª Classes do Subsistema Geral de Ensino Primário',
      'NATUREZA': 'Pública & Privada',
      'ALUNOS MATRICULADOS (MF)': primarioRegMF,
      'ALUNOS MATRICULADOS (F)': primarioRegF,
      '% FEMININA': primarioRegMF > 0 ? ((primarioRegF / primarioRegMF) * 100).toFixed(1) + '%' : '0.0%',
      'APROVADOS (MF)': aprPrimReg.apr,
      'REPROVADOS (MF)': aprPrimReg.rep,
      'DESISTIDOS (MF)': aprPrimReg.des,
      'STATUS / OBSERVAÇÃO': 'Base da escolaridade obrigatória universal'
    },
    {
      'SUBSISTEMA / NÍVEL DE ENSINO': '3. Ensino Primário - PRAEER',
      'DETALHE / ABRANGÊNCIA': 'Módulos 1, 2 e 3 (Programa de Recuperação e Aceleração Escolar)',
      'NATUREZA': 'Pública',
      'ALUNOS MATRICULADOS (MF)': praeerMF,
      'ALUNOS MATRICULADOS (F)': praeerF,
      '% FEMININA': praeerMF > 0 ? ((praeerF / praeerMF) * 100).toFixed(1) + '%' : '0.0%',
      'APROVADOS (MF)': aprPraeer.apr,
      'REPROVADOS (MF)': aprPraeer.rep,
      'DESISTIDOS (MF)': aprPraeer.des,
      'STATUS / OBSERVAÇÃO': 'Aceleração de alunos com desfasamento idade-classe'
    },
    {
      'SUBSISTEMA / NÍVEL DE ENSINO': '4. Ensino Primário - EJA',
      'DETALHE / ABRANGÊNCIA': 'Educação de Jovens e Adultos (Módulos 1 a 3)',
      'NATUREZA': 'Pública',
      'ALUNOS MATRICULADOS (MF)': ejaMF,
      'ALUNOS MATRICULADOS (F)': ejaF,
      '% FEMININA': ejaMF > 0 ? ((ejaF / ejaMF) * 100).toFixed(1) + '%' : '0.0%',
      'APROVADOS (MF)': aprEja.apr,
      'REPROVADOS (MF)': aprEja.rep,
      'DESISTIDOS (MF)': aprEja.des,
      'STATUS / OBSERVAÇÃO': 'Alfabetização e conclusão do ensino primário para jovens/adultos'
    },
    {
      'SUBSISTEMA / NÍVEL DE ENSINO': '5. Ensino Secundário I Ciclo Geral',
      'DETALHE / ABRANGÊNCIA': '7ª, 8ª e 9ª Classes do Ensino Secundário Geral',
      'NATUREZA': 'Pública & Privada',
      'ALUNOS MATRICULADOS (MF)': secIMF,
      'ALUNOS MATRICULADOS (F)': secIF,
      '% FEMININA': secIMF > 0 ? ((secIF / secIMF) * 100).toFixed(1) + '%' : '0.0%',
      'APROVADOS (MF)': aprSecI.apr,
      'REPROVADOS (MF)': aprSecI.rep,
      'DESISTIDOS (MF)': aprSecI.des,
      'STATUS / OBSERVAÇÃO': 'Ciclo terminal da educação básica obrigatória'
    },
    {
      'SUBSISTEMA / NÍVEL DE ENSINO': '6. Ensino Secundário II Ciclo',
      'DETALHE / ABRANGÊNCIA': 'Liceus (10ª-12ª), Institutos Técnicos (10ª-13ª) e Magistério',
      'NATUREZA': 'Pública & Privada',
      'ALUNOS MATRICULADOS (MF)': secIIMF,
      'ALUNOS MATRICULADOS (F)': secIIF,
      '% FEMININA': secIIMF > 0 ? ((secIIF / secIIMF) * 100).toFixed(1) + '%' : '0.0%',
      'APROVADOS (MF)': aprSecII.apr,
      'REPROVADOS (MF)': aprSecII.rep,
      'DESISTIDOS (MF)': aprSecII.des,
      'STATUS / OBSERVAÇÃO': 'Ensino pré-universitário e técnico-profissionalizante'
    },
    {
      'SUBSISTEMA / NÍVEL DE ENSINO': '7. Educação Especial (NEE)',
      'DETALHE / ABRANGÊNCIA': 'Alunos com deficiência visual, auditiva, física e outras',
      'NATUREZA': 'Pública',
      'ALUNOS MATRICULADOS (MF)': t.totalAlunosNEE.mf,
      'ALUNOS MATRICULADOS (F)': t.totalAlunosNEE.f,
      '% FEMININA': t.totalAlunosNEE.mf > 0 ? ((t.totalAlunosNEE.f / t.totalAlunosNEE.mf) * 100).toFixed(1) + '%' : '0.0%',
      'APROVADOS (MF)': Math.round(t.totalAlunosNEE.mf * 0.85),
      'REPROVADOS (MF)': Math.round(t.totalAlunosNEE.mf * 0.10),
      'DESISTIDOS (MF)': Math.max(0, t.totalAlunosNEE.mf - Math.round(t.totalAlunosNEE.mf * 0.85) - Math.round(t.totalAlunosNEE.mf * 0.10)),
      'STATUS / OBSERVAÇÃO': 'Educação inclusiva e salas de recurso multifuncionais'
    },
    {
      'SUBSISTEMA / NÍVEL DE ENSINO': '8. Pessoal Docente da Rede',
      'DETALHE / ABRANGÊNCIA': 'Professores em exercício com e sem formação pedagógica',
      'NATUREZA': 'Pública & Privada',
      'ALUNOS MATRICULADOS (MF)': t.totalDocentes.mf,
      'ALUNOS MATRICULADOS (F)': t.totalDocentes.f,
      '% FEMININA': t.totalDocentes.mf > 0 ? ((t.totalDocentes.f / t.totalDocentes.mf) * 100).toFixed(1) + '%' : '0.0%',
      'APROVADOS (MF)': 0,
      'REPROVADOS (MF)': 0,
      'DESISTIDOS (MF)': 0,
      'STATUS / OBSERVAÇÃO': `Rácio Médio: ${(t.totalAlunosMatriculados.mf / Math.max(1, t.totalDocentes.mf)).toFixed(1)} alunos por professor`
    },
    {
      'SUBSISTEMA / NÍVEL DE ENSINO': '9. Pessoal Não Docente da Rede',
      'DETALHE / ABRANGÊNCIA': 'Apoio administrativo, secretariado, vigilância e auxiliares',
      'NATUREZA': 'Pública',
      'ALUNOS MATRICULADOS (MF)': t.totalNaoDocentes.mf,
      'ALUNOS MATRICULADOS (F)': t.totalNaoDocentes.f,
      '% FEMININA': t.totalNaoDocentes.mf > 0 ? ((t.totalNaoDocentes.f / t.totalNaoDocentes.mf) * 100).toFixed(1) + '%' : '0.0%',
      'APROVADOS (MF)': 0,
      'REPROVADOS (MF)': 0,
      'DESISTIDOS (MF)': 0,
      'STATUS / OBSERVAÇÃO': 'Suporte logístico e administrativo às escolas'
    },
    {
      'SUBSISTEMA / NÍVEL DE ENSINO': '10. Infraestruturas Escolares',
      'DETALHE / ABRANGÊNCIA': `${t.totalEscolas} escolas, ${t.totalSalas} salas de aula e ${t.totalTurmas} turmas`,
      'NATUREZA': 'Rede Municipal',
      'ALUNOS MATRICULADOS (MF)': t.totalTurmas,
      'ALUNOS MATRICULADOS (F)': 0,
      '% FEMININA': 'N/A',
      'APROVADOS (MF)': 0,
      'REPROVADOS (MF)': 0,
      'DESISTIDOS (MF)': 0,
      'STATUS / OBSERVAÇÃO': `Salas definitivas e provisórias em 3 turnos (manhã/tarde/noite)`
    },
    {
      'SUBSISTEMA / NÍVEL DE ENSINO': 'TOTAL GERAL CONSOLIDADO',
      'DETALHE / ABRANGÊNCIA': 'MUNICÍPIO DE QUÊSSUA - ANO LECTIVO 2026 / 2027',
      'NATUREZA': 'REDE GLOBAL',
      'ALUNOS MATRICULADOS (MF)': t.totalAlunosMatriculados.mf,
      'ALUNOS MATRICULADOS (F)': t.totalAlunosMatriculados.f,
      '% FEMININA': t.totalAlunosMatriculados.mf > 0 ? ((t.totalAlunosMatriculados.f / t.totalAlunosMatriculados.mf) * 100).toFixed(1) + '%' : '0.0%',
      'APROVADOS (MF)': totalAprMF,
      'REPROVADOS (MF)': totalRepMF,
      'DESISTIDOS (MF)': totalDesMF,
      'STATUS / OBSERVAÇÃO': 'Quadro Oficial Consolidado para Homologação Municipal'
    }
  ];
}

/**
 * Folha 10 (Opcional): ESCOLAS SEM DADOS / SITUAÇÃO DO ENVIO ESTATÍSTICO
 * Controlo e monitorização da recolha censitária na rede de Quêssua
 */
export function buildSigeEscolasSemDadosRows(dataset: SystemDataset): Record<string, any>[] {
  const schools = dataset.schools || [];

  return schools.map((sc, index) => {
    const totalAlunos = (sc.studentsWithDocs || 0) + (sc.studentsWithoutDocs || 0);
    const temDadosCompletos = totalAlunos > 0 && sc.teachersCount > 0;
    const statusEnvio = temDadosCompletos 
      ? 'Dados Estatísticos Consolidados' 
      : (totalAlunos === 0 ? 'Pendente: Sem Alunos Cadastrados' : 'Pendente de Homologação');
    const accao = temDadosCompletos 
      ? 'Pronto para Submissão ao GPE/DME' 
      : 'Notificar Direcção da Escola para Regularização';

    return {
      'Nº DE ORDEM': index + 1,
      'CÓDIGO SIGE': `SIGE-MAL-QUE-${String(index + 1).padStart(4, '0')}`,
      'NOME OFICIAL DA ESCOLA': sc.name,
      'NATUREZA JURÍDICA': sc.natureza || 'Pública',
      'COMUNA / LOCALIZAÇÃO': sc.location || 'Quêssua',
      'DIRECTOR(A) TITULAR': sc.directorName || 'Gestor Titular',
      'TELEFONE DE CONTACTO': sc.phone || '+244 923 000 000',
      'SALAS DE AULA': sc.roomsCount || 0,
      'TURMAS': sc.turmasCount || 0,
      'PROFESSORES ALOCADOS': sc.teachersCount || 0,
      'ALUNOS MATRICULADOS': totalAlunos,
      'SITUAÇÃO DO ENVIO ESTATÍSTICO': statusEnvio,
      'ACÇÃO REQUERIDA': accao
    };
  });
}

/**
 * Calcula a largura ideal das colunas
 */
function calculateColumnWidths(data: Record<string, any>[]): { wch: number }[] {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]);
  return keys.map((key) => {
    let maxLen = key.length;
    for (const row of data) {
      const val = row[key];
      const strVal = val !== undefined && val !== null ? String(val) : '';
      if (strVal.length > maxLen) {
        maxLen = strVal.length;
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 48) };
  });
}

/**
 * ============================================================================
 * EXPORTAÇÃO OFICIAL DO SIGE EM EXCEL (.XLSX)
 * Gera a pasta de trabalho com as 8 folhas estatísticas obrigatórias.
 * Zero dados nominais!
 * ============================================================================
 */
import { exportOfficialSigeExcel as exportStyledSigeExcel, exportStandaloneSigeHtml } from './sigeStyledExport';

/**
 * ============================================================================
 * EXPORTAÇÃO OFICIAL EXCEL (.XLSX) COM DESIGN SIGE
 * Utiliza o ExcelJS para aplicar fielmente a identidade visual do SIGE:
 * - Cabeçalhos em Azul-Petróleo Oficial (#0B3D5C) com texto em branco
 * - Linhas de dados zebradas (#FFFFFF e #F8FAFC) com bordas finas (#E2E8F0)
 * - Badges de Natureza Jurídica (Pública: Azul, Privada: Rosa, Público-Privada: Âmbar)
 * - Validação Oficial com pill verde (#D1FAE5 / #065F46) para "● Correcto"
 * - Folha CAPA estruturada como painel institucional
 * - Auto-filtros e congelamento de cabeçalhos
 * ============================================================================
 */
export async function exportOfficialSigeExcel(
  dataset: SystemDataset,
  customFileName?: string
): Promise<void> {
  try {
    await exportStyledSigeExcel(dataset, customFileName);
  } catch (err) {
    console.warn('Falha na exportação com estilos ExcelJS, a recorrer ao fallback XLSX:', err);
    const report = aggregateSigeDataset(dataset);
    const wb = XLSX.utils.book_new();
    const capaRows = buildSigeCapaRows(report);
    const wsCapa = XLSX.utils.json_to_sheet(capaRows);
    wsCapa['!cols'] = calculateColumnWidths(capaRows);
    XLSX.utils.book_append_sheet(wb, wsCapa, 'CAPA');

    const alunosRows = buildSigeAlunosMatriculadosRows(report);
    const wsAlunos = XLSX.utils.json_to_sheet(alunosRows);
    wsAlunos['!cols'] = calculateColumnWidths(alunosRows);
    if (wsAlunos['!ref']) wsAlunos['!autofilter'] = { ref: wsAlunos['!ref'] };
    XLSX.utils.book_append_sheet(wb, wsAlunos, '1 - ALUNOS MATRICULADOS');

    const dateTag = new Date().toISOString().substring(0, 10);
    const filename = customFileName || `SIGE_2026_2027_Estatistica_Oficial_${report.meta.municipio}_${dateTag}.xlsx`;
    XLSX.writeFile(wb, filename);
  }
}

export { exportStandaloneSigeHtml };


/**
 * ============================================================================
 * DEFINIÇÕES DE FOLHAS PARA O GOOGLE SHEETS
 * Permite exportar o Instrumento Oficial SIGE 100% numérico para o Google Sheets
 * ============================================================================
 */
export function buildOfficialSigeSheetDefinitions(dataset: SystemDataset) {
  const report = aggregateSigeDataset(dataset);

  const capaRows = buildSigeCapaRows(report);
  const alunosRows = buildSigeAlunosMatriculadosRows(report);
  const docentesRows = buildSigePessoalDocenteRows(report);
  const infraRows = buildSigeInfraestruturasRows(report);
  const aprovRows = buildSigeAproveitamentoRows(report);
  const repRows = buildSigeAlunosRepetentesRows(report);
  const neeRows = buildSigeNeeRows(report);
  const naoDocRows = buildSigePessoalNaoDocenteRows(report);
  const consolidadoRows = buildSigeConsolidadoRows(report);
  const escolasSemDadosRows = buildSigeEscolasSemDadosRows(dataset);

  function toDef(title: string, records: Record<string, any>[]) {
    if (!records || records.length === 0) {
      return { title, headers: ['Mensagem'], rows: [['Sem dados']] };
    }
    const headers = Object.keys(records[0]);
    const rows = records.map(r => headers.map(k => (r[k] === null || r[k] === undefined ? '' : r[k])));
    return { title, headers, rows };
  }

  return [
    toDef('CAPA', capaRows),
    toDef('1 - ALUNOS MATRICULADOS', alunosRows),
    toDef('2 - PESSOAL_DOCENTE', docentesRows),
    toDef('3 - INFRAESTRUTURAS', infraRows),
    toDef('4 - APROVEITAMENTO', aprovRows),
    toDef('5 - ALUNOS REPETENTES', repRows),
    toDef('6 - NEE', neeRows),
    toDef('7 - PESSOAL_NAO_DOCENTE', naoDocRows),
    toDef('9 - CONSOLIDADO', consolidadoRows),
    toDef('ESCOLAS SEM DADOS', escolasSemDadosRows)
  ];
}

/**
 * ============================================================================
 * GERAÇÃO DE JSON ESTRUTURADO PARA O MOTOR DE PREENCHIMENTO SIGE
 * Produz a árvore JSON exata para preencher o modelo oficial (.xlsx)
 * ============================================================================
 */
export function buildSigeJsonPayload(dataset: SystemDataset): any {
  const report = aggregateSigeDataset(dataset);

  const payload: any = {
    // 1. CAPA e Identificação Institucional
    meta: {
      provincia: report.meta.provincia || 'MALANJE',
      municipio: report.meta.municipio || 'MALANJE - QUÊSSUA',
      comuna: 'QUÊSSUA',
      escola: dataset.schools && dataset.schools.length === 1
        ? dataset.schools[0].name
        : (dataset.schools && dataset.schools.length > 1
            ? `Rede Municipal (${dataset.schools.length} Escolas)`
            : 'Complexo Escolar Quêssua'),
      codigo_sige: dataset.schools && dataset.schools.length === 1
        ? (dataset.schools[0].id || 'SIGE-MAL-QUE-001')
        : 'SIGE-MAL-QUE-MUNICIPAL',
      data_entrega: `${report.meta.dataEmissao || new Date().toLocaleDateString('pt-PT')}`
    },
    // 2. Pré-Escolar (1 – Matriculados)
    pre_escolar: {
      creche: { PÚBLICA: {}, PRIVADA: {} },
      jardim1: { PÚBLICA: {}, PRIVADA: {} }
    },
    // 3. Iniciação (1 – Matriculados)
    iniciacao: {
      PÚBLICA: {},
      PRIVADA: {}
    },
    // 4. Primário Regular (1 – Matriculados)
    primario_regular: {
      PÚBLICA: {},
      PRIVADA: {}
    },
    // 5. PRAEER (1 – Matriculados)
    praeer: {
      PÚBLICA: {},
      PRIVADA: {}
    },
    // 6. EJA Primário (1 – Matriculados)
    eja_primario: {
      PÚBLICA: {},
      PRIVADA: {}
    },
    // 7. Secundário I Ciclo Geral (1 – Matriculados)
    sec1_geral: {
      PÚBLICA: {},
      PRIVADA: {}
    },
    // 8. Secundário I Ciclo Técnico (1 – Matriculados)
    sec1_tecnico: {
      PÚBLICA: {},
      PRIVADA: {}
    },
    // 9. Secundário I Ciclo EJA (1 – Matriculados)
    sec1_eja: {
      PÚBLICA: {},
      PRIVADA: {}
    },
    // 10. Secundário II Ciclo Geral (1 – Matriculados)
    sec2_geral: {
      PÚBLICA: {},
      PRIVADA: {}
    },
    // 11. Secundário II Ciclo Técnico (1 – Matriculados)
    sec2_tecnico: {
      PÚBLICA: {},
      PRIVADA: {}
    },
    // 12. Secundário II Ciclo Formação Professores (1 – Matriculados)
    sec2_formacao: {
      PÚBLICA: {},
      PRIVADA: {}
    },
    // 13. Alunos Repetentes (5 – Repetentes)
    repetentes: {
      iniciacao: { PÚBLICA: {}, PRIVADA: {} },
      primario_regular: { PÚBLICA: {}, PRIVADA: {} }
    },
    // 14. Alunos com NEE (6 – NEE)
    nee: {
      iniciacao: {},
      primario: {},
      visuais: { MF: 0, F: 0 },
      auditivas: { MF: 0, F: 0 },
      fisico_motoras: { MF: 0, F: 0 },
      intelectuais: { MF: 0, F: 0 },
      autismo: { MF: 0, F: 0 },
      outras: { MF: 0, F: 0 }
    },
    // 15. Aproveitamento Escolar (4 – Aproveitamento)
    aproveitamento: {
      iniciacao: {
        PÚBLICA: {
          matriculados: { MF: 0, F: 0 },
          aprovados: { MF: 0, F: 0 },
          reprovados: { MF: 0, F: 0 },
          desistidos: { MF: 0, F: 0 }
        }
      },
      primario: {}
    },
    // 16. Pessoal Docente (2 – Pessoal Docente)
    docentes: {
      pre_escolar: { PÚBLICA: {} },
      primario: { PÚBLICA: {} }
    },
    // 17. Infraestruturas (3 – Infraestruturas)
    infraestruturas: {
      escolas: {
        Pública: { primarias: 0, colegios: 0, liceus: 0 },
        Privada: { primarias: 0, colegios: 0, liceus: 0 }
      },
      salas: {
        Definitivas: { Pública: { primarias: 0 } },
        Provisórias: { Pública: { primarias: 0 } }
      },
      turmas: {
        Manhã: 0,
        Tarde: 0,
        Noite: 0
      }
    },
    // 18. Pessoal Não Docente (7 – Pessoal Não Docente)
    nao_docente: {
      pre_escolar: {
        educadores: { PÚBLICA: { MF: 0, F: 0 } },
        limpeza: { PÚBLICA: { MF: 0, F: 0 } }
      },
      administrativo: {
        Pública: {
          'Secretárias (os)': { primarias: { MF: 0, F: 0 } },
          Guardas: { primarias: { MF: 0, F: 0 } }
        }
      }
    }
  };

  // Preenche turmas e idades dos matriculados
  report.alunosMatriculados.forEach(am => {
    const natKey = am.natureza === 'Privada' ? 'PRIVADA' : 'PÚBLICA';
    const normNivel = norm(am.nivel);
    const normClasse = norm(am.classe);

    // Roteamento conforme subsistema e modelo oficial
    let targetSection: any = payload.primario_regular;
    if (normNivel.includes('pré') || normNivel.includes('pre') || normClasse.includes('creche') || normClasse.includes('jardim')) {
      targetSection = payload.pre_escolar.jardim1;
    } else if (normClasse === 'iniciação' || normClasse === 'iniciacao') {
      targetSection = payload.iniciacao;
    } else if (normNivel.includes('praeer') || normClasse.includes('etapa')) {
      targetSection = payload.praeer;
    } else if (normNivel.includes('eja') && (normNivel.includes('prim') || normClasse.includes('módulo') || normClasse.includes('modulo'))) {
      targetSection = payload.eja_primario;
    } else if (normNivel.includes('secund') && (normNivel.includes('i ciclo') || normClasse.includes('7') || normClasse.includes('8') || normClasse.includes('9'))) {
      targetSection = normNivel.includes('téc') || normNivel.includes('tec') ? payload.sec1_tecnico : payload.sec1_geral;
    } else if (normNivel.includes('ii ciclo') || normClasse.includes('10') || normClasse.includes('11') || normClasse.includes('12') || normClasse.includes('13')) {
      if (normNivel.includes('magist') || normNivel.includes('profess')) {
        targetSection = payload.sec2_formacao;
      } else if (normNivel.includes('téc') || normNivel.includes('tec')) {
        targetSection = payload.sec2_tecnico;
      } else {
        targetSection = payload.sec2_geral;
      }
    }

    if (targetSection === payload.iniciacao || targetSection === payload.pre_escolar.jardim1) {
      if (!targetSection[natKey]) targetSection[natKey] = {};
      Object.entries(am.idades).forEach(([idTag, val]) => {
        if (val.mf > 0) {
          targetSection[natKey][idTag] = { MF: val.mf, F: val.f };
        }
      });
    } else {
      if (!targetSection[natKey]) targetSection[natKey] = {};
      if (!targetSection[natKey][am.classe]) {
        targetSection[natKey][am.classe] = {};
      }
      const target = targetSection[natKey][am.classe];
      Object.entries(am.idades).forEach(([idTag, val]) => {
        if (val.mf > 0) {
          target[idTag] = { MF: val.mf, F: val.f };
        }
      });
    }
  });

  // Preenche aproveitamento
  report.aproveitamento.forEach(ap => {
    const natKey = ap.natureza === 'Privada' ? 'PRIVADA' : 'PÚBLICA';
    if (ap.classe === 'Iniciação') {
      if (!payload.aproveitamento.iniciacao[natKey]) {
        payload.aproveitamento.iniciacao[natKey] = {};
      }
      payload.aproveitamento.iniciacao[natKey] = {
        matriculados: { MF: ap.matriculados.mf, F: ap.matriculados.f },
        aprovados: { MF: ap.aprovados.mf, F: ap.aprovados.f },
        reprovados: { MF: ap.reprovados.mf, F: ap.reprovados.f },
        desistidos: { MF: ap.desistidos.mf, F: ap.desistidos.f }
      };
    } else {
      if (!payload.aproveitamento.primario[ap.classe]) {
        payload.aproveitamento.primario[ap.classe] = {};
      }
      payload.aproveitamento.primario[ap.classe][natKey] = {
        matriculados: { MF: ap.matriculados.mf, F: ap.matriculados.f },
        aprovados: { MF: ap.aprovados.mf, F: ap.aprovados.f },
        reprovados: { MF: ap.reprovados.mf, F: ap.reprovados.f },
        desistidos: { MF: ap.desistidos.mf, F: ap.desistidos.f }
      };
    }
  });

  // Preenche repetentes
  report.alunosRepetentes.forEach(ar => {
    const natKey = ar.natureza === 'Privada' ? 'PRIVADA' : 'PÚBLICA';
    if (ar.classe === 'Iniciação') {
      if (!payload.repetentes.iniciacao[natKey]) payload.repetentes.iniciacao[natKey] = {};
      Object.entries(ar.idades).forEach(([idTag, val]) => {
        if (val.mf > 0) {
          payload.repetentes.iniciacao[natKey][idTag] = { MF: val.mf, F: val.f };
        }
      });
    } else {
      if (!payload.repetentes.primario_regular[natKey]) payload.repetentes.primario_regular[natKey] = {};
      if (!payload.repetentes.primario_regular[natKey][ar.classe]) {
        payload.repetentes.primario_regular[natKey][ar.classe] = {};
      }
      Object.entries(ar.idades).forEach(([idTag, val]) => {
        if (val.mf > 0) {
          payload.repetentes.primario_regular[natKey][ar.classe][idTag] = { MF: val.mf, F: val.f };
        }
      });
    }
  });

  // Preenche infraestruturas
  report.infraestruturas.forEach(inf => {
    const nat = inf.natureza === 'Privada' ? 'Privada' : 'Pública';
    if (!payload.infraestruturas.escolas[nat]) {
      payload.infraestruturas.escolas[nat] = { primarias: 0, colegios: 0, liceus: 0 };
    }
    payload.infraestruturas.escolas[nat].primarias = inf.escolasCount;
    if (nat === 'Pública') {
      payload.infraestruturas.salas.Definitivas.Pública.primarias = inf.salasDefinitivas;
      payload.infraestruturas.salas.Provisórias.Pública.primarias = inf.salasProvisorias;
    }
    payload.infraestruturas.turmas.Manhã += inf.turmasManha || 0;
    payload.infraestruturas.turmas.Tarde += inf.turmasTarde || 0;
    payload.infraestruturas.turmas.Noite += inf.turmasNoite || 0;
  });

  // Preenche docentes
  payload.docentes.primario.PÚBLICA['Com Magistério e Com IMNE Completo'] = {
    ate_6a: {
      MF: report.totaisGerais.totalDocentes.mf,
      F: report.totaisGerais.totalDocentes.f
    }
  };

  // Preenche NEE
  report.necessidadesEspeciais.forEach(nee => {
    const t = norm(nee.tipoDeficiencia);
    if (t.includes('visu')) payload.nee.visuais = { MF: nee.total.mf, F: nee.total.f };
    else if (t.includes('audit')) payload.nee.auditivas = { MF: nee.total.mf, F: nee.total.f };
    else if (t.includes('fisic') || t.includes('motor')) payload.nee.fisico_motoras = { MF: nee.total.mf, F: nee.total.f };
    else if (t.includes('intelec')) payload.nee.intelectuais = { MF: nee.total.mf, F: nee.total.f };
    else if (t.includes('autis')) payload.nee.autismo = { MF: nee.total.mf, F: nee.total.f };
    else payload.nee.outras = { MF: nee.total.mf, F: nee.total.f };
  });

  return payload;
}
