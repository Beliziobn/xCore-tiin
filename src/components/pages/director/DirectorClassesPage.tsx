import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, BookOpen, Layers, Users, ChevronDown, CheckCircle2, Award } from 'lucide-react';
import { Hero } from '../../Hero';
import { directorClassesData as initialClasses } from '../../../data/directorData';
import { DirectorRegistrationModal } from './DirectorRegistrationModal';
import type { DirectorClass } from '../../../types';

interface DirectorClassesPageProps {
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
}

export const DirectorClassesPage: React.FC<DirectorClassesPageProps> = ({
  onOpenGetStarted,
  isLoggedIn,
}) => {
  const [classesList, setClassesList] = useState<DirectorClass[]>(initialClasses);
  const [selectedClassId, setSelectedClassId] = useState<string>(classesList[3]?.id || 'cls-4'); // default 4ª Classe
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCycle, setFilterCycle] = useState<string>('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return classesList.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.teachers.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesCycle = true;
      if (filterCycle === 'primario') {
        matchesCycle = ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe'].includes(c.name);
      } else if (filterCycle === 'secundario') {
        matchesCycle = ['5ª Classe', '6ª Classe', '7ª Classe', '8ª Classe', '9ª Classe'].includes(c.name);
      }

      return matchesSearch && matchesCycle;
    });
  }, [classesList, searchQuery, filterCycle]);

  const currentClass =
    classesList.find((c) => c.id === selectedClassId) || filteredClasses[0] || classesList[0];

  const handleCreateSuccess = (newClass: any) => {
    const formatted: DirectorClass = {
      id: newClass.id,
      name: newClass.gradeClass,
      period: newClass.period === 'Tarde' ? 'Tarde' : 'Manhã e Tarde',
      room: newClass.room,
      studentCount: newClass.studentCount || 48,
      teachers: ['Prof. Regente Alocado'],
      turmas: ['Turma A', 'Turma B'],
    };
    setClassesList((prev) => [formatted, ...prev]);
    setSelectedClassId(formatted.id);
  };

  return (
    <div id="director-classes-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Hero: "Minhas Classes" matching 20.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Minhas Classes"
        customSubtitle=""
      />

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Filter Bar matching 20.png: Filtro: classes v, Search, Cadastrar button */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Left: Filtro Dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#5067fc]" />
              <span>
                Filtro: {filterCycle === 'all' ? 'classes' : filterCycle === 'primario' ? '1ª à 4ª Classe' : '5ª à 9ª Classe'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {filterDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-30 animate-in fade-in">
                <button
                  onClick={() => {
                    setFilterCycle('all');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Todas as Classes (1ª à 9ª)
                </button>
                <button
                  onClick={() => {
                    setFilterCycle('primario');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Ensino Primário (1ª à 4ª)
                </button>
                <button
                  onClick={() => {
                    setFilterCycle('secundario');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Ensino Secundário (5ª à 9ª)
                </button>
              </div>
            )}
          </div>

          {/* Middle: Search input */}
          <div className="flex-1 max-w-lg relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar classe por nome, sala ou professor regente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 outline-none text-xs text-slate-800 placeholder:text-slate-400 transition-all bg-white"
            />
          </div>

          {/* Right: Cadastrar Button */}
          <button
            id="btn-cadastrar-classe"
            onClick={() => setIsModalOpen(true)}
            className="bg-[#4f67ff] hover:bg-[#3547cf] text-white font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar</span>
          </button>
        </div>

        {/* Classes Selector Chips */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
            Níveis de Ensino:
          </span>
          {filteredClasses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClassId(c.id)}
              className={`text-xs px-4 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentClass?.id === c.id
                  ? 'bg-[#5067fc] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* 5 Cards with Cyan Badges matching 20.png */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          {/* Card 1: [Nome] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
              Nome
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-5 flex-1 flex flex-col justify-between shadow-sm min-h-[170px]">
              <div>
                <span className="text-xs uppercase font-bold text-white/80 tracking-wider">Matriz Curricular</span>
                <h4 className="text-2xl sm:text-3xl font-black mt-2">{currentClass?.name || '4ª Classe'}</h4>
              </div>
              <div className="pt-3 border-t border-white/20 text-xs text-white/90">
                <span>Plano Pedagógico Vigente</span>
              </div>
            </div>
          </div>

          {/* Card 2: [Periodo] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
              Periodo
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-5 flex-1 flex flex-col justify-between shadow-sm min-h-[170px]">
              <div>
                <span className="text-xs uppercase font-bold text-white/80 tracking-wider">Turno Oferecido</span>
                <h4 className="text-xl sm:text-2xl font-black mt-2 leading-tight">
                  {currentClass?.period || 'Manhã e Tarde'}
                </h4>
              </div>
              <div className="pt-3 border-t border-white/20 text-[11px] text-white/90">
                <span>2 Turmas simultâneas ativas</span>
              </div>
            </div>
          </div>

          {/* Card 3: [Sala] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
              Sala
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-5 flex-1 flex flex-col justify-between shadow-sm min-h-[170px]">
              <div>
                <span className="text-xs uppercase font-bold text-white/80 tracking-wider">Sala de Aula</span>
                <h4 className="text-2xl sm:text-3xl font-black mt-2">{currentClass?.room || 'Sala 03'}</h4>
              </div>
              <div className="pt-3 border-t border-white/20 text-xs text-white/90">
                <span>Pavilhão 1 - Bloco B</span>
              </div>
            </div>
          </div>

          {/* Card 4: [Nº Alunos] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
              Nº Alunos
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-5 flex-1 flex flex-col justify-between shadow-sm min-h-[170px]">
              <div>
                <span className="text-xs uppercase font-bold text-white/80 tracking-wider">Total de Alunos</span>
                <h4 className="text-3xl sm:text-4xl font-black mt-2">
                  {currentClass?.studentCount || 54}
                </h4>
              </div>
              <div className="pt-3 border-t border-white/20 text-xs text-white/90">
                <span>Taxa de ocupação: 96%</span>
              </div>
            </div>
          </div>

          {/* Card 5: [Nome dos Professores] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
              Nome dos Professores
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-5 flex-1 flex flex-col justify-between shadow-sm min-h-[170px]">
              <div>
                <span className="text-xs uppercase font-bold text-white/80 tracking-wider">Corpo Docente</span>
                <h4 className="text-sm sm:text-base font-bold mt-2 leading-snug">
                  {currentClass?.teachers.join(', ') || 'Prof. Santar Goes, Prof. Paulo André'}
                </h4>
              </div>
              <div className="pt-3 border-t border-white/20 text-[11px] text-white/90">
                <span>Acompanhamento Pedagógico Ativo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Class Syllabus & Assessment Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[#5067fc]">
                Gestão da Classe • uCore
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                {currentClass?.name} • Organização Pedagógica
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full font-bold">
                1ª à 9ª Classe Unificadas
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5 text-xs text-slate-600">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Turmas Atendidas</span>
              <p className="font-semibold text-slate-800">
                {currentClass?.turmas?.join(' e ') || 'Turma A e Turma B'} (Manhã e Tarde).
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Docência & Coordenação</span>
              <p className="font-semibold text-slate-800">
                Supervisionado diretamente pelo Diretor Geral Fert Horlan com coordenação pedagógica quinzenal.
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Metodologia e Avaliação</span>
              <p className="font-semibold text-slate-800">
                Avaliação contínua por projetos, frequência controlada diariamente e relatório trimestral aos encarregados.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <DirectorRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entityType="classes"
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};
