import type { AdminSchool, AdminTeacher, AdminStudent, AdminDirector } from '../types';
import type { AdvancedFilterCriteria } from '../types/filterTypes';

export interface FilterResultStats {
  filteredSchools: AdminSchool[];
  filteredTeachers: AdminTeacher[];
  filteredStudents: AdminStudent[];
  filteredDirectors: AdminDirector[];
  uniqueTurmasCount: number;
  totalStudents: number;
  totalTeachers: number;
  totalSchools: number;
  totalDirectors: number;
  contextLabel: string;
  feedbackText: string;
  activeFilterCount: number;
  activeChips: { key: keyof AdvancedFilterCriteria | string; label: string; value: string }[];
}

/**
 * Checks if a given student matches the criteria
 */
export function matchesStudent(student: AdminStudent, filters: AdvancedFilterCriteria, schoolNameMap: Map<string, string>): boolean {
  // 1. Escola
  if (filters.schools.length > 0 && !filters.schools.includes('all')) {
    const studentSchool = (student.schoolName || student.registrationData?.escola || '').trim().toLowerCase();
    const matchesAny = filters.schools.some((scId) => {
      const targetName = (schoolNameMap.get(scId) || scId).trim().toLowerCase();
      return studentSchool.includes(targetName) || targetName.includes(studentSchool);
    });
    if (!matchesAny) return false;
  }

  // 2. Classe
  if (filters.gradeClass !== 'all') {
    const sClass = (student.gradeClass || student.registrationData?.classe || '').trim().toLowerCase();
    const fClass = filters.gradeClass.trim().toLowerCase();
    if (!sClass.includes(fClass) && !fClass.includes(sClass)) return false;
  }

  // 3. Turma
  if (filters.turma !== 'all') {
    const sTurma = (student.turma || student.registrationData?.turma || '').trim().toLowerCase();
    const fTurma = filters.turma.trim().toLowerCase();
    if (sTurma !== fTurma) return false;
  }

  // 4. Turno
  if (filters.shift !== 'all') {
    const sTurno = (student.registrationData?.turno || student.registrationData?.periodo || 'Manhã').trim().toLowerCase();
    const fTurno = filters.shift.trim().toLowerCase();
    if (!sTurno.includes(fTurno)) return false;
  }


  // 6. Gênero
  if (filters.gender !== 'all') {
    if (student.gender !== filters.gender) return false;
  }

  // 7. Faixa Etária
  if (filters.ageRange !== 'all') {
    const age = student.idade || (student.dataNascimento ? new Date().getFullYear() - new Date(student.dataNascimento).getFullYear() : 9);
    if (filters.ageRange === '<6' && age >= 6) return false;
    if (filters.ageRange === '6-11' && (age < 6 || age > 11)) return false;
    if (filters.ageRange === '12-14' && (age < 12 || age > 14)) return false;
    if (filters.ageRange === '15-17' && (age < 15 || age > 17)) return false;
    if (filters.ageRange === '18+' && age < 18) return false;
  }

  // 8. Estado da matrícula
  if (filters.enrollmentStatus !== 'all') {
    const cond = student.condicaoMatricula || student.registrationData?.condicaoMatricula;
    if (filters.enrollmentStatus === 'transferido' && !student.registrationData?.transferido) return false;
    if (filters.enrollmentStatus === 'inativo' && cond !== 'repetente') return false; // mock distribution
  }

  // 9. Situação documental
  if (filters.documentStatus !== 'all') {
    const hasDoc = student.hasDocuments && student.documentType !== 'sem Documento';
    if (filters.documentStatus === 'com_documento' && !hasDoc) return false;
    if (filters.documentStatus === 'sem_documento' && hasDoc) return false;
    if (filters.documentStatus === 'pendente' && hasDoc) return false;
  }

  // 10. Situação de desempenho
  if (filters.performanceStatus !== 'all') {
    const score = student.performanceScore || 8.0;
    // Score scaled 0-10 or 0-100
    const normalizedScore = score > 10 ? score / 10 : score;
    if (filters.performanceStatus === 'aprovacao' && normalizedScore < 7.0) return false;
    if (filters.performanceStatus === 'em_risco' && (normalizedScore < 5.0 || normalizedScore >= 7.0)) return false;
    if (filters.performanceStatus === 'reprovacao' && normalizedScore >= 5.0) return false;
  }

  // 11. Faixa de assiduidade
  if (filters.attendanceRange !== 'all') {
    const att = student.presenceRate || 95;
    if (filters.attendanceRange === '95-100' && att < 95) return false;
    if (filters.attendanceRange === '85-94' && (att < 85 || att >= 95)) return false;
    if (filters.attendanceRange === '75-84' && (att < 75 || att >= 85)) return false;
    if (filters.attendanceRange === '<75' && att >= 75) return false;
  }

  return true;
}

/**
 * Checks if a teacher matches the criteria
 */
export function matchesTeacher(teacher: AdminTeacher, filters: AdvancedFilterCriteria, schoolNameMap: Map<string, string>): boolean {
  // 1. Escola
  if (filters.schools.length > 0 && !filters.schools.includes('all')) {
    const tSchool = (teacher.schoolName || '').trim().toLowerCase();
    const matchesAny = filters.schools.some((scId) => {
      const targetName = (schoolNameMap.get(scId) || scId).trim().toLowerCase();
      return tSchool.includes(targetName) || targetName.includes(tSchool);
    });
    if (!matchesAny) return false;
  }

  // 2. Classe
  if (filters.gradeClass !== 'all') {
    const tClass = (teacher.gradeClass || '').trim().toLowerCase();
    const fClass = filters.gradeClass.trim().toLowerCase();
    if (!tClass.includes(fClass) && !fClass.includes(tClass)) return false;
  }

  // 3. Turma
  if (filters.turma !== 'all') {
    const tTurma = (teacher.turma || '').trim().toLowerCase();
    const fTurma = filters.turma.trim().toLowerCase();
    if (tTurma !== fTurma) return false;
  }

  // 4. Turno
  if (filters.shift !== 'all') {
    const fTurno = filters.shift.trim().toLowerCase();
    const turnosArr = teacher.registrationData?.turnos || [];
    const matchesTurno = turnosArr.some((t) => t.toLowerCase().includes(fTurno));
    if (!matchesTurno) return false;
  }

  // 5. Faixa de assiduidade
  if (filters.attendanceRange !== 'all') {
    const att = teacher.presenceRate || 98;
    if (filters.attendanceRange === '95-100' && att < 95) return false;
    if (filters.attendanceRange === '85-94' && (att < 85 || att >= 95)) return false;
    if (filters.attendanceRange === '75-84' && (att < 75 || att >= 85)) return false;
    if (filters.attendanceRange === '<75' && att >= 75) return false;
  }

  return true;
}

/**
 * Applies all advanced filters across the system dataset
 */
export function applyAdvancedFilters(
  schools: AdminSchool[],
  teachers: AdminTeacher[],
  students: AdminStudent[],
  directors: AdminDirector[],
  filters: AdvancedFilterCriteria
): FilterResultStats {
  const schoolNameMap = new Map<string, string>();
  schools.forEach((s) => {
    schoolNameMap.set(s.id, s.name);
    schoolNameMap.set(s.name, s.name);
  });

  // 1. Filtered Schools
  let filteredSchools = schools;
  if (filters.schools.length > 0 && !filters.schools.includes('all')) {
    filteredSchools = schools.filter((s) => filters.schools.includes(s.id) || filters.schools.includes(s.name));
  }

  // 2. Filtered Students
  const filteredStudents = students.filter((st) => matchesStudent(st, filters, schoolNameMap));

  // 3. Filtered Teachers
  const filteredTeachers = teachers.filter((tch) => matchesTeacher(tch, filters, schoolNameMap));

  // 4. Filtered Directors
  let filteredDirectors = directors;
  if (filters.schools.length > 0 && !filters.schools.includes('all')) {
    filteredDirectors = directors.filter((d) => {
      const dSchool = (d.schoolName || '').trim().toLowerCase();
      return filters.schools.some((scId) => {
        const targetName = (schoolNameMap.get(scId) || scId).trim().toLowerCase();
        return dSchool.includes(targetName) || targetName.includes(dSchool);
      });
    });
  }

  // Turmas únicas encontradas
  const turmasSet = new Set<string>();
  filteredStudents.forEach((st) => {
    if (st.turma) turmasSet.add(`${st.schoolName || 'Central'} - ${st.gradeClass || ''} - ${st.turma}`);
  });
  filteredTeachers.forEach((t) => {
    if (t.turma) turmasSet.add(`${t.schoolName || 'Central'} - ${t.gradeClass || ''} - ${t.turma}`);
  });
  const uniqueTurmasCount = Math.max(turmasSet.size, filteredStudents.length > 0 ? Math.ceil(filteredStudents.length / 28) : 0);

  // Active filter count & chips
  const activeChips: { key: string; label: string; value: string }[] = [];

  if (filters.schools.length > 0 && !filters.schools.includes('all')) {
    const schoolLabels = filters.schools
      .map((id) => schoolNameMap.get(id) || id)
      .slice(0, 2)
      .join(', ');
    const extraCount = filters.schools.length > 2 ? ` (+${filters.schools.length - 2})` : '';
    activeChips.push({
      key: 'schools',
      label: 'Escola',
      value: `${schoolLabels}${extraCount}`,
    });
  }

  if (filters.academicYear && filters.academicYear !== '2026/2027' && filters.academicYear !== '2026') {
    activeChips.push({ key: 'academicYear', label: 'Ano Letivo', value: filters.academicYear });
  }

  if (filters.periodType !== 'anual') {
    activeChips.push({ key: 'periodType', label: 'Período', value: filters.periodDetail || filters.periodType });
  }

  if (filters.gradeClass !== 'all') {
    activeChips.push({ key: 'gradeClass', label: 'Classe', value: filters.gradeClass });
  }

  if (filters.turma !== 'all') {
    activeChips.push({ key: 'turma', label: 'Turma', value: filters.turma });
  }

  if (filters.shift !== 'all') {
    activeChips.push({ key: 'shift', label: 'Turno', value: filters.shift });
  }


  if (filters.userType !== 'all') {
    activeChips.push({ key: 'userType', label: 'Utilizador', value: filters.userType.toUpperCase() });
  }

  if (filters.gender !== 'all') {
    activeChips.push({ key: 'gender', label: 'Género', value: filters.gender === 'F' ? 'Feminino' : 'Masculino' });
  }

  if (filters.ageRange !== 'all') {
    activeChips.push({ key: 'ageRange', label: 'Faixa Etária', value: filters.ageRange + (filters.ageRange === '<6' ? '' : ' anos') });
  }

  if (filters.enrollmentStatus !== 'all') {
    activeChips.push({ key: 'enrollmentStatus', label: 'Matrícula', value: filters.enrollmentStatus });
  }

  if (filters.documentStatus !== 'all') {
    activeChips.push({
      key: 'documentStatus',
      label: 'Documentos',
      value: filters.documentStatus === 'com_documento' ? 'Com Documento' : filters.documentStatus === 'sem_documento' ? 'Sem Documento' : 'Pendentes',
    });
  }

  if (filters.performanceStatus !== 'all') {
    activeChips.push({
      key: 'performanceStatus',
      label: 'Desempenho',
      value: filters.performanceStatus === 'aprovacao' ? 'Aprovação (≥70%)' : filters.performanceStatus === 'em_risco' ? 'Em Risco' : 'Reprovação',
    });
  }

  if (filters.attendanceRange !== 'all') {
    activeChips.push({
      key: 'attendanceRange',
      label: 'Assiduidade',
      value: `${filters.attendanceRange}%`,
    });
  }

  // Human-readable Context Label for Cards
  // e.g.: "113 alunos · Escola Central · 7ª Classe"
  let contextParts: string[] = [];
  if (filters.schools.length > 0 && !filters.schools.includes('all')) {
    if (filters.schools.length === 1) {
      const scName = schoolNameMap.get(filters.schools[0]) || filters.schools[0];
      // Shorten name if needed
      contextParts.push(scName.replace('Colégio Esperança de Cassembele', 'Col. Cassembele'));
    } else {
      contextParts.push(`${filters.schools.length} Escolas`);
    }
  } else {
    contextParts.push('Toda a Rede');
  }

  if (filters.gradeClass !== 'all') {
    contextParts.push(filters.gradeClass);
  }
  if (filters.turma !== 'all') {
    contextParts.push(filters.turma);
  }
  if (filters.shift !== 'all') {
    contextParts.push(filters.shift);
  }

  const contextLabel = contextParts.join(' · ');

  // Human-readable feedback
  const schoolCount = filteredSchools.length;
  const feedbackText = `${filteredStudents.length.toLocaleString('pt-PT')} alunos encontrados em ${schoolCount} escola${schoolCount === 1 ? '' : 's'}`;

  return {
    filteredSchools,
    filteredTeachers,
    filteredStudents,
    filteredDirectors,
    uniqueTurmasCount,
    totalStudents: filteredStudents.length,
    totalTeachers: filteredTeachers.length,
    totalSchools: filteredSchools.length,
    totalDirectors: filteredDirectors.length,
    contextLabel,
    feedbackText,
    activeFilterCount: activeChips.length,
    activeChips,
  };
}
