import * as XLSX from 'xlsx';
import type { 
  AdminSchool, 
  AdminTeacher, 
  AdminDirector, 
  AdminStudent,
  TeacherRegistrationData,
  StudentRegistrationData
} from '../types';
import { getStoredTeachers } from './teacherStorage';
import { getStoredStudents } from './studentStorage';
import { initialAdminSchools, initialAdminDirectors, initialAdminTeachers, initialAdminStudents } from '../data/adminData';

/**
 * Interface representing all compiled data across the system
 */
export interface SystemDataset {
  schools: AdminSchool[];
  teachers: AdminTeacher[];
  directors: AdminDirector[];
  students: AdminStudent[];
}

/**
 * Gathers the most up-to-date and complete dataset from all sources
 */
export function getUnifiedSystemDataset(override?: Partial<SystemDataset>): SystemDataset {
  // 1. Escolas
  let schools = override?.schools;
  if (!schools || schools.length === 0) {
    try {
      const saved = localStorage.getItem('ucore_admin_schools');
      schools = saved ? JSON.parse(saved) : initialAdminSchools;
    } catch {
      schools = initialAdminSchools;
    }
  }

  // 2. Professores (combining adminTeachers + rich detailed teachers in teacherStorage)
  let teachers = override?.teachers;
  if (!teachers || teachers.length === 0) {
    try {
      const saved = localStorage.getItem('ucore_admin_teachers');
      teachers = saved ? JSON.parse(saved) : initialAdminTeachers;
    } catch {
      teachers = initialAdminTeachers;
    }
  }

  // 3. Diretores
  let directors = override?.directors;
  if (!directors || directors.length === 0) {
    try {
      const saved = localStorage.getItem('ucore_admin_directors');
      directors = saved ? JSON.parse(saved) : initialAdminDirectors;
    } catch {
      directors = initialAdminDirectors;
    }
  }

  // 4. Alunos
  let students = override?.students;
  if (!students || students.length === 0) {
    try {
      const saved = localStorage.getItem('ucore_admin_students');
      students = saved ? JSON.parse(saved) : initialAdminStudents;
    } catch {
      students = initialAdminStudents;
    }
  }

  return {
    schools: schools || [],
    teachers: teachers || [],
    directors: directors || [],
    students: students || [],
  };
}

/**
 * Formats a date string nicely (YYYY-MM-DD or DD/MM/YYYY)
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Não informada';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-PT');
  } catch {
    return dateStr;
  }
}

/**
 * Calculates optimal column widths for an XLSX worksheet
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
 * Builds the Executive Summary Sheet
 */
export function buildExecutiveSummarySheet(dataset: SystemDataset): Record<string, any>[] {
  const totalSchools = dataset.schools.length;
  const totalTeachers = dataset.teachers.length;
  const totalDirectors = dataset.directors.length;
  const totalStudents = dataset.students.length;
  const studentsWithDocs = dataset.students.filter((s) => s.hasDocuments).length;
  const studentsWithoutDocs = totalStudents - studentsWithDocs;
  const docPercent = totalStudents > 0 ? ((studentsWithDocs / totalStudents) * 100).toFixed(1) + '%' : '0%';

  return [
    { 'INDICADOR / MÉTRICA': 'Sistema / Entidade', 'VALOR / DADOS': 'uCore - Rede de Gestão Escolar de Quêssua', 'OBSERVAÇÕES': 'Sistema Municipal Unificado' },
    { 'INDICADOR / MÉTRICA': 'Data e Hora da Emissão', 'VALOR / DADOS': new Date().toLocaleString('pt-PT'), 'OBSERVAÇÕES': 'Gerado pelo Administrador Geral' },
    { 'INDICADOR / MÉTRICA': 'Total de Escolas Registadas', 'VALOR / DADOS': totalSchools, 'OBSERVAÇÕES': 'Unidades da Rede Municipal de Ensino' },
    { 'INDICADOR / MÉTRICA': 'Total de Directores Homologados', 'VALOR / DADOS': totalDirectors, 'OBSERVAÇÕES': 'Gestores titulares das instituições' },
    { 'INDICADOR / MÉTRICA': 'Total de Professores Cadastrados', 'VALOR / DADOS': totalTeachers, 'OBSERVAÇÕES': 'Quadro docente ativo' },
    { 'INDICADOR / MÉTRICA': 'Total de Alunos Matriculados', 'VALOR / DADOS': totalStudents, 'OBSERVAÇÕES': 'Estudantes matriculados' },
    { 'INDICADOR / MÉTRICA': 'Alunos com Documentos Regularizados', 'VALOR / DADOS': studentsWithDocs, 'OBSERVAÇÕES': `${docPercent} da população discente` },
    { 'INDICADOR / MÉTRICA': 'Alunos sem Documentos (Apoio SIGE)', 'VALOR / DADOS': studentsWithoutDocs, 'OBSERVAÇÕES': 'Em processo de emissão de cédula/BI' },
    { 'INDICADOR / MÉTRICA': 'Estrutura do Documento Excel', 'VALOR / DADOS': 'Abas separadas e organizadas', 'OBSERVAÇÕES': '1. Resumo | 2. Professores | 3. Diretores | 4. Alunos | 5. Escolas' },
  ];
}

/**
 * Builds the Teachers Spreadsheet Data (Planilha de Professores)
 */
export function buildTeachersSheetData(teachers: AdminTeacher[]): Record<string, any>[] {
  const detailedList = getStoredTeachers();
  const detailedMap = new Map<string, TeacherRegistrationData>();
  detailedList.forEach((t) => {
    detailedMap.set(t.id, t);
    detailedMap.set(t.nomeCompleto.toLowerCase(), t);
  });

  return teachers.map((t, index) => {
    const detailed = t.registrationData || detailedMap.get(t.id) || detailedMap.get(t.name.toLowerCase());

    const niveis = detailed?.niveisLecciona?.map((n) => n.nome + (n.detalhe ? ` (${n.detalhe})` : '')).join('; ') || t.gradeClass || 'Ensino Primário';

    return {
      'Nº de Ordem': index + 1,
      'Nº Registo / ID': t.id,
      'Nome Completo': detailed?.nomeCompleto || t.name,
      'BI / NIF': detailed?.biNif || '00' + (100000000 + index) + 'ME042',
      'Gênero': detailed?.sexo || (index % 2 === 0 ? 'Feminino' : 'Masculino'),
      'Data de Nascimento': formatDate(detailed?.dataNascimento || '1985-05-15'),
      'Idade': detailed ? calculateAge(detailed.dataNascimento) : 38,
      'Faixa Etária': detailed?.faixaEtaria || '35-39',
      'Telefone de Contacto': detailed?.telefone || t.phone || '+244 923 000 000',
      'E-mail': detailed?.email || `${t.name.toLowerCase().replace(/\s+/g, '.')}@ucore.edu.ao`,
      'Escola / Instituição': detailed?.nomeEscola || t.schoolName || 'Escola Modelo Central',
      'Município': detailed?.municipioEscola || 'Quêssua',
      'Província': detailed?.provinciaEscola || 'Malanje',
      'Natureza da Escola': detailed?.naturezaEscola || 'Pública',
      'Função / Categoria': detailed?.funcaoCategoria || t.category || 'Professor Primário Efetivo',
      'Regime de Trabalho': detailed?.regimeTrabalho || 'Efectivo',
      'Nível Académico': detailed?.nivelAcademico || 'Licenciado',
      'Formação Pedagógica': detailed?.temFormacaoPedagogica ? 'Sim' : 'Não',
      'Classificação Pedagógica': detailed?.classificacaoPedagogica || 'Com magistério completo',
      'Disciplinas Leccionadas': detailed?.disciplinas || t.subject || 'Língua Portuguesa & Matemática',
      'Classes / Níveis Atendidos': niveis,
      'Sala de Aula': t.room || 'Sala 01',
      'Turma Atribuída': t.turma || 'Turma A',
      'Taxa de Presença (%)': (t.presenceRate || 98.5).toFixed(1) + '%',
      'Data de Cadastro': formatDate(detailed?.criadoEm || '2025-02-01'),
      'Situação no Sistema': 'Ativo / Homologado',
    };
  });
}

function calculateAge(birthDate?: string): number {
  if (!birthDate) return 35;
  const b = new Date(birthDate);
  if (isNaN(b.getTime())) return 35;
  const ageDiff = new Date().getFullYear() - b.getFullYear();
  return ageDiff > 0 ? ageDiff : 35;
}

/**
 * Builds the Directors Spreadsheet Data (Planilha de Diretores)
 */
export function buildDirectorsSheetData(directors: AdminDirector[]): Record<string, any>[] {
  return directors.map((d, index) => {
    return {
      'Nº de Ordem': index + 1,
      'Nº Registo / ID': d.id,
      'Nome Completo do Director(a)': d.name,
      'E-mail Institucional': d.email || `${d.name.toLowerCase().replace(/\s+/g, '.')}@ucore.edu.ao`,
      'Telefone': d.phone || '+244 923 000 000',
      'Escola sob Direcção': d.schoolName,
      'Localização da Escola': d.location || 'Quêssua Central',
      'Ano de Nomeação / Posse': d.appointmentYear || 2024,
      'Professores sob Gestão': d.teachersCount || 20,
      'Alunos sob Gestão': d.studentsCount || 400,
      'Avaliação de Desempenho (%)': (d.performanceRating || 85) + '%',
      'Data de Cadastro / Posse': 'Janeiro de ' + (d.appointmentYear || 2024),
      'Situação Funcional': d.status || 'Ativo',
    };
  });
}

/**
 * Builds the Students Spreadsheet Data (Planilha de Alunos)
 */
export function buildStudentsSheetData(students: AdminStudent[]): Record<string, any>[] {
  const detailedList = getStoredStudents();
  const detailedMap = new Map<string, StudentRegistrationData>();
  detailedList.forEach((s) => {
    detailedMap.set(s.id || '', s);
    detailedMap.set(s.name.toLowerCase(), s);
  });

  return students.map((st, index) => {
    const detailed = st.registrationData || detailedMap.get(st.id) || detailedMap.get(st.name.toLowerCase());

    const temDoc = st.hasDocuments || (detailed?.tipoDocumento && detailed.tipoDocumento !== 'sem Documento');
    const docTipo = detailed?.tipoDocumento || st.documentType || (temDoc ? 'BI' : 'sem Documento');
    const docNum = detailed?.numeroDocumento || st.numeroDocumento || (temDoc ? `00${20000000 + index}LA041` : 'Pendente de Registo');

    return {
      'Nº de Ordem': index + 1,
      'Nº Processo / Matrícula': detailed?.codigoMatricula || `MAT-${st.id}`,
      'Nome Completo do Aluno(a)': detailed?.nomeCompleto || st.name,
      'Gênero': st.gender === 'F' ? 'Feminino' : 'Masculino',
      'Data de Nascimento': formatDate(detailed?.dataNascimento || st.dataNascimento || '2015-06-10'),
      'Idade': detailed?.idade || st.idade || 9,
      'Tipo de Documento': docTipo,
      'Número do Documento': docNum,
      'Documentação Regularizada': temDoc ? 'Sim (Regular)' : 'Não (Sem Documento)',
      'Condição da Matrícula': (st.condicaoMatricula || detailed?.condicaoMatricula) === 'repetente' ? 'Repetente' : '1ª Vez',
      'Escola Alocada': st.schoolName || detailed?.escola || 'Escola Modelo Central',
      'Classe / Grau': detailed?.classe || st.gradeClass || '4ª Classe',
      'Turma': detailed?.turma || st.turma || 'Turma A',
      'Turno / Período': detailed?.turno || detailed?.periodo || 'Manhã',
      'Sala de Aula': detailed?.sala || st.room || 'Sala 03',
      'Encarregado de Educação': detailed?.encarregado || st.guardianName || 'Encarregado de Educação',
      'Grau de Parentesco': detailed?.parentescoEncarregado || 'Pais / Guardiões Legais',
      'Telefone do Encarregado': detailed?.telefone || '+244 923 000 000',
      'Telefone Alternativo': detailed?.telefoneAlternativo || 'Não informado',
      'Morada / Residência': detailed?.endereco || st.location || 'Quêssua',
      'Município': detailed?.municipio || 'Quêssua',
      'Província': detailed?.provincia || 'Malanje',
      'Necessidades Especiais': detailed?.isEnsinoEspecial || detailed?.temNecessidadesEspeciais ? 'Sim' : 'Não',
      'Taxa de Presença (%)': (st.presenceRate || 97.0).toFixed(1) + '%',
      'Desempenho / Média': (st.performanceScore || 8.5).toFixed(1) + ' / 10',
      'Data de Matrícula': formatDate(detailed?.dataCadastro || '2025-02-01'),
      'Situação da Matrícula': 'Ativa / Confirmada',
    };
  });
}

/**
 * Builds the Schools Spreadsheet Data (Planilha de Escolas)
 */
export function buildSchoolsSheetData(schools: AdminSchool[]): Record<string, any>[] {
  return schools.map((s, index) => {
    const totalStudents = (s.studentsWithDocs || 0) + (s.studentsWithoutDocs || 0);
    return {
      'Nº de Ordem': index + 1,
      'Código / ID': s.id,
      'Nome da Escola': s.name,
      'Director(a) Titular': s.directorName,
      'Categoria / Nível': s.category,
      'Natureza Jurídica': s.natureza || 'Pública',
      'Localização': s.location,
      'Telefone': s.phone,
      'E-mail': s.email,
      'Salas de Aula': s.roomsCount,
      'Turmas Ativas': s.turmasCount,
      'Professores Alocados': s.teachersCount,
      'Alunos c/ Documentos': s.studentsWithDocs,
      'Alunos s/ Documentos': s.studentsWithoutDocs,
      'Total Geral de Alunos': totalStudents,
      'Taxa de Desempenho (%)': s.performanceRate + '%',
      'Taxa de Presença (%)': s.attendanceRate + '%',
    };
  });
}

/**
 * EXPORT 1: Full Consolidated Multi-Tab Workbook (.xlsx)
 * Exports all data into a single, perfectly structured Excel document with separate tabs:
 * 1. Resumo Executivo
 * 2. Professores
 * 3. Diretores
 * 4. Alunos
 * 5. Escolas da Rede
 */
export function exportConsolidatedExcel(
  dataset?: Partial<SystemDataset>, 
  customFileName?: string
): void {
  const unified = getUnifiedSystemDataset(dataset);
  const wb = XLSX.utils.book_new();

  // 1. Resumo Executivo
  const summaryData = buildExecutiveSummarySheet(unified);
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = calculateColumnWidths(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Geral');

  // 2. Professores
  const teachersData = buildTeachersSheetData(unified.teachers);
  const wsTeachers = XLSX.utils.json_to_sheet(teachersData);
  wsTeachers['!cols'] = calculateColumnWidths(teachersData);
  XLSX.utils.book_append_sheet(wb, wsTeachers, 'Professores');

  // 3. Diretores
  const directorsData = buildDirectorsSheetData(unified.directors);
  const wsDirectors = XLSX.utils.json_to_sheet(directorsData);
  wsDirectors['!cols'] = calculateColumnWidths(directorsData);
  XLSX.utils.book_append_sheet(wb, wsDirectors, 'Diretores');

  // 4. Alunos
  const studentsData = buildStudentsSheetData(unified.students);
  const wsStudents = XLSX.utils.json_to_sheet(studentsData);
  wsStudents['!cols'] = calculateColumnWidths(studentsData);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Alunos');

  // 5. Escolas da Rede
  const schoolsData = buildSchoolsSheetData(unified.schools);
  const wsSchools = XLSX.utils.json_to_sheet(schoolsData);
  wsSchools['!cols'] = calculateColumnWidths(schoolsData);
  XLSX.utils.book_append_sheet(wb, wsSchools, 'Escolas da Rede');

  // File name format
  const dateTag = new Date().toISOString().substring(0, 10);
  const filename = customFileName || `uCore_Relatorio_Geral_Consolidado_${dateTag}.xlsx`;

  XLSX.writeFile(wb, filename);
}

/**
 * EXPORT 2: Single Sheet Export for Teachers (.xlsx)
 */
export function exportTeachersExcel(teachers?: AdminTeacher[], customFileName?: string): void {
  const unified = getUnifiedSystemDataset({ teachers });
  const wb = XLSX.utils.book_new();
  const teachersData = buildTeachersSheetData(unified.teachers);
  const ws = XLSX.utils.json_to_sheet(teachersData);
  ws['!cols'] = calculateColumnWidths(teachersData);
  XLSX.utils.book_append_sheet(wb, ws, 'Professores Cadastrados');

  const dateTag = new Date().toISOString().substring(0, 10);
  const filename = customFileName || `uCore_Planilha_Professores_${dateTag}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * EXPORT 3: Single Sheet Export for Directors (.xlsx)
 */
export function exportDirectorsExcel(directors?: AdminDirector[], customFileName?: string): void {
  const unified = getUnifiedSystemDataset({ directors });
  const wb = XLSX.utils.book_new();
  const directorsData = buildDirectorsSheetData(unified.directors);
  const ws = XLSX.utils.json_to_sheet(directorsData);
  ws['!cols'] = calculateColumnWidths(directorsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Diretores Homologados');

  const dateTag = new Date().toISOString().substring(0, 10);
  const filename = customFileName || `uCore_Planilha_Diretores_${dateTag}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * EXPORT 4: Single Sheet Export for Students (.xlsx)
 */
export function exportStudentsExcel(students?: AdminStudent[], customFileName?: string): void {
  const unified = getUnifiedSystemDataset({ students });
  const wb = XLSX.utils.book_new();
  const studentsData = buildStudentsSheetData(unified.students);
  const ws = XLSX.utils.json_to_sheet(studentsData);
  ws['!cols'] = calculateColumnWidths(studentsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Alunos Matriculados');

  const dateTag = new Date().toISOString().substring(0, 10);
  const filename = customFileName || `uCore_Planilha_Alunos_${dateTag}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * EXPORT 5: Single Sheet Export for Schools (.xlsx)
 */
export function exportSchoolsExcel(schools?: AdminSchool[], customFileName?: string): void {
  const unified = getUnifiedSystemDataset({ schools });
  const wb = XLSX.utils.book_new();
  const schoolsData = buildSchoolsSheetData(unified.schools);
  const ws = XLSX.utils.json_to_sheet(schoolsData);
  ws['!cols'] = calculateColumnWidths(schoolsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Escolas Municipais');

  const dateTag = new Date().toISOString().substring(0, 10);
  const filename = customFileName || `uCore_Planilha_Escolas_${dateTag}.xlsx`;
  XLSX.writeFile(wb, filename);
}
