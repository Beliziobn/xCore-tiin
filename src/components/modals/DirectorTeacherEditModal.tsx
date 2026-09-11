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
import type { DirectorTeacher, TeacherRegistrationData } from '../../types';

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
  schoolName = 'Escola Modelo Central',
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
    }
  }, [teacher, schoolName]);

  // Unconditional hook declarations complete. Guard render if not open or no teacher.
  if (!isOpen || !teacher) return null;

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

    const updatedTeacher: DirectorTeacher = {
      ...teacher,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      schoolName: targetSchool.trim(),
      gradeClass: gradeClass.trim(),
      room: room.trim(),
      turma: turma.trim(),
      shift,
      subject: subject.trim(),
      location: location.trim(),
      presenceRate: Number(presenceRate) || 98,
      directorName: teacher.directorName || directorName,
      schedule,
    };

    onSave(updatedTeacher);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f75142] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {teacher.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Editar Dados do Professor
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                  Gestão do Diretor
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {teacher.name} • {teacher.gradeClass} ({teacher.turma}) • {teacher.room}
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
            <span>Alocação & Dados Escolares</span>
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

          {/* TAB 1: ALOCAÇÃO & DADOS ESCOLARES */}
          {activeTab === 'alocacao' && (
            <div className="space-y-4">
              {/* Identificação Geral */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <span className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#f75142]" />
                  <span>1. Identificação Básica & Contacto</span>
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
              </div>

              {/* Alocação Pedagógica */}
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                <span className="font-bold text-blue-900 block text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>2. Alocação Pedagógica (Turma, Sala e Turno)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Classe */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Classe / Ano Escolar
                    </label>
                    <input
                      type="text"
                      list="grade-presets"
                      value={gradeClass}
                      onChange={(e) => setGradeClass(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                    />
                    <datalist id="grade-presets">
                      {GRADE_PRESETS.map((g) => (
                        <option key={g} value={g} />
                      ))}
                    </datalist>
                  </div>

                  {/* Sala */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Sala de Aula
                    </label>
                    <input
                      type="text"
                      list="room-presets"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                    />
                    <datalist id="room-presets">
                      {ROOM_PRESETS.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>

                  {/* Turma */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Turma
                    </label>
                    <input
                      type="text"
                      list="turma-presets"
                      value={turma}
                      onChange={(e) => setTurma(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                    />
                    <datalist id="turma-presets">
                      {TURMA_PRESETS.map((tm) => (
                        <option key={tm} value={tm} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Turno */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Turno de Trabalho
                    </label>
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#f75142]"
                    >
                      <option value="Manhã">Turno Manhã (07h30 - 12h30)</option>
                      <option value="Tarde">Turno Tarde (13h00 - 18h00)</option>
                      <option value="Integral">Integral / Manhã e Tarde</option>
                    </select>
                  </div>

                  {/* Disciplina Principal */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Disciplina / Cadeira Principal
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ex.: Língua Portuguesa & Matemática"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#f75142]"
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
