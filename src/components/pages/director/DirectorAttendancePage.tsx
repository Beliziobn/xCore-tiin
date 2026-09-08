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
  Briefcase,
  Building,
  FileCheck,
} from 'lucide-react';
import { DirectorTeacher } from '../../../types';
import { directorTeachersData } from '../../../data/directorData';
import {
  TeacherAttendanceRecord,
  getStoredTeacherAttendance,
  saveTeacherAttendanceRecord,
  saveBatchTeacherAttendance,
} from '../../../utils/attendanceStorage';

interface DirectorAttendancePageProps {
  onBackToTeachers?: () => void;
  onNavigateToDashboard?: () => void;
  teachers?: DirectorTeacher[];
  directorName?: string;
  schoolName?: string;
}

export const DirectorAttendancePage: React.FC<DirectorAttendancePageProps> = ({
  onBackToTeachers,
  onNavigateToDashboard,
  teachers = directorTeachersData,
  directorName = 'Fert Horlan',
  schoolName = 'Escola Modelo Central',
}) => {
  // Default date: 2026-09-07 or today
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-07');
  const [records, setRecords] = useState<TeacherAttendanceRecord[]>(() => getStoredTeacherAttendance());
  const [pendingMarks, setPendingMarks] = useState<Record<string, { status: 'presente' | 'falta'; observacao?: string }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'Manhã' | 'Tarde' | 'Noite'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'presente' | 'falta'>('all');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [justificationModalTeacher, setJustificationModalTeacher] = useState<DirectorTeacher | null>(null);
  const [tempObservation, setTempObservation] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync records on load
  useEffect(() => {
    setRecords(getStoredTeacherAttendance());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Map of locked records for selected date
  const lockedRecordsMap = useMemo(() => {
    const map = new Map<string, TeacherAttendanceRecord>();
    records
      .filter((r) => r.date === selectedDate)
      .forEach((r) => map.set(r.teacherId, r));
    return map;
  }, [records, selectedDate]);

  // Combined status of each teacher for selected date
  const teachersWithStatus = useMemo(() => {
    return teachers.map((teacher) => {
      const locked = lockedRecordsMap.get(teacher.id);
      const pending = pendingMarks[teacher.id];

      const currentStatus = locked ? locked.status : pending ? pending.status : null;
      const isLocked = Boolean(locked?.isLocked);
      const observacao = locked?.observacao || pending?.observacao;
      const recordedAt = locked?.recordedAt;
      const recordedBy = locked?.recordedBy;

      return {
        teacher,
        currentStatus,
        isLocked,
        observacao,
        recordedAt,
        recordedBy,
      };
    });
  }, [teachers, lockedRecordsMap, pendingMarks]);

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachersWithStatus.filter(({ teacher, currentStatus, isLocked }) => {
      const matchesSearch =
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.gradeClass.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesShift = shiftFilter === 'all' || teacher.shift === shiftFilter;

      let matchesStatus = true;
      if (statusFilter === 'pending') {
        matchesStatus = !isLocked && !currentStatus;
      } else if (statusFilter === 'presente') {
        matchesStatus = currentStatus === 'presente';
      } else if (statusFilter === 'falta') {
        matchesStatus = currentStatus === 'falta';
      }

      return matchesSearch && matchesShift && matchesStatus;
    });
  }, [teachersWithStatus, searchQuery, shiftFilter, statusFilter]);

  // Metrics for selected date
  const metrics = useMemo(() => {
    const total = teachers.length;
    let presentes = 0;
    let faltas = 0;
    let pendentes = 0;

    teachersWithStatus.forEach(({ currentStatus }) => {
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
  }, [teachers, teachersWithStatus]);

  // Handle temporary mark (only if NOT locked)
  const handleSelectStatus = (teacherId: string, status: 'presente' | 'falta') => {
    const locked = lockedRecordsMap.get(teacherId);
    if (locked?.isLocked) {
      showToast('Este registro já foi homologado e não pode ser alterado.');
      return;
    }

    setPendingMarks((prev) => ({
      ...prev,
      [teacherId]: {
        status,
        observacao: prev[teacherId]?.observacao,
      },
    }));
  };

  // Mark all unrecorded teachers as Presente
  const handleMarkAllPresent = () => {
    const newPending = { ...pendingMarks };
    teachers.forEach((t) => {
      if (!lockedRecordsMap.has(t.id)) {
        newPending[t.id] = { status: 'presente' };
      }
    });
    setPendingMarks(newPending);
    showToast('Docentes pendentes marcados como Presente. Clique em "Homologar Livro de Ponto" para trancar os registros.');
  };

  // Confirm and permanently lock a single teacher record
  const handleLockSingleRecord = (teacher: DirectorTeacher) => {
    const mark = pendingMarks[teacher.id];
    if (!mark) {
      showToast('Selecione Presente ou Falta antes de homologar.');
      return;
    }

    const newRecord: TeacherAttendanceRecord = {
      id: `att-tch-${teacher.id}-${selectedDate}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      schoolName: schoolName,
      shift: teacher.shift,
      date: selectedDate,
      status: mark.status,
      observacao: mark.observacao,
      recordedAt: new Date().toISOString(),
      recordedBy: `Diretor ${directorName}`,
      isLocked: true,
    };

    const updated = saveTeacherAttendanceRecord(newRecord);
    setRecords(updated);
    setPendingMarks((prev) => {
      const copy = { ...prev };
      delete copy[teacher.id];
      return copy;
    });

    showToast(`Ponto do(a) Prof.(a) "${teacher.name}" homologado e trancado permanentemente!`);
  };

  // Confirm and permanently lock all pending filled records
  const handleBatchLockAll = () => {
    const newRecordsToSave: TeacherAttendanceRecord[] = [];

    Object.entries(pendingMarks).forEach(([teacherId, markVal]) => {
      const mark = markVal as { status: 'presente' | 'falta'; observacao?: string };
      if (!mark) return;
      if (lockedRecordsMap.has(teacherId)) return;
      const teacher = teachers.find((t) => t.id === teacherId);
      if (!teacher) return;

      newRecordsToSave.push({
        id: `att-tch-${teacher.id}-${selectedDate}`,
        teacherId: teacher.id,
        teacherName: teacher.name,
        schoolName: schoolName,
        shift: teacher.shift,
        date: selectedDate,
        status: mark.status,
        observacao: mark.observacao,
        recordedAt: new Date().toISOString(),
        recordedBy: `Diretor ${directorName}`,
        isLocked: true,
      });
    });

    if (newRecordsToSave.length === 0) {
      showToast('Nenhum novo docente marcado para homologação.');
      setConfirmModalOpen(false);
      return;
    }

    const updated = saveBatchTeacherAttendance(newRecordsToSave);
    setRecords(updated);
    setPendingMarks({});
    setConfirmModalOpen(false);
    showToast(`${newRecordsToSave.length} registros docentes homologados e trancados permanentemente!`);
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
    <div id="director-attendance-page" className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 font-sans">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          {onBackToTeachers && (
            <button
              onClick={onBackToTeachers}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#f75142] bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar aos Professores</span>
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Livro de Ponto Docente</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {schoolName} • Diretor Geral: <strong>{directorName}</strong> • Gestão Escolar 2026
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
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

      {/* STRICT INSTITUTIONAL RULE BANNER */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-amber-900 flex items-center gap-1.5">
              <span>Diretriz da Direção: Homologação Irrevogável de Ponto</span>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-black tracking-wider uppercase">
                Auditoria Oficial
              </span>
            </h2>
            <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
              <strong>Atenção Diretor:</strong> Conforme o regulamento da secretaria escolar, uma vez preenchida e 
              homologada a presença ou a falta de um professor na data selecionada, o campo é 
              <strong> trancado permanentemente</strong> e <strong>não poderá ser alterado nem desfeito</strong>. 
              Esta chancela digital resguarda a folha de efetividade docente e a legalidade administrativa.
            </p>
          </div>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total de Professores</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.total}</p>
          <span className="text-[11px] text-slate-500 font-medium">Corpo docente da escola</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Presentes em Aula</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{metrics.presentes}</p>
          <span className="text-[11px] text-emerald-600/90 font-bold">
            {metrics.total > 0 ? Math.round((metrics.presentes / metrics.total) * 100) : 0}% em sala
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-2xs bg-rose-50/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Ausências / Faltas</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700">{metrics.faltas}</p>
          <span className="text-[11px] text-rose-600/90 font-bold">
            {metrics.total > 0 ? Math.round((metrics.faltas / metrics.total) * 100) : 0}% ausentes
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pendentes</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className={`text-2xl font-black ${metrics.pendentes > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {metrics.pendentes}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            {metrics.pendentes === 0 ? 'Ponto 100% homologado' : 'Aguardando registro'}
          </span>
        </div>
      </div>

      {/* Control Bar: Date Info, Quick Actions, Search & Shift Filter */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 capitalize">
                {formattedDateFriendly}
              </span>
              {metrics.isDayFullyClosed ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Lock className="w-3 h-3 text-emerald-700" />
                  <span>Livro Homologado</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  <Clock className="w-3 h-3 text-amber-700" />
                  <span>Ponto Aberto</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assiduidade docente do dia: <strong>{metrics.assiduidadeRate}%</strong>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!metrics.isDayFullyClosed && (
              <>
                <button
                  onClick={handleMarkAllPresent}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4 text-slate-600" />
                  <span>Marcar Pendentes Presentes</span>
                </button>
                <button
                  onClick={() => setConfirmModalOpen(true)}
                  disabled={Object.keys(pendingMarks).length === 0}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-2xs ${
                    Object.keys(pendingMarks).length > 0
                      ? 'bg-[#f75142] hover:bg-[#e04436] text-white cursor-pointer active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Homologar Livro de Ponto ({Object.keys(pendingMarks).length})</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search & Shift/Status Filters */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por professor, disciplina, sala ou turma..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#f75142]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            {/* Shift Filter */}
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Turno:</span>
            {(['all', 'Manhã', 'Tarde', 'Noite'] as const).map((shift) => (
              <button
                key={shift}
                onClick={() => setShiftFilter(shift)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  shiftFilter === shift
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {shift === 'all' ? 'Todos' : shift}
              </button>
            ))}

            <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

            {/* Status Filter */}
            {(['all', 'pending', 'presente', 'falta'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === status
                    ? status === 'presente'
                      ? 'bg-emerald-600 text-white'
                      : status === 'falta'
                      ? 'bg-rose-600 text-white'
                      : status === 'pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'all'
                  ? 'Todos'
                  : status === 'pending'
                  ? `Pendentes (${metrics.pendentes})`
                  : status === 'presente'
                  ? `Presentes (${metrics.presentes})`
                  : `Faltas (${metrics.faltas})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Teacher Attendance List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredTeachers.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhum professor encontrado</p>
              <p className="text-xs text-slate-400 mt-0.5">Tente alterar os termos de busca ou filtros.</p>
            </div>
          ) : (
            filteredTeachers.map(({ teacher, currentStatus, isLocked, observacao, recordedAt, recordedBy }) => {
              const isMarkedPresent = currentStatus === 'presente';
              const isMarkedFalta = currentStatus === 'falta';

              return (
                <div
                  key={teacher.id}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    isLocked
                      ? isMarkedPresent
                        ? 'bg-emerald-50/20'
                        : 'bg-rose-50/20'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Teacher Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-[#002133] text-white flex items-center justify-center font-bold text-base border border-slate-200 shrink-0">
                        {teacher.name.charAt(0)}
                      </div>
                      {isLocked && (
                        <div
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs"
                          title="Ponto homologado e trancado pela Direção"
                        >
                          <Lock className="w-2.5 h-2.5 text-amber-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {teacher.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {teacher.shift}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {teacher.gradeClass} • {teacher.room}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                        Disciplina(s): <strong>{teacher.subject}</strong> • Turma: {teacher.turma}
                      </p>
                      {observacao && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1 inline-block">
                          Obs da Direção: {observacao}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Attendance Controls & Permanent Lock Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 self-end md:self-center">
                    {isLocked ? (
                      /* LOCKED STATE: READ-ONLY & UNALTERABLE */
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          {isMarkedPresent ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                              <span>PRESENÇA EM AULA</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                              <XCircle className="w-4 h-4 text-rose-700" />
                              <span>FALTA REGISTRADA</span>
                            </span>
                          )}

                          <div
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 cursor-not-allowed select-none"
                            title="Ponto trancado e auditado pela direção."
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Homologado</span>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {recordedAt
                            ? `Selado às ${new Date(recordedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • ${recordedBy || 'Direção'}`
                            : 'Registro definitivo'}
                        </span>
                      </div>
                    ) : (
                      /* UNLOCKED STATE: PENDING SELECTION AND HOMOLOGATION */
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSelectStatus(teacher.id, 'presente')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                            isMarkedPresent
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs scale-102'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500 hover:text-emerald-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Presente</span>
                        </button>

                        <button
                          onClick={() => handleSelectStatus(teacher.id, 'falta')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                            isMarkedFalta
                              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs scale-102'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-rose-500 hover:text-rose-700'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Falta</span>
                        </button>

                        {/* Justification / Note if Falta */}
                        {isMarkedFalta && (
                          <button
                            onClick={() => {
                              setJustificationModalTeacher(teacher);
                              setTempObservation(observacao || '');
                            }}
                            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline px-1 cursor-pointer"
                          >
                            {observacao ? 'Editar Motivo' : '+ Justificativa'}
                          </button>
                        )}

                        {/* Quick single-homologate button */}
                        {(isMarkedPresent || isMarkedFalta) && (
                          <button
                            onClick={() => handleLockSingleRecord(teacher)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                            title="Homologar este registro definitivamente e trancar"
                          >
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span>Homologar</span>
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

      {/* Confirmation Modal to permanently seal the teacher attendance sheet */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-amber-600" />
            </div>

            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Homologar Livro de Ponto Definitivo?
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Você está prestes a selar o ponto docente do dia <strong>{formattedDateFriendly}</strong> para{' '}
              <strong>{Object.keys(pendingMarks).length}</strong> professor(es).
            </p>

            <div className="p-3 my-4 rounded-xl bg-rose-50 border border-rose-200 text-left">
              <p className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Regra Inalterável do Livro de Ponto</span>
              </p>
              <p className="text-[11px] text-rose-700 mt-1">
                Uma vez homologados, estes registros serão <strong>trancados permanentemente</strong>. 
                Não será possível reverter ou editar as presenças e faltas gravadas.
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
                <span>Sim, Homologar e Trancar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Justification note modal */}
      {justificationModalTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-900 mb-1">
              Justificativa de Falta Docente
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Professor(a): <strong>{justificationModalTeacher.name}</strong>
            </p>

            <textarea
              rows={3}
              value={tempObservation}
              onChange={(e) => setTempObservation(e.target.value)}
              placeholder="Ex: Atestado médico entregue na secretaria, comissão externa pelo MED, etc."
              className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#f75142]"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setJustificationModalTeacher(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setPendingMarks((prev) => ({
                    ...prev,
                    [justificationModalTeacher.id]: {
                      status: 'falta',
                      observacao: tempObservation,
                    },
                  }));
                  setJustificationModalTeacher(null);
                  showToast('Justificativa anotada. Não se esqueça de homologar o ponto.');
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
