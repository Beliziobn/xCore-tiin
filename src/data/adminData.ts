import type { 
  AdminSchool, 
  AdminTeacher, 
  AdminStudent, 
  AdminDirector 
} from '../types';

// Network Schools - Initialized empty for live municipal data entry
export const initialAdminSchools: AdminSchool[] = [];

// Network Teachers - Initialized empty for live municipal data entry
export const initialAdminTeachers: AdminTeacher[] = [];

// Network Students - Initialized empty for live municipal data entry
export const initialAdminStudents: AdminStudent[] = [];

// Historical Performance Trends (%Aprovação vs %Reprovação)
export const historicalSchoolPerformance = [
  { period: '2022.1', aprovacao: 0, reprovacao: 0 },
  { period: '2023.1', aprovacao: 0, reprovacao: 0 },
  { period: '2024.1', aprovacao: 0, reprovacao: 0 },
  { period: '2025.1', aprovacao: 0, reprovacao: 0 },
  { period: '2026.1 (Atual)', aprovacao: 0, reprovacao: 0 },
];

// Historical Attendance Trends (Presencial vs EAD / Alternativo)
export const historicalAttendanceTrends = [
  { year: '2022', presencial: 0, ead: 0 },
  { year: '2023', presencial: 0, ead: 0 },
  { year: '2024', presencial: 0, ead: 0 },
  { year: '2025', presencial: 0, ead: 0 },
  { year: '2026', presencial: 0, ead: 0 },
];

// Calculation helper for real dynamic admin statistics
export interface ComputedAdminStats {
  totalSchools: number;
  totalTeachers: number;
  totalStudents: number;
  overallPerformanceRate: number;
  lowPerformanceSchoolsCount: number;
  lowPerformanceSchoolsPercentage: number;
  totalStudentsWithDocs: number;
  totalStudentsWithoutDocs: number;
  studentsDocRate: number;
  averageAttendanceRate: number;
  femaleStudentsCount: number;
  maleStudentsCount: number;
  femaleWithoutDocs: number;
  maleWithoutDocs: number;
  femaleWithDocs: number;
  maleWithDocs: number;
}

export function computeAdminStats(
  schools: AdminSchool[] = initialAdminSchools,
  students: AdminStudent[] = initialAdminStudents
): ComputedAdminStats {
  const totalSchools = schools.length;
  const totalTeachers = schools.reduce((acc, s) => acc + (s.teachersCount || 0), 0);
  const totalStudentsWithDocs = schools.reduce((acc, s) => acc + (s.studentsWithDocs || 0), 0);
  const totalStudentsWithoutDocs = schools.reduce((acc, s) => acc + (s.studentsWithoutDocs || 0), 0);
  const totalStudents = totalStudentsWithDocs + totalStudentsWithoutDocs;

  // Performance
  const sumPerformance = schools.reduce((acc, s) => acc + (s.performanceRate || 0), 0);
  const overallPerformanceRate = totalSchools > 0 ? Math.round(sumPerformance / totalSchools) : 0;

  // Escolas com menor desempenho (performance < 70%)
  const lowPerfSchools = schools.filter((s) => (s.performanceRate || 0) < 70);
  const lowPerformanceSchoolsCount = lowPerfSchools.length;
  const lowPerformanceSchoolsPercentage = totalSchools > 0 
    ? Math.round((lowPerformanceSchoolsCount / totalSchools) * 100) 
    : 0;

  // Average attendance
  const sumAttendance = schools.reduce((acc, s) => acc + (s.attendanceRate || 0), 0);
  const averageAttendanceRate = totalSchools > 0 
    ? Number((sumAttendance / totalSchools).toFixed(1)) 
    : 0;

  const studentsDocRate = totalStudents > 0 
    ? Number(((totalStudentsWithDocs / totalStudents) * 100).toFixed(1)) 
    : 0;

  const femaleSampleCount = students.filter(s => s.gender === 'F').length;
  const maleSampleCount = students.filter(s => s.gender === 'M').length;
  const totalSample = femaleSampleCount + maleSampleCount;
  const femaleRatio = totalSample > 0 ? femaleSampleCount / totalSample : 0;

  const femaleStudentsCount = Math.round(totalStudents * femaleRatio);
  const maleStudentsCount = totalStudents - femaleStudentsCount;

  // Documents by gender
  const femaleWithDocs = Math.round(totalStudentsWithDocs * femaleRatio);
  const maleWithDocs = totalStudentsWithDocs - femaleWithDocs;

  const femaleWithoutDocs = Math.round(totalStudentsWithoutDocs * femaleRatio);
  const maleWithoutDocs = totalStudentsWithoutDocs - femaleWithoutDocs;

  return {
    totalSchools,
    totalTeachers,
    totalStudents,
    overallPerformanceRate,
    lowPerformanceSchoolsCount,
    lowPerformanceSchoolsPercentage,
    totalStudentsWithDocs,
    totalStudentsWithoutDocs,
    studentsDocRate,
    averageAttendanceRate,
    femaleStudentsCount,
    maleStudentsCount,
    femaleWithoutDocs,
    maleWithoutDocs,
    femaleWithDocs,
    maleWithDocs,
  };
}

// Initial Municipal Director - The only municipal director
export const initialAdminDirectors: AdminDirector[] = [
  {
    id: 'dir-municipal-quessua',
    name: 'Director Municipal da Educação',
    schoolName: 'Direcção Municipal da Educação de Quessua',
    phone: '+244 923 000 000',
    email: 'dmedoquessua@gmail.com',
    appointmentYear: 2026,
    status: 'Ativo',
    performanceRating: 100,
    teachersCount: 0,
    studentsCount: 0,
    location: 'Quessua - Sede Municipal',
  },
];
