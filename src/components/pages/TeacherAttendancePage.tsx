import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  ArrowLeft,
  AlertTriangle,
  Users,
  ShieldCheck,
  CheckCheck,
  Clock,
  Filter,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { StudentProfile } from '../../data/teacherData';
import { Textarea } from '@/components/ui/textarea';
import {
  StudentAttendanceRecord,
  getStoredStudentAttendance,
  saveStudentAttendanceRecord,
  saveBatchStudentAttendance,
} from '../../utils/attendanceStorage';

interface TeacherAttendancePageProps {
  onBackToClass: () => void;
  onNavigateToStudent?: (studentId: string) => void;
  students: StudentProfile[];
  teacherName?: string;
  turmaName?: string;
}

export const TeacherAttendancePage: React.FC<TeacherAttendancePageProps> = ({
  onBackToClass,
  onNavigateToStudent,
  students,
  teacherName = 'Santar Goes',
  turmaName = 'Turma 1 • 4ª Classe',
}) => {
  // Default date: 2026-09-07 or today
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-07');
  const [records, setRecords] = useState<StudentAttendanceRecord[]>(() => getStoredStudentAttendance());
  const [pendingMarks, setPendingMarks] = useState<Record<string, { status: 'presente' | 'falta'; observacao?: string }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'presente' | 'falta'>('all');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [justificationModalStudent, setJustificationModalStudent] = useState<StudentProfile | null>(null);
  const [tempObservation, setTempObservation] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync records from localStorage
  useEffect(() => {
    setRecords(getStoredStudentAttendance());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Map of locked records for selected date
  const lockedRecordsMap = useMemo(() => {
    const map = new Map<string, StudentAttendanceRecord>();
    records
      .filter((r) => r.date === selectedDate)
      .forEach((r) => map.set(r.studentId, r));
    return map;
  }, [records, selectedDate]);

  // Combined status of each student for selected date
  const studentsWithStatus = useMemo(() => {
    return students.map((student) => {
      const locked = lockedRecordsMap.get(student.id);
      const pending = pendingMarks[student.id];

      const currentStatus = locked ? locked.status : pending ? pending.status : null;
      const isLocked = Boolean(locked?.isLocked);
      const observacao = locked?.observacao || pending?.observacao;
      const recordedAt = locked?.recordedAt;
      const recordedBy = locked?.recordedBy;

      return {
        student,
        currentStatus,
        isLocked,
        observacao,
        recordedAt,
        recordedBy,
      };
    });
  }, [students, lockedRecordsMap, pendingMarks]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return studentsWithStatus.filter(({ student, currentStatus, isLocked }) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(student.numeroChamada).includes(searchQuery) ||
        student.encarregado.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (statusFilter === 'pending') {
        matchesFilter = !isLocked && !currentStatus;
      } else if (statusFilter === 'presente') {
        matchesFilter = currentStatus === 'presente';
      } else if (statusFilter === 'falta') {
        matchesFilter = currentStatus === 'falta';
      }

      return matchesSearch && matchesFilter;
    });
  }, [studentsWithStatus, searchQuery, statusFilter]);

  // Metrics for selected date
  const metrics = useMemo(() => {
    const total = students.length;
    let presentes = 0;
    let faltas = 0;
    let pendentes = 0;

    studentsWithStatus.forEach(({ currentStatus }) => {
      if (currentStatus === 'presente') presentes++;
      else if (currentStatus === 'falta') faltas++;
      else pendentes++;
    });

    const recordedCount = presentes + faltas;
    const assiduidadeRate = recordedCount > 0 ? Math.round((presentes / recordedCount) * 100) : 0;
    const isDayFullyClosed = pendentes === 0 && total > 0;

    return {
      total,
      presentes,
      faltas,
      pendentes,
      assiduidadeRate,
      isDayFullyClosed,
    };
  }, [students, studentsWithStatus]);

  // Handle temporary mark (only if NOT locked)
  const handleSelectStatus = (studentId: string, status: 'presente' | 'falta') => {
    const locked = lockedRecordsMap.get(studentId);
    if (locked?.isLocked) {
      showToast('Este registro já foi homologado e não pode ser alterado.');
      return;
    }

    setPendingMarks((prev) => ({
      ...prev,
      [studentId]: {
        status,
        observacao: prev[studentId]?.observacao,
      },
    }));
  };

  // Mark all unrecorded students as Presente
  const handleMarkAllPresent = () => {
    const newPending = { ...pendingMarks };
    students.forEach((s) => {
      if (!lockedRecordsMap.has(s.id)) {
        newPending[s.id] = { status: 'presente' };
      }
    });
    setPendingMarks(newPending);
    showToast('Alunos pendentes marcados como Presente. Clique em "Gravar Chamada Definitiva" para trancar os registros.');
  };

  // Confirm and permanently lock a single student record
  const handleLockSingleRecord = (student: StudentProfile) => {
    const mark = pendingMarks[student.id];
    if (!mark) {
      showToast('Selecione Presente ou Falta antes de gravar.');
      return;
    }

    const newRecord: StudentAttendanceRecord = {
      id: `att-stu-${student.id}-${selectedDate}`,
      studentId: student.id,
      studentName: student.name,
      turma: turmaName,
      date: selectedDate,
      status: mark.status,
      observacao: mark.observacao,
      recordedAt: new Date().toISOString(),
      recordedBy: `Prof. ${teacherName}`,
      isLocked: true,
    };

    const updated = saveStudentAttendanceRecord(newRecord);
    setRecords(updated);
    setPendingMarks((prev) => {
      const copy = { ...prev };
      delete copy[student.id];
      return copy;
    });

    showToast(`Presença de "${student.name}" gravada e trancada permanentemente!`);
  };

  // Confirm and permanently lock all pending filled records
  const handleBatchLockAll = () => {
    const newRecordsToSave: StudentAttendanceRecord[] = [];

    Object.entries(pendingMarks).forEach(([studentId, markVal]) => {
      const mark = markVal as { status: 'presente' | 'falta'; observacao?: string };
      if (!mark) return;
      if (lockedRecordsMap.has(studentId)) return;
      const student = students.find((s) => s.id === studentId);
      if (!student) return;

      newRecordsToSave.push({
        id: `att-stu-${student.id}-${selectedDate}`,
        studentId: student.id,
        studentName: student.name,
        turma: turmaName,
        date: selectedDate,
        status: mark.status,
        observacao: mark.observacao,
        recordedAt: new Date().toISOString(),
        recordedBy: `Prof. ${teacherName}`,
        isLocked: true,
      });
    });

    if (newRecordsToSave.length === 0) {
      showToast('Nenhum novo aluno marcado para gravação.');
      setConfirmModalOpen(false);
      return;
    }

    const updated = saveBatchStudentAttendance(newRecordsToSave);
    setRecords(updated);
    setPendingMarks({});
    setConfirmModalOpen(false);
    showToast(`${newRecordsToSave.length} registros foram selados e trancados permanentemente!`);
  };

  const formattedDateFriendly = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div id="teacher-attendance-page" className="attendance-page w-full min-h-screen bg-[#f7f5f4] pb-20 font-sans">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="attendance-content w-full max-w-[1180px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-16 relative">
        {/* Page Context Bar: Voltar à Turma, Título, Docente e Data alinhada */}
        <div className="page-context flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-1">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToClass}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#f75142] bg-white hover:bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à Turma</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Chamada & Presença dos Alunos</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {turmaName} · Docente: <strong className="text-slate-700">Prof. {teacherName}</strong>
              </p>
            </div>
          </div>

          {/* Date Selector aligned to the right */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs self-start sm:self-auto">
            <Calendar className="w-4 h-4 text-[#f75142]" />
            <span className="text-xs font-bold text-slate-700">Data Letiva:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* 4 Summary Cards with reduced height (~112px) and progress bars */}
        <div className="summary-grid grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-5">
          {/* Total Card */}
          <div className="summary-card min-h-[112px] p-4 rounded-2xl bg-white border border-[#e3e8ef] shadow-[0_8px_24px_rgba(10,35,52,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total de Alunos</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="my-0.5">
              <p className="text-2xl sm:text-3xl font-black text-[#002133] leading-none">{metrics.total}</p>
              <span className="text-[11px] text-slate-500 font-medium">Matriculados na turma</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#002133] h-1.5 rounded-full w-full" />
            </div>
          </div>

          {/* Presentes Card */}
          <div className="summary-card min-h-[112px] p-4 rounded-2xl bg-white border border-[#e3e8ef] shadow-[0_8px_24px_rgba(10,35,52,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Presentes</span>
              <CheckCircle2 className="w-4 h-4 text-[#12b981]" />
            </div>
            <div className="my-0.5">
              <p className="text-2xl sm:text-3xl font-black text-[#12b981] leading-none">{metrics.presentes}</p>
              <span className="text-[11px] text-emerald-600 font-bold">
                {metrics.total > 0 ? Math.round((metrics.presentes / metrics.total) * 100) : 0}% da turma
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#12b981] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${metrics.total > 0 ? Math.round((metrics.presentes / metrics.total) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Faltas Card */}
          <div className="summary-card min-h-[112px] p-4 rounded-2xl bg-white border border-[#e3e8ef] shadow-[0_8px_24px_rgba(10,35,52,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Faltas</span>
              <XCircle className="w-4 h-4 text-[#ef4444]" />
            </div>
            <div className="my-0.5">
              <p className="text-2xl sm:text-3xl font-black text-[#ef4444] leading-none">{metrics.faltas}</p>
              <span className="text-[11px] text-rose-600 font-bold">
                {metrics.total > 0 ? Math.round((metrics.faltas / metrics.total) * 100) : 0}% ausências
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#ef4444] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${metrics.total > 0 ? Math.round((metrics.faltas / metrics.total) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Pendentes Card */}
          <div className="summary-card min-h-[112px] p-4 rounded-2xl bg-white border border-[#e3e8ef] shadow-[0_8px_24px_rgba(10,35,52,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Pendentes</span>
              <Clock className="w-4 h-4 text-[#f59e0b]" />
            </div>
            <div className="my-0.5">
              <p className="text-2xl sm:text-3xl font-black text-[#f59e0b] leading-none">{metrics.pendentes}</p>
              <span className="text-[11px] text-slate-500 font-medium">
                {metrics.pendentes === 0 ? 'Diário 100% selado' : 'Aguardando marcação'}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#f59e0b] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${metrics.total > 0 ? Math.round((metrics.pendentes / metrics.total) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Attendance Panel */}
        <div className="attendance-panel overflow-hidden border border-[#e0e6ed] rounded-[18px] bg-white shadow-[0_8px_24px_rgba(10,35,52,0.04)]">
          {/* Attendance Toolbar: Status + Action Buttons + Search & Filters */}
          <div className="attendance-toolbar p-4 sm:p-5 border-b border-[#e8edf2]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900 capitalize">
                    {formattedDateFriendly}
                  </span>
                  {metrics.isDayFullyClosed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <Lock className="w-3 h-3 text-emerald-700" />
                      <span>Diário Selado</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-700" />
                      <span>Em Preenchimento</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assiduidade registrada hoje: <strong className="text-slate-700">{metrics.assiduidadeRate}%</strong>
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {!metrics.isDayFullyClosed && (
                  <>
                    <button
                      type="button"
                      onClick={handleMarkAllPresent}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/90 border border-slate-200 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-98"
                    >
                      <CheckCheck className="w-4 h-4 text-slate-600" />
                      <span>Marcar pendentes presentes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmModalOpen(true)}
                      disabled={Object.keys(pendingMarks).length === 0}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs ${
                        Object.keys(pendingMarks).length > 0
                          ? 'bg-[#f75142] hover:bg-[#e04436] text-white cursor-pointer active:scale-98 ring-2 ring-[#f75142]/20'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Gravar chamada definitiva ({Object.keys(pendingMarks).length})</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Search & Status Filters */}
            <div className="mt-4 pt-4 border-t border-[#edf0f3] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por aluno, número ou encarregado..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#f75142]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'bg-[#002133] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pendentes ({metrics.pendentes})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('presente')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'presente'
                      ? 'bg-[#12b981] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Presentes ({metrics.presentes})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('falta')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'falta'
                      ? 'bg-[#ef4444] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Faltas ({metrics.faltas})
                </button>
              </div>
            </div>
          </div>

          {/* Student List */}
          <div className="divide-y divide-[#edf0f3]">
            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Nenhum aluno encontrado</p>
                <p className="text-xs text-slate-400 mt-0.5">Tente ajustar a busca ou os filtros de status.</p>
              </div>
            ) : (
              filteredStudents.map(({ student, currentStatus, isLocked, observacao, recordedAt, recordedBy }) => {
                const isMarkedPresent = currentStatus === 'presente';
                const isMarkedFalta = currentStatus === 'falta';
                const isPending = !isLocked && !currentStatus;

                const rowStateClass = isLocked
                  ? isMarkedPresent
                    ? 'bg-emerald-50/20 shadow-[inset_3px_0_0_#12b981]'
                    : 'bg-rose-50/20 shadow-[inset_3px_0_0_#ef4444]'
                  : isMarkedPresent
                  ? 'bg-emerald-50/20 shadow-[inset_3px_0_0_#12b981]'
                  : isMarkedFalta
                  ? 'bg-rose-50/20 shadow-[inset_3px_0_0_#ef4444]'
                  : 'student-row--pending shadow-[inset_3px_0_0_#f59e0b] bg-amber-50/10';

                return (
                  <div
                    key={student.id}
                    className={`student-row flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 min-h-[84px] px-4 sm:px-5 py-3.5 transition-colors ${rowStateClass} hover:bg-[#fbfcfd]`}
                  >
                    {/* Student Identity: Number, Avatar, Grouped Name & Status */}
                    <div className="student-main flex items-center gap-3.5 min-w-0">
                      {/* Discreet call number */}
                      <span className="text-xs font-mono font-bold text-slate-400 w-5 text-center shrink-0">
                        {String(student.numeroChamada).padStart(2, '0')}
                      </span>

                      {/* Slightly larger avatar (42px) */}
                      <div className="student-avatar w-[42px] h-[42px] shrink-0 rounded-full flex items-center justify-center font-bold text-sm bg-[#002133] text-white relative overflow-hidden border border-slate-200">
                        {student.foto ? (
                          <img
                            src={student.foto}
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{student.name.charAt(0)}</span>
                        )}
                        {isLocked && (
                          <div
                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs"
                            title="Registro trancado permanentemente"
                          >
                            <Lock className="w-2.5 h-2.5 text-amber-400" />
                          </div>
                        )}
                      </div>

                      {/* Info lines */}
                      <div className="student-info min-w-0">
                        <div className="student-name-line flex items-center flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onNavigateToStudent && onNavigateToStudent(student.id)}
                            className="font-bold text-sm text-slate-900 hover:text-[#f75142] transition-colors truncate text-left cursor-pointer"
                          >
                            {student.name}
                          </button>
                          <span className="tag tag--gender text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {student.genero === 'F' ? 'Feminino' : 'Masculino'}
                          </span>
                          {student.temDocumentos ? (
                            <span className="tag tag--document-ok text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Doc OK
                            </span>
                          ) : (
                            <span className="tag text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Sem Doc
                            </span>
                          )}
                        </div>

                        <div className="student-meta text-xs text-slate-500 truncate mt-1">
                          Encarregado: {student.encarregado} · Tel: {student.telefone}
                        </div>

                        {observacao && (
                          <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1 inline-block">
                            Obs: {observacao}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Attendance Controls & Confirmation */}
                    <div className="attendance-actions flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
                      {isLocked ? (
                        /* LOCKED STATE: READ-ONLY */
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            {isMarkedPresent ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>PRESENÇA CONFIRMADA</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                                <XCircle className="w-3.5 h-3.5 text-rose-700" />
                                <span>FALTA REGISTRADA</span>
                              </span>
                            )}

                            <div
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 cursor-not-allowed select-none"
                              title="Campo selado no diário de classe. Não pode ser alterado."
                            >
                              <Lock className="w-3 h-3 text-slate-500" />
                              <span>Trancado</span>
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {recordedAt
                              ? `Selado às ${new Date(recordedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • ${recordedBy || 'Docente'}`
                              : 'Registro definitivo'}
                          </span>
                        </div>
                      ) : (
                        /* UNLOCKED STATE */
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectStatus(student.id, 'presente')}
                            className={`attendance-button min-w-[92px] h-[34px] px-3.5 rounded-[9px] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                              isMarkedPresent
                                ? 'attendance-button--present is-active bg-[#12b981] border-[#12b981] text-white shadow-2xs'
                                : 'bg-white text-[#18344a] border-[#dce4ed] hover:border-[#12b981] hover:text-[#12b981]'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Presente</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectStatus(student.id, 'falta')}
                            className={`attendance-button min-w-[92px] h-[34px] px-3.5 rounded-[9px] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                              isMarkedFalta
                                ? 'attendance-button--absent is-active bg-[#ef4444] border-[#ef4444] text-white shadow-2xs'
                                : 'bg-white text-[#18344a] border-[#dce4ed] hover:border-[#ef4444] hover:text-[#ef4444]'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Falta</span>
                          </button>

                          {/* Justification note if Falta */}
                          {isMarkedFalta && (
                            <button
                              type="button"
                              onClick={() => {
                                setJustificationModalStudent(student);
                                setTempObservation(observacao || '');
                              }}
                              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline px-1 cursor-pointer"
                            >
                              {observacao ? 'Editar Nota' : '+ Justificativa'}
                            </button>
                          )}

                          {/* Quick single-lock button */}
                          {(isMarkedPresent || isMarkedFalta) && (
                            <button
                              type="button"
                              onClick={() => handleLockSingleRecord(student)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#002133] hover:bg-[#001726] text-white transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                              title="Gravar este registro definitivamente e trancar"
                            >
                              <Lock className="w-3 h-3 text-amber-400" />
                              <span>Gravar</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal to permanently seal the day's attendance */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-amber-600" />
            </div>

            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Confirmar Gravação Definitiva?
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Você está gravando a chamada para o dia <strong>{formattedDateFriendly}</strong> com{' '}
              <strong>{Object.keys(pendingMarks).length}</strong> aluno(s).
            </p>

            <div className="p-3 my-4 rounded-xl bg-rose-50 border border-rose-200 text-left">
              <p className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Regra Inalterável do Sistema</span>
              </p>
              <p className="text-[11px] text-rose-700 mt-1">
                Uma vez confirmados, estes registros serão <strong>trancados permanentemente</strong>. 
                Não haverá como alterar ou reverter as presenças e faltas gravadas.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Voltar e Revisar
              </button>
              <button
                onClick={handleBatchLockAll}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#f75142] hover:bg-[#e04436] text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-white" />
                <span>Sim, Gravar e Trancar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Justification note modal */}
      {justificationModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-900 mb-1">
              Justificativa de Falta
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Aluno: <strong>{justificationModalStudent.name}</strong>
            </p>

            <Textarea
              rows={3}
              value={tempObservation}
              onChange={(e) => setTempObservation(e.target.value)}
              placeholder="Ex: Apresentou atestado médico, dispensa do encarregado, etc."
              className="w-full"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setJustificationModalStudent(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setPendingMarks((prev) => ({
                    ...prev,
                    [justificationModalStudent.id]: {
                      status: 'falta',
                      observacao: tempObservation,
                    },
                  }));
                  setJustificationModalStudent(null);
                  showToast('Justificativa anotada. Não se esqueça de gravar a chamada.');
                }}
                className="px-4 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg cursor-pointer hover:bg-slate-800"
              >
                Salvar Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
