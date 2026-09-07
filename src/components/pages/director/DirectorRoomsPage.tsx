import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, Home, Layers, Calendar, Users, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Hero } from '../../Hero';
import { directorRoomsData as initialRooms } from '../../../data/directorData';
import { DirectorRegistrationModal } from './DirectorRegistrationModal';
import type { DirectorRoom } from '../../../types';
import { StatCardItem } from '../../StatCardItem';

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
    <div id="director-rooms-page" className="w-full min-h-screen bg-[#f7f3f3]">
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
              <Filter className="w-3.5 h-3.5 text-[#f75142]" />
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
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#f75142] focus:ring-2 focus:ring-[#f75142]/20 outline-none text-xs text-slate-800 placeholder:text-slate-400 transition-all bg-white"
            />
          </div>

          {/* Right: Cadastrar Button */}
          <button
            id="btn-cadastrar-sala"
            onClick={() => setIsModalOpen(true)}
            className="bg-[#f75142] hover:bg-[#e04436] text-white font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2"
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
                  ? 'bg-[#f75142] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{r.roomNumber}</span>
              <span className="text-[10px] opacity-80 font-normal">({r.type.slice(0, 7)})</span>
            </button>
          ))}
        </div>

        {/* Metric Cards featuring clickable and non-clickable design logic */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8 items-start">
          <StatCardItem
            id="dr-card-salas"
            size="sm"
            card={{
              id: 'salas',
              title: currentRoom?.roomNumber || 'Sala 03',
              value: String(rooms.length),
              isClickable: false,
              subtitle: 'Total de Salas Ativas',
            }}
          />
          <StatCardItem
            id="dr-card-turmas"
            size="sm"
            card={{
              id: 'turmas',
              title: 'Nº Turmas',
              value: String(currentRoom?.turmasCount || 2),
              isClickable: false,
              subtitle: '16 Turmas distribuídas',
            }}
          />
          <StatCardItem
            id="dr-card-capacidade"
            size="sm"
            card={{
              id: 'capacidade',
              title: 'Capacidade',
              value: String(currentRoom?.capacity || 46),
              isClickable: true,
              actionText: 'Ver mais',
              subtitle: 'Lotação máxima sala',
            }}
            onSelect={() => {
              document.getElementById('room-specs-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <StatCardItem
            id="dr-card-periodo"
            size="sm"
            card={{
              id: 'periodo',
              title: 'Periodo',
              value: currentRoom?.period?.split(' ')[0] || 'Manhã',
              isClickable: false,
              subtitle: currentRoom?.period || 'Manhã / Tarde',
            }}
          />
          <StatCardItem
            id="dr-card-professores"
            size="sm"
            card={{
              id: 'professores',
              title: 'Professores',
              value: String(currentRoom?.teachers.length || 1),
              isClickable: false,
              subtitle: currentRoom?.teachers[0] || 'Corpo Docente',
            }}
          />
        </div>

        {/* Detailed Room Specifications Panel */}
        <div id="room-specs-section" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[#f75142]">
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
              <span className="text-xs bg-[#fef2f1] text-[#e04436] border border-[#fee4e2] px-3 py-1 rounded-full font-bold">
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
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#f75142]" />
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
