import React, { useState } from 'react';
import { Search, Plus, School as SchoolIcon, Filter, Check, ChevronRight } from 'lucide-react';
import { Hero } from '../../Hero';
import type { AdminSchool } from '../../../types';

interface AdminSchoolsPageProps {
  onOpenGetStarted: () => void;
  schools: AdminSchool[];
  onOpenRegisterModal: () => void;
  isLoggedIn?: boolean;
}

export const AdminSchoolsPage: React.FC<AdminSchoolsPageProps> = ({
  onOpenGetStarted,
  schools,
  onOpenRegisterModal,
  isLoggedIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || '');

  // Filtered schools list
  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.directorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'low-performance') return school.performanceRate < 70;
    if (categoryFilter === 'high-performance') return school.performanceRate >= 85;
    return school.category === categoryFilter;
  });

  // Selected school to display in the 10-card layout matching 10.png
  const activeSchool = schools.find((s) => s.id === selectedSchoolId) || filteredSchools[0] || schools[0];

  return (
    <div id="admin-schools-page" className="w-full min-h-screen bg-[#fcfcfd]">
      {/* Hero Header: "Minhas escolas" matching 10.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Minhas escolas"
        customSubtitle=""
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Filter and Action Bar matching 10.png */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Left: Filter dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Filtro:</span>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-slate-100 hover:bg-slate-200/70 text-slate-800 text-xs font-semibold py-2 pl-3 pr-8 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5067fc] cursor-pointer"
              >
                <option value="all">Todas as Escolas ({schools.length})</option>
                <option value="Ensino Primário">Ensino Primário</option>
                <option value="Iº Ciclo">Iº Ciclo</option>
                <option value="IIº Ciclo">IIº Ciclo</option>
                <option value="Polivalente">Complexos Polivalentes</option>
                <option value="high-performance">Alto Desempenho (≥ 85%)</option>
                <option value="low-performance">Menor Desempenho (&lt; 70%)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                ▼
              </div>
            </div>
          </div>

          {/* Center: Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar escola, diretor ou localização..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5067fc]"
            />
          </div>

          {/* Right: Cyan "Cadastrar" Button matching 10.png */}
          <button
            id="admin-btn-cadastrar-escola"
            onClick={onOpenRegisterModal}
            className="flex items-center justify-center gap-2 bg-[#27c1dc] hover:bg-[#20b2cc] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Cadastrar
          </button>
        </div>

        {/* School Selector Pills */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Selecione a Escola para Visualizar Detalhes ({filteredSchools.length} de {schools.length}):
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {filteredSchools.map((school) => {
              const isSelected = school.id === activeSchool?.id;
              return (
                <button
                  key={school.id}
                  onClick={() => setSelectedSchoolId(school.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-[#5067fc] text-white border-[#5067fc] shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <SchoolIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#5067fc]'}`} />
                  <span>{school.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {activeSchool && (
          <div className="space-y-6">
            {/* Top Row: 7 Blue Cards with Cyan Badges matching 10.png */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {/* Card 1: [Nome] */}
              <div className="bg-[#5067fc] text-white rounded-xl p-3 flex flex-col items-center justify-between min-h-[140px] text-center shadow-xs">
                <span className="bg-[#27c1dc] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-2xs">
                  Nome
                </span>
                <span className="text-xs sm:text-sm font-bold my-auto leading-snug px-1">
                  {activeSchool.name}
                </span>
                <span className="text-[9px] text-blue-200 font-medium">{activeSchool.category}</span>
              </div>

              {/* Card 2: [Nº professores] */}
              <div className="bg-[#5067fc] text-white rounded-xl p-3 flex flex-col items-center justify-between min-h-[140px] text-center shadow-xs">
                <span className="bg-[#27c1dc] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-2xs">
                  Nº professores
                </span>
                <span className="text-2xl sm:text-3xl font-black my-auto">
                  {activeSchool.teachersCount}
                </span>
                <span className="text-[9px] text-blue-200 font-medium">Docentes Ativos</span>
              </div>

              {/* Card 3: [Nº Classes] */}
              <div className="bg-[#5067fc] text-white rounded-xl p-3 flex flex-col items-center justify-between min-h-[140px] text-center shadow-xs">
                <span className="bg-[#27c1dc] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-2xs">
                  Nº Classes
                </span>
                <span className="text-2xl sm:text-3xl font-black my-auto">
                  {activeSchool.classesCount}
                </span>
                <span className="text-[9px] text-blue-200 font-medium">Níveis Oferecidos</span>
              </div>

              {/* Card 4: [Nº Salas] */}
              <div className="bg-[#5067fc] text-white rounded-xl p-3 flex flex-col items-center justify-between min-h-[140px] text-center shadow-xs">
                <span className="bg-[#27c1dc] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-2xs">
                  Nº Salas
                </span>
                <span className="text-2xl sm:text-3xl font-black my-auto">
                  {activeSchool.roomsCount}
                </span>
                <span className="text-[9px] text-blue-200 font-medium">Salas Físicas</span>
              </div>

              {/* Card 5: [Nº Turmas] */}
              <div className="bg-[#5067fc] text-white rounded-xl p-3 flex flex-col items-center justify-between min-h-[140px] text-center shadow-xs">
                <span className="bg-[#27c1dc] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-2xs">
                  Nº Turmas
                </span>
                <span className="text-2xl sm:text-3xl font-black my-auto">
                  {activeSchool.turmasCount}
                </span>
                <span className="text-[9px] text-blue-200 font-medium">Turmas Ativas</span>
              </div>

              {/* Card 6: [Nome dos Directores] */}
              <div className="bg-[#5067fc] text-white rounded-xl p-3 flex flex-col items-center justify-between min-h-[140px] text-center shadow-xs">
                <span className="bg-[#27c1dc] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-2xs">
                  Nome dos Directores
                </span>
                <span className="text-xs sm:text-sm font-bold my-auto leading-snug px-1">
                  {activeSchool.directorName}
                </span>
                <span className="text-[9px] text-blue-200 font-medium">{activeSchool.phone}</span>
              </div>

              {/* Card 7: [Localização] */}
              <div className="bg-[#5067fc] text-white rounded-xl p-3 flex flex-col items-center justify-between min-h-[140px] text-center shadow-xs col-span-2 sm:col-span-4 lg:col-span-1">
                <span className="bg-[#27c1dc] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-2xs">
                  Localização
                </span>
                <span className="text-[11px] sm:text-xs font-semibold my-auto leading-tight px-1 text-white/95">
                  {activeSchool.location}
                </span>
                <span className="text-[9px] text-blue-200 font-medium">Luanda, Angola</span>
              </div>
            </div>

            {/* Bottom Row: 3 Large Blue Cards with Cyan Badges matching 10.png */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Bottom Card 1: [Nº alunos com Documentos] */}
              <div className="bg-[#5067fc] text-white rounded-2xl p-6 flex flex-col items-center justify-between min-h-[160px] text-center shadow-md">
                <span className="bg-[#27c1dc] text-white text-[11px] font-black uppercase px-3.5 py-1 rounded-md shadow-2xs">
                  Nº alunos com Documentos
                </span>
                <div className="my-auto py-2">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight">
                    {activeSchool.studentsWithDocs}
                  </span>
                  <p className="text-xs text-blue-100 mt-1 font-medium">
                    {Math.round((activeSchool.studentsWithDocs / (activeSchool.studentsWithDocs + activeSchool.studentsWithoutDocs)) * 100)}% da população escolar regularizada
                  </p>
                </div>
                <span className="text-[10px] text-blue-200 uppercase font-semibold tracking-wider">
                  BI, Cédulas e Registros Homologados
                </span>
              </div>

              {/* Bottom Card 2: [Nº alunos sem Documentos] */}
              <div className="bg-[#5067fc] text-white rounded-2xl p-6 flex flex-col items-center justify-between min-h-[160px] text-center shadow-md">
                <span className="bg-[#27c1dc] text-white text-[11px] font-black uppercase px-3.5 py-1 rounded-md shadow-2xs">
                  Nº alunos sem Documentos
                </span>
                <div className="my-auto py-2">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight">
                    {activeSchool.studentsWithoutDocs}
                  </span>
                  <p className="text-xs text-blue-100 mt-1 font-medium">
                    {Math.round((activeSchool.studentsWithoutDocs / (activeSchool.studentsWithDocs + activeSchool.studentsWithoutDocs)) * 100)}% pendentes de certidão
                  </p>
                </div>
                <span className="text-[10px] text-rose-200 uppercase font-semibold tracking-wider">
                  Acompanhamento de Registro Civil
                </span>
              </div>

              {/* Bottom Card 3: [Desempenho das Escolas] */}
              <div className="bg-[#5067fc] text-white rounded-2xl p-6 flex flex-col items-center justify-between min-h-[160px] text-center shadow-md">
                <span className="bg-[#27c1dc] text-white text-[11px] font-black uppercase px-3.5 py-1 rounded-md shadow-2xs">
                  Desempenho das Escolas
                </span>
                <div className="my-auto py-2">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight">
                    {activeSchool.performanceRate}%
                  </span>
                  <p className="text-xs text-blue-100 mt-1 font-medium">
                    Presença média dos alunos: {activeSchool.attendanceRate}%
                  </p>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${
                  activeSchool.performanceRate >= 80 ? 'text-emerald-300' : 'text-amber-300'
                }`}>
                  {activeSchool.performanceRate >= 80 ? 'Classificação: Elevado Desempenho' : 'Classificação: Apoio Prioritário'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Complete Network Schools Table */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">
              Listagem Geral das Escolas Integradas à Central uCore ({filteredSchools.length})
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Clique em qualquer linha para inspecionar os cartões da unidade
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Escola</th>
                  <th className="p-3.5">Diretor(a)</th>
                  <th className="p-3.5 text-center">Professores</th>
                  <th className="p-3.5 text-center">Salas</th>
                  <th className="p-3.5 text-center">Turmas</th>
                  <th className="p-3.5 text-center">Total Alunos</th>
                  <th className="p-3.5 text-center">Com Doc</th>
                  <th className="p-3.5 text-center">Sem Doc</th>
                  <th className="p-3.5 text-center">Desempenho</th>
                  <th className="p-3.5">Localização</th>
                  <th className="p-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchools.map((s) => {
                  const isSelected = s.id === activeSchool?.id;
                  const totalStudents = s.studentsWithDocs + s.studentsWithoutDocs;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSchoolId(s.id)}
                      className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/80 font-medium' : ''
                      }`}
                    >
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <SchoolIcon className={`w-4 h-4 ${isSelected ? 'text-[#5067fc]' : 'text-slate-400'}`} />
                        {s.name}
                      </td>
                      <td className="p-3.5 text-slate-700">{s.directorName}</td>
                      <td className="p-3.5 text-center font-bold text-slate-800">{s.teachersCount}</td>
                      <td className="p-3.5 text-center text-slate-700">{s.roomsCount}</td>
                      <td className="p-3.5 text-center text-slate-700">{s.turmasCount}</td>
                      <td className="p-3.5 text-center font-bold text-slate-900">{totalStudents}</td>
                      <td className="p-3.5 text-center text-emerald-600 font-bold">{s.studentsWithDocs}</td>
                      <td className="p-3.5 text-center text-rose-600 font-bold">{s.studentsWithoutDocs}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.performanceRate >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.performanceRate}%
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 max-w-xs truncate">{s.location}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSchoolId(s.id);
                          }}
                          className="text-[#5067fc] font-bold hover:underline inline-flex items-center gap-1"
                        >
                          Ver <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
