import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, CheckCircle2, Clock, Calendar, ChevronDown, ShieldCheck } from 'lucide-react';
import { Hero } from '../../Hero';
import { directorTeachersData as initialTeachers } from '../../../data/directorData';
import { DirectorRegistrationModal } from './DirectorRegistrationModal';
import type { DirectorTeacher, AdminTeacher } from '../../../types';

interface DirectorTeachersPageProps {
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
  onAddTeacherGlobal?: (teacher: AdminTeacher) => void;
}

export const DirectorTeachersPage: React.FC<DirectorTeachersPageProps> = ({
  onOpenGetStarted,
  isLoggedIn,
  onAddTeacherGlobal,
}) => {
  const [teachers, setTeachers] = useState<DirectorTeacher[]>(initialTeachers);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || 'prof-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.gradeClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesShift = filterShift === 'all' || t.shift === filterShift;
      return matchesSearch && matchesShift;
    });
  }, [teachers, searchQuery, filterShift]);

  // Currently inspected teacher
  const currentTeacher =
    teachers.find((t) => t.id === selectedTeacherId) || filteredTeachers[0] || teachers[0];

  const handleCreateSuccess = (newTeacher: any) => {
    const formatted: DirectorTeacher = {
      id: newTeacher.id,
      name: newTeacher.name,
      schoolName: newTeacher.schoolName,
      gradeClass: newTeacher.gradeClass,
      room: newTeacher.room,
      turma: newTeacher.turma,
      directorName: newTeacher.directorName,
      location: newTeacher.location,
      subject: newTeacher.subject,
      presenceRate: 100,
      shift: newTeacher.period === 'Tarde' ? 'Tarde' : 'Manhã',
      schedule: [
        { day: 'Segunda', period: '07h30 - 09h10', subject: newTeacher.subject, room: newTeacher.room },
        { day: 'Quarta', period: '09h30 - 11h10', subject: newTeacher.subject, room: newTeacher.room },
      ],
    };
    setTeachers((prev) => [formatted, ...prev]);
    setSelectedTeacherId(formatted.id);

    if (onAddTeacherGlobal) {
      const adminFormatted: AdminTeacher = {
        id: formatted.id,
        name: formatted.name,
        phone: '+244 923 000 000',
        subject: formatted.subject,
        gradeClass: formatted.gradeClass,
        room: formatted.room,
        schoolName: formatted.schoolName || 'Escola Modelo Central',
        location: formatted.location || 'Pavilhão 1 - Bloco B',
        turma: formatted.turma,
        category: 'Professor Primário Efetivo',
        presenceRate: 100,
      };
      onAddTeacherGlobal(adminFormatted);
    }
  };

  return (
    <div id="director-teachers-page" className="w-full min-h-screen bg-[#fcfcfd]">
      {/* Hero: "Meus Professores" matching 11.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Meus Professores"
        customSubtitle=""
      />

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Institutional Authority Card */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5067fc] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-900 block text-xs sm:text-sm">
                Autonomia do Diretor: Cadastro Oficial de Professores
              </span>
              <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5">
                Por diretriz de segurança uCore, o cadastro e alocação de turmas dos docentes é realizado diretamente pela Direção Escolar com validação presencial.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="whitespace-nowrap px-4 py-2 bg-[#5067fc] hover:bg-[#4359eb] text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            Cadastrar Novo Docente
          </button>
        </div>

        {/* Filter Bar matching 11.png: Filtro: Professores v, Search, Cadastrar button */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Left: Filtro Dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#5067fc]" />
              <span>
                Filtro: {filterShift === 'all' ? 'Professores' : `Turno ${filterShift}`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {filterDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-30 animate-in fade-in">
                <button
                  onClick={() => {
                    setFilterShift('all');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Todos os Professores
                </button>
                <button
                  onClick={() => {
                    setFilterShift('Manhã');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Turno Manhã
                </button>
                <button
                  onClick={() => {
                    setFilterShift('Tarde');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Turno Tarde
                </button>
              </div>
            )}
          </div>

          {/* Middle: Search input */}
          <div className="flex-1 max-w-lg relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nome, classe, sala ou disciplina..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 outline-none text-xs text-slate-800 placeholder:text-slate-400 transition-all bg-white"
            />
          </div>

          {/* Right: Cadastrar Button (Cyan pill) */}
          <button
            id="btn-cadastrar-professor"
            onClick={() => setIsModalOpen(true)}
            className="bg-[#4f67ff] hover:bg-[#3547cf] text-white font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar</span>
          </button>
        </div>

        {/* Quick Teacher Selector Chips */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
            Selecionar Docente:
          </span>
          {filteredTeachers.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTeacherId(t.id)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentTeacher?.id === t.id
                  ? 'bg-[#5067fc] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* First Row: 7 Cards with Cyan Badge Headers matching 11.png */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
          {/* Card 1: [Nome] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-2 shadow-2xs">
              Nome
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-sm min-h-[110px]">
              <h5 className="font-bold text-sm sm:text-base leading-snug break-words">
                {currentTeacher?.name || 'Prof. Santar Goes'}
              </h5>
              <span className="text-[10px] text-white/80 mt-1">
                {currentTeacher?.shift}
              </span>
            </div>
          </div>

          {/* Card 2: [Nome da Escola] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-2 shadow-2xs">
              Nome da Escola
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-sm min-h-[110px]">
              <h5 className="font-bold text-xs sm:text-sm leading-snug">
                {currentTeacher?.schoolName || 'Escola Modelo Central'}
              </h5>
              <span className="text-[10px] text-white/80 mt-1">Rede Pública</span>
            </div>
          </div>

          {/* Card 3: [Classe] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-2 shadow-2xs">
              Classe
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-sm min-h-[110px]">
              <h5 className="font-black text-base sm:text-lg">
                {currentTeacher?.gradeClass || '4ª Classe'}
              </h5>
              <span className="text-[10px] text-white/80 mt-0.5">Ensino Primário</span>
            </div>
          </div>

          {/* Card 4: [Sala] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-2 shadow-2xs">
              Sala
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-sm min-h-[110px]">
              <h5 className="font-black text-base sm:text-lg">
                {currentTeacher?.room || 'Sala 03'}
              </h5>
              <span className="text-[10px] text-white/80 mt-0.5">Capacidade 46</span>
            </div>
          </div>

          {/* Card 5: [Turma] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-2 shadow-2xs">
              Turma
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-sm min-h-[110px]">
              <h5 className="font-black text-base sm:text-lg">
                {currentTeacher?.turma || 'Turma A'}
              </h5>
              <span className="text-[10px] text-white/80 mt-0.5">Ano Letivo 2026</span>
            </div>
          </div>

          {/* Card 6: [Nome dos Directores] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-2 shadow-2xs">
              Nome dos Directores
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-sm min-h-[110px]">
              <h5 className="font-bold text-xs sm:text-sm leading-tight">
                {currentTeacher?.directorName || 'Fert Horlan'}
              </h5>
              <span className="text-[10px] text-white/80 mt-1">Diretor Geral</span>
            </div>
          </div>

          {/* Card 7: [Localização] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-2 shadow-2xs">
              Localização
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-sm min-h-[110px]">
              <h5 className="font-bold text-xs sm:text-sm leading-tight">
                {currentTeacher?.location || 'Pavilhão 1 - Bloco B'}
              </h5>
              <span className="text-[10px] text-white/80 mt-1">Ala Oeste</span>
            </div>
          </div>
        </div>

        {/* Second Row: [Presença dos Professores] & [Horário das Aulas] matching 11.png */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Card: [Presença dos Professores] */}
          <div className="lg:col-span-4 flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
              Presença dos Professores
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[260px]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-white/80 tracking-wider">Assiduidade Geral</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">23/23 Ativos</span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black">98.5%</span>
                  <span className="text-xs text-white/80 font-bold">no mês atual</span>
                </div>
              </div>

              {/* Attendance breakdown for selected teacher */}
              <div className="mt-6 pt-4 border-t border-white/20 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/90 font-medium">Presença de {currentTeacher?.name.split(' ')[0]}:</span>
                  <span className="font-bold text-emerald-300">{currentTeacher?.presenceRate || 98.8}%</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-300 h-full rounded-full transition-all duration-500"
                    style={{ width: `${currentTeacher?.presenceRate || 98.8}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/80 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>Nenhuma falta injustificada registada neste trimestre</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: [Horário das Aulas] */}
          <div className="lg:col-span-8 flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
              Horário das Aulas
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[260px]">
              <div className="flex items-center justify-between pb-3 border-b border-white/20 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white" />
                  <span className="text-xs uppercase font-bold tracking-wider">
                    Grade Semanal • {currentTeacher?.name} ({currentTeacher?.gradeClass})
                  </span>
                </div>
                <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                  {currentTeacher?.room}
                </span>
              </div>

              {/* Schedule Table/Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentTeacher?.schedule?.map((item, idx) => (
                  <div key={idx} className="bg-white/10 rounded-xl p-3 border border-white/15 backdrop-blur-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 mb-1">
                      <span>{item.day}</span>
                      <span className="text-white/80 text-[10px] font-normal">{item.period}</span>
                    </div>
                    <div className="font-bold text-xs text-white leading-tight">
                      {item.subject}
                    </div>
                    <div className="text-[10px] text-white/70 mt-1">
                      Local: {item.room}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] text-white/80">
                <span>Carga Horária: 24 horas/semana</span>
                <span className="font-semibold text-white">Disciplina Principal: {currentTeacher?.subject}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <DirectorRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entityType="professores"
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};
