import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Plus,
  Trash2,
  Clock,
  User,
  BookOpen,
  Building2,
  Calendar,
  Edit3,
  FileText,
  Save,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Award,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import type { DirectorTeacher, TeacherRegistrationData, TeacherTurmaAssignment } from '../../types';
import { getDisciplinasForClass } from '../../utils/miniPautaStorage';

interface DirectorTeacherEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: DirectorTeacher | null;
  onSave: (updatedTeacher: DirectorTeacher) => void;
  onOpenFullDossier?: (teacher: DirectorTeacher) => void;
  schoolName?: string;
  directorName?: string;
  initialTab?: 'alocacao' | 'horario' | 'dossie';
}

const COMMON_DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const PERIOD_PRESETS = [
  '07h30 - 09h10',
  '09h30 - 11h10',
  '11h30 - 13h10',
  '13h00 - 14h40',
  '15h00 - 16h40',
  '17h00 - 18h40',
];
const GRADE_PRESETS = [
  'Classe de Iniciação',
  '1ª Classe',
  '2ª Classe',
  '3ª Classe',
  '4ª Classe',
  '5ª Classe',
  '6ª Classe',
  '7ª Classe',
  '8ª Classe',
  '9ª Classe',
  '10ª Classe',
  '11ª Classe',
  '12ª Classe',
  'PRAEER - Etapa 1',
  'PRAEER - Etapa 2',
  'PRAEER - Etapa 3',
];
const TURMA_PRESETS = ['Turma A', 'Turma B', 'Turma C', 'Turma D', 'Turma Única'];
const ROOM_PRESETS = [
  'Sala 01',
  'Sala 02',
  'Sala 03',
  'Sala 04',
  'Sala 05',
  'Sala 06',
  'Sala 07',
  'Sala 08',
  'Sala 09',
  'Sala 10',
  'Sala 11',
  'Sala 12',
];

export const DirectorTeacherEditModal: React.FC<DirectorTeacherEditModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onSave,
  onOpenFullDossier,
  schoolName = '',
  directorName = 'Diretor de Escola',
  initialTab = 'alocacao',
}) => {
  const [activeTab, setActiveTab] = useState<'alocacao' | 'horario' | 'dossie'>(initialTab);

  // Form State - safely default when teacher is null
  const [name, setName] = useState(teacher?.name || '');
  const [phone, setPhone] = useState(teacher?.phone || '+244 923 000 000');
  const [email, setEmail] = useState(teacher?.email || '');
  const [targetSchool, setTargetSchool] = useState(teacher?.schoolName || schoolName);
  const [gradeClass, setGradeClass] = useState(teacher?.gradeClass || '4ª Classe');
  const [room, setRoom] = useState(teacher?.room || 'Sala 03');
  const [turma, setTurma] = useState(teacher?.turma || 'Turma A');
  const [shift, setShift] = useState<'Manhã' | 'Tarde' | 'Integral'>(teacher?.shift || 'Manhã');
  const [subject, setSubject] = useState(teacher?.subject || 'Língua Portuguesa');
  const [location, setLocation] = useState(teacher?.location || 'Pavilhão 1 - Bloco B');
  const [presenceRate, setPresenceRate] = useState<number>(teacher?.presenceRate ?? 98.5);

  // Turmas Atribuídas (Distribuição e Redefinição de Turmas sob Responsabilidade)
  const [assignedTurmas, setAssignedTurmas] = useState<TeacherTurmaAssignment[]>([]);
  const [newTurmaGrade, setNewTurmaGrade] = useState('4ª Classe');
  const [newTurmaName, setNewTurmaName] = useState('Turma B');
  const [newTurmaRoom, setNewTurmaRoom] = useState('Sala 04');
  const [newTurmaShift, setNewTurmaShift] = useState<'Manhã' | 'Tarde' | 'Integral'>('Manhã');
  const [newTurmaSubject, setNewTurmaSubject] = useState('Língua Portuguesa');
  const [newTurmaIsRegent, setNewTurmaIsRegent] = useState(true);

  // Schedule State
  const [schedule, setSchedule] = useState<{ day: string; period: string; subject: string; room: string }[]>(
    teacher?.schedule ? [...teacher.schedule] : []
  );

  // New Schedule Item Inputs
  const [newDay, setNewDay] = useState('Segunda');
  const [newPeriod, setNewPeriod] = useState('07h30 - 09h10');
  const [newSubject, setNewSubject] = useState(teacher?.subject || 'Língua Portuguesa');
  const [newRoom, setNewRoom] = useState(teacher?.room || 'Sala 03');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (teacher) {
      setName(teacher.name);
      setPhone(teacher.phone || '+244 923 000 000');
      setEmail(teacher.email || '');
      setTargetSchool(teacher.schoolName || schoolName);
      setGradeClass(teacher.gradeClass || '4ª Classe');
      setRoom(teacher.room || 'Sala 03');
      setTurma(teacher.turma || 'Turma A');
      setShift(teacher.shift || 'Manhã');
      setSubject(teacher.subject || 'Língua Portuguesa');
      setLocation(teacher.location || 'Pavilhão 1 - Bloco B');
      setPresenceRate(teacher.presenceRate ?? 98.5);
      setSchedule(teacher.schedule ? [...teacher.schedule] : []);
      setNewSubject(teacher.subject || 'Língua Portuguesa');
      setNewRoom(teacher.room || 'Sala 03');

      const initialAssignments: TeacherTurmaAssignment[] =
        Array.isArray(teacher.assignedTurmas) && teacher.assignedTurmas.length > 0
          ? teacher.assignedTurmas.map((a) => ({ ...a }))
          : [
              {
                id: `asg-${teacher.id}-primary`,
                gradeClass: teacher.gradeClass || '4ª Classe',
                turma: teacher.turma || 'Turma A',
                room: teacher.room || 'Sala 03',
                shift: teacher.shift || 'Manhã',
                subject: teacher.subject || 'Regente (Todas as Disciplinas)',
                isClassRegent: true,
              },
            ];
      setAssignedTurmas(initialAssignments);
      setNewTurmaGrade(teacher.gradeClass || '4ª Classe');
      setNewTurmaSubject(teacher.subject || 'Língua Portuguesa');
      setNewTurmaShift(teacher.shift || 'Manhã');
    }
  }, [teacher, schoolName]);

  // Unconditional hook declarations complete. Guard render if not open or no teacher.
  if (!isOpen || !teacher) return null;

  const handleUpdateAssignedTurma = (
    idx: number,
    patch: Partial<TeacherTurmaAssignment>
  ) => {
    setAssignedTurmas((prev) => {
      const next = prev.map((item, i) => (i === idx ? { ...item, ...patch } : item));
      if (idx === 0 && next[0]) {
        setGradeClass(next[0].gradeClass);
        setTurma(next[0].turma);
        setRoom(next[0].room);
        setShift(next[0].shift);
        setSubject(next[0].subject);
      }
      return next;
    });
  };

  const handleSetPrimaryTurma = (idx: number) => {
    setAssignedTurmas((prev) => {
      if (idx <= 0 || idx >= prev.length) return prev;
      const chosen = prev[idx];
      const rest = prev.filter((_, i) => i !== idx);
      const next = [chosen, ...rest];
      setGradeClass(chosen.gradeClass);
      setTurma(chosen.turma);
      setRoom(chosen.room);
      setShift(chosen.shift);
      setSubject(chosen.subject);
      return next;
    });
  };

  const handleAddAssignedTurma = () => {
    if (!newTurmaGrade.trim() || !newTurmaName.trim()) {
      setErrorMsg('Informe a Classe e a Turma para atribuir ao professor.');
      return;
    }
    setErrorMsg(null);
    const newEntry: TeacherTurmaAssignment = {
      id: `asg-${teacher.id}-${Date.now()}`,
      gradeClass: newTurmaGrade.trim(),
      turma: newTurmaName.trim(),
      room: newTurmaRoom.trim() || 'Sala 01',
      shift: newTurmaShift,
      subject: newTurmaSubject.trim() || subject || 'Regente (Todas as Disciplinas)',
      isClassRegent: newTurmaIsRegent,
    };
    setAssignedTurmas((prev) => {
      const next = [...prev, newEntry];
      if (next.length === 1) {
        setGradeClass(newEntry.gradeClass);
        setTurma(newEntry.turma);
        setRoom(newEntry.room);
        setShift(newEntry.shift);
        setSubject(newEntry.subject);
      }
      return next;
    });
  };

  const handleRemoveAssignedTurma = (idx: number) => {
    if (assignedTurmas.length <= 1) {
      setErrorMsg('O professor deve ter pelo menos 1 turma atribuída sob sua responsabilidade. Pode redefinir a classe/turma diretamente na linha.');
      return;
    }
    setErrorMsg(null);
    setAssignedTurmas((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next[0]) {
        setGradeClass(next[0].gradeClass);
        setTurma(next[0].turma);
        setRoom(next[0].room);
        setShift(next[0].shift);
        setSubject(next[0].subject);
      }
      return next;
    });
  };

  const handleAddScheduleItem = () => {
    if (!newDay || !newPeriod || !newSubject) {
      setErrorMsg('Por favor informe o Dia, Período e Disciplina para a nova aula.');
      return;
    }
    setErrorMsg(null);
    setSchedule((prev) => [
      ...prev,
      {
        day: newDay,
        period: newPeriod,
        subject: newSubject,
        room: newRoom || room,
      },
    ]);
  };

  const handleRemoveScheduleItem = (index: number) => {
    setSchedule((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('O nome do professor é obrigatório.');
      setActiveTab('alocacao');
      return;
    }

    const finalAssignments: TeacherTurmaAssignment[] =
      assignedTurmas.length > 0
        ? assignedTurmas
        : [
            {
              id: `asg-${teacher.id}-primary`,
              gradeClass: gradeClass.trim(),
              turma: turma.trim(),
              room: room.trim(),
              shift,
              subject: subject.trim(),
              isClassRegent: true,
            },
          ];

    const primary = finalAssignments[0];

    const updatedTeacher: DirectorTeacher = {
      ...teacher,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      schoolName: targetSchool.trim(),
      gradeClass: primary.gradeClass.trim(),
      room: primary.room.trim(),
      turma: primary.turma.trim(),
      shift: primary.shift,
      subject: primary.subject.trim() || subject.trim(),
      location: location.trim(),
      presenceRate: Number(presenceRate) || 98,
      directorName: teacher.directorName || directorName,
      assignedTurmas: finalAssignments,
      schedule,
    };

    onSave(updatedTeacher);
    onClose();
  };

  const availableSubjectsForNewTurma = getDisciplinasForClass(newTurmaGrade);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f75142] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {teacher.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Distribuir & Redefinir Turmas do Professor
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                  Gestão do Diretor
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {teacher.name} • {assignedTurmas.length}{' '}
                {assignedTurmas.length === 1 ? 'turma atribuída' : 'turmas atribuídas'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-slate-100 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('alocacao')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'alocacao'
                ? 'text-[#f75142] border-[#f75142] bg-[#fef2f1]/50'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Distribuição & Redefinição de Turmas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-[#f75142] font-bold ml-0.5">
              {assignedTurmas.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('horario')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'horario'
                ? 'text-[#f75142] border-[#f75142] bg-[#fef2f1]/50'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Horário Semanal de Aulas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-semibold ml-0.5">
              {schedule.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dossie')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'dossie'
                ? 'text-[#f75142] border-[#f75142] bg-[#fef2f1]/50'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Dossiê & Habilitações</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: DISTRIBUIÇÃO & REDEFINIÇÃO DE TURMAS */}
          {activeTab === 'alocacao' && (
            <div className="space-y-4">
              {/* QUADRO DE TURMAS SOB RESPONSABILIDADE DO PROFESSOR */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-blue-950 block text-xs flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-700" />
                      <span>1. Turmas Atribuídas sob Responsabilidade do Professor</span>
                    </span>
                    <p className="text-[11px] text-blue-800/80 mt-0.5">
                      Redefina a classe, turma, sala, turno ou disciplina de cada turma, ou adicione novas turmas ao docente.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-900 text-white">
                    {assignedTurmas.length} {assignedTurmas.length === 1 ? 'Turma Atribuída' : 'Turmas Atribuídas'}
                  </span>
                </div>

                <datalist id="grade-presets">
                  {GRADE_PRESETS.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
                <datalist id="room-presets">
                  {ROOM_PRESETS.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
                <datalist id="turma-presets">
                  {TURMA_PRESETS.map((tm) => (
                    <option key={tm} value={tm} />
                  ))}
                </datalist>

                <div className="space-y-2.5">
                  {assignedTurmas.map((asg, idx) => (
                    <div
                      key={asg.id || idx}
                      className={`p-3 rounded-xl border transition-all ${
                        idx === 0
                          ? 'bg-white border-blue-400 shadow-xs ring-1 ring-blue-400/30'
                          : 'bg-white/90 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              idx === 0
                                ? 'bg-[#f75142] text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {idx === 0 ? 'Turma Principal' : `Turma #${idx + 1}`}
                          </span>
                          <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={asg.isClassRegent !== false}
                              onChange={(e) =>
                                handleUpdateAssignedTurma(idx, {
                                  isClassRegent: e.target.checked,
                                })
                              }
                              className="rounded border-slate-300 text-[#f75142] focus:ring-[#f75142]"
                            />
                            <span>Diretor de Turma / Professor Regente</span>
                          </label>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryTurma(idx)}
                              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                              title="Tornar esta a turma principal do professor"
                            >
                              Definir como Principal
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveAssignedTurma(idx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remover esta turma da responsabilidade do professor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            Classe
                          </label>
                          <select
                            value={asg.gradeClass}
                            onChange={(e) =>
                              handleUpdateAssignedTurma(idx, {
                                gradeClass: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                          >
                            {!GRADE_PRESETS.includes(asg.gradeClass) && (
                              <option value={asg.gradeClass}>{asg.gradeClass}</option>
                            )}
                            {GRADE_PRESETS.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            Turma
                          </label>
                          <select
                            value={asg.turma}
                            onChange={(e) =>
                              handleUpdateAssignedTurma(idx, {
                                turma: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                          >
                            {!TURMA_PRESETS.includes(asg.turma) && (
                              <option value={asg.turma}>{asg.turma}</option>
                            )}
                            {TURMA_PRESETS.map((tm) => (
                              <option key={tm} value={tm}>
                                {tm}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            Sala
                          </label>
                          <select
                            value={asg.room}
                            onChange={(e) =>
                              handleUpdateAssignedTurma(idx, {
                                room: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                          >
                            {!ROOM_PRESETS.includes(asg.room) && (
                              <option value={asg.room}>{asg.room}</option>
                            )}
                            {ROOM_PRESETS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            Turno
                          </label>
                          <select
                            value={asg.shift}
                            onChange={(e) =>
                              handleUpdateAssignedTurma(idx, {
                                shift: e.target.value as 'Manhã' | 'Tarde' | 'Integral',
                              })
                            }
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                          >
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Integral">Integral</option>
                          </select>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            Disciplina / Função
                          </label>
                          <input
                            type="text"
                            value={asg.subject}
                            onChange={(e) =>
                              handleUpdateAssignedTurma(idx, {
                                subject: e.target.value,
                              })
                            }
                            placeholder="Ex: Matemática ou Regente"
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Formulário para atribuir mais uma turma ao professor */}
                <div className="p-3 bg-white rounded-xl border border-dashed border-blue-300 space-y-2.5">
                  <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[#f75142]" />
                    <span>Distribuir / Atribuir Nova Turma a este Professor</span>
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Classe
                      </label>
                      <select
                        value={newTurmaGrade}
                        onChange={(e) => {
                          const g = e.target.value;
                          setNewTurmaGrade(g);
                          const discs = getDisciplinasForClass(g);
                          if (discs.length > 0) {
                            setNewTurmaSubject(discs[0]);
                          }
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      >
                        {GRADE_PRESETS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Turma
                      </label>
                      <select
                        value={newTurmaName}
                        onChange={(e) => setNewTurmaName(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      >
                        {TURMA_PRESETS.map((tm) => (
                          <option key={tm} value={tm}>
                            {tm}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Sala
                      </label>
                      <select
                        value={newTurmaRoom}
                        onChange={(e) => setNewTurmaRoom(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      >
                        {ROOM_PRESETS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Turno
                      </label>
                      <select
                        value={newTurmaShift}
                        onChange={(e) =>
                          setNewTurmaShift(e.target.value as 'Manhã' | 'Tarde' | 'Integral')
                        }
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      >
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Integral">Integral</option>
                      </select>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Disciplina
                      </label>
                      <select
                        value={newTurmaSubject}
                        onChange={(e) => setNewTurmaSubject(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      >
                        <option value="Regente (Todas as Disciplinas)">
                          Regente (Todas as Disciplinas)
                        </option>
                        {availableSubjectsForNewTurma.map((dName) => (
                          <option key={dName} value={dName}>
                            {dName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newTurmaIsRegent}
                        onChange={(e) => setNewTurmaIsRegent(e.target.checked)}
                        className="rounded border-slate-300 text-[#f75142] focus:ring-[#f75142]"
                      />
                      <span>Designar como Diretor de Turma / Professor Regente desta turma</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleAddAssignedTurma}
                      className="px-3.5 py-1.5 bg-[#002133] hover:bg-[#00334e] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#f75142]" />
                      <span>Atribuir Turma ao Professor</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Identificação Geral & Contacto */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <span className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#f75142]" />
                  <span>2. Identificação Básica, Contacto & Localização</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nome Completo do Professor *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Escola de Lotação
                    </label>
                    <input
                      type="text"
                      value={targetSchool}
                      onChange={(e) => setTargetSchool(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Contacto Telefónico
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Correio Electrónico (Email)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="professor@ucore.edu.ao"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Localização / Pavilhão */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Localização Física na Escola
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ex.: Pavilhão 1 - Bloco B"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>

                  {/* Taxa de Presença / Assiduidade */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Assiduidade / Taxa de Presença
                      </label>
                      <span className="font-bold text-[#f75142]">{presenceRate}%</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={100}
                      step={0.5}
                      value={presenceRate}
                      onChange={(e) => setPresenceRate(parseFloat(e.target.value))}
                      className="w-full accent-[#f75142] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HORÁRIO SEMANAL DE AULAS */}
          {activeTab === 'horario' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
                <span className="font-bold text-amber-950 block text-xs flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Adicionar Novo Tempo Lectivo ao Horário</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Dia da Semana
                    </label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      {COMMON_DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Período / Horário
                    </label>
                    <input
                      type="text"
                      list="period-presets"
                      value={newPeriod}
                      onChange={(e) => setNewPeriod(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                    <datalist id="period-presets">
                      {PERIOD_PRESETS.map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Disciplina
                    </label>
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Sala
                    </label>
                    <input
                      type="text"
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddScheduleItem}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Tempo Lectivo</span>
                  </button>
                </div>
              </div>

              {/* Lista dos Tempos Lectivos Atuais */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Grade Semanal de Aulas ({schedule.length} tempos cadastrados)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Carga horária estimada: <strong>{schedule.length * 2} horas/semana</strong>
                  </span>
                </div>

                {schedule.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                    Nenhum tempo lectivo cadastrado para este professor. Utilize o formulário acima para adicionar aulas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {schedule.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-20 font-black text-xs text-[#f75142] uppercase tracking-wider">
                            {item.day}
                          </span>
                          <span className="text-[11px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                            {item.period}
                          </span>
                          <span className="font-bold text-xs text-slate-900">
                            {item.subject}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            em {item.room}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveScheduleItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remover este tempo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DOSSIÊ & HABILITAÇÕES OFICIAIS */}
          {activeTab === 'dossie' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-bold text-emerald-950">
                      Dossiê Oficial e Habilitações Pedagógicas (SIGE/MED)
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Homologado
                  </span>
                </div>

                <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                  Como Diretor de Escola, tem competência para atualizar o dossiê cadastral completo deste docente, incluindo habilitações literárias, magistério, vínculo ministerial (Efectivo/Contratado) e histórico de auditoria.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-2">
                  {onOpenFullDossier && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenFullDossier(teacher);
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Abrir Dossiê Completo de 8 Etapas</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Resumo Rápido do Dossiê */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <span className="font-bold text-slate-800 block mb-1">
                  Resumo das Habilitações Registadas
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200/60">
                    <span className="text-slate-500">Nível Académico:</span>
                    <strong className="text-slate-900">
                      {teacher.registrationData?.nivelAcademico || 'Licenciado'}
                    </strong>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200/60">
                    <span className="text-slate-500">Regime de Trabalho:</span>
                    <strong className="text-slate-900">
                      {teacher.registrationData?.regimeTrabalho || 'Efectivo'}
                    </strong>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200/60">
                    <span className="text-slate-500">Classif. Pedagógica:</span>
                    <span className="font-semibold text-slate-900 text-right truncate max-w-[180px]">
                      {teacher.registrationData?.classificacaoPedagogica || 'Com magistério e IMNE'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200/60">
                    <span className="text-slate-500">Anos de Serviço:</span>
                    <strong className="text-slate-900">
                      {teacher.registrationData?.anosServico ?? 8} anos
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Modo Diretor de Escola • Atualizações gravadas com trilha de auditoria
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold bg-[#f75142] hover:bg-[#e04436] text-white rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
