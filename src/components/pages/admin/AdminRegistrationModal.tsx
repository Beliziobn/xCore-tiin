import React, { useState } from 'react';
import { X, School, User, Users, CheckCircle2, ShieldCheck, ShieldAlert, MapPin } from 'lucide-react';
import type { AdminSchool, AdminTeacher, AdminStudent, AdminDirector } from '../../../types';
import { StudentRegistrationModal } from '../../modals/StudentRegistrationModal';
import { TeacherRegistrationModal } from '../../modals/TeacherRegistrationModal';
import { SchoolRegistrationModal } from '../../modals/SchoolRegistrationModal';
import { QUESSUA_ZONES_LIST } from '../../../data/municipalitiesData';

export type AdminModalType = 'school' | 'teacher' | 'student' | 'director' | null;

interface AdminRegistrationModalProps {
  type: AdminModalType;
  isOpen: boolean;
  onClose: () => void;
  onAddSchool?: (school: AdminSchool) => void;
  onAddTeacher?: (teacher: AdminTeacher) => void;
  onAddStudent?: (student: AdminStudent) => void;
  onAddDirector?: (director: AdminDirector) => void;
  availableSchools: string[];
}

export const AdminRegistrationModal: React.FC<AdminRegistrationModalProps> = ({
  type,
  isOpen,
  onClose,
  onAddSchool,
  onAddTeacher,
  onAddStudent,
  onAddDirector,
  availableSchools,
}) => {
  // School Form State
  const [schoolName, setSchoolName] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [teachersCount, setTeachersCount] = useState('18');
  const [classesCount, setClassesCount] = useState('8');
  const [roomsCount, setRoomsCount] = useState('10');
  const [turmasCount, setTurmasCount] = useState('14');
  const [schoolZone, setSchoolZone] = useState<string>('Quêssua');
  const [schoolAddress, setSchoolAddress] = useState<string>('');
  const [studentsWithDocs, setStudentsWithDocs] = useState('320');
  const [studentsWithoutDocs, setStudentsWithoutDocs] = useState('45');
  const [performanceRate, setPerformanceRate] = useState('82');
  const [category, setCategory] = useState<'Ensino Primário' | 'Iº Ciclo' | 'IIº Ciclo' | 'Polivalente'>('Ensino Primário');
  const [phone, setPhone] = useState('+244 923 000 000');
  const [email, setEmail] = useState('');

  // Teacher Form State
  const [tName, setTName] = useState('');
  const [tPhone, setTPhone] = useState('+244 924 000 000');
  const [tClass, setTClass] = useState('4ª Classe');
  const [tRoom, setTRoom] = useState('Sala 03');
  const [tTurma, setTTurma] = useState('Turma A');
  const [tCategory, setTCategory] = useState('Professor Primário Efetivo');
  const [tLocation, setTLocation] = useState('Pavilhão 1 - Bloco B');
  const [tSchool, setTSchool] = useState(availableSchools[0] || 'Escola Modelo Central');
  const [tSubject, setTSubject] = useState('Língua Portuguesa & Matemática');

  // Student Form State
  const [sName, setSName] = useState('');
  const [sGender, setSGender] = useState<'F' | 'M'>('F');
  const [sClass, setSClass] = useState('4ª Classe');
  const [sRoom, setSRoom] = useState('Sala 03');
  const [sTurma, setSTurma] = useState('Turma A');
  const [sGuardian, setSGuardian] = useState('');
  const [sLocation, setSLocation] = useState('');
  const [sHasDocs, setSHasDocs] = useState(true);
  const [sDocType, setSDocType] = useState('BI Regularizado');
  const [sSchool, setSSchool] = useState(availableSchools[0] || 'Escola Modelo Central');
  const [sScore, setSScore] = useState('8.5');

  // Director Form State
  const [dName, setDName] = useState('');
  const [dSchool, setDSchool] = useState(availableSchools[0] || 'Escola Modelo Central');
  const [dPhone, setDPhone] = useState('+244 923 111 222');
  const [dEmail, setDEmail] = useState('');
  const [dYear, setDYear] = useState('2024');

  if (!isOpen || !type) return null;

  if (type === 'school') {
    return (
      <SchoolRegistrationModal
        isOpen={isOpen}
        onClose={onClose}
        defaultMunicipality="Quêssua"
        defaultProvince="Malanje"
        onSuccess={(newSchool) => {
          onAddSchool?.(newSchool);
          onClose();
        }}
      />
    );
  }

  if (type === 'student') {
    return (
      <StudentRegistrationModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={(regData) => {
          const newStudent: AdminStudent = {
            id: `std-${Date.now()}`,
            name: regData.name.trim(),
            gender: regData.genero,
            gradeClass: regData.classe,
            room: regData.sala,
            turma: regData.turma,
            guardianName: regData.encarregado.trim() || 'Encarregado de Educação',
            location: regData.endereco || 'Luanda Central',
            presenceRate: 97.5,
            hasDocuments: regData.tipoDocumento !== 'sem Documento',
            documentType: regData.tipoDocumento,
            numeroDocumento: regData.numeroDocumento,
            dataNascimento: regData.dataNascimento,
            idade: regData.idade,
            condicaoMatricula: regData.condicaoMatricula,
            foto: regData.foto,
            anexoDocumentoNome: regData.anexoDocumentoNome,
            performanceScore: 8.5,
            schoolName: sSchool || availableSchools[0] || 'Escola Modelo Central',
            registrationData: regData,
          };
          onAddStudent?.(newStudent);
          onClose();
        }}
        defaultGradeClass="4ª Classe"
        defaultTurma="Turma A"
        defaultRoom="Sala 03"
        defaultPeriod="Manhã"
        schoolName={sSchool || availableSchools[0] || 'Escola Modelo Central'}
      />
    );
  }

  if (type === 'teacher') {
    return (
      <TeacherRegistrationModal
        isOpen={isOpen}
        onClose={onClose}
        defaultSchoolName={availableSchools[0] || 'Escola Modelo Central de Quêssua'}
        defaultMunicipality="Quêssua"
        defaultProvince="Malanje"
        authorName="Administrador Municipal"
        onSuccess={(teacherData) => {
          const newTeacher: AdminTeacher = {
            id: teacherData.id,
            name: teacherData.nomeCompleto,
            phone: teacherData.telefone,
            gradeClass: teacherData.niveisLecciona[0]?.nome || 'Ensino Primário',
            room: 'Sala 01',
            turma: 'Turma A',
            category: teacherData.funcaoCategoria,
            location: `${teacherData.municipioEscola} (${teacherData.provinciaEscola})`,
            schoolName: teacherData.nomeEscola,
            presenceRate: 99.0,
            subject: teacherData.disciplinas || 'Língua Portuguesa & Matemática',
            registrationData: teacherData,
          };
          onAddTeacher?.(newTeacher);
          onClose();
        }}
      />
    );
  }

  const handleSubmitSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) return;
    const newSchool: AdminSchool = {
      id: `esc-${Date.now()}`,
      name: schoolName.trim(),
      directorName: directorName.trim() || 'Diretor a Designar',
      teachersCount: parseInt(teachersCount, 10) || 10,
      classesCount: parseInt(classesCount, 10) || 6,
      roomsCount: parseInt(roomsCount, 10) || 8,
      turmasCount: parseInt(turmasCount, 10) || 12,
      location: `${schoolZone} - ${schoolAddress.trim() || 'Zona Principal'}`,
      studentsWithDocs: parseInt(studentsWithDocs, 10) || 200,
      studentsWithoutDocs: parseInt(studentsWithoutDocs, 10) || 30,
      performanceRate: Math.min(100, Math.max(0, parseInt(performanceRate, 10) || 80)),
      attendanceRate: 96.5,
      category,
      phone,
      email: email.trim() || `${schoolName.toLowerCase().replace(/\s+/g, '')}@ucore.edu.ao`,
    };
    onAddSchool?.(newSchool);
    onClose();
  };

  const handleSubmitTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim()) return;
    const newTeacher: AdminTeacher = {
      id: `prof-${Date.now()}`,
      name: tName.trim(),
      phone: tPhone.trim(),
      gradeClass: tClass,
      room: tRoom,
      turma: tTurma,
      category: tCategory,
      location: tLocation,
      schoolName: tSchool,
      presenceRate: 98.2,
      subject: tSubject,
    };
    onAddTeacher?.(newTeacher);
    onClose();
  };

  const handleSubmitStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName.trim()) return;
    const newStudent: AdminStudent = {
      id: `std-${Date.now()}`,
      name: sName.trim(),
      gender: sGender,
      gradeClass: sClass,
      room: sRoom,
      turma: sTurma,
      guardianName: sGuardian.trim() || 'Encarregado de Educação',
      location: sLocation.trim() || 'Luanda Central',
      presenceRate: 97.5,
      hasDocuments: sHasDocs,
      documentType: sHasDocs ? sDocType : 'Sem Registro Civil',
      performanceScore: parseFloat(sScore) || 8.0,
      schoolName: sSchool,
    };
    onAddStudent?.(newStudent);
    onClose();
  };

  const handleSubmitDirector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dName.trim()) return;
    const newDirector: AdminDirector = {
      id: `dir-${Date.now()}`,
      name: dName.trim(),
      schoolName: dSchool,
      phone: dPhone.trim(),
      email: dEmail.trim() || `${dName.toLowerCase().replace(/\s+/g, '.')}@ucore.edu.ao`,
      appointmentYear: parseInt(dYear, 10) || 2025,
      status: 'Ativo',
      performanceRating: 88,
      teachersCount: 22,
      studentsCount: 450,
      location: 'Sede da Unidade Escolar',
    };
    onAddDirector?.(newDirector);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#f75142] px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              {type === 'school' && <School className="w-5 h-5 text-white" />}
              {type === 'teacher' && <User className="w-5 h-5 text-white" />}
              {type === 'student' && <Users className="w-5 h-5 text-white" />}
              {type === 'director' && <User className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>
                  {type === 'school' && 'Cadastrar Nova Escola na Rede'}
                  {type === 'teacher' && 'Cadastrar Novo Professor'}
                  {type === 'student' && 'Matricular / Cadastrar Novo Aluno'}
                  {type === 'director' && 'Homologar Novo Diretor Escolar'}
                </span>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">
                  Sincronizado c/ Excel
                </span>
              </h3>
              <p className="text-xs text-white/80">
                Os dados inseridos são organizados em planilhas Excel (.xlsx) separadas e consolidadas para exportação do Administrador.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* SCHOOL FORM */}
          {type === 'school' && (
            <form onSubmit={handleSubmitSchool} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nome da Escola *
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Ex: Escola Primária 14 de Abril"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Diretor(a) Responsável
                  </label>
                  <input
                    type="text"
                    value={directorName}
                    onChange={(e) => setDirectorName(e.target.value)}
                    placeholder="Ex: Prof. Albertina Costa"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nº Professores
                  </label>
                  <input
                    type="number"
                    value={teachersCount}
                    onChange={(e) => setTeachersCount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nº Classes
                  </label>
                  <input
                    type="number"
                    value={classesCount}
                    onChange={(e) => setClassesCount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nº Salas
                  </label>
                  <input
                    type="number"
                    value={roomsCount}
                    onChange={(e) => setRoomsCount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nº Turmas
                  </label>
                  <input
                    type="number"
                    value={turmasCount}
                    onChange={(e) => setTurmasCount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Alunos Com Documentos
                  </label>
                  <input
                    type="number"
                    value={studentsWithDocs}
                    onChange={(e) => setStudentsWithDocs(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Alunos Sem Documentos
                  </label>
                  <input
                    type="number"
                    value={studentsWithoutDocs}
                    onChange={(e) => setStudentsWithoutDocs(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Categoria da Escola
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  >
                    <option value="Ensino Primário">Ensino Primário</option>
                    <option value="Iº Ciclo">Iº Ciclo</option>
                    <option value="IIº Ciclo">IIº Ciclo</option>
                    <option value="Polivalente">Polivalente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Índice de Desempenho (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={performanceRate}
                    onChange={(e) => setPerformanceRate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>

              <div className="bg-[#fef2f1]/80 border border-[#fee4e2] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#f75142]" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Localização no Município do Quêssua *
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Zona do Município *
                    </label>
                    <select
                      value={schoolZone}
                      onChange={(e) => setSchoolZone(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142] font-semibold text-slate-800 cursor-pointer shadow-sm"
                    >
                      {QUESSUA_ZONES_LIST.map((zone) => (
                        <option key={zone} value={zone}>
                          {zone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Bairro / Rua / Ponto de Referência
                    </label>
                    <input
                      type="text"
                      value={schoolAddress}
                      onChange={(e) => setSchoolAddress(e.target.value)}
                      placeholder="Ex: Bairro Central, Rua Principal, Sector 2"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142] shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#fee4e2] text-slate-600">
                  <span>Localização no cadastro:</span>
                  <span className="font-bold text-[#f75142] bg-white px-2.5 py-0.5 rounded-md border border-[#fee4e2] shadow-xs">
                    {schoolZone} - {schoolAddress.trim() || 'Zona Central'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar e Adicionar à Rede
                </button>
              </div>
            </form>
          )}

          {/* TEACHER FORM */}
          {type === 'teacher' && (
            <form onSubmit={handleSubmitTeacher} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Homologação Administrativa de Docente:</span>
                  Na hierarquia uCore, o cadastro presencial de professores é de competência do Diretor de cada Escola. Este registro pelo Admin será processado como homologação extraordinária de rede vinculada à Direção da escola designada.
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nome Completo do Professor *
                  </label>
                  <input
                    type="text"
                    required
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    placeholder="Ex: João Baptista Silva"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Telefone de Contato
                  </label>
                  <input
                    type="text"
                    value={tPhone}
                    onChange={(e) => setTPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Escola Alocada
                  </label>
                  <select
                    value={tSchool}
                    onChange={(e) => setTSchool(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  >
                    {availableSchools.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Categoria Profissional
                  </label>
                  <input
                    type="text"
                    value={tCategory}
                    onChange={(e) => setTCategory(e.target.value)}
                    placeholder="Ex: Licenciado, Efetivo, etc."
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Classe
                  </label>
                  <input
                    type="text"
                    value={tClass}
                    onChange={(e) => setTClass(e.target.value)}
                    placeholder="Ex: 4ª Classe"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sala
                  </label>
                  <input
                    type="text"
                    value={tRoom}
                    onChange={(e) => setTRoom(e.target.value)}
                    placeholder="Ex: Sala 03"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Turma
                  </label>
                  <input
                    type="text"
                    value={tTurma}
                    onChange={(e) => setTTurma(e.target.value)}
                    placeholder="Ex: Turma A"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Localização / Bloco
                </label>
                <input
                  type="text"
                  value={tLocation}
                  onChange={(e) => setTLocation(e.target.value)}
                  placeholder="Ex: Pavilhão 1 - Bloco B"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Cadastrar Professor
                </button>
              </div>
            </form>
          )}

          {/* STUDENT FORM */}
          {type === 'student' && (
            <form onSubmit={handleSubmitStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nome do Aluno *
                  </label>
                  <input
                    type="text"
                    required
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                    placeholder="Ex: Domingas António Pedro"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gênero
                  </label>
                  <div className="flex items-center gap-4 py-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={sGender === 'F'}
                        onChange={() => setSGender('F')}
                        className="text-[#f75142]"
                      />
                      Feminino (F)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={sGender === 'M'}
                        onChange={() => setSGender('M')}
                        className="text-[#f75142]"
                      />
                      Masculino (M)
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Escola
                  </label>
                  <select
                    value={sSchool}
                    onChange={(e) => setSSchool(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  >
                    {availableSchools.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nome dos Encarregados
                  </label>
                  <input
                    type="text"
                    value={sGuardian}
                    onChange={(e) => setSGuardian(e.target.value)}
                    placeholder="Ex: António Pedro & Madalena João"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Classe
                  </label>
                  <input
                    type="text"
                    value={sClass}
                    onChange={(e) => setSClass(e.target.value)}
                    placeholder="Ex: 4ª Classe"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sala
                  </label>
                  <input
                    type="text"
                    value={sRoom}
                    onChange={(e) => setSRoom(e.target.value)}
                    placeholder="Ex: Sala 03"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Turma
                  </label>
                  <input
                    type="text"
                    value={sTurma}
                    onChange={(e) => setSTurma(e.target.value)}
                    placeholder="Ex: Turma A"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status de Documentação
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={sHasDocs}
                      onChange={(e) => setSHasDocs(e.target.checked)}
                      className="w-4 h-4 text-[#f75142] rounded"
                    />
                    Possui Documentação / Registro Civil
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo de Documento
                  </label>
                  <input
                    type="text"
                    disabled={!sHasDocs}
                    value={sHasDocs ? sDocType : 'Sem Registro'}
                    onChange={(e) => setSDocType(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Localização / Endereço
                </label>
                <input
                  type="text"
                  value={sLocation}
                  onChange={(e) => setSLocation(e.target.value)}
                  placeholder="Ex: Bairro Central, Rua 12, Casa 30"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Matricular Aluno
                </button>
              </div>
            </form>
          )}

          {/* DIRECTOR FORM */}
          {type === 'director' && (
            <form onSubmit={handleSubmitDirector} className="space-y-4">
              <div className="bg-[#fef2f1] border border-[#fee4e2] rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#002133]">
                <ShieldCheck className="w-4 h-4 text-[#f75142] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Investidura de Autoridade Escolar:</span>
                  Ao cadastrar e homologar este Diretor de Escola, ele assumirá a posse administrativa e a autorização de segurança para cadastrar professores e matricular alunos em sua unidade escolar.
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome do Diretor *
                </label>
                <input
                  type="text"
                  required
                  value={dName}
                  onChange={(e) => setDName(e.target.value)}
                  placeholder="Ex: Fert Horlan"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Escola a Dirigir
                  </label>
                  <select
                    value={dSchool}
                    onChange={(e) => setDSchool(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  >
                    {availableSchools.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={dPhone}
                    onChange={(e) => setDPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Homologar Diretor
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
