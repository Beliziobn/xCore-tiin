import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, CheckCircle, CheckCircle2, Clock, Calendar, ChevronDown, ShieldCheck, UserCheck, Lock } from 'lucide-react';
import { Hero } from '../../Hero';
import { directorTeachersData as initialTeachers } from '../../../data/directorData';
import { DirectorRegistrationModal } from './DirectorRegistrationModal';
import type { DirectorTeacher, AdminTeacher } from '../../../types';
import { StatCardItem } from '../../StatCardItem';

interface DirectorTeachersPageProps {
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
  onAddTeacherGlobal?: (teacher: AdminTeacher) => void;
  onNavigateToAttendance?: () => void;
}

export const DirectorTeachersPage: React.FC<DirectorTeachersPageProps> = ({
  onOpenGetStarted,
  isLoggedIn,
  onAddTeacherGlobal,
  onNavigateToAttendance,
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
    <div id="director-teachers-page" className="w-full min-h-screen bg-[#f7f3f3]">
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
        <div className="mb-6 p-4 bg-gradient-to-r from-[#fef2f1] to-[#fef2f1] border border-[#fee4e2] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#f75142] text-white flex items-center justify-center shrink-0 shadow-xs">
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
            className="whitespace-nowrap px-4 py-2 bg-[#f75142] hover:bg-[#e04436] text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
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
              <Filter className="w-3.5 h-3.5 text-[#f75142]" />
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
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#f75142] focus:ring-2 focus:ring-[#f75142]/20 outline-none text-xs text-slate-800 placeholder:text-slate-400 transition-all bg-white"
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {onNavigateToAttendance && (
              <button
                id="btn-livro-ponto"
                onClick={onNavigateToAttendance}
                className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-2xs hover:shadow active:scale-95 flex items-center justify-center gap-2"
                title="Abrir livro de ponto dos professores"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Livro de Ponto</span>
              </button>
            )}
            <button
              id="btn-cadastrar-professor"
              onClick={() => setIsModalOpen(true)}
              className="bg-[#f75142] hover:bg-[#e04436] text-white font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar</span>
            </button>
          </div>
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
                  ? 'bg-[#f75142] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Informações do Docente - Sem cards pesados, mantendo organização e máxima legibilidade */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 mb-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#fef2f1] text-[#f75142] border border-[#fee4e2] flex items-center justify-center font-bold">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Dados do Docente Selecionado
                </h3>
                <p className="text-[11px] text-slate-400">
                  Informações cadastrais e alocação pedagógica
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Docente Regular
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-y-4 gap-x-6">
            {/* 1. Nome */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Nome
              </span>
              <span className="text-sm font-bold text-slate-900 break-words">
                {currentTeacher?.name || 'Prof. Santar Goes'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                {currentTeacher?.shift}
              </span>
            </div>

            {/* 2. Nome da Escola */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Nome da Escola
              </span>
              <span className="text-sm font-bold text-slate-900 leading-snug">
                {currentTeacher?.schoolName || 'Escola Modelo Central'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Rede Pública
              </span>
            </div>

            {/* 3. Classe */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Classe
              </span>
              <span className="text-sm font-black text-slate-900">
                {currentTeacher?.gradeClass || '4ª Classe'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Ensino Primário
              </span>
            </div>

            {/* 4. Sala */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Sala
              </span>
              <span className="text-sm font-black text-slate-900">
                {currentTeacher?.room || 'Sala 03'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Capacidade 46
              </span>
            </div>

            {/* 5. Turma */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Turma
              </span>
              <span className="text-sm font-black text-slate-900">
                {currentTeacher?.turma || 'Turma A'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Ano Letivo 2026
              </span>
            </div>

            {/* 6. Nome dos Directores */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Nome dos Directores
              </span>
              <span className="text-sm font-bold text-slate-900 leading-tight">
                {currentTeacher?.directorName || 'Fert Horlan'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Diretor Geral
              </span>
            </div>

            {/* 7. Localização */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Localização
              </span>
              <span className="text-sm font-bold text-slate-900 leading-tight">
                {currentTeacher?.location || 'Pavilhão 1 - Bloco B'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Ala Oeste
              </span>
            </div>
          </div>
        </div>

        {/* Second Row: [Presença dos Professores] & [Horário das Aulas] */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Informações de Presença dos Professores - Layout Limpo e Sem Cards Pesados */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between min-h-[350px]">
            <div>
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-[#fef2f1] text-[#f75142] border border-[#fee4e2] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Presença Docente
                  </h4>
                  <p className="text-xs text-slate-500">
                    Acompanhamento de assiduidade
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                    Taxa Mensal de Presença
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
                      98.5%
                    </span>
                    <span className="text-xs text-emerald-600 font-bold">Excelente</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Assiduidade do Mês • {currentTeacher?.name.split(' ')[0]}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Aulas Previstas:</span>
                    <span className="font-bold text-slate-800">40 aulas</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Aulas Ministradas:</span>
                    <span className="font-bold text-emerald-700">39 aulas</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Faltas Justificadas:</span>
                    <span className="font-bold text-slate-700">1 aula</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 w-full justify-center">
                Cumprimento do Calendário Escolar
              </span>
            </div>
          </div>

          {/* Horário das Aulas - Sem card pesado, mantendo a organização para leitura clara */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between min-h-[350px]">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#fef2f1] text-[#f75142] border border-[#fee4e2] flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Horário das Aulas
                    </h4>
                    <p className="text-xs text-slate-500">
                      Grade Semanal • {currentTeacher?.name} ({currentTeacher?.gradeClass})
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#f75142] bg-[#fef2f1] border border-[#fee4e2] px-3 py-1 rounded-full">
                  {currentTeacher?.room}
                </span>
              </div>

              {/* Schedule Table/Grid - Limpo e com alta legibilidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentTeacher?.schedule?.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 hover:bg-[#fef2f1]/40 rounded-xl p-3.5 border border-slate-200/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-[#f75142] mb-1.5">
                      <span className="font-black uppercase tracking-wider">{item.day}</span>
                      <span className="text-slate-500 text-[11px] font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
                        {item.period}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 leading-snug">
                      {item.subject}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                      <span className="text-slate-400">Local:</span>
                      <span className="font-semibold text-slate-700">{item.room}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <span className="font-medium">
                Carga Horária: <strong className="text-slate-800">24 horas/semana</strong>
              </span>
              <span className="font-semibold text-slate-800">
                Disciplina Principal: <strong className="text-[#f75142]">{currentTeacher?.subject}</strong>
              </span>
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
