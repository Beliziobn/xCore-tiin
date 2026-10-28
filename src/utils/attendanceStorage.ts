import {
  saveAttendanceToFirestore,
  saveBatchAttendanceToFirestore,
} from './firestoreSync';

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
const initialStudentRecords: StudentAttendanceRecord[] = [];

const initialTeacherRecords: TeacherAttendanceRecord[] = [];

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
  return [];
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
    saveAttendanceToFirestore(lockedRecord, 'student').catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }
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
    saveBatchAttendanceToFirestore(records, 'student').catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }
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
  return [];
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
    saveAttendanceToFirestore(lockedRecord, 'teacher').catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }
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
    saveBatchAttendanceToFirestore(records, 'teacher').catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }
  } catch (err) {
    console.warn('Erro ao persistir lote de presenças de professores:', err);
  }
  return updated;
}
