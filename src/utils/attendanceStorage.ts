export interface StudentAttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  turma: string;
  date: string; // YYYY-MM-DD
  status: 'presente' | 'falta';
  justified?: boolean;
  observacao?: string;
  recordedAt: string; // ISO string or readable date
  recordedBy: string; // e.g. "Prof. Santar Goes"
  isLocked: boolean; // Permanent lock
}

export interface TeacherAttendanceRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  schoolName: string;
  date: string; // YYYY-MM-DD
  status: 'presente' | 'falta';
  justified?: boolean;
  observacao?: string;
  shift: string;
  recordedAt: string;
  recordedBy: string; // e.g. "Diretor Fert Horlan"
  isLocked: boolean; // Permanent lock
}

const STUDENT_STORAGE_KEY = 'ucore_student_attendance_records_v2';
const TEACHER_STORAGE_KEY = 'ucore_teacher_attendance_records_v2';

// Initial demonstration records for realistic pre-locked audit trail
const initialStudentRecords: StudentAttendanceRecord[] = [
  {
    id: 'att-stu-seed-1',
    studentId: '1',
    studentName: 'Albert Silveira',
    turma: 'Turma A',
    date: '2026-09-04',
    status: 'presente',
    recordedAt: '2026-09-04T08:15:22.000Z',
    recordedBy: 'Prof. Santar Goes',
    isLocked: true,
  },
  {
    id: 'att-stu-seed-2',
    studentId: '2',
    studentName: 'Beatriz Costa',
    turma: 'Turma A',
    date: '2026-09-04',
    status: 'presente',
    recordedAt: '2026-09-04T08:15:35.000Z',
    recordedBy: 'Prof. Santar Goes',
    isLocked: true,
  },
  {
    id: 'att-stu-seed-3',
    studentId: '3',
    studentName: 'Carlos Manuel',
    turma: 'Turma A',
    date: '2026-09-04',
    status: 'falta',
    justified: true,
    observacao: 'Consulta médica apresentada pelo encarregado',
    recordedAt: '2026-09-04T08:16:10.000Z',
    recordedBy: 'Prof. Santar Goes',
    isLocked: true,
  },
];

const initialTeacherRecords: TeacherAttendanceRecord[] = [
  {
    id: 'att-tch-seed-1',
    teacherId: 'prof-1',
    teacherName: 'Santar Goes',
    schoolName: 'Escola Modelo Central',
    date: '2026-09-04',
    status: 'presente',
    shift: 'Manhã',
    recordedAt: '2026-09-04T07:45:10.000Z',
    recordedBy: 'Diretor Fert Horlan',
    isLocked: true,
  },
  {
    id: 'att-tch-seed-2',
    teacherId: 'prof-2',
    teacherName: 'Maria Helena Santos',
    schoolName: 'Escola Modelo Central',
    date: '2026-09-04',
    status: 'presente',
    shift: 'Manhã',
    recordedAt: '2026-09-04T07:46:02.000Z',
    recordedBy: 'Diretor Fert Horlan',
    isLocked: true,
  },
  {
    id: 'att-tch-seed-3',
    teacherId: 'prof-3',
    teacherName: 'Joaquim Nzinga',
    schoolName: 'Escola Modelo Central',
    date: '2026-09-04',
    status: 'falta',
    justified: true,
    observacao: 'Participação no seminário pedagógico municipal',
    shift: 'Tarde',
    recordedAt: '2026-09-04T13:05:40.000Z',
    recordedBy: 'Diretor Fert Horlan',
    isLocked: true,
  },
];

export function getStoredStudentAttendance(): StudentAttendanceRecord[] {
  try {
    const data = localStorage.getItem(STUDENT_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar registros de presença de alunos:', err);
  }
  return initialStudentRecords;
}

export function saveStudentAttendanceRecord(record: StudentAttendanceRecord): StudentAttendanceRecord[] {
  const current = getStoredStudentAttendance();
  
  // Rule: Once locked, it cannot be modified!
  const existing = current.find(
    (r) => r.studentId === record.studentId && r.date === record.date
  );

  if (existing && existing.isLocked) {
    console.warn('Atenção: Registro já homologado e trancado permanentemente. Alteração negada.');
    return current;
  }

  // Force isLocked = true permanently
  const lockedRecord: StudentAttendanceRecord = {
    ...record,
    isLocked: true,
    recordedAt: record.recordedAt || new Date().toISOString(),
  };

  const updated = [...current.filter((r) => !(r.studentId === record.studentId && r.date === record.date)), lockedRecord];
  
  try {
    localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Erro ao persistir presença do aluno:', err);
  }

  return updated;
}

export function saveBatchStudentAttendance(records: StudentAttendanceRecord[]): StudentAttendanceRecord[] {
  const current = getStoredStudentAttendance();
  const currentMap = new Map<string, StudentAttendanceRecord>();
  
  // Existing records
  for (const r of current) {
    currentMap.set(`${r.studentId}_${r.date}`, r);
  }

  // Add new records only if not already locked
  for (const newRec of records) {
    const key = `${newRec.studentId}_${newRec.date}`;
    const existing = currentMap.get(key);
    if (!existing || !existing.isLocked) {
      currentMap.set(key, {
        ...newRec,
        isLocked: true,
        recordedAt: newRec.recordedAt || new Date().toISOString(),
      });
    }
  }

  const updated = Array.from(currentMap.values());
  try {
    localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Erro ao persistir lote de presenças de alunos:', err);
  }
  return updated;
}

export function getStoredTeacherAttendance(): TeacherAttendanceRecord[] {
  try {
    const data = localStorage.getItem(TEACHER_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar registros de presença de professores:', err);
  }
  return initialTeacherRecords;
}

export function saveTeacherAttendanceRecord(record: TeacherAttendanceRecord): TeacherAttendanceRecord[] {
  const current = getStoredTeacherAttendance();

  // Rule: Once locked, it cannot be modified!
  const existing = current.find(
    (r) => r.teacherId === record.teacherId && r.date === record.date
  );

  if (existing && existing.isLocked) {
    console.warn('Atenção: Registro de professor já homologado e trancado permanentemente. Alteração negada.');
    return current;
  }

  // Force isLocked = true permanently
  const lockedRecord: TeacherAttendanceRecord = {
    ...record,
    isLocked: true,
    recordedAt: record.recordedAt || new Date().toISOString(),
  };

  const updated = [...current.filter((r) => !(r.teacherId === record.teacherId && r.date === record.date)), lockedRecord];

  try {
    localStorage.setItem(TEACHER_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Erro ao persistir presença do professor:', err);
  }

  return updated;
}

export function saveBatchTeacherAttendance(records: TeacherAttendanceRecord[]): TeacherAttendanceRecord[] {
  const current = getStoredTeacherAttendance();
  const currentMap = new Map<string, TeacherAttendanceRecord>();

  for (const r of current) {
    currentMap.set(`${r.teacherId}_${r.date}`, r);
  }

  for (const newRec of records) {
    const key = `${newRec.teacherId}_${newRec.date}`;
    const existing = currentMap.get(key);
    if (!existing || !existing.isLocked) {
      currentMap.set(key, {
        ...newRec,
        isLocked: true,
        recordedAt: newRec.recordedAt || new Date().toISOString(),
      });
    }
  }

  const updated = Array.from(currentMap.values());
  try {
    localStorage.setItem(TEACHER_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Erro ao persistir lote de presenças de professores:', err);
  }
  return updated;
}
