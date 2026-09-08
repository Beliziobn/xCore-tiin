import React, { useState } from 'react';
import { X, CheckCircle, Plus, ShieldCheck, User, Users, Home, BookOpen, AlertCircle } from 'lucide-react';
import { StudentRegistrationModal } from '../../modals/StudentRegistrationModal';
import { TeacherRegistrationModal } from '../../modals/TeacherRegistrationModal';
import { CLASS_GROUPS, MAX_TURMA_CAPACITY } from '../../../data/classesConfig';

interface DirectorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'professores' | 'alunos' | 'salas' | 'classes';
  onSuccess: (newItem: any) => void;
}

export const DirectorRegistrationModal: React.FC<DirectorRegistrationModalProps> = ({
  isOpen,
  onClose,
  entityType,
  onSuccess,
}) => {
  if (!isOpen) return null;

  // If entity is 'alunos', render the comprehensive Student Registration Modal
  if (entityType === 'alunos') {
    return (
      <StudentRegistrationModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
        defaultGradeClass="4ª Classe"
        defaultTurma="Turma A"
        defaultRoom="Sala 03"
        defaultPeriod="Manhã"
        schoolName="Escola Modelo Central"
      />
    );
  }

  // If entity is 'professores', render the comprehensive Teacher Registration Modal
  if (entityType === 'professores') {
    return (
      <TeacherRegistrationModal
        isOpen={isOpen}
        onClose={onClose}
        defaultSchoolName="Escola Modelo Central"
        defaultMunicipality="Quêssua"
        defaultProvince="Malanje"
        authorName="Diretor de Escola"
        onSuccess={(teacherData) => {
          const formattedTeacher = {
            id: teacherData.id,
            name: teacherData.nomeCompleto,
            gradeClass: teacherData.niveisLecciona[0]?.nome || '4ª Classe',
            room: 'Sala 03',
            turma: 'Turma A',
            shift: teacherData.turnos[0] || 'Manhã',
            subject: teacherData.disciplinas || 'Educação Geral',
            phone: teacherData.telefone,
            status: 'ativo',
            bi: teacherData.biNif,
            registrationData: teacherData,
          };
          onSuccess(formattedTeacher);
          onClose();
        }}
      />
    );
  }

  // Form states
  const [name, setName] = useState('');
  const [gradeClass, setGradeClass] = useState('4ª Classe');
  const [room, setRoom] = useState('Sala 03');
  const [turma, setTurma] = useState('Turma A');
  const [period, setPeriod] = useState('Manhã');
  const [subject, setSubject] = useState('Educação Geral');
  const [guardian, setGuardian] = useState('');
  const [hasDocuments, setHasDocuments] = useState(true);
  const [capacity, setCapacity] = useState('45');
  const [roomType, setRoomType] = useState('Regular');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  const getTitle = () => {
    switch (entityType) {
      case 'professores':
        return 'Cadastrar Novo Professor';
      case 'alunos':
        return 'Matricular Novo Aluno';
      case 'salas':
        return 'Cadastrar Nova Sala Escolar';
      case 'classes':
        return 'Cadastrar Nova Matriz de Classe';
      default:
        return 'Cadastro';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessNotice(true);
      
      const createdItem = {
        id: 'new-' + Date.now(),
        name: name.trim(),
        gradeClass,
        room,
        turma,
        period,
        subject,
        guardianName: guardian.trim() || 'Encarregado Institucional',
        hasDocuments,
        schoolName: 'Escola Modelo Central',
        directorName: 'Fert Horlan',
        location: 'Pavilhão 1 - Bloco B',
        presenceRate: 100,
        studentCount: parseInt(capacity) || 45,
        status: 'Ativa',
        type: roomType,
      };

      setTimeout(() => {
        onSuccess(createdItem);
        onClose();
        setSuccessNotice(false);
        setName('');
        setGuardian('');
      }, 700);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-50 p-6 relative shrink-0 border-b border-slate-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f75142]/10 text-[#f75142] text-[10px] font-black uppercase tracking-[0.2em] mb-2 border border-[#f75142]/30">
            <ShieldCheck className="w-3.5 h-3.5 text-[#f75142]" />
            Gabinete de Direção • uCore
          </div>

          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
            {getTitle()}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Escola Modelo Central • Gestor: Fert Horlan
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {successNotice ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black uppercase text-slate-900">Cadastro Concluído com Sucesso!</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                O registro foi inserido no sistema da Escola Modelo Central e sincronizado na base do Diretor.
              </p>
            </div>
          ) : (
            <>
              {/* Field 1: Name */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  {entityType === 'salas' ? 'Número / Nome da Sala' : 'Nome Completo'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    entityType === 'professores'
                      ? 'Ex: Prof. Ambrósio Manuel'
                      : entityType === 'alunos'
                      ? 'Ex: Maria Antónia Diniz'
                      : entityType === 'salas'
                      ? 'Ex: Sala 12 - Bloco C'
                      : 'Ex: 10ª Classe - Turma Piloto'
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#f75142] focus:ring-2 focus:ring-[#f75142]/20 outline-none text-xs font-semibold text-slate-900 transition-all bg-white"
                />
              </div>

              {/* Grid with 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                {/* Classe */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Classe
                  </label>
                  <select
                    value={gradeClass}
                    onChange={(e) => setGradeClass(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-xs font-semibold text-slate-900 bg-white"
                  >
                    {CLASS_GROUPS.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.items.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Sala */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Sala
                  </label>
                  <select
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-xs font-semibold text-slate-900 bg-white"
                  >
                    {Array.from({ length: 11 }).map((_, i) => {
                      const num = String(i + 1).padStart(2, '0');
                      return <option key={num} value={`Sala ${num}`}>{`Sala ${num}`}</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* Periodo and Turma */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Período / Turno
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-xs font-semibold text-slate-900 bg-white"
                  >
                    <option value="Manhã">Manhã (07h30 - 12h00)</option>
                    <option value="Tarde">Tarde (12h30 - 17h30)</option>
                    <option value="Integral">Integral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Turma
                  </label>
                  <select
                    value={turma}
                    onChange={(e) => setTurma(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-xs font-semibold text-slate-900 bg-white"
                  >
                    <option value="Turma A">Turma A</option>
                    <option value="Turma B">Turma B</option>
                    <option value="Turma C">Turma C</option>
                  </select>
                </div>
              </div>

              {/* Specific fields depending on entityType */}
              {entityType === 'professores' && (
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Disciplina / Cadeira
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: Língua Portuguesa, Matemática, História"
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-xs text-slate-900 bg-white"
                  />
                </div>
              )}

              {entityType === 'alunos' && (
                <>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Nome do Encarregado de Educação
                    </label>
                    <input
                      type="text"
                      value={guardian}
                      onChange={(e) => setGuardian(e.target.value)}
                      placeholder="Ex: Sr. Francisco Kassoma"
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-xs text-slate-900 bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      id="doc-check"
                      checked={hasDocuments}
                      onChange={(e) => setHasDocuments(e.target.checked)}
                      className="w-4 h-4 text-[#f75142] rounded-sm focus:ring-[#f75142]"
                    />
                    <label htmlFor="doc-check" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Documentação completa apresentada (BI / Cédula / Certidão)
                    </label>
                  </div>
                </>
              )}

              {entityType === 'salas' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Capacidade (Lugares)
                    </label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-xs text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Tipo de Sala
                    </label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#f75142] outline-none text-xs text-slate-900 bg-white"
                    >
                      <option value="Regular">Regular</option>
                      <option value="Laboratório">Laboratório</option>
                      <option value="Recursos Multifuncionais (AEE)">AEE</option>
                      <option value="Biblioteca">Biblioteca</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Confirmar Cadastro</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
