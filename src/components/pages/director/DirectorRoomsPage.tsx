import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, Home, Layers, Calendar, Users, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Hero } from '../../Hero';
import { directorRoomsData as initialRooms } from '../../../data/directorData';
import { DirectorRegistrationModal } from './DirectorRegistrationModal';
import type { DirectorRoom } from '../../../types';

interface DirectorRoomsPageProps {
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
}

export const DirectorRoomsPage: React.FC<DirectorRoomsPageProps> = ({
  onOpenGetStarted,
  isLoggedIn,
}) => {
  const [rooms, setRooms] = useState<DirectorRoom[]>(initialRooms);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[2]?.id || 'room-3'); // default Sala 03
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchesSearch =
        r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.classes.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.teachers.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = typeFilter === 'all' || r.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [rooms, searchQuery, typeFilter]);

  const currentRoom =
    rooms.find((r) => r.id === selectedRoomId) || filteredRooms[0] || rooms[0];

  const handleCreateSuccess = (newRoom: any) => {
    const formatted: DirectorRoom = {
      id: newRoom.id,
      roomNumber: newRoom.name.startsWith('Sala') ? newRoom.name : `Sala ${newRoom.name}`,
      name: `Sala de Aula ${newRoom.gradeClass}`,
      turmasCount: 2,
      turmas: [`${newRoom.gradeClass} ${newRoom.turma}`],
      period: newRoom.period === 'Tarde' ? 'Tarde' : 'Manhã / Tarde',
      classes: [newRoom.gradeClass],
      teachers: ['Prof. Regente Alocado'],
      capacity: newRoom.studentCount || 45,
      currentStudents: 42,
      status: 'Ativa',
      type: newRoom.type || 'Regular',
    };
    setRooms((prev) => [formatted, ...prev]);
    setSelectedRoomId(formatted.id);
  };

  return (
    <div id="director-rooms-page" className="w-full min-h-screen bg-[#fcfcfd]">
      {/* Hero: "Minhas Salas" matching 15.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Minhas Salas"
        customSubtitle=""
      />

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Filter Bar matching 15.png: Filtro: Salas v, Search, Cadastrar button */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Left: Filtro Dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#5067fc]" />
              <span>
                Filtro: {typeFilter === 'all' ? 'Salas' : typeFilter}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {filterDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-30 animate-in fade-in">
                <button
                  onClick={() => {
                    setTypeFilter('all');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Todas as Salas (11)
                </button>
                <button
                  onClick={() => {
                    setTypeFilter('Regular');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Salas Regulares de Aula
                </button>
                <button
                  onClick={() => {
                    setTypeFilter('Laboratório');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Laboratórios
                </button>
                <button
                  onClick={() => {
                    setTypeFilter('Recursos Multifuncionais (AEE)');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Recursos Multifuncionais (AEE)
                </button>
                <button
                  onClick={() => {
                    setTypeFilter('Biblioteca');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Biblioteca & Informática
                </button>
              </div>
            )}
          </div>

          {/* Middle: Search input */}
          <div className="flex-1 max-w-lg relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por número da sala, classe, turno ou professor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 outline-none text-xs text-slate-800 placeholder:text-slate-400 transition-all bg-white"
            />
          </div>

          {/* Right: Cadastrar Button */}
          <button
            id="btn-cadastrar-sala"
            onClick={() => setIsModalOpen(true)}
            className="bg-[#4f67ff] hover:bg-[#3547cf] text-white font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar</span>
          </button>
        </div>

        {/* Room selector chips */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
            Salas Cadastradas:
          </span>
          {filteredRooms.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoomId(r.id)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                currentRoom?.id === r.id
                  ? 'bg-[#5067fc] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{r.roomNumber}</span>
              <span className="text-[10px] opacity-80 font-normal">({r.type.slice(0, 7)})</span>
            </button>
          ))}
        </div>

        {/* Main 5 Cards Grid with Cyan Badges matching 15.png */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          {/* Card 1: [Nº Salas] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
              Nº Salas
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-5 flex-1 flex flex-col justify-between shadow-sm min-h-[170px]">
              <div>
                <span className="text-xs uppercase font-bold text-white/80 tracking-wider">Espaço Físico</span>
                <h4 className="text-3xl sm:text-4xl font-black mt-2">{currentRoom?.roomNumber || 'Sala 03'}</h4>
              </div>
              <div className="pt-3 border-t border-white/20 text-xs text-white/90">
                <span>Total de {rooms.length} Salas Ativas na Escola</span>
              </div>
            </div>
          </div>

          {/* Card 2: [Nº Turmas] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
              Nº Turmas
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-5 flex-1 flex flex-col justify-between shadow-sm min-h-[170px]">
              <div>
                <span className="text-xs uppercase font-bold text-white/80 tracking-wider">Turmas na Sala</span>
                <h4 className="text-3xl sm:text-4xl font-black mt-2">
                  {currentRoom?.turmasCount || 2} Turmas
                </h4>
              </div>
              <div className="pt-3 border-t border-white/20 text-xs text-white/90">
                <span>16 Turmas distribuídas no total</span>
              </div>
            </div>
          </div>

          {/* Card 3: [Periodo] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
              Periodo
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-5 flex-1 flex flex-col justify-between shadow-sm min-h-[170px]">
              <div>
                <span className="text-xs uppercase font-bold text-white/80 tracking-wider">Funcionamento</span>
                <h4 className="text-xl sm:text-2xl font-black mt-2 leading-tight">
                  {currentRoom?.period || 'Manhã / Tarde'}
                </h4>
              </div>
              <div className="pt-3 border-t border-white/20 text-[11px] text-white/90">
                <span>07h30 às 12h00 e 12h30 às 17h30</span>
              </div>
            </div>
          </div>

          {/* Card 4: [Classes] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#4f67ff] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
              Classes
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-5 flex-1 flex flex-col justify-between shadow-sm min-h-[170px]">
              <div>
                <span className="text-xs uppercase font-bold text-white/80 tracking-wider">Níveis Atendidos</span>
                <h4 className="text-xl sm:text-2xl font-black mt-2">
                  {currentRoom?.classes.join(', ') || '4ª Classe'}
                </h4>
              </div>
              <div className="pt-3 border-t border-white/20 text-xs text-white/90">
                <span>Capacidade: {currentRoom?.capacity || 46} alunos</span>
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
                <span className="text-xs uppercase font-bold text-white/80 tracking-wider">Corpo Docente Alocado</span>
                <h4 className="text-sm sm:text-base font-bold mt-2 leading-snug">
                  {currentRoom?.teachers.join(', ') || 'Prof. Santar Goes'}
                </h4>
              </div>
              <div className="pt-3 border-t border-white/20 text-[11px] text-white/90">
                <span>Supervisão do Diretor Fert Horlan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Room Specifications Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[#5067fc]">
                Ficha Técnica da Sala
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                {currentRoom?.roomNumber} • {currentRoom?.name}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                {currentRoom?.status || 'Ativa'}
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-bold">
                {currentRoom?.type}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5 text-xs text-slate-600">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Turmas Atendidas</span>
              <ul className="space-y-1 font-semibold text-slate-800">
                {currentRoom?.turmas.map((t, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#5067fc]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Ocupação & Carteiras</span>
              <p className="font-semibold text-slate-800">
                {currentRoom?.currentStudents} alunos frequentes de {currentRoom?.capacity} lugares disponíveis (
                {Math.round(((currentRoom?.currentStudents || 42) / (currentRoom?.capacity || 46)) * 100)}% de ocupação).
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Equipamentos & Recursos</span>
              <p className="font-semibold text-slate-800">
                Quadro branco magnético, iluminação natural LED, ventilação cruzada, armários pedagógicos e ponto de rede uCore.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <DirectorRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entityType="salas"
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};
